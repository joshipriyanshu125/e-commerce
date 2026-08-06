import Promotion from "../models/promotionModel.js";
import asyncHandler from "../middleware/asyncHandler.js";

const activeQuery = () => ({ isActive: true, startsAt: { $lte: new Date() }, endsAt: { $gt: new Date() }, $expr: { $or: [{ $eq: ["$usageLimit", null] }, { $lt: ["$usedCount", "$usageLimit"] }] } });

export const getActivePromotions = asyncHandler(async (_req, res) => {
    const promotions = await Promotion.find(activeQuery()).sort({ priority: -1, createdAt: -1 }).lean();
    res.json({ success: true, promotions });
});

export const getPromotions = asyncHandler(async (_req, res) => {
    const promotions = await Promotion.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, promotions });
});

export const createPromotion = asyncHandler(async (req, res) => {
    const promotion = await Promotion.create(req.body);
    res.status(201).json({ success: true, promotion });
});

export const updatePromotion = asyncHandler(async (req, res) => {
    const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!promotion) return res.status(404).json({ success: false, message: "Promotion not found" });
    res.json({ success: true, promotion });
});

export const togglePromotion = asyncHandler(async (req, res) => {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) return res.status(404).json({ success: false, message: "Promotion not found" });
    promotion.isActive = !promotion.isActive; await promotion.save();
    res.json({ success: true, promotion });
});

export const promotionAnalytics = asyncHandler(async (_req, res) => {
    const summary = await Promotion.aggregate([{ $group: { _id: null, promotions: { $sum: 1 }, redemptions: { $sum: "$usedCount" }, active: { $sum: { $cond: ["$isActive", 1, 0] } } } }]);
    res.json({ success: true, analytics: summary[0] || { promotions: 0, redemptions: 0, active: 0 } });
});
