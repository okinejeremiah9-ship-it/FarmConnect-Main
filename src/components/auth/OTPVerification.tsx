import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Loader } from 'lucide-react';

interface OTPVerificationProps {
  onVerificationSuccess: () => void;
  onBack: () => void;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({ 
  onVerificationSuccess, 
  onBack 
}) => {
  const { verifyOTP, isLoading } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      await verifyOTP(otp);
      onVerificationSuccess();
    } catch (err) {
      setError('Invalid OTP. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verify Your Account
          </h2>
          <p className="text-gray-600">
            We've sent a 6-digit verification code to your email address.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
              placeholder="000000"
              maxLength={6}
              required
            />
          </div>

          <div className="text-center text-sm text-gray-500">
            {timeLeft > 0 ? (
              <p>Code expires in {formatTime(timeLeft)}</p>
            ) : (
              <p className="text-red-500">Code has expired</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || timeLeft === 0}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" />
                Verifying...
              </>
            ) : (
              'Verify Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            ← Back to Registration
          </button>
          
          <div className="text-sm text-gray-500">
            <p>Didn't receive the code?</p>
            <button className="text-green-600 hover:text-green-700 font-semibold">
              Resend Code
            </button>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600">
            <strong>Demo:</strong> Use code <span className="font-mono">123456</span> to verify
          </p>
        </div>
      </div>
    </div>
  );
};
