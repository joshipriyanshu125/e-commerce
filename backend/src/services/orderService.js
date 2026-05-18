import {
    createOrder,
} from "../repositories/orderRepository.js";

const createOrderService = async (
    orderData
) => {

    // BUSINESS LOGIC HERE

    const order =
        await createOrder(orderData);

    return order;
};

export {
    createOrderService,
};