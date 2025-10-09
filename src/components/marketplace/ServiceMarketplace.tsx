import React, { useState, useEffect } from 'react';
import { ServiceListing, ServiceFilters } from '../../types/marketplace';
import { ServiceCard } from './ServiceCard';
import { ServiceFiltersComponent } from './ServiceFilters';
import { ServiceDetailsModal } from './ServiceDetailsModal';
import { BookingModal } from './BookingModal';
import { ChatModal } from './ChatModal';
import { Search, MapPin, Filter } from 'lucide-react';

export const ServiceMarketplace: React.FC = () => {
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceListing[]>([]);
  const [filters, setFilters] = useState<ServiceFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for services
    const mockServices: ServiceListing[] = [
      {
        id: 'service-1',
        providerId: '550e8400-e29b-41d4-a716-446655440001',
        providerName: 'AgriEquip Services',
        providerRating: 4.8,
        category: 'machinery',
        title: 'John Deere Tractor Rental',
        description: 'Modern 75HP tractor perfect for land preparation, plowing, and cultivation. Well-maintained with GPS tracking.',
        price: 150,
        priceUnit: 'day',
        location: 'Kumasi, Ashanti Region',
        district: 'Kumasi',
        coordinates: { lat: 6.6885, lng: -1.6244 },
        availability: 'available',
        availableDates: ['2025-01-15', '2025-01-16', '2025-01-17'],
        equipment: ['John Deere 5075E', 'Plow attachment', 'Cultivator'],
        images: ['https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg'],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-10T00:00:00Z',
      },
      {
        id: 'service-2',
        providerId: '550e8400-e29b-41d4-a716-446655440002',
        providerName: 'Farm Tech Solutions',
        providerRating: 4.6,
        category: 'mechanic',
        title: 'Equipment Repair & Maintenance',
        description: 'Professional repair services for all farm equipment. 15+ years experience with tractors, pumps, and irrigation systems.',
        price: 80,
        priceUnit: 'hour',
        location: 'Accra, Greater Accra',
        district: 'Accra',
        coordinates: { lat: 5.6037, lng: -0.1870 },
        availability: 'available',
        availableDates: ['2025-01-12', '2025-01-13', '2025-01-14'],
        specializations: ['Tractor repair', 'Pump maintenance', 'Irrigation systems'],
        createdAt: '2025-01-02T00:00:00Z',
        updatedAt: '2025-01-09T00:00:00Z',
      },
      {
        id: 'service-3',
        providerId: '550e8400-e29b-41d4-a716-446655440003',
        providerName: 'Dr. Kwame Asante',
        providerRating: 4.9,
        category: 'extension',
        title: 'Crop Advisory & Soil Testing',
        description: 'Agricultural extension services including crop planning, soil analysis, pest management, and yield optimization strategies.',
        price: 200,
        priceUnit: 'session',
        location: 'Tamale, Northern Region',
        district: 'Tamale',
        coordinates: { lat: 9.4034, lng: -0.8424 },
        availability: 'available',
        availableDates: ['2025-01-18', '2025-01-19', '2025-01-20'],
        specializations: ['Soil testing', 'Crop planning', 'Pest management', 'Organic farming'],
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-08T00:00:00Z',
      },
      {
        id: 'service-4',
        providerId: '550e8400-e29b-41d4-a716-446655440004',
        providerName: 'Northern Labour Cooperative',
        providerRating: 4.4,
        category: 'labour',
        title: 'Seasonal Farm Workers',
        description: 'Experienced farm workers available for planting, weeding, harvesting, and general farm maintenance. Teams of 5-20 workers.',
        price: 25,
        priceUnit: 'hour',
        location: 'Bolgatanga, Upper East',
        district: 'Bolgatanga',
        coordinates: { lat: 10.7856, lng: -0.8514 },
        availability: 'available',
        availableDates: ['2025-01-21', '2025-01-22', '2025-01-23'],
        specializations: ['Planting', 'Weeding', 'Harvesting', 'Land clearing'],
        createdAt: '2025-01-04T00:00:00Z',
        updatedAt: '2025-01-07T00:00:00Z',
      },
      {
        id: 'service-5',
        providerId: '550e8400-e29b-41d4-a716-446655440005',
        providerName: 'Harvest Masters',
        providerRating: 4.7,
        category: 'machinery',
        title: 'Combine Harvester Service',
        description: 'Modern combine harvester for efficient grain harvesting. Suitable for maize, rice, and other cereals.',
        price: 300,
        priceUnit: 'day',
        location: 'Sunyani, Brong Ahafo',
        district: 'Sunyani',
        coordinates: { lat: 7.3392, lng: -2.3265 },
        availability: 'busy',
        availableDates: ['2025-01-25', '2025-01-26'],
        equipment: ['Case IH Axial-Flow', 'Grain cart', 'Header attachments'],
        createdAt: '2025-01-05T00:00:00Z',
        updatedAt: '2025-01-06T00:00:00Z',
      },
    ];

    setServices(mockServices);
    setFilteredServices(mockServices);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = [...services];

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(service => service.category === filters.category);
    }

    // Apply location filter
    if (filters.district) {
      filtered = filtered.filter(service => 
        service.district.toLowerCase().includes(filters.district!.toLowerCase())
      );
    }

    // Apply availability filter
    if (filters.availability && filters.availability !== 'all') {
      if (filters.availability === 'available') {
        filtered = filtered.filter(service => service.availability === 'available');
      } else if (filters.availability === 'today') {
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(service => 
          service.availability === 'available' && 
          service.availableDates.includes(today)
        );
      }
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(service =>
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.equipment && service.equipment.some(eq => 
          eq.toLowerCase().includes(searchQuery.toLowerCase())
        )) ||
        (service.specializations && service.specializations.some(spec => 
          spec.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
    }

    setFilteredServices(filtered);
  }, [services, filters, searchQuery]);

  const handleViewDetails = (service: ServiceListing) => {
    setSelectedService(service);
    setShowDetailsModal(true);
  };

  const handleBookService = (service: ServiceListing) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleMessageProvider = (service: ServiceListing) => {
    setSelectedService(service);
    setShowChatModal(true);
  };

  const handleFiltersChange = (newFilters: ServiceFilters) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Service Marketplace</h1>
              <p className="text-gray-600">Find trusted agricultural services near you</p>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Search for tractors, repairs, advisory..."
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <ServiceFiltersComponent
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>

          {/* Services Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
              </p>
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option>Sort by: Relevance</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Rating: High to Low</option>
                <option>Distance: Nearest</option>
              </select>
            </div>

            {filteredServices.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
                <p className="text-gray-600">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onViewDetails={handleViewDetails}
                    onBookService={handleBookService}
                    onMessageProvider={handleMessageProvider}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDetailsModal && selectedService && (
        <ServiceDetailsModal
          service={selectedService}
          onClose={() => setShowDetailsModal(false)}
          onBookService={() => {
            setShowDetailsModal(false);
            setShowBookingModal(true);
          }}
          onMessageProvider={() => {
            setShowDetailsModal(false);
            setShowChatModal(true);
          }}
        />
      )}

      {showBookingModal && selectedService && (
        <BookingModal
          service={selectedService}
          onClose={() => setShowBookingModal(false)}
          onBookingComplete={() => {
            setShowBookingModal(false);
            // Handle booking completion
          }}
        />
      )}

      {showChatModal && selectedService && (
        <ChatModal
          service={selectedService}
          onClose={() => setShowChatModal(false)}
        />
      )}
    </div>
  );
};