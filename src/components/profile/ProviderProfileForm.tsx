// Location: src/components/profile/ProviderProfileForm.tsx
// Purpose: Provider profile form with category selection, GPS capture, and saving profile data.

import React, { useState, useEffect } from "react";
import { MapPin, X } from "lucide-react";
import { useUserSession } from "../../contexts/UserSessionContext";
import { uploadProfileImage } from "../../lib/upload"; // ✅ Added import

// All available provider categories
const SERVICE_CATEGORIES = [
  "Tractor Operator",
  "Mechanic",
  "Transport & Logistics",
  "Irrigation Specialist",
  "Pesticide Spraying",
  "Soil Testing & Analysis",
  "Farm Equipment Rental",
  "Seed Supplier",
  "Fertilizer Supplier",
  "Storage & Warehousing",
  "Harvesting Services",
  "Ploughing & Land Preparation",
  "Drone Spraying Services",
  "Veterinary Services",
  "Agro Consultant",
  "Drivers",
];

interface ProviderProfileFormProps {
  user: any;
  onCancel?: () => void;
  isFirstTime?: boolean;
  onSave?: (data: any) => Promise<void> | void;
  saving?: boolean;
}

export const ProviderProfileForm: React.FC<ProviderProfileFormProps> = ({
  user,
  onCancel,
  isFirstTime = false,
  onSave,
  saving = false,
}) => {
  const { updateProfile, refreshUser } = useUserSession();

  // Ensure categories are always an array
  const normalizeCategories = (categories: any) => {
    if (!categories) return [];
    if (Array.isArray(categories)) return categories;
    if (typeof categories === "string") {
      return categories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
    }
    return [];
  };

  const [formData, setFormData] = useState({
    business_name: user.business_name || "",
    contact_person: user.name || user.contact_person || "",
    email: user.email || "",
    phone: user.phone || "",
    address: user.address || "",
    latitude: user.latitude?.toString() || "",
    longitude: user.longitude?.toString() || "",
    service_categories: normalizeCategories(user.service_categories),
    service_description: user.service_description || "",
    pricing_info: user.pricing_info || "",
    years_experience: user.years_experience?.toString() || "",
    profile_file: null as File | null, // ✅ Added
  });

  const [loading, setLoading] = useState(false);

  // Re-sync categories if user changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      service_categories: normalizeCategories(user.service_categories),
    }));
  }, [user.service_categories]);

  // Input handler
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Capture GPS coordinates
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported.");
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
        console.error(error);
        alert("Failed to capture GPS. Enable permissions.");
      },
      { enableHighAccuracy: true }
    );
  };

  // Toggle categories
  const toggleCategory = (category: string) => {
    setFormData((prev) => {
      const current = prev.service_categories;
      const updated = current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category];

      return { ...prev, service_categories: updated };
    });
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: any = {
        business_name: formData.business_name,
        contact_person: formData.contact_person,
        name: formData.contact_person,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        service_categories:
          formData.service_categories.length > 0 ? formData.service_categories : null,
        service_description: formData.service_description || null,
        pricing_info: formData.pricing_info || null,
        years_experience: formData.years_experience
          ? parseInt(formData.years_experience)
          : null,
        profile_completed: true,
      };

      // ✅ STEP 3 — Upload profile picture if selected
      if (formData.profile_file instanceof File) {
        const url = await uploadProfileImage(formData.profile_file, user.id);
        updateData.profile_pic = url; // Attach uploaded URL
      }

      if (onSave) {
        await onSave(updateData); // parent handles save
      } else {
        await updateProfile(updateData);
        await refreshUser(user.id);
      }

      alert("✅ Provider profile saved successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-green-100 max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isFirstTime ? "Complete Your Provider Profile" : "Edit Provider Profile"}
          </h2>
          <p className="text-gray-600">
            {isFirstTime
              ? "Provide accurate details so farmers can find and book you."
              : "Update your business information below."}
          </p>
        </div>

        {onCancel && !isFirstTime && (
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ✅ Profile Picture Upload (Added exactly as requested) */}
        <div className="mb-4">
          <label className="text-sm font-medium">Profile Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setFormData((prev) => ({ ...prev, profile_file: file }));
            }}
            className="block w-full mt-1 border p-2 rounded-lg"
          />
        </div>

        {/* Business Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Business Name *</label>
            <input
              type="text"
              value={formData.business_name}
              onChange={(e) => handleInputChange("business_name", e.target.value)}
              required
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Contact Person *</label>
            <input
              type="text"
              value={formData.contact_person}
              onChange={(e) => handleInputChange("contact_person", e.target.value)}
              required
              className="w-full border rounded-lg p-2"
            />
          </div>
        </div>

        {/* Service Categories */}
        <div>
          <label className="text-sm font-medium">Service Categories *</label>
          <p className="text-xs text-gray-500 mb-2">
            Select all categories that match your services.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SERVICE_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  formData.service_categories.includes(category)
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-gray-100 text-gray-700 border-gray-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium">Service Description</label>
          <textarea
            value={formData.service_description}
            onChange={(e) => handleInputChange("service_description", e.target.value)}
            rows={3}
            className="w-full border rounded-lg p-2"
          />
        </div>

        {/* GPS */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Service Location (GPS)</p>
            <p className="text-xs text-blue-600">
              {formData.latitude && formData.longitude
                ? `Captured: ${parseFloat(formData.latitude).toFixed(4)}, ${parseFloat(
                    formData.longitude
                  ).toFixed(4)}`
                : "Tap the button to capture your precise GPS location."}
            </p>
          </div>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-lg"
          >
            <MapPin className="w-4 h-4 mr-1" /> Capture GPS
          </button>
        </div>

        {/* Pricing */}
        <div>
          <label className="text-sm font-medium">Pricing Info</label>
          <input
            type="text"
            value={formData.pricing_info}
            onChange={(e) => handleInputChange("pricing_info", e.target.value)}
            placeholder="e.g. GHS 500 per acre"
            className="w-full border rounded-lg p-2"
          />
        </div>

        {/* Experience */}
        <div>
          <label className="text-sm font-medium">Years of Experience</label>
          <input
            type="number"
            min={0}
            value={formData.years_experience}
            onChange={(e) => handleInputChange("years_experience", e.target.value)}
            className="w-full border rounded-lg p-2"
          />
        </div>

        {/* Address */}
        <div>
          <label className="text-sm font-medium">Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            className="w-full border rounded-lg p-2"
          />
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={loading || saving}
          className={`w-full py-3 rounded-lg text-white font-semibold ${
            loading || saving
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading || saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
};
