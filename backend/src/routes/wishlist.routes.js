import express from "express";

import {
    addToWishlist,
    removeFromWishlist,
    getWishlist
} from "../controllers/wishlist.controller.js";

import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/add", protect, addToWishlist);

router.delete("/remove/:productId", protect, removeFromWishlist);

router.get("/", protect, getWishlist);

export default router;