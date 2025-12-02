// Location: src/components/services/CreateServiceModal.tsx

import React, { useEffect, useState } from "react";
import { X, Loader, Crosshair } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface CreateServiceModalProps {
  providerId: string;
  onClose: () => void;
  onCreated: () => void;
}

const PRICE_UNIT_OPTIONS = ["hour", "day", "session", "fixed"];

const CreateServiceModal: React.FC<CreateServiceModalProps> = ({
  providerId,
  onClose,
  onCreated,
}) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    price: "",
    price_unit: "day",
    location: "",
    district: "",
    latitude: "",
    longitude: "",
    specializations: [] as string[],
  });

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  // -----------------------------------------------------
  // LOAD SERVICE CATEGORIES FROM DB
  // -----------------------------------------------------
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("name");

      if (!error && data) {
        setCategories(data.map((c: any) => c.name));
      } else {
        console.error("Failed to load categories:", error);
      }

      setLoadingCategories(false);
    })();
  }, []);

  // -----------------------------------------------------
  // CAPTURE GPS LOCATION
  // -----------------------------------------------------
  const captureLocation = () => {
    setLocating(true);

    if (!navigator.geolocation) {
      alert("Your device does not support GPS.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }));
        setLocating(false);
      },
      (err) => {
        alert("Failed to get GPS location. Please enable location services.");
        console.error(err);
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // -----------------------------------------------------
  // SUBMIT NEW SERVICE
  // -----------------------------------------------------
  const handleSubmit = async () => {
    if (!form.title || !form.category || !form.price) {
      alert("Please fill all required fields.");
      return;
    }

    setLoading(true);

    try {
      // 🔐 Verify logged-in user
      const { data: authData } = await supabase.auth.getUser();
      const authId = authData?.user?.id;

      console.log("🔐 auth.uid:", authId);
      console.log("🔐 providerId prop:", providerId);

      if (!authId) {
        alert("You are not logged in.");
        setLoading(false);
        return;
      }

      // RLS requirement
      if (authId !== providerId) {
        alert(
          "Your account does not match the provider profile. Please log in with the correct provider account."
        );
        setLoading(false);
        return;
      }

      // INSERT
      const { error } = await supabase.from("services").insert({
        provider_id: providerId,
        title: form.title,
        category: form.category,
        description: form.description,
        price: parseFloat(form.price),
        price_unit: form.price_unit,
        availability: "available",
        location: form.location,
        district: form.district,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        specializations: form.specializations,
      });

      if (error) {
        console.error("INSERT error:", error);
        alert(error.message);
        return;
      }

      onCreated();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------
  // UI
  // -----------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in">

        {/* HEADER */}
        <div className="sticky top-0 bg-green-600 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-semibold">Create New Service</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}
        <div className="p-6 space-y-6">

          {/* Title */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Service Title *</label>
            <input
              type="text"
              className="w-full border p-3 rounded-lg mt-1 focus:ring-2 focus:ring-green-500"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Tractor Ploughing"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Service Category *</label>
            <select
              className="w-full border p-3 rounded-lg mt-1 focus:ring-2 focus:ring-green-500"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">
                {loadingCategories ? "Loading categories..." : "Select category"}
              </option>

              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Description</label>
            <textarea
              rows={3}
              className="w-full border p-3 rounded-lg mt-1 focus:ring-2 focus:ring-green-500"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what your service offers..."
            />
          </div>

          {/* Price section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Price (GHS) *</label>
              <input
                type="number"
                className="w-full border p-3 rounded-lg mt-1 focus:ring-2 focus:ring-green-500"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Price Unit</label>
              <select
                className="w-full border p-3 rounded-lg mt-1 focus:ring-2 focus:ring-green-500"
                value={form.price_unit}
                onChange={(e) => setForm({ ...form, price_unit: e.target.value })}
              >
                {PRICE_UNIT_OPTIONS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Location</label>
              <input
                type="text"
                className="w-full border p-3 rounded-lg mt-1"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">District</label>
              <input
                type="text"
                className="w-full border p-3 rounded-lg mt-1"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
              />
            </div>
          </div>

          {/* GPS Capture */}
          <div>
            <label className="text-sm font-semibold text-gray-700">GPS Coordinates</label>

            <button
              onClick={captureLocation}
              disabled={locating}
              className="mt-2 flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Crosshair className="w-4 h-4 mr-2" />
              {locating ? "Capturing..." : "Use Current Location"}
            </button>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <input
                type="text"
                placeholder="Latitude"
                className="w-full border p-3 rounded-lg bg-gray-100"
                value={form.latitude}
                disabled
              />

              <input
                type="text"
                placeholder="Longitude"
                className="w-full border p-3 rounded-lg bg-gray-100"
                value={form.longitude}
                disabled
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 flex justify-center"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Saving…
              </>
            ) : (
              "Create Service"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateServiceModal;
