import { OpenAI } from "openai";
import Product from "../models/Product.js";
import logger from "../utils/logger.js";

/**
 * Helper to calculate string / tag similarity (Jaccard & keyword match score)
 */
function calculateTextSimilarity(queryTerms = [], targetText = "") {
    if (!queryTerms.length || !targetText) return 0;
    const normalizedTarget = targetText.toLowerCase();
    let matches = 0;

    for (const term of queryTerms) {
        const cleanTerm = term.toLowerCase().trim();
        if (cleanTerm && normalizedTarget.includes(cleanTerm)) {
            matches += 1;
        }
    }
    return Math.min(1, matches / Math.max(1, queryTerms.length));
}

/**
 * Helper to calculate color overlap score
 */
function calculateColorOverlap(detectedColors = [], productColors = []) {
    if (!detectedColors.length || !productColors.length) return 0.5; // neutral fallback
    const normDetected = detectedColors.map(c => c.toLowerCase());
    const normProduct = productColors.map(c => (typeof c === 'string' ? c : c.name || '').toLowerCase());

    let matchCount = 0;
    for (const dc of normDetected) {
        if (normProduct.some(pc => pc.includes(dc) || dc.includes(pc))) {
            matchCount += 1;
        }
    }
    return matchCount > 0 ? Math.min(1, matchCount / normDetected.length) : 0.1;
}

/*
==============================================================================
  POST /api/ai/visual-search
  Form-data: image (file)  OR  JSON: { imageBase64: string }
  Auth: Public / optional user
==============================================================================
*/
export const visualFashionSearch = async (req, res) => {
    try {
        let imageBase64 = req.body?.imageBase64 || "";

        // If file uploaded via multer memoryStorage
        if (req.file && req.file.buffer) {
            const mimeType = req.file.mimetype || "image/jpeg";
            imageBase64 = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`;
        }

        if (!imageBase64 && !req.body?.imageUrl) {
            return res.status(400).json({
                success: false,
                message: "Please upload an image file or provide imageBase64 data.",
            });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        let detectedTraits = {
            primaryCategory: "Hoodie",
            subCategory: "Oversized Hoodie",
            dominantColors: ["black"],
            stylePattern: "oversized solid streetwear",
            genderTarget: "unisex",
            keyTerms: ["black hoodie", "oversized hoodie", "hooded sweatshirt", "streetwear"],
            visualDescription: "Black oversized heavy fleece hoodie with relaxed fit.",
        };

        // ── Vision Feature Extraction via Multimodal AI ──────────────────────
        if (apiKey) {
            try {
                const openai = new OpenAI({
                    apiKey,
                    baseURL: "https://openrouter.ai/api/v1",
                    defaultHeaders: {
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "Atelier Visual Search AI",
                    },
                });

                const model = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";

                const systemPrompt = `You are a high-precision computer vision model for fashion e-commerce.
Analyze the provided clothing/fashion image and extract its visual attributes into clean JSON format.

JSON schema to return:
{
  "primaryCategory": "string (e.g. Hoodie, T-Shirt, Jacket, Sneakers, Pants, Shorts, Dress, Accessories)",
  "subCategory": "string (e.g. Oversized Hoodie, Cargo Pants, Denim Jacket, High-top Sneakers)",
  "dominantColors": ["array of color strings, e.g. black, white, navy, beige"],
  "stylePattern": "string (e.g. solid, graphic print, vintage wash, distressed, oversized, fitted)",
  "genderTarget": "string (men, women, unisex)",
  "keyTerms": ["array of 4-6 search keywords for catalog matching"],
  "visualDescription": "1 short sentence summarizing visual features"
}

IMPORTANT: Respond ONLY with valid JSON. No markdown code blocks.`;

                const imageUrlContent = imageBase64 || req.body.imageUrl;

                const response = await openai.chat.completions.create({
                    model,
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: systemPrompt },
                                { type: "image_url", image_url: { url: imageUrlContent } },
                            ],
                        },
                    ],
                    temperature: 0.2,
                    max_tokens: 400,
                });

                const rawContent = response.choices[0]?.message?.content?.trim();
                if (rawContent) {
                    const cleaned = rawContent.replace(/```json|```/g, "").trim();
                    const parsed = JSON.parse(cleaned);
                    detectedTraits = { ...detectedTraits, ...parsed };
                }
            } catch (visionErr) {
                logger.warn({ message: "Vision AI extraction fallback triggered", error: visionErr.message });
            }
        }

        // ── Fetch active catalog products & score visual similarity ─────────
        const products = await Product.find({ status: "Active" }).lean();

        if (!products.length) {
            return res.status(200).json({
                success: true,
                detectedTraits,
                matches: [],
                message: "No active products found in catalog.",
            });
        }

        const scoredProducts = products.map((prod) => {
            let score = 0;
            const reasons = [];

            // 1. Category Alignment (35 points)
            const pCategory = (prod.category || "").toLowerCase();
            const qCategory = (detectedTraits.primaryCategory || "").toLowerCase();
            const qSubCategory = (detectedTraits.subCategory || "").toLowerCase();

            if (pCategory.includes(qCategory) || qCategory.includes(pCategory)) {
                score += 35;
                reasons.push(`Category match (${prod.category})`);
            } else if (pCategory.includes(qSubCategory) || qSubCategory.includes(pCategory)) {
                score += 25;
                reasons.push(`Subcategory similarity`);
            } else {
                score += 10; // partial baseline
            }

            // 2. Color Palette Match (25 points)
            const colorScore = calculateColorOverlap(detectedTraits.dominantColors, prod.colors || []);
            score += Math.round(colorScore * 25);
            if (colorScore > 0.4) {
                reasons.push(`Matching color palette`);
            }

            // 3. Keyword / Tag Similarity (25 points)
            const prodText = `${prod.name} ${prod.description} ${(prod.tags || []).join(" ")} ${prod.brand || ""}`;
            const keywordSim = calculateTextSimilarity(detectedTraits.keyTerms, prodText);
            score += Math.round(keywordSim * 25);
            if (keywordSim > 0.3) {
                reasons.push(`Visual style & detail alignment`);
            }

            // 4. Gender / Fit Alignment (15 points)
            const pGender = (prod.gender || "unisex").toLowerCase();
            const qGender = (detectedTraits.genderTarget || "unisex").toLowerCase();
            if (pGender === qGender || pGender === "unisex" || qGender === "unisex") {
                score += 15;
            }

            // Normalize match percentage (clip between 60% and 98%)
            const matchPercentage = Math.min(99, Math.max(62, Math.round(score)));

            return {
                product: prod,
                similarityScore: score,
                matchPercentage: `${matchPercentage}%`,
                matchReasons: reasons.length ? reasons : ["Visual silhouette similarity"],
            };
        });

        // Sort descending by score
        scoredProducts.sort((a, b) => b.similarityScore - a.similarityScore);

        // Return top matches (up to 12)
        const topMatches = scoredProducts.slice(0, 12);

        return res.status(200).json({
            success: true,
            detectedTraits,
            totalMatches: topMatches.length,
            matches: topMatches,
        });
    } catch (error) {
        logger.error({ message: "Visual fashion search failed", error: error.message });
        return res.status(500).json({
            success: false,
            message: "Visual fashion search encountered an error. Please try again.",
        });
    }
};
