// Location: src/components/marketplace/ServiceMarketplace.tsx

import React, { useEffect, useMemo, useState } from "react";
import { ServiceListing, ServiceFilters } from "../../types/marketplace";
import { ServiceCard } from "./ServiceCard";
import { ServiceFiltersComponent } from "./ServiceFilters";
import { useGeolocationCapture } from "../../hooks/useGeolocationCapture";
import { supabase } from "../../lib/supabase";
import { useUserSession } from "../../contexts/UserSessionContext";
import { ChatWindow } from "../chat/ChatWindow";

import { MapPin, AlertTriangle, Crosshair, Search, X } from "lucide-react";

// -----------------------------
// Helpers
// -----------------------------

const DEFAULT_RADIUS = 50;

// Parse "₵300 per hour" → { price: 300, unit: "hour" }
const parsePriceInfo = (raw?: string | null) => {
  if (!raw) return { price: null, unit: "session" as const };

  const numMatch = raw.match(/(\d+[\.,]?\d*)/);
  const price = numMatch ? parseFloat(numMatch[1].replace(",", "")) : null;

  const lower = raw.toLowerCase();
  let unit: "day" | "hour" | "session" | "fixed" = "session";

  if (lower.includes("hour")) unit = "hour";
  else if (lower.includes("day")) unit = "day";
  else if (lower.includes("season") || lower.includes("project")) unit = "fixed";

  return { price, unit };
};

// Simple haversine distance in km
const toRad = (value: number) => (value * Math.PI) / 180;

const distanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// -----------------------------
// Component
// -----------------------------

