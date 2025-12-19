// -------------------------------------------------------------
// FARMER DASHBOARD — RESTORED UI + CURRENT LOGIC + CONFIRMATION FLOW + TRACKING
// -------------------------------------------------------------

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useUserSession } from "../../contexts/UserSessionContext";

import { useUserStats } from "../../hooks/useUserStats";
import { useRealtimeBookingUpdates } from "../../hooks/useRealtimeSubscription";

import { ServiceMarketplace } from "../marketplace/ServiceMarketplace";
import { EscrowStatusBadge } from "../escrow/EscrowStatusBadge";
import { DisputeModal } from "../escrow/DisputeModal";
import { ReviewModal } from "../reviews/ReviewModal";

import { escrowAPI, disputeAPI, debugAPI } from "../../lib/api";
import { supabase } from "../../lib/supabase";

import {
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Calendar,
  DollarSign,
  Tractor,
  Wrench,
  MessageSquare,
  Search,
  X,
  Loader2,
} from "lucide-react";

// 🔹 NEW: Completion review modal import
import { CompletionReviewModal } from "../bookings/CompletionReviewModal";

interface FarmerDashboardProps {
  onNavigate: (view: string, providerId?: string, sessionId?: string) => void;
}

// -------------------------------------------------------------
// WRAPPER — same pattern as ProviderDashboard
// -------------------------------------------------------------
export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  onNavigate,
}) => {
  const { user, initializing } = useUserSession();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading your dashboard...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        You must be logged in.
      </div>
    );
  }

  return <FarmerDashboardInner user={user} onNavigate={onNavigate} />;
};

