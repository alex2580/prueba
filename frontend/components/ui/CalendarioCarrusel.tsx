'use client';

import { useRef, useState } from 'react';

interface Props {
  children: React.ReactNode[];
}

export function CalendarioCarrusel({ children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [indice, setIndice] = useState(0);
  const total = children.length;

  function irA(i: number) {
    const el = scrollRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(total - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    setIndice(next);
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (!el.clientWidth) return;
    setIndice(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: 'flex', width: '100%', overflowX: 'auto', scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
        }}
      >
        {children.map((child, i) => (
          <div key={i} style={{ flex: '0 0 100%', width: '100%', minWidth: 0, scrollSnapAlign: 'start' }}>
            {child}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => irA(indice - 1)}
        disabled={indice === 0}
        aria-label="Mes anterior"
        style={{
          position: 'absolute', top: '1.6rem', left: -6, zIndex: 5,
          width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--border2)',
          background: 'var(--surface)', color: 'var(--text)', cursor: indice === 0 ? 'default' : 'pointer',
          opacity: indice === 0 ? .35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '.9rem', boxShadow: 'var(--s1)',
        }}
      >‹</button>
      <button
        type="button"
        onClick={() => irA(indice + 1)}
        disabled={indice === total - 1}
        aria-label="Mes siguiente"
        style={{
          position: 'absolute', top: '1.6rem', right: -6, zIndex: 5,
          width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--border2)',
          background: 'var(--surface)', color: 'var(--text)', cursor: indice === total - 1 ? 'default' : 'pointer',
          opacity: indice === total - 1 ? .35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '.9rem', boxShadow: 'var(--s1)',
        }}
      >›</button>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '.35rem', marginTop: '.5rem' }}>
        {children.map((_, i) => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: i === indice ? 'var(--orange)' : 'var(--border2)',
            transition: 'background .15s',
          }} />
        ))}
      </div>
    </div>
  );
}
