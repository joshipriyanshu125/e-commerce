import express from "express";

import {
    getNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearReadNotifications,
} from "../controllers/notificationController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all notifications (with optional ?type= filter)
router.get("/", protect, getNotifications);

// GET unread count (lightweight endpoint for polling)
router.get("/unread-count", protect, getUnreadCount);

// PUT mark single as read
router.put("/:id/read", protect, markNotificationRead);

// PUT mark all as read
router.put("/mark-all-read", protect, markAllNotificationsRead);

// DELETE single notification
router.delete("/:id", protect, deleteNotification);

// DELETE all read notifications
router.delete("/clear-read", protect, clearReadNotifications);

export default router;