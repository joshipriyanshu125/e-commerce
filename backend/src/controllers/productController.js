import asyncHandler from "../middleware/asyncHandler.js";
import Product from "../models/productModel.js";


// CREATE PRODUCT
export const createProduct = asyncHandler(async (req, res) => {

    const {
        name,
        description,
        price,
        countInStock,
        image,
        category,
        brand,
    } = req.body;

    const product = new Product({
        name,
        description,
        price,
        countInStock,
        image,
        category,
        brand,
        user: req.user._id,
    });

    const createdProduct = await product.save();

    res.status(201).json(createdProduct);

});


// GET ALL PRODUCTS
export const getProducts = asyncHandler(async (req, res) => {

    const pageSize = 10;

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


    const count = await Product.countDocuments(query);


    const products = await Product.find(query)
        .sort(sortOption)
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.status(200).json({
        products,
        page,
        pages: Math.ceil(count / pageSize),
        totalProducts: count,
    });

});


// GET PRODUCT BY ID
export const getProductById = asyncHandler(async (req, res) => {

    const product = await Product.findById(req.params.id);

    if (product) {

        res.json(product);

    } else {

        res.status(404);
        throw new Error("Product not found");

    }

});


// UPDATE PRODUCT
export const updateProduct = asyncHandler(async (req, res) => {

    const product = await Product.findById(req.params.id);

    if (product) {

        product.name =
            req.body.name || product.name;

        product.description =
            req.body.description || product.description;

        product.price =
            req.body.price || product.price;

        product.countInStock =
            req.body.countInStock || product.countInStock;

        product.image =
            req.body.image || product.image;

        product.category =
            req.body.category || product.category;

        product.brand =
            req.body.brand || product.brand;

        const updatedProduct = await product.save();

        res.json(updatedProduct);

    } else {

        res.status(404);
        throw new Error("Product not found");

    }

});


// DELETE PRODUCT
export const deleteProduct = asyncHandler(async (req, res) => {

    const product = await Product.findById(req.params.id);

    if (product) {

        await product.deleteOne();

        res.json({
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
            (review) =>
                review.user.toString() === req.user._id.toString()
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
        };

        product.reviews.push(review);

        product.numReviews = product.reviews.length;

        product.rating =
            product.reviews.reduce(
                (acc, item) => item.rating + acc,
                0
            ) / product.reviews.length;

        await product.save();

        res.status(201).json({
            message: "Review added",
        });

    } else {

        res.status(404);
        throw new Error("Product not found");

    }

});