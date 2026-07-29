import express from "express";

const router = express.Router();

import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    createProductReview,
    deleteProductReview,
} from "../controllers/productController.js";

import {
    protect,
    admin,
} from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

import cacheMiddleware from "../middleware/cacheMiddleware.js";


router.get(
    "/",
    cacheMiddleware((req) => `all_products_${req.originalUrl || req.url}`, 3600),
    getProducts
);


router.get(
    "/:id",
    cacheMiddleware(
        (req) => `product_${req.params.id}`,
        3600
    ),
    getProductById
);


router.post(
    "/",
    protect,
    admin,
    upload.array("images", 5),
    createProduct
);


router.put(
    "/:id",
    protect,
    admin,
    upload.array("images", 5),
    updateProduct
);


router.delete(
    "/:id",
    protect,
    admin,
    deleteProduct
);

router.post(
    "/:id/reviews",
    protect,
    createProductReview
);

router.delete(
    "/:id/reviews/:reviewId",
    protect,
    admin,
    deleteProductReview
);

export default router;