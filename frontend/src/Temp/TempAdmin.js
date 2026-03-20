import React, { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Toast from "../components/Toast";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AdminLogin({ setAuth }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const inputRefs = useRef([]);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (otpSent) inputRefs.current[0]?.focus();
  }, [otpSent]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!/^\d{10}$/.test(phoneNumber)) {
      toast.error("Phone number must be 10 digits");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/send-otp`, {
        phone: phoneNumber,
      });

      if (response.data.status) {
        setOtpSent(true);
        toast.success("OTP sent successfully!");
      } else {
        toast.error(response.data.error || "Failed to send OTP");
      }
    } catch (err) {
      toast.error("Only active Admins can log in");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");

    if (!/^\d{6}$/.test(enteredOtp)) {
      toast.error("OTP must be 6 digits");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/verify-otp`, {
        phone: phoneNumber,
        otp: enteredOtp,
      });

      if (response.data.status) {
        // Save JWT only
        Cookies.set("adminToken", response.data.token, { expires: 7 });

        toast.success("Logged in Successfully!");
        if (setAuth) setAuth(true);
        setTimeout(() => navigate("/dashboard"), 800);
      } else {
        toast.error(response.data.error || "Invalid OTP");
      }
    } catch (err) {
      toast.error("Error verifying OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (element, index) => {
    const value = element.value.replace(/[^0-9]/g, "");
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      if (!otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };

  const handlePaste = (e) => {
    const pasteData = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, 6);

    if (pasteData.length === 6) {
      setOtp(pasteData.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  return (
    <div className="container bg-light d-flex align-items-center justify-content-center min-vh-100">
      <div className="row w-100 justify-content-center">
        <div className="col-12 col-sm-8 col-lg-5">
          <div className="card shadow-lg border-0 rounded">
            <div className="card-body p-lg-5">
              <div className="text-center mb-4">
                <img
                  src="logo.png"
                  alt="Logo"
                  className="img-fluid mb-4"
                  style={{ maxWidth: "220px" }}
                />
                <h4 className="fw-bold text-dark">
                  {otpSent ? "Verify OTP" : "Admin Login"}
                </h4>
                <p className="text-muted small">
                  {otpSent
                    ? "Enter the 6-digit code sent to your phone"
                    : "Login using your registered mobile number"}
                </p>
              </div>

              {!otpSent ? (
                <form onSubmit={handleSendOtp}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Phone Number
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">+91</span>
                      <input
                        type="text"
                        className="form-control"
                        value={phoneNumber}
                        onChange={(e) =>
                          setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))
                        }
                        placeholder="Enter 10-digit number"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success w-100 fw-semibold"
                    disabled={loading}
                  >
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp}>
                  <div className="mb-4">
                    <label className="form-label fw-semibold d-block mb-3">
                      Enter OTP
                    </label>

                    <div
                      className="d-flex justify-content-between gap-2"
                      onPaste={handlePaste}
                    >
                      {otp.map((data, index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength="1"
                          className="form-control text-center fs-4"
                          style={{ width: "45px", height: "55px" }}
                          value={data}
                          onChange={(e) => handleChange(e.target, index)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          ref={(el) => (inputRefs.current[index] = el)}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success w-100 fw-semibold"
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>

                  <div className="text-center mt-3">
                    <span className="text-muted small">
                      Didn’t receive OTP?{" "}
                    </span>
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-decoration-none"
                      onClick={handleSendOtp}
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <p className="text-center text-muted small mt-3 mb-0">
            © {new Date().getFullYear()} EquityPandit Advisor
          </p>
        </div>
      </div>

      <Toast />
    </div>
  );
}

export default AdminLogin;
