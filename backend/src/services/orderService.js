import mongoose from "mongoose";

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
import ReturnRequest from "../models/returnModel.js";
import { sendWebPush } from "../utils/webPush.js";
import { getIO } from "../config/socket.js";
import Invoice from "../models/invoiceModel.js";
import generateInvoice from "../utils/generateInvoice.js";
import path from "path";
import fs from "fs";
import { decreaseStock, increaseStock, validateStock } from "./inventoryService.js";

/*
==============================
VALID STATUS TRANSITIONS
==============================
*/
const VALID_TRANSITIONS = {
    Pending:           ["Confirmed", "Cancelled"],
    Confirmed:         ["Packed", "Cancelled"],
    Packed:            ["Shipped", "Cancelled"],
    Shipped:           ["Out for Delivery"],
    "Out for Delivery": ["Delivered"],
    Delivered:         ["Refunded"],
    Cancelled:         [],
    Refunded:          [],
};

const isValidTransition = (from, to) => {
    // Admin can also cancel at any non-terminal state
    if (to === "Cancelled" && !["Delivered", "Cancelled", "Refunded"].includes(from)) return true;
    return (VALID_TRANSITIONS[from] || []).includes(to);
};

const triggerInvoiceRegeneration = async (orderId) => {
    try {
        const invoice = await Invoice.findOne({ order: orderId });
        if (invoice) {
            const invoicesDir = path.join(process.cwd(), "src", "invoices");
            if (!fs.existsSync(invoicesDir)) {
                fs.mkdirSync(invoicesDir, { recursive: true });
            }
            const invoicePath = path.join(invoicesDir, `${invoice.invoiceNumber}.pdf`);
            const populatedInvoice = await Invoice.findById(invoice._id)
                .populate({
                    path: "order",
                    populate: { path: "user", select: "name email" }
                })
                .populate("user");
            if (populatedInvoice) {
                await generateInvoice(populatedInvoice, invoicePath);
            }
        }
    } catch (err) {
        console.error("Internal triggerInvoiceRegeneration failed:", err.message);
    }
};

/*
==============================
PUSH TRACKING HISTORY ENTRY
==============================
*/
const pushTrackingHistory = (order, status, note = "", updatedBy = "system") => {
    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({ status, note, updatedBy, timestamp: new Date() });
};

