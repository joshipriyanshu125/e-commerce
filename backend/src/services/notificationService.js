import Notification from "../models/notificationModel.js";
import NotificationPreference from "../models/notificationPreferenceModel.js";
import { getIO } from "../config/socket.js";
import User from "../models/userModel.js";
import { sendEmail } from "./emailService.js";

const EMAIL_PREFERENCE_BY_TYPE = {
    order: "orderUpdates",
    order_status: "orderUpdates",
    order_placed: "orderUpdates",
    payment: "orderUpdates",
    payment_failed: "orderUpdates",
    shipping: "deliveryUpdates",
    shipping_update: "deliveryUpdates",
    delivery: "deliveryUpdates",
    return: "returnRefundUpdates",
    return_update: "returnRefundUpdates",
    refund: "returnRefundUpdates",
    refund_update: "returnRefundUpdates",
    wishlist: "wishlistAlerts",
    wishlist_alert: "wishlistAlerts",
    price_drop: "priceDropAlerts",
    back_in_stock: "backInStockAlerts",
    promotion: "promotions",
    marketing: "promotions",
    security: "securityAlerts",
    security_alert: "securityAlerts",
};

const escapeHtml = (value) => String(value || "").replace(/[&<>'\"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[character]));

const notificationEmailHtml = ({ title, message, link }) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:28px;color:#1a1a1a">
        <h1 style="font-size:22px;margin:0 0 16px">${escapeHtml(title)}</h1>
        <p style="font-size:16px;line-height:1.55">${escapeHtml(message)}</p>
        ${link ? `<p><a href="${escapeHtml(`${process.env.FRONTEND_URL || "http://localhost:5173"}${link}`)}">View details</a></p>` : ""}
    </div>`;

const isEmailEnabled = (preferences, preferenceKey) => {
    if (!preferences || preferences.allEmailsOptedOut) return false;
    if (!preferenceKey) return false;
    if (preferenceKey === "promotions" && preferences.marketingOptedOut) return false;
    // Older documents used these names; retain their choices after the UI rename.
    const legacyKey = { promotions: "promotionalEmails", newArrivals: "newArrivalEmails", newsletter: "weeklyNewsletter" }[preferenceKey];
    return preferences.email?.[preferenceKey] !== false && (!legacyKey || preferences.email?.[legacyKey] !== false);
};

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
        let prefs = null;
        const prefKey = EMAIL_PREFERENCE_BY_TYPE[type];
        let inAppAllowed = true;

        // Check user's in-app notification preferences for this type
        try {
            prefs = await NotificationPreference.getOrCreate(userId);
            if (prefs) {
                if (prefKey && prefs.inApp[prefKey] === false) {
                    inAppAllowed = false;
                }
            }
        } catch (prefError) {
            // If preference check fails, proceed anyway
            console.error("Preference check failed:", prefError.message);
        }

        // Save only the in-app channel when it is enabled. Email preferences are
        // intentionally evaluated independently below.
        const notification = inAppAllowed ? await Notification.create({
            user: userId,
            title,
            message,
            type,
            link,
            image,
            metadata,
        }) : null;

        // Email is deliberately non-fatal: in-app notifications are still saved even
        // when the provider is temporarily unavailable, while EmailLog records failures.
        if (isEmailEnabled(prefs, prefKey)) {
            try {
                const user = await User.findById(userId).select("email");
                if (!user?.email) throw new Error("Notification recipient has no email address.");
                const emailResult = await sendEmail({
                    to: user.email,
                    subject: title,
                    html: notificationEmailHtml({ title, message, link }),
                    text: `${title}\n\n${message}`,
                    template: "notification",
                    userId,
                    metadata: { notificationId: notification?._id || null, type, link },
                });
                if (!emailResult.success) throw new Error(emailResult.error || "Email provider rejected the message.");
                if (notification) {
                    notification.sentViaEmail = true;
                    await notification.save();
                }
            } catch (emailError) {
                console.error("Notification email failed:", emailError.message);
            }
        }

        // Emit notification through Socket.IO
        if (notification) try {
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
        type: "order_status",
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
        type: "order_status",
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
        type: "return_update",
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
        type: "refund_update",
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
        type: "order_status",
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
