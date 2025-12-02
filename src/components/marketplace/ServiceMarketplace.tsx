// Location: src/components/marketplace/ServiceMarketplace.tsx

import React, { useEffect, useMemo, useState } from "react";
import { ServiceListing, ServiceFilters } from "../../types/marketplace";
import { ServiceCard } from "./ServiceCard";
import { ServiceFiltersComponent } from "./ServiceFilters";
import { useGeolocationCapture } from "../../hooks/useGeolocationCapture";
import { supabase } from "../../lib/supabase";
import { useUserSession } from "../../contexts/UserSessionContext";
import { ChatWindow } from "../chat/ChatWindow";
import { BookingModal } from "../bookings/BookingModal";
import { SkeletonServiceCard } from "./SkeletonServiceCard";

import { MapPin, AlertTriangle, Crosshair, Search, X } from "lucide-react";

// -----------------------------
// CONSTANTS
// -----------------------------
const DEFAULT_RADIUS = 50;

// -----------------------------
// GEO HELPERS
// -----------------------------
const toRad = (value: number) => (value * Math.PI) / 180;

const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// -----------------------------
// OPTIMIZED MAPPER
// -----------------------------
const mapServiceRowToListing = (
  row: any,
  provider: any,
  origin?: { lat: number; lng: number }
): ServiceListing => {
  const lat = row.latitude ?? null;
  const lng = row.longitude ?? null;

  const distance =
    origin && lat != null && lng != null
      ? distanceKm(origin.lat, origin.lng, lat, lng)
      : null;

  return {
    id: row.id,
    providerId: row.provider_id,

    providerName:
      provider?.business_name ||
      provider?.contact_person ||
      provider?.name ||
      "Service Provider",

    providerRating: provider?.rating ?? 0,
    totalReviews: provider?.total_reviews ?? 0,
    role: provider?.role ?? "provider",

    title: row.title,
    description: row.description ?? row.service_description ?? null,

    category: row.category,
    specializations: row.specializations ?? [],

    price: row.price,
    priceUnit: row.price_unit,
    pricingInfo: `${row.price} per ${row.price_unit}`,

    location: row.location || provider?.location || null,
    address: row.district ?? provider?.address ?? null,

    coordinates:
      lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : undefined,

    distanceKm: distance,

    availability: row.availability ?? "available",

    equipment: row.equipment ?? [],
    images: row.images ?? [],

    phone: row.phone || provider?.phone || null,
    email: row.email || provider?.email || null,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

// -----------------------------
// COMPONENT
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
  const [activeChatService, setActiveChatService] = useState<ServiceListing | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Booking state
  const [activeBookingService, setActiveBookingService] = useState<ServiceListing | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // GEO HOOK
  const {
    coordinates,
    captureLocation,
    status: geoStatus,
    error: geoError,
    isCapturing,
  } = useGeolocationCapture({
    enableHighAccuracy: true,
    autoSyncToSupabase: false,
  });

  // Sync to usable location state
  useEffect(() => {
    if (coordinates) {
      setUserLocation({ lat: coordinates.latitude, lng: coordinates.longitude });
      setLocationError(null);
    }
  }, [coordinates]);

  // -----------------------------
  // FETCH SERVICES + PROVIDERS
  // -----------------------------
  const fetchListings = async () => {
    if (!userLocation) {
      setLocationError("Location is required. Tap 'Use Current Location'.");
      return;
    }

    setLoading(true);

    try {
      // 1. Load services table
      const { data: serviceRows, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("availability", "available");

      if (servicesError) throw new Error(servicesError.message);
      if (!serviceRows || serviceRows.length === 0) {
        setAllListings([]);
        return;
      }

      // 2. Collect provider IDs
      const providerIds = Array.from(
        new Set(serviceRows.map((s) => s.provider_id).filter(Boolean))
      );

      // 3. Load provider profiles
      const providerMap = new Map();
      if (providerIds.length > 0) {
        const { data: providerRows, error: providerError } = await supabase
          .from("users")
          .select("*")
          .in("id", providerIds);

        if (providerError) throw new Error(providerError.message);

        providerRows?.forEach((p) => providerMap.set(p.id, p));
      }

      // 4. Merge into ServiceListing[]
      const mapped = serviceRows.map((service) =>
        mapServiceRowToListing(service, providerMap.get(service.provider_id), userLocation)
      );

      setAllListings(mapped);
    } catch (err: any) {
      console.error("Error loading services:", err);
      setLocationError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userLocation) fetchListings();
  }, [userLocation]);

  // -----------------------------
  // FILTER + SEARCH + SORT
  // -----------------------------
  const filteredListings = useMemo(() => {
    let list = [...allListings];

    if (filters.radiusKm && userLocation) {
      list = list.filter((s) => s.distanceKm != null && s.distanceKm <= filters.radiusKm);
    }

    if (filters.categories?.length) {
      list = list.filter((s) =>
        [s.category, ...(s.specializations || [])].some((c) =>
          filters.categories.includes(c || "")
        )
      );
    }

    if (filters.minRating && filters.minRating > 0) {
      list = list.filter((s) => (s.providerRating ?? 0) >= filters.minRating!);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const fields = [
          s.title,
          s.description || "",
          s.providerName,
          s.location || "",
          s.address || "",
          s.category || "",
          ...(s.specializations ?? []),
        ].map((x) => x.toLowerCase());

        return fields.some((f) => f.includes(q));
      });
    }

    list.sort((a, b) => {
      const da = a.distanceKm ?? Infinity;
      const db = b.distanceKm ?? Infinity;

      if (da !== db) return da - db;
      return (b.providerRating ?? 0) - (a.providerRating ?? 0);
    });

    return list;
  }, [allListings, filters, search, userLocation]);

  // -----------------------------
  // CHAT
  // -----------------------------
  const handleMessageProvider = (service: ServiceListing) => {
    if (!sessionUser) return alert("Log in to send a message.");
    setActiveChatService(service);
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setActiveChatService(null);
  };

  // -----------------------------
  // BOOKING
  // -----------------------------
  const openBookingModal = (service: ServiceListing) => {
    if (!sessionUser) return alert("Log in to book a service.");
    if (sessionUser.role !== "farmer") return alert("Only farmers can book services.");
    setActiveBookingService(service);
    setIsBookingOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingOpen(false);
    setActiveBookingService(null);
  };

  // -----------------------------
  // UI
  // -----------------------------
  const locationSummary =
    userLocation &&
    `Showing providers within ${filters.radiusKm} km of (${userLocation.lat.toFixed(
      4
    )}, ${userLocation.lng.toFixed(4)})`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Service Marketplace</h1>
          <p className="text-sm text-gray-600">Find trusted agricultural services near you.</p>

          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center text-xs text-gray-500">
              <MapPin className="w-4 h-4 text-green-600 mr-1" />
              {locationSummary || "Location not set."}
            </div>

            <div className="flex items-center gap-3">
              {geoStatus && <span className="text-[11px] text-blue-500">{geoStatus}</span>}
              {geoError && <span className="text-[11px] text-red-500">{geoError}</span>}

              <button
                onClick={captureLocation}
                disabled={isCapturing}
                className="inline-flex items-center px-3 py-1.5 text-xs bg-green-600 text-white rounded-md"
              >
                <Crosshair className="w-4 h-4 mr-1" />
                {isCapturing ? "Capturing…" : "Use Current Location"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        {locationError && (
          <div className="mt-4 bg-red-50 border border-red-200 px-4 py-3 text-red-700 rounded-lg text-sm flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 mt-0.5" />
            {locationError}
          </div>
        )}

        <ServiceFiltersComponent filters={filters} onFiltersChange={setFilters} />

        <div className="mt-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by service, provider, or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

{/* Results grid */}
<div className="mt-6">
  {loading ? (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonServiceCard key={i} />
      ))}
    </div>
  ) : filteredListings.length === 0 ? (
    <p className="text-sm text-gray-600">
      No services found for your filters. Try increasing the area radius or clearing some filters.
    </p>
  ) : (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {filteredListings.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onMessageProvider={handleMessageProvider}
          onBookService={openBookingModal}
        />
      ))}
    </div>
  )}
</div>

      </div>

      {/* Chat */}
      {isChatOpen && activeChatService && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 px-2">
          <div className="w-full max-w-lg h-[80vh] bg-white rounded-xl shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <p className="text-xs text-gray-500">Messaging</p>
                <h2 className="text-sm font-semibold">{activeChatService.providerName}</h2>
              </div>
              <button onClick={handleCloseChat} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1">
            <ChatWindow
  bookingId={undefined}
  userId={sessionUser.id}
  otherUserId={activeChatService.providerId}
  otherUserName={activeChatService.providerName}
  canBookFromChat
  onBookFromChat={() => openBookingModal(activeChatService)}
/>

            </div>
          </div>
        </div>
      )}

      {/* Booking */}
      {isBookingOpen && activeBookingService && (
        <BookingModal
          service={activeBookingService}
          onClose={closeBookingModal}
          onBookingComplete={() => {
            closeBookingModal();
            alert("Booking created successfully!");
          }}
        />
      )}
    </div>
  );
};
