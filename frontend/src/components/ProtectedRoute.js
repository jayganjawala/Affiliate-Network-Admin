// import { useContext } from "react";
// import { Navigate } from "react-router-dom";
// import Cookies from "js-cookie";
// import PermissionContext from "../context/PermissionContext";

// function ProtectedRoute({ children, requiredPermission }) {
//   const { permissions } = useContext(PermissionContext);
//   const token = Cookies.get("adminToken");

//   // Not logged in
//   if (!token) {
//     return <Navigate to="/" replace />;
//   }

//   // Permission check
//   if (
//     requiredPermission &&
//     !permissions.includes(requiredPermission)
//   ) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   return children;
// }

// export default ProtectedRoute;


import { useContext } from "react";
import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import PermissionContext from "../context/PermissionContext";

function ProtectedRoute({ children, requiredPermission, adminOnly }) {
  const { permissions } = useContext(PermissionContext);
  const token = Cookies.get("adminToken");

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = storedUser.role === "Admin";

  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 🔥 Admin only route
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // 🔥 Permission based route
  if (
    requiredPermission &&
    !permissions.includes(requiredPermission)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;