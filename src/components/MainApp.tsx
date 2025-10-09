import React, { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { BottomNav } from './BottomNav';
import { PageHeader } from './PageHeader';
import { FarmerDashboard } from './dashboards/FarmerDashboard';
import { ProviderDashboard } from './dashboards/ProviderDashboard';
import { AdminDashboard } from './dashboards/AdminDashboard';
import { AdminInviteGenerator } from './admin/AdminInviteGenerator';
import { UserProfile } from './profile/UserProfile';
import { ProfilePage } from './profile/ProfilePage';
import { FarmerProfileForm } from './profile/FarmerProfileForm';
import { ProviderProfileForm } from './profile/ProviderProfileForm';
import { ServiceMap } from './map/ServiceMap';
import { ServiceMarketplace } from './marketplace/ServiceMarketplace';
import { UserReviews } from './reviews/UserReviews';
import { HowItWorks } from './HowItWorks';
import { BookingsPage } from './bookings/BookingsPage';
import { WalletPage } from './wallet/WalletPage';
import { AdminDisputesPage } from './admin/AdminDisputesPage';
import { DisputesPage } from './disputes/DisputesPage';

interface MainAppProps {
  user: any;
  onLogout: () => void;
  onUserUpdate: (updatedUser: any) => void;
}

export const MainApp: React.FC<MainAppProps> = ({ user, onLogout, onUserUpdate }) => {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['dashboard']);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Check if profile needs to be completed on first login
  useEffect(() => {
    if (user && !user.profile_completed && user.role !== 'admin') {
      setShowProfileSetup(true);
    }
  }, [user]);

  const handleProfileUpdate = async (data: any) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          ...data,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onUserUpdate({ ...user, ...data });
        setShowProfileSetup(false);
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const navigateTo = (view: string, providerId?: string) => {
    setNavigationHistory(prev => [...prev, currentView]);
    setCurrentView(view);
    if (providerId) {
      setSelectedProviderId(providerId);
    }
  };

  const navigateBack = () => {
    if (navigationHistory.length > 0) {
      const previousView = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, -1));
      setCurrentView(previousView);
    } else {
      setCurrentView('dashboard');
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        if (user.role === 'farmer') {
          return <FarmerDashboard onNavigate={navigateTo} />;
        }
        if (user.role === 'provider') {
          return <ProviderDashboard onNavigate={navigateTo} />;
        }
        if (user.role === 'admin') {
          return (
            <>
              <AdminDashboard />
              <AdminInviteGenerator />
            </>
          );
        }
        return <FarmerDashboard onNavigate={navigateTo} />;

      case 'profile':
        return (
          <ProfilePage
            user={user}
            onBack={navigateBack}
            onProfileUpdate={handleProfileUpdate}
          />
        );

      case 'map':
        return (
          <>
            <PageHeader
              title="Service Map"
              subtitle="Find nearby service providers"
              onBack={navigateBack}
            />
            <ServiceMap
              onProviderSelect={(provider) => navigateTo('provider-profile', provider.id)}
            />
          </>
        );

      case 'marketplace':
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

      case 'provider-profile':
        return (
          <>
            <PageHeader
              title="Provider Profile"
              subtitle="View provider details and reviews"
              onBack={navigateBack}
            />
            <UserProfile userId={selectedProviderId || ''} isOwnProfile={false} />
          </>
        );

      case 'bookings':
      case 'requests':
        return (
          <BookingsPage userId={user.id} userRole={user.role} onNavigate={navigateTo} />
        );

      case 'wallet':
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

      case 'reviews':
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

      case 'how-it-works':
        return <HowItWorks onBack={navigateBack} />;

      case 'disputes':
        if (user.role === 'admin') {
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
        return (
          <DisputesPage
            userId={user.id}
            userRole={user.role}
            onBack={navigateBack}
          />
        );

      default:
        return <FarmerDashboard onNavigate={navigateTo} />;
    }
  };

  // Show profile setup screen if profile not completed
  if (showProfileSetup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          {user.role === 'farmer' ? (
            <FarmerProfileForm
              user={user}
              onSave={handleProfileUpdate}
              isFirstTime={true}
            />
          ) : (
            <ProviderProfileForm
              user={user}
              onSave={handleProfileUpdate}
              isFirstTime={true}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navigation user={user} onLogout={onLogout} onNavigate={navigateTo} />
      {renderContent()}
      <BottomNav
        currentView={currentView}
        onNavigate={navigateTo}
        role={user.role}
      />
    </div>
  );
};
