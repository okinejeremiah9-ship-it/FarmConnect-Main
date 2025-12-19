// ----------------------------------------------
// AdminDashboard.tsx — FULLY UPDATED + FIXED
// ----------------------------------------------

import React, { useState, useEffect } from "react";
import { useUserSession } from "../../contexts/UserSessionContext";
import { adminAPI } from "../../lib/api";

import {
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  Loader,
  RefreshCw,
} from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const { user } = useUserSession();

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor platform activity & disputes</p>
        </div>

        <button
          onClick={loadDashboardData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* ACTIVE BOOKINGS */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium text-gray-600">Active Bookings</p>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold">{stats.activeBookings}</p>
          <p className="text-xs text-gray-500 mt-1">Currently in progress</p>
        </div>

        {/* COMPLETED BOOKINGS */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium text-gray-600">Completed</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold">{stats.completedBookings}</p>
          <p className="text-xs text-gray-500 mt-1">Successful bookings</p>
        </div>

        {/* REVENUE */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <DollarSign className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold">
            GH₵{parseFloat(stats.totalRevenue || "0").toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Escrow released</p>
        </div>

        {/* OPEN DISPUTES */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium text-gray-600">Open Disputes</p>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold">{stats.openDisputes}</p>
          <p className="text-xs text-gray-500 mt-1">Needs attention</p>
        </div>
      </div>

      {/* USERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold">Platform Users</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Farmers</span>
              <span className="text-xl font-bold">{stats.totalFarmers}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Total Providers</span>
              <span className="text-xl font-bold">{stats.totalProviders}</span>
            </div>

            <div className="flex justify-between border-t pt-3">
              <span className="text-gray-900 font-medium">Total Users</span>
              <span className="text-2xl font-bold text-green-600">
                {stats.totalFarmers + stats.totalProviders}
              </span>
            </div>
          </div>
        </div>

        {/* LIVE UPDATES */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold">Live Updates</h2>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            Auto-refresh every 30 seconds
          </p>

          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
            Last update: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* RECENT BOOKINGS */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Bookings</h2>

        {recentBookings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent bookings</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left text-sm text-gray-600">Service</th>
                  <th className="py-2 text-left text-sm text-gray-600">Farmer</th>
                  <th className="py-2 text-left text-sm text-gray-600">Provider</th>
                  <th className="py-2 text-left text-sm text-gray-600">Status</th>
                  <th className="py-2 text-left text-sm text-gray-600">Date</th>
                </tr>
              </thead>

              <tbody>
                {recentBookings.map((booking: any) => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">{booking.services?.title || "N/A"}</td>
                    <td className="py-3">{booking.farmer?.name || "N/A"}</td>
                    <td className="py-3">{booking.provider?.name || "N/A"}</td>

                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "in-progress"
                            ? "bg-blue-100 text-blue-800"
                            : booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>

                    <td className="py-3 text-gray-600">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
