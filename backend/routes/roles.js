const express = require("express");
const router = express.Router();

module.exports = (db) => {

  /* =====================================================
     GET ALL ROLES (WITH PERMISSIONS COMBINED)
  ====================================================== */
  router.get("/roles", async (req, res) => {
    try {
      const rows = await db.query(`
        SELECT 
          r.id,
          r.name,
          r.description,
          r.createdAt,
          r.updatedAt,
          p.id AS permissionId,
          p.key AS permissionKey
        FROM roles r
        LEFT JOIN rolepermissions rp ON r.id = rp.roleId
        LEFT JOIN permissions p ON rp.permissionId = p.id
        ORDER BY r.id ASC
      `);

      const rolesMap = {};

      rows.forEach((row) => {
        if (!rolesMap[row.id]) {
          rolesMap[row.id] = {
            id: row.id,
            name: row.name,
            description: row.description,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            permissions: [],
          };
        }

        if (row.permissionId) {
          rolesMap[row.id].permissions.push({
            id: row.permissionId,
            key: row.permissionKey,
          });
        }
      });

      res.status(200).json({
        success: true,
        count: Object.keys(rolesMap).length,
        data: Object.values(rolesMap),
      });

    } catch (err) {
      console.error("Get roles error:", err);
      res.status(500).json({
        success: false,
        error: "Database error",
      });
    }
  });


  /* =====================================================
     CREATE ROLE
  ====================================================== */
  router.post("/roles", async (req, res) => {
    try {
      const { name, description, permissions } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: "Role name is required",
        });
      }

      await db.query("START TRANSACTION");

      // 1️⃣ Insert role
      const result = await db.query(
        `INSERT INTO roles (name, description, createdAt, updatedAt)
         VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [name.trim(), description || null]
      );

      const roleId = result.insertId;

      // 2️⃣ Fetch role name for inserting into rolepermissions.role column
      const [roleRow] = await db.query(
        `SELECT name FROM roles WHERE id = ?`,
        [roleId]
      );
      const roleName = roleRow ? roleRow.name : null;

      // 3️⃣ Insert permissions with role name
      if (permissions && permissions.length > 0) {
        const values = permissions.map((pid) => [roleId, pid, roleName]);

        await db.query(
          `INSERT INTO rolepermissions (roleId, permissionId, role) VALUES ?`,
          [values]
        );
      }

      await db.query("COMMIT");

      res.status(201).json({
        success: true,
        message: "Role created successfully",
        roleId,
      });

    } catch (err) {
      await db.query("ROLLBACK");
      console.error("Create role error:", err);
      res.status(500).json({
        success: false,
        error: "Database error",
      });
    }
  });


  /* =====================================================
     UPDATE ROLE (SAFE VERSION — FIXES NAME REMOVAL BUG)
  ====================================================== */
router.put("/roles/:id", async (req, res) => {
  try {
    const roleId = req.params.id;
    const { name, description, permissions } = req.body;

    await db.query("START TRANSACTION");

    // 1️⃣ Get existing role first
    const [existingRole] = await db.query(
      `SELECT * FROM roles WHERE id = ?`,
      [roleId]
    );

    if (!existingRole) {
      await db.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        error: "Role not found",
      });
    }

    // 2️⃣ Update role info ONLY if provided
    if (name !== undefined || description !== undefined) {
      await db.query(
        `UPDATE roles 
         SET name = ?, 
             description = ?, 
             updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          name ? name.trim() : existingRole.name,
          description !== undefined ? description : existingRole.description,
          roleId,
        ]
      );
    }

    // 3️⃣ Update permissions ONLY if provided
    if (permissions !== undefined) {
      const currentRows = await db.query(
        `SELECT permissionId FROM rolepermissions WHERE roleId = ?`,
        [roleId]
      );

      const currentPermissionIds = currentRows.map(
        (row) => row.permissionId
      );

      const newPermissions = permissions || [];

      const toAdd = newPermissions.filter(
        (p) => !currentPermissionIds.includes(p)
      );

      const toRemove = currentPermissionIds.filter(
        (p) => !newPermissions.includes(p)
      );

      // Delete removed
      if (toRemove.length > 0) {
        await db.query(
          `DELETE FROM rolepermissions 
           WHERE roleId = ? AND permissionId IN (?)`,
          [roleId, toRemove]
        );
      }

      // Insert new
      if (toAdd.length > 0) {
        const roleName = existingRole.name;

        const values = toAdd.map((pid) => [roleId, pid, roleName]);

        await db.query(
          `INSERT INTO rolepermissions (roleId, permissionId, role) VALUES ?`,
          [values]
        );
      }
    }

    await db.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
    });

  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Update role error:", err);
    res.status(500).json({
      success: false,
      error: "Database error",
    });
  }
});


  /* =====================================================
     DELETE ROLE (SAFE + CLEAN)
  ====================================================== */
  router.delete("/roles/:id", async (req, res) => {
    try {
      const roleId = req.params.id;

      await db.query("START TRANSACTION");

      // 1️⃣ Delete permissions first
      await db.query(
        `DELETE FROM rolepermissions WHERE roleId = ?`,
        [roleId]
      );

      // 2️⃣ Delete role
      const result = await db.query(
        `DELETE FROM roles WHERE id = ?`,
        [roleId]
      );

      if (!result.affectedRows) {
        await db.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          error: "Role not found",
        });
      }

      await db.query("COMMIT");

      res.status(200).json({
        success: true,
        message: "Role deleted successfully",
      });

    } catch (err) {
      await db.query("ROLLBACK");
      console.error("Delete role error:", err);
      res.status(500).json({
        success: false,
        error: "Database error",
      });
    }
  });

  return router;
};