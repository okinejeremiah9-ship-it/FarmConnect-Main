// Updated BottomNav.tsx with Messages button
import React, { useState } from "react";
import {
  Home,
  Map,
  User,
  FileText,
  Wallet,
  Menu,
  X,
  Shield,
  Star,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  role?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  role,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const mainNavItems = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "messages", label: "Messages", icon: MessageSquare }, // ✅ Messages main tab
  ];

  const menuItems = [
    { id: "map", label: "Service Map", icon: Map, roles: ["farmer", "provider", "admin"] },
    { id: "bookings", label: "My Bookings", icon: FileText, roles: ["farmer", "provider"] }, // ✅ match MainApp "bookings"
    { id: "wallet", label: "My Wallet", icon: Wallet, roles: ["farmer", "provider", "admin"] },
    { id: "reviews", label: "My Reviews", icon: Star, roles: ["farmer", "provider"] },
    { id: "disputes", label: "Disputes", icon: Shield, roles: ["admin"] },
    { id: "marketplace", label: "Browse Services", icon: MessageSquare, roles: ["farmer"] },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || !role || item.roles.includes(role)
  );

  const handleMenuItemClick = (viewId: string) => {
    setShowMenu(false);
    onNavigate(viewId);
  };

  return (
    <>
      {/* Menu Overlay */}
      {showMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Menu Panel */}
      {showMenu && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Menu</h3>
              <button
                onClick={() => setShowMenu(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      isActive
                        ? "bg-green-100 text-green-700"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-2">
          <div className="flex justify-around items-center h-16">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                    isActive
                      ? "text-green-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? "stroke-2" : ""}`} />
                  <span
                    className={`text-xs mt-1 ${
                      isActive ? "font-semibold" : ""
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}

            {/* Menu Button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                showMenu ? "text-green-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Menu className={`w-6 h-6 ${showMenu ? "stroke-2" : ""}`} />
              <span
                className={`text-xs mt-1 ${
                  showMenu ? "font-semibold" : ""
                }`}
              >
                Menu
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
