import express from "express";
import {
    getCategoryMenu,
    getCategories,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    reorderCategories,
    deleteCategory,
    seedCategories,
} from "../controllers/categoryController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/menu", getCategoryMenu);

router.get("/", getCategories);

router.get("/slug/:slug", getCategoryBySlug);

router.post(
    "/",
    protect,
    admin,
    upload.single("image"),
    createCategory
);

router.post(
    "/seed",
    protect,
    admin,
    seedCategories
);

router.patch(
    "/reorder",
    protect,
    admin,
    reorderCategories
);

router.put(
    "/:id",
    protect,
    admin,
    upload.single("image"),
    updateCategory
);

router.delete(
    "/:id",
    protect,
    admin,
    deleteCategory
);

export default router;
