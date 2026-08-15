import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

import {
    findUserByEmail,
    findUserByGoogleId,
    createUser,
} from "../../repositories/userRepository.js";

import { notifyAdmins } from "./notificationService.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/*
==================================================
GENERATE JWT
==================================================
*/
const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
};

/*
==================================================
REGISTER USER
==================================================
*/
const registerUserService = async ({
    name,
    email,
    password,
}) => {

    const existingUser =
        await findUserByEmail(email);

    if (existingUser) {
        throw new Error("User already exists");
    }

    const user =
        await createUser({
            name,
            email,
            password,
        });

    // Notify admins about new user registration (non-blocking)
    notifyAdmins({
        title: "New User Registered",
        message: `New user registered: ${name} (${email})`,
        type: "new_user",
    }).catch(err => console.error("Admin user registration notify error:", err));

    return {
        success: true,
        token: generateToken(user._id),
        user,
    };
};

/*
==================================================
LOGIN USER
==================================================
*/
const loginUserService = async ({
    email,
    password,
}) => {

    const user =
        await findUserByEmail(email);

    if (!user) {
        throw new Error("Invalid email or password");
    }

    const isMatch =
        await user.matchPassword(password);

    if (!isMatch) {
        throw new Error("Invalid email or password");
    }

    return {
        success: true,
        token: generateToken(user._id),
        user,
    };
};

/*
==================================================
GOOGLE OAUTH SERVICE
==================================================
*/
const googleAuthService = async ({ credential, accessToken }) => {
    let payload = null;

    if (credential) {
        // Verify Google ID token
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID || undefined,
            });
            payload = ticket.getPayload();
        } catch (verifyErr) {
            // Fallback to tokeninfo endpoint
            try {
                const response = await axios.get(
                    `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
                );
                payload = response.data;
            } catch (err) {
                throw new Error("Invalid or expired Google credential token");
            }
        }
    } else if (accessToken) {
        // Verify with userinfo endpoint using access token
        try {
            const response = await axios.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );
            payload = response.data;
        } catch (err) {
            throw new Error("Invalid or expired Google access token");
        }
    } else {
        throw new Error("No Google credentials or access token provided");
    }

    if (!payload || !payload.email) {
        throw new Error("Google authentication failed to retrieve user profile");
    }

    const email = payload.email.toLowerCase().trim();
    const name = payload.name || payload.given_name || email.split("@")[0];
    const googleId = payload.sub || payload.id;
    const avatar = payload.picture || "";

    // Check if user already exists by googleId or email
    let user = await findUserByGoogleId(googleId);

    if (!user) {
        user = await findUserByEmail(email);
        if (user) {
            // User registered previously with email; link Google account
            user.googleId = googleId;
            if (!user.avatar && avatar) {
                user.avatar = avatar;
            }
            if (!user.authProvider || user.authProvider === "local") {
                user.authProvider = "google";
            }
            await user.save();
        } else {
            // Create new Google OAuth user
            user = await createUser({
                name,
                email,
                googleId,
                avatar,
                authProvider: "google",
                onboardingCompleted: false,
            });

            // Notify admins about new user registration (non-blocking)
            notifyAdmins({
                title: "New Google User Registered",
                message: `New user joined via Google: ${name} (${email})`,
                type: "new_user",
            }).catch((err) =>
                console.error("Admin Google user registration notify error:", err)
            );
        }
    }

    if (user.isBlocked) {
        throw new Error("Your account has been blocked. Please contact support.");
    }

    return {
        success: true,
        token: generateToken(user._id),
        user,
    };
};

export {
    registerUserService,
    loginUserService,
    googleAuthService,
};