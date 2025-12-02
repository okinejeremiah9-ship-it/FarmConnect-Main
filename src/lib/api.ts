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
/* ⚖️ DISPUTE API — FIXED */
export const disputeAPI = {
  /**
   * 🔹 Admin: Get all disputes
   */
  getAll: async (adminId: string) => {
    return fetchAPI("disputes-list", {
      method: "POST",
      body: JSON.stringify({
        mode: "admin",
        admin_id: adminId,
      }),
    });
  },

  /**
   * 🔹 User: list disputes for a farmer/provider
   */
  listForUser: async (userId: string) => {
    return fetchAPI("disputes-list", {
      method: "POST",
      body: JSON.stringify({
        mode: "user",
        user_id: userId,
      }),
    });
  },

  /**
   * 🔹 Admin resolves a dispute
   */
  resolve: async (disputeId: string, adminId: string, resolution: string, action: string) => {
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

/* 💬 MESSAGES API — UPDATED FOR OPTION A + CONVERSATIONS */
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

    const { data, error } = await supabase
      .from("messages")
      .insert([payload])
      .select();

    if (error) {
      console.error("❌ Error sending message:", error);
      throw new Error("Failed to send message");
    }

    return data;
  },

  /**
   * 📥 Get conversations grouped by OTHER USER
   * (one row per farmer/provider pair, using latest message)
   */
  listConversations: async (userId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        id,
        sender_id,
        receiver_id,
        message_type,
        content,
        is_read,
        created_at,
        sender:sender_id (
          id,
          name,
          role,
          business_name
        ),
        receiver:receiver_id (
          id,
          name,
          role,
          business_name
        )
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error loading conversations:", error);
      throw new Error("Failed to load conversations");
    }

    type RawMessage = any;
    const map = new Map<string, any>();

    (data || []).forEach((msg: RawMessage) => {
      const isSender = msg.sender_id === userId;
      const otherUser = isSender ? msg.receiver : msg.sender;
      const otherUserId = otherUser?.id;
      if (!otherUserId) return;

      const key = otherUserId as string;

      const preview =
        msg.message_type === "text"
          ? msg.content || ""
          : msg.message_type === "image"
          ? "📷 Image"
          : "🎙️ Audio";

      const isUnreadForUser = !isSender && msg.is_read === false;

      // because we sorted DESC, first time we see a user = latest message
      if (!map.has(key)) {
        map.set(key, {
          otherUserId,
          otherUserName:
            otherUser.business_name ||
            otherUser.name ||
            "User",
          lastMessage: preview,
          lastMessageType: msg.message_type,
          lastMessageAt: msg.created_at,
          lastSenderIsSelf: isSender,
          unreadCount: isUnreadForUser ? 1 : 0,
        });
      } else if (isUnreadForUser) {
        const existing = map.get(key);
        existing.unreadCount += 1;
      }
    });

    return Array.from(map.values());
  },

  /**
   * 🔁 (keep existing) List messages via edge function if you still use it
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
export const completionAPI = {
  submit: async (bookingId: string, images: string[]) => {
    const { data, error } = await supabase
      .from("bookings")
      .update({
        status: "completed",
        completion_images: images,
      })
      .eq("id", bookingId)
      .select();

    if (error) throw error;
    return data;
  },
};


/* 🧑‍💼 ADMIN API */
export const adminAPI = {
  getDashboardStats: async (adminId: string) => {
    return fetchAPI(`admin-dashboard-stats?admin_id=${adminId}`);
  },
};
