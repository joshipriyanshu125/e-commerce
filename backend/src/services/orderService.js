import mongoose from "mongoose";

import sendEmail from "../utils/sendEmail.js";

import {
    orderConfirmationTemplate,
    orderDeliveredTemplate,
    orderStatusUpdateTemplate,
} from "../utils/emailTemplates.js";

import {
    sendNotification,
} from "./notificationService.js";

import {
    getUserCartRepository,
    getProductByIdRepository,
    createOrderRepository,
    getOrderByIdRepository,
    getUserOrdersRepository,
    getAllOrdersRepository,
} from "../../repositories/orderRepository.js";
import PushSubscription from "../models/pushSubscriptionModel.js";
import { sendWebPush } from "../utils/webPush.js";
import { getIO } from "../config/socket.js";

/*
==============================
CREATE ORDER SERVICE
==============================
*/
const createOrderService = async ({
    body,
    user,
}) => {

    const {
        orderItems,
        shippingInfo,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
        addressId,
    } = body;

    // GET USER CART
    const cart =
        await getUserCartRepository(
            user._id
        );

    if (
        !cart ||
        cart.items.length === 0
    ) {

        throw new Error(
            "Cart is empty"
        );
    }

    // CHECK STOCK
    for (const item of orderItems) {

        const product =
            await getProductByIdRepository(
                item.product
            );

        if (!product) {

            throw new Error(
                "Product not found"
            );
        }

        if (
            product.countInStock <
            item.quantity
        ) {

            throw new Error(
                `${product.name} is out of stock`
            );
        }
    }

    // CREATE ORDER
    const order =
        await createOrderRepository({

            user: user._id,

            orderItems,

            shippingInfo,

            shippingAddress:
                addressId,

            itemsPrice,

            shippingPrice,

            taxPrice,

            totalPrice,

            paymentMethod:
                "Cash On Delivery",

            isPaid: false,

            orderStatus:
                "Processing",
        });

    // REDUCE STOCK
    for (const item of orderItems) {

        const product =
            await getProductByIdRepository(
                item.product
            );

        product.countInStock -=
            item.quantity;

        await product.save();
    }

    // CLEAR CART
    cart.items = [];

    cart.totalPrice = 0;

    await cart.save();

    // POPULATE ORDER
    const populatedOrder =
        await getOrderByIdRepository(
            order._id
        );

    // SEND EMAIL
    await sendEmail({

        to:
            populatedOrder.user.email,

        subject:
            "Order Confirmation",

        html:
            orderConfirmationTemplate(
                populatedOrder.user
                    .name,
                order._id
            ),
    });

    // SEND NOTIFICATION
    await sendNotification({

        userId: user._id,

        title: "Order Placed",

        message:
            `Your order ${order._id} has been placed successfully.`,
    });

    return order;
};

/*
==============================
GET MY ORDERS SERVICE
==============================
*/
const getMyOrdersService =
    async (userId) => {

        return await getUserOrdersRepository(
            userId
        );
    };

/*
==============================
GET SINGLE ORDER SERVICE
==============================
*/
const getSingleOrderService =
    async (orderId) => {

        // VALIDATE ID
        if (
            !mongoose.Types.ObjectId.isValid(
                orderId
            )
        ) {

            throw new Error(
                "Invalid order ID"
            );
        }

        const order =
            await getOrderByIdRepository(
                orderId
            );

        if (!order) {

            throw new Error(
                "Order not found"
            );
        }

        return order;
    };

/*
==============================
GET ALL ORDERS SERVICE
==============================
*/
const getAllOrdersService =
    async () => {

        const orders =
            await getAllOrdersRepository();

        const totalAmount =
            orders.reduce(

                (acc, order) =>
                    acc +
                    order.totalPrice,

                0
            );

        return {
            totalAmount,
            orders,
        };
    };

/*
==============================
UPDATE ORDER STATUS SERVICE
==============================
*/
const updateOrderStatusService =
    async (orderId, status) => {

        const order =
            await getOrderByIdRepository(
                orderId
            );

        if (!order) {

            throw new Error(
                "Order not found"
            );
        }

        order.orderStatus = status;

        if (status === "Delivered") {

            order.deliveredAt = Date.now();
            if (order.paymentInfo) {
                order.paymentInfo.paymentStatus = "Paid";
            }
        }

        await order.save();

        if (["Shipped", "Out for Delivery", "Delivered"].includes(status)) {
            // SEND EMAIL
            const subject = status === "Delivered" ? "Order Delivered" : `Order Status: ${status}`;
            const htmlTemplate = status === "Delivered" 
                ? orderDeliveredTemplate(order.user.name, order._id)
                : orderStatusUpdateTemplate(order.user.name, order._id, status);

            await sendEmail({
                to: order.user.email,
                subject,
                html: htmlTemplate,
            });

            // SEND IN-APP NOTIFICATION
            await sendNotification({
                userId: order.user._id,
                title: subject,
                message: `Your order ${order._id} status is now ${status}.`,
            });

            // send web-push to subscribed devices for this user (best-effort)
            try {
                const sub = await PushSubscription.findOne({ user: order.user._id });
                if (sub) {
                    await sendWebPush(sub.subscription, {
                        title: subject,
                        body: `Your order ${order._id} status is now ${status}`,
                        orderId: order._id,
                    });
                }
            } catch (err) {
                console.error("push send error", err.message);
            }
        }

        // EMIT SOCKET EVENT FOR REAL-TIME UPDATE
        const io = getIO();
        if (io) {
            io.to(order.user._id.toString()).emit("orderStatusUpdated", {
                orderId: order._id,
                status: order.orderStatus,
                deliveredAt: order.deliveredAt
            });
        }

        return order;
    };


/*
==============================
CANCEL ORDER SERVICE
==============================
*/
const cancelOrderService = async (orderId, user) => {
    const order = await getOrderByIdRepository(orderId);

    if (!order) {
        throw new Error("Order not found");
    }

    // Only owner or admin (admin check happens at controller route) can cancel
    if (order.user.toString() !== user._id.toString()) {
        throw new Error("Not authorized to cancel this order");
    }

    if (order.orderStatus && (order.orderStatus === "Shipped" || order.orderStatus === "Delivered")) {
        throw new Error("Cannot cancel an order that has already shipped or delivered");
    }

    order.orderStatus = "Cancelled";
    order.cancelledAt = Date.now();

    await order.save();

    return order;
};

export {
    createOrderService,
    getMyOrdersService,
    getSingleOrderService,
    getAllOrdersService,
    updateOrderStatusService,
    cancelOrderService,
};