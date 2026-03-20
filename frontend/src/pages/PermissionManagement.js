import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { Modal } from "bootstrap";
import { toast } from "react-toastify";
import Toast from "../components/Toast";
import dayjs from "dayjs";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5002/api";

function PermissionManagement() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    key: "",
  });

  const [filters, setFilters] = useState({
    search: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const permissionsPerPage = 10;

  const modalRef = useRef(null);
  const navigate = useNavigate();

  /* ================= FETCH ================= */
  function fetchPermissions() {
    setLoading(true);
    const token = Cookies.get("adminToken");

    axios
      .get(API_BASE_URL + "/permissions", {
        headers: { Authorization: "Bearer " + token },
      })
      .then((res) => {
        if (res.data.success) {
          setPermissions(res.data.data);
        } else {
          toast.error("Failed to fetch permissions");
        }
      })
      .catch((err) =>
        toast.error(err.response?.data?.error || "Error fetching permissions"),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const token = Cookies.get("adminToken");
    if (!token) navigate("/");
    else fetchPermissions();
  }, [navigate]);

  /* ================= INPUT ================= */
  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  /* ================= FILTER ================= */
  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  }

  /* ================= ADD ================= */
  function openAddModal() {
    setFormData({
      id: null,
      key: "",
    });

    const modalEl = document.getElementById("permissionModal");
    modalRef.current = new Modal(modalEl);
    modalRef.current.show();
  }

  /* ================= EDIT ================= */
  function openEditModal(permission) {
    setFormData(permission);

    const modalEl = document.getElementById("permissionModal");
    modalRef.current = new Modal(modalEl);
    modalRef.current.show();
  }

  /* ================= DELETE ================= */
  function handleDelete(id) {
    const token = Cookies.get("adminToken");

    if (!window.confirm("Are you sure you want to delete this permission?"))
      return;

    axios
      .delete(API_BASE_URL + "/permissions/" + id, {
        headers: { Authorization: "Bearer " + token },
      })
      .then(() => {
        toast.success("Permission deleted successfully");
        fetchPermissions();
      })
      .catch((err) =>
        toast.error(err.response?.data?.error || "Delete failed"),
      );
  }

  /* ================= SUBMIT ================= */
  function handleSubmit(e) {
    e.preventDefault();
    const token = Cookies.get("adminToken");

    if (!formData.key) {
      toast.error("Permission key is required");
      return;
    }

    const request = formData.id
      ? axios.put(
          API_BASE_URL + "/permissions/" + formData.id,
          { key: formData.key },
          { headers: { Authorization: "Bearer " + token } },
        )
      : axios.post(
          API_BASE_URL + "/permissions",
          { key: formData.key },
          { headers: { Authorization: "Bearer " + token } },
        );

    request
      .then(() => {
        toast.success(
          formData.id
            ? "Permission updated successfully"
            : "Permission created successfully",
        );
        fetchPermissions();
        modalRef.current.hide();
      })
      .catch((err) =>
        toast.error(err.response?.data?.error || "Operation failed"),
      );
  }

  /* ================= FILTERED DATA ================= */
  const filteredPermissions = permissions.filter((permission) =>
    filters.search
      ? permission.key.toLowerCase().includes(filters.search.toLowerCase())
      : true,
  );

  /* ================= PAGINATION ================= */
  const indexOfLast = currentPage * permissionsPerPage;
  const indexOfFirst = indexOfLast - permissionsPerPage;
  const currentPermissions = filteredPermissions.slice(
    indexOfFirst,
    indexOfLast,
  );
  const totalPages = Math.ceil(filteredPermissions.length / permissionsPerPage);

  function goToNextPage() {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  }

  function goToPreviousPage() {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  }

  /* ================= UI ================= */
  return (
    <div className="container mt-3">
      <Toast />

      {/* Back */}
      <div className="row mb-3">
        <div className="col">
          <i
            className="fa fa-arrow-left mt-2"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/dashboard")}
          ></i>
        </div>
      </div>

      {/* Header */}
      <div className="row g-3 mb-3">
        <div className="col-md-10 col-6">
          <h4 className="fw-bold mb-0">Permissions</h4>
        </div>
        <div className="col-md-2 col-6 text-end">
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>
            + Add Permission
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <input
            type="text"
            name="search"
            className="form-control form-control-sm"
            placeholder="Search Permission Key"
            value={filters.search}
            onChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Applied Filters */}
      {filters.search && (
        <div className="row g-3 mb-3">
          <div className="col-auto">
            <span className="fw-semibold">Filters applied:</span>
          </div>

          <div className="col-auto">
            <span className="badge bg-secondary">
              Search: {filters.search}
              <i
                className="fa fa-times ms-1"
                style={{ cursor: "pointer" }}
                onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
              ></i>
            </span>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card border-0 mb-3">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-3">Loading...</div>
          ) : (
            <div className="table-responsive rounded">
              <table className="table table-striped table-hover align-middle mb-0 small">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Permission Key</th>
                    <th>Date & Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPermissions.map((permission) => (
                    <tr key={permission.id}>
                      <td style={{ minWidth: "50px" }}>{permission.id}</td>
                      <td style={{ minWidth: "140px" }}>{permission.key}</td>
                      <td style={{ minWidth: "250px" }}>
                        <div className="d-flex flex-column">
                          <small>
                            <span className="fw-semibold text-muted">
                              Created:
                            </span>{" "}
                            {dayjs(permission.createdAt).format(
                              "DD MMM YYYY, hh:mm A",
                            )}
                          </small>
                          <small>
                            <span className="fw-semibold text-muted">
                              Updated:
                            </span>{" "}
                            {dayjs(permission.updatedAt).format(
                              "DD MMM YYYY, hh:mm A",
                            )}
                          </small>
                        </div>
                      </td>
                      <td style={{ minWidth: "70px", fontSize: "15px" }}>
                        <i
                          className="fa-solid fa-pen-to-square text-primary me-3"
                          style={{ cursor: "pointer" }}
                          onClick={() => openEditModal(permission)}
                        ></i>

                        <i
                          className="fa-solid fa-trash text-danger"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleDelete(permission.id)}
                        ></i>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          Page {currentPage} of {totalPages} • {filteredPermissions.length}{" "}
          records
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

      {/* Modal */}
      <div className="modal fade" id="permissionModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0">
            <div className="modal-header">
              <h5 className="modal-title">
                {formData.id ? "Edit Permission" : "Add Permission"}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>

            <div className="modal-body">
              <label className="form-label small text-muted">
                Permission Key <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="key"
                className="form-control form-control-sm"
                value={formData.key}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleSubmit}
              >
                {formData.id ? "Update Permission" : "Create Permission"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PermissionManagement;
