// src/components/marketplace/ServiceFilters.tsx
// FINAL OPTIMIZED VERSION — MATCHES PROVIDER PROFILE + EDGE FUNCTION EXACTLY

import React from "react";
import { ServiceFilters } from "../../types/marketplace";
import { Filter, Star, Ruler } from "lucide-react";

// 🔥 REAL categories from ProviderProfileForm (NO fictional ones)
export const PROVIDER_CATEGORIES = [
  "Tractor Operator",
  "Farm Equipment Rental",
  "Drivers",
  "Mechanic",
  "Transport & Logistics",
  "Irrigation Specialist",
  "Pesticide Spraying",
  "Soil Testing & Analysis",
  "Seed Supplier",
  "Fertilizer Supplier",
  "Storage & Warehousing",
  "Harvesting Services",
  "Ploughing & Land Preparation",
  "Drone Spraying Services",
  "Veterinary Services",
  "Agro Consultant",
];

interface Props {
  filters: ServiceFilters;
  onFiltersChange: (filters: ServiceFilters) => void;
}

export const ServiceFiltersComponent: React.FC<Props> = ({
  filters,
  onFiltersChange,
}) => {
  const update = (field: keyof ServiceFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      category: "all",
      radiusKm: 50,
      minRating: 0,
      sortBy: "distance",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Filter className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>

        <button
          onClick={clearFilters}
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          Reset
        </button>
      </div>

      <div className="space-y-6">
        {/* CATEGORY FILTER */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Category
          </label>

          <select
            value={filters.category || "all"}
            onChange={(e) => update("category", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
          >
            <option value="all">All Categories</option>
            {PROVIDER_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* RADIUS FILTER */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Ruler className="w-4 h-4 inline mr-1" />
            Search Radius ({filters.radiusKm ?? 50} km)
          </label>

          <select
            value={filters.radiusKm?.toString() || "50"}
            onChange={(e) => update("radiusKm", parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
          >
            {[10, 25, 50, 100, 200].map((km) => (
              <option key={km} value={km}>
                Within {km} km
              </option>
            ))}
          </select>
        </div>

        {/* RATING FILTER */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Star className="w-4 h-4 inline mr-1" />
            Minimum Rating
          </label>

          <select
            value={filters.minRating?.toString() || "0"}
            onChange={(e) => update("minRating", parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
          >
            <option value="0">Any rating</option>
            <option value="3">3★ & above</option>
            <option value="4">4★ & above</option>
            <option value="4.5">4.5★ & above</option>
          </select>
        </div>

        {/* SORT FILTER */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>

          <select
            value={filters.sortBy || "distance"}
            onChange={(e) => update("sortBy", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
          >
            <option value="distance">Nearest</option>
            <option value="rating">Highest Rating</option>
            <option value="price_low">Lowest Price</option>
            <option value="price_high">Highest Price</option>
          </select>
        </div>

        {/* QUICK FILTERS */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Quick Filters
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => update("category", "Tractor Operator")}
              className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200"
            >
              Tractor Operators
            </button>

            <button
              onClick={() => update("radiusKm", 25)}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200"
            >
              Within 25 km
            </button>

            <button
              onClick={() => update("minRating", 4.5)}
              className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm hover:bg-purple-200"
            >
              4.5★ & up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
