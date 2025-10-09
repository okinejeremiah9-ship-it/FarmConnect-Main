import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SignupForm } from './SignupForm';
import { OTPVerificationForm } from './OTPVerificationForm';
import { WelcomeSplash } from './WelcomeSplash';
import { AlertTriangle, Loader } from 'lucide-react';

export const AdminSignupPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<'signup' | 'otp' | 'welcome'>('signup');
  const [phone, setPhone] = useState('');
  const [user, setUser] = useState<any>(null);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');

  const inviteToken = searchParams.get('token');

  useEffect(() => {
    const validateToken = async () => {
      if (!inviteToken) {
        setError('Invalid invite link - no token provided');
        setValidatingToken(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/admin_invites?invite_token=eq.${inviteToken}&is_used=eq.false&expires_at=gt.${new Date().toISOString()}`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        });

        const data = await response.json();

        if (response.ok && data.length > 0) {
          setTokenValid(true);
        } else {
          setError('Invalid or expired invite link');
        }
      } catch (err) {
        setError('Failed to validate invite link');
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [inviteToken]);

  const handleSignupSuccess = (userPhone: string) => {
    setPhone(userPhone);
    setStep('otp');
  };

  const handleVerificationSuccess = (verifiedUser: any) => {
    setUser(verifiedUser);
    setStep('welcome');
  };

  const handleWelcomeComplete = () => {
    // Store user and redirect to admin dashboard
    localStorage.setItem('user', JSON.stringify(user));
    navigate('/');
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Validating invite link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Invite Link</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-100 flex items-center justify-center p-4">
      {step === 'signup' && (
        <SignupForm
          onSwitchToLogin={() => navigate('/')}
          onSignupSuccess={handleSignupSuccess}
          adminInviteToken={inviteToken!}
        />
      )}
      
      {step === 'otp' && (
        <OTPVerificationForm
          phone={phone}
          onVerificationSuccess={handleVerificationSuccess}
          onBack={() => setStep('signup')}
        />
      )}
      
      {step === 'welcome' && user && (
        <WelcomeSplash
          user={user}
          onComplete={handleWelcomeComplete}
        />
      )}
    </div>
  );
};