import { getAIClient } from "../utils/aiClient.js";
import logger from "../utils/logger.js";

// Helper: Smart local rule-based synthesizer fallback
const generateLocalSummary = (reviews) => {
    const total = reviews.length;
    if (total === 0) {
        return {
            summary: "No reviews available yet to summarize.",
            praised: [],
            complaints: [],
            count: 0
        };
    }

    const keywords = ["fit", "fabric", "material", "color", "quality", "size", "sleeves", "delivery", "price", "service", "look", "style", "comfort"];
    const positiveCounts = {};
    const negativeCounts = {};

    keywords.forEach(kw => {
        positiveCounts[kw] = 0;
        negativeCounts[kw] = 0;
    });

    let avgRating = 0;
    reviews.forEach(r => {
        avgRating += r.rating;
        const text = `${r.title} ${r.comment}`.toLowerCase();
        
        keywords.forEach(kw => {
            if (text.includes(kw)) {
                if (r.rating >= 4) {
                    positiveCounts[kw]++;
                } else if (r.rating <= 2.5) {
                    negativeCounts[kw]++;
                }
            }
        });
    });

    avgRating = avgRating / total;

    // Sort to get top elements
    const praised = Object.keys(positiveCounts)
        .filter(kw => positiveCounts[kw] > 0)
        .sort((a, b) => positiveCounts[b] - positiveCounts[a])
        .slice(0, 3)
        .map(kw => kw.charAt(0).toUpperCase() + kw.slice(1));

    const complaints = Object.keys(negativeCounts)
        .filter(kw => negativeCounts[kw] > 0)
        .sort((a, b) => negativeCounts[b] - negativeCounts[a])
        .slice(0, 2)
        .map(kw => kw.charAt(0).toUpperCase() + kw.slice(1));

    // Construct a sensible summary sentence
    let summaryText = "";
    if (avgRating >= 4) {
        summaryText = `⭐ Customers highly praise this product, particularly highlighting its ${praised.length > 0 ? praised.join(" and ").toLowerCase() : "overall quality"} and design.`;
    } else if (avgRating >= 3) {
        summaryText = `⭐ Most customers find the product satisfactory, though some note minor issues with ${complaints.length > 0 ? complaints.join(" and ").toLowerCase() : "sizing"}.`;
    } else {
        summaryText = `⚠️ Customers report significant concerns, primarily regarding ${complaints.length > 0 ? complaints.join(" or ").toLowerCase() : "the overall fit/quality"}.`;
    }

    // Default fallbacks if empty
    if (praised.length === 0) praised.push("Quality", "Design", "Comfort");

    return {
        summary: summaryText,
        praised,
        complaints,
        count: total
    };
};

export const generateReviewSummary = async (reviews) => {
    const approved = reviews.filter(r => r.status === "Approved");
    const total = approved.length;

    if (total === 0) {
        return {
            summary: "No reviews available yet to summarize.",
            praised: [],
            complaints: [],
            count: 0
        };
    }

    const ai = getAIClient();
    if (!ai) {
        logger.info("No AI API key found. Using local review summary generator.");
        return generateLocalSummary(approved);
    }

    try {
        const reviewsText = approved.map(r => `Rating: ${r.rating} stars - Title: ${r.title} - Comment: ${r.comment}`).join("\n\n");

        const prompt = `You are an AI reviews assistant for an e-commerce platform. Summarize the following reviews for a product.
Analyze their sentiment, praised aspects, and common complaints.
Return your output ONLY as a valid JSON object matching this schema:
{
  "summary": "A single sentence summary summarizing the main sentiment (e.g. ⭐ Customers love the oversized fit and fabric quality.)",
  "praised": ["Fit", "Fabric", "Color" (list the 3 most praised keywords/aspects)],
  "complaints": ["Sleeves may feel long" (list 1 or 2 common complaints/criticisms. If there are no complaints or negative comments, return an empty array [])]
}

Do not include any markdown backticks, explanations, or text other than the JSON object.

Reviews:
${reviewsText}`;

        const response = await ai.client.chat.completions.create({
            model: ai.model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 300,
        });

        const resultText = response.choices[0].message.content.trim();

        let parsed;
        try {
            parsed = JSON.parse(resultText);
        } catch {
            const jsonMatch = resultText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[1].trim());
            } else {
                const braceMatch = resultText.match(/\{[\s\S]*\}/);
                if (braceMatch) {
                    parsed = JSON.parse(braceMatch[0]);
                } else {
                    throw new Error("AI response did not contain valid JSON");
                }
            }
        }

        return {
            summary: parsed.summary || "Summary generation succeeded.",
            praised: parsed.praised || [],
            complaints: parsed.complaints || [],
            count: total
        };
    } catch (error) {
        logger.error({ message: "Failed to generate AI review summary via OpenRouter", error: error.message });
        // Graceful fallback to local generator
        return generateLocalSummary(approved);
    }
};
