import React, { useState } from "react";
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
  MessageSquare,
  Calendar,
  Ruler,
  ChevronLeft,
  ChevronRight,
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
  const [activeIndex, setActiveIndex] = useState(0);

  const images = service.images?.length ? service.images : [];

  const next = () => {
    if (!images.length) return;
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const prev = () => {
    if (!images.length) return;
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getCategoryIcon = (category?: string | null) => {
    switch (category?.toLowerCase()) {
      case "machinery":
      case "tractor operator":
      case "farm equipment rental":
        return <Tractor className="w-5 h-5 text-green-700" />;
      case "mechanic":
        return <Wrench className="w-5 h-5 text-blue-700" />;
      case "extension":
      case "agro consultant":
        return <BookOpen className="w-5 h-5 text-purple-700" />;
      case "labour":
        return <Users className="w-5 h-5 text-orange-700" />;
      default:
        return <Tractor className="w-5 h-5 text-gray-700" />;
    }
  };

  const getCategoryColor = (category?: string | null) => {
    switch (category?.toLowerCase()) {
      case "tractor operator":
      case "machinery":
        return "bg-green-100 text-green-800";
      case "farm equipment rental":
        return "bg-green-200 text-green-900";
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
      : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group">
      {/* IMAGE / CAROUSEL */}
      <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
        {images.length > 0 ? (
          <>
            {/* Slides */}
            <div
              className="w-full h-full flex transition-transform duration-500"
              style={{
                transform: `translateX(-${activeIndex * 100}%)`,
              }}
            >
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  className="w-full h-full object-cover flex-shrink-0"
                  alt={`Service image ${i}`}
                />
              ))}
            </div>

            {/* Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Dots */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    activeIndex === i ? "bg-white" : "bg-white/50"
                  }`}
                ></span>
              ))}
            </div>
          </>
        ) : (
          // Fallback image
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
            <div className="w-20 h-20 rounded-full bg-white shadow-inner flex items-center justify-center">
              {getCategoryIcon(service.category)}
            </div>
          </div>
        )}

        {/* TOP TAGS */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {service.category && (
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow ${getCategoryColor(
                service.category
              )}`}
            >
              {service.category}
            </span>
          )}

          {service.distanceKm != null && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/70 text-white shadow flex items-center gap-1">
              <Ruler className="w-3 h-3" />
              {service.distanceKm.toFixed(1)} km
            </span>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 flex flex-col h-full">
        <h3 className="text-lg font-semibold text-gray-900 leading-tight">
          {service.title}
        </h3>

        <p className="text-sm text-gray-500 mt-1 font-medium">
          {service.providerName}
        </p>

        {rating !== null && (
          <div className="flex items-center gap-1 mt-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
            <span className="text-xs text-gray-500">
              ({service.totalReviews})
            </span>
          </div>
        )}

        {service.description && (
          <p className="text-sm text-gray-600 mt-3 line-clamp-3">
            {service.description}
          </p>
        )}

        <div className="mt-4 space-y-1 text-sm text-gray-600">
          {service.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{service.location}</span>
            </div>
          )}

          {service.price != null && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-900">
                ₵{service.price}
              </span>
              <span className="text-xs text-gray-500">
                / {service.priceUnit}
              </span>
            </div>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <button
            onClick={() => onViewDetails?.(service)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </button>

          <button
            onClick={() => onMessageProvider?.(service)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Chat
          </button>

          <button
            onClick={() => onBookService?.(service)}
            className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center"
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
};
