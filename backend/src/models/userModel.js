import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: function () {
                return !this.googleId && this.authProvider === "local";
            },
            minlength: 6,
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },

        googleId: {
            type: String,
            default: null,
            sparse: true,
        },

        avatar: {
            type: String,
            default: "",
        },

        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
        },

        isBlocked: {
            type: Boolean,
            default: false,
        },

        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        ],

        // ── AI Fashion Profile ────────────────────────────────────────────────
        onboardingCompleted: {
            type: Boolean,
            default: false,
        },
        styleProfile: {
            styles: { type: [String], default: [] },
            preferredColors: { type: [String], default: [] },
            favoriteCategories: { type: [String], default: [] },
            preferredFit: { type: [String], default: [] },
            occasions: { type: [String], default: [] },
            priceRange: { type: String, default: "" },
            generatedAt: { type: Date },
        },

        // ── AI Size Profile ───────────────────────────────────────────────────
        measurements: {
            height:       { type: Number, default: null },   // cm
            weight:       { type: Number, default: null },   // kg
            usualSize:    { type: String, default: "" },     // XS/S/M/L/XL/XXL
            preferredFit: { type: String, default: "" },     // slim/regular/relaxed/oversized
            bodyType:     { type: String, default: "" },     // slim/average/athletic/plus
            updatedAt:    { type: Date },
        },
    },
    {
        timestamps: true,
    }
);

/*
==================================================
HASH PASSWORD BEFORE SAVING
==================================================
*/
userSchema.pre("save", async function (next) {
    if (!this.password || !this.isModified("password")) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    next();
});

/*
==================================================
COMPARE PASSWORD
==================================================
*/
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(
        enteredPassword,
        this.password
    );
};

const User = mongoose.model("User", userSchema);

export default User;