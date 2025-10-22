// Location: src/lib/api/trackingAPI.ts
// Purpose: Complete GPS tracking API with real-time updates via Supabase

import { supabase } from '../supabase';

/** Location model structure in Supabase */
export interface Location {
  id?: string;
  session_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  recorded_at: string;
  battery_level?: number;
  speed?: number;
}

/** Active tracking session for a driver */
export interface TrackingSession {
  id: string;
  booking_id: string;
  driver_id: string;
  driver_name?: string;
  driver_phone?: string;
  status: 'active' | 'paused' | 'completed';
  started_at: string;
  ended_at?: string;
  current_location?: Location;
}

export class TrackingAPI {
  /**
   * ✅ Create a new tracking session (for each booking)
   */
  static async createSession(
    bookingId: string,
    driverId: string,
    driverName?: string,
    driverPhone?: string
  ): Promise<TrackingSession> {
    const { data, error } = await supabase
      .from('tracking_sessions')
      .insert({
        booking_id: bookingId,
        driver_id: driverId,
        driver_name: driverName,
        driver_phone: driverPhone,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Create session failed: ${error.message}`);
    return data;
  }

  /**
   * ✅ Fetch session details by session ID
   */
  static async getSession(sessionId: string): Promise<TrackingSession | null> {
    const { data, error } = await supabase
      .from('tracking_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }

    return data;
  }

  /**
   * ✅ Update session status (active, paused, completed)
   */
  static async updateSessionStatus(
    sessionId: string,
    status: 'active' | 'paused' | 'completed'
  ): Promise<void> {
    const updateData: any = { status };
    if (status === 'completed') updateData.ended_at = new Date().toISOString();

    const { error } = await supabase
      .from('tracking_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) throw new Error(`Failed to update session: ${error.message}`);
  }

  /**
   * ✅ Save a new GPS location (from driver’s device)
   */
  static async saveLocation(location: Location): Promise<void> {
    const { error } = await supabase.from('tracking_locations').insert(location);
    if (error) throw new Error(`Save location failed: ${error.message}`);
  }

  /**
   * ✅ Fetch all locations in a session
   */
  static async getLocations(sessionId: string): Promise<Location[]> {
    const { data, error } = await supabase
      .from('tracking_locations')
      .select('*')
      .eq('session_id', sessionId)
      .order('recorded_at', { ascending: false });

    if (error) {
      console.error('Error fetching locations:', error);
      return [];
    }

    return data || [];
  }

  /**
   * ✅ Fetch latest location for a session
   */
  static async getLatestLocation(sessionId: string): Promise<Location | null> {
    const { data, error } = await supabase
      .from('tracking_locations')
      .select('*')
      .eq('session_id', sessionId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching latest location:', error);
      return null;
    }

    return data;
  }

  /**
   * ✅ Fetch a tracking session by booking ID
   */
  static async getSessionByBookingId(
    bookingId: string
  ): Promise<TrackingSession | null> {
    const { data, error } = await supabase
      .from('tracking_sessions')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching session by booking:', error);
      return null;
    }

    return data;
  }

  /**
   * ✅ Real-time updates subscription (auto-refresh map)
   */
  static subscribeToLocationUpdates(
    sessionId: string,
    callback: (location: Location) => void
  ) {
    const channel = supabase
      .channel(`tracking_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tracking_locations',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => callback(payload.new as Location)
      )
      .subscribe();

    // Return an unsubscribe function for cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * ✅ Request GPS permission + get device coordinates (works on phones)
   */
  static async getCurrentGPSPosition(): Promise<GeolocationPosition | null> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation is not supported on this device.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * ✅ Watch GPS position changes continuously
   */
  static startGPSWatch(
    sessionId: string,
    onPosition: (location: Location) => void,
    onError?: (error: GeolocationPositionError) => void
  ): number | null {
    if (!('geolocation' in navigator)) {
      console.warn('Geolocation not available.');
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          const batteryLevel = await TrackingAPI.getBatteryLevel();
          const location: Location = {
            session_id: sessionId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed ?? 0,
            recorded_at: new Date().toISOString(),
            battery_level: batteryLevel ?? undefined,
          };

          await TrackingAPI.saveLocation(location);
          onPosition(location);
        } catch (err) {
          console.error('Error saving GPS location:', err);
        }
      },
      (err) => {
        console.error('GPS tracking error:', err);
        onError?.(err);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );

    return watchId;
  }

  /**
   * ✅ Stop continuous GPS watch
   */
  static stopGPSWatch(watchId: number | null) {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  }

  /**
   * ✅ Safe battery level getter
   */
  private static async getBatteryLevel(): Promise<number | null> {
    try {
      if ('getBattery' in navigator) {
        const battery: any = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      }
    } catch {
      // silently ignore
    }
    return null;
  }
}
