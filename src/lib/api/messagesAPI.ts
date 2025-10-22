import { supabase } from '../supabase';

// ✅ Table name
const MESSAGES_TABLE = 'messages';

export const messagesAPI = {
  /**
   * ✅ Send a message (text, image, or audio)
   */
  async send({
    booking_id = null,
    sender_id,
    receiver_id,
    message_type = 'text',
    content = '',
    media_url = null,
  }: {
    booking_id?: string | null;
    sender_id: string;
    receiver_id: string;
    message_type: 'text' | 'image' | 'audio';
    content?: string;
    media_url?: string | null;
  }) {
    try {
      const { data, error } = await supabase.from(MESSAGES_TABLE).insert([
        {
          booking_id,
          sender_id,
          receiver_id,
          message_type,
          content,
          media_url,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('❌ Error sending message:', err);
      throw new Error('Failed to send message');
    }
  },

  /**
   * ✅ Fetch all messages between two users (optional booking_id filter)
   */
  async fetchConversation(userId: string, otherUserId: string, booking_id?: string | null) {
    try {
      let query = supabase
        .from(MESSAGES_TABLE)
        .select(
          `
          *,
          sender:sender_id(id, name, profile_pic),
          receiver:receiver_id(id, name, profile_pic)
        `
        )
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .or(`sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`)
        .order('created_at', { ascending: true });

      if (booking_id) query = query.eq('booking_id', booking_id);

      const { data, error } = await query;
      if (error) throw error;

      return data;
    } catch (err) {
      console.error('❌ Error fetching conversation:', err);
      return [];
    }
  },

  /**
   * ✅ Fetch messages for a single booking
   */
  async fetchBookingMessages(booking_id: string) {
    try {
      const { data, error } = await supabase
        .from(MESSAGES_TABLE)
        .select('*')
        .eq('booking_id', booking_id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('❌ Error fetching booking messages:', err);
      return [];
    }
  },
};
