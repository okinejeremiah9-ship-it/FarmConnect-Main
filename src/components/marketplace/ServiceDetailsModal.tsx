import React from 'react';
import { ServiceListing } from '../../types/marketplace';
import { 
  X, 
  Star, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Clock,
  Tractor,
  Wrench,
  Users,
  BookOpen,
  Phone,
  Mail,
  MessageSquare
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
            {getCategoryIcon(service.category)}
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
                    {getCategoryIcon(service.category)}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">{service.description}</p>
              </div>

              {/* Equipment/Specializations */}
              {(service.equipment || service.specializations) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {service.equipment ? 'Equipment' : 'Specializations'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(service.equipment || service.specializations)?.map((item, index) => (
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
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 fill-current mr-2" />
                    <span className="font-medium text-gray-900">{service.providerRating}</span>
                    <span className="text-gray-600 ml-2">(24 reviews)</span>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span>{service.location}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <Phone className="w-5 h-5 mr-2" />
                    <span>+233 123 456 789</span>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <Mail className="w-5 h-5 mr-2" />
                    <span>provider@farmconnect.com</span>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-green-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
                <div className="flex items-center">
                  <DollarSign className="w-6 h-6 text-green-600 mr-2" />
                  <span className="text-3xl font-bold text-green-600">₵{service.price}</span>
                  <span className="text-gray-600 ml-2">per {service.priceUnit}</span>
                </div>
              </div>

              {/* Availability */}
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-gray-700">
                      Status: <span className="font-medium text-blue-600">
                        {service.availability.charAt(0).toUpperCase() + service.availability.slice(1)}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-gray-700">
                      Next available: {new Date(service.availableDates[0]).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={onBookService}
                  disabled={service.availability !== 'available'}
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