import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true
    },

    discountPercentage: Number,

    expiryDate: Date
});

const Coupon = mongoose.model(
    "Coupon",
    couponSchema
);

export default Coupon;