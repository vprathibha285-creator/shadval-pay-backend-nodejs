const db     = require("../config/db");
const bcrypt = require("bcrypt");

// ================= GET ALL USERS (ADMIN) =================
exports.getAllUsers = (req, res) => {
  const sql = `
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.mobile,
      u.is_active,
      u.created_at,
      r.name AS role
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'user'
    ORDER BY u.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    res.json({ success: true, count: results.length, data: results });
  });
};

// ================= GET SINGLE USER (ADMIN) =================
exports.getUserById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.mobile,
      u.is_active,
      u.created_at,
      r.name AS role
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = ? AND r.name = 'user'
  `;

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true, data: results[0] });
  });
};

// ================= CREATE USER (ADMIN) =================
exports.createUser = async (req, res) => {
  const { first_name, last_name, email, mobile, password } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  db.query(
    "SELECT * FROM users WHERE email = ? OR mobile = ?",
    [email, mobile || null],
    async (err, existing) => {
      if (err) return res.status(500).json({ message: err.message });

      if (existing.length > 0) {
        return res.status(400).json({ message: "Email or mobile already exists" });
      }

      db.query(
        "SELECT id FROM roles WHERE name = 'user'",
        [],
        async (err, roleResult) => {
          if (err || roleResult.length === 0) {
            return res.status(500).json({ message: "User role not found" });
          }

          const roleId         = roleResult[0].id;
          const hashedPassword = await bcrypt.hash(password, 10);

          db.query(
            `INSERT INTO users
             (first_name, last_name, email, mobile, password, role, role_id, is_active)
             VALUES (?, ?, ?, ?, ?, 'user', ?, 1)`,
            [first_name, last_name, email, mobile || null, hashedPassword, roleId],
            (err, result) => {
              if (err) return res.status(500).json({ message: err.message });

              res.status(201).json({
                success: true,
                message: "User created successfully ✅",
                data: {
                  id:        result.insertId,
                  first_name,
                  last_name,
                  email,
                  mobile,
                  role:      "user",
                  is_active: 1
                }
              });
            }
          );
        }
      );
    }
  );
};

// ================= ACTIVATE USER (ADMIN) =================
exports.activateUser = (req, res) => {
  const { id } = req.params;

  db.query(
    "UPDATE users SET is_active = 1 WHERE id = ? AND role = 'user'",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ success: true, message: "User activated successfully ✅", is_active: 1 });
    }
  );
};

// ================= DEACTIVATE USER (ADMIN) =================
exports.deactivateUser = (req, res) => {
  const { id } = req.params;

  db.query(
    "UPDATE users SET is_active = 0 WHERE id = ? AND role = 'user'",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ success: true, message: "User deactivated successfully ✅", is_active: 0 });
    }
  );
};

// ================= GET WALLET BALANCE (ADMIN) =================
exports.getWalletBalance = (req, res) => {
  const adminId = req.user.id;

  const sql = `
    SELECT
      id,
      opening_balance,
      current_balance,
      hold_balance,
      status,
      updated_at
    FROM wallets
    WHERE user_id = ?
  `;

  db.query(sql, [adminId], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    if (results.length === 0) {
      return res.json({
        success: true,
        message: "No wallet found",
        data: {
          opening_balance: 0,
          current_balance: 0,
          hold_balance:    0,
          status:          "inactive"
        }
      });
    }

    res.json({ success: true, data: results[0] });
  });
};

// ================= REQUEST WALLET LOAD (ADMIN) =================
exports.requestWalletLoad = (req, res) => {
  const adminId    = req.user.id;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Valid amount is required" });
  }

  db.query(
    `INSERT INTO wallet_load_requests (admin_id, amount, status)
     VALUES (?, ?, 'pending')`,
    [adminId, amount],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      res.status(201).json({
        success: true,
        message: "Wallet load request submitted ✅",
        data: {
          request_id: result.insertId,
          admin_id:   adminId,
          amount,
          status:     "pending"
        }
      });
    }
  );
};

// ================= GET MY WALLET LOAD REQUESTS (ADMIN) =================
exports.getMyWalletLoadRequests = (req, res) => {
  const adminId = req.user.id;

  const sql = `
    SELECT
      id,
      amount,
      status,
      remark,
      requested_at,
      actioned_at
    FROM wallet_load_requests
    WHERE admin_id = ?
    ORDER BY requested_at DESC
  `;

  db.query(sql, [adminId], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    res.json({ success: true, count: results.length, data: results });
  });
};