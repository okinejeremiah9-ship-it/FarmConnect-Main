// Location: src/components/tracking/MapView.tsx
// Purpose: Interactive map component with live tracking (real-time driver path and smooth animation)

import React, { useRef, useEffect, useState } from "react";
import { Navigation } from "lucide-react";

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  recorded_at: string;
}

interface MapViewProps {
  location: Location | null;
  locations: Location[];
  driverName?: string;
}

const MapView: React.FC<MapViewProps> = ({ location, locations, driverName }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const markerRef = useRef<any>(null);
  const pathRef = useRef<any>(null);

  // ✅ Dynamically load Leaflet assets once
  useEffect(() => {
    if (mapLoaded) return;

    const existingScript = document.querySelector("script[src*='leaflet']");
    if (existingScript) {
      setMapLoaded(true);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup only if dynamically added by this component
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, [mapLoaded]);

  // ✅ Initialize map
  useEffect(() => {
    if (!mapLoaded || !location || mapInstance) return;
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([location.latitude, location.longitude], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // Custom animated driver icon
    const driverIcon = L.divIcon({
      className: "driver-marker",
      html: `
        <div style="
          background: linear-gradient(135deg, #10b981, #3b82f6);
          width: 45px; height: 45px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(16,185,129,0.5);
          border: 3px solid white; animation: pulse 2s infinite;
        ">
          <svg width="24" height="24" fill="none" stroke="white" stroke-width="2.5" viewBox="0 0 24 24">
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <style>
          @keyframes pulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.05);} }
        </style>
      `,
      iconSize: [45, 45],
      iconAnchor: [22.5, 45],
      popupAnchor: [0, -45],
    });

    const marker = L.marker([location.latitude, location.longitude], { icon: driverIcon }).addTo(map);
    marker.bindPopup(`<b>${driverName || "Driver"}</b><br>Tracking active...`).openPopup();

    markerRef.current = marker;
    setMapInstance(map);
  }, [mapLoaded, location, mapInstance, driverName]);

  // ✅ Update driver position
  useEffect(() => {
    if (!mapInstance || !location || !markerRef.current) return;

    const L = (window as any).L;
    const newLatLng = L.latLng(location.latitude, location.longitude);
    markerRef.current.setLatLng(newLatLng);
    mapInstance.panTo(newLatLng, { animate: true, duration: 1 });

    markerRef.current.bindPopup(`
      <div style="font-family: system-ui; padding: 10px; min-width: 180px;">
        <strong style="color: #059669;">${driverName || "Driver"}</strong><br />
        <small>Last Update: ${new Date(location.recorded_at).toLocaleTimeString()}</small><br />
        <small>Accuracy: ±${Math.round(location.accuracy)}m</small>
      </div>
    `);
  }, [location, mapInstance, driverName]);

  // ✅ Draw path history
  useEffect(() => {
    if (!mapInstance || locations.length < 2) return;
    const L = (window as any).L;

    if (pathRef.current) {
      mapInstance.removeLayer(pathRef.current);
    }

    const coords = locations.map((loc) => [loc.latitude, loc.longitude]);
    const polyline = L.polyline(coords, {
      color: "#10b981",
      weight: 4,
      opacity: 0.8,
      smoothFactor: 1,
    }).addTo(mapInstance);

    pathRef.current = polyline;
    mapInstance.fitBounds(polyline.getBounds(), { padding: [30, 30] });
  }, [locations, mapInstance]);

  // ✅ Render
  if (!location) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <Navigation className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50 animate-pulse" />
          <p className="text-gray-600 font-medium">Waiting for driver location...</p>
          <p className="text-sm text-gray-500 mt-2">Map will appear once tracking starts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative rounded-xl overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading map...</p>
          </div>
        </div>
      )}

      {/* Status Overlay */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md border border-green-200 px-3 py-2 z-[1000]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-gray-700">Live Tracking</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
