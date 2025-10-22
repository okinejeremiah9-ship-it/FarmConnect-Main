import React, { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { supabase } from "../../lib/supabaseClient"; // ✅ adjust path if your supabase file is elsewhere


export const ServiceMap: React.FC = () => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [userMarker, setUserMarker] = useState<L.Marker | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);

  // ✅ Initialize map once
  useEffect(() => {
    const existingMap = L.DomUtil.get("map");
    if (existingMap && (existingMap as any)._leaflet_id) {
      (existingMap as any)._leaflet_id = null;
    }

    const mapInstance = L.map("map").setView([7.9465, -1.0232], 7);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstance);

    setMap(mapInstance);
    return () => mapInstance.remove();
  }, []);

  // ✅ Fetch initial services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from("services")
          .select("id, provider_id, business_name, service_description, category, latitude, longitude, profile_pic, phone, email")
          .not("latitude", "is", null)
          .not("longitude", "is", null);

        if (error) throw error;
        setServices(data || []);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    fetchServices();
  }, []);

  // ✅ Real-time updates for service table
  useEffect(() => {
    const channel = supabase
      .channel("realtime-services")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "services" },
        (payload) => {
          console.log("Realtime update:", payload);

          if (payload.eventType === "INSERT") {
            setServices((prev) => [...prev, payload.new]);
          } else if (payload.eventType === "UPDATE") {
            setServices((prev) =>
              prev.map((s) => (s.id === payload.new.id ? payload.new : s))
            );
          } else if (payload.eventType === "DELETE") {
            setServices((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ✅ Track user's live location
  useEffect(() => {
    if (!map) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lon: longitude });

        if (userMarker) {
          userMarker.setLatLng([latitude, longitude]);
        } else {
          const marker = L.marker([latitude, longitude], {
            icon: L.icon({
              iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149060.png",
              iconSize: [35, 35],
            }),
          }).addTo(map);
          marker.bindPopup("<b>You are here</b>").openPopup();
          setUserMarker(marker);
        }

        map.setView([latitude, longitude], 13);
      },
      (err) => console.error("Error getting location:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [map, userMarker]);

  // ✅ Render provider markers
  useEffect(() => {
    if (!map || services.length === 0) return;

    // Clear old markers (except user marker)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer !== userMarker) {
        map.removeLayer(layer);
      }
    });

    services.forEach((s) => {
      if (s.latitude && s.longitude) {
        const icon = L.icon({
          iconUrl: s.profile_pic
            ? s.profile_pic
            : "https://cdn-icons-png.flaticon.com/512/3177/3177440.png",
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40],
        });

        const marker = L.marker([s.latitude, s.longitude], { icon }).addTo(map);

        marker.bindPopup(`
          <div style="text-align: center; font-family: sans-serif; width: 200px;">
            <img 
              src="${s.profile_pic || "https://cdn-icons-png.flaticon.com/512/3177/3177440.png"}" 
              alt="${s.business_name}" 
              style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #16a34a;"
            />
            <h3 style="font-weight: bold; color: #16a34a; margin-top: 5px;">
              ${s.business_name || "Unnamed Service"}
            </h3>
            <p style="font-size: 12px; color: #555; margin: 4px 0;">
              ${s.category || "General Service"}
            </p>
            <p style="font-size: 12px; color: #333;">
              ${s.service_description ? s.service_description.substring(0, 60) + "..." : ""}
            </p>
            <hr style="margin: 6px 0; border-color: #ddd;" />
            <p style="font-size: 12px; color: #222;">📞 ${s.phone || "N/A"}</p>
            <p style="font-size: 12px; color: #222;">✉️ ${s.email || "N/A"}</p>
            <a href="/provider/${s.provider_id}" 
              style="display: inline-block; margin-top: 8px; background: #16a34a; color: white; padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 12px;">
              View Profile
            </a>
          </div>
        `);
      }
    });
  }, [map, services, userMarker]);

  return (
    <div style={{ height: "80vh", width: "100%", borderRadius: "10px" }}>
      <div id="map" style={{ height: "100%", width: "100%" }}></div>
    </div>
  );
};
