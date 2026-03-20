import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
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
import ProtectedLayout from "./layouts/ProtectedLayout";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!Cookies.get("adminToken"),
  );

  // Scroll to top on route change
  function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);
    return null;
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Admin login page */}
        <Route path="/" element={<AdminLogin setAuth={setIsAuthenticated} />} />

        {/* Protected admin routes */}
        <Route element={<ProtectedLayout />}>
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />
            }
          />

          <Route
            path="/myprofile"
            element={
              isAuthenticated ? <MyProfile /> : <Navigate to="/" replace />
            }
          />

          <Route
            path="/users"
            element={
              isAuthenticated ? <UserManagement /> : <Navigate to="/" replace />
            }
          />

          <Route
            path="/users/:userId"
            element={
              isAuthenticated ? <UserDetails /> : <Navigate to="/" replace />
            }
          />

          <Route
            path="/payment"
            element={
              isAuthenticated ? (
                <PaymentsManagement />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/support"
            element={
              isAuthenticated ? (
                <SupportManagement />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/employee"
            element={
              isAuthenticated ? (
                <EmployeeManagement />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/roles"
            element={
              isAuthenticated ? <RoleManagement /> : <Navigate to="/" replace />
            }
          />

          <Route
            path="/permissions"
            element={
              isAuthenticated ? (
                <PermissionManagement />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<div>404 - Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
