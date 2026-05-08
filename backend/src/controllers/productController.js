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
        const products = await Product.find();

        res.json(products);
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