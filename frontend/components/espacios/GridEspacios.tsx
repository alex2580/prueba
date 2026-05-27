'use client';

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

export function GridEspacios({ espacios, loading, onCardClick, favoritos, onToggleFavorito, token }: GridEspaciosProps) {
  if (loading) {
    return (
      <div className="espacios-grid">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
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
    <div className="espacios-grid">
      {espacios.map(espacio => (
        <CardEspacio
          key={espacio.id}
          espacio={espacio}
          onClick={onCardClick ? () => onCardClick(espacio) : undefined}
          isFavorito={favoritos?.has(espacio.id)}
          onToggleFavorito={onToggleFavorito}
          token={token}
        />
      ))}
    </div>
  );
}
