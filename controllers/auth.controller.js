const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateOTP } = require("../utils/otp");

let otpStore = {};

// ================= REGISTER =================
exports.register = async (req, res) => {
  const { first_name, last_name, email, mobile, password } = req.body;

  if (!first_name || !last_name || !password) {
    return res.status(400).json({
      message: "First name, last name and password are required",
    });
  }

  if (!email && !mobile) {
    return res.status(400).json({
      message: "Either email or mobile is required",
    });
  }

  const checkSql = `SELECT * FROM users WHERE email = ? OR mobile = ?`;

  db.query(checkSql, [email || null, mobile || null], async (err, results) => {
    if (err) {
      console.error("DB Check Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length > 0) {
      return res.status(400).json({
        message: "Email or Mobile already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const key = email || mobile;

    otpStore[key] = {
      otp,
      first_name,
      last_name,
      email: email || null,
      mobile: mobile || null,
      password: hashedPassword,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    console.log(`OTP for ${key}:`, otp);

    res.json({
      message: "OTP sent successfully ✅",
      otp: otp, // ⚠️ remove in production
    });
  });
};

// ================= VERIFY OTP =================
exports.verifyOTP = (req, res) => {
  const { emailOrMobile, otp } = req.body;

  if (!emailOrMobile || !otp) {
    return res.status(400).json({
      message: "Email/Mobile and OTP are required",
    });
  }

  if (!otpStore[emailOrMobile]) {
    return res.status(400).json({
      message: "OTP not found. Please register again",
    });
  }

  if (Date.now() > otpStore[emailOrMobile].expiresAt) {
    delete otpStore[emailOrMobile];
    return res.status(400).json({
      message: "OTP expired. Please register again",
    });
  }

  if (otpStore[emailOrMobile].otp !== otp.toString()) {
    return res.status(400).json({
      message: "Invalid OTP. Please try again",
    });
  }

  const userData = otpStore[emailOrMobile];

  const sql = `
    INSERT INTO users (first_name, last_name, email, mobile, password, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      userData.first_name,
      userData.last_name,
      userData.email,
      userData.mobile,
      userData.password,
      "user",
    ],
    (err, result) => {
      if (err) {
        console.error("DB Insert Error:", err.message);
        return res.status(500).json({
          message: "Database error: " + err.message,
        });
      }

      delete otpStore[emailOrMobile];

      res.status(201).json({
        message: "User registered successfully ✅",
        userId: result.insertId,
      });
    }
  );
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  const { emailOrMobile, password } = req.body;

  if (!emailOrMobile || !password) {
    return res.status(400).json({
      message: "Email/Mobile and password are required"
    });
  }

  // Detect if input is email or mobile
  const isEmail = emailOrMobile.includes("@");

  let sql;
  let params;

  if (isEmail) {
    sql = `SELECT * FROM users WHERE LOWER(email) = LOWER(?)`;
    params = [emailOrMobile];
  } else {
    sql = `SELECT * FROM users WHERE mobile = ?`;
    params = [emailOrMobile];
  }

  db.query(sql, params, async (err, results) => {
    if (err) {
      console.error("DB Login Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: isEmail
          ? "No account found with this email"
          : "No account found with this mobile number",
      });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful ✅",
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  });
};