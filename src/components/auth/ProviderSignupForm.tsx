import React, { useState } from "react";
import {
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Tags,
  ClipboardList,
  Wallet,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  Loader,
  ArrowLeft,
  ChevronDown,
  Check,
  X,
} from "lucide-react";

import {
  normalizeGhanaPhoneNumber,
  isValidGhanaPhoneNumber,
} from "../../utils/phone";

import { useGeolocationCapture } from "../../hooks/useGeolocationCapture";

// FIXED SERVICE CATEGORIES (SYSTEM-WIDE)
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

interface ProviderSignupFormProps {
  onSwitchToLogin: () => void;
  onSignupSuccess: (phone: string) => void;
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
    captureLocation,
    isCapturing,
  } = useGeolocationCapture();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Input change handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Toggle category select
  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidGhanaPhoneNumber(formData.phone)) {
      return setError("Enter a valid Ghana phone number.");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }

    if (!coordinates) {
      return setError("Please capture your business location.");
    }

    if (selectedCategories.length === 0) {
      return setError("Select at least one service category.");
    }

    const normalizedPhone = normalizeGhanaPhoneNumber(formData.phone);

    setLoading(true);

    try {
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

            // Required fields
            name: formData.contactPerson,
            contact_person: formData.contactPerson,
            business_name: formData.businessName,

            email: formData.email || null,
            phone: normalizedPhone,
            password: formData.password,

            address: formData.address,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,

            pricing_info: formData.pricingInfo || null,
            service_description: formData.serviceDescription || null,
            years_experience: formData.yearsExperience
              ? parseInt(formData.yearsExperience)
              : null,

            // FIXED
            service_categories: selectedCategories,

            profile_completed: true,
          }),
        }
      );

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Signup failed.");
      }

      onSignupSuccess(normalizedPhone);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-2xl border border-blue-100 p-10 animate-fade-in">

        {/* Back Button */}
        <button
          onClick={onSwitchToLogin}
          className="flex items-center text-gray-600 hover:text-blue-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to login
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <span className="px-4 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
            Provider Onboarding
          </span>
          <h1 className="text-3xl font-bold mt-4">Tell farmers about your services</h1>
          <p className="text-gray-600 mt-2">
            Your business details help farmers trust and book you confidently.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Business Name + Contact Person */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="font-medium text-gray-700">Business Name *</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg"
                placeholder="AgriTech Services"
                required
              />
            </div>

            <div>
              <label className="font-medium text-gray-700">Contact Person *</label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg"
                placeholder="Kofi Mensah"
                required
              />
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg"
                placeholder="example@gmail.com"
              />
            </div>

            <div>
              <label className="font-medium text-gray-700">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg"
                placeholder="+233XXXXXXXXX"
                required
              />
            </div>
          </div>

          {/* Business Address */}
          <div>
            <label className="font-medium text-gray-700">Business Location *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
              placeholder="City, district"
              required
            />
          </div>

          {/* Capture Location */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="font-medium text-blue-700">Service Discovery Location *</p>
            <p className="text-sm text-blue-600 mb-3">
              Capture your current location so farmers within your service radius can find you.
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
          </div>

          {/* Service Categories MULTI SELECT */}
          <div>
            <label className="font-medium text-gray-700">Service Categories *</label>

            <div className="relative">
              <button
                type="button"
                className="w-full border p-3 rounded-lg flex items-center justify-between"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                <span className="text-gray-600">
                  {selectedCategories.length > 0
                    ? `${selectedCategories.length} selected`
                    : "Select service categories"}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute z-20 mt-2 bg-white shadow-lg border rounded-lg w-full max-h-64 overflow-y-auto p-2">
                  {SERVICE_CATEGORIES.map((cat) => (
                    <div
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded"
                    >
                      <div
                        className={`w-5 h-5 border rounded mr-3 flex items-center justify-center ${
                          selectedCategories.includes(cat)
                            ? "bg-blue-600 border-blue-600"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedCategories.includes(cat) && (
                          <Check className="text-white w-4 h-4" />
                        )}
                      </div>
                      <span className="text-gray-700">{cat}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected pills */}
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

          {/* Description */}
          <div>
            <label className="font-medium text-gray-700">Service Description</label>
            <textarea
              name="serviceDescription"
              value={formData.serviceDescription}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
              rows={3}
            />
          </div>

          {/* Years + Pricing */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="font-medium text-gray-700">Years of Experience</label>
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
                placeholder="GHS 200 per acre"
              />
            </div>
          </div>

          {/* Password */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="font-medium text-gray-700">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg pr-10"
                  placeholder="Enter password"
                  required
                />
                <span
                  className="absolute right-3 top-3 text-gray-500 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </span>
              </div>
            </div>

            <div>
              <label className="font-medium text-gray-700">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg pr-10"
                  placeholder="Re-enter password"
                  required
                />
                <span
                  className="absolute right-3 top-3 text-gray-500 cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </span>
              </div>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader className="animate-spin w-5 h-5 mr-2" /> Creating account...
              </>
            ) : (
              "Create Provider Account"
            )}
          </button>

          {/* Back to login */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-600 font-medium hover:underline"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ProviderSignupForm;
