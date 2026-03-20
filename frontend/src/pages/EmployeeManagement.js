import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { Modal } from "bootstrap";
import { toast } from "react-toastify";
import Toast from "../components/Toast";
import copy from "copy-to-clipboard";
import dayjs from "dayjs";
import Select from "react-select";
import { useContext } from "react";
import PermissionContext from "../context/PermissionContext";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5002/api";

function EmployeeManagement() {
  const context = useContext(PermissionContext);
  const permissions = context?.permissions || [];

  const hasPermission = (key) =>
    Array.isArray(permissions) && permissions.includes(key);

  const canSearchEmployee = hasPermission("searchEmployee");
  const canCreateEmployee = hasPermission("createEmployee");
  const canUpdateEmployee = hasPermission("updateEmployee");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    prefix: "Mr",
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    rolePermissionId: "",
    rmId: null,
    status: "Active",
    totalBalance: 0,
    commissionPercentage: 0,
    commissionAmount: 0,
    orgName: "",
    orgPhone: "",
    orgEmail: "",
    orgAddress: "",
  });

  const [filters, setFilters] = useState({
    employeeSearch: "",
    status: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 10;

  const [detailsEmployee, setDetailsEmployee] = useState(null);

  const modalRef = useRef(null);
  const detailsModalRef = useRef(null);
  const navigate = useNavigate();

  /* ================= FETCH ================= */
  function fetchEmployees() {
    setLoading(true);
    const token = Cookies.get("adminToken");

    axios
      .get(API_BASE_URL + "/employees", {
        headers: { Authorization: "Bearer " + token },
      })
      .then((res) => {
        if (res.data.success) {
          setEmployees(res.data.data);
        } else {
          toast.error("Failed to fetch employees");
        }
      })
      .catch((err) =>
        toast.error(err.response?.data?.error || "Error fetching employees"),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const token = Cookies.get("adminToken");
    if (!token) navigate("/");
    else fetchEmployees();
  }, [navigate]);

  /* ================= INPUT CHANGE ================= */
  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  //   function handleInputChange(e) {
  //   const { name, value } = e.target;

  //   setFormData((prev) => {
  //     if (name === "commissionPercentage") {
  //       return {
  //         ...prev,
  //         commissionPercentage: value,
  //         commissionAmount: value ? null : prev.commissionAmount,
  //       };
  //     }

  //     if (name === "commissionAmount") {
  //       return {
  //         ...prev,
  //         commissionAmount: value,
  //         commissionPercentage: value ? null : prev.commissionPercentage,
  //       };
  //     }

  //     return { ...prev, [name]: value };
  //   });
  // }

  /* ================= RM OPTIONS ================= */
  // const rmOptions = employees
  //   .filter((emp) => emp.id !== formData.id) // prevent self-selection
  //   .map((emp) => ({
  //     value: emp.id,
  //     label: `${emp.prefix} ${emp.name} (${emp.role})`,
  //   }));

  const rmOptions = employees
    .filter((emp) => {
      // Prevent self-selection
      if (emp.id === formData.id) return false;

      // Only show active employees
      if (emp.status !== "Active") return false;

      // Role-based filtering
      switch (Number(formData.rolePermissionId)) {
        case 2:
          return emp.role === "Sales Manager";
        case 5:
          return emp.role === "Broker";
        case 1:
          return emp.role === "Admin";
        case 4:
          return emp.role === "Admin";
        case 3:
          return emp.role === "Sales Manager";
        default:
          return false; // show all for other roles
      }
    })
    .map((emp) => ({
      value: emp.id,
      label: `${emp.prefix} ${emp.name} (${emp.role})`,
    }));

  function handleRmChange(selectedOption) {
    setFormData((prev) => ({
      ...prev,
      rmId: selectedOption ? selectedOption.value : null,
    }));
  }

  /* ================= FILTER CHANGE ================= */
  function handleFilterChange(e) {
    if (!canSearchEmployee) {
      toast.error("You don't have authority");
      return;
    }
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  }

  /* ================= ADD ================= */
  function openAddModal() {
    setFormData({
      id: null,
      prefix: "Mr",
      name: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      address: "",
      rolePermissionId: "",
      rmId: null,
      status: "Active",
      totalBalance: 0,
      commissionPercentage: 0,
      commissionAmount: 0,
      orgName: "",
      orgPhone: "",
      orgEmail: "",
      orgAddress: "",
    });

    const modalEl = document.getElementById("employeeModal");
    modalRef.current = new Modal(modalEl);
    modalRef.current.show();
  }

  /* ================= EDIT ================= */
  function openEditModal(emp) {
    setFormData(emp);

    const modalEl = document.getElementById("employeeModal");
    modalRef.current = new Modal(modalEl);
    modalRef.current.show();
  }

  /* ================= SUBMIT ================= */
  function handleSubmit(e) {
    e.preventDefault();
    const token = Cookies.get("adminToken");

    const payload = {
      ...formData,
      rolePermissionId: Number(formData.rolePermissionId),
      rmId: formData.rmId ? Number(formData.rmId) : null,
      commissionPercentage:
        formData.commissionPercentage === ""
          ? null
          : Number(formData.commissionPercentage),
      // commissionAmount:
      //   formData.commissionAmount === ""
      //     ? null
      //     : Number(formData.commissionAmount),
      totalBalance: Number(formData.totalBalance || 0),
      dateOfBirth: formData.dateOfBirth || null,
    };

    //     const payload = {
    //   ...formData,
    //   rolePermissionId: Number(formData.rolePermissionId),
    //   commissionPercentage:
    //     formData.commissionPercentage !== null &&
    //     formData.commissionPercentage !== ""
    //       ? Number(formData.commissionPercentage)
    //       : null,
    //   commissionAmount:
    //     formData.commissionAmount !== null &&
    //     formData.commissionAmount !== ""
    //       ? Number(formData.commissionAmount)
    //       : null,
    //   totalBalance: Number(formData.totalBalance || 0),
    // };

    const request = formData.id
      ? axios.put(API_BASE_URL + "/employees/" + formData.id, payload, {
          headers: { Authorization: "Bearer " + token },
        })
      : axios.post(API_BASE_URL + "/employees", payload, {
          headers: { Authorization: "Bearer " + token },
        });

    request
      .then(() => {
        toast.success(
          formData.id
            ? "Employee updated successfully"
            : "Employee created successfully",
        );
        fetchEmployees();
        modalRef.current.hide();
      })
      .catch((err) =>
        toast.error(err.response?.data?.error || "Operation failed"),
      );
  }

  /* ================= FILTERED DATA ================= */
  const filteredEmployees = canSearchEmployee
    ? employees.filter((emp) => {
        const searchMatch = filters.employeeSearch
          ? (emp.name + emp.phone + emp.email + emp.role)
              .toLowerCase()
              .includes(filters.employeeSearch.toLowerCase())
          : true;

        return (
          searchMatch && (filters.status ? emp.status === filters.status : true)
        );
      })
    : employees;

  /* ================= PAGINATION ================= */
  const indexOfLast = currentPage * employeesPerPage;
  const indexOfFirst = indexOfLast - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

  function goToNextPage() {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  }

  function goToPreviousPage() {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  }

  /* ================= COPY ================= */
  function handleCopy(text, type) {
    if (copy(text)) toast.success(type + " copied to clipboard");
    else toast.error("Failed to copy " + type);
  }

  /* ================= RM MODEL ================= */
  const [rmDetails, setRmDetails] = useState(null);
  const rmModalRef = useRef(null);

  function openRmModal(rm) {
    setRmDetails(rm);

    const modalEl = document.getElementById("rmModal");
    rmModalRef.current = new Modal(modalEl);
    rmModalRef.current.show();
  }

  /* ================= Financial MODEL ================= */
  const [financialDetails, setFinancialDetails] = useState(null);
  const financialModalRef = useRef(null);

  function openFinancialModal(emp) {
    setFinancialDetails({
      totalBalance: emp.totalBalance,
      commissionPercentage: emp.commissionPercentage,
      commissionAmount: emp.commissionAmount,
    });

    const modalEl = document.getElementById("financialModal");
    financialModalRef.current = new Modal(modalEl);
    financialModalRef.current.show();
  }

  /* ================= Role&status MODEL ================= */
  // const [roleStatusDetails, setRoleStatusDetails] = useState(null);
  // const roleStatusModalRef = useRef(null);

  // function openRoleStatusModal(emp) {
  //   setRoleStatusDetails({
  //     role: emp.role,
  //     status: emp.status,
  //   });

  //   const modalEl = document.getElementById("roleStatusModal");
  //   roleStatusModalRef.current = new Modal(modalEl);
  //   roleStatusModalRef.current.show();
  // }

  /* ================= Count active and inactive ================= */
  const activeCount = employees.filter(
    (emp) => emp.status?.toLowerCase() === "active",
  ).length;

  const inactiveCount = employees.filter(
    (emp) => emp.status?.toLowerCase() === "inactive",
  ).length;

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
        <div className="col-md-10 col-7">
          <h4 className="fw-bold mb-0">Employees</h4>
        </div>
        <div className="col-md-2 col-5 text-end">
          <button
            className={`btn btn-sm ${
              canCreateEmployee ? "btn-primary" : "btn-secondary"
            }`}
            onClick={() => {
              if (!canCreateEmployee) {
                toast.error("You don't have authority");
                return;
              }
              openAddModal();
            }}
            style={{ opacity: canCreateEmployee ? 1 : 0.6 }}
          >
            + Add Employee
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="row g-3 mb-3">
        <div className="col-md-6 col-6">
          <input
            type="text"
            name="employeeSearch"
            className="form-control form-control-sm"
            placeholder="Search (Name, Phone, Email, Role)"
            value={filters.employeeSearch}
            onChange={handleFilterChange}
          />
        </div>

        <div className="col-md-6 col-6">
          <select
            name="status"
            className="form-select form-select-sm"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">Status</option>
            <option value="Active">Active ({activeCount})</option>
            <option value="Inactive">Inactive ({inactiveCount})</option>
          </select>
        </div>
      </div>

      {/* Applied Filters */}
      {(filters.employeeSearch || filters.status) && (
        <div className="row g-3 mb-3">
          <div className="col-auto">
            <span className="fw-semibold">Filters applied:</span>
          </div>

          {filters.employeeSearch && (
            <div className="col-auto">
              <span className="badge bg-secondary">
                Search: {filters.employeeSearch}
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
                Status: {filters.status}
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
                    <th>Name</th>
                    <th>Relationship Manager</th>
                    <th>Contact</th>
                    <th>Role & Status</th>
                    {/* <th>Role</th>
                    <th>Status</th> */}
                    <th>Financial</th>
                    <th>Date & Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEmployees.map((emp) => (
                    <tr key={emp.id}>
                      <td style={{ minWidth: "50px" }}>{emp.id}</td>

                      <td style={{ minWidth: "180px" }}>
                        {emp.prefix} {emp.name}
                      </td>

                      <td style={{ minWidth: "200px" }}>
                        {emp.rmId ? (
                          <>
                            <i
                              className="fa-solid fa-user-tie text-info me-1"
                              style={{ cursor: "pointer" }}
                              onClick={() =>
                                openRmModal({
                                  id: emp.rmId,
                                  prefix: emp.rmPrefix,
                                  name: emp.rmName,
                                  phone: emp.rmPhone,
                                  email: emp.rmEmail,
                                  role: emp.rmRole,
                                  status: emp.rmStatus,
                                })
                              }
                            ></i>
                            <span>
                              {emp.rmPrefix} {emp.rmName}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>

                      <td style={{ minWidth: "130px", fontSize: "15px" }}>
                        <i
                          className="fa-solid fa-phone text-success me-2"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleCopy(emp.phone, "Phone")}
                        ></i>
                        <i
                          className="fa-solid fa-envelope text-primary me-2"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleCopy(emp.email, "Email")}
                        ></i>
                        <i
                          className="fa-solid fa-id-card text-secondary"
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setDetailsEmployee(emp);
                            const modalEl =
                              document.getElementById("detailsModal");
                            detailsModalRef.current = new Modal(modalEl);
                            detailsModalRef.current.show();
                          }}
                        ></i>
                      </td>
                      {/* <td style={{ minWidth: "100px" }}>{emp.role}</td>
                      <td style={{ minWidth: "100px" }}>{emp.status}</td> */}
                      {/* <td style={{ minWidth: "130px" }}>
                        <i
                          className="fa-solid fa-user-gear text-info"
                          style={{ cursor: "pointer" }}
                          onClick={() => openRoleStatusModal(emp)}
                        ></i>
                      </td> */}

                      <td style={{ minWidth: "160px" }}>
                        <div className="d-flex align-items-center gap-2">
                          <i
                            className={`fa-solid fa-circle fa-xs ${
                              emp.status?.toLowerCase() === "active"
                                ? "text-success"
                                : "text-danger"
                            }`}
                            title={emp.status}
                          ></i>
                          <span>{emp.role}</span>
                        </div>
                      </td>

                      <td style={{ minWidth: "100px", fontSize: "15px" }}>
                        <i
                          className="fa-solid fa-sack-dollar text-success"
                          style={{ cursor: "pointer" }}
                          onClick={() => openFinancialModal(emp)}
                        ></i>
                      </td>

                      <td style={{ minWidth: "240px" }}>
                        <div className="d-flex flex-column">
                          <small>
                            <span className="fw-semibold text-muted">
                              Created:
                            </span>{" "}
                            {dayjs(emp.createdAt).format(
                              "DD MMM YYYY, hh:mm A",
                            )}
                          </small>
                          <small>
                            <span className="fw-semibold text-muted">
                              Updated:
                            </span>{" "}
                            {dayjs(emp.updatedAt).format(
                              "DD MMM YYYY, hh:mm A",
                            )}
                          </small>
                        </div>
                      </td>
                      <td style={{ fontSize: "15px" }}>
                        <i
                          className={`fa-solid fa-pen-to-square me-3 ${
                            canUpdateEmployee ? "text-primary" : "text-muted"
                          }`}
                          style={{
                            cursor: "pointer",
                            opacity: canUpdateEmployee ? 1 : 0.5,
                          }}
                          onClick={() => {
                            if (!canUpdateEmployee) {
                              toast.error("You don't have authority");
                              return;
                            }
                            openEditModal(emp);
                          }}
                          title={
                            canUpdateEmployee
                              ? "Edit Employee"
                              : "No permission"
                          }
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
          Page {currentPage} of {totalPages} • {filteredEmployees.length}{" "}
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

      {/* Details Modal */}
      <div className="modal fade" id="detailsModal" tabIndex="-1">
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
              {detailsEmployee && (
                <>
                  <p>
                    <strong>Phone:</strong> {detailsEmployee.phone}
                  </p>
                  <p>
                    <strong>Email:</strong> {detailsEmployee.email}
                  </p>
                  <p>
                    <strong>Date of Birth:</strong>{" "}
                    {detailsEmployee.dateOfBirth
                      ? dayjs(detailsEmployee.dateOfBirth).format("DD MMM YYYY")
                      : "N/A"}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RM Model */}
      <div className="modal fade" id="rmModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Relationship Manager Details</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              {rmDetails && (
                <>
                  <p>
                    <strong>ID:</strong> {rmDetails.id}
                  </p>
                  <p>
                    <strong>Name:</strong> {rmDetails.prefix} {rmDetails.name}
                    <i
                      className="fa-solid fa-copy ms-2"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleCopy(rmDetails.name, "RM Name")}
                    ></i>
                  </p>
                  <p>
                    <strong>Phone:</strong> {rmDetails.phone}
                    <i
                      className="fa-solid fa-copy ms-2"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        handleCopy(rmDetails.phone, "RM Phone Number")
                      }
                    ></i>
                  </p>
                  <p>
                    <strong>Email:</strong> {rmDetails.email}
                    <i
                      className="fa-solid fa-copy ms-2"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleCopy(rmDetails.email, "RM Email Id")}
                    ></i>
                  </p>
                  <p>
                    <strong>Role:</strong> {rmDetails.role}
                  </p>
                  <p>
                    <strong>Status:</strong> {rmDetails.status}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Modal */}
      <div className="modal fade" id="financialModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Financial Details</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              {financialDetails && (
                <>
                  <p>
                    <strong>Total Balance:</strong> ₹
                    {Number(financialDetails.totalBalance || 0).toLocaleString(
                      "en-IN",
                    )}
                  </p>

                  <p>
                    <strong>Commission Percentage:</strong>{" "}
                    {financialDetails.commissionPercentage}%
                  </p>

                  <p>
                    <strong>Commission Amount:</strong> ₹
                    {Number(
                      financialDetails.commissionAmount || 0,
                    ).toLocaleString("en-IN")}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role & Status Modal */}
      {/* <div className="modal fade" id="roleStatusModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Role & Status Details</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              {roleStatusDetails && (
                <>
                  <p>
                    <strong>Role:</strong> {roleStatusDetails.role}
                  </p>
                  <p>
                    <strong>Status:</strong> {roleStatusDetails.status}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div> */}

      {/* Add/Edit Modal */}
      <div className="modal fade" id="employeeModal" tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content border-0">
            <div className="modal-header">
              <h5 className="modal-title">
                {formData.id ? "Edit Employee" : "Add Employee"}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>

            <div className="modal-body">
              {/* ===== BASIC INFORMATION ===== */}
              <h6 className="fw-bold text-primary mb-3">Basic Information</h6>

              <div className="row g-3">
                <div className="col-md-2 col-6">
                  <label className="form-label small text-muted">
                    Prefix <span className="text-danger">*</span>
                  </label>
                  <select
                    name="prefix"
                    className="form-select form-select-sm"
                    value={formData.prefix}
                    onChange={handleInputChange}
                  >
                    <option>Mr</option>
                    <option>Mrs</option>
                    <option>Miss</option>
                  </select>
                </div>

                <div className="col-md-3 col-6">
                  <label className="form-label small text-muted">
                    Full Name <span className="text-danger">*</span>
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

                <div className="col-md-3 col-6">
                  <label className="form-label small text-muted">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="form-control form-control-sm"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="col-md-3 col-6">
                  <label className="form-label small text-muted">
                    Phone <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    className="form-control form-control-sm"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-3 col-6">
                  <label className="form-label small text-muted">
                    Date of Birth <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    className="form-control form-control-sm"
                    value={
                      formData.dateOfBirth
                        ? dayjs(formData.dateOfBirth).format("YYYY-MM-DD")
                        : ""
                    }
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small text-muted">
                    Address <span className="text-danger">*</span>
                  </label>
                  <textarea
                    name="address"
                    className="form-control form-control-sm"
                    rows="1"
                    value={formData.address || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <hr className="my-4" />

              {/* ===== ROLE & STATUS ===== */}
              <h6 className="fw-bold text-primary mb-3">
                Role, Status & Relationship Manager
              </h6>

              <div className="row g-3">
                <div className="col-md-3 col-6">
                  <label className="form-label small text-muted">
                    Role <span className="text-danger">*</span>
                  </label>
                  <select
                    name="rolePermissionId"
                    className="form-select form-select-sm"
                    value={formData.rolePermissionId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="1">Admin</option>
                    <option value="2">Broker</option>
                    <option value="3">Accountant</option>
                    <option value="4">Analyst</option>
                    <option value="5">Sales Manager</option>
                  </select>
                </div>

                <div className="col-md-3 col-6">
                  <label className="form-label small text-muted">
                    Status <span className="text-danger">*</span>
                  </label>
                  <select
                    name="status"
                    className="form-select form-select-sm"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label small text-muted">
                    Relationship Manager <span className="text-danger">*</span>
                  </label>
                  <Select
                    className="react-select-sm"
                    classNamePrefix="rm-select"
                    options={rmOptions}
                    isClearable
                    placeholder="Search & Select RM"
                    value={
                      rmOptions.find((opt) => opt.value === formData.rmId) ||
                      null
                    }
                    onChange={handleRmChange}
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        minHeight: "31px",
                        height: "31px",
                        fontSize: "0.875rem",
                        // borderColor: state.isFocused ? "#86b7fe" : "#ced4da",
                        boxShadow: state.isFocused
                          ? "0 0 0 0.2rem rgba(13,110,253,.25)"
                          : "none",
                      }),
                      valueContainer: (base) => ({
                        ...base,
                        padding: "0 8px",
                        height: "31px",
                      }),
                      input: (base) => ({
                        ...base,
                        margin: 0,
                        padding: 0,
                      }),
                      indicatorsContainer: (base) => ({
                        ...base,
                        height: "31px",
                      }),
                      dropdownIndicator: (base) => ({
                        ...base,
                        padding: "4px",
                      }),
                      clearIndicator: (base) => ({
                        ...base,
                        padding: "4px",
                      }),
                      menu: (base) => ({
                        ...base,
                        fontSize: "0.875rem",
                      }),
                    }}
                  />
                </div>
              </div>

              <hr className="my-4" />

              {/* ===== FINANCIAL DETAILS ===== */}
              <h6 className="fw-bold text-primary mb-3">Financial Details</h6>

              <div className="row g-3">
                <div className="col-md-4 col-6">
                  <label className="form-label small text-muted">
                    Commission Percentage (%)
                  </label>
                  <input
                    type="number"
                    name="commissionPercentage"
                    className="form-control form-control-sm"
                    value={formData.commissionPercentage ?? ""}
                    onChange={handleInputChange}
                    // disabled={!!formData.commissionAmount}
                  />
                </div>

                <div className="col-md-4 col-6">
                  <label className="form-label small text-muted">
                    Commission Amount
                    <small className="text-muted"> (Per Flat)</small>
                  </label>
                  <input
                    type="number"
                    name="commissionAmount"
                    className="form-control form-control-sm"
                    value={formData.commissionAmount ?? ""}
                    onChange={handleInputChange}
                    // disabled={!!formData.commissionPercentage}
                  />
                </div>

                <div className="col-md-4 col-6">
                  <label className="form-label small text-muted">
                    Total Balance
                  </label>
                  <input
                    type="number"
                    name="totalBalance"
                    className="form-control form-control-sm"
                    value={formData.totalBalance}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <hr className="my-4" />

              <h6 className="fw-bold text-primary mb-3">
                Organization Details
              </h6>

              <div className="row g-3">
                <div className="col-md-4 col-6">
                  <label className="form-label small text-muted">
                    Organization Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="orgName"
                    className="form-control form-control-sm"
                    value={formData.orgName || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-4 col-6">
                  <label className="form-label small text-muted">
                    Organization Phone <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="orgPhone"
                    className="form-control form-control-sm"
                    value={formData.orgPhone || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-4 col-6">
                  <label className="form-label small text-muted">
                    Organization Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    name="orgEmail"
                    className="form-control form-control-sm"
                    value={formData.orgEmail || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small text-muted">
                    Organization Address <span className="text-danger">*</span>
                  </label>
                  <textarea
                    name="orgAddress"
                    className="form-control form-control-sm"
                    rows="1"
                    value={formData.orgAddress || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
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
                {formData.id ? "Update Employee" : "Create Employee"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeManagement;
