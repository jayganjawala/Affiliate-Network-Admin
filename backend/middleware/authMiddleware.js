const jwt = require("jsonwebtoken");

module.exports = (
  db,
  allowedRoles = ["Admin", "Accountant", "Analyst", "Sales Manager"],
) => {
  return (req, res, next) => {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ status: false, error: "No token provided" });
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("JWT verification error:", err);
      return res
        .status(401)
        .json({ status: false, error: "Invalid or expired token" });
    }

    // Check token and role in employees table
    db.query(
      `SELECT id, role FROM employees WHERE token = ?`,
      [token],
      (err, results) => {
        if (err) {
          console.error("Database error in authMiddleware:", err);
          return res
            .status(500)
            .json({ status: false, error: "Database error" });
        }

        if (!results || results.length === 0) {
          return res
            .status(403)
            .json({ status: false, error: "Unauthorized: invalid token" });
        }

        const userRole = results[0].role;
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({
            status: false,
            error: `Unauthorized: only ${allowedRoles.join(", ")} can access`,
          });
        }

        // Attach user info to request
        req.user = {
          employeeId: results[0].id,
          role: userRole,
        };

        next();
      },
    );
  };
};
