'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { pagosAPI } from '@/lib/api';
import { parseMPReturnParams, formatARS } from '@/lib/mercadopago';
import { Button } from '@/components/ui/Button';
import { SiteLogo } from '@/components/ui/SiteLogo';

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
    const fallback = status === 'success' ? 'pagada' : status === 'failure' ? 'cancelada' : 'pendiente';

    let attempts = 0;
    const MAX_ATTEMPTS = 15;

    const check = async () => {
      try {
        const data = await pagosAPI.estado(id, token);
        setEstado(data.estado);
        setMonto(data.precio_total);
        setLoading(false);
        if (data.estado === 'pagada' || data.estado === 'cancelada') return;
      } catch {
        setEstado(fallback);
        setLoading(false);
        return;
      }

      attempts++;
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(check, 3000);
      }
    };

    check();
  }, [id, token, authLoading, router, searchParams]);

  if (loading || authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: 'var(--bg)', color: 'var(--text3)' }}>
        <div style={{ fontSize: '2rem' }}>⏳</div>
        <div>Verificando pago…</div>
      </div>
    );
  }

  const isPagada    = estado === 'pagada';
  const isCancelada = estado === 'cancelada';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header className="site-header">
        <SiteLogo onClick={() => router.push('/')} />
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
