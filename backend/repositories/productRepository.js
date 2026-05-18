import Product from "../models/Product.js";

/*
==============================
CREATE PRODUCT
==============================
*/
const createProductRepository = async (
    productData
) => {

    return await Product.create(
        productData
    );
};

/*
==============================
GET PRODUCTS
==============================
*/
const getProductsRepository = async ({
    query,
    sortOption,
    pageSize,
    page,
}) => {

    const count =
        await Product.countDocuments(
            query
        );

    const products =
        await Product.find(query)

            .sort(sortOption)

            .limit(pageSize)

            .skip(pageSize * (page - 1));

    return {
        count,
        products,
    };
};

/*
==============================
GET PRODUCT BY ID
==============================
*/
const getProductByIdRepository =
    async (id) => {

        return await Product.findById(id);
    };

/*
==============================
UPDATE PRODUCT
==============================
*/
const saveProductRepository =
    async (product) => {

        return await product.save();
    };

/*
==============================
DELETE PRODUCT
==============================
*/
const deleteProductRepository =
    async (product) => {

        return await product.deleteOne();
    };

export {
    createProductRepository,
    getProductsRepository,
    getProductByIdRepository,
    saveProductRepository,
    deleteProductRepository,
};