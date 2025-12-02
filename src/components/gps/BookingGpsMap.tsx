// src/components/gps/BookingGpsMap.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { MapPin } from "lucide-react";

// If you already use a map library, you can replace this with that.
// For now we just show a simple list + optional static map placeholder.

interface GpsPoint {
  id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
}

interface BookingGpsMapProps {
  bookingId: string;
}

/**
 * Very simple viewer: lists GPS points.
 * You can later upgrade to Leaflet / Google Maps polyline.
 */
export const BookingGpsMap: React.FC<BookingGpsMapProps> = ({ bookingId }) => {
  const [points, setPoints] = useState<GpsPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("booking_gps_points")
        .select("id, latitude, longitude, recorded_at")
        .eq("booking_id", bookingId)
        .order("recorded_at", { ascending: true });

      if (error) {
        console.error("❌ Failed to load GPS points:", error);
      } else {
        setPoints(data || []);
      }
      setLoading(false);
    };

    load();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="text-sm text-gray-600">
        Loading tracking data…
      </div>
    );
  }

  if (!points.length) {
    return (
      <div className="text-sm text-gray-500">
        No tracking data available for this booking.
      </div>
    );
  }

  const first = points[0];
  const last = points[points.length - 1];

  return (
    <div className="mt-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="flex items-center mb-2">
        <MapPin className="w-4 h-4 text-green-600 mr-2" />
        <p className="text-sm font-semibold text-gray-800">
          GPS tracking summary
        </p>
      </div>

      <p className="text-xs text-gray-600 mb-2">
        Points recorded: <span className="font-semibold">{points.length}</span>
      </p>
      <p className="text-xs text-gray-600 mb-2">
        Started:{" "}
        <span className="font-mono">
          {new Date(first.recorded_at).toLocaleString()}
        </span>
        <br />
        Last point:{" "}
        <span className="font-mono">
          {new Date(last.recorded_at).toLocaleString()}
        </span>
      </p>

      <details className="mt-2">
        <summary className="text-xs text-blue-600 cursor-pointer">
          Show raw coordinates
        </summary>
        <div className="mt-2 max-h-40 overflow-y-auto text-xs font-mono bg-white rounded p-2 border">
          {points.map((p) => (
            <div key={p.id} className="mb-1">
              {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)} —{" "}
              {new Date(p.recorded_at).toLocaleTimeString()}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};
