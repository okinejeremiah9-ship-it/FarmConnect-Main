// src/hooks/useBookingGpsTracking.ts
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

interface UseBookingGpsTrackingOptions {
  bookingId: string | null;
  providerId: string | null;
  enabled: boolean;             // true = tracking on
  intervalMs?: number;          // throttle insert (default ~20s)
}

/**
 * Simple hook to stream provider GPS into booking_gps_points.
 * - Uses navigator.geolocation.watchPosition
 * - Throttles inserts to Supabase
 */
export function useBookingGpsTracking({
  bookingId,
  providerId,
  enabled,
  intervalMs = 20000,
}: UseBookingGpsTrackingOptions) {
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !bookingId || !providerId) {
      // If disabled or missing data → cleanup
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setActive(false);
      return;
    }

    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setError(null);

    const success = async (pos: GeolocationPosition) => {
      const now = Date.now();
      if (now - lastSentRef.current < intervalMs) {
        // Too soon, skip
        return;
      }
      lastSentRef.current = now;

      const { latitude, longitude } = pos.coords;

      try {
        // ✅ UPDATED INSERT — matches new database schema
        const { error: insertError } = await supabase
          .from("booking_gps_points")
          .insert({
            booking_id: bookingId,
            provider_id: providerId,
            latitude,     // UPDATED
            longitude,    // UPDATED
          });

        if (insertError) {
          console.error("❌ Failed to insert GPS point:", insertError);
          setError("Failed to send GPS point");
        }
      } catch (err) {
        console.error("❌ GPS insert error:", err);
        setError("Failed to send GPS point");
      }
    };

    const failure = (err: GeolocationPositionError) => {
      console.error("GPS watch error:", err);
      setError(err.message || "Failed to get GPS");
    };

    // Start watching
    const watchId = navigator.geolocation.watchPosition(success, failure, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 20000,
    });

    watchIdRef.current = watchId;
    setActive(true);

    // Cleanup on unmount / disable
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setActive(false);
    };
  }, [enabled, bookingId, providerId, intervalMs]);

  return { active, error };
}
