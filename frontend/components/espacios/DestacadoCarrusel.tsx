'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Espacio } from '@/types';
import { formatARS } from '@/lib/utils';

const AUTOPLAY_MS = 5000;

type Slide = { espacio: Espacio; img: string | null };
type Brillo = 'clara' | 'oscura';

// Mide el brillo promedio de la MITAD INFERIOR de la imagen — es la zona
// donde va el texto, no la imagen entera. 'oscura' es el default seguro:
// si la imagen falla por CORS o error de red, nunca queda blanco-sobre-claro
// ilegible — en el peor caso queda blanco-sobre-oscuro aunque la foto en
// realidad fuera clara.
function medirBrillo(url: string): Promise<Brillo> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = 24, h = 24;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve('oscura');
        ctx.drawImage(img, 0, img.height / 2, img.width, img.height / 2, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        let total = 0;
        for (let i = 0; i < data.length; i += 4) {
          total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
        const promedio = total / (data.length / 4);
        resolve(promedio > 150 ? 'clara' : 'oscura');
      } catch {
        resolve('oscura');
      }
    };
    img.onerror = () => resolve('oscura');
    img.src = url;
  });
}

// Con más de un destacado, cada uno aporta un slide (su primera foto) — así
// entran los 3 en el carrusel. Con uno solo, no tiene sentido "desperdiciar"
// el carrusel en una sola imagen fija: en ese caso pasa a mostrar TODAS las
// fotos que cargó ese espacio, una por slide.
function armarSlides(espacios: Espacio[]): Slide[] {
  if (espacios.length === 1) {
    const e = espacios[0];
    const imgs = e.imgs?.length ? e.imgs : e.img_principal ? [e.img_principal] : [];
    return imgs.length ? imgs.map(img => ({ espacio: e, img })) : [{ espacio: e, img: null }];
  }
  return espacios.map(e => ({ espacio: e, img: e.imgs?.length ? e.imgs[0] : e.img_principal || null }));
}

export function DestacadoCarrusel({ espacios }: { espacios: Espacio[] }) {
  const [idx, setIdx] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [brillos, setBrillos] = useState<Record<string, Brillo>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slides = armarSlides(espacios);

  useEffect(() => {
    if (slides.length <= 1 || pausado) return;
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % slides.length), AUTOPLAY_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slides.length, pausado]);

  useEffect(() => {
    let cancelado = false;
    for (const { img } of slides) {
      if (!img || brillos[img] !== undefined) continue;
      medirBrillo(img).then(brillo => {
        if (!cancelado) setBrillos(prev => ({ ...prev, [img]: brillo }));
      });
    }
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.map(s => s.img).join('|')]);

  if (espacios.length === 0) return null;

  return (
    <div
      style={{ position: 'relative', width: '100vw', left: '50%', marginLeft: '-50vw', marginBottom: '2rem' }}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <div className="destacado-carrusel" style={{ position: 'relative', width: '100%', overflow: 'hidden', background: '#111' }}>
        {slides.map(({ espacio: e, img }, i) => {
          // Sin imagen, o mientras se está midiendo el brillo, 'oscura' es el
          // default seguro (texto blanco sobre foto real siempre se lee bien
          // aunque la medición todavía no haya terminado).
          const brillo: Brillo = (img && brillos[img]) || 'oscura';
          const esClara = brillo === 'clara';
          const textoColor = esClara ? '#15181f' : '#fff';
          const textoSombra = esClara ? '0 1px 3px rgba(255,255,255,.7)' : '0 2px 14px rgba(0,0,0,.55)';
          const gradiente = esClara
            ? 'linear-gradient(to top, rgba(255,255,255,.88), rgba(255,255,255,.35) 55%, transparent 75%)'
            : 'linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.2) 55%, transparent 75%)';
          const badgeBg = esClara ? 'rgba(21,24,31,.78)' : 'rgba(255,255,255,.16)';
          const badgeBorder = esClara ? 'rgba(21,24,31,.15)' : 'rgba(255,255,255,.35)';
          const hasDia = (e.precio_dia ?? 0) > 0;
          return (
            <Link
              key={`${e.id}-${i}`}
              href={`/espacio/${e.id}`}
              aria-hidden={i !== idx}
              tabIndex={i === idx ? 0 : -1}
              style={{
                position: 'absolute', inset: 0,
                opacity: i === idx ? 1 : 0,
                transition: 'opacity .7s ease',
                pointerEvents: i === idx ? 'auto' : 'none',
              }}
            >
              {img
                ? <img src={img} alt={e.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                : <div style={{ width: '100%', height: '100%', background: 'var(--bg2)' }} />
              }
              <div style={{ position: 'absolute', inset: 0, background: gradiente, transition: 'background .3s' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '1.5rem clamp(1rem,5vw,3.5rem) clamp(1.5rem,4vw,2.5rem)', color: textoColor, transition: 'color .3s' }}>
                <span style={{
                  display: 'inline-block', background: badgeBg, backdropFilter: 'blur(4px)',
                  border: `1px solid ${badgeBorder}`, borderRadius: 999, padding: '.3rem .8rem',
                  fontSize: '.72rem', fontWeight: 700, marginBottom: '.7rem', color: '#fff',
                }}>
                  {e.tipo === 'compartido' ? '🤝 Compartido' : '🔒 Exclusivo'}
                </span>
                <h2 style={{
                  fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.3rem,3.6vw,2.3rem)',
                  marginBottom: '.4rem', textShadow: textoSombra, lineHeight: 1.15,
                }}>
                  {e.nombre}
                </h2>
                <p style={{ fontSize: 'clamp(.8rem,1.4vw,1rem)', opacity: .95, fontWeight: 600 }}>
                  📍 {e.barrio}
                  {hasDia && ` · ${formatARS(e.precio_dia)}/día`}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '.4rem', zIndex: 2 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Ver imagen ${i + 1}`}
              style={{
                width: i === idx ? 22 : 8, height: 8, borderRadius: 999, border: 'none',
                background: i === idx ? '#fff' : 'rgba(255,255,255,.5)',
                cursor: 'pointer', transition: 'width .25s, background .25s', padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
