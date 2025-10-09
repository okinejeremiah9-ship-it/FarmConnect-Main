import React from 'react';
import { WalletCard } from './WalletCard';
import { Info } from 'lucide-react';

interface WalletPageProps {
  userId: string;
}

export const WalletPage: React.FC<WalletPageProps> = ({ userId }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <WalletCard userId={userId} />

      {/* Dev Mode Notice */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-2">Development Mode</h3>
            <p className="text-sm text-yellow-800 mb-3">
              This is a simulated wallet for development and testing. In production, this will integrate with Paystack for real payments.
            </p>
            <div className="space-y-2 text-sm text-yellow-700">
              <p><strong>How it works:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Top-up: Simulates adding funds to your wallet</li>
                <li>Escrow Deposit: Deducts from wallet balance</li>
                <li>Escrow Release: Adds to provider's wallet</li>
                <li>All transactions are tracked in the database</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Production Setup Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">For Production Deployment</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>To enable real payments with Paystack:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Get your Paystack API keys from dashboard.paystack.com</li>
            <li>Add keys to environment variables (PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY)</li>
            <li>Set USE_WALLET_SIMULATION = false in escrow-deposit edge function</li>
            <li>Configure webhook URL for payment verification</li>
            <li>Test with Paystack test cards before going live</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
