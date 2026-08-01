import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },

        discountType: {
            type: String,
            enum: ["percentage", "flat"],
            default: "percentage",
        },

        // Represents percentage or flat value depending on discountType
        discountValue: {
            type: Number,
            required: true,
            min: 0,
        },

        expiryDate: {
            type: Date,
            required: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        minPurchase: {
            type: Number,
            default: 0,
            min: 0,
        },

        maxDiscount: {
            type: Number,
            default: null,
            min: 0,
        },

        usageLimit: {
            type: Number,
            default: null,
            min: 1,
        },

        usedCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;