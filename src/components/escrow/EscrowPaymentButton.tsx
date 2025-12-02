import React, { useState } from 'react';
import { Shield, Loader, CreditCard } from 'lucide-react';

interface EscrowPaymentButtonProps {
  bookingId: string;
  farmerId: string;
  amount: number;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

export const EscrowPaymentButton: React.FC<EscrowPaymentButtonProps> = ({
  bookingId,
  farmerId,
  amount,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // Call escrow deposit function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/escrow-deposit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId,
          farmer_id: farmerId,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      // Redirect to Paystack checkout
      window.location.href = data.payment_url;
      
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
    >
      {loading ? (
        <>
          <Loader className="animate-spin h-5 w-5 mr-2" />
          Initializing Payment...
        </>
      ) : (
        <>
          <Shield className="h-5 w-5 mr-2" />
          Pay with Escrow (₵{amount})
        </>
      )}
    </button>
  );
};
