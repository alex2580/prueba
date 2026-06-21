'use client';

import { useState, useRef } from 'react';
import { Calendar } from 'react-multi-date-picker';

const Cal = Calendar as any;
const SEMANA = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
const MESES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const POPOVER_WIDTH = 320;

function toISO(d: any): string {
  const date = d.toDate ? d.toDate() : new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fmt(iso?: string): string {
  if (!iso) return '';
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

interface Props {
  fechaDesde?: string;
  fechaHasta?: string;
  onChange: (fechaDesde?: string, fechaHasta?: string) => void;
}

export function FiltroFechas({ fechaDesde, fechaHasta, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  const rangeValue = fechaDesde
    ? [new Date(fechaDesde + 'T12:00:00'), new Date((fechaHasta || fechaDesde) + 'T12:00:00')]
    : [];

  function abrir() {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 8, left: Math.max(8, Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 24)) });
    setOpen(true);
  }

  function handleChange(range: any) {
    if (!Array.isArray(range) || range.length === 0) { onChange(undefined, undefined); return; }
    const [start, end] = range;
    const desde = start ? toISO(start) : undefined;
    const hasta = end ? toISO(end) : desde;
    onChange(desde, hasta);
    if (start && end) setOpen(false);
  }

  function limpiar(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(undefined, undefined);
  }

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);

  return (
    <>
      <div
        ref={btnRef}
        onClick={() => (open ? setOpen(false) : abrir())}
        style={{
          display: 'flex', alignItems: 'center', gap: '.6rem', cursor: 'pointer', flexShrink: 0,
          background: 'var(--surface)', border: `1.5px solid ${fechaDesde ? 'var(--text)' : 'var(--border2)'}`,
          borderRadius: 'var(--r4)', padding: '.55rem .9rem', boxShadow: 'var(--s1)',
        }}
      >
        <span style={{ fontSize: '1rem' }}>📅</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', fontFamily: 'Sora, sans-serif' }}>
          <div>
            <div style={{ fontSize: '.6rem', color: 'var(--text3)', fontWeight: 700 }}>Llegada</div>
            <div style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>{fmt(fechaDesde) || '¿Cuándo?'}</div>
          </div>
          <span style={{ color: 'var(--text3)' }}>→</span>
          <div>
            <div style={{ fontSize: '.6rem', color: 'var(--text3)', fontWeight: 700 }}>Salida</div>
            <div style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>{fmt(fechaHasta) || '¿Cuándo?'}</div>
          </div>
        </div>
        {fechaDesde && (
          <button
            onClick={limpiar}
            style={{
              background: 'var(--surface3)', border: 'none', borderRadius: '50%',
              width: 20, height: 20, fontSize: '.65rem', cursor: 'pointer', color: 'var(--text2)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        )}
      </div>

      {open && pos && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 499 }} />
          <div style={{
            position: 'fixed', top: pos.top, left: pos.left, zIndex: 500, width: POPOVER_WIDTH,
            background: 'var(--surface)', border: '1.5px solid var(--border)',
            borderRadius: 'var(--r3)', padding: '1rem', boxShadow: 'var(--s3)',
          }}>
            <style>{`
              .rmdp-wrapper { width: 100% !important; box-shadow: none !important; }
              .rmdp-calendar { width: 100% !important; }
              .rmdp-range { background: rgba(232,98,42,.15) !important; color: var(--text) !important; }
              .rmdp-range.start span, .rmdp-range.end span { background: var(--orange) !important; color: #fff !important; }
              .rmdp-range.start, .rmdp-range.end { background: var(--orange) !important; }
              .rmdp-day:not(.rmdp-disabled):not(.rmdp-range) span:hover { background: rgba(232,98,42,.2) !important; }
              .rmdp-day.rmdp-today span { border: 1.5px solid var(--orange) !important; font-weight: 700; }
            `}</style>
            <Cal
              range
              value={rangeValue}
              onChange={handleChange}
              numberOfMonths={1}
              minDate={hoy}
              weekDays={SEMANA}
              months={MESES}
              weekStartDayIndex={1}
            />
          </div>
        </>
      )}
    </>
  );
}
