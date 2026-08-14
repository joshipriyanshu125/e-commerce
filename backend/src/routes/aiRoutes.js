import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { generateProductDescription } from "../controllers/aiController.js";
import { analyzeStoreData, generateDailyInsights } from "../controllers/aiAnalyticsController.js";

const router = express.Router();

// POST /api/ai/generate-description  — Admin only
router.post(
    "/generate-description",
    protect,
    admin,
    generateProductDescription
);

// POST /api/ai/analytics-chat  — Admin only
// Body: { question: string, conversationHistory?: [{role, content}] }
router.post(
    "/analytics-chat",
    protect,
    admin,
    analyzeStoreData
);

// POST /api/ai/daily-insights  — Admin only
router.post(
    "/daily-insights",
    protect,
    admin,
    generateDailyInsights
);

export default router;
