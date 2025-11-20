// --- SINGLE-ROUTER AUTH + LANDING + MAIN APP WITH ANIMATIONS --- //

import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";

import { LoginForm } from "./components/auth/LoginForm";
import { FarmerSignupForm } from "./components/auth/FarmerSignupForm";
import { ProviderSignupForm } from "./components/auth/ProviderSignupForm";
import { SignupRoleSelector } from "./components/auth/SignupRoleSelector";
import { SignupSuccessSplash } from "./components/auth/SignupSuccessSplash";
import { WelcomeScreen } from "./components/auth/WelcomeScreen";
import { AdminSignupPage } from "./components/auth/AdminSignupPage";

import { MainApp } from "./components/MainApp";
import { LandingPage } from "./components/LandingPage";
import { HowItWorks } from "./components/HowItWorks";

import PageTransition from "./components/ui/PageTransition"; // ⭐ ADD THIS
import { normalizeUserProfile } from "./utils/profile";
import { Tractor } from "lucide-react";
import { registerPushSubscription } from "./lib/notifications";

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
  const [showAuthFlow, setShowAuthFlow] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const [pendingPhone, setPendingPhone] = useState("");
  const [pendingUser, setPendingUser] = useState<any>(null);

  // ================================
  // USER PERSISTENCE
  // ================================
  const persistUser = useCallback((raw: any | null) => {
    if (!raw) {
      setUser(null);
      localStorage.removeItem("user");
      return;
    }
    const normalized = normalizeUserProfile(raw);
    localStorage.setItem("user", JSON.stringify(normalized));
    setUser(normalized);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        persistUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, [persistUser]);

  const refreshProfile = async (id: string) => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-profile?id=${id}`,
      {
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      }
    );

    const json = await response.json();
    if (!json.success) throw new Error(json.error);

    return normalizeUserProfile(json.user);
  };

  // ================================
  // LOGIN SUCCESS
  // ================================
  const handleLoginSuccess = useCallback(
    async (usr: any) => {
      const refreshed = await refreshProfile(usr.id);
      persistUser(refreshed);
      setShowAuthFlow(false);
    },
    [persistUser]
  );

  // ================================
  // SIGNUP SUCCESS → Splash
  // ================================
  const handleSignupSuccess = useCallback((phone: string) => {
    setPendingPhone(phone);
    setPendingUser(null);
    setAuthStep("splash");
    setShowAuthFlow(true);
  }, []);

  // ================================
  // SPLASH COMPLETE → Fetch user
  // ================================
  const handleSplashComplete = useCallback(async () => {
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
            fetch_user_only: true,
          }),
        }
      );

      const data = await response.json();
      if (data.success && data.user) {
        const profile = await refreshProfile(data.user.id);
        setPendingUser(profile);
        setAuthStep("welcome");
        return;
      }
    } catch (err) {
      console.error("Splash login failed:", err);
    }

    setAuthStep("login");
  }, [pendingPhone]);

  // ================================
  // WELCOME COMPLETE → Save user
  // ================================
  const handleWelcomeComplete = useCallback(() => {
    if (pendingUser) persistUser(pendingUser);
    setShowAuthFlow(false);
  }, [pendingUser, persistUser]);

  // ================================
  // PUSH REGISTRATION
  // ================================
  useEffect(() => {
    if (user?.id) {
      registerPushSubscription(user.id).catch(() => {});
    }
  }, [user]);

  // ================================
  // LOGOUT
  // ================================
  const handleLogout = () => {
    persistUser(null);
    setAuthStep("login");
    setShowAuthFlow(false);
  };

  // ================================
  // LOADING SCREEN
  // ================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Tractor className="w-12 h-12 text-green-600 animate-pulse" />
      </div>
    );
  }

  // ================================
  // LOGGED-IN USER → MAIN APP
  // ================================
  if (user) {
    return (
      <Router>
        <PageTransition keyId="main-app">
          <MainApp user={user} onLogout={handleLogout} onUserUpdate={persistUser} />
        </PageTransition>
      </Router>
    );
  }

  // ================================
  // HOW IT WORKS PAGE
  // ================================
  if (showHowItWorks) {
    return (
      <PageTransition keyId="how-it-works">
        <HowItWorks onBack={() => setShowHowItWorks(false)} />
      </PageTransition>
    );
  }

  // ================================
  // AUTH FLOW (Animated)
  // ================================
  if (showAuthFlow) {
    return (
      <Router>
        <PageTransition keyId={authStep}>
          <div className="min-h-screen flex items-center justify-center">
            {authStep === "login" && (
              <LoginForm
                onSwitchToRegister={() => setAuthStep("choose-role")}
                onLoginSuccess={handleLoginSuccess}
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

            {authStep === "splash" && (
              <SignupSuccessSplash onComplete={handleSplashComplete} />
            )}

            {authStep === "welcome" && pendingUser && (
              <WelcomeScreen user={pendingUser} onComplete={handleWelcomeComplete} />
            )}
          </div>
        </PageTransition>
      </Router>
    );
  }

  // ================================
  // LANDING PAGE
  // ================================
  return (
    <Router>
      <PageTransition keyId="landing">
        <LandingPage
          onLogin={() => {
            setAuthStep("login");
            setShowAuthFlow(true);
          }}
          onOpenSignupRole={() => {
            setAuthStep("choose-role");
            setShowAuthFlow(true);
          }}
          onSignupFarmer={() => {
            setAuthStep("signup-farmer");
            setShowAuthFlow(true);
          }}
          onSignupProvider={() => {
            setAuthStep("signup-provider");
            setShowAuthFlow(true);
          }}
          onOpenHowItWorks={() => setShowHowItWorks(true)}
        />
      </PageTransition>
    </Router>
  );
};

export default App;
