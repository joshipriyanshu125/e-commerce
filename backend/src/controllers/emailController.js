import EmailLog from "../models/emailLogModel.js";
import Campaign from "../models/campaignModel.js";
import Newsletter from "../models/newsletterModel.js";
import User from "../models/userModel.js";
import { sendEmail, sendBulkEmail, sendTestEmail } from "../services/emailService.js";
import {
    weeklyNewsletterTemplate,
    monthlyNewsletterTemplate,
    fashionTipsTemplate,
    trendingCollectionsTemplate,
    styleGuidesTemplate,
    upcomingSalesTemplate,
    newArrivalsTemplate,
    weekendSaleTemplate,
    flashSaleTemplate,
    festivalSaleTemplate,
    exclusiveOfferTemplate,
    birthdayDiscountTemplate,
    anniversaryDiscountTemplate,
    limitedTimeDealTemplate,
    trendingProductsTemplate,
    recommendedProductsTemplate,
    bestSellersTemplate,
    cartReminderTemplate,
} from "../services/emailTemplates.js";

/*
==================================================
SEND NEWSLETTER
==================================================
*/
export const sendNewsletter = async (req, res) => {
    try {
        const { template, subject, content, testEmail } = req.body;

        // Validate
        if (!template || !subject) {
            return res.status(400).json({
                success: false,
                message: "Template and subject are required",
            });
        }

        // If test email, send to one recipient
        if (testEmail) {
            const result = await sendEmail({
                to: testEmail,
                subject,
                html: content,
                template: template,
                userId: req.user._id,
                metadata: { testEmail: true },
            });
            return res.json({
                success: true,
                message: "Test email sent",
                result,
            });
        }

        // Get subscribers based on newsletter type
        let subscribers = [];
        const newsletterTypes = [
            "weekly_newsletter",
            "monthly_newsletter",
            "fashion_tips",
            "trending_collections",
            "style_guides",
            "upcoming_sales",
        ];

        if (newsletterTypes.includes(template)) {
            // Get all verified newsletter subscribers
            const newsletterSubs = await Newsletter.find({
                isSubscribed: true,
                isVerified: true,
                bouncedAt: null,
            });

            // Filter by preference based on template type
            const preferenceMap = {
                weekly_newsletter: "weeklyNewsletter",
                monthly_newsletter: "monthlyNewsletter",
                fashion_tips: "fashionTips",
                trending_collections: "trendingCollections",
                style_guides: "styleGuides",
                upcoming_sales: "upcomingSales",
            };

            const prefKey = preferenceMap[template];
            subscribers = newsletterSubs
                .filter((s) => s.preferences[prefKey] !== false)
                .map((s) => ({
                    email: s.email,
                    name: s.name,
                    userId: s.user,
                    metadata: { subscriberId: s._id },
                }));
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid newsletter template type",
            });
        }

        if (subscribers.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No subscribers found for this newsletter type",
            });
        }

        // Send bulk emails
        const results = await sendBulkEmail(subscribers, {
            subject,
            html: content,
            template,
        });

        const sent = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        res.json({
            success: true,
            message: `Newsletter sent: ${sent} sent, ${failed} failed`,
            stats: { sent, failed, total: subscribers.length },
        });
    } catch (error) {
        console.error("Send newsletter error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to send newsletter",
        });
    }
};

/*
==================================================
SEND PROMOTIONAL EMAIL
==================================================
*/
export const sendPromotion = async (req, res) => {
    try {
        const { template, subject, content, audience, testEmail } = req.body;

        if (!template || !subject) {
            return res.status(400).json({
                success: false,
                message: "Template and subject are required",
            });
        }

        // If test email
        if (testEmail) {
            const result = await sendEmail({
                to: testEmail,
                subject,
                html: content,
                template: template,
                userId: req.user._id,
                metadata: { testEmail: true },
            });
            return res.json({
                success: true,
                message: "Test email sent",
                result,
            });
        }

        // Determine audience
        let recipients = [];
        if (audience === "all_users" || audience === "active_users") {
            const users = await User.find({
                role: "user",
                isBlocked: false,
            });
            recipients = users.map((u) => ({
                email: u.email,
                name: u.name,
                userId: u._id,
            }));
        } else if (audience === "all_subscribers" || audience === "verified_subscribers") {
            const subs = await Newsletter.find({
                isSubscribed: true,
                isVerified: audience === "verified_subscribers",
                bouncedAt: null,
            });
            recipients = subs.map((s) => ({
                email: s.email,
                name: s.name,
                userId: s.user,
                metadata: { subscriberId: s._id },
            }));
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid audience type",
            });
        }

        if (recipients.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No recipients found for this audience",
            });
        }

        const results = await sendBulkEmail(recipients, {
            subject,
            html: content,
            template,
        });

        const sent = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        res.json({
            success: true,
            message: `Promotion sent: ${sent} sent, ${failed} failed`,
            stats: { sent, failed, total: recipients.length },
        });
    } catch (error) {
        console.error("Send promotion error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to send promotion",
        });
    }
};

