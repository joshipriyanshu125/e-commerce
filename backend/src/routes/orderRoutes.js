import express from "express";

import {
    createOrder,
    getMyOrders,
    getSingleOrder,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    adminCancelOrder,
    refundOrder,
} from "../controllers/orderController.js";

import {
    protect,
    admin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
=====================================
USER ROUTES
=====================================
*/

// Create Order
router.post("/", protect, createOrder);

// Get Logged-in User Orders
router.get("/my-orders", protect, getMyOrders);

// Get Single Order
router.get("/:id", protect, getSingleOrder);

// Cancel Order (user)
router.put("/:id/cancel", protect, cancelOrder);

/*
=====================================
ADMIN ROUTES
=====================================
*/

// Get All Orders
router.get("/", protect, admin, getAllOrders);

// Update Order Status (with optional courier info in body)
router.put("/:id/status", protect, admin, updateOrderStatus);

// Admin Cancel Order
router.put("/:id/admin-cancel", protect, admin, adminCancelOrder);

// Refund Order
router.put("/:id/refund", protect, admin, refundOrder);

export default router;