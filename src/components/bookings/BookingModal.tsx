import React, { useState } from 'react';
import { ServiceListing } from '../../types/marketplace';
import { useAuth } from '../../contexts/AuthContext';
import { X, Calendar, Clock, MapPin, DollarSign, CreditCard } from 'lucide-react';
import { EscrowPaymentButton } from '../escrow/EscrowPaymentButton';

interface BookingModalProps {
  service: ServiceListing;
  onClose: () => void;
  onBookingComplete: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  service,
  onClose,
  onBookingComplete,
}) => {
  const { user } = useAuth();
  const [bookingData, setBookingData] = useState({
    date: '',
    startTime: '',
    duration: 1,
    location: '',
    notes: '',
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const unitPrice = service.price ?? 0;
  const totalPrice = unitPrice * bookingData.duration;

  const handleInputChange = (field: string, value: any) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (step === 1) {
        // Create actual booking record
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-booking`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            farmer_id: user?.id,
            service_id: service.id,
            provider_id: service.providerId,
            scheduled_date: `${bookingData.date}T${bookingData.startTime}:00Z`,
            duration: bookingData.duration,
            total_price: totalPrice,
            service_location: bookingData.location,
            notes: bookingData.notes,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create booking');
        }

        setBookingId(data.booking_id);
        setStep(2);
      } else {
        // Complete booking
        onBookingComplete();
      }
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    onBookingComplete();
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // Handle payment error
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 1 ? 'Book Service' : 'Payment & Confirmation'}
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
            /* Step 1: Booking Details */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-2">by {service.providerName}</p>
                {service.price ? (
                  <div className="flex items-center text-gray-700">
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span>₵{service.price} per {service.priceUnit ?? 'session'}</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">{service.pricingInfo || 'Contact provider to confirm pricing.'}</p>
                )}
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={bookingData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Duration */}
              {service.price && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration ({service.priceUnit ?? 'session'}s)
                  </label>
                  <select
                    value={bookingData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                      <option key={num} value={num}>
                        {num} {service.priceUnit ?? 'session'}{num > 1 ? 's' : ''}
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
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter your farm/service location"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any specific requirements or instructions..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Price Summary */}
              {service.price ? (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Service Cost:</span>
                    <span className="text-gray-900">₵{service.price} × {bookingData.duration}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-green-600">₵{totalPrice}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    This provider has not shared standard pricing. Please contact them directly to confirm rates before booking.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Continue to Payment'}
              </button>
            </form>
          ) : (
            /* Step 2: Payment */
            <div className="space-y-6">
              {/* Booking Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="text-gray-900">{service.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider:</span>
                    <span className="text-gray-900">{service.providerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="text-gray-900">{new Date(bookingData.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="text-gray-900">{bookingData.startTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="text-gray-900">{bookingData.duration} {service.priceUnit ?? 'session'}(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="text-gray-900">{bookingData.location}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-green-600">₵{totalPrice}</span>
                  </div>
                </div>
              </div>

              {/* Escrow Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Secure Escrow Payment</h3>
                <p className="text-blue-800 text-sm">
                  Your payment will be held securely in escrow until the service is completed. 
                  The provider will only receive payment after you confirm satisfaction with the service.
                </p>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <CreditCard className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="font-medium text-gray-900">Mobile Money / Card Payment</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Secure payment via Paystack. Supports MTN Mobile Money, Vodafone Cash, AirtelTigo Money, and all major cards.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                <div className="flex-1">
                  {bookingId ? (
                    <EscrowPaymentButton
                      bookingId={bookingId}
                      farmerId={user?.id || ''}
                      amount={totalPrice}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                    />
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Creating Booking...' : 'Continue to Payment'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};