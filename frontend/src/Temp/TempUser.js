import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { Modal } from "bootstrap";
import { toast } from "react-toastify";
import Toast from "../components/Toast";
import copy from "copy-to-clipboard";
import dayjs from "dayjs";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    prefix: "Mr",
    fullName: "",
    phone: "",
    email: "",
    status: "",
    source: "",
  });
  // const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState({
    userSearch: "",
    employeeSearch: "",
    status: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const modalRef = useRef(null);
  const navigate = useNavigate();

  /* ================= FETCH USERS ================= */
  function fetchUsers() {
    setLoading(true);
    const token = Cookies.get("adminToken");

    axios
      .get(API_BASE_URL + "/users", {
        headers: { Authorization: "Bearer " + token },
      })
      .then(function (response) {
        if (response.data.success) {
          // setTotalCount(response.data.count)
          setUsers(response.data.data);
        } else {
          toast.error(response.data.error || "Failed to fetch users");
        }
      })
      .catch(function (err) {
        toast.error(err.response?.data?.error || "Error fetching users");
      })
      .finally(function () {
        setLoading(false);
      });
  }

  useEffect(
    function () {
      const token = Cookies.get("adminToken");
      if (!token) {
        navigate("/");
      } else {
        fetchUsers();
      }
    },
    [navigate],
  );

  /* ================= INPUT CHANGE ================= */
  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  /* ================= FILTER CHANGE ================= */
  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page whenever filters change
  }

  /* ================= EDIT ================= */
  function handleEdit(user) {
    setFormData({
      id: user.id,
      prefix: user.prefix,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      status: user.status,
      source: user.source,
    });

    const modalElement = document.getElementById("editUserModal");
    modalRef.current = new Modal(modalElement);
    modalRef.current.show();
  }

  /* ================= UPDATE ================= */
  function handleSubmit(e) {
    e.preventDefault();

    const token = Cookies.get("adminToken");

    axios
      .put(API_BASE_URL + "/users/" + formData.id, formData, {
        headers: { Authorization: "Bearer " + token },
      })
      .then(function () {
        toast.success("User updated successfully");
        fetchUsers();
        modalRef.current.hide();
      })
      .catch(function (err) {
        toast.error(err.response?.data?.error || "Update failed");
      });
  }

  /* ================= DELETE ================= */
  function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    const token = Cookies.get("adminToken");

    axios
      .delete(API_BASE_URL + "/users/" + id, {
        headers: { Authorization: "Bearer " + token },
      })
      .then(function () {
        toast.success("User deleted successfully");
        fetchUsers();
      })
      .catch(function (err) {
        toast.error(err.response?.data?.error || "Delete failed");
      });
  }

  /* ================= FILTERED USERS ================= */
  const filteredUsers = users.filter((user) => {
    const userSearchMatch = filters.userSearch
      ? (user.fullName + user.phone + user.email)
          .toLowerCase()
          .includes(filters.userSearch.toLowerCase())
      : true;

    const employeeSearchMatch = filters.employeeSearch
      ? user.employeeId &&
        (
          (user.employeeName || "") +
          (user.employeePhone || "") +
          (user.employeeEmail || "")
        )
          .toLowerCase()
          .includes(filters.employeeSearch.toLowerCase())
      : true;

    return (
      userSearchMatch &&
      employeeSearchMatch &&
      (filters.status ? user.status === filters.status : true)
    );
  });

  /* ================= PAGINATION ================= */
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  function goToNextPage() {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  }

  function goToPreviousPage() {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  }

  /* ================= Copy Phone and Email ================= */
  function handleCopy(text, type) {
    if (copy(text)) toast.success(type + " copied to clipboard");
    else toast.error("Failed to copy " + type);
  }

  /* ================= Phone and Email Show Model ================= */
  const [detailsUser, setDetailsUser] = useState(null);
  const detailsModalRef = useRef(null);

  function openDetailsModal(user) {
    setDetailsUser(user);

    const modalEl = document.getElementById("detailsModal");
    detailsModalRef.current = new Modal(modalEl);
    detailsModalRef.current.show();
  }

  /* ================= Employee Details ================= */
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const employeeModalRef = useRef(null);

  function openEmployeeModal(user) {
    if (!user.employeeId) return;

    setEmployeeDetails(user);

    const modalEl = document.getElementById("employeeModal");
    employeeModalRef.current = new Modal(modalEl);
    employeeModalRef.current.show();
  }

  /* ================= Count client and lead ================= */
  const clientCount = users.filter(
    (item) => item.status?.toLowerCase() === "client",
  ).length;

  const leadCount = users.filter(
    (item) => item.status?.toLowerCase() === "lead",
  ).length;

  /* ================= UI ================= */
  return (
    <div className="container mt-3">
      <Toast />
      <div className="row mb-3">
        <div className="col">
          <i
            className="fa fa-arrow-left mt-2"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/dashboard")}
          ></i>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col">
          <h4 className="fw-bold mb-0">User Management</h4>
        </div>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="row g-3 mb-3">
        <div className="col-md-4 col-6">
          <input
            type="text"
            name="userSearch"
            className="form-control form-control-sm"
            placeholder="Search User (Name, Phone, Email)"
            value={filters.userSearch}
            onChange={handleFilterChange}
          />
        </div>

        <div className="col-md-4 col-6">
          <input
            type="text"
            name="employeeSearch"
            className="form-control form-control-sm"
            placeholder="Search Employee (Name, Phone, Email)"
            value={filters.employeeSearch}
            onChange={handleFilterChange}
          />
        </div>

        <div className="col-md-4 col-12">
          <select
            name="status"
            className="form-select form-select-sm"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">Status</option>
            <option value="Client">Client ({clientCount})</option>
            <option value="Lead">Lead ({leadCount})</option>
          </select>
        </div>
      </div>

      {/* ================= APPLIED FILTERS ================= */}
      {(filters.userSearch || filters.employeeSearch || filters.status) && (
        <div className="row g-3 mb-3">
          <div className="col-auto">
            <span className="fw-semibold">Filters applied:</span>
          </div>

          {filters.userSearch && (
            <div className="col-auto">
              <span className="badge bg-secondary">
                User: {filters.userSearch}{" "}
                <i
                  className="fa fa-times ms-1"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, userSearch: "" }))
                  }
                ></i>
              </span>
            </div>
          )}

          {filters.employeeSearch && (
            <div className="col-auto">
              <span className="badge bg-secondary">
                Employee: {filters.employeeSearch}{" "}
                <i
                  className="fa fa-times ms-1"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, employeeSearch: "" }))
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
        </div>
      )}

      <div className="card mb-3">
        <div className="card border-0">
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <div className="table-responsive rounded">
              <table className="table table-striped table-hover align-middle mb-0 small">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    {/* <th>Prefix</th> */}
                    <th>Name</th>
                    <th>RelEmp</th>
                    {/* <th>Phone</th>
                    <th>Email</th> */}
                    {/* Merged Phone and Email columns */}
                    <th>Contact Details</th>
                    <th>Status</th>
                    <th>Source</th>
                    {/* <th>Created At</th>
                    <th>Updated At</th> */}
                    <th>Date & Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user) => (
                    <tr
                      key={user.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/users/${user.id}`)}
                    >
                      <td style={{ minWidth: "50px" }}>{user.id}</td>

                      {/* <td>{user.prefix}</td> */}
                      {/* <td>{user.fullName}</td> */}
                      <td
                        style={{ minWidth: "180px" }}
                      >{`${user.prefix} ${user.fullName}`}</td>
                      <td style={{ minWidth: "180px" }}>
                        {user.employeeId ? (
                          <i
                            className="fa-solid fa-user text-info me-1"
                            style={{ cursor: "pointer" }}
                            title="View Employee"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEmployeeModal(user);
                            }}
                          ></i>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                        <span>{user.employeeName}</span>
                      </td>
                      {/* <td>{user.phone}</td>
                      <td>{user.email}</td> */}
                      <td style={{ minWidth: "130px", fontSize:"15px" }}>
                        <i
                          className="fa-solid fa-phone text-success me-2"
                          style={{ cursor: "pointer" }}
                          title="Copy Phone"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(user.phone, "Phone number");
                          }}
                        ></i>
                        <i
                          className="fa-solid fa-envelope text-primary me-2"
                          style={{ cursor: "pointer" }}
                          title="Copy Email"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(user.email, "Email");
                          }}
                        ></i>
                        <i
                          className="fa-solid fa-id-card text-secondary"
                          style={{ cursor: "pointer" }}
                          title="View Details"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailsModal(user);
                          }}
                        ></i>
                      </td>
                      <td style={{ minWidth: "100px" }}>
                        <span
                          className={`badge ${
                            user.status?.toLowerCase() === "client"
                              ? "bg-success"
                              : "bg-secondary"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td style={{ minWidth: "100px" }}>{user.source}</td>
                      {/* <td>{new Date(user.createdAt).toLocaleString()}</td>
                      <td>{new Date(user.updatedAt).toLocaleString()}</td> */}
                      <td style={{ minWidth: "240px" }}>
                        <div className="d-flex flex-column">
                          <small>
                            {/* <i className="fa-solid fa-arrow-down text-success me-1"></i> */}
                            <span className="fw-semibold text-muted">
                              Created:{" "}
                            </span>
                            {dayjs(user.createdAt).format(
                              "DD MMM YYYY, hh:mm A",
                            )}
                          </small>
                          <small>
                            {/* <i className="fa-solid fa-arrow-up text-primary me-1"></i> */}
                            <span className="fw-semibold text-muted">
                              Updated:{" "}
                            </span>
                            {dayjs(user.updatedAt).format(
                              "DD MMM YYYY, hh:mm A",
                            )}
                          </small>
                        </div>
                      </td>
                      <td style={{ minWidth: "70px",fontSize:"15px" }}>
                        <i
                          className="fa-solid fa-pen-to-square text-primary me-3"
                          style={{ cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(user);
                          }}
                          title="Edit User"
                        ></i>
                        <i
                          className="fa-solid fa-trash text-danger"
                          style={{ cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(user.id);
                          }}
                          title="Delete User"
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

      {/* ================= PAGINATION CONTROLS ================= */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          Page {currentPage} of {totalPages} • {filteredUsers.length} records
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

      {/* ================= EDIT MODAL ================= */}
      <div className="modal fade" id="editUserModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">Edit User</h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                ></button>
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label>Prefix</label>
                  <select
                    name="prefix"
                    className="form-select"
                    value={formData.prefix}
                    onChange={handleInputChange}
                  >
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Miss">Miss</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    className="form-control"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label>Status</label>
                  <select
                    name="status"
                    className="form-select"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Client">Client</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label>Source</label>
                  <input
                    type="text"
                    name="source"
                    className="form-control"
                    value={formData.source}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ================= Phone and Email Display Model ================= */}
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
                    <strong>Phone:</strong> {detailsUser.phone}
                    {/* <i
                      className="fa-solid fa-copy ms-2"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        handleCopy(detailsUser.phone, "Phone number")
                      }
                    ></i> */}
                  </p>
                  <p>
                    <strong>Email:</strong> {detailsUser.email}
                    {/* <i
                      className="fa-solid fa-copy ms-2"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleCopy(detailsUser.email, "Email")}
                    ></i> */}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= Employee Details ================= */}
      <div className="modal fade" id="employeeModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Employee Details</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              {employeeDetails ? (
                <div>
                  <p>
                    <strong>ID:</strong> {employeeDetails.employeeId}
                  </p>
                  <p>
                    <strong>Name:</strong> {employeeDetails.employeeName}
                    <i
                      className="fa-solid fa-copy ms-2"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        handleCopy(
                          employeeDetails.employeeName,
                          "Employee Name",
                        )
                      }
                    ></i>
                  </p>
                  <p>
                    <strong>Phone:</strong> {employeeDetails.employeePhone}
                    <i
                      className="fa-solid fa-copy ms-2"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        handleCopy(
                          employeeDetails.employeePhone,
                          "Employee Phone Number",
                        )
                      }
                    ></i>
                  </p>
                  <p>
                    <strong>Email:</strong> {employeeDetails.employeeEmail}
                    <i
                      className="fa-solid fa-copy ms-2"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        handleCopy(
                          employeeDetails.employeeEmail,
                          "Employee Email Id",
                        )
                      }
                    ></i>
                  </p>
                </div>
              ) : (
                <p>No employee assigned</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
