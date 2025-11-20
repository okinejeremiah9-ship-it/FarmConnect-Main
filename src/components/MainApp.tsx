// src/components/MainApp.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

import PageTransition from "./ui/PageTransition";

// Navigation & Layout
import { Navigation } from "./Navigation";
import { BottomNav } from "./BottomNav";
import { PageHeader } from "./PageHeader";

// Dashboards
import { FarmerDashboard } from "./dashboards/FarmerDashboard";
import { ProviderDashboard } from "./dashboards/ProviderDashboard";
import { AdminDashboard } from "./dashboards/AdminDashboard";
import { AdminInviteGenerator } from "./admin/AdminInviteGenerator";

// Profile
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

import { BookingsPage } from "./bookings/BookingsPage";
import { WalletPage } from "./wallet/WalletPage";
import { AdminDisputesPage } from "./admin/AdminDisputesPage";
import { DisputesPage } from "./disputes/DisputesPage";

import DriverTrackingPage from "./tracking/DriverTrackingPage";
import LiveTrackingView from "./tracking/LiveTrackingView";

import ChatScreen from "./chat/ChatScreen";

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
  const [navigationHistory, setNavigationHistory] = useState<string[]>([
    "dashboard",
  ]);

  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [trackingSessionId, setTrackingSessionId] = useState<string | null>(
    null
  );

  // ----------------------------
  // Profile check
  // ----------------------------
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

  // ----------------------------
  // Navigation
  // ----------------------------
  const navigateTo = (view: string, providerId?: string, sessionId?: string) => {
    setNavigationHistory((p) => [...p, currentView]);
    setCurrentView(view);
    if (providerId) setSelectedProviderId(providerId);
    if (sessionId) setTrackingSessionId(sessionId);
  };

  const navigateBack = () => {
    if (navigationHistory.length > 0) {
      const prev = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory((p) => p.slice(0, -1));
      setCurrentView(prev);
    } else {
      setCurrentView("dashboard");
    }
  };

  // ----------------------------
  // Profile Update
  // ----------------------------
  const handleProfileUpdate = async (data: any) => {
    try {
      const targetUserId = user.id;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user-profile`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...data, user_id: targetUserId }),
        }
      );

      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      const profileResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-profile?id=${targetUserId}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );
      const profileData = await profileResponse.json();

      const merged = normalizeUserProfile({
        ...user,
        ...profileData.user,
      });

      onUserUpdate(merged);
      setShowProfileSetup(false);
    } catch (e) {
      console.error("Profile update error:", e);
    }
  };

  // ----------------------------
  // Render Views
  // ----------------------------
  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        if (user.role === "farmer")
          return <FarmerDashboard onNavigate={navigateTo} />;
        if (user.role === "provider")
          return <ProviderDashboard onNavigate={navigateTo} />;
        return (
          <>
            <AdminDashboard />
            <AdminInviteGenerator />
          </>
        );

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
              subtitle="Find reliable providers around you"
              onBack={navigateBack}
            />
            <ServiceMap
              onProviderSelect={(provider) =>
                navigateTo("provider-profile", provider.id)
              }
            />
          </PageTransition>
        );

      case "marketplace":
        return (
          <PageTransition>
            <PageHeader
              title="Marketplace"
              subtitle="Browse agricultural services"
              onBack={navigateBack}
            />
            <ServiceMarketplace onNavigate={navigateTo} />
          </PageTransition>
        );

      case "provider-profile":
        return (
          <PageTransition>
            <PageHeader
              title="Provider Profile"
              subtitle="Service details and reviews"
              onBack={navigateBack}
            />
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
            />
          </PageTransition>
        );

      case "wallet":
        return (
          <PageTransition>
            <PageHeader title="Wallet" subtitle="Manage escrow & payments" />
            <WalletPage userId={user.id} />
          </PageTransition>
        );

      case "reviews":
        return (
          <PageTransition>
            <PageHeader title="Reviews" subtitle="See what others say" />
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
              <>
                <PageHeader title="Disputes" />
                <AdminDisputesPage adminId={user.id} />
              </>
            ) : (
              <DisputesPage
                userId={user.id}
                userRole={user.role}
                onBack={navigateBack}
              />
            )}
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
        return <FarmerDashboard onNavigate={navigateTo} />;
    }
  };

  // ----------------------------
  // First-time setup form
  // ----------------------------
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
