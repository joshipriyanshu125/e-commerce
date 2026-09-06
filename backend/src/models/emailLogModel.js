import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema(
    {
        // Recipient
        recipient: {
            email: { type: String, required: true, lowercase: true, trim: true },
            name: { type: String, default: "" },
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: null,
                index: true,
            },
        },

        // Email details
        subject: {
            type: String,
            required: true,
        },

        template: {
            type: String,
            required: true,
            enum: [
                // Account
                "welcome",
                "email_verification",
                "email_verified",
                "forgot_password",
                "password_changed",
                "email_changed",
                "account_blocked",
                "account_unblocked",
                "account_deleted",
                // Order
                "order_placed",
                "order_confirmed",
                "payment_successful",
                "payment_failed",
                "order_packed",
                "order_shipped",
                "order_out_for_delivery",
                "order_delivered",
                "order_cancelled",
                "invoice_generated",
                // Shipping
                "courier_assigned",
                "tracking_generated",
                "package_delayed",
                "delivery_rescheduled",
                "package_delivered",
                // Returns
                "return_requested",
                "return_approved",
                "return_rejected",
                "pickup_scheduled",
                "item_received",
                "refund_initiated",
                "refund_completed",
                // Payment
                "payment_successful",
                "payment_failed_refund",
                "refund_successful",
                "refund_failed",
                "cod_confirmed",
                // Wishlist
                "back_in_stock",
                "price_dropped",
                "limited_stock",
                "flash_sale_started",
                "wishlist_discontinued",
                // Promotional
                "new_arrivals",
                "weekend_sale",
                "flash_sale",
                "festival_sale",
                "exclusive_offer",
                "birthday_discount",
                "anniversary_discount",
                "limited_time_deal",
                "trending_products",
                "recommended_products",
                "best_sellers",
                "recently_viewed",
                "cart_reminder",
                // Cart Recovery
                "cart_recovery_2h",
                "cart_recovery_24h",
                "cart_recovery_3d",
                // Newsletter
                "weekly_newsletter",
                "monthly_newsletter",
                "fashion_tips",
                "trending_collections",
                "style_guides",
                "upcoming_sales",
                // Free-form/admin notifications
                "newsletter_broadcast",
                "notification",
                "custom",
            ],
        },

        // Provider used
        provider: {
            type: String,
            enum: ["nodemailer", "resend", "sendgrid", "mailgun", "ses"],
            default: "nodemailer",
        },

        // Status
        status: {
            type: String,
            enum: ["queued", "sent", "delivered", "failed", "bounced", "opened", "clicked", "unsubscribed"],
            default: "queued",
            index: true,
        },

        // Tracking
        messageId: { type: String, default: "" },
        providerMessageId: { type: String, default: "" },

        // Open tracking
        openedAt: { type: Date, default: null },
        openCount: { type: Number, default: 0 },
        openTrackingId: { type: String, unique: true, sparse: true },

        // Click tracking
        clickedAt: { type: Date, default: null },
        clickCount: { type: Number, default: 0 },
        clickedLinks: [
            {
                url: String,
                clickedAt: Date,
            },
        ],

        // Bounce/Error info
        errorMessage: { type: String, default: "" },
        bounceType: {
            type: String,
            enum: ["hard", "soft", "transient", ""],
            default: "",
        },
        bounceCategory: { type: String, default: "" },

        // Unsubscribe
        unsubscribedAt: { type: Date, default: null },
        unsubscribeReason: { type: String, default: "" },

        // Campaign info (if part of a campaign)
        campaign: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Campaign",
            default: null,
        },

        // Retry info
        retryCount: { type: Number, default: 0 },
        maxRetries: { type: Number, default: 3 },
        lastRetryAt: { type: Date, default: null },
        nextRetryAt: { type: Date, default: null },

        // Metadata
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

        // Sent at
        sentAt: { type: Date, default: null },
        deliveredAt: { type: Date, default: null },
    },
    {
        timestamps: true,
    }
);

// Indexes
emailLogSchema.index({ "recipient.email": 1, createdAt: -1 });
emailLogSchema.index({ status: 1, createdAt: -1 });
emailLogSchema.index({ template: 1, createdAt: -1 });
emailLogSchema.index({ campaign: 1 });

emailLogSchema.index({ nextRetryAt: 1 }, { sparse: true });

// TTL index for old logs (auto-delete after 2 years)
emailLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

const EmailLog = mongoose.model("EmailLog", emailLogSchema);

export default EmailLog;
