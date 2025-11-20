// Location: src/types/marketplace.ts

// One marketplace service card
export interface ServiceListing {
  id: string; // user id (provider/farmer offering service)
  providerId: string;
  providerName: string;
  providerRating?: number | null;
  totalReviews?: number | null;

  title: string;
  description?: string | null;

  // First/main category + all categories
  category?: string | null;
  specializations?: string[]; // from service_categories / services_offered

  // Pricing
  price?: number | null; // parsed numeric price (e.g. 250)
  priceUnit?: "hour" | "day" | "session" | "fixed";
  pricingInfo?: string | null; // original text (e.g. "₵250 per hour")

  // Location
  location?: string | null; // town/region text
  address?: string | null;  // full address
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
  // Min / max price in GH₵ (parsed from pricingInfo)
  minPrice?: number;
  maxPrice?: number;
}
