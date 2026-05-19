'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { reservasAPI, pagosAPI } from '@/lib/api';
import type { Reserva } from '@/types';
import { CheckoutReserva } from '@/components/reservas/CheckoutReserva';
import { redirectToMP } from '@/lib/mercadopago';
import { SiteLogo } from '@/components/ui/SiteLogo';

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [reserva, setReserva]   = useState<Reserva | null>(null);
  const [loading, setLoading]   = useState(true);
  const [paying, setPaying]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) { router.push('/'); return; }

    reservasAPI.obtener(id, token)
      .then(setReserva)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, token, user, authLoading, router]);

  async function handlePagar() {
    if (!token || !reserva) return;
    setPaying(true);
    setError(null);
    try {
      const pref = await pagosAPI.crearPreferencia(reserva.id, token);
      // Redirect to MercadoPago
      redirectToMP(pref.init_point);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago');
      setPaying(false);
    }
  }

  if (loading || authLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text3)' }}>Cargando…</div>;
  }

  if (error && !reserva) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text2)', gap: '1rem' }}>
        <p>{error}</p>
        <button className="btn-secondary" onClick={() => router.push('/panel')}>Ir a Mi Panel</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="site-header">
        <SiteLogo onClick={() => router.push('/')} />
        <div />
        <button className="nav-btn" onClick={() => router.back()}>← Volver</button>
      </header>

      <div className="page-scroll">
        <div style={{ maxWidth: 580, margin: '0 auto', padding: '2rem 1rem' }}>
          {reserva && (
            <CheckoutReserva
              reserva={reserva}
              onPagar={handlePagar}
              loading={paying}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
}
