import express from "express";

import {
    getAdminAnalytics
} from "../controllers/adminAnalyticsController.js";

import {
    protect,
    admin
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/",
    protect,
    admin,
    getAdminAnalytics
);

export default router;