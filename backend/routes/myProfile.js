const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.get('/myprofile', async (req, res) => {
    try {
      const employeeId = req.user.employeeId;

      const rows = await db.query(`SELECT * FROM employees WHERE id = ? LIMIT 1`, [employeeId]);

      if (!rows || rows.length === 0) {
        return res.status(404).json({ success: false, error: 'No employee found' });
      }

      const data = rows[0];

      const profile = {
        personalInformation: {
          fullName: data.prefix ? `${data.prefix} ${data.name}` : data.name,
          email: data.email || null,
          phone: data.phone || null,
          id: data.id,
          commission: data.commissionPercentage
            ? `${data.commissionPercentage}%`
            : data.commissionAmount
            ? `${data.commissionAmount} /Flat`
            : 'Not Specified',
          totalBalance: data.totalBalance || 0,
          updatedAt: data.updatedAt,
        },
        organization: {
          name: data.orgName || null,
          phone: data.orgPhone || null,
          email: data.orgEmail || null,
          address: data.orgAddress || null,
        },
      };

      res.status(200).json({ success: true, profile });
    } catch (err) {
      console.error('My profile query error:', err);
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  return router;
};
