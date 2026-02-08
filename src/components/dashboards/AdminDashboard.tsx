// ----------------------------------------------
// AdminDashboard.tsx — FIXED TABLE RENDERING
// ----------------------------------------------

import React, { useState, useEffect } from "react";
import { useUserSession } from "../../contexts/UserSessionContext";
import { adminAPI } from "../../lib/api";
import { generateCSV, generatePDF } from "../../lib/reportGenerator";
import {
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  Loader,
  RefreshCw,
  Download,
  FileText,
  Calendar
} from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const { user } = useUserSession();

  // --- State for Dashboard Data ---
  const [stats, setStats] = useState({
    activeBookings: 0,
    completedBookings: 0,
    totalRevenue: "0",
    openDisputes: 0,
    totalFarmers: 0,
    totalProviders: 0,
  });

  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- State for Reports ---
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportType, setReportType] = useState<"csv" | "pdf">("csv");

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.id) return;
    try {
      if (stats.activeBookings === 0) setLoading(true);
      else setRefreshing(true);

      const data = await adminAPI.getDashboardStats(user.id);
      if (data.success) {
        setStats(data.stats);
        setRecentBookings(data.recentBookings || []);
      }
    } catch (error) {
      console.error("❌ Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!user?.id) return;
    
    try {
      setIsGeneratingReport(true);
      const reportData = await adminAPI.getReportData("30_days"); 

      if (!reportData || reportData.length === 0) {
        alert("No data found for this period.");
        return;
      }

      const filename = `FarmConnect_Report_${new Date().toISOString().split('T')[0]}`;

      if (reportType === "csv") {
        generateCSV(reportData, filename);
      } else {
        generatePDF(reportData, "Monthly Booking Report", filename);
      }

    } catch (error) {
      console.error("Failed to generate report:", error);
      alert("Failed to generate report. Check console for details.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10 text-center">
        <Loader className="w-12 h-12 text-green-600 mx-auto mb-4 animate-spin" />
        <p className="text-gray-600">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor platform activity & disputes</p>
        </div>

        <div className="flex items-center gap-3">
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                <select 
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as "csv" | "pdf")}
                    className="text-sm border-none focus:ring-0 bg-transparent text-gray-700 font-medium cursor-pointer"
                >
                    <option value="csv">Export CSV</option>
                    <option value="pdf">Export PDF</option>
                </select>
                <div className="h-6 w-px bg-gray-300 mx-2"></div>
                <button
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition text-sm font-medium disabled:opacity-50"
                >
                    {isGeneratingReport ? (
                        <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    {isGeneratingReport ? "Generating..." : "Download"}
                </button>
            </div>

            <button
                onClick={loadDashboardData}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition shadow-sm"
            >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
            </button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium text-gray-600">Active Bookings</p>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold">{stats.activeBookings}</p>
          <p className="text-xs text-gray-500 mt-1">Currently in progress</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium text-gray-600">Completed</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold">{stats.completedBookings}</p>
          <p className="text-xs text-gray-500 mt-1">Successful bookings</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <DollarSign className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold">
            GH₵{parseFloat(stats.totalRevenue || "0").toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Escrow released</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium text-gray-600">Open Disputes</p>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold">{stats.openDisputes}</p>
          <p className="text-xs text-gray-500 mt-1">Needs attention</p>
        </div>
      </div>

      {/* RECENT BOOKINGS TABLE */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Bookings</h2>
            <button className="text-sm text-green-600 hover:text-green-700 font-medium">View All</button>
        </div>

        {recentBookings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent bookings</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-3 px-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Service</th>
                  <th className="py-3 px-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Farmer</th>
                  <th className="py-3 px-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Provider</th>
                  <th className="py-3 px-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking: any) => {
                  // SAFE DATA ACCESS: Checks both raw table name or aliased relationship
                  const serviceTitle = booking.services?.title || booking.service_title || "N/A";
                  const farmerName = booking.farmer?.name || booking.farmer_name || "N/A";
                  const providerName = booking.provider?.name || booking.provider_name || "N/A";

                  return (
                    <tr key={booking.id} className="border-b hover:bg-gray-50 transition">
                      <td className="py-3 px-2 text-sm font-medium text-gray-900">{serviceTitle}</td>
                      <td className="py-3 px-2 text-sm text-gray-600">{farmerName}</td>
                      <td className="py-3 px-2 text-sm text-gray-600">{providerName}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.status === "completed" ? "bg-green-100 text-green-800"
                            : booking.status === "in-progress" ? "bg-blue-100 text-blue-800"
                            : booking.status === "pending" ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-600">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};