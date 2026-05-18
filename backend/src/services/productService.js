import {
    getAllProducts,
    getProductById,
} from "../repositories/productRepository.js";

const getProductsService = async () => {

    return await getAllProducts();
};

const getSingleProductService = async (
    id
) => {

    const product =
        await getProductById(id);

    if (!product) {

        throw new Error(
            "Product not found"
        );
    }

    return product;
};

export {
    getProductsService,
    getSingleProductService,
};