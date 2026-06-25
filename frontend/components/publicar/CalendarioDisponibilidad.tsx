'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'react-multi-date-picker';

const DIAS_VIGENCIA = 90;

export interface Disponibilidad {
  dias?: string[];
}

interface Props {
  precioDia: number;
  value: Disponibilidad;
  onChange: (d: Disponibilidad) => void;
}

const Cal = Calendar as any;
const SEMANA = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
const MESES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function expandRanges(ranges: any[]): string[] {
  const days = new Set<string>();
  if (!Array.isArray(ranges)) return [];
  ranges.forEach((r: any) => {
    if (!Array.isArray(r)) return;
    const [start, end] = r;
    if (!start) return;
    const toMs = (d: any) => (d.toDate ? d.toDate() : new Date(d)).setHours(12, 0, 0, 0);
    const cur = new Date(toMs(start));
    const e   = new Date(end ? toMs(end) : toMs(start));
    while (cur <= e) {
      days.add(`${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`);
      cur.setDate(cur.getDate() + 1);
    }
  });
  return Array.from(days).sort();
}

function groupToRanges(days: string[]): Date[][] {
  if (!days.length) return [];
  const s = [...days].sort();
  const ranges: Date[][] = [];
  let start = s[0]; let prev = s[0];
  for (let i = 1; i < s.length; i++) {
    const diff = (new Date(s[i] + 'T12:00:00').getTime() - new Date(prev + 'T12:00:00').getTime()) / 86400000;
    if (diff === 1) { prev = s[i]; }
    else { ranges.push([new Date(start + 'T12:00:00'), new Date(prev + 'T12:00:00')]); start = s[i]; prev = s[i]; }
  }
  ranges.push([new Date(start + 'T12:00:00'), new Date(prev + 'T12:00:00')]);
  return ranges;
}

export function CalendarioDisponibilidad({ precioDia, value, onChange }: Props) {
  const [rangesValue, setRangesValue] = useState<any[]>(() => groupToRanges(value.dias || []));

  // 2 meses lado a lado no entran en pantallas chicas — ver el mismo fix en
  // /espacio/[id]/reservar. Arranca en 2 (igual que SSR) y se ajusta recién
  // después de montar, para no generar un hydration mismatch.
  const [numMeses, setNumMeses] = useState(2);
  useEffect(() => {
    function actualizarNumMeses() { setNumMeses(window.innerWidth <= 640 ? 1 : 2); }
    actualizarNumMeses();
    window.addEventListener('resize', actualizarNumMeses);
    return () => window.removeEventListener('resize', actualizarNumMeses);
  }, []);

  if (!precioDia) return null;

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const maxDate = new Date(hoy); maxDate.setDate(hoy.getDate() + DIAS_VIGENCIA - 1);
  const count = value.dias?.length ?? 0;

  function handleChange(ranges: any) {
    const next = ranges ?? [];
    setRangesValue(next);
    onChange({ ...value, dias: expandRanges(next) });
  }

  function limpiar() {
    setRangesValue([]);
    onChange({ ...value, dias: [] });
  }

  return (
    <div style={{ background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 'var(--r2)', padding: '1rem' }}>
      <style>{`
        .calendario-mes .rmdp-wrapper { width: 100% !important; box-shadow: none !important; background: transparent !important; }
        .calendario-mes .rmdp-calendar { width: 100% !important; }
        .calendario-mes .rmdp-day-picker { display: flex; gap: .6rem; flex-wrap: nowrap; }
        .calendario-mes .rmdp-day-picker > div { flex: 1; min-width: 0; }
        .calendario-mes .rmdp-header { font-family: Sora, sans-serif; font-weight: 700; }
        .calendario-mes .rmdp-range { background: rgba(232,98,42,.15) !important; color: var(--text) !important; }
        .calendario-mes .rmdp-range.start span, .calendario-mes .rmdp-range.end span { background: var(--orange) !important; color: #fff !important; }
        .calendario-mes .rmdp-range.start, .calendario-mes .rmdp-range.end { background: var(--orange) !important; }
        .calendario-mes .rmdp-day:not(.rmdp-disabled):not(.rmdp-range) span:hover { background: rgba(232,98,42,.2) !important; }
        .calendario-mes .rmdp-day.rmdp-today span { border: 1.5px solid var(--orange) !important; font-weight: 700; }
        .calendario-mes .rmdp-arrow-container:hover { background: rgba(232,98,42,.1) !important; }
      `}</style>

      <div style={{ marginBottom: '.75rem' }}>
        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.88rem', marginBottom: '.6rem' }}>
          📅 Días disponibles
        </div>
        <div style={{ background: 'rgba(232,98,42,.06)', border: '1px solid rgba(232,98,42,.2)', borderRadius: 8, padding: '.65rem .85rem', display: 'grid', gap: '.35rem' }}>
          <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--orange)', fontFamily: 'Sora, sans-serif', marginBottom: '.1rem' }}>¿Cómo marcar tu disponibilidad?</div>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start' }}>
            <span style={{ background: 'var(--orange)', color: '#fff', borderRadius: 5, padding: '1px 6px', fontSize: '.65rem', fontWeight: 800, whiteSpace: 'nowrap', marginTop: 1 }}>1 click</span>
            <span style={{ fontSize: '.72rem', color: 'var(--text2)' }}><strong>Día suelto</strong> — hacé click en el día que querés y luego otro click en el mismo día para confirmarlo.</span>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start' }}>
            <span style={{ background: 'var(--orange)', color: '#fff', borderRadius: 5, padding: '1px 6px', fontSize: '.65rem', fontWeight: 800, whiteSpace: 'nowrap', marginTop: 1 }}>rango</span>
            <span style={{ fontSize: '.72rem', color: 'var(--text2)' }}><strong>Período corrido</strong> — click en el primer día, click en el último día. Todo lo del medio queda marcado automáticamente.</span>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start' }}>
            <span style={{ background: 'rgba(232,98,42,.2)', color: 'var(--orange)', borderRadius: 5, padding: '1px 6px', fontSize: '.65rem', fontWeight: 800, whiteSpace: 'nowrap', marginTop: 1 }}>+más</span>
            <span style={{ fontSize: '.72rem', color: 'var(--text2)' }}>Repetí para agregar tantos días sueltos y rangos como quieras en una misma publicación.</span>
          </div>
        </div>
      </div>

      <div className="calendario-mes">
        <Cal
          multiple
          range
          value={rangesValue}
          onChange={handleChange}
          numberOfMonths={numMeses}
          minDate={hoy}
          maxDate={maxDate}
          weekDays={SEMANA}
          months={MESES}
          weekStartDayIndex={1}
          className="rmdp-mobile"
        />
      </div>
      <div style={{ fontSize: '.68rem', color: 'var(--text3)', textAlign: 'center', marginTop: '.3rem' }}>
        ‹ Usá las flechas o deslizá para ver los próximos meses ›
      </div>

      <div style={{ marginTop: '.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {count > 0
          ? <span style={{ fontSize: '.75rem', color: 'var(--mint)', fontWeight: 600 }}>✅ {count} día{count !== 1 ? 's' : ''} seleccionado{count !== 1 ? 's' : ''}</span>
          : <span />}
        {count > 0 && (
          <button type="button" onClick={limpiar}
            style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '.72rem', cursor: 'pointer' }}>
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
