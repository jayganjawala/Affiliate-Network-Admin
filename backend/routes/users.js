const express = require("express");
const router = express.Router();

module.exports = (db) => {
  router.get("/users", async (req, res) => {
    try {
      // Fetch all user rows as before
      const rows = await db.query(`
      SELECT 
        u.id,
        u.prefix,
        u.fullName,
        u.phone,
        u.email,
        u.status,
        u.source,
        u.isConverted,
        u.reviewedAt,
        u.createdAt,
        u.updatedAt,
        e.id AS employeeId,
        CONCAT(e.prefix, ' ', e.name) AS employeeName,
        e.phone AS employeePhone,
        e.email AS employeeEmail
      FROM users u
      LEFT JOIN employees e ON u.employeeId = e.id
      WHERE u.removedByEmployeeId IS NULL
      ORDER BY u.id ASC
    `);

      // Query to get counts of Leads and Clients
      const countsResult = await db.query(`
      SELECT status, COUNT(*) AS count
      FROM users
      WHERE removedByEmployeeId IS NULL
      GROUP BY status
    `);

      // Initialize counts object
      const counts = {
        lead: 0,
        client: 0,
      };

      // Populate counts from query result
      countsResult.forEach((row) => {
        if (row.status === "Lead") counts.lead = row.count;
        else if (row.status === "Client") counts.client = row.count;
      });

      res.status(200).json({
        success: true,
        count: rows.length,
        totalLeads: counts.lead,
        totalClients: counts.client,
        totalUsers: counts.lead + counts.client,
        data: rows,
      });
    } catch (err) {
      console.error("Get all users error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  router.put("/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;

      const { prefix, fullName, phone, email, status, source } = req.body;

      const result = await db.query(
        `
  UPDATE users SET
    prefix = ?,
    fullName = ?,
    phone = ?,
    email = ?,
    status = ?,
    source = ?,
    updatedAt = CURRENT_TIMESTAMP
  WHERE id = ?
`,
        [prefix, fullName, phone, email, status, source, userId],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "User updated successfully",
      });
    } catch (err) {
      console.error("Update user error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  router.delete("/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const removedByEmployeeId = req.user.employeeId;

      const result = await db.query(
        `
        UPDATE users
        SET removedByEmployeeId = ?
        WHERE id = ?
      `,
        [removedByEmployeeId, userId],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (err) {
      console.error("Delete user error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  // ✅ Get Single User by ID
  router.get("/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;

      const rows = await db.query(
        `
        SELECT 
          u.id,
          u.prefix,
          u.fullName,
          u.phone,
          u.email,
          u.status,
          u.source,
          u.isConverted,
          u.reviewedAt,
          u.createdAt,
          u.updatedAt,
          e.id AS employeeId,
          CONCAT(e.prefix, ' ', e.name) AS employeeName,
          e.phone AS employeePhone,
          e.email AS employeeEmail
        FROM users u
        LEFT JOIN employees e ON u.employeeId = e.id
        WHERE u.id = ? AND u.removedByEmployeeId IS NULL
      `,
        [userId],
      );

      if (rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
      console.error("Get user by ID error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  return router;
};
