import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI, disputeAPI } from '../../lib/api';
import {
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  Shield,
  Loader,
  RefreshCw
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeBookings: 0,
    completedBookings: 0,
    totalRevenue: '0',
    openDisputes: 0,
    totalFarmers: 0,
    totalProviders: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      if (stats.activeBookings === 0) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const data = await adminAPI.getDashboardStats(user.id);

      if (data.success) {
        setStats(data.stats);
        setRecentBookings(data.recentBookings || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Loader className="w-12 h-12 text-green-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor platform activity and manage disputes</p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Active Bookings</p>
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activeBookings}</p>
          <p className="text-xs text-gray-500 mt-1">Currently in progress</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Completed</p>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.completedBookings}</p>
          <p className="text-xs text-gray-500 mt-1">Successfully finished</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <DollarSign className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            GH₵{parseFloat(stats.totalRevenue || '0').toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Released escrow total</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Open Disputes</p>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.openDisputes}</p>
          <p className="text-xs text-gray-500 mt-1">Requiring resolution</p>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-6 w-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Platform Users</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Farmers</span>
              <span className="text-xl font-bold text-gray-900">{stats.totalFarmers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Providers</span>
              <span className="text-xl font-bold text-gray-900">{stats.totalProviders}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-gray-900 font-medium">Total Users</span>
              <span className="text-2xl font-bold text-green-600">
                {stats.totalFarmers + stats.totalProviders}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Live Updates</h2>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Dashboard refreshes automatically every 30 seconds
          </p>
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
            Last update: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h2>
        {recentBookings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent bookings</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Service</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Farmer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Provider</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking: any) => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{booking.services?.title || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm">{booking.farmer?.name || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm">{booking.provider?.name || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-800'
                            : booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
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
