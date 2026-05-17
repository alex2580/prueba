'use client';

import { useState } from 'react';
import type { FiltrosEspacios as FiltrosType, EspacioTipo } from '@/types';
import { BARRIOS } from '@/types';

interface FiltrosEspaciosProps {
  filtros: FiltrosType;
  onChange: (filtros: FiltrosType) => void;
  onReset: () => void;
}

export function FiltrosEspacios({ filtros, onChange, onReset }: FiltrosEspaciosProps) {
  const [expanded, setExpanded] = useState(false);
  const hasActive = !!(filtros.barrio || filtros.tipo || filtros.precio_max || filtros.disponible);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '.5rem' }}>
      {/* Barrio */}
      <select
        value={filtros.barrio || ''}
        onChange={e => onChange({ ...filtros, barrio: e.target.value || undefined })}
        style={{
          width: 'auto',
          padding: '.4rem .8rem',
          borderRadius: '99px',
          fontSize: '.8rem',
          background: filtros.barrio ? 'rgba(232,98,42,.12)' : 'var(--surface2)',
          borderColor: filtros.barrio ? 'var(--orange)' : 'var(--border)',
          color: filtros.barrio ? 'var(--orange)' : 'var(--text2)',
        }}
      >
        <option value="">📍 Todos los barrios</option>
        {BARRIOS.map(b => <option key={b} value={b}>{b}</option>)}
      </select>

      {/* Tipo */}
      {(['exclusivo', 'compartido'] as EspacioTipo[]).map(t => (
        <button
          key={t}
          onClick={() => onChange({ ...filtros, tipo: filtros.tipo === t ? '' : t })}
          className={`chip ${filtros.tipo === t ? 'active' : ''}`}
          style={{
            background: filtros.tipo === t ? 'var(--orange)' : 'var(--surface2)',
            color: filtros.tipo === t ? '#fff' : 'var(--text2)',
            border: `1.5px solid ${filtros.tipo === t ? 'var(--orange)' : 'var(--border)'}`,
            borderRadius: '99px',
            padding: '.32rem .85rem',
            fontSize: '.78rem',
            fontWeight: 600,
            fontFamily: 'Sora, sans-serif',
            cursor: 'pointer',
            transition: 'all .15s',
          }}
        >
          {t === 'exclusivo' ? '🔒 Exclusivo' : '🤝 Compartido'}
        </button>
      ))}

      {/* Disponible */}
      <button
        onClick={() => onChange({ ...filtros, disponible: filtros.disponible ? undefined : true })}
        style={{
          background: filtros.disponible ? 'rgba(16,185,129,.15)' : 'var(--surface2)',
          color: filtros.disponible ? 'var(--mint)' : 'var(--text2)',
          border: `1.5px solid ${filtros.disponible ? 'var(--mint)' : 'var(--border)'}`,
          borderRadius: '99px',
          padding: '.32rem .85rem',
          fontSize: '.78rem',
          fontWeight: 600,
          fontFamily: 'Sora, sans-serif',
          cursor: 'pointer',
          transition: 'all .15s',
        }}
      >
        ✅ Disponibles
      </button>

      {/* Precio max */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
        <label style={{ fontSize: '.76rem', color: 'var(--text3)', whiteSpace: 'nowrap' }}>Hasta $</label>
        <input
          type="number"
          placeholder="Precio max/mes"
          value={filtros.precio_max || ''}
          onChange={e => onChange({ ...filtros, precio_max: e.target.value ? Number(e.target.value) : undefined })}
          style={{ width: 130, padding: '.38rem .7rem', borderRadius: '99px', fontSize: '.78rem' }}
        />
      </div>

      {/* Reset */}
      {hasActive && (
        <button
          onClick={onReset}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--orange)',
            fontSize: '.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '.32rem .6rem',
            borderRadius: '99px',
          }}
        >
          ✕ Limpiar
        </button>
      )}
    </div>
  );
}
