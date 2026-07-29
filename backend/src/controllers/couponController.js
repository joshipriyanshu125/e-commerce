import Coupon from "../models/couponModel.js";


// CREATE COUPON
export const createCoupon = async (req, res) => {

    try {

        const {
            code,
            discountPercentage,
            expiryDate
        } = req.body;


        // VALIDATION
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


        // CHECK EXISTING COUPON
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


        // CREATE COUPON
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



// APPLY COUPON
export const applyCoupon = async (req, res) => {

    try {

        const { code, totalAmount } = req.body;


        // VALIDATION
        if (!code || !totalAmount) {

            return res.status(400).json({
                success: false,
                message:
                    "Coupon code and total amount are required"
            });
        }


        // FIND COUPON
        const coupon = await Coupon.findOne({
            code: code.trim().toUpperCase(),
            isActive: true
        });


        // INVALID COUPON
        if (!coupon) {

            return res.status(404).json({
                success: false,
                message: "Invalid coupon"
            });
        }


        // EXPIRED COUPON
        if (new Date(coupon.expiryDate).getTime() < Date.now()) {

            return res.status(400).json({
                success: false,
                message: "Coupon expired"
            });
        }


        // CALCULATE DISCOUNT
        const discount =
            (totalAmount *
                coupon.discountPercentage) / 100;


        // FINAL AMOUNT
        const finalAmount =
            totalAmount - discount;


        // RESPONSE
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

// GET ALL COUPONS (ADMIN)
export const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({}).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            coupons
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// DELETE COUPON (ADMIN)
export const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found"
            });
        }
        await coupon.deleteOne();
        res.status(200).json({
            success: true,
            message: "Coupon deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};