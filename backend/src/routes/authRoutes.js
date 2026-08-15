import express from "express";
import {
    registerUser,
    loginUser,
    googleAuth,
} from "../controllers/authController.js";

const router = express.Router();

/*import express from "express";

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth Routes Working",
  });
});

router.post("/register", (req, res) => {
  res.json({
    success: true,
    message: "Register Route Working",
    body: req.body,
  });
});

router.post("/login", (req, res) => {
  res.json({
    success: true,
    message: "Login Route Working",
  });
});

export default router;
=====================================
AUTH ROUTES
=====================================
*/

// Register User
router.post("/register", registerUser);

// Login User
router.post("/login", loginUser);

// Google OAuth
router.post("/google", googleAuth);

export default router;