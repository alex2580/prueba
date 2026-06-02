'use client';

import { useState } from 'react';
import {
  format, addMonths, subMonths,
  isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isToday, isBefore, isAfter, startOfToday, addDays,
} from 'date-fns';
import { es } from 'date-fns/locale';

const DIAS_VIGENCIA = 90;

export interface Disponibilidad {
  dias?: string[];   // ['2026-05-21', ...]
  meses?: string[];  // ['2026-05', ...]
}

interface Props {
  precioDia: number;
  precioMes: number;
  value: Disponibilidad;
  onChange: (d: Disponibilidad) => void;
}

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

function CalendarioDias({ dias, onChange }: { dias: string[]; onChange: (d: string[]) => void }) {
  const [mes, setMes] = useState(new Date());
  const hoy = startOfToday();
  const limite = addDays(hoy, DIAS_VIGENCIA);

  const inicio = startOfWeek(startOfMonth(mes), { weekStartsOn: 1 });
  const fin    = endOfWeek(endOfMonth(mes),     { weekStartsOn: 1 });
  const celdas = eachDayOfInterval({ start: inicio, end: fin });

  function toggleDia(fecha: Date) {
    if (isBefore(fecha, hoy) || isAfter(fecha, limite)) return;
    const key = format(fecha, 'yyyy-MM-dd');
    if (dias.includes(key)) {
      onChange(dias.filter(d => d !== key));
    } else {
      onChange([...dias, key].sort());
    }
  }

  return (
    <div>
      {/* Navegación mes */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
        <button type="button" onClick={() => setMes(m => subMonths(m, 1))}
          style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '1.1rem', padding: '4px 8px' }}>
          ‹
        </button>
        <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.9rem', color: 'var(--text)', textTransform: 'capitalize' }}>
          {format(mes, 'MMMM yyyy', { locale: es })}
        </span>
        <button type="button" onClick={() => setMes(m => addMonths(m, 1))}
          style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '1.1rem', padding: '4px 8px' }}>
          ›
        </button>
      </div>

      {/* Cabecera días */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '.68rem', color: 'var(--text3)', fontWeight: 600, padding: '2px 0' }}>{d}</div>
        ))}
      </div>

      {/* Celdas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {celdas.map(dia => {
          const key       = format(dia, 'yyyy-MM-dd');
          const pasado    = isBefore(dia, hoy);
          const fuera     = isAfter(dia, limite);
          const bloqueado = pasado || fuera;
          const delMes    = isSameMonth(dia, mes);
          const selected  = dias.includes(key);
          const esHoy     = isToday(dia);

          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleDia(dia)}
              disabled={bloqueado}
              title={fuera ? 'Fuera del período de vigencia (90 días)' : undefined}
              style={{
                padding: '6px 2px',
                borderRadius: 6,
                border: esHoy ? '1.5px solid var(--orange)' : '1.5px solid transparent',
                background: selected ? 'var(--orange)' : 'transparent',
                color: selected ? '#fff' : bloqueado || !delMes ? 'var(--text3)' : 'var(--text)',
                fontSize: '.78rem',
                fontWeight: selected ? 700 : 400,
                cursor: bloqueado ? 'not-allowed' : 'pointer',
                opacity: !delMes ? 0.3 : fuera ? 0.25 : 1,
                transition: 'all .1s',
              }}
            >
              {format(dia, 'd')}
            </button>
          );
        })}
      </div>

      {dias.length > 0 && (
        <div style={{ marginTop: '.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '.75rem', color: 'var(--mint)' }}>
            ✅ {dias.length} día{dias.length !== 1 ? 's' : ''} disponible{dias.length !== 1 ? 's' : ''}
          </span>
          <button type="button" onClick={() => onChange([])}
            style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '.72rem', cursor: 'pointer' }}>
            Limpiar
          </button>
        </div>
      )}
    </div>
  );
}

const MESES_COMPLETOS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_CAB = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function SelectorMeses({ meses, onChange }: { meses: string[]; onChange: (m: string[]) => void }) {
  // Límite: mes actual (idx 0) + 2 meses más = 3 meses en total
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const now = new Date();
  const minView = new Date(now.getFullYear(), now.getMonth(), 1);
  const maxView = new Date(now.getFullYear(), now.getMonth() + 2, 1); // +2 → 3 meses totales

  const year = viewDate.getFullYear();
  const mi   = viewDate.getMonth();
  const key  = `${year}-${String(mi + 1).padStart(2, '0')}`;
  const selected = meses.includes(key);

  const canPrev = viewDate > minView;
  const canNext = viewDate < maxView;

  const firstDow   = new Date(year, mi, 1).getDay();
  const daysInMonth = new Date(year, mi + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function toggleMes() {
    if (selected) onChange(meses.filter(m => m !== key));
    else onChange([...meses, key].sort());
  }

  function prevMonth() {
    if (canPrev) setViewDate(new Date(year, mi - 1, 1));
  }
  function nextMonth() {
    if (canNext) setViewDate(new Date(year, mi + 1, 1));
  }

  return (
    <div>
      {/* Indicador de modo — igual que en reservar */}
      <div style={{
        fontSize: '.72rem', fontWeight: 600, borderRadius: 6,
        padding: '.25rem .65rem', marginBottom: '.75rem',
        color: selected ? '#3b82f6' : 'var(--text3)',
        background: selected ? 'rgba(59,130,246,.1)' : 'rgba(0,0,0,.03)',
        border: `1px solid ${selected ? 'rgba(59,130,246,.25)' : 'var(--border)'}`,
      }}>
        {selected
          ? `🗓 ${MESES_COMPLETOS[mi]} marcado como disponible — tocá de nuevo para quitar`
          : '🗓 Tocá el calendario para marcar el mes completo como disponible'}
      </div>

      {/* Navegación mes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
        <button type="button" onClick={prevMonth}
          style={{ background: 'none', border: 'none', cursor: canPrev ? 'pointer' : 'default', fontSize: '1rem', color: 'var(--text2)', padding: '.2rem .5rem', opacity: canPrev ? 1 : 0.25 }}>
          ←
        </button>
        <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.88rem' }}>
          {MESES_COMPLETOS[mi]} {year}
        </span>
        <button type="button" onClick={nextMonth}
          style={{ background: 'none', border: 'none', cursor: canNext ? 'pointer' : 'default', fontSize: '1rem', color: 'var(--text2)', padding: '.2rem .5rem', opacity: canNext ? 1 : 0.25 }}>
          →
        </button>
      </div>

      {/* Grilla de días — click en cualquier celda togglea el mes */}
      <div onClick={toggleMes} style={{ cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {DIAS_CAB.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '.62rem', color: '#aaa', fontWeight: 700, padding: '.2rem 0', letterSpacing: '.02em' }}>{d}</div>
          ))}
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            return (
              <div key={i} style={{
                textAlign: 'center', fontSize: '.78rem', padding: '.32rem .1rem',
                borderRadius: 6, transition: 'all .1s',
                background: selected ? 'rgba(59,130,246,.85)' : 'rgba(16,185,129,.07)',
                color: selected ? '#fff' : 'var(--text)',
                border: selected ? '1.5px solid #3b82f6' : '1px solid rgba(16,185,129,.2)',
                fontWeight: selected ? 700 : 400,
              }}>
                {d}
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumen total */}
      {meses.length > 0 && (
        <div style={{ marginTop: '.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '.75rem', color: 'var(--mint)' }}>
            ✅ {meses.length} mes{meses.length !== 1 ? 'es' : ''} disponible{meses.length !== 1 ? 's' : ''}
          </span>
          <button type="button" onClick={e => { e.stopPropagation(); onChange([]); }}
            style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '.72rem', cursor: 'pointer' }}>
            Limpiar
          </button>
        </div>
      )}
    </div>
  );
}

export function CalendarioDisponibilidad({ precioDia, precioMes, value, onChange }: Props) {
  const tieneDia = precioDia > 0;
  const tieneMes = precioMes > 0;

  if (!tieneDia && !tieneMes) return null;

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface2)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--r2)',
    padding: '1rem',
  };

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {tieneDia && (
        <div style={cardStyle}>
          <div style={{ marginBottom: '.75rem' }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.88rem', marginBottom: '.2rem' }}>
              📅 Días disponibles
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>
              Seleccioná los días en que tu espacio está disponible para reservar por día.
            </div>
          </div>
          <CalendarioDias
            dias={value.dias || []}
            onChange={dias => onChange({ ...value, dias })}
          />
        </div>
      )}

      {tieneMes && (
        <div style={cardStyle}>
          <div style={{ marginBottom: '.75rem' }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.88rem', marginBottom: '.2rem' }}>
              🗓️ Meses disponibles
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>
              Seleccioná los meses en que tu espacio está disponible para reservar por mes.
            </div>
          </div>
          <SelectorMeses
            meses={value.meses || []}
            onChange={meses => onChange({ ...value, meses })}
          />
        </div>
      )}
    </div>
  );
}
