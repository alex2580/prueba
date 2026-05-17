'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import type { Espacio } from '@/types';

interface MapaEspaciosProps {
  espacios: Espacio[];
  onMarkerClick?: (espacio: Espacio) => void;
  selectedId?: string | null;
  center?: { lat: number; lng: number };
}

const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

// Centro: Buenos Aires
const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 };

export function MapaEspacios({ espacios, onMarkerClick, selectedId, center }: MapaEspaciosProps) {
  const mapRef        = useRef<HTMLDivElement>(null);
  const mapObj        = useRef<google.maps.Map | null>(null);
  const markers       = useRef<Map<string, google.maps.Marker>>(new Map());
  const markerIcons   = useRef<Map<string, google.maps.Icon>>(new Map());
  const markerLabels  = useRef<Map<string, string>>(new Map());
  const heatmap       = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!MAP_ID) { setError('Google Maps API key no configurada'); return; }

    const loader = new Loader({
      apiKey: MAP_ID,
      version: 'weekly',
      libraries: ['visualization'],
    });

    loader.load().then(async (google) => {
      if (!mapRef.current) return;

      const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;

      mapObj.current = new Map(mapRef.current, {
        center: center || DEFAULT_CENTER,
        zoom: 12,
        disableDefaultUI: false,
        streetViewControl: false,
        mapTypeControl: false,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#0a0e1a' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#9aacc5' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0e1a' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2035' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1525' }] },
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        ],
      });

      setLoaded(true);
    }).catch(err => {
      console.error('Google Maps error:', err);
      setError('No se pudo cargar el mapa');
    });
  }, []);

  // Add/update markers and heatmap when espacios change
  useEffect(() => {
    if (!loaded || !mapObj.current) return;

    const map = mapObj.current;
    const existingIds = new Set(markers.current.keys());

    // Add new markers
    espacios.forEach((espacio) => {
      if (markers.current.has(espacio.id)) {
        existingIds.delete(espacio.id);
        return;
      }

      const iconColor = espacio.disponible ? '#e8622a' : '#5a6d8a';
      const iconLabel = `$${Math.round(Number(espacio.precio_mes) / 1000)}k`;
      const defaultIcon: google.maps.Icon = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="28">
            <rect width="60" height="28" rx="14" fill="${iconColor}"/>
            <text x="30" y="18" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="white">${iconLabel}</text>
          </svg>
        `)}`,
        scaledSize: new google.maps.Size(60, 28),
        anchor: new google.maps.Point(30, 14),
      };

      const marker = new google.maps.Marker({
        map,
        position: { lat: parseFloat(String(espacio.lat)), lng: parseFloat(String(espacio.lng)) },
        title: espacio.nombre,
        icon: defaultIcon,
      });

      marker.addListener('click', () => onMarkerClick?.(espacio));
      markers.current.set(espacio.id, marker);
      markerIcons.current.set(espacio.id, defaultIcon);
      markerLabels.current.set(espacio.id, iconLabel);
      existingIds.delete(espacio.id);
    });

    // Remove stale markers
    existingIds.forEach(id => {
      const m = markers.current.get(id);
      if (m) { m.setMap(null); markers.current.delete(id); markerIcons.current.delete(id); markerLabels.current.delete(id); }
    });

    // Heatmap of espacio locations
    const points = espacios.map(e => ({
      location: new google.maps.LatLng(parseFloat(String(e.lat)), parseFloat(String(e.lng))),
      weight: e.reservas_mes + 1,
    }));

    if (heatmap.current) {
      heatmap.current.setData(points);
    } else {
      google.maps.importLibrary('visualization').then((lib) => {
        const { HeatmapLayer } = lib as google.maps.VisualizationLibrary;
        heatmap.current = new HeatmapLayer({
          data: points,
          map,
          radius: 40,
          opacity: 0.35,
          gradient: ['rgba(0,0,0,0)', 'rgba(232,98,42,.3)', 'rgba(232,98,42,.6)', 'rgba(232,98,42,.9)'],
        });
      });
    }
  }, [loaded, espacios, onMarkerClick]);

  // Highlight selected marker
  useEffect(() => {
    markers.current.forEach((marker, id) => {
      if (id === selectedId) {
        const label = markerLabels.current.get(id) ?? '';
        marker.setIcon({
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="66" height="30">
              <rect width="66" height="30" rx="15" fill="#82c4ff"/>
              <text x="33" y="19" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="white">${label}</text>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(66, 30),
          anchor: new google.maps.Point(33, 15),
        });
        marker.setZIndex(10);
      } else {
        // Restore original icon
        const originalIcon = markerIcons.current.get(id);
        if (originalIcon) {
          marker.setIcon(originalIcon);
          marker.setZIndex(undefined as unknown as number);
        }
      }
    });
  }, [selectedId]);

  // Pan to center when it changes
  useEffect(() => {
    if (center && mapObj.current) {
      mapObj.current.panTo(center);
      mapObj.current.setZoom(15);
    }
  }, [center]);

  if (error) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', color: 'var(--text3)', flexDirection: 'column', gap: '.75rem' }}>
        <span style={{ fontSize: '2rem' }}>🗺️</span>
        <span style={{ fontSize: '.88rem' }}>{error}</span>
      </div>
    );
  }

  return (
    <div className="map-container">
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg)', color: 'var(--text3)' }}>
          <span style={{ fontSize: '.9rem' }}>Cargando mapa…</span>
        </div>
      )}
    </div>
  );
}
