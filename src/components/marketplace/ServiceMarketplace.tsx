import React, { useEffect, useMemo, useState } from 'react';
import { ServiceListing, ServiceFilters } from '../../types/marketplace';
import { ServiceCard } from './ServiceCard';
import { ServiceFiltersComponent } from './ServiceFilters';
import { ServiceDetailsModal } from './ServiceDetailsModal';
import { BookingModal } from '../bookings/BookingModal';
import { ChatModal } from './ChatModal';
import { Search, MapPin, Filter, AlertTriangle } from 'lucide-react';
import { mapAPI } from '../../lib/api';
import { fetchUserProfileById } from '../../utils/supabaseFunctions';

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

const parsePriceInfo = (pricingInfo?: string | null): { price: number | null; unit: 'hour' | 'day' | 'session' | 'fixed' } => {
  if (!pricingInfo) {
    return { price: null, unit: 'session' };
  }

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
  Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index + 1);
    return date.toISOString().split('T')[0];
  });

const applySearchFilter = (services: ServiceListing[], query: string): ServiceListing[] => {
  if (!query.trim()) {
    return services;
  }

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
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationSource, setLocationSource] = useState<'profile' | 'browser' | null>(null);
  const [profileAddress, setProfileAddress] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name?: string; role?: string } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Location services are not supported in this browser.');
      setLocationLoading(false);
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationSource('browser');
        setLocationLoading(false);
      },
      (error) => {
        console.error('Browser geolocation failed:', error);
        setLocationError('We could not determine your location. Update your profile with coordinates to see nearby providers.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const mapProviderToListing = (provider: any): ServiceListing => {
    const categories: string[] = Array.isArray(provider.service_categories)
      ? provider.service_categories
      : typeof provider.service_categories === 'string'
        ? provider.service_categories.split(',').map((item: string) => item.trim()).filter(Boolean)
        : [];

    const primaryCategory = categories[0] ?? undefined;
    const { price, unit } = parsePriceInfo(provider.pricing_info);
    const latitude = provider.latitude ? parseFloat(provider.latitude) : null;
    const longitude = provider.longitude ? parseFloat(provider.longitude) : null;

    return {
      id: provider.id,
      providerId: provider.id,
      providerName: provider.business_name || provider.full_name || provider.name || 'Service Provider',
      providerRating: typeof provider.rating === 'number' ? provider.rating : provider.rating ? parseFloat(provider.rating) : null,
      title: provider.business_name || provider.service_description || 'Agricultural Service',
      category: primaryCategory,
      description: provider.service_description,
      price,
      priceUnit: unit,
      pricingInfo: provider.pricing_info,
      location: provider.address,
      district: provider.address,
      coordinates: latitude !== null && longitude !== null ? { lat: latitude, lng: longitude } : undefined,
      distanceKm: provider.distance_km ?? null,
      availability: price ? 'available' : undefined,
      availableDates: generateAvailableDates(),
      specializations: categories,
      images: provider.profile_pic ? [provider.profile_pic] : undefined,
      phone: provider.phone ?? null,
      email: provider.email ?? null,
    };
  };

  const fetchNearbyProviders = async (activeFilters: ServiceFilters) => {
    if (!userLocation) {
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

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch nearby providers');
      }

      const mapped = (response.providers ?? []).map(mapProviderToListing);
      setServices(mapped);
      setFilteredServices(applySearchFilter(mapped, searchQuery));

      if (mapped.length === 0) {
        setLocationError('No providers found within the selected radius. Try increasing the search distance or adjusting your filters.');
      }
    } catch (error) {
      console.error('Failed to load nearby services:', error);
      setServices([]);
      setFilteredServices([]);
      setLocationError('Unable to load nearby providers right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loadProfileLocation = async (userId: string) => {
    setLocationLoading(true);
    try {
      const data = await fetchUserProfileById(userId);
      const profile = data.user;

      setProfileAddress(profile?.address ?? null);

      const latitudeValue = typeof profile?.latitude === 'number'
        ? profile.latitude
        : profile?.latitude
        ? parseFloat(profile.latitude)
        : null;
      const longitudeValue = typeof profile?.longitude === 'number'
        ? profile.longitude
        : profile?.longitude
        ? parseFloat(profile.longitude)
        : null;

      if (latitudeValue !== null && !Number.isNaN(latitudeValue) && longitudeValue !== null && !Number.isNaN(longitudeValue)) {
        setUserLocation({ lat: latitudeValue, lng: longitudeValue });
        setLocationSource('profile');
        setLocationLoading(false);
        return;
      }

      requestBrowserLocation();
    } catch (error) {
      console.error('Failed to load profile location:', error);
      requestBrowserLocation();
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.id) {
          setCurrentUser(parsed);
          loadProfileLocation(parsed.id);
          return;
        }
      } catch (error) {
        console.warn('Failed to parse stored user session:', error);
      }
    }

    requestBrowserLocation();
  }, []);

  useEffect(() => {
    if (userLocation && !locationLoading) {
      fetchNearbyProviders(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  useEffect(() => {
    setFilteredServices(applySearchFilter(services, searchQuery));
  }, [searchQuery, services]);

  const handleViewDetails = (service: ServiceListing) => {
    setSelectedService(service);
    setShowDetailsModal(true);
  };

  const handleBookService = (service: ServiceListing) => {
    if (!currentUser) {
      setFeedback('Please sign in to book a service.');
      return;
    }

    if (service.price === null || service.price === undefined) {
      setFeedback('This provider has not shared pricing details. Contact them directly to arrange booking.');
      return;
    }

    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleMessageProvider = (service: ServiceListing) => {
    if (!currentUser) {
      setFeedback('Please sign in to message a provider.');
      return;
    }

    setSelectedService(service);
    setShowChatModal(true);
  };

  const handleFiltersChange = (updatedFilters: ServiceFilters) => {
    const merged = {
      ...updatedFilters,
      radiusKm: updatedFilters.radiusKm ?? filters.radiusKm ?? DEFAULT_RADIUS,
    };
    setFilters(merged);
    fetchNearbyProviders(merged);
  };

  const activeRadius = filters.radiusKm ?? DEFAULT_RADIUS;

  const locationSummary = useMemo(() => {
    if (!userLocation) return null;

    const sourceLabel = locationSource === 'profile' ? 'your farm profile' : 'your current location';
    const coordinates = `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`;

    return profileAddress
      ? `Showing providers within ${activeRadius} km of ${profileAddress} (${sourceLabel}).`
      : `Showing providers within ${activeRadius} km of ${coordinates} (${sourceLabel}).`;
  }, [userLocation, profileAddress, activeRadius, locationSource]);

  if (locationLoading) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            </div>

            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Search by service, provider or keywords"
                />
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </button>
          </div>

          {feedback && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 mt-0.5" />
              <div className="flex-1 text-sm">{feedback}</div>
              <button onClick={() => setFeedback(null)} className="text-xs text-yellow-700 hover:underline">
                Dismiss
              </button>
            </div>
          )}

          {locationError && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 mt-0.5" />
              <div className="flex-1 text-sm">{locationError}</div>
            </div>
          )}
        </div>
      </div>

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
                  Try increasing the search radius or adjusting your filters to see more providers.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onViewDetails={handleViewDetails}
                    onBookService={handleBookService}
                    onMessageProvider={handleMessageProvider}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showDetailsModal && selectedService && (
        <ServiceDetailsModal
          service={selectedService}
          onClose={() => setShowDetailsModal(false)}
          onBookService={() => {
            setShowDetailsModal(false);
            handleBookService(selectedService);
          }}
          onMessageProvider={() => {
            setShowDetailsModal(false);
            handleMessageProvider(selectedService);
          }}
        />
      )}

      {showBookingModal && selectedService && currentUser && (
        <BookingModal
          service={selectedService}
          onClose={() => setShowBookingModal(false)}
          onBookingComplete={() => setShowBookingModal(false)}
        />
      )}

      {showChatModal && selectedService && currentUser && (
        <ChatModal
          service={{
            providerId: selectedService.providerId,
            providerName: selectedService.providerName,
            title: selectedService.title,
            providerProfilePic: selectedService.images?.[0],
          }}
          userId={currentUser.id}
          userName={currentUser.name || 'Farmer'}
          onClose={() => setShowChatModal(false)}
        />
      )}
    </div>
  );
};
