import express from "express";
import Newsletter from "../models/newsletterModel.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { sendEmail, sendBulkEmail } from "../services/emailService.js";
import { welcomeNewsletterTemplate, broadcastNewsletterTemplate } from "../services/emailTemplates.js";
import { notifyAdmins } from "../services/notificationService.js";

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/*
==================================================
PUBLIC: SUBSCRIBE TO NEWSLETTER
==================================================
*/
router.post("/subscribe", async (req, res) => {
    try {
        const { email, name, source } = req.body;

        if (!email || !EMAIL_REGEX.test(String(email).trim())) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address",
            });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const result = await Newsletter.subscribe(cleanEmail, name, source || "footer");

        if (result.success && result.subscriber && !result.alreadySubscribed) {
            // Attempt to send welcome email in background (non-blocking)
            try {
                const siteUrl = process.env.FRONTEND_URL || "http://localhost:5173";
                const html = welcomeNewsletterTemplate(name || cleanEmail.split("@")[0] || "there", siteUrl);

                sendEmail({
                    to: cleanEmail,
                    subject: "Welcome to Atelier — Subscription Confirmed",
                    html,
                    template: "welcome_newsletter",
                    metadata: { subscriberId: result.subscriber._id, source: source || "footer" },
                }).catch((emailErr) => {
                    console.warn("Newsletter welcome email failed to send (non-critical):", emailErr.message);
                });
            } catch (emailPrepErr) {
                console.warn("Welcome email preparation failed:", emailPrepErr.message);
            }

            // Notify admins in dashboard
            try {
                notifyAdmins({
                    title: "New Newsletter Subscriber",
                    message: `${cleanEmail} subscribed to the newsletter via ${source || "footer"}.`,
                    type: "new_user",
                    metadata: { subscriberId: result.subscriber._id, email: cleanEmail },
                }).catch(() => {});
            } catch {}
        }

        res.json({
            success: true,
            message: result.message || "Thank you for subscribing to Atelier.",
            subscriber: result.subscriber,
            alreadySubscribed: !!result.alreadySubscribed,
        });
    } catch (error) {
        console.error("Newsletter subscribe error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to process subscription. Please try again.",
        });
    }
});

/*
==================================================
PUBLIC: UNSUBSCRIBE
==================================================
*/
router.get("/unsubscribe/:token", async (req, res) => {
    try {
        const result = await Newsletter.unsubscribe(req.params.token);

        if (result.success) {
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
            return res.redirect(`${frontendUrl}/newsletter/unsubscribed`);
        }

        res.status(400).json(result);
    } catch (error) {
        console.error("Newsletter unsubscribe error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to unsubscribe",
        });
    }
});

/*
==================================================
PUBLIC: UPDATE PREFERENCES
==================================================
*/
router.put("/preferences/:token", async (req, res) => {
    try {
        const subscriber = await Newsletter.findOne({
            unsubscribeToken: req.params.token,
        });

        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: "Invalid token",
            });
        }

        const { preferences } = req.body;
        if (preferences) {
            Object.keys(preferences).forEach((key) => {
                if (subscriber.preferences[key] !== undefined) {
                    subscriber.preferences[key] = preferences[key];
                }
            });
            await subscriber.save();
        }

        res.json({
            success: true,
            message: "Preferences updated",
            subscriber,
        });
    } catch (error) {
        console.error("Newsletter preferences error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to update preferences",
        });
    }
});

/*
==================================================
PUBLIC: GET SUBSCRIBER COUNT
==================================================
*/
router.get("/count", async (req, res) => {
    try {
        const count = await Newsletter.countDocuments({
            isSubscribed: true,
        });

        res.json({
            success: true,
            count,
        });
    } catch (error) {
        console.error("Newsletter count error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to get count",
        });
    }
});

/*
==================================================
ADMIN ROUTES (Require Protect + Admin)
==================================================
*/

// GET /api/newsletter/admin/stats - Overview stats
router.get("/admin/stats", protect, admin, async (req, res) => {
    try {
        const total = await Newsletter.countDocuments();
        const active = await Newsletter.countDocuments({ isSubscribed: true });
        const unsubscribed = await Newsletter.countDocuments({ isSubscribed: false });

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const newThisMonth = await Newsletter.countDocuments({
            createdAt: { $gte: thirtyDaysAgo },
            isSubscribed: true,
        });

        res.json({
            success: true,
            stats: {
                total,
                active,
                unsubscribed,
                newThisMonth,
            },
        });
    } catch (error) {
        console.error("Admin newsletter stats error:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch stats" });
    }
});

