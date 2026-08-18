import asyncHandler from "../middleware/asyncHandler.js";
import Product from "../models/Product.js";
import { getIO } from "../config/socket.js";
import Wishlist from "../models/wishlistModel.js";
import { sendNotification } from "../services/notificationService.js";

import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

import { deleteCache, clearCachePattern } from "../utils/cache.js";
import { recalculateProductRating } from "../services/reviewService.js";


// CLOUDINARY STREAM FUNCTION
const streamUpload = (buffer) => {
    return new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "products",
                resource_type: "image",
                transformation: [
                    { quality: "auto", fetch_format: "auto" },
                ],
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
        gender,
        status,
    } = req.body;

    // Parse array fields sent as JSON strings from multipart form
    const tags = req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags)) : [];
    const sizes = req.body.sizes ? (Array.isArray(req.body.sizes) ? req.body.sizes : JSON.parse(req.body.sizes)) : [];
    const colors = req.body.colors ? (Array.isArray(req.body.colors) ? req.body.colors : JSON.parse(req.body.colors)) : [];

    if (!req.files?.length) {
        res.status(400);
        throw new Error("At least one product image is required. Ensure the request uses multipart/form-data with the 'images' field.");
    }

    const images = [];

    // UPLOAD IMAGES TO CLOUDINARY
    if (req.files.length > 0) {

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
        gender: gender || "unisex",
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
    const pageSize = Math.min(Math.max(Number(req.query.limit) || 24, 1), 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const valueList = (value) => String(value || "").split(",").map(v => v.trim()).filter(Boolean);
    const query = { status: { $ne: "Draft" } };
    const search = String(req.query.q || req.query.keyword || "").trim();
    if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const rx = new RegExp(escaped, "i");
        query.$or = [{ name: rx }, { description: rx }, { category: rx }, { brand: rx }, { tags: rx }];
    }
    const categories = valueList(req.query.category); if (categories.length) query.category = { $in: categories };
    const brands = valueList(req.query.brand); if (brands.length) query.brand = { $in: brands };
    const genders = valueList(req.query.gender); if (genders.length) query.gender = { $in: genders };
    const sizes = valueList(req.query.size); if (sizes.length) query.sizes = { $in: sizes };
    const colors = valueList(req.query.color); if (colors.length) query.colors = { $in: colors };
    if (req.query.availability === "in-stock") query.countInStock = { $gt: 0 };
    if (req.query.minPrice || req.query.maxPrice) query.price = { ...(req.query.minPrice ? { $gte: Number(req.query.minPrice) } : {}), ...(req.query.maxPrice ? { $lte: Number(req.query.maxPrice) } : {}) };
    if (req.query.rating) query.rating = { $gte: Number(req.query.rating) };
    if (req.query.discount === "true") query.$expr = { $lt: ["$discountPrice", "$price"] };
    const sortMap = { newest: { createdAt: -1 }, lowToHigh: { price: 1 }, highToLow: { price: -1 }, popularity: { numReviews: -1, soldCount: -1 }, bestSelling: { soldCount: -1 }, highestRated: { rating: -1, numReviews: -1 } };
    const sortOption = sortMap[req.query.sort] || { createdAt: -1 };

    const count = await Product.countDocuments(
        query
    );

    const products = await Product.find(query).sort(sortOption).limit(pageSize).skip(pageSize * (page - 1)).lean();

    res.status(200).json({

        success: true,

        products,

        page,

        pages: Math.ceil(count / pageSize),

        totalProducts: count,

    });

});

