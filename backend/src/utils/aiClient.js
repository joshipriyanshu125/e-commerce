import { OpenAI } from "openai";
import logger from "./logger.js";

/**
 * Returns an initialized OpenAI SDK client, target model name, and provider based on environment variables.
 * Supports OPENROUTER_API_KEY, GEMINI_API_KEY, GOOGLE_API_KEY, and OPENAI_API_KEY.
 */
export function getAIClient() {
    const key =
        process.env.OPENROUTER_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        process.env.OPENAI_API_KEY;

    if (!key || !key.trim()) {
        return null;
    }

    const trimmedKey = key.trim();

    // 1. Google Gemini API Key (starts with AIzaSy... or explicit GEMINI_API_KEY / GOOGLE_API_KEY)
    if (
        (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) ||
        (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim()) ||
        trimmedKey.startsWith("AIzaSy")
    ) {
        const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || trimmedKey).trim();
        return {
            client: new OpenAI({
                apiKey: geminiKey,
                baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
            }),
            model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
            provider: "gemini",
        };
    }

    // 2. Official OpenAI Key (starts with sk-proj... or sk-... without sk-or-)
    if (
        (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() && !process.env.OPENROUTER_API_KEY) ||
        trimmedKey.startsWith("sk-proj")
    ) {
        const openaiKey = (process.env.OPENAI_API_KEY || trimmedKey).trim();
        return {
            client: new OpenAI({
                apiKey: openaiKey,
            }),
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            provider: "openai",
        };
    }

    // 3. OpenRouter Key (default)
    return {
        client: new OpenAI({
            apiKey: trimmedKey,
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: {
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Atelier E-Commerce AI",
            },
        }),
        model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
        provider: "openrouter",
    };
}
