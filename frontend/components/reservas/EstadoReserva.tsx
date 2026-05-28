'use client';

import type { Reserva } from '@/types';
import { EstadoBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatARS, formatFechaCorta, diasEntre } from '@/lib/utils';
import { TimelineReserva } from '@/components/reservas/TimelineReserva';
import { SEGURIDAD_OPCIONES } from '@/components/publicar/SeguridadChecklist';

interface EstadoReservaProps {
  reserva: Reserva;
  onCancelar?: () => void;
  onPagar?: () => void;
  onCalificar?: () => void;
  onExtender?: () => void;
  onEliminar?: () => void;
}

export function EstadoReserva({ reserva, onCancelar, onPagar, onCalificar, onExtender, onEliminar }: EstadoReservaProps) {
  const dias = diasEntre(reserva.fecha_desde, reserva.fecha_hasta);

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r3)', padding: '1.2rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '.2rem' }}>
            {reserva.espacio_nombre || `Reserva #${reserva.id.slice(0, 8)}`}
          </div>
          <div style={{ fontSize: '.8rem', color: 'var(--text3)' }}>
            {reserva.espacio_barrio && `📍 ${reserva.espacio_barrio}`}
          </div>
        </div>
        <EstadoBadge estado={reserva.estado} />
      </div>

      <TimelineReserva estado={reserva.estado} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', margin: '1rem 0 .9rem' }}>
        {[
          ['📅 Desde', formatFechaCorta(reserva.fecha_desde)],
          ['📅 Hasta',  formatFechaCorta(reserva.fecha_hasta)],
          ['⏱️ Duración', `${dias} día${dias !== 1 ? 's' : ''}`],
          ['💰 Total',  formatARS(reserva.precio_total)],
        ].map(([label, val]) => (
          <div key={label} style={{ background: 'var(--surface2)', borderRadius: 'var(--r1)', padding: '.6rem .8rem' }}>
            <div style={{ fontSize: '.7rem', color: 'var(--text3)', marginBottom: '.15rem' }}>{label}</div>
            <div style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--text)' }}>{val}</div>
          </div>
        ))}
      </div>

      {reserva.pin_acceso && ['confirmada', 'pagada', 'activa', 'finalizada'].includes(reserva.estado) && (
        <div style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 'var(--r2)', padding: '.75rem 1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '.9rem',
        }}>
          <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>🔑 PIN de acceso</div>
          <div style={{ fontFamily: 'monospace', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '.2em', color: 'var(--orange)' }}>
            {reserva.pin_acceso}
          </div>
        </div>
      )}

      {reserva.espacio_seguridad && (() => {
        const activos = SEGURIDAD_OPCIONES.filter(o => reserva.espacio_seguridad![o.key]);
        if (activos.length === 0) return null;
        const stars = Math.round((activos.length / SEGURIDAD_OPCIONES.length) * 5);
        return (
          <div style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 'var(--r2)', padding: '.75rem 1rem', marginBottom: '.9rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.6rem' }}>
              <div style={{ fontSize: '.78rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                🛡️ Seguridad del espacio
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                <span style={{ color: 'var(--orange)', fontSize: '.85rem', letterSpacing: 1 }}>
                  {[1,2,3,4,5].map(n => (
                    <span key={n} style={{ opacity: n <= stars ? 1 : 0.2 }}>★</span>
                  ))}
                </span>
                <span style={{ fontSize: '.68rem', color: 'var(--text3)' }}>{activos.length}/{SEGURIDAD_OPCIONES.length}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
              {activos.map(opt => (
                <span key={opt.key} style={{
                  background: 'rgba(232,98,42,.1)', border: '1px solid rgba(232,98,42,.25)',
                  borderRadius: '999px', padding: '.2rem .6rem',
                  fontSize: '.72rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '.3rem',
                }}>
                  {opt.emoji} {opt.label}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {(reserva.estado === 'pendiente' || reserva.estado === 'confirmada') && (
        <div style={{ display: 'flex', gap: '.6rem' }}>
          {reserva.estado === 'confirmada' && onPagar && (
            <Button variant="primary" onClick={onPagar} size="sm" style={{ flex: 1 }}>
              💳 Pagar ahora
            </Button>
          )}
          {onCancelar && (
            <Button variant="ghost" onClick={onCancelar} size="sm"
              style={{ flex: reserva.estado === 'pendiente' ? 1 : 'unset', color: 'var(--red)' }}>
              Cancelar
            </Button>
          )}
        </div>
      )}
      {(reserva.estado === 'pagada' || reserva.estado === 'finalizada') && (
        <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {reserva.estado === 'pagada' && onExtender && (
            <Button variant="secondary" onClick={onExtender} size="sm">
              📅 Extender reserva
            </Button>
          )}
          {onCalificar && (
            <Button variant="secondary" onClick={onCalificar} size="sm">
              ⭐ Calificar espacio
            </Button>
          )}
        </div>
      )}

      {['cancelada', 'finalizada'].includes(reserva.estado) && onEliminar && (
        <div style={{ marginTop: '.6rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onEliminar}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '.75rem', color: 'var(--text3)',
              display: 'flex', alignItems: 'center', gap: '.3rem',
              padding: '.25rem .5rem', borderRadius: 'var(--r1)',
              transition: 'color .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
          >
            🗑️ Borrar del historial
          </button>
        </div>
      )}
    </div>
  );
}
