import { OpenAI } from "openai";
import logger from "./logger.js";

/**
 * Returns an initialized OpenAI SDK client configured for OpenRouter.
 * Strictly uses OPENROUTER_API_KEY from environment variables.
 */
export function getAIClient() {
    const key = process.env.OPENROUTER_API_KEY;

    if (!key || !key.trim()) {
        logger.warn("No OPENROUTER_API_KEY found in environment variables.");
        return null;
    }

    const trimmedKey = key.trim();

    return {
        client: new OpenAI({
            apiKey: trimmedKey,
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: {
                "HTTP-Referer": "http://localhost:5000",
                "X-Title": "Atelier E-Commerce AI",
            },
        }),
        model: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
        provider: "openrouter",
    };
}

