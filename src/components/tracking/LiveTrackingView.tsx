// Location: src/components/tracking/LiveTrackingView.tsx
// Purpose: Display real-time driver location on OpenStreetMap using live Supabase updates

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, Navigation } from "lucide-react";
import { useParams } from "react-router-dom";
import { TrackingAPI, Location, TrackingSession } from "../../lib/api/trackingAPI";
import { supabase } from "../../lib/supabase";

// Fix default marker icon issue with Leaflet + Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
});

interface LiveTrackingViewProps {
  sessionId?: string;
}

// Helper component to move map as driver updates position
const MapAutoCenter: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
};

const LiveTrackingView: React.FC<LiveTrackingViewProps> = ({ sessionId }) => {
  const { sessionId: paramSessionId } = useParams<{ sessionId: string }>();
  const activeSessionId = sessionId || paramSessionId;

  const [session, setSession] = useState<TrackingSession | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);

  // 🧭 Load tracking session info
  useEffect(() => {
    const loadSession = async () => {
      if (!activeSessionId) return;
      const data = await TrackingAPI.getSession(activeSessionId);
      if (!data) {
        alert("Invalid tracking session ID.");
        return;
      }
      setSession(data);
    };
    loadSession();
  }, [activeSessionId]);

  // 📡 Load latest location + subscribe to real-time updates
  useEffect(() => {
    if (!activeSessionId) return;

    const loadInitial = async () => {
      try {
        const latest = await TrackingAPI.getLatestLocation(activeSessionId);
        if (latest) setLocation(latest);
      } catch (err) {
        console.error("Failed to load initial location:", err);
      } finally {
        setLoading(false);
      }
    };

    loadInitial();

    // 🔔 Supabase Realtime subscription for updates
    const channel = supabase
      .channel(`realtime_tracking_${activeSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tracking_locations",
          filter: `session_id=eq.${activeSessionId}`,
        },
        (payload) => {
          const newLocation = payload.new as Location;
          setLocation(newLocation);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
            <Navigation className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Live Tracking</h1>
            <p className="text-gray-600">Booking #{session?.booking_id || "—"}</p>
          </div>
        </div>

        {/* Map */}
        {loading ? (
          <div className="text-center text-gray-600 mt-8">Loading map data...</div>
        ) : location ? (
          <MapContainer
            center={[location.latitude, location.longitude]}
            zoom={15}
            className="w-full h-[450px] rounded-2xl shadow-lg border border-green-200"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[location.latitude, location.longitude]}>
              <Popup>
                <div className="text-sm">
                  <strong>Driver Location</strong>
                  <br />
                  Lat: {location.latitude.toFixed(6)} <br />
                  Lng: {location.longitude.toFixed(6)} <br />
                  Speed: {location.speed?.toFixed(1) || 0} m/s <br />
                  Accuracy: ±{Math.round(location.accuracy)}m <br />
                  Battery: {location.battery_level ?? "--"}% <br />
                  Time: {new Date(location.recorded_at).toLocaleTimeString()}
                </div>
              </Popup>
            </Marker>
            <MapAutoCenter lat={location.latitude} lng={location.longitude} />
          </MapContainer>
        ) : (
          <div className="text-center text-gray-600 mt-8">No location data available.</div>
        )}

        {/* Info Card */}
        {location && (
          <div className="bg-white rounded-xl p-4 shadow-lg mt-4 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-gray-800 text-sm">Current Driver Location</h2>
            </div>
            <div className="text-xs text-gray-700 space-y-1">
              <p>Latitude: {location.latitude.toFixed(6)}</p>
              <p>Longitude: {location.longitude.toFixed(6)}</p>
              <p>Speed: {location.speed?.toFixed(1) || 0} m/s</p>
              <p>Accuracy: ±{Math.round(location.accuracy)}m</p>
              <p>Battery: {location.battery_level ?? "--"}%</p>
              <p>Last updated: {new Date(location.recorded_at).toLocaleTimeString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTrackingView;
