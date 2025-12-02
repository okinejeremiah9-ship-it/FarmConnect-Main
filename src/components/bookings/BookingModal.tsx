// BookingModal.tsx — Updated for service type, day-based duration & direct Supabase insert (NO edge functions)

import React, { useState, useEffect } from "react";
import { ServiceListing } from "../../types/marketplace";
import { useUserSession } from "../../contexts/UserSessionContext";
import { X, Calendar, Clock, MapPin } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface BookingModalProps {
  service: ServiceListing;
  onClose: () => void;
  onBookingComplete: () => void;
  onNavigate?: (view: string, providerId?: string, sessionId?: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  service,
  onClose,
  onBookingComplete,
}) => {
  const { user } = useUserSession();
  const [sessionChecked, setSessionChecked] = useState(false);

  // 🚨 Ensure user session is valid
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Your session expired. Please log in again.");
        onClose();
        return;
      }

      setSessionChecked(true);
    };

    checkAuth();
  }, [onClose]);

  // -------------------------------
  // Form state
  // -------------------------------
  const [bookingData, setBookingData] = useState({
    date: "",
    startTime: "",
    durationDays: 1,
    location: "",
    notes: "",
    serviceCategory: "",
  });

  const [loading, setLoading] = useState(false);

  const categoryOptions: string[] =
    service.specializations && service.specializations.length > 0
      ? service.specializations
      : service.category
      ? [service.category]
      : [];

  const unitPrice = service.price ?? 0;
  const totalPrice = unitPrice * (bookingData.durationDays || 1);

  const handleInputChange = (field: string, value: any) => {
    setBookingData((prev) => ({ ...prev, [field]: value }));
  };

  // ⭐⭐⭐ NEW: DIRECT SUPABASE INSERT (Fix for RLS issue)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user?.id) {
        alert("Please log in before booking.");
        return;
      }

      if (!bookingData.serviceCategory) {
        alert("Please select the type of service you want from this provider.");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("You must be logged in.");
      }

      const scheduledDateTime = `${bookingData.date}T${bookingData.startTime}:00Z`;

      const combinedNotes = `Service type: ${bookingData.serviceCategory}\n${
        bookingData.notes || ""
      }`.trim();

      // ⭐⭐⭐ FINAL FIX → DIRECT insert into bookings
      const { data, error } = await supabase
        .from("bookings")
        .insert([
          {
            farmer_id: user.id,
            provider_id: service.providerId,
            service_id: service.id,
            scheduled_date: scheduledDateTime,
            duration: bookingData.durationDays,
            total_price: totalPrice,
            service_location: bookingData.location,
            notes: combinedNotes,
            service_category: bookingData.serviceCategory,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Create booking error:", error);
        throw new Error(error.message || "Failed to create booking");
      }

      alert("Booking request sent to the provider.");
      onBookingComplete();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Booking failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!sessionChecked) return null;

  const durationOptions = [1, 2, 3, 5, 7, 10, 14];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Book Service</h2>
            <p className="text-sm text-gray-600">
              {service.title} •{" "}
              <span className="font-medium">
                {service.providerName || "Service Provider"}
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 rounded-full p-1 hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Form */}
            <div className="md:col-span-3 space-y-5">
              {/* SERVICE TYPE */}
              {categoryOptions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Service Type from this Provider
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Choose which type of work you want this provider to do.
                  </p>
                  <select
                    value={bookingData.serviceCategory}
                    onChange={(e) =>
                      handleInputChange("serviceCategory", e.target.value)
                    }
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Select service type…</option>
                    {categoryOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* DATE */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Preferred Date
                </label>
                <input
                  type="date"
                  required
                  value={bookingData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* TIME */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={bookingData.startTime}
                  onChange={(e) =>
                    handleInputChange("startTime", e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* DURATION */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Number of Days
                </label>
                <select
                  value={bookingData.durationDays}
                  onChange={(e) =>
                    handleInputChange("durationDays", Number(e.target.value))
                  }
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {durationOptions.map((d) => (
                    <option key={d} value={d}>
                      {d} {d === 1 ? "day" : "days"}
                    </option>
                  ))}
                </select>
              </div>

              {/* LOCATION */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Service Location
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ejura farm, near main road…"
                  value={bookingData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* NOTES */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Notes for Provider (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your field size, crop type, or instructions…"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={bookingData.notes}
                  onChange={(e) =>
                    handleInputChange("notes", e.target.value)
                  }
                ></textarea>
              </div>
            </div>

            {/* Summary */}
            <div className="md:col-span-2">
              <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Booking Summary
                </h3>

                <div className="text-xs text-gray-700 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Provider</span>
                    <span className="font-medium">
                      {service.providerName || "Service Provider"}
                    </span>
                  </div>

                  {bookingData.serviceCategory && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Service type</span>
                      <span className="font-medium">
                        {bookingData.serviceCategory}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-500">Price per day</span>
                    <span className="font-medium">
                      {unitPrice > 0 ? `₵${unitPrice.toFixed(2)}` : "Not set"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-medium">
                      {bookingData.durationDays}{" "}
                      {bookingData.durationDays === 1 ? "day" : "days"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Estimated total</span>
                    <span className="font-semibold text-green-700">
                      {unitPrice > 0
                        ? `₵${totalPrice.toFixed(2)}`
                        : "TBD with provider"}
                    </span>
                  </div>

                  {bookingData.date && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date</span>
                      <span className="font-medium">{bookingData.date}</span>
                    </div>
                  )}

                  {bookingData.startTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Start time</span>
                      <span className="font-medium">
                        {bookingData.startTime}
                      </span>
                    </div>
                  )}

                  {bookingData.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location</span>
                      <span className="font-medium text-right max-w-[140px]">
                        {bookingData.location}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-gray-500 mt-2">
                  <span className="font-semibold">Note:</span> Payment will be
                  completed <strong>AFTER</strong> the job is done, through the
                  FarmConnect escrow system. Providers may accept or decline
                  your request.
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="mt-4 w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Sending booking request…" : "Book Service"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
