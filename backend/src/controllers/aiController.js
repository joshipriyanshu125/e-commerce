import { OpenAI } from "openai";
import logger from "../utils/logger.js";

/*
==================================================
GENERATE PRODUCT DESCRIPTION (Admin only)
POST /api/ai/generate-description
Body: { product, material, fit, color, additionalDetails }
==================================================
*/
export const generateProductDescription = async (req, res) => {
    try {
        const { product, material, fit, color, additionalDetails } = req.body;

        if (!product) {
            return res.status(400).json({
                success: false,
                message: "Product name is required.",
            });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;

        // ─── Fallback: No API key → return a template-based description ───
        if (!apiKey) {
            logger.info("OPENROUTER_API_KEY not found. Using template description generator.");

            const title = product.trim();
            const materialText = material ? `${material} ` : "";
            const fitText = fit ? `${fit}-fit ` : "";
            const colorText = color ? `${color.toLowerCase()} ` : "";
            const extra = additionalDetails ? ` ${additionalDetails}` : "";

            const description =
                `Introducing the ${title} — a premium ${colorText}${fitText}piece crafted from ${materialText}fabric. ` +
                `Designed for those who value both comfort and style, it delivers effortless versatility for everyday wear.` +
                extra;

            return res.status(200).json({
                success: true,
                title,
                description,
                generatedBy: "template",
            });
        }

        // ─── AI Path ───────────────────────────────────────────────────────
        const openai = new OpenAI({
            apiKey,
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: {
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Atelier E-Commerce Admin",
            },
        });

        const model = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";

        const detailsLine = [
            material && `Material: ${material}`,
            fit && `Fit: ${fit}`,
            color && `Color: ${color}`,
            additionalDetails && `Additional details: ${additionalDetails}`,
        ]
            .filter(Boolean)
            .join("\n");

        const prompt = `You are a professional e-commerce copywriter for a premium fashion brand.
Write a compelling, conversion-focused product description based on the details below.

Product: ${product}
${detailsLine}

Requirements:
- Return ONLY a valid JSON object, no markdown, no extra text.
- Use this exact schema:
{
  "title": "Formatted product title (Title Case)",
  "description": "2-3 sentences. Engaging, specific, highlights material/fit/style. No vague filler. Speak directly to the customer."
}

Keep the description under 80 words. Do NOT mention the brand name. Do NOT make up specs not listed above.`;

        const response = await openai.chat.completions.create({
            model,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const raw = response.choices[0].message.content.trim();
        const parsed = JSON.parse(raw);

        return res.status(200).json({
            success: true,
            title: parsed.title || product,
            description: parsed.description || "",
            generatedBy: "ai",
        });
    } catch (error) {
        logger.error({
            message: "AI product description generation failed",
            error: error.message,
        });

        return res.status(500).json({
            success: false,
            message: "Failed to generate description. Please try again.",
        });
    }
};
