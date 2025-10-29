import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

const BOOKING_SELECT = `
  *,
  service:service_id(
    id,
    title,
    category,
    price_per_hour,
    price_per_day,
    cover_image
  ),
  farmer:farmer_id(
    id,
    name,
    phone
  ),
  provider:provider_id(
    id,
    name,
    phone
  ),
  escrow_wallet(
    id,
    amount,
    status,
    farmer_id,
    provider_id,
    booking_id,
    created_at,
    updated_at,
    disputes(
      id,
      status,
      reason,
      created_at,
      resolved_at
    )
  )
`;

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

    async function fetchBookingById(id: string) {
      const { data, error } = await supabase
        .from('bookings')
        .select(BOOKING_SELECT)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Failed to load booking', error);
        return null;
      }

      return data;
    }

    async function setupSubscription() {
      const { data: initialBookings, error } = await supabase
        .from('bookings')
        .select(BOOKING_SELECT)
        .or(`farmer_id.eq.${userId},provider_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load bookings', error);
        setBookings([]);
      } else {
        setBookings(initialBookings || []);
      }

      setLoading(false);

      channel = supabase
        .channel(`bookings:${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings' },
          async (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const bookingId = payload.new?.id;
              if (!bookingId) return;

              const fullBooking = await fetchBookingById(bookingId);
              if (!fullBooking) return;

              if (fullBooking.farmer_id === userId || fullBooking.provider_id === userId) {
                setBookings((prev) => {
                  const index = prev.findIndex((b) => b.id === bookingId);
                  if (index >= 0) {
                    const updated = [...prev];
                    updated[index] = fullBooking;
                    return updated;
                  }
                  return [fullBooking, ...prev];
                });
              }
            } else if (payload.eventType === 'DELETE') {
              const bookingId = payload.old?.id;
              if (!bookingId) return;
              setBookings((prev) => prev.filter((b) => b.id !== bookingId));
            }
          }
        )
        .subscribe();
    }

    if (userId) {
      setupSubscription();
    } else {
      setLoading(false);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);

  return { bookings, loading };
}
