'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { espaciosAPI, reservasAPI, pagosAPI, adminAPI } from '@/lib/api';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Button } from '@/components/ui/Button';
import type { Espacio } from '@/types';
import { SERVICIOS_ADICIONALES } from '@/types';
import type { ServicioTipo } from '@/types';
import { formatARS, calcularPrecio, diasEntre } from '@/lib/utils';

// ─── Mini Calendar ──────────────────────────────────────────────

function MiniCalendar({
  diasDisponibles,
  fechaDesde,
  fechaHasta,
  onSelect,
}: {
  diasDisponibles?: string[];
  fechaDesde: string;
  fechaHasta: string;
  onSelect: (desde: string, hasta: string) => void;
}) {
  const [month, setMonth] = useState(() => new Date());
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const year = month.getFullYear();
  const mi = month.getMonth();
  const firstDay = new Date(year, mi, 1).getDay();
  const daysInMonth = new Date(year, mi + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, mi, d));

  function toISO(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function isAvail(d: Date) {
    if (!diasDisponibles?.length) return true;
    return diasDisponibles.includes(toISO(d));
  }
  function inRange(d: Date) {
    if (!fechaDesde || !fechaHasta) return false;
    const iso = toISO(d);
    return iso > fechaDesde && iso < fechaHasta;
  }
  function isEdge(d: Date) {
    const iso = toISO(d);
    return iso === fechaDesde || iso === fechaHasta;
  }

  function handleClick(d: Date) {
    if (d < today || !isAvail(d)) return;
    const iso = toISO(d);
    if (!fechaDesde || (fechaDesde && fechaHasta)) {
      onSelect(iso, '');
    } else if (iso < fechaDesde) {
      onSelect(iso, fechaDesde);
    } else {
      onSelect(fechaDesde, iso);
    }
  }

  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
        <button
          onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text2)', padding: '.2rem .5rem' }}
        >←</button>
        <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.88rem' }}>
          {MONTHS[mi]} {year}
        </span>
        <button
          onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text2)', padding: '.2rem .5rem' }}
        >→</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '.62rem', color: '#aaa', fontWeight: 700, padding: '.2rem 0', letterSpacing: '.02em' }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const avail = isAvail(d);
          const past = d < today;
          const edge = isEdge(d);
          const range = inRange(d);
          return (
            <div
              key={i}
              onClick={() => handleClick(d)}
              style={{
                textAlign: 'center', fontSize: '.78rem', padding: '.32rem .1rem',
                borderRadius: 6, cursor: (!past && avail) ? 'pointer' : 'default',
                background: edge ? 'var(--orange)' : range ? 'rgba(232,98,42,.12)' : avail && !past ? 'rgba(16,185,129,.07)' : 'transparent',
                color: edge ? '#fff' : past ? '#ccc' : avail ? 'var(--text)' : '#ccc',
                border: edge ? '1.5px solid var(--orange)' : range ? '1px solid rgba(232,98,42,.18)' : avail && !past ? '1px solid rgba(16,185,129,.2)' : '1px solid transparent',
                fontWeight: edge ? 700 : 400,
                opacity: past ? 0.4 : 1,
              }}
            >
              {d.getDate()}
            </div>
          );
        })}
      </div>
      {diasDisponibles?.length ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginTop: '.75rem', fontSize: '.7rem', color: 'var(--text3)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(16,185,129,.4)', display: 'inline-block' }} />
          Días disponibles marcados por el oferente
        </div>
      ) : null}
    </div>
  );
}

// ─── Photo Carousel ─────────────────────────────────────────────

