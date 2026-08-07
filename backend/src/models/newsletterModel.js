import mongoose from "mongoose";
import crypto from "crypto";

const newsletterSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        name: {
            type: String,
            default: "",
            trim: true,
        },

        // Subscription status
        isSubscribed: {
            type: Boolean,
            default: true,
            index: true,
        },

        // Double opt-in
        isVerified: {
            type: Boolean,
            default: false,
        },

        // Verification token
        verificationToken: {
            type: String,
            unique: true,
            sparse: true,
        },

        verificationTokenExpires: {
            type: Date,
            default: null,
        },

        verifiedAt: {
            type: Date,
            default: null,
        },

        // Unsubscribe
        unsubscribeToken: {
            type: String,
            unique: true,
            sparse: true,
        },

        unsubscribedAt: {
            type: Date,
            default: null,
        },

        unsubscribeReason: {
            type: String,
            default: "",
        },

        // User reference (if registered user)
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // Preferences
        preferences: {
            weeklyNewsletter: { type: Boolean, default: true },
            monthlyNewsletter: { type: Boolean, default: true },
            fashionTips: { type: Boolean, default: true },
            trendingCollections: { type: Boolean, default: true },
            styleGuides: { type: Boolean, default: false },
            upcomingSales: { type: Boolean, default: true },
            newArrivals: { type: Boolean, default: true },
            exclusiveOffers: { type: Boolean, default: false },
        },

        // Source of subscription
        source: {
            type: String,
            enum: ["registration", "checkout", "footer", "popup", "landing_page", "admin"],
            default: "footer",
        },

        // Metadata
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        // Bounce/complaint tracking
        bouncedAt: { type: Date, default: null },
        bounceReason: { type: String, default: "" },
        complainedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
    }
);

// Generate verification token before saving if not verified
newsletterSchema.pre("save", function (next) {
    if (!this.isVerified && !this.verificationToken) {
        this.verificationToken = crypto.randomBytes(32).toString("hex");
        this.verificationTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }
    if (!this.unsubscribeToken) {
        this.unsubscribeToken = crypto.randomBytes(32).toString("hex");
    }
    next();
});

// Static: subscribe with double opt-in
newsletterSchema.statics.subscribe = async function (email, name = "", source = "footer") {
    const existing = await this.findOne({ email: email.toLowerCase() });
    if (existing) {
        if (existing.isSubscribed && existing.isVerified) {
            return { success: false, message: "Already subscribed" };
        }
        // Resend verification
        existing.verificationToken = crypto.randomBytes(32).toString("hex");
        existing.verificationTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await existing.save();
        return { success: true, message: "Verification email resent", subscriber: existing };
    }
    const subscriber = await this.create({
        email: email.toLowerCase(),
        name,
        source,
        isSubscribed: true,
        isVerified: false,
    });
    return { success: true, message: "Verification email sent", subscriber };
};

// Static: verify email
newsletterSchema.statics.verify = async function (token) {
    const subscriber = await this.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: new Date() },
    });
    if (!subscriber) return { success: false, message: "Invalid or expired token" };
    subscriber.isVerified = true;
    subscriber.verificationToken = undefined;
    subscriber.verificationTokenExpires = undefined;
    subscriber.verifiedAt = new Date();
    await subscriber.save();
    return { success: true, message: "Email verified successfully", subscriber };
};

// Static: unsubscribe
newsletterSchema.statics.unsubscribe = async function (token) {
    const subscriber = await this.findOne({ unsubscribeToken: token });
    if (!subscriber) return { success: false, message: "Invalid unsubscribe token" };
    subscriber.isSubscribed = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();
    return { success: true, message: "Unsubscribed successfully", subscriber };
};

const Newsletter = mongoose.model("Newsletter", newsletterSchema);

export default Newsletter;