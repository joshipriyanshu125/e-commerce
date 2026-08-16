import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createOrder, verifyPayment } from "../controllers/razorpayController.js";

const router = express.Router();
router.post("/orders", protect, createOrder);
router.post("/verify", protect, verifyPayment);
export default router;
