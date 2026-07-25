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