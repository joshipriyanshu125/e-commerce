import Product from "../models/productModel.js";

const getAllProducts = async () => {

    return await Product.find();
};

const getProductById = async (id) => {

    return await Product.findById(id);
};

const createProduct = async (
    productData
) => {

    return await Product.create(productData);
};

export {
    getAllProducts,
    getProductById,
    createProduct,
};