import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = async (req, res, next) => {
    try {
        let token;

        // Check token exists
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            // Get token from header
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            // Get user from token
            req.user = await User.findById(decoded.id).select("-password");

            next();
        } else {
            return res.status(401).json({
                success: false,
                message: "Not authorized, no token"
            });
        }
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token failed"
        });
    }
};



// ADMIN MIDDLEWARE
export const admin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Admin access only"
        });
    }
};