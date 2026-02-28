'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {useRef, useEffect} from 'react';

interface MapCoords {
  lat: number;
  lng: number;
  onLocationUpdate?: (lat : number, lng: number) => void;
}
interface MapProps{
  base : MapCoords;
  coords?: MapCoords[];
  labels?: string[];
}
export default function LocationMap({ base, coords, labels }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current).setView([base.lat, base.lng], 13);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.current);

    if(coords != undefined){
      for(let i=0; i<coords.length; i++){
        const c = coords[i];
        L.marker([c.lat, c.lng])
          .addTo(map.current)
          .bindPopup(
            `<div class="text-center">
              <strong>${labels?.[i] || `Location ${i + 1}`}</strong><br/>
              Lat: ${c.lat.toFixed(4)}<br/>
              Lng: ${c.lng.toFixed(4)}
            </div>`
          )
          .openPopup();
      }
  }
    markerRef.current = L.marker([base.lat, base.lng ])
      .addTo(map.current)
      .bindPopup(
        `<div class="text-center">
          <strong>Your Location</strong><br/>
          Lat: ${base.lat.toFixed(4)}<br/>
          Lng: ${base.lng.toFixed(4)}
        </div>`
      )
      .openPopup();

    // Add accuracy circle
    L.circle([base.lat, base.lng], {
      color: 'blue',
      fillColor: '#30b0d5',
      fillOpacity: 0.2,
      radius: 500,
    }).addTo(map.current);
  }, [base.lat, base.lng]);

  // Update map when location changes
  useEffect(() => {
    if (map.current && markerRef.current) {
      map.current.setView([base.lat, base.lng], 13);
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
