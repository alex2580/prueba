'use client';

import { useState } from 'react';
import type { Espacio, Reserva } from '@/types';
import { Button } from '@/components/ui/Button';
import { EstadoBadge } from '@/components/ui/Badge';
import { formatARS, formatFechaCorta, netoOferente, COMISION_TMC } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface PanelOferenteProps {
  espacios: Espacio[];
  reservas: Reserva[];
  loading?: boolean;
  onEliminarEspacio?: (id: string) => void;
  onToggleDisponible?: (id: string, disponible: boolean) => void;
}

export function PanelOferente({ espacios, reservas, loading, onEliminarEspacio, onToggleDisponible }: PanelOferenteProps) {
  const router = useRouter();
  const [tab, setTab] = useState<'espacios' | 'reservas'>('espacios');

  const reservasPagas = reservas.filter(r => ['pagada', 'finalizada'].includes(r.estado));
  const ingresosTotal = reservasPagas.reduce((acc, r) => acc + netoOferente(r.precio_total), 0);

  const ahora = new Date();
  const ingresosMes = reservasPagas
    .filter(r => { const d = new Date(r.created_at); return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear(); })
    .reduce((acc, r) => acc + netoOferente(r.precio_total), 0);

  const pendientesCount = reservas.filter(r => r.estado === 'pendiente').length;

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { emoji: '📦', label: 'Mis espacios', value: espacios.length },
          { emoji: '📅', label: 'Reservas recibidas', value: reservas.length },
          { emoji: '⏳', label: 'Pendientes', value: pendientesCount, color: 'var(--amber)' },
          { emoji: '📆', label: 'Ingresos del mes', value: formatARS(ingresosMes), color: 'var(--blue)', sub: `neto -${COMISION_TMC * 100}% TMC` },
          { emoji: '💰', label: 'Ingresos totales', value: formatARS(ingresosTotal), color: 'var(--mint)', sub: `neto -${COMISION_TMC * 100}% TMC` },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '1rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '.3rem' }}>{stat.emoji}</div>
            <div style={{ fontSize: '1.3rem', fontFamily: 'Sora, sans-serif', fontWeight: 800, color: stat.color || 'var(--text)' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{stat.label}</div>
            {'sub' in stat && stat.sub && (
              <div style={{ fontSize: '.65rem', color: 'var(--text3)', marginTop: '.15rem', opacity: .7 }}>{stat.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '.5rem' }}>
        {(['espacios', 'reservas'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none', border: 'none',
              fontFamily: 'Sora, sans-serif',
              fontWeight: tab === t ? 700 : 500,
              color: tab === t ? 'var(--orange)' : 'var(--text2)',
              borderBottom: `2px solid ${tab === t ? 'var(--orange)' : 'transparent'}`,
              paddingBottom: '.5rem',
              cursor: 'pointer',
              fontSize: '.9rem',
            }}
          >
            {t === 'espacios' ? `Mis espacios (${espacios.length})` : `📅 Reservas (${reservas.length})`}
          </button>
        ))}
      </div>

      {tab === 'espacios' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <Button variant="primary" onClick={() => router.push('/publicar')} size="sm">
              ➕ Publicar espacio
            </Button>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text3)' }}>Cargando…</p>
          ) : espacios.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text3)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>📦</div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, marginBottom: '.4rem' }}>No tenés espacios publicados</div>
              <p style={{ fontSize: '.88rem' }}>Publicá tu primer espacio y empezá a recibir reservas.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {espacios.map(e => (
                <div key={e.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  {e.img_principal && (
                    <img src={e.img_principal} alt={e.nombre} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 'var(--r1)', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>{e.nombre}</div>
                    <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>📍 {e.barrio}{Number(e.m2) > 0 ? ` · ${e.m2} m²` : ''}</div>
                    <div style={{ fontSize: '.82rem', fontWeight: 700, marginTop: '.2rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                      {e.precio_dia > 0 && <span style={{ color: 'var(--orange)' }}>{formatARS(e.precio_dia)}/día</span>}
                      {e.precio_mes > 0 && <span style={{ color: 'var(--orange)' }}>{formatARS(e.precio_mes)}/mes</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', flexShrink: 0 }}>
                    <span className={`pill ${e.disponible ? 'pill--green' : 'pill--gray'}`}>
                      {e.disponible ? '✅ Activo' : '⏸️ Pausado'}
                    </span>
                    <button
                      className="btn-ghost"
                      style={{ fontSize: '.75rem' }}
                      onClick={() => onToggleDisponible?.(e.id, !e.disponible)}
                    >
                      {e.disponible ? 'Pausar' : 'Activar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'reservas' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {loading ? (
            <p style={{ color: 'var(--text3)' }}>Cargando…</p>
          ) : reservas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text3)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>📅</div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>No hay reservas aún</div>
            </div>
          ) : (
            reservas.map(r => (
              <div key={r.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '.15rem' }}>{r.espacio_nombre}</div>
                    <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>
                      👤 {r.usuario_nombre} · {formatFechaCorta(r.fecha_desde)} → {formatFechaCorta(r.fecha_hasta)}
                    </div>
                    <div style={{ fontSize: '.85rem', fontWeight: 700, marginTop: '.2rem' }}>
                      {['pagada', 'finalizada'].includes(r.estado) ? (
                        <>
                          <span style={{ color: 'var(--mint)' }}>{formatARS(netoOferente(r.precio_total))}</span>
                          <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: '.72rem', marginLeft: '.35rem' }}>
                            (bruto {formatARS(r.precio_total)})
                          </span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--orange)' }}>{formatARS(r.precio_total)}</span>
                      )}
                    </div>
                  </div>
                  <EstadoBadge estado={r.estado} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
