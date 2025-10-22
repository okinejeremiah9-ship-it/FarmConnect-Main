// Location: src/hooks/useLocationTracking.ts
// Purpose: Real-time GPS tracking hook using phone's built-in GPS (no simulation)

import { useState, useEffect, useRef } from 'react';
import { TrackingAPI, Location } from '../lib/api/trackingAPI';

interface UseLocationTrackingOptions {
  sessionId: string;
  updateInterval?: number; // minimum time between updates (ms)
  onLocationUpdate?: (location: Location) => void;
  onError?: (error: string) => void;
}

export const useLocationTracking = ({
  sessionId,
  updateInterval = 10000, // every 10 seconds (real GPS interval)
  onLocationUpdate,
  onError,
}: UseLocationTrackingOptions) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // ✅ Track battery level in real time (if supported)
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          setBatteryLevel(Math.round(battery.level * 100));
          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
        })
        .catch(() => console.warn('Battery API not supported.'));
    }
  }, []);

  // ✅ Start tracking driver’s real GPS position
  const startTracking = async () => {
    if (!('geolocation' in navigator)) {
      const message = 'GPS not supported on this device.';
      setError(message);
      onError?.(message);
      return;
    }

    try {
      setIsTracking(true);
      setError(null);

      watchIdRef.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const now = Date.now();
          // throttle updates to avoid flooding
          if (now - lastUpdateRef.current < updateInterval) return;
          lastUpdateRef.current = now;

          const newLocation: Location = {
            session_id: sessionId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            recorded_at: new Date().toISOString(),
            battery_level: batteryLevel || undefined,
            speed: pos.coords.speed ?? 0,
          };

          setCurrentLocation(newLocation);

          try {
            await TrackingAPI.saveLocation(newLocation);
            onLocationUpdate?.(newLocation);
          } catch (err) {
            console.error('Save location failed:', err);
          }
        },
        (err) => {
          let message = 'GPS error.';
          if (err.code === err.PERMISSION_DENIED)
            message = 'Permission denied. Enable location access.';
          else if (err.code === err.POSITION_UNAVAILABLE)
            message = 'Location unavailable.';
          else if (err.code === err.TIMEOUT)
            message = 'GPS timeout. Try again.';

          setError(message);
          onError?.(message);
          console.error('Geolocation error:', err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15000,
        }
      );
    } catch (err: any) {
      setError(err.message);
      onError?.(err.message);
    }
  };

  // ✅ Stop tracking
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  // ✅ Clean up when unmounted
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return {
    isTracking,
    currentLocation,
    error,
    batteryLevel,
    startTracking,
    stopTracking,
  };
};
