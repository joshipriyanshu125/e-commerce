import Notification from "../models/notificationModel.js";

/*
==================================================
GET NOTIFICATIONS (with optional filter by type)
==================================================
*/
export const getNotifications = async (req, res) => {
    try {
        const filter = { user: req.user._id };

        // Optional type filter from query string
        if (req.query.type && req.query.type !== "all") {
            filter.type = req.query.type;
        }

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json({
            success: true,
            notifications,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
==================================================
GET UNREAD COUNT
==================================================
*/
export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            user: req.user._id,
            read: false,
        });

        res.status(200).json({
            success: true,
            unreadCount: count,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
==================================================
MARK SINGLE NOTIFICATION AS READ
==================================================
*/
export const markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        // Only the owner can mark it
        if (notification.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized",
            });
        }

        notification.read = true;
        await notification.save();

        res.status(200).json({
            success: true,
            notification,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
==================================================
MARK ALL NOTIFICATIONS AS READ
==================================================
*/
export const markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, read: false },
            { $set: { read: true } }
        );

        res.status(200).json({
            success: true,
            message: "All notifications marked as read",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
==================================================
DELETE A SINGLE NOTIFICATION
==================================================
*/
export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        if (notification.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized",
            });
        }

        await notification.deleteOne();

        res.status(200).json({
            success: true,
            message: "Notification deleted",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
==================================================
DELETE ALL READ NOTIFICATIONS (CLEAR)
==================================================
*/
export const clearReadNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({
            user: req.user._id,
            read: true,
        });

        res.status(200).json({
            success: true,
            message: "All read notifications cleared",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};