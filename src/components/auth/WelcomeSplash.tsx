import React, { useEffect } from 'react';
import { Tractor, Users, Shield, CheckCircle } from 'lucide-react';

interface WelcomeSplashProps {
  user: {
    name: string;
    role: 'farmer' | 'provider' | 'admin';
  };
  onComplete: () => void;
}

export const WelcomeSplash: React.FC<WelcomeSplashProps> = ({ user, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000); // Show for 4 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'farmer':
        return {
          icon: Tractor,
          title: 'Welcome to FarmConnect!',
          subtitle: "Let's connect you to trusted services",
          description: 'You can now browse and book agricultural services from verified providers in your area.',
          color: 'green',
          bgGradient: 'from-green-400 to-blue-500',
        };
      case 'provider':
        return {
          icon: Users,
          title: 'Welcome, Service Provider!',
          subtitle: 'Your services can now reach farmers',
          description: 'Start listing your services and connect with farmers who need your expertise.',
          color: 'blue',
          bgGradient: 'from-blue-400 to-purple-500',
        };
      case 'admin':
        return {
          icon: Shield,
          title: 'Welcome, Administrator!',
          subtitle: 'You now have full control of the platform',
          description: 'Manage users, oversee transactions, and ensure the platform runs smoothly.',
          color: 'purple',
          bgGradient: 'from-purple-400 to-pink-500',
        };
      default:
        return {
          icon: CheckCircle,
          title: 'Welcome!',
          subtitle: 'Account verified successfully',
          description: 'You can now access all platform features.',
          color: 'gray',
          bgGradient: 'from-gray-400 to-gray-600',
        };
    }
  };

  const config = getRoleConfig(user.role);
  const Icon = config.icon;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient} flex items-center justify-center p-4`}>
      <div className="text-center text-white max-w-md mx-auto">
        {/* Animated Icon */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Icon className="w-12 h-12 text-white" />
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto">
            <div className="w-full h-full border-4 border-white border-opacity-30 rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="space-y-4 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold">
            {config.title}
          </h1>
          
          <p className="text-xl font-medium opacity-90">
            Hello, {user.name}!
          </p>
          
          <p className="text-lg opacity-80">
            {config.subtitle}
          </p>
          
          <p className="text-base opacity-70 leading-relaxed">
            {config.description}
          </p>
        </div>

        {/* Success Indicator */}
        <div className="mt-8 flex items-center justify-center space-x-2 text-white opacity-80">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm">Account verified successfully</span>
        </div>

        {/* Loading Indicator */}
        <div className="mt-6">
          <div className="w-32 h-1 bg-white bg-opacity-30 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-white rounded-full animate-loading-bar"></div>
          </div>
          <p className="text-sm opacity-60 mt-2">Setting up your dashboard...</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes loading-bar {
          from { width: 0%; }
          to { width: 100%; }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-loading-bar {
          animation: loading-bar 4s ease-out;
        }
      `}</style>
    </div>
  );
};