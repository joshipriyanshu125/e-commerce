import Coupon from "../models/couponModel.js";

// CREATE COUPON
export const createCoupon = async (req, res) => {
    try {
        const {
            code,
            discountType,
            discountValue,
            expiryDate,
            minPurchase,
            maxDiscount,
            usageLimit,
        } = req.body;

        // VALIDATION
        if (!code || !discountType || !discountValue || !expiryDate) {
            return res.status(400).json({
                success: false,
                message: "Code, discount type, discount value, and expiry date are required.",
            });
        }

        if (!["percentage", "flat"].includes(discountType)) {
            return res.status(400).json({
                success: false,
                message: "discountType must be 'percentage' or 'flat'.",
            });
        }

        if (discountType === "percentage" && (discountValue <= 0 || discountValue > 100)) {
            return res.status(400).json({
                success: false,
                message: "Percentage discount must be between 1 and 100.",
            });
        }

        if (discountValue <= 0) {
            return res.status(400).json({
                success: false,
                message: "Discount value must be greater than 0.",
            });
        }

        // CHECK DUPLICATE
        const existingCoupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: "A coupon with this code already exists.",
            });
        }

        const coupon = await Coupon.create({
            code: code.trim().toUpperCase(),
            discountType,
            discountValue: parseFloat(discountValue),
            expiryDate,
            isActive: true,
            minPurchase: minPurchase ? parseFloat(minPurchase) : 0,
            maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
            usageLimit: usageLimit ? parseInt(usageLimit) : null,
            usedCount: 0,
        });

        res.status(201).json({
            success: true,
            message: "Coupon created successfully.",
            coupon,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// APPLY COUPON
export const applyCoupon = async (req, res) => {
    try {
        const { code, totalAmount } = req.body;

        if (!code || totalAmount === undefined || totalAmount === null) {
            return res.status(400).json({
                success: false,
                message: "Coupon code and total amount are required.",
            });
        }

        const amount = parseFloat(totalAmount);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid total amount.",
            });
        }

        // FIND COUPON
        const coupon = await Coupon.findOne({
            code: code.trim().toUpperCase(),
            isActive: true,
        });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: "Invalid or inactive coupon code.",
            });
        }

        // EXPIRY CHECK
        if (new Date(coupon.expiryDate).getTime() < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "This coupon has expired.",
            });
        }

        // USAGE LIMIT CHECK
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({
                success: false,
                message: "This coupon has reached its usage limit.",
            });
        }

        // MINIMUM PURCHASE CHECK
        if (coupon.minPurchase > 0 && amount < coupon.minPurchase) {
            return res.status(400).json({
                success: false,
                message: `Minimum order amount of $${coupon.minPurchase.toFixed(2)} is required to use this coupon.`,
            });
        }

        // CALCULATE DISCOUNT
        let discountAmount = 0;
        if (coupon.discountType === "percentage") {
            discountAmount = (amount * coupon.discountValue) / 100;
            // Apply max discount cap if set
            if (coupon.maxDiscount !== null && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        } else {
            // flat discount
            discountAmount = coupon.discountValue;
            if (discountAmount > amount) discountAmount = amount; // can't discount more than total
        }

        discountAmount = Math.round(discountAmount * 100) / 100;
        const finalAmount = Math.max(0, Math.round((amount - discountAmount) * 100) / 100);

        res.status(200).json({
            success: true,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount,
            originalAmount: amount,
            finalAmount,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET ALL COUPONS (ADMIN)
export const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE COUPON (ADMIN)
export const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found." });
        }
        await coupon.deleteOne();
        res.status(200).json({ success: true, message: "Coupon deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// TOGGLE COUPON ACTIVE STATUS (ADMIN)
export const toggleCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found." });
        }
        coupon.isActive = !coupon.isActive;
        await coupon.save();
        res.status(200).json({
            success: true,
            message: `Coupon ${coupon.isActive ? "enabled" : "disabled"} successfully.`,
            coupon,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};