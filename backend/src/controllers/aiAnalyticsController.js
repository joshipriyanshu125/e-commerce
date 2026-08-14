import { getAIClient } from "../utils/aiClient.js";
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

        const ai = getAIClient();

        // ── No API key → graceful fallback ─────────────────────────────────
        if (!ai) {
            logger.info("No AI API Key configured — AI analytics unavailable.");
            return res.status(200).json({
                success: true,
                answer: "⚠️ The AI assistant is not configured yet. Please add your **OPENROUTER_API_KEY**, **GEMINI_API_KEY**, or **OPENAI_API_KEY** to the backend `.env` file and restart the server.",
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
        const response = await ai.client.chat.completions.create({
            model: ai.model,
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

        logger.info(`AI analytics query answered [model: ${ai.model}]: "${question.slice(0, 60)}..."`);

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

/*
==============================================================================
  POST /api/ai/daily-insights
  Auth : admin only

  Generates an AI Executive Briefing ("What should I know today?") summarizing
  top selling products, fastest growing category, inventory risk, highest
  revenue item, and high return items with actionable recommendations.
==============================================================================
*/
export const generateDailyInsights = async (req, res) => {
    try {
        const snapshot = await buildAnalyticsSnapshot();
        const { _dashboard, ...aiSnapshot } = snapshot;
        const insights = snapshot.businessInsights;

        const ai = getAIClient();

        const generateRuleBasedBrief = () => {
            const lines = [];
            lines.push(`🔥 **Top Sales Performer**: **${insights.topProduct.name}** led unit volume with **${insights.topProduct.unitsSold} units** sold ($${insights.topProduct.revenue.toLocaleString()}).`);
            lines.push(`📈 **Category Acceleration**: **${insights.fastestGrowingCategory.name}** is your fastest-growing category with **${insights.fastestGrowingCategory.growth}** MoM growth.`);
            if (insights.inventoryRisk.name) {
                lines.push(`⚠️ **Inventory Alert**: **${insights.inventoryRisk.name}** is at **${insights.inventoryRisk.status}** (${insights.inventoryRisk.stock} units left). Immediate restock recommended.`);
            }
            lines.push(`💰 **Revenue Leader**: **${insights.highestRevenueProduct.name}** generated **$${insights.highestRevenueProduct.revenue.toLocaleString()}** in revenue.`);
            if (insights.highReturnProduct.name) {
                lines.push(`🔄 **Return Monitoring**: **${insights.highReturnProduct.name}** recorded **${insights.highReturnProduct.returnedUnits} return requests**. Inspect sizing and product details.`);
            }
            return lines.join("\n\n");
        };

        if (!ai) {
            return res.status(200).json({
                success: true,
                briefing: generateRuleBasedBrief(),
                insights,
                generatedBy: "system",
            });
        }

        const systemPrompt = `You are a strategic AI E-commerce Executive Advisor analyzing real-time store metrics.
Synthesize a punchy "What should I know today?" Executive Briefing for the admin dashboard.

STORE INSIGHTS DATA:
- Top Product: ${JSON.stringify(insights.topProduct)}
- Fastest Growing Category: ${JSON.stringify(insights.fastestGrowingCategory)}
- Inventory Risk: ${JSON.stringify(insights.inventoryRisk)}
- Highest Revenue Product: ${JSON.stringify(insights.highestRevenueProduct)}
- High Return Product: ${JSON.stringify(insights.highReturnProduct)}
- Monthly Revenue: $${snapshot.summary.thisMonthRevenue} (MoM Change: ${snapshot.summary.revenueChangePercent ?? 0}%)
- Total Orders This Month: ${snapshot.summary.thisMonthOrders}

FORMAT INSTRUCTIONS:
- Create 3-4 bullet points highlighting key performance metrics, inventory alerts, and actionable recommendations.
- Keep tone professional, energetic, and concise. Use bold for key numbers and product names.
- Do not use markdown headers. Start directly with bullet points or key callouts.`;

        const response = await ai.client.chat.completions.create({
            model: ai.model,
            messages: [{ role: "user", content: systemPrompt }],
            temperature: 0.4,
            max_tokens: 500,
        });

        const briefing = response.choices[0]?.message?.content?.trim() || generateRuleBasedBrief();

        return res.status(200).json({
            success: true,
            briefing,
            insights,
            generatedBy: "ai",
            model: ai.model,
        });
    } catch (error) {
        logger.error({ message: "Daily insights generation failed", error: error.message });
        return res.status(500).json({
            success: false,
            message: "Failed to generate daily business insights.",
        });
    }
};

