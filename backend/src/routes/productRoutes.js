import express from "express";

const router = express.Router();

import {
    createProduct,
    getProducts,
    getProductById,
    getSimilarProducts,
    updateProduct,
    deleteProduct,
    createProductReview,
    deleteProductReview,
    getAllReviews,
    updateReviewStatus,
    replyToReview,
    getSearchSuggestions,
} from "../controllers/productController.js";

import {
    protect,
    admin,
} from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

import cacheMiddleware from "../middleware/cacheMiddleware.js";


router.get(
    "/suggestions",
    getSearchSuggestions
);

router.get(
    "/",
    // Versioned after category filtering changes so previously cached, broad
    // product lists cannot be returned for a specific submenu.
    cacheMiddleware((req) => `all_products_categories_v2_${req.originalUrl || req.url}`, 3600),
    getProducts
);

router.get(
    "/reviews/all",
    protect,
    admin,
    getAllReviews
);

router.get(
    "/:id/similar",
    cacheMiddleware(
        (req) => `similar_products_${req.params.id}`,
        3600
    ),
    getSimilarProducts
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
    upload.array("images", 50),
    createProduct
);

router.put(
    "/:id",
    protect,
    admin,
    upload.array("images", 50),
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

router.put(
    "/:id/reviews/:reviewId/status",
    protect,
    admin,
    updateReviewStatus
);

router.put(
    "/:id/reviews/:reviewId/reply",
    protect,
    admin,
    replyToReview
);

export default router;
