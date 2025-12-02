// Location: src/types/marketplace.ts

// One marketplace service card
export interface ServiceListing {
  // ⚠️ IMPORTANT: This is now the *service* id (from public.services.id)
  id: string;

  // Provider (owner of the service) → users.id
  providerId: string;
  providerName: string;
  providerRating?: number | null;
  totalReviews?: number | null;

  // Core service info
  title: string;
  description?: string | null;

  // First/main category + all categories
  // category comes from services.category
  category?: string | null;
  // specializations comes from services.specializations (text[])
  specializations?: string[];

  // Pricing (from services.price & services.price_unit)
  price?: number | null; // e.g. 250
  priceUnit?: "hour" | "day" | "session" | "fixed";
  pricingInfo?: string | null; // kept for backward compatibility

  // Location
  // location: services.location or district
  location?: string | null;
  address?: string | null;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distanceKm?: number | null;

  // Status / availability
  availability?: "available" | "busy" | "unavailable";

  // Extra info
  availableDates?: string[];
  equipment?: string[];
  images?: string[];
  createdAt?: string;
  updatedAt?: string;

  phone?: string | null;
  email?: string | null;
  role?: "farmer" | "provider" | "admin";
}

// Filters for the marketplace UI
export interface ServiceFilters {
  // Multi-select categories (chips)
  categories: string[];
  // GPS radius in km
  radiusKm: number;
  // Minimum rating (0–5)
  minRating?: number;
  // Min / max price in GH₵ (parsed from pricingInfo or services.price)
  minPrice?: number;
  maxPrice?: number;
}

// ---------------------------------------------------------------------------
// NEW — FINAL Marketplace SELECT Query (Services + Provider Details)
// (Requested update — nothing else in file was modified)
// ---------------------------------------------------------------------------

export const MARKETPLACE_SELECT_QUERY = `
  id,
  provider_id,
  category,
  title,
  description,
  price,
  price_unit,
  availability,
  location,
  district,
  equipment,
  specializations,
  images,
  created_at,
  updated_at,
  latitude,
  longitude,

  users:provider_id (
    id,
    business_name,
    contact_person,
    phone,
    email,
    rating,
    total_reviews,
    profile_pic,
    address,
    name
  )
`;
