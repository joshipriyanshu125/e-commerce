import asyncHandler from "../middleware/asyncHandler.js";
import Product from "../models/Product.js";
import { getIO } from "../config/socket.js";

import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

import { deleteCache, clearCachePattern } from "../utils/cache.js";

// RECALCULATE PRODUCT RATING BASED ON APPROVED REVIEWS ONLY
const recalculateProductRating = (product) => {
    const approvedReviews = product.reviews.filter(r => r.status === "Approved");
    product.numReviews = approvedReviews.length;
    if (approvedReviews.length > 0) {
        product.rating = approvedReviews.reduce((acc, item) => item.rating + acc, 0) / approvedReviews.length;
    } else {
        product.rating = 0;
    }
};


// CLOUDINARY STREAM FUNCTION
const streamUpload = (buffer) => {

    return new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "products",
            },
            (error, result) => {

                if (result) {

                    resolve(result);

                } else {

                    reject(error);

                }

            }
        );

        streamifier
            .createReadStream(buffer)
            .pipe(stream);

    });

};


// CREATE PRODUCT
export const createProduct = asyncHandler(async (req, res) => {

    const {
        name,
        description,
        price,
        discountPrice,
        countInStock,
        category,
        brand,
        status,
    } = req.body;

    // Parse array fields sent as JSON strings from multipart form
    const tags = req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags)) : [];
    const sizes = req.body.sizes ? (Array.isArray(req.body.sizes) ? req.body.sizes : JSON.parse(req.body.sizes)) : [];
    const colors = req.body.colors ? (Array.isArray(req.body.colors) ? req.body.colors : JSON.parse(req.body.colors)) : [];

    const images = [];

    // UPLOAD IMAGES TO CLOUDINARY
    if (req.files && req.files.length > 0) {

        for (const file of req.files) {

            const result = await streamUpload(
                file.buffer
            );

            images.push({
                public_id: result.public_id,
                url: result.secure_url,
            });

        }

    }

    const product = new Product({
        name,
        description,
        price,
        discountPrice: discountPrice || null,
        countInStock,
        category,
        brand,
        tags,
        sizes,
        colors,
        status: status || "Active",
        images,
        user: req.user._id,
    });

    const createdProduct = await product.save();

    // CLEAR REDIS CACHE
    await clearCachePattern("all_products*");

    res.status(201).json({

        success: true,

        message: "Product created successfully",

        product: createdProduct,

    });

});


// GET ALL PRODUCTS
export const getProducts = asyncHandler(async (req, res) => {

    const pageSize = Math.min(Number(req.query.limit) || 10, 100);

    const page = Number(req.query.page) || 1;

    const keyword = req.query.keyword

        ? {
            name: {
                $regex: req.query.keyword,
                $options: "i",
            },
        }

        : {};

    const category = req.query.category

        ? {
            category: req.query.category,
        }

        : {};

    let sortOption = {};

    if (req.query.sort === "lowToHigh") {

        sortOption = { price: 1 };

    }

    if (req.query.sort === "highToLow") {

        sortOption = { price: -1 };

    }

    if (req.query.sort === "newest") {

        sortOption = { createdAt: -1 };

    }

    const query = {

        ...keyword,

        ...category,

    };

    const count = await Product.countDocuments(
        query
    );

    const products = await Product.find(query)

        .sort(sortOption)

        .limit(pageSize)

        .skip(pageSize * (page - 1));

    res.status(200).json({

        success: true,

        products,

        page,

        pages: Math.ceil(count / pageSize),

        totalProducts: count,

    });

});


// GET PRODUCT BY ID
export const getProductById = asyncHandler(async (req, res) => {

    const product = await Product.findById(
        req.params.id
    );

    if (product) {
        const productObj = product.toObject();
        productObj.reviews = (productObj.reviews || []).filter(r => r.status === "Approved");

        res.status(200).json({
            success: true,
            product: productObj,
        });

    } else {

        res.status(404);

        throw new Error("Product not found");

    }

});


// UPDATE PRODUCT
export const updateProduct = asyncHandler(async (req, res) => {

    const product = await Product.findById(req.params.id);

    if (product) {
        product.name = req.body.name || product.name;
        product.description = req.body.description || product.description;
        product.price = req.body.price !== undefined ? Number(req.body.price) : product.price;
        product.discountPrice = req.body.discountPrice !== undefined ? (req.body.discountPrice === '' ? null : Number(req.body.discountPrice)) : product.discountPrice;
        product.countInStock = req.body.countInStock !== undefined ? Number(req.body.countInStock) : product.countInStock;
        product.category = req.body.category || product.category;
        product.brand = req.body.brand !== undefined ? req.body.brand : product.brand;
        product.status = req.body.status || product.status;

        if (req.body.tags !== undefined) {
            product.tags = Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags);
        }
        if (req.body.sizes !== undefined) {
            product.sizes = Array.isArray(req.body.sizes) ? req.body.sizes : JSON.parse(req.body.sizes);
        }
        if (req.body.colors !== undefined) {
            product.colors = Array.isArray(req.body.colors) ? req.body.colors : JSON.parse(req.body.colors);
        }


        // OPTIONAL IMAGE UPDATE
        if (req.files && req.files.length > 0) {

            // DELETE OLD IMAGES
            for (const image of product.images) {

                await cloudinary.uploader.destroy(
                    image.public_id
                );

            }

            const images = [];

            for (const file of req.files) {

                const result = await streamUpload(
                    file.buffer
                );

                images.push({
                    public_id: result.public_id,
                    url: result.secure_url,
                });

            }

            product.images = images;

        }

        const updatedProduct = await product.save();

        // CLEAR REDIS CACHE
        await clearCachePattern("all_products*");

        await deleteCache(
            `product_${req.params.id}`
        );

        res.status(200).json({

            success: true,

            message: "Product updated successfully",

            product: updatedProduct,

        });

    } else {

        res.status(404);

        throw new Error("Product not found");

    }

});


