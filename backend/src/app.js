import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";

const app = express();

// CORS CONFIGURATION
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://frontend:80",
            "https://your-frontend.vercel.app"
        ],
        credentials: true,
    })
);

// MIDDLEWARES
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

// ROUTES
app.use("/api/users", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);

// TEST ROUTE
app.get("/", (req, res) => {
    res.send("API Running...");
});

export default app;