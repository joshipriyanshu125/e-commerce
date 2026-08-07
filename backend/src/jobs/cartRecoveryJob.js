/**
 * Cart Recovery Job
 *
 * Runs every 30 minutes. Finds carts with items that have
 * been abandoned (no activity) for 2h / 24h / 3 days.
 *
 * Sends a targeted recovery email at each milestone,
 * but only once per tier per cart.
 *
 * Respects NotificationPreference.email.promotions for each user.
 */

import Cart from "../models/cartModel.js";
import NotificationPreference from "../models/notificationPreferenceModel.js";
import { sendEmail } from "../services/emailService.js";
import {
    cartRecovery2hTemplate,
    cartRecovery24hTemplate,
    cartRecovery3dTemplate,
} from "../services/emailTemplates.js";
import logger from "../utils/logger.js";

const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

const STORE_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/*
==================================================
TIME THRESHOLDS
==================================================
*/
const TWO_HOURS_MS     = 2  * 60 * 60 * 1000;
const TWENTYFOUR_MS    = 24 * 60 * 60 * 1000;
const THREE_DAYS_MS    = 3  * 24 * 60 * 60 * 1000;

/*
==================================================
BUILD CART ITEMS SUMMARY
==================================================
Generates a simplified product list for the email template.
==================================================
*/
const buildCartItems = (cart) => {
    return (cart.items || []).map((item) => ({
        name:  item.product?.name        || "Fashion Item",
        price: item.product?.price       || 0,
        image: item.product?.images?.[0] || "",
        qty:   item.quantity             || 1,
    }));
};

/*
==================================================
CHECK USER OPT-IN
==================================================
Returns true if user has enabled promotional/cart emails
or has no preference document (defaults to opt-in).
==================================================
*/
const isUserOptedIn = async (userId) => {
    try {
        const prefs = await NotificationPreference.findOne({ user: userId }).lean();
        if (!prefs) return true; // default: opted in
        // Check email.promotions preference (cart recovery is a promotional email)
        return prefs.email?.promotions !== false;
    } catch {
        return true; // fail-open
    }
};

/*
==================================================
SEND RECOVERY EMAIL HELPER
==================================================
*/
const sendRecoveryEmail = async ({ cart, tier, templateFn, subject }) => {
    const { user } = cart;
    if (!user?.email) return;

    const optedIn = await isUserOptedIn(user._id);
    if (!optedIn) {
        logger.info(`[CartRecovery] Skipping ${user.email} — opted out of promotions`);
        return;
    }

    const cartItems = buildCartItems(cart);
    const cartUrl   = `${STORE_URL}/cart`;

    // Discount codes per tier
    const coupons = {
        "2h":  null,
        "24h": "COMEBACK10",
        "3d":  "LASTCHANCE15",
    };

    const html = templateFn({
        userName:     user.name || user.email.split("@")[0],
        cartItems,
        cartUrl,
        couponCode:   coupons[tier],
        totalPrice:   cart.totalPrice,
    });

    const result = await sendEmail({
        to:       user.email,
        subject,
        html,
        text:     `You left items in your cart at ATELIER. Visit ${cartUrl} to complete your purchase.`,
        template: `cart_recovery_${tier.replace("h", "h").replace("d", "d")}`.replace("cart_recovery_2h","cart_recovery_2h").replace("cart_recovery_24h","cart_recovery_24h").replace("cart_recovery_3d","cart_recovery_3d"),
        userId:   user._id,
        metadata: { tier, cartId: cart._id, templateData: { userName: user.name || user.email.split("@")[0], cartUrl, couponCode: coupons[tier] } },
    });

    if (result.success) {
        logger.info(
            `[CartRecovery] ✅ Sent ${tier} recovery email to ${user.email}`
        );
    } else {
        logger.warn(
            `[CartRecovery] ⚠️ Failed to send ${tier} recovery email to ${user.email}: ${result.error}`
        );
    }

    return result;
};

/*
==================================================
MAIN JOB
==================================================
*/
const processAbandonedCarts = async () => {
    try {
        const now = new Date();

        // Find carts with items that haven't been updated recently.
        // Populate user and product details for the email.
        const carts = await Cart.find({
            "items.0": { $exists: true }, // cart must have at least one item
            lastActivityAt: { $lt: new Date(now - TWO_HOURS_MS) }, // inactive at least 2h
        })
            .populate("user", "name email")
            .populate("items.product", "name price images")
            .lean();

        if (carts.length === 0) return;

        logger.info(`[CartRecovery] Found ${carts.length} potentially abandoned carts`);

        const updates = [];

        for (const cart of carts) {
            if (!cart.user?.email) continue;

            const inactiveDuration = now - new Date(cart.lastActivityAt || cart.updatedAt);
            const reminderSentAt   = cart.reminderSentAt || {};

            const cartUpdateFields = {};
            let sent = false;

            // ── 3-Day tier ─────────────────────────────────────────────
            if (
                inactiveDuration >= THREE_DAYS_MS &&
                !reminderSentAt.threeDays
            ) {
                await sendRecoveryEmail({
                    cart,
                    tier: "3d",
                    templateFn: cartRecovery3dTemplate,
                    subject: "⏰ Last Chance! Your cart is about to expire | ATELIER",
                });
                cartUpdateFields["reminderSentAt.threeDays"] = now;
                sent = true;
            }

            // ── 24-Hour tier ────────────────────────────────────────────
            if (
                !sent &&
                inactiveDuration >= TWENTYFOUR_MS &&
                !reminderSentAt.twentyFourHours
            ) {
                await sendRecoveryEmail({
                    cart,
                    tier: "24h",
                    templateFn: cartRecovery24hTemplate,
                    subject: "💛 Still thinking it over? Your cart misses you | ATELIER",
                });
                cartUpdateFields["reminderSentAt.twentyFourHours"] = now;
                sent = true;
            }

            // ── 2-Hour tier ─────────────────────────────────────────────
            if (
                !sent &&
                inactiveDuration >= TWO_HOURS_MS &&
                !reminderSentAt.twoHours
            ) {
                await sendRecoveryEmail({
                    cart,
                    tier: "2h",
                    templateFn: cartRecovery2hTemplate,
                    subject: "👜 You left something behind | ATELIER",
                });
                cartUpdateFields["reminderSentAt.twoHours"] = now;
                sent = true;
            }

            // Write reminder tracking fields back to DB
            if (sent && Object.keys(cartUpdateFields).length > 0) {
                updates.push(
                    Cart.updateOne({ _id: cart._id }, { $set: cartUpdateFields })
                );
            }

            // Throttle between sends
            if (sent) {
                await new Promise((r) => setTimeout(r, 150));
            }
        }

        // Fire all DB updates in parallel
        if (updates.length > 0) {
            await Promise.allSettled(updates);
        }
    } catch (err) {
        logger.error(`[CartRecovery] Unexpected error: ${err.message}`);
    }
};

/*
==================================================
JOB LIFECYCLE
==================================================
*/
let _cartJobInterval = null;

export const startCartRecoveryJob = () => {
    if (_cartJobInterval) return;

    logger.info("[CartRecovery] Cart recovery job started (runs every 30 minutes)");
    console.log("[CartRecovery] ✅ Cart recovery job started (every 30 min)");

    // Run once immediately on startup
    processAbandonedCarts();
    _cartJobInterval = setInterval(processAbandonedCarts, INTERVAL_MS);
};

export const stopCartRecoveryJob = () => {
    if (_cartJobInterval) {
        clearInterval(_cartJobInterval);
        _cartJobInterval = null;
        logger.info("[CartRecovery] Cart recovery job stopped");
    }
};