/*
==================================================
SEND COUPON EMAIL
==================================================
*/
export const sendCouponEmail = async (req, res) => {
    try {
        const { couponCode, discount, audience, subject, content } = req.body;

        if (!couponCode || !discount) {
            return res.status(400).json({
                success: false,
                message: "Coupon code and discount are required",
            });
        }

        let recipients = [];
        if (audience === "all_users") {
            const users = await User.find({ role: "user", isBlocked: false });
            recipients = users.map((u) => ({
                email: u.email,
                name: u.name,
                userId: u._id,
            }));
        } else if (audience === "subscribers") {
            const subs = await Newsletter.find({
                isSubscribed: true,
                isVerified: true,
                bouncedAt: null,
            });
            recipients = subs.map((s) => ({
                email: s.email,
                name: s.name,
                userId: s.user,
            }));
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid audience type",
            });
        }

        const results = await sendBulkEmail(recipients, {
            subject: subject || `Exclusive Coupon: ${discount}% OFF!`,
            html: content,
            template: "exclusive_offer",
        });

        const sent = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        res.json({
            success: true,
            message: `Coupon emails sent: ${sent} sent, ${failed} failed`,
            stats: { sent, failed, total: recipients.length },
        });
    } catch (error) {
        console.error("Send coupon email error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to send coupon emails",
        });
    }
};

/*
==================================================
GET EMAIL LOGS
==================================================
*/
export const getEmailLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, template, startDate, endDate } = req.query;

        const filter = {};

        if (status) filter.status = status;
        if (template) filter.template = template;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const logs = await EmailLog.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await EmailLog.countDocuments(filter);

        res.json({
            success: true,
            logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("Get email logs error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch email logs",
        });
    }
};

/*
==================================================
GET EMAIL ANALYTICS
==================================================
*/
export const getEmailAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        const [totalSent, totalDelivered, totalOpened, totalClicked, totalBounced, totalFailed, totalUnsubscribed] =
            await Promise.all([
                EmailLog.countDocuments({ ...dateFilter }),
                EmailLog.countDocuments({ ...dateFilter, status: "delivered" }),
                EmailLog.countDocuments({ ...dateFilter, status: "opened" }),
                EmailLog.countDocuments({ ...dateFilter, status: "clicked" }),
                EmailLog.countDocuments({ ...dateFilter, status: "bounced" }),
                EmailLog.countDocuments({ ...dateFilter, status: "failed" }),
                EmailLog.countDocuments({ ...dateFilter, status: "unsubscribed" }),
            ]);

        // Get stats by template
        const templateStats = await EmailLog.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: "$template",
                    sent: { $sum: 1 },
                    opened: { $sum: { $cond: [{ $eq: ["$status", "opened"] }, 1, 0] } },
                    clicked: { $sum: { $cond: [{ $eq: ["$status", "clicked"] }, 1, 0] } },
                    bounced: { $sum: { $cond: [{ $eq: ["$status", "bounced"] }, 1, 0] } },
                },
            },
            { $sort: { sent: -1 } },
        ]);

        // Daily stats for chart
        const dailyStats = await EmailLog.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    sent: { $sum: 1 },
                    opened: { $sum: { $cond: [{ $eq: ["$status", "opened"] }, 1, 0] } },
                    clicked: { $sum: { $cond: [{ $eq: ["$status", "clicked"] }, 1, 0] } },
                },
            },
            { $sort: { _id: 1 } },
            { $limit: 30 },
        ]);

        const delivered = totalDelivered || totalSent;
        const openRate = delivered > 0 ? ((totalOpened / delivered) * 100).toFixed(2) : 0;
        const clickRate = delivered > 0 ? ((totalClicked / delivered) * 100).toFixed(2) : 0;
        const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(2) : 0;
        const unsubscribeRate = delivered > 0 ? ((totalUnsubscribed / delivered) * 100).toFixed(2) : 0;

        res.json({
            success: true,
            analytics: {
                total: totalSent,
                delivered: totalDelivered,
                opened: totalOpened,
                clicked: totalClicked,
                bounced: totalBounced,
                failed: totalFailed,
                unsubscribed: totalUnsubscribed,
                rates: {
                    openRate: parseFloat(openRate),
                    clickRate: parseFloat(clickRate),
                    bounceRate: parseFloat(bounceRate),
                    unsubscribeRate: parseFloat(unsubscribeRate),
                },
                byTemplate: templateStats,
                daily: dailyStats,
            },
        });
    } catch (error) {
        console.error("Get email analytics error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch email analytics",
        });
    }
};

