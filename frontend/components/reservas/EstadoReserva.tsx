'use client';

import type { Reserva } from '@/types';
import { EstadoBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatARS, formatFechaCorta, diasEntre } from '@/lib/utils';
import { TimelineReserva } from '@/components/reservas/TimelineReserva';

interface EstadoReservaProps {
  reserva: Reserva;
  onCancelar?: () => void;
  onPagar?: () => void;
  onCalificar?: () => void;
  onExtender?: () => void;
}

export function EstadoReserva({ reserva, onCancelar, onPagar, onCalificar, onExtender }: EstadoReservaProps) {
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
    </div>
  );
}
