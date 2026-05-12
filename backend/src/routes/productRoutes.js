import express from "express";

const router = express.Router();

import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    createProductReview,
} from "../controllers/productController.js";

import {
    protect,
    admin,
} from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";


// GET ALL PRODUCTS
router.get("/", getProducts);


// GET PRODUCT BY ID
router.get("/:id", getProductById);


// CREATE PRODUCT
router.post(
    "/",
    protect,
    admin,
    upload.array("images", 5),
    createProduct
);


// UPDATE PRODUCT
router.put(
    "/:id",
    protect,
    admin,
    upload.array("images", 5),
    updateProduct
);


// DELETE PRODUCT
router.delete(
    "/:id",
    protect,
    admin,
    deleteProduct
);


// CREATE REVIEW
router.post(
    "/:id/reviews",
    protect,
    createProductReview
);

export default router;