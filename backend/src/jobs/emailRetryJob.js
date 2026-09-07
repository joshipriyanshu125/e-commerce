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
import Notification from "../models/notificationModel.js";
import { sendRawMail } from "../services/emailService.js";
import { notificationEmailHtml } from "../services/notificationService.js";
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
==================================================
*/
const rebuildHtml = (emailLog) => {
    try {
        const { template, metadata = {} } = emailLog;

        // If it's a notification template or has notification metadata
        if (template === "notification" || metadata.message || metadata.title) {
            const title = metadata.title || emailLog.subject;
            const message = metadata.message || emailLog.subject;
            const link = metadata.link || null;
            return notificationEmailHtml({ title, message, link });
        }

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

        // Generic branded fallback HTML for retries
        const title = metadata.title || emailLog.subject;
        const message = metadata.message || emailLog.subject;
        return notificationEmailHtml({ title, message, link: metadata.link || null });
    } catch (err) {
        logger.warn(`[RetryJob] Could not rebuild HTML for log ${emailLog._id}: ${err.message}`);
        return notificationEmailHtml({ title: emailLog.subject, message: emailLog.subject, link: null });
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

                // Inject tracking pixel if openTrackingId is present
                const baseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 5000}`;
                const trackingPixel = log.openTrackingId
                    ? `<img src="${baseUrl}/api/email/track/open/${log.openTrackingId}" width="1" height="1" style="display:none;" alt=""/>`
                    : "";
                const finalHtml = html + trackingPixel;

                // Send directly through transporter to avoid duplicate EmailLog records
                const result = await sendRawMail({
                    to: log.recipient.email,
                    subject: log.subject,
                    html: finalHtml,
                    text,
                });

                if (result && result.messageId) {
                    logger.info(
                        `[RetryJob] ✅ Retry succeeded for ${log.recipient.email} (attempt ${log.retryCount + 1})`
                    );

                    // Update the original log
                    await EmailLog.updateOne(
                        { _id: log._id },
                        {
                            $inc: { retryCount: 1 },
                            $set: {
                                status: "sent",
                                sentAt: new Date(),
                                messageId: result.messageId,
                                providerMessageId: result.providerMessageId || result.messageId,
                                errorMessage: "",
                            },
                        }
                    );

                    // If linked to a Notification, mark it as sentViaEmail
                    if (log.metadata?.notificationId) {
                        await Notification.findByIdAndUpdate(log.metadata.notificationId, {
                            sentViaEmail: true,
                        });
                    }
                } else {
                    throw new Error("No messageId returned from email provider");
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
