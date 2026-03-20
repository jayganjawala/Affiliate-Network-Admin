const express = require("express");
const router = express.Router();

module.exports = (db) => {
  router.get("/leadhistory", async (req, res) => {
    try {
      const rows = await db.query(`
      SELECT 
        'Approved' AS leadType,
        u.id AS leadId,
        u.prefix,
        u.fullName,
        u.phone AS leadPhone,
        u.email,
        u.status,
        u.createdAt,

        e.id AS employeeId,
        e.prefix AS employeePrefix,
        e.name AS employeeName,
        e.phone AS employeePhone,
        e.email AS employeeEmail

      FROM users u
      LEFT JOIN employees e ON u.employeeId = e.id

      UNION ALL

      SELECT 
        'Duplicate' AS leadType,
        t.id AS leadId,
        t.prefix,
        t.fullName,
        t.phone AS leadPhone,
        t.email,
        'Temporary' AS status,
        t.createdAt,

        e.id AS employeeId,
        e.prefix AS employeePrefix,
        e.name AS employeeName,
        e.phone AS employeePhone,
        e.email AS employeeEmail

      FROM temporaryleads t
      LEFT JOIN employees e ON t.employeeId = e.id

      ORDER BY createdAt DESC
    `);

      const leads = Array.isArray(rows[0]) ? rows[0] : rows;

      const totalApproved = leads.filter(
        (l) => l.leadType === "Approved",
      ).length;
      const totalDuplicate = leads.filter(
        (l) => l.leadType === "Duplicate",
      ).length;
      const totalClients = leads.filter((l) => l.status === "Client").length;

      res.status(200).json({
        success: true,
        count: leads.length,
        totalApprovedCount: totalApproved,
        totalDuplicateCount: totalDuplicate,
        totalClientsCount: totalClients,
        totalLeads: totalApproved + totalDuplicate,
        data: leads,
      });
    } catch (err) {
      console.error("Get lead history error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  return router;
};
