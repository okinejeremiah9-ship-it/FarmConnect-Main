import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileEditor } from './ProfileEditor';
import { User, MapPin, Star, CreditCard as Edit, Save, X, Camera, Tractor, Users, Shield } from 'lucide-react';

interface UserProfileProps {
  userId?: string;
  isOwnProfile?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  userId, 
  isOwnProfile = false 
}) => {
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const profileUserId = userId || currentUser?.id;

  useEffect(() => {
    if (profileUserId) {
      fetchUserProfile();
    }
  }, [profileUserId]);

  const fetchUserProfile = async () => {
    try {
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-profile?id=${userId}`,
  {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
  }
);


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      setUser(data.user);
      setServices(data.services);
      setReviews(data.reviews);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: any) => {
    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, user_id: profileUserId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setUser(data.user);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'farmer':
        return <Tractor className="w-6 h-6 text-green-600" />;
      case 'provider':
        return <Users className="w-6 h-6 text-blue-600" />;
      case 'admin':
        return <Shield className="w-6 h-6 text-purple-600" />;
      default:
        return <User className="w-6 h-6 text-gray-600" />;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile not found</h2>
          <p className="text-gray-600">The user profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProfileEditor
            user={user}
            onSave={handleSave}
            onCancel={handleCancelEdit}
            saving={saving}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  {user.profile_pic ? (
                    <img
                      src={user.profile_pic}
                      alt={user.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                {editing && (
                  <button className="absolute -bottom-1 -right-1 bg-green-600 text-white p-1 rounded-full">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <div className="flex items-center mt-2">
                  {getRoleIcon(user.role)}
                  <span className="ml-2 text-gray-600 capitalize">{user.role}</span>
                  {user.is_verified && (
                    <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
            {(isOwnProfile || currentUser?.id === profileUserId) && (
              <div className="flex space-x-2">
                {editing ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave({})}
                      disabled={saving}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit Profile
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Rating */}
          {user.total_reviews > 0 && (
            <div className="flex items-center mb-4">
              {renderStars(Math.round(user.rating))}
              <span className="ml-2 text-gray-600">
                {user.rating.toFixed(1)} ({user.total_reviews} reviews)
              </span>
            </div>
          )}

          {/* Bio */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Bio</h3>
            <p className="text-gray-600">
              {user.bio || 'No bio provided yet.'}
            </p>
          </div>

          {/* Location */}
          {user.address && (
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{user.address}</span>
            </div>
          )}
        </div>

        {/* Role-specific Information */}
        {user.role === 'farmer' && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Farm Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Farm Size
              </label>
              <p className="text-gray-600">{user.farm_size || 'Not specified'}</p>
            </div>
          </div>
        )}

        {user.role === 'provider' && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Services Offered</h2>
            {services.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900">{service.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-semibold">₵{service.price}/{service.price_unit}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        service.availability === 'available' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {service.availability}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No services listed yet.</p>
            )}
          </div>
        )}

        {/* Recent Reviews */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Reviews</h2>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      {renderStars(review.rating)}
                      <p className="text-sm text-gray-600 mt-1">
                        by {review.reviewer?.full_name || review.reviewer?.name} • {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
