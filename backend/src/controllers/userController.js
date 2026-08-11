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
    const { styles, preferredColors, favoriteCategories, priceRange } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    user.styleProfile = {
        styles: styles || [],
        preferredColors: preferredColors || [],
        favoriteCategories: favoriteCategories || [],
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