/*
==============================
CREATE ORDER SERVICE
==============================
*/
const createOrderService = async ({ body, user }) => {

    const {
        orderItems,
        shippingInfo,
        addressId,
        paymentInfo,
    } = body;

    // GET USER CART
    const cart = await getUserCartRepository(user._id);

    if (!orderItems || orderItems.length === 0) {
        throw new Error("Order items are empty");
    }

    // Reprice each item from the catalogue. Browser totals are display-only and
    // must never be required (or trusted) to create an order.
    const normalizedOrderItems = [];
    let itemsPrice = 0;

    for (const item of orderItems) {
        if (!mongoose.Types.ObjectId.isValid(item.product) || !Number.isInteger(item.quantity) || item.quantity < 1) {
            throw new Error("One or more cart items are invalid");
        }

        const product = await getProductByIdRepository(item.product);
        if (!product || product.status !== "Active") {
            throw new Error("A product in your cart is no longer available");
        }

        const size = item.size || "N/A";
        const color = item.color || "N/A";
        await validateStock(product._id, size, color, item.quantity);

        const unitPrice = product.discountPrice ?? product.price;
        itemsPrice += unitPrice * item.quantity;
        normalizedOrderItems.push({
            product: product._id,
            name: product.name,
            image: product.images?.[0]?.url || "",
            price: unitPrice,
            quantity: item.quantity,
            size,
            color,
        });
    }

    const shippingPrice = itemsPrice >= 150 ? 0 : 15;
    const taxPrice = 0;
    const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));

    const initialStatus = paymentInfo?.paymentStatus === "Failed" ? "Cancelled" : "Pending";

    // CREATE ORDER
    const order = await createOrderRepository({
        user: user._id,
        orderItems: normalizedOrderItems,
        shippingInfo,
        shippingAddress: addressId,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
        paymentInfo: paymentInfo || {
            method: "COD",
            paymentStatus: "Pending",
        },
        isPaid: paymentInfo?.paymentStatus === "Paid",
        orderStatus: initialStatus,
        trackingHistory: [{ status: initialStatus, note: "Order placed", updatedBy: "system" }],
    });

    // REDUCE STOCK
    for (const item of orderItems) {
        if (mongoose.Types.ObjectId.isValid(item.product)) {
            await decreaseStock(item.product, item.size, item.color, item.quantity, order._id, user.name);
        }
    }

    // CLEAR CART
    if (cart) {
        cart.items = [];
        cart.totalPrice = 0;
        await cart.save();
    }

    // POPULATE ORDER
    const populatedOrder = await getOrderByIdRepository(order._id);

    // EMIT REAL-TIME SOCKET EVENT
    try {
        const io = getIO();
        if (io) io.emit("newOrder", populatedOrder);
    } catch (socketErr) {
        console.error("Socket newOrder error:", socketErr.message);
    }

    // Creates the in-app notification and sends email through the same preference-aware path.
    try {
        await sendNotification({
            userId: user._id,
            title: paymentInfo?.paymentStatus === "Failed" ? "Payment Failed" : "Order Placed",
            message: paymentInfo?.paymentStatus === "Failed"
                ? `Your payment for order ${order._id} failed.`
                : `Your order #${order._id.toString().slice(-6).toUpperCase()} has been placed successfully.`,
            type: paymentInfo?.paymentStatus === "Failed" ? "order_status" : "order_placed",
        });
    } catch (notifErr) {
        console.error("Order notification failed:", notifErr.message);
    }

    // ADMIN NOTIFICATION
    if (paymentInfo?.paymentStatus === "Failed") {
        notifyAdmins({
            title: "Payment Failed",
            message: `Payment failed for order #${order._id.toString().slice(-6).toUpperCase()} ($${totalPrice.toFixed(2)})`,
            type: "payment_failed",
        }).catch(err => console.error("Payment failed admin notification:", err.message));
    } else {
        notifyAdmins({
            title: "New Order",
            message: `New order #${order._id.toString().slice(-6).toUpperCase()} by ${user.name} — $${totalPrice.toFixed(2)}`,
            type: "new_order",
        }).catch(err => console.error("New order admin notification:", err.message));
    }

    // AUTOMATICALLY GENERATE INVOICE
    try {
        const invoiceNumber = `INV-${Date.now()}`;
        const invoice = await Invoice.create({
            user: user._id,
            order: order._id,
            invoiceNumber,
            totalAmount: totalPrice
        });

        const invoicesDir = path.join(process.cwd(), "src", "invoices");
        if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir, { recursive: true });
        }
        const invoicePath = path.join(invoicesDir, `${invoiceNumber}.pdf`);

        const populatedInvoice = await Invoice.findById(invoice._id)
            .populate({
                path: "order",
                populate: { path: "user", select: "name email" }
            })
            .populate("user");
        
        await generateInvoice(populatedInvoice, invoicePath);
    } catch (invoiceErr) {
        console.error("Auto invoice generation failed:", invoiceErr.message);
    }

    return order;
};

/*
==============================
GET MY ORDERS SERVICE
==============================
*/
const getMyOrdersService = async (userId) => {
    return await getUserOrdersRepository(userId);
};

/*
==============================
GET SINGLE ORDER SERVICE
==============================
*/
const getSingleOrderService = async (orderId, requestingUser) => {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new Error("Invalid order ID");
    }

    const order = await getOrderByIdRepository(orderId);

    if (!order) throw new Error("Order not found");

    // Ownership check (admins bypass)
    if (requestingUser && !requestingUser.isAdmin && requestingUser.role !== "admin") {
        const orderUserId = order.user?._id?.toString() || order.user?.toString();
        if (orderUserId !== requestingUser._id.toString()) {
            throw new Error("Not authorized to view this order");
        }
    }

    return order;
};

