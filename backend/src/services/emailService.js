import nodemailer from "nodemailer";
import crypto from "crypto";
import EmailLog from "../models/emailLogModel.js";
import logger from "../utils/logger.js";

/*
==================================================
EMAIL PROVIDER CONFIGURATION
==================================================
Support: Nodemailer (Development), Resend, SendGrid,
         Mailgun, Amazon SES
==================================================
*/

let transporter = null;

const getProvider = () => {
    return process.env.EMAIL_PROVIDER || "nodemailer";
};

/*
==================================================
CREATE TRANSPORTER
==================================================
*/
const createTransporter = () => {
    const provider = getProvider();

    switch (provider) {
        case "resend":
            if (!process.env.RESEND_API_KEY) {
                logger.warn("RESEND_API_KEY not set, falling back to Nodemailer");
                return createNodemailerTransporter();
            }
            return {
                provider: "resend",
                send: async ({ to, subject, html, text }) => {
                    const { Resend } = await import("resend");
                    const resend = new Resend(process.env.RESEND_API_KEY);
                    const result = await resend.emails.send({
                        from: process.env.SMTP_MAIL,
                        to,
                        subject,
                        html,
                        text,
                    });
                    return {
                        messageId: result.data?.id || "",
                        providerMessageId: result.data?.id || "",
                    };
                },
            };

        case "sendgrid":
            if (!process.env.SENDGRID_API_KEY) {
                logger.warn("SENDGRID_API_KEY not set, falling back to Nodemailer");
                return createNodemailerTransporter();
            }
            return {
                provider: "sendgrid",
                send: async ({ to, subject, html, text }) => {
                    const sgMail = (await import("@sendgrid/mail")).default;
                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                    const msg = {
                        to,
                        from: process.env.SMTP_MAIL,
                        subject,
                        html,
                        text,
                    };
                    const result = await sgMail.send(msg);
                    return {
                        messageId: result[0]?.headers?.["x-message-id"] || "",
                        providerMessageId: result[0]?.headers?.["x-message-id"] || "",
                    };
                },
            };

        case "mailgun":
            if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
                logger.warn("Mailgun not configured, falling back to Nodemailer");
                return createNodemailerTransporter();
            }
            return {
                provider: "mailgun",
                send: async ({ to, subject, html, text }) => {
                    const formData = (await import("form-data")).default;
                    const Mailgun = (await import("mailgun.js")).default;
                    const mg = Mailgun(formData);
                    const client = mg.client({
                        username: "api",
                        key: process.env.MAILGUN_API_KEY,
                    });
                    const result = await client.messages.create(
                        process.env.MAILGUN_DOMAIN,
                        {
                            from: process.env.SMTP_MAIL,
                            to,
                            subject,
                            html,
                            text,
                        }
                    );
                    return {
                        messageId: result.id || "",
                        providerMessageId: result.id || "",
                    };
                },
            };

        case "ses":
            if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
                logger.warn("AWS SES not configured, falling back to Nodemailer");
                return createNodemailerTransporter();
            }
            return {
                provider: "ses",
                send: async ({ to, subject, html, text }) => {
                    const { SESClient, SendEmailCommand } = await import("@aws-sdk/client-ses");
                    const client = new SESClient({
                        region: process.env.AWS_REGION || "us-east-1",
                        credentials: {
                            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                        },
                    });
                    const command = new SendEmailCommand({
                        Destination: { ToAddresses: [to] },
                        Message: {
                            Subject: { Data: subject },
                            Body: {
                                Html: { Data: html },
                                Text: { Data: text },
                            },
                        },
                        Source: process.env.SMTP_MAIL,
                    });
                    const result = await client.send(command);
                    return {
                        messageId: result.MessageId || "",
                        providerMessageId: result.MessageId || "",
                    };
                },
            };

        default:
            return createNodemailerTransporter();
    }
};

/*
==================================================
NODEMAILER TRANSPORTER (DEFAULT)
==================================================
*/
const createNodemailerTransporter = () => {
    if (!process.env.SMTP_MAIL || !process.env.SMTP_PASSWORD) {
        throw new Error("SMTP_MAIL and SMTP_PASSWORD must be configured before email can be sent.");
    }

    const transporterObj = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || undefined,
        host: process.env.SMTP_HOST || (process.env.SMTP_SERVICE ? undefined : "smtp.gmail.com"),
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    return {
        provider: "nodemailer",
        send: async ({ to, subject, html, text }) => {
            const info = await transporterObj.sendMail({
                from: process.env.SMTP_FROM || `"${process.env.STORE_NAME || "E-Commerce"}" <${process.env.SMTP_MAIL}>`,
                to,
                subject,
                html,
                text,
                headers: {
                    "List-Unsubscribe": `<mailto:${process.env.SMTP_MAIL}?subject=unsubscribe>`,
                    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                },
            });
            return {
                messageId: info.messageId || "",
                providerMessageId: info.messageId || "",
            };
        },
    };
};

