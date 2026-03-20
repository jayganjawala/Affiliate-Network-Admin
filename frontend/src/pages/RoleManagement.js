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

function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    description: "",
  });

  const [filters, setFilters] = useState({
    search: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const rolesPerPage = 10;

  const [permissionRole, setPermissionRole] = useState(null);

  const modalRef = useRef(null);
  const permissionModalRef = useRef(null);
  const navigate = useNavigate();

  /* ================= FETCH ROLES ================= */
  function fetchRoles() {
    setLoading(true);
    const token = Cookies.get("adminToken");

    axios
      .get(API_BASE_URL + "/roles", {
        headers: { Authorization: "Bearer " + token },
      })
      .then((res) => {
        if (res.data.success) {
          setRoles(res.data.data);
        }
      })
      .catch((err) =>
        toast.error(err.response?.data?.error || "Error fetching roles"),
      )
      .finally(() => setLoading(false));
  }

  /* ================= FETCH PERMISSIONS ================= */
  function fetchPermissions() {
    const token = Cookies.get("adminToken");

    axios
      .get(API_BASE_URL + "/permissions", {
        headers: { Authorization: "Bearer " + token },
      })
      .then((res) => {
        if (res.data.success) {
          setPermissions(res.data.data);
        }
      })
      .catch(() => toast.error("Error fetching permissions"));
  }

  useEffect(() => {
    const token = Cookies.get("adminToken");
    if (!token) navigate("/");
    else {
      fetchRoles();
      fetchPermissions();
    }
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
    setFormData({ id: null, name: "", description: "" });

    const modalEl = document.getElementById("roleModal");
    modalRef.current = new Modal(modalEl);
    modalRef.current.show();
  }

  /* ================= EDIT ================= */
  function openEditModal(role) {
    setFormData({
      id: role.id,
      name: role.name,
      description: role.description,
    });

    const modalEl = document.getElementById("roleModal");
    modalRef.current = new Modal(modalEl);
    modalRef.current.show();
  }

  /* ================= DELETE ================= */
  function handleDelete(id) {
    const token = Cookies.get("adminToken");

    if (!window.confirm("Are you sure you want to delete this role?")) return;

    axios
      .delete(API_BASE_URL + "/roles/" + id, {
        headers: { Authorization: "Bearer " + token },
      })
      .then(() => {
        toast.success("Role deleted successfully");
        fetchRoles();
      })
      .catch((err) =>
        toast.error(err.response?.data?.error || "Delete failed"),
      );
  }

  /* ================= SUBMIT ROLE ================= */
  function handleSubmit(e) {
    e.preventDefault();
    const token = Cookies.get("adminToken");

    const payload = {
      name: formData.name,
      description: formData.description,
    };

    const request = formData.id
      ? axios.put(API_BASE_URL + "/roles/" + formData.id, payload, {
          headers: { Authorization: "Bearer " + token },
        })
      : axios.post(API_BASE_URL + "/roles", payload, {
          headers: { Authorization: "Bearer " + token },
        });

    request
      .then(() => {
        toast.success(
          formData.id
            ? "Role updated successfully"
            : "Role created successfully",
        );
        fetchRoles();
        modalRef.current.hide();
      })
      .catch((err) =>
        toast.error(err.response?.data?.error || "Operation failed"),
      );
  }

  /* ================= OPEN PERMISSION MODAL ================= */
  function openPermissionModal(role) {
    setPermissionRole(role);

    const permissionIds = role.permissions
      ? role.permissions.map((p) => p.id)
      : [];

    setSelectedPermissions(permissionIds);

    const modalEl = document.getElementById("permissionModal");
    permissionModalRef.current = new Modal(modalEl);
    permissionModalRef.current.show();
  }

  /* ================= PERMISSION CHECKBOX ================= */
  function handlePermissionChange(permissionId) {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  }

  /* ================= SUBMIT PERMISSIONS ================= */
  function handlePermissionSubmit() {
    const token = Cookies.get("adminToken");

    axios
      .put(
        API_BASE_URL + "/roles/" + permissionRole.id,
        { permissions: selectedPermissions },
        { headers: { Authorization: "Bearer " + token } },
      )
      .then(() => {
        toast.success("Permissions updated successfully");
        fetchRoles();
        permissionModalRef.current.hide();
      })
      .catch((err) =>
        toast.error(err.response?.data?.error || "Update failed"),
      );
  }

  /* ================= GROUP PERMISSIONS ================= */
  const groupedPermissions = permissions.reduce((acc, perm) => {
    let category = "";

    if (perm.key.includes("User")) category = "User";
    else if (perm.key.includes("Employee")) category = "Employee";
    else if (perm.key.includes("Payment")) category = "Payment";
    else if (perm.key.includes("Support")) category = "Support";
    else if (perm.key.includes("Withdrawal")) category = "Withdrawal";
    else if (perm.key.includes("Service")) category = "Service";

    if (!acc[category]) acc[category] = [];
    acc[category].push(perm);
    return acc;
  }, {});

  /* ================= FILTERED ROLES ================= */
  const filteredRoles = roles.filter((role) =>
    filters.search
      ? ((role.name || "") + (role.description || ""))
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      : true,
  );

  /* ================= PAGINATION ================= */
  const indexOfLast = currentPage * rolesPerPage;
  const indexOfFirst = indexOfLast - rolesPerPage;
  const currentRoles = filteredRoles.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredRoles.length / rolesPerPage);

  function goToNextPage() {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  }

  function goToPreviousPage() {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  }

  /* ================= SELECT ALL PERMISSIONS ================= */
  function handleSelectAll(category, isChecked) {
    const permIds = groupedPermissions[category].map((perm) => perm.id);

    if (isChecked) {
      setSelectedPermissions((prev) => [...new Set([...prev, ...permIds])]);
    } else {
      setSelectedPermissions((prev) =>
        prev.filter((id) => !permIds.includes(id)),
      );
    }
  }

  /* ================= UI ================= */
  return (
    <div className="container mt-3">
      <Toast />

      {/* Header */}
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
        <div className="col-md-10 col-7">
          <h4 className="fw-bold mb-0">Roles</h4>
        </div>
        <div className="col-md-2 col-5 text-end">
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>
            + Add Role
          </button>
        </div>
      </div>

      {/* FILTER */}
      <div className="row g-3 mb-3">
        <div className="col-md-6 col-12">
          <input
            type="text"
            name="search"
            className="form-control form-control-sm"
            placeholder="Search Role (Name, Description)"
            value={filters.search}
            onChange={handleFilterChange}
          />
        </div>
      </div>

      {/* APPLIED FILTER */}
      {filters.search && (
        <div className="row g-3 mb-3">
          <div className="col-auto">
            <span className="badge bg-secondary">
              Search: {filters.search}
              <i
                className="fa fa-times ms-1"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setFilters({ search: "" });
                  setCurrentPage(1);
                }}
              ></i>
            </span>
          </div>
        </div>
      )}

      {/* TABLE */}
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
                    <th>Role Name</th>
                    <th>Description</th>
                    <th>Date & Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRoles.map((role) => (
                    <tr key={role.id}>
                      <td style={{ minWidth: "50px" }}>{role.id}</td>
                      <td style={{ minWidth: "120px" }}>{role.name}</td>
                      <td style={{ minWidth: "280px" }}>{role.description}</td>
                      <td style={{ minWidth: "250px" }}>
                        <div className="d-flex flex-column">
                          <small>
                            <span className="fw-semibold text-muted">
                              Created:
                            </span>{" "}
                            {dayjs(role.createdAt).format(
                              "DD MMM YYYY, hh:mm A",
                            )}
                          </small>
                          <small>
                            <span className="fw-semibold text-muted">
                              Updated:
                            </span>{" "}
                            {dayjs(role.updatedAt).format(
                              "DD MMM YYYY, hh:mm A",
                            )}
                          </small>
                        </div>
                      </td>
                      <td style={{ minWidth: "100px", fontSize: "15px" }}>
                        <i
                          className="fa-solid fa-key text-warning me-2"
                          style={{ cursor: "pointer" }}
                          onClick={() => openPermissionModal(role)}
                        ></i>

                        <i
                          className="fa-solid fa-pen-to-square text-primary me-2"
                          style={{ cursor: "pointer" }}
                          onClick={() => openEditModal(role)}
                        ></i>

                        <i
                          className="fa-solid fa-trash text-danger"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleDelete(role.id)}
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

      {/* PAGINATION */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          Page {currentPage} of {totalPages || 1} • {filteredRoles.length}{" "}
          records
        </div>
        <div>
          <button
            className="btn btn-sm border-0"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button
            className="btn btn-sm border-0"
            onClick={goToNextPage}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* ROLE MODAL */}
      <div className="modal fade" id="roleModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {formData.id ? "Edit Role" : "Add Role"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small text-muted">
                    Role Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="form-control form-control-sm"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small text-muted">
                    Description
                  </label>
                  <textarea
                    name="description"
                    className="form-control form-control-sm"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-sm btn-primary">
                  {formData.id ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* PERMISSION MODAL */}
      <div className="modal fade" id="permissionModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {permissionRole?.name} - Permissions
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              {Object.keys(groupedPermissions).map((category) => (
                <div key={category} className="mb-3">
                  {/* Category header with checkbox on the right */}
                  <div className="d-flex align-items-center">
                    <h6 className="fw-semibold mb-0">{category}</h6>
                    <input
                      className="form-check-input form-check-input-sm ms-2 mb-1"
                      type="checkbox"
                      checked={groupedPermissions[category].every((perm) =>
                        selectedPermissions.includes(perm.id),
                      )}
                      onChange={(e) =>
                        handleSelectAll(category, e.target.checked)
                      }
                    />
                  </div>
                  <hr />

                  {/* Permissions under the category */}
                  <div className="row">
                    {groupedPermissions[category].map((perm) => (
                      <div className="col-md-4 mb-1" key={perm.id}>
                        <div className="form-check form-check-sm">
                          <label className="form-check-label small text-muted mb-0">
                            {perm.key}
                          </label>
                          <input
                            className="form-check-input form-check-input-sm"
                            type="checkbox"
                            checked={selectedPermissions.includes(perm.id)}
                            onChange={() => handlePermissionChange(perm.id)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePermissionSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleManagement;
