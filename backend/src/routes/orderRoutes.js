import express from "express";

import {
    createOrder,
    getMyOrders,
    getSingleOrder,
    getAllOrders,
    updateOrderStatus
} from "../controllers/orderController.js";

import { protect } from "../middleware/authMiddleware.js";

import isAdmin from "../middleware/adminMiddleware.js";

const router = express.Router();


// USER
router.post("/", protect, createOrder);

router.get("/my-orders", protect, getMyOrders);

router.get("/:id", protect, getSingleOrder);


// ADMIN
router.get("/", protect, isAdmin, getAllOrders);

router.put("/:id", protect, isAdmin, updateOrderStatus);

export default router;