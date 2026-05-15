import jwt from "jsonwebtoken";

import User from "../models/userModel.js";


// ========================= PROTECT MIDDLEWARE =========================

export const protect = async (req, res, next) => {

    let token;

    try {

        // CHECK AUTH HEADER
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {

            // GET TOKEN
            token =
                req.headers.authorization.split(" ")[1];


            // VERIFY TOKEN
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );


            // FIND USER
            req.user = await User.findById(
                decoded.id
            ).select("-password");


            // USER NOT FOUND
            if (!req.user) {

                return res.status(401).json({
                    success: false,
                    message: "User not found"
                });
            }


            next();

        }

        // NO TOKEN
        if (!token) {

            return res.status(401).json({
                success: false,
                message: "Not authorized, no token"
            });
        }

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Not authorized, token failed"
        });
    }
};


// ========================= ADMIN MIDDLEWARE =========================

export const admin = (req, res, next) => {

    try {

        // CHECK ADMIN ROLE
        if (
            req.user &&
            req.user.role === "admin"
        ) {

            next();

        } else {

            return res.status(403).json({
                success: false,
                message: "Admin access only"
            });
        }

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};