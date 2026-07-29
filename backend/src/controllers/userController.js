import asyncHandler from "../middleware/asyncHandler.js";
import User from "../models/userModel.js";

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

// GET ALL USERS (ADMIN)
export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        users,
    });
});

// DELETE USER (ADMIN)
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