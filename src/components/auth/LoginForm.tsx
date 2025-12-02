// src/components/auth/LoginForm.tsx
import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Loader } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom"; // ⭐ ADDED

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onLoginSuccess: () => Promise<void> | void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onLoginSuccess,
}) => {
  const navigate = useNavigate(); // ⭐ ADDED

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.email.trim()) {
        throw new Error("Email is required.");
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (authError) throw new Error("Invalid email or password.");

      await onLoginSuccess();
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="login"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-md mx-auto"
    >
      <motion.div className="bg-white p-8 rounded-xl shadow-lg">

        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Welcome Back
        </h2>

        {error && (
          <motion.div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />

              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
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

          {/* LOGIN BUTTON */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader className="h-5 w-5 animate-spin mr-2" />
                Signing In...
              </div>
            ) : (
              "Sign In"
            )}
          </motion.button>
        </form>

        {/* NORMAL SIGNUP */}
        <div className="mt-6 text-center text-gray-600">
          Don't have an account?{" "}
          <button
            onClick={onSwitchToRegister}
            className="text-green-600 font-semibold"
          >
            Sign Up
          </button>
        </div>

        {/* ⭐ ⭐ ADMIN SIGNUP BUTTON ⭐ ⭐ */}
        <div className="mt-4 text-center">
          <button
            onClick={() =>
              navigate("/admin-signup?token=TEMP_ADMIN_ACCESS")
            }
            className="text-purple-700 hover:text-purple-900 font-semibold underline"
          >
            Admin Signup
          </button>
        </div>
        {/* END ADMIN BUTTON */}

      </motion.div>
    </motion.div>
  );
};
