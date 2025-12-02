// src/components/auth/SignupForm.tsx
import React, { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff, Loader, UserCheck } from "lucide-react";
import { useUserSession } from "../../contexts/UserSessionContext";
import { supabase } from "../../lib/supabase";

interface SignupFormProps {
  onSwitchToLogin: () => void;
  onSignupSuccess: (email: string) => void;
  adminInviteToken?: string;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSwitchToLogin,
  onSignupSuccess,
  adminInviteToken,
}) => {
  const { setUser, refreshUser } = useUserSession();

  const DEV_MODE_ALLOW_ADMIN_SIGNUP = true;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: adminInviteToken ? "admin" : ("farmer" as "farmer" | "provider" | "admin"),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // -------------------------------------------
  // SUBMIT HANDLER (Email-based)
  // -------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Create Supabase Auth User (email)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Signup failed. Please try again.");

      const authUser = signUpData.user;

      // 2️⃣ Create user profile in your `users` table
      const { data: profileRow, error: profileError } = await supabase
        .from("users")
        .insert([
          {
            id: authUser.id,
            name: formData.name,
            email: formData.email.trim().toLowerCase(),
            role: formData.role,
          },
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      // 3️⃣ Fetch merged profile via Edge Function
      const fullProfile = await refreshUser(authUser.id, profileRow);

      // 4️⃣ Save profile to localStorage + context
      setUser(fullProfile);

      // 5️⃣ Trigger parent flow → Splash → Welcome
      onSignupSuccess(formData.email);

    } catch (err) {
      console.error("❌ Signup Error:", err);
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------
  // INPUT CHANGE HANDLER
  // -------------------------------------------
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // -------------------------------------------
  // UI RENDER
  // -------------------------------------------
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white p-8 rounded-xl shadow-lg">

        {/* HEADER */}
        <div className="text-center mb-6">
          {adminInviteToken && (
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-purple-600" />
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-900">
            {adminInviteToken ? "Admin Registration" : "Create Account"}
          </h2>

          <p className="text-gray-600">
            {adminInviteToken
              ? "Complete your admin account setup"
              : "Join FarmConnect to get started"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* NAME */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 py-3 border rounded-lg"
                placeholder="Your name"
                required
              />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 py-3 border rounded-lg"
                placeholder="example@gmail.com"
                required
              />
            </div>
          </div>

          {/* ROLE */}
          {!adminInviteToken && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              >
                <option value="farmer">Farmer - Request Services</option>
                <option value="provider">Provider - Offer Services</option>
                {DEV_MODE_ALLOW_ADMIN_SIGNUP && (
                  <option value="admin">Admin (DEV ONLY)</option>
                )}
              </select>
            </div>
          )}

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-3 border rounded-lg"
                placeholder="Create a password"
                required
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

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 py-3 border rounded-lg"
                placeholder="Re-enter password"
                required
              />
            </div>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {!adminInviteToken && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <button
                onClick={onSwitchToLogin}
                className="text-green-600 font-semibold"
              >
                Sign In
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
