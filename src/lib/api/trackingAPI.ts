// Location: src/lib/api/trackingAPI.ts
// Purpose: GPS tracking API with bookingId-first logic & real-time updates via Supabase

import { supabase } from "../supabase";

/* ---------------- Types ---------------- */

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

/* ---------------- Tracking API ---------------- */

export class TrackingAPI {
  /* ---------------- Session Methods ---------------- */

  /**
   * Fetch a tracking session by bookingId
   * Returns the latest active session if multiple exist
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
      console.error("Error fetching session by bookingId:", error);
      return null;
    }

    return (data as TrackingSession) ?? null;
  }

  /**
   * Create a new session for a bookingId
   * Returns existing active session if it exists
   */
  static async createSession(
    bookingId: string,
    driverId: string,
    driverName?: string,
    driverPhone?: string
  ): Promise<TrackingSession> {
    const existing = await this.getSessionByBookingId(bookingId);

    if (existing && existing.status === "active") return existing;

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

    if (error) throw new Error(`Failed to create session: ${error.message}`);

    return data as TrackingSession;
  }

  /**
   * Update session status
   */
  static async updateSessionStatus(
    sessionId: string,
    status: "active" | "paused" | "completed"
  ) {
    const update: any = { status };
    if (status === "completed") update.ended_at = new Date().toISOString();

    const { error } = await supabase
      .from("tracking_sessions")
      .update(update)
      .eq("id", sessionId);

    if (error) throw new Error(`Failed to update session status: ${error.message}`);
  }

  /* ---------------- Location Methods ---------------- */

  /**
   * Get all locations for a session (safe limit 2000)
   */
  static async getLocations(sessionId: string): Promise<Location[]> {
    const { data, error } = await supabase
      .from("tracking_locations")
      .select("*")
      .eq("session_id", sessionId)
      .order("recorded_at", { ascending: true })
      .limit(2000);

    if (error) {
      console.error("Error fetching locations:", error);
      return [];
    }

    return (data as Location[]) || [];
  }

  /**
   * Subscribe to real-time location updates
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
        (payload) => callback(payload.new as Location)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }

  /**
   * Save a location
   */
  static async saveLocation(location: Location): Promise<boolean> {
    const { error } = await supabase.from("tracking_locations").insert(location);
    if (error) {
      console.error("Save location failed:", error);
      return false;
    }
    return true;
  }

  /**
   * Get latest location for a session
   */
  static async getLatestLocation(sessionId: string): Promise<Location | null> {
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

  /* ---------------- GPS Helpers ---------------- */

  /**
   * One-time GPS position
   */
  static async getCurrentGPSPosition(): Promise<GeolocationPosition | null> {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) return reject(new Error("Geolocation not supported"));
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      });
    });
  }

  /**
   * Start continuous GPS tracking
   */
  static startGPSWatch(
    sessionId: string,
    onPosition: (location: Location) => void,
    onError?: (error: GeolocationPositionError) => void
  ): number | null {
    if (!("geolocation" in navigator)) {
      console.warn("Geolocation unavailable");
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          const battery = await this.getBatteryLevel();

          const loc: Location = {
            session_id: sessionId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed ?? 0,
            recorded_at: new Date().toISOString(),
            battery_level: battery ?? undefined,
          };

          const saved = await this.saveLocation(loc);
          if (saved) onPosition(loc);
        } catch (err) {
          console.error("GPS watch error:", err);
        }
      },
      (err) => {
        console.error("GPS watch error:", err);
        onError?.(err);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );

    return watchId;
  }

  static stopGPSWatch(watchId: number | null) {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  }

  private static async getBatteryLevel(): Promise<number | null> {
    try {
      if ("getBattery" in navigator) {
        const battery: any = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      }
    } catch {}
    return null;
  }
}
