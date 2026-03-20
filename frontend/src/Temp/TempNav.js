import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import Toast from "../components/Toast";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

function Navbar({ onLogoutClick }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("adminToken");

      await axios.post(
        `${API_BASE_URL}/admin/logout`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      Cookies.remove("adminToken");
      Cookies.remove("adminPhoneNumber");

      toast.success("Logged out successfully!");
      setTimeout(() => navigate("/", { replace: true }), 500);
    } catch (error) {
      console.error("Logout error:", error);
      const message =
        error.response?.data?.error || error.message || "Logout failed";
      toast.error(`Failed to logout: ${message}`);
    } finally {
      setLoading(false);
      setShowLogoutModal(false);
      setShowOffcanvas(false);
      setDropdownOpen(false);
    }
  };

  const toggleOffcanvas = () => setShowOffcanvas(!showOffcanvas);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  return (
    <>
      <header className="bg-white py-3 sticky-top">
        <div className="container">
          <div className="row align-items-center">
            <div className="col d-flex align-items-center">
              {/* Hamburger button */}
              <i
                className="fa-solid fa-bars me-1"
                onClick={toggleOffcanvas}
                style={{ cursor: "pointer" }}
              ></i>

              <Link className="nav-link bg-transparent" to="/dashboard">
                <img
                  loading="lazy"
                  className="img-fluid my-0 my-md-1"
                  style={{ width: "220px", height: "auto" }}
                  src="/logo.png"
                  alt="EP-Investment-Advisor"
                />
              </Link>
            </div>

            <div className="col-auto">
              <div className="dropdown text-end position-relative">
                {/* React-controlled button */}
                <a
                  href="/dashboard"
                  // className="btn p-0 border-0 bg-transparent link-body-emphasis text-decoration-none dropdown-toggle"
                  className="d-block link-body-emphasis text-decoration-none dropdown-toggle"
                  aria-expanded={dropdownOpen}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown();
                  }}
                >
                  <img
                    src="https://imgs.search.brave.com/3rh24kV5qNSeAQSUMeFbL0kQndiXRstkTKVlwMDW67g/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9taXIt/czMtY2RuLWNmLmJl/aGFuY2UubmV0L3By/b2plY3RzLzQwNC81/ZTVhNzI5ODkwMzM5/NS5ZM0p2Y0N3NU1q/QXNOekl3TERFNE1D/d3cuanBn"
                    alt="profile"
                    width="40"
                    height="40"
                    className="rounded-circle"
                  />
                </a>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <ul
                    className="dropdown-menu dropdown-menu-end text-small show"
                    style={{ position: "absolute", right: 0 }}
                  >
                    <li>
                      <Link
                        className="dropdown-item"
                        to="/myprofile"
                        onClick={() => setDropdownOpen(false)}
                      >
                        My Profile <i className="fa-solid fa-circle-user"></i>
                      </Link>
                    </li>

                    <li>
                      <hr className="dropdown-divider" />
                    </li>

                    <li>
                      <button
                        className="dropdown-item text-danger"
                        onClick={() => {
                          setDropdownOpen(false);
                          setShowLogoutModal(true);
                        }}
                        disabled={loading}
                      >
                        Sign out{" "}
                        <i className="fa-solid fa-right-from-bracket text-danger"></i>
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Offcanvas Sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          width: "260px",
          backgroundColor: "#f8f9fa",
          zIndex: 1050,
          padding: "1rem",
          overflowY: "auto",
          transition: "transform 0.3s ease-in-out",
          transform: showOffcanvas ? "translateX(0)" : "translateX(-100%)",
          boxShadow: showOffcanvas ? "2px 0 8px rgba(0,0,0,0.3)" : "none",
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0">Menu</h5>
          <button className="btn-close" onClick={toggleOffcanvas}></button>
        </div>

        <ul className="list-unstyled">
          {[
            { to: "/dashboard", icon: "fa-gauge", label: "Dashboard" },
            { to: "/users", icon: "fa-users", label: "Users" },
            { to: "/payment", icon: "fa-credit-card", label: "Payments" },
            {
              to: "/support",
              icon: "fa-circle-question",
              label: "User Support",
            },
            { to: "/employee", icon: "fa-user-tie", label: "Employees" },
            { to: "/roles", icon: "fa-user-shield", label: "Roles" },
            { to: "/permissions", icon: "fa-key", label: "Permissions" },
            // {
            //   to: "/uploadleads",
            //   icon: "fa-cloud-arrow-up",
            //   label: "Upload Leads",
            // },
            // {
            //   to: "/history",
            //   icon: "fa-clock-rotate-left",
            //   label: "View History",
            // },
            { to: "/myprofile", icon: "fa-circle-user", label: "My Profile" },
          ].map((item) => (
            <li key={item.to} className="mb-3">
              <Link
                to={item.to}
                onClick={toggleOffcanvas}
                className="d-flex align-items-center text-decoration-none text-dark p-3 rounded border"
                style={{
                  backgroundColor: "white",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <i
                  className={`fa-solid ${item.icon} me-3`}
                  style={{ fontSize: "1.2rem" }}
                ></i>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Overlay */}
      {showOffcanvas && (
        <div
          onClick={toggleOffcanvas}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1040,
          }}
        />
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Logout</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowLogoutModal(false)}
                />
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Are you sure you want to logout from your account?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowLogoutModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleLogout}
                  disabled={loading}
                >
                  {loading ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast container */}
      <Toast />
    </>
  );
}

export default Navbar;
