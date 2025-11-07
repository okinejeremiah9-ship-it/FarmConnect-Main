import React, { useEffect } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface SignupSuccessSplashProps {
  onComplete: () => void;
}

export const SignupSuccessSplash: React.FC<SignupSuccessSplashProps> = ({ onComplete }) => {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const verifySessionAndProceed = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          console.warn('No active session found after signup.');
        }
      } catch (error) {
        console.error('Failed to verify Supabase session after signup:', error);
      }

      timer = setTimeout(() => {
        onComplete();
      }, 3000);
    };

    verifySessionAndProceed();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="text-center text-white max-w-md mx-auto">
        {/* Animated Success Icon */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle className="w-16 h-16 text-white animate-pulse" />
          </div>
          
          {/* Sparkle animations */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-yellow-300 absolute -top-4 -right-4 animate-ping" />
            <Sparkles className="w-6 h-6 text-yellow-300 absolute -bottom-2 -left-6 animate-ping" style={{ animationDelay: '0.5s' }} />
            <Sparkles className="w-4 h-4 text-yellow-300 absolute top-8 -left-8 animate-ping" style={{ animationDelay: '1s' }} />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-4 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Signup Successful!
          </h1>
          
          <p className="text-xl opacity-90">
            Your account has been created successfully
          </p>
          
          <div className="flex items-center justify-center space-x-2 text-green-200">
            <div className="w-2 h-2 bg-green-200 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-200 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-green-200 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
};