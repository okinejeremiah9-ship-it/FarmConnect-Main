// src/components/MainApp.tsx

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import PageTransition from "./ui/PageTransition";

// Navigation
import { Navigation } from "./Navigation";
import { BottomNav } from "./BottomNav";
import { PageHeader } from "./PageHeader";

// WRAPPERS
import { FarmerDashboardWrapper } from "./dashboards/FarmerDashboardWrapper";
import { ProviderDashboardWrapper } from "./dashboards/ProviderDashboardWrapper";
import { AdminDashboardWrapper } from "./dashboards/AdminDashboardWrapper";

// Profile Pages
import { ProfilePage } from "./profile/ProfilePage";
import { FarmerProfileForm } from "./profile/FarmerProfileForm";
import { ProviderProfileForm } from "./profile/ProviderProfileForm";
import { UserProfile } from "./profile/UserProfile";

// Core Features
import { ServiceMap } from "./map/ServiceMap";
import { ServiceMarketplace } from "./marketplace/ServiceMarketplace";
import { UserReviews } from "./reviews/UserReviews";
import { HowItWorks } from "./HowItWorks";
import { normalizeUserProfile } from "../utils/profile";

import MessagesPage from "./chat/MessagesPage";
import ChatScreen from "./chat/ChatScreen";

import { BookingsPage } from "./bookings/BookingsPage";
import { WalletPage } from "./wallet/WalletPage";
import { AdminDisputesPage } from "./admin/AdminDisputesPage";
import { DisputesPage } from "./disputes/DisputesPage";

import DriverTrackingPage from "./tracking/DriverTrackingPage";
import LiveTrackingView from "./tracking/LiveTrackingView";

interface MainAppProps {
  user: any;
  onLogout: () => void;
  onUserUpdate: (updatedUser: any) => void;
}

