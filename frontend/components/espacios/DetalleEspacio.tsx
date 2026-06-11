'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Espacio } from '@/types';
import { GaleriaFotos } from './GaleriaFotos';
import { RatingDisplay } from '@/components/ui/Rating';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatARS, formatFecha } from '@/lib/utils';
import { SEGURIDAD_OPCIONES } from '@/components/publicar/SeguridadChecklist';
import { ConsultasEspacio } from './ConsultasEspacio';

interface DetalleEspacioProps {
  espacio: Espacio;
  onReservar?: () => void;
  token?: string | null;
  userId?: string | null;
}

export function DetalleEspacio({ espacio, onReservar, token, userId }: DetalleEspacioProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'info' | 'reviews'>('info');
  const volverUrl = searchParams.get('from') === 'mapa' ? '/?vista=mapa' : '/';
  const precioColor = espacio.tipo === 'exclusivo' ? 'var(--text)' : 'var(--orange)';

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Back */}
      <button
        onClick={() => router.push(volverUrl)}
        className="btn-ghost"
        style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}
      >
        ← Volver
      </button>

      {/* Gallery */}
      <GaleriaFotos imgs={espacio.imgs} nombre={espacio.nombre} espacioId={espacio.id} />

      <div className="detalle-grid" style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left col — header + tabs */}
        <div className="detalle-info">
          {/* Header */}
          <div style={{ marginBottom: '1rem' }}>
            {espacio.badge && (
              <span className="pill pill--orange" style={{ marginBottom: '.5rem', display: 'inline-block' }}>
                {espacio.badge}
              </span>
            )}
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.6rem', lineHeight: 1.2, marginBottom: '.35rem' }}>
              {espacio.nombre}
            </h1>
            <div style={{ color: 'var(--text2)', fontSize: '.9rem', marginBottom: '.6rem' }}>
              📍 {espacio.direccion}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
              <RatingDisplay value={espacio.rating} count={espacio.reviews_count} />
              <Badge variant={espacio.tipo === 'exclusivo' ? 'blue' : 'orange'}>
                {espacio.tipo === 'exclusivo' ? '🔒 Exclusivo' : '🤝 Compartido'}
              </Badge>
              {Number(espacio.m2) > 0 ? <span style={{ fontSize: '.82rem', color: 'var(--text3)' }}>📐 {espacio.m2} m²</span> : null}
              {espacio.reservas_mes > 0 && (
                <span style={{ fontSize: '.82rem', color: 'var(--text3)' }}>
                  🔥 {espacio.reservas_mes} reservas este mes
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '.5rem' }}>
            {(['info', 'reviews'] as const).map(t => (
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
                {t === 'info' ? '📋 Descripción' : `⭐ Reseñas (${espacio.reviews_count})`}
              </button>
            ))}
          </div>

          {tab === 'info' && (
            <div>
              <p style={{ color: 'var(--text2)', lineHeight: 1.75, fontSize: '.92rem', marginBottom: '1.5rem' }}>
                {espacio.descripcion || 'Sin descripción disponible.'}
              </p>

              {/* Seguridad */}
              {espacio.seguridad && (() => {
                const activos = SEGURIDAD_OPCIONES.filter(o => espacio.seguridad![o.key]);
                if (activos.length === 0) return null;
                const stars = Math.round((activos.length / SEGURIDAD_OPCIONES.length) * 5);
                return (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.9rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <span style={{ fontSize: '1rem' }}>🛡️</span>
                        <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.92rem' }}>
                          Seguridad del espacio
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                        <span style={{ color: 'var(--orange)', fontSize: '.95rem', letterSpacing: 1 }}>
                          {[1,2,3,4,5].map(n => (
                            <span key={n} style={{ opacity: n <= stars ? 1 : 0.2 }}>★</span>
                          ))}
                        </span>
                        <span style={{ fontSize: '.75rem', color: 'var(--text3)' }}>
                          {activos.length}/{SEGURIDAD_OPCIONES.length}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.4rem' }}>
                      {activos.map(opt => (
                        <div key={opt.key} style={{
                          display: 'flex', alignItems: 'center', gap: '.55rem',
                          background: 'var(--surface2)', borderRadius: 'var(--r1)',
                          padding: '.45rem .7rem',
                          border: '1px solid rgba(232,98,42,.2)',
                        }}>
                          <span style={{ fontSize: '.95rem', flexShrink: 0 }}>{opt.emoji}</span>
                          <span style={{ fontSize: '.78rem', color: 'var(--text)', fontWeight: 500, lineHeight: 1.3 }}>{opt.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {tab === 'reviews' && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {espacio.reviews_data?.map(review => (
                <div key={review.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.6rem' }}>
                    <Avatar nombre={review.autor_nombre} size={36} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{review.autor_nombre}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{formatFecha(review.created_at)}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', color: 'var(--amber)', fontSize: '13px' }}>
                      {'★'.repeat(review.rating)}
                    </div>
                  </div>
                  <p style={{ color: 'var(--text2)', fontSize: '.88rem', lineHeight: 1.65 }}>{review.texto}</p>
                  {review.util_count > 0 && (
                    <div style={{ marginTop: '.6rem', fontSize: '.75rem', color: 'var(--text3)' }}>
                      👍 {review.util_count} personas encontraron esto útil
                    </div>
                  )}
                </div>
              )) || (
                <p style={{ color: 'var(--text3)', fontSize: '.9rem' }}>Aún no hay reseñas para este espacio.</p>
              )}
            </div>
          )}
        </div>

        {/* Right: booking panel */}
        <div className="detalle-booking" style={{ position: 'sticky', top: 80, height: 'fit-content' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r3)', padding: '1.4rem', boxShadow: 'var(--s3)' }}>
            <div style={{ marginBottom: '1rem' }}>
              {Number(espacio.precio_mes) > 0 && Number(espacio.precio_dia) > 0 ? (
                /* Ambos precios: misma jerarquía visual */
                <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', fontFamily: 'Sora, sans-serif', marginBottom: '.1rem' }}>📆 POR MES</div>
                    <div style={{ fontSize: '1.45rem', fontFamily: 'Sora, sans-serif', fontWeight: 800, color: precioColor }}>
                      {formatARS(espacio.precio_mes)}
                    </div>
                  </div>
                  <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', margin: '.1rem 0' }} />
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', fontFamily: 'Sora, sans-serif', marginBottom: '.1rem' }}>📅 POR DÍA</div>
                    <div style={{ fontSize: '1.45rem', fontFamily: 'Sora, sans-serif', fontWeight: 800, color: precioColor }}>
                      {formatARS(espacio.precio_dia)}
                    </div>
                  </div>
                </div>
              ) : (
                /* Un solo precio: display grande */
                <>
                  {Number(espacio.precio_mes) > 0 && (
                    <div style={{ fontSize: '1.6rem', fontFamily: 'Sora, sans-serif', fontWeight: 800, color: precioColor }}>
                      {formatARS(espacio.precio_mes)}
                      <span style={{ fontSize: '.9rem', color: 'var(--text3)', fontWeight: 400 }}>/mes</span>
                    </div>
                  )}
                  {Number(espacio.precio_dia) > 0 && (
                    <div style={{ fontSize: '1.6rem', fontFamily: 'Sora, sans-serif', fontWeight: 800, color: precioColor }}>
                      {formatARS(espacio.precio_dia)}
                      <span style={{ fontSize: '.9rem', color: 'var(--text3)', fontWeight: 400 }}>/día</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ display: 'grid', gap: '.7rem' }}>
              {espacio.disponible ? (
                <Button variant="primary" onClick={onReservar} style={{ width: '100%' }}>
                  📅 Reservar espacio
                </Button>
              ) : (
                <div className="alert alert--warning" style={{ justifyContent: 'center', fontWeight: 600 }}>
                  ⏳ No disponible actualmente
                </div>
              )}
            </div>

            <div style={{ marginTop: '1rem', display: 'grid', gap: '.5rem' }}>
              {[
                ...(Number(espacio.m2) > 0 ? [['📐', 'Superficie', `${espacio.m2} m²`]] : []),
                ['📍', 'Barrio', espacio.barrio],
                ['🔑', 'Tipo', espacio.tipo === 'exclusivo' ? 'Uso exclusivo' : 'Compartido'],
              ].map(([emoji, label, val]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem' }}>
                  <span style={{ color: 'var(--text3)' }}>{emoji} {label}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Consultas públicas — solo formulario, sin historial */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 1rem 2rem' }}>
        <ConsultasEspacio
          espacioId={espacio.id}
          token={token}
          userId={userId}
          oferenteId={espacio.oferente_id}
          showHistorial={false}
        />
      </div>
    </div>
  );
}