function FotoCarousel({ imgs, nombre }: { imgs: string[]; nombre: string }) {
  const [idx, setIdx] = useState(0);
  if (!imgs.length) return (
    <div style={{ height: 240, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', borderRadius: 'var(--r3)' }}>📦</div>
  );
  return (
    <div style={{ position: 'relative', height: 240, borderRadius: 'var(--r3)', overflow: 'hidden' }}>
      <img src={imgs[idx]} alt={nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,.4) 100%)' }} />
      {imgs.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + imgs.length) % imgs.length)} style={{
            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,.55)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: '1rem',
          }}>‹</button>
          <button onClick={() => setIdx(i => (i + 1) % imgs.length)} style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,.55)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: '1rem',
          }}>›</button>
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
            {imgs.map((_, i) => (
              <div key={i} onClick={() => setIdx(i)} style={{ width: 6, height: 6, borderRadius: '50%', background: i === idx ? '#fff' : 'rgba(255,255,255,.5)', cursor: 'pointer' }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Step Indicator ─────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  const STEPS = [
    { label: 'Detalle', icon: '🏠' },
    { label: 'Servicios', icon: '⚡' },
    { label: 'Cuenta & Pago', icon: '💳' },
  ];
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
      {STEPS.map((s, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={i} style={{
            flex: 1, padding: '.9rem .5rem',
            textAlign: 'center',
            background: active ? 'var(--orange)' : done ? 'rgba(232,98,42,.1)' : 'var(--surface)',
            borderRight: i < 2 ? '1px solid var(--border)' : undefined,
            transition: 'background .2s',
          }}>
            <div style={{ fontSize: '1.1rem', marginBottom: '.15rem' }}>{done ? '✓' : s.icon}</div>
            <div style={{
              fontFamily: 'Sora, sans-serif', fontSize: '.68rem', fontWeight: 700,
              color: active ? '#fff' : done ? 'var(--orange)' : 'var(--text3)',
            }}>
              {n}. {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function ReservarPage() {
  const router = useRouter();
  const params = useParams();
  const espacioId = params.id as string;
  const { user, token, login, register, loading: authLoading, error: authError } = useAuth();

  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [loadingEspacio, setLoadingEspacio] = useState(true);
  const [step, setStep] = useState(1);

  // Step 1 state
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [step1Error, setStep1Error] = useState('');

  // Step 2 state
  const [servicios, setServicios] = useState<ServicioTipo[]>([]);

  // Step 3 state
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    espaciosAPI.obtener(espacioId)
      .then(setEspacio)
      .catch(() => {})
      .finally(() => setLoadingEspacio(false));
  }, [espacioId]);

  const disponibilidad = (espacio as any)?.disponibilidad as { dias?: string[]; meses?: string[] } | undefined;

  const precioEstimado = fechaDesde && fechaHasta && espacio
    ? calcularPrecio(fechaDesde, fechaHasta, Number(espacio.precio_dia), Number(espacio.precio_mes))
    : 0;

  const diasSeleccionados = fechaDesde && fechaHasta ? diasEntre(fechaDesde, fechaHasta) : 0;
  const esMensual = diasSeleccionados >= 28;

  const serviciosTotal = servicios.reduce((acc, s) => acc + SERVICIOS_ADICIONALES[s].precio, 0);
  const totalFinal = precioEstimado + serviciosTotal;

  function toggleServicio(tipo: ServicioTipo) {
    setServicios(prev => prev.includes(tipo) ? prev.filter(s => s !== tipo) : [...prev, tipo]);
  }

  function goToStep2() {
    if (!fechaDesde || !fechaHasta) { setStep1Error('Seleccioná las fechas de inicio y fin.'); return; }
    if (fechaHasta <= fechaDesde) { setStep1Error('La fecha de fin debe ser posterior a la de inicio.'); return; }
    if (!espacio?.precio_dia && !espacio?.precio_mes) { setStep1Error('Este espacio no tiene precio configurado.'); return; }
    setStep1Error('');
    setStep(2);
  }

  async function handlePagar() {
    if (!user || !token || !espacio) return;
    setPayLoading(true);
    setPayError('');
    try {
      const reserva = await reservasAPI.crear({ espacio_id: espacioId, fecha_desde: fechaDesde, fecha_hasta: fechaHasta });

      if (servicios.length) {
        await adminAPI.notificarServicios({
          nombreDemandante: user.nombre,
          emailDemandante: user.email,
          telDemandante: user.tel,
          espacioNombre: espacio.nombre,
          servicios,
          fechaDesde,
          fechaHasta,
        }).catch(() => {}); // fire-and-forget, don't block payment
      }

      const pref = await pagosAPI.crearPreferencia(reserva.id, token);
      window.location.href = pref.init_point;
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : 'Error al procesar el pago');
      setPayLoading(false);
    }
  }

  if (loadingEspacio) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <span style={{ color: 'var(--text3)', fontSize: '.9rem' }}>Cargando espacio…</span>
      </div>
    );
  }

  if (!espacio) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: '1rem' }}>
        <span style={{ fontSize: '2.5rem' }}>😕</span>
        <span style={{ color: 'var(--text2)' }}>No se encontró el espacio</span>
        <button className="btn-secondary" onClick={() => router.push('/')}>← Volver al mapa</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="site-header">
        <SiteLogo onClick={() => router.push('/')} />
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.9rem', color: 'var(--orange)' }}>
            🏠 Reservar espacio
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="nav-btn" onClick={() => router.push('/')}>← Volver al mapa</button>
        </div>
      </header>

      <div className="page-scroll" style={{ flex: 1 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1rem 4rem' }}>

          {/* Card contenedor */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r4)',
            overflow: 'hidden',
            boxShadow: 'var(--s3)',
          }}>
            <StepBar step={step} />

            <div style={{ padding: '1.75rem' }}>

              {/* ──── STEP 1: Detalle + Calendario ──── */}
              {step === 1 && (
                <div style={{ display: 'grid', gap: '1.4rem' }}>
                  <FotoCarousel imgs={espacio.imgs || []} nombre={espacio.nombre} />

                  {/* Info del espacio */}
                  <div>
                    <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.25rem', marginBottom: '.35rem' }}>
                      {espacio.nombre}
                    </h2>
                    <div style={{ fontSize: '.83rem', color: 'var(--text3)', marginBottom: '.75rem' }}>
                      📍 {espacio.barrio} · {espacio.direccion}
                      {espacio.m2 ? ` · ${espacio.m2} m²` : ''}
                      {' · '}{espacio.tipo === 'exclusivo' ? '🔐 Exclusivo' : '🤲 Compartido'}
                    </div>
                    {espacio.descripcion && (
                      <p style={{ fontSize: '.83rem', color: 'var(--text2)', lineHeight: 1.7, marginBottom: '.75rem' }}>
                        {espacio.descripcion}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {espacio.precio_dia > 0 && (
                        <div style={{ background: 'rgba(232,98,42,.08)', border: '1px solid rgba(232,98,42,.2)', borderRadius: 8, padding: '.5rem .9rem', textAlign: 'center' }}>
                          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'var(--orange)' }}>{formatARS(espacio.precio_dia)}</div>
                          <div style={{ fontSize: '.68rem', color: 'var(--text3)', fontWeight: 600 }}>por día</div>
                        </div>
                      )}
                      {espacio.precio_mes > 0 && (
                        <div style={{ background: 'rgba(232,98,42,.08)', border: '1px solid rgba(232,98,42,.2)', borderRadius: 8, padding: '.5rem .9rem', textAlign: 'center' }}>
                          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'var(--orange)' }}>{formatARS(espacio.precio_mes)}</div>
                          <div style={{ fontSize: '.68rem', color: 'var(--text3)', fontWeight: 600 }}>por mes</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: 'var(--border)' }} />

                  {/* Calendario */}
                  <div>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.82rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '1rem' }}>
                      📅 Disponibilidad & Fechas
                    </div>
                    <MiniCalendar
                      diasDisponibles={disponibilidad?.dias}
                      fechaDesde={fechaDesde}
                      fechaHasta={fechaHasta}
                      onSelect={(d, h) => { setFechaDesde(d); setFechaHasta(h); setStep1Error(''); }}
                    />

                    {/* Date inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginTop: '1rem' }}>
                      <label className="form-label">
                        Desde
                        <input type="date" value={fechaDesde}
                          onChange={e => { setFechaDesde(e.target.value); setStep1Error(''); }}
                          min={new Date().toISOString().split('T')[0]}
                          style={{ marginTop: '.3rem' }} />
                      </label>
                      <label className="form-label">
                        Hasta
                        <input type="date" value={fechaHasta}
                          onChange={e => { setFechaHasta(e.target.value); setStep1Error(''); }}
                          min={fechaDesde || new Date().toISOString().split('T')[0]}
                          style={{ marginTop: '.3rem' }} />
                      </label>
                    </div>

                    {/* Price preview */}
                    {fechaDesde && fechaHasta && precioEstimado > 0 && (
                      <div style={{
                        marginTop: '1rem', padding: '.9rem 1.1rem',
                        background: 'rgba(232,98,42,.06)', border: '1px solid rgba(232,98,42,.18)',
                        borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>
                          {esMensual
                            ? `${Math.ceil(diasSeleccionados / 30)} mes${Math.ceil(diasSeleccionados / 30) !== 1 ? 'es' : ''} × ${formatARS(espacio.precio_mes)}/mes`
                            : `${diasSeleccionados} día${diasSeleccionados !== 1 ? 's' : ''} × ${formatARS(espacio.precio_dia)}/día`}
                        </div>
                        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: 'var(--orange)' }}>
                          {formatARS(precioEstimado)}
                        </div>
                      </div>
                    )}
                  </div>

                  {step1Error && <p style={{ fontSize: '.8rem', color: '#e8622a', fontWeight: 600 }}>{step1Error}</p>}

                  <Button variant="primary" onClick={goToStep2} style={{ width: '100%' }}>
                    Continuar → Servicios adicionales
                  </Button>
                </div>
              )}

              {/* ──── STEP 2: Servicios adicionales ──── */}
              {step === 2 && (
                <div style={{ display: 'grid', gap: '1.2rem' }}>
                  <div>
                    <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.15rem', marginBottom: '.3rem' }}>
                      ⚡ Servicios adicionales
                    </h2>
                    <p style={{ fontSize: '.83rem', color: 'var(--text2)', lineHeight: 1.65 }}>
                      Opcionales. Si los contratás, un asesor te contactará para coordinarlos.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gap: '.65rem' }}>
                    {(['transporte', 'seguro', 'embalaje'] as ServicioTipo[]).map(tipo => {
                      const cfg = SERVICIOS_ADICIONALES[tipo];
                      const active = servicios.includes(tipo);
                      return (
                        <div
                          key={tipo}
                          onClick={() => toggleServicio(tipo)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '.85rem',
                            padding: '.9rem 1rem',
                            background: active ? 'rgba(232,98,42,.07)' : 'var(--surface2)',
                            border: `1.5px solid ${active ? 'rgba(232,98,42,.35)' : 'var(--border)'}`,
                            borderRadius: 'var(--r2)',
                            cursor: 'pointer',
                            transition: 'all .15s',
                          }}
                        >
                          <span style={{ fontSize: '1.4rem' }}>{cfg.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: '.1rem' }}>{cfg.label}</div>
                            <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>
                              {formatARS(cfg.precio)}
                              {tipo === 'transporte' && ' · Incluye retiro, traslado y descarga'}
                              {tipo === 'seguro' && ' /mes · Cobertura contra robo, incendio y daños'}
                              {tipo === 'embalaje' && ' · Kit con cajas, cinta y papel burbuja'}
                            </div>
                          </div>
                          <div style={{
                            width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                            background: active ? 'var(--orange)' : 'var(--surface)',
                            border: `2px solid ${active ? 'var(--orange)' : 'var(--border2)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: 13, fontWeight: 700,
                          }}>
                            {active ? '✓' : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {servicios.length > 0 && (
                    <div style={{ padding: '.8rem 1rem', background: 'rgba(16,185,129,.07)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 10, fontSize: '.8rem', color: '#10b981' }}>
                      ✓ Un asesor de TodasMisCosas te contactará para coordinar los servicios seleccionados.
                    </div>
                  )}

                  {/* Resumen rápido */}
                  <div style={{ height: 1, background: 'var(--border)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem' }}>
                    <span style={{ color: 'var(--text2)' }}>Espacio ({diasSeleccionados} días)</span>
                    <span style={{ fontWeight: 700 }}>{formatARS(precioEstimado)}</span>
                  </div>
                  {servicios.map(s => (
                    <div key={s} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem' }}>
                      <span style={{ color: 'var(--text2)' }}>{SERVICIOS_ADICIONALES[s].emoji} {SERVICIOS_ADICIONALES[s].label}</span>
                      <span style={{ fontWeight: 700 }}>{formatARS(SERVICIOS_ADICIONALES[s].precio)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1rem' }}>
                    <span>Total estimado</span>
                    <span style={{ color: 'var(--orange)' }}>{formatARS(totalFinal)}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '.75rem' }}>
                    <button className="btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>← Atrás</button>
                    <Button variant="primary" onClick={() => setStep(3)} style={{ flex: 2 }}>
                      Continuar → Cuenta y pago
                    </Button>
                  </div>
                </div>
              )}

              {/* ──── STEP 3: Auth + Pago ──── */}
              {step === 3 && (
                <div style={{ display: 'grid', gap: '1.4rem' }}>
                  {!user ? (
                    /* Not logged in: show auth */
                    <div>
                      <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.15rem', marginBottom: '.3rem' }}>
                        🙍 Iniciá sesión para continuar
                      </h2>
                      <p style={{ fontSize: '.83rem', color: 'var(--text2)', marginBottom: '1.25rem' }}>
                        Necesitás una cuenta para reservar y proceder con el pago.
                      </p>

                      {/* Tab selector */}
                      <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 'var(--r2)', padding: 3, marginBottom: '1.25rem' }}>
                        {(['login', 'register'] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setAuthTab(tab)}
                            style={{
                              flex: 1, padding: '.5rem',
                              background: authTab === tab ? 'var(--surface)' : 'transparent',
                              border: 'none', borderRadius: 'var(--r2)',
                              fontFamily: 'Sora, sans-serif', fontWeight: 700,
                              fontSize: '.82rem', cursor: 'pointer',
                              color: authTab === tab ? 'var(--orange)' : 'var(--text3)',
                              boxShadow: authTab === tab ? 'var(--s1)' : 'none',
                              transition: 'all .15s',
                            }}
                          >
                            {tab === 'login' ? '→ Ingresar' : '✚ Crear cuenta'}
                          </button>
                        ))}
                      </div>

                      {authTab === 'login' ? (
                        <LoginForm
                          onLogin={async (email, password) => {
                            const ok = await login(email, password);
                            return ok;
                          }}
                          onSwitch={() => setAuthTab('register')}
                          error={authError}
                          loading={authLoading}
                        />
                      ) : (
                        <RegisterForm
                          onRegister={async (nombre, email, password, tipo, tel) => {
                            const ok = await register(nombre, email, password, tipo, tel);
                            return ok;
                          }}
                          onSwitch={() => setAuthTab('login')}
                          error={authError}
                          loading={authLoading}
                        />
                      )}
                    </div>
                  ) : (
                    /* Logged in: show summary and pay button */
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.15rem' }}>
                        💳 Resumen y pago
                      </h2>

                      {/* Resumen */}
                      <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '1rem', display: 'grid', gap: '.5rem' }}>
                        {[
                          ['Espacio', espacio.nombre],
                          ['Ubicación', `${espacio.barrio} · ${espacio.direccion}`],
                          ['Desde', fechaDesde],
                          ['Hasta', fechaHasta],
                          ['Duración', `${diasSeleccionados} días (${esMensual ? Math.ceil(diasSeleccionados / 30) + ' mes/es' : diasSeleccionados + ' días'})`],
                        ].map(([label, val]) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.84rem' }}>
                            <span style={{ color: 'var(--text3)' }}>{label}</span>
                            <span style={{ fontWeight: 600, color: 'var(--text)', textAlign: 'right', maxWidth: '60%' }}>{val}</span>
                          </div>
                        ))}
                        <div style={{ height: 1, background: 'var(--border)', margin: '.3rem 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.84rem' }}>
                          <span style={{ color: 'var(--text3)' }}>Subtotal espacio</span>
                          <span style={{ fontWeight: 700 }}>{formatARS(precioEstimado)}</span>
                        </div>
                        {servicios.map(s => (
                          <div key={s} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem' }}>
                            <span style={{ color: 'var(--text3)' }}>{SERVICIOS_ADICIONALES[s].emoji} {SERVICIOS_ADICIONALES[s].label}</span>
                            <span style={{ fontWeight: 600 }}>{formatARS(SERVICIOS_ADICIONALES[s].precio)}</span>
                          </div>
                        ))}
                        <div style={{ height: 1, background: 'var(--border)', margin: '.3rem 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1rem' }}>
                          <span>Total</span>
                          <span style={{ color: 'var(--orange)' }}>{formatARS(totalFinal)}</span>
                        </div>
                      </div>

                      {payError && (
                        <div className="alert alert--error">{payError}</div>
                      )}

                      <Button variant="primary" onClick={handlePagar} loading={payLoading} style={{ width: '100%', fontSize: '1rem', padding: '.9rem' }}>
                        🛡️ Pagar con MercadoPago
                      </Button>
                      <p style={{ textAlign: 'center', fontSize: '.72rem', color: 'var(--text3)' }}>
                        Serás redirigido a MercadoPago de forma segura 🔒
                      </p>
                    </div>
                  )}

                  <button className="btn-secondary" onClick={() => setStep(2)} style={{ marginTop: user ? 0 : '.5rem' }}>
                    ← Volver a servicios
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
