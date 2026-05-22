'use client';

import type { FiltrosEspacios as FiltrosType, EspacioTipo } from '@/types';

const PRECIO_MAX = 100000;
const PRECIO_STEP = 500;

interface FiltrosEspaciosProps {
  filtros: FiltrosType;
  onChange: (filtros: FiltrosType) => void;
  onReset: () => void;
}

export function FiltrosEspacios({ filtros, onChange, onReset }: FiltrosEspaciosProps) {
  const hasActive = !!(filtros.tipo || filtros.precio_max);
  const precioVal = filtros.precio_max ?? PRECIO_MAX;

  return (
    <div style={{ display: 'grid', gap: '1.2rem' }}>

      {/* Tipo */}
      <div>
        <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.5rem' }}>
          Tipo de espacio
        </div>
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
          {(['exclusivo', 'compartido'] as EspacioTipo[]).map(t => (
            <button
              key={t}
              onClick={() => onChange({ ...filtros, tipo: filtros.tipo === t ? '' : t })}
              style={{
                background: filtros.tipo === t ? 'var(--orange)' : 'var(--surface)',
                color: filtros.tipo === t ? '#fff' : 'var(--text2)',
                border: `1.5px solid ${filtros.tipo === t ? 'var(--orange)' : 'var(--border)'}`,
                borderRadius: '99px', padding: '.35rem .9rem',
                fontSize: '.8rem', fontWeight: 600, fontFamily: 'Sora, sans-serif',
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              {t === 'exclusivo' ? '🔐 Exclusivo' : '🤲 Compartido'}
            </button>
          ))}
        </div>
      </div>

      {/* Precio slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
          <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Precio máx/mes
          </div>
          <div style={{ fontSize: '.82rem', fontWeight: 700, color: precioVal < PRECIO_MAX ? 'var(--orange)' : 'var(--text3)' }}>
            {precioVal < PRECIO_MAX ? `$${precioVal.toLocaleString('es-AR')}` : 'Sin límite'}
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={PRECIO_MAX}
          step={PRECIO_STEP}
          value={precioVal}
          onChange={e => {
            const val = Number(e.target.value);
            onChange({ ...filtros, precio_max: val < PRECIO_MAX ? val : undefined });
          }}
          style={{ width: '100%', accentColor: 'var(--orange)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem', color: 'var(--text3)', marginTop: '.2rem' }}>
          <span>$0</span>
          <span>$100.000+</span>
        </div>
      </div>

      {/* Reset */}
      {hasActive && (
        <button
          onClick={onReset}
          style={{
            background: 'rgba(232,98,42,.1)', border: '1.5px solid var(--orange)',
            color: 'var(--orange)', fontSize: '.78rem', fontWeight: 700,
            cursor: 'pointer', padding: '.4rem .8rem', borderRadius: '99px',
            width: '100%', fontFamily: 'Sora, sans-serif',
          }}
        >
          ✕ Limpiar filtros
        </button>
      )}
    </div>
  );
}