export const getSearchSuggestions = asyncHandler(async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) return res.json({ success: true, suggestions: [] });
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(escaped, "i");
    const products = await Product.find({ status: "Active", $or: [{ name: rx }, { brand: rx }, { category: rx }, { tags: rx }] })
        .select("name category brand images price discountPrice").limit(8).lean();
    res.json({ success: true, suggestions: products });
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
        const wasOutOfStock = product.countInStock <= 0 || product.status === "OutOfStock";
        product.name = req.body.name || product.name;
        product.description = req.body.description || product.description;
        product.price = req.body.price !== undefined ? Number(req.body.price) : product.price;
        product.discountPrice = req.body.discountPrice !== undefined ? (req.body.discountPrice === '' ? null : Number(req.body.discountPrice)) : product.discountPrice;
        product.countInStock = req.body.countInStock !== undefined ? Number(req.body.countInStock) : product.countInStock;
        product.category = req.body.category || product.category;
        product.brand = req.body.brand !== undefined ? req.body.brand : product.brand;
        product.gender = req.body.gender || product.gender;
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

        // The edit form sends the assets that remain after an admin removes an
        // existing image. Delete only those removed assets from Cloudinary.
        if (req.body.retainedImageIds !== undefined) {
            const retainedImageIds = Array.isArray(req.body.retainedImageIds)
                ? req.body.retainedImageIds
                : JSON.parse(req.body.retainedImageIds);
            const removedImages = product.images.filter(image => !retainedImageIds.includes(image.public_id));
            await Promise.all(removedImages.map(image => cloudinary.uploader.destroy(image.public_id)));
            product.images = product.images.filter(image => retainedImageIds.includes(image.public_id));
        }


        // Append new images to the existing gallery. Replacing images here would
        // unexpectedly delete every existing Cloudinary asset when an admin adds one.
        if (req.files && req.files.length > 0) {
            if (product.images.length + req.files.length > 5) {
                res.status(400);
                throw new Error("A product can have a maximum of five images.");
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

            product.images.push(...images);

        }

        const updatedProduct = await product.save();

        if (wasOutOfStock && updatedProduct.countInStock > 0 && updatedProduct.status !== "OutOfStock") {
            const watching = await Wishlist.find({ items: { $elemMatch: { product: updatedProduct._id, notifyOnRestock: true } } }).select("user");
            await Promise.all(watching.map(({ user }) => sendNotification({ userId: user, title: "Back in stock", message: `${updatedProduct.name} is available again.`, type: "wishlist_back_in_stock" })));
        }

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
    console.log("DEBUG replyToReview - params:", req.params);
    console.log("DEBUG replyToReview - body:", req.body);

    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            console.log("DEBUG replyToReview - Product not found for ID:", req.params.id);
            res.status(404);
            throw new Error("Product not found");
        }

        console.log("DEBUG replyToReview - Found product:", product.name);
        const review = product.reviews.id(req.params.reviewId);
        if (!review) {
            console.log("DEBUG replyToReview - Review not found for ID:", req.params.reviewId);
            res.status(404);
            throw new Error("Review not found");
        }

        console.log("DEBUG replyToReview - Found review by:", review.name, "current reply:", review.reply);
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
    } catch (err) {
        console.error("DEBUG replyToReview - Error occurred:", err);
        res.status(res.statusCode === 200 ? 500 : res.statusCode);
        throw err;
    }
});

// GET SIMILAR PRODUCTS
export const getSimilarProducts = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const targetProduct = await Product.findById(id).lean();

    if (!targetProduct) {
        res.status(404);
        throw new Error("Product not found");
    }

    // Fetch active products excluding current product
    const candidateProducts = await Product.find({
        _id: { $ne: targetProduct._id },
        status: { $ne: "Draft" },
    }).lean();

    if (!candidateProducts.length) {
        return res.status(200).json({
            success: true,
            products: [],
        });
    }

    const tCategory = (targetProduct.category || "").toLowerCase();
    const tBrand = (targetProduct.brand || "").toLowerCase();
    const tGender = (targetProduct.gender || "unisex").toLowerCase();
    const tTags = (targetProduct.tags || []).map(t => String(t).toLowerCase());
    const tPrice = Number(targetProduct.price) || 0;

    const scored = candidateProducts.map(prod => {
        let score = 0;

        // 1. Category similarity (+40)
        const pCategory = (prod.category || "").toLowerCase();
        if (pCategory && tCategory) {
            if (pCategory === tCategory) score += 40;
            else if (pCategory.includes(tCategory) || tCategory.includes(pCategory)) score += 25;
        }

        // 2. Gender similarity (+20)
        const pGender = (prod.gender || "unisex").toLowerCase();
        if (pGender === tGender || pGender === "unisex" || tGender === "unisex") {
            score += 20;
        }

        // 3. Brand similarity (+15)
        const pBrand = (prod.brand || "").toLowerCase();
        if (pBrand && tBrand && pBrand === tBrand) {
            score += 15;
        }

        // 4. Tag / Color overlap (+15)
        const pTags = (prod.tags || []).map(t => String(t).toLowerCase());
        const tagMatches = pTags.filter(t => tTags.includes(t)).length;
        if (tagMatches > 0) {
            score += Math.min(15, tagMatches * 5);
        }

        // 5. Price proximity (+10)
        const pPrice = Number(prod.price) || 0;
        if (tPrice > 0 && pPrice > 0) {
            const priceDiffRatio = Math.abs(pPrice - tPrice) / tPrice;
            if (priceDiffRatio <= 0.2) score += 10;
            else if (priceDiffRatio <= 0.4) score += 5;
        }

        return { product: prod, score };
    });

    // Sort descending by score, then by rating
    scored.sort((a, b) => b.score - a.score || (b.product.rating || 0) - (a.product.rating || 0));

    // Limit to top 12 products
    const resultProducts = scored.slice(0, 12).map(item => item.product);

    res.status(200).json({
        success: true,
        count: resultProducts.length,
        products: resultProducts,
    });
});
