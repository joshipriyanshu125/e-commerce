import express from "express";
import {
    createCoupon,
    applyCoupon,
    getCoupons,
    deleteCoupon
} from "../controllers/couponController.js";

import {
    protect,
    admin
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
    "/create",
    protect,
    admin,
    createCoupon
);


router.post(
    "/apply",
    applyCoupon
);

// Admin Coupon Management
router.get(
    "/",
    protect,
    admin,
    getCoupons
);

router.delete(
    "/:id",
    protect,
    admin,
    deleteCoupon
);



export default router;