'use client';

import { useState } from 'react';
import type { Reserva } from '@/types';
import { Button } from '@/components/ui/Button';
import { formatARS, formatFechaCorta, diasEntre } from '@/lib/utils';
import { SERVICIOS_ADICIONALES } from '@/types';
import type { ServicioTipo } from '@/types';

interface CheckoutReservaProps {
  reserva: Reserva;
  onPagar: () => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function CheckoutReserva({ reserva, onPagar, loading, error }: CheckoutReservaProps) {
  const [servicios, setServiciosState] = useState<ServicioTipo[]>([]);

  function toggleServicio(tipo: ServicioTipo) {
    setServiciosState(prev =>
      prev.includes(tipo) ? prev.filter(s => s !== tipo) : [...prev, tipo]
    );
  }

  const serviciosTotal = servicios.reduce(
    (acc, s) => acc + SERVICIOS_ADICIONALES[s].precio,
    0
  );

  const total = reserva.precio_total + serviciosTotal;
  const dias  = diasEntre(reserva.fecha_desde, reserva.fecha_hasta);

  return (
    <div style={{ maxWidth: 540, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.5rem', marginBottom: '1.5rem' }}>
        💳 Checkout
      </h1>

      {/* Resumen */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r3)', padding: '1.2rem', marginBottom: '1.2rem',
      }}>
        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, marginBottom: '.8rem', fontSize: '.85rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
          Resumen de reserva
        </div>
        <div style={{ display: 'grid', gap: '.5rem' }}>
          {[
            ['Espacio', reserva.espacio_nombre || '—'],
            ['Fechas', `${formatFechaCorta(reserva.fecha_desde)} → ${formatFechaCorta(reserva.fecha_hasta)}`],
            ['Duración', `${dias} día${dias !== 1 ? 's' : ''}`],
            ['Subtotal', formatARS(reserva.precio_total)],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.88rem' }}>
              <span style={{ color: 'var(--text2)' }}>{label}</span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Servicios adicionales */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r3)', padding: '1.2rem', marginBottom: '1.2rem',
      }}>
        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, marginBottom: '.8rem', fontSize: '.85rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
          Servicios adicionales
        </div>
        <div style={{ display: 'grid', gap: '.6rem' }}>
          {(Object.entries(SERVICIOS_ADICIONALES) as [ServicioTipo, typeof SERVICIOS_ADICIONALES[ServicioTipo]][]).map(([tipo, cfg]) => {
            const active = servicios.includes(tipo);
            return (
              <div
                key={tipo}
                onClick={() => toggleServicio(tipo)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.75rem',
                  padding: '.7rem .9rem',
                  background: active ? 'rgba(232,98,42,.08)' : 'var(--surface2)',
                  border: `1.5px solid ${active ? 'rgba(232,98,42,.3)' : 'var(--border)'}`,
                  borderRadius: 'var(--r2)',
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{cfg.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.88rem', fontWeight: 600 }}>{cfg.label}</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{formatARS(cfg.precio)}</div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  background: active ? 'var(--orange)' : 'var(--surface3)',
                  border: `2px solid ${active ? 'var(--orange)' : 'var(--border2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: '#fff',
                }}>
                  {active ? '✓' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Total */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r3)', padding: '1.2rem', marginBottom: '1.2rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1rem' }}>Total a pagar</span>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: 'var(--orange)' }}>
            {formatARS(total)}
          </span>
        </div>
      </div>

      {error && <div className="alert alert--error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <Button variant="primary" onClick={onPagar} loading={loading} style={{ width: '100%', fontSize: '1rem', padding: '.85rem' }}>
        🛡️ Pagar con MercadoPago
      </Button>

      <p style={{ textAlign: 'center', fontSize: '.75rem', color: 'var(--text3)', marginTop: '.75rem' }}>
        Serás redirigido a MercadoPago de forma segura 🔒
      </p>
    </div>
  );
}