// -------------------------------------------------------------
// REAL FARMER DASHBOARD
// -------------------------------------------------------------
const FarmerDashboardInner: React.FC<{
  user: any;
  onNavigate: FarmerDashboardProps["onNavigate"];
}> = ({ user, onNavigate }) => {
  const { stats, loading: statsLoading, refreshStats } = useUserStats(user.id);
  const { bookings, loading: bookingsLoading } =
    useRealtimeBookingUpdates(user.id);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [currentView, setCurrentView] = useState<"dashboard" | "marketplace">(
    "dashboard"
  );

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<any>(null);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] =
    useState<any>(null);

  const [disputes, setDisputes] = useState<any[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [releasingEscrowId, setReleasingEscrowId] = useState<string | null>(
    null
  );

  // -----------------------------------------------------------
  // NEW — PAY NOW STATE + HANDLER
  // -----------------------------------------------------------
  const [payingEscrowId, setPayingEscrowId] = useState<string | null>(null);

  const handlePayNow = async (request: any) => {
    try {
      setPayingEscrowId(request.id);

      const amount = request.price || 0;

      if (!amount || amount <= 0) {
        alert("No price set on this booking; contact provider.");
        return;
      }

      const result = await escrowAPI.deposit(request.id, user.id, amount);

      if (result?.authorization_url) {
        window.location.href = result.authorization_url;
      } else {
        alert("Escrow deposit initiated. Follow further payment steps.");
      }
    } catch (err) {
      console.error("Failed to start payment:", err);
      alert("Could not start payment. Please try again.");
    } finally {
      setPayingEscrowId(null);
    }
  };

  // -----------------------------------------------------------
  // NEW — TEST ESCROW FUNDING STATE (DEBUG)
// -----------------------------------------------------------
  const [fundingTestEscrowId, setFundingTestEscrowId] = useState<string | null>(
    null
  );

  const handleTestFundEscrow = async (bookingId: string) => {
    try {
      setFundingTestEscrowId(bookingId);
      const res = await debugAPI.fundEscrow(bookingId);

      if (res?.success) {
        alert("✅ Test escrow funded. Escrow status should now show as 'funded'.");
      } else {
        alert("Failed to fund test escrow");
      }
    } catch (e: any) {
      console.error("Error funding test escrow:", e);
      alert(e?.message || "Error funding test escrow");
    } finally {
      setFundingTestEscrowId(null);
    }
  };

  // -----------------------------------------------------------
  // NEW — LIVE GPS TRACKING ENTRY POINT
  // -----------------------------------------------------------
  const openTracking = (bookingId: string) => {
    onNavigate("tracking-map", undefined, bookingId);
  };

  // -----------------------------------------------------------
  // Map raw bookings → farmer-friendly objects
  // -----------------------------------------------------------
  const farmerBookings = useMemo(() => {
    if (!user?.id) return [];

    return (bookings || [])
      .filter((booking: any) => booking.farmer_id === user.id)
      .map((booking: any) => {
        const escrowRecords = Array.isArray(booking.escrow_wallet)
          ? booking.escrow_wallet
          : booking.escrow_wallet
          ? [booking.escrow_wallet]
          : [];

        const escrowRecord = escrowRecords[0] ?? null;

        const request = {
          id: booking.id,
          farmerId: booking.farmer_id,
          farmerName: booking.farmer?.name || user.name,
          serviceId: booking.service_id,
          serviceTitle:
            booking.service?.title ||
            booking.service_title ||
            "Service Request",
          providerId: booking.provider_id,
          providerName:
            booking.provider?.name || booking.provider_name || "Provider",
          status: booking.status,
          location: booking.service_location || "Not specified",
          dateNeeded: booking.scheduled_date,
          message: booking.notes || "",
          price: Number(booking.total_price ?? 0),
          createdAt: booking.created_at,
          updatedAt: booking.updated_at,
          escrowStatus: escrowRecord?.status,
          escrowId: escrowRecord?.id,
          canReview: booking.status === "completed",

          // completion details
          completionImages: booking.completion_images ?? [],
          completionNotes: booking.completion_notes ?? null,
          completedAt: booking.completed_at ?? null,
        };

        return { booking, request, escrowRecord };
      });
  }, [bookings, user]);

  const activeRequests = useMemo(
    () =>
      farmerBookings.filter(({ request }) =>
        [
          "pending",
          "accepted",
          "in-progress",
          "requested",
          "farmer_rejected",
        ].includes(request.status ?? "pending")
      ),
    [farmerBookings]
  );

  const providerCompletedRequests = useMemo(
    () =>
      farmerBookings.filter(
        ({ request }) => request.status === "provider_completed"
      ),
    [farmerBookings]
  );

  const completedRequests = useMemo(
    () =>
      farmerBookings.filter(({ request }) => request.status === "completed"),
    [farmerBookings]
  );

  // -----------------------------------------------------------
  // Disputes loading
  // -----------------------------------------------------------
  const openDisputes = useMemo(
    () => disputes.filter((d) => d.status !== "resolved"),
    [disputes]
  );

  const loadDisputes = useCallback(async () => {
    if (!user?.id) return;
    try {
      setDisputesLoading(true);
      const data = await disputeAPI.listForUser(user.id);
      if (data.success) setDisputes(data.disputes);
    } catch (err) {
      console.error(err);
    } finally {
      setDisputesLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  // -----------------------------------------------------------
  // Review + dispute handlers
  // -----------------------------------------------------------
  const handleOpenReview = (req: any) => {
    setSelectedBookingForReview({
      id: req.id,
      serviceTitle: req.serviceTitle,
      farmerName: req.farmerName,
      providerName: req.providerName,
      providerId: req.providerId,
      farmerId: req.farmerId,
      serviceId: req.serviceId,
    });
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = () => {
    setShowReviewModal(false);
    refreshStats();
  };

  const handleOpenDispute = (escrow: any) => {
    if (!escrow) return;
    setSelectedEscrow(escrow);
    setShowDisputeModal(true);
  };

  const handleDisputeCreated = () => {
    setShowDisputeModal(false);
    setSelectedEscrow(null);
    loadDisputes();
  };

  // -----------------------------------------------------------
  // NEW — CONFIRMATION / REJECTION OF COMPLETION
  // -----------------------------------------------------------
  const [confirmingBookingId, setConfirmingBookingId] =
    useState<string | null>(null);
  const [rejectingBookingId, setRejectingBookingId] =
    useState<string | null>(null);

  const [selectedCompletionBooking, setSelectedCompletionBooking] =
    useState<any>(null);

  const handleConfirmCompletion = async (request: any) => {
    try {
      setConfirmingBookingId(request.id);

      await supabase
        .from("bookings")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      refreshStats();
    } catch (err) {
      console.error("Failed to confirm completion:", err);
      alert("Could not confirm completion. Please try again.");
    } finally {
      setConfirmingBookingId(null);
    }
  };

  const handleRejectCompletion = async (request: any) => {
    const confirmReject = window.confirm(
      "Are you sure this work is NOT correctly done? You can later raise a dispute if needed."
    );
    if (!confirmReject) return;

    try {
      setRejectingBookingId(request.id);

      await supabase
        .from("bookings")
        .update({
          status: "farmer_rejected",
        })
        .eq("id", request.id);

      refreshStats();

      // ✅ AFTER REJECTING: auto-open dispute for this booking's escrow
      const match = farmerBookings.find(
        ({ request: r }) => r.id === request.id
      );
      const escrowRecord = match?.escrowRecord;
      if (escrowRecord) {
        setSelectedEscrow(escrowRecord);
        setShowDisputeModal(true);
      }
    } catch (err) {
      console.error("Failed to reject completion:", err);
      alert("Could not reject completion. Please try again.");
    } finally {
      setRejectingBookingId(null);
    }
  };

  // -----------------------------------------------------------
  // STATS COMPUTATION
  // -----------------------------------------------------------
  const totalSpent =
    (stats as any)?.totalSpent ??
    farmerBookings.reduce(
      (sum, { request }) =>
        request.status === "completed" ? sum + (request.price || 0) : sum,
      0
    );

  const servicesUsed =
    (stats as any)?.servicesUsed ?? completedRequests.length;

  // -----------------------------------------------------------
  // MARKETPLACE VIEW
  // -----------------------------------------------------------
  if (currentView === "marketplace") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Browse Services
              </h1>
              <p className="text-gray-600">
                Find nearby mechanization and farm support services.
              </p>
            </div>
            <button
              onClick={() => setCurrentView("dashboard")}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Back to dashboard
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ServiceMarketplace
            currentUser={user}
            onBack={() => setCurrentView("dashboard")}
          />
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // MAIN DASHBOARD UI
  // -----------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top welcome bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.name}
            </h1>
            <p className="text-gray-600">
              Manage your farm services and requests
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentView("marketplace")}
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
            >
              <Search className="w-4 h-4 mr-2" />
              Browse Services
            </button>
            <button
              onClick={() => onNavigate("request-service")}
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Request Service
            </button>
          </div>
        </div>
      </div>

      {/* Inner content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ACTIVE REQUESTS */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">
              Your Service Requests
            </h2>
            <p className="text-sm text-gray-600">
              Track the status of your ongoing service requests
            </p>
          </div>

          <div className="p-6">
            {bookingsLoading ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                Loading your requests...
              </div>
            ) : activeRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Tractor className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  No active requests
                </h3>
                <p className="text-sm text-gray-600 mb-6 max-w-md">
                  Start by requesting a service for your farm.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => onNavigate("request-service")}
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Request Service
                  </button>
                  <button
                    onClick={() => setCurrentView("marketplace")}
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Browse Marketplace
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {activeRequests.map(({ request, escrowRecord }) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-xl p-4 md:p-5"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {request.serviceTitle}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Provider: {request.providerName}
                        </p>
                      </div>

                      <div className="text-right">
                        {request.price ? (
                          <p className="text-lg font-bold text-green-600">
                            ₵{request.price.toFixed(2)}
                          </p>
                        ) : null}

                        <span
                          className={`inline-flex mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            request.status === "in-progress"
                              ? "bg-blue-100 text-blue-700"
                              : request.status === "accepted"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {request.dateNeeded
                            ? new Date(request.dateNeeded).toLocaleString()
                            : "Date not set"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{request.location}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                          Requested{" "}
                          {request.createdAt
                            ? new Date(request.createdAt).toLocaleString()
                            : ""}
                        </span>
                      </div>
                    </div>

                    {request.message && (
                      <p className="mt-3 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                        {request.message}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <EscrowStatusBadge
                        status={request.escrowStatus ?? "pending"}
                      />

                      {/* CHAT */}
                      <button
                        onClick={() => onNavigate("chat", request.providerId)}
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message provider
                      </button>

                      {/* NEW: TRACK SERVICE LIVE */}
                      {request.status === "in-progress" && (
                        <button
                          onClick={() => openTracking(request.id)}
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Track Service
                        </button>
                      )}

                      {/* 🔹 NEW: TEST ESCROW FUNDING BUTTON (VISIBLE ONLY IN ACTIVE REQUESTS) */}
                      {(!request.escrowStatus ||
                        request.escrowStatus === "pending") && (
                        <button
                          onClick={() => handleTestFundEscrow(request.id)}
                          disabled={fundingTestEscrowId === request.id}
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
                        >
                          {fundingTestEscrowId === request.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Funding test escrow...
                            </>
                          ) : (
                            <>Test: Fund Escrow</>
                          )}
                        </button>
                      )}

                      {request.canReview && (
                        <button
                          onClick={() => handleOpenReview(request)}
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Rate provider
                        </button>
                      )}

                      {escrowRecord && (
                        <button
                          onClick={() => handleOpenDispute(escrowRecord)}
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100"
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Raise dispute
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PROVIDER COMPLETED JOBS — AWAITING CONFIRMATION */}
        {providerCompletedRequests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mt-10">
            <div className="px-6 py-4 border-b flex flex-col gap-1">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">
                Service Completion Pending Your Confirmation
              </h2>
              <p className="text-sm text-gray-600">
                Your provider has marked these jobs as completed. Please review
                the photos and notes, then confirm or flag any issues.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {providerCompletedRequests.map(({ request, escrowRecord }) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-xl p-4 md:p-5"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {request.serviceTitle}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Provider: {request.providerName}
                      </p>
                    </div>

                    <div className="text-right">
                      {request.price ? (
                        <p className="text-lg font-bold text-green-600">
                          ₵{request.price.toFixed(2)}
                        </p>
                      ) : null}

                      <span className="inline-flex mt-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        Awaiting your confirmation
                      </span>
                    </div>
                  </div>

                  {/* TIME + LOCATION */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        Job date{" "}
                        {request.dateNeeded
                          ? new Date(request.dateNeeded).toLocaleString()
                          : "Not set"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{request.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>
                        Requested{" "}
                        {request.createdAt
                          ? new Date(request.createdAt).toLocaleString()
                          : ""}
                      </span>
                    </div>
                  </div>

                  {/* PROVIDER NOTES */}
                  {request.completionNotes && (
                    <p className="mt-3 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                      <span className="font-semibold">Provider note: </span>
                      {request.completionNotes}
                    </p>
                  )}

                  {/* COMPLETION IMAGES */}
                  {request.completionImages &&
                    request.completionImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {request.completionImages.map(
                          (url: string, idx: number) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`Completion ${idx + 1}`}
                              className="w-24 h-24 object-cover rounded-lg border"
                            />
                          )
                        )}
                      </div>
                    )}

                  {/* ACTIONS */}
                  <div className="mt-4 flex flex-wrap gap-2 items-center">
                    <EscrowStatusBadge
                      status={request.escrowStatus ?? "pending"}
                    />

                    {/* NEW: VIEW TRACKING HISTORY */}
                    {request.status === "provider_completed" && (
                      <button
                        onClick={() => openTracking(request.id)}
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        View tracking history
                      </button>
                    )}

                    {/* REVIEW IMAGES MODAL */}
                    {request.completionImages &&
                      request.completionImages.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCompletionBooking({
                              id: request.id,
                              completion_photos: request.completionImages,
                            })
                          }
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                        >
                          Review completion
                        </button>
                      )}

                    {/* CONFIRM BUTTON */}
                    <button
                      onClick={() => handleConfirmCompletion(request)}
                      disabled={
                        confirmingBookingId === request.id ||
                        rejectingBookingId === request.id
                      }
                      className="inline-flex items-center px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      {confirmingBookingId === request.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          This is correct — confirm
                        </>
                      )}
                    </button>

                    {/* REJECT BUTTON */}
                    <button
                      onClick={() => handleRejectCompletion(request)}
                      disabled={
                        confirmingBookingId === request.id ||
                        rejectingBookingId === request.id
                      }
                      className="inline-flex items-center px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 disabled:opacity-50"
                    >
                      {rejectingBookingId === request.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          This is not correct
                        </>
                      )}
                    </button>

                    {/* DISPUTE BUTTON */}
                    {escrowRecord && (
                      <button
                        onClick={() => handleOpenDispute(escrowRecord)}
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-white border border-red-200 text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Raise dispute
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMPLETED REQUESTS */}
        {completedRequests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mt-10">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">
                Completed Jobs
              </h2>
              <p className="text-sm text-gray-600">
                Review finished work and complete payments.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {completedRequests.map(({ request, escrowRecord }) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-xl p-4 md:p-5"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {request.serviceTitle}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Provider: {request.providerName}
                      </p>
                    </div>

                    <div className="text-right">
                      {request.price ? (
                        <p className="text-lg font-bold text-green-600">
                          ₵{request.price.toFixed(2)}
                        </p>
                      ) : null}

                      <span className="inline-flex mt-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        completed
                      </span>
                    </div>
                  </div>

                  {/* TIME + LOCATION */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        Completed on{" "}
                        {request.completedAt
                          ? new Date(request.completedAt).toLocaleString()
                          : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{request.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>
                        Requested{" "}
                        {request.createdAt
                          ? new Date(request.createdAt).toLocaleString()
                          : ""}
                      </span>
                    </div>
                  </div>

                  {/* PROVIDER NOTES */}
                  {request.completionNotes && (
                    <p className="mt-3 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                      Provider note: {request.completionNotes}
                    </p>
                  )}

                  {/* COMPLETION IMAGES */}
                  {request.completionImages &&
                    request.completionImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {request.completionImages.map(
                          (url: string, idx: number) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`Completion ${idx + 1}`}
                              className="w-24 h-24 object-cover rounded-lg border"
                            />
                          )
                        )}
                      </div>
                    )}

                  {/* PAYMENT CTA */}
                  {request.status === "completed" &&
                    (!request.escrowStatus ||
                      request.escrowStatus === "pending") && (
                      <button
                        onClick={() => handlePayNow(request)}
                        disabled={payingEscrowId === request.id}
                        className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                      >
                        {payingEscrowId === request.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Starting payment…
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-4 h-4 mr-1" />
                            Pay now for completed job
                          </>
                        )}
                      </button>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}

      {/* COMPLETION REVIEW MODAL */}
      {selectedCompletionBooking && (
        <CompletionReviewModal
          booking={selectedCompletionBooking}
          onClose={() => setSelectedCompletionBooking(null)}
          onApprove={() => {
            handleConfirmCompletion(selectedCompletionBooking);
            setSelectedCompletionBooking(null);
          }}
          onReject={() => {
            handleRejectCompletion(selectedCompletionBooking);
            setSelectedCompletionBooking(null);
          }}
        />
      )}

      {/* REVIEW MODAL */}
      {showReviewModal && selectedBookingForReview && (
        <ReviewModal
          booking={selectedBookingForReview}
          currentUserId={user?.id ?? ""}
          onClose={() => setShowReviewModal(false)}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* DISPUTE MODAL */}
      {showDisputeModal && selectedEscrow && (
        <DisputeModal
          escrowId={selectedEscrow.id}
          userId={user?.id ?? ""}
          bookingId={selectedEscrow.booking_id}
          onClose={() => {
            setShowDisputeModal(false);
            setSelectedEscrow(null);
          }}
          onSuccess={handleDisputeCreated}
        />
      )}
    </div>
  );
};
