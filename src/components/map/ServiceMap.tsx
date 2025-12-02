// ----------------------------------------------
// ServiceMap.tsx — FULL UPGRADED VERSION (Bolt-style)
// ----------------------------------------------
import React, { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { supabase } from "../../lib/supabase";

interface ServiceMapProps {
  bookingId?: string; // optional — if present → tracking mode
}

export const ServiceMap: React.FC<ServiceMapProps> = ({ bookingId }) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [userMarker, setUserMarker] = useState<L.Marker | null>(null);
  const [services, setServices] = useState<any[]>([]);

  // tracking
  const [providerMarker, setProviderMarker] = useState<L.Marker | null>(null);
  const [trackingLine, setTrackingLine] = useState<L.Polyline | null>(null);
  const [trackingPoints, setTrackingPoints] = useState<
    { latitude: number; longitude: number; created_at: string }[]
  >([]);

  const trackingMode = Boolean(bookingId);
  const hasPoints = trackingPoints.length > 0;

  // ----------------------------------------------
  // INIT MAP (upgrade to HOT style tiles)
  // ----------------------------------------------
  useEffect(() => {
    const m = L.map("map", {
      zoomControl: true,
      attributionControl: true,
    }).setView([7.9465, -1.0232], 7);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        "&copy; OpenStreetMap contributors | HOT humanitarian tiles",
    }).addTo(m);

    setMap(m);
    return () => m.remove();
  }, []);

  // ----------------------------------------------
  // LOAD PROVIDERS (ONLY IF NOT IN TRACKING MODE)
  // ----------------------------------------------
  useEffect(() => {
    if (trackingMode) return;

    const load = async () => {
      const { data, error } = await supabase
        .from("services")
        .select(
          "id, provider_id, business_name, service_description, category, latitude, longitude, profile_pic"
        )
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (!error) setServices(data || []);
    };
    load();
  }, [trackingMode]);

  // ----------------------------------------------
  // USER LOCATION (blue dot)
  // ----------------------------------------------
  useEffect(() => {
    if (!map) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        if (!userMarker) {
          const marker = L.marker([latitude, longitude], {
            icon: L.icon({
              iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149060.png",
              iconSize: [30, 30],
            }),
          }).addTo(map);

          marker.bindPopup("You");
          setUserMarker(marker);
        } else {
          userMarker.setLatLng([latitude, longitude]);
        }

        if (!trackingMode) {
          map.setView([latitude, longitude], 13);
        }
      },
      () => {},
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [map, trackingMode, userMarker]);

  // ----------------------------------------------
  // RENDER PROVIDERS (browse mode)
  // ----------------------------------------------
  useEffect(() => {
    if (!map || trackingMode) return;

    map.eachLayer((l) => {
      if (l instanceof L.Marker && l !== userMarker) map.removeLayer(l);
    });

    services.forEach((s) => {
      const marker = L.marker([s.latitude, s.longitude], {
        icon: L.icon({
          iconUrl:
            s.profile_pic ||
            "https://cdn-icons-png.flaticon.com/512/3177/3177440.png",
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        }),
      }).addTo(map);

      marker.bindPopup(`
        <div style="text-align:center;">
          <img src="${
            s.profile_pic ||
            "https://cdn-icons-png.flaticon.com/512/3177/3177440.png"
          }" style="width:60px;height:60px;border-radius:50%;border:2px solid green;">
          <h3>${s.business_name}</h3>
          <p>${s.category}</p>
          <p>${s.service_description}</p>
        </div>
      `);
    });
  }, [map, services, trackingMode, userMarker]);

  // ----------------------------------------------
  // TRACKING MODE → LOAD initial points + realtime updates
  // ----------------------------------------------
  useEffect(() => {
    if (!map || !bookingId) return;

    const load = async () => {
      const { data } = await supabase
        .from("booking_gps_points")
        .select("latitude, longitude, created_at")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      setTrackingPoints(data || []);
    };

    load();

    const channel = supabase
      .channel(`gps-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          table: "booking_gps_points",
          schema: "public",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          setTrackingPoints((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [bookingId, map]);

  // ----------------------------------------------
  // DRAW LINE + MOVE PROVIDER MARKER (Bolt style)
  // ----------------------------------------------
  useEffect(() => {
    if (!map || !bookingId || trackingPoints.length === 0) return;

    const latlngs = trackingPoints.map((p) => [p.latitude, p.longitude]) as [
      number,
      number
    ][];

    // polyline
    if (!trackingLine) {
      const line = L.polyline(latlngs, {
        color: "#ef4444", // red-500
        weight: 5,
        opacity: 0.85,
      }).addTo(map);
      setTrackingLine(line);
    } else {
      trackingLine.setLatLngs(latlngs);
    }

    // provider marker
    const latest = latlngs[latlngs.length - 1];

    if (!providerMarker) {
      const marker = L.marker(latest, {
        icon: L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854866.png",
          iconSize: [45, 45],
        }),
      }).addTo(map);

      marker.bindPopup("Provider");
      setProviderMarker(marker);
    } else {
      providerMarker.setLatLng(latest);
    }

    // auto-fit
    const bounds = L.latLngBounds(latlngs);
    if (userMarker) bounds.extend(userMarker.getLatLng());

    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, bookingId, trackingPoints]);

  // ----------------------------------------------
  // UI OVERLAY (Bolt style)
  // ----------------------------------------------
  return (
    <div className="relative h-[80vh] w-full rounded-xl overflow-hidden shadow-md bg-gray-100">
      {/* top chip */}
      <div className="absolute top-3 left-3 z-[5000] bg-white/90 px-4 py-2 rounded-full shadow text-sm text-gray-700">
        {trackingMode ? (
          hasPoints ? (
            <span>📍 Tracking provider… updating live</span>
          ) : (
            <span>Waiting for GPS updates…</span>
          )
        ) : (
          <span>Browse service providers around you</span>
        )}
      </div>

      {/* map container */}
      <div id="map" className="h-full w-full" />
    </div>
  );
};