/*
==============================
GET ALL ORDERS SERVICE (admin)
==============================
*/
const getAllOrdersService = async (queryParams = {}) => {
    const { page = 1, limit = 10, status, search, sortBy, sortOrder } = queryParams;

    const result = await getAllOrdersRepository({
        page: Number(page),
        limit: Number(limit),
        status,
        search,
        sortBy: sortBy || "createdAt",
        sortOrder: sortOrder || "desc",
    });

    const totalAmount = result.orders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);

    return {
        orders: result.orders,
        total: result.total,
        page: result.page,
        pages: Math.ceil(result.total / result.limit),
        totalAmount,
    };
};

/*
==============================
UPDATE ORDER STATUS SERVICE (admin)
==============================
*/
const updateOrderStatusService = async (orderId, status, extras = {}, adminUser = null) => {
    const order = await getOrderByIdRepository(orderId);
    if (!order) throw new Error("Order not found");

    // Validate status transition
    if (!isValidTransition(order.orderStatus, status)) {
        throw new Error(
            `Cannot transition from "${order.orderStatus}" to "${status}". Invalid status transition.`
        );
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = status;

    // Status-specific logic
    if (status === "Delivered") {
        order.deliveredAt = new Date();
        order.isPaid = true;
        if (order.paymentInfo) {
            order.paymentInfo.paymentStatus = "Paid";
            order.paymentInfo.paidAt = new Date();
        }
    }

    if (status === "Refunded") {
        order.refundedAt = new Date();
        if (order.paymentInfo) {
            order.paymentInfo.paymentStatus = "Refunded";
        }
    }

    if (status === "Cancelled") {
        order.cancelledAt = new Date();
        if (!order.cancellation) order.cancellation = {};
        order.cancellation.cancelledBy = adminUser ? "admin" : "system";
        order.cancellation.cancelledAt = new Date();
        if (extras.cancellationReason) {
            order.cancellation.reason = extras.cancellationReason;
        }
        // Restore inventory
        await restoreInventory(order.orderItems);
    }

    // Courier details for Shipped status
    if (extras.courierName !== undefined) order.courierName = extras.courierName;
    if (extras.trackingNumber !== undefined) order.trackingNumber = extras.trackingNumber;
    if (extras.estimatedDelivery !== undefined) order.estimatedDelivery = extras.estimatedDelivery;

    // Log tracking history
    const note = extras.note || `Status updated to ${status}`;
    pushTrackingHistory(order, status, note, adminUser ? "admin" : "system");

    await order.save();

    // SEND NOTIFICATIONS
    const notifyStatuses = ["Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Refunded"];
    if (notifyStatuses.includes(status)) {
        // In-app notification and preference-aware email
        try {
            await sendNotification({
                userId: order.user._id,
                title: `Order ${status}`,
                message: `Your order #${order._id.toString().slice(-6).toUpperCase()} status is now "${status}".`,
                type: "order_status",
            });
        } catch (err) {
            console.error("Notification failed:", err.message);
        }

        // Web Push
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
            console.error("Push send error:", err.message);
        }
    }

    // SOCKET EVENT
    try {
        const io = getIO();
        if (io) {
            io.to(order.user._id.toString()).emit("orderStatusUpdated", {
                orderId: order._id,
                status: order.orderStatus,
                deliveredAt: order.deliveredAt,
                courierName: order.courierName,
                trackingNumber: order.trackingNumber,
                estimatedDelivery: order.estimatedDelivery,
                trackingHistory: order.trackingHistory,
            });
        }
    } catch (socketErr) {
        console.error("Socket emit error:", socketErr.message);
    }

    // Regenerate invoice PDF (non-blocking — never fail the status update)
    triggerInvoiceRegeneration(order._id).catch(err =>
        console.error("Invoice regen failed (status update):", err.message)
    );

    return order;
};

