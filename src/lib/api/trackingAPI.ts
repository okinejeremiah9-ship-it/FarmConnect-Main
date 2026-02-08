// Location: src/lib/api/trackingAPI.ts
// Purpose: Complete GPS tracking API with real-time updates via Supabase
// Status: SAFE REWRITE – functionality preserved and hardened

import { supabase } from "../supabase";

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
  status: "active" | "paused" | "completed";
  started_at: string;
  ended_at?: string | null;
}

/**
 * 🚚 Tracking API
 */
export class TrackingAPI {
  /**
   * ✅ Create a new tracking session
   * SAFETY: prevents duplicate active sessions per booking
   */
  static async createSession(
    bookingId: string,
    driverId: string,
    driverName?: string,
    driverPhone?: string
  ): Promise<TrackingSession> {
    const existing = await TrackingAPI.getSessionByBookingId(bookingId);
    if (existing && existing.status === "active") {
      return existing;
    }

    const { data, error } = await supabase
      .from("tracking_sessions")
      .insert({
        booking_id: bookingId,
        driver_id: driverId,
        driver_name: driverName ?? null,
        driver_phone: driverPhone ?? null,
        status: "active",
        started_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Create session failed: ${error.message}`);
    }

    return data as TrackingSession;
  }

  /**
   * ✅ Fetch session by ID
   */
  static async getSession(sessionId: string): Promise<TrackingSession | null> {
    const { data, error } = await supabase
      .from("tracking_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching session:", sessionId, error);
      return null;
    }

    return (data as TrackingSession) ?? null;
  }

  /**
   * ✅ Update session status
   */
  static async updateSessionStatus(
    sessionId: string,
    status: "active" | "paused" | "completed"
  ): Promise<void> {
    const updateData: any = { status };

    if (status === "completed") {
      updateData.ended_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("tracking_sessions")
      .update(updateData)
      .eq("id", sessionId);

    if (error) {
      throw new Error(`Failed to update session: ${error.message}`);
    }
  }

  /**
   * ✅ Save GPS location
   * SAFETY: non-fatal failure handling
   */
  static async saveLocation(location: Location): Promise<boolean> {
    const { error } = await supabase
      .from("tracking_locations")
      .insert(location);

    if (error) {
      console.error("Save location failed:", error);
      return false;
    }

    return true;
  }

  /**
   * ✅ Fetch all locations (bounded for performance)
   */
  static async getLocations(sessionId: string): Promise<Location[]> {
    const { data, error } = await supabase
      .from("tracking_locations")
      .select("*")
      .eq("session_id", sessionId)
      .order("recorded_at", { ascending: true })
      .limit(2000); // HARD SAFETY LIMIT

    if (error) {
      console.error("Error fetching locations:", error);
      return [];
    }

    return (data as Location[]) || [];
  }

  /**
   * ✅ Fetch latest location
   */
  static async getLatestLocation(
    sessionId: string
  ): Promise<Location | null> {
    const { data, error } = await supabase
      .from("tracking_locations")
      .select("*")
      .eq("session_id", sessionId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching latest location:", error);
      return null;
    }

    return (data as Location) ?? null;
  }

  /**
   * ✅ Fetch session by booking ID
   * SAFETY: uses started_at (guaranteed column)
   */
  static async getSessionByBookingId(
    bookingId: string
  ): Promise<TrackingSession | null> {
    const { data, error } = await supabase
      .from("tracking_sessions")
      .select("*")
      .eq("booking_id", bookingId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching session by booking:", error);
      return null;
    }

    return (data as TrackingSession) ?? null;
  }

  /**
   * ✅ Subscribe to real-time location updates
   */
  static subscribeToLocationUpdates(
    sessionId: string,
    callback: (location: Location) => void
  ) {
    const channel = supabase
      .channel(`tracking_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tracking_locations",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          callback(payload.new as Location);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * ✅ One-time GPS position
   */
  static async getCurrentGPSPosition(): Promise<GeolocationPosition | null> {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Geolocation not supported."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        (err) => reject(err),
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * ✅ Continuous GPS tracking
   * SAFETY: resilient against network errors
   */
  static startGPSWatch(
    sessionId: string,
    onPosition: (location: Location) => void,
    onError?: (error: GeolocationPositionError) => void
  ): number | null {
    if (!("geolocation" in navigator)) {
      console.warn("Geolocation unavailable.");
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

          const saved = await TrackingAPI.saveLocation(location);
          if (saved) {
            onPosition(location);
          }
        } catch (err) {
          console.error("GPS tracking error:", err);
        }
      },
      (err) => {
        console.error("GPS watch error:", err);
        onError?.(err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      }
    );

    return watchId;
  }

  /**
   * ✅ Stop GPS watch
   */
  static stopGPSWatch(watchId: number | null) {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  /**
   * 🔋 Battery level (safe)
   */
  private static async getBatteryLevel(): Promise<number | null> {
    try {
      if ("getBattery" in navigator) {
        const battery: any = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      }
    } catch {
      // ignore
    }
    return null;
  }
}
