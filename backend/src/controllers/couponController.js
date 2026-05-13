import Coupon from "../models/couponModel.js";

export const createCoupon = async (req, res) => {

    try {

        const {
            code,
            discountPercentage,
            expiryDate
        } = req.body;

        if (
            !code ||
            !discountPercentage ||
            !expiryDate
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const existingCoupon =
            await Coupon.findOne({
                code: code.toUpperCase()
            });


        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: "Coupon already exists"
            });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountPercentage,
            expiryDate,
            isActive: true
        });


        res.status(201).json({
            success: true,
            message: "Coupon created successfully",
            coupon
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const applyCoupon = async (req, res) => {

    try {

        const { code, totalAmount } = req.body;

        if (!code || !totalAmount) {

            return res.status(400).json({
                success: false,
                message: "Coupon code and total amount are required"
            });
        }

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            isActive: true
        });

        if (!coupon) {

            return res.status(404).json({
                success: false,
                message: "Invalid coupon"
            });
        }

        if (coupon.expiryDate < Date.now()) {

            return res.status(400).json({
                success: false,
                message: "Coupon expired"
            });
        }

        const discount =
            (totalAmount *
                coupon.discountPercentage) / 100;


        const finalAmount =
            totalAmount - discount;

        res.status(200).json({

            success: true,

            originalAmount: totalAmount,

            discountPercentage:
                coupon.discountPercentage,

            discount,

            finalAmount
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};