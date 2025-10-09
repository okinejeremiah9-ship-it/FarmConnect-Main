import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  Calendar,
  Shield,
  CheckCircle,
  Star,
  MapPin,
  DollarSign,
  Users,
  Lock,
  Eye,
  AlertCircle,
  Award,
  Leaf,
  Clock,
  MessageSquare,
  Smartphone,
  TrendingUp,
  Home,
} from 'lucide-react';

interface HowItWorksProps {
  onBack?: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'farmer' | 'provider'>('farmer');

  const farmerSteps = [
    {
      icon: Search,
      title: 'Find Services',
      description: 'Browse the service marketplace or use our interactive map to find nearby service providers. Filter by category, location, and availability.',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Calendar,
      title: 'Book Service',
      description: 'Select a provider, choose your preferred date and time, and send a booking request. Providers respond quickly with confirmation or alternatives.',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: Shield,
      title: 'Pay into Escrow',
      description: 'Your payment is securely held in escrow. The provider cannot access it until you confirm the service is completed satisfactorily.',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: CheckCircle,
      title: 'Receive Service',
      description: 'The provider delivers the service as agreed. Track equipment location in real-time with GPS. Monitor progress and stay informed.',
      color: 'bg-orange-100 text-orange-600',
    },
    {
      icon: Star,
      title: 'Release Payment & Review',
      description: 'Once satisfied, release the payment from escrow. Rate the provider and leave a review to help other farmers make informed decisions.',
      color: 'bg-yellow-100 text-yellow-600',
    },
  ];

  const providerSteps = [
    {
      icon: Users,
      title: 'Create Profile',
      description: 'Set up your provider profile with services offered, pricing, location, and availability. Add photos and details to attract farmers.',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Calendar,
      title: 'Get Bookings',
      description: 'Receive booking requests from farmers in your area. Review details, accept or propose alternative times, and manage your schedule.',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: Shield,
      title: 'Escrow Assurance',
      description: 'Payments are held securely in escrow before you start work. Your payment is guaranteed once the farmer confirms service completion.',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: CheckCircle,
      title: 'Deliver Service',
      description: 'Provide the agreed service professionally. GPS tracking ensures transparency. Communicate with farmers through in-app chat.',
      color: 'bg-orange-100 text-orange-600',
    },
    {
      icon: DollarSign,
      title: 'Get Paid & Reviewed',
      description: 'Once the farmer releases payment, funds transfer directly to your account. Build your reputation through positive reviews.',
      color: 'bg-yellow-100 text-yellow-600',
    },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">How It Works</h1>
                <p className="text-gray-600">Learn how FarmConnect makes farming easier</p>
              </div>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Home className="w-4 h-4 mr-2" />
                Return to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Simple, Secure, and Trusted
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            FarmConnect connects farmers with reliable service providers through a secure platform
            that protects payments, tracks services, and builds trust through verified reviews.
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-lg shadow-sm p-1 inline-flex">
            <button
              onClick={() => setActiveTab('farmer')}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'farmer'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              For Farmers
            </button>
            <button
              onClick={() => setActiveTab('provider')}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'provider'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              For Providers
            </button>
          </div>
        </div>

        {/* Step-by-Step Process */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {activeTab === 'farmer' ? 'How It Works for Farmers' : 'How It Works for Providers'}
          </h3>
          <div className="space-y-8">
            {(activeTab === 'farmer' ? farmerSteps : providerSteps).map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm p-8 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center`}
                      >
                        <Icon className="w-8 h-8" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3">
                          {index + 1}
                        </span>
                        <h4 className="text-xl font-bold text-gray-900">{step.title}</h4>
                      </div>
                      <p className="text-gray-600 text-lg">{step.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Escrow Wallet Section */}
        <div className="mb-20">
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-12 text-white">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Escrow Wallet Protection</h3>
              <p className="text-xl text-purple-100 max-w-3xl mx-auto">
                Your payments are safe and secure until the job is done
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-2">Payment Held</h4>
                <p className="text-purple-100">
                  Farmer pays into escrow when booking. Money is locked and protected.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-2">Service Delivered</h4>
                <p className="text-purple-100">
                  Provider completes the work. Farmer verifies and confirms satisfaction.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-2">Payment Released</h4>
                <p className="text-purple-100">
                  Farmer releases payment. Funds transfer instantly to provider's account.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dispute Resolution */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-orange-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Dispute Resolution</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              If something goes wrong, we're here to help resolve it fairly
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">1. Raise Issue</h4>
              <p className="text-sm text-gray-600">
                Either party can raise a dispute if there's a problem with the service.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">2. Provide Evidence</h4>
              <p className="text-sm text-gray-600">
                Both parties submit details, photos, and GPS tracking data.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">3. Admin Review</h4>
              <p className="text-sm text-gray-600">
                Our team reviews all evidence and mediates a fair resolution.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">4. Resolution</h4>
              <p className="text-sm text-gray-600">
                Payment is released according to the fair decision made.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Trust */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Security & Trust Features</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Multiple layers of protection keep your transactions safe and transparent
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">OTP Verification</h4>
              <p className="text-gray-600">
                Secure phone-based authentication ensures only verified users access the platform.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Escrow Protection</h4>
              <p className="text-gray-600">
                Payments held securely until both parties confirm service completion.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">GPS Tracking</h4>
              <p className="text-gray-600">
                Real-time location tracking ensures transparency and prevents fraud.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Reviews & Ratings</h4>
              <p className="text-gray-600">
                Verified reviews help you make informed decisions about service providers.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Transparency</h4>
              <p className="text-gray-600">
                All transactions, communications, and service details are recorded and accessible.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-red-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Privacy Protection</h4>
              <p className="text-gray-600">
                Your personal information is encrypted and never shared without permission.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Benefits for Everyone</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              FarmConnect creates value for farmers, providers, and the environment
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Farmers */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">For Farmers</h4>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Save time finding reliable services</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Protected payments with escrow</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Transparent pricing and tracking</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Access to verified providers</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Better crop yields and efficiency</span>
                </li>
              </ul>
            </div>

            {/* Providers */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">For Providers</h4>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Reach more farmers easily</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Guaranteed payment through escrow</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Build reputation with reviews</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Manage bookings efficiently</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Grow your business faster</span>
                </li>
              </ul>
            </div>

            {/* Environment */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-8">
              <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mb-6">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">For Environment</h4>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Efficient equipment sharing</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Reduced fuel waste with GPS</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Better resource optimization</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Sustainable farming practices</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Lower carbon footprint</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-12 text-center text-white">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="w-10 h-10" />
          </div>
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of farmers and providers who trust FarmConnect for secure, efficient agricultural services.
          </p>
          {onBack && (
            <button
              onClick={() => {
                scrollToTop();
                onBack();
              }}
              className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Return to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
