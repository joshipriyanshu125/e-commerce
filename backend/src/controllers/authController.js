import asyncHandler from "../middleware/asyncHandler.js";

import {
    registerUserService,
    loginUserService,
} from "../services/authService.js";

/*
==============================
REGISTER USER
==============================
*/
const registerUser = asyncHandler(
    async (req, res) => {

        const {
            name,
            email,
            password,
        } = req.body;

        const user =
            await registerUserService({
                name,
                email,
                password,
            });

        // RESPONSE
        res.status(201).json({

            success: true,

            message:
                "User registered successfully",

            _id: user._id,

            name: user.name,

            email: user.email,

            role: user.role,

            token: user.token,
        });
    }
);

/*
==============================
LOGIN USER
==============================
*/
const loginUser = asyncHandler(
    async (req, res) => {

        const {
            email,
            password,
        } = req.body;

        const user =
            await loginUserService({
                email,
                password,
            });

        // RESPONSE
        res.status(200).json({

            success: true,

            message:
                "Login successful",

            _id: user._id,

            name: user.name,

            email: user.email,

            role: user.role,

            token: user.token,
        });
    }
);

export {
    registerUser,
    loginUser,
};