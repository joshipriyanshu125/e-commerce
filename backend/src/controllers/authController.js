import asyncHandler from "../middleware/asyncHandler.js";

import {
    registerUserService,
    loginUserService,
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

    res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
            _id: mongoUser._id,
            name: mongoUser.name,
            email: mongoUser.email,
            role: mongoUser.role,
        },
        token,
    });
});

export {
    registerUser,
    loginUser,
};