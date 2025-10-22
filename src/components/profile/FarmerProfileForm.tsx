// Location: src/components/profile/FarmerProfileForm.tsx
// Purpose: Permanent completion profile form for farmers

import React, { useState } from "react";
import { User, MapPin, Save, X, Plus } from "lucide-react";
import { supabase } from "../../lib/supabase";

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
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    profile_pic: user.profile_pic || "",
    address: user.address || "",
    latitude: user.latitude || "",
    longitude: user.longitude || "",
    farm_size: user.farm_size || "",
    crop_types: user.crop_types || [],
    num_workers: user.num_workers || "",
  });

  const [newCrop, setNewCrop] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addCrop = () => {
    if (newCrop.trim()) {
      setFormData((prev) => ({
        ...prev,
        crop_types: [...prev.crop_types, newCrop.trim()],
      }));
      setNewCrop("");
    }
  };

  const removeCrop = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      crop_types: prev.crop_types.filter((_: any, i: number) => i !== index),
    }));
  };

  // 🔹 Get GPS Coordinates
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
          alert("📍 Location captured successfully!");
        },
        (error) => {
          console.error("GPS Error:", error);
          alert("Unable to get your location. Please enable GPS.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation not supported by this browser.");
    }
  };

  // 🔹 Submit Handler (Save + Mark as Completed)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const updateData = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      num_workers: formData.num_workers
        ? parseInt(formData.num_workers as string)
        : null,
      profile_completed: true,
      updated_at: new Date().toISOString(),
    };

    try {
      // ✅ Update Supabase profile record
      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) throw error;

      // ✅ Update local app user data
      await onSave(updateData);

      alert("✅ Profile saved successfully!");
    } catch (err) {
      console.error("Profile update error:", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-h-[90vh] overflow-y-auto border border-green-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isFirstTime ? "Complete Your Farmer Profile" : "Edit Farmer Profile"}
          </h2>
          <p className="text-gray-600 mt-1">
            {isFirstTime
              ? "Please complete your details to get started."
              : "You can update your farm information below."}
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
            Profile Picture URL
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
            <input
              type="url"
              value={formData.profile_pic}
              onChange={(e) =>
                handleInputChange("profile_pic", e.target.value)
              }
              placeholder="https://example.com/photo.jpg"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Name & Phone */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email (optional)
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Farm Address *
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            required
            placeholder="Enter your farm location or address"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* GPS Coordinates */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Latitude
            </label>
            <input
              type="text"
              value={formData.latitude}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Longitude
            </label>
            <input
              type="text"
              value={formData.longitude}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
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
            Farm Size *
          </label>
          <input
            type="text"
            value={formData.farm_size}
            onChange={(e) => handleInputChange("farm_size", e.target.value)}
            required
            placeholder="e.g., 5 acres, 2 hectares"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Crop Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Crop Types *
          </label>
          <div className="space-y-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newCrop}
                onChange={(e) => setNewCrop(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addCrop())
                }
                placeholder="Add crop type (e.g., Maize, Rice)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={addCrop}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </button>
            </div>

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

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || loading || formData.crop_types.length === 0}
          className={`w-full py-3 rounded-lg font-semibold text-white transition ${
            loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
};
