'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {useRef, useEffect} from 'react';

// Fix default icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface MapCoords {
  lat: number;
  lng: number;
  onLocationUpdate?: (lat : number, lng: number) => void;
}
export interface LocDetails {
  name: string;
  lat: number;
  lng: number;
  address: string;
  doctor?: string;
  specializations?: string[];
  contact?: string;
}
export interface MapProps{
  base : MapCoords;
  details?: LocDetails[];
}
export default function LocationMap({ base, details }: MapProps) {
  console.log('LocationMap rendering, details:', details);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const detailMarkersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current).setView([base.lat, base.lng], 15);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.current);

    markerRef.current = L.marker([base.lat, base.lng ])
      .addTo(map.current)
      .bindPopup(
        `<div class="text-center">
          <strong>Your Location</strong><br/>
          Lat: ${base.lat.toFixed(4)}<br/>
          Lng: ${base.lng.toFixed(4)}
        </div>`
      );

    // Add accuracy circle
    L.circle([base.lat, base.lng], {
      color: 'blue',
      fillColor: '#30b0d5',
      fillOpacity: 0.2,
      radius: 500,
    }).addTo(map.current);
  }, [base.lat, base.lng]);

  // Handle details markers separately
  useEffect(() => {
    if (!map.current) return;

    // Remove old detail markers
    detailMarkersRef.current.forEach(marker => map.current!.removeLayer(marker));
    detailMarkersRef.current = [];

    // Add new detail markers
    if (details && details.length > 0) {
      console.log('Adding markers for:', details);
      detailMarkersRef.current = details.map(c => {
        const marker = L.marker([Number(c.lat), Number(c.lng)])
          .addTo(map.current!)
          .bindPopup(
            `<div class="text-center">
              <strong>${c.name}</strong><br/>
              ${c.address}
            </div>`
          )
          .openPopup();
        return marker;
      });
    }
  }, [details]);

  // Update map when location changes
  useEffect(() => {
    if (map.current && markerRef.current) {
      map.current.setView([base.lat, base.lng], 15);
      markerRef.current.setLatLng([base.lat, base.lng]);
      markerRef.current.setPopupContent(
        `<div class="text-center">
          <strong>Your Location</strong><br/>
          Lat: ${base.lat.toFixed(4)}<br/>
          Lng: ${base.lng.toFixed(4)}
        </div>`
      );
    }
  }, [base.lat, base.lng]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
