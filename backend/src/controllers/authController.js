import asyncHandler from "../middleware/asyncHandler.js";

import {
    registerUserService,
    loginUserService,
    googleAuthService,
} from "../services/authService.js";

/*
====================================
REGISTER USER
====================================
*/
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const { user: mongoUser, token } = await registerUserService({
        name,
        email,
        password,
    });

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
            _id: mongoUser._id,
            name: mongoUser.name,
            email: mongoUser.email,
            role: mongoUser.role,
            avatar: mongoUser.avatar,
            onboardingCompleted: mongoUser.onboardingCompleted,
        },
        token,
    });
});

/*
====================================
LOGIN USER
====================================
*/
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { user: mongoUser, token } = await loginUserService({
        email,
        password,
    });

    if (mongoUser.isBlocked) {
        res.status(403);
        throw new Error("Your account has been blocked. Please contact support.");
    }

    res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
            _id: mongoUser._id,
            name: mongoUser.name,
            email: mongoUser.email,
            role: mongoUser.role,
            avatar: mongoUser.avatar,
            onboardingCompleted: mongoUser.onboardingCompleted,
        },
        token,
    });
});

/*
====================================
GOOGLE OAUTH LOGIN / SIGNUP
====================================
*/
const googleAuth = asyncHandler(async (req, res) => {
    const { credential, accessToken } = req.body;

    const { user: mongoUser, token } = await googleAuthService({
        credential,
        accessToken,
    });

    res.status(200).json({
        success: true,
        message: "Google authentication successful",
        user: {
            _id: mongoUser._id,
            name: mongoUser.name,
            email: mongoUser.email,
            role: mongoUser.role,
            avatar: mongoUser.avatar,
            onboardingCompleted: mongoUser.onboardingCompleted,
        },
        token,
    });
});

export {
    registerUser,
    loginUser,
    googleAuth,
};