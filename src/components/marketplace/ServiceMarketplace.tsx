// src/components/marketplace/ServiceMarketplace.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { ServiceListing, ServiceFilters } from '../../types/marketplace';
import { ServiceCard } from './ServiceCard';
import { ServiceFiltersComponent } from './ServiceFilters';
import { ServiceDetailsModal } from './ServiceDetailsModal';
import { BookingModal } from '../bookings/BookingModal';
import { ChatModal } from './ChatModal';
import { Search, MapPin, Filter, AlertTriangle, Crosshair } from 'lucide-react';
import { mapAPI } from '../../lib/api';
import { useUserSession } from '../../contexts/UserSessionContext';
import { useGeolocationCapture } from '../../hooks/useGeolocationCapture'; // ✅ integrated
import { formatCoords } from '../../utils/location'; // ✅ new helper

interface Coordinates {
  lat: number;
  lng: number;
}

interface NearbyProviderResponse {
  success: boolean;
  providers: any[];
  center: { lat: number; lng: number };
  radius: number;
  error?: string;
}

const DEFAULT_RADIUS = 50;

const parsePriceInfo = (
  pricingInfo?: string | null
): { price: number | null; unit: 'hour' | 'day' | 'session' | 'fixed' } => {
  if (!pricingInfo) return { price: null, unit: 'session' };

  const lower = pricingInfo.toLowerCase();
  const priceMatch = pricingInfo.match(/(\d+[\.,]?\d*)/);
  const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : null;

  let unit: 'hour' | 'day' | 'session' | 'fixed' = 'session';
  if (lower.includes('hour')) unit = 'hour';
  else if (lower.includes('day')) unit = 'day';
  else if (lower.includes('season') || lower.includes('project')) unit = 'fixed';

  return { price, unit };
};

const generateAvailableDates = (days = 5): string[] =>
  Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return date.toISOString().split('T')[0];
  });

const applySearchFilter = (services: ServiceListing[], query: string): ServiceListing[] => {
  if (!query.trim()) return services;
  const normalized = query.toLowerCase();
  return services.filter((service) => {
    const haystacks = [
      service.title,
      service.description,
      service.providerName,
      service.location,
      service.pricingInfo,
      ...(service.specializations ?? []),
    ]
      .filter(Boolean)
      .map((value) => value!.toString().toLowerCase());
    return haystacks.some((value) => value.includes(normalized));
  });
};

