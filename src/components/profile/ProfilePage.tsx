import React, { useState, useEffect, useCallback } from 'react';
import { FarmerProfileForm } from './FarmerProfileForm';
import { ProviderProfileForm } from './ProviderProfileForm';
import { UserReviews } from '../reviews/UserReviews';
import { ArrowLeft, Edit, Star, MapPin, Mail, Phone, User as UserIcon } from 'lucide-react';
import { useUserSession } from '../../contexts/UserSessionContext';

interface ProfilePageProps {
  user: any;
  onBack: () => void;
  onProfileUpdate: (data: any) => Promise<any>;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onBack, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(user);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(!user);
  const [profileError, setProfileError] = useState<string | null>(null);
  const { user: sessionUser, setUser: persistUser } = useUserSession();

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setLoadingProfile(true);
    setProfileError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-profile?id=${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load profile');
      }

      const mergedProfile = { ...(sessionUser ?? {}), ...data.user };
      setProfile(mergedProfile);
      persistUser(mergedProfile);
    } catch (error) {
      console.error('Failed to fetch profile details:', error);
      setProfileError(error instanceof Error ? error.message : 'Unable to load profile');
    } finally {
      setLoadingProfile(false);
    }
    }, [user?.id, sessionUser, persistUser]);

  useEffect(() => {
    if (user?.id) {
      setProfile(user);
      void fetchProfile();
    }
  }, [user, fetchProfile]);

  const handleSave = async (data: any) => {
    try {
      setSaving(true);
      const updatedProfile = await onProfileUpdate(data);
      if (updatedProfile) {
        setProfile(updatedProfile);
        persistUser(updatedProfile);
      } else {
        await fetchProfile();
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const displayUser = profile || user;
  if (displayUser.role === 'provider' && !displayUser.profile_completed) {
  return (
    <ProviderProfileForm
      user={displayUser}
      isFirstTime={true}
      onSave={handleSave}
    />
  );
}


  if (isEditing && displayUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {displayUser.role === 'farmer' ? (
          <FarmerProfileForm
            user={displayUser}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            saving={saving}
          />
        ) : (
          <ProviderProfileForm
            user={displayUser}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            saving={saving}
          />
        )}
      </div>
    );
  }

  if (loadingProfile && !displayUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile not found</h2>
          <p className="text-gray-600">The user profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Dashboard
      </button>

      {profileError && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          {profileError}. Showing the latest available profile details.
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-green-500 to-blue-500"></div>
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-16 mb-4">
              <div className="flex items-end space-x-4">
                <div className="w-32 h-32 bg-white border-4 border-white rounded-full flex items-center justify-center shadow-lg">
                  {displayUser.profile_pic ? (
                    <img
                      src={displayUser.profile_pic}
                      alt={displayUser.name}
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <div className="pb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {displayUser.role === 'provider' && displayUser.business_name
                      ? displayUser.business_name
                      : displayUser.name}
                  </h1>
                  {displayUser.role === 'provider' && displayUser.business_name && (
                    <p className="text-gray-600">{displayUser.name}</p>
                  )}
                  <div className="flex items-center mt-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      {displayUser.role.charAt(0).toUpperCase() + displayUser.role.slice(1)}
                    </span>
                    {displayUser.rating > 0 && (
                      <div className="ml-3 flex items-center">
                        <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                        <span className="font-semibold text-gray-900">{displayUser.rating.toFixed(1)}</span>
                        <span className="text-gray-600 ml-1">({displayUser.total_reviews} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              {displayUser.phone && (
                <div className="flex items-center text-gray-700">
                  <Phone className="w-5 h-5 mr-3 text-gray-400" />
                  <span>{displayUser.phone}</span>
                </div>
              )}
              {displayUser.email && (
                <div className="flex items-center text-gray-700">
                  <Mail className="w-5 h-5 mr-3 text-gray-400" />
                  <span>{displayUser.email}</span>
                </div>
              )}
              {displayUser.address && (
                <div className="flex items-start text-gray-700">
                  <MapPin className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                  <span>{displayUser.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Role-Specific Information */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {displayUser.role === 'farmer' ? 'Farm Information' : 'Service Information'}
            </h2>

            {displayUser.role === 'farmer' ? (
              <div className="space-y-4">
                {displayUser.farm_size && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Farm Size</p>
                    <p className="text-lg text-gray-900">{displayUser.farm_size}</p>
                  </div>
                )}
                {displayUser.crop_types && displayUser.crop_types.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Crop Types</p>
                    <div className="flex flex-wrap gap-2">
                      {displayUser.crop_types.map((crop: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {crop}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {displayUser.num_workers !== null && displayUser.num_workers !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Number of Workers</p>
                    <p className="text-lg text-gray-900">{displayUser.num_workers}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {displayUser.service_categories && displayUser.service_categories.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Service Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {displayUser.service_categories.map((category: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {displayUser.service_description && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Description</p>
                    <p className="text-gray-700 leading-relaxed">{displayUser.service_description}</p>
                  </div>
                )}
                {displayUser.service_availability && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Availability</p>
                    <p className="text-gray-700">{displayUser.service_availability}</p>
                  </div>
                )}
                {displayUser.pricing_info && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pricing Information</p>
                    <p className="text-gray-700">{displayUser.pricing_info}</p>
                  </div>
                )}
                {displayUser.equipment_list && displayUser.equipment_list.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Equipment List</p>
                    <div className="flex flex-wrap gap-2">
                      {displayUser.equipment_list.map((equipment: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                        >
                          {equipment}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {displayUser.years_experience !== null && displayUser.years_experience !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Years of Experience</p>
                    <p className="text-lg text-gray-900">{displayUser.years_experience}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        {displayUser.id && (
          <div className="bg-white rounded-xl shadow-md">
            <UserReviews userId={displayUser.id} userName={displayUser.name} />
          </div>
        )}
      </div>
    </div>
  );
};
