const express = require("express");
const router = express.Router();

module.exports = (db) => {

// Get all employees
  router.get("/employees", async (req, res) => {
    try {
      const rows = await db.query(`
        SELECT
          e.id,
          e.rolePermissionId,
          r.name AS roleName,
          e.rmId,
          rm.id AS rmId,
          rm.prefix AS rmPrefix,
          rm.name AS rmName,
          rm.phone AS rmPhone,
          rm.email AS rmEmail,
          rm.role AS rmRole,
          rm.status AS rmStatus,
          e.prefix,
          e.name,
          e.email,
          e.phone,
          e.dateOfBirth,
          e.address,
          e.status,
          e.role,
          e.totalBalance,
          e.commissionPercentage,
          e.commissionAmount,
          e.orgName,
          e.orgPhone,
          e.orgEmail,
          e.orgAddress,
          GROUP_CONCAT(p.key) AS permissions,
          e.createdAt,
          e.updatedAt
        FROM employees e
        JOIN roles r ON e.rolePermissionId = r.id
        LEFT JOIN rolepermissions rp ON r.id = rp.roleId
        LEFT JOIN permissions p ON rp.permissionId = p.id
        LEFT JOIN employees rm ON e.rmId = rm.id
        GROUP BY e.id
        ORDER BY e.id ASC
      `);

      res.status(200).json({
        success: true,
        count: rows.length,
        data: rows,
      });

    } catch (err) {
      console.error("Get employees error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

// Insert Employees
  router.post("/employees", async (req, res) => {
    try {
      const {
        rolePermissionId,
        rmId,
        prefix,
        name,
        email,
        phone,
        dateOfBirth,
        address,
        status,
        totalBalance,
        commissionPercentage,
        commissionAmount,
        orgName,
        orgPhone,
        orgEmail,
        orgAddress,
      } = req.body;

      // 🔥 Fetch role name automatically
      const roleResult = await db.query(
        `SELECT name FROM roles WHERE id = ?`,
        [rolePermissionId]
      );

      if (!roleResult.length) {
        return res.status(400).json({
          success: false,
          error: "Invalid rolePermissionId",
        });
      }

      const roleName = roleResult[0].name;

      const result = await db.query(
        `
        INSERT INTO employees (
          rolePermissionId,
          role,
          rmId,
          prefix,
          name,
          email,
          phone,
          dateOfBirth,
          address,
          status,
          totalBalance,
          commissionPercentage,
          commissionAmount,
          orgName,
          orgPhone,
          orgEmail,
          orgAddress,
          createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
        [
          rolePermissionId,
          roleName,
          rmId,
          prefix,
          name,
          email,
          phone,
          dateOfBirth,
          address,
          status,
          totalBalance,
          commissionPercentage,
          commissionAmount,
          orgName,
          orgPhone,
          orgEmail,
          orgAddress,
        ]
      );

      res.status(201).json({
        success: true,
        message: "Employee created successfully",
        employeeId: result.insertId,
      });

    } catch (err) {
      console.error("Insert employee error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  // Update employees
  router.put("/employees/:id", async (req, res) => {
    try {
      const employeeId = req.params.id;

      const {
        rolePermissionId,
        rmId,
        prefix,
        name,
        email,
        phone,
        dateOfBirth,
        address,
        status,
        totalBalance,
        commissionPercentage,
        commissionAmount,
        orgName,
        orgPhone,
        orgEmail,
        orgAddress,
      } = req.body;

      // 🔥 Fetch role name automatically
      const roleResult = await db.query(
        `SELECT name FROM roles WHERE id = ?`,
        [rolePermissionId]
      );

      if (!roleResult.length) {
        return res.status(400).json({
          success: false,
          error: "Invalid rolePermissionId",
        });
      }

      const roleName = roleResult[0].name;

      const result = await db.query(
        `
        UPDATE employees SET
          rolePermissionId = ?,
          role = ?,
          rmId = ?,
          prefix = ?,
          name = ?,
          email = ?,
          phone = ?,
          dateOfBirth = ?,
          address = ?,
          status = ?,
          totalBalance = ?,
          commissionPercentage = ?,
          commissionAmount = ?,
          orgName = ?,
          orgPhone = ?,
          orgEmail = ?,
          orgAddress = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [
          rolePermissionId,
          roleName,
          rmId,
          prefix,
          name,
          email,
          phone,
          dateOfBirth,
          address,
          status,
          totalBalance,
          commissionPercentage,
          commissionAmount,
          orgName,
          orgPhone,
          orgEmail,
          orgAddress,
          employeeId,
        ]
      );

      if (!result.affectedRows) {
        return res.status(404).json({
          success: false,
          error: "Employee not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Employee updated successfully",
      });

    } catch (err) {
      console.error("Update employee error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  return router;
};
