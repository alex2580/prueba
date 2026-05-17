'use client';

import type { Reserva } from '@/types';
import { EstadoReserva } from '@/components/reservas/EstadoReserva';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface PanelDemandanteProps {
  reservas: Reserva[];
  loading?: boolean;
  onCancelar?: (id: string) => void;
}

export function PanelDemandante({ reservas, loading, onCancelar }: PanelDemandanteProps) {
  const router = useRouter();

  const activas    = reservas.filter(r => ['pendiente', 'confirmada', 'pagada'].includes(r.estado));
  const historial  = reservas.filter(r => ['cancelada', 'finalizada'].includes(r.estado));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem' }}>
          Mis reservas
        </h2>
        <Button variant="primary" onClick={() => router.push('/')} size="sm">
          🔍 Buscar espacios
        </Button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '2rem' }}>Cargando…</div>
      ) : reservas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, marginBottom: '.5rem', fontSize: '1.05rem' }}>
            No tenés reservas aún
          </div>
          <p style={{ fontSize: '.88rem', marginBottom: '1.2rem' }}>
            Explorá espacios disponibles en Buenos Aires.
          </p>
          <Button variant="primary" onClick={() => router.push('/')}>
            Explorar espacios
          </Button>
        </div>
      ) : (
        <div>
          {activas.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.75rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.75rem' }}>
                Reservas activas ({activas.length})
              </div>
              <div style={{ display: 'grid', gap: '.85rem' }}>
                {activas.map(r => (
                  <EstadoReserva
                    key={r.id}
                    reserva={r}
                    onCancelar={onCancelar ? () => onCancelar(r.id) : undefined}
                    onPagar={r.estado === 'confirmada' ? () => router.push(`/reserva/${r.id}/checkout`) : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {historial.length > 0 && (
            <div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.75rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.75rem' }}>
                Historial ({historial.length})
              </div>
              <div style={{ display: 'grid', gap: '.85rem' }}>
                {historial.map(r => (
                  <EstadoReserva key={r.id} reserva={r} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
