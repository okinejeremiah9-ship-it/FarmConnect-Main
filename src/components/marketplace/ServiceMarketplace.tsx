// src/components/marketplace/ServiceMarketplace.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ServiceListing, ServiceFilters } from "../../types/marketplace";
import { ServiceCard } from "./ServiceCard";
import { ServiceFiltersComponent } from "./ServiceFilters";
import { ServiceDetailsModal } from "./ServiceDetailsModal";
import { BookingModal } from "../bookings/BookingModal";
import { ChatModal } from "./ChatModal";
import { MapPin, AlertTriangle, Crosshair } from "lucide-react";
import { mapAPI } from "../../lib/api";
import { useUserSession } from "../../contexts/UserSessionContext";
import { useGeolocationCapture } from "../../hooks/useGeolocationCapture";
import { formatCoords } from "../../utils/location";
import { normalizeArrayField } from "../../utils/profile";

const DEFAULT_RADIUS = 50;

const parsePriceInfo = (raw?: string | null) => {
  if (!raw) return { price: null, unit: "session" };

  const num = raw.match(/(\d+[\.,]?\d*)/);
  const price = num ? parseFloat(num[1].replace(",", "")) : null;

  const lower = raw.toLowerCase();
  let unit: "day" | "hour" | "session" | "fixed" = "session";

  if (lower.includes("hour")) unit = "hour";
  else if (lower.includes("day")) unit = "day";
  else if (lower.includes("season")) unit = "fixed";

  return { price, unit };
};

const generateAvailableDates = (num = 5) =>
  Array.from({ length: num }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split("T")[0];
  });

const applySearchFilter = (items: ServiceListing[], query: string) => {
  if (!query.trim()) return items;

  const q = query.toLowerCase();
  return items.filter((s) => {
    const fields = [
      s.title,
      s.description,
      s.providerName,
      s.location ?? "",
      s.pricingInfo ?? "",
      ...(s.specializations ?? []),
    ]
      .filter(Boolean)
      .map((f) => f.toLowerCase());

    return fields.some((f) => f.includes(q));
  });
};

export const ServiceMarketplace: React.FC = () => {
  const { user: sessionUser } = useUserSession();
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [filtered, setFiltered] = useState<ServiceListing[]>([]);
  const [filters, setFilters] = useState<ServiceFilters>({
    radiusKm: DEFAULT_RADIUS,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationSource, setLocationSource] =
    useState<"gps" | "profile" | null>(null);

  const {
    coordinates,
    captureLocation,
    status: geoStatus,
    error: geoError,
    isCapturing,
  } = useGeolocationCapture({
    enableHighAccuracy: true,
    autoSyncToSupabase: true,
    userId: sessionUser?.id,
  });

  // Load GPS or fallback profile location
  useEffect(() => {
    if (coordinates) {
      setUserLocation({
        lat: coordinates.latitude,
        lng: coordinates.longitude,
      });
      setLocationSource("gps");
      return;
    }

    if (sessionUser?.id) {
      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-profile?id=${sessionUser.id}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      )
        .then((r) => r.json())
        .then((data) => {
          if (
            data.success &&
            data.user.latitude != null &&
            data.user.longitude != null
          ) {
            setUserLocation({
              lat: parseFloat(data.user.latitude),
              lng: parseFloat(data.user.longitude),
            });
            setLocationSource("profile");
          }
        })
        .catch(() => {});
    }
  }, [coordinates, sessionUser?.id]);

  const mapProviderToListing = (p: any): ServiceListing => {
    const categories = normalizeArrayField(p.service_categories);

    const { price, unit } = parsePriceInfo(p.pricing_info);

    const latitude =
      p.latitude !== undefined && p.latitude !== null
        ? parseFloat(String(p.latitude))
        : undefined;

    const longitude =
      p.longitude !== undefined && p.longitude !== null
        ? parseFloat(String(p.longitude))
        : undefined;

    const distanceKm =
      typeof p.distance_km === "number"
        ? p.distance_km
        : p.distance_km
        ? parseFloat(String(p.distance_km))
        : null;

    const ratingValue = p.rating_value
      ? parseFloat(String(p.rating_value))
      : 0;

    return {
      id: p.id,
      providerId: p.id,
      providerName:
        p.business_name || p.name || p.contact_person || "Service Provider",
      providerRating: ratingValue,

      title: p.business_name || p.service_description || "Service",
      description: p.service_description,
      category: categories[0] || "General",
      specializations: categories,
      pricingInfo: p.pricing_info,
      price,
      priceUnit: unit,

      location: p.address ?? "Location not provided",
      coordinates:
        latitude !== undefined && longitude !== undefined
          ? { lat: latitude, lng: longitude }
          : undefined,

      distanceKm,
      availableDates: generateAvailableDates(),

      images: p.profile_pic ? [p.profile_pic] : undefined,
      phone: p.phone,
      email: p.email,
    };
  };

  const fetchProviders = async (active: ServiceFilters) => {
    if (!userLocation) {
      setLocationError("❗ No location available.");
      return;
    }

    setLoading(true);
    setLocationError(null);

    try {
      const res = await mapAPI.getNearbyServices({
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: active.radiusKm ?? DEFAULT_RADIUS,
        category: active.category,
        minRating: active.minRating,
        farmerId: sessionUser?.id,
      });

      if (!res.success) throw new Error(res.error);

      const mapped = res.providers.map(mapProviderToListing);

      setServices(mapped);
      setFiltered(applySearchFilter(mapped, search));

      if (mapped.length === 0) {
        setLocationError("No providers found. Try increasing your radius.");
      }
    } catch (e: any) {
      setLocationError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userLocation) fetchProviders(filters);
  }, [userLocation]);

  useEffect(() => {
    setFiltered(applySearchFilter(services, search));
  }, [search, services]);

  const locationSummary = useMemo(() => {
    if (!userLocation) return null;

    const coords = formatCoords(userLocation.lat, userLocation.lng);
    const src =
      locationSource === "gps" ? "current GPS location" : "your farm profile";

    return `Showing providers within ${filters.radiusKm} km of ${coords} (${src})`;
  }, [userLocation, locationSource, filters.radiusKm]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto p-6">
          <h1 className="text-2xl font-bold">Service Marketplace</h1>
          <p className="text-gray-600">
            Find trusted agricultural services near you
          </p>

          {locationSummary && (
            <div className="mt-3 flex text-sm text-gray-500">
              <MapPin className="w-4 h-4 text-green-600 mr-2" />
              {locationSummary}
            </div>
          )}

          {geoStatus && <p className="text-xs text-blue-500">{geoStatus}</p>}
          {geoError && <p className="text-xs text-red-500">{geoError}</p>}

          <button
            onClick={captureLocation}
            disabled={isCapturing}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Crosshair className="w-5 h-5 mr-2" />
            {isCapturing ? "Capturing..." : "Use Current Location"}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto p-6">
        {locationError && (
          <div className="bg-red-50 border border-red-200 px-4 py-3 text-red-700 rounded-lg flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {locationError}
          </div>
        )}

        <ServiceFiltersComponent
          filters={filters}
          onFiltersChange={(f) => setFilters(f)}
        />

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
          {loading ? (
            <p>Loading nearby services…</p>
          ) : filtered.length === 0 ? (
            <p>No services found.</p>
          ) : (
            filtered.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