export const ServiceMarketplace: React.FC = () => {
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceListing[]>([]);
  const [filters, setFilters] = useState<ServiceFilters>({ radiusKm: DEFAULT_RADIUS });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [profileAddress, setProfileAddress] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name?: string; role?: string } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { user: sessionUser } = useUserSession();

  // ✅ New hook to auto-capture location
  const {
    coordinates,
    captureLocation,
    error: geoError,
    status: geoStatus,
    isCapturing,
  } = useGeolocationCapture({
    enableHighAccuracy: true,
    timeout: 12000,
    autoSyncToSupabase: true,
    userId: sessionUser?.id,
  });

  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationSource, setLocationSource] = useState<'gps' | 'profile' | null>(null);

  // ✅ Fallback to profile
  const loadProfileLocation = async (userId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-profile?id=${userId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const profile = data.user;
        setProfileAddress(profile.address ?? null);

        if (profile.latitude && profile.longitude) {
          setUserLocation({
            lat: parseFloat(profile.latitude),
            lng: parseFloat(profile.longitude),
          });
          setLocationSource('profile');
        }
      }
    } catch (err) {
      console.error('Profile location fallback failed:', err);
    }
  };

  useEffect(() => {
    if (coordinates) {
      setUserLocation({ lat: coordinates.latitude, lng: coordinates.longitude });
      setLocationSource('gps');
    } else if (!coordinates && sessionUser?.id) {
      loadProfileLocation(sessionUser.id);
    }
  }, [coordinates, sessionUser?.id]);

  const mapProviderToListing = (provider: any): ServiceListing => {
    const categories: string[] = Array.isArray(provider.service_categories)
      ? provider.service_categories
      : typeof provider.service_categories === 'string'
        ? provider.service_categories.split(',').map((i: string) => i.trim()).filter(Boolean)
        : [];
    const { price, unit } = parsePriceInfo(provider.pricing_info);
    const latitude = provider.latitude ? parseFloat(provider.latitude) : null;
    const longitude = provider.longitude ? parseFloat(provider.longitude) : null;

    return {
      id: provider.id,
      providerId: provider.id,
      providerName: provider.business_name ||
provider.name ||
provider.contact_person ||
'Service Provider'
,
      providerRating: typeof provider.rating === 'number'
        ? provider.rating
        : provider.rating
          ? parseFloat(provider.rating)
          : null,
      title: provider.business_name || provider.service_description || 'Agricultural Service',
      category: categories[0],
      description: provider.service_description,
      price,
      priceUnit: unit,
      pricingInfo: provider.pricing_info,
      location: provider.address,
      coordinates: latitude && longitude ? { lat: latitude, lng: longitude } : undefined,
      distanceKm: provider.distance_km ?? null,
      availableDates: generateAvailableDates(),
      specializations: categories,
      images: provider.profile_pic ? [provider.profile_pic] : undefined,
      phone: provider.phone ?? null,
      email: provider.email ?? null,
    };
  };

  const fetchNearbyProviders = async (activeFilters: ServiceFilters) => {
    if (!userLocation) {
      setLocationError('❗ No location available. Enable GPS or save coordinates in your profile.');
      return;
    }

    setLoading(true);
    setLocationError(null);

    try {
      const response = (await mapAPI.getNearbyServices({
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: activeFilters.radiusKm ?? DEFAULT_RADIUS,
        category: activeFilters.category,
        minRating: activeFilters.minRating,
      })) as NearbyProviderResponse;

      if (!response.success) throw new Error(response.error || 'Failed to fetch providers');

      const mapped = (response.providers ?? []).map(mapProviderToListing);
      setServices(mapped);
      setFilteredServices(applySearchFilter(mapped, searchQuery));

      if (mapped.length === 0) {
        setLocationError('No providers found near your area. Try increasing your radius.');
      }
    } catch (err: any) {
      console.error('Nearby provider fetch failed:', err);
      setLocationError(err.message || 'Error fetching nearby providers.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Trigger fetch on location change
  useEffect(() => {
    if (userLocation && !loading) fetchNearbyProviders(filters);
  }, [userLocation]);

  useEffect(() => setFilteredServices(applySearchFilter(services, searchQuery)), [searchQuery, services]);

  const handleFiltersChange = (updated: ServiceFilters) => {
    const merged = { ...filters, ...updated };
    setFilters(merged);
    fetchNearbyProviders(merged);
  };

  const locationSummary = useMemo(() => {
    if (!userLocation) return null;
    const coords = formatCoords(userLocation.lat, userLocation.lng);
    const source = locationSource === 'gps' ? 'your current GPS position' : 'your farm profile';
    return `Showing providers within ${filters.radiusKm ?? DEFAULT_RADIUS} km of ${coords} (${source}).`;
  }, [userLocation, locationSource, filters.radiusKm]);

  const handleRefreshLocation = () => captureLocation();

  if (!userLocation && !geoStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Determining your location…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Service Marketplace</h1>
              <p className="text-gray-600">Find trusted agricultural services near you</p>

              {locationSummary && (
                <div className="mt-3 flex items-start text-sm text-gray-500">
                  <MapPin className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                  <span>{locationSummary}</span>
                </div>
              )}
              {geoStatus && <p className="text-xs text-blue-500 mt-1">{geoStatus}</p>}
              {geoError && <p className="text-xs text-red-500 mt-1">{geoError}</p>}
            </div>

            <button
              onClick={handleRefreshLocation}
              disabled={isCapturing}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <Crosshair className="w-5 h-5 mr-2" />
              {isCapturing ? 'Capturing...' : 'Use Current Location'}
            </button>
          </div>

          {locationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 mt-0.5" />
              <div className="flex-1 text-sm">{locationError}</div>
            </div>
          )}
        </div>
      </div>

      {/* Filters + listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <ServiceFiltersComponent filters={filters} onFiltersChange={handleFiltersChange} />
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                {loading
                  ? 'Loading nearby services…'
                  : `${filteredServices.length} service${filteredServices.length === 1 ? '' : 's'} found`}
              </p>
            </div>

            {loading ? (
              <div className="bg-white border border-dashed border-green-200 rounded-xl p-12 text-center text-gray-500">
                Fetching the best matches for your farm…
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No services found nearby</h3>
                <p className="text-gray-600 mb-3">
                  Try increasing your radius or adjusting filters.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onViewDetails={() => setShowDetailsModal(true)}
                    onBookService={() => setShowBookingModal(true)}
                    onMessageProvider={() => setShowChatModal(true)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
