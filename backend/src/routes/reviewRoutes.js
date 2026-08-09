import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
    createReview,
    getProductReviews,
    editReview,
    deleteReview,
    markHelpful,
    reportReview,
    getReportedReviews,
} from "../controllers/reviewController.js";

const router = express.Router();

// ── Public: get paginated reviews for a product ───────────────────────────────
// GET /api/reviews/product/:productId
router.get("/product/:productId", getProductReviews);

// ── Auth: create review (with optional image upload) ─────────────────────────
// POST /api/reviews
router.post(
    "/",
    protect,
    upload.array("images", 5),
    createReview
);

// ── Auth: edit own review (with optional image upload) ───────────────────────
// PUT /api/reviews/:id
router.put(
    "/:id",
    protect,
    upload.array("images", 5),
    editReview
);

// ── Auth: delete own review (admin can delete any) ───────────────────────────
// DELETE /api/reviews/:id
router.delete("/:id", protect, deleteReview);

// ── Auth: toggle helpful vote ─────────────────────────────────────────────────
// POST /api/reviews/:id/helpful
router.post("/:id/helpful", protect, markHelpful);

// ── Auth: report a review ─────────────────────────────────────────────────────
// POST /api/reviews/:id/report
router.post("/:id/report", protect, reportReview);

// ── Admin: get all reported reviews ──────────────────────────────────────────
// GET /api/reviews/admin/reported
router.get("/admin/reported", protect, admin, getReportedReviews);

export default router;
