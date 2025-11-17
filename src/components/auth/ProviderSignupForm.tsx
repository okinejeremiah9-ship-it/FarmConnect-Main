import React, { useState } from 'react';
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
} from 'lucide-react';

import {
  normalizeGhanaPhoneNumber,
  isValidGhanaPhoneNumber,
} from '../../utils/phone';
import { useGeolocationCapture } from '../../hooks/useGeolocationCapture';

interface ProviderSignupFormProps {
  onSwitchToLogin: () => void;
  onSignupSuccess: (phone: string) => void;
  onSelectRole?: () => void;
}

export const ProviderSignupForm: React.FC<ProviderSignupFormProps> = ({
  onSwitchToLogin,
  onSignupSuccess,
  onSelectRole,
}) => {
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    serviceCategories: '',
    serviceDescription: '',
    pricingInfo: '',
    yearsExperience: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    coordinates,
    status: locationStatus,
    error: locationError,
    isCapturing,
    captureLocation,
  } = useGeolocationCapture();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidGhanaPhoneNumber(formData.phone)) {
      return setError('Please enter a valid Ghana phone number.');
    }

    const normalizedPhone = normalizeGhanaPhoneNumber(formData.phone);

    if (!coordinates) {
      return setError('Capture your business location first.');
    }

    const categories = formData.serviceCategories
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const years = formData.yearsExperience.trim()
      ? parseInt(formData.yearsExperience, 10)
      : null;

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-signup`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'provider',
            name: formData.contactPerson,
            email: formData.email || null,
            phone: normalizedPhone,
            password: formData.password,
            address: formData.address || null,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            business_name: formData.businessName,
            contact_person: formData.contactPerson,
            service_categories: categories,
            service_description: formData.serviceDescription,
            pricing_info: formData.pricingInfo || null,
            years_experience: years,
            profile_completed: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Signup failed');

      // IMPORTANT FIX:
      onSignupSuccess(normalizedPhone);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* UI unchanged */}
    </div>
  );
};

