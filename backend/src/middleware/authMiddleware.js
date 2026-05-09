import jwt from "jsonwebtoken";
import asyncHandler from "../middleware/asyncHandler.js";
import User from "../models/userModel.js";


export const protect = asyncHandler(async (req, res, next) => {

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

        res.status(401);
        throw new Error("Not authorized, no token");

    }

});



// ADMIN MIDDLEWARE
export const admin = (req, res, next) => {

    if (req.user && req.user.role === "admin") {

        next();

    } else {

        res.status(403);
        throw new Error("Admin access only");

    }

};