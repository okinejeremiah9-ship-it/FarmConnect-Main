import React from 'react';
import { ServiceFilters } from '../../types/marketplace';
import { Filter, Ruler, Star } from 'lucide-react';

interface ServiceFiltersProps {
  filters: ServiceFilters;
  onFiltersChange: (filters: ServiceFilters) => void;
}

export const ServiceFiltersComponent: React.FC<ServiceFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const handleFilterChange = (key: keyof ServiceFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Filter className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <button
          onClick={clearFilters}
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Service Category
          </label>
          <div className="space-y-2">
            {[
              { value: 'all', label: 'All Categories' },
              { value: 'machinery', label: 'Machinery Rental' },
              { value: 'mechanic', label: 'Equipment Repair' },
              { value: 'extension', label: 'Agricultural Advisory' },
              { value: 'labour', label: 'Farm Labour' },
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="category"
                  value={option.value}
                  checked={filters.category === option.value || (!filters.category && option.value === 'all')}
                  onChange={(e) => handleFilterChange('category', e.target.value === 'all' ? undefined : e.target.value)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Ruler className="w-4 h-4 inline mr-1" />
            Search Radius (km)
          </label>
          <select
            value={filters.radiusKm?.toString() || '50'}
            onChange={(e) => handleFilterChange('radiusKm', parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {[10, 25, 50, 100, 200].map((radius) => (
              <option key={radius} value={radius}>
                Within {radius} km
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Star className="w-4 h-4 inline mr-1" />
            Minimum Rating
          </label>
          <select
            value={filters.minRating?.toString() || '0'}
            onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="0">Any rating</option>
            <option value="3">3 stars & up</option>
            <option value="4">4 stars & up</option>
            <option value="4.5">4.5 stars & up</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Quick Filters
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange('category', 'machinery')}
              className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200 transition-colors"
            >
              Tractors
            </button>
            <button
              onClick={() => handleFilterChange('radiusKm', 25)}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
            >
              Within 25 km
            </button>
            <button
              onClick={() => handleFilterChange('minRating', 4.5)}
              className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm hover:bg-purple-200 transition-colors"
            >
              4.5★ & up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};