'use client';

import type { ReservaEstado } from '@/types';

interface Paso {
  label: string;
  desc: string;
  emoji: string;
}

const PASOS: Paso[] = [
  { emoji: '📋', label: 'Solicitada',     desc: 'Reserva enviada al oferente'      },
  { emoji: '✅', label: 'Confirmada',     desc: 'El oferente aprobó tu solicitud'  },
  { emoji: '💳', label: 'Pago realizado', desc: 'Pago acreditado correctamente'   },
];

// Maps reservation state to how many steps are "done"
function estadoAPasos(estado: ReservaEstado): number {
  switch (estado) {
    case 'pendiente':   return 1;
    case 'confirmada':  return 2;
    case 'pagada':
    case 'finalizada':  return 3;
    default:            return 0; // cancelada
  }
}

export function TimelineReserva({ estado }: { estado: ReservaEstado }) {
  if (estado === 'cancelada') return null;

  const done = estadoAPasos(estado);

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>

        {/* Línea de fondo */}
        <div style={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          height: 2,
          background: 'var(--border)',
          zIndex: 0,
        }} />

        {/* Línea de progreso */}
        <div style={{
          position: 'absolute',
          top: 16,
          left: 16,
          height: 2,
          width: `${Math.max(0, ((done - 1) / (PASOS.length - 1)) * (100 - 8))}%`,
          background: 'linear-gradient(90deg, var(--mint), var(--orange))',
          zIndex: 1,
          transition: 'width .4s ease',
        }} />

        {PASOS.map((paso, i) => {
          const isDone    = i < done;
          const isActive  = i === done - 1;
          const isPending = i >= done;

          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '.35rem',
                position: 'relative',
                zIndex: 2,
              }}
            >
              {/* Círculo */}
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isDone ? '1rem' : '.8rem',
                fontWeight: 800,
                background: isDone
                  ? (isActive ? 'var(--orange)' : 'var(--mint)')
                  : 'var(--surface2)',
                border: `2px solid ${isDone ? (isActive ? 'var(--orange)' : 'var(--mint)') : 'var(--border)'}`,
                color: isDone ? '#fff' : 'var(--text3)',
                transition: 'all .3s',
                boxShadow: isActive ? '0 0 0 4px rgba(232,98,42,.15)' : 'none',
              }}>
                {isDone ? paso.emoji : i + 1}
              </div>

              {/* Texto */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '.65rem',
                  fontWeight: isDone ? 700 : 400,
                  color: isDone ? (isActive ? 'var(--orange)' : 'var(--mint)') : 'var(--text3)',
                  fontFamily: 'Sora, sans-serif',
                  lineHeight: 1.3,
                }}>
                  {paso.label}
                </div>
                {isActive && (
                  <div style={{ fontSize: '.58rem', color: 'var(--text3)', marginTop: '.1rem', lineHeight: 1.3 }}>
                    {paso.desc}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {estado === 'finalizada' && (
        <div style={{
          marginTop: '.9rem',
          textAlign: 'center',
          fontSize: '.75rem',
          color: 'var(--mint)',
          fontWeight: 600,
        }}>
          🏁 Estadía finalizada — ¡gracias por usar TodasMisCosas!
        </div>
      )}
    </div>
  );
}
