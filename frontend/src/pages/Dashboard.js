import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const commonGrid = {
  grid: { display: false, drawBorder: false },
  ticks: { font: { size: 11 } },
};

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5002/api";

function Dashboard() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [summaryCards, setSummaryCards] = useState({
    totalUsers: 0,
    totalClient: 0,
    totalRevenue: 0,
    totalSupportTickets: 0,
  });

  const [leadsData, setLeadsData] = useState({});
  const [paymentsData, setPaymentsData] = useState({});
  const [clientDataByYear, setClientDataByYear] = useState({});

  const [leadYear, setLeadYear] = useState(currentYear);
  const [paymentsYear, setPaymentsYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState("all");

  useEffect(() => {
    const token = Cookies.get("adminToken");
    if (!token) {
      navigate("/");
      return;
    }

    const fetchSupports = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/supports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setSummaryCards((prev) => ({
            ...prev,
            totalSupportTickets: res.data.toatlPendingCount || 0,
          }));
        }
      } catch (err) {
        toast.error(err.response?.data?.error || "Error fetching supports");
      }
    };

    const fetchPayments = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/payments`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          const paymentAgg = {};

          res.data.data.forEach((p) => {
            const dateObj = dayjs(p.paymentDate);
            const year = dateObj.year();
            const month = dateObj.month() + 1;
            const day = dateObj.date();

            if (!paymentAgg[year]) paymentAgg[year] = {};
            if (!paymentAgg[year][month]) {
              paymentAgg[year][month] = {
                payments: 0,
                dates: {},
              };
            }

            paymentAgg[year][month].payments += Number(p.paidAmount);

            if (!paymentAgg[year][month].dates[day]) {
              paymentAgg[year][month].dates[day] = 0;
            }

            paymentAgg[year][month].dates[day] += Number(p.paidAmount);
          });

          setPaymentsData(paymentAgg);

          setSummaryCards((prev) => ({
            ...prev,
            totalRevenue: res.data.totalPaidAmount || 0,
          }));
        }
      } catch (err) {
        toast.error(err.response?.data?.error || "Error fetching payments");
      } finally {
        fetchSupports();
      }
    };

    const fetchLeads = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/leadhistory`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          const leads = res.data.data;

          setSummaryCards((prev) => ({
            ...prev,
            totalUsers: res.data.totalApprovedCount || 0,
            totalClient: res.data.totalClientsCount || 0,
          }));

          const leadAgg = {};
          const clientAgg = {};

          leads.forEach((lead) => {
            const dateObj = dayjs(lead.createdAt);
            const month = dateObj.month() + 1;
            const year = dateObj.year();
            const day = dateObj.date();

            // Lead aggregation
            if (!leadAgg[year]) leadAgg[year] = {};
            if (!leadAgg[year][month]) {
              leadAgg[year][month] = {
                total: 0,
                approved: 0,
                duplicate: 0,
              };
            }

            leadAgg[year][month].total += 1;

            if (lead.leadType === "Approved")
              leadAgg[year][month].approved += 1;

            if (lead.leadType === "Duplicate")
              leadAgg[year][month].duplicate += 1;

            // Client aggregation (MONTH + DATE wise)
            if (lead.status === "Client") {
              if (!clientAgg[year]) clientAgg[year] = {};
              if (!clientAgg[year][month]) {
                clientAgg[year][month] = {
                  total: 0,
                  dates: {},
                };
              }

              // Monthly total
              clientAgg[year][month].total += 1;

              // Date-wise total
              if (!clientAgg[year][month].dates[day]) {
                clientAgg[year][month].dates[day] = 0;
              }

              clientAgg[year][month].dates[day] += 1;
            }
          });

          setLeadsData(leadAgg);
          setClientDataByYear(clientAgg);
        }
      } catch (err) {
        toast.error(err.response?.data?.error || "Error fetching leads");
      } finally {
        fetchPayments();
      }
    };

    fetchLeads();
  }, [navigate]);

  /* ================= LEADS CHART ================= */

  const leadYearData = leadsData[leadYear] || {};
  const leadMonths = Object.keys(leadYearData)
    .map(Number)
    .sort((a, b) => a - b);

  const leadLabels = leadMonths.map((m) =>
    dayjs(`${leadYear}-${m}-01`).format("MMM"),
  );

  const leadStatusData = {
    labels: leadLabels,
    datasets: [
      {
        label: "Total Leads",
        data: leadMonths.map((m) => leadYearData[m].total),
        backgroundColor: "#0d6efd65",
        borderRadius: 8,
      },
      {
        label: "Approved Leads",
        data: leadMonths.map((m) => leadYearData[m].approved),
        backgroundColor: "#19875475",
        borderRadius: 8,
      },
      {
        label: "Duplicate Leads",
        data: leadMonths.map((m) => leadYearData[m].duplicate),
        backgroundColor: "#dc354575",
        borderRadius: 8,
      },
    ],
  };

  const leadStatusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
    scales: { x: { ...commonGrid }, y: { beginAtZero: true, ...commonGrid } },
  };

  const goToPreviousLeadYear = () => {
    setLeadYear((prev) => prev - 1);
  };

  const goToNextLeadYear = () => {
    setLeadYear((prev) => prev + 1);
  };

  /* ================= PAYMENTS CHART ================= */

  const paymentsYearData = paymentsData[paymentsYear] || {};
  const clientYearData = clientDataByYear[paymentsYear] || {};

  const paymentMonths = Object.keys(paymentsYearData)
    .map(Number)
    .sort((a, b) => a - b);

  let paymentLabels = [];
  let paymentData = [];
  let clientData = [];

  if (selectedMonth === "all") {
    paymentLabels = paymentMonths.map((m) =>
      dayjs(`${paymentsYear}-${m}-01`).format("MMM YYYY"),
    );

    paymentData = paymentMonths.map((m) => paymentsYearData[m]?.payments || 0);

    clientData = paymentMonths.map((m) => clientYearData[m]?.total || 0);
  } else {
    const month = Number(selectedMonth);

    const paymentDateWiseData = paymentsYearData[month]?.dates || {};

    const clientDateWiseData = clientYearData[month]?.dates || {};

    // 🔥 Merge both date keys
    const allDaysSet = new Set([
      ...Object.keys(paymentDateWiseData),
      ...Object.keys(clientDateWiseData),
    ]);

    const sortedDays = Array.from(allDaysSet)
      .map(Number)
      .sort((a, b) => a - b);

    paymentLabels = sortedDays.map((day) =>
      dayjs(`${paymentsYear}-${month}-${day}`).format("DD MMM"),
    );

    paymentData = sortedDays.map((day) => paymentDateWiseData[day] || 0);

    clientData = sortedDays.map((day) => clientDateWiseData[day] || 0);
  }

  const mergedChartData = {
    labels: paymentLabels,
    datasets: [
      {
        label: "Clients Converted",
        data: clientData,
        backgroundColor: "#0d6efd65",
        yAxisID: "yClients",
        borderRadius: 8,
      },
      {
        label: "Payments (₹)",
        data: paymentData,
        backgroundColor: "#19875475",
        yAxisID: "yAmount",
        borderRadius: 8,
      },
    ],
  };

  const mergedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
    scales: {
      x: { ...commonGrid },
      yClients: {
        type: "linear",
        position: "left",
        beginAtZero: true,
        ...commonGrid,
      },
      yAmount: {
        type: "linear",
        position: "right",
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: {
          // callback: (v) => (v === 0 ? "0" : `₹${v / 1000}k`),
          callback: (v) => {
            if (v === 0) return "0";

            if (v < 100000) {
              return `₹${(v / 1000).toFixed(0)}k`;
            }

            return `₹${(v / 100000).toFixed(0)}L`;
          },

          stepSize: 5000000,
        },
      },
    },
  };

  return (
    <section className="poppins-regular py-3">
      <div className="container">
        {/* Header */}
        <div className="row">
          <div className="col-md-12 col-12">
            <h4 className="fw-bold fs-3">Welcome</h4>
          </div>
          <div className="col-md-12 col-12 pt-2">
            <small>
              Last Updated: {dayjs(new Date()).format("DD MMM YYYY, hh:mm A")}
            </small>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row g-3 pt-1">
          <div className="col-md-3 col-6">
            <div className="p-3 rounded bg-body border-start border-5 border-primary border-opacity-25">
              <small>
                <i className="fas fa-users"></i> Total Users
              </small>
              <h5>{summaryCards.totalUsers}</h5>
            </div>
          </div>

          <div className="col-md-3 col-6">
            <div className="p-3 rounded bg-body border-start border-5 border-success border-opacity-25">
              <small>
                <i className="fas fa-user-plus"></i> Total Client
              </small>
              <h5>{summaryCards.totalClient}</h5>
            </div>
          </div>

          <div className="col-md-3 col-6">
            <div className="p-3 rounded bg-body border-start border-5 border-warning border-opacity-25">
              <small>
                <i className="fas fa-indian-rupee-sign"></i> Total Revenue
              </small>
              <h5>{summaryCards.totalRevenue.toLocaleString("en-IN")}</h5>
            </div>
          </div>

          <div className="col-md-3 col-6">
            <div className="p-3 rounded bg-body border-start border-5 border-danger border-opacity-25">
              <small>
                <i className="fas fa-headset"></i> Support Tickets
              </small>
              <h5>{summaryCards.totalSupportTickets}</h5>
            </div>
          </div>
        </div>

        <div className="row pt-3 g-3">
          {/* Lead Chart */}
          <div className="col-lg-6 col-12">
            <div className="border rounded p-3 bg-body h-100 d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold mb-0">
                  <i className="fas fa-chart-column"></i> Leads ({leadYear})
                </h6>
                <div>
                  <button
                    className="btn btn-outline-secondary border-0 btn-sm"
                    onClick={goToPreviousLeadYear}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <button
                    className="btn btn-outline-secondary border-0 btn-sm ms-1"
                    onClick={goToNextLeadYear}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
              <div style={{ flex: 1, minHeight: "300px" }}>
                <Bar data={leadStatusData} options={leadStatusOptions} />
              </div>
            </div>
          </div>

          {/* Payments Chart */}
          <div className="col-lg-6 col-12">
            <div className="border rounded p-3 bg-body h-100 d-flex flex-column">
              <div className="row g-3 align-items-center mb-2">
                <div className="col-lg-6 col-12">
                  <h6 className="fw-bold mb-0">
                    <i className="fas fa-money-bill-trend-up"></i> Payments
                    Overview ({paymentsYear})
                  </h6>
                </div>

                <div className="col-lg-6 col-12">
                  <div className="row g-2">
                    <div className="col-6">
                      <select
                        className="form-select form-select-sm"
                        value={paymentsYear}
                        onChange={(e) =>
                          setPaymentsYear(Number(e.target.value))
                        }
                      >
                        {Object.keys(paymentsData).map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-6">
                      <select
                        className="form-select form-select-sm"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                      >
                        <option value="all">All Months</option>
                        {paymentMonths.map((month) => (
                          <option key={month} value={month}>
                            {dayjs(`${paymentsYear}-${month}-01`).format("MMM")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, minHeight: "300px" }}>
                {paymentLabels.length ? (
                  <Bar data={mergedChartData} options={mergedChartOptions} />
                ) : (
                  <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
