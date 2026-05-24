'use client';

import { useState } from 'react';
import { getFotosFallback, getFotoFallback } from '@/lib/fotosFallback';

interface GaleriaFotosProps {
  imgs: string[];
  nombre: string;
  espacioId?: string;
}

export function GaleriaFotos({ imgs, nombre, espacioId }: GaleriaFotosProps) {
  const displayImgs = imgs.length > 0 ? imgs : (espacioId ? getFotosFallback(espacioId, 4) : []);
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!displayImgs.length) return (
    <div style={{ height: 360, background: 'var(--surface2)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '4rem', borderRadius: 'var(--r3)' }}>
      📦
    </div>
  );

  function prev() { setCurrent(i => (i - 1 + displayImgs.length) % displayImgs.length); }
  function next() { setCurrent(i => (i + 1) % displayImgs.length); }

  return (
    <>
      <div style={{ position: 'relative', borderRadius: 'var(--r3)', overflow: 'hidden' }}>
        {/* Main image */}
        <div style={{ position: 'relative', height: 360, cursor: 'zoom-in' }}
          onClick={() => setLightbox(true)}>
          <img
            src={displayImgs[current]}
            alt={`${nombre} — foto ${current + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => { if (espacioId) e.currentTarget.src = getFotoFallback(espacioId); }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(10,14,26,0) 60%, rgba(10,14,26,.5) 100%)',
          }} />

          {/* Counter */}
          <div style={{
            position: 'absolute', bottom: 12, right: 12,
            background: 'rgba(10,14,26,.75)',
            backdropFilter: 'blur(6px)',
            borderRadius: '99px',
            padding: '4px 12px',
            fontSize: '12px', fontWeight: 600, color: 'var(--text)',
          }}>
            {current + 1} / {displayImgs.length}
          </div>
        </div>

        {/* Arrows */}
        {displayImgs.length > 1 && (
          <>
            <button onClick={prev} style={arrowStyle('left')}>‹</button>
            <button onClick={next} style={arrowStyle('right')}>›</button>
          </>
        )}

        {/* Thumbnails */}
        {displayImgs.length > 1 && (
          <div style={{
            display: 'flex', gap: '.4rem', padding: '.6rem .8rem',
            background: 'var(--surface2)',
            overflowX: 'auto',
          }}>
            {displayImgs.map((img, i) => (
              <div
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  width: 60, height: 44, borderRadius: 'var(--r0)',
                  overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
                  border: `2px solid ${i === current ? 'var(--orange)' : 'transparent'}`,
                  transition: 'border-color .15s',
                }}
              >
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => { if (espacioId) e.currentTarget.src = getFotoFallback(espacioId); }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setLightbox(false)}
        >
          <img
            src={displayImgs[current]}
            alt={nombre}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 'var(--r2)' }}
            onClick={e => e.stopPropagation()}
            onError={(e) => { if (espacioId) e.currentTarget.src = getFotoFallback(espacioId); }}
          />
          <button
            onClick={() => setLightbox(false)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.15)',
              border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '99px', fontSize: 18 }}
          >✕</button>
          {displayImgs.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prev(); }} style={{ ...arrowStyle('left'), position: 'fixed', left: 16 }}>‹</button>
              <button onClick={e => { e.stopPropagation(); next(); }} style={{ ...arrowStyle('right'), position: 'fixed', right: 16 }}>›</button>
            </>
          )}
        </div>
      )}
    </>
  );
}

function arrowStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%',
    [side]: 10,
    transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,.9)',
    border: 'none',
    color: '#111',
    width: 36, height: 36,
    borderRadius: '99px',
    fontSize: 22,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: 'var(--s2)',
    cursor: 'pointer',
    zIndex: 5,
  };
}
