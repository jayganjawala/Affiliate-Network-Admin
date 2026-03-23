import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import copy from "copy-to-clipboard";
import dayjs from "dayjs";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5002/api";

function UserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [supportRequest, setSupportRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const [expandedRows, setExpandedRows] = useState({});

  function toggleRow(id) {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  // =================== COPY TO CLIPBOARD ===================
  const handleCopy = (text, label) => {
    if (copy(text)) toast.success(`${label} copied to clipboard`);
    else toast.error(`Failed to copy ${label}`);
  };

  // =================== FETCH USER & PAYMENTS ===================
  useEffect(() => {
    const token = Cookies.get("adminToken");
    if (!token) {
      navigate("/");
      return;
    }

    setLoading(true);

    axios
      .get(`${API_BASE_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.success) setUser(res.data.data);
        else toast.error(res.data.error || "Failed to fetch user");
      })
      .catch((err) =>
        toast.error(err.response?.data?.error || "Error fetching user"),
      );

    axios
      .get(`${API_BASE_URL}/users/${userId}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.success) setPayments(res.data.data);
        else toast.error(res.data.error || "Failed to fetch payments");
      })
      .catch((err) =>
        toast.error(err.response?.data?.error || "Error fetching payments"),
      )
      .finally(() => setLoading(false));
  }, [userId, navigate]);

  // =================== FETCH SUPPORTS FOR USER ===================
  useEffect(() => {
    const token = Cookies.get("adminToken");
    if (!token) return;

    axios
      .get(`${API_BASE_URL}/users/supports/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.success) setSupportRequest(res.data.data);
        else toast.error(res.data.error || "Failed to fetch support requests");
      })
      .catch((err) =>
        toast.error(
          err.response?.data?.error || "Error fetching support requests",
        ),
      );
  }, [userId]);

  /* ================= GROUPING ================= */
  const groupedSupports = (() => {
    if (!supportRequest || supportRequest.length === 0) return [];

    const mainMap = {};
    const groups = [];

    for (let i = 0; i < supportRequest.length; i++) {
      const item = supportRequest[i];

      if (item.reqType === "Main") {
        mainMap[item.id] = { main: item, followups: [] };
        groups.push(mainMap[item.id]);
      }
    }

    for (let i = 0; i < supportRequest.length; i++) {
      const item = supportRequest[i];

      if (item.reqType === "Followup" && mainMap[item.reqId]) {
        mainMap[item.reqId].followups.push(item);
      }
    }

    for (let i = 0; i < groups.length; i++) {
      groups[i].followups.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      );
    }

    return groups;
  })();

  function getLatestStatus(group) {
    if (group.followups.length > 0) {
      return group.followups[group.followups.length - 1].status;
    }
    return group.main.status;
  }

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (!user) return <div className="text-center mt-5">No user found</div>;

  return (
    <section className="poppins-regular py-3">
      <div className="container">
        {/* Back Button */}
        <div className="row mb-3">
          <div className="col">
            <i
              className="fa fa-arrow-left mt-2"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(-1)}
            ></i>
          </div>
        </div>

        {/* Header & Tabs */}
        <div className="row g-3 mb-3">
          <div className="col-md-8">
            <h4 className="fw-bold mb-0">User Profile</h4>
          </div>

          <div className="col-md-4 d-none d-flex justify-content-md-end">
            <ul className="nav nav-tabs">
              {["profile", "payments", "support"].map((tab) => (
                <li className="nav-item" key={tab}>
                  <button
                    className={`nav-link ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ================= ALWAYS VISIBLE PERSONAL INFORMATION ================= */}
        <div className="p-3 rounded bg-body border mb-4">
          <h5 className="fw-semibold mb-3">
            <i className="fa-solid fa-circle-user"></i> Personal Information
          </h5>

          <div className="row g-3">
            <div className="col-md-4">
              <small className="text-muted">Name</small>
              <h6>
                {user.prefix} {user.fullName}
                <i
                  className="fa-solid fa-copy ms-1"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleCopy(user.fullName, "Name")}
                ></i>
              </h6>
            </div>

            <div className="col-md-4">
              <small className="text-muted">Email</small>
              <h6>
                {user.email}
                <i
                  className="fa-solid fa-copy ms-1"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleCopy(user.email, "Email")}
                ></i>
              </h6>
            </div>

            <div className="col-md-4">
              <small className="text-muted">Phone</small>
              <h6>
                {user.phone}
                <i
                  className="fa-solid fa-copy ms-1"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleCopy(user.phone, "Phone")}
                ></i>
              </h6>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-4 d-flex ms-1">
            <ul className="nav nav-tabs">
              {["profile", "payments", "support"].map((tab) => (
                <li className="nav-item" key={tab}>
                  <button
                    className={`nav-link ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ================= PROFILE TAB ================= */}
        {activeTab === "profile" && (
          <div className="mb-4">
            {/* Personal Information */}
            <div className="p-3 d-none rounded bg-body border mb-4">
              <h5 className="fw-semibold mb-3">
                <i className="fa-solid fa-circle-user"></i> Personal Information
              </h5>

              <div className="row g-3">
                <div className="col-md-4">
                  <small className="text-muted">
                    <i className="fa-solid fa-user text-secondary"></i> Name
                  </small>
                  <h6>
                    {user.prefix} {user.fullName}
                    <i
                      className="fa-solid fa-copy ms-1"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleCopy(user.fullName, "Name")}
                    ></i>
                  </h6>
                </div>

                <div className="col-md-4">
                  <small className="text-muted">
                    <i className="fa-solid fa-envelope text-warning"></i> Email
                  </small>
                  <h6>
                    {user.email}
                    <i
                      className="fa-solid fa-copy ms-1"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleCopy(user.email, "Email")}
                    ></i>
                  </h6>
                </div>

                <div className="col-md-4">
                  <small className="text-muted">
                    <i className="fa-solid fa-phone text-success"></i> Phone
                  </small>
                  <h6>
                    {user.phone}
                    <i
                      className="fa-solid fa-copy ms-1"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleCopy(user.phone, "Phone")}
                    ></i>
                  </h6>
                </div>
              </div>
            </div>

            {/* Related Employee */}
            {user.employeeId && (
              <div className="p-3 rounded bg-body border mb-4">
                <h5 className="fw-semibold mb-3">
                  <i className="fa-solid fa-briefcase"></i> Related Employee
                </h5>

                <div className="row g-3">
                  <div className="col-md-4">
                    <small className="text-muted">
                      <i className="fa-solid fa-user text-secondary"></i> Name
                    </small>
                    <h6>
                      {user.employeeName}
                      <i
                        className="fa-solid fa-copy ms-1"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          handleCopy(user.employeeName, "Employee Name")
                        }
                      ></i>
                    </h6>
                  </div>

                  <div className="col-md-4">
                    <small className="text-muted">
                      <i className="fa-solid fa-envelope text-warning"></i>{" "}
                      Email
                    </small>
                    <h6>
                      {user.employeeEmail || "N/A"}
                      {user.employeeEmail && (
                        <i
                          className="fa-solid fa-copy ms-1"
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            handleCopy(user.employeeEmail, "Employee Email")
                          }
                        ></i>
                      )}
                    </h6>
                  </div>

                  <div className="col-md-4">
                    <small className="text-muted">
                      <i className="fa-solid fa-phone text-success"></i> Phone
                    </small>
                    <h6>
                      {user.employeePhone || "N/A"}
                      {user.employeePhone && (
                        <i
                          className="fa-solid fa-copy ms-1"
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            handleCopy(user.employeePhone, "Employee Phone")
                          }
                        ></i>
                      )}
                    </h6>
                  </div>
                </div>
              </div>
            )}

            {/* User Source / Status */}
            <div className="p-3 rounded bg-body border mb-4">
              <h5 className="fw-semibold mb-3">
                <i className="fa-solid fa-info-circle"></i> Other Information
              </h5>

              <div className="row g-3">
                <div className="col-md-6">
                  <small className="text-muted">
                    <i className="fa-solid fa-hashtag text-secondary"></i>{" "}
                    Status
                  </small>
                  <h6>
                    <span
                      className={`badge ${
                        user.status?.toLowerCase() === "client"
                          ? "bg-success"
                          : "bg-secondary"
                      }`}
                    >
                      {user.status}
                    </span>
                  </h6>
                </div>

                <div className="col-md-6">
                  <small className="text-muted">
                    <i className="fa-solid fa-globe text-info"></i> Source
                  </small>
                  <h6>{user.source || "N/A"}</h6>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= PAYMENTS TAB ================= */}
        {activeTab === "payments" && (
          <div className="card">
            <div className="">
              <h5 className="card-title d-none">Payments</h5>

              {payments.length > 0 ? (
                <div className="table-responsive rounded">
                  <table className="table table-striped table-hover align-middle small mb-0">
                    <thead className="table-dark">
                      <tr>
                        <th>ID</th>
                        <th>Total</th>
                        <th>Paid</th>
                        <th>Remaining</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Transaction ID</th>
                        <th>Payment Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td style={{ minWidth: "50px" }}>{p.id}</td>
                          <td style={{ minWidth: "120px" }}>{p.totalAmount}</td>
                          <td style={{ minWidth: "120px" }}>{p.paidAmount}</td>
                          <td style={{ minWidth: "130px" }}>
                            {p.remainingAmount}
                          </td>
                          <td style={{ minWidth: "140px" }}>
                            {p.paymentMethod}
                          </td>
                          <td style={{ minWidth: "100px" }}>
                            <span
                              className={`badge ${
                                p.status?.toLowerCase() === "success"
                                  ? "bg-success"
                                  : p.status?.toLowerCase() === "pending"
                                    ? "bg-secondary"
                                    : "bg-danger"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td style={{ minWidth: "180px" }}>
                            {p.transactionId}{" "}
                            {p.transactionId && (
                              <i
                                className="fa-solid fa-copy ms-2"
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                  handleCopy(p.transactionId, "Transaction ID")
                                }
                              ></i>
                            )}
                          </td>
                          <td style={{ minWidth: "200px" }}>
                            {dayjs(p.paymentDate).format(
                              "DD MMM YYYY, hh:mm A",
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No payments found for this user.</p>
              )}
            </div>
          </div>
        )}

        {/* ================= Support TAB ================= */}
        {activeTab === "support" && (
          <div className="card">
            <div className="">
              <h5 className="card-title d-none">Support Requests</h5>

              <div className="table-responsive rounded">
                <table className="table table-striped small mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Conversation</th>
                      <th>Status</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedSupports.length > 0 ? (
                      groupedSupports.map((group) => (
                        <tr key={group.main.id}>
                          <td style={{ minWidth: "60px" }}>{group.main.id}</td>

                          {/* Conversation */}
                          <td style={{ minWidth: "400px" }}>
                            {/* Main */}
                            <div className="p-2 mb-2 bg-light border rounded w-75">
                              <strong>Main:</strong>
                              <div>{group.main.description}</div>
                              <small className="text-muted">
                                {dayjs(group.main.createdAt).format(
                                  "DD MMM YYYY hh:mm A",
                                )}
                              </small>
                            </div>

                            {/* Toggle Followups */}
                            {group.followups.length > 0 && (
                              <div
                                className="text-primary mb-2"
                                style={{ cursor: "pointer", fontSize: "13px" }}
                                onClick={() => toggleRow(group.main.id)}
                              >
                                {expandedRows[group.main.id]
                                  ? "▼ Hide Followups"
                                  : `▶ Show Followups (${group.followups.length})`}
                              </div>
                            )}

                            {/* Followup Timeline */}
                            {expandedRows[group.main.id] && (
                              <div
                                style={{
                                  borderLeft: "2px solid #0d6efd",
                                  marginLeft: "10px",
                                  paddingLeft: "20px",
                                }}
                              >
                                {group.followups.map((f) => (
                                  <div
                                    key={f.id}
                                    className="position-relative mb-3 d-flex justify-content-between w-75"
                                  >
                                    <div
                                      style={{
                                        width: "10px",
                                        height: "10px",
                                        background: "#0d6efd",
                                        borderRadius: "50%",
                                        position: "absolute",
                                        left: "-26px",
                                        top: "8px",
                                      }}
                                    ></div>

                                    <div className="p-2 bg-body border rounded flex-grow-1 d-flex justify-content-between align-items-start me-2">
                                      <div>
                                        <strong>Followup:</strong>
                                        <div>{f.description}</div>
                                        <small className="text-muted">
                                          {dayjs(f.createdAt).format(
                                            "DD MMM YYYY hh:mm A",
                                          )}
                                        </small>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Latest Status */}
                          <td style={{ minWidth: "120px" }}>
                            <span
                              className={`badge ${
                                getLatestStatus(group)?.toLowerCase() ===
                                "closed"
                                  ? "bg-success"
                                  : getLatestStatus(group)?.toLowerCase() ===
                                      "in progress"
                                    ? "bg-info"
                                    : "bg-warning text-dark"
                              }`}
                            >
                              {getLatestStatus(group)}
                            </span>
                          </td>

                          {/* Created At */}
                          <td style={{ minWidth: "160px" }}>
                            {dayjs(group.main.createdAt).format(
                              "DD MMM YYYY hh:mm A",
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center p-3">
                          No support requests found for this user.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default UserDetails;
