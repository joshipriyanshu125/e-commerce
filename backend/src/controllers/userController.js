import asyncHandler from "../middleware/asyncHandler.js";
import User from "../models/userModel.js";
import Order from "../models/Order.js";
import Address from "../models/addressModel.js";
import bcrypt from "bcryptjs";

/*
====================================
GET USER PROFILE
====================================
*/
export const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    res.status(200).json({
        success: true,
        user,
    });
});

/*
====================================
UPDATE USER PROFILE
====================================
*/
export const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;

    if (req.body.password) {
        user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
        },
    });
});

/*
====================================
ADMIN TEST ROUTE
====================================
*/
export const adminRoute = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome Admin",
    });
});

/*
====================================
GET ALL USERS (ADMIN)
====================================
*/
export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        users,
    });
});

/*
====================================
DELETE USER (ADMIN)
====================================
*/
export const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }
    // Prevent deleting self
    if (user._id.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error("You cannot delete yourself");
    }
    await user.deleteOne();
    res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
});

/*
====================================
BLOCK USER (ADMIN)
====================================
*/
export const blockUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }
    if (user._id.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error("You cannot block yourself");
    }
    user.isBlocked = true;
    await user.save();
    res.status(200).json({ success: true, message: "User blocked successfully" });
});

/*
====================================
UNBLOCK USER (ADMIN)
====================================
*/
export const unblockUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }
    user.isBlocked = false;
    await user.save();
    res.status(200).json({ success: true, message: "User unblocked successfully" });
});

/*
====================================
GET USER ORDERS (ADMIN)
====================================
*/
export const getUserOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.params.id })
        .sort({ createdAt: -1 })
        .populate("orderItems.product", "name images price");

    res.status(200).json({ success: true, orders });
});

/*
====================================
GET USER ADDRESSES (ADMIN)
====================================
*/
export const getUserAddresses = asyncHandler(async (req, res) => {
    const addresses = await Address.find({ user: req.params.id }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({ success: true, addresses });
});

/*
====================================
RESET USER PASSWORD (ADMIN)
====================================
*/
export const adminResetPassword = asyncHandler(async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        res.status(400);
        throw new Error("Password must be at least 6 characters");
    }
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: "Password reset successfully" });
});

/*
====================================
SAVE AI STYLE PROFILE
====================================
*/
export const saveStyleProfile = asyncHandler(async (req, res) => {
    const { styles, preferredColors, favoriteCategories, preferredFit, occasions, priceRange } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    user.styleProfile = {
        styles: styles || [],
        preferredColors: preferredColors || [],
        favoriteCategories: favoriteCategories || [],
        preferredFit: preferredFit || [],
        occasions: occasions || [],
        priceRange: priceRange || "",
        generatedAt: new Date(),
    };
    user.onboardingCompleted = true;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Style profile saved successfully",
        styleProfile: user.styleProfile,
        onboardingCompleted: user.onboardingCompleted,
    });
});

/*
====================================
SAVE BODY MEASUREMENTS
====================================
*/
export const saveMeasurements = asyncHandler(async (req, res) => {
    const { height, weight, usualSize, preferredFit, bodyType } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    user.measurements = {
        height:       height       ? Number(height)  : user.measurements?.height  || null,
        weight:       weight       ? Number(weight)  : user.measurements?.weight  || null,
        usualSize:    usualSize    || user.measurements?.usualSize    || "",
        preferredFit: preferredFit || user.measurements?.preferredFit || "",
        bodyType:     bodyType     || user.measurements?.bodyType     || "",
        updatedAt: new Date(),
    };

    await user.save();

    res.status(200).json({
        success: true,
        message: "Measurements saved successfully",
        measurements: user.measurements,
    });
});

/*
====================================
GET AI SIZE RECOMMENDATION
====================================
Logic: BMI-based sizing + fit adjustment + usual-size anchor.
Returns a recommended size and a plain-English rationale.
====================================
*/
export const getSizeRecommendation = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("measurements");
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    const m = user.measurements || {};
    if (!m.height || !m.weight || !m.usualSize) {
        return res.status(200).json({ success: true, recommendation: null, message: "Incomplete measurements" });
    }

    const ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
    const bmi = m.weight / ((m.height / 100) ** 2);

    // Base size from BMI
    let baseIndex;
    if (bmi < 17.5)      baseIndex = 0; // XS
    else if (bmi < 19)   baseIndex = 1; // S
    else if (bmi < 22)   baseIndex = 2; // M
    else if (bmi < 25)   baseIndex = 3; // L
    else if (bmi < 29)   baseIndex = 4; // XL
    else if (bmi < 33)   baseIndex = 5; // XXL
    else                 baseIndex = 6; // XXXL

    // Anchor toward usual size (average BMI-base and stated size)
    const usualIndex = ORDER.indexOf(m.usualSize.toUpperCase());
    let idx = usualIndex !== -1 ? Math.round((baseIndex + usualIndex) / 2) : baseIndex;

    // Fit adjustment
    const fit = (m.preferredFit || "").toLowerCase();
    if (fit === "oversized" && idx < ORDER.length - 1) idx += 1;
    if (fit === "slim"      && idx > 0)                idx -= 1;

    idx = Math.max(0, Math.min(ORDER.length - 1, idx));
    const recommended = ORDER[idx];

    // Build reason string
    const reasons = [`your measurements (${m.height} cm, ${m.weight} kg)`];
    if (usualIndex !== -1 && usualIndex !== baseIndex) reasons.push(`your usual size ${m.usualSize}`);
    if (fit === "oversized" || fit === "slim") reasons.push(`a ${fit} fit preference`);

    const message = `We recommend ${recommended} based on ${reasons.join(", ")}.`;

    res.status(200).json({
        success: true,
        recommendation: recommended,
        message,
        bmi: Math.round(bmi * 10) / 10,
    });
});