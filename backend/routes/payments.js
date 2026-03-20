const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // ✅ Get All Payments (with User Details)
  // router.get("/payments", async (req, res) => {
  //   try {
  //     const rows = await db.query(`
  //       SELECT
  //         p.id,
  //         u.id AS userId,
  //         CONCAT(u.prefix, ' ', u.fullName) AS userName,
  //         u.phone AS userPhone,
  //         u.email AS userEmail,
  //         p.paymentMethod,
  //         p.totalAmount,
  //         p.paidAmount,
  //         p.remainingAmount,
  //         p.isPartial,
  //         p.parentPaymentId,
  //         p.status,
  //         p.transactionId,
  //         p.paymentDate
  //       FROM payments p
  //       LEFT JOIN users u ON u.id = p.userId
  //       ORDER BY p.id ASC
  //     `);

  //     // Calculate sum of paidAmount in JS
  //     const totalPaid = rows.reduce(
  //       (sum, row) => sum + Number(row.paidAmount),
  //       0,
  //     );

  //     res.status(200).json({
  //       success: true,
  //       count: rows.length,
  //       totalPaidAmount: totalPaid,
  //       data: rows,
  //     });
  //   } catch (err) {
  //     console.error("Get all payments error:", err);
  //     res.status(500).json({ success: false, error: "Database error" });
  //   }
  // });

  router.get("/payments", async (req, res) => {
    try {
      const rows = await db.query(`
      SELECT 
        p.id,
        u.id AS userId,
        CONCAT(u.prefix, ' ', u.fullName) AS userName,
        u.phone AS userPhone,
        u.email AS userEmail,
        p.paymentMethod,
        p.totalAmount,
        p.paidAmount,
        p.remainingAmount,
        p.isPartial,
        p.parentPaymentId,
        p.status,
        p.transactionId,
        p.paymentDate,
        s.name AS serviceName,
        s.description AS serviceDescription
      FROM payments p
      LEFT JOIN users u ON u.id = p.userId
      LEFT JOIN services s ON s.id = p.serviceId
      ORDER BY p.id ASC
    `);

      const totalPaid = rows.reduce(
        (sum, row) => sum + Number(row.paidAmount),
        0,
      );

      res.status(200).json({
        success: true,
        count: rows.length,
        totalPaidAmount: totalPaid,
        data: rows,
      });
    } catch (err) {
      console.error("Get all payments error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  // ✅ Update Payment
  router.put("/payments/:id", async (req, res) => {
    try {
      const paymentId = req.params.id;

      const {
        paymentMethod,
        totalAmount,
        paidAmount,
        remainingAmount,
        isPartial,
        status,
        transactionId,
      } = req.body;

      const result = await db.query(
        `
        UPDATE payments SET
          paymentMethod = ?,
          totalAmount = ?,
          paidAmount = ?,
          remainingAmount = ?,
          isPartial = ?,
          status = ?,
          transactionId = ?
        WHERE id = ?
      `,
        [
          paymentMethod,
          totalAmount,
          paidAmount,
          remainingAmount,
          isPartial,
          status,
          transactionId,
          paymentId,
        ],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Payment not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Payment updated successfully",
      });
    } catch (err) {
      console.error("Update payment error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  // ✅ Delete Payment (Hard Delete)
  router.delete("/payments/:id", async (req, res) => {
    try {
      const paymentId = req.params.id;

      const result = await db.query(`DELETE FROM payments WHERE id = ?`, [
        paymentId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Payment not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Payment deleted successfully",
      });
    } catch (err) {
      console.error("Delete payment error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  // ✅ Get payments for a specific user
  router.get("/users/:userId/payments", async (req, res) => {
    try {
      const { userId } = req.params;

      const rows = await db.query(
        `
      SELECT 
        p.id,
        p.paymentMethod,
        p.totalAmount,
        p.paidAmount,
        p.remainingAmount,
        p.isPartial,
        p.parentPaymentId,
        p.status,
        p.transactionId,
        p.paymentDate
      FROM payments p
      WHERE p.userId = ?
      ORDER BY p.id ASC
    `,
        [userId],
      );

      res.status(200).json({
        success: true,
        count: rows.length,
        data: rows,
      });
    } catch (err) {
      console.error("Get user payments error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  return router;
};
