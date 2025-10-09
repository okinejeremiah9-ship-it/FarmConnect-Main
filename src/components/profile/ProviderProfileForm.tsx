import React, { useState } from 'react';
import { User, MapPin, Save, X, Plus, Briefcase } from 'lucide-react';

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
    profile_pic: user.profile_pic || '',
    address: user.address || '',
    latitude: user.latitude || '',
    longitude: user.longitude || '',
    service_categories: user.service_categories || [],
    service_description: user.service_description || '',
    service_availability: user.service_availability || '',
    pricing_info: user.pricing_info || '',
    equipment_list: user.equipment_list || [],
    years_experience: user.years_experience || '',
  });

  const [newEquipment, setNewEquipment] = useState('');

  const serviceCategories = [
    'Machinery Rental',
    'Mechanic Services',
    'Labour Services',
    'Extension Officer',
    'Transport Services',
    'Storage Services',
    'Other',
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleServiceCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      service_categories: prev.service_categories.includes(category)
        ? prev.service_categories.filter(c => c !== category)
        : [...prev.service_categories, category],
    }));
  };

  const addEquipment = () => {
    if (newEquipment.trim()) {
      setFormData(prev => ({
        ...prev,
        equipment_list: [...prev.equipment_list, newEquipment.trim()],
      }));
      setNewEquipment('');
    }
  };

  const removeEquipment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      equipment_list: prev.equipment_list.filter((_, i) => i !== index),
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
      name: formData.contact_person,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      years_experience: formData.years_experience ? parseInt(formData.years_experience as string) : null,
      profile_completed: true,
    };

    await onSave(updateData);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isFirstTime ? 'Complete Your Provider Profile' : 'Edit Profile'}
          </h2>
          <p className="text-gray-600 mt-1">
            {isFirstTime ? 'Please provide your business details to get started' : 'Update your profile information'}
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
        {/* Profile Picture/Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Picture / Business Logo
          </label>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
              {formData.profile_pic ? (
                <img
                  src={formData.profile_pic}
                  alt={formData.business_name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <Briefcase className="w-10 h-10 text-gray-400" />
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
              <p className="text-xs text-gray-500 mt-1">Enter a URL to your logo or profile picture</p>
            </div>
          </div>
        </div>

        {/* Business and Contact Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business/Provider Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.business_name}
              onChange={(e) => handleInputChange('business_name', e.target.value)}
              placeholder="Your business or service name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Person Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.contact_person}
              onChange={(e) => handleInputChange('contact_person', e.target.value)}
              placeholder="Your full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Service Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Categories <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {serviceCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => toggleServiceCategory(category)}
                className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                  formData.service_categories.includes(category)
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          {formData.service_categories.length === 0 && (
            <p className="text-sm text-red-500 mt-1">Please select at least one category</p>
          )}
        </div>

        {/* Service Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description of Services <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.service_description}
            onChange={(e) => handleInputChange('service_description', e.target.value)}
            placeholder="Describe the services you offer, your expertise, and what makes you unique..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        {/* Service Availability */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Availability <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.service_availability}
            onChange={(e) => handleInputChange('service_availability', e.target.value)}
            placeholder="e.g., Mon-Fri 8AM-5PM, Weekends available"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        {/* Pricing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pricing <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.pricing_info}
            onChange={(e) => handleInputChange('pricing_info', e.target.value)}
            placeholder="e.g., GH₵150/hour, GH₵1,200/day, GH₵50/hectare"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        {/* Service Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Location / Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Enter your business location or service area"
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

        {/* Equipment List */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            List of Equipment
          </label>
          <div className="space-y-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
                placeholder="Add equipment (e.g., John Deere Tractor, Plough, Harvester)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addEquipment}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.equipment_list.map((equipment, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  {equipment}
                  <button
                    type="button"
                    onClick={() => removeEquipment(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Years of Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years of Experience <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            value={formData.years_experience}
            onChange={(e) => handleInputChange('years_experience', e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
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
            disabled={saving || formData.service_categories.length === 0}
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
