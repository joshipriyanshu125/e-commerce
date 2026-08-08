import Notification from "../models/notificationModel.js";
import NotificationPreference from "../models/notificationPreferenceModel.js";
import { getIO } from "../config/socket.js";

/*
==================================================
GET USER NOTIFICATIONS
==================================================
*/
const ADMIN_TYPES = [
    "new_order",
    "new_user",
    "payment_failed",
    "return_requested",
    "refund_requested",
    "low_inventory",
    "out_of_stock",
    "coupon_expired",
    "negative_review",
    "admin"
];

export const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, read, view } = req.query;
        const filter = {
            user: req.user._id,
            deletedAt: null,
        };

        if (view === "admin") {
            filter.type = { $in: ADMIN_TYPES };
        } else if (view === "user") {
            filter.type = { $nin: ADMIN_TYPES };
        }

        if (type && type !== "all") filter.type = type;
        if (read === "true") filter.read = true;
        if (read === "false") filter.read = false;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(filter);
        
        const unreadFilter = {
            user: req.user._id,
            read: false,
            deletedAt: null,
        };
        if (view === "admin") {
            unreadFilter.type = { $in: ADMIN_TYPES };
        } else if (view === "user") {
            unreadFilter.type = { $nin: ADMIN_TYPES };
        }
        const unreadCount = await Notification.countDocuments(unreadFilter);

        res.json({
            success: true,
            notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
            unreadCount,
        });
    } catch (error) {
        console.error("Get notifications error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
        });
    }
};

/*
==================================================
GET UNREAD NOTIFICATION COUNT
==================================================
*/
export const getUnreadCount = async (req, res) => {
    try {
        const { view } = req.query;
        const filter = {
            user: req.user._id,
            read: false,
            deletedAt: null,
        };

        if (view === "admin") {
            filter.type = { $in: ADMIN_TYPES };
        } else if (view === "user") {
            filter.type = { $nin: ADMIN_TYPES };
        }

        const count = await Notification.countDocuments(filter);

        res.json({
            success: true,
            count,
        });
    } catch (error) {
        console.error("Get unread count error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch unread count",
        });
    }
};

/*
==================================================
MARK NOTIFICATION AS READ
==================================================
*/
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user._id,
            },
            { read: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        // Emit socket event to update unread count
        try {
            const io = getIO();
            if (io) {
                const unreadCountUser = await Notification.countDocuments({
                    user: req.user._id,
                    read: false,
                    deletedAt: null,
                    type: { $nin: ADMIN_TYPES }
                });
                const unreadCountAdmin = await Notification.countDocuments({
                    user: req.user._id,
                    read: false,
                    deletedAt: null,
                    type: { $in: ADMIN_TYPES }
                });
                io.to(req.user._id.toString()).emit("unreadCountUser", unreadCountUser);
                io.to(req.user._id.toString()).emit("unreadCountAdmin", unreadCountAdmin);
            }
        } catch (socketError) {
            console.error("Socket emit error:", socketError.message);
        }

        res.json({
            success: true,
            notification,
        });
    } catch (error) {
        console.error("Mark as read error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to mark notification as read",
        });
    }
};

/*
==================================================
MARK ALL NOTIFICATIONS AS READ
==================================================
*/
export const markAllAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            {
                user: req.user._id,
                read: false,
                deletedAt: null,
            },
            { read: true, readAt: new Date() }
        );

        // Emit socket event
        try {
            const io = getIO();
            if (io) {
                io.to(req.user._id.toString()).emit("unreadCount", 0);
                io.to(req.user._id.toString()).emit("unreadCountUser", 0);
                io.to(req.user._id.toString()).emit("unreadCountAdmin", 0);
                io.to(req.user._id.toString()).emit("notificationsUpdated");
            }
        } catch (socketError) {
            console.error("Socket emit error:", socketError.message);
        }

        res.json({
            success: true,
            message: "All notifications marked as read",
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error("Mark all as read error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to mark all notifications as read",
        });
    }
};

/*
==================================================
DELETE NOTIFICATION
==================================================
*/
export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user._id,
            },
            { deletedAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        res.json({
            success: true,
            message: "Notification deleted",
        });
    } catch (error) {
        console.error("Delete notification error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to delete notification",
        });
    }
};

/*
==================================================
CLEAR ALL READ NOTIFICATIONS
==================================================
*/
export const clearReadNotifications = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            {
                user: req.user._id,
                read: true,
                deletedAt: null,
            },
            { deletedAt: new Date() }
        );

        res.json({
            success: true,
            message: "Read notifications cleared",
            deletedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error("Clear read notifications error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to clear read notifications",
        });
    }
};

/*
==================================================
GET NOTIFICATION PREFERENCES
==================================================
*/
export const getPreferences = async (req, res) => {
    try {
        const preferences = await NotificationPreference.getOrCreate(
            req.user._id
        );

        res.json({
            success: true,
            preferences,
        });
    } catch (error) {
        console.error("Get preferences error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch notification preferences",
        });
    }
};

/*
==================================================
UPDATE NOTIFICATION PREFERENCES
==================================================
*/
export const updatePreferences = async (req, res) => {
    try {
        const { email, inApp, push, sms, allEmailsOptedOut, marketingOptedOut } =
            req.body;

        let preferences = await NotificationPreference.getOrCreate(
            req.user._id
        );

        // Update email preferences
        if (email) {
            Object.keys(email).forEach((key) => {
                if (preferences.email[key] !== undefined) {
                    preferences.email[key] = email[key];
                }
            });
        }

        // Update in-app preferences
        if (inApp) {
            Object.keys(inApp).forEach((key) => {
                if (preferences.inApp[key] !== undefined) {
                    preferences.inApp[key] = inApp[key];
                }
            });
        }

        // Update push preferences
        if (push) {
            Object.keys(push).forEach((key) => {
                if (preferences.push[key] !== undefined) {
                    preferences.push[key] = push[key];
                }
            });
        }

        // Update SMS preferences
        if (sms) {
            Object.keys(sms).forEach((key) => {
                if (preferences.sms[key] !== undefined) {
                    preferences.sms[key] = sms[key];
                }
            });
        }

        // Global opt-outs
        if (allEmailsOptedOut !== undefined)
            preferences.allEmailsOptedOut = allEmailsOptedOut;
        if (marketingOptedOut !== undefined)
            preferences.marketingOptedOut = marketingOptedOut;

        await preferences.save();

        res.json({
            success: true,
            message: "Notification preferences updated",
            preferences,
        });
    } catch (error) {
        console.error("Update preferences error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to update notification preferences",
        });
    }
};

/*
==================================================
UNSUBSCRIBE ALL EMAILS
==================================================
*/
export const unsubscribeAll = async (req, res) => {
    try {
        const { token } = req.params;
        const preferences = await NotificationPreference.findOne({
            unsubscribeToken: token,
        });

        if (!preferences) {
            return res.status(404).json({
                success: false,
                message: "Invalid unsubscribe token",
            });
        }

        preferences.allEmailsOptedOut = true;
        await preferences.save();

        res.json({
            success: true,
            message: "You have been unsubscribed from all emails",
        });
    } catch (error) {
        console.error("Unsubscribe error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to unsubscribe",
        });
    }
};