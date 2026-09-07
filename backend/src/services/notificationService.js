import Notification from "../models/notificationModel.js";
import NotificationPreference from "../models/notificationPreferenceModel.js";
import { getIO } from "../config/socket.js";
import User from "../models/userModel.js";
import PushSubscription from "../models/pushSubscriptionModel.js";
import { sendEmail } from "./emailService.js";
import { sendWebPush } from "../utils/webPush.js";

const EMAIL_PREFERENCE_BY_TYPE = {
    order: "orderUpdates",
    new_order: "orderUpdates",
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

const PUSH_PREFERENCE_BY_TYPE = {
    order: "orderUpdates",
    new_order: "orderUpdates",
    order_status: "orderUpdates",
    order_placed: "orderUpdates",
    payment: "orderUpdates",
    payment_failed: "orderUpdates",
    shipping: "deliveryUpdates",
    shipping_update: "deliveryUpdates",
    delivery: "deliveryUpdates",
};

const escapeHtml = (value) => String(value || "").replace(/[&<>'\"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[character]));

const BRAND = {
    name: "ATELIER",
    tagline: "Premium Fashion",
    primaryColor: "#f59e0b",
    backgroundColor: "#0f0f1a",
    cardBackground: "#1c1c28",
    textColor: "#ffffff",
    mutedText: "#a0a0b0",
    borderColor: "#2a2a3a",
    website: process.env.FRONTEND_URL || "http://localhost:5173",
};

const notificationEmailHtml = ({ title, message, link }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.backgroundColor}; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: ${BRAND.textColor};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BRAND.backgroundColor}; padding: 30px 10px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: ${BRAND.cardBackground}; border-radius: 16px; border: 1px solid ${BRAND.borderColor}; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 28px 24px 20px; border-bottom: 1px solid ${BRAND.borderColor};">
                            <span style="font-size: 24px; font-weight: 800; letter-spacing: 4px; color: ${BRAND.textColor}; text-transform: uppercase;">${BRAND.name}</span>
                            <br>
                            <span style="font-size: 10px; letter-spacing: 3px; color: ${BRAND.mutedText}; text-transform: uppercase;">${BRAND.tagline}</span>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px 28px;">
                            <h1 style="font-size: 22px; font-weight: 700; color: ${BRAND.textColor}; margin: 0 0 16px;">${escapeHtml(title)}</h1>
                            <p style="font-size: 15px; line-height: 1.6; color: ${BRAND.mutedText}; margin: 0 0 24px;">${escapeHtml(message)}</p>
                            ${link ? `
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0 10px;">
                                <tr>
                                    <td align="center" style="border-radius: 10px; background-color: ${BRAND.primaryColor};">
                                        <a href="${escapeHtml(link.startsWith("http") ? link : `${BRAND.website}${link}`)}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 13px; font-weight: 700; letter-spacing: 1px; color: #000000; text-decoration: none; text-transform: uppercase; border-radius: 10px;">
                                            View Details
                                        </a>
                                    </td>
                                </tr>
                            </table>` : ""}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 20px 24px; border-top: 1px solid ${BRAND.borderColor}; font-size: 12px; color: #777;">
                            <p style="margin: 0;">© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const isEmailEnabled = (preferences, preferenceKey) => {
    if (!preferences || preferences.allEmailsOptedOut) return false;
    if (!preferenceKey) return false;
    if (preferenceKey === "promotions" && preferences.marketingOptedOut) return false;
    // Older documents used these names; retain their choices after the UI rename.
    const legacyKey = { promotions: "promotionalEmails", newArrivals: "newArrivalEmails", newsletter: "weeklyNewsletter" }[preferenceKey];
    return preferences.email?.[preferenceKey] !== false && (!legacyKey || preferences.email?.[legacyKey] !== false);
};

const isPushEnabled = (preferences, preferenceKey, hasSubscription = false) => {
    // Before push preferences existed, the stored browser subscription itself
    // was the user's opt-in. Preserve those registrations during the upgrade.
    if (!preferences?.push?.enabled) return hasSubscription;
    return !preferenceKey || preferences?.push?.[preferenceKey] !== false;
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
                    metadata: {
                        notificationId: notification?._id || null,
                        type,
                        title,
                        message,
                        link,
                        ...metadata,
                    },
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

        // A browser subscription is a separate delivery channel from Socket.IO.
        // Socket.IO only reaches an open app, whereas Web Push reaches a registered
        // service worker while the app is closed.
        const pushPrefKey = PUSH_PREFERENCE_BY_TYPE[type];
        if (notification) {
            try {
                const pushSubscription = await PushSubscription.findOne({ user: userId }).select("subscription");
                if (pushSubscription?.subscription && isPushEnabled(prefs, pushPrefKey, true)) {
                    // Migrate legacy subscriptions, which predate push.enabled.
                    if (prefs && !prefs.push.enabled) {
                        prefs.push.enabled = true;
                        prefs.push.orderUpdates = true;
                        prefs.push.deliveryUpdates = true;
                        await prefs.save();
                    }
                    const delivered = await sendWebPush(pushSubscription.subscription, {
                        title,
                        body: message,
                        url: link || "/notifications",
                        notificationId: notification._id.toString(),
                        type,
                    });
                    if (delivered) {
                        notification.sentViaPush = true;
                        await notification.save();
                    }
                }
            } catch (pushError) {
                // Push delivery is non-fatal; retain the in-app notification.
                console.error("Notification push failed:", pushError.message);
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
    notificationEmailHtml,
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
