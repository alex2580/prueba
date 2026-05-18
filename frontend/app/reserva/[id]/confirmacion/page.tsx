'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { pagosAPI } from '@/lib/api';
import { parseMPReturnParams, formatARS } from '@/lib/mercadopago';
import { Button } from '@/components/ui/Button';

export default function ConfirmacionPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const searchParams = useSearchParams();
  const { token, loading: authLoading } = useAuth();

  const [estado, setEstado] = useState<string | null>(null);
  const [monto, setMonto]   = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.push('/'); return; }

    const { status } = parseMPReturnParams(searchParams);
    const estadoParam = status || searchParams.get('estado') || 'pending';

    pagosAPI.estado(id, token)
      .then(data => {
        setEstado(data.estado);
        setMonto(data.precio_total);
      })
      .catch(() => {
        setEstado(estadoParam === 'success' ? 'pagada' : estadoParam === 'failure' ? 'cancelada' : 'pendiente');
      })
      .finally(() => setLoading(false));
  }, [id, token, authLoading, router, searchParams]);

  if (loading || authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text3)' }}>
        Verificando pago…
      </div>
    );
  }

  const isPagada    = estado === 'pagada';
  const isCancelada = estado === 'cancelada';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header className="site-header">
        <div className="logo" onClick={() => router.push('/')}>
          <span style={{ fontSize: '1.4rem' }}>📦</span>
          <span>Todas<span style={{ color: 'var(--orange)' }}>Mis</span>Cosas</span>
        </div>
        <div />
        <button className="nav-btn" onClick={() => router.push('/panel')}>Mi Panel</button>
      </header>

      {/* Content — starts 10px below the sticky header via page-scroll padding */}
      <div className="page-scroll" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', paddingTop: '10px' }}>
        <div style={{ maxWidth: 480, width: '100%', padding: '2rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            {isPagada ? '🎉' : isCancelada ? '❌' : '⏳'}
          </div>
          <h1 style={{
            fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.6rem',
            marginBottom: '.5rem',
            color: isPagada ? 'var(--mint)' : isCancelada ? 'var(--red)' : 'var(--amber)',
          }}>
            {isPagada ? '¡Reserva confirmada!' : isCancelada ? 'Pago rechazado' : 'Pago pendiente'}
          </h1>

          <p style={{ color: 'var(--text2)', fontSize: '.95rem', marginBottom: '1.5rem', lineHeight: 1.65 }}>
            {isPagada
              ? `Tu reserva fue pagada exitosamente.${monto ? ` Total: ${formatARS(monto)}` : ''} Recibirás un email de confirmación.`
              : isCancelada
              ? 'El pago fue rechazado o cancelado. Podés intentar nuevamente desde Mi Panel.'
              : 'El pago está siendo procesado. Te notificaremos por email cuando se acredite.'}
          </p>

          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => router.push('/panel')}>
              Ir a Mi Panel
            </Button>
            {!isPagada && !isCancelada && (
              <Button variant="secondary" onClick={() => router.push(`/reserva/${id}/checkout`)}>
                Reintentar pago
              </Button>
            )}
            <Button variant="ghost" onClick={() => router.push('/')}>
              Explorar más espacios
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
