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
  const [imgIdx, setImgIdx] = useState(0);

  function handleClick() {
    if (onClick) {
      onClick();
    } else {
      router.push(`/espacio/${espacio.id}`);
    }
  }

  const imgs: string[] = espacio.imgs?.length
    ? espacio.imgs
    : espacio.img_principal
      ? [espacio.img_principal]
      : [getFotoFallback(espacio.id)];

  const imgSrc = imgs[imgIdx];
  const accentColor = espacio.tipo === 'exclusivo' ? 'var(--text)' : 'var(--orange)';
  const hasDia = (espacio.precio_dia ?? 0) > 0;
  const hasMes = (espacio.precio_mes ?? 0) > 0;

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

        {/* Carousel navigation */}
        {imgs.length > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + imgs.length) % imgs.length); }}
              style={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,.45)', border: 'none', color: '#fff',
                borderRadius: '50%', width: 26, height: 26,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '.85rem', zIndex: 2,
              }}
            >‹</button>
            <button
              onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % imgs.length); }}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,.45)', border: 'none', color: '#fff',
                borderRadius: '50%', width: 26, height: 26,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '.85rem', zIndex: 2,
              }}
            >›</button>
            <div style={{ position: 'absolute', bottom: 34, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 3, zIndex: 2 }}>
              {imgs.map((_, i) => (
                <div
                  key={i}
                  onClick={e => { e.stopPropagation(); setImgIdx(i); }}
                  style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: i === imgIdx ? '#fff' : 'rgba(255,255,255,.5)',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </>
        )}

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
            zIndex: 2,
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
            zIndex: 2,
          }}>
            {espacio.badge}
          </div>
        )}

        {/* Tipo */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 2 }}>
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
            zIndex: 3,
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

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '.4rem', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '.6rem', marginTop: '.1rem' }}>
          {hasMes && (
            <>
              <span className="espacio-card__price" style={{ color: accentColor }}>{formatARS(espacio.precio_mes)}</span>
              <span className="espacio-card__price-label">/mes</span>
            </>
          )}
          {hasDia && !hasMes && (
            <>
              <span className="espacio-card__price" style={{ color: accentColor }}>{formatARS(espacio.precio_dia)}</span>
              <span className="espacio-card__price-label">/día</span>
            </>
          )}
          {hasDia && hasMes && (
            <span style={{ fontSize: '11px', color: 'var(--text3)', marginLeft: 'auto' }}>
              {formatARS(espacio.precio_dia)}/día
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
