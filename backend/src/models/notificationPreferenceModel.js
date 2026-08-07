import mongoose from "mongoose";

const notificationPreferenceSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },

        // Email notification toggles
        email: {
            promotionalEmails: { type: Boolean, default: true },
            orderUpdates: { type: Boolean, default: true },
            deliveryUpdates: { type: Boolean, default: true },
            returnRefundUpdates: { type: Boolean, default: true },
            wishlistAlerts: { type: Boolean, default: true },
            priceDropAlerts: { type: Boolean, default: true },
            backInStockAlerts: { type: Boolean, default: true },
            newArrivalEmails: { type: Boolean, default: false },
            weeklyNewsletter: { type: Boolean, default: false },
            securityAlerts: { type: Boolean, default: true },
            cartReminders: { type: Boolean, default: true },
            reviewReminders: { type: Boolean, default: true },
        },

        // In-app notification toggles
        inApp: {
            orderUpdates: { type: Boolean, default: true },
            deliveryUpdates: { type: Boolean, default: true },
            returnRefundUpdates: { type: Boolean, default: true },
            wishlistAlerts: { type: Boolean, default: true },
            priceDropAlerts: { type: Boolean, default: true },
            backInStockAlerts: { type: Boolean, default: true },
            promotions: { type: Boolean, default: true },
            securityAlerts: { type: Boolean, default: true },
        },

        // Push notification toggles (future)
        push: {
            enabled: { type: Boolean, default: false },
            orderUpdates: { type: Boolean, default: true },
            deliveryUpdates: { type: Boolean, default: true },
            promotions: { type: Boolean, default: false },
        },

        // SMS notification toggles (future)
        sms: {
            enabled: { type: Boolean, default: false },
            orderUpdates: { type: Boolean, default: true },
            deliveryUpdates: { type: Boolean, default: true },
        },

        // Global opt-out
        allEmailsOptedOut: { type: Boolean, default: false },
        marketingOptedOut: { type: Boolean, default: false },

        // Unsubscribe token for one-click unsubscribe
        unsubscribeToken: { type: String, unique: true, sparse: true },

        // Last updated
        lastUpdated: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

// Update lastUpdated on save
notificationPreferenceSchema.pre("save", function (next) {
    this.lastUpdated = new Date();
    next();
});

// Static method to get or create preferences for a user
notificationPreferenceSchema.statics.getOrCreate = async function (userId) {
    let prefs = await this.findOne({ user: userId });
    if (!prefs) {
        prefs = await this.create({ user: userId });
    }
    return prefs;
};

// Check if a specific email type is allowed
notificationPreferenceSchema.methods.isEmailAllowed = function (type) {
    if (this.allEmailsOptedOut) return false;
    if (type === "marketing" && this.marketingOptedOut) return false;
    return this.email[type] !== false;
};

const NotificationPreference = mongoose.model(
    "NotificationPreference",
    notificationPreferenceSchema
);

export default NotificationPreference;