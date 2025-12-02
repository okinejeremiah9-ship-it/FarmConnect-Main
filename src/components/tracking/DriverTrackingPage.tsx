// Location: src/components/tracking/DriverTrackingPage.tsx
// Purpose: Real GPS tracking page for drivers (live phone-based tracking)

import React, { useState, useEffect } from "react";
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
  sessionId?: string; // NEW: allow passing from MainApp
  onComplete?: () => void;
}

const DriverTrackingPage: React.FC<DriverTrackingPageProps> = ({
  sessionId,
  onComplete,
}) => {
  const { sessionId: paramSessionId } = useParams<{ sessionId: string }>();

  // Use prop if passed, otherwise fall back to URL param
  const effectiveSessionId = sessionId || paramSessionId || "";

  const [session, setSession] = useState<TrackingSession | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [locationCount, setLocationCount] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // 🔋 Fetch battery level (if supported)
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

  // 🧭 Load session details
  useEffect(() => {
    const loadSession = async () => {
      if (!effectiveSessionId) return;
      const data = await TrackingAPI.getSession(effectiveSessionId);
      if (!data) {
        alert("Invalid or expired tracking session.");
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
        const { latitude, longitude, accuracy, speed } = pos.coords;

        // ✅ Strongly typed location object
        const locationData: Location = {
          session_id: effectiveSessionId,
          latitude: latitude ?? 0,
          longitude: longitude ?? 0,
          accuracy: accuracy ?? 0,
          recorded_at: new Date().toISOString(),
          battery_level: batteryLevel ?? undefined,
          speed: speed ?? undefined,
        };

        // ✅ Update state
        setCurrentLocation(locationData);
        setError(null);
        setLocationCount((prev) => prev + 1);

        try {
          // ✅ Save directly to Supabase
          await TrackingAPI.saveLocation(locationData);
        } catch (err: any) {
          console.error("❌ Failed to save location:", err.message || err);
          setError("Could not update live location.");
        }
      },
      (err) => {
        console.error("GPS Error:", err);
        setError("Please enable location permissions and ensure GPS is active.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
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

  // ✅ Complete job (finish session)
  const handleComplete = async () => {
    if (
      !window.confirm(
        "Complete this job? Tracking will stop permanently."
      )
    )
      return;

    setIsCompleting(true);
    await stopTracking();

    try {
      if (effectiveSessionId) {
        await TrackingAPI.updateSessionStatus(
          effectiveSessionId,
          "completed"
        );
      }
      alert("Job completed successfully!");
      onComplete?.();
    } catch (err) {
      console.error("Error completing job:", err);
      alert("Failed to complete tracking session.");
    } finally {
      setIsCompleting(false);
    }
  };

  // 🧹 Cleanup on unmount (stop GPS if open)
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
          <h1 className="text-2xl font-bold text-gray-800">Driver Tracking</h1>
          <p className="text-gray-600">Booking #{session.booking_id}</p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl p-5 shadow-lg border border-green-100 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600 font-medium">Status</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 ${
                isTracking
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isTracking ? "bg-green-500 animate-pulse" : "bg-gray-400"
                }`}
              ></span>
              {isTracking ? "Active" : "Paused"}
            </span>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Signal className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-900">Updates Sent</span>
              </div>
              <div className="text-xl font-bold text-blue-700">
                {locationCount}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <Battery className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-900">Battery</span>
              </div>
              <div className="text-xl font-bold text-green-700">
                {batteryLevel ?? "--"}%
              </div>
            </div>
          </div>

          {/* Current Location */}
          {currentLocation && (
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-gray-800">
                  Current Location
                </span>
              </div>
              <div className="text-xs text-gray-700 space-y-1">
                <div>Lat: {currentLocation.latitude.toFixed(6)}</div>
                <div>Lon: {currentLocation.longitude.toFixed(6)}</div>
                <div>
                  Accuracy: ±{Math.round(currentLocation.accuracy)}m
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />{" "}
                  {new Date(
                    currentLocation.recorded_at
                  ).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 mt-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {!isTracking ? (
            <button
              onClick={startTracking}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg"
            >
              <Play className="w-5 h-5" />
              Start Tracking
            </button>
          ) : (
            <button
              onClick={stopTracking}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg"
            >
              <Pause className="w-5 h-5" />
              Pause Tracking
            </button>
          )}

          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 py-4 rounded-xl flex items-center justify-center gap-2 font-semibold shadow"
          >
            {isCompleting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                Completing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Complete Job
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverTrackingPage;
