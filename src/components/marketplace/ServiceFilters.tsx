import React from 'react';
import { ServiceFilters } from '../../types/marketplace';
import { MapPin, Filter, DollarSign } from 'lucide-react';

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

  const districts = [
    'Accra', 'Kumasi', 'Tamale', 'Sunyani', 'Bolgatanga', 'Ho', 'Koforidua',
    'Cape Coast', 'Sekondi-Takoradi', 'Wa', 'Dambai', 'Goaso'
  ];

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
        {/* Category Filter */}
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

        {/* Location Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <MapPin className="w-4 h-4 inline mr-1" />
            Location
          </label>
          <select
            value={filters.district || ''}
            onChange={(e) => handleFilterChange('district', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Districts</option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>

        {/* Availability Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Availability
          </label>
          <div className="space-y-2">
            {[
              { value: 'all', label: 'Any Time' },
              { value: 'available', label: 'Available Now' },
              { value: 'today', label: 'Available Today' },
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="availability"
                  value={option.value}
                  checked={filters.availability === option.value || (!filters.availability && option.value === 'all')}
                  onChange={(e) => handleFilterChange('availability', e.target.value === 'all' ? undefined : e.target.value)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Price Range (₵)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceRange?.min || ''}
              onChange={(e) => handleFilterChange('priceRange', {
                ...filters.priceRange,
                min: e.target.value ? parseInt(e.target.value) : undefined
              })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.priceRange?.max || ''}
              onChange={(e) => handleFilterChange('priceRange', {
                ...filters.priceRange,
                max: e.target.value ? parseInt(e.target.value) : undefined
              })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Quick Filters */}
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
              onClick={() => handleFilterChange('availability', 'today')}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => handleFilterChange('category', 'extension')}
              className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm hover:bg-purple-200 transition-colors"
            >
              Advisory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};