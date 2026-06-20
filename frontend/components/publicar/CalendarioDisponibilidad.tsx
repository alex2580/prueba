'use client';

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

export function CalendarioDisponibilidad({ precioDia, value, onChange }: Props) {
  if (!precioDia) return null;

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const maxDate = new Date(hoy); maxDate.setDate(hoy.getDate() + DIAS_VIGENCIA - 1);

  const selected = (value.dias || []).map(iso => new Date(iso + 'T12:00:00'));

  function handleChange(dates: any) {
    if (!dates) { onChange({ ...value, dias: [] }); return; }
    const arr = Array.isArray(dates) ? dates : [dates];
    const isos = arr.map(isoFromDateObj).sort();
    onChange({ ...value, dias: isos });
  }

  const count = value.dias?.length ?? 0;

  return (
    <div style={{ background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 'var(--r2)', padding: '1rem' }}>
      <style>{`
        .rmdp-wrapper { width: 100% !important; box-shadow: none !important; background: transparent !important; }
        .rmdp-calendar { width: 100% !important; }
        .rmdp-day-picker { display: flex; gap: 1rem; flex-wrap: wrap; }
        .rmdp-month-picker, .rmdp-year-picker { background: var(--surface2) !important; }
        .rmdp-header { font-family: Sora, sans-serif; font-weight: 700; }
        .rmdp-day.rmdp-selected span:not(.highlight) { background: var(--orange) !important; color: #fff !important; }
        .rmdp-day:not(.rmdp-disabled):not(.rmdp-day-hidden) span:hover { background: rgba(232,98,42,.18) !important; color: var(--text) !important; }
        .rmdp-arrow { border-color: var(--text2) !important; }
        .rmdp-arrow-container:hover { background: rgba(232,98,42,.1) !important; }
        .rmdp-today span { border: 1.5px solid var(--orange) !important; font-weight: 700; }
      `}</style>

      <div style={{ marginBottom: '.75rem' }}>
        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.88rem', marginBottom: '.2rem' }}>
          📅 Días disponibles
        </div>
        <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>
          Seleccioná los días en que tu espacio está disponible. Tocá para marcar o desmarcar.
        </div>
      </div>

      <Calendar
        multiple
        value={selected}
        onChange={handleChange}
        numberOfMonths={2}
        minDate={hoy}
        maxDate={maxDate}
        weekDays={SEMANA}
        months={MESES}
        weekStartDayIndex={1}
        className="rmdp-mobile"
      />

      {count > 0 && (
        <div style={{ marginTop: '.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '.75rem', color: 'var(--mint)' }}>
            ✅ {count} día{count !== 1 ? 's' : ''} disponible{count !== 1 ? 's' : ''}
          </span>
          <button type="button" onClick={() => onChange({ ...value, dias: [] })}
            style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '.72rem', cursor: 'pointer' }}>
            Limpiar
          </button>
        </div>
      )}
    </div>
  );
}
