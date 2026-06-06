'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { espaciosAPI, reservasAPI, pagosAPI } from '@/lib/api';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { OTPStep } from '@/components/auth/OTPStep';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Button } from '@/components/ui/Button';
import type { Espacio } from '@/types';
import { SERVICIOS_ADICIONALES } from '@/types';
import type { ServicioTipo } from '@/types';
import { formatARS, calcularPrecio, diasEntre, mesesEntre } from '@/lib/utils';
import { getFotoFallback, getFotosFallback } from '@/lib/fotosFallback';
import QRCode from 'qrcode';

// ─── Mini Calendar ──────────────────────────────────────────────

type ModoCalendario = 'dia' | 'mes' | 'ambos';

function MiniCalendar({
  diasDisponibles,
  diasOcupados = [],
  fechaDesde,
  fechaHasta,
  onSelect,
  modo = 'ambos',
  diasMulti = [],
  onSelectMulti,
  maxDate,
}: {
  diasDisponibles?: string[];
  diasOcupados?: string[];
  fechaDesde: string;
  fechaHasta: string;
  onSelect: (desde: string, hasta: string) => void;
  modo?: ModoCalendario;
  diasMulti?: string[];
  onSelectMulti?: (dias: string[]) => void;
  maxDate?: string;
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

  function pad(n: number) { return String(n).padStart(2, '0'); }
  function toISO(d: Date) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function isAvail(d: Date) {
    const iso = toISO(d);
    if (maxDate && iso > maxDate) return false;
    if (diasOcupados.includes(iso)) return false;
    if (!diasDisponibles?.length) return true;
    return diasDisponibles.includes(iso);
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

  const diasSelec = fechaDesde && fechaHasta
    ? Math.round((new Date(fechaHasta).getTime() - new Date(fechaDesde).getTime()) / 86400000) + 1
    : 0;
  const esMensual = diasSelec >= 28;

  const maxDateObj = maxDate ? new Date(maxDate + 'T12:00:00') : null;
  const canGoNext = !maxDateObj || new Date(year, mi + 1, 1) <= maxDateObj;

  function handleClick(d: Date) {
    if (d < today || !isAvail(d)) return;
    const iso = toISO(d);

    if (modo === 'dia') {
      // Toggle: agregar o quitar el día del array
      const nuevo = diasMulti.includes(iso)
        ? diasMulti.filter(x => x !== iso)
        : [...diasMulti, iso].sort();
      onSelectMulti?.(nuevo);
    } else if (modo === 'mes') {
      const primerDia = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
      const ultimoDia = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())}`;
      onSelect(primerDia, ultimoDia);
    } else {
      if (!fechaDesde || (fechaDesde && fechaHasta)) {
        onSelect(iso, '');
      } else if (iso < fechaDesde) {
        onSelect(iso, fechaDesde);
      } else {
        onSelect(fechaDesde, iso);
      }
    }
  }

  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const colorEdge  = esMensual ? '#3b82f6' : 'var(--orange)';
  const colorRange = esMensual ? 'rgba(59,130,246,.12)' : 'rgba(232,98,42,.12)';
  const borderRange = esMensual ? '1px solid rgba(59,130,246,.2)' : '1px solid rgba(232,98,42,.18)';

  return (
    <div>
      {/* Indicador de modo */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.75rem', flexWrap: 'wrap' }}>
        {modo === 'dia' && (
          <div style={{ fontSize: '.72rem', color: 'var(--orange)', background: 'rgba(232,98,42,.08)', border: '1px solid rgba(232,98,42,.25)', borderRadius: 6, padding: '.25rem .65rem', fontWeight: 600 }}>
            📅 Tocá los días que querés reservar — podés elegir varios salteados
          </div>
        )}
        {modo === 'mes' && (
          <div style={{ fontSize: '.72rem', color: '#3b82f6', background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.25)', borderRadius: 6, padding: '.25rem .65rem', fontWeight: 600 }}>
            🗓 Seleccioná un mes completo
          </div>
        )}
        {modo === 'ambos' && fechaDesde && fechaHasta && (
          <div style={{
            fontSize: '.72rem', fontWeight: 600, borderRadius: 6, padding: '.25rem .65rem',
            color: esMensual ? '#3b82f6' : 'var(--orange)',
            background: esMensual ? 'rgba(59,130,246,.1)' : 'rgba(232,98,42,.08)',
            border: `1px solid ${esMensual ? 'rgba(59,130,246,.25)' : 'rgba(232,98,42,.25)'}`,
          }}>
            {esMensual ? `🗓 Tarifa mensual (${diasSelec} días)` : `📅 Tarifa diaria (${diasSelec} día${diasSelec !== 1 ? 's' : ''})`}
          </div>
        )}
        {modo === 'ambos' && fechaDesde && !fechaHasta && (
          <div style={{ fontSize: '.72rem', color: 'var(--text3)', fontStyle: 'italic' }}>Seleccioná la fecha de fin</div>
        )}
        {modo === 'ambos' && !fechaDesde && (
          <div style={{ fontSize: '.72rem', color: 'var(--text3)', fontStyle: 'italic' }}>Seleccioná la fecha de inicio</div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
        <button
          onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text2)', padding: '.2rem .5rem' }}
        >←</button>
        <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.88rem' }}>
          {MONTHS[mi]} {year}
        </span>
        <button
          onClick={() => canGoNext && setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          style={{ background: 'none', border: 'none', cursor: canGoNext ? 'pointer' : 'default', fontSize: '1rem', color: canGoNext ? 'var(--text2)' : '#ccc', padding: '.2rem .5rem' }}
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
          const iso = toISO(d);

          if (modo === 'dia') {
            const selected = diasMulti.includes(iso);
            return (
              <div
                key={i}
                onClick={() => handleClick(d)}
                style={{
                  textAlign: 'center', fontSize: '.78rem', padding: '.32rem .1rem',
                  borderRadius: 6, cursor: (!past && avail) ? 'pointer' : 'default',
                  background: selected ? 'var(--orange)' : avail && !past ? 'rgba(16,185,129,.07)' : 'transparent',
                  color: selected ? '#fff' : past ? '#ccc' : avail ? 'var(--text)' : '#ccc',
                  border: selected ? '1.5px solid var(--orange)' : avail && !past ? '1px solid rgba(16,185,129,.2)' : '1px solid transparent',
                  fontWeight: selected ? 700 : 400,
                  opacity: past ? 0.4 : 1,
                }}
              >
                {d.getDate()}
              </div>
            );
          }

          const edge = isEdge(d);
          const range = inRange(d);
          return (
            <div
              key={i}
              onClick={() => handleClick(d)}
              style={{
                textAlign: 'center', fontSize: '.78rem', padding: '.32rem .1rem',
                borderRadius: 6, cursor: (!past && avail) ? 'pointer' : 'default',
                background: edge ? colorEdge : range ? colorRange : avail && !past ? 'rgba(16,185,129,.07)' : 'transparent',
                color: edge ? '#fff' : past ? '#ccc' : avail ? 'var(--text)' : '#ccc',
                border: edge ? `1.5px solid ${colorEdge}` : range ? borderRange : avail && !past ? '1px solid rgba(16,185,129,.2)' : '1px solid transparent',
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
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [diasMulti, setDiasMulti] = useState<string[]>([]);
  const [step1Error, setStep1Error] = useState('');
  const [periodoElegido, setPeriodoElegido] = useState<'dia' | 'mes' | null>(null);
  const [fechasOcupadas, setFechasOcupadas] = useState<string[]>([]);
  const mesesOcupados = useMemo(() => new Set(fechasOcupadas.map(f => f.slice(0, 7))), [fechasOcupadas]);

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

  const disponibilidad = (espacio as any)?.disponibilidad as { dias?: string[]; meses?: string[] } | undefined;

  // Modo del calendario según precios configurados y elección del usuario
  const tieneDia = Number(espacio?.precio_dia) > 0;
  const tieneMes = Number(espacio?.precio_mes) > 0;
  const ambosPrecios = tieneDia && tieneMes;
  const modoEfectivo: 'dia' | 'mes' = ambosPrecios
    ? (periodoElegido ?? 'dia')
    : tieneMes ? 'mes' : 'dia';
  const modoCalendario: ModoCalendario = modoEfectivo;

  // Pre-llenar DESDE con el mes actual cuando el modo es 'mes'
  useEffect(() => {
    if (modoCalendario === 'mes' && !fechaDesde) {
      const hoy = new Date();
      setFechaDesde(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`);
    }
  }, [modoCalendario, fechaDesde]);

  const cantMeses = modoCalendario === 'mes' && fechaDesde && fechaHasta
    ? mesesEntre(fechaDesde, fechaHasta)
    : 0;

  // Fecha máxima para reservas por día (hoy + 89 días = 90 días totales)
  const maxDate90 = (() => {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 89);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  // Último mes COMPLETO cubierto por la publicación (mes donde último día <= fecha_vencimiento)
  // e.g. vencimiento=2026-08-15 → julio (jul31 < ago15), vencimiento=2026-08-31 → agosto
  const ultimoMesCompletoVenc = (() => {
    const raw = espacio?.fecha_vencimiento;
    if (!raw) return undefined;
    const venc = String(raw).slice(0, 10);
    const [vy, vm, vd] = venc.split('-').map(Number);
    const lastDayOfVenMonth = new Date(vy, vm, 0).getDate();
    if (vd >= lastDayOfVenMonth) return `${vy}-${String(vm).padStart(2, '0')}`;
    const prevM = vm - 1;
    if (prevM === 0) return `${vy - 1}-12`;
    return `${vy}-${String(prevM).padStart(2, '0')}`;
  })();

  // Fecha máxima para reservas por día: el menor entre 90 días y el vencimiento
  // Se saneiza a YYYY-MM-DD por si mysql2 devuelve ISO completo ("2026-08-30T...")
  const maxDateFinal = (() => {
    const raw = espacio?.fecha_vencimiento;
    if (!raw) return maxDate90;
    const venc = String(raw).slice(0, 10);
    return maxDate90 < venc ? maxDate90 : venc;
  })();

  // Mes máximo para reservas por mes (3 meses desde inicio, capeado por vencimiento)
  const maxMesHasta = (() => {
    if (!fechaDesde) return ultimoMesCompletoVenc;
    const [y, m] = fechaDesde.split('-').map(Number);
    const totalM = (y * 12 + m - 1) + 2; // +2 meses más = 3 meses totales
    const maxY = Math.floor(totalM / 12);
    const maxM = (totalM % 12) + 1;
    const base = `${maxY}-${String(maxM).padStart(2, '0')}`;
    if (!ultimoMesCompletoVenc) return base;
    return base < ultimoMesCompletoVenc ? base : ultimoMesCompletoVenc;
  })();

  // Mes máximo para el campo DESDE (mes actual + 2, capeado por vencimiento)
  const maxMesDesde = (() => {
    const hoy = new Date();
    const totalM = hoy.getFullYear() * 12 + hoy.getMonth() + 2;
    const maxY = Math.floor(totalM / 12);
    const maxM = (totalM % 12) + 1;
    const base = `${maxY}-${String(maxM).padStart(2, '0')}`;
    if (!ultimoMesCompletoVenc) return base;
    return base < ultimoMesCompletoVenc ? base : ultimoMesCompletoVenc;
  })();

  // Para modo mes: el primer mes seleccionable es el próximo mes completo
  // (el mes en curso ya comenzó, no se puede reservar un mes completo que arrancó en el pasado)
  const minMesDesde = (() => {
    const hoy = new Date();
    const next = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
  })();

  // Lista de meses seleccionables en modo mes.
  // Fuente de verdad: disponibilidad.meses (el oferente declaró qué meses ofrece).
  // Si no hay meses declarados, se muestran todos los meses del rango como fallback.
  // En ambos casos se filtra: dentro del rango válido Y sin días ocupados por reservas.
  const mesesDisponiblesParaMes = (() => {
    if (!ultimoMesCompletoVenc) return [];

    // Determinar la lista base: lo que el oferente configuró, o todo el rango
    const mesesdOferente = disponibilidad?.meses ?? [];
    const usarOfertados = mesesdOferente.length > 0;

    if (usarOfertados) {
      // Solo los meses que el oferente habilitó, filtrados por rango y sin ocupados
      return mesesdOferente.filter(key =>
        key >= minMesDesde &&
        key <= ultimoMesCompletoVenc
      );
    }

    // Fallback: todos los meses desde el próximo hasta el último completo del vencimiento
    const meses: string[] = [];
    const [startY, startM] = minMesDesde.split('-').map(Number);
    const [endY, endM] = ultimoMesCompletoVenc.split('-').map(Number);
    let y = startY; let m = startM;
    while (y < endY || (y === endY && m <= endM)) {
      meses.push(`${y}-${String(m).padStart(2, '0')}`);
      m++; if (m > 12) { m = 1; y++; }
    }
    return meses;
  })();

  const precioEstimado = espacio
    ? modoCalendario === 'dia'
      ? diasMulti.length * Number(espacio.precio_dia)
      : modoCalendario === 'mes'
        ? cantMeses * Number(espacio.precio_mes)
        : fechaDesde && fechaHasta
          ? calcularPrecio(fechaDesde, fechaHasta, Number(espacio.precio_dia), Number(espacio.precio_mes))
          : 0
    : 0;

  const diasSeleccionados = modoCalendario === 'dia'
    ? diasMulti.length
    : fechaDesde && fechaHasta ? diasEntre(fechaDesde, fechaHasta) : 0;
  const esMensual = modoCalendario === 'mes' && cantMeses > 0;

  const serviciosTotal = servicios.reduce((acc, s) => acc + SERVICIOS_ADICIONALES[s].precio, 0);
  const totalFinal = precioEstimado + serviciosTotal;

  function toggleServicio(tipo: ServicioTipo) {
    setServicios(prev => prev.includes(tipo) ? prev.filter(s => s !== tipo) : [...prev, tipo]);
  }

  function goToStep2() {
    if (ambosPrecios && periodoElegido === null) { setStep1Error('Seleccioná si querés reservar por día o por mes.'); return; }
    if (modoCalendario === 'dia') {
      if (diasMulti.length === 0) { setStep1Error('Seleccioná al menos un día en el calendario.'); return; }
      if (diasMulti.length > 90) { setStep1Error('La reserva no puede superar los 90 días (3 meses).'); return; }
      const conflicto = diasMulti.find(d => fechasOcupadas.includes(d));
      if (conflicto) { setStep1Error(`El día ${conflicto} ya está reservado. Por favor quitalo de tu selección.`); return; }
    } else {
      if (!fechaDesde || !fechaHasta) { setStep1Error('Seleccioná las fechas de inicio y fin.'); return; }
      if (fechaHasta < fechaDesde) { setStep1Error('La fecha de fin debe ser posterior a la de inicio.'); return; }
      if (cantMeses > 3) { setStep1Error('La reserva no puede superar los 3 meses.'); return; }
    }
    if (modoCalendario !== 'dia' && fechaDesde && fechaHasta) {
      const overlap = fechasOcupadas.some(f => f >= fechaDesde && f <= fechaHasta);
      if (overlap) {
        const mesesConflicto = Array.from(mesesOcupados)
          .filter(mk => mk >= fechaDesde.slice(0, 7) && mk <= fechaHasta.slice(0, 7))
          .map(mk => {
            const [y, mo] = mk.split('-');
            const nombres = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
            return `${nombres[Number(mo) - 1]} ${y}`;
          });
        setStep1Error(
          mesesConflicto.length
            ? `Los siguientes meses tienen días ya reservados: ${mesesConflicto.join(', ')}. Cambiá el período de inicio o fin.`
            : 'El período seleccionado incluye fechas ya reservadas. Por favor elegí otras fechas.'
        );
        return;
      }
    }
    // Validar que la reserva no supere la fecha de vencimiento de la publicación
    if (espacio?.fecha_vencimiento) {
      const venc = espacio.fecha_vencimiento;
      if (modoCalendario === 'dia') {
        if (diasMulti.some(d => d > venc)) {
          setStep1Error(`Algunos días seleccionados superan la fecha límite de esta publicación (${venc}).`);
          return;
        }
      } else if (fechaHasta && fechaHasta > venc) {
        setStep1Error(`La reserva no puede extenderse más allá del vencimiento de esta publicación (${venc}).`);
        return;
      }
    }
    if (!espacio?.precio_dia && !espacio?.precio_mes) { setStep1Error('Este espacio no tiene precio configurado.'); return; }
    setStep1Error('');
    setStep(2);
  }

  async function handlePagar() {
    if (!user || !token || !espacio) return;
    setPayLoading(true);
    setPayError('');
    const fdDesde = modoCalendario === 'dia' ? diasMulti[0] : fechaDesde;
    const fdHasta = modoCalendario === 'dia' ? diasMulti[diasMulti.length - 1] : fechaHasta;
    try {
      const reserva = await reservasAPI.crear({
        espacio_id: espacioId, fecha_desde: fdDesde, fecha_hasta: fdHasta, servicios,
        modo: modoCalendario,
        diasMulti: modoCalendario === 'dia' ? diasMulti : undefined,
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
    const fdDesde = modoCalendario === 'dia' ? diasMulti[0] : fechaDesde;
    const fdHasta = modoCalendario === 'dia' ? diasMulti[diasMulti.length - 1] : fechaHasta;
    try {
      const reserva = await reservasAPI.crear({
        espacio_id: espacioId, fecha_desde: fdDesde, fecha_hasta: fdHasta, servicios,
        modo: modoCalendario,
        diasMulti: modoCalendario === 'dia' ? diasMulti : undefined,
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

                  {/* Calendario */}
                  <div>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.82rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '1rem' }}>
                      📅 Disponibilidad & Fechas
                    </div>

                    {/* Selector de período — solo cuando hay ambos precios */}
                    {ambosPrecios && (
                      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.25rem' }}>
                        {(['dia', 'mes'] as const).map(p => (
                          <button
                            key={p}
                            onClick={() => {
                              setPeriodoElegido(p);
                              if (p === 'mes') {
                                const hoy = new Date();
                                setFechaDesde(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`);
                              } else {
                                setFechaDesde('');
                              }
                              setFechaHasta('');
                              setDiasMulti([]);
                              setStep1Error('');
                            }}
                            style={{
                              flex: 1,
                              padding: '.7rem',
                              borderRadius: 'var(--r2)',
                              border: `2px solid ${periodoElegido === p ? 'var(--orange)' : 'var(--border)'}`,
                              background: periodoElegido === p ? 'rgba(232,98,42,.08)' : 'var(--surface)',
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all .15s',
                            }}
                          >
                            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1rem', color: periodoElegido === p ? 'var(--orange)' : 'var(--text)' }}>
                              {p === 'dia' ? formatARS(espacio!.precio_dia) : formatARS(espacio!.precio_mes)}
                            </div>
                            <div style={{ fontSize: '.72rem', color: periodoElegido === p ? 'var(--orange)' : 'var(--text3)', fontWeight: 600, marginTop: '.15rem' }}>
                              {p === 'dia' ? '📅 Por día' : '📆 Por mes'}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Mostrar calendario solo cuando ya eligió período (o solo tiene uno) */}
                    {(!ambosPrecios || periodoElegido !== null) && (
                      <>
                        {/* Calendario de días: solo cuando el modo NO es mes */}
                        {modoCalendario !== 'mes' && (
                          <MiniCalendar
                            diasDisponibles={disponibilidad?.dias}
                            diasOcupados={fechasOcupadas}
                            fechaDesde={fechaDesde}
                            fechaHasta={fechaHasta}
                            onSelect={(d, h) => { setFechaDesde(d); setFechaHasta(h); setStep1Error(''); }}
                            modo={modoCalendario}
                            diasMulti={diasMulti}
                            onSelectMulti={dias => { setDiasMulti(dias); setStep1Error(''); }}
                            maxDate={maxDateFinal}
                          />
                        )}

                        {modoCalendario === 'mes' && (() => {
                          const NOMBRES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
                          const mesDesde = fechaDesde ? fechaDesde.slice(0, 7) : '';
                          const mesHasta = fechaHasta ? fechaHasta.slice(0, 7) : '';

                          function labelMes(key: string) {
                            const [y, mo] = key.split('-');
                            return `${NOMBRES[Number(mo) - 1]} ${y}`;
                          }

                          function handleClickMes(key: string) {
                            if (mesesOcupados.has(key)) return;
                            const [y, m] = key.split('-').map(Number);
                            const lastDay = new Date(y, m, 0).getDate();
                            if (!mesDesde || mesHasta) {
                              // Primera selección: fija DESDE y limpia HASTA
                              setFechaDesde(`${y}-${String(m).padStart(2, '0')}-01`);
                              setFechaHasta('');
                            } else if (key < mesDesde) {
                              // Click en mes anterior al DESDE: resetea
                              setFechaDesde(`${y}-${String(m).padStart(2, '0')}-01`);
                              setFechaHasta('');
                            } else {
                              // Segunda selección: fija HASTA
                              setFechaHasta(`${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
                            }
                            setStep1Error('');
                          }

                          if (mesesDisponiblesParaMes.length === 0) {
                            return (
                              <div style={{ fontSize: '.82rem', color: '#ef4444', marginTop: '1rem', textAlign: 'center' }}>
                                No hay meses completos disponibles para reserva mensual en esta publicación.
                              </div>
                            );
                          }

                          return (
                            <div style={{ marginTop: '1rem' }}>
                              <div style={{ fontSize: '.73rem', color: 'var(--text3)', marginBottom: '.6rem' }}>
                                {!mesDesde ? '🗓 Tocá el mes de inicio' : !mesHasta ? '🗓 Ahora tocá el mes de fin (o el mismo para reservar 1 mes)' : `📅 ${labelMes(mesDesde)} → ${labelMes(mesHasta)}`}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                                {mesesDisponiblesParaMes.map(key => {
                                  const ocupado = mesesOcupados.has(key);
                                  const isDesde = key === mesDesde;
                                  const isHasta = key === mesHasta;
                                  const inRange = mesDesde && mesHasta && key > mesDesde && key < mesHasta;
                                  const isEdge = isDesde || isHasta;
                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => handleClickMes(key)}
                                      disabled={ocupado}
                                      style={{
                                        padding: '.4rem .9rem',
                                        borderRadius: 20,
                                        border: isEdge ? '2px solid var(--orange)' : inRange ? '2px solid rgba(232,98,42,.4)' : '1.5px solid #ddd',
                                        background: isEdge ? 'var(--orange)' : inRange ? 'rgba(232,98,42,.1)' : ocupado ? '#f3f3f3' : '#fff',
                                        color: isEdge ? '#fff' : ocupado ? '#bbb' : 'var(--text)',
                                        fontFamily: 'Sora, sans-serif',
                                        fontWeight: isEdge ? 700 : 500,
                                        fontSize: '.82rem',
                                        cursor: ocupado ? 'not-allowed' : 'pointer',
                                        position: 'relative',
                                      }}
                                    >
                                      {labelMes(key)}
                                      {ocupado && <span style={{ fontSize: '.62rem', display: 'block', color: '#bbb' }}>días ocupados</span>}
                                    </button>
                                  );
                                })}
                              </div>
                              {mesDesde && !mesHasta && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const [y, m] = mesDesde.split('-').map(Number);
                                    const lastDay = new Date(y, m, 0).getDate();
                                    setFechaHasta(`${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
                                    setStep1Error('');
                                  }}
                                  style={{ marginTop: '.6rem', fontSize: '.72rem', color: 'var(--orange)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                >
                                  ↩ Reservar solo {labelMes(mesDesde)}
                                </button>
                              )}
                            </div>
                          );
                        })()}

                        {/* Price preview */}
                        {precioEstimado > 0 && (
                          <div style={{
                            marginTop: '1rem', padding: '.9rem 1.1rem',
                            background: 'rgba(232,98,42,.06)', border: '1px solid rgba(232,98,42,.18)',
                            borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}>
                            <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>
                              {modoCalendario === 'dia'
                                ? `${diasSeleccionados} día${diasSeleccionados !== 1 ? 's' : ''} × ${formatARS(espacio.precio_dia)}/día`
                                : esMensual
                                  ? `${cantMeses} mes${cantMeses !== 1 ? 'es' : ''} × ${formatARS(espacio.precio_mes)}/mes`
                                  : `${diasSeleccionados} día${diasSeleccionados !== 1 ? 's' : ''} × ${formatARS(espacio.precio_dia)}/día`}
                            </div>
                            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: 'var(--orange)' }}>
                              {formatARS(precioEstimado)}
                            </div>
                          </div>
                        )}
                      </>
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
                              {tipo === 'seguro' && 'Cobertura contra robo, incendio y daños'}
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
                    <span style={{ color: 'var(--text2)' }}>Espacio ({diasSeleccionados} días)</span>
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
                              onRegister={async (nombre, email, password, tipo, tel) => {
                                const ok = await register(nombre, email, password, tipo, tel);
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
                          ['Desde', fechaDesde],
                          ['Hasta', fechaHasta],
                          ['Duración', esMensual ? `${cantMeses} mes${cantMeses !== 1 ? 'es' : ''}` : `${diasSeleccionados} día${diasSeleccionados !== 1 ? 's' : ''}`],
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
                    <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(2)}>
                      ← Volver
                    </button>
                    <button className="btn-secondary" style={{ flex: 1 }} onClick={() => router.push(`/espacio/${espacioId}`)}>
                      Cancelar
                    </button>
                  </div>

                  <p style={{ fontSize: '.72rem', color: 'var(--text3)', textAlign: 'center', lineHeight: 1.6, marginTop: '.75rem' }}>
                    Al proceder con el pago aceptás nuestros{' '}
                    <a href="/legales" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange)', textDecoration: 'underline' }}>
                      Términos y Condiciones
                    </a>
                    {' '}y{' '}
                    <a href="/legales" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange)', textDecoration: 'underline' }}>
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
