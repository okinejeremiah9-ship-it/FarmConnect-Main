import React from 'react';
import { Tractor, Wrench, ArrowRight, ArrowLeft } from 'lucide-react';

interface SignupRoleSelectorProps {
  onSelectFarmer: () => void;
  onSelectProvider: () => void;
  onSwitchToLogin: () => void;
}

export const SignupRoleSelector: React.FC<SignupRoleSelectorProps> = ({
  onSelectFarmer,
  onSelectProvider,
  onSwitchToLogin,
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-green-100">
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          <button
            onClick={onSwitchToLogin}
            className="hover:text-green-600 transition-colors"
          >
            Back to login
          </button>
        </div>
        <div className="text-center mb-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 mb-4">
            Choose your journey
          </span>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            How do you want to use FarmConnect?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Pick the option that best describes you so we can tailor your onboarding experience
            and collect the details we need to serve you better.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={onSelectFarmer}
            className="group border-2 border-green-100 hover:border-green-500 rounded-xl p-6 text-left transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <Tractor className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">I am a Farmer</h3>
                  <p className="text-sm text-gray-500">I want to book reliable services</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Access vetted service providers</li>
              <li>• Track jobs with GPS visibility</li>
              <li>• Pay safely through escrow</li>
            </ul>
          </button>

          <button
            onClick={onSelectProvider}
            className="group border-2 border-blue-100 hover:border-blue-500 rounded-xl p-6 text-left transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Wrench className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">I provide services</h3>
                  <p className="text-sm text-gray-500">I want to offer my equipment or skills</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Showcase your business profile</li>
              <li>• Receive booking requests instantly</li>
              <li>• Build trust with transparent records</li>
            </ul>
          </button>
        </div>

        <div className="mt-10 text-center text-sm text-gray-500">
          Already have an account?
          <button
            onClick={onSwitchToLogin}
            className="ml-2 text-green-600 font-medium hover:text-green-700"
          >
            Log in instead
          </button>
        </div>
      </div>
    </div>
  );
};
