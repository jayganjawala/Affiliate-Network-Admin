import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import Toast from "../components/Toast";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5002/api";

function MyProfile() {
  const navigate = useNavigate();
  const token = Cookies.get("adminToken");

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    commission: "",
    totalBalance: "",
    organization: { name: "", address: "", phone: "", email: "" },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        navigate("/");
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/myprofile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const data = response.data.profile;

          setProfile({
            name: data.personalInformation.fullName || "",
            email: data.personalInformation.email || "",
            phone: data.personalInformation.phone || "",
            commission: data.personalInformation.commission || "Not Specified",
            totalBalance: data.personalInformation.totalBalance || 0,
            organization: {
              name: data.organization.name || "",
              address: data.organization.address || "",
              phone: data.organization.phone || "",
              email: data.organization.email || "",
            },
          });
        } else {
          toast.error(response.data.error || "Failed to fetch profile");
        }
      } catch (err) {
        console.error("API Error:", err);
        toast.error("Failed to fetch profile from server");
      }
    };

    fetchProfile();
  }, [token, navigate]);

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
          <h4 className="fw-bold mb-0">My Profile</h4>
        </div>
      </div>

      <div className="p-3 rounded bg-body border-start border-5 border-success border-opacity-50 mb-3">
        <h5 className="fw-semibold mb-3">
          <i className="fa-solid fa-circle-user"></i> Personal Information
        </h5>

        <div className="row g-3">
          <div className="col-md-4">
            <small className="text-muted">
              <i className="fa-solid fa-user text-secondary"></i> Name
            </small>
            <h6>{profile.name}</h6>
          </div>

          <div className="col-md-4">
            <small className="text-muted">
              <i className="fa-solid fa-envelope text-warning"></i> Email
            </small>
            <h6>{profile.email}</h6>
          </div>

          <div className="col-md-4">
            <small className="text-muted">
              <i className="fa-solid fa-phone text-success"></i> Phone
            </small>
            <h6>{profile.phone}</h6>
          </div>
        </div>
      </div>

      <div className="p-3 rounded bg-body border-start border-5 border-warning border-opacity-50 mb-3">
        <h5 className="fw-semibold mb-3">
          <i className="fa-solid fa-building"></i> Organization
        </h5>

        <div className="row g-3">
          <div className="col-md-6">
            <small className="text-muted">
              <i className="fa-solid fa-user text-secondary"></i> Name
            </small>
            <h6>{profile.organization.name}</h6>
          </div>

          <div className="col-md-6">
            <small className="text-muted">
              <i className="fa-solid fa-phone text-success"></i> Phone
            </small>
            <h6>{profile.organization.phone}</h6>
          </div>

          <div className="col-md-6">
            <small className="text-muted">
              <i className="fa-solid fa-envelope text-warning"></i> Email
            </small>
            <h6>{profile.organization.email}</h6>
          </div>

          <div className="col-md-6">
            <small className="text-muted">
              <i className="fa-solid fa-location-dot text-danger"></i>Address
            </small>
            <h6>{profile.organization.address}</h6>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyProfile;
