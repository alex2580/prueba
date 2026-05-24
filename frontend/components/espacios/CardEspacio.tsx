'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { Espacio } from '@/types';
import { RatingDisplay } from '@/components/ui/Rating';
import { formatARS } from '@/lib/utils';
import { getFotoFallback } from '@/lib/fotosFallback';

interface CardEspacioProps {
  espacio: Espacio;
  onClick?: () => void;
}

export function CardEspacio({ espacio, onClick }: CardEspacioProps) {
  const router = useRouter();

  function handleClick() {
    if (onClick) {
      onClick();
    } else {
      router.push(`/espacio/${espacio.id}`);
    }
  }

  const imgSrc = espacio.imgs?.[0] || espacio.img_principal || getFotoFallback(espacio.id);

  return (
    <article className="espacio-card" onClick={handleClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}>

      <div className="espacio-card__img">
        <img
          src={imgSrc}
          alt={espacio.nombre}
          loading="lazy"
          onError={(e) => { e.currentTarget.src = getFotoFallback(espacio.id); }}
        />
        <div className="espacio-card__overlay" />

        {/* Badge */}
        {espacio.badge && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: 'rgba(10,14,26,.85)',
            border: '1px solid var(--border)',
            borderRadius: '99px',
            padding: '3px 10px',
            fontSize: '11px',
            fontFamily: 'Sora, sans-serif',
            fontWeight: 700,
            color: 'var(--text)',
            backdropFilter: 'blur(6px)',
          }}>
            {espacio.badge}
          </div>
        )}

        {/* Tipo */}
        <div style={{
          position: 'absolute', bottom: 10, right: 10,
        }}>
          <span className={`pill ${espacio.tipo === 'exclusivo' ? 'pill--blue' : 'pill--orange'}`}>
            {espacio.tipo === 'exclusivo' ? '🔒 Exclusivo' : '🤝 Compartido'}
          </span>
        </div>

        {/* No disponible overlay */}
        {!espacio.disponible && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(10,14,26,.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700, color: 'var(--text2)', fontFamily: 'Sora, sans-serif',
          }}>
            No disponible
          </div>
        )}
      </div>

      <div className="espacio-card__body">
        <div className="espacio-card__title">{espacio.nombre}</div>
        <div className="espacio-card__address">📍 {espacio.barrio} · {espacio.m2} m²</div>

        <div className="espacio-card__meta">
          <RatingDisplay value={espacio.rating ?? 0} count={espacio.reviews_count} size="sm" />
          {espacio.reservas_mes > 0 && (
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
              · {espacio.reservas_mes} reservas este mes
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '.4rem' }}>
          <span className="espacio-card__price">{formatARS(espacio.precio_mes)}</span>
          <span className="espacio-card__price-label">/mes</span>
          <span style={{ fontSize: '11px', color: 'var(--text3)', marginLeft: 'auto' }}>
            {formatARS(espacio.precio_dia)}/día
          </span>
        </div>
      </div>
    </article>
  );
}
