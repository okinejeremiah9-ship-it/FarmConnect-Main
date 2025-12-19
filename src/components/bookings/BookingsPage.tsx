// src/components/bookings/BookingsPage.tsx
import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRealtimeBookingUpdates } from "../../hooks/useRealtimeSubscription";
import { bookingAPI, escrowAPI } from "../../lib/api";
import { TrackingAPI } from "../../lib/api/trackingAPI";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageCircle,
  DollarSign,
} from "lucide-react";
import { EscrowStatusBadge } from "../escrow/EscrowStatusBadge";
import { DisputeModal } from "../escrow/DisputeModal";
import { ChatWindow } from "../chat/ChatWindow";

interface BookingsPageProps {
  userId: string;
  userRole: string;
  onNavigate: (view: string, id?: string, sessionId?: string) => void;
}

export const BookingsPage: React.FC<BookingsPageProps> = ({
  userId,
  userRole,
  onNavigate,
}) => {
  const { bookings, loading } = useRealtimeBookingUpdates(userId);
  const [filter, setFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const [selectedBookingForDispute, setSelectedBookingForDispute] =
    useState<any | null>(null);

  /* ------------------------
     UPDATE BOOKING STATUS
  ------------------------- */
  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      setUpdating(bookingId);
      await bookingAPI.updateStatus(bookingId, userId, newStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update booking status");
    } finally {
      setUpdating(null);
    }
  };

  /* ------------------------
      ESCROW HANDLERS
  ------------------------- */
  const handleEscrowDeposit = async (booking: any) => {
    if (!confirm(`Deposit GH₵${booking.total_price} to escrow?`)) return;

    try {
      setUpdating(booking.id);
      await escrowAPI.deposit(booking.id, userId, booking.total_price);
      alert("Funds deposited to escrow successfully");
    } catch (error: any) {
      console.error("Deposit failed:", error);
      alert(error.message || "Failed to deposit funds");
    } finally {
      setUpdating(null);
    }
  };

  const handleEscrowRelease = async (escrowId: string) => {
    if (!confirm("Release payment to provider?")) return;

    try {
      setUpdating(escrowId);
      await escrowAPI.release(escrowId, userId);
      alert("Payment released successfully");
    } catch (error: any) {
      console.error("Release failed:", error);
      alert(error.message || "Failed to release payment");
    } finally {
      setUpdating(null);
    }
  };

  /* ------------------------
      GPS TRACKING
  ------------------------- */
  const handleStartTracking = async (booking: any) => {
    try {
      setUpdating(booking.id);

      const session = await TrackingAPI.createSession(
        booking.id,
        userId,
        booking.provider?.name || "Driver",
        booking.provider?.phone || ""
      );

      if (!session?.id)
        throw new Error("Tracking session could not be created.");

      await supabase
        .from("bookings")
        .update({ tracking_session_id: session.id })
        .eq("id", booking.id);

      sessionStorage.setItem("pending_tracking_session", session.id);
      sessionStorage.setItem("pending_tracking_type", "driver");

      onNavigate("driver-tracking", undefined, session.id);
    } catch (error: any) {
      console.error("Failed to start tracking:", error);
      alert(error.message || "Unable to start tracking session.");
    } finally {
      setUpdating(null);
    }
  };

  const handleViewTracking = async (booking: any) => {
    try {
      if (!booking.tracking_session_id) {
        alert("Tracking has not started yet.");
        return;
      }

      sessionStorage.setItem(
        "pending_tracking_session",
        booking.tracking_session_id
      );
      sessionStorage.setItem("pending_tracking_type", "live");

      onNavigate("live-tracking", undefined, booking.tracking_session_id);
    } catch (error) {
      console.error("Failed to open tracking:", error);
      alert("Unable to open live tracking view.");
    }
  };

  /* ------------------------
      FILTER BOOKINGS
  ------------------------- */
  const filteredBookings = bookings.filter(
    (b: any) => filter === "all" || b.status === filter
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <Clock className="w-12 h-12 text-green-600 mx-auto mb-4 animate-spin" />
        <p className="text-gray-600">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* FILTERS */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "pending", "accepted", "in-progress", "completed", "cancelled"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          )
        )}
      </div>

      {/* LIST */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Bookings Found
          </h3>
          <p className="text-gray-600 mb-6">
            You don't have any bookings yet.
          </p>
          {userRole === "farmer" && (
            <button
              onClick={() => onNavigate("marketplace")}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Browse Services
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking: any) => {
            const escrow = booking.escrow_wallet?.[0] || null;
            const escrowStatus = escrow?.status;

            const providerMarkedCompleted =
              booking.status === "provider_completed";

            const canFarmerApprove =
              userRole === "farmer" &&
              providerMarkedCompleted &&
              escrowStatus === "funded";

            const canFarmerDispute =
              userRole === "farmer" &&
              providerMarkedCompleted &&
              escrowStatus === "funded";

            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* LEFT SIDE DETAILS */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {booking.service?.title || "Service"}
                    </h3>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">
                          {userRole === "farmer" ? "Provider:" : "Farmer:"}
                        </span>{" "}
                        {userRole === "farmer"
                          ? booking.provider?.name
                          : booking.farmer?.name}
                      </p>
                      <p>
                        <span className="font-medium">Date:</span>{" "}
                        {new Date(
                          booking.scheduled_date
                        ).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">Location:</span>{" "}
                        {booking.service_location}
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-2">
                        Total: GH₵
                        {parseFloat(booking.total_price).toFixed(2)}
                      </p>
                    </div>

                    {escrow && (
                      <div className="mt-3">
                        <EscrowStatusBadge
                          status={escrow.status}
                          amount={parseFloat(escrow.amount)}
                        />
                      </div>
                    )}
                  </div>

                  {/* RIGHT SIDE BUTTONS */}
                  <div className="flex flex-col gap-2">
                    {/* PROVIDER - START TRACKING */}
                    {userRole === "provider" &&
                      booking.status === "in-progress" && (
                        <button
                          onClick={() => handleStartTracking(booking)}
                          disabled={updating === booking.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          Start Tracking
                        </button>
                      )}

                    {/* FARMER - VIEW TRACKING */}
                    {userRole === "farmer" &&
                      booking.tracking_session_id && (
                        <button
                          onClick={() => handleViewTracking(booking)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          View Live Tracking
                        </button>
                      )}

                    {/* FARMER - APPROVE WORK */}
                    {canFarmerApprove && (
                      <button
                        onClick={() => handleEscrowRelease(escrow.id)}
                        className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
                      >
                        Approve Work (Release Payment)
                      </button>
                    )}

                    {/* FARMER - DISPUTE BUTTON */}
                    {canFarmerDispute && (
                      <button
                        onClick={() => setSelectedBookingForDispute(booking)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        This is Not Correct (Dispute)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DISPUTE MODAL */}
      {selectedBookingForDispute && (
        <DisputeModal
          escrowId={selectedBookingForDispute.escrow_wallet?.[0]?.id}
          userId={userId}
          bookingId={selectedBookingForDispute.id}
          onClose={() => setSelectedBookingForDispute(null)}
          onSuccess={() => {
            alert("Dispute submitted.");
            setSelectedBookingForDispute(null);
          }}
        />
      )}
    </div>
  );
};
