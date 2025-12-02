// Location: src/components/profile/FarmerProfileForm.tsx
// Purpose: Persistent profile form for farmers (uses Supabase + context sync)

import React, { useState } from "react";
import { User, MapPin, X, Plus } from "lucide-react";
import { useUserSession } from "../../contexts/UserSessionContext";
import { uploadProfileImage } from "../../lib/upload"; // ✅ Added import

interface FarmerProfileFormProps {
  user: any;
  onCancel?: () => void;
  isFirstTime?: boolean;
}

export const FarmerProfileForm: React.FC<FarmerProfileFormProps> = ({
  user,
  onCancel,
  isFirstTime = false,
}) => {
  const { updateProfile, refreshUser } = useUserSession();

  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    profile_pic: user.profile_pic || "",
    address: user.address || "",
    latitude: user.latitude != null ? String(user.latitude) : "",
    longitude: user.longitude != null ? String(user.longitude) : "",
    farm_size: user.farm_size || "",
    crop_types: Array.isArray(user.crop_types) ? user.crop_types : [],
    num_workers:
      typeof user.num_workers === "number" ? String(user.num_workers) : "",
    profile_file: null as File | null, // ✅ Added
  });

  const [newCrop, setNewCrop] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 🔹 Capture current GPS location
  const getCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation not supported in this browser.");
      return;
    }
    // Some browsers require HTTPS for geolocation
    if (window.isSecureContext === false) {
      alert("For accurate GPS capture, please use HTTPS.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData((prev) => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        }));
        alert("📍 Location captured successfully!");
      },
      (error) => {
        console.error("GPS Error:", error);
        const msg =
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied. Please enable and try again."
            : error.code === error.POSITION_UNAVAILABLE
            ? "Location unavailable. Ensure clear sky view and try again."
            : error.code === error.TIMEOUT
            ? "Location request timed out. Try again."
            : "Unable to get your location.";
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // 🔹 Add / remove crops
  const addCrop = () => {
    const value = newCrop.trim();
    if (value) {
      setFormData((prev) => ({
        ...prev,
        crop_types: [...prev.crop_types, value],
      }));
      setNewCrop("");
    }
  };

  const removeCrop = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      crop_types: prev.crop_types.filter((_, i) => i !== index),
    }));
  };

  // 🔹 Safe number parsing
  const parseFloatOrNull = (v: string) => {
    if (!v) return null;
    const n = Number.parseFloat(v);
    return Number.isNaN(n) ? null : n;
  };

  const parseIntOrNull = (v: string) => {
    if (!v) return null;
    const n = Number.parseInt(v, 10);
    return Number.isNaN(n) ? null : n;
  };

  // 🔹 Save and persist profile
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      // ✅ STEP — Upload file if selected
      if (formData.profile_file instanceof File) {
        const url = await uploadProfileImage(formData.profile_file, user.id);
        formData.profile_pic = url;
      }

      const normalizedCrops = Array.isArray(formData.crop_types)
        ? formData.crop_types.map((c) => String(c).trim()).filter(Boolean)
        : [];

      const updateData = {
        name: formData.name,
        email: formData.email || null,
        address: formData.address || null,
        profile_pic: formData.profile_pic || null,
        latitude: parseFloatOrNull(formData.latitude),
        longitude: parseFloatOrNull(formData.longitude),
        farm_size: formData.farm_size || null,
        crop_types: normalizedCrops.length ? normalizedCrops : null,
        num_workers: parseIntOrNull(formData.num_workers),
        profile_completed: true,
      };

      await updateProfile(updateData);
      await refreshUser(user.id);

      alert("✅ Farmer profile saved successfully and synced!");
    } catch (error) {
      console.error("Profile update failed:", error);
      alert("❌ Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-green-100 max-h-[90vh] overflow-y-auto">
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
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
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

          {/* ✅ NEW BLOCK WITH FILE + URL input */}
          <div className="flex flex-col gap-2">

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleInputChange("profile_file", file);
              }}
              className="border p-2 rounded-lg"
            />

            <input
              type="url"
              value={formData.profile_pic}
              onChange={(e) => handleInputChange("profile_pic", e.target.value)}
              placeholder="or paste an image URL"
              className="px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Avatar Preview */}
          <div className="mt-3 w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
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

        {/* GPS */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-4 flex flex-col md:flex-row items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">Farm Location</p>
            <p className="text-sm text-blue-700">
              {formData.latitude && formData.longitude
                ? `Captured: ${parseFloat(formData.latitude).toFixed(4)}, ${parseFloat(
                    formData.longitude
                  ).toFixed(4)}`
                : "Capture your GPS coordinates to find nearby providers easily."}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCrop();
                  }
                }}
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
                  key={`${crop}-${index}`}
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
          disabled={loading || formData.crop_types.length === 0}
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
