// src/components/dashboards/ProviderDashboardWrapper.tsx
import React from "react";
import { useUserSession } from "../../contexts/UserSessionContext";
import { ProviderDashboard } from "./ProviderDashboard";
import { Loader2 } from "lucide-react";

export const ProviderDashboardWrapper = ({ onNavigate }) => {
  const { user, initializing } = useUserSession();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading your dashboard…
      </div>
    );
  }

  if (!user || user.role !== "provider") {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        You must be logged in.
      </div>
    );
  }

  return <ProviderDashboard onNavigate={onNavigate} />;
};
