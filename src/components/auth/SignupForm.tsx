import React, { useState } from 'react';
import { User, Phone, Lock, Eye, EyeOff, Loader, UserCheck } from 'lucide-react';
import {
  normalizeGhanaPhoneNumber,
  isValidGhanaPhoneNumber,
} from '../../utils/phone';
import { useUserSession } from '../../contexts/UserSessionContext';

interface SignupFormProps {
  onSwitchToLogin: () => void;
  onSignupSuccess: (user: any) => void;
  adminInviteToken?: string;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSwitchToLogin,
  onSignupSuccess,
  adminInviteToken,
}) => {
  const { setUser, refreshUser } = useUserSession();

  // Allow admin creation during development
  const DEV_MODE_ALLOW_ADMIN_SIGNUP = true;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: adminInviteToken ? 'admin' : ('farmer' as 'farmer' | 'provider' | 'admin'),
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation checks
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!isValidGhanaPhoneNumber(formData.phone)) {
      setError('Please enter a valid Ghana phone number (+233XXXXXXXXX)');
      return;
    }

    setLoading(true);

    try {
      const normalizedPhone = normalizeGhanaPhoneNumber(formData.phone);

      // 🔹 Call your Supabase Edge Function for signup
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-signup`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            phone: normalizedPhone,
            password: formData.password,
            role: formData.role,
            admin_invite_token: adminInviteToken,
          }),
          // inside handleSubmit -> JSON.stringify(...)
body: JSON.stringify({
  name: formData.name,
  phone: normalizedPhone,
  password: formData.password,
  role: formData.role,
  // Providers will complete their profile (e.g. service categories) after signup
  admin_invite_token: adminInviteToken,
}),

        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Signup failed');
      }

      const newUser = data.user;

      // 🔹 Fetch full profile from Supabase after creation
      const fullProfile = await refreshUser(newUser.id, newUser);

      // 🔹 Persist to localStorage + context
      setUser(fullProfile);

      // 🔹 Trigger parent success handler
      onSignupSuccess(fullProfile);

      alert('✅ Account created successfully! Welcome to FarmConnect.');
    } catch (err) {
      console.error('Signup Error:', err);
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-6">
          {adminInviteToken ? (
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-purple-600" />
            </div>
          ) : null}
          <h2 className="text-2xl font-bold text-gray-900">
            {adminInviteToken ? 'Admin Registration' : 'Create Account'}
          </h2>
          <p className="text-gray-600">
            {adminInviteToken
              ? 'Complete your admin account setup'
              : 'Join FarmConnect to get started'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="+233123456789 or 0123456789"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              You can enter as +233XXXXXXXXX or 0XXXXXXXXX (Ghana numbers only)
            </p>
          </div>

          {/* Role Selection */}
          {!adminInviteToken && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="farmer">Farmer - Request Services</option>
                <option value="provider">Service Provider - Offer Services</option>
                {DEV_MODE_ALLOW_ADMIN_SIGNUP && (
                  <option value="admin">Admin - Manage Platform (DEV ONLY)</option>
                )}
              </select>
              {DEV_MODE_ALLOW_ADMIN_SIGNUP && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ Admin option is only available in development mode
                </p>
              )}
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Create a password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {!adminInviteToken && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-green-600 hover:text-green-700 font-semibold"
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
