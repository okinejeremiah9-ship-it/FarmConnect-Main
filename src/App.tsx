// --- CLEAN, EMAIL-BASED AUTH FLOW + REAL SUPABASE SESSION --- //

import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom"; // ⭐ ADDED useLocation
import { Tractor } from "lucide-react";

import { supabase } from "./lib/supabase";
import { AdminSignupPage } from "./components/auth/AdminSignupPage";

import { LoginForm } from "./components/auth/LoginForm";
import { FarmerSignupForm } from "./components/auth/FarmerSignupForm";
import { ProviderSignupForm } from "./components/auth/ProviderSignupForm";
import { SignupRoleSelector } from "./components/auth/SignupRoleSelector";
import { SignupSuccessSplash } from "./components/auth/SignupSuccessSplash";
import { WelcomeScreen } from "./components/auth/WelcomeScreen";

import { MainApp } from "./components/MainApp";
import { LandingPage } from "./components/LandingPage";
import { HowItWorks } from "./components/HowItWorks";

import PageTransition from "./components/ui/PageTransition";
import { normalizeUserProfile } from "./utils/profile";
import { registerPushSubscription } from "./lib/notifications";

type AuthStep =
  | "login"
  | "choose-role"
  | "signup-farmer"
  | "signup-provider"
  | "splash"
  | "welcome";

// ============================================================
// ⭐⭐⭐ THIS IS THE ONLY UPDATE YOU REQUESTED ⭐⭐⭐
// ============================================================

const AdminSignupRouter = ({ children }: any) => {
  const location = useLocation();

  if (location.pathname === "/admin-signup") {
    return (
      <PageTransition keyId="admin-signup">
        <AdminSignupPage />
      </PageTransition>
    );
  }

  return children;
};

// ============================================================
// ⭐⭐⭐ END OF UPDATE ⭐⭐⭐
// ============================================================


const App: React.FC = () => {
  // ================================
  // GLOBAL AUTH / PROFILE STATE
  // ================================
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [authStep, setAuthStep] = useState<AuthStep>("login");
  const [showAuthFlow, setShowAuthFlow] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingUser, setPendingUser] = useState<any | null>(null);

  // ================================
  // PERSIST USER
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

  // ================================
  // FETCH PROFILE
  // ================================
  const refreshProfile = useCallback(async (id: string) => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-profile?id=${id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const json = await response.json();
    if (!json.success) {
      throw new Error(json.error || "Failed to fetch user profile");
    }

    return normalizeUserProfile(json.user);
  }, []);

  // ================================
  // INITIAL AUTH BOOTSTRAP
  // ================================
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const saved = localStorage.getItem("user");
      if (saved && mounted) {
        try {
          setUser(JSON.parse(saved));
        } catch {
          localStorage.removeItem("user");
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      setSession(session ?? null);

      if (session?.user?.id) {
        try {
          const refreshed = await refreshProfile(session.user.id);
          persistUser(refreshed);
        } catch {}
      } else {
        persistUser(null);
      }

      setLoading(false);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;

      setSession(newSession ?? null);

      if (newSession?.user?.id) {
        try {
          const profile = await refreshProfile(newSession.user.id);
          persistUser(profile);
        } catch {}
      } else {
        persistUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshProfile, persistUser]);

  // ================================
  // LOGIN SUCCESS
  // ================================
  const handleLoginSuccess = useCallback(async () => {
    try {
      const {
        data: { session: liveSession },
      } = await supabase.auth.getSession();

      if (liveSession?.user?.id) {
        const refreshed = await refreshProfile(liveSession.user.id);
        persistUser(refreshed);
      }
    } catch {}

    setShowAuthFlow(false);
  }, [refreshProfile, persistUser]);

  // ================================
  // SIGNUP SUCCESS
  // ================================
  const handleSignupSuccess = useCallback((email: string) => {
    setPendingEmail(email);
    setPendingUser(null);
    setAuthStep("splash");
    setShowAuthFlow(true);
  }, []);

  // ================================
  // SPLASH COMPLETE
  // ================================
  const handleSplashComplete = useCallback(async () => {
    try {
      const {
        data: { session: liveSession },
      } = await supabase.auth.getSession();

      if (liveSession?.user?.id) {
        const profile = await refreshProfile(liveSession.user.id);
        setPendingUser(profile);
        setAuthStep("welcome");
        return;
      }
    } catch {}

    setAuthStep("login");
  }, [refreshProfile]);

  // ================================
  // WELCOME COMPLETE
  // ================================
  const handleWelcomeComplete = useCallback(() => {
    if (pendingUser) persistUser(pendingUser);
    setShowAuthFlow(false);
  }, [pendingUser, persistUser]);

  // ================================
  // PUSH NOTIFICATIONS
  // ================================
  useEffect(() => {
    if (user?.id) {
      registerPushSubscription(user.id).catch(() => {});
    }
  }, [user]);

  // ================================
  // LOGOUT
  // ================================
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
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
  // USER LOGGED IN → MAIN APP
  // ================================
  if (user) {
    return (
      <Router>
        <AdminSignupRouter>
          <PageTransition keyId="main-app">
            <MainApp
              user={user}
              onLogout={handleLogout}
              onUserUpdate={persistUser}
            />
          </PageTransition>
        </AdminSignupRouter>
      </Router>
    );
  }

  // ================================
  // HOW IT WORKS PAGE
  // ================================
  if (showHowItWorks) {
    return (
      <Router>
        <AdminSignupRouter>
          <PageTransition keyId="how-it-works">
            <HowItWorks onBack={() => setShowHowItWorks(false)} />
          </PageTransition>
        </AdminSignupRouter>
      </Router>
    );
  }

  // ================================
  // AUTH FLOW
  // ================================
  if (showAuthFlow) {
    return (
      <Router>
        <AdminSignupRouter>
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
                <WelcomeScreen
                  user={pendingUser}
                  onComplete={handleWelcomeComplete}
                />
              )}
            </div>
          </PageTransition>
        </AdminSignupRouter>
      </Router>
    );
  }

  // ================================
  // LANDING PAGE
  // ================================
  return (
    <Router>
      <AdminSignupRouter>
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
      </AdminSignupRouter>
    </Router>
  );
};

export default App;
