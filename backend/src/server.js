import "./config/env.js";

import express from "express";

import http from "http";

import cors from "cors";

import helmet from "helmet";

import compression from "compression";

import mongoSanitize from "express-mongo-sanitize";

import xss from "xss-clean";

import hpp from "hpp";

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

import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";

import apiLimiter from "./middleware/rateLimitMiddleware.js";

import requestLogger from "./middleware/requestLogger.js";

import logger from "./utils/logger.js";

import {
  notFound,
  errorHandler,
} from "./middleware/errorMiddleware.js";

/*
================ DATABASE =================
*/
connectDB();

/*
================ EXPRESS APP =================
*/
const app = express();

const server = http.createServer(app);

/*
================ SOCKET.IO =================
*/
initSocket(server);

/*
================ BODY PARSER =================
*/
app.use(express.json());

app.use(express.urlencoded({
  extended: true,
}));

/*
================ SECURITY MIDDLEWARES =================
*/

// SECURITY HEADERS
app.use(helmet());

// ENABLE GZIP COMPRESSION
app.use(compression());

// PREVENT MONGODB INJECTION
app.use(mongoSanitize());

// PREVENT XSS ATTACKS
app.use(xss());

// PREVENT HTTP PARAM POLLUTION
app.use(hpp());

// RATE LIMITING
app.use(apiLimiter);

/*
================ REQUEST LOGGER =================
*/
app.use(requestLogger);

/*
================ CORS =================
*/
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

/*
================ HEALTH CHECK =================
*/
app.get("/", (req, res) => {

  res.status(200).json({
    success: true,
    message: "API Running Successfully",
  });
});

/*
================ ROUTES =================
*/
app.use("/api/users", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/products", productRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/address", addressRoutes);

app.use("/api/coupons", couponRoutes);

app.use("/api/invoice", invoiceRoutes);

app.use("/api/wishlist", wishlistRoutes);

app.use("/api/notifications", notificationRoutes);

/*
================ ADMIN ANALYTICS =================
*/
app.use(
  "/api/admin/analytics",
  adminAnalyticsRoutes
);

/*
================ ERROR MIDDLEWARE =================
*/
app.use(notFound);

app.use(errorHandler);

/*
================ SERVER =================
*/
const PORT =
  Number(process.env.PORT) || 5000;

const startServer = (port) => {

  server.listen(port, () => {

    logger.info(
      `🚀 Server running on port ${port}`
    );

    console.log(
      `🚀 Server running on port ${port}`
    );

  }).on("error", (err) => {

    if (err.code === "EADDRINUSE") {

      console.log(
        `⚠️ Port ${port} is in use, trying ${port + 1}...`
      );

      startServer(port + 1);

    } else {

      logger.error(err);

      console.error(
        "❌ Server error:",
        err
      );
    }
  });
};

startServer(PORT);

/*
================ UNHANDLED REJECTION =================
*/
process.on(
  "unhandledRejection",
  (err) => {

    logger.error({
      message: err.message,
      stack: err.stack,
    });

    console.log(
      `❌ Error: ${err.message}`
    );

    server.close(() => {
      process.exit(1);
    });
  }
);

/*
================ UNCAUGHT EXCEPTION =================
*/
process.on(
  "uncaughtException",
  (err) => {

    logger.error({
      message: err.message,
      stack: err.stack,
    });

    console.log(
      `❌ Uncaught Exception: ${err.message}`
    );

    process.exit(1);
  }
);