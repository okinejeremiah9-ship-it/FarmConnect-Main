import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Filter, 
  Navigation, 
  Tractor, 
  Wrench, 
  BookOpen, 
  Users,
  Star,
  MessageSquare,
  User,
  Calendar,
  X
} from 'lucide-react';

interface ServiceMapProps {
  onProviderSelect?: (provider: any) => void;
}

export const ServiceMap: React.FC<ServiceMapProps> = ({ onProviderSelect }) => {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [filters, setFilters] = useState({
    category: 'all',
    radius: 25,
    availability: 'all'
  });
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchNearbyServices();
    }
  }, [userLocation, filters]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Accra, Ghana
          setUserLocation({ lat: 5.6037, lng: -0.1870 });
        }
      );
    } else {
      // Default to Accra, Ghana
      setUserLocation({ lat: 5.6037, lng: -0.1870 });
    }
  };

  const fetchNearbyServices = async () => {
    if (!userLocation) return;

    try {
      const params = new URLSearchParams({
        lat: userLocation.lat.toString(),
        lng: userLocation.lng.toString(),
        radius: filters.radius.toString(),
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.availability !== 'all' && { availability: filters.availability })
      });

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-nearby-services?${params}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch providers');
      }

      setProviders(data.providers || []);
    } catch (error) {
      console.error('Error fetching nearby services:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'machinery':
        return <Tractor className="w-4 h-4" />;
      case 'mechanic':
        return <Wrench className="w-4 h-4" />;
      case 'extension':
        return <BookOpen className="w-4 h-4" />;
      case 'labour':
        return <Users className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'machinery':
        return 'bg-red-500';
      case 'mechanic':
        return 'bg-blue-500';
      case 'extension':
        return 'bg-orange-500';
      case 'labour':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getProviderPrimaryCategory = (servicesOffered: string[]) => {
    if (!servicesOffered || servicesOffered.length === 0) return 'other';
    return servicesOffered[0].toLowerCase();
  };

  const handleProviderClick = (provider: any) => {
    setSelectedProvider(provider);
    if (onProviderSelect) {
      onProviderSelect(provider);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading nearby services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Service Map</h1>
              <p className="text-gray-600">Find services near you</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-80 bg-white shadow-lg p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
            
            {/* Category Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Categories</option>
                <option value="machinery">Machinery Rental</option>
                <option value="mechanic">Equipment Repair</option>
                <option value="extension">Agricultural Advisory</option>
                <option value="labour">Farm Labour</option>
              </select>
            </div>

            {/* Radius Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Radius: {filters.radius} km
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={filters.radius}
                onChange={(e) => setFilters(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5 km</span>
                <span>100 km</span>
              </div>
            </div>

            {/* Availability Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <select
                value={filters.availability}
                onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Any Time</option>
                <option value="available">Available Now</option>
              </select>
            </div>

            {/* Current Location */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Your Location</h4>
              <div className="flex items-center text-sm text-gray-600">
                <Navigation className="w-4 h-4 mr-2" />
                <span>
                  {userLocation 
                    ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                    : 'Getting location...'
                  }
                </span>
              </div>
              <button
                onClick={getCurrentLocation}
                className="mt-2 text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Update Location
              </button>
            </div>
          </div>
        )}

        {/* Map Area */}
        <div className="flex-1 relative">
          {/* Mock Map Interface */}
          <div className="h-full bg-green-50 relative overflow-hidden">
            {/* Map Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100">
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" viewBox="0 0 400 400">
                  {/* Mock map roads */}
                  <path d="M0,200 L400,200" stroke="#ccc" strokeWidth="2" />
                  <path d="M200,0 L200,400" stroke="#ccc" strokeWidth="2" />
                  <path d="M0,100 L400,100" stroke="#ddd" strokeWidth="1" />
                  <path d="M0,300 L400,300" stroke="#ddd" strokeWidth="1" />
                  <path d="M100,0 L100,400" stroke="#ddd" strokeWidth="1" />
                  <path d="M300,0 L300,400" stroke="#ddd" strokeWidth="1" />
                </svg>
              </div>
            </div>

            {/* Your Location Pin */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                You are here
              </div>
            </div>

            {/* Service Provider Pins */}
            {providers.map((provider, index) => {
              const angle = (index * 60) * (Math.PI / 180);
              const radius = 80 + (index * 20);
              const x = 50 + Math.cos(angle) * (radius / 4);
              const y = 50 + Math.sin(angle) * (radius / 4);
              const primaryCategory = getProviderPrimaryCategory(provider.services_offered);

              return (
                <div
                  key={provider.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onClick={() => handleProviderClick(provider)}
                >
                  <div className={`${getCategoryColor(primaryCategory)} text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform`}>
                    {getCategoryIcon(primaryCategory)}
                  </div>
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs whitespace-nowrap">
                    {provider.distance}km
                  </div>
                </div>
              );
            })}
          </div>

          {/* Service List */}
          <div className="absolute bottom-0 left-0 right-0 bg-white shadow-lg max-h-64 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {providers.length} providers found within {filters.radius}km
              </h3>
              <div className="space-y-3">
                {providers.map((provider) => {
                  const primaryCategory = getProviderPrimaryCategory(provider.services_offered);
                  return (
                    <div
                      key={provider.id}
                      className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 ${
                        selectedProvider?.id === provider.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                      onClick={() => handleProviderClick(provider)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <div className={`${getCategoryColor(primaryCategory)} text-white p-1 rounded mr-2`}>
                              {getCategoryIcon(primaryCategory)}
                            </div>
                            <h4 className="font-semibold text-gray-900">{provider.full_name || provider.name}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{provider.services_offered?.join(', ')}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              {renderStars(Math.round(provider.rating || 0))}
                              <span className="ml-1">({provider.total_reviews || 0})</span>
                            </div>
                            <span>{provider.distance}km away</span>
                            {provider.address && <span>{provider.address}</span>}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <User className="w-4 h-4" />
                          </button>
                          <button
                            className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};