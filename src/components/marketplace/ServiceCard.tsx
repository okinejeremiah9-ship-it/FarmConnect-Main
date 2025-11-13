// src/components/marketplace/ServiceCard.tsx
import React from "react";
import { ServiceListing } from "../../types/marketplace";
import {
  Star,
  MapPin,
  DollarSign,
  Tractor,
  Wrench,
  Users,
  Droplet,
  Wind,
  Ruler,
} from "lucide-react";

export const ServiceCard = ({ service }: { service: ServiceListing }) => {
  const getCategoryIcon = (name: string) => {
    if (!name) return <Tractor className="w-5 h-5 text-gray-600" />;

    const c = name.toLowerCase();

    if (c.includes("tractor")) return <Tractor className="w-5 h-5 text-green-600" />;
    if (c.includes("mechanic")) return <Wrench className="w-5 h-5 text-blue-600" />;
    if (c.includes("irrigation")) return <Droplet className="w-5 h-5 text-blue-500" />;
    if (c.includes("spray")) return <Wind className="w-5 h-5 text-purple-600" />;
    if (c.includes("driver")) return <Users className="w-5 h-5 text-orange-600" />;

    return <Tractor className="w-5 h-5 text-gray-600" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="relative h-48 bg-gray-100">
        {service.images?.length ? (
          <img
            src={service.images[0]}
            className="w-full h-full object-cover"
            alt={service.title}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            {getCategoryIcon(service.category)}
          </div>
        )}

        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2 py-1 rounded-full text-xs bg-white shadow font-semibold">
            {service.category}
          </span>

          {service.distanceKm !== null && (
            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 flex items-center gap-1">
              <Ruler className="w-3 h-3" />
              {service.distanceKm.toFixed(1)} km
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg">{service.title}</h3>
        <p className="text-sm text-gray-500">{service.providerName}</p>

        <div className="flex items-center gap-1 mt-2">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm">{service.providerRating?.toFixed(1)}</span>
        </div>

        <p className="text-sm text-gray-600 mt-2 line-clamp-3">{service.description}</p>

        <div className="mt-3 text-sm">
          {service.location && (
            <div className="flex gap-2 items-start">
              <MapPin className="w-4 h-4 text-gray-400 mt-1" />
              <span>{service.location}</span>
            </div>
          )}

          {service.price && (
            <div className="flex gap-2 items-start mt-1">
              <DollarSign className="w-4 h-4 text-gray-400 mt-1" />
              <span className="font-semibold">
                ₵{service.price} <span className="text-xs">per {service.priceUnit}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
