const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // Get all permissions
  router.get("/permissions", async (req, res) => {
    try {
      const rows = await db.query(`
        SELECT 
          id,
          \`key\`,
          createdAt,
          updatedAt
        FROM permissions
        ORDER BY id ASC
      `);

      res.status(200).json({
        success: true,
        count: rows.length,
        data: rows,
      });
    } catch (err) {
      console.error("Get permissions error:", err);
      res.status(500).json({
        success: false,
        error: "Database error",
      });
    }
  });

  // Get single permission
  router.get("/permissions/:id", async (req, res) => {
    try {
      const permissionId = req.params.id;

      const rows = await db.query(
        `
        SELECT 
          id,
          \`key\`,
          createdAt,
          updatedAt
        FROM permissions
        WHERE id = ?
        `,
        [permissionId]
      );

      if (!rows.length) {
        return res.status(404).json({
          success: false,
          error: "Permission not found",
        });
      }

      res.status(200).json({
        success: true,
        data: rows[0],
      });
    } catch (err) {
      console.error("Get permission error:", err);
      res.status(500).json({
        success: false,
        error: "Database error",
      });
    }
  });

  // Create Permission
  router.post("/permissions", async (req, res) => {
    try {
      const { key } = req.body;

      if (!key) {
        return res.status(400).json({
          success: false,
          error: "Permission key is required",
        });
      }

      const result = await db.query(
        `
        INSERT INTO permissions (\`key\`, createdAt, updatedAt)
        VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
        [key]
      );

      res.status(201).json({
        success: true,
        message: "Permission created successfully",
        permissionId: result.insertId,
      });
    } catch (err) {
      console.error("Create permission error:", err);
      res.status(500).json({
        success: false,
        error: "Database error",
      });
    }
  });

  // Update Permission
  router.put("/permissions/:id", async (req, res) => {
    try {
      const permissionId = req.params.id;
      const { key } = req.body;

      if (!key) {
        return res.status(400).json({
          success: false,
          error: "Permission key is required",
        });
      }

      const result = await db.query(
        `
        UPDATE permissions SET
          \`key\` = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [key, permissionId]
      );

      if (!result.affectedRows) {
        return res.status(404).json({
          success: false,
          error: "Permission not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Permission updated successfully",
      });
    } catch (err) {
      console.error("Update permission error:", err);
      res.status(500).json({
        success: false,
        error: "Database error",
      });
    }
  });

  // Delete Permission
  router.delete("/permissions/:id", async (req, res) => {
    try {
      const permissionId = req.params.id;

      const result = await db.query(
        `DELETE FROM permissions WHERE id = ?`,
        [permissionId]
      );

      if (!result.affectedRows) {
        return res.status(404).json({
          success: false,
          error: "Permission not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Permission deleted successfully",
      });
    } catch (err) {
      console.error("Delete permission error:", err);
      res.status(500).json({
        success: false,
        error: "Database error",
      });
    }
  });

  return router;
};