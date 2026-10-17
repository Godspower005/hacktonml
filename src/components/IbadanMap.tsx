import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Property, PropertyScoreResult } from '../../lib/scoring';

interface IbadanMapProps {
  properties: Property[];
  scoredProperties?: PropertyScoreResult[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property) => void;
}

export const IbadanMap: React.FC<IbadanMapProps> = ({
  properties,
  scoredProperties,
  selectedProperty,
  onSelectProperty,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Ibadan, Oyo State, Nigeria
    const map = L.map(mapContainerRef.current, {
      center: [7.4019, 3.9000],
      zoom: 12,
      scrollWheelZoom: true,
    });

    // High quality OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when properties or scores change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    properties.forEach(prop => {
      if (!prop.coordinates || typeof prop.coordinates.lat !== 'number') return;

      // Find score if available
      const scored = scoredProperties?.find(s => s.property.id === prop.id);
      const score = scored ? scored.overallScore : null;
      const isSelected = selectedProperty?.id === prop.id;

      // Pin color based on score or power band
      let pinColor = '#059669'; // Emerald
      if (score !== null) {
        if (score < 60) pinColor = '#ea580c'; // Orange
        else if (score < 80) pinColor = '#0284c7'; // Sky
      } else if (prop.power_rating.includes('Band A')) {
        pinColor = '#059669';
      }

      const formattedPrice = `₦${(prop.price_ngn / 1000000).toFixed(1)}M`;

      // Custom HTML Marker for Leaflet
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            background-color: ${isSelected ? '#111827' : pinColor};
            color: #ffffff;
            padding: 4px 8px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            border: 2px solid ${isSelected ? '#fbbf24' : '#ffffff'};
            display: flex;
            align-items: center;
            gap: 4px;
            transform: translate(-50%, -100%);
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            <span>${formattedPrice}</span>
            ${score !== null ? `<span style="background: rgba(255,255,255,0.25); border-radius: 4px; padding: 1px 4px; font-size: 10px;">${score}%</span>` : ''}
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([prop.coordinates.lat, prop.coordinates.lng], {
        icon: customIcon,
      }).addTo(map);

      marker.on('click', () => {
        onSelectProperty(prop);
      });

      markersRef.current[prop.id] = marker;
    });
  }, [properties, scoredProperties, selectedProperty, onSelectProperty]);

  // Center on selected property if changed
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedProperty || !selectedProperty.coordinates) return;

    map.panTo([selectedProperty.coordinates.lat, selectedProperty.coordinates.lng], {
      animate: true,
      duration: 0.8,
    });
  }, [selectedProperty]);

  return (
    <div className="relative w-full h-full min-h-[220px] rounded-2xl overflow-hidden shadow-inner border border-stone-200">
      <div ref={mapContainerRef} className="w-full h-full min-h-[220px]" />
      
      {/* Map Legend Overlay */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-stone-200 shadow-md text-xs text-stone-700 flex flex-col gap-1.5 pointer-events-auto">
        <div className="font-semibold text-stone-900 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          Ibadan Map View
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          <span>High Match / Band A</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
          <span>Moderate Match</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
          <span>Below Match</span>
        </div>
      </div>
    </div>
  );
};
