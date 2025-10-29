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

    latitude: '',
    longitude: '',


  const [capturingLocation, setCapturingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);



  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser. Please update your profile from a GPS-enabled device.');
      return;
    }

    setError('');
    setCapturingLocation(true);
    setLocationStatus('Capturing your current location…');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        setLocationStatus(`Location captured: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setCapturingLocation(false);
      },
      (geoError) => {
        console.error('Provider signup geolocation error:', geoError);
        setCapturingLocation(false);
        setLocationStatus('Unable to capture your GPS position. Please allow location access and try again.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };




    if (!coordinates) {
      setError('Capture your business location so farmers nearby can discover you.');

    const latitude = formData.latitude ? parseFloat(formData.latitude) : null;
    if (formData.latitude && Number.isNaN(latitude!)) {
      setError('Latitude must be a valid number');
      return;
    }

    const longitude = formData.longitude ? parseFloat(formData.longitude) : null;
    if (formData.longitude && Number.isNaN(longitude!)) {
      setError('Longitude must be a valid number');


          latitude: coordinates.lat,
          longitude: coordinates.lng,

          latitude,
          longitude,


          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Service discovery location *</p>
              <p className="text-sm text-blue-700">
                {coordinates
                  ? locationStatus
                  : locationStatus ||
                    'Capture your current location so farmers within range can see your services in the marketplace.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCaptureLocation}
              disabled={capturingLocation}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-white transition ${
                capturingLocation ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <MapPin className="w-4 h-4 mr-2" />
              {capturingLocation ? 'Capturing…' : coordinates ? 'Retake location' : 'Capture location'}
            </button>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Latitude (optional)</label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="5.6037"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

