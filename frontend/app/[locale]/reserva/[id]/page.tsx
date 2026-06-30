'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { reservasAPI } from '@/lib/api';
import type { Reserva } from '@/types';
import { EstadoReserva } from '@/components/reservas/EstadoReserva';
import { Button } from '@/components/ui/Button';
import { SiteLogo } from '@/components/ui/SiteLogo';

export default function ReservaPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) { router.push('/'); return; }

    reservasAPI.obtener(id, token)
      .then(setReserva)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, token, user, authLoading, router]);

  if (loading || authLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text3)' }}>Cargando…</div>;
  }

  if (error || !reserva) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text2)', gap: '1rem' }}>
        <span style={{ fontSize: '3rem' }}>😕</span>
        <p>{error || 'Reserva no encontrada'}</p>
        <Button variant="secondary" onClick={() => router.push('/panel')}>Ir a Mi Panel</Button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="site-header">
        <SiteLogo onClick={() => router.push('/')} />
        <div />
        <button className="nav-btn" onClick={() => router.push('/panel')}>← Mi Panel</button>
      </header>

      <div className="page-scroll">
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1rem' }}>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.6rem', marginBottom: '1.5rem' }}>
            📅 Detalle de reserva
          </h1>
          <EstadoReserva
            reserva={reserva}
            onPagar={reserva.estado === 'confirmada' ? () => router.push(`/reserva/${id}/checkout`) : undefined}
            onCancelar={!['cancelada', 'finalizada'].includes(reserva.estado)
              ? async () => {
                if (!token) return;
                await reservasAPI.cancelar(id, token);
                router.push('/panel');
              }
              : undefined}
          />
        </div>
      </div>
    </div>
  );
}
