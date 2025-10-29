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

    latitude: '',
    longitude: '',



              <label className="block text-sm font-medium text-gray-700 mb-2">Latitude (optional)</label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="5.6037"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longitude (optional)</label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="-0.1870"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>

