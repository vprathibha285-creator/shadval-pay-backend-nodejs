const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

// ✅ Static files
app.use(express.static("public")); // ← add this line

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= DEBUG (remove later) =================
app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.url}`);
  next();
});

// ================= TEST ROUTE =================
app.post("/api/test", (req, res) => {
  console.log("TEST API HIT");
  res.json({ message: "API working" });
});

// ================= API ROUTES =================

// Auth Routes
try {
  const authRoutes = require("./routes/auth.routes");
  app.use("/api/auth", authRoutes);
  console.log("✅ Auth routes loaded");
} catch (err) {
  console.error("❌ Auth routes failed:", err.message);
}

// Dashboard Routes
try {
  const dashboardRoutes = require("./routes/dashboard.routes");
  app.use("/api/dashboard", dashboardRoutes);
  console.log("✅ Dashboard routes loaded");
} catch (err) {
  console.error("❌ Dashboard routes failed:", err.message);
}

// Admin Routes
try {
  const adminRoutes = require("./routes/admin.routes");
  app.use("/api/admin", adminRoutes);
  console.log("✅ Admin routes loaded");
} catch (err) {
  console.error("❌ Admin routes failed:", err.message);
}

// ================= STATIC HTML ROUTES =================
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "register.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});

app.get("/", (req, res) => {
  res.send("🚀 Server is running");
});

// ================= 404 HANDLER =================
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.use((req, res) => {
  res.status(404).send("Route not found");
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});