export const MainApp: React.FC<MainAppProps> = ({
  user,
  onLogout,
  onUserUpdate,
}) => {
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    null
  );

  // ⭐ tracking
  const [trackingSessionId, setTrackingSessionId] = useState<string | null>(
    null
  );

  const [navigationHistory, setNavigationHistory] = useState<string[]>([
    "dashboard",
  ]);

  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // ---------------------------------------------------
  // PROFILE COMPLETION CHECK
  // ---------------------------------------------------
  useEffect(() => {
    if (!user || user.role === "admin") return;

    supabase
      .from("users")
      .select("profile_completed")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setShowProfileSetup(!(data?.profile_completed ?? false));
      });
  }, [user]);

  // ---------------------------------------------------
  // UNIVERSAL NAVIGATOR
  // ---------------------------------------------------
  const navigateTo = (
    view: string,
    providerId?: string,
    sessionId?: string
  ) => {
    setNavigationHistory((prev) => [...prev, currentView]);
    setCurrentView(view);

    if (providerId) setSelectedProviderId(providerId);
    if (sessionId) setTrackingSessionId(sessionId);
  };

  const navigateBack = () => {
    if (navigationHistory.length > 0) {
      const prev = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory((prev) => prev.slice(0, -1));
      setCurrentView(prev);
    } else {
      setCurrentView("dashboard");
    }
  };

  // ---------------------------------------------------
  // ⭐ IMPORTANT: new helpers exposed to dashboard
  // ---------------------------------------------------
  const goToDriverTracking = (sessionId: string) => {
    navigateTo("driver-tracking", undefined, sessionId);
  };

  const goToLiveTracking = (sessionId: string) => {
    navigateTo("live-tracking", undefined, sessionId);
  };

  const goToTrackingMap = (bookingId: string) => {
    navigateTo("tracking-map", undefined, bookingId);
  };

  // ---------------------------------------------------
  // PROFILE UPDATE LOGIC
  // ---------------------------------------------------
  const handleProfileUpdate = async (data: any) => {
    try {
      const userId = user.id;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user-profile`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...data, user_id: userId }),
        }
      );

      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      const profileRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-profile?id=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      const profileData = await profileRes.json();
      const merged = normalizeUserProfile({ ...user, ...profileData.user });

      onUserUpdate(merged);
      setShowProfileSetup(false);
    } catch (err) {
      console.error("Profile update error:", err);
    }
  };

  // ---------------------------------------------------
  // MAIN CONTENT
  // ---------------------------------------------------
  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        if (user.role === "farmer")
          return (
            <FarmerDashboardWrapper
              onNavigate={navigateTo}
              goToLiveTracking={goToLiveTracking}
            />
          );

        if (user.role === "provider")
          return (
            <ProviderDashboardWrapper
              onNavigate={navigateTo}
              goToDriverTracking={goToDriverTracking}
            />
          );

        return <AdminDashboardWrapper onNavigate={navigateTo} />;

      case "profile":
        return (
          <PageTransition>
            <ProfilePage
              user={user}
              onBack={navigateBack}
              onProfileUpdate={handleProfileUpdate}
            />
          </PageTransition>
        );

      case "map":
        return (
          <PageTransition>
            <PageHeader
              title="Service Map"
              subtitle="Find reliable providers"
              onBack={navigateBack}
            />
            <ServiceMap
              onProviderSelect={(p) => navigateTo("provider-profile", p.id)}
            />
          </PageTransition>
        );

      case "marketplace":
        return (
          <PageTransition>
            <PageHeader
              title="Marketplace"
              subtitle="Browse Services"
              onBack={navigateBack}
            />
            <ServiceMarketplace onNavigate={navigateTo} />
          </PageTransition>
        );

      case "messages":
        return (
          <PageTransition>
            <MessagesPage
              userId={user.id}
              onBack={navigateBack}
              onOpenChat={(otherId) => {
                setSelectedProviderId(otherId);
                navigateTo("chat");
              }}
            />
          </PageTransition>
        );

      case "provider-profile":
        return (
          <PageTransition>
            <PageHeader title="Provider" subtitle="Service Details" onBack={navigateBack} />
            <UserProfile userId={selectedProviderId!} isOwnProfile={false} />
          </PageTransition>
        );

      case "chat":
        return (
          <PageTransition>
            <ChatScreen
              userId={user.id}
              otherUserId={selectedProviderId!}
              onBack={navigateBack}
            />
          </PageTransition>
        );

      case "bookings":
        return (
          <PageTransition>
            <BookingsPage
              userId={user.id}
              userRole={user.role}
              onNavigate={navigateTo}
              goToLiveTracking={goToLiveTracking}
            />
          </PageTransition>
        );

      case "wallet":
        return (
          <PageTransition>
            <PageHeader title="Wallet" subtitle="Escrow & Payments" />
            <WalletPage userId={user.id} />
          </PageTransition>
        );

      case "reviews":
        return (
          <PageTransition>
            <PageHeader title="Reviews" subtitle="See feedback" />
            <UserReviews userId={user.id} />
          </PageTransition>
        );

      case "how-it-works":
        return (
          <PageTransition>
            <HowItWorks onBack={navigateBack} />
          </PageTransition>
        );

      case "disputes":
        return (
          <PageTransition>
            {user.role === "admin" ? (
              <AdminDisputesPage adminId={user.id} />
            ) : (
              <DisputesPage
                userId={user.id}
                userRole={user.role}
                onBack={navigateBack}
              />
            )}
          </PageTransition>
        );

      // ⭐ UPDATED — tracking-map now loads LiveTrackingView instead of ServiceMap
      case "tracking-map":
        return (
          <PageTransition>
            <LiveTrackingView
              sessionId={trackingSessionId!}
              onBack={navigateBack}
            />
          </PageTransition>
        );

      case "driver-tracking":
        return (
          <PageTransition>
            <DriverTrackingPage
              sessionId={trackingSessionId!}
              onComplete={navigateBack}
            />
          </PageTransition>
        );

      case "live-tracking":
        return (
          <PageTransition>
            <PageHeader
              title="Live Tracking"
              subtitle="Real-time movement"
              onBack={navigateBack}
            />
            <LiveTrackingView
              sessionId={trackingSessionId!}
              onBack={navigateBack}
            />
          </PageTransition>
        );

      default:
        return <FarmerDashboardWrapper onNavigate={navigateTo} />;
    }
  };

  // ---------------------------------------------------
  // FIRST-TIME PROFILE SETUP
  // ---------------------------------------------------
  if (showProfileSetup) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            {user.role === "farmer" ? (
              <FarmerProfileForm
                user={user}
                onSave={handleProfileUpdate}
                isFirstTime
              />
            ) : (
              <ProviderProfileForm
                user={user}
                onSave={handleProfileUpdate}
                isFirstTime
              />
            )}
          </div>
        </div>
      </PageTransition>
    );
  }

  // ---------------------------------------------------
  // MAIN APP UI
  // ---------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navigation user={user} onLogout={onLogout} onNavigate={navigateTo} />

      <PageTransition keyId={currentView}>{renderContent()}</PageTransition>

      <BottomNav
        currentView={currentView}
        onNavigate={navigateTo}
        role={user.role}
      />
    </div>
  );
};

export default MainApp;
