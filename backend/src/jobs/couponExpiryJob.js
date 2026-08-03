/**
 * Coupon Expiry Check Job
 *
 * Runs every hour to detect newly-expired coupons and:
 *   1. Sets isActive = false on them
 *   2. Sends an admin notification for each
 *
 * Usage: call startCouponExpiryJob() once from server.js after DB connects.
 */

import Coupon from "../models/couponModel.js";
import { notifyAdmins } from "../services/notificationService.js";

const INTERVAL_MS = 60 * 60 * 1000; // Every hour

const checkExpiredCoupons = async () => {
    try {
        // Find coupons that have passed their expiry date and are still active
        const expiredCoupons = await Coupon.find({
            isActive: true,
            expiryDate: { $lt: new Date() },
        });

        if (expiredCoupons.length === 0) return;

        for (const coupon of expiredCoupons) {
            // Mark inactive
            coupon.isActive = false;
            await coupon.save();

            // Notify all admins
            notifyAdmins({
                title: "Coupon Expired",
                message: `Coupon "${coupon.code}" has expired and has been deactivated automatically.`,
                type: "coupon_expired",
            }).catch((err) =>
                console.error(
                    `Failed to send coupon expiry notification for ${coupon.code}:`,
                    err.message
                )
            );

            console.log(`[CouponJob] Expired and deactivated coupon: ${coupon.code}`);
        }
    } catch (err) {
        console.error("[CouponJob] Error checking expired coupons:", err.message);
    }
};

let _jobInterval = null;

export const startCouponExpiryJob = () => {
    if (_jobInterval) return; // prevent duplicate timers

    console.log("[CouponJob] Coupon expiry checker started (runs every hour)");

    // Run immediately on startup, then every hour
    checkExpiredCoupons();
    _jobInterval = setInterval(checkExpiredCoupons, INTERVAL_MS);
};

export const stopCouponExpiryJob = () => {
    if (_jobInterval) {
        clearInterval(_jobInterval);
        _jobInterval = null;
    }
};
