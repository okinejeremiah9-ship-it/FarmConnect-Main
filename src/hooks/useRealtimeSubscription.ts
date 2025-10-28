import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * ✅ Realtime Chat Subscription
 * Works even if bookingId is optional.
 * Listens for both sender and receiver updates in real time.
 */
export function useRealtimeMessages(
  userId: string,
  otherUserId: string | null,
  bookingId: string | null = null
) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: RealtimeChannel;

    async function setupSubscription() {
      if (!userId || !otherUserId) return;

      let baseQuery = supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(id, name, profile_pic),
          receiver:receiver_id(id, name, profile_pic)
        `)
        .or(
          `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
        )
        .order('created_at', { ascending: true });

      if (bookingId) {
        baseQuery = baseQuery.eq('booking_id', bookingId);
      }

      const { data: initialMessages, error } = await baseQuery;

      if (error) {
        console.error('Error fetching messages:', error);
      }

      const filteredInitial = (initialMessages || []).filter((msg) =>
        (msg.sender_id === userId && msg.receiver_id === otherUserId) ||
        (msg.sender_id === otherUserId && msg.receiver_id === userId)
      );

      setMessages(filteredInitial);
      setLoading(false);

      channel = supabase
        .channel(`realtime:messages:${userId}:${otherUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              const removed = payload.old as any;
              if (
                removed &&
                ((removed.sender_id === userId && removed.receiver_id === otherUserId) ||
                  (removed.sender_id === otherUserId && removed.receiver_id === userId))
              ) {
                setMessages((prev) => prev.filter((msg) => msg.id !== removed.id));
              }
              return;
            }

            const newMsg = payload.new;
            if (
              newMsg &&
              ((newMsg.sender_id === userId && newMsg.receiver_id === otherUserId) ||
                (newMsg.sender_id === otherUserId && newMsg.receiver_id === userId)) &&
              (!bookingId || newMsg.booking_id === bookingId)
            ) {
              setMessages((prev) => {
                if (payload.eventType === 'UPDATE') {
                  return prev.map((msg) => (msg.id === newMsg.id ? newMsg : msg));
                }

                return [...prev, newMsg];
              });
            }
          }
        )
        .subscribe();
    }

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [bookingId, otherUserId, userId]);

  return { messages, loading };
}

/**
 * ✅ Realtime Escrow Status Watcher
 */
export function useRealtimeEscrowStatus(escrowId: string) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: RealtimeChannel;

    async function setupSubscription() {
      const { data } = await supabase
        .from('escrow_wallet')
        .select('status')
        .eq('id', escrowId)
        .single();

      setStatus(data?.status || null);
      setLoading(false);

      channel = supabase
        .channel(`escrow:${escrowId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'escrow_wallet',
            filter: `id=eq.${escrowId}`,
          },
          (payload) => {
            setStatus(payload.new.status);
          }
        )
        .subscribe();
    }

    if (escrowId) setupSubscription();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [escrowId]);

  return { status, loading };
}

/**
 * ✅ Realtime Booking Updates
 */
export function useRealtimeBookingUpdates(userId: string) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: RealtimeChannel;

    async function setupSubscription() {
      const { data: initialBookings } = await supabase
        .from('bookings')
        .select('*, service:service_id(title), farmer:farmer_id(name), provider:provider_id(name)')
        .or(`farmer_id.eq.${userId},provider_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      setBookings(initialBookings || []);
      setLoading(false);

      channel = supabase
        .channel(`bookings:${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings' },
          async (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const booking = payload.new;
              if (booking.farmer_id === userId || booking.provider_id === userId) {
                setBookings((prev) => {
                  const index = prev.findIndex((b) => b.id === booking.id);
                  if (index >= 0) {
                    const updated = [...prev];
                    updated[index] = booking;
                    return updated;
                  }
                  return [booking, ...prev];
                });
              }
            } else if (payload.eventType === 'DELETE') {
              setBookings((prev) => prev.filter((b) => b.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    }

    if (userId) setupSubscription();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);

  return { bookings, loading };
}
