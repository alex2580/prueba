'use client';

import { useState } from 'react';
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
  const [favorito, setFavorito] = useState(false);

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

        {/* Favorito */}
        <button
          onClick={e => { e.stopPropagation(); setFavorito(f => !f); }}
          style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(255,255,255,.92)',
            border: 'none', borderRadius: '50%',
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '.95rem',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 8px rgba(0,0,0,.12)',
            transition: 'transform .15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.12)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
          title={favorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          {favorito ? '❤️' : '🤍'}
        </button>

        {/* Badge */}
        {espacio.badge && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: 'rgba(255,255,255,.92)',
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
        <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
          <span className={`pill ${espacio.tipo === 'exclusivo' ? 'pill--blue' : 'pill--orange'}`}>
            {espacio.tipo === 'exclusivo' ? '🔒 Exclusivo' : '🤝 Compartido'}
          </span>
        </div>

        {/* No disponible overlay */}
        {!espacio.disponible && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,255,255,.75)',
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

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '.4rem', borderTop: '1px solid var(--border)', paddingTop: '.6rem', marginTop: '.1rem' }}>
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
