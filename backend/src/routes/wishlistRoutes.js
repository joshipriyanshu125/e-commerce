import express from "express";

import {
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    removeManyFromWishlist,
    updateWishlistItem
} from "../controllers/wishlistController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", protect, addToWishlist);
router.post("/items", protect, addToWishlist);

router.delete("/remove/:productId", protect, removeFromWishlist);
router.delete("/items/:productId", protect, removeFromWishlist);
router.delete("/items", protect, removeManyFromWishlist);
router.patch("/items/:productId", protect, updateWishlistItem);

router.get("/", protect, getWishlist);

export default router;
