// Location: src/components/MainApp.tsx
// Purpose: Core navigation & logic handler with permanent profile completion

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import React, { useState, useEffect } from "react";
import { Navigation } from "./Navigation";
import { BottomNav } from "./BottomNav";
import { PageHeader } from "./PageHeader";

import { FarmerDashboard } from "./dashboards/FarmerDashboard";
import { ProviderDashboard } from "./dashboards/ProviderDashboard";
import { AdminDashboard } from "./dashboards/AdminDashboard";
import { AdminInviteGenerator } from "./admin/AdminInviteGenerator";

import { ProfilePage } from "./profile/ProfilePage";
import { FarmerProfileForm } from "./profile/FarmerProfileForm";
import { ProviderProfileForm } from "./profile/ProviderProfileForm";
import { UserProfile } from "./profile/UserProfile";

import { ServiceMap } from "./map/ServiceMap";
import { ServiceMarketplace } from "./marketplace/ServiceMarketplace";
import { UserReviews } from "./reviews/UserReviews";
import { HowItWorks } from "./HowItWorks";
import { normalizeUserProfile } from "../utils/profile";

import { BookingsPage } from "./bookings/BookingsPage";
import { WalletPage } from "./wallet/WalletPage";
import { AdminDisputesPage } from "./admin/AdminDisputesPage";
import { DisputesPage } from "./disputes/DisputesPage";

import DriverTrackingPage from "./tracking/DriverTrackingPage";
import LiveTrackingView from "./tracking/LiveTrackingView";
import { useAuth } from "../contexts/AuthContext";

interface MainAppProps {
  user: any;
  onLogout: () => void;
  onUserUpdate: (updatedUser: any) => Promise<void> | void;
}

