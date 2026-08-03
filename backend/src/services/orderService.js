import mongoose from "mongoose";

import sendEmail from "../utils/sendEmail.js";

import {
    orderConfirmationTemplate,
    orderDeliveredTemplate,
    orderStatusUpdateTemplate,
} from "../utils/emailTemplates.js";

import {
    sendNotification,
    notifyAdmins,
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
        paymentInfo,
    } = body;

    // GET USER CART
    const cart =
        await getUserCartRepository(
            user._id
        );

    if (
        !orderItems ||
        orderItems.length === 0
    ) {

        throw new Error(
            "Order items are empty"
        );
    }

    // CHECK STOCK
    for (const item of orderItems) {
        if (mongoose.Types.ObjectId.isValid(item.product)) {
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

            paymentInfo: paymentInfo || {
                method: "COD",
                paymentStatus: "Pending",
            },

            isPaid: paymentInfo?.paymentStatus === "Paid",

            orderStatus:
                paymentInfo?.paymentStatus === "Failed" ? "Cancelled" : "Processing",
        });

    // REDUCE STOCK
    for (const item of orderItems) {
        if (mongoose.Types.ObjectId.isValid(item.product)) {
            const product =
                await getProductByIdRepository(
                    item.product
                );

            if (product) {
                product.countInStock -=
                    item.quantity;

                await product.save();

                // Check and notify admins for stock levels
                if (product.countInStock <= 0) {
                    notifyAdmins({
                        title: "Product Out of Stock",
                        message: `Product "${product.name}" is now out of stock!`,
                        type: "out_of_stock",
                    }).catch(err => console.error("Out of stock notify error:", err));
                } else if (product.countInStock <= 5) {
                    notifyAdmins({
                        title: "Low Inventory",
                        message: `Low inventory: "${product.name}" (Only ${product.countInStock} left)`,
                        type: "low_inventory",
                    }).catch(err => console.error("Low inventory notify error:", err));
                }
            }
        }
    }

    // CLEAR CART
    if (cart) {
        cart.items = [];

        cart.totalPrice = 0;

        await cart.save();
    }

    // POPULATE ORDER
    const populatedOrder =
        await getOrderByIdRepository(
            order._id
        );

    // EMIT REAL-TIME SOCKET EVENT FOR ADMIN DASHBOARD & ORDERS
    try {
        const io = getIO();
        if (io) {
            io.emit("newOrder", populatedOrder);
        }
    } catch (socketErr) {
        console.error("Socket newOrder error:", socketErr.message);
    }

    // SEND EMAIL (non-fatal — order is placed even if email fails)
    try {
        await sendEmail({
            to: populatedOrder.user.email,
            subject: "Order Confirmation",
            html: orderConfirmationTemplate(
                populatedOrder.user.name,
                order._id
            ),
        });
    } catch (emailErr) {
        console.error("Order confirmation email failed (order still created):", emailErr.message);
    }

    // SEND NOTIFICATION (non-fatal)
    try {
        await sendNotification({
            userId: user._id,
            title: paymentInfo?.paymentStatus === "Failed" ? "Payment Failed" : "Order Placed",
            message: paymentInfo?.paymentStatus === "Failed" 
                ? `Your payment for order ${order._id} failed.` 
                : `Your order ${order._id} has been placed successfully.`,
            type: paymentInfo?.paymentStatus === "Failed" ? "payment_failed" : "new_order",
        });
    } catch (notifErr) {
        console.error("Order notification failed (order still created):", notifErr.message);
    }

    // Send admin notification
    if (paymentInfo?.paymentStatus === "Failed") {
        notifyAdmins({
            title: "Payment Failed",
            message: `Payment failed for order #${order._id.toString().slice(-6).toUpperCase()} (Amount: $${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
            type: "payment_failed",
        }).catch(err => console.error("Payment failed admin notification failed:", err.message));
    } else {
        notifyAdmins({
            title: "New Order",
            message: `New order #${order._id.toString().slice(-6).toUpperCase()} placed by ${user.name} for $${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            type: "new_order",
        }).catch(err => console.error("New order admin notification failed:", err.message));
    }

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
    async (orderId, status, extras = {}) => {

        const order =
            await getOrderByIdRepository(
                orderId
            );

        if (!order) {
            throw new Error("Order not found");
        }

        order.orderStatus = status;

        if (status === "Delivered") {
            order.deliveredAt = Date.now();
            if (order.paymentInfo) {
                order.paymentInfo.paymentStatus = "Paid";
            }
        }

        if (status === "Refunded") {
            order.refundedAt = Date.now();
        }

        // Optionally assign courier details
        if (extras.courierName !== undefined) order.courierName = extras.courierName;
        if (extras.trackingNumber !== undefined) order.trackingNumber = extras.trackingNumber;

        await order.save();

        const notifyStatuses = ["Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Refunded"];
        if (notifyStatuses.includes(status)) {
            // SEND EMAIL (best-effort)
            try {
                const subject = status === "Delivered" ? "Order Delivered" : `Order Status: ${status}`;
                const htmlTemplate = status === "Delivered"
                    ? orderDeliveredTemplate(order.user.name, order._id)
                    : orderStatusUpdateTemplate(order.user.name, order._id, status);

                await sendEmail({ to: order.user.email, subject, html: htmlTemplate });
            } catch (err) {
                console.error("Status email failed:", err.message);
            }

            // SEND IN-APP NOTIFICATION (best-effort)
            try {
                const subject = `Order ${status}`;
                await sendNotification({
                    userId: order.user._id,
                    title: subject,
                    message: `Your order #${order._id.toString().slice(-6).toUpperCase()} status is now ${status}.`,
                    type: "order_status",
                });
            } catch (err) {
                console.error("Notification failed:", err.message);
            }

            // SEND WEB PUSH (best-effort)
            try {
                const sub = await PushSubscription.findOne({ user: order.user._id });
                if (sub) {
                    await sendWebPush(sub.subscription, {
                        title: `Order ${status}`,
                        body: `Your order status is now ${status}`,
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
CANCEL ORDER SERVICE (USER)
==============================
*/
const cancelOrderService = async (orderId, user) => {
    const order = await getOrderByIdRepository(orderId);

    if (!order) {
        throw new Error("Order not found");
    }

    // Only owner can cancel via this route
    const orderUserId = (order.user && order.user._id) ? order.user._id.toString() : order.user.toString();
    if (orderUserId !== user._id.toString()) {
        throw new Error("Not authorized to cancel this order");
    }

    if (["Shipped", "Out for Delivery", "Delivered"].includes(order.orderStatus)) {
        throw new Error("Cannot cancel an order that has already shipped or delivered");
    }

    order.orderStatus = "Cancelled";
    order.cancelledAt = Date.now();
    await order.save();

    return order;
};

/*
==============================
ADMIN CANCEL ORDER SERVICE
==============================
*/
const adminCancelOrderService = async (orderId) => {
    const order = await getOrderByIdRepository(orderId);
    if (!order) throw new Error("Order not found");

    if (order.orderStatus === "Delivered") {
        throw new Error("Cannot cancel an already delivered order. Use Refund instead.");
    }

    order.orderStatus = "Cancelled";
    order.cancelledAt = Date.now();
    await order.save();

    // Notify customer
    try {
        await sendNotification({
            userId: order.user._id,
            title: "Order Cancelled",
            message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been cancelled by admin.`,
            type: "order_status",
        });
    } catch (err) {
        console.error("Cancel notification failed:", err.message);
    }

    return order;
};

/*
==============================
REFUND ORDER SERVICE (ADMIN)
==============================
*/
const refundOrderService = async (orderId) => {
    const order = await getOrderByIdRepository(orderId);
    if (!order) throw new Error("Order not found");

    if (!["Delivered", "Cancelled"].includes(order.orderStatus)) {
        throw new Error("Refund can only be issued for Delivered or Cancelled orders.");
    }

    order.orderStatus = "Refunded";
    order.refundedAt = Date.now();
    await order.save();

    // Notify customer
    try {
        await sendNotification({
            userId: order.user._id,
            title: "Refund Initiated",
            message: `A refund for your order #${order._id.toString().slice(-6).toUpperCase()} has been initiated.`,
            type: "refund_requested",
        });
    } catch (err) {
        console.error("Refund notification failed:", err.message);
    }

    return order;
};

export {
    createOrderService,
    getMyOrdersService,
    getSingleOrderService,
    getAllOrdersService,
    updateOrderStatusService,
    cancelOrderService,
    adminCancelOrderService,
    refundOrderService,
};