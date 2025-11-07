import React, { useState } from 'react';
import { FarmerProfileForm } from './FarmerProfileForm';
import { ProviderProfileForm } from './ProviderProfileForm';
import { UserReviews } from '../reviews/UserReviews';
import { ArrowLeft, Edit, Star, MapPin, Mail, Phone, User as UserIcon } from 'lucide-react';

interface ProfilePageProps {
  user: any;
  onBack: () => void;
  onProfileUpdate: (data: any) => Promise<void>;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onBack, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (data: any) => {
    try {
      setSaving(true);
      await onProfileUpdate(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === 'farmer' ? (
          <FarmerProfileForm
            user={user}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            saving={saving}
          />
        ) : (
          <ProviderProfileForm
            user={user}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            saving={saving}
          />
        )}
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

      <div className="space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-green-500 to-blue-500"></div>
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-16 mb-4">
              <div className="flex items-end space-x-4">
                <div className="w-32 h-32 bg-white border-4 border-white rounded-full flex items-center justify-center shadow-lg">
                  {user.profile_pic ? (
                    <img
                      src={user.profile_pic}
                      alt={user.name}
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <div className="pb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {user.role === 'provider' && user.business_name ? user.business_name : user.name}
                  </h1>
                  {user.role === 'provider' && user.business_name && (
                    <p className="text-gray-600">{user.name}</p>
                  )}
                  <div className="flex items-center mt-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                    {user.rating > 0 && (
                      <div className="ml-3 flex items-center">
                        <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                        <span className="font-semibold text-gray-900">{user.rating.toFixed(1)}</span>
                        <span className="text-gray-600 ml-1">({user.total_reviews} reviews)</span>
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
              {user.phone && (
                <div className="flex items-center text-gray-700">
                  <Phone className="w-5 h-5 mr-3 text-gray-400" />
                  <span>{user.phone}</span>
                </div>
              )}
              {user.email && (
                <div className="flex items-center text-gray-700">
                  <Mail className="w-5 h-5 mr-3 text-gray-400" />
                  <span>{user.email}</span>
                </div>
              )}
              {user.address && (
                <div className="flex items-start text-gray-700">
                  <MapPin className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                  <span>{user.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Role-Specific Information */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {user.role === 'farmer' ? 'Farm Information' : 'Service Information'}
            </h2>

            {user.role === 'farmer' ? (
              <div className="space-y-4">
                {user.farm_size && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Farm Size</p>
                    <p className="text-lg text-gray-900">{user.farm_size}</p>
                  </div>
                )}
                {user.crop_types && user.crop_types.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Crop Types</p>
                    <div className="flex flex-wrap gap-2">
                      {user.crop_types.map((crop: string, index: number) => (
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
                {user.num_workers !== null && user.num_workers !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Number of Workers</p>
                    <p className="text-lg text-gray-900">{user.num_workers}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {user.service_categories && user.service_categories.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Service Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {user.service_categories.map((category: string, index: number) => (
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
                {user.service_description && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Description</p>
                    <p className="text-gray-700 leading-relaxed">{user.service_description}</p>
                  </div>
                )}
                {user.service_availability && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Availability</p>
                    <p className="text-gray-900">{user.service_availability}</p>
                  </div>
                )}
                {user.pricing_info && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pricing</p>
                    <p className="text-gray-900">{user.pricing_info}</p>
                  </div>
                )}
                {user.equipment_list && user.equipment_list.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Equipment</p>
                    <div className="flex flex-wrap gap-2">
                      {user.equipment_list.map((equipment: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                        >
                          {equipment}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {user.years_experience !== null && user.years_experience !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Years of Experience</p>
                    <p className="text-lg text-gray-900">{user.years_experience} years</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Reviews & Ratings</h2>
          <UserReviews userId={user.id} userName={user.name} />
        </div>
      </div>
    </div>
  );
};
