import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { FarmerSignupForm } from './components/auth/FarmerSignupForm';
import { ProviderSignupForm } from './components/auth/ProviderSignupForm';
import { SignupRoleSelector } from './components/auth/SignupRoleSelector';
import DriverTrackingPage from './components/tracking/DriverTrackingPage';
import LiveTrackingView from './components/tracking/LiveTrackingView';
import { SignupSuccessSplash } from './components/auth/SignupSuccessSplash';
import { WelcomeScreen } from './components/auth/WelcomeScreen';
import { AdminSignupPage } from './components/auth/AdminSignupPage';
import { MainApp } from './components/MainApp';
import { HowItWorks } from './components/HowItWorks';
import { 
  Tractor, 
  Shield, 
  MapPin, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Phone,
  Mail,
  Menu,
  X
} from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authStep, setAuthStep] = useState<
    'login' | 'choose-role' | 'signup-farmer' | 'signup-provider' | 'splash' | 'welcome'
  >('login');
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [pendingPhone, setPendingPhone] = useState<string>('');
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Check for existing user session on mount
  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.is_verified) {
          setUser(parsedUser);
        }
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (loggedInUser: any) => {
    setUser(loggedInUser);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
  };

  const handleUserUpdate = (updatedUser: any) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleSignupSuccess = (phone: string) => {
    setPendingPhone(phone);
    setAuthStep('splash');
  };

  const handleSplashComplete = async () => {
    // Fetch user data after splash
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: pendingPhone,
          password: 'temp', // This won't be used for verification
          fetch_user_only: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPendingUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
    
    setAuthStep('welcome');
  };

  const handleWelcomeComplete = () => {
    if (pendingUser) {
      setUser(pendingUser);
      localStorage.setItem('user', JSON.stringify(pendingUser));
    }
    setAuthStep('login');
    setShowAuth(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setAuthStep('login');
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Tractor className="w-12 h-12 text-green-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authenticated app if user is logged in
if (user && user.is_verified) {
  return (
    <Router>
      <Routes>
        <Route path="/admin-signup" element={<AdminSignupPage />} />

        {/* ✅ Main dashboard area */}
        <Route
          path="/*"
          element={
            <MainApp
              user={user}
              onLogout={handleLogout}
              onUserUpdate={handleUserUpdate}
            />
          }
        />

        {/* ✅ Driver Tracking Page (GPS-enabled) */}
        <Route
          path="/driver-tracking/:sessionId"
          element={<DriverTrackingPage sessionId={""} />}
        />

        {/* ✅ Live Tracking Map (for viewing driver’s movement) */}
        <Route
          path="/live-tracking/:bookingId"
          element={<LiveTrackingView />}
        />
      </Routes>
    </Router>
  );
}


  // Show welcome splash if user just verified
  if (authStep === 'welcome' && pendingUser) {
    return (
      <WelcomeScreen
        user={pendingUser}
        onComplete={handleWelcomeComplete}
      />
    );
  }

  // Show signup success splash
  if (authStep === 'splash') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100 flex items-center justify-center p-4">
        <SignupSuccessSplash
          onComplete={handleSplashComplete}
        />
      </div>
    );
  }

  // Show How It Works page
  if (showHowItWorks) {
    return (
      <Router>
        <Routes>
          <Route path="/admin-signup" element={<AdminSignupPage />} />
          <Route path="/*" element={<HowItWorks onBack={() => setShowHowItWorks(false)} />} />
        </Routes>
      </Router>
    );
  }

  // Show auth forms or landing page

  if (showAuth) {
    return (
      <Router>
        <Routes>
          <Route path="/admin-signup" element={<AdminSignupPage />} />
          <Route path="/*" element={
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100 flex items-center justify-center p-4">
              {authStep === 'login' && (
                <LoginForm
                  onSwitchToRegister={() => setAuthStep('choose-role')}
                  onLoginSuccess={handleLoginSuccess}
                />
              )}
              {authStep === 'choose-role' && (
                <SignupRoleSelector
                  onSelectFarmer={() => setAuthStep('signup-farmer')}
                  onSelectProvider={() => setAuthStep('signup-provider')}
                  onSwitchToLogin={() => setAuthStep('login')}
                />
              )}
              {authStep === 'signup-farmer' && (
                <FarmerSignupForm
                  onSwitchToLogin={() => setAuthStep('login')}
                  onSignupSuccess={handleSignupSuccess}
                  onSelectRole={() => setAuthStep('choose-role')}
                />
              )}
              {authStep === 'signup-provider' && (
                <ProviderSignupForm
                  onSwitchToLogin={() => setAuthStep('login')}
                  onSignupSuccess={handleSignupSuccess}
                  onSelectRole={() => setAuthStep('choose-role')}
                />
              )}
            </div>
          } />
        </Routes>
      </Router>
    );
  }

  // Landing page
  return (
    <Router>
      <Routes>
        <Route path="/admin-signup" element={<AdminSignupPage />} />
        <Route path="/*" element={
          <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  {/* Logo */}
                  <div className="flex items-center">
                    <Tractor className="h-8 w-8 text-green-600" />
                    <span className="ml-2 text-xl font-bold text-gray-900">FarmConnect</span>
                  </div>

                  {/* Desktop Navigation */}
                  <div className="hidden md:flex items-center space-x-8">
                    <a href="#" className="text-gray-900 font-medium hover:text-green-600 transition-colors">Home</a>
                    <button
                      onClick={() => setShowHowItWorks(true)}
                      className="text-gray-600 hover:text-green-600 transition-colors"
                    >
                      How It Works
                    </button>
                    <button
                      onClick={() => { setShowAuth(true); setAuthStep('choose-role'); }}
                      className="text-gray-600 hover:text-green-600 transition-colors"
                    >
                      Sign Up
                    </button>
                    <button 
                      onClick={() => { setShowAuth(true); setAuthStep('login'); }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Login
                    </button>
                    <a href="#" className="text-gray-600 hover:text-green-600 transition-colors">Contact</a>
                  </div>

                  {/* Mobile menu button */}
                  <div className="md:hidden">
                    <button
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                  </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                  <div className="md:hidden border-t border-gray-100">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                      <a href="#" className="block px-3 py-2 text-gray-900 font-medium">Home</a>
                      <button
                        onClick={() => setShowHowItWorks(true)}
                        className="block w-full text-left px-3 py-2 text-gray-600 hover:text-green-600"
                      >
                        How It Works
                      </button>
                      <button 
                        onClick={() => { setShowAuth(true); setAuthStep('choose-role'); }}
                        className="block w-full text-left px-3 py-2 text-gray-600 hover:text-green-600"
                      >
                        Sign Up
                      </button>
                      <button 
                        onClick={() => { setShowAuth(true); setAuthStep('login'); }}
                        className="block w-full text-left px-3 py-2 text-gray-600 hover:text-green-600"
                      >
                        Login
                      </button>
                      <a href="#" className="block px-3 py-2 text-gray-600 hover:text-green-600">Contact</a>
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-green-50 via-blue-50 to-green-100 py-16 lg:py-24">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                  <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                    Smart Farming,<br />
                    <span className="text-green-600">Trusted Services</span>
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                    Connect with reliable service providers for GPS-tracked equipment rentals with secure escrow payments. Farm smarter, not harder.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                      onClick={() => { setShowAuth(true); setAuthStep('signup-farmer'); }}
                      className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center"
                    >
                      Sign Up as Farmer
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </button>
                    <button
                      onClick={() => { setShowAuth(true); setAuthStep('signup-provider'); }}
                      className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center"
                    >
                      Sign Up as Provider
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Problem & Solution Section */}
            <section className="py-16 lg:py-24 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Problem */}
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                      The Challenge Farmers Face
                    </h2>
                    <p className="text-lg text-gray-600 mb-6">
                      Finding reliable equipment and services is time-consuming and risky. Traditional arrangements lack transparency, proper tracking, and secure payment protection.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-3 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-600">Unreliable service providers and equipment</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-3 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-600">No tracking or transparency in operations</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-3 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-600">Payment disputes and financial risks</span>
                      </li>
                    </ul>
                  </div>

                  {/* Solution */}
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                      Our <span className="text-green-600">Smart Solution</span>
                    </h2>
                    <p className="text-lg text-gray-600 mb-6">
                      FarmConnect bridges the gap with verified service providers, real-time GPS tracking, and secure escrow payments that protect both parties.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
                        <span className="text-gray-600">Verified, professional service providers</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
                        <span className="text-gray-600">Real-time GPS tracking and monitoring</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
                        <span className="text-gray-600">Secure escrow payments and dispute resolution</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Trust Indicators */}
            <section className="py-16 lg:py-24 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Built for Trust & Transparency
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Every transaction is protected by our comprehensive security and tracking system
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {/* GPS Tracking */}
                  <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MapPin className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">GPS Tracking</h3>
                    <p className="text-gray-600">
                      Real-time location monitoring ensures equipment is being used properly and efficiently on your farm.
                    </p>
                  </div>

                  {/* Escrow Protection */}
                  <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Shield className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Escrow Protection</h3>
                    <p className="text-gray-600">
                      Your payments are held securely until services are completed to your satisfaction. No payment risks.
                    </p>
                  </div>

                  {/* Dispute Resolution */}
                  <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Users className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Dispute Resolution</h3>
                    <p className="text-gray-600">
                      Fair and fast resolution process with expert mediators to handle any service disagreements.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-16 lg:py-24 bg-gradient-to-r from-green-600 to-blue-600">
              <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Ready to Transform Your Farming Operations?
                </h2>
                <p className="text-xl text-green-100 mb-8">
                  Join thousands of farmers and service providers who trust FarmConnect for secure, efficient agricultural services.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => { setShowAuth(true); setAuthStep('signup-farmer'); }}
                      className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                      Get Started as Farmer
                    </button>
                    <button
                      onClick={() => { setShowAuth(true); setAuthStep('signup-provider'); }}
                      className="bg-transparent text-white border-2 border-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-green-600 transform hover:scale-105 transition-all duration-200"
                    >
                      Become a Provider
                  </button>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-8">
                  {/* Logo & Description */}
                  <div className="md:col-span-2">
                    <div className="flex items-center mb-4">
                      <Tractor className="h-8 w-8 text-green-400" />
                      <span className="ml-2 text-xl font-bold">FarmConnect</span>
                    </div>
                    <p className="text-gray-300 mb-4">
                      Connecting farmers with trusted service providers through secure, technology-driven agricultural solutions.
                    </p>
                    <div className="flex space-x-4">
                      <div className="flex items-center text-gray-300">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>(555) 123-FARM</span>
                      </div>
                      <div className="flex items-center text-gray-300">
                        <Mail className="h-4 w-4 mr-2" />
                        <span>hello@farmconnect.com</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div>
                    <h4 className="font-semibold mb-4">Quick Links</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li><a href="#" className="hover:text-green-400 transition-colors">How It Works</a></li>
                      <li><a href="#" className="hover:text-green-400 transition-colors">For Farmers</a></li>
                      <li><a href="#" className="hover:text-green-400 transition-colors">For Providers</a></li>
                      <li><a href="#" className="hover:text-green-400 transition-colors">Support</a></li>
                    </ul>
                  </div>

                  {/* Legal */}
                  <div>
                    <h4 className="font-semibold mb-4">Legal</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li><a href="#" className="hover:text-green-400 transition-colors">Privacy Policy</a></li>
                      <li><a href="#" className="hover:text-green-400 transition-colors">Terms of Service</a></li>
                      <li><a href="#" className="hover:text-green-400 transition-colors">Cookie Policy</a></li>
                    </ul>
                  </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                  <p>&copy; 2025 FarmConnect. All rights reserved.</p>
                </div>
              </div>
            </footer>
          </div>
        } />
      </Routes>
    </Router>
  );
};

export default App;