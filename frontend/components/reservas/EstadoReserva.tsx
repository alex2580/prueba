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
  onEliminar?: () => void;
  onChat?: () => void;
  onConfirmarAcceso?: () => void;
}

export function EstadoReserva({ reserva, onCancelar, onPagar, onCalificar, onExtender, onEliminar, onChat, onConfirmarAcceso }: EstadoReservaProps) {
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

      <div className="reserva-datos-grid">
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
      {reserva.estado === 'pagada' && reserva.escrow_neto_oferente != null && !reserva.escrow_liberado && (
        onConfirmarAcceso ? (
          /* Fecha de inicio llegó — mostrar botón */
          <div style={{
            background: '#0f2f1a', border: '1px solid #166534',
            borderRadius: 'var(--r2)', padding: '.9rem 1rem', marginBottom: '.75rem',
          }}>
            <p style={{ color: '#86efac', fontSize: '.8rem', margin: '0 0 .6rem', fontWeight: 700 }}>
              🔒 Tu pago está protegido en escrow
            </p>
            <p style={{ color: '#86efac', fontSize: '.75rem', margin: '0 0 .75rem', lineHeight: 1.6 }}>
              Cuando accedas al espacio, confirmá el ingreso para liberar el pago al oferente.
            </p>
            <Button variant="primary" onClick={onConfirmarAcceso} size="sm" style={{ width: '100%' }}>
              ✅ Confirmar acceso al espacio
            </Button>
          </div>
        ) : (
          /* Fecha de inicio aún no llegó — mostrar aviso */
          <div style={{
            background: '#1a1200', border: '1px solid #d97706',
            borderRadius: 'var(--r2)', padding: '.9rem 1rem', marginBottom: '.75rem',
          }}>
            <p style={{ color: '#fcd34d', fontSize: '.8rem', margin: '0 0 .4rem', fontWeight: 700 }}>
              🔒 Pago protegido en escrow
            </p>
            <p style={{ color: '#fcd34d', fontSize: '.75rem', margin: 0, lineHeight: 1.6 }}>
              Tu pago está retenido de forma segura. El <strong>{formatFechaCorta(reserva.fecha_desde)}</strong> vas a poder confirmar el acceso desde tu panel y el pago se liberará al oferente dentro de las 48 hs hábiles.
            </p>
          </div>
        )
      )}

      {reserva.estado === 'pagada' && reserva.escrow_liberado === 1 && (
        <div style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 'var(--r2)', padding: '.75rem 1rem', marginBottom: '.75rem',
          fontSize: '.78rem', color: 'var(--text3)',
        }}>
          ✅ Acceso confirmado — el pago fue liberado al oferente
        </div>
      )}

      {(reserva.estado === 'pagada' || reserva.estado === 'finalizada') && (
        <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {onChat && (
            <Button variant="secondary" onClick={onChat} size="sm">
              💬 Chat
            </Button>
          )}
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
