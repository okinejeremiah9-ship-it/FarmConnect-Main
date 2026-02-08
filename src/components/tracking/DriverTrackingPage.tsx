// Location: src/components/tracking/DriverTrackingPage.tsx
// Purpose: Real GPS tracking page for drivers (live phone-based tracking)

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  MapPin,
  Navigation,
  Battery,
  Signal,
  Play,
  Pause,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import type { Location } from "../../lib/api/trackingAPI";
import { TrackingAPI, TrackingSession } from "../../lib/api/trackingAPI";

// ✅ Props
interface DriverTrackingPageProps {
  sessionId?: string;
  onComplete?: () => void;
}

const DriverTrackingPage: React.FC<DriverTrackingPageProps> = ({
  sessionId,
  onComplete,
}) => {
  const { sessionId: paramSessionId } = useParams<{ sessionId: string }>();
  const effectiveSessionId = sessionId || paramSessionId || "";

  const [session, setSession] = useState<TrackingSession | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [locationCount, setLocationCount] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // ✅ GPS throttling (SAFE ADDITION)
  const lastUpdateRef = useRef<number>(0);
  const UPDATE_INTERVAL = 10000; // 10 seconds

  // 🔋 Battery level
  useEffect(() => {
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((bat: any) => {
        const updateBattery = () =>
          setBatteryLevel(Math.round(bat.level * 100));
        updateBattery();
        bat.addEventListener("levelchange", updateBattery);
      });
    }
  }, []);

  // 🧭 Load session
  useEffect(() => {
    const loadSession = async () => {
      if (!effectiveSessionId) return;

      const data = await TrackingAPI.getSession(effectiveSessionId);
      if (!data) {
        console.warn("Session exists but access may be restricted.");
        return;
      }
      setSession(data);
    };

    loadSession();
  }, [effectiveSessionId]);

  // 🛰️ Start GPS tracking
  const startTracking = async () => {
    if (!navigator.geolocation) {
      alert("This device does not support GPS tracking.");
      return;
    }

    if (!effectiveSessionId) {
      alert("Missing tracking session ID.");
      return;
    }

    try {
      await TrackingAPI.updateSessionStatus(effectiveSessionId, "active");
    } catch (err) {
      console.error("Failed to activate session:", err);
    }

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        if (now - lastUpdateRef.current < UPDATE_INTERVAL) return;
        lastUpdateRef.current = now;

        const { latitude, longitude, accuracy, speed } = pos.coords;

        const locationData: Location = {
          session_id: effectiveSessionId,
          latitude,
          longitude,
          accuracy: accuracy ?? 0,
          recorded_at: new Date().toISOString(),
          battery_level: batteryLevel ?? undefined,
          speed: speed ?? undefined,
        };

        setCurrentLocation(locationData);
        setLocationCount((prev) => prev + 1);
        setError(null);

        try {
          await TrackingAPI.saveLocation(locationData);
        } catch (err: any) {
          console.error("❌ Failed to save location:", err);
          setError("Could not update live location.");
        }
      },
      (err) => {
        console.error("GPS Error:", err);
        setError("Please enable location permissions and ensure GPS is active.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );

    setWatchId(id);
    setIsTracking(true);
  };

  // 🛑 Stop tracking
  const stopTracking = async () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);

    if (!effectiveSessionId) return;

    try {
      await TrackingAPI.updateSessionStatus(effectiveSessionId, "paused");
    } catch (err) {
      console.error("Failed to pause session:", err);
    }
  };

  // ✅ Complete job
  const handleComplete = async () => {
    if (!window.confirm("Complete this job? Tracking will stop permanently."))
      return;

    setIsCompleting(true);

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    setIsTracking(false);

    try {
      await TrackingAPI.updateSessionStatus(effectiveSessionId, "completed");
      alert("Job completed successfully!");
      onComplete?.();
    } catch (err) {
      console.error("Error completing job:", err);
      alert("Failed to complete tracking session.");
    } finally {
      setIsCompleting(false);
    }
  };

  // 🧹 Cleanup
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-b-2 border-green-500 mx-auto mb-3"></div>
          <p className="text-gray-700">Loading tracking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
      <div className="max-w-md mx-auto mt-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-3 shadow-lg">
            <Navigation className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Driver Tracking
          </h1>
          <p className="text-gray-600">Booking #{session.booking_id}</p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl p-5 shadow-lg border border-green-100 mb-4">
          <div className="flex justify-between mb-3">
            <span>Status</span>
            <span className={isTracking ? "text-green-600" : "text-gray-600"}>
              {isTracking ? "Active" : "Paused"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>Updates: {locationCount}</div>
            <div>Battery: {batteryLevel ?? "--"}%</div>
          </div>

          {currentLocation && (
            <div className="text-sm">
              <div>Lat: {currentLocation.latitude.toFixed(6)}</div>
              <div>Lon: {currentLocation.longitude.toFixed(6)}</div>
              <div>Accuracy: ±{Math.round(currentLocation.accuracy)}m</div>
              <div>
                Time:{" "}
                {new Date(
                  currentLocation.recorded_at
                ).toLocaleTimeString()}
              </div>
            </div>
          )}

          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {!isTracking ? (
            <button
              onClick={startTracking}
              className="w-full bg-green-600 text-white py-3 rounded-lg"
            >
              Start Tracking
            </button>
          ) : (
            <button
              onClick={stopTracking}
              className="w-full bg-blue-600 text-white py-3 rounded-lg"
            >
              Pause Tracking
            </button>
          )}

          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="w-full border py-3 rounded-lg"
          >
            Complete Job
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverTrackingPage;
