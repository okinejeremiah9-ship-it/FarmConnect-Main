// Location: src/components/tracking/LiveTrackingView.tsx
// Purpose: Display real-time driver location on OpenStreetMap using live Supabase updates

import React, { useEffect, useState, useMemo, useRef } from "react";
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
import { Navigation } from "lucide-react";
import { useParams } from "react-router-dom";
import {
  TrackingAPI,
  Location,
  TrackingSession,
} from "../../lib/api/trackingAPI";
import { supabase } from "../../lib/supabase";

/* ---------------- Leaflet icon fix (UNCHANGED) ---------------- */

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

/* ---------------- Types ---------------- */

interface LiveTrackingViewProps {
  sessionId?: string;
  onBack?: () => void;
}

/* ---------------- Map auto-center ---------------- */

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

/* ---------------- Bearing calculation ---------------- */

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

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

/* ================== MAIN COMPONENT ================== */

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
  const [accessRestricted, setAccessRestricted] = useState(false);

  const lastLocationRef = useRef<Location | null>(null);

  /* ---------------- DEBUG ---------------- */

  useEffect(() => {
    console.log("🔍 LiveTrackingView mounted");
    console.log("🔍 sessionId prop:", sessionId);
    console.log("🔍 paramSessionId:", paramSessionId);
    console.log("🔍 activeSessionId:", activeSessionId);
  }, [sessionId, paramSessionId, activeSessionId]);

  /* -------- Load session metadata (SAFE) -------- */

  useEffect(() => {
    if (!activeSessionId) {
      console.error("❌ No tracking session ID provided");
      setLoading(false);
      return;
    }

    const loadSession = async () => {
      try {
        const data = await TrackingAPI.getSession(activeSessionId);

        if (!data) {
          console.warn(
            "⚠️ Tracking session exists but access may be restricted."
          );
          setAccessRestricted(true);
          return;
        }

        setSession(data);
        setAccessRestricted(false);
      } catch (err) {
        console.error("❌ Failed to load tracking session:", err);
        setAccessRestricted(true);
      }
    };

    loadSession();
  }, [activeSessionId]);

  /* -------- Load initial data + realtime -------- */

  useEffect(() => {
    if (!activeSessionId || accessRestricted) return;

    let isMounted = true;

    const loadInitial = async () => {
      try {
        const allLocations = await TrackingAPI.getLocations(activeSessionId);

        if (!isMounted) return;

        if (allLocations?.length) {
          const ordered = [...allLocations].sort(
            (a, b) =>
              new Date(a.recorded_at).getTime() -
              new Date(b.recorded_at).getTime()
          );

          setRoute(ordered);
          const last = ordered[ordered.length - 1];
          setLocation(last);
          lastLocationRef.current = last;

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
          const latest = await TrackingAPI.getLatestLocation(activeSessionId);
          if (latest) {
            setLocation(latest);
            setRoute([latest]);
            lastLocationRef.current = latest;
          }
        }
      } catch (err) {
        console.error("❌ Failed to load initial location:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitial();

    const channel = supabase
      .channel(`tracking_${activeSessionId}`)
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
          const prev = lastLocationRef.current;

          if (prev) {
            setBearing(
              calculateBearing(
                prev.latitude,
                prev.longitude,
                newLocation.latitude,
                newLocation.longitude
              )
            );
          }

          lastLocationRef.current = newLocation;
          setLocation(newLocation);
          setRoute((prevRoute) => [...prevRoute, newLocation]);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [activeSessionId, accessRestricted]);

  /* -------- Derived route positions -------- */

  const routePositions = useMemo(
    () =>
      route.map(
        (p) => [p.latitude, p.longitude] as [number, number]
      ),
    [route]
  );

  /* -------- Driver icon -------- */

  const driverIcon = useMemo(() => {
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
          transform: rotate(${bearing ?? 0}deg);
          transition: transform 0.2s linear;
        ">
          <span style="font-size: 18px;">🚜</span>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
  }, [bearing]);

  /* ================== UI ================== */

  if (accessRestricted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold mb-2">
            Tracking session found
          </h2>
          <p className="text-sm text-slate-400">
            This tracking session exists, but your account does not currently
            have permission to view live tracking data.
          </p>
        </div>
      </div>
    );
  }

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
            <TileLayer
              attribution='&copy; OpenStreetMap & CARTO'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {routePositions.length > 1 && (
              <Polyline
                positions={routePositions}
                pathOptions={{ color: "#22c55e", weight: 5, opacity: 0.9 }}
              />
            )}

            <Marker
              position={[location.latitude, location.longitude]}
              icon={driverIcon}
            >
              <Popup>
                <div className="text-sm">
                  <strong>Driver Location</strong><br />
                  Lat: {location.latitude.toFixed(6)} <br />
                  Lng: {location.longitude.toFixed(6)} <br />
                  Speed: {location.speed?.toFixed(1) || 0} m/s <br />
                  Accuracy: ±{Math.round(location.accuracy)}m <br />
                  Battery: {location.battery_level ?? "--"}% <br />
                  Time: {new Date(location.recorded_at).toLocaleTimeString()}
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
            No location data available yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTrackingView;