// GET /api/newsletter/admin/subscribers - List with pagination, search, filter
router.get("/admin/subscribers", protect, admin, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
        const { search, status, source } = req.query;

        const query = {};

        if (status === "active") {
            query.isSubscribed = true;
        } else if (status === "unsubscribed") {
            query.isSubscribed = false;
        }

        if (source && source !== "all") {
            query.source = source;
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [{ email: regex }, { name: regex }];
        }

        const total = await Newsletter.countDocuments(query);
        const subscribers = await Newsletter.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            success: true,
            subscribers,
            total,
            page,
            pages: Math.ceil(total / limit) || 1,
        });
    } catch (error) {
        console.error("Admin subscribers list error:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch subscribers" });
    }
});

// PUT /api/newsletter/admin/subscribers/:id/toggle - Toggle subscription status
router.put("/admin/subscribers/:id/toggle", protect, admin, async (req, res) => {
    try {
        const subscriber = await Newsletter.findById(req.params.id);
        if (!subscriber) {
            return res.status(404).json({ success: false, message: "Subscriber not found" });
        }

        subscriber.isSubscribed = !subscriber.isSubscribed;
        if (!subscriber.isSubscribed) {
            subscriber.unsubscribedAt = new Date();
        } else {
            subscriber.unsubscribedAt = null;
        }

        await subscriber.save();

        res.json({
            success: true,
            message: `Subscriber marked as ${subscriber.isSubscribed ? "Active" : "Unsubscribed"}`,
            subscriber,
        });
    } catch (error) {
        console.error("Toggle subscriber error:", error.message);
        res.status(500).json({ success: false, message: "Failed to update subscriber" });
    }
});

// DELETE /api/newsletter/admin/subscribers/:id - Remove subscriber
router.delete("/admin/subscribers/:id", protect, admin, async (req, res) => {
    try {
        const subscriber = await Newsletter.findByIdAndDelete(req.params.id);
        if (!subscriber) {
            return res.status(404).json({ success: false, message: "Subscriber not found" });
        }

        res.json({
            success: true,
            message: "Subscriber removed successfully",
        });
    } catch (error) {
        console.error("Delete subscriber error:", error.message);
        res.status(500).json({ success: false, message: "Failed to delete subscriber" });
    }
});

// POST /api/newsletter/admin/broadcast - Send custom notification/newsletter broadcast to all subscribers
router.post("/admin/broadcast", protect, admin, async (req, res) => {
    try {
        const { subject, headline, message, buttonText, buttonUrl, testEmail } = req.body;

        if (!subject || !message) {
            return res.status(400).json({
                success: false,
                message: "Subject and message are required for broadcast",
            });
        }

        const siteUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const targetUrl = buttonUrl || siteUrl;

        // If test email requested, send test to that specific email
        if (testEmail) {
            const html = broadcastNewsletterTemplate({
                title: subject,
                headline: headline || subject,
                message,
                buttonText: buttonText || "Explore Now",
                buttonUrl: targetUrl,
                name: "Admin Tester",
            });

            await sendEmail({
                to: testEmail,
                subject: `[TEST] ${subject}`,
                html,
                template: "newsletter_broadcast",
                userId: req.user._id,
                metadata: { isTestBroadcast: true },
            });

            return res.json({
                success: true,
                message: `Test email successfully sent to ${testEmail}`,
            });
        }

        // Fetch all active subscribers
        const activeSubscribers = await Newsletter.find({
            isSubscribed: true,
            bouncedAt: null,
        }).select("email name _id");

        if (!activeSubscribers.length) {
            return res.status(400).json({
                success: false,
                message: "No active subscribers found to receive broadcast.",
            });
        }

        const recipients = activeSubscribers.map((sub) => ({
            email: sub.email,
            name: sub.name || sub.email.split("@")[0] || "there",
            metadata: { subscriberId: sub._id },
        }));

        const html = broadcastNewsletterTemplate({
            title: subject,
            headline: headline || subject,
            message,
            buttonText: buttonText || "Shop Atelier",
            buttonUrl: targetUrl,
        });

        // Send bulk emails safely
        const results = await sendBulkEmail(recipients, {
            subject,
            html,
            template: "newsletter_broadcast",
        });

        const successCount = results.filter((r) => r.success).length;

        res.json({
            success: true,
            message: `Broadcast successfully dispatched to ${successCount} of ${activeSubscribers.length} subscribers.`,
            sentCount: successCount,
            totalSubscribers: activeSubscribers.length,
        });
    } catch (error) {
        console.error("Admin broadcast error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to send newsletter broadcast: " + error.message,
        });
    }
});

export default router;