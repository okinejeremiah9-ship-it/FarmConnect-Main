const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!data.success && data.error) {
    throw new Error(data.error);
  }

  return data;
}

export const walletAPI = {
  getBalance: async (userId: string) => {
    return fetchAPI(`wallet-balance/${userId}`);
  },
};

export const escrowAPI = {
  deposit: async (bookingId: string, farmerId: string, amount: number) => {
    return fetchAPI('escrow-deposit', {
      method: 'POST',
      body: JSON.stringify({ booking_id: bookingId, farmer_id: farmerId, amount }),
    });
  },

  release: async (escrowId: string, farmerId: string) => {
    return fetchAPI('escrow-release', {
      method: 'POST',
      body: JSON.stringify({ escrow_id: escrowId, farmer_id: farmerId }),
    });
  },

  dispute: async (escrowId: string, userId: string, reason: string, details: string, audioUrl?: string | null) => {
    return fetchAPI('escrow-dispute', {
      method: 'POST',
      body: JSON.stringify({ escrow_id: escrowId, user_id: userId, reason, details, audio_url: audioUrl }),
    });
  },
};

export const disputeAPI = {
  getAll: async (adminId: string) => {
    return fetchAPI(`disputes-list?admin_id=${adminId}`);
  },

  resolve: async (disputeId: string, adminId: string, resolution: string, action: string) => {
    return fetchAPI('dispute-resolve', {
      method: 'POST',
      body: JSON.stringify({ dispute_id: disputeId, admin_id: adminId, resolution, action }),
    });
  },
};

export const messagesAPI = {
  send: async (data: {
    booking_id?: string;
    sender_id: string;
    receiver_id: string;
    message_type: 'text' | 'audio' | 'image';
    content?: string;
    media_url?: string;
  }) => {
    return fetchAPI('messages-send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  list: async (bookingId: string, userId: string) => {
    return fetchAPI(`messages-list?booking_id=${bookingId}&user_id=${userId}`);
  },
};

export const bookingAPI = {
  updateStatus: async (bookingId: string, userId: string, status: string) => {
    return fetchAPI('booking-update-status', {
      method: 'POST',
      body: JSON.stringify({ booking_id: bookingId, user_id: userId, status }),
    });
  },

  create: async (data: {
    farmer_id: string;
    service_id: string;
    provider_id: string;
    scheduled_date: string;
    duration: number;
    total_price: number;
    service_location: string;
    notes?: string;
  }) => {
    return fetchAPI('create-booking', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const mapAPI = {
  getNearbyServices: async ({
    lat,
    lng,
    radius,
    category,
    minRating,
  }: {
    lat: number;
    lng: number;
    radius: number;
    category?: string;
    minRating?: number;
  }) => {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
    });

    if (category) {
      params.append('category', category);
    }

    if (typeof minRating === 'number') {
      params.append('min_rating', minRating.toString());
    }

    return fetchAPI(`get-nearby-services?${params.toString()}`);
  },
};

export const adminAPI = {
  getDashboardStats: async (adminId: string) => {
    return fetchAPI(`admin-dashboard-stats?admin_id=${adminId}`);
  },
};
