import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { generateProductDescription } from "../controllers/aiController.js";

const router = express.Router();

// POST /api/ai/generate-description  — Admin only
router.post(
    "/generate-description",
    protect,
    admin,
    generateProductDescription
);

export default router;