/*
==================================================
CREATE CAMPAIGN
==================================================
*/
export const createCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.create({
            ...req.body,
            createdBy: req.user._id,
        });

        res.status(201).json({
            success: true,
            campaign,
        });
    } catch (error) {
        console.error("Create campaign error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to create campaign",
        });
    }
};

/*
==================================================
GET CAMPAIGNS
==================================================
*/
export const getCampaigns = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const filter = {};
        if (status) filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const campaigns = await Campaign.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate("createdBy", "name email");

        const total = await Campaign.countDocuments(filter);

        res.json({
            success: true,
            campaigns,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("Get campaigns error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch campaigns",
        });
    }
};

/*
==================================================
SEND CAMPAIGN
==================================================
*/
export const sendCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: "Campaign not found",
            });
        }

        // Update status to sending
        campaign.status = "sending";
        await campaign.save();

        // Get recipients based on audience
        let recipients = [];
        if (campaign.audience.type === "all_subscribers" || campaign.audience.type === "verified_subscribers") {
            const subs = await Newsletter.find({
                isSubscribed: true,
                isVerified: campaign.audience.type === "verified_subscribers",
                bouncedAt: null,
            });
            recipients = subs.map((s) => ({
                email: s.email,
                name: s.name,
                userId: s.user,
                metadata: { subscriberId: s._id },
            }));
        } else if (campaign.audience.type === "all_users" || campaign.audience.type === "active_users") {
            const users = await User.find({ role: "user", isBlocked: false });
            recipients = users.map((u) => ({
                email: u.email,
                name: u.name,
                userId: u._id,
            }));
        }

        // Send emails
        const results = await sendBulkEmail(recipients, {
            subject: campaign.subject,
            html: campaign.htmlContent,
            text: campaign.plainTextContent,
            template: campaign.template,
            campaignId: campaign._id,
        });

        // Update campaign stats
        const sent = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        campaign.stats.sent = sent;
        campaign.stats.failed = failed;
        campaign.audience.actualRecipients = recipients.length;
        campaign.status = "sent";
        campaign.sentAt = new Date();
        campaign.completedAt = new Date();
        await campaign.save();

        res.json({
            success: true,
            message: `Campaign sent: ${sent} sent, ${failed} failed`,
            campaign,
        });
    } catch (error) {
        console.error("Send campaign error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to send campaign",
        });
    }
};

/*
==================================================
SEND TEST CAMPAIGN
==================================================
*/
export const sendTestCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: "Campaign not found",
            });
        }

        const result = await sendTestEmail(req.user.email, campaign);

        res.json({
            success: true,
            message: "Test email sent",
            result,
        });
    } catch (error) {
        console.error("Send test campaign error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to send test email",
        });
    }
};

/*
==================================================
TRACK EMAIL OPEN
==================================================
*/
export const trackOpen = async (req, res) => {
    try {
        const { trackingId } = req.params;
        const { trackOpen: track } = await import("../services/emailService.js");
        await track(trackingId);
        // Return 1x1 transparent pixel
        const pixel = Buffer.from(
            "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
            "base64"
        );
        res.writeHead(200, {
            "Content-Type": "image/gif",
            "Content-Length": pixel.length,
            "Cache-Control": "no-cache, no-store, must-revalidate",
        });
        res.end(pixel);
    } catch (error) {
        // Return pixel even on error
        const pixel = Buffer.from(
            "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
            "base64"
        );
        res.writeHead(200, { "Content-Type": "image/gif" });
        res.end(pixel);
    }
};

/*
==================================================
TRACK EMAIL CLICK
==================================================
*/
export const trackClick = async (req, res) => {
    try {
        const { trackingId } = req.params;
        const { url } = req.query;
        const { trackClick: track } = await import("../services/emailService.js");
        if (url) {
            await track(trackingId, decodeURIComponent(url));
        }
        // Redirect to the original URL
        res.redirect(301, url ? decodeURIComponent(url) : "/");
    } catch (error) {
        res.redirect(301, "/");
    }
};