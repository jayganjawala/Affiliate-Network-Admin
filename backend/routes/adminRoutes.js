const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const authMiddleware = require("../middleware/authMiddleware");
const jsonMiddleware = require("../middleware/jsonMiddleware");

// Encryption settings (still keeping for phone if you want)
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv,
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

module.exports = (db) => {
  router.use(jsonMiddleware);

  // ---------- SEND OTP ----------
  router.post("/admin/send-otp", (req, res) => {
    const { phone } = req.body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res
        .status(400)
        .json({ status: false, error: "Invalid phone number" });
    }

    db.query(
      'SELECT id, role FROM employees WHERE phone = ? AND status = "Active"',
      [phone],
      (err, results) => {
        if (err) {
          return res
            .status(500)
            .json({ status: false, error: "Database error" });
        }

        if (results.length === 0) {
          return res
            .status(403)
            .json({ status: false, error: "User not found or inactive" });
        }

        const allowedRoles = [
          "Admin",
          "Accountant",
          "Analyst",
          "Sales Manager",
        ];
        const userRole = results[0].role;

        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({
            status: false,
            error: `Only ${allowedRoles.join(", ")} can log in`,
          });
        }

        // const otp = crypto.randomInt(100000, 999999).toString();
        const otp = 121212;
        const employeeId = results[0].id;

        db.query(
          "UPDATE employees SET otpCode = ?, updatedAt = NOW() WHERE id = ?",
          [otp, employeeId],
          (err) => {
            if (err) {
              return res
                .status(500)
                .json({ status: false, error: "Failed to store OTP" });
            }

            console.log(`OTP for ${phone}: ${otp}`); // In production, send via SMS
            res.json({ status: true, message: "OTP sent successfully" });
          },
        );
      },
    );
  });

  router.post("/admin/verify-otp", async (req, res) => {
    try {
      const { phone, otp } = req.body;

      if (!/^\d{10}$/.test(phone) || !/^\d{6}$/.test(otp)) {
        return res.status(400).json({ status: false, error: "Invalid input" });
      }

      db.query(
        `SELECT id, rolePermissionId, role, name 
       FROM employees 
       WHERE phone = ? AND otpCode = ? AND status = "Active"`,
        [phone, otp],
        (err, results) => {
          if (err) throw err;

          if (results.length === 0)
            return res
              .status(401)
              .json({ status: false, error: "Invalid OTP or unauthorized" });

          const employee = results[0];
          const employeeId = employee.id;
          const roleId = employee.rolePermissionId;
          const encryptedPhone = encrypt(phone); // ❗ ensure encrypt is defined

          db.query(
            `SELECT p.key
           FROM rolePermissions rp
           JOIN permissions p ON rp.permissionId = p.id
           WHERE rp.roleId = ?`,
            [roleId],
            (err, permissionResults) => {
              if (err) throw err;

              const permissions = permissionResults.map((p) => p.key);

              const token = jwt.sign(
                { employeeId, roleId, phone: encryptedPhone },
                process.env.JWT_SECRET,
                { expiresIn: "7d" },
              );

              db.query(
                "UPDATE employees SET otpCode = NULL, token = ?, updatedAt = NOW() WHERE id = ?",
                [token, employeeId],
                (err) => {
                  if (err) throw err;

                  res.json({
                    status: true,
                    token,
                    user: {
                      id: employeeId,
                      name: employee.name,
                      role: employee.role,
                      roleId,
                      permissions,
                    },
                    message: "Login successful",
                  });
                },
              );
            },
          );
        },
      );
    } catch (err) {
      console.error("Verify OTP error:", err);
      res.status(500).json({
        status: false,
        error: "Internal Server Error",
        detail: err.message,
      });
    }
  });

  // ---------- LOGOUT ----------
  router.post("/admin/logout", authMiddleware(db), (req, res) => {
    const { employeeId } = req.user;

    db.query(
      "UPDATE employees SET token = NULL, updatedAt = NOW() WHERE id = ?",
      [employeeId],
      (err, result) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ status: false, error: "Server error" });
        }

        res.json({ status: true, message: "Logged out successfully" });
      },
    );
  });

  return router;
};
