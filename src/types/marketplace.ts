export interface ServiceListing {
  id: string;

  // Provider info
  providerId: string;
  providerName: string;
  providerRating?: number | null;

  // Basic service info
  title: string;
  category?: string | null;
  description?: string | null;

  // Pricing (optional because some providers only use pricingInfo)
  price?: number | null;
  priceUnit?: 'hour' | 'day' | 'session' | 'fixed';
  pricingInfo?: string | null;

  // Location details (optional)
  location?: string | null;
  district?: string | null;
  gps_enabled?: boolean;

  // Coordinates
  coordinates?: {
    lat: number;
    lng: number;
  };
  distanceKm?: number | null;

  // Availability
  availability?: 'available' | 'busy' | 'unavailable';
  availableDates?: string[];

  // Extra provider info
  equipment?: string[];
  specializations?: string[];
  images?: string[];

  // Meta
  createdAt?: string;
  updatedAt?: string;
  phone?: string | null;
  email?: string | null;
}
