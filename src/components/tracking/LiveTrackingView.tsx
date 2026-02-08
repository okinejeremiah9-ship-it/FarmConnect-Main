// Location: src/components/tracking/LiveTrackingView.tsx
// Purpose: Display real-time driver location on OpenStreetMap using bookingId-safe logic

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
// import { supabase } from "../../lib/supabase"; // Unused in this snippet, kept if needed

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

  const bookingId = sessionId || paramSessionId || "";

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
    console.log("🔍 bookingId:", bookingId);
  }, [bookingId]);

  /* -------- Resolve tracking session via bookingId -------- */

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    const loadSession = async () => {
      const data = await TrackingAPI.getSessionByBookingId(bookingId);

      if (!data) {
        console.warn(
          "⚠️ Tracking session exists but access may be restricted."
        );
        setAccessRestricted(true);
        setLoading(false);
        return;
      }

      setSession(data);
      setAccessRestricted(false);
    };

    loadSession();
  }, [bookingId]);

  /* -------- Load locations + realtime -------- */

  useEffect(() => {
    if (!session?.id || accessRestricted) return;

    let isMounted = true;

    const loadInitial = async () => {
      try {
        const all = await TrackingAPI.getLocations(session.id);

        if (!isMounted) return;

        if (all.length) {
          setRoute(all);
          const last = all[all.length - 1];
          setLocation(last);
          lastLocationRef.current = last;

          if (all.length > 1) {
            const prev = all[all.length - 2];
            setBearing(
              calculateBearing(
                prev.latitude,
                prev.longitude,
                last.latitude,
                last.longitude
              )
            );
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitial();

    const unsubscribe = TrackingAPI.subscribeToLocationUpdates(
      session.id,
      (newLocation) => {
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
        setRoute((r) => [...r, newLocation]);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [session?.id, accessRestricted]);

  /* -------- Derived route positions -------- */

  const routePositions = useMemo(
    () => route.map((p) => [p.latitude, p.longitude] as [number, number]),
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
      <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-200 p-4 rounded-lg">
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold mb-2">Access restricted</h2>
          <p className="text-sm text-slate-400">
            This tracking session exists, but your account does not have
            permission to view it.
          </p>
        </div>
      </div>
    );
  }

  return (
    // FIX 1: Removed 'min-h-screen'. Using 'w-full' and 'rounded-xl' to fit within the dashboard panel.
    // FIX 2: Added 'relative' and 'z-0' (via isolation) to ensure map doesn't overlap the sidebar.
    <div className="w-full h-auto bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col p-2 sm:p-4 rounded-xl shadow-sm relative isolate z-0">
      <div className="w-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg shrink-0">
            <Navigation className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">
              Live Tracking
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Booking #{session?.booking_id || "—"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-slate-300 mt-4 sm:mt-8 min-h-[300px] flex items-center justify-center">
            Loading map data...
          </div>
        ) : location ? (
          // FIX 3: Ensure Map Container is explicitly relative and z-0 to trap Leaflet's layers
          <div className="w-full h-[500px] rounded-2xl shadow-xl border border-slate-800 overflow-hidden relative z-0">
            <MapContainer
              center={[location.latitude, location.longitude]}
              zoom={15}
              className="w-full h-full z-0" // Explicit z-0 on the map itself
            >
              <TileLayer
                attribution="&copy; OpenStreetMap & CARTO"
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />

              {routePositions.length > 1 && (
                <Polyline
                  positions={routePositions}
                  pathOptions={{ color: "#22c55e", weight: 5 }}
                />
              )}

              <Marker
                position={[location.latitude, location.longitude]}
                icon={driverIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>Driver Location</strong>
                    <br />
                    Lat: {location.latitude.toFixed(6)}
                    <br />
                    Lng: {location.longitude.toFixed(6)}
                    <br />
                    Speed: {location.speed ?? 0} m/s
                    <br />
                    Battery: {location.battery_level ?? "--"}%
                  </div>
                </Popup>
              </Marker>

              <MapAutoCenter lat={location.latitude} lng={location.longitude} />
            </MapContainer>
          </div>
        ) : (
          <div className="text-center text-slate-300 mt-4 sm:mt-8 min-h-[300px] flex items-center justify-center">
            No location data yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTrackingView;