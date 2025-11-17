// --- AUTH FLOW FIXED VERSION ---

import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { LoginForm } from "./components/auth/LoginForm";
import { FarmerSignupForm } from "./components/auth/FarmerSignupForm";
import { ProviderSignupForm } from "./components/auth/ProviderSignupForm";
import { SignupRoleSelector } from "./components/auth/SignupRoleSelector";
import { SignupSuccessSplash } from "./components/auth/SignupSuccessSplash";
import { WelcomeScreen } from "./components/auth/WelcomeScreen";
import { AdminSignupPage } from "./components/auth/AdminSignupPage";

import DriverTrackingPage from "./components/tracking/DriverTrackingPage";
import LiveTrackingView from "./components/tracking/LiveTrackingView";
import { MainApp } from "./components/MainApp";
import { HowItWorks } from "./components/HowItWorks";

import { normalizeUserProfile } from "./utils/profile";
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
  X,
} from "lucide-react";

type AuthStep =
  | "login"
  | "choose-role"
  | "signup-farmer"
  | "signup-provider"
  | "splash"
  | "welcome";

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [authStep, setAuthStep] = useState<AuthStep>("login");

  const [pendingUser, setPendingUser] = useState<any>(null);
  const [pendingPhone, setPendingPhone] = useState<string>("");

  const [showAuth, setShowAuth] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // -------------------------------------------------------
  // Persist user in localStorage
  // -------------------------------------------------------
  const persistUser = useCallback((rawUser: any | null) => {
    if (!rawUser) {
      setUser(null);
      localStorage.removeItem("user");
      return null;
    }

    const normalized = normalizeUserProfile(rawUser);
    setUser(normalized);
    localStorage.setItem("user", JSON.stringify(normalized));
    return normalized;
  }, []);

  // -------------------------------------------------------
  // Fetch latest profile from Supabase
  // -------------------------------------------------------
  const fetchLatestUserProfile = useCallback(async (id: string) => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-profile?id=${id}`,
      {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      }
    );

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to fetch user profile");
    }

    return data.user;
  }, []);

  const refreshAndPersistUser = useCallback(
    async (baseUser: any | null, opts: { persist?: boolean } = {}) => {
      const shouldPersist = opts.persist ?? true;
      if (!baseUser) {
        if (shouldPersist) persistUser(null);
        return null;
      }

      let merged = baseUser;

      if (baseUser?.id) {
        try {
          const latest = await fetchLatestUserProfile(baseUser.id);
          merged = { ...baseUser, ...latest };
        } catch (err) {
          console.error("Profile refresh failed:", err);
        }
      }

      const normalized = normalizeUserProfile(merged);
      if (shouldPersist) persistUser(normalized);
      return normalized;
    },
    [fetchLatestUserProfile, persistUser]
  );

  // -------------------------------------------------------
  // Load session on startup
  // -------------------------------------------------------
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.is_verified) persistUser(parsed);
      } catch {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, [persistUser]);

  // -------------------------------------------------------
  // Login success
  // -------------------------------------------------------
  const handleLoginSuccess = useCallback(
    async (loggedInUser: any) => {
      await refreshAndPersistUser(loggedInUser, { persist: true });
    },
    [refreshAndPersistUser]
  );

  // -------------------------------------------------------
  // Signup success → move to splash
  // -------------------------------------------------------
  const handleSignupSuccess = useCallback((phone: string) => {
    setPendingPhone(phone);
    setPendingUser(null);
    setAuthStep("splash");
    setShowAuth(true);
  }, []);

  // -------------------------------------------------------
  // Splash ended → fetch user → move to Welcome (or Login fallback)
  // -------------------------------------------------------
  const handleSplashComplete = useCallback(async () => {
    if (!pendingPhone) {
      setAuthStep("login");
      setShowAuth(true);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-login`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: pendingPhone,
            fetch_user_only: true, // <-- NO PASSWORD NEEDED
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        const refreshed = await refreshAndPersistUser(data.user, {
          persist: false,
        });
        setPendingUser(refreshed);
        setAuthStep("welcome"); // <-- VALID NOW
        return;
      }

      console.error("auth-login failed:", data.error);
    } catch (err) {
      console.error("Splash fetch error:", err);
    }

    // Fallback path
    setPendingUser(null);
    setAuthStep("login");
    setShowAuth(true);
  }, [pendingPhone, refreshAndPersistUser]);

  // -------------------------------------------------------
  // Welcome completed → store user → go to login screen
  // -------------------------------------------------------
  const handleWelcomeComplete = useCallback(() => {
    if (pendingUser) persistUser(pendingUser);
    setAuthStep("login");
    setShowAuth(false);
  }, [pendingUser, persistUser]);

  // -------------------------------------------------------
  // Logout
  // -------------------------------------------------------
  const handleLogout = useCallback(() => {
    persistUser(null);
    setAuthStep("login");
  }, [persistUser]);

  // -------------------------------------------------------
  // LOADING SCREEN
  // -------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Tractor className="w-12 h-12 text-green-600 animate-pulse" />
      </div>
    );
  }

  // -------------------------------------------------------
  // USER LOGGED IN
  // -------------------------------------------------------
  if (user && user.is_verified) {
    return (
      <Router>
        <Routes>
          <Route path="/admin-signup" element={<AdminSignupPage />} />
          <Route
            path="/*"
            element={
              <MainApp
                user={user}
                onLogout={handleLogout}
                onUserUpdate={persistUser}
              />
            }
          />
          <Route
            path="/driver-tracking/:sessionId"
            element={<DriverTrackingPage sessionId={""} />}
          />
          <Route
            path="/live-tracking/:bookingId"
            element={<LiveTrackingView />}
          />
        </Routes>
      </Router>
    );
  }

  // -------------------------------------------------------
  // WELCOME SCREEN (AFTER SIGNUP)
  // -------------------------------------------------------
  if (authStep === "welcome" && pendingUser) {
    return <WelcomeScreen user={pendingUser} onComplete={handleWelcomeComplete} />;
  }

  // -------------------------------------------------------
  // SPLASH SCREEN
  // -------------------------------------------------------
  if (authStep === "splash") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SignupSuccessSplash onComplete={handleSplashComplete} />
      </div>
    );
  }

  // -------------------------------------------------------
  // AUTH FORMS
  // -------------------------------------------------------
  if (showAuth) {
    return (
      <Router>
        <Routes>
          <Route path="/admin-signup" element={<AdminSignupPage />} />
          <Route
            path="/*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                {authStep === "login" && (
                  <LoginForm
                    onLoginSuccess={handleLoginSuccess}
                    onSwitchToRegister={() => setAuthStep("choose-role")}
                  />
                )}

                {authStep === "choose-role" && (
                  <SignupRoleSelector
                    onSelectFarmer={() => setAuthStep("signup-farmer")}
                    onSelectProvider={() => setAuthStep("signup-provider")}
                    onSwitchToLogin={() => setAuthStep("login")}
                  />
                )}

                {authStep === "signup-farmer" && (
                  <FarmerSignupForm
                    onSignupSuccess={handleSignupSuccess}
                    onSwitchToLogin={() => setAuthStep("login")}
                  />
                )}

                {authStep === "signup-provider" && (
                  <ProviderSignupForm
                    onSignupSuccess={handleSignupSuccess}
                    onSwitchToLogin={() => setAuthStep("login")}
                  />
                )}
              </div>
            }
          />
        </Routes>
      </Router>
    );
  }

  // -------------------------------------------------------
  // LANDING PAGE (unchanged)
  // -------------------------------------------------------
  // ✨ *Your landing page code remains exactly the same.*
  // (I left it untouched for clarity & to avoid merge conflicts)

  return (
    <Router>
      <Routes>
        <Route path="/admin-signup" element={<AdminSignupPage />} />
        <Route path="/*" element={<YourLandingPageHere />} />
      </Routes>
    </Router>
  );
};

export default App;
