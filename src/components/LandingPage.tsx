// Location: src/components/LandingPage.tsx
// Purpose: Public home page (marketing landing with working CTA buttons)

import React from "react";
import { Tractor, ArrowRight, Phone, Mail } from "lucide-react";

interface LandingPageProps {
  onLogin: () => void;
  onOpenSignupRole: () => void;
  onSignupFarmer: () => void;
  onSignupProvider: () => void;
  onOpenHowItWorks?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
  onLogin,
  onOpenSignupRole,
  onSignupFarmer,
  onSignupProvider,
  onOpenHowItWorks,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* =======================
          TOP NAVBAR
      ======================== */}
      <header className="w-full border-b border-gray-100 bg-white/80 backdrop-blur z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={scrollToTop}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <Tractor className="h-8 w-8 text-green-600" />
            <span className="text-xl sm:text-2xl font-bold text-gray-900">
              FarmConnect
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-8 text-sm sm:text-base font-medium">
            <button
              onClick={scrollToTop}
              className="text-gray-700 hover:text-green-600"
            >
              Home
            </button>

            <button
              onClick={() =>
                onOpenHowItWorks
                  ? onOpenHowItWorks()
                  : scrollToSection("how-it-works")
              }
              className="text-gray-700 hover:text-green-600"
            >
              How It Works
            </button>

            <button
              onClick={onOpenSignupRole}
              className="text-gray-700 hover:text-green-600"
            >
              Sign Up
            </button>

            <button className="px-3 sm:px-4 py-1 sm:py-2 rounded-full bg-green-600 text-white hover:bg-green-700 transition" onClick={onLogin}>
              Login
            </button>

            <button
              onClick={() => scrollToSection("contact")}
              className="text-gray-700 hover:text-green-600"
            >
              Contact
            </button>
          </nav>
        </div>
      </header>

      {/* =======================
          HERO SECTION
      ======================== */}
      <main className="flex-1">
        <section className="text-center py-16 sm:py-20 md:py-28 bg-gradient-to-br from-green-50 via-white to-blue-50 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-snug">
              Smart Farming,
              <span className="block text-green-600 mt-1">Trusted Services</span>
            </h1>

            <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
              Connect with reliable service providers for GPS-tracked equipment
              rentals with secure escrow payments. Farm smarter, not harder.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={onSignupFarmer}
                className="inline-flex items-center justify-center bg-green-600 text-white px-6 sm:px-8 py-3 sm:py-3 rounded-lg font-semibold hover:bg-green-700 shadow-md shadow-green-200 transition"
              >
                Sign Up as Farmer
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>

              <button
                onClick={onSignupProvider}
                className="inline-flex items-center justify-center bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 shadow-md shadow-blue-200 transition"
              >
                Sign Up as Provider
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* =======================
            CHALLENGE & SOLUTION
        ======================== */}
        <section className="max-w-6xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 md:gap-16">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              The Challenge Farmers Face
            </h2>
            <p className="mt-3 sm:mt-4 text-gray-700 leading-relaxed text-base sm:text-lg">
              Finding reliable equipment and services is time-consuming and
              risky. Traditional arrangements lack transparency, proper
              tracking, and secure payment protection.
            </p>

            <ul className="mt-4 sm:mt-6 space-y-2 text-gray-700 text-base sm:text-lg">
              <li>• Unreliable service providers and equipment</li>
              <li>• No tracking or transparency in operations</li>
              <li>• Payment disputes and financial risks</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Our <span className="text-green-600">Smart Solution</span>
            </h2>
            <p className="mt-3 sm:mt-4 text-gray-700 leading-relaxed text-base sm:text-lg">
              FarmConnect bridges the gap with verified service providers,
              real-time GPS tracking, and secure escrow payments that protect
              both parties.
            </p>

            <ul className="mt-4 sm:mt-6 space-y-2 text-gray-700 text-base sm:text-lg">
              <li>✔ Verified, professional service providers</li>
              <li>✔ Real-time GPS tracking and monitoring</li>
              <li>✔ Secure escrow payments and dispute resolution</li>
            </ul>
          </div>
        </section>

        {/* =======================
            TRUST & FEATURES
        ======================== */}
        <section id="how-it-works" className="bg-gray-50 py-12 sm:py-16 md:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              Built for Trust &amp; Transparency
            </h2>
            <p className="mt-3 sm:mt-4 text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
              Every transaction is protected by our comprehensive security and
              tracking system.
            </p>

            <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-6">
              <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-2 sm:mb-4">
                  <span className="text-blue-500 text-xl">📍</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2">GPS Tracking</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Real-time location monitoring ensures equipment is being used
                  properly and efficiently on your farm.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-2 sm:mb-4">
                  <span className="text-green-500 text-xl">🛡️</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2">Escrow Protection</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Your payments are held securely until services are completed
                  to your satisfaction. No payment risks.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6">
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-2 sm:mb-4">
                  <span className="text-purple-500 text-xl">🤝</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2">Dispute Resolution</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Fair and fast resolution process with expert mediators to
                  handle any service disagreements.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =======================
            FINAL CTA SECTION
        ======================== */}
        <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-green-500 to-blue-500 text-white text-center px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">
              Ready to Transform Your Farming Operations?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-green-50 mb-6 sm:mb-8">
              Join thousands of farmers and service providers who trust
              FarmConnect for secure, efficient agricultural services.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={onSignupFarmer}
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-3 rounded-lg bg-white text-green-700 font-semibold hover:bg-green-50 transition"
              >
                Get Started as Farmer
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>

              <button
                onClick={onSignupProvider}
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-3 rounded-lg border border-white/80 text-white font-semibold hover:bg-white/10 transition"
              >
                Become a Provider
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* =======================
          FOOTER
      ======================== */}
      <footer className="bg-slate-900 text-slate-100 py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div>
            <div className="flex items-center mb-3 sm:mb-4">
              <Tractor className="h-7 w-7 text-green-400" />
              <span className="ml-2 text-lg font-semibold">FarmConnect</span>
            </div>
            <p className="text-sm sm:text-base text-slate-300">
              Connecting farmers with trusted service providers through secure,
              technology-driven agricultural solutions.
            </p>
            <div className="mt-3 sm:mt-4 space-y-2 text-sm sm:text-base text-slate-300">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>(555) 123-FARM</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>hello@farmconnect.com</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2 sm:mb-3">Quick Links</h4>
            <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-300">
              <li>
                <button
                  onClick={() =>
                    onOpenHowItWorks
                      ? onOpenHowItWorks()
                      : scrollToSection("how-it-works")
                  }
                  className="hover:text-white"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={onSignupFarmer} className="hover:text-white">
                  For Farmers
                </button>
              </li>
              <li>
                <button onClick={onSignupProvider} className="hover:text-white">
                  For Providers
                </button>
              </li>
              <li>
                <button onClick={onLogin} className="hover:text-white">
                  Login
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2 sm:mb-3">Legal</h4>
            <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-300">
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Cookie Policy</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
export { LandingPage };
