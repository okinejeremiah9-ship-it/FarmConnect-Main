import React from "react";
import { ServiceListing } from "../../types/marketplace";
import {
  Star,
  MapPin,
  DollarSign,
  Tractor,
  Wrench,
  Users,
  BookOpen,
  Eye,
  Calendar,
  MessageSquare,
  Ruler,
} from "lucide-react";

interface ServiceCardProps {
  service: ServiceListing;
  onViewDetails?: (service: ServiceListing) => void;
  onBookService?: (service: ServiceListing) => void;
  onMessageProvider?: (service: ServiceListing) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onViewDetails,
  onBookService,
  onMessageProvider,
}) => {
  const getCategoryIcon = (category?: string | null) => {
    switch (category?.toLowerCase()) {
      case "machinery":
      case "tractor operator":
      case "farm equipment rental":
        return <Tractor className="w-5 h-5 text-green-600" />;
      case "mechanic":
        return <Wrench className="w-5 h-5 text-blue-600" />;
      case "extension":
      case "agro consultant":
        return <BookOpen className="w-5 h-5 text-purple-600" />;
      case "labour":
        return <Users className="w-5 h-5 text-orange-600" />;
      default:
        return <Tractor className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCategoryColor = (category?: string | null) => {
    switch (category?.toLowerCase()) {
      case "machinery":
      case "tractor operator":
      case "farm equipment rental":
        return "bg-green-100 text-green-800";
      case "mechanic":
        return "bg-blue-100 text-blue-800";
      case "extension":
      case "agro consultant":
        return "bg-purple-100 text-purple-800";
      case "labour":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const rating =
    typeof service.providerRating === "number"
      ? service.providerRating
      : service.providerRating != null
      ? Number(service.providerRating)
      : null;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-200 overflow-hidden flex flex-col">
      {/* Image / Icon */}
      <div className="relative h-48 bg-gradient-to-br from-green-100 to-blue-100">
        {service.images && service.images.length > 0 ? (
          <img
            src={service.images[0]}
            alt={service.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-inner">
              {getCategoryIcon(service.category)}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {service.category && (
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${getCategoryColor(
                service.category
              )}`}
            >
              {service.category.charAt(0).toUpperCase() +
                service.category.slice(1)}
            </span>
          )}

          {service.distanceKm !== undefined && service.distanceKm !== null && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-emerald-700 shadow-sm flex items-center gap-1">
              <Ruler className="w-3 h-3" />
              {Number(service.distanceKm).toFixed(1)} km
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6">
        <h3 className="text-lg font-semibold text-gray-900 leading-tight">
          {service.title}
        </h3>
        <p className="text-sm text-gray-500">{service.providerName}</p>

        {/* Rating */}
        {rating !== null && (
          <div className="flex items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              {rating.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">Trusted provider</span>
          </div>
        )}

        {/* Description */}
        {service.description && (
          <p className="mt-3 text-sm text-gray-600 line-clamp-3 leading-relaxed">
            {service.description}
          </p>
        )}

        {/* Details */}
        <dl className="mt-4 space-y-2 text-sm text-gray-600">
          {service.location && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
              <span>{service.location}</span>
            </div>
          )}

          {(service.price || service.pricingInfo) && (
            <div className="flex items-start gap-2">
              <DollarSign className="w-4 h-4 mt-0.5 text-gray-400" />
              {service.price ? (
                <span className="font-medium text-gray-900">
                  ₵{service.price}
                  <span className="text-xs text-gray-500 ml-1">
                    per {service.priceUnit ?? "session"}
                  </span>
                </span>
              ) : (
                <span>{service.pricingInfo}</span>
              )}
            </div>
          )}

          {service.availableDates && service.availableDates.length > 0 && (
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 mt-0.5 text-gray-400" />
              <span>
                Next availability:{" "}
                {new Date(service.availableDates[0]).toLocaleDateString()}
              </span>
            </div>
          )}
        </dl>

        {/* Specializations */}
        {service.specializations && service.specializations.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
              Specialties
            </p>
            <div className="flex flex-wrap gap-2">
              {service.specializations.slice(0, 4).map((item, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                >
                  {item}
                </span>
              ))}
              {service.specializations.length > 4 && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                  +{service.specializations.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => onViewDetails?.(service)}
            className="w-full bg-gray-100 text-gray-700 py-2.5 px-3 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <Eye className="w-4 h-4 mr-1" /> Details
          </button>

          <button
            onClick={() => onMessageProvider?.(service)}
            disabled={!onMessageProvider}
            className="w-full bg-blue-600 text-white py-2.5 px-3 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            <MessageSquare className="w-4 h-4 mr-1" /> Message
          </button>

          <button
            onClick={() => onBookService?.(service)}
            disabled={!onBookService || service.price == null}
            className="w-full bg-green-600 text-white py-2.5 px-3 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            <Calendar className="w-4 h-4 mr-1" /> Book
          </button>
        </div>
      </div>
    </div>
  );
};
