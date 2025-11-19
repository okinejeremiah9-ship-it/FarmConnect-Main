// Location: src/components/LandingPage.tsx
// Purpose: Public home page (unchanged look but stable component)

import React from "react";
import { Tractor, ArrowRight } from "lucide-react";

export const LandingPage: React.FC<{ onLogin?: () => void; onSignupFarmer?: () => void; onSignupProvider?: () => void; }> = ({
  onLogin,
  onSignupFarmer,
  onSignupProvider,
}) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="text-center py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <h1 className="text-5xl font-extrabold text-gray-900">
          Smart Farming,
          <span className="block text-green-600">Trusted Services</span>
        </h1>

        <p className="mt-4 text-lg text-gray-700 max-w-2xl mx-auto">
          Connect with reliable service providers for GPS-tracked equipment rentals with secure escrow payments.
          Farm smarter, not harder.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <button
            onClick={onSignupFarmer}
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700"
          >
            Sign Up as Farmer →
          </button>

          <button
            onClick={onSignupProvider}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Sign Up as Provider →
          </button>
        </div>
      </div>

      {/* Challenge + Solution */}
      <div className="max-w-6xl mx-auto py-20 px-6 grid md:grid-cols-2 gap-16">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">The Challenge Farmers Face</h2>
          <p className="mt-4 text-gray-700">
            Finding reliable equipment and services is time-consuming and risky. Traditional arrangements lack transparency,
            proper tracking, and secure payment protection.
          </p>

          <ul className="mt-4 space-y-2 text-gray-700">
            <li>• Unreliable service providers</li>
            <li>• No GPS tracking</li>
            <li>• Payment disputes and risk</li>
          </ul>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Our <span className="text-green-600">Smart Solution</span>
          </h2>

          <ul className="mt-4 space-y-2 text-gray-700">
            <li>✔ Verified, professional providers</li>
            <li>✔ Real-time GPS tracking</li>
            <li>✔ Secure escrow payments</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
