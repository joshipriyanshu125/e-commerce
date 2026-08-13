import { OpenAI } from "openai";
import logger from "../utils/logger.js";
import { buildAnalyticsSnapshot } from "./adminAnalyticsController.js";

/*
==============================================================================
  POST /api/ai/analytics-chat
  Body : { question: string, conversationHistory?: [{role, content}] }
  Auth : admin only

  Fetches a real-time analytics snapshot from the database, injects it into
  a structured system prompt, then sends the admin's question to the LLM.
  The model is explicitly instructed to reference ONLY the provided data.
==============================================================================
*/

// ── Preset question topics the frontend can surface as quick-picks ──────────
export const PRESET_QUESTIONS = [
    "Give me a revenue summary for this month versus last month.",
    "Which products should I restock urgently?",
    "How has the return rate changed compared to last month?",
    "Which are my top-performing product categories right now?",
    "What is my sales velocity and which products are selling fastest?",
    "Summarize customer acquisition: new vs repeat buyers.",
];

export const analyzeStoreData = async (req, res) => {
    try {
        const { question, conversationHistory = [] } = req.body;

        if (!question || typeof question !== "string" || !question.trim()) {
            return res.status(400).json({
                success: false,
                message: "question is required.",
            });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;

        // ── No API key → graceful fallback ─────────────────────────────────
        if (!apiKey) {
            logger.info("OPENROUTER_API_KEY not configured — AI analytics unavailable.");
            return res.status(200).json({
                success: true,
                answer: "⚠️ The AI assistant is not configured yet. Please add your **OPENROUTER_API_KEY** to the backend `.env` file and restart the server. You can get a free key at [openrouter.ai](https://openrouter.ai).",
                generatedBy: "fallback",
            });
        }

        // ── Fetch real analytics data from DB ───────────────────────────────
        let snapshot;
        try {
            snapshot = await buildAnalyticsSnapshot();
        } catch (dbErr) {
            logger.error({ message: "Analytics snapshot failed", error: dbErr.message });
            return res.status(500).json({
                success: false,
                message: "Failed to load store analytics. Please try again.",
            });
        }

        // Strip the internal _dashboard key — the AI doesn't need the raw chart format
        const { _dashboard, ...aiData } = snapshot;

        // ── Build system prompt ─────────────────────────────────────────────
        const systemPrompt = `You are an expert e-commerce analytics assistant for a fashion/clothing store admin dashboard.
Your job is to answer the admin's questions clearly and accurately.

CRITICAL RULES:
1. Use ONLY the store data provided below. Never invent, assume, or fabricate numbers.
2. If data for a specific question is not available in the snapshot, say so clearly.
3. Be concise but insightful. Highlight trends, anomalies, and actionable recommendations.
4. Format responses with **bold** for key metrics, bullet points for lists, and plain language.
5. When mentioning money, use the $ symbol. When mentioning percentages, round to 1 decimal place.
6. If revenueChangePercent is null, it means there is no previous month data to compare against.

CURRENT STORE ANALYTICS SNAPSHOT (generated at ${aiData.generatedAt}):
\`\`\`json
${JSON.stringify(aiData, null, 2)}
\`\`\`

Answer the admin's question based strictly on this data.`;

        // ── Prepare message history ─────────────────────────────────────────
        const messages = [
            { role: "system", content: systemPrompt },
            // Include up to the last 6 turns of conversation for context
            ...conversationHistory.slice(-6).map(m => ({
                role: m.role,
                content: m.content,
            })),
            { role: "user", content: question.trim() },
        ];

        // ── Call LLM via OpenRouter ─────────────────────────────────────────
        const openai = new OpenAI({
            apiKey,
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: {
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Atelier Admin Analytics AI",
            },
        });

        const model = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";

        const response = await openai.chat.completions.create({
            model,
            messages,
            temperature: 0.3, // Lower temperature for factual analytics responses
            max_tokens: 800,
        });

        const answer = response.choices[0]?.message?.content?.trim();

        if (!answer) {
            return res.status(500).json({
                success: false,
                message: "The AI returned an empty response. Please try again.",
            });
        }

        logger.info(`AI analytics query answered [model: ${model}]: "${question.slice(0, 60)}..."`);

        return res.status(200).json({
            success: true,
            answer,
            generatedBy: "ai",
            model,
        });
    } catch (error) {
        logger.error({
            message: "AI analytics chat failed",
            error: error.message,
        });
        return res.status(500).json({
            success: false,
            message: "AI assistant encountered an error. Please try again.",
        });
    }
};
