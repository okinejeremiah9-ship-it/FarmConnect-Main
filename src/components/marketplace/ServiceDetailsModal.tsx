import React from 'react';
import { ServiceListing } from '../../types/marketplace';
import {
  X,
  Star,
  MapPin,
  DollarSign,
  Calendar,
  Tractor,
  Wrench,
  Users,
  BookOpen,
  Phone,
  Mail,
  MessageSquare,
  Ruler
} from 'lucide-react';

interface ServiceDetailsModalProps {
  service: ServiceListing;
  onClose: () => void;
  onBookService: () => void;
  onMessageProvider: () => void;
}

export const ServiceDetailsModal: React.FC<ServiceDetailsModalProps> = ({
  service,
  onClose,
  onBookService,
  onMessageProvider,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'machinery':
        return <Tractor className="w-6 h-6 text-green-600" />;
      case 'mechanic':
        return <Wrench className="w-6 h-6 text-blue-600" />;
      case 'extension':
        return <BookOpen className="w-6 h-6 text-purple-600" />;
      case 'labour':
        return <Users className="w-6 h-6 text-orange-600" />;
      default:
        return <Tractor className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {service.category ? getCategoryIcon(service.category) : <Tractor className="w-6 h-6 text-gray-600" />}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{service.title}</h2>
              <p className="text-gray-600">{service.providerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div>
              {/* Service Image */}
              <div className="h-64 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg mb-6 flex items-center justify-center">
                {service.images && service.images.length > 0 ? (
                  <img
                    src={service.images[0]}
                    alt={service.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                    {service.category ? getCategoryIcon(service.category) : <Tractor className="w-10 h-10 text-gray-500" />}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">{service.description || 'No detailed description provided yet.'}</p>
              </div>

              {/* Specializations */}
              {service.specializations && service.specializations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {service.specializations.map((item, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div>
              {/* Provider Info */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Provider Information</h3>

                <div className="space-y-3">
                  {(service.providerRating || service.providerRating === 0) && (
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-400 fill-current mr-2" />
                      <span className="font-medium text-gray-900">{service.providerRating?.toFixed(1)}</span>
                    </div>
                  )}

                  {service.distanceKm !== undefined && service.distanceKm !== null && (
                    <div className="flex items-center text-gray-700">
                      <Ruler className="w-5 h-5 mr-2" />
                      <span>{service.distanceKm.toFixed(1)} km away</span>
                    </div>
                  )}

                  {service.location && (
                    <div className="flex items-center text-gray-700">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span>{service.location}</span>
                    </div>
                  )}

                  {service.phone && (
                    <div className="flex items-center text-gray-700">
                      <Phone className="w-5 h-5 mr-2" />
                      <span>{service.phone}</span>
                    </div>
                  )}

                  {service.email && (
                    <div className="flex items-center text-gray-700">
                      <Mail className="w-5 h-5 mr-2" />
                      <span>{service.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-green-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
                <div className="flex items-center">
                  <DollarSign className="w-6 h-6 text-green-600 mr-2" />
                  {service.price ? (
                    <span className="text-3xl font-bold text-green-600">₵{service.price}</span>
                  ) : (
                    <span className="text-lg text-gray-700">{service.pricingInfo || 'Contact provider for pricing details'}</span>
                  )}
                  {service.price && (
                    <span className="text-gray-600 ml-2">per {service.priceUnit ?? 'session'}</span>
                  )}
                </div>
              </div>

              {service.availableDates && service.availableDates.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-gray-700">
                        Next available: {new Date(service.availableDates[0]).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={onBookService}
                  disabled={service.price === null || service.price === undefined}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book This Service
                </button>
                
                <button
                  onClick={onMessageProvider}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Message Provider
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};