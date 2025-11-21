import React, { useState } from "react";
import { ServiceListing } from "../../types/marketplace";
import { useAuth } from "../../contexts/AuthContext";
import { X, Calendar, Clock, MapPin, DollarSign } from "lucide-react";
import { EscrowPaymentButton } from "../escrow/EscrowPaymentButton";

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
  onNavigate,
}) => {
  const { user } = useAuth();

  const [bookingData, setBookingData] = useState({
    date: "",
    startTime: "",
    duration: 1,
    location: "",
    notes: "",
  });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const unitPrice = service.price ?? 0;
  const totalPrice = unitPrice * bookingData.duration;

  const handleInputChange = (field: string, value: any) => {
    setBookingData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  // Booking modal state
const [activeBookingService, setActiveBookingService] = useState<ServiceListing | null>(null);
const [isBookingOpen, setIsBookingOpen] = useState(false);

const openBookingModal = (service: ServiceListing) => {
  setActiveBookingService(service);
  setIsBookingOpen(true);
};

const closeBookingModal = () => {
  setIsBookingOpen(false);
  setActiveBookingService(null);
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user?.id) {
        alert("Please log in as a farmer to continue.");
        setLoading(false);
        return;
      }

      if (step === 1) {
        // -----------------------------
        // STEP 1: Create booking in DB via Edge Function
        // -----------------------------
        const scheduledDateTime = `${bookingData.date}T${bookingData.startTime}:00Z`;

        const payload = {
          farmer_id: user.id,
          service_id: service.id,
          provider_id: service.providerId,
          scheduled_date: scheduledDateTime,
          duration: bookingData.duration,
          total_price: totalPrice,
          service_location: bookingData.location, // ✅ matches DB + edge fn
          notes: bookingData.notes || null,
        };

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-booking`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify(payload),
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          console.error("Create booking error:", result);
          throw new Error(result.error || "Failed to create booking");
        }

        const createdBooking = result.booking;
        setBookingId(createdBooking.id);
        setStep(2); // move to payment
      } else {
        // STEP 2 fallback (normally handled after payment)
        onBookingComplete();
      }
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    alert("Payment successful! Your booking has been confirmed.");
    onBookingComplete();
  };

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error);
    alert("Payment failed. Please try again.");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 1 ? "Book Service" : "Payment & Confirmation"}
            </h2>
            <p className="text-gray-600">{service.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            /* STEP 1 — Booking Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-2">by {service.providerName}</p>

                {service.price ? (
                  <div className="flex items-center text-gray-700">
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span>
                      ₵{service.price} per {service.priceUnit ?? "session"}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    {service.pricingInfo ||
                      "Contact provider to confirm pricing."}
                  </p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={bookingData.startTime}
                  onChange={(e) =>
                    handleInputChange("startTime", e.target.value)
                  }
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Duration */}
              {service.price && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration ({service.priceUnit ?? "session"}s)
                  </label>
                  <select
                    value={bookingData.duration}
                    onChange={(e) =>
                      handleInputChange("duration", parseInt(e.target.value))
                    }
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <option key={num} value={num}>
                        {num} {service.priceUnit ?? "session"}
                        {num > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Service Location
                </label>
                <input
                  type="text"
                  value={bookingData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  placeholder="Enter your farm/service location"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={bookingData.notes}
                  onChange={(e) =>
                    handleInputChange("notes", e.target.value)
                  }
                  placeholder="Any extra details..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Price Summary */}
              {service.price ? (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Service Cost:</span>
                    <span className="text-gray-900">
                      ₵{service.price} × {bookingData.duration}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-green-600">₵{totalPrice}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    This provider has not listed a specific price. You may need
                    to confirm pricing before booking.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Continue to Payment"}
              </button>
            </form>
          ) : (
            /* STEP 2 — Payment */
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Booking Summary
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="text-gray-900">{service.title}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider:</span>
                    <span className="text-gray-900">
                      {service.providerName}
                    </span>
                  </div>

                  <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-green-600">₵{totalPrice}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {bookingId ? (
                  <>
                    <EscrowPaymentButton
                      bookingId={bookingId}
                      farmerId={user?.id || ""}
                      amount={totalPrice}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                    />

                    {service.gps_enabled && onNavigate && (
                      <button
                        onClick={() =>
                          onNavigate("live-tracking", undefined, bookingId)
                        }
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                      >
                        Track This Booking
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? "Creating Booking..." : "Continue to Payment"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
