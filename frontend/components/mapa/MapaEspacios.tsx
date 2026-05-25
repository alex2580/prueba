'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import type { Espacio } from '@/types';
import { getMonedaSimbolo } from '@/types';
import { getFotoFallback } from '@/lib/fotosFallback';

interface MapaEspaciosProps {
  espacios: Espacio[];
  onMarkerClick?: (espacio: Espacio) => void;
  selectedId?: string | null;
  center?: { lat: number; lng: number };
  filtrosActivos?: boolean;
}

const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

// Centro: Buenos Aires
const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 };

const DARK_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0a0e1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9aacc5' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0e1a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2035' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1525' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
];

const LIGHT_STYLES: google.maps.MapTypeStyle[] = [];

export function MapaEspacios({ espacios, onMarkerClick, selectedId, center, filtrosActivos }: MapaEspaciosProps) {
  const mapRef           = useRef<HTMLDivElement>(null);
  const mapObj           = useRef<google.maps.Map | null>(null);
  const markers          = useRef<Map<string, google.maps.Marker>>(new Map());
  const markerIcons      = useRef<Map<string, google.maps.Icon>>(new Map());   // con precio
  const markerIconsEmpty = useRef<Map<string, google.maps.Icon>>(new Map());   // sin precio
  const markerLabels     = useRef<Map<string, string>>(new Map());
  const heatmap       = useRef<any>(null);
  const infoWindow    = useRef<google.maps.InfoWindow | null>(null);
  const userMarker    = useRef<google.maps.Marker | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('light');

  // Initialize map
  useEffect(() => {
    if (!MAP_ID) { setError('Google Maps API key no configurada'); return; }

    const loader = new Loader({
      apiKey: MAP_ID,
      version: 'weekly',
    });

    loader.load().then(async (google) => {
      if (!mapRef.current) return;

      const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
      const { InfoWindow } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;

      mapObj.current = new Map(mapRef.current, {
        center: center || DEFAULT_CENTER,
        zoom: 12,
        disableDefaultUI: false,
        streetViewControl: false,
        mapTypeControl: false,
        styles: LIGHT_STYLES,
      });

      infoWindow.current = new InfoWindow();

      setLoaded(true);
    }).catch(err => {
      console.error('Google Maps error:', err);
      setError('No se pudo cargar el mapa');
    });
  }, []);

  // Apply theme when toggled
  useEffect(() => {
    if (!mapObj.current) return;
    mapObj.current.setOptions({ styles: mapTheme === 'dark' ? DARK_STYLES : LIGHT_STYLES });
  }, [mapTheme]);

  // Add/update markers when espacios change
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

      const iconColor = !espacio.disponible ? '#94a3b8'
        : espacio.tipo === 'exclusivo' ? '#3b82f6'
        : '#e8622a';

      const sim = getMonedaSimbolo(espacio.moneda);
      const pMes = Number(espacio.precio_mes);
      const pDia = Number(espacio.precio_dia);
      const precio = pMes > 0 ? pMes : pDia;
      const sufijo = pMes > 0 ? '' : '/d';
      const iconLabel = precio >= 1000
        ? `${sim}${Math.round(precio / 1000)}k${sufijo}`
        : `${sim}${Math.round(precio)}${sufijo}`;

      // Pin con precio (cuando hay filtros activos)
      const pinSvgFull = (color: string) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="68" height="56">
          <rect x="1" y="1" width="66" height="36" rx="18" fill="${color}"/>
          <polygon points="22,34 46,34 34,54" fill="${color}"/>
          <circle cx="34" cy="53" r="2.5" fill="rgba(255,255,255,0.85)"/>
          <text x="34" y="23" text-anchor="middle" font-family="Sora,sans-serif" font-size="11" font-weight="bold" fill="white">${iconLabel}</text>
        </svg>
      `;

      // Pin simple sin precio (estado inicial sin filtros)
      const pinSvgEmpty = (color: string) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="34">
          <rect x="1" y="1" width="26" height="20" rx="10" fill="${color}"/>
          <polygon points="8,18 20,18 14,32" fill="${color}"/>
          <circle cx="14" cy="31" r="2" fill="rgba(255,255,255,0.85)"/>
          <circle cx="14" cy="11" r="4" fill="rgba(255,255,255,0.4)"/>
        </svg>
      `;

      const iconFull: google.maps.Icon = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSvgFull(iconColor))}`,
        scaledSize: new google.maps.Size(68, 56),
        anchor: new google.maps.Point(34, 54),
      };

      const iconEmpty: google.maps.Icon = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSvgEmpty(iconColor))}`,
        scaledSize: new google.maps.Size(28, 34),
        anchor: new google.maps.Point(14, 32),
      };

      const marker = new google.maps.Marker({
        map,
        position: { lat: parseFloat(String(espacio.lat)), lng: parseFloat(String(espacio.lng)) },
        title: espacio.nombre,
        icon: filtrosActivos ? iconFull : iconEmpty,
      });

      marker.addListener('click', () => onMarkerClick?.(espacio));

      // Show preview on hover
      marker.addListener('mouseover', () => {
        if (!infoWindow.current) return;
        const hoverImg = espacio.imgs?.[0] || espacio.img_principal || getFotoFallback(espacio.id);
        infoWindow.current.setContent(`
          <div style="font-family:sans-serif;font-size:12px;line-height:1.5;width:220px;overflow:hidden;border-radius:8px;">
            <img src="${hoverImg}" alt="${espacio.nombre}"
              style="width:100%;height:130px;object-fit:cover;display:block;border-radius:6px 6px 0 0;"
              onerror="this.src='${getFotoFallback(espacio.id)}'"
            />
            <div style="padding:8px 10px;">
              <strong style="font-size:13px;display:block;margin-bottom:2px;">${espacio.nombre}</strong>
              <span style="color:#666;">📍 ${espacio.barrio}</span>
              <div style="margin-top:3px;">
                ${Number(espacio.precio_mes) > 0 ? `<span style="font-weight:700;color:#e8622a;">${sim}${Number(espacio.precio_mes).toLocaleString('es-AR')}<span style="font-weight:400;color:#999;">/mes</span></span>` : ''}
                ${Number(espacio.precio_mes) > 0 && Number(espacio.precio_dia) > 0 ? '<span style="color:#ccc;margin:0 4px;">·</span>' : ''}
                ${Number(espacio.precio_dia) > 0 ? `<span style="font-weight:700;color:#e8622a;">${sim}${Number(espacio.precio_dia).toLocaleString('es-AR')}<span style="font-weight:400;color:#999;">/día</span></span>` : ''}
              </div>
            </div>
          </div>
        `);
        infoWindow.current.open(map, marker);
      });

      marker.addListener('mouseout', () => {
        infoWindow.current?.close();
      });

      markers.current.set(espacio.id, marker);
      markerIcons.current.set(espacio.id, iconFull);
      markerIconsEmpty.current.set(espacio.id, iconEmpty);
      markerLabels.current.set(espacio.id, iconLabel);
      existingIds.delete(espacio.id);
    });

    // Remove stale markers
    existingIds.forEach(id => {
      const m = markers.current.get(id);
      if (m) {
        m.setMap(null);
        markers.current.delete(id);
        markerIcons.current.delete(id);
        markerIconsEmpty.current.delete(id);
        markerLabels.current.delete(id);
      }
    });

  }, [loaded, espacios, onMarkerClick]);

  // Swap icon style when filtrosActivos changes
  useEffect(() => {
    if (!loaded) return;
    markers.current.forEach((marker, id) => {
      if (id === selectedId) return; // selected marker keeps its highlight
      const icon = filtrosActivos
        ? markerIcons.current.get(id)
        : markerIconsEmpty.current.get(id);
      if (icon) marker.setIcon(icon);
    });
  }, [loaded, filtrosActivos, selectedId]);

  // Highlight selected marker
  useEffect(() => {
    markers.current.forEach((marker, id) => {
      if (id === selectedId) {
        const label = markerLabels.current.get(id) ?? '';
        const selSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="80" height="66">
            <rect x="1" y="1" width="78" height="43" rx="22" fill="#f59e0b"/>
            <rect x="4" y="4" width="72" height="37" rx="19" fill="#fbbf24" opacity="0.5"/>
            <polygon points="27,41 53,41 40,62" fill="#f59e0b"/>
            <circle cx="40" cy="62" r="3" fill="rgba(255,255,255,0.9)"/>
            <text x="40" y="28" text-anchor="middle" font-family="Sora,sans-serif" font-size="13" font-weight="bold" fill="white">${label}</text>
          </svg>
        `;
        marker.setIcon({
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(selSvg)}`,
          scaledSize: new google.maps.Size(80, 66),
          anchor: new google.maps.Point(40, 64),
        });
        marker.setZIndex(10);
      } else {
        const originalIcon = filtrosActivos
          ? markerIcons.current.get(id)
          : markerIconsEmpty.current.get(id);
        if (originalIcon) {
          marker.setIcon(originalIcon);
          marker.setZIndex(undefined as unknown as number);
        }
      }
    });
  }, [selectedId]);

  // Pan to center and show/hide user location marker
  useEffect(() => {
    if (!loaded || !mapObj.current) return;

    if (center) {
      mapObj.current.panTo(center);
      mapObj.current.setZoom(14);

      const iconSvg = encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
          <circle cx="24" cy="24" r="22" fill="rgba(16,185,129,0.18)" stroke="#10b981" stroke-width="2"/>
          <circle cx="24" cy="24" r="9" fill="#10b981"/>
          <circle cx="24" cy="24" r="4" fill="white"/>
        </svg>
      `);

      if (userMarker.current) {
        userMarker.current.setPosition(center);
        userMarker.current.setMap(mapObj.current);
      } else {
        userMarker.current = new google.maps.Marker({
          map: mapObj.current,
          position: center,
          title: 'Tu ubicación',
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${iconSvg}`,
            scaledSize: new google.maps.Size(48, 48),
            anchor: new google.maps.Point(24, 24),
          },
          zIndex: 20,
        });
      }
    } else {
      if (userMarker.current) {
        userMarker.current.setMap(null);
        userMarker.current = null;
      }
    }
  }, [loaded, center]);

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
    <div className="map-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg)', color: 'var(--text3)' }}>
          <span style={{ fontSize: '.9rem' }}>Cargando mapa…</span>
        </div>
      )}
      {/* Dark/Light toggle — top right */}
      {loaded && (
        <button
          onClick={() => setMapTheme(t => t === 'dark' ? 'light' : 'dark')}
          title={mapTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1rem',
            zIndex: 100,
            background: mapTheme === 'dark' ? 'rgba(8,12,22,0.92)' : 'rgba(255,255,255,0.95)',
            border: `2px solid ${mapTheme === 'dark' ? '#344060' : '#ccc'}`,
            borderRadius: '999px',
            width: 42,
            height: 42,
            fontSize: '1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,.4)',
            backdropFilter: 'blur(8px)',
            transition: 'all .15s',
          }}
        >
          {mapTheme === 'dark' ? '☀️' : '🌙'}
        </button>
      )}
    </div>
  );
}
