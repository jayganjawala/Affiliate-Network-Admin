import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { Modal } from "bootstrap";
import { toast } from "react-toastify";
import Toast from "../components/Toast";
import copy from "copy-to-clipboard";
import dayjs from "dayjs";
import { useContext } from "react";
import PermissionContext from "../context/PermissionContext";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5002/api";

function PaymentsManagement() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  const context = useContext(PermissionContext);
  const permissions = context?.permissions || [];

  const hasPermission = (key) =>
    Array.isArray(permissions) && permissions.includes(key);

  const canEditPayment = hasPermission("updatePayment");
  const canDeletePayment = hasPermission("deletePayment");
  const canSearchPayment = hasPermission("searchPayment");

  const [formData, setFormData] = useState({
    id: null,
    paymentMethod: "",
    totalAmount: "",
    paidAmount: "",
    remainingAmount: "",
    isPartial: false,
    status: "",
    transactionId: "",
  });

  const [filters, setFilters] = useState({
    user: "",
    transactionId: "",
    status: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const paymentsPerPage = 10;

  const modalRef = useRef(null);
  const navigate = useNavigate();

  /* ================= FETCH PAYMENTS ================= */
  function fetchPayments() {
    setLoading(true);
    const token = Cookies.get("adminToken");

    axios
      .get(API_BASE_URL + "/payments", {
        headers: { Authorization: "Bearer " + token },
      })
      .then((response) => {
        if (response.data.success) {
          setPayments(response.data.data);
        } else {
          toast.error("Failed to fetch payments");
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.error || "Error fetching payments");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    const token = Cookies.get("adminToken");
    if (!token) {
      navigate("/");
    } else {
      fetchPayments();
    }
  }, [navigate]);

  /* ================= INPUT CHANGE ================= */
  function handleInputChange(e) {
    const { name, value } = e.target;

    let updated = { ...formData, [name]: value };

    // Auto calculate remaining
    if (name === "paidAmount" || name === "totalAmount") {
      const total =
        parseFloat(name === "totalAmount" ? value : updated.totalAmount) || 0;
      const paid =
        parseFloat(name === "paidAmount" ? value : updated.paidAmount) || 0;

      updated.remainingAmount = total - paid;
      updated.isPartial = paid < total;
    }

    setFormData(updated);
  }

  /* ================= FILTER CHANGE ================= */
  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  }

  /* ================= EDIT ================= */
  function handleEdit(payment) {
    setFormData({
      id: payment.id,
      paymentMethod: payment.paymentMethod,
      totalAmount: payment.totalAmount,
      paidAmount: payment.paidAmount,
      remainingAmount: payment.remainingAmount,
      isPartial: payment.isPartial,
      status: payment.status,
      transactionId: payment.transactionId,
    });

    const modalEl = document.getElementById("editPaymentModal");
    modalRef.current = new Modal(modalEl);
    modalRef.current.show();
  }

  /* ================= UPDATE ================= */
  function handleSubmit(e) {
    e.preventDefault();
    const token = Cookies.get("adminToken");

    axios
      .put(API_BASE_URL + "/payments/" + formData.id, formData, {
        headers: { Authorization: "Bearer " + token },
      })
      .then(() => {
        toast.success("Payment updated successfully");
        fetchPayments();
        modalRef.current.hide();
      })
      .catch((err) => {
        toast.error(err.response?.data?.error || "Update failed");
      });
  }

  /* ================= DELETE ================= */
  function handleDelete(id) {
    if (!window.confirm("Delete this payment?")) return;

    const token = Cookies.get("adminToken");

    axios
      .delete(API_BASE_URL + "/payments/" + id, {
        headers: { Authorization: "Bearer " + token },
      })
      .then(() => {
        toast.success("Payment deleted successfully");
        fetchPayments();
      })
      .catch((err) => {
        toast.error(err.response?.data?.error || "Delete failed");
      });
  }

  /* ================= FILTERED PAYMENTS ================= */
  const filteredPayments = canSearchPayment
    ? payments.filter((p) => {
        const userMatch = filters.user
          ? ((p.userName || "") + (p.userPhone || "") + (p.userEmail || ""))
              .toLowerCase()
              .includes(filters.user.toLowerCase())
          : true;

        const transactionMatch = filters.transactionId
          ? (p.transactionId || "")
              .toLowerCase()
              .includes(filters.transactionId.toLowerCase())
          : true;

        const statusMatch = filters.status ? p.status === filters.status : true;

        return userMatch && transactionMatch && statusMatch;
      })
    : payments;

  /* ================= PAGINATION ================= */
  const indexOfLast = currentPage * paymentsPerPage;
  const indexOfFirst = indexOfLast - paymentsPerPage;
  const currentPayments = filteredPayments.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredPayments.length / paymentsPerPage);

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

  /* ================= User Details ================= */
  const [userDetails, setUserDetails] = useState(null);
  const userModalRef = useRef(null);

  function openUserModal(user) {
    if (!user.userId) return;

    setUserDetails(user);

    const modalEl = document.getElementById("userModal");
    userModalRef.current = new Modal(modalEl);
    userModalRef.current.show();
  }

  /* ================= Amount Details ================= */
  const [amountDetails, setAmountDetails] = useState(null);
  const amountModalRef = useRef(null);

  function openAmountModal(payment) {
    setAmountDetails(payment);
    const modalEl = document.getElementById("amountModal");
    amountModalRef.current = new Modal(modalEl);
    amountModalRef.current.show();
  }

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

      <h4 className="fw-bold mb-3">Payments Management</h4>

      {/* FILTERS */}
      <div className="row g-3 mb-3">
        <div className="col-md-4 col-12">
          <input
            type="text"
            name="user"
            className="form-control form-control-sm"
            placeholder="Search User (Name, Phone, Email)"
            value={filters.user}
            onChange={(e) => {
              if (!canSearchPayment) {
                toast.error("You don't have authority");
                return;
              }
              handleFilterChange(e);
            }}
            // disabled={!canSearchPayment}
          />
        </div>

        <div className="col-md-4 col-6">
          <input
            type="text"
            name="transactionId"
            className="form-control form-control-sm"
            placeholder="Search Transaction ID"
            value={filters.transactionId}
            onChange={(e) => {
              if (!canSearchPayment) {
                toast.error("You don't have authority");
                return;
              }
              handleFilterChange(e);
            }}
            // disabled={!canSearchPayment}
          />
        </div>

        <div className="col-md-4 col-6">
          <select
            name="status"
            className="form-select form-select-sm"
            value={filters.status}
            onChange={(e) => {
              if (!canSearchPayment) {
                toast.error("You don't have authority");
                return;
              }
              handleFilterChange(e);
            }}
            // disabled={!canSearchPayment}
          >
            <option value="">Status</option>
            <option value="Pending">Pending</option>
            <option value="Success">Success</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* ================= APPLIED FILTERS ================= */}
      {(filters.user || filters.transactionId || filters.status) && (
        <div className="row g-3 mb-3">
          <div className="col-auto">
            <span className="fw-semibold">Filters applied:</span>
          </div>

          {filters.user && (
            <div className="col-auto">
              <span className="badge bg-secondary">
                User: {filters.user}{" "}
                <i
                  className="fa fa-times ms-1"
                  style={{ cursor: "pointer" }}
                  onClick={() => setFilters((prev) => ({ ...prev, user: "" }))}
                ></i>
              </span>
            </div>
          )}

          {filters.transactionId && (
            <div className="col-auto">
              <span className="badge bg-secondary">
                Transaction: {filters.transactionId}{" "}
                <i
                  className="fa fa-times ms-1"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, transactionId: "" }))
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

      <div className="card border-0 mb-3">
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="table-responsive rounded">
            <table className="table table-striped table-hover align-middle mb-0 small">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th style={{ minWidth: "150px" }}>Transaction ID</th>
                  <th style={{ minWidth: "200px" }}>User Details</th>
                  <th style={{ minWidth: "120px" }}>Service</th>
                  {/* <th style={{ minWidth: "140px" }}>Method</th> */}
                  {/* <th>Total</th>
                  <th>Paid</th>
                  <th>Remaining</th> */}
                  <th style={{ minWidth: "120px" }}>Amount</th>
                  {/* <th style={{ minWidth: "100px" }}>Status</th> */}
                  <th style={{ minWidth: "190px" }}>Date</th>
                  <th style={{ minWidth: "70px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentPayments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ minWidth: "50px" }}>{p.id}</td>
                    <td>
                      <div className="d-flex flex-column">
                        <div>
                          <i
                            className="fa-solid fa-copy text-primary me-1"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              handleCopy(p.transactionId, "Transaction Id")
                            }
                          ></i>
                          {p.transactionId}
                        </div>
                        <div className="text-muted">{p.paymentMethod}</div>
                      </div>
                    </td>
                    <td>
                      <i
                        className="fa-solid fa-user text-info me-1"
                        style={{ cursor: "pointer" }}
                        onClick={() => openUserModal(p)}
                        title="View User Details"
                      ></i>
                      <span>{p.userName}</span>{" "}
                    </td>
                    <td>{p.serviceName}</td>

                    {/* <td>{p.paymentMethod}</td> */}
                    {/* <td>{p.totalAmount}</td>
                    <td>{p.paidAmount}</td>
                    <td>{p.remainingAmount}</td> */}
                    <td className="py-3">
                      <div className="d-flex flex-column">
                        <div>
                          <i
                            className="fa-solid fa-credit-card text-success"
                            style={{ cursor: "pointer" }}
                            title="View Amount Details"
                            onClick={() => openAmountModal(p)}
                          ></i>{" "}
                          <span>{p.paidAmount} </span>
                        </div>
                        <div>
                          <span
                            className={`badge fw-medium mt-1 ${
                              p.status?.toLowerCase() === "success"
                                ? "bg-success bg-opacity-75"
                                : p.status?.toLowerCase() === "pending"
                                  ? "bg-secondary bg-opacity-75"
                                  : "bg-danger bg-opacity-75"
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {dayjs(p.paymentDate).format("DD MMM YYYY, hh:mm A")}
                    </td>
                    <td style={{ fontSize: "15px" }}>
                      <i
                        className={`fa-solid fa-pen-to-square me-3 ${
                          canEditPayment ? "text-primary" : "text-muted"
                        }`}
                        style={{
                          cursor: "pointer",
                          opacity: canEditPayment ? 1 : 0.5,
                        }}
                        onClick={() => {
                          if (!canEditPayment) {
                            toast.error("You don't have authority");
                            return;
                          }
                          handleEdit(p);
                        }}
                        title={
                          canEditPayment ? "Edit Payment" : "No permission"
                        }
                      ></i>

                      <i
                        className={`fa-solid fa-trash ${
                          canDeletePayment ? "text-danger" : "text-muted"
                        }`}
                        style={{
                          cursor: "pointer",
                          opacity: canDeletePayment ? 1 : 0.5,
                        }}
                        onClick={() => {
                          if (!canDeletePayment) {
                            toast.error("You don't have authority");
                            return;
                          }
                          handleDelete(p.id);
                        }}
                        title={
                          canDeletePayment ? "Delete Payment" : "No permission"
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

      {/* PAGINATION */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          Page {currentPage} of {totalPages} • {filteredPayments.length} records
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

      {/* EDIT MODAL */}
      <div className="modal fade" id="editPaymentModal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">Edit Payment</h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                ></button>
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small text-muted">
                    Method <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="paymentMethod"
                    className="form-control form-control-sm"
                    placeholder="Payment Method"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small text-muted">
                    Total Amount <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    name="totalAmount"
                    className="form-control form-control-sm"
                    placeholder="Total Amount"
                    value={formData.totalAmount}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small text-muted">
                    Paid Amount <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    name="paidAmount"
                    className="form-control form-control-sm"
                    placeholder="Paid Amount"
                    value={formData.paidAmount}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small text-muted">
                    Remaining Amount <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    name="remainingAmount"
                    className="form-control form-control-sm"
                    placeholder="Remaining"
                    value={formData.remainingAmount || 0}
                    readOnly
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small text-muted">
                    Status <span className="text-danger">*</span>
                  </label>
                  <select
                    name="status"
                    className="form-select form-select-sm"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Success">Success</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small text-muted">
                    Transaction ID <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="transactionId"
                    className="form-control form-control-sm"
                    placeholder="Transaction ID"
                    value={formData.transactionId}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-sm btn-primary">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ================= User Details Modal ================= */}
      <div className="modal fade" id="userModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">User Details</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              {userDetails ? (
                <div>
                  <p>
                    <strong>ID:</strong> {userDetails.userId}
                  </p>
                  <p>
                    <strong>Name:</strong>
                    {userDetails.prefix} {userDetails.userName}
                    <i
                      className="fa-solid fa-copy ms-2"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        handleCopy(userDetails.userName, "User Name")
                      }
                    ></i>
                  </p>
                  <p>
                    <strong>Phone:</strong> {userDetails.userPhone}
                    <i
                      className="fa-solid fa-copy ms-2"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        handleCopy(userDetails.userPhone, "User Phone")
                      }
                    ></i>
                  </p>
                  <p>
                    <strong>Email:</strong> {userDetails.userEmail}
                    <i
                      className="fa-solid fa-copy ms-2"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        handleCopy(userDetails.userEmail, "User Email")
                      }
                    ></i>
                  </p>
                </div>
              ) : (
                <p>No user assigned</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Amount Details Modal */}
      <div className="modal fade" id="amountModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Payment Amount Details</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              {amountDetails ? (
                <div>
                  <p>
                    <strong>Total Amount:</strong> ₹{amountDetails.totalAmount}
                  </p>
                  <p>
                    <strong>Paid Amount:</strong> ₹{amountDetails.paidAmount}
                  </p>
                  <p>
                    <strong>Remaining Amount:</strong> ₹
                    {amountDetails.remainingAmount}
                  </p>
                </div>
              ) : (
                <p>No details available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentsManagement;