/*
==============================
CANCEL ORDER SERVICE (USER)
==============================
*/
const cancelOrderService = async (orderId, user, reason = "") => {
    const order = await getOrderByIdRepository(orderId);
    if (!order) throw new Error("Order not found");

    // Ownership check
    const orderUserId = order.user?._id?.toString() || order.user?.toString();
    if (orderUserId !== user._id.toString()) {
        throw new Error("Not authorized to cancel this order");
    }

    // Only Pending and Confirmed can be cancelled by user
    if (!["Pending", "Confirmed"].includes(order.orderStatus)) {
        throw new Error("Order can only be cancelled when Pending or Confirmed");
    }

    order.orderStatus = "Cancelled";
    order.cancelledAt = new Date();
    order.cancellation = {
        reason: reason || "Not specified",
        cancelledBy: "user",
        cancelledAt: new Date(),
    };

    pushTrackingHistory(order, "Cancelled", `Cancelled by customer. Reason: ${reason || "Not specified"}`, "user");

    // Restore inventory
    await restoreInventory(order.orderItems);

    await order.save();

    // Notify user
    try {
        await sendNotification({
            userId: user._id,
            title: "Order Cancelled",
            message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been successfully cancelled.`,
            type: "order_status",
        });
    } catch (err) {
        console.error("Cancel notification failed:", err.message);
    }

    // Socket event
    try {
        const io = getIO();
        if (io) {
            io.to(user._id.toString()).emit("orderStatusUpdated", {
                orderId: order._id,
                status: "Cancelled",
                trackingHistory: order.trackingHistory,
            });
        }
    } catch (err) {
        console.error("Socket cancel error:", err.message);
    }

    // Regenerate invoice PDF (non-blocking)
    triggerInvoiceRegeneration(order._id).catch(err =>
        console.error("Invoice regen failed (user cancel):", err.message)
    );

    return order;
};

/*
==============================
ADMIN CANCEL ORDER SERVICE
==============================
*/
const adminCancelOrderService = async (orderId, reason = "", adminUser = null) => {
    const order = await getOrderByIdRepository(orderId);
    if (!order) throw new Error("Order not found");

    if (["Delivered", "Cancelled", "Refunded"].includes(order.orderStatus)) {
        throw new Error(`Cannot cancel an order with status "${order.orderStatus}".`);
    }

    order.orderStatus = "Cancelled";
    order.cancelledAt = new Date();
    order.cancellation = {
        reason: reason || "Cancelled by admin",
        cancelledBy: "admin",
        cancelledAt: new Date(),
    };

    pushTrackingHistory(order, "Cancelled", `Cancelled by admin. Reason: ${reason || "Admin decision"}`, "admin");

    // Restore inventory
    await restoreInventory(order.orderItems);

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
        console.error("Admin cancel notification failed:", err.message);
    }

    // Socket event
    try {
        const io = getIO();
        if (io) {
            io.to(order.user._id.toString()).emit("orderStatusUpdated", {
                orderId: order._id,
                status: "Cancelled",
                trackingHistory: order.trackingHistory,
            });
        }
    } catch (err) {
        console.error("Socket admin cancel error:", err.message);
    }

    // Regenerate invoice PDF (non-blocking)
    triggerInvoiceRegeneration(order._id).catch(err =>
        console.error("Invoice regen failed (admin cancel):", err.message)
    );

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
    order.refundedAt = new Date();
    if (order.paymentInfo) order.paymentInfo.paymentStatus = "Refunded";

    pushTrackingHistory(order, "Refunded", "Refund initiated by admin", "admin");

    await order.save();

    // Notify customer
    try {
        await sendNotification({
            userId: order.user._id,
            title: "Refund Initiated",
            message: `A refund for your order #${order._id.toString().slice(-6).toUpperCase()} has been initiated.`,
            type: "refund_update",
        });
    } catch (err) {
        console.error("Refund notification failed:", err.message);
    }

    // Socket event
    try {
        const io = getIO();
        if (io) {
            io.to(order.user._id.toString()).emit("orderStatusUpdated", {
                orderId: order._id,
                status: "Refunded",
                trackingHistory: order.trackingHistory,
            });
        }
    } catch (err) {
        console.error("Socket refund error:", err.message);
    }

    // Regenerate invoice PDF (non-blocking)
    triggerInvoiceRegeneration(order._id).catch(err =>
        console.error("Invoice regen failed (refund):", err.message)
    );

    return order;
};

