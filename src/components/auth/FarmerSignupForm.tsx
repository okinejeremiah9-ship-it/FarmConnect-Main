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

    if (!isValidGhanaPhoneNumber(formData.phone)) {
      setError('Please enter a valid Ghana phone number (+233XXXXXXXXX)');
      return;
    }

    const normalizedPhone = normalizeGhanaPhoneNumber(formData.phone);

    const cropTypes = formData.cropTypes
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const numWorkers = formData.numWorkers.trim()
      ? parseInt(formData.numWorkers, 10)
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
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Signup failed');

      // IMPORTANT FIX — ALWAYS USE normalized phone
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

export default FarmerSignupForm;