export const ServiceMarketplace: React.FC = () => {
  const { user: sessionUser } = useUserSession();

  const [allListings, setAllListings] = useState<ServiceListing[]>([]);
  const [filters, setFilters] = useState<ServiceFilters>({
    categories: [],
    radiusKm: DEFAULT_RADIUS,
    minRating: 0,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Chat state
  const [activeChatService, setActiveChatService] =
    useState<ServiceListing | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Geolocation hook
  const {
    coordinates,
    captureLocation,
    status: geoStatus,
    error: geoError,
    isCapturing,
  } = useGeolocationCapture({
    enableHighAccuracy: true,
    autoSyncToSupabase: false,
    userId: undefined,
  });

  // Update userLocation when coordinates change
  useEffect(() => {
    if (coordinates) {
      setUserLocation({
        lat: coordinates.latitude,
        lng: coordinates.longitude,
      });
      setLocationError(null);
    }
  }, [coordinates]);

  // Decide if row has services
  const rowHasServices = (row: any): boolean => {
    const categories = Array.isArray(row.service_categories)
      ? row.service_categories
      : [];
    const servicesOffered = Array.isArray(row.services_offered)
      ? row.services_offered
      : [];
    return (
      categories.length > 0 ||
      servicesOffered.length > 0 ||
      (row.service_description && row.service_description.trim().length > 0)
    );
  };

  // Map DB row → ServiceListing
  const mapRowToListing = (
    row: any,
    origin?: { lat: number; lng: number }
  ): ServiceListing | null => {
    // Skip farmers with no services
    if (row.role === "farmer" && !rowHasServices(row)) {
      return null;
    }

    const categories: string[] = Array.isArray(row.service_categories)
      ? row.service_categories
      : [];

    const servicesOffered: string[] = Array.isArray(row.services_offered)
      ? row.services_offered
      : [];

    const { price, unit } = parsePriceInfo(row.pricing_info);

    const lat =
      typeof row.latitude === "number"
        ? row.latitude
        : row.latitude != null
        ? parseFloat(String(row.latitude))
        : null;

    const lng =
      typeof row.longitude === "number"
        ? row.longitude
        : row.longitude != null
        ? parseFloat(String(row.longitude))
        : null;

    let dist: number | null = null;
    if (origin && lat != null && lng != null) {
      dist = distanceKm(origin.lat, origin.lng, lat, lng);
    }

    const rating =
      typeof row.rating === "number"
        ? row.rating
        : row.rating != null
        ? parseFloat(String(row.rating))
        : 0;

    const allSpecs = [...categories, ...servicesOffered];

    return {
      id: row.id,
      providerId: row.id,
      providerName:
        row.business_name ||
        row.contact_person ||
        row.name ||
        "Service Provider",
      providerRating: rating,
      totalReviews: row.total_reviews ?? 0,
      role: row.role,

      title:
        row.business_name ||
        (allSpecs.length > 0 ? allSpecs.join(", ") : "Service"),
      description: row.service_description ?? row.bio ?? null,

      category: allSpecs[0] ?? null,
      specializations: allSpecs.length > 0 ? allSpecs : undefined,

      price,
      priceUnit: unit,
      pricingInfo: row.pricing_info ?? null,

      location: row.location ?? null,
      address: row.address ?? null,

      coordinates: lat != null && lng != null ? { lat, lng } : undefined,
      distanceKm: dist,

      availability: row.service_availability ?? undefined,

      equipment: Array.isArray(row.equipment_list)
        ? row.equipment_list
        : undefined,

      phone: row.phone ?? null,
      email: row.email ?? null,

      createdAt: row.created_at ?? undefined,
      updatedAt: row.updated_at ?? undefined,
    };
  };

  // Fetch providers & service-offering farmers from Supabase
  const fetchListings = async () => {
    if (!userLocation) {
      setLocationError(
        "Location is required. Tap 'Use Current Location' to load nearby services."
      );
      return;
    }

    setLoading(true);
    setLocationError(null);

    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id,
          name,
          email,
          phone,
          role,
          location,
          rating,
          total_reviews,
          is_verified,
          created_at,
          updated_at,
          bio,
          profile_pic,
          latitude,
          longitude,
          address,
          business_name,
          contact_person,
          service_categories,
          service_description,
          service_availability,
          pricing_info,
          services_offered,
          equipment_list
        `
        )
        .in("role", ["provider", "farmer"])
        .eq("profile_completed", true);

      if (error) {
        console.error("Error fetching providers:", error.message);
        throw new Error(error.message);
      }

      const rows = data ?? [];

      const mapped: ServiceListing[] = rows
        .map((row) => mapRowToListing(row, userLocation))
        .filter((x): x is ServiceListing => x !== null);

      setAllListings(mapped);
    } catch (err: any) {
      console.error("Marketplace load error:", err);
      setLocationError(err.message || "Failed to load services.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch when we first have a location
  useEffect(() => {
    if (userLocation) {
      fetchListings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  // Full filtered + searched list
  const filteredListings = useMemo(() => {
    let list = [...allListings];

    // 1) distance
    if (filters.radiusKm && userLocation) {
      list = list.filter((s) => {
        if (s.distanceKm == null) return false;
        return s.distanceKm <= filters.radiusKm;
      });
    }

    // 2) categories
    if (filters.categories && filters.categories.length > 0) {
      list = list.filter((s) => {
        const specs = s.specializations ?? [];
        return specs.some((spec) => filters.categories!.includes(spec));
      });
    }

    // 3) rating
    if (filters.minRating && filters.minRating > 0) {
      list = list.filter(
        (s) => (s.providerRating ?? 0) >= filters.minRating!
      );
    }

    // 4) price range
    if (filters.minPrice != null) {
      list = list.filter(
        (s) => s.price == null || s.price >= filters.minPrice!
      );
    }
    if (filters.maxPrice != null) {
      list = list.filter(
        (s) => s.price == null || s.price <= filters.maxPrice!
      );
    }

    // 5) search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const fields: string[] = [
          s.title,
          s.description || "",
          s.providerName,
          s.location || "",
          s.address || "",
          s.pricingInfo || "",
          ...(s.specializations ?? []),
        ].map((v) => v.toLowerCase());

        return fields.some((f) => f.includes(q));
      });
    }

    // 6) sort: nearest -> highest rating
    list.sort((a, b) => {
      const da = a.distanceKm ?? Infinity;
      const db = b.distanceKm ?? Infinity;

      if (da !== db) return da - db;

      const ra = a.providerRating ?? 0;
      const rb = b.providerRating ?? 0;
      return rb - ra;
    });

    return list;
  }, [allListings, filters, search, userLocation]);

  const locationSummary = useMemo(() => {
    if (!userLocation) return null;
    const latStr = userLocation.lat.toFixed(4);
    const lngStr = userLocation.lng.toFixed(4);
    return `Showing providers within ${filters.radiusKm} km of (${latStr}, ${lngStr})`;
  }, [userLocation, filters.radiusKm]);

  // -----------------------------
  // Chat handlers
  // -----------------------------

  const handleMessageProvider = (service: ServiceListing) => {
    if (!sessionUser) {
      alert("You must be logged in to send messages.");
      return;
    }
    setActiveChatService(service);
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setActiveChatService(null);
  };

  // -----------------------------
  // Render
  // -----------------------------

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Service Marketplace
          </h1>
          <p className="text-sm text-gray-600">
            Find trusted agricultural services near your farm.
          </p>

          {/* Location summary + status */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center text-xs text-gray-500">
              <MapPin className="w-4 h-4 text-green-600 mr-1" />
              {locationSummary ? (
                <span>{locationSummary}</span>
              ) : (
                <span>Location not set yet.</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {geoStatus && (
                <span className="text-[11px] text-blue-500">{geoStatus}</span>
              )}
              {geoError && (
                <span className="text-[11px] text-red-500">{geoError}</span>
              )}
              <button
                onClick={captureLocation}
                disabled={isCapturing}
                className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400"
              >
                <Crosshair className="w-4 h-4 mr-1" />
                {isCapturing ? "Capturing…" : "Use Current Location"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        {/* Error banner */}
        {locationError && (
          <div className="mt-4 bg-red-50 border border-red-200 px-4 py-3 text-red-700 rounded-lg flex items-start text-sm">
            <AlertTriangle className="w-5 h-5 mr-2 mt-0.5" />
            <span>{locationError}</span>
          </div>
        )}

        {/* Filters */}
        <ServiceFiltersComponent filters={filters} onFiltersChange={setFilters} />

        {/* Search bar */}
        <div className="mt-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by service, provider, location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
            />
          </div>
        </div>

        {/* Results grid */}
        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-gray-600">Loading nearby services…</p>
          ) : filteredListings.length === 0 ? (
            <p className="text-sm text-gray-600">
              No services found for your filters. Try increasing the radius
              or clearing some filters.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredListings.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onMessageProvider={handleMessageProvider}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {isChatOpen && activeChatService && sessionUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 px-2">
          <div className="w-full max-w-lg h-[80vh] bg-white rounded-xl shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <p className="text-xs text-gray-500">Messaging</p>
                <h2 className="text-sm font-semibold text-gray-900">
                  {activeChatService.providerName}
                </h2>
              </div>
              <button
                onClick={handleCloseChat}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1">
              <ChatWindow
                bookingId={undefined} // direct provider chat
                userId={sessionUser.id}
                otherUserId={activeChatService.providerId}
                otherUserName={activeChatService.providerName}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
