// src/components/auth/AdminSignupPage.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  FileText,
  Loader,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import {
  normalizeGhanaPhoneNumber,
  isValidGhanaPhoneNumber,
} from "../../utils/phone";

export const AdminSignupPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    organisation: "",
    position: "",
    yearsExperience: "",
    reason: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };

  // -----------------------------------------------------
  // ⭐ REAL ADMIN REGISTRATION (NO USEAUTH, NO ACCESS CODE)
  // -----------------------------------------------------
  const registerAdmin = async () => {
    const { email, password, name, phone } = formData;

    // 1. Create Supabase auth user
    const { data: authData, error: authError } =
      await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

    if (authError) throw new Error(authError.message);

    const authUser = authData.user;

    if (!authUser) throw new Error("Failed to create admin user.");

    // 2. Insert into `users` table
    const { error: profileErr } = await supabase.from("users").insert([
      {
        id: authUser.id,
        name: formData.name,
        phone: normalizeGhanaPhoneNumber(phone),
        email: email.trim().toLowerCase(),
        role: "admin",
        profile_completed: true,
      },
    ]);

    if (profileErr) throw new Error(profileErr.message);

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Basic checks
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!isValidGhanaPhoneNumber(formData.phone)) {
      setError("Please enter a valid Ghana phone number (+233XXXXXXXXX)");
      return;
    }

    if (!formData.organisation.trim()) {
      setError("Please enter your organisation / institution");
      return;
    }

    if (!formData.position.trim()) {
      setError("Please enter your role/position in the organisation");
      return;
    }

    if (!formData.reason.trim()) {
      setError("Please tell us briefly why you need admin access");
      return;
    }

    if (formData.yearsExperience) {
      const years = Number(formData.yearsExperience);
      if (Number.isNaN(years) || years < 0) {
        setError("Years of experience must be a valid number");
        return;
      }
    }

    try {
      setLoading(true);
      await registerAdmin();
      setSuccess("Admin account created successfully. You can now sign in.");
    } catch (err: any) {
      console.error("Admin registration failed:", err);
      setError(err.message || "Admin registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-purple-100">

          {/* header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Admin Registration
              </h2>
              <p className="text-sm text-gray-600">
                This section is for system administrators only.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {success}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Ama Mensah"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="e.g. admin@farmconnect.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+233 123 456 789"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Organisation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organisation / Institution
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  name="organisation"
                  value={formData.organisation}
                  onChange={handleChange}
                  required
                  placeholder="e.g. FarmConnect HQ"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Position + years */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role / Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                  placeholder="e.g. System Admin"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years Experience
                </label>
                <input
                  type="number"
                  name="yearsExperience"
                  value={formData.yearsExperience}
                  onChange={handleChange}
                  placeholder="e.g. 3"
                  min={0}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Why do you need admin access?
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Explain your responsibility..."
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Create a password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Re-type your password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader className="mr-2 h-5 w-5 animate-spin" /> Creating Admin...
                </>
              ) : (
                "Create Admin Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-purple-600 font-semibold"
            >
              Back to Login
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
