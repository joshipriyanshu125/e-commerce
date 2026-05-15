import "./config/env.js";

import express from "express";

import http from "http";

import cors from "cors";

import helmet from "helmet";

import rateLimit from "express-rate-limit";

import mongoSanitize from "express-mongo-sanitize";

import xss from "xss-clean";

import hpp from "hpp";

import connectDB from "./config/db.js";

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

import { initSocket } from "./config/socket.js";

import {
  notFound,
  errorHandler,
} from "./middleware/errorMiddleware.js";

connectDB();

const app = express();

const server = http.createServer(app);

initSocket(server);

app.use(express.json());

// SECURITY HEADERS
app.use(helmet());

// PREVENT MONGODB INJECTION
app.use(mongoSanitize());

// PREVENT XSS ATTACKS
app.use(xss());

// PREVENT HTTP PARAM POLLUTION
app.use(hpp());

// RATE LIMITING
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message:
    "Too many requests from this IP, please try again later."
});

app.use(limiter);

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

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

// ADMIN ANALYTICS ROUTE
app.use(
  "/api/admin/analytics",
  adminAnalyticsRoutes
);

app.use(notFound);

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

const startServer = (port) => {

  server.listen(port, () => {

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

      console.error(
        "❌ Server error:",
        err
      );

    }

  });

};

startServer(PORT);

process.on("unhandledRejection", (err) => {

  console.log(
    `❌ Error: ${err.message}`
  );

  process.exit(1);

});