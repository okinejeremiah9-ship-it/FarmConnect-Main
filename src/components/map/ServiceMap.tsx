// ----------------------------------------------
// ServiceMap.tsx — FULL FILE (RESUME-SAFE, VERIFIED)
// ----------------------------------------------
import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { supabase } from "../../lib/supabase";

interface ServiceMapProps {
  bookingId?: string;
}

type TrackingPoint = {
  latitude: number;
  longitude: number;
  created_at: string;
};

export const ServiceMap: React.FC<ServiceMapProps> = ({ bookingId }) => {
  // -----------------------------
  // MAP CORE
  // -----------------------------
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const providerMarkerRef = useRef<L.Marker | null>(null);
  const trackingLineRef = useRef<L.Polyline | null>(null);

  // -----------------------------
  // STATE
  // -----------------------------
  const [services, setServices] = useState<any[]>([]);
  const [trackingPoints, setTrackingPoints] = useState<TrackingPoint[]>([]);

  const trackingMode = Boolean(bookingId);
  const hasPoints = trackingPoints.length > 0;

  // ----------------------------------------------
  // INIT MAP (ONCE)
  // ----------------------------------------------
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("map", {
      zoomControl: true,
      attributionControl: true,
    }).setView([7.9465, -1.0232], 7);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        "&copy; OpenStreetMap contributors | HOT humanitarian tiles",
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ----------------------------------------------
  // USER LOCATION (BLUE DOT)
  // ----------------------------------------------
  useEffect(() => {
    if (!mapRef.current) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        if (!userMarkerRef.current) {
          userMarkerRef.current = L.marker([latitude, longitude], {
            icon: L.icon({
              iconUrl:
                "https://cdn-icons-png.flaticon.com/512/149/149060.png",
              iconSize: [30, 30],
            }),
          })
            .addTo(mapRef.current!)
            .bindPopup("You");
        } else {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        }

        if (!trackingMode) {
          mapRef.current!.setView([latitude, longitude], 13);
        }
      },
      () => {},
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [trackingMode]);

  // ----------------------------------------------
  // LOAD PROVIDERS (BROWSE MODE)
  // ----------------------------------------------
  useEffect(() => {
    if (!mapRef.current || trackingMode) return;

    const loadProviders = async () => {
      const { data } = await supabase
        .from("services")
        .select(
          `
          id,
          provider_id,
          business_name,
          service_description,
          category,
          latitude,
          longitude,
          profile_pic
        `
        )
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (data) setServices(data);
    };

    loadProviders();
  }, [trackingMode]);

  // ----------------------------------------------
  // RENDER PROVIDERS
  // ----------------------------------------------
  useEffect(() => {
    if (!mapRef.current || trackingMode) return;

    services.forEach((s) => {
      L.marker([s.latitude, s.longitude], {
        icon: L.icon({
          iconUrl:
            s.profile_pic ||
            "https://cdn-icons-png.flaticon.com/512/3177/3177440.png",
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        }),
      })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div style="text-align:center;">
            <img src="${
              s.profile_pic ||
              "https://cdn-icons-png.flaticon.com/512/3177/3177440.png"
            }"
              style="width:60px;height:60px;border-radius:50%;border:2px solid green;">
            <h3>${s.business_name}</h3>
            <p>${s.category}</p>
            <p>${s.service_description}</p>
          </div>
        `);
    });
  }, [services, trackingMode]);

  // ----------------------------------------------
  // LOAD + RESUME TRACKING (SAFE)
  // ----------------------------------------------
  useEffect(() => {
    if (!mapRef.current || !bookingId) return;

    let channel: any;

    const loadTracking = async () => {
      const { data } = await supabase
        .from("booking_gps_points")
        .select("latitude, longitude, created_at")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      setTrackingPoints(data || []);
    };

    loadTracking();

    channel = supabase
      .channel(`gps-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "booking_gps_points",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          setTrackingPoints((prev) => {
            const exists = prev.some(
              (p) => p.created_at === payload.new.created_at
            );
            if (exists) return prev;
            return [...prev, payload.new as TrackingPoint];
          });
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [bookingId]);

  // ----------------------------------------------
  // DRAW TRACKING PATH + PROVIDER
  // ----------------------------------------------
  useEffect(() => {
    if (!mapRef.current || trackingPoints.length === 0) return;

    const latlngs = trackingPoints.map((p) => [
      p.latitude,
      p.longitude,
    ]) as [number, number][];

    if (!trackingLineRef.current) {
      trackingLineRef.current = L.polyline(latlngs, {
        color: "#ef4444",
        weight: 5,
        opacity: 0.85,
      }).addTo(mapRef.current);
    } else {
      trackingLineRef.current.setLatLngs(latlngs);
    }

    const latest = latlngs[latlngs.length - 1];

    if (!providerMarkerRef.current) {
      providerMarkerRef.current = L.marker(latest, {
        icon: L.icon({
          iconUrl:
            "https://cdn-icons-png.flaticon.com/512/854/854866.png",
          iconSize: [45, 45],
        }),
      })
        .addTo(mapRef.current)
        .bindPopup("Provider");
    } else {
      providerMarkerRef.current.setLatLng(latest);
    }

    const bounds = L.latLngBounds(latlngs);
    if (userMarkerRef.current)
      bounds.extend(userMarkerRef.current.getLatLng());

    mapRef.current.fitBounds(bounds, { padding: [30, 30] });
  }, [trackingPoints]);

  // ----------------------------------------------
  // UI
  // ----------------------------------------------
  return (
    <div className="relative h-[80vh] w-full rounded-xl overflow-hidden shadow-md bg-gray-100">
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

      <div id="map" className="h-full w-full" />
    </div>
  );
};
