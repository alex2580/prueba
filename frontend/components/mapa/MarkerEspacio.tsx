'use client';

import type { Espacio } from '@/types';
import { formatARS } from '@/lib/utils';

interface MarkerEspacioProps {
  espacio: Espacio;
  selected?: boolean;
  onClick?: () => void;
}

/**
 * Renders a marker preview card shown when user clicks a map marker.
 * This is the overlay card that appears at the bottom of the map.
 */
export function MarkerEspacioCard({ espacio, onClose, onVerDetalle, onReservar }: {
  espacio: Espacio;
  onClose: () => void;
  onVerDetalle: () => void;
  onReservar: () => void;
}) {
  const imgSrc = espacio.imgs?.[0] || '';

  return (
    <div style={{
      position: 'absolute', bottom: 20,
      left: '50%', transform: 'translateX(-50%)',
      width: 'min(480px, 94vw)',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r4)',
      overflow: 'hidden',
      boxShadow: 'var(--s5)',
      zIndex: 50,
      animation: 'cardUp .3s cubic-bezier(.34,1.3,.64,1)',
    }}>
      <style>{`@keyframes cardUp{from{opacity:0;transform:translateX(-50%) translateY(24px) scale(.97)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}`}</style>

      {/* Image */}
      <div style={{ position: 'relative', height: 180 }}>
        {imgSrc ? (
          <img src={imgSrc} alt={espacio.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>📦</div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,14,26,0) 40%, rgba(10,14,26,.6) 100%)' }} />

        {/* Close btn */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(10,14,26,.75)', border: 'none', color: '#fff',
          width: 30, height: 30, borderRadius: '99px', fontSize: 13,
        }}>✕</button>

        {espacio.badge && (
          <div style={{
            position: 'absolute', bottom: 10, left: 10,
            background: 'rgba(10,14,26,.85)', border: '1px solid var(--border)',
            borderRadius: '99px', padding: '3px 10px', fontSize: '11px',
            fontFamily: 'Sora, sans-serif', fontWeight: 700, color: 'var(--text)',
          }}>
            {espacio.badge}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '.9rem 1.1rem' }}>
        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '.2rem' }}>
          {espacio.nombre}
        </div>
        <div style={{ fontSize: '.8rem', color: 'var(--text3)', marginBottom: '.7rem' }}>
          📍 {espacio.barrio} · {espacio.m2} m²
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem' }}>
          <div>
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'var(--orange)' }}>
              {formatARS(espacio.precio_mes)}
            </span>
            <span style={{ fontSize: '.75rem', color: 'var(--text3)' }}>/mes</span>
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn-secondary" onClick={onVerDetalle} style={{ padding: '.4rem .9rem', fontSize: '.8rem', borderRadius: 'var(--r2)' }}>
              Ver detalle
            </button>
            {espacio.disponible && (
              <button className="btn-primary" onClick={onReservar} style={{ padding: '.4rem .9rem', fontSize: '.8rem', borderRadius: 'var(--r2)' }}>
                Reservar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
