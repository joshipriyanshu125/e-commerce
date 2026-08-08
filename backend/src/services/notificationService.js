import Notification from "../models/notificationModel.js";
import NotificationPreference from "../models/notificationPreferenceModel.js";
import { getIO } from "../config/socket.js";

/*
==================================================
SEND NOTIFICATION
==================================================
*/
const sendNotification = async ({
    userId,
    title,
    message,
    type = "general",
    link = null,
    image = null,
    metadata = {},
}) => {
    try {
        // Check user's in-app notification preferences for this type
        try {
            const prefs = await NotificationPreference.findOne({ user: userId });
            if (prefs) {
                const typeToPref = {
                    order: "orderUpdates",
                    payment: "orderUpdates",
                    shipping: "deliveryUpdates",
                    delivery: "deliveryUpdates",
                    return: "returnRefundUpdates",
                    refund: "returnRefundUpdates",
                    wishlist: "wishlistAlerts",
                    price_drop: "priceDropAlerts",
                    back_in_stock: "backInStockAlerts",
                    promotion: "promotions",
                    marketing: "promotions",
                    security: "securityAlerts",
                    admin: "securityAlerts",
                };
                const prefKey = typeToPref[type];
                if (prefKey && prefs.inApp[prefKey] === false) {
                    return null; // User opted out of this type
                }
            }
        } catch (prefError) {
            // If preference check fails, proceed anyway
            console.error("Preference check failed:", prefError.message);
        }

        // Save notification to database
        const notification = await Notification.create({
            user: userId,
            title,
            message,
            type,
            link,
            image,
            metadata,
        });

        // Emit notification through Socket.IO
        try {
            const io = getIO();
            if (io) {
                io.to(userId.toString()).emit("newNotification", notification);

                // Get updated unread counts
                const adminTypes = ["new_order", "new_user", "payment_failed", "return_requested", "refund_requested", "low_inventory", "out_of_stock", "coupon_expired", "negative_review", "admin"];
                const unreadCountUser = await Notification.countDocuments({
                    user: userId,
                    read: false,
                    deletedAt: null,
                    type: { $nin: adminTypes }
                });
                const unreadCountAdmin = await Notification.countDocuments({
                    user: userId,
                    read: false,
                    deletedAt: null,
                    type: { $in: adminTypes }
                });
                io.to(userId.toString()).emit("unreadCountUser", unreadCountUser);
                io.to(userId.toString()).emit("unreadCountAdmin", unreadCountAdmin);
            }
        } catch (socketError) {
            console.error("Socket Notification Error:", socketError.message);
        }

        return notification;
    } catch (error) {
        console.error("Notification Service Error:", error.message);
        throw error;
    }
};

/*
==================================================
NOTIFY ALL ADMINS
==================================================
*/
const notifyAdmins = async ({ title, message, type = "general", link = null, metadata = {} }) => {
    try {
        const User = (await import("../models/userModel.js")).default;
        const admins = await User.find({ role: "admin" });
        const results = [];
        for (const admin of admins) {
            const notif = await sendNotification({
                userId: admin._id,
                title,
                message,
                type,
                link,
                metadata,
            });
            if (notif) results.push(notif);
        }
        try {
            const io = getIO();
            if (io) {
                io.emit("adminNotification", { title, message, type, createdAt: new Date() });
            }
        } catch (socketErr) {
            console.error("Socket adminNotification Error:", socketErr.message);
        }
        return results;
    } catch (error) {
        console.error("Failed to notify admins:", error.message);
    }
};

/*
==================================================
AUTOMATION: NEW USER REGISTRATION
==================================================
*/
const notifyNewUserRegistration = async (user) => {
    await notifyAdmins({
        title: "New User Registered",
        message: `${user.name} (${user.email}) has joined the platform.`,
        type: "admin",
        link: `/admin/users/${user._id}`,
        metadata: { userId: user._id },
    });
};

/*
==================================================
AUTOMATION: NEW ORDER
==================================================
*/
const notifyNewOrder = async (order) => {
    await sendNotification({
        userId: order.user,
        title: "Order Placed Successfully",
        message: `Your order #${order.orderId || order._id} has been placed successfully.`,
        type: "order",
        link: `/orders/${order._id}`,
        metadata: { orderId: order._id },
    });

    await notifyAdmins({
        title: "New Order Placed",
        message: `Order #${order.orderId || order._id} worth $${order.totalAmount?.toFixed(2) || "0.00"} was placed.`,
        type: "order",
        link: `/admin/orders/${order._id}`,
        metadata: { orderId: order._id, amount: order.totalAmount },
    });
};

