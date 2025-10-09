export interface ServiceListing {
  id: string;
  providerId: string;
  providerName: string;
  providerRating: number;
  category: 'machinery' | 'mechanic' | 'extension' | 'labour';
  title: string;
  description: string;
  price: number;
  priceUnit: 'hour' | 'day' | 'session' | 'fixed';
  location: string;
  district: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  availability: 'available' | 'busy' | 'unavailable';
  availableDates: string[];
  equipment?: string[];
  specializations?: string[];
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceFilters {
  category?: string;
  location?: string;
  district?: string;
  availability?: string;
  priceRange?: {
    min: number;
    max: number;
  };
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