export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'farmer' | 'provider' | 'admin';
  isVerified: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'farmer' | 'provider' | 'admin';
}

export interface Service {
  id: string;
  title: string;
  description: string;
  category: 'tractor' | 'repair' | 'advisory' | 'harvester';
  price: number;
  providerId: string;
  providerName: string;
  location: string;
  isAvailable: boolean;
  createdAt: string;
}

export interface ServiceRequest {
  id: string;
  farmerId: string;
  farmerName: string;
  serviceId: string;
  serviceTitle: string;
  providerId: string;
  providerName: string;
  status: 'pending' | 'requested' | 'accepted' | 'in-progress' | 'completed' | 'cancelled';
  location: string;
  dateNeeded: string;
  message: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  escrowStatus?: 'pending' | 'funded' | 'completed' | 'disputed' | 'released' | 'refunded';
  escrowId?: string;
  canReview?: boolean;
}
