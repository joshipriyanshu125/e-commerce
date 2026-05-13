import express from "express";

import {
    createCoupon,
    applyCoupon
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
    protect,
    applyCoupon
);


export default router;