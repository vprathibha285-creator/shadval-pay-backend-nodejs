const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// ✅ Debug — check what's imported
console.log("authController:", authController);

// Register
router.post("/register", authController.register);

// Verify OTP
router.post("/verify-otp", authController.verifyOTP);

// Login
router.post("/login", authController.login);

// Test
router.get("/test", (req, res) => {
  res.json({ message: "Auth route working ✅" });
});

module.exports = router;