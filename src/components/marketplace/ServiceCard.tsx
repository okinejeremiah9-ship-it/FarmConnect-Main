import React from 'react';
import { ServiceListing } from '../../types/marketplace';
import { UserReviews } from '../reviews/UserReviews';
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  Tractor, 
  Wrench, 
  Users, 
  BookOpen,
  Eye,
  Calendar,
  MessageSquare
} from 'lucide-react';

interface ServiceCardProps {
  service: ServiceListing;
  onViewDetails: (service: ServiceListing) => void;
  onBookService: (service: ServiceListing) => void;
  onMessageProvider: (service: ServiceListing) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onViewDetails,
  onBookService,
  onMessageProvider,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'machinery':
        return <Tractor className="w-5 h-5 text-green-600" />;
      case 'mechanic':
        return <Wrench className="w-5 h-5 text-blue-600" />;
      case 'extension':
        return <BookOpen className="w-5 h-5 text-purple-600" />;
      case 'labour':
        return <Users className="w-5 h-5 text-orange-600" />;
      default:
        return <Tractor className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'machinery':
        return 'bg-green-100 text-green-800';
      case 'mechanic':
        return 'bg-blue-100 text-blue-800';
      case 'extension':
        return 'bg-purple-100 text-purple-800';
      case 'labour':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200">
      {/* Service Image */}
      <div className="h-48 bg-gradient-to-br from-green-100 to-blue-100 rounded-t-xl flex items-center justify-center">
        {service.images && service.images.length > 0 ? (
          <img
            src={service.images[0]}
            alt={service.title}
            className="w-full h-full object-cover rounded-t-xl"
          />
        ) : (
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
            {getCategoryIcon(service.category)}
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(service.category)}`}>
                {service.category.charAt(0).toUpperCase() + service.category.slice(1)}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(service.availability)}`}>
                {service.availability.charAt(0).toUpperCase() + service.availability.slice(1)}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{service.title}</h3>
            <p className="text-sm text-gray-600">{service.providerName}</p>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm font-medium text-gray-900">{service.providerRating}</span>
          </div>
          <span className="ml-2 text-sm text-gray-500">(24 reviews)</span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{service.location}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="w-4 h-4 mr-2" />
            <span>₵{service.price}/{service.priceUnit}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Next available: {new Date(service.availableDates[0]).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Equipment/Specializations */}
        {(service.equipment || service.specializations) && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {(service.equipment || service.specializations)?.slice(0, 2).map((item, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {item}
                </span>
              ))}
              {(service.equipment || service.specializations)!.length > 2 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  +{(service.equipment || service.specializations)!.length - 2} more
                </span>
              )}
              <span className="ml-2 text-sm text-gray-500">
                ({Math.floor(Math.random() * 50) + 5} reviews)
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(service)}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <Eye className="w-4 h-4 mr-1" />
            Details
          </button>
          <button
            onClick={() => onMessageProvider(service)}
            className="bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Message
          </button>
          <button
            onClick={() => onBookService(service)}
            disabled={service.availability !== 'available'}
            className="bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Calendar className="w-4 h-4 mr-1" />
            Book
          </button>
        </div>
      </div>
    </div>
  );
};