// src/components/dashboards/AdminDashboardWrapper.tsx
import React from "react";
import { useUserSession } from "../../contexts/UserSessionContext";
import { AdminDashboard } from "./AdminDashboard";
import { Loader2 } from "lucide-react";

export const AdminDashboardWrapper = ({ onNavigate }) => {
  const { user, initializing } = useUserSession();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading admin tools…
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Admin access only.
      </div>
    );
  }

  return <AdminDashboard onNavigate={onNavigate} />;
};
