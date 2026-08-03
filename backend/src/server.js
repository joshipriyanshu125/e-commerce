import "./config/env.js";

import fs from "fs";
import path from "path";
import express from "express";
import http from "http";

import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import { initSocket } from "./config/socket.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import returnsRoutes from "./routes/returnsRoutes.js";
import pushRoutes from "./routes/pushRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import debugRoutes from "./routes/debugRoutes.js";

import { startCouponExpiryJob } from "./jobs/couponExpiryJob.js";

import apiLimiter from "./middleware/rateLimitMiddleware.js";
import requestLogger from "./middleware/requestLogger.js";

import logger from "./utils/logger.js";

import {
    notFound,
    errorHandler,
} from "./middleware/errorMiddleware.js";

/*
=========================================
ENSURE LOG DIRECTORY EXISTS
=========================================
*/
const logsDir = path.join(process.cwd(), "logs");

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, {
        recursive: true,
    });
}

/*
=========================================
DATABASE
=========================================
*/
connectDB();

// Start scheduled jobs after DB connection
startCouponExpiryJob();

/*
=========================================
EXPRESS
=========================================
*/
const app = express();

const server = http.createServer(app);

/*
=========================================
SOCKET.IO
=========================================
*/
initSocket(server);

/*
=========================================
BODY PARSER
=========================================
*/
app.use(express.json());

app.use(
    express.urlencoded({
        extended: true,
    })
);

app.use(cookieParser());

/*
=========================================
SECURITY
=========================================
*/
app.use(helmet());

app.use(compression());

app.use(mongoSanitize());

app.use(xss());

app.use(hpp());

/*
=========================================
RATE LIMITER
=========================================
*/
app.use(apiLimiter);

/*
=========================================
REQUEST LOGGER
=========================================
*/
app.use(requestLogger);

/*
=========================================
CORS
=========================================
*/
app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl, Postman)
            if (!origin) return callback(null, true);
            const allowedOrigins = [
                "http://localhost:5173",
                "http://localhost:3000",
                // Add your deployed frontend URL below — update if different
                process.env.FRONTEND_URL,
            ].filter(Boolean);
            if (allowedOrigins.some(o => origin.startsWith(o))) {
                callback(null, true);
            } else {
                // In production allow all HTTPS origins (for flexibility)
                if (process.env.NODE_ENV === "production") {
                    callback(null, true);
                } else {
                    callback(new Error(`CORS: ${origin} not allowed`));
                }
            }
        },
        credentials: true,
    })
);


/*
=========================================
HEALTH CHECK
=========================================
*/
app.get("/", (req, res) => {
    logger.info("Health route accessed");

    res.status(200).json({
        success: true,
        message: "API Running Successfully",
    });
});

/*
=========================================
API ROUTES
=========================================
*/
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use("/api/products", productRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/address", addressRoutes);

app.use("/api/coupons", couponRoutes);

app.use("/api/invoice", invoiceRoutes);

app.use("/api/wishlist", wishlistRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/returns", returnsRoutes);

app.use("/api/push", pushRoutes);

app.use(
    "/api/admin/analytics",
    adminAnalyticsRoutes
);

app.use("/api/categories", categoryRoutes);
app.use("/api/settings", settingsRoutes);

/*
=========================================
DEBUG ROUTES
=========================================
*/
if (process.env.NODE_ENV !== "production") {
    app.use("/api/debug", debugRoutes);
}

/*
=========================================
ERROR HANDLER
=========================================
*/
app.use(notFound);

app.use(errorHandler);

/*
=========================================
SERVER
=========================================
*/
const PORT =
    Number(process.env.PORT) || 5000;

const startServer = (port) => {
    server
        .listen(port, () => {
            logger.info(
                `🚀 Server running on port ${port}`
            );

            console.log(
                `🚀 Server running on port ${port}`
            );
        })
        .on("error", (err) => {
            logger.error({
                message: err.message,
                stack: err.stack,
            });

            if (err.code === "EADDRINUSE") {
                console.log(
                    `⚠️ Port ${port} is in use. Trying ${port + 1}...`
                );

                startServer(port + 1);
            } else {
                console.error(
                    "Server Error:",
                    err
                );
            }
        });
};

startServer(PORT);

/*
=========================================
UNHANDLED REJECTION
=========================================
*/
process.on(
    "unhandledRejection",
    (err) => {
        logger.error({
            message: err.message,
            stack: err.stack,
        });

        console.error(
            "Unhandled Rejection:",
            err.message
        );

        server.close(() => {
            process.exit(1);
        });
    }
);

/*
=========================================
UNCAUGHT EXCEPTION
=========================================
*/
process.on(
    "uncaughtException",
    (err) => {
        logger.error({
            message: err.message,
            stack: err.stack,
        });

        console.error(
            "Uncaught Exception:",
            err.message
        );

        process.exit(1);
    }
);