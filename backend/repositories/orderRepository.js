import Order from "../models/orderModel.js";

const createOrder = async (
    orderData
) => {

    return await Order.create(orderData);
};

const getOrderById = async (id) => {

    return await Order.findById(id);
};

export {
    createOrder,
    getOrderById,
};