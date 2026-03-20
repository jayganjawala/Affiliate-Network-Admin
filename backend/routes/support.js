const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // ✅ GET ALL SUPPORTS
  router.get("/supports", async (req, res) => {
    try {
      const rows = await db.query(`
        SELECT 
          s.id,
          s.reqType,
          s.reqId,
          s.description,
          s.status,
          s.createdAt,
          s.updatedAt,

          e.id AS employeeId,
          e.prefix AS employeePrefix,
          e.name AS employeeName,
          e.phone AS employeePhone,
          e.email AS employeeEmail,

          u.id AS userId,
          u.prefix AS userPrefix,
          u.fullName AS userFullName,
          u.phone AS userPhone,
          u.email AS userEmail

        FROM supportsystems s
        LEFT JOIN employees e ON s.raisedByEmployeeId = e.id
        LEFT JOIN users u ON s.relatedUserId = u.id
        ORDER BY s.id ASC
      `);

      const totalPending = rows.filter((row) => row.status === "Open").length;
      const totalInProgress = rows.filter(
        (row) => row.status === "In Progress",
      ).length;
      const totalClosed = rows.filter((row) => row.status === "Closed").length;

      res.status(200).json({
        success: true,
        count: rows.length,
        toatlPendingCount: totalPending,
        totalInProgressCount: totalInProgress,
        totalClosedCount: totalClosed,
        data: rows,
      });
    } catch (err) {
      console.error("Get supports error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  // ✅ GET SINGLE SUPPORT
  router.get("/supports/:id", async (req, res) => {
    try {
      const supportId = req.params.id;

      const rows = await db.query(
        `
        SELECT 
          s.id,
          s.reqType,
          s.reqId,
          s.description,
          s.status,
          s.createdAt,
          s.updatedAt,

          e.id AS employeeId,
          e.prefix AS employeePrefix,
          e.name AS employeeName,
          e.phone AS employeePhone,
          e.email AS employeeEmail,

          u.id AS userId,
          u.prefix AS userPrefix,
          u.fullName AS userFullName,
          u.phone AS userPhone,
          u.email AS userEmail

        FROM supportsystems s
        LEFT JOIN employees e ON s.raisedByEmployeeId = e.id
        LEFT JOIN users u ON s.relatedUserId = u.id
        WHERE s.id = ?
      `,
        [supportId],
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Support ticket not found",
        });
      }

      res.status(200).json({
        success: true,
        data: rows[0],
      });
    } catch (err) {
      console.error("Get support by ID error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  // ✅ CREATE FOLLOWUP ONLY (Cannot create Main)
  router.post("/supports", async (req, res) => {
    try {
      const { relatedUserId, reqId, description, status } = req.body;
      const raisedByEmployeeId = req.user.employeeId;

      // Check that parent MAIN exists
      const mainCheck = await db.query(
        `SELECT id FROM supportsystems WHERE id = ? AND reqType = 'Main'`,
        [reqId],
      );

      if (mainCheck.length === 0) {
        return res.status(400).json({
          success: false,
          error:
            "Main request not found. Followup must be linked to a Main request.",
        });
      }

      const result = await db.query(
        `
        INSERT INTO supportsystems
        (raisedByEmployeeId, relatedUserId, reqType, reqId, description, status, createdAt, updatedAt)
        VALUES (?, ?, 'Followup', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
        [raisedByEmployeeId, relatedUserId, reqId, description, status],
      );

      res.status(201).json({
        success: true,
        message: "Followup created successfully",
        supportId: result.insertId,
      });
    } catch (err) {
      console.error("Create followup error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  // ✅ UPDATE FOLLOWUP ONLY
  router.put("/supports/:id", async (req, res) => {
    try {
      const supportId = req.params.id;
      const { status, description } = req.body;

      // Check if it's Followup
      const check = await db.query(
        `SELECT reqType FROM supportsystems WHERE id = ?`,
        [supportId],
      );

      if (check.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Support ticket not found",
        });
      }

      if (check[0].reqType !== "Followup") {
        return res.status(403).json({
          success: false,
          error: "Main request cannot be updated",
        });
      }

      await db.query(
        `
        UPDATE supportsystems
        SET 
          status = ?,
          description = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [status, description, supportId],
      );

      res.status(200).json({
        success: true,
        message: "Followup updated successfully",
      });
    } catch (err) {
      console.error("Update support error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  // ✅ DELETE FOLLOWUP ONLY
  router.delete("/supports/:id", async (req, res) => {
    try {
      const supportId = req.params.id;

      const check = await db.query(
        `SELECT reqType FROM supportsystems WHERE id = ?`,
        [supportId],
      );

      if (check.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Support ticket not found",
        });
      }

      if (check[0].reqType !== "Followup") {
        return res.status(403).json({
          success: false,
          error: "Main request cannot be deleted",
        });
      }

      await db.query(`DELETE FROM supportsystems WHERE id = ?`, [supportId]);

      res.status(200).json({
        success: true,
        message: "Followup deleted successfully",
      });
    } catch (err) {
      console.error("Delete support error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  // GET supports for a particular user
  router.get("/users/supports/:id", async (req, res) => {
    try {
      const userId = req.params.id;

      const rows = await db.query(
        `
        SELECT 
            s.id,
            s.reqType,
            s.reqId,
            s.description,
            s.status,
            s.createdAt,
            s.updatedAt,

            e.id        AS employeeId,
            e.prefix    AS employeePrefix,
            e.name      AS employeeName,
            e.phone     AS employeePhone,
            e.email     AS employeeEmail,

            u.id        AS userId,
            u.prefix    AS userPrefix,
            u.fullName  AS userFullName,
            u.phone     AS userPhone,
            u.email     AS userEmail

        FROM supportsystems AS s
        LEFT JOIN employees AS e 
            ON s.raisedByEmployeeId = e.id
        LEFT JOIN users AS u 
            ON s.relatedUserId = u.id
        WHERE s.relatedUserId = ?
        ORDER BY s.id ASC;
    `,
        [userId],
      );

      res.status(200).json({
        success: true,
        count: rows.length,
        data: rows,
      });
    } catch (err) {
      console.error("Get user supports error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  return router;
};
