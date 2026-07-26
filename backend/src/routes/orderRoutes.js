import express from "express";

import {
    createOrder,
    getMyOrders,
    getSingleOrder,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
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

// Cancel Order
router.put("/:id/cancel", protect, cancelOrder);

/*
=====================================
ADMIN ROUTES
=====================================
*/

// Get All Orders
router.get("/", protect, admin, getAllOrders);

// Update Order Status
router.put("/:id/status", protect, admin, updateOrderStatus);

export default router;