import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

/*
==================================================
PROTECT MIDDLEWARE
==================================================
*/
export const protect = async (req, res, next) => {
    try {
        let token;

        // Check Authorization Header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        // No Token
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, no token",
            });
        }

        // Verify JWT Token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Find User
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        // Attach user to request
        req.user = user;

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Not authorized, token failed",
        });
    }
};

/*
==================================================
ADMIN MIDDLEWARE
==================================================
*/
export const admin = (req, res, next) => {
    try {
        if (req.user && req.user.role === "admin") {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: "Admin access only",
        });
    } catch (error) {
        console.error("Admin Middleware Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};