import React, { useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { useUserSession } from '../../contexts/UserSessionContext';

export const ProviderProfileForm: React.FC<{
  user: any;
  onCancel?: () => void;
  isFirstTime?: boolean;
}> = ({ user, onCancel, isFirstTime = false }) => {
  const { updateProfile, refreshUser } = useUserSession();
  const [formData, setFormData] = useState({
    business_name: user.business_name || '',
    contact_person: user.name || user.contact_person || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    latitude: user.latitude || '',
    longitude: user.longitude || '',
    service_categories: Array.isArray(user.service_categories)
      ? user.service_categories
      : user.service_categories
      ? user.service_categories.split(',').map((c: string) => c.trim())
      : [],
    service_description: user.service_description || '',
    pricing_info: user.pricing_info || '',
    years_experience: user.years_experience || '',
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setFormData((prev) => ({
            ...prev,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
          }));
          alert('📍 Location captured successfully!');
        },
        (error) => {
          console.error('GPS error:', error);
          alert('Unable to get your location. Please enable GPS.');
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation not supported.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedCategories = Array.isArray(formData.service_categories)
        ? formData.service_categories.filter(Boolean)
        : [];

      const updateData = {
        business_name: formData.business_name,
        contact_person: formData.contact_person,
        name: formData.contact_person,
        email: formData.email || null,
        address: formData.address || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        service_categories: normalizedCategories,
        service_description: formData.service_description || null,
        pricing_info: formData.pricing_info || null,
        years_experience: formData.years_experience
          ? parseInt(formData.years_experience as string)
          : null,
        profile_completed: true,
      };

      await updateProfile(updateData);
      await refreshUser(user.id);

      alert('✅ Profile saved successfully and synced!');
    } catch (err) {
      console.error('Profile update error:', err);
      alert('❌ Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-green-100 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isFirstTime ? 'Complete Provider Profile' : 'Edit Provider Profile'}
          </h2>
          <p className="text-gray-600 mt-1">
            {isFirstTime
              ? 'Please complete your profile to start offering services.'
              : 'You can update your business details below.'}
          </p>
        </div>
        {onCancel && !isFirstTime && (
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
            <input
              type="text"
              value={formData.business_name}
              onChange={(e) => handleInputChange('business_name', e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person *</label>
            <input
              type="text"
              value={formData.contact_person}
              onChange={(e) => handleInputChange('contact_person', e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Service Categories *</label>
          <input
            type="text"
            value={formData.service_categories.join(', ')}
            onChange={(e) =>
              handleInputChange(
                'service_categories',
                e.target.value.split(',').map((c) => c.trim())
              )
            }
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Service Description *</label>
          <textarea
            value={formData.service_description}
            onChange={(e) => handleInputChange('service_description', e.target.value)}
            rows={3}
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-4 flex flex-col md:flex-row items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">Service Location</p>
            <p className="text-sm text-blue-700">
              {formData.latitude && formData.longitude
                ? `Captured: ${parseFloat(formData.latitude).toFixed(4)}, ${parseFloat(
                    formData.longitude
                  ).toFixed(4)}`
                : 'Capture your current GPS coordinates so farmers can discover your services.'}
            </p>
          </div>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mt-2 md:mt-0"
          >
            <MapPin className="w-4 h-4 mr-2 inline" />
            Capture Location
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg font-semibold text-white transition ${
            loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

