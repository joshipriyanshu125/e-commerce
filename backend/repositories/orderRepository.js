import Order from "../src/models/Order.js";

import Cart from "../src/models/cartModel.js";

import Product from "../src/models/Product.js";

/*
==============================
GET USER CART
==============================
*/
const getUserCartRepository =
    async (userId) => {

        return await Cart.findOne({
            user: userId,
        });
    };

/*
==============================
GET PRODUCT BY ID
==============================
*/
const getProductByIdRepository =
    async (productId) => {

        return await Product.findById(
            productId
        );
    };

/*
==============================
CREATE ORDER
==============================
*/
const createOrderRepository =
    async (orderData) => {

        return await Order.create(
            orderData
        );
    };

/*
==============================
GET ORDER BY ID
==============================
*/
const getOrderByIdRepository =
    async (orderId) => {

        return await Order.findById(
            orderId
        ).populate(
            "user",
            "name email"
        );
    };

/*
==============================
GET USER ORDERS
==============================
*/
const getUserOrdersRepository =
    async (userId) => {

        return await Order.find({
            user: userId,
        }).sort({
            createdAt: -1,
        });
    };

/*
==============================
GET ALL ORDERS
==============================
*/
const getAllOrdersRepository =
    async () => {

        return await Order.find()

            .populate(
                "user",
                "name email"
            )

            .sort({
                createdAt: -1,
            });
    };

export {
    getUserCartRepository,
    getProductByIdRepository,
    createOrderRepository,
    getOrderByIdRepository,
    getUserOrdersRepository,
    getAllOrdersRepository,
};