// DELETE PRODUCT
export const deleteProduct = asyncHandler(async (req, res) => {

    const product = await Product.findById(
        req.params.id
    );

    if (product) {

        // DELETE IMAGES FROM CLOUDINARY
        for (const image of product.images) {

            await cloudinary.uploader.destroy(
                image.public_id
            );

        }

        await product.deleteOne();

        // CLEAR REDIS CACHE
        await clearCachePattern("all_products*");

        await deleteCache(
            `product_${req.params.id}`
        );

        res.status(200).json({

            success: true,

            message: "Product removed",

        });

    } else {

        res.status(404);

        throw new Error("Product not found");

    }

});


// CREATE PRODUCT REVIEW
export const createProductReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
        const alreadyReviewed = product.reviews.find(
            (review) => review.user.toString() === req.user._id.toString()
        );

        if (alreadyReviewed) {
            res.status(400);
            throw new Error("Product already reviewed");
        }

        const review = {
            name: req.user.name,
            rating: Number(rating),
            comment,
            user: req.user._id,
            status: "Pending", // Starts as Pending
        };

        product.reviews.push(review);
        
        // Recalculate ratings
        recalculateProductRating(product);

        await product.save();

        // CLEAR SINGLE PRODUCT CACHE
        await deleteCache(`product_${req.params.id}`);
        await clearCachePattern("all_products*");

        // SOCKET REAL-TIME NOTIFICATION
        const io = getIO();
        if (io) {
            io.emit("reviewUpdate");
        }

        res.status(201).json({
            success: true,
            message: "Review submitted for moderation",
        });
    } else {
        res.status(404);
        throw new Error("Product not found");
    }
});

// DELETE PRODUCT REVIEW (ADMIN MODERATION)
export const deleteProductReview = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        const reviewId = req.params.reviewId;
        const reviewIndex = product.reviews.findIndex(
            (r) => (r._id || r.id).toString() === reviewId.toString()
        );

        if (reviewIndex === -1) {
            res.status(404);
            throw new Error("Review not found");
        }

        product.reviews.splice(reviewIndex, 1);
        
        // Recalculate rating based on remaining Approved reviews
        recalculateProductRating(product);

        await product.save();

        // CLEAR CACHE
        await clearCachePattern("all_products*");
        await deleteCache(`product_${req.params.id}`);

        // SOCKET REAL-TIME NOTIFICATION
        const io = getIO();
        if (io) {
            io.emit("reviewUpdate");
        }

        res.status(200).json({
            success: true,
            message: "Review deleted successfully",
        });
    } else {
        res.status(404);
        throw new Error("Product not found");
    }
});

// GET ALL REVIEWS ACROSS ALL PRODUCTS (ADMIN)
export const getAllReviews = asyncHandler(async (req, res) => {
    const products = await Product.find({}).select("name reviews");
    let allReviews = [];
    
    products.forEach((product) => {
        product.reviews.forEach((review) => {
            allReviews.push({
                product: {
                    _id: product._id,
                    name: product.name,
                },
                _id: review._id,
                user: review.user,
                name: review.name,
                rating: review.rating,
                comment: review.comment,
                status: review.status || "Pending",
                reply: review.reply || "",
                createdAt: review.createdAt,
            });
        });
    });

    // Sort by newest first
    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
        success: true,
        reviews: allReviews,
    });
});

// UPDATE REVIEW STATUS (ADMIN)
export const updateReviewStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!["Pending", "Approved", "Hidden"].includes(status)) {
        res.status(400);
        throw new Error("Invalid status value");
    }

    const product = await Product.findById(req.params.id);

    if (product) {
        const review = product.reviews.id(req.params.reviewId);
        if (!review) {
            res.status(404);
            throw new Error("Review not found");
        }

        review.status = status;
        
        // Recalculate product rating/reviews count
        recalculateProductRating(product);

        await product.save();

        // CLEAR CACHE
        await clearCachePattern("all_products*");
        await deleteCache(`product_${req.params.id}`);

        // SOCKET REAL-TIME NOTIFICATION
        const io = getIO();
        if (io) {
            io.emit("reviewUpdate");
        }

        res.status(200).json({
            success: true,
            message: `Review status updated to ${status}`,
            review,
        });
    } else {
        res.status(404);
        throw new Error("Product not found");
    }
});

// REPLY TO REVIEW (ADMIN)
export const replyToReview = asyncHandler(async (req, res) => {
    const { reply } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
        const review = product.reviews.id(req.params.reviewId);
        if (!review) {
            res.status(404);
            throw new Error("Review not found");
        }

        review.reply = reply;

        await product.save();

        // CLEAR CACHE
        await clearCachePattern("all_products*");
        await deleteCache(`product_${req.params.id}`);

        // SOCKET REAL-TIME NOTIFICATION
        const io = getIO();
        if (io) {
            io.emit("reviewUpdate");
        }

        res.status(200).json({
            success: true,
            message: "Reply added to review",
            review,
        });
    } else {
        res.status(404);
        throw new Error("Product not found");
    }
});