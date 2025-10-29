import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  normalizeGhanaPhoneNumber,
  isValidGhanaPhoneNumber,
} from '../../utils/phone';

interface FarmerSignupFormProps {
  onSwitchToLogin: () => void;
  onSignupSuccess: (phone: string) => void;
  onSelectRole?: () => void;
}

export const FarmerSignupForm: React.FC<FarmerSignupFormProps> = ({
  onSwitchToLogin,
  onSignupSuccess,
  onSelectRole,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    farmSize: '',
    cropTypes: '',
    numWorkers: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!formData.farmSize.trim()) {
      setError('Please tell us about your farm size');
      return;
    }

    if (!formData.cropTypes.trim()) {
      setError('Please list at least one crop type');
      return;
    }

    if (!isValidGhanaPhoneNumber(formData.phone)) {
      setError('Please enter a valid Ghana phone number (+233XXXXXXXXX)');
      return;
    }

    const normalizedPhone = normalizeGhanaPhoneNumber(formData.phone);

    const cropTypes = formData.cropTypes
      .split(',')
      .map((crop) => crop.trim())
      .filter(Boolean);

    let numWorkers: number | null = null;
    if (formData.numWorkers.trim()) {
      const parsedWorkers = parseInt(formData.numWorkers, 10);
      if (Number.isNaN(parsedWorkers)) {
        setError('Number of workers must be a valid number');
        return;
      }
      numWorkers = parsedWorkers;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-signup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'farmer',
          name: formData.name,
          email: formData.email || null,
          phone: normalizedPhone,
          password: formData.password,
          address: formData.address || null,
          farm_size: formData.farmSize,
          crop_types: cropTypes,
          num_workers: numWorkers,
          profile_completed: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      onSignupSuccess(data.user.phone);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-green-100">
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          <button
            onClick={onSelectRole}
            className="hover:text-green-600 transition-colors"
            type="button"
          >
            Choose a different account type
          </button>
        </div>
        <div className="text-center mb-8">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 mb-4">
            Farmer account setup
          </span>
          <h2 className="text-3xl font-bold text-gray-900">Tell us about your farm</h2>
          <p className="text-gray-600 mt-2">
            We use this information to match you with the best service providers in your area.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ama Kwarteng"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email (optional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ama@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
              <div className="r
