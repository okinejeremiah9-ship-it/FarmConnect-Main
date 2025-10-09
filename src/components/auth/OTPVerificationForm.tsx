import React, { useState, useEffect } from 'react';
import { Shield, Loader, RefreshCw, ArrowLeft } from 'lucide-react';

interface OTPVerificationFormProps {
  phone: string;
  onVerificationSuccess: (user: any) => void;
  onBack: () => void;
}

export const OTPVerificationForm: React.FC<OTPVerificationFormProps> = ({ 
  phone,
  onVerificationSuccess, 
  onBack 
}) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Get demo OTP for testing
  const demoOTP = localStorage.getItem('demoOTP');

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
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
    setLoading(true);

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-verify-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'OTP verification failed');
      }

      // Clear temporary storage
      localStorage.removeItem('pendingPhone');
      localStorage.removeItem('pendingRole');
      localStorage.removeItem('pendingName');
      localStorage.removeItem('demoOTP');

      onVerificationSuccess(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');

    try {
      const pendingName = localStorage.getItem('pendingName');
      const pendingRole = localStorage.getItem('pendingRole');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-signup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: pendingName,
          phone,
          password: 'temp', // Will be ignored for resend
          role: pendingRole,
          resend: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP');
      }

      // Reset timer
      setTimeLeft(600);
      setCanResend(false);
      
      // Store new demo OTP
      if (data.demo_otp) {
        localStorage.setItem('demoOTP', data.demo_otp);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhone = (phone: string) => {
    if (phone.length >= 10) {
      return phone.slice(0, -6) + '******';
    }
    return phone;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verify Your Phone
          </h2>
          <p className="text-gray-600">
            We've sent a 6-digit verification code to
          </p>
          <p className="font-semibold text-gray-900">{formatPhone(phone)}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {demoOTP && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-4">
            <p className="text-sm font-medium">Demo Mode</p>
            <p className="text-sm">Your verification code is: <span className="font-mono font-bold">{demoOTP}</span></p>
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
            disabled={loading || timeLeft === 0}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" />
                Verifying...
              </>
            ) : (
              'Verify Phone Number'
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center text-gray-600 hover:text-gray-800 text-sm mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Registration
          </button>
          
          <div className="text-sm text-gray-500">
            <p>Didn't receive the code?</p>
            <button
              onClick={handleResendOTP}
              disabled={!canResend || resendLoading}
              className="text-green-600 hover:text-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto mt-1"
            >
              {resendLoading ? (
                <>
                  <Loader className="animate-spin w-4 h-4 mr-1" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Resend Code
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};