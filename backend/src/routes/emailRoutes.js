import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
    sendNewsletter,
    sendPromotion,
    sendCouponEmail,
    getEmailLogs,
    getEmailAnalytics,
    createCampaign,
    getCampaigns,
    sendCampaign,
    sendTestCampaign,
    trackOpen,
    trackClick,
} from "../controllers/emailController.js";

const router = express.Router();

// Public tracking routes (no auth needed)
router.get("/track/open/:trackingId", trackOpen);
router.get("/track/click/:trackingId", trackClick);

// All admin routes require authentication + admin role
router.use(protect, admin);

// Newsletter
router.post("/send-newsletter", sendNewsletter);

// Promotions
router.post("/send-promotion", sendPromotion);
router.post("/send-coupon", sendCouponEmail);

// Logs & Analytics
router.get("/logs", getEmailLogs);
router.get("/analytics", getEmailAnalytics);

// Campaigns
router.post("/campaigns", createCampaign);
router.get("/campaigns", getCampaigns);
router.post("/campaigns/:id/send", sendCampaign);
router.post("/campaigns/:id/test", sendTestCampaign);

export default router;