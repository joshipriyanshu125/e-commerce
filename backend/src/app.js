import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";

const app = express();

// MIDDLEWARES
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

// ROUTES
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("API Running...");
});

export default app;