export const MainApp: React.FC<MainAppProps> = ({ user, onLogout, onUserUpdate }) => {
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>(["dashboard"]);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [trackingSessionId, setTrackingSessionId] = useState<string | null>(null);
  const handleLogout = useCallback(() => {
    logout().catch((error) => {
      console.error("Failed to logout:", error);
    });
  }, [logout]);

  const applyUserUpdate = useCallback(
    (updater: (current: any | null) => any | null) => {
      setUser((current: any | null) => {
        const next = updater(current);
        return normalizeUserProfile(next ?? null);
      });
    },
    [setUser],
  );

  // ✅ Check profile completion status from session data
  useEffect(() => {
    if (!user || user.role === "admin") return;

    const checkProfileStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("profile_completed")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;
        const isCompleted = profileRow?.profile_completed ?? false;
        setShowProfileSetup(!isCompleted);
      } catch (err) {
        console.error("Profile check failed:", err);
      }
    };

    setShowProfileSetup(!user.profile_completed);
  }, [user]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const loadUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          applyUserUpdate((currentUser) => ({
            ...(currentUser ?? {}),
            ...data,
          }));
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };
    loadUserProfile();
  }, [applyUserUpdate, user?.id]);

  // ✅ Restore ongoing tracking sessions
  useEffect(() => {
    const sessionId = sessionStorage.getItem("pending_tracking_session");
    const type = sessionStorage.getItem("pending_tracking_type");

    if (sessionId && type) {
      if (type === "driver") navigateTo("driver-tracking", undefined, sessionId);
      else navigateTo("live-tracking", undefined, sessionId);

      setTimeout(() => {
        sessionStorage.removeItem("pending_tracking_session");
        sessionStorage.removeItem("pending_tracking_type");
      }, 1000);
    }
  }, []);

  // ✅ Update profile and mark completed
  const handleProfileUpdate = async (data: any) => {
    try {
      const targetUserId = user?.id ?? user?.user_id;

      if (!targetUserId) {
        throw new Error('Missing user identifier. Please sign in again.');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user-profile`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...data, user_id: targetUserId }),
        }

        const updatedProfile = await updateUserProfileFn({
          ...data,
          user_id: targetUserId,
        });

        let mergedProfile = updatedProfile;

      const profileResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-profile?id=${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      const profileResult = await profileResponse.json();

      if (!profileResponse.ok || !profileResult.success) {
        throw new Error(profileResult.error || "Failed to refresh profile");
      }

      onUserUpdate(
        normalizeUserProfile({
          ...user,
          ...profileResult.user,
        })
      );
      setShowProfileSetup(false);
      return result.user;
    } catch (error) {
      console.error("Profile update error:", error);
      throw error instanceof Error ? error : new Error("Failed to update profile");
    }
  };

  // 🧭 Page navigation handler
  const navigateTo = (view: string, providerId?: string, sessionId?: string) => {
    setNavigationHistory((prev) => [...prev, currentView]);
    setCurrentView(view);
    if (providerId) setSelectedProviderId(providerId);
    if (sessionId) setTrackingSessionId(sessionId);
  };

  // 🔙 Go back
  const navigateBack = () => {
    if (navigationHistory.length > 0) {
      const previousView = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory((prev) => prev.slice(0, -1));
      setCurrentView(previousView);
    } else {
      setCurrentView("dashboard");
    }
  };

  // 🧩 Render pages
  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        if (user.role === "farmer") return <FarmerDashboard onNavigate={navigateTo} />;
        if (user.role === "provider") return <ProviderDashboard onNavigate={navigateTo} />;
        if (user.role === "admin")
          return (
            <>
              <AdminDashboard />
              <AdminInviteGenerator />
            </>
          );
        return <FarmerDashboard onNavigate={navigateTo} />;

      case "profile":
        return <ProfilePage user={user} onBack={navigateBack} onProfileUpdate={handleProfileUpdate} />;

      case "map":
        return (
          <>
            <PageHeader
              title="Service Map"
              subtitle="Find nearby service providers"
              onBack={navigateBack}
            />
            <ServiceMap onProviderSelect={(provider) => navigateTo("provider-profile", provider.id)} />
          </>
        );

      case "marketplace":
        return (
          <>
            <PageHeader
              title="Service Marketplace"
              subtitle="Browse and book agricultural services"
              onBack={navigateBack}
            />
            <ServiceMarketplace />
          </>
        );

      case "provider-profile":
        return (
          <>
            <PageHeader
              title="Provider Profile"
              subtitle="View provider details and reviews"
              onBack={navigateBack}
            />
            <UserProfile userId={selectedProviderId || ""} isOwnProfile={false} />
          </>
        );

      case "bookings":
      case "requests":
        return <BookingsPage userId={user.id} userRole={user.role} onNavigate={navigateTo} />;

      case "wallet":
        return (
          <>
            <PageHeader
              title="My Wallet"
              subtitle="Manage your funds and transactions"
              onBack={navigateBack}
            />
            <WalletPage userId={user.id} />
          </>
        );

      case "reviews":
        return (
          <>
            <PageHeader
              title="My Reviews"
              subtitle="View reviews you've received"
              onBack={navigateBack}
            />
            <UserReviews userId={user.id} />
          </>
        );

      case "how-it-works":
        return <HowItWorks onBack={navigateBack} />;

      case "disputes":
        if (user.role === "admin") {
          return (
            <>
              <PageHeader
                title="Dispute Management"
                subtitle="Review and resolve user disputes"
                onBack={navigateBack}
              />
              <AdminDisputesPage adminId={user.id} />
            </>
          );
        }
        return <DisputesPage userId={user.id} userRole={user.role} onBack={navigateBack} />;

      // 🚗 Driver tracking
      case "driver-tracking":
        return <DriverTrackingPage sessionId={trackingSessionId || ""} onComplete={navigateBack} />;

      // 🌍 Live tracking view
      case "live-tracking":
        return (
          <>
            <PageHeader
              title="Live Tracking"
              subtitle="Track driver location in real-time"
              onBack={navigateBack}
            />
            <LiveTrackingView sessionId={trackingSessionId || ""} onBack={navigateBack} />
          </>
        );

      default:
        return <FarmerDashboard onNavigate={navigateTo} />;
    }
  };

  // 🧑🏾‍🌾 Show profile setup screen once
  if (user && showProfileSetup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          {user.role === "farmer" ? (
            <FarmerProfileForm user={user} onSave={handleProfileUpdate} isFirstTime />
          ) : (
            <ProviderProfileForm user={user} onSave={handleProfileUpdate} isFirstTime />
          )}
        </div>
      </div>
    );
  }

  // 🏠 Default app shell
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navigation user={user} onLogout={handleLogout} onNavigate={navigateTo} />
      {renderContent()}
      <BottomNav currentView={currentView} onNavigate={navigateTo} role={user.role} />
    </div>
  );
};

export default MainApp;
