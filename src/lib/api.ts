// src/lib/api.ts

import { supabase } from "./supabase";

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      apikey: API_KEY,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!data.success && data.error) {
    throw new Error(data.error);
  }

  return data;
}

/* 🪙 WALLET API */
export const walletAPI = {
  getBalance: async (userId: string) => {
    return fetchAPI(`wallet-balance/${userId}`);
  },
};

/* 🏦 ESCROW API */
export const escrowAPI = {
  deposit: async (bookingId: string, farmerId: string, amount: number) => {
    return fetchAPI("escrow-deposit", {
      method: "POST",
      body: JSON.stringify({ booking_id: bookingId, farmer_id: farmerId, amount }),
    });
  },

  release: async (escrowId: string, farmerId: string) => {
    return fetchAPI("escrow-release", {
      method: "POST",
      body: JSON.stringify({ escrow_id: escrowId, farmer_id: farmerId }),
    });
  },

  dispute: async (escrowId, userId, reason, details, audioUrl) => {
    return fetchAPI("escrow-dispute", {
      method: "POST",
      body: JSON.stringify({
        escrow_id: escrowId,
        user_id: userId,
        reason,
        details,
        audio_url: audioUrl ?? null,
      }),
    });
  },
};

/* ⚖️ DISPUTE API */
export const disputeAPI = {
  getAll: async (adminId: string) => {
    return fetchAPI("disputes-list", {
      method: "POST",
      body: JSON.stringify({ admin_id: adminId }),
    });
  },

  listForUser: async (userId: string) => {
    return fetchAPI("disputes-list", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
  },

  resolve: async (disputeId, adminId, resolution, action) => {
    return fetchAPI("dispute-resolve", {
      method: "POST",
      body: JSON.stringify({
        dispute_id: disputeId,
        admin_id: adminId,
        resolution,
        action,
      }),
    });
  },
};

/* 💬 MESSAGES API — UPDATED FOR OPTION A */
export const messagesAPI = {
  /**
   * Save a message directly into Supabase messages table.
   */
  send: async (msg: {
    booking_id?: string | null;
    sender_id: string;
    receiver_id: string;
    message_type: "text" | "audio" | "image";
    content?: string | null;
    media_url?: string | null;
  }) => {
    const payload = {
      booking_id: msg.booking_id ?? null,
      sender_id: msg.sender_id,
      receiver_id: msg.receiver_id,
      message_type: msg.message_type,
      content: msg.content ?? null,
      media_url: msg.media_url ?? null,
    };

    const { data, error } = await supabase.from("messages").insert([payload]).select();

    if (error) {
      console.error("❌ Error sending message:", error);
      throw new Error("Failed to send message");
    }

    return data;
  },

  /**
   * List messages (still using your edge function)
   */
  list: async (bookingId: string, userId: string) => {
    return fetchAPI(`messages-list?booking_id=${bookingId}&user_id=${userId}`);
  },
};

/* 📅 BOOKINGS API */
export const bookingAPI = {
  updateStatus: async (bookingId: string, userId: string, status: string) => {
    return fetchAPI("booking-update-status", {
      method: "POST",
      body: JSON.stringify({ booking_id: bookingId, user_id: userId, status }),
    });
  },

  create: async (data) => {
    return fetchAPI("create-booking", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

/* 🗺️ MAP API */
export const mapAPI = {
  getNearbyServices: async ({ lat, lng, radius, category, minRating, farmerId }) => {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius: String(radius || 50),
    });

    if (category) params.append("category", category);
    if (typeof minRating === "number") params.append("min_rating", String(minRating));
    if (farmerId) params.append("farmer_id", farmerId);

    return fetchAPI(`get-nearby-services?${params.toString()}`);
  },
};

/* 🧑‍💼 ADMIN API */
export const adminAPI = {
  getDashboardStats: async (adminId: string) => {
    return fetchAPI(`admin-dashboard-stats?admin_id=${adminId}`);
  },
};
