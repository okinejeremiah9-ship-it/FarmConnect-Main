// src/components/auth/ProviderSignupForm.tsx

import React, { useState } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Check,
  X,
  Eye,
  EyeOff,
  Loader,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";

import { useGeolocationCapture } from "../../hooks/useGeolocationCapture";

// FIXED SERVICE CATEGORIES (UI labels)
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

// ⬇️ Allowed service.category values in DB:
// 'machinery' | 'mechanic' | 'extension' | 'labour'
type ServiceCategoryEnum = "machinery" | "mechanic" | "extension" | "labour";

// Map UI category → DB enum-safe category
function mapUiCategoryToDbCategory(label: string): ServiceCategoryEnum {
  const lower = label.toLowerCase();

  if (
    lower.includes("tractor") ||
    lower.includes("equipment") ||
    lower.includes("plough") ||
    lower.includes("harvest") ||
    lower.includes("drone")
  ) {
    return "machinery";
  }

  if (lower.includes("mechanic")) {
    return "mechanic";
  }

  if (
    lower.includes("soil") ||
    lower.includes("testing") ||
    lower.includes("consult") ||
    lower.includes("extension") ||
    lower.includes("irrigation") ||
    lower.includes("pesticide") ||
    lower.includes("seed") ||
    lower.includes("fertilizer") ||
    lower.includes("storage") ||
    lower.includes("warehous")
  ) {
    return "extension";
  }

  // Drivers, labour-type work, logistics etc.
  return "labour";
}

// Rough price + unit parser from free text like "GHS 200 per day"
function parsePriceAndUnit(raw?: string | null): {
  price: number | null;
  unit: "hour" | "day" | "session" | "fixed";
} {
  if (!raw) return { price: null, unit: "session" };

  const text = raw.toLowerCase();
  const numMatch = raw.match(/(\d+[\.,]?\d*)/);
  const price = numMatch ? parseFloat(numMatch[1].replace(",", "")) : null;

  let unit: "hour" | "day" | "session" | "fixed" = "session";
  if (text.includes("hour")) unit = "hour";
  else if (text.includes("day")) unit = "day";
  else if (text.includes("season") || text.includes("project") || text.includes("fixed")) {
    unit = "fixed";
  }

  return { price, unit };
}

interface ProviderSignupFormProps {
  onSwitchToLogin: () => void;
  onSignupSuccess: (email: string) => void;
}

