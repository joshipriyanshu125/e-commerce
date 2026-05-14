import express from "express";

const router = express.Router();

import {
    addToCart,
    getCart,
    removeFromCart,
    clearCart,
} from "../controllers/cartController.js";

import {
    protect,
} from "../middleware/authMiddleware.js";


// ==========================================
// ADD TO CART
// POST /api/cart
// ==========================================
router.post(
    "/",
    protect,
    addToCart
);


// ==========================================
// GET USER CART
// GET /api/cart
// ==========================================
router.get(
    "/",
    protect,
    getCart
);


// ==========================================
// REMOVE SINGLE ITEM
// DELETE /api/cart/:productId
// ==========================================
router.delete(
    "/:productId",
    protect,
    removeFromCart
);


// ==========================================
// CLEAR CART
// DELETE /api/cart/clear/all
// ==========================================
router.delete(
    "/clear/all",
    protect,
    clearCart
);

export default router;