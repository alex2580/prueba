'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import type { Espacio } from '@/types';
import { CardEspacio } from './CardEspacio';

interface GridEspaciosProps {
  espacios: Espacio[];
  loading?: boolean;
  onCardClick?: (espacio: Espacio) => void;
  favoritos?: Set<string>;
  onToggleFavorito?: (id: string, val: boolean) => void;
  token?: string | null;
}

// El grid usa grid-auto-flow: column (para tener 2 filas fijas con
// scroll horizontal), lo que de otro modo llenaría columna por columna
// (fila 1 y 2 alternadas). Reordenamos los items para que, al leerse
// por columna, la fila 1 quede completa primero y la 2 sea el resto.
function intercalarFilas<T>(items: T[], filas = 2): T[] {
  const porFila = Math.ceil(items.length / filas);
  const grupos: T[][] = Array.from({ length: filas }, (_, f) => items.slice(f * porFila, (f + 1) * porFila));
  const resultado: T[] = [];
  for (let i = 0; i < porFila; i++) {
    for (let f = 0; f < filas; f++) {
      if (grupos[f][i] !== undefined) resultado.push(grupos[f][i]);
    }
  }
  return resultado;
}

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r3)',
      overflow: 'hidden',
    }}>
      <div className="skeleton" style={{ height: 200 }} />
      <div style={{ padding: '1rem 1.1rem', display: 'grid', gap: '.6rem' }}>
        <div className="skeleton" style={{ height: 20, width: '70%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 14, width: '50%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 16, width: '40%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 22, width: '55%', borderRadius: 6 }} />
      </div>
    </div>
  );
}

function GridScrollArrows({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const actualizar = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    actualizar();
    window.addEventListener('resize', actualizar);
    return () => window.removeEventListener('resize', actualizar);
  }, [actualizar, children]);

  function mover(dir: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  }

  return (
    <div className="espacios-grid-wrap">
      <button
        type="button"
        className="espacios-grid-arrow espacios-grid-arrow--left"
        onClick={() => mover(-1)}
        disabled={!canLeft}
        aria-label="Ver espacios anteriores"
      >‹</button>
      <div className="espacios-grid" ref={scrollRef} onScroll={actualizar}>
        {children}
      </div>
      <button
        type="button"
        className="espacios-grid-arrow espacios-grid-arrow--right"
        onClick={() => mover(1)}
        disabled={!canRight}
        aria-label="Ver más espacios"
      >›</button>
    </div>
  );
}

export function GridEspacios({ espacios, loading, onCardClick, favoritos, onToggleFavorito, token }: GridEspaciosProps) {
  if (loading) {
    return (
      <GridScrollArrows>
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </GridScrollArrows>
    );
  }

  if (!espacios.length) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text2)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '.5rem' }}>
          No hay espacios con esos filtros
        </div>
        <div style={{ fontSize: '.88rem' }}>
          Probá ajustando los filtros o buscando en otro barrio.
        </div>
      </div>
    );
  }

  return (
    <GridScrollArrows>
      {intercalarFilas(espacios).map(espacio => (
        <CardEspacio
          key={espacio.id}
          espacio={espacio}
          onClick={onCardClick ? () => onCardClick(espacio) : undefined}
          isFavorito={favoritos?.has(espacio.id)}
          onToggleFavorito={onToggleFavorito}
          token={token}
        />
      ))}
    </GridScrollArrows>
  );
}
