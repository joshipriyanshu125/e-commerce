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
    approveReturn,
    rejectReturn,
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

// Get Single Order (owner or admin)
router.get("/:id", protect, getSingleOrder);

// Cancel Order (user — Pending/Confirmed only)
router.put("/:id/cancel", protect, cancelOrder);

/*
=====================================
ADMIN ROUTES
=====================================
*/

// Get All Orders (paginated, filtered, sorted)
router.get("/", protect, admin, getAllOrders);

// Update Order Status (with optional courier/tracking/ETA in body)
router.put("/:id/status", protect, admin, updateOrderStatus);

// Admin Cancel Order (any non-terminal status)
router.put("/:id/admin-cancel", protect, admin, adminCancelOrder);

// Refund Order (Delivered or Cancelled)
router.put("/:id/refund", protect, admin, refundOrder);

// Approve Return Request
router.put("/:id/approve-return", protect, admin, approveReturn);

// Reject Return Request
router.put("/:id/reject-return", protect, admin, rejectReturn);

export default router;