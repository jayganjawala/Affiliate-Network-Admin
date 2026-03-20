const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // ✅ GET ALL SERVICES
  router.get("/services", async (req, res) => {
    try {
      const rows = await db.query(`
  SELECT 
    id,
    category,
    name,
    description,
    price,
    status,
    createdAt,
    updatedAt
  FROM services
  ORDER BY id ASC
`);

      res.status(200).json({
        success: true,
        count: rows.length,
        data: rows,
      });
    } catch (err) {
      console.error("Get services error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  // ✅ GET SINGLE SERVICE
  router.get("/services/:id", async (req, res) => {
    try {
      const serviceId = req.params.id;

      const rows = await db.query(`SELECT * FROM services WHERE id = ?`, [
        serviceId,
      ]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Service not found",
        });
      }

      res.status(200).json({
        success: true,
        data: rows[0],
      });
    } catch (err) {
      console.error("Get service error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  // ✅ CREATE SERVICE
  router.post("/services", async (req, res) => {
    try {
      const { category, name, description, price, status } = req.body;

      const result = await db.query(
        `
  INSERT INTO services
  (category, name, description, price, status, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
`,
        [category, name, description, price, status],
      );

      res.status(201).json({
        success: true,
        message: "Service created successfully",
        serviceId: result.insertId,
      });
    } catch (err) {
      console.error("Create service error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  // ✅ UPDATE SERVICE
  router.put("/services/:id", async (req, res) => {
    try {
      const serviceId = req.params.id;
      const { category, name, description, price, status } = req.body;

      const check = await db.query(`SELECT id FROM services WHERE id = ?`, [
        serviceId,
      ]);

      if (check.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Service not found",
        });
      }

      await db.query(
        `
  UPDATE services
  SET 
    category = ?,
    name = ?,
    description = ?,
    price = ?,
    status = ?,
    updatedAt = CURRENT_TIMESTAMP
  WHERE id = ?
`,
        [category, name, description, price, status, serviceId],
      );

      res.status(200).json({
        success: true,
        message: "Service updated successfully",
      });
    } catch (err) {
      console.error("Update service error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  // ✅ DELETE SERVICE
  router.delete("/services/:id", async (req, res) => {
    try {
      const serviceId = req.params.id;

      const check = await db.query(`SELECT id FROM services WHERE id = ?`, [
        serviceId,
      ]);

      if (check.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Service not found",
        });
      }

      await db.query(`DELETE FROM services WHERE id = ?`, [serviceId]);

      res.status(200).json({
        success: true,
        message: "Service deleted successfully",
      });
    } catch (err) {
      console.error("Delete service error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  return router;
};
