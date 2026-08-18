import asyncHandler from "../middleware/asyncHandler.js";
import Product from "../models/Product.js";
import { getIO } from "../config/socket.js";
import { getCache, setCache, deleteCache, clearCachePattern } from "../utils/cache.js";
import logger from "../utils/logger.js";
import { generateReviewSummary } from "../services/reviewSummaryService.js";
import {
    verifyPurchase,
    recalculateProductRating,
    getReviewStats,
    sortReviews,
    filterReviews,
    sanitizeReview,
    uploadReviewImages,
    deleteReviewImages,
} from "../services/reviewService.js";

/*
==================================================
POST /api/reviews
Create a new review — verified purchase check enforced here
==================================================
*/
export const createReview = asyncHandler(async (req, res) => {
    const { productId, rating, title, comment } = req.body;

    if (!productId || !rating || !comment) {
        res.status(400);
        throw new Error("productId, rating, and comment are required");
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
        res.status(400);
        throw new Error("Rating must be between 1 and 5");
    }

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    // Duplicate review check
    const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
        res.status(400);
        throw new Error("You have already reviewed this product");
    }

    // Verified purchase — system sets this, never trusts client input
    const isVerifiedPurchase = await verifyPurchase(req.user._id, productId);
    if (!isVerifiedPurchase) {
        res.status(400);
        throw new Error("Only users who have purchased and received this product can review it");
    }

    // Image upload to Cloudinary (optional)
    let images = [];
    if (req.files && req.files.length > 0) {
        if (req.files.length > 5) {
            res.status(400);
            throw new Error("Maximum 5 images allowed per review");
        }
        images = await uploadReviewImages(req.files);
    }

    const review = {
        user: req.user._id,
        name: req.user.name,
        title: (title || "").trim(),
        rating: Number(rating),
        comment: comment.trim(),
        images,
        isVerifiedPurchase,
        // NEW reviews start as Pending for moderation
        status: "Pending",
    };

    product.reviews.push(review);
    recalculateProductRating(product);
    await product.save();

    // Clear caches
    await deleteCache(`product_${productId}`);
    await deleteCache(`review_summary_${productId}`);
    await clearCachePattern("all_products*");

    // Notify via socket
    const io = getIO();
    if (io) io.emit("reviewUpdate");

    logger.info({ message: "Review created", userId: req.user._id, productId });

    res.status(201).json({
        success: true,
        message: "Review submitted successfully and is pending moderation",
    });
});

/*
==================================================
GET /api/products/:productId/reviews
Public — paginated, sorted, filtered (Approved only)
==================================================
*/
export const getProductReviews = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const sort = req.query.sort || "recent";    // recent | highest | lowest | helpful
    const filter = req.query.filter || "all";   // all | 1-5 | verified

    const product = await Product.findById(productId).select("reviews rating numReviews name").lean();
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    // Only show Approved reviews publicly
    const approved = product.reviews.filter((r) => r.status === "Approved");

    // Apply filter first, then sort
    const filtered = filterReviews(approved, filter);
    const sorted = sortReviews(filtered, sort);

    const stats = getReviewStats(product.reviews);

    // Pagination
    const total = sorted.length;
    const skip = (page - 1) * limit;
    const paginated = sorted.slice(skip, skip + limit);

    // Sanitize — strip internal report list, resolve votedHelpful for logged-in user
    const requestingUserId = req.user?._id || null;
    const sanitized = paginated.map((r) => sanitizeReview(r, requestingUserId));

    res.status(200).json({
        success: true,
        reviews: sanitized,
        stats,
        page,
        pages: Math.ceil(total / limit),
        total,
    });
});

/*
==================================================
PUT /api/reviews/:id
Edit own review — preserves edit history
==================================================
*/
export const editReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { productId, rating, title, comment } = req.body;

    if (!productId) {
        res.status(400);
        throw new Error("productId is required");
    }

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    const review = product.reviews.id(id);
    if (!review) {
        res.status(404);
        throw new Error("Review not found");
    }

    // Only the owner can edit
    if (review.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Not authorised to edit this review");
    }

    // Preserve current state in edit history
    review.editHistory.push({
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        editedAt: new Date(),
    });

    // Apply changes
    if (rating !== undefined) {
        const r = Number(rating);
        if (r < 1 || r > 5) {
            res.status(400);
            throw new Error("Rating must be between 1 and 5");
        }
        review.rating = r;
    }
    if (title !== undefined) review.title = title.trim();
    if (comment !== undefined) review.comment = comment.trim();

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
        if ((review.images.length + req.files.length) > 5) {
            res.status(400);
            throw new Error("Maximum 5 images allowed per review");
        }
        const newImages = await uploadReviewImages(req.files);
        review.images.push(...newImages);
    }

    // Reset to Pending so admin can re-moderate
    review.status = "Pending";

    recalculateProductRating(product);
    await product.save();

    await deleteCache(`product_${productId}`);
    await deleteCache(`review_summary_${productId}`);
    await clearCachePattern("all_products*");

    const io = getIO();
    if (io) io.emit("reviewUpdate");

    logger.info({ message: "Review edited", userId: req.user._id, reviewId: id });

    res.status(200).json({
        success: true,
        message: "Review updated and submitted for moderation",
    });
});

