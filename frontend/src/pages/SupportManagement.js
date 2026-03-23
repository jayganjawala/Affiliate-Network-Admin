import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { Modal } from "bootstrap";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import copy from "copy-to-clipboard";
import { useContext } from "react";
import PermissionContext from "../context/PermissionContext";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5002/api";

function SupportManagement() {
  const context = useContext(PermissionContext);
  const permissions = context?.permissions || [];

  const hasPermission = (key) =>
    Array.isArray(permissions) && permissions.includes(key);

  const canSearchSupport = hasPermission("searchSupport");
  const canCreateSupport = hasPermission("createSupport"); // add followup
  const canUpdateSupport = hasPermission("updateSupport"); // edit followup
  const canDeleteSupport = hasPermission("deleteSupport");

  const [supports, setSupports] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    date: "",
  });

  const [expandedRows, setExpandedRows] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const groupsPerPage = 5;

  const [formData, setFormData] = useState({
    id: null,
    description: "",
    status: "Open",
    reqId: null,
    relatedUserId: null,
  });

  const editModalRef = useRef(null);
  const addModalRef = useRef(null);

  /* ================= Toggle Followup ================= */
  function toggleRow(id) {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  /* ================= FETCH ================= */
  function fetchSupports() {
    setLoading(true);
    const token = Cookies.get("adminToken");

    axios
      .get(API_BASE_URL + "/supports", {
        headers: { Authorization: "Bearer " + token },
      })
      .then((res) => {
        if (res.data.success) {
          setSupports(res.data.data || []);
        } else {
          toast.error("Failed to fetch supports");
        }
      })
      .catch(() => toast.error("Error fetching supports"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const token = Cookies.get("adminToken");
    if (!token) navigate("/");
    else fetchSupports();
  }, [navigate]);

  /* ================= GROUPING ================= */
  const groupedSupports = (() => {
    const mainMap = {};
    const groups = [];

    for (let i = 0; i < supports.length; i++) {
      const item = supports[i];

      if (item.reqType === "Main") {
        mainMap[item.id] = { main: item, followups: [] };
        groups.push(mainMap[item.id]);
      }
    }

    for (let i = 0; i < supports.length; i++) {
      const item = supports[i];
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

  /* ================= FILTER ================= */
  const filteredGroups = canSearchSupport
    ? groupedSupports.filter((group) => {
        const searchLower = filters.search.toLowerCase();
        const combinedText =
          (group.main.userFullName || "") +
          (group.main.userPhone || "") +
          (group.main.userEmail || "");

        const searchMatch = filters.search
          ? combinedText.toLowerCase().includes(searchLower)
          : true;

        const statusMatch = filters.status
          ? getLatestStatus(group) === filters.status
          : true;

        const dateMatch = filters.date
          ? dayjs(group.main.createdAt).format("YYYY-MM-DD") === filters.date
          : true;

        return searchMatch && statusMatch && dateMatch;
      })
    : groupedSupports;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  /* ================= PAGINATION ================= */
  const indexOfLast = currentPage * groupsPerPage;
  const indexOfFirst = indexOfLast - groupsPerPage;
  const currentGroups = filteredGroups.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(Math.ceil(filteredGroups.length / groupsPerPage));

  function goToNextPage() {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  }

  function goToPreviousPage() {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  }

  /* ================= EDIT / ADD ================= */
  function handleEdit(support) {
    if (support.reqType !== "Followup") {
      toast.error("Main request cannot be edited here");
      return;
    }

    setFormData({
      id: support.id,
      description: support.description,
      status: support.status,
      reqId: support.reqId,
      relatedUserId: support.userId,
    });

    const modal = new Modal(document.getElementById("editSupportModal"));
    editModalRef.current = modal;
    modal.show();
  }

  function handleAddMode(mainSupport) {
    setFormData({
      id: null,
      description: "",
      status: "Open",
      reqId: mainSupport.id,
      relatedUserId: mainSupport.userId,
    });

    const modalEl = document.getElementById("editSupportModal");
    addModalRef.current = new Modal(modalEl);
    addModalRef.current.show();
  }

  function handleSubmit(e) {
    e.preventDefault();
    const token = Cookies.get("adminToken");

    if (formData.id) {
      // Edit followup
      axios
        .put(API_BASE_URL + "/supports/" + formData.id, formData, {
          headers: { Authorization: "Bearer " + token },
        })
        .then(() => {
          toast.success("Followup updated");
          fetchSupports();
          editModalRef.current?.hide();
        })
        .catch(() => toast.error("Update failed"));
    } else {
      // Add followup
      axios
        .post(API_BASE_URL + "/supports", formData, {
          headers: { Authorization: "Bearer " + token },
        })
        .then(() => {
          toast.success("Followup added successfully");
          fetchSupports();
          addModalRef.current?.hide();
        })
        .catch(() => toast.error("Failed to add followup"));
    }
  }

  /* ================= DELETE ================= */
  function handleDelete(support) {
    if (support.reqType !== "Followup") {
      toast.error("Main request cannot be deleted");
      return;
    }

    if (!window.confirm("Delete this followup?")) return;

    const token = Cookies.get("adminToken");

    axios
      .delete(API_BASE_URL + "/supports/" + support.id, {
        headers: { Authorization: "Bearer " + token },
      })
      .then(() => {
        toast.success("Deleted");
        fetchSupports();
      })
      .catch(() => toast.error("Delete failed"));
  }

  /* ================= Get latest status ================= */
  function getLatestStatus(group) {
    if (group.followups.length > 0) {
      return group.followups[group.followups.length - 1].status;
    }
    return group.main.status;
  }

  /* ================= Status Count ================= */
  const openCount = groupedSupports.filter(
    (group) => getLatestStatus(group)?.toLowerCase() === "open",
  ).length;

  const inProgressCount = groupedSupports.filter(
    (group) => getLatestStatus(group)?.toLowerCase() === "in progress",
  ).length;

  const closedCount = groupedSupports.filter(
    (group) => getLatestStatus(group)?.toLowerCase() === "closed",
  ).length;

  /* ================= User Contact Details Modal ================= */
  const [detailsUser, setDetailsUser] = useState(null);
  const detailsModalRef = useRef(null);

  function openDetailsModal(user) {
    setDetailsUser(user);
    const modalEl = document.getElementById("detailsModal");
    detailsModalRef.current = new Modal(modalEl);
    detailsModalRef.current.show();
  }

  /* ================= Copy ================= */
  function handleCopy(text, type) {
    if (copy(text)) toast.success(`${type} copied to clipboard`);
    else toast.error(`Failed to copy ${type}`);
  }

  /* ================= UI ================= */
  return (
    <div className="container mt-3">
      <div className="row mb-3">
        <div className="col">
          <i
            className="fa fa-arrow-left mt-2"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/dashboard")}
          ></i>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-12">
          <h4 className="fw-bold mb-0">Support Management</h4>
        </div>
      </div>

      {/* Filters */}
      <div className="row g-3 mb-3">
        <div className="col-md-4 col-12">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search by Name, Phone, Email"
            value={filters.search}
            onChange={(e) => {
              if (!canSearchSupport) {
                toast.error("You don't have authority");
                return;
              }
              setFilters({ ...filters, search: e.target.value });
            }}
            // disabled={!canSearchSupport}
            style={{ opacity: canSearchSupport ? 1 : 0.6 }}
          />
        </div>

        <div className="col-md-4 col-6">
          <input
            type="date"
            className="form-control form-control-sm"
            value={filters.date}
            onChange={(e) => {
              if (!canSearchSupport) {
                toast.error("You don't have authority");
                return;
              }
              setFilters({ ...filters, search: e.target.value });
            }}
            // disabled={!canSearchSupport}
            style={{ opacity: canSearchSupport ? 1 : 0.6 }}
          />
        </div>

        <div className="col-md-4 col-6">
          <select
            className="form-select form-select-sm"
            value={filters.status}
            onChange={(e) => {
              if (!canSearchSupport) {
                toast.error("You don't have authority");
                return;
              }
              setFilters({ ...filters, search: e.target.value });
            }}
            // disabled={!canSearchSupport}
            style={{ opacity: canSearchSupport ? 1 : 0.6 }}
          >
            <option value="">Status</option>
            <option value="Open">Open ({openCount})</option>
            <option value="In Progress">In Progress ({inProgressCount})</option>
            <option value="Closed">Closed ({closedCount})</option>
          </select>
        </div>
      </div>

      {/* Applied Filters */}
      {(filters.search || filters.status || filters.date) && (
        <div className="row g-3 mb-3">
          <div className="col-auto">
            <span className="fw-semibold">Filters applied:</span>
          </div>

          {filters.search && (
            <div className="col-auto">
              <span className="badge bg-secondary">
                Search: {filters.search}{" "}
                <i
                  className="fa fa-times ms-1"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, search: "" }))
                  }
                ></i>
              </span>
            </div>
          )}

          {filters.status && (
            <div className="col-auto">
              <span className="badge bg-secondary">
                Status: {filters.status}{" "}
                <i
                  className="fa fa-times ms-1"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, status: "" }))
                  }
                ></i>
              </span>
            </div>
          )}

          {filters.date && (
            <div className="col-auto">
              <span className="badge bg-secondary">
                Date: {filters.date}{" "}
                <i
                  className="fa fa-times ms-1"
                  style={{ cursor: "pointer" }}
                  onClick={() => setFilters((prev) => ({ ...prev, date: "" }))}
                ></i>
              </span>
            </div>
          )}
        </div>
      )}

      {/* TABLE */}
      <div className="card border-0 mb-3">
        {loading ? (
          <div className="text-center p-3">Loading...</div>
        ) : (
          <div className="table-responsive rounded">
            <table className="table table-striped small mb-0">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>User Name</th>
                  <th>Contact</th>
                  <th>Conversation</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentGroups.map((group) => (
                  <tr key={group.main.id}>
                    <td style={{ minWidth: "50px" }}>{group.main.id}</td>
                    <td style={{ minWidth: "180px" }}>
                      {group.main.userPrefix} {group.main.userFullName}
                    </td>
                    <td style={{ minWidth: "130px", fontSize: "15px" }}>
                      <i
                        className="fa-solid fa-phone text-success me-2"
                        style={{ cursor: "pointer" }}
                        title="Copy Phone"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(group.main.userPhone, "Phone number");
                        }}
                      ></i>
                      <i
                        className="fa-solid fa-envelope text-primary me-2"
                        style={{ cursor: "pointer" }}
                        title="Copy Email"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(group.main.userEmail, "Email");
                        }}
                      ></i>
                      <i
                        className="fa-solid fa-id-card text-secondary"
                        style={{ cursor: "pointer" }}
                        title="View Details"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetailsModal(group.main);
                        }}
                      ></i>
                    </td>

                    <td style={{ minWidth: "450px" }}>
                      <div className="p-2 mb-2 bg-light border rounded w-75">
                        <strong>Main:</strong>
                        <div>{group.main.description}</div>
                        <small className="text-muted">
                          {dayjs(group.main.createdAt).format(
                            "DD MMM YYYY hh:mm A",
                          )}
                        </small>
                      </div>

                      {/* Toggle */}
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

                      {/* Timeline */}
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
                                    {dayjs(f.updatedAt).format(
                                      "DD MMM YYYY hh:mm A",
                                    )}
                                  </small>
                                </div>
                                <div>
                                  <i
                                    onClick={() => {
                                      if (!canUpdateSupport) {
                                        toast.error("You don't have authority");
                                        return;
                                      }
                                      handleEdit(f);
                                    }}
                                    className={`fa-solid fa-pen ${
                                      canUpdateSupport
                                        ? "text-primary"
                                        : "text-muted"
                                    }`}
                                    style={{
                                      cursor: "pointer",
                                      opacity: canUpdateSupport ? 1 : 0.5,
                                    }}
                                  ></i>
                                  <i
                                    onClick={() => {
                                      if (!canDeleteSupport) {
                                        toast.error("You don't have authority");
                                        return;
                                      }
                                      handleDelete(f);
                                    }}
                                    className={`fa-solid fa-trash ms-1 ${
                                      canDeleteSupport
                                        ? "text-danger"
                                        : "text-muted"
                                    }`}
                                    style={{
                                      cursor: "pointer",
                                      opacity: canDeleteSupport ? 1 : 0.5,
                                    }}
                                  ></i>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    <td style={{ minWidth: "100px" }}>
                      <span
                        className={`badge ${
                          getLatestStatus(group)?.toLowerCase() === "closed"
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

                    {/* Action Column */}
                    <td style={{ minWidth: "50px", fontSize: "15px" }}>
                      <i
                        onClick={() => {
                          if (!canCreateSupport) {
                            toast.error("You don't have authority");
                            return;
                          }
                          handleAddMode(group.main);
                        }}
                        className={`fa-solid fa-pen-to-square ${
                          canCreateSupport ? "text-primary" : "text-muted"
                        }`}
                        style={{
                          cursor: "pointer",
                          opacity: canCreateSupport ? 1 : 0.5,
                        }}
                      ></i>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="d-flex justify-content-between mb-3">
        <div>
          Page {currentPage} of {totalPages} • {filteredGroups.length}
        </div>
        <div>
          <button
            className="btn btn-sm border-0"
            disabled={currentPage === 1}
            onClick={goToPreviousPage}
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button
            className="btn btn-sm border-0"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={goToNextPage}
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* Edit / Add Modal */}
      <div className="modal fade" id="editSupportModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5>{formData.id ? "Edit Followup" : "Add Followup"}</h5>
              <button className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <select
                  className="form-select mb-3"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>

                <textarea
                  className="form-control"
                  placeholder="Reply..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary">
                  {formData.id ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Contact Details Modal */}
      <div className="modal fade" id="detailsModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Contact Details</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              {detailsUser && (
                <div>
                  <p>
                    <strong>Phone:</strong> {detailsUser.userPhone}
                  </p>
                  <p>
                    <strong>Email:</strong> {detailsUser.userEmail}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupportManagement;
