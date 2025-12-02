// Location: src/components/tracking/LiveTrackingView.tsx
// Purpose: Display real-time driver location on OpenStreetMap using live Supabase updates

import React, { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, Navigation } from "lucide-react";
import { useParams } from "react-router-dom";
import {
  TrackingAPI,
  Location,
  TrackingSession,
} from "../../lib/api/trackingAPI";
import { supabase } from "../../lib/supabase";

// Fix default marker icon issue with Leaflet + Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url
  ).toString(),
  iconUrl: new URL(
    "leaflet/dist/images/marker-icon.png",
    import.meta.url
  ).toString(),
  shadowUrl: new URL(
    "leaflet/dist/images/marker-shadow.png",
    import.meta.url
  ).toString(),
});

interface LiveTrackingViewProps {
  sessionId?: string;
  onBack?: () => void;
}

// Helper component to move map as driver updates position
const MapAutoCenter: React.FC<{ lat: number; lng: number }> = ({
  lat,
  lng,
}) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
};

// Bearing calculator for icon rotation
const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const λ1 = toRad(lon1);
  const λ2 = toRad(lon2);
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  let brng = (toDeg(θ) + 360) % 360;
  return brng;
};

const LiveTrackingView: React.FC<LiveTrackingViewProps> = ({
  sessionId,
  onBack,
}) => {
  const { sessionId: paramSessionId } = useParams<{ sessionId: string }>();
  const activeSessionId = sessionId || paramSessionId || "";

  const [session, setSession] = useState<TrackingSession | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [route, setRoute] = useState<Location[]>([]);
  const [bearing, setBearing] = useState<number | null>(null);
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

  // 📡 Load history + latest location + subscribe to real-time updates
  useEffect(() => {
    if (!activeSessionId) return;

    const loadInitial = async () => {
      try {
        // Load all historical locations to draw full route
        const allLocations = await TrackingAPI.getLocations(activeSessionId);
        if (allLocations && allLocations.length > 0) {
          // Sort oldest → newest
          const ordered = [...allLocations].sort(
            (a, b) =>
              new Date(a.recorded_at).getTime() -
              new Date(b.recorded_at).getTime()
          );
          setRoute(ordered);
          const last = ordered[ordered.length - 1];
          setLocation(last);

          if (ordered.length > 1) {
            const prev = ordered[ordered.length - 2];
            setBearing(
              calculateBearing(
                prev.latitude,
                prev.longitude,
                last.latitude,
                last.longitude
              )
            );
          }
        } else {
          // Fallback to single latest location if no history
          const latest = await TrackingAPI.getLatestLocation(activeSessionId);
          if (latest) {
            setLocation(latest);
            setRoute([latest]);
          }
        }
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
          setRoute((prev) => {
            const next = [...prev, newLocation];
            if (prev.length > 0) {
              const last = prev[prev.length - 1];
              setBearing(
                calculateBearing(
                  last.latitude,
                  last.longitude,
                  newLocation.latitude,
                  newLocation.longitude
                )
              );
            }
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSessionId]);

  // Bolt/Uber-like dark map + green route positions
  const routePositions = useMemo(
    () =>
      route.map(
        (p) => [p.latitude, p.longitude] as [number, number]
      ),
    [route]
  );

  // Custom rotating "vehicle" icon (green circle with tractor emoji)
  const driverIcon = useMemo(() => {
    const angle = bearing ?? 0;
    return L.divIcon({
      className: "driver-marker-icon",
      html: `
        <div style="
          width: 34px;
          height: 34px;
          border-radius: 9999px;
          background: #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 10px rgba(0,0,0,0.45);
          transform: rotate(${angle}deg);
          transition: transform 0.2s linear;
        ">
          <span style="font-size: 18px;">🚜</span>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
  }, [bearing]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Live Tracking</h1>
              <p className="text-sm text-slate-300">
                Booking #{session?.booking_id || "—"} · Real-time driver view
              </p>
            </div>
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-100 text-xs font-semibold border border-slate-700 hover:bg-slate-700"
            >
              Back
            </button>
          )}
        </div>

        {/* Map */}
        {loading ? (
          <div className="text-center text-slate-300 mt-8">
            Loading map data...
          </div>
        ) : location ? (
          <MapContainer
            center={[location.latitude, location.longitude]}
            zoom={15}
            className="w-full h-[450px] rounded-2xl shadow-xl border border-slate-800 overflow-hidden"
          >
            {/* Dark, Uber-style tiles */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> & <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Route polyline */}
            {routePositions.length > 1 && (
              <Polyline
                positions={routePositions}
                pathOptions={{
                  color: "#22c55e",
                  weight: 5,
                  opacity: 0.9,
                }}
              />
            )}

            {/* Moving, rotating driver marker */}
            <Marker
              position={[location.latitude, location.longitude]}
              icon={driverIcon}
            >
              <Popup>
                <div className="text-sm">
                  <strong>Driver Location</strong>
                  <br />
                  Lat: {location.latitude.toFixed(6)} <br />
                  Lng: {location.longitude.toFixed(6)} <br />
                  Speed: {location.speed?.toFixed(1) || 0} m/s <br />
                  Accuracy: ±{Math.round(location.accuracy)}m <br />
                  Battery: {location.battery_level ?? "--"}% <br />
                  Time:{" "}
                  {new Date(location.recorded_at).toLocaleTimeString()}
                </div>
              </Popup>
            </Marker>

            <MapAutoCenter
              lat={location.latitude}
              lng={location.longitude}
            />
          </MapContainer>
        ) : (
          <div className="text-center text-slate-300 mt-8">
            No location data available yet. Driver may not have started tracking.
          </div>
        )}

        {/* Info Card */}
        {location && (
          <div className="bg-slate-900/80 rounded-xl p-4 shadow-lg mt-4 border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-green-400" />
              <h2 className="font-semibold text-slate-100 text-sm">
                Current Driver Location
              </h2>
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <p>Latitude: {location.latitude.toFixed(6)}</p>
              <p>Longitude: {location.longitude.toFixed(6)}</p>
              <p>Speed: {location.speed?.toFixed(1) || 0} m/s</p>
              <p>Accuracy: ±{Math.round(location.accuracy)}m</p>
              <p>Battery: {location.battery_level ?? "--"}%</p>
              <p>
                Last updated:{" "}
                {new Date(location.recorded_at).toLocaleTimeString()}
              </p>
              {bearing !== null && (
                <p>Heading: {Math.round(bearing)}°</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTrackingView;
