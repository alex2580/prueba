'use client';

import { useState, FormEvent } from 'react';
import type { Espacio } from '@/types';
import { Button } from '@/components/ui/Button';
import { calcularPrecio, formatARS, diasEntre } from '@/lib/utils';

interface FormReservaProps {
  espacio: Espacio;
  onSubmit: (desde: string, hasta: string, notas: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function FormReserva({ espacio, onSubmit, loading, error }: FormReservaProps) {
  const hoy = new Date().toISOString().slice(0, 10);
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState('');
  const [notas, setNotas] = useState('');

  const dias = desde && hasta ? diasEntre(desde, hasta) : 0;
  const total = desde && hasta && dias > 0 ? calcularPrecio(desde, hasta, espacio.precio_dia, espacio.precio_mes) : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!desde || !hasta || dias <= 0) return;
    await onSubmit(desde, hasta, notas);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
      <div className="form-row">
        <div>
          <label className="form-label">Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
            min={hoy} required />
        </div>
        <div>
          <label className="form-label">Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
            min={desde || hoy} required />
        </div>
      </div>

      <div>
        <label className="form-label">Notas (opcional)</label>
        <textarea
          value={notas}
          onChange={e => setNotas(e.target.value)}
          placeholder="Indicá qué vas a guardar, horario de entrega, etc."
          rows={3}
        />
      </div>

      {/* Price breakdown */}
      {total > 0 && (
        <div style={{
          background: 'rgba(130,196,255,.06)',
          border: '1px solid rgba(130,196,255,.15)',
          borderRadius: 'var(--r2)',
          padding: '.8rem 1rem',
          display: 'grid',
          gap: '.35rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.83rem', color: 'var(--text2)' }}>
            <span>Duración</span>
            <span>{dias} día{dias !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.83rem', color: 'var(--text2)' }}>
            <span>Precio {dias >= 28 ? 'mensual' : 'diario'}</span>
            <span>{formatARS(dias >= 28 ? espacio.precio_mes : espacio.precio_dia)}</span>
          </div>
          <div style={{ height: 1, background: 'var(--border)', margin: '.2rem 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Sora, sans-serif', fontWeight: 800 }}>
            <span style={{ color: 'var(--text)' }}>Total</span>
            <span style={{ color: 'var(--orange)', fontSize: '1.05rem' }}>{formatARS(total)}</span>
          </div>
        </div>
      )}

      {error && <div className="alert alert--error">{error}</div>}

      <Button type="submit" loading={loading} disabled={!desde || !hasta || dias <= 0}
        style={{ width: '100%' }}>
        📅 Confirmar reserva
      </Button>
    </form>
  );
}
