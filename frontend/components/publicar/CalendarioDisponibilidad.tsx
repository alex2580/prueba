'use client';

import { useState } from 'react';
import { Calendar } from 'react-multi-date-picker';

const DIAS_VIGENCIA = 60;

export interface Disponibilidad {
  dias?: string[];
}

interface Props {
  precioDia: number;
  value: Disponibilidad;
  onChange: (d: Disponibilidad) => void;
}

const SEMANA = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
const MESES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function isoFromDateObj(d: any): string {
  const date = d.toDate ? d.toDate() : new Date(d);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function expandIsoRange(desde: string, hasta: string): string[] {
  const days: string[] = [];
  const cur = new Date(desde + 'T12:00:00');
  const end = new Date((hasta || desde) + 'T12:00:00');
  while (cur <= end) {
    days.push(`${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export function CalendarioDisponibilidad({ precioDia, value, onChange }: Props) {
  const [rDesde, setRDesde] = useState('');
  const [rHasta, setRHasta] = useState('');

  if (!precioDia) return null;

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const maxDate = new Date(hoy); maxDate.setDate(hoy.getDate() + DIAS_VIGENCIA - 1);
  const maxIso = maxDate.toISOString().slice(0, 10);
  const hoyIso = hoy.toISOString().slice(0, 10);

  const dias = value.dias || [];
  const selected = dias.map(iso => new Date(iso + 'T12:00:00'));
  const count = dias.length;

  function handleCalendarChange(dates: any) {
    if (!dates) { onChange({ ...value, dias: [] }); return; }
    const arr = Array.isArray(dates) ? dates : [dates];
    onChange({ ...value, dias: arr.map(isoFromDateObj).sort() });
  }

  function agregarRango() {
    if (!rDesde) return;
    const nuevos = expandIsoRange(rDesde, rHasta || rDesde);
    const merged = Array.from(new Set([...dias, ...nuevos])).sort();
    onChange({ ...value, dias: merged });
    setRDesde(''); setRHasta('');
  }

  return (
    <div style={{ background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 'var(--r2)', padding: '1rem' }}>
      <style>{`
        .rmdp-wrapper { width: 100% !important; box-shadow: none !important; background: transparent !important; }
        .rmdp-calendar { width: 100% !important; }
        .rmdp-day-picker { display: flex; gap: 1rem; flex-wrap: wrap; }
        .rmdp-header { font-family: Sora, sans-serif; font-weight: 700; }
        .rmdp-day.rmdp-selected span:not(.highlight) { background: var(--orange) !important; color: #fff !important; }
        .rmdp-day:not(.rmdp-disabled):not(.rmdp-selected) span:hover { background: rgba(232,98,42,.18) !important; color: var(--text) !important; }
        .rmdp-day.rmdp-today span { border: 1.5px solid var(--orange) !important; font-weight: 700; }
        .rmdp-arrow { border-color: var(--text2) !important; }
        .rmdp-arrow-container:hover { background: rgba(232,98,42,.1) !important; }
      `}</style>

      <div style={{ marginBottom: '.75rem' }}>
        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.88rem', marginBottom: '.6rem' }}>
          📅 Días disponibles
        </div>
        <div style={{ background: 'rgba(232,98,42,.06)', border: '1px solid rgba(232,98,42,.2)', borderRadius: 8, padding: '.6rem .85rem', display: 'grid', gap: '.25rem' }}>
          <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--orange)', fontFamily: 'Sora, sans-serif' }}>¿Cómo marcar tu disponibilidad?</div>
          <div style={{ fontSize: '.72rem', color: 'var(--text2)', display: 'flex', gap: '.4rem' }}>
            <span>📅</span><span><strong>Día suelto:</strong> tocá cualquier día del calendario para marcarlo o desmarcarlo.</span>
          </div>
          <div style={{ fontSize: '.72rem', color: 'var(--text2)', display: 'flex', gap: '.4rem' }}>
            <span>📆</span><span><strong>Rango de fechas:</strong> completá Desde y Hasta en el panel inferior y tocá <em>+ Agregar rango</em>.</span>
          </div>
          <div style={{ fontSize: '.72rem', color: 'var(--text2)', display: 'flex', gap: '.4rem' }}>
            <span>✨</span><span>Podés combinar días sueltos y múltiples rangos en una misma publicación.</span>
          </div>
        </div>
      </div>

      <Calendar
        multiple
        value={selected}
        onChange={handleCalendarChange}
        numberOfMonths={2}
        minDate={hoy}
        maxDate={maxDate}
        weekDays={SEMANA}
        months={MESES}
        weekStartDayIndex={1}
        className="rmdp-mobile"
      />

      {/* Agregar rango */}
      <div style={{ marginTop: '.85rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '.75rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <label style={{ fontSize: '.68rem', color: 'var(--text3)', fontWeight: 600, display: 'block', marginBottom: '.25rem' }}>Desde</label>
          <input type="date" value={rDesde} min={hoyIso} max={maxIso}
            onChange={e => setRDesde(e.target.value)}
            style={{ width: '100%', fontSize: '.82rem' }} />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <label style={{ fontSize: '.68rem', color: 'var(--text3)', fontWeight: 600, display: 'block', marginBottom: '.25rem' }}>Hasta</label>
          <input type="date" value={rHasta} min={rDesde || hoyIso} max={maxIso}
            onChange={e => setRHasta(e.target.value)}
            style={{ width: '100%', fontSize: '.82rem' }} />
        </div>
        <button type="button" onClick={agregarRango}
          style={{ padding: '.5rem .9rem', borderRadius: 'var(--r2)', border: 'none', background: 'var(--orange)', color: '#fff', fontWeight: 700, fontSize: '.8rem', cursor: rDesde ? 'pointer' : 'not-allowed', opacity: rDesde ? 1 : .5, whiteSpace: 'nowrap' }}>
          + Agregar rango
        </button>
        {count > 0 && (
          <button type="button" onClick={() => onChange({ ...value, dias: [] })}
            style={{ padding: '.5rem .75rem', borderRadius: 'var(--r2)', border: '1px solid var(--border)', background: 'none', color: 'var(--text3)', fontSize: '.78rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Limpiar
          </button>
        )}
      </div>

      {count > 0 && (
        <div style={{ marginTop: '.5rem', fontSize: '.75rem', color: 'var(--mint)', fontWeight: 600 }}>
          ✅ {count} día{count !== 1 ? 's' : ''} disponible{count !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
