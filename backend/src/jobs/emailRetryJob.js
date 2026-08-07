/**
 * Email Retry Job
 *
 * Runs every 5 minutes. Finds EmailLog entries with:
 *   - status: "failed"
 *   - retryCount < maxRetries
 *   - nextRetryAt <= now (or null — first retry attempt)
 *
 * Re-sends each email using the same provider and logs results.
 * Uses exponential back-off: 5m → 15m → 45m between retries.
 */

import EmailLog from "../models/emailLogModel.js";
import { sendEmail } from "../services/emailService.js";
import * as EmailTemplates from "../services/emailTemplates.js";
import logger from "../utils/logger.js";

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/*
==================================================
EXPONENTIAL BACK-OFF DELAYS
retry 1: +5 minutes
retry 2: +15 minutes
retry 3: +45 minutes
==================================================
*/
const backOffMs = (retryCount) => {
    const delays = [
        5 * 60 * 1000,   // 5 min
        15 * 60 * 1000,  // 15 min
        45 * 60 * 1000,  // 45 min
    ];
    return delays[retryCount] || delays[delays.length - 1];
};

/*
==================================================
REBUILD HTML FROM TEMPLATE
==================================================
Re-generates the email HTML from the stored template name
and metadata so we can resend without storing raw HTML.
Falls back to a generic message if template not found.
==================================================
*/
const rebuildHtml = (emailLog) => {
    try {
        const { template, metadata = {}, recipient } = emailLog;

        // Map template name to the exported function
        const templateMap = {
            welcome: EmailTemplates.welcomeTemplate,
            email_verification: EmailTemplates.emailVerificationTemplate,
            email_verified: EmailTemplates.emailVerifiedTemplate,
            forgot_password: EmailTemplates.forgotPasswordTemplate,
            password_changed: EmailTemplates.passwordChangedTemplate,
            email_changed: EmailTemplates.emailChangedTemplate,
            account_blocked: EmailTemplates.accountBlockedTemplate,
            account_unblocked: EmailTemplates.accountUnblockedTemplate,
            account_deleted: EmailTemplates.accountDeletedTemplate,
            order_placed: EmailTemplates.orderPlacedTemplate,
            order_confirmed: EmailTemplates.orderConfirmedTemplate,
            payment_successful: EmailTemplates.paymentSuccessfulTemplate,
            payment_failed: EmailTemplates.paymentFailedTemplate,
            order_packed: EmailTemplates.orderPackedTemplate,
            order_shipped: EmailTemplates.orderShippedTemplate,
            order_out_for_delivery: EmailTemplates.orderOutForDeliveryTemplate,
            order_delivered: EmailTemplates.orderDeliveredTemplate,
            order_cancelled: EmailTemplates.orderCancelledTemplate,
            invoice_generated: EmailTemplates.invoiceGeneratedTemplate,
            return_requested: EmailTemplates.returnRequestedTemplate,
            return_approved: EmailTemplates.returnApprovedTemplate,
            return_rejected: EmailTemplates.returnRejectedTemplate,
            pickup_scheduled: EmailTemplates.pickupScheduledTemplate,
            item_received: EmailTemplates.itemReceivedTemplate,
            refund_initiated: EmailTemplates.refundInitiatedTemplate,
            refund_completed: EmailTemplates.refundCompletedTemplate,
            back_in_stock: EmailTemplates.backInStockTemplate,
            price_dropped: EmailTemplates.priceDroppedTemplate,
            cart_recovery_2h: EmailTemplates.cartRecovery2hTemplate,
            cart_recovery_24h: EmailTemplates.cartRecovery24hTemplate,
            cart_recovery_3d: EmailTemplates.cartRecovery3dTemplate,
        };

        const templateFn = templateMap[template];
        if (templateFn && metadata.templateData) {
            return templateFn(metadata.templateData);
        }

        // Generic fallback HTML for retries
        return `
            <div style="font-family:Arial,sans-serif;padding:32px;text-align:center;">
                <h2 style="color:#1a1a2e;">ATELIER</h2>
                <p style="color:#555;">This is a retry of a previously failed notification.</p>
                <p style="color:#555;">Subject: ${emailLog.subject}</p>
                <p style="color:#999;font-size:12px;">If you believe this is an error, contact us at support@atelier.com</p>
            </div>
        `;
    } catch (err) {
        logger.warn(`[RetryJob] Could not rebuild HTML for log ${emailLog._id}: ${err.message}`);
        return `<p>Retry of: ${emailLog.subject}</p>`;
    }
};

