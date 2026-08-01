import express from "express";
import {
    createCoupon,
    applyCoupon,
    getCoupons,
    deleteCoupon,
    toggleCoupon,
} from "../controllers/couponController.js";

import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ADMIN ROUTES
router.post("/create", protect, admin, createCoupon);
router.get("/", protect, admin, getCoupons);
router.delete("/:id", protect, admin, deleteCoupon);
router.patch("/:id/toggle", protect, admin, toggleCoupon);

// PUBLIC / USER ROUTE
router.post("/apply", protect, applyCoupon);

export default router;