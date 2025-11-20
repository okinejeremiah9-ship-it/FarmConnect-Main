// Location: src/components/marketplace/ServiceFilters.tsx

import React from "react";
import { ServiceFilters } from "../../types/marketplace";

// Centralised categories (should match ProviderProfileForm)
const SERVICE_CATEGORIES = [
  "Tractor Operator",
  "Mechanic",
  "Transport & Logistics",
  "Irrigation Specialist",
  "Pesticide Spraying",
  "Soil Testing & Analysis",
  "Farm Equipment Rental",
  "Seed Supplier",
  "Fertilizer Supplier",
  "Storage & Warehousing",
  "Harvesting Services",
  "Ploughing & Land Preparation",
  "Drone Spraying Services",
  "Veterinary Services",
  "Agro Consultant",
  "Drivers",
];

interface Props {
  filters: ServiceFilters;
  onFiltersChange: (next: ServiceFilters) => void;
}

export const ServiceFiltersComponent: React.FC<Props> = ({
  filters,
  onFiltersChange,
}) => {
  const toggleCategory = (category: string) => {
    const exists = filters.categories.includes(category);
    const nextCategories = exists
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];

    onFiltersChange({ ...filters, categories: nextCategories });
  };

  const handleRadiusChange = (value: string) => {
    const n = Number(value);
    if (Number.isNaN(n)) return;
    onFiltersChange({ ...filters, radiusKm: n });
  };

  const handleMinRatingChange = (value: string) => {
    const n = Number(value);
    onFiltersChange({ ...filters, minRating: n || 0 });
  };

  const handleMinPriceChange = (value: string) => {
    const n = Number(value);
    onFiltersChange({
      ...filters,
      minPrice: Number.isNaN(n) || !value ? undefined : n,
    });
  };

  const handleMaxPriceChange = (value: string) => {
    const n = Number(value);
    onFiltersChange({
      ...filters,
      maxPrice: Number.isNaN(n) || !value ? undefined : n,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 mt-4">
      {/* Top row: radius + rating + price */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Radius */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Search Radius (km)
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min={5}
              max={200}
              step={5}
              value={filters.radiusKm}
              onChange={(e) => handleRadiusChange(e.target.value)}
              className="flex-1"
            />
            <span className="text-sm font-medium text-gray-800 w-12 text-right">
              {filters.radiusKm}
            </span>
          </div>
        </div>

        {/* Min rating */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Minimum Rating
          </label>
          <select
            value={filters.minRating ?? 0}
            onChange={(e) => handleMinRatingChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value={0}>Any rating</option>
            <option value={3}>3.0 ★ and above</option>
            <option value={4}>4.0 ★ and above</option>
            <option value={4.5}>4.5 ★ and above</option>
          </select>
        </div>

        {/* Price range */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Price Range (GH₵)
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              min={0}
              value={filters.minPrice ?? ""}
              onChange={(e) => handleMinPriceChange(e.target.value)}
              placeholder="Min"
              className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <input
              type="number"
              min={0}
              value={filters.maxPrice ?? ""}
              onChange={(e) => handleMaxPriceChange(e.target.value)}
              placeholder="Max"
              className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
      </div>

      {/* Categories chips */}
      <div className="mt-5">
        <p className="text-xs font-semibold text-gray-600 mb-2">
          Service Categories
        </p>
        <div className="flex flex-wrap gap-2">
          {SERVICE_CATEGORIES.map((category) => {
            const active = filters.categories.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs md:text-sm border transition ${
                  active
                    ? "bg-green-600 text-white border-green-600 shadow-sm"
                    : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
