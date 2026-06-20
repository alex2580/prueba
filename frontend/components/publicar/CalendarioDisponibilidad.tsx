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
  dias?: string[];
}

interface Props {
  precioDia: number;
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '.68rem', color: 'var(--text3)', fontWeight: 600, padding: '2px 0' }}>{d}</div>
        ))}
      </div>

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

export function CalendarioDisponibilidad({ precioDia, value, onChange }: Props) {
  if (!precioDia) return null;

  return (
    <div style={{ background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 'var(--r2)', padding: '1rem' }}>
      <div style={{ marginBottom: '.75rem' }}>
        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.88rem', marginBottom: '.2rem' }}>
          📅 Días disponibles
        </div>
        <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>
          Seleccioná los días en que tu espacio está disponible para reservar.
        </div>
      </div>
      <CalendarioDias
        dias={value.dias || []}
        onChange={dias => onChange({ ...value, dias })}
      />
    </div>
  );
}
