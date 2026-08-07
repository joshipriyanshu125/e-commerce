import express from "express";
import Newsletter from "../models/newsletterModel.js";
import { sendEmail } from "../services/emailService.js";
import { emailVerificationTemplate } from "../services/emailTemplates.js";

const router = express.Router();

/*
==================================================
PUBLIC: SUBSCRIBE TO NEWSLETTER
==================================================
*/
router.post("/subscribe", async (req, res) => {
    try {
        const { email, name, source } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const result = await Newsletter.subscribe(email, name, source || "footer");

        if (result.success && result.subscriber) {
            // Send verification email
            const verificationLink = `${process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 5000}`}/newsletter/verify/${result.subscriber.verificationToken}`;
            const html = emailVerificationTemplate(name || "there", verificationLink);

            await sendEmail({
                to: email,
                subject: "Verify your newsletter subscription",
                html,
                template: "email_verification",
                metadata: { subscriberId: result.subscriber._id },
            });
        }

        res.json(result);
    } catch (error) {
        console.error("Newsletter subscribe error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to subscribe",
        });
    }
});

/*
==================================================
PUBLIC: VERIFY EMAIL
==================================================
*/
router.get("/verify/:token", async (req, res) => {
    try {
        const result = await Newsletter.verify(req.params.token);

        if (result.success) {
            // Redirect to success page
            return res.redirect(
                `${process.env.FRONTEND_URL || "http://localhost:5173"}/newsletter/verified`
            );
        }

        res.redirect(
            `${process.env.FRONTEND_URL || "http://localhost:5173"}/newsletter/verify-failed`
        );
    } catch (error) {
        console.error("Newsletter verify error:", error.message);
        res.status(500).json({
            success: false,
            message: "Verification failed",
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
            return res.redirect(
                `${process.env.FRONTEND_URL || "http://localhost:5173"}/newsletter/unsubscribed`
            );
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
GET SUBSCRIBER COUNT (Public)
==================================================
*/
router.get("/count", async (req, res) => {
    try {
        const count = await Newsletter.countDocuments({
            isSubscribed: true,
            isVerified: true,
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

export default router;