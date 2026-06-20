'use client';

import type { FiltrosEspacios as FiltrosType, EspacioTipo } from '@/types';

const PRECIO_MAX_DIA = 10000;
const PRECIO_STEP = 500;

interface FiltrosEspaciosProps {
  filtros: FiltrosType;
  onChange: (filtros: FiltrosType) => void;
  onReset: () => void;
  onCercaMio?: () => void;
  cercaMioActive?: boolean;
  cercaMioLoading?: boolean;
  onQuitarCercaMio?: () => void;
  geoError?: string | null;
}

export function FiltrosEspacios({
  filtros, onChange, onReset,
  onCercaMio, cercaMioActive, cercaMioLoading, onQuitarCercaMio, geoError,
}: FiltrosEspaciosProps) {
  const PRECIO_MAX = PRECIO_MAX_DIA;
  const hasActive = !!(filtros.tipo || filtros.precio_max || cercaMioActive);
  const precioVal = filtros.precio_max ?? PRECIO_MAX;

  const btnBase: React.CSSProperties = {
    flex: 1, padding: '.5rem .3rem',
    borderRadius: 10, cursor: 'pointer',
    fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.75rem',
    transition: 'all .15s', border: '1.5px solid transparent',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
  };

  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: 'linear-gradient(135deg, #e8622a, #d4521a)',
    color: '#fff', boxShadow: '0 3px 10px rgba(232,98,42,.35)',
  };

  const btnInactive: React.CSSProperties = {
    ...btnBase,
    background: '#f5f5f5',
    color: '#555', border: '1.5px solid #e8e8e8',
  };

  const btnGreen: React.CSSProperties = {
    ...btnBase,
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff', boxShadow: '0 3px 10px rgba(16,185,129,.35)',
  };

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>

      {/* Fila: Exclusivo · Compartido · Cerca mío */}
      <div>
        <div style={{ fontSize: '.68rem', fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '.6rem' }}>
          Tipo · Ubicación
        </div>
        <div style={{ display: 'flex', gap: '.4rem' }}>
          {/* Exclusivo */}
          <button
            onClick={() => onChange({ ...filtros, tipo: filtros.tipo === 'exclusivo' ? '' : 'exclusivo' as EspacioTipo })}
            style={filtros.tipo === 'exclusivo' ? btnActive : btnInactive}
          >
            <span style={{ fontSize: '1.1rem' }}>🔐</span>
            <span>Exclusivo</span>
          </button>

          {/* Compartido */}
          <button
            onClick={() => onChange({ ...filtros, tipo: filtros.tipo === 'compartido' ? '' : 'compartido' as EspacioTipo })}
            style={filtros.tipo === 'compartido' ? btnActive : btnInactive}
          >
            <span style={{ fontSize: '1.1rem' }}>🤲</span>
            <span>Compartido</span>
          </button>

          {/* Cerca mío */}
          <button
            onClick={cercaMioActive ? onQuitarCercaMio : onCercaMio}
            disabled={cercaMioLoading}
            style={cercaMioActive ? btnGreen : btnInactive}
          >
            <span style={{ fontSize: '1.1rem' }}>{cercaMioLoading ? '⏳' : '📍'}</span>
            <span>{cercaMioLoading ? 'Buscando…' : 'Cerca mío'}</span>
          </button>
        </div>
        {geoError && (
          <p style={{ fontSize: '.7rem', color: '#e8622a', marginTop: '.4rem' }}>{geoError}</p>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#f0f0f0' }} />

      {/* Precio slider */}
      <div>
        {/* Header: label + valor */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.55rem' }}>
          <div style={{ fontSize: '.68rem', fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.1em' }}>
            Precio máx/día
          </div>
          <div style={{
            fontSize: '.82rem', fontWeight: 800,
            color: precioVal < PRECIO_MAX ? '#e8622a' : '#bbb',
            background: precioVal < PRECIO_MAX ? 'rgba(232,98,42,.08)' : 'transparent',
            padding: '2px 8px', borderRadius: 6,
          }}>
            {precioVal < PRECIO_MAX ? `$${precioVal.toLocaleString('es-AR')}` : 'Sin límite'}
          </div>
        </div>

        {/* Slider */}
        <input
          type="range"
          min={0} max={PRECIO_MAX} step={PRECIO_STEP}
          value={precioVal > PRECIO_MAX ? PRECIO_MAX : precioVal}
          onChange={e => {
            const val = Number(e.target.value);
            onChange({ ...filtros, precio_max: val < PRECIO_MAX ? val : undefined });
          }}
          style={{ width: '100%', accentColor: '#e8622a', cursor: 'pointer', height: 4 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.67rem', color: '#bbb', marginTop: '.3rem' }}>
          <span>$0</span>
          <span>$10.000+</span>
        </div>
      </div>

      {/* Limpiar */}
      {hasActive && (
        <>
          <div style={{ height: 1, background: '#f0f0f0' }} />
          <button
            onClick={() => { onReset(); onQuitarCercaMio?.(); }}
            style={{
              background: 'none', border: 'none',
              color: '#e8622a', fontSize: '.78rem', fontWeight: 700,
              cursor: 'pointer', padding: '.2rem 0', fontFamily: 'Sora, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.35rem',
            }}
          >
            ✕ Limpiar todos los filtros
          </button>
        </>
      )}
    </div>
  );
}