export const ProviderSignupForm: React.FC<ProviderSignupFormProps> = ({
  onSwitchToLogin,
  onSignupSuccess,
}) => {
  const [formData, setFormData] = useState({
    businessName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    serviceDescription: "",
    pricingInfo: "",
    yearsExperience: "",
    password: "",
    confirmPassword: "",
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const {
    coordinates,
    error: locationError,
    isCapturing,
    captureLocation,
  } = useGeolocationCapture();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle input
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Toggle service category
  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // ------------------------------------------------------
  // SUBMIT (EMAIL + PASSWORD AUTH + INITIAL SERVICES)
  // ------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.email.includes("@")) {
      return setError("Enter a valid email address.");
    }

    if (!coordinates) {
      return setError("Please capture your business location.");
    }

    if (selectedCategories.length === 0) {
      return setError("Select at least one service category.");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);

    try {
      const { price, unit } = parsePriceAndUnit(formData.pricingInfo);

      // 👇 Build initial services payload for the `services` table
      const initialServices = selectedCategories.map((catLabel) => {
        const dbCategory = mapUiCategoryToDbCategory(catLabel);

        return {
          // provider_id will be filled in the Edge Function using the new user's id
          category: dbCategory, // enum-safe
          title: `${catLabel} - ${formData.businessName || "Service"}`,
          description:
            formData.serviceDescription ||
            `${catLabel} services provided by ${formData.businessName}`,
          price: price ?? 0,
          price_unit: unit, // 'hour' | 'day' | 'session' | 'fixed'
          availability: "available",
          location: formData.address,
          district: null,
          equipment: null,
          specializations: [catLabel],
          images: [],
        };
      });

      // call Edge Function using EMAIL + PASSWORD auth
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-signup`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: "provider",

            // auth-signup uses email now
            email: formData.email,
            password: formData.password,

            // profile fields (still stored in users for now)
            name: formData.contactPerson,
            business_name: formData.businessName,
            contact_person: formData.contactPerson,
            phone: formData.phone || null,
            address: formData.address,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            pricing_info: formData.pricingInfo || null,
            service_description: formData.serviceDescription || null,
            years_experience: formData.yearsExperience
              ? parseInt(formData.yearsExperience)
              : null,
            service_categories: selectedCategories,
            profile_completed: true,

            // 💥 NEW: initial services to be inserted into public.services
            initial_services: initialServices,
          }),
        }
      );

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Signup failed.");
      }

      // return email instead of phone
      onSignupSuccess(formData.email);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- UI (unchanged) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-2xl border border-blue-100 p-10 animate-fade-in">
        <button
          onClick={onSwitchToLogin}
          className="flex items-center text-gray-600 hover:text-blue-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to login
        </button>

        <div className="text-center mb-8">
          <span className="px-4 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
            Provider Onboarding
          </span>
          <h1 className="text-3xl font-bold mt-4">
            Tell farmers about your services
          </h1>
          <p className="text-gray-600 mt-1">
            Your business details help farmers book confidently.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business name & contact person */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="font-medium text-gray-700">
                Business Name *
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="font-medium text-gray-700">
                Contact Person *
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg"
                required
              />
            </div>
          </div>

          {/* Email + phone */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="font-medium text-gray-700">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg"
              />
            </div>
          </div>

          {/* address */}
          <div>
            <label className="font-medium text-gray-700">
              Business Location *
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
              required
            />
          </div>

          {/* GPS capture */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="font-medium text-blue-700">
              Service Discovery Location *
            </p>
            <p className="text-sm text-blue-600 mb-3">
              Capture your current GPS location.
            </p>

            <button
              type="button"
              onClick={captureLocation}
              className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isCapturing ? "Capturing..." : "Capture location"}
            </button>

            {coordinates && (
              <p className="text-green-600 mt-2 text-sm">
                ✓ Location captured successfully
              </p>
            )}
            {locationError && (
              <p className="text-red-600 text-sm mt-2">{locationError}</p>
            )}
          </div>

          {/* categories */}
          <div>
            <label className="font-medium text-gray-700">
              Service Categories *
            </label>

            <div className="relative">
              <button
                type="button"
                className="w-full border p-3 rounded-lg flex justify-between items-center"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                <span className="text-gray-600">
                  {selectedCategories.length > 0
                    ? `${selectedCategories.length} selected`
                    : "Select categories"}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute z-20 bg-white border shadow-lg rounded-lg w-full mt-2 p-2 max-h-64 overflow-y-auto">
                  {SERVICE_CATEGORIES.map((cat) => (
                    <div
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className="flex items-center p-2 hover:bg-gray-100 cursor-pointer rounded"
                    >
                      <div
                        className={`w-5 h-5 border rounded flex items-center justify-center mr-3 ${
                          selectedCategories.includes(cat)
                            ? "bg-blue-600 border-blue-600"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedCategories.includes(cat) && (
                          <Check className="text-white w-4 h-4" />
                        )}
                      </div>
                      <span>{cat}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* selected category pills */}
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedCategories.map((cat) => (
                <span
                  key={cat}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                >
                  {cat}
                  <X
                    className="w-4 h-4 cursor-pointer"
                    onClick={() => toggleCategory(cat)}
                  />
                </span>
              ))}
            </div>
          </div>

          {/* descriptions */}
          <div>
            <label className="font-medium text-gray-700">
              Service Description
            </label>
            <textarea
              name="serviceDescription"
              value={formData.serviceDescription}
              onChange={handleChange}
              rows={3}
              className="w-full border p-3 rounded-lg"
            />
          </div>

          {/* experience + pricing */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="font-medium text-gray-700">
                Years of Experience
              </label>
              <input
                type="number"
                name="yearsExperience"
                value={formData.yearsExperience}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg"
                placeholder="e.g. 5"
              />
            </div>

            <div>
              <label className="font-medium text-gray-700">Pricing Info</label>
              <input
                type="text"
                name="pricingInfo"
                value={formData.pricingInfo}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg"
                placeholder="GHS 200 per day"
              />
            </div>
          </div>

          {/* password */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="font-medium text-gray-700">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full border p-3 rounded-lg pr-10"
                />
                <span
                  className="absolute right-3 top-3 cursor-pointer text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </span>
              </div>
            </div>

            <div>
              <label className="font-medium text-gray-700">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full border p-3 rounded-lg pr-10"
                />
                <span
                  className="absolute right-3 top-3 cursor-pointer text-gray-500"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </span>
              </div>
            </div>
          </div>

          {/* submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold flex justify-center"
          >
            {loading ? (
              <>
                <Loader className="animate-spin w-5 h-5 mr-2" />
                Creating account...
              </>
            ) : (
              "Create Provider Account"
            )}
          </button>

          <div className="text-center mt-3">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:underline"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>

      <style>
        {`
          @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in-up 0.35s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default ProviderSignupForm;
