const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth.middleware");
const { checkRole } = require("../middleware/role.middleware");

router.get("/", verifyToken, checkRole("admin"), (req, res) => {
  res.json({
    message: "Welcome Admin 👑",
  });
});

module.exports = router;