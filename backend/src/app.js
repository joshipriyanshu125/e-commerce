import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";

const app = express();

// MIDDLEWARES
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

// ROUTES
app.use("/api/users", authRoutes); // This adds /login and /register under /api/users
app.use("/api/users", userRoutes); // This adds /profile and /admin under /api/users
app.use("/api/products", productRoutes);

app.get("/", (req, res) => {
    res.send("API Running...");
});

export default app;