// Location: src/components/profile/ProviderProfileForm.tsx
// Purpose: Provider profile form with category dropdown (supports updates for existing providers)

import React, { useState, useEffect } from "react";
import { MapPin, X } from "lucide-react";
import { useUserSession } from "../../contexts/UserSessionContext";

// ✅ Centralized list of all possible provider categories
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
}

export const ProviderProfileForm: React.FC<ProviderProfileFormProps> = ({
  user,
  onCancel,
  isFirstTime = false,
}) => {
  const { updateProfile, refreshUser } = useUserSession();

  // ✅ Handle existing providers' saved categories safely
  const normalizeCategories = (categories: any) => {
    if (!categories) return [];
    if (Array.isArray(categories)) return categories;
    if (typeof categories === "string")
      return categories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
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
  });

  const [loading, setLoading] = useState(false);

  // ✅ Sync profile data on load (for users coming from Supabase)
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      service_categories: normalizeCategories(user.service_categories),
    }));
  }, [user.service_categories]);

  // Generic input handler
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ✅ GPS capture
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

  // ✅ Multi-select categories toggle
  const toggleCategory = (category: string) => {
    setFormData((prev) => {
      const current = prev.service_categories || [];
      const updated = current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category];
      return { ...prev, service_categories: updated };
    });
  };

  // ✅ Submit & persist
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        business_name: formData.business_name,
        contact_person: formData.contact_person,
        name: formData.contact_person,
        email: formData.email || null,
        address: formData.address || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        service_categories:
          formData.service_categories.length > 0
            ? formData.service_categories
            : null,
        service_description: formData.service_description || null,
        pricing_info: formData.pricing_info || null,
        years_experience: formData.years_experience
          ? parseInt(formData.years_experience)
          : null,
        profile_completed: true,
      };

      await updateProfile(updateData);
      await refreshUser(user.id);

      alert("✅ Provider profile saved successfully and synced!");
    } catch (err) {
      console.error("Profile save error:", err);
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
            {isFirstTime
              ? "Complete Your Provider Profile"
              : "Edit Provider Profile"}
          </h2>
          <p className="text-gray-600 mt-1">
            {isFirstTime
              ? "Please complete your profile to start offering services."
              : "You can update your business details below."}
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
              onChange={(e) => handleInputChange("business_name", e.target.value)}
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
              onChange={(e) => handleInputChange("contact_person", e.target.value)}
              placeholder="Full name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* ✅ Service Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Categories *
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Select one or more categories that describe your services.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SERVICE_CATEGORIES.map((category) => (
              <button
                type="button"
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  formData.service_categories.includes(category)
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Description *
          </label>
          <textarea
            value={formData.service_description}
            onChange={(e) => handleInputChange("service_description", e.target.value)}
            rows={3}
            placeholder="Describe the services you provide"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* GPS Location */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-4 flex flex-col md:flex-row items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">Service Location</p>
            <p className="text-sm text-blue-700">
              {formData.latitude && formData.longitude
                ? `Captured: ${parseFloat(formData.latitude).toFixed(4)}, ${parseFloat(
                    formData.longitude
                  ).toFixed(4)}`
                : "Capture your GPS coordinates so nearby farmers can find you."}
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

        {/* Pricing Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pricing Information
          </label>
          <input
            type="text"
            value={formData.pricing_info}
            onChange={(e) => handleInputChange("pricing_info", e.target.value)}
            placeholder="e.g., GHS 100 per acre / per day"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Years of Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years of Experience
          </label>
          <input
            type="number"
            min={0}
            value={formData.years_experience}
            onChange={(e) => handleInputChange("years_experience", e.target.value)}
            placeholder="e.g., 5"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
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

