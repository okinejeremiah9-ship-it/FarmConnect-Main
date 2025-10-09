import React, { useState, useEffect } from 'react';
import { MapPin, Filter, X } from 'lucide-react';
import { mapAPI } from '../../lib/api';

interface InteractiveMapProps {
  onClose?: () => void;
  onProviderSelect?: (provider: any) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ onClose, onProviderSelect }) => {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [radius, setRadius] = useState(50);
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { value: 'all', label: 'All Services' },
    { value: 'machinery', label: 'Machinery' },
    { value: 'mechanic', label: 'Mechanic' },
    { value: 'extension', label: 'Extension' },
    { value: 'labour', label: 'Labour' },
  ];

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      loadNearbyProviders();
    }
  }, [userLocation, selectedCategory, radius]);

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Location error:', error);
          setUserLocation({ lat: 5.6037, lng: -0.1870 });
        }
      );
    } else {
      setUserLocation({ lat: 5.6037, lng: -0.1870 });
    }
  };

  const loadNearbyProviders = async () => {
    if (!userLocation) return;

    try {
      setLoading(true);
      const data = await mapAPI.getNearbyServices(
        userLocation.lat,
        userLocation.lng,
        radius,
        selectedCategory === 'all' ? undefined : selectedCategory
      );
      setProviders(data.providers || []);
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!userLocation) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Getting your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="bg-green-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6" />
          <div>
            <h2 className="font-semibold text-lg">Nearby Providers</h2>
            <p className="text-sm text-green-100">{providers.length} providers found</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
          >
            <Filter className="h-5 w-5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 border-b border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Radius: {radius} km
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>5 km</span>
              <span>100 km</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading providers...</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No providers found in this area</p>
            <button
              onClick={() => setRadius(radius + 20)}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Expand Search Radius
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                onClick={() => onProviderSelect?.(provider)}
              >
                <div className="flex items-start gap-3">
                  {provider.profile_pic ? (
                    <img
                      src={provider.profile_pic}
                      alt={provider.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-semibold">
                        {provider.name?.[0] || 'P'}
                      </span>
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                    {provider.bio && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{provider.bio}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1 text-yellow-600">
                        <span>⭐</span>
                        <span>{provider.rating?.toFixed(1) || '0.0'}</span>
                        <span className="text-gray-500">({provider.total_reviews || 0})</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{provider.distance} km away</span>
                      </div>
                    </div>
                    {provider.services_offered && provider.services_offered.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {provider.services_offered.map((service: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 border-t border-gray-200 text-center text-sm text-gray-600">
        📍 Showing providers within {radius}km of your location
      </div>
    </div>
  );
};
