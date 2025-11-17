import React, { useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useUserStats } from "../../hooks/useUserStats";
import { useRealtimeBookingUpdates } from "../../hooks/useRealtimeSubscription";
import { supabase } from "../../lib/supabase";
import { EscrowStatusBadge } from "../escrow/EscrowStatusBadge";
import { ReviewModal } from "../reviews/ReviewModal";
import { UserReviews } from "../reviews/UserReviews";
import {
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Calendar,
  DollarSign,
  Tractor,
  MessageSquare,
  Check,
  X,
} from "lucide-react";

interface ProviderDashboardProps {
  onNavigate: (view: string, providerId?: string, sessionId?: string) => void;
}

type BookingSummary = {
  id: string;
  status: string;
  scheduledDate: string;
  createdAt: string;
  notes?: string | null;
  totalPrice?: number | null;
  serviceLocation?: string | null;
  farmerName: string;
  farmerId: string;
  serviceTitle: string;
  escrowStatus?: string | null;
};

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();
  const { stats, loading: statsLoading, refreshStats } = useUserStats(
    user?.id
  );
  const { bookings, loading: bookingsLoading } =
    useRealtimeBookingUpdates(user?.id ?? "");

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] =
    useState<any>(null);

  // -----------------------------
  // Pending Requests
  // -----------------------------
  const pendingRequests = useMemo<BookingSummary[]>(() => {
    if (!bookings || !user?.id) return [];

    return bookings
      .filter((booking) => booking.provider_id === user.id)
      .filter((booking) =>
        ["pending", "requested"].includes(booking.status ?? "pending")
      )
      .map((booking) => ({
        id: booking.id,
        status: booking.status,
        scheduledDate: booking.scheduled_date,
        createdAt: booking.created_at,
        notes: booking.notes,
        totalPrice: booking.total_price,
        serviceLocation: booking.service_location,
        farmerName:
          booking.farmer?.name || booking.farmer_name || "Farmer",
        farmerId: booking.farmer_id,
        serviceTitle:
          booking.service?.title ||
          booking.service_title ||
          "Requested Service",
        escrowStatus:
          booking.escrow_status ??
          booking.escrow?.status ??
          null,
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
  }, [bookings, user?.id]);

  // -----------------------------
  // Recent Bookings
  // -----------------------------
  const recentBookings = useMemo<BookingSummary[]>(() => {
    if (!bookings || !user?.id) return [];

    return bookings
      .filter((booking) => booking.provider_id === user.id)
      .map((booking) => ({
        id: booking.id,
        status: booking.status,
        scheduledDate: booking.scheduled_date,
        createdAt: booking.created_at,
        notes: booking.notes,
        totalPrice: booking.total_price,
        serviceLocation: booking.service_location,
        farmerName:
          booking.farmer?.name || booking.farmer_name || "Farmer",
        farmerId: booking.farmer_id,
        serviceTitle:
          booking.service?.title ||
          booking.service_title ||
          "Requested Service",
        escrowStatus:
          booking.escrow_status ??
          booking.escrow?.status ??
          null,
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 6);
  }, [bookings, user?.id]);

  // -----------------------------
  // Review Handler
  // -----------------------------
  const handleReviewService = (booking: BookingSummary) => {
    setSelectedBookingForReview({
      id: booking.id,
      serviceTitle: booking.serviceTitle,
      farmerName: booking.farmerName,
      providerId: user?.id,
      farmerId: booking.farmerId,
      serviceId: booking.id,
    });
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = () => {
    refreshStats();
  };

  // -----------------------------
  // Update Booking Status
  // -----------------------------
  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);

      if (error) throw error;

      refreshStats();
    } catch (error) {
      console.error("Failed to update booking status:", error);
    }
  };

  // -----------------------------
  // UI Rendering
  // -----------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Provider Dashboard
              </h1>
              <p className="text-gray-600">
                Track bookings, manage services, and respond to farmers.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowReviews(!showReviews)}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700"
              >
                {showReviews ? "Hide Reviews" : "View Reviews"}
              </button>
              <button
                onClick={() => onNavigate("provider-profile", user?.id)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Update Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Active Services */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Tractor className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Services</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? "..." : stats.servicesUsed}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? "..." : pendingRequests.length}
                </p>
              </div>
            </div>
          </div>

          {/* Completed Jobs */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Completed Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? "..." : stats.completedServices}
                </p>
              </div>
            </div>
          </div>

          {/* Total Earned */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Earned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading
                    ? "..."
                    : `₵${stats.totalSpent.toLocaleString()}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Requests + Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Incoming Requests */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Incoming Requests
              </h2>
              <p className="text-gray-600">
                Farmers who booked you will appear here.
              </p>
            </div>

            <div className="p-6">
              {bookingsLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Clock className="w-6 h-6 mr-2 animate-spin" /> Loading
                  requests…
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No pending requests
                  </h3>
                  <p className="text-gray-600">
                    New bookings will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {request.serviceTitle}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Requested by {request.farmerName}
                          </p>
                        </div>
                        {request.totalPrice ? (
                          <span className="text-lg font-bold text-green-600">
                            ₵{request.totalPrice.toFixed(2)}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>
                            {new Date(
                              request.scheduledDate
                            ).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>
                            {request.serviceLocation ||
                              "Location to be confirmed"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-gray-400" />
                          <span>
                            Received{" "}
                            {new Date(
                              request.createdAt
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {request.notes && (
                        <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                          {request.notes}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <EscrowStatusBadge
                          status={request.escrowStatus ?? "pending"}
                        />

                        <button
                          onClick={() =>
                            updateBookingStatus(request.id, "accepted")
                          }
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-2" /> Accept
                        </button>

                        <button
                          onClick={() =>
                            updateBookingStatus(request.id, "declined")
                          }
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200"
                        >
                          <X className="w-4 h-4 mr-2" /> Decline
                        </button>

                        <button
                          onClick={() =>
                            onNavigate(
                              "provider-profile",
                              request.farmerId
                            )
                          }
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" /> Message
                          farmer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Booking Activity */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Recent Booking Activity
              </h2>
              <p className="text-gray-600">
                Track how your services are performing.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {recentBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent bookings yet.
                </div>
              ) : (
                recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {booking.serviceTitle}
                        </p>
                        <p className="text-sm text-gray-600">
                          {booking.farmerName}
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "accepted"
                            ? "bg-blue-100 text-blue-700"
                            : booking.status === "declined"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {booking.status || "pending"}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(
                          booking.scheduledDate
                        ).toLocaleDateString()}
                      </span>

                      {booking.totalPrice ? (
                        <span className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />₵
                          {booking.totalPrice.toFixed(2)}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <EscrowStatusBadge
                        status={booking.escrowStatus ?? "pending"}
                      />

                      {booking.status === "completed" && (
                        <button
                          onClick={() =>
                            handleReviewService(booking)
                          }
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Rate farmer
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}

              <button
                onClick={() => onNavigate("bookings")}
                className="w-full mt-2 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100"
              >
                View all bookings
              </button>
            </div>
          </div>
        </div>

        {showReviews && (
          <div className="mt-8">
            <UserReviews userId={user?.id ?? ""} />
          </div>
        )}
      </div>

      {showReviewModal && selectedBookingForReview && (
        <ReviewModal
          booking={selectedBookingForReview}
          currentUserId={user?.id ?? ""}
          onClose={() => setShowReviewModal(false)}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
};
