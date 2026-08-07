import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    getPreferences,
    updatePreferences,
    unsubscribeAll,
} from "../controllers/notificationController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Notification CRUD
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/:id/read", markAsRead);
router.put("/mark-all-read", markAllAsRead);
router.delete("/:id", deleteNotification);
router.delete("/clear-read", clearReadNotifications);

// Notification preferences
router.get("/settings", getPreferences);
router.put("/settings", updatePreferences);

// Unsubscribe (public, via token)
router.get("/unsubscribe/:token", unsubscribeAll);

export default router;