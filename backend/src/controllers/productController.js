import Product from "../models/productModel.js";

export const createProduct = async (req, res) => {
    try {
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
        });

        const createdProduct = await product.save();

        res.status(201).json(createdProduct);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};


export const getProducts = async (req, res) => {
    try {

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

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};

export const getProductById = async (req, res) => {
    try {

        const product = await Product.findById(req.params.id);

        if (product) {

            res.json(product);

        } else {

            res.status(404).json({
                message: "Product not found",
            });

        }

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};



// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
    try {

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

            res.status(404).json({
                message: "Product not found",
            });

        }

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};



// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
    try {

        const product = await Product.findById(req.params.id);

        if (product) {

            await product.deleteOne();

            res.json({
                message: "Product removed",
            });

        } else {

            res.status(404).json({
                message: "Product not found",
            });

        }

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }
};