/*
==================================================
AUTOMATION: PAYMENT FAILED
==================================================
*/
const notifyPaymentFailed = async (order) => {
    await sendNotification({
        userId: order.user,
        title: "Payment Failed",
        message: `Payment for order #${order.orderId || order._id} has failed. Please try again.`,
        type: "payment",
        link: `/orders/${order._id}`,
        metadata: { orderId: order._id },
    });

    await notifyAdmins({
        title: "Payment Failed",
        message: `Payment failed for order #${order.orderId || order._id}.`,
        type: "payment",
        link: `/admin/orders/${order._id}`,
        metadata: { orderId: order._id },
    });
};

/*
==================================================
AUTOMATION: RETURN REQUESTED
==================================================
*/
const notifyReturnRequested = async (returnRequest) => {
    await sendNotification({
        userId: returnRequest.user,
        title: "Return Request Received",
        message: `Your return request for order #${returnRequest.order?.orderId || returnRequest.order} has been received.`,
        type: "return",
        link: `/returns/${returnRequest._id}`,
        metadata: { returnId: returnRequest._id },
    });

    await notifyAdmins({
        title: "Return Requested",
        message: `A return request has been submitted for order #${returnRequest.order?.orderId || returnRequest.order}.`,
        type: "return",
        link: `/admin/returns/${returnRequest._id}`,
        metadata: { returnId: returnRequest._id },
    });
};

/*
==================================================
AUTOMATION: REFUND REQUESTED
==================================================
*/
const notifyRefundInitiated = async (returnRequest) => {
    await sendNotification({
        userId: returnRequest.user,
        title: "Refund Initiated",
        message: `Your refund for order #${returnRequest.order?.orderId || returnRequest.order} has been initiated.`,
        type: "refund",
        link: `/returns/${returnRequest._id}`,
        metadata: { returnId: returnRequest._id },
    });

    await notifyAdmins({
        title: "Refund Requested",
        message: `A refund has been initiated for order #${returnRequest.order?.orderId || returnRequest.order}.`,
        type: "refund",
        link: `/admin/returns/${returnRequest._id}`,
        metadata: { returnId: returnRequest._id },
    });
};

/*
==================================================
AUTOMATION: LOW INVENTORY / OUT OF STOCK
==================================================
*/
const notifyLowInventory = async (product) => {
    await notifyAdmins({
        title: "Low Inventory Alert",
        message: `${product.name} has only ${product.stock} units left in stock.`,
        type: "admin",
        link: `/admin/products/${product._id}`,
        metadata: { productId: product._id, stock: product.stock },
    });
};

const notifyOutOfStock = async (product) => {
    await notifyAdmins({
        title: "Product Out of Stock",
        message: `${product.name} is now out of stock.`,
        type: "admin",
        link: `/admin/products/${product._id}`,
        metadata: { productId: product._id },
    });
};

/*
==================================================
AUTOMATION: COUPON EXPIRED
==================================================
*/
const notifyCouponExpired = async (coupon) => {
    await notifyAdmins({
        title: "Coupon Expired",
        message: `Coupon ${coupon.code} has expired.`,
        type: "admin",
        link: `/admin/coupons/${coupon._id}`,
        metadata: { couponId: coupon._id, code: coupon.code },
    });
};

/*
==================================================
AUTOMATION: NEGATIVE REVIEW
==================================================
*/
const notifyNegativeReview = async (review) => {
    await notifyAdmins({
        title: "Negative Review Received",
        message: `A ${review.rating}-star review was left for ${review.product?.name || "a product"}.`,
        type: "admin",
        link: `/admin/reviews/${review._id}`,
        metadata: { reviewId: review._id, rating: review.rating },
    });
};

/*
==================================================
AUTOMATION: ORDER STATUS UPDATES
==================================================
*/
const notifyOrderStatusUpdate = async (order, status) => {
    const statusMessages = {
        confirmed: "Your order has been confirmed.",
        packed: "Your order has been packed and is ready for shipping.",
        shipped: "Your order has been shipped!",
        out_for_delivery: "Your order is out for delivery!",
        delivered: "Your order has been delivered. Enjoy!",
        cancelled: "Your order has been cancelled.",
    };

    const message = statusMessages[status] || `Your order status has been updated to: ${status}`;

    await sendNotification({
        userId: order.user,
        title: `Order ${status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")}`,
        message,
        type: "order",
        link: `/orders/${order._id}`,
        metadata: { orderId: order._id, status },
    });
};

/*
==================================================
EXPORT
==================================================
*/
export {
    sendNotification,
    notifyAdmins,
    notifyNewUserRegistration,
    notifyNewOrder,
    notifyPaymentFailed,
    notifyReturnRequested,
    notifyRefundInitiated,
    notifyLowInventory,
    notifyOutOfStock,
    notifyCouponExpired,
    notifyNegativeReview,
    notifyOrderStatusUpdate,
};