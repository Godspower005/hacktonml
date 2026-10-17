import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export function MapView({
  lat,
  lng,
  destLat,
  destLng,
  destLabel,
}: {
  lat: number;
  lng: number;
  destLat?: number;
  destLng?: number;
  destLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, {
      center: [lat, lng],
      zoom: 14,
      scrollWheelZoom: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    L.circleMarker([lat, lng], {
      radius: 10,
      color: '#047857',
      fillColor: '#059669',
      fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup('This home');

    if (typeof destLat === 'number' && typeof destLng === 'number') {
      L.circleMarker([destLat, destLng], {
        radius: 8,
        color: '#1d4ed8',
        fillColor: '#3b82f6',
        fillOpacity: 1,
      })
        .addTo(map)
        .bindPopup(destLabel || 'Your daily route');
      const line = L.polyline(
        [
          [lat, lng],
          [destLat, destLng],
        ],
        { color: '#047857', weight: 4, dashArray: '8 8' }
      ).addTo(map);
      map.fitBounds(line.getBounds().pad(0.2));
    }

    return () => {
      map.remove();
    };
  }, [lat, lng, destLat, destLng, destLabel]);

  return <div ref={ref} className="w-full h-[260px] rounded-2xl overflow-hidden border border-stone-200" />;
}
