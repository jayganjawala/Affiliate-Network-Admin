// middleware/checkPermission.js
module.exports = (db, requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      // 1. Get user's roles
      const userRoles = await db.query(
        `SELECT roleId FROM user_roles WHERE userId = ?`,
        [userId]
      );

      if (!userRoles.length) {
        return res.status(403).json({ success: false, error: "No roles assigned" });
      }

      const roleIds = userRoles.map(r => r.roleId);
      const placeholders = roleIds.map(() => "?").join(",");

      // 2. Get permissions for these roles
      const permissions = await db.query(
        `SELECT p.key 
         FROM permissions p
         JOIN rolePermission rp ON p.id = rp.permissionId
         WHERE rp.roleId IN (${placeholders})`,
        roleIds
      );

      const permissionKeys = permissions.map(p => p.key);

      // 3. Admin shortcut: if user has 'adminAccess' (or Admin role), allow all
      if (permissionKeys.includes("adminAccess")) {
        return next();
      }

      // 4. Check if required permission exists
      if (!permissionKeys.includes(requiredPermission)) {
        return res.status(403).json({ success: false, error: "Permission denied" });
      }

      next();
    } catch (err) {
      console.error("Permission check error:", err);
      res.status(500).json({ success: false, error: "Server error" });
    }
  };
};



// const checkPermissions = (db, requiredPermissions = []) => {
//   return async (req, res, next) => {
//     try {
//       const userId = req.user.id;

//       const userRoles = await db.query(
//         `SELECT roleId FROM user_roles WHERE userId = ?`,
//         [userId]
//       );

//       if (!userRoles.length) return res.status(403).json({ error: "No roles assigned" });

//       const roleIds = userRoles.map(r => r.roleId);
//       const placeholders = roleIds.map(() => "?").join(",");

//       const permissions = await db.query(
//         `SELECT p.key 
//          FROM permissions p
//          JOIN rolePermission rp ON p.id = rp.permissionId
//          WHERE rp.roleId IN (${placeholders})`,
//         roleIds
//       );

//       const permissionKeys = permissions.map(p => p.key);

//       if (permissionKeys.includes("adminAccess")) return next();

//       const hasPermission = requiredPermissions.some(p => permissionKeys.includes(p));
//       if (!hasPermission) return res.status(403).json({ error: "Permission denied" });

//       next();
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ error: "Server error" });
//     }
//   };
// };