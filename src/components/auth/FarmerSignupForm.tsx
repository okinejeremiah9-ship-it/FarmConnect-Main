// src/components/auth/FarmerSignupForm.tsx
import React, { useState } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Sprout,
  Wheat,
  Users,
  Lock,
  Eye,
  EyeOff,
  Loader,
  ArrowLeft,
} from "lucide-react";

import {
  normalizeGhanaPhoneNumber,
  isValidGhanaPhoneNumber,
} from "../../utils/phone";

import { supabase } from "../../lib/supabase";
import { useGeolocationCapture } from "../../hooks/useGeolocationCapture";

interface FarmerSignupFormProps {
  onSwitchToLogin: () => void;
  onSignupSuccess: (email: string) => void;
}

export const FarmerSignupForm: React.FC<FarmerSignupFormProps> = ({
  onSwitchToLogin,
  onSignupSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    farmLocation: "",
    farmSize: "",
    cropTypes: "",
    numWorkers: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // LOCATION HOOK
  const {
    coordinates,
    error: locationError,
    isCapturing,
    captureLocation,
  } = useGeolocationCapture();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  // -----------------------------------------------------
  // 🔥 NEW EMAIL-BASED AUTH — NO PHONE AUTH ANYMORE
  // -----------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // VALIDATION
    if (!formData.email.trim()) {
      return setError("Email is required.");
    }
    if (!isValidGhanaPhoneNumber(formData.phone)) {
      return setError("Please enter a valid Ghana phone number.");
    }
    if (!coordinates) {
      return setError("Please capture your farm location.");
    }
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);

    const normalizedPhone = normalizeGhanaPhoneNumber(formData.phone);
    const cropTypes = formData.cropTypes
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const numWorkers = formData.numWorkers.trim()
      ? parseInt(formData.numWorkers)
      : null;

    try {
      // 1️⃣ Create Supabase AUTH account
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

      if (authError) {
        console.error(authError);
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Failed to create Supabase auth user.");
      }

      // 2️⃣ Insert profile record into `users` table
      const { error: insertError } = await supabase.from("users").insert({
        id: authData.user.id,
        role: "farmer",
        name: formData.name,
        email: formData.email,
        phone: normalizedPhone,

        // Location
        address: formData.farmLocation,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,

        // Farmer fields
        farm_size: formData.farmSize,
        crop_types: cropTypes,
        num_workers: numWorkers,
        profile_completed: true,
      });

      if (insertError) {
        console.error(insertError);
        throw new Error("Failed to save profile.");
      }

      // 3️⃣ Immediately sign user in
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) {
        console.error(loginError);
        throw new Error("Account created but failed to start session.");
      }

      onSignupSuccess(formData.email);
    } catch (err) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // UI — EXACTLY YOUR ORIGINAL BEAUTIFUL DESIGN (NO CHANGES BELOW)
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl border border-green-100 p-8 md:p-10 animate-fade-in">

        <button
          onClick={onSwitchToLogin}
          className="flex items-center text-sm text-gray-500 hover:text-green-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to login
        </button>

        <div className="text-center mb-8">
          <span className="inline-flex px-4 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 mb-3">
            Farmer Onboarding
          </span>
          <h1 className="text-3xl font-bold text-gray-900">Tell us about your farm</h1>
          <p className="text-gray-600 mt-2 text-sm">
            Your farm location helps us match you with nearby service providers.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 p-3 mb-4 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">

            {/* Full Name */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full pl-10 border p-3 rounded-lg"
                  placeholder="Ama Kwarteng"
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full pl-10 border p-3 rounded-lg"
                  placeholder="example@gmail.com"
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  required
                  className="w-full pl-10 border p-3 rounded-lg"
                  placeholder="+233XXXXXXXXX"
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Farm Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="farmLocation"
                  required
                  className="w-full pl-10 border p-3 rounded-lg"
                  placeholder="Town, district"
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Farm Size */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Farm Size *
              </label>
              <div className="relative">
                <Sprout className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="farmSize"
                  required
                  className="w-full pl-10 border p-3 rounded-lg"
                  placeholder="50 acres"
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Crop Types */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Crop Types *
              </label>
              <div className="relative">
                <Wheat className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="cropTypes"
                  required
                  className="w-full pl-10 border p-3 rounded-lg"
                  placeholder="Maize, Cassava, Vegetables"
                  onChange={handleChange}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Separate with commas
              </p>
            </div>

            {/* Workers */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Number of Workers
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="numWorkers"
                  className="w-full pl-10 border p-3 rounded-lg"
                  placeholder="e.g. 10"
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  className="w-full pl-10 pr-10 border p-3 rounded-lg"
                  placeholder="Enter password"
                  onChange={handleChange}
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  className="w-full pl-10 pr-10 border p-3 rounded-lg"
                  placeholder="Re-enter password"
                  onChange={handleChange}
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </span>
              </div>
            </div>
          </div>

          {/* GPS capture */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="font-medium text-green-800">Farm GPS Location *</p>
            <p className="text-sm text-green-600 mb-3">
              Capture your GPS location so we can match you with nearby
              providers.
            </p>

            <button
              type="button"
              onClick={captureLocation}
              className="px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {isCapturing ? "Capturing..." : "Capture Location"}
            </button>

            {coordinates && (
              <p className="text-green-700 mt-2 text-sm">
                ✓ Location captured
              </p>
            )}

            {locationError && (
              <p className="text-red-600 mt-2 text-sm">{locationError}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-green-700 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Creating account...
              </>
            ) : (
              "Create Farmer Account"
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in-up .4s ease-out; }
      `}</style>
    </div>
  );
};

export default FarmerSignupForm;
