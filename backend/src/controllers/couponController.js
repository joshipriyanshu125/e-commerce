import Coupon from "../models/couponModel.js";

export const applyCoupon = async (req, res) => {
    try {

        const { code, totalAmount } = req.body;

        const coupon = await Coupon.findOne({ code });

        if (!coupon) {
            return res.status(404).json({
                message: "Coupon invalid"
            });
        }

        if (coupon.expiryDate < Date.now()) {
            return res.status(400).json({
                message: "Coupon expired"
            });
        }

        const discount =
            (totalAmount *
                coupon.discountPercentage) /
            100;

        const finalAmount =
            totalAmount - discount;

        res.status(200).json({
            originalAmount: totalAmount,
            discount,
            finalAmount
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};