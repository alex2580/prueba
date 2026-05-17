'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  const mapRef  = useRef<HTMLDivElement>(null);
  const mapObj  = useRef<google.maps.Map | null>(null);
  const markers = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const heatmap = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!MAP_ID) { setError('Google Maps API key no configurada'); return; }

    const loader = new Loader({
      apiKey: MAP_ID,
      version: 'weekly',
      libraries: ['marker', 'visualization'],
    });

    loader.load().then(async (google) => {
      if (!mapRef.current) return;

      const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;

      mapObj.current = new Map(mapRef.current, {
        center: center || DEFAULT_CENTER,
        zoom: 12,
        mapId: 'todasmiscosas_dark',
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
    espacios.forEach(async (espacio) => {
      if (markers.current.has(espacio.id)) {
        existingIds.delete(espacio.id);
        return;
      }

      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;

      const pin = document.createElement('div');
      pin.style.cssText = `
        background: ${espacio.disponible ? '#e8622a' : '#5a6d8a'};
        color: white;
        border: 2px solid ${espacio.disponible ? 'rgba(232,98,42,.4)' : 'rgba(90,109,138,.4)'};
        border-radius: 99px;
        padding: 4px 9px;
        font-family: Sora, sans-serif;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        box-shadow: 0 3px 12px rgba(0,0,0,.5);
        cursor: pointer;
        transition: transform .15s;
      `;
      pin.textContent = `$${Math.round(espacio.precio_mes / 1000)}k`;
      pin.addEventListener('mouseenter', () => { pin.style.transform = 'scale(1.12)'; });
      pin.addEventListener('mouseleave', () => { pin.style.transform = ''; });

      const marker = new AdvancedMarkerElement({
        map,
        position: { lat: espacio.lat, lng: espacio.lng },
        content: pin,
        title: espacio.nombre,
      });

      marker.addListener('click', () => onMarkerClick?.(espacio));
      markers.current.set(espacio.id, marker);
      existingIds.delete(espacio.id);
    });

    // Remove stale markers
    existingIds.forEach(id => {
      const m = markers.current.get(id);
      if (m) { m.map = null; markers.current.delete(id); }
    });

    // Heatmap of espacio locations
    const points = espacios.map(e => ({
      location: new google.maps.LatLng(e.lat, e.lng),
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
      const pin = marker.content as HTMLElement;
      if (!pin) return;
      if (id === selectedId) {
        pin.style.background = 'var(--blue)';
        pin.style.transform = 'scale(1.18)';
        pin.style.zIndex = '10';
        marker.zIndex = 10;
      } else {
        pin.style.background = '#e8622a';
        pin.style.transform = '';
        pin.style.zIndex = '';
        marker.zIndex = undefined as unknown as number;
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
