import React, { useState } from 'react';
import { Tractor, LogOut, User, Menu, X, AlertTriangle, Wallet, FileText, BookOpen } from 'lucide-react';

interface NavigationProps {
  user: any;
  onLogout: () => void;
  onNavigate?: (page: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ user, onLogout, onNavigate }) => {
  const [showMenu, setShowMenu] = useState(false);

  const menuItems = [
    { label: 'Dashboard', icon: Tractor, page: 'dashboard' },
    { label: 'Profile', icon: User, page: 'profile' },
    { label: user?.role === 'farmer' ? 'My Bookings' : 'My Services', icon: FileText, page: 'bookings' },
    { label: 'Wallet', icon: Wallet, page: 'wallet' },
    { label: 'Disputes', icon: AlertTriangle, page: 'disputes' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Tractor className="h-8 w-8 text-green-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">FarmConnect</span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  onClick={() => onNavigate?.(item.page)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="hidden sm:flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm">Logout</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="md:hidden text-gray-600 hover:text-gray-900"
            >
              {showMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMenu && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-4 py-3 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  onClick={() => {
                    onNavigate?.(item.page);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center space-x-2 px-3 py-2 text-gray-700">
                <User className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};