/*
==================================================
GENERATE OPEN TRACKING ID
==================================================
*/
const generateOpenTrackingId = () => {
    return crypto.randomBytes(16).toString("hex");
};

/*
==================================================
SEND EMAIL (CORE)
==================================================
*/
const sendEmail = async ({
    to,
    subject,
    html,
    text = "",
    template,
    userId = null,
    campaignId = null,
    metadata = {},
}) => {
    const logData = {
        recipient: {
            email: to,
            userId,
        },
        subject,
        template: template || "custom",
        provider: getProvider(),
        status: "queued",
    };

    try {
        // Create email log
        const openTrackingId = generateOpenTrackingId();
        const emailLog = await EmailLog.create({
            ...logData,
            openTrackingId,
            campaign: campaignId,
            metadata,
        });

        // Inject tracking pixel
        const baseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 5000}`;
        const trackingPixel = `<img src="${baseUrl}/api/email/track/open/${openTrackingId}" width="1" height="1" style="display:none;" alt=""/>`;

        // Wrap links for click tracking
        const trackedHtml = html.replace(
            /<a\s+(?:[^>]*?\s+)?href="([^"]+)"/g,
            (match, url) => {
                const encodedUrl = encodeURIComponent(url);
                return match.replace(
                    url,
                    `${baseUrl}/api/email/track/click/${openTrackingId}?url=${encodedUrl}`
                );
            }
        );

        const finalHtml = trackedHtml + trackingPixel;

        // Get provider and send
        if (!transporter) {
            transporter = createTransporter();
        }

        const result = await transporter.send({
            to,
            subject,
            html: finalHtml,
            text,
        });

        // Update log as sent
        emailLog.status = "sent";
        emailLog.messageId = result.messageId;
        emailLog.providerMessageId = result.providerMessageId;
        emailLog.sentAt = new Date();
        await emailLog.save();

        logger.info(`Email sent successfully to ${to}`, {
            template,
            messageId: result.messageId,
        });

        return { success: true, emailLog };
    } catch (error) {
        logger.error(`Failed to send email to ${to}: ${error.message}`, {
            template,
            error: error.stack,
        });

        // Update log as failed
        try {
            const emailLog = await EmailLog.create({
                ...logData,
                status: "failed",
                errorMessage: error.message,
                campaign: campaignId,
                metadata,
            });
            return { success: false, error: error.message, emailLog };
        } catch (logError) {
            logger.error("Failed to create email log:", logError.message);
            return { success: false, error: error.message };
        }
    }
};

/*
==================================================
SEND BULK EMAIL
==================================================
*/
const sendBulkEmail = async (recipients, { subject, html, text, template, campaignId }) => {
    const results = [];
    for (const recipient of recipients) {
        const result = await sendEmail({
            to: recipient.email,
            subject,
            html,
            text,
            template,
            userId: recipient.userId || null,
            campaignId,
            metadata: recipient.metadata || {},
        });
        results.push(result);
        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return results;
};

/*
==================================================
SEND TEST EMAIL
==================================================
*/
const sendTestEmail = async (to, campaign) => {
    return sendEmail({
        to,
        subject: `[TEST] ${campaign.subject}`,
        html: campaign.htmlContent,
        text: campaign.plainTextContent,
        template: campaign.template,
        metadata: { testEmail: true },
    });
};

/*
==================================================
TRACK OPEN
==================================================
*/
const trackOpen = async (trackingId) => {
    try {
        const emailLog = await EmailLog.findOne({ openTrackingId: trackingId });
        if (emailLog) {
            emailLog.status = "opened";
            emailLog.openedAt = emailLog.openedAt || new Date();
            emailLog.openCount += 1;
            await emailLog.save();
        }
    } catch (error) {
        logger.error("Error tracking open:", error.message);
    }
};

/*
==================================================
TRACK CLICK
==================================================
*/
const trackClick = async (trackingId, url) => {
    try {
        const emailLog = await EmailLog.findOne({ openTrackingId: trackingId });
        if (emailLog) {
            emailLog.status = "clicked";
            emailLog.clickedAt = emailLog.clickedAt || new Date();
            emailLog.clickCount += 1;
            emailLog.clickedLinks.push({ url, clickedAt: new Date() });
            await emailLog.save();
        }
    } catch (error) {
        logger.error("Error tracking click:", error.message);
    }
};

/*
==================================================
EXPORT
==================================================
*/
export {
    sendEmail,
    sendBulkEmail,
    sendTestEmail,
    trackOpen,
    trackClick,
    createTransporter,
};
