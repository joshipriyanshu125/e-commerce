import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
    {
        // Campaign info
        name: {
            type: String,
            required: true,
            trim: true,
        },

        subject: {
            type: String,
            required: true,
            trim: true,
        },

        preheader: {
            type: String,
            default: "",
            trim: true,
            maxlength: 150,
        },

        // Template type
        template: {
            type: String,
            required: true,
            enum: [
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
                "weekly_newsletter",
                "monthly_newsletter",
                "fashion_tips",
                "trending_collections",
                "style_guides",
                "upcoming_sales",
                "custom",
            ],
        },

        // HTML content (for custom campaigns)
        htmlContent: {
            type: String,
            default: "",
        },

        // Plain text fallback
        plainTextContent: {
            type: String,
            default: "",
        },

        // Audience targeting
        audience: {
            type: {
                type: String,
                enum: [
                    "all_subscribers",
                    "verified_subscribers",
                    "all_users",
                    "active_users",
                    "new_users",
                    "returning_users",
                    "premium_users",
                    "specific_segment",
                    "test_group",
                ],
                default: "all_subscribers",
            },
            // Filter criteria for specific segment
            filters: {
                // Min/max order count
                minOrders: { type: Number, default: 0 },
                maxOrders: { type: Number, default: null },
                // Min/max total spent
                minSpent: { type: Number, default: 0 },
                maxSpent: { type: Number, default: null },
                // Registered within days
                registeredWithinDays: { type: Number, default: null },
                // Last purchase within days
                lastPurchaseWithinDays: { type: Number, default: null },
                // Specific tags
                tags: [{ type: String }],
            },
            // Estimated recipients count
            estimatedRecipients: { type: Number, default: 0 },
            // Actual recipients who received
            actualRecipients: { type: Number, default: 0 },
        },

        // Schedule
        status: {
            type: String,
            enum: [
                "draft",
                "scheduled",
                "sending",
                "sent",
                "paused",
                "cancelled",
                "failed",
            ],
            default: "draft",
            index: true,
        },

        scheduledAt: {
            type: Date,
            default: null,
        },

        sentAt: {
            type: Date,
            default: null,
        },

        completedAt: {
            type: Date,
            default: null,
        },

        // Send test email
        testEmails: [
            {
                email: { type: String, lowercase: true, trim: true },
                sentAt: { type: Date, default: null },
                status: {
                    type: String,
                    enum: ["pending", "sent", "failed"],
                    default: "pending",
                },
            },
        ],

        // Analytics
        stats: {
            sent: { type: Number, default: 0 },
            delivered: { type: Number, default: 0 },
            opened: { type: Number, default: 0 },
            clicked: { type: Number, default: 0 },
            bounced: { type: Number, default: 0 },
            complained: { type: Number, default: 0 },
            unsubscribed: { type: Number, default: 0 },
            failed: { type: Number, default: 0 },
            openRate: { type: Number, default: 0 },
            clickRate: { type: Number, default: 0 },
            bounceRate: { type: Number, default: 0 },
            unsubscribeRate: { type: Number, default: 0 },
        },

        // Coupon associated with campaign (optional)
        coupon: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Coupon",
            default: null,
        },

        // Created by admin
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Notes
        notes: {
            type: String,
            default: "",
        },

        // Is this a recurring campaign?
        isRecurring: {
            type: Boolean,
            default: false,
        },

        recurringInterval: {
            type: String,
            enum: ["", "daily", "weekly", "monthly", "quarterly"],
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
campaignSchema.index({ status: 1, scheduledAt: 1 });
campaignSchema.index({ createdBy: 1, createdAt: -1 });
campaignSchema.index({ template: 1 });

// Calculate rates before saving
campaignSchema.pre("save", function (next) {
    if (this.stats.delivered > 0) {
        this.stats.openRate = Math.round(
            (this.stats.opened / this.stats.delivered) * 100 * 100
        ) / 100;
        this.stats.clickRate = Math.round(
            (this.stats.clicked / this.stats.delivered) * 100 * 100
        ) / 100;
        this.stats.bounceRate = Math.round(
            (this.stats.bounced / this.stats.sent) * 100 * 100
        ) / 100;
        this.stats.unsubscribeRate = Math.round(
            (this.stats.unsubscribed / this.stats.delivered) * 100 * 100
        ) / 100;
    }
    next();
});

const Campaign = mongoose.model("Campaign", campaignSchema);

export default Campaign;