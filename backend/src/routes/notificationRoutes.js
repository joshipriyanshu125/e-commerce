import express from "express";

import {
    getNotifications,
    markNotificationRead,
} from "../controllers/notificationController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/",
    protect,
    getNotifications
);

router.put(
    "/:id/read",
    protect,
    markNotificationRead
);

// Web push subscribe/unsubscribe are now separate under /api/push

export default router;