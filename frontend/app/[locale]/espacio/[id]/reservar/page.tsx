'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { espaciosAPI, reservasAPI, pagosAPI } from '@/lib/api';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { OTPStep } from '@/components/auth/OTPStep';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Button } from '@/components/ui/Button';
import type { Espacio } from '@/types';
import { SERVICIOS_ADICIONALES } from '@/types';
import type { ServicioTipo } from '@/types';
import { formatARS } from '@/lib/utils';
import { getFotoFallback, getFotosFallback } from '@/lib/fotosFallback';
import QRCode from 'qrcode';
import { Calendar } from 'react-multi-date-picker';

const Cal = Calendar as any;
const SEMANA = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
const MESES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function expandRanges(ranges: any[]): string[] {
  const days = new Set<string>();
  if (!Array.isArray(ranges)) return [];
  ranges.forEach((r: any) => {
    if (!Array.isArray(r)) return;
    const [start, end] = r;
    if (!start) return;
    const toMs = (d: any) => (d.toDate ? d.toDate() : new Date(d)).setHours(12, 0, 0, 0);
    const cur = new Date(toMs(start));
    const e   = new Date(end ? toMs(end) : toMs(start));
    while (cur <= e) {
      days.add(`${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`);
      cur.setDate(cur.getDate() + 1);
    }
  });
  return Array.from(days).sort();
}


// ─── Photo Carousel ─────────────────────────────────────────────

function FotoCarousel({ imgs, nombre, espacioId }: { imgs: string[]; nombre: string; espacioId?: string }) {
  const [idx, setIdx] = useState(0);
  const displayImgs = imgs.length > 0 ? imgs : (espacioId ? getFotosFallback(espacioId, 4) : []);
  if (!displayImgs.length) return (
    <div style={{ height: 240, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', borderRadius: 'var(--r3)' }}>📦</div>
  );
  return (
    <div style={{ position: 'relative', height: 240, borderRadius: 'var(--r3)', overflow: 'hidden' }}>
      <img
        src={displayImgs[idx]}
        alt={nombre}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => { if (espacioId) e.currentTarget.src = getFotoFallback(espacioId); }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,.4) 100%)' }} />
      {displayImgs.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + displayImgs.length) % displayImgs.length)} style={{
            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,.55)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: '1rem',
          }}>‹</button>
          <button onClick={() => setIdx(i => (i + 1) % displayImgs.length)} style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,.55)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: '1rem',
          }}>›</button>
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
            {displayImgs.map((_, i) => (
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
    { label: 'Detalle', icon: '📋' },
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
  const searchParams = useSearchParams();
  const espacioId = params.id as string;
  const volverUrl = searchParams.get('from') === 'mapa' ? '/?vista=mapa' : '/';
  const { user, token, login, register, loading: authLoading, error: authError,
          otpPending, otpEmailHint, otpCanales, verifyOTP, reenviarOTP } = useAuth();

  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [loadingEspacio, setLoadingEspacio] = useState(true);
  const [step, setStep] = useState(1);

  // Step 1 state
  const [diasMulti, setDiasMulti] = useState<string[]>([]);
  const [rangesValue, setRangesValue] = useState<any[]>([]);
  const [step1Error, setStep1Error] = useState('');
  const [fechasOcupadas, setFechasOcupadas] = useState<string[]>([]);

  // 2 meses lado a lado no entran en pantallas chicas (el calendario fuerza
  // un ancho real >400px, y la tarjeta contenedora no tiene ancho fijo, así
  // que crece con él y se lleva puesto al botón "Continuar" fuera de la
  // pantalla). Arranca en 2 (igual que SSR) y se ajusta recién después de
  // montar, para no generar un hydration mismatch.
  const [numMeses, setNumMeses] = useState(2);
  useEffect(() => {
    function actualizarNumMeses() { setNumMeses(window.innerWidth <= 640 ? 1 : 2); }
    actualizarNumMeses();
    window.addEventListener('resize', actualizarNumMeses);
    return () => window.removeEventListener('resize', actualizarNumMeses);
  }, []);

  // Step 2 state
  const [servicios, setServicios] = useState<ServicioTipo[]>([]);

  // Step 3 state
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  // QR state
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrReservaId, setQrReservaId] = useState('');
  const [qrInitPoint, setQrInitPoint] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrPolling, setQrPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    espaciosAPI.obtener(espacioId)
      .then(setEspacio)
      .catch(() => {})
      .finally(() => setLoadingEspacio(false));
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/espacios/${espacioId}/fechas-ocupadas`)
      .then(r => r.json())
      .then(data => setFechasOcupadas(data.fechas || []))
      .catch(() => {});
  }, [espacioId]);

  const disponibilidad = (espacio as any)?.disponibilidad as { dias?: string[] } | undefined;

  const maxDate90 = (() => {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 89);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const maxDateFinal = (() => {
    const raw = espacio?.fecha_vencimiento;
    let max = maxDate90;
    if (raw) {
      const venc = String(raw).slice(0, 10);
      if (venc < max) max = venc;
    }
    return max;
  })();

  const precioEstimado = espacio ? diasMulti.length * Number(espacio.precio_dia) : 0;
  const diasSeleccionados = diasMulti.length;

  const serviciosTotal = servicios.reduce((acc, s) => acc + SERVICIOS_ADICIONALES[s].precio, 0);
  const totalFinal = precioEstimado + serviciosTotal;

  function toggleServicio(tipo: ServicioTipo) {
    setServicios(prev => prev.includes(tipo) ? prev.filter(s => s !== tipo) : [...prev, tipo]);
  }

  function goToStep2() {
    if (diasMulti.length === 0) { setStep1Error('Seleccioná al menos un día en el calendario.'); return; }
    if (diasMulti.length > 90) { setStep1Error('La reserva no puede superar los 90 días.'); return; }
    const conflicto = diasMulti.find(d => fechasOcupadas.includes(d));
    if (conflicto) { setStep1Error(`El día ${conflicto} ya está reservado. Por favor quitalo de tu selección.`); return; }
    if (espacio?.fecha_vencimiento) {
      const venc = espacio.fecha_vencimiento;
      if (diasMulti.some(d => d > venc)) {
        setStep1Error(`Algunos días seleccionados superan la fecha límite de esta publicación (${venc}).`);
        return;
      }
    }
    if (!espacio?.precio_dia) { setStep1Error('Este espacio no tiene precio configurado.'); return; }
    setStep1Error('');
    setStep(2);
  }

  async function handlePagar() {
    if (!user || !token || !espacio) return;
    setPayLoading(true);
    setPayError('');
    const fdDesde = diasMulti[0];
    const fdHasta = diasMulti[diasMulti.length - 1];
    try {
      const reserva = await reservasAPI.crear({
        espacio_id: espacioId, fecha_desde: fdDesde, fecha_hasta: fdHasta, servicios,
        modo: 'dia',
        diasMulti,
      }, token);

      const pref = await pagosAPI.crearPreferencia(reserva.id, token);
      window.location.href = pref.init_point;
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : 'Error al procesar el pago');
      setPayLoading(false);
    }
  }

  async function handlePagarQR() {
    if (!user || !token || !espacio) return;
    setQrLoading(true);
    setPayError('');
    const fdDesde = diasMulti[0];
    const fdHasta = diasMulti[diasMulti.length - 1];
    try {
      const reserva = await reservasAPI.crear({
        espacio_id: espacioId, fecha_desde: fdDesde, fecha_hasta: fdHasta, servicios,
        modo: 'dia',
        diasMulti,
      }, token);

      const pref = await pagosAPI.crearPreferencia(reserva.id, token);
      const dataUrl = await QRCode.toDataURL(pref.init_point, {
        width: 260,
        margin: 2,
        color: { dark: '#1a1a2e', light: '#ffffff' },
      });

      setQrDataUrl(dataUrl);
      setQrReservaId(reserva.id);
      setQrInitPoint(pref.init_point);
      setQrPolling(true);

      // Poll every 4 seconds for payment confirmation
      pollRef.current = setInterval(async () => {
        try {
          const estado = await pagosAPI.estado(reserva.id, token);
          if (estado.estado === 'pagada') {
            if (pollRef.current) clearInterval(pollRef.current);
            router.push(`/reserva/${reserva.id}/confirmacion?estado=success`);
          }
        } catch { /* ignore polling errors */ }
      }, 4000);

    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : 'Error al generar el QR');
    } finally {
      setQrLoading(false);
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
        <button className="btn-secondary" onClick={() => router.push(volverUrl)}>← Volver</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="site-header">
        <SiteLogo onClick={() => router.push(volverUrl)} />
        <div className="hide-mobile" style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.9rem', color: 'var(--orange)' }}>
            Reservar espacio
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="nav-btn" onClick={() => router.push(volverUrl)}>
            <span className="hide-mobile">← Volver</span>
            <span className="show-mobile">←</span>
          </button>
        </div>
      </header>

      <div className="page-scroll" style={{ flex: 1 }}>
        <div className="reservar-outer-wrap" style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1rem 4rem' }}>

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
                  <FotoCarousel imgs={espacio.imgs || []} nombre={espacio.nombre} espacioId={espacio.id} />

                  {/* Info del espacio */}
                  <div>
                    <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.25rem', marginBottom: '.35rem' }}>
                      {espacio.nombre}
                    </h2>
                    <div style={{ fontSize: '.83rem', color: 'var(--text3)', marginBottom: '.75rem' }}>
                      📍 {espacio.barrio} · {espacio.direccion}
                      {Number(espacio.m2) > 0 ? ` · ${espacio.m2} m²` : ''}
                      {' · '}{espacio.tipo === 'exclusivo' ? '🔐 Exclusivo' : '🤲 Compartido'}
                    </div>
                    {espacio.descripcion && (
                      <p style={{ fontSize: '.83rem', color: 'var(--text2)', lineHeight: 1.7, marginBottom: '.75rem' }}>
                        {espacio.descripcion}
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: 'var(--border)' }} />

                  {/* Bloqueo cupo lleno — solo compartidos */}
                  {espacio.tipo === 'compartido' && espacio.cupo_disponible === false && (
                    <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, padding: '1rem 1.1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem', marginBottom: '.35rem' }}>🔴</div>
                      <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: '#dc2626', marginBottom: '.25rem' }}>Cupo completo</div>
                      <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>El oferente informó que no tiene disponibilidad en este momento. Podés contactarlo para consultar cuándo vuelve a tener cupo.</div>
                    </div>
                  )}

                  {/* Calendario */}
                  {(espacio.tipo !== 'compartido' || espacio.cupo_disponible !== false) && <div>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.82rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '1rem' }}>
                      📅 Disponibilidad & Fechas
                    </div>

                    <style>{`
                      .calendario-mes .rmdp-wrapper { width: 100% !important; box-shadow: none !important; background: transparent !important; }
                      .calendario-mes .rmdp-calendar { width: 100% !important; }
                      .calendario-mes .rmdp-day-picker { display: flex; gap: .6rem; flex-wrap: nowrap; }
                      .calendario-mes .rmdp-day-picker > div { flex: 1; min-width: 0; }
                      .calendario-mes .rmdp-header { font-family: Sora, sans-serif; font-weight: 700; }
                      .calendario-mes .rmdp-range { background: rgba(232,98,42,.15) !important; color: var(--text) !important; }
                      .calendario-mes .rmdp-range.start span, .calendario-mes .rmdp-range.end span { background: var(--orange) !important; color: #fff !important; }
                      .calendario-mes .rmdp-range.start, .calendario-mes .rmdp-range.end { background: var(--orange) !important; }
                      .calendario-mes .rmdp-day:not(.rmdp-disabled):not(.rmdp-range) span:hover { background: rgba(232,98,42,.2) !important; }
                      .calendario-mes .rmdp-day.rmdp-disabled { opacity: 0.35; cursor: not-allowed; }
                      .calendario-mes .rmdp-day.rmdp-today span { border: 1.5px solid var(--orange) !important; font-weight: 700; }
                      .calendario-mes .rmdp-arrow-container:hover { background: rgba(232,98,42,.1) !important; }
                    `}</style>
                    <div style={{ background: 'rgba(232,98,42,.06)', border: '1px solid rgba(232,98,42,.2)', borderRadius: 8, padding: '.65rem .85rem', marginBottom: '.75rem', display: 'grid', gap: '.35rem' }}>
                      <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--orange)', fontFamily: 'Sora, sans-serif', marginBottom: '.1rem' }}>¿Cómo seleccionar fechas?</div>
                      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start' }}>
                        <span style={{ background: 'var(--orange)', color: '#fff', borderRadius: 5, padding: '1px 6px', fontSize: '.65rem', fontWeight: 800, whiteSpace: 'nowrap', marginTop: 1 }}>1 click</span>
                        <span style={{ fontSize: '.72rem', color: 'var(--text2)' }}><strong>Día suelto</strong> — hacé click en el día que necesitás y luego otro click en el mismo día para confirmarlo.</span>
                      </div>
                      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start' }}>
                        <span style={{ background: 'var(--orange)', color: '#fff', borderRadius: 5, padding: '1px 6px', fontSize: '.65rem', fontWeight: 800, whiteSpace: 'nowrap', marginTop: 1 }}>rango</span>
                        <span style={{ fontSize: '.72rem', color: 'var(--text2)' }}><strong>Período corrido</strong> — click en el primer día, click en el último día. Todo lo del medio queda seleccionado automáticamente.</span>
                      </div>
                      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start' }}>
                        <span style={{ background: 'rgba(232,98,42,.2)', color: 'var(--orange)', borderRadius: 5, padding: '1px 6px', fontSize: '.65rem', fontWeight: 800, whiteSpace: 'nowrap', marginTop: 1 }}>+más</span>
                        <span style={{ fontSize: '.72rem', color: 'var(--text2)' }}>Repetí para combinar tantos días sueltos y rangos como necesites en una misma reserva.</span>
                      </div>
                    </div>
                    <div className="calendario-mes">
                      <Cal
                        multiple
                        range
                        value={rangesValue}
                        onChange={(ranges: any) => {
                          const next = ranges ?? [];
                          setRangesValue(next);
                          setDiasMulti(expandRanges(next));
                          setStep1Error('');
                        }}
                        numberOfMonths={numMeses}
                        minDate={new Date()}
                        maxDate={new Date(maxDateFinal + 'T12:00:00')}
                        weekDays={SEMANA}
                        months={MESES}
                        weekStartDayIndex={1}
                        mapDays={({ date }: any) => {
                          const iso = `${date.year}-${String(date.month.number).padStart(2,'0')}-${String(date.day).padStart(2,'0')}`;
                          if (fechasOcupadas.includes(iso))
                            return { disabled: true, style: { color: '#ef4444', textDecoration: 'line-through' } };
                          if (disponibilidad?.dias?.length && !disponibilidad.dias.includes(iso))
                            return { disabled: true, style: { color: '#ccc' } };
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '.68rem', color: 'var(--text3)', textAlign: 'center', marginTop: '.3rem' }}>
                      ‹ Usá las flechas o deslizá para ver los próximos meses ›
                    </div>

                    <div style={{ marginTop: '.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {diasMulti.length > 0
                        ? <span style={{ fontSize: '.72rem', color: 'var(--mint)', fontWeight: 600 }}>✅ {diasMulti.length} día{diasMulti.length !== 1 ? 's' : ''} seleccionado{diasMulti.length !== 1 ? 's' : ''}</span>
                        : <span />}
                      {diasMulti.length > 0 && (
                        <button type="button" onClick={() => { setRangesValue([]); setDiasMulti([]); setStep1Error(''); }}
                          style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '.72rem', cursor: 'pointer' }}>
                          Limpiar
                        </button>
                      )}
                    </div>

                    {precioEstimado > 0 && (
                      <div style={{
                        marginTop: '1rem', padding: '.9rem 1.1rem',
                        background: 'rgba(232,98,42,.06)', border: '1px solid rgba(232,98,42,.18)',
                        borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>
                          {diasSeleccionados} día{diasSeleccionados !== 1 ? 's' : ''} × {formatARS(espacio.precio_dia)}/día
                        </div>
                        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: 'var(--orange)' }}>
                          {formatARS(precioEstimado)}
                        </div>
                      </div>
                    )}
                  </div>}

                  {step1Error && <p style={{ fontSize: '.8rem', color: '#e8622a', fontWeight: 600 }}>{step1Error}</p>}

                  {(espacio.tipo !== 'compartido' || espacio.cupo_disponible !== false) && (
                    <Button variant="primary" onClick={goToStep2} style={{ width: '100%' }}>
                      Continuar → Servicios adicionales
                    </Button>
                  )}
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

                  <div style={{ display: 'grid', gap: '.5rem' }}>
                    {(['transporte', 'seguro', 'embalaje'] as ServicioTipo[]).map(tipo => {
                      const cfg = SERVICIOS_ADICIONALES[tipo];
                      const active = servicios.includes(tipo);
                      return (
                        <div
                          key={tipo}
                          onClick={() => toggleServicio(tipo)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '.75rem',
                            padding: '.7rem .85rem',
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
                              {tipo === 'transporte' && 'Incluye retiro, traslado y descarga'}
                              {tipo === 'seguro' && 'Cobertura contra robo, incendio y daños, emitida por una aseguradora'}
                              {tipo === 'embalaje' && 'Kit con cajas, cinta y papel burbuja'}
                              {tipo === 'limpieza' && 'Limpieza general del espacio'}
                              {' · '}
                              <span style={{ color: 'var(--orange)', fontWeight: 600 }}>A coordinar con asesor</span>
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
                    <span style={{ color: 'var(--text2)' }}>{diasSeleccionados} día{diasSeleccionados !== 1 ? 's' : ''} × {formatARS(espacio.precio_dia)}/día</span>
                    <span style={{ fontWeight: 700 }}>{formatARS(precioEstimado)}</span>
                  </div>
                  {servicios.map(s => (
                    <div key={s} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem' }}>
                      <span style={{ color: 'var(--text2)' }}>{SERVICIOS_ADICIONALES[s].emoji} {SERVICIOS_ADICIONALES[s].label}</span>
                      <span style={{ fontWeight: 600, color: 'var(--orange)' }}>A coordinar</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1rem' }}>
                    <span>Total estimado</span>
                    <span style={{ color: 'var(--orange)' }}>{formatARS(totalFinal)}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '.75rem' }}>
                    <button className="btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>← Atrás</button>
                    <Button variant="primary" onClick={() => setStep(3)} style={{ flex: 2 }} className="btn-continuar-reserva">
                      Continuar → Cuenta y pago
                    </Button>
                  </div>
                </div>
              )}

              {/* ──── STEP 3: Auth + Pago ──── */}
              {step === 3 && (
                <div style={{ display: 'grid', gap: '1.4rem' }}>
                  <button className="btn-secondary" style={{ justifySelf: 'start' }} onClick={() => setStep(2)}>
                    ← Atrás
                  </button>
                  {!user ? (
                    /* Not logged in: show auth or OTP */
                    <div>
                      {otpPending ? (
                        /* OTP pending — show verification step */
                        <OTPStep
                          emailHint={otpEmailHint}
                          canales={otpCanales}
                          onVerify={verifyOTP}
                          onReenviar={reenviarOTP}
                          loading={authLoading}
                          error={authError}
                        />
                      ) : (
                        <>
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
                              onRegister={async (nombre, email, password, tipo, tel, terminos_aceptados) => {
                                const ok = await register(nombre, email, password, tipo, tel, terminos_aceptados);
                                return ok;
                              }}
                              onSwitch={() => setAuthTab('login')}
                              error={authError}
                              loading={authLoading}
                            />
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    /* Logged in: show summary and pay button */
                    <div className="paso3-grid" style={{ display: 'grid', gap: '1rem' }}>
                      <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.15rem' }}>
                        💳 Resumen y pago
                      </h2>

                      {/* Resumen */}
                      <div className="resumen-pago-card" style={{ background: 'var(--surface2)', borderRadius: 10, padding: '1rem', display: 'grid', gap: '.5rem' }}>
                        {[
                          ['Espacio', espacio.nombre],
                          ['Ubicación', `${espacio.barrio} · ${espacio.direccion}`],
                          ['Desde', diasMulti[0] || '—'],
                          ['Hasta', diasMulti[diasMulti.length - 1] || '—'],
                          ['Duración', `${diasSeleccionados} día${diasSeleccionados !== 1 ? 's' : ''}`],
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
                            <span style={{ fontWeight: 600, color: SERVICIOS_ADICIONALES[s].precio === 0 ? 'var(--text3)' : 'inherit' }}>
                              {SERVICIOS_ADICIONALES[s].precio > 0 ? formatARS(SERVICIOS_ADICIONALES[s].precio) : 'a cotizar'}
                            </span>
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

                      {/* QR panel — shown after clicking "Pagar por QR" */}
                      {qrDataUrl && (
                        <div style={{
                          textAlign: 'center',
                          background: 'var(--surface2)',
                          border: '1.5px solid var(--border)',
                          borderRadius: 'var(--r3)',
                          padding: '1.5rem 1rem',
                        }}>
                          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.95rem', marginBottom: '.4rem' }}>
                            📱 Escaneá con tu app de MercadoPago
                          </div>
                          <p style={{ fontSize: '.75rem', color: 'var(--text3)', marginBottom: '1.1rem' }}>
                            Abrí MercadoPago → Escaneá → Listo. Esta pantalla se actualiza sola cuando se confirme el pago.
                          </p>
                          <img
                            src={qrDataUrl}
                            alt="QR MercadoPago"
                            style={{ width: 220, height: 220, borderRadius: 12, border: '1.5px solid var(--border)' }}
                          />
                          {qrPolling && (
                            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontSize: '.75rem', color: 'var(--text3)' }}>
                              <span style={{ display: 'inline-block', animation: 'spin 1.2s linear infinite' }}>⟳</span>
                              Esperando confirmación del pago…
                            </div>
                          )}
                          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
                          <button
                            className="btn-secondary"
                            style={{ marginTop: '1rem', fontSize: '.75rem' }}
                            onClick={() => qrInitPoint && window.open(qrInitPoint, '_blank')}
                          >
                            Abrí el link en otro dispositivo
                          </button>
                        </div>
                      )}

                      {/* Payment buttons — hidden once QR is shown */}
                      {!qrDataUrl && (
                        <div className="paso3-pay-btns" style={{ display: 'grid', gap: '.6rem' }}>
                          <Button variant="primary" onClick={handlePagar} loading={payLoading} style={{ width: '100%', fontSize: '1rem', padding: '.9rem' }}>
                            💳 Pagar online con MercadoPago
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={handlePagarQR}
                            loading={qrLoading}
                            style={{ width: '100%', fontSize: '1rem', padding: '.75rem' }}
                          >
                            📱 Pagar por QR con MercadoPago
                          </Button>
                        </div>
                      )}
                      <p style={{ textAlign: 'center', fontSize: '.72rem', color: 'var(--text3)' }}>
                        Pago seguro procesado por MercadoPago 🔒
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '.6rem' }}>
                    <button className="btn-secondary" style={{ flex: 1 }} onClick={() => router.push(`/espacio/${espacioId}`)}>
                      Cancelar reserva
                    </button>
                  </div>

                  <p style={{ fontSize: '.72rem', color: 'var(--text3)', textAlign: 'center', lineHeight: 1.6, marginTop: '.75rem' }}>
                    Al proceder con el pago aceptás nuestros{' '}
                    <a href="/es/legales" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange)', textDecoration: 'underline' }}>
                      Términos y Condiciones
                    </a>
                    {' '}y{' '}
                    <a href="/es/legales#politica-privacidad" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange)', textDecoration: 'underline' }}>
                      Política de Privacidad
                    </a>
                    .
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
