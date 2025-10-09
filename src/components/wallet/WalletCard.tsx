import React, { useEffect, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, Send } from 'lucide-react';
import { walletAPI } from '../../lib/api';

interface WalletCardProps {
  userId: string;
}

export const WalletCard: React.FC<WalletCardProps> = ({ userId }) => {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');

  useEffect(() => {
    loadWallet();
  }, [userId]);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const data = await walletAPI.getBalance(userId);
      setWallet(data.wallet);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) return;

    try {
      // Simulate top-up (in production, integrate with Paystack)
      alert(`Top-up simulation: Adding GH₵${amount.toFixed(2)} to wallet`);
      setTopUpAmount('');
      setShowTopUp(false);
      loadWallet();
    } catch (error) {
      console.error('Top-up failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-12 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6" />
          <h3 className="text-lg font-semibold">Wallet Balance</h3>
        </div>
        <button
          onClick={() => setShowTopUp(true)}
          className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Top Up
        </button>
      </div>

      <div className="mb-6">
        <div className="text-3xl font-bold mb-1">
          GH₵{wallet?.balance?.toFixed(2) || '0.00'}
        </div>
        <p className="text-green-100 text-sm">Available Balance</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs text-green-100">Total Earned</span>
          </div>
          <div className="text-lg font-semibold">
            GH₵{wallet?.total_earned?.toFixed(2) || '0.00'}
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4" />
            <span className="text-xs text-green-100">Total Spent</span>
          </div>
          <div className="text-lg font-semibold">
            GH₵{wallet?.total_spent?.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>

      {showTopUp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-gray-900">
            <h3 className="text-xl font-semibold mb-4">Top Up Wallet</h3>
            <p className="text-sm text-gray-600 mb-4">
              DEV MODE: This simulates a wallet top-up. In production, integrate with Paystack.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (GH₵)
              </label>
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="1"
                step="0.01"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTopUp(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleTopUp}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                Confirm Top Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
