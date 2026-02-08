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

/* 🐞 DEBUG API */
export const debugAPI = {
  fundEscrow: async (bookingId: string) => {
    return fetchAPI("debug-fund-escrow", {
      method: "POST",
      body: JSON.stringify({ booking_id: bookingId }),
    });
  },
};

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

  dispute: async (escrowId: string, userId: string, reason: string, details: string, audioUrl?: string | null) => {
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
      body: JSON.stringify({
        mode: "admin",
        admin_id: adminId,
      }),
    });
  },

  listForUser: async (userId: string) => {
    return fetchAPI("disputes-list", {
      method: "POST",
      body: JSON.stringify({
        mode: "user",
        user_id: userId,
      }),
    });
  },

  addMessage: async (
    disputeId: string,
    senderId: string,
    message?: string,
    audioUrl?: string | null,
    imageUrls?: string[] | null
  ) => {
    return fetchAPI("add-dispute-message", {
      method: "POST",
      body: JSON.stringify({
        dispute_id: disputeId,
        sender_id: senderId,
        message: message || null,
        audio_url: audioUrl || null,
        image_urls: imageUrls || null,
      }),
    });
  },

  resolve: async (
    disputeId: string,
    adminId: string,
    resolution: string,
    action: string
  ) => {
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

/* 💬 MESSAGES API */
export const messagesAPI = {
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

    const map = new Map<string, any>();

    (data || []).forEach((msg: any) => {
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

      if (!map.has(key)) {
        map.set(key, {
          otherUserId,
          otherUserName: otherUser.business_name || otherUser.name || "User",
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

  create: async (data: any) => {
    return fetchAPI("create-booking", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

/* 🗺️ MAP API */
export const mapAPI = {
  getNearbyServices: async ({
    lat,
    lng,
    radius,
    category,
    minRating,
    farmerId,
  }: {
    lat: number;
    lng: number;
    radius?: number;
    category?: string;
    minRating?: number;
    farmerId?: string;
  }) => {
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
/* 🧑‍💼 ADMIN API */
export const adminAPI = {
  getDashboardStats: async (adminId: string) => {
    // 1. Fetch Bookings with User Names
    const { data: bookings, error: bError } = await supabase
      .from('bookings')
      .select(`
        *,
        services(title),
        farmer:users!farmer_id(name),
        provider:users!provider_id(name)
      `)
      .order('created_at', { ascending: false });

    if (bError) throw bError;

    // 2. Fetch User Counts
    const { count: farmerCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'farmer');

    const { count: providerCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'provider');

    // 3. Calculate Stats locally
    const active = bookings.filter(b => b.status === 'in-progress' || b.status === 'pending').length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const revenue = bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

    return {
      success: true,
      stats: {
        activeBookings: active,
        completedBookings: completed,
        totalRevenue: revenue.toString(),
        openDisputes: 0, // You can add dispute count query here similarly
        totalFarmers: farmerCount || 0,
        totalProviders: providerCount || 0,
      },
      recentBookings: bookings.slice(0, 10) // Only return the 10 most recent
    };
  },

  getReportData: async (range: string) => {
     // ... (Keep the working getReportData code from previous step)
  }
};