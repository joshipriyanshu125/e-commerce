import cloudinary from "../config/cloudinary.js";

import streamifier from "streamifier";

import { deleteCache } from "../utils/cache.js";

import {
    createProductRepository,
    getProductsRepository,
    getProductByIdRepository,
    saveProductRepository,
    deleteProductRepository,
} from "../../repositories/productRepository.js";

/*
==============================
CLOUDINARY STREAM FUNCTION
==============================
*/
const streamUpload = (buffer) => {

    return new Promise((resolve, reject) => {

        const stream =
            cloudinary.uploader.upload_stream(
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

/*
==============================
CREATE PRODUCT SERVICE
==============================
*/
const createProductService = async ({
    body,
    files,
    user,
}) => {

    const {
        name,
        description,
        price,
        countInStock,
        category,
        brand,
    } = body;

    const images = [];

    /*
    ==============================
    UPLOAD IMAGES
    ==============================
    */
    if (files && files.length > 0) {

        for (const file of files) {

            const result =
                await streamUpload(
                    file.buffer
                );

            images.push({

                public_id:
                    result.public_id,

                url:
                    result.secure_url,
            });
        }
    }

    /*
    ==============================
    CREATE PRODUCT
    ==============================
    */
    const product =
        await createProductRepository({

            name,

            description,

            price,

            countInStock,

            category,

            brand,

            images,

            user: user._id,
        });

    /*
    ==============================
    CLEAR PRODUCT CACHE
    ==============================
    */
    await deleteCache(
        "all_products"
    );

    return product;
};

/*
==============================
GET PRODUCTS SERVICE
==============================
*/
const getProductsService = async (
    queryParams
) => {

    /*
    ==============================
    PAGINATION
    ==============================
    */
    const pageSize = 10;

    const page =
        Number(queryParams.page) || 1;

    /*
    ==============================
    SEARCH KEYWORD
    ==============================
    */
    const keyword =
        queryParams.keyword

            ? {
                name: {
                    $regex:
                        queryParams.keyword,

                    $options: "i",
                },
            }

            : {};

    /*
    ==============================
    CATEGORY FILTER
    ==============================
    */
    const category =
        queryParams.category

            ? {
                category:
                    queryParams.category,
            }

            : {};

    /*
    ==============================
    SORTING
    ==============================
    */
    let sortOption = {};

    switch (queryParams.sort) {

        case "lowToHigh":

            sortOption = {
                price: 1,
            };

            break;

        case "highToLow":

            sortOption = {
                price: -1,
            };

            break;

        case "newest":

            sortOption = {
                createdAt: -1,
            };

            break;

        default:

            sortOption = {
                createdAt: -1,
            };
    }

    /*
    ==============================
    FINAL QUERY
    ==============================
    */
    const query = {

        ...keyword,

        ...category,
    };

    /*
    ==============================
    FETCH PRODUCTS
    ==============================
    */
    const {
        count,
        products,
    } =
        await getProductsRepository({

            query,

            sortOption,

            pageSize,

            page,
        });

    /*
    ==============================
    RESPONSE
    ==============================
    */
    return {

        products,

        page,

        pages: Math.ceil(
            count / pageSize
        ),

        totalProducts: count,
    };
};

/*
==============================
GET SINGLE PRODUCT SERVICE
==============================
*/
const getSingleProductService =
    async (id) => {

        const product =
            await getProductByIdRepository(
                id
            );

        if (!product) {

            throw new Error(
                "Product not found"
            );
        }

        return product;
    };

export {
    createProductService,
    getProductsService,
    getSingleProductService,
};