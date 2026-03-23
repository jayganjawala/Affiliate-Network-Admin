import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { Modal } from "bootstrap";
import { toast } from "react-hot-toast";
import PermissionContext from "../context/PermissionContext";
// import dayjs from "dayjs";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5002/api";

function ServicesManagement() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const modalRef = useRef(null);

  const context = useContext(PermissionContext);
  const permissions = context?.permissions || [];

  const hasPermission = (key) =>
    Array.isArray(permissions) && permissions.includes(key);

  const canAddService = hasPermission("createService");
  const canEditService = hasPermission("updateService");
  const canDeleteService = hasPermission("deleteService");
  const canSearchService = hasPermission("searchService");

  const [formData, setFormData] = useState({
    id: null,
    category: "",
    name: "",
    description: "",
    price: "",
    status: "Active",
  });

  const [filters, setFilters] = useState({
    serviceSearch: "",
    status: "",
    category: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const servicesPerPage = 10;

  /* ================= FETCH SERVICES ================= */

  function fetchServices() {
    setLoading(true);
    const token = Cookies.get("adminToken");

    axios
      .get(API_BASE_URL + "/services", {
        headers: { Authorization: "Bearer " + token },
      })
      .then((res) => {
        if (res.data.success) {
          setServices(res.data.data);
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.error || "Error fetching services");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const token = Cookies.get("adminToken");

    if (!token) navigate("/");
    else fetchServices();
  }, [navigate]);

  /* ================= INPUT CHANGE ================= */

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  /* ================= ADD SERVICE ================= */

  function openAddModal() {
    if (!canAddService) {
      toast.error("You don't have authority");
      return;
    }

    setFormData({
      id: null,
      category: "",
      name: "",
      description: "",
      price: "",
      status: "Active",
    });

    const modalEl = document.getElementById("serviceModal");
    modalRef.current = new Modal(modalEl);
    modalRef.current.show();
  }

  /* ================= EDIT SERVICE ================= */

  function handleEdit(service) {
    if (!canEditService) {
      toast.error("You don't have authority");
      return;
    }

    setFormData(service);

    const modalEl = document.getElementById("serviceModal");
    modalRef.current = new Modal(modalEl);
    modalRef.current.show();
  }

  /* ================= SAVE SERVICE ================= */

  function handleSubmit(e) {
    e.preventDefault();

    const token = Cookies.get("adminToken");

    if (formData.id) {
      axios
        .put(API_BASE_URL + "/services/" + formData.id, formData, {
          headers: { Authorization: "Bearer " + token },
        })
        .then(() => {
          toast.success("Service updated successfully");
          fetchServices();
          modalRef.current.hide();
        })
        .catch((err) =>
          toast.error(err.response?.data?.error || "Update failed"),
        );
    } else {
      axios
        .post(API_BASE_URL + "/services", formData, {
          headers: { Authorization: "Bearer " + token },
        })
        .then(() => {
          toast.success("Service created successfully");
          fetchServices();
          modalRef.current.hide();
        })
        .catch((err) =>
          toast.error(err.response?.data?.error || "Create failed"),
        );
    }
  }

  /* ================= DELETE ================= */

  function handleDelete(id) {
    if (!canDeleteService) {
      toast.error("You don't have authority");
      return;
    }

    if (!window.confirm("Delete this service?")) return;

    const token = Cookies.get("adminToken");

    axios
      .delete(API_BASE_URL + "/services/" + id, {
        headers: { Authorization: "Bearer " + token },
      })
      .then(() => {
        toast.success("Service deleted successfully");
        fetchServices();
      })
      .catch((err) =>
        toast.error(err.response?.data?.error || "Delete failed"),
      );
  }

  /* ================= SEARCH ================= */

  const filteredServices = canSearchService
    ? services.filter((s) => {
        const nameMatch = filters.serviceSearch
          ? s.name?.toLowerCase().includes(filters.serviceSearch.toLowerCase())
          : true;

        const statusMatch = filters.status ? s.status === filters.status : true;

        const categoryMatch = filters.category
          ? s.category?.toLowerCase().includes(filters.category.toLowerCase())
          : true;

        return nameMatch && statusMatch && categoryMatch;
      })
    : services;
  /* ================= PAGINATION ================= */

  const indexOfLast = currentPage * servicesPerPage;
  const indexOfFirst = indexOfLast - servicesPerPage;

  const currentServices = filteredServices.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(filteredServices.length / servicesPerPage);

  /* ================= UI ================= */

  return (
    <section className="poppins-regular py-3">
      <div className="container">
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
            <h4 className="fw-bold mb-0">Services Management</h4>
          </div>
          <div className="col-md-2 col-5 text-end">
            <button className="btn btn-sm btn-primary" onClick={openAddModal}>
              + Add Service
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="row g-3 mb-3">
          <div className="col-md-4 col-6">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search Service"
              value={filters.serviceSearch}
              onChange={(e) => {
                if (!canSearchService) {
                  toast.error("You don't have authority");
                  return;
                }

                setFilters((prev) => ({
                  ...prev,
                  serviceSearch: e.target.value,
                }));
              }}
            />
          </div>
          <div className="col-md-4 col-6">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search Category"
              value={filters.category || ""}
              onChange={(e) => {
                if (!canSearchService) {
                  toast.error("You don't have authority");
                  return;
                }

                setFilters((prev) => ({
                  ...prev,
                  category: e.target.value,
                }));
              }}
            />
          </div>
          <div className="col-md-4 col-6">
            <select
              className="form-select form-select-sm"
              value={filters.status}
              onChange={(e) => {
                if (!canSearchService) {
                  toast.error("You don't have authority");
                  return;
                }

                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value,
                }));
              }}
            >
              <option value="">Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Applied Filters */}
        {(filters.serviceSearch || filters.status || filters.category) && (
          <div className="row g-3 mb-3">
            <div className="col-auto">
              <span className="fw-semibold">Filters applied:</span>
            </div>

            {filters.serviceSearch && (
              <div className="col-auto">
                <span className="badge bg-secondary">
                  Search: {filters.serviceSearch}
                  <i
                    className="fa fa-times ms-1"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        serviceSearch: "",
                      }))
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
                      setFilters((prev) => ({
                        ...prev,
                        status: "",
                      }))
                    }
                  ></i>
                </span>
              </div>
            )}

            {filters.category && (
              <div className="col-auto">
                <span className="badge bg-secondary">
                  Category: {filters.category}
                  <i
                    className="fa fa-times ms-1"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        category: "",
                      }))
                    }
                  ></i>
                </span>
              </div>
            )}
          </div>
        )}

        {/* TABLE */}
        <div className="card border-0 mb-3">
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <div className="table-responsive rounded">
              <table className="table table-striped table-hover align-middle mb-0 small">
                <thead className="table-dark">
                  <tr>
                    <th style={{ minWidth: "50px" }}>ID</th>
                    <th style={{ minWidth: "150px" }}>Category</th>
                    <th style={{ minWidth: "200px" }}>Service</th>
                    <th style={{ minWidth: "350px" }}>Description</th>
                    <th style={{ minWidth: "200px" }}>Price</th>
                    <th style={{ minWidth: "150px" }}>Status</th>
                    {/* <th>Date</th> */}
                    <th style={{ minWidth: "70px" }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {currentServices.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>{s.category}</td>
                      <td>{s.name}</td>

                      <td>{s.description}</td>

                      <td>₹{s.price}</td>

                      <td>
                        <span
                          className={`badge ${
                            s.status === "Active"
                              ? "bg-success"
                              : "bg-secondary"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>

                      {/* <td>
                      {dayjs(s.createdAt).format("DD MMM YYYY")}
                    </td> */}

                      <td>
                        <i
                          className="fa-solid fa-pen-to-square text-primary me-3"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleEdit(s)}
                        ></i>

                        <i
                          className="fa-solid fa-trash text-danger"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleDelete(s.id)}
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

        <div className="d-flex justify-content-between mt-3">
          <div>
            Page {currentPage} of {totalPages}
          </div>

          <div>
            <button
              className="btn btn-sm border-0"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <i className="fa fa-chevron-left"></i>
            </button>

            <button
              className="btn btn-sm border-0"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <i className="fa fa-chevron-right"></i>
            </button>
          </div>
        </div>

        {/* SERVICE MODAL */}
        <div className="modal fade" id="serviceModal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {formData.id ? "Edit Service" : "Add Service"}
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
                      Category<span className="text-danger">*</span>
                    </label>

                    <input
                      type="text"
                      name="category"
                      className="form-control form-control-sm"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted">
                      Service Name<span className="text-danger">*</span>
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
                      Description<span className="text-danger">*</span>
                    </label>
                    <textarea
                      name="description"
                      className="form-control form-control-sm"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-muted">
                      Price<span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      className="form-control form-control-sm"
                      value={formData.price}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-muted">
                      Status<span className="text-danger">*</span>
                    </label>
                    <select
                      name="status"
                      className="form-select form-select-sm"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="submit" className="btn btn-sm btn-primary">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ServicesManagement;