/*
==================================================
DELETE /api/reviews/:id
Delete own review (owner) OR any review (admin)
==================================================
*/
export const deleteReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { productId } = req.body;

    if (!productId) {
        res.status(400);
        throw new Error("productId is required");
    }

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    const review = product.reviews.id(id);
    if (!review) {
        res.status(404);
        throw new Error("Review not found");
    }

    // Authorisation: owner OR admin
    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        res.status(403);
        throw new Error("Not authorised to delete this review");
    }

    // Clean up Cloudinary images
    if (review.images && review.images.length > 0) {
        await deleteReviewImages(review.images);
    }

    review.deleteOne();
    recalculateProductRating(product);
    await product.save();

    await deleteCache(`product_${productId}`);
    await deleteCache(`review_summary_${productId}`);
    await clearCachePattern("all_products*");

    const io = getIO();
    if (io) io.emit("reviewUpdate");

    logger.info({
        message: "Review deleted",
        userId: req.user._id,
        reviewId: id,
        deletedBy: isAdmin ? "admin" : "owner",
    });

    res.status(200).json({ success: true, message: "Review deleted successfully" });
});

/*
==================================================
POST /api/reviews/:id/helpful
Toggle helpful vote — prevents duplicate votes
==================================================
*/
export const markHelpful = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { productId } = req.body;

    if (!productId) {
        res.status(400);
        throw new Error("productId is required");
    }

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    const review = product.reviews.id(id);
    if (!review) {
        res.status(404);
        throw new Error("Review not found");
    }

    if (review.status !== "Approved") {
        res.status(400);
        throw new Error("Can only vote on approved reviews");
    }

    const userId = req.user._id;
    const alreadyVoted = review.helpfulVotes.some(
        (v) => v.toString() === userId.toString()
    );

    if (alreadyVoted) {
        // Toggle off
        review.helpfulVotes = review.helpfulVotes.filter(
            (v) => v.toString() !== userId.toString()
        );
    } else {
        review.helpfulVotes.push(userId);
    }

    await product.save();

    res.status(200).json({
        success: true,
        helpfulCount: review.helpfulVotes.length,
        votedHelpful: !alreadyVoted,
    });
});

/*
==================================================
POST /api/reviews/:id/report
Report a review — single report per user per review
==================================================
*/
export const reportReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { productId, reason } = req.body;

    if (!productId || !reason) {
        res.status(400);
        throw new Error("productId and reason are required");
    }

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    const review = product.reviews.id(id);
    if (!review) {
        res.status(404);
        throw new Error("Review not found");
    }

    // Prevent duplicate reports from the same user
    const alreadyReported = review.reports.some(
        (rp) => rp.user.toString() === req.user._id.toString()
    );
    if (alreadyReported) {
        res.status(400);
        throw new Error("You have already reported this review");
    }

    review.reports.push({ user: req.user._id, reason: reason.trim() });
    await product.save();

    logger.warn({
        message: "Review reported",
        reviewId: id,
        productId,
        reportedBy: req.user._id,
        reason,
    });

    res.status(200).json({ success: true, message: "Review reported successfully" });
});

/*
==================================================
GET /api/reviews/admin/reported
Admin — get all reported reviews
==================================================
*/
export const getReportedReviews = asyncHandler(async (req, res) => {
    const products = await Product.find({
        "reviews.reports.0": { $exists: true },
    }).select("name reviews").lean();

    const reported = [];
    for (const product of products) {
        for (const review of product.reviews) {
            if (review.reports && review.reports.length > 0) {
                reported.push({
                    product: { _id: product._id, name: product.name },
                    _id: review._id,
                    user: review.user,
                    name: review.name,
                    rating: review.rating,
                    comment: review.comment,
                    status: review.status,
                    reportCount: review.reports.length,
                    reports: review.reports,
                    createdAt: review.createdAt,
                });
            }
        }
    }

    reported.sort((a, b) => b.reportCount - a.reportCount);

    res.status(200).json({ success: true, reviews: reported, total: reported.length });
});

/*
==================================================
GET /api/reviews/product/:productId/summary
Get AI/Local summary for product reviews
==================================================
*/
export const getProductReviewSummary = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const cacheKey = `review_summary_${productId}`;

    // 1. Instant 2ms cache response if summary was generated previously
    const cachedSummary = await getCache(cacheKey);
    if (cachedSummary) {
        return res.status(200).json({
            success: true,
            summary: cachedSummary,
            cached: true,
        });
    }

    const product = await Product.findById(productId).select("reviews").lean();
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    const summaryData = await generateReviewSummary(product.reviews || []);

    // 2. Cache summary for 24 hours (86400s)
    await setCache(cacheKey, summaryData, 86400);

    res.status(200).json({
        success: true,
        summary: summaryData
    });
});
