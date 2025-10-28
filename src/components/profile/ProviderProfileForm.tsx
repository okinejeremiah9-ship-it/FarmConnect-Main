// Location: src/components/profile/ProviderProfileForm.tsx
// Purpose: Provider profile setup and permanent completion update

import React, { useState } from 'react';
import { MapPin, X } from 'lucide-react';

interface ProviderProfileFormProps {
  user: any;
  onSave: (data: any) => Promise<void>;
  onCancel?: () => void;
  saving?: boolean;
  isFirstTime?: boolean;
}

export const ProviderProfileForm: React.FC<ProviderProfileFormProps> = ({
  user,
  onSave,
  onCancel,
  saving = false,
  isFirstTime = false,
}) => {
  const [formData, setFormData] = useState({
    business_name: user.business_name || '',
    contact_person: user.name || user.contact_person || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    latitude: user.latitude || '',
    longitude: user.longitude || '',
    service_categories: user.service_categories || [],
    service_description: user.service_description || '',
    pricing_info: user.pricing_info || '',
    years_experience: user.years_experience || '',
  });

  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 🔹 Get Current GPS Location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
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
      alert('Geolocation is not supported by this browser.');
    }
  };

  // 🔹 Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.latitude || !formData.longitude) {
      alert('Capture your current location so farmers nearby can discover your services.');
      setLoading(false);
      return;
    }

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
      service_categories: normalizedCategories.length > 0 ? normalizedCategories : null,
      service_description: formData.service_description || null,
      pricing_info: formData.pricing_info || null,
      years_experience: formData.years_experience
        ? parseInt(formData.years_experience as string)
        : null,
      profile_completed: true,
    };

    try {
      await onSave(updateData);
      alert('✅ Profile saved successfully!');
    } catch (err) {
      console.error('Profile save error:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-h-[90vh] overflow-y-auto border border-green-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isFirstTime ? 'Complete Your Provider Profile' : 'Edit Provider Profile'}
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
        {/* Business Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name *
            </label>
            <input
              type="text"
              value={formData.business_name}
              onChange={(e) => handleInputChange('business_name', e.target.value)}
              placeholder="Your business or service name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Person *
            </label>
            <input
              type="text"
              value={formData.contact_person}
              onChange={(e) => handleInputChange('contact_person', e.target.value)}
              placeholder="Full name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Categories *
          </label>
          <input
            type="text"
            value={formData.service_categories.join(', ')}
            onChange={(e) =>
              handleInputChange('service_categories', e.target.value.split(',').map((c) => c.trim()))
            }
            placeholder="e.g., Tractor Rental, Mechanic, Storage"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Description *
          </label>
          <textarea
            value={formData.service_description}
            onChange={(e) => handleInputChange('service_description', e.target.value)}
            rows={3}
            placeholder="Describe the services you provide"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Location capture */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">Service location</p>
            <p className="text-sm text-blue-700">
              {formData.latitude && formData.longitude
                ? `Location captured: ${Number.parseFloat(formData.latitude).toFixed(4)}, ${Number.parseFloat(formData.longitude).toFixed(4)}`
                : 'Capture your current location so farmers nearby can discover your services.'}
            </p>
          </div>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="inline-flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Capture location
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || saving}
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
