import React, { useState } from 'react';
import { 
  Zap, 
  Droplets, 
  Shield, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Home, 
  ReceiptText, 
  FileCheck2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { Property, PropertyScoreResult } from '../../lib/scoring';
import { calculateUpfrontCost } from '../../lib/scoring';

interface PropertyCardProps {
  property: Property;
  scoreResult?: PropertyScoreResult;
  isSelected: boolean;
  onSelect: () => void;
  onOpenAdvisory: (property: Property) => void;
  onOpenNeighborhood: (neighborhood: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  scoreResult,
  isSelected,
  onSelect,
  onOpenAdvisory,
  onOpenNeighborhood,
}) => {
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const upfront = scoreResult?.upfrontCost || calculateUpfrontCost(property);

  const score = scoreResult?.overallScore;
  let scoreBadgeColor = 'bg-stone-100 text-stone-700 border-stone-200';
  if (score !== undefined) {
    if (score >= 80) scoreBadgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    else if (score >= 65) scoreBadgeColor = 'bg-sky-50 text-sky-800 border-sky-300';
    else scoreBadgeColor = 'bg-amber-50 text-amber-800 border-amber-300';
  }

  return (
    <div 
      className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col ${
        isSelected 
          ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md' 
          : 'border-stone-200 hover:border-stone-300 hover:shadow-sm'
      }`}
    >
      {/* Property Image Header */}
      <div className="relative h-48 w-full bg-stone-100 overflow-hidden cursor-pointer" onClick={onSelect}>
        <img
          src={property.images[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          <span className="bg-stone-900/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider">
            {property.property_type}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenNeighborhood(property.neighborhood);
            }}
            className="bg-emerald-900/90 hover:bg-emerald-800 backdrop-blur-md text-emerald-100 text-[11px] font-medium px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
          >
            <MapPin className="w-3 h-3 text-emerald-400" />
            {property.neighborhood}
          </button>
        </div>

        {/* Score Badge */}
        {score !== undefined && (
          <div className="absolute top-3 right-3">
            <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border backdrop-blur-md shadow-sm ${scoreBadgeColor}`}>
              {score}% Match
            </div>
          </div>
        )}

        {/* Bottom Title & Price Overlay */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="text-xl font-extrabold tracking-tight drop-shadow-sm">
            ₦{(property.price_ngn / 1000000).toFixed(2)}M <span className="text-xs font-normal text-stone-200">/ year</span>
          </div>
          <div className="text-xs text-stone-200 line-clamp-1 font-medium drop-shadow-sm">
            {property.address}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Title */}
        <h3 
          className="font-bold text-stone-900 text-sm leading-snug cursor-pointer hover:text-emerald-700 transition-colors"
          onClick={onSelect}
        >
          {property.title}
        </h3>

        {/* Quick Spec Pills */}
        <div className="flex items-center gap-3 text-xs text-stone-600">
          <span className="flex items-center gap-1 font-medium">
            <Home className="w-3.5 h-3.5 text-stone-400" />
            {property.bedrooms} Beds
          </span>
          <span>•</span>
          <span>{property.bathrooms} Baths</span>
          <span>•</span>
          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
            {property.power_rating}
          </span>
        </div>

        {/* Key Living Indicators */}
        <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-stone-100">
          <div className="flex items-center gap-1.5 text-stone-700">
            <Zap className={`w-3.5 h-3.5 ${property.prepaid_meter ? 'text-emerald-600' : 'text-amber-500'}`} />
            <span>{property.prepaid_meter ? 'Prepaid Meter' : 'Shared Meter'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-stone-700">
            <Droplets className="w-3.5 h-3.5 text-sky-600" />
            <span>Borehole Water</span>
          </div>
          <div className="flex items-center gap-1.5 text-stone-700">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span className="truncate">{property.security_level.split('(')[0]}</span>
          </div>
          <div className="flex items-center gap-1.5 text-stone-700">
            <CheckCircle2 className={`w-3.5 h-3.5 ${!property.landlord_on_compound ? 'text-emerald-600' : 'text-amber-600'}`} />
            <span>{!property.landlord_on_compound ? 'Landlord Off-Site' : 'Landlord On-Site'}</span>
          </div>
        </div>

        {/* Upfront Cost Overview Box */}
        <div className="mt-auto pt-2 border-t border-stone-100 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-500 flex items-center gap-1">
              <ReceiptText className="w-3.5 h-3.5 text-stone-400" />
              Total Move-In Upfront:
            </span>
            <div className="flex items-center gap-1">
              <span className="font-bold text-stone-900">₦{(upfront.total / 1000000).toFixed(2)}M</span>
              <button
                type="button"
                onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                className="text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                title="Toggle upfront breakdown"
              >
                {showCostBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Accordion Upfront Cost Breakdown */}
          {showCostBreakdown && (
            <div className="bg-stone-50 rounded-xl p-3 text-[11px] text-stone-600 flex flex-col gap-1 border border-stone-200 animate-fadeIn">
              <div className="flex justify-between">
                <span>Base Rent:</span>
                <span className="font-medium text-stone-800">₦{upfront.rent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge:</span>
                <span className="font-medium text-stone-800">₦{upfront.serviceCharge.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Caution Fee (Refundable):</span>
                <span className="font-medium text-stone-800">₦{upfront.cautionFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Agency fee (10%):</span>
                <span className="font-medium text-stone-800">₦{upfront.agencyFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-stone-200 font-bold text-stone-900 text-xs">
                <span>Total Cash to Landlord & Agents:</span>
                <span className="text-emerald-700">₦{upfront.total.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenAdvisory(property)}
            className="py-2 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Inspection Advisory</span>
          </button>
          <button
            type="button"
            onClick={onSelect}
            className={`py-2 px-2.5 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              isSelected 
                ? 'bg-emerald-600 text-white' 
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{isSelected ? 'Viewing on Map' : 'Locate on Map'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
