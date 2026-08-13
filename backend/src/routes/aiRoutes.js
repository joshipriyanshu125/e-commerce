import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { generateProductDescription } from "../controllers/aiController.js";
import { analyzeStoreData } from "../controllers/aiAnalyticsController.js";

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

export default router;
