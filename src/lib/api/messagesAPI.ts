import { supabase } from "../supabase";

const MESSAGES_TABLE = "messages";

export const messagesAPI = {
  /**
   * SEND MESSAGE
   * (always goes through your EDGE FUNCTION now)
   */
  async send(payload: {
    booking_id?: string | null;
    sender_id: string;
    receiver_id: string;
    message_type: "text" | "image" | "audio";
    content?: string;
    media_url?: string | null;
  }) {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/messages-send`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    if (!json.success) throw new Error(json.error || "Failed to send message");
    return json.message;
  },

  /**
   * FETCH MESSAGES BETWEEN TWO USERS
   */
  async fetchConversation(
    userId: string,
    otherUserId: string,
    booking_id?: string | null
  ) {
    try {
      let query = supabase
        .from(MESSAGES_TABLE)
        .select(
          `
          *,
          sender:sender_id(id, name, contact_person, business_name),
          receiver:receiver_id(id, name, contact_person, business_name)
        `
        )
        .or(
          `
            and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),
            and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})
          `
        )
        .order("created_at", { ascending: true });

      if (booking_id) query = query.eq("booking_id", booking_id);

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error("❌ Error fetching conversation:", err);
      return [];
    }
  },

  /**
   * LIST CONVERSATIONS FOR MESSAGES PAGE
   */
  async listConversations(userId: string) {
    try {
      const { data, error } = await supabase
        .rpc("get_conversation_list", { uid: userId });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("❌ Error loading conversations:", err);
      return [];
    }
  },
};
