import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";

import PermissionContext from "./context/PermissionContext";
import ProtectedRoute from "./components/ProtectedRoute";

import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import MyProfile from "./pages/MyProfile";
import UserManagement from "./pages/UserManagement";
import PaymentsManagement from "./pages/PaymentsManagement";
import EmployeeManagement from "./pages/EmployeeManagement";
import UserDetails from "./pages/UserDetails";
import SupportManagement from "./pages/SupportManagement";
import RoleManagement from "./pages/RoleManagement";
import PermissionManagement from "./pages/PermissionManagement";
import ServicesManagement from "./pages/ServicesManagement";
import ProtectedLayout from "./layouts/ProtectedLayout";

import Toast from "./components/Toast";

function App() {
  const [permissions, setPermissions] = useState(() => {
    const stored = localStorage.getItem("permissions");
    return stored ? JSON.parse(stored) : [];
  });

  const [isAuthenticated, setIsAuthenticated] = useState(
    !!Cookies.get("adminToken"),
  );

  useEffect(() => {
    const token = Cookies.get("adminToken");
    setIsAuthenticated(!!token);
  }, []);

  function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);

    return null;
  }

  return (
    <PermissionContext.Provider value={{ permissions, setPermissions }}>
      <BrowserRouter>
        <Toast />
        <ScrollToTop />

        <Routes>
          {/* Login */}
          <Route
            path="/"
            element={
              <AdminLogin
                setAuth={setIsAuthenticated}
                setPermissions={setPermissions}
              />
            }
          />

          {/* Protected Routes */}
          <Route element={<ProtectedLayout />}>
            <Route
              path="/dashboard"
              element={
                isAuthenticated ? (
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/myprofile"
              element={
                isAuthenticated ? (
                  <ProtectedRoute>
                    <MyProfile />
                  </ProtectedRoute>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/users"
              element={
                isAuthenticated ? (
                  <ProtectedRoute requiredPermission="viewUser">
                    <UserManagement />
                  </ProtectedRoute>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/users/:userId"
              element={
                isAuthenticated ? (
                  <ProtectedRoute requiredPermission="viewUser">
                    <UserDetails />
                  </ProtectedRoute>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/payment"
              element={
                isAuthenticated ? (
                  <ProtectedRoute requiredPermission="viewPayment">
                    <PaymentsManagement />
                  </ProtectedRoute>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/support"
              element={
                isAuthenticated ? (
                  <ProtectedRoute requiredPermission="viewSupport">
                    <SupportManagement />
                  </ProtectedRoute>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/employee"
              element={
                isAuthenticated ? (
                  <ProtectedRoute requiredPermission="viewEmployee">
                    <EmployeeManagement />
                  </ProtectedRoute>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/services"
              element={
                isAuthenticated ? (
                  <ProtectedRoute requiredPermission="viewService">
                    <ServicesManagement />
                  </ProtectedRoute>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/roles"
              element={
                isAuthenticated ? (
                  <ProtectedRoute adminOnly>
                    <RoleManagement />
                  </ProtectedRoute>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/permissions"
              element={
                isAuthenticated ? (
                  <ProtectedRoute adminOnly>
                    <PermissionManagement />
                  </ProtectedRoute>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<div>404 - Page not found</div>} />
        </Routes>
      </BrowserRouter>
    </PermissionContext.Provider>
  );
}

export default App;