/*
==================================================
PROCESS FAILED EMAILS
==================================================
*/
const processFailedEmails = async () => {
    try {
        const now = new Date();

        // Find emails eligible for retry
        const failedLogs = await EmailLog.find({
            status: "failed",
            $expr: { $lt: ["$retryCount", "$maxRetries"] },
            $or: [
                { nextRetryAt: { $lte: now } },
                { nextRetryAt: null },
            ],
        })
            .limit(50)  // Process max 50 at a time to avoid overload
            .lean();

        if (failedLogs.length === 0) return;

        logger.info(`[RetryJob] Found ${failedLogs.length} emails to retry`);

        for (const log of failedLogs) {
            try {
                // Mark as queued to prevent double-processing
                await EmailLog.updateOne(
                    { _id: log._id, status: "failed" }, // condition prevents race condition
                    {
                        $set: {
                            status: "queued",
                            lastRetryAt: now,
                        },
                    }
                );

                const html = rebuildHtml(log);
                const text = `${log.subject} - Please view this email in an HTML-capable client.`;

                // Attempt resend
                const result = await sendEmail({
                    to: log.recipient.email,
                    subject: log.subject,
                    html,
                    text,
                    template: log.template,
                    userId: log.recipient.userId,
                    campaignId: log.campaign,
                    metadata: { ...log.metadata, isRetry: true, retryCount: log.retryCount + 1 },
                });

                if (result.success) {
                    logger.info(
                        `[RetryJob] ✅ Retry succeeded for ${log.recipient.email} (attempt ${log.retryCount + 1})`
                    );
                    // sendEmail already updates the log via EmailLog.create/save internally.
                    // Update the original log's retry count.
                    await EmailLog.updateOne(
                        { _id: log._id },
                        { $inc: { retryCount: 1 }, $set: { status: "sent", sentAt: new Date() } }
                    );
                } else {
                    throw new Error(result.error || "Unknown send error");
                }
            } catch (sendError) {
                const newRetryCount = (log.retryCount || 0) + 1;
                const maxRetries = log.maxRetries || 3;
                const isExhausted = newRetryCount >= maxRetries;

                await EmailLog.updateOne(
                    { _id: log._id },
                    {
                        $set: {
                            status: "failed",
                            retryCount: newRetryCount,
                            lastRetryAt: now,
                            nextRetryAt: isExhausted
                                ? null
                                : new Date(Date.now() + backOffMs(newRetryCount)),
                            errorMessage: sendError.message,
                        },
                    }
                );

                if (isExhausted) {
                    logger.warn(
                        `[RetryJob] ❌ Max retries (${maxRetries}) exhausted for ${log.recipient.email} — subject: "${log.subject}"`
                    );
                } else {
                    logger.warn(
                        `[RetryJob] ⚠️ Retry ${newRetryCount}/${maxRetries} failed for ${log.recipient.email}: ${sendError.message}`
                    );
                }
            }

            // Small delay between each send to respect rate limits
            await new Promise((resolve) => setTimeout(resolve, 200));
        }
    } catch (err) {
        logger.error(`[RetryJob] Unexpected error during retry cycle: ${err.message}`);
    }
};

/*
==================================================
JOB LIFECYCLE
==================================================
*/
let _retryJobInterval = null;

export const startEmailRetryJob = () => {
    if (_retryJobInterval) return;

    logger.info("[RetryJob] Email retry job started (runs every 5 minutes)");
    console.log("[RetryJob] ✅ Email retry job started (every 5 min)");

    // Run once immediately on startup
    processFailedEmails();
    _retryJobInterval = setInterval(processFailedEmails, INTERVAL_MS);
};

export const stopEmailRetryJob = () => {
    if (_retryJobInterval) {
        clearInterval(_retryJobInterval);
        _retryJobInterval = null;
        logger.info("[RetryJob] Email retry job stopped");
    }
};