/*
==============================
APPROVE RETURN SERVICE (ADMIN)
==============================
*/
const approveReturnService = async (orderId, adminUser) => {
    const order = await getOrderByIdRepository(orderId);
    if (!order) throw new Error("Order not found");

    if (!order.returnInfo?.requestId) {
        throw new Error("No return request found for this order.");
    }

    // Update return request
    const returnReq = await ReturnRequest.findById(order.returnInfo.requestId);
    if (returnReq) {
        returnReq.status = "Approved";
        returnReq.resolvedAt = new Date();
        returnReq.resolvedBy = adminUser._id;
        await returnReq.save();
    }

    // Update order return info
    order.returnInfo.status = "Approved";
    order.returnInfo.resolvedAt = new Date();
    pushTrackingHistory(order, "Return Approved", "Return request approved by admin", "admin");

    // Restore inventory
    await restoreInventory(order.orderItems, `Return Approved (Order #${order._id})`);

    await order.save();

    // Notify customer
    try {
        await sendNotification({
            userId: order.user._id,
            title: "Return Approved",
            message: `Your return request for order #${order._id.toString().slice(-6).toUpperCase()} has been approved.`,
            type: "order_status",
        });
    } catch (err) {
        console.error("Return approval notification failed:", err.message);
    }

    return order;
};

/*
==============================
REJECT RETURN SERVICE (ADMIN)
==============================
*/
const rejectReturnService = async (orderId, adminNotes, adminUser) => {
    const order = await getOrderByIdRepository(orderId);
    if (!order) throw new Error("Order not found");

    if (!order.returnInfo?.requestId) {
        throw new Error("No return request found for this order.");
    }

    // Update return request
    const returnReq = await ReturnRequest.findById(order.returnInfo.requestId);
    if (returnReq) {
        returnReq.status = "Rejected";
        returnReq.resolvedAt = new Date();
        returnReq.resolvedBy = adminUser._id;
        returnReq.adminNotes = adminNotes || "Return request rejected";
        await returnReq.save();
    }

    // Update order return info
    order.returnInfo.status = "Rejected";
    order.returnInfo.resolvedAt = new Date();
    pushTrackingHistory(order, "Return Rejected", `Return request rejected by admin. Notes: ${adminNotes || "N/A"}`, "admin");

    await order.save();

    // Notify customer
    try {
        await sendNotification({
            userId: order.user._id,
            title: "Return Rejected",
            message: `Your return request for order #${order._id.toString().slice(-6).toUpperCase()} has been rejected.`,
            type: "order_status",
        });
    } catch (err) {
        console.error("Return rejection notification failed:", err.message);
    }

    return order;
};

/*
==============================
RESTORE INVENTORY HELPER
==============================
*/
const restoreInventory = async (orderItems, reason = "Order Cancelled") => {
    if (!orderItems || orderItems.length === 0) return;
    for (const item of orderItems) {
        try {
            if (item.product && mongoose.Types.ObjectId.isValid(item.product)) {
                await increaseStock(item.product, item.size, item.color, item.quantity, reason);
            }
        } catch (err) {
            console.error(`Inventory restore error for product ${item.product}:`, err.message);
        }
    }
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
    approveReturnService,
    rejectReturnService,
};
