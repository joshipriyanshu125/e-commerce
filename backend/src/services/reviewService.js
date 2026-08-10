import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import logger from "../utils/logger.js";

// ─── CLOUDINARY STREAM UPLOAD ─────────────────────────────────────────────────
const streamUpload = (buffer, folder = "reviews") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                transformation: [{ quality: "auto", fetch_format: "auto" }],
            },
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

// ─── CLOUDINARY BULK DELETE ───────────────────────────────────────────────────
export const deleteReviewImages = async (images = []) => {
    await Promise.allSettled(
        images.map((img) => cloudinary.uploader.destroy(img.public_id))
    );
};

// ─── UPLOAD REVIEW IMAGES ─────────────────────────────────────────────────────
export const uploadReviewImages = async (files = []) => {
    if (!files || files.length === 0) return [];
    const uploaded = await Promise.all(
        files.map((file) => streamUpload(file.buffer, "reviews"))
    );
    return uploaded.map((r) => ({ public_id: r.public_id, url: r.secure_url }));
};

// ─── VERIFY PURCHASE ─────────────────────────────────────────────────────────
// Returns true if the user has a Delivered order containing the given product
export const verifyPurchase = async (userId, productId) => {
    try {
        const prodId = mongoose.isValidObjectId(productId)
            ? new mongoose.Types.ObjectId(productId)
            : productId;

        const deliveredOrder = await Order.findOne({
            user: userId,
            orderStatus: "Delivered",
            $or: [
                { "orderItems.product": prodId },
                { "orderItems.product": productId }
            ]
        }).lean();
        return !!deliveredOrder;
    } catch (err) {
        logger.error({ message: "verifyPurchase error", error: err.message });
        return false;
    }
};

// ─── RECALCULATE PRODUCT RATING ───────────────────────────────────────────────
// Operates only on Approved reviews
export const recalculateProductRating = (product) => {
    const approved = product.reviews.filter((r) => r.status === "Approved");
    product.numReviews = approved.length;
    product.rating =
        approved.length > 0
            ? approved.reduce((acc, r) => acc + r.rating, 0) / approved.length
            : 0;
};

// ─── GET REVIEW RATING STATS ──────────────────────────────────────────────────
// Returns {average, total, distribution: {1,2,3,4,5}}
export const getReviewStats = (reviews = []) => {
    const approved = reviews.filter((r) => r.status === "Approved");
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    for (const r of approved) {
        const key = Math.round(r.rating);
        if (key >= 1 && key <= 5) dist[key]++;
        sum += r.rating;
    }
    return {
        average: approved.length ? Number((sum / approved.length).toFixed(1)) : 0,
        total: approved.length,
        distribution: dist,
    };
};

// ─── APPLY SORT ───────────────────────────────────────────────────────────────
export const sortReviews = (reviews, sort = "recent") => {
    const arr = [...reviews];
    if (sort === "recent") return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === "highest") return arr.sort((a, b) => b.rating - a.rating);
    if (sort === "lowest") return arr.sort((a, b) => a.rating - b.rating);
    if (sort === "helpful") return arr.sort((a, b) => (b.helpfulVotes?.length || 0) - (a.helpfulVotes?.length || 0));
    return arr;
};

// ─── APPLY FILTER ─────────────────────────────────────────────────────────────
export const filterReviews = (reviews, filter = "all") => {
    if (filter === "verified") return reviews.filter((r) => r.isVerifiedPurchase);
    const star = parseInt(filter);
    if (star >= 1 && star <= 5) return reviews.filter((r) => Math.round(r.rating) === star);
    return reviews;
};

// ─── SANITIZE REVIEW FOR CLIENT ───────────────────────────────────────────────
// Strips internal fields (reports list, editHistory) from public responses
export const sanitizeReview = (review, requestingUserId = null) => {
    const obj = review.toObject ? review.toObject() : { ...review };
    const votedHelpful = requestingUserId
        ? (obj.helpfulVotes || []).some(
              (v) => v.toString() === requestingUserId.toString()
          )
        : false;

    return {
        _id: obj._id,
        user: obj.user,
        name: obj.name,
        title: obj.title || "",
        rating: obj.rating,
        comment: obj.comment,
        images: obj.images || [],
        isVerifiedPurchase: obj.isVerifiedPurchase,
        helpfulCount: (obj.helpfulVotes || []).length,
        votedHelpful,
        reportCount: (obj.reports || []).length,
        reply: obj.reply || "",
        status: obj.status,
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
    };
};
