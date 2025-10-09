import React from 'react';
import { Tractor, Users, Shield, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  user: {
    name: string;
    phone: string;
    role: 'farmer' | 'provider' | 'admin';
  };
  onComplete: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ user, onComplete }) => {
  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'farmer':
        return {
          icon: Tractor,
          title: 'Welcome to FarmConnect!',
          subtitle: 'Your farming journey starts here',
          description: 'Connect with trusted service providers, rent equipment, and grow your farm with confidence.',
          color: 'green',
          bgGradient: 'from-green-400 to-blue-500',
          features: [
            'Browse verified service providers',
            'Secure escrow payments',
            'GPS-tracked equipment',
            'Real-time service monitoring'
          ]
        };
      case 'provider':
        return {
          icon: Users,
          title: 'Welcome, Service Provider!',
          subtitle: 'Ready to serve farmers in your area',
          description: 'List your services, connect with farmers, and grow your business on our trusted platform.',
          color: 'blue',
          bgGradient: 'from-blue-400 to-purple-500',
          features: [
            'List your services and equipment',
            'Reach farmers in your area',
            'Secure payment processing',
            'Build your reputation'
          ]
        };
      case 'admin':
        return {
          icon: Shield,
          title: 'Welcome, Administrator!',
          subtitle: 'Platform management at your fingertips',
          description: 'Oversee platform operations, manage users, and ensure smooth service delivery.',
          color: 'purple',
          bgGradient: 'from-purple-400 to-pink-500',
          features: [
            'Monitor platform activity',
            'Manage user accounts',
            'Resolve disputes',
            'Generate reports'
          ]
        };
      default:
        return {
          icon: Tractor,
          title: 'Welcome!',
          subtitle: 'Let\'s get started',
          description: 'Welcome to FarmConnect platform.',
          color: 'gray',
          bgGradient: 'from-gray-400 to-gray-600',
          features: []
        };
    }
  };

  const config = getRoleConfig(user.role);
  const Icon = config.icon;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient} flex items-center justify-center p-4`}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 bg-${config.color}-100 rounded-full flex items-center justify-center mx-auto mb-6`}>
            <Icon className={`w-10 h-10 text-${config.color}-600`} />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {config.title}
          </h1>
          
          <p className="text-xl text-gray-600 mb-4">
            Hello, {user.name}!
          </p>
          
          <p className="text-lg text-gray-500">
            {config.subtitle}
          </p>
        </div>

        {/* Description */}
        <div className="mb-8">
          <p className="text-gray-700 text-center leading-relaxed">
            {config.description}
          </p>
        </div>

        {/* Features */}
        {config.features.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              What you can do:
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {config.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 bg-${config.color}-500 rounded-full flex-shrink-0`}></div>
                  <span className="text-gray-700 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Registered Phone Number</p>
            <p className="font-mono text-gray-900 font-medium">{user.phone}</p>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onComplete}
          className={`w-full bg-${config.color}-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-${config.color}-700 transition-colors flex items-center justify-center group`}
        >
          Continue to Dashboard
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};