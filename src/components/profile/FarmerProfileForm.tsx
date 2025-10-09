import React, { useState } from 'react';
import { User, MapPin, Camera, Save, X, Plus, Trash2 } from 'lucide-react';

interface FarmerProfileFormProps {
  user: any;
  onSave: (data: any) => Promise<void>;
  onCancel?: () => void;
  saving?: boolean;
  isFirstTime?: boolean;
}

export const FarmerProfileForm: React.FC<FarmerProfileFormProps> = ({
  user,
  onSave,
  onCancel,
  saving = false,
  isFirstTime = false,
}) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    profile_pic: user.profile_pic || '',
    address: user.address || '',
    latitude: user.latitude || '',
    longitude: user.longitude || '',
    farm_size: user.farm_size || '',
    crop_types: user.crop_types || [],
    num_workers: user.num_workers || '',
  });

  const [newCrop, setNewCrop] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addCrop = () => {
    if (newCrop.trim()) {
      setFormData(prev => ({
        ...prev,
        crop_types: [...prev.crop_types, newCrop.trim()],
      }));
      setNewCrop('');
    }
  };

  const removeCrop = (index: number) => {
    setFormData(prev => ({
      ...prev,
      crop_types: prev.crop_types.filter((_, i) => i !== index),
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enter it manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updateData = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      num_workers: formData.num_workers ? parseInt(formData.num_workers as string) : null,
      profile_completed: true,
    };

    await onSave(updateData);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isFirstTime ? 'Complete Your Farmer Profile' : 'Edit Profile'}
          </h2>
          <p className="text-gray-600 mt-1">
            {isFirstTime ? 'Please provide your details to get started' : 'Update your profile information'}
          </p>
        </div>
        {onCancel && !isFirstTime && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Picture
          </label>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
              {formData.profile_pic ? (
                <img
                  src={formData.profile_pic}
                  alt={formData.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <input
                type="url"
                value={formData.profile_pic}
                onChange={(e) => handleInputChange('profile_pic', e.target.value)}
                placeholder="Enter image URL"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Enter a URL to your profile picture</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Auto-filled from signup</p>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email (Optional)
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="your.email@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Farm Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Farm Location / Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Enter your farm location or address"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        {/* GPS Coordinates */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => handleInputChange('latitude', e.target.value)}
              placeholder="0.0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => handleInputChange('longitude', e.target.value)}
              placeholder="0.0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={getCurrentLocation}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Get Location
            </button>
          </div>
        </div>

        {/* Farm Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Farm Size <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.farm_size}
            onChange={(e) => handleInputChange('farm_size', e.target.value)}
            placeholder="e.g., 5 acres, 2 hectares"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        {/* Crop Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Crop Types <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newCrop}
                onChange={(e) => setNewCrop(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCrop())}
                placeholder="Add a crop type (e.g., Maize, Rice, Cocoa)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addCrop}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </button>
            </div>
            {formData.crop_types.length === 0 && (
              <p className="text-sm text-red-500">Please add at least one crop type</p>
            )}
            <div className="flex flex-wrap gap-2">
              {formData.crop_types.map((crop, index) => (
                <span
                  key={index}
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  {crop}
                  <button
                    type="button"
                    onClick={() => removeCrop(index)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Number of Workers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Workers (Optional)
          </label>
          <input
            type="number"
            min="0"
            value={formData.num_workers}
            onChange={(e) => handleInputChange('num_workers', e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          {onCancel && !isFirstTime && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving || formData.crop_types.length === 0}
            className={`${onCancel && !isFirstTime ? 'flex-1' : 'w-full'} bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {isFirstTime ? 'Complete Profile' : 'Save Changes'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
