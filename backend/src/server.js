import express from "express";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

import cartRoutes from "./routes/cartRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";

import {
  notFound,
  errorHandler,
} from "./middleware/errorMiddleware.js";

dotenv.config();

connectDB();

const app = express();

app.use(express.json());


// ROUTES
app.use("/api/users", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/products", productRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/address", addressRoutes);

app.use("/api/coupons", couponRoutes);

app.use("/api/invoice", invoiceRoutes);


// ERROR MIDDLEWARE
app.use(notFound);

app.use(errorHandler);


const PORT = Number(process.env.PORT) || 5000;


const startServer = (port) => {

  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  })

    .on("error", (err) => {

      if (err.code === "EADDRINUSE") {

        console.log(
          `Port ${port} is in use, trying ${port + 1}...`
        );

        startServer(port + 1);

      } else {

        console.error("Server error:", err);
      }
    });
};

startServer(PORT);


// HANDLE UNHANDLED PROMISE REJECTIONS
process.on("unhandledRejection", (err) => {

  console.log(`Error: ${err.message}`);

  process.exit(1);
});