export interface ServiceListing {
  id: string;
  providerId: string;
  providerName: string;
  providerRating?: number | null;
  title: string;
  category?: string | null;
  description?: string | null;
  price?: number | null;
  priceUnit?: 'hour' | 'day' | 'session' | 'fixed';
  pricingInfo?: string | null;
  location?: string | null;
  district?: string | null;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distanceKm?: number | null;
  availability?: 'available' | 'busy' | 'unavailable';
  availableDates?: string[];
  equipment?: string[];
  specializations?: string[];
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
  phone?: string | null;
  email?: string | null;
}

export interface ServiceFilters {
  category?: string;
  radiusKm?: number;
  minRating?: number;
  search?: string;
}

export interface Booking {
  id: string;
  farmerId: string;
  farmerName: string;
  serviceId: string;
  serviceTitle: string;
  providerId: string;
  providerName: string;
  status: 'pending' | 'accepted' | 'declined' | 'in-progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  duration: number;
  totalPrice: number;
  location: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}