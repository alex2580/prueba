'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import dynamic from 'next/dynamic';
import type { Espacio, EspacioTipo } from '@/types';
import { useEspacios } from '@/hooks/useEspacios';
import { useAuth } from '@/hooks/useAuth';
import { GridEspacios } from '@/components/espacios/GridEspacios';
import { FiltrosEspacios } from '@/components/espacios/FiltrosEspacios';
import { FiltroFechas } from '@/components/espacios/FiltroFechas';
import { Modal } from '@/components/ui/Modal';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { OTPStep } from '@/components/auth/OTPStep';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { ContactoForm } from '@/components/contacto/ContactoForm';
import { ComoFuncionaFlow, PASOS_RESERVAR, PASOS_PUBLICAR } from '@/components/ui/ComoFuncionaFlow';

const MapaEspacios = dynamic(() => import('@/components/mapa/MapaEspacios').then(m => ({ default: m.MapaEspacios })), { ssr: false });
const MarkerEspacioCard = dynamic(() => import('@/components/mapa/MarkerEspacio').then(m => ({ default: m.MarkerEspacioCard })), { ssr: false });

type Vista = 'mapa' | 'lista';

const FAQ = [
  {
    q: '¿Cuándo se le paga a quien cuidará tus cosas?',
    a: 'El pago queda retenido como depósito en garantía a través de MercadoPago. Quien cuidará tus cosas lo recibe recién cuando vos confirmás el acceso al espacio desde tu panel, no antes.',
  },
  {
    q: '¿Cuál es la diferencia entre un espacio exclusivo y uno compartido?',
    a: 'En un espacio exclusivo solo vos usás el lugar, con acceso privado. En uno compartido, varios clientes guardan sus cosas al mismo tiempo en el mismo espacio, lo que suele tener un precio más bajo.',
  },
  {
    q: '¿Puedo cancelar una reserva si me arrepiento?',
    a: 'Sí, con el botón "Me arrepentí" podés cancelar y te reembolsamos el 100% de lo pagado, siempre antes de coordinar el acceso con quien cuidará tus cosas.',
  },
  {
    q: '¿Cuánto cuesta publicar un espacio?',
    a: 'Publicar es 100% gratis. TodasMisCosas.com solo cobra una comisión del 15% cuando se concreta una reserva. Si nadie te reserva, no pagás nada.',
  },
  {
    q: '¿Qué hago si tengo un problema con el espacio o con quien procedió con el cuidado de mis cosas?',
    a: 'Podés contactarnos antes de confirmar el acceso desde la misma reserva. Mientras no confirmes, el dinero sigue retenido en garantía y podemos intervenir para resolver cualquier inconveniente.',
  },
];

export default function HomePage() {
  const t = useTranslations('home');
  const tc = useTranslations('comoFunciona');
  const router = useRouter();
  const { user, token, loading: authLoading, login, register, logout, error: authError, isAdmin,
    otpPending, otpEmailHint, otpCanales, verifyOTP, reenviarOTP,
    emailConfirmPending, emailConfirmEmail } = useAuth();
  const [filtrosIniciales] = useState<import('@/types').FiltrosEspacios>({});
  const { espacios, loading, error: espaciosError, filtros, aplicarFiltros, limpiarFiltros } = useEspacios(filtrosIniciales);

  const [vista, setVista] = useState<Vista>('lista');

  const [selectedEspacio, setSelectedEspacio] = useState<Espacio | null>(null);
  const [authModal, setAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [busqueda, setBusqueda] = useState('');
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [seguridadInfoPos, setSeguridadInfoPos] = useState<{ top: number; left: number } | null>(null);
  const seguridadInfoIconRef = useRef<HTMLSpanElement>(null);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [headerExpandido, setHeaderExpandido] = useState(false);
  const [faqAbierta, setFaqAbierta] = useState<number | null>(null);
  const [precioPillPos, setPrecioPillPos] = useState<{ top: number; left: number } | null>(null);
  const precioPillRef = useRef<HTMLButtonElement>(null);

  function actualizarHeaderScroll(top: number) {
    // Histéresis: colapsa pasados los 80px, recién vuelve a expandirse por
    // debajo de 20px. Con un solo umbral, el scroll lento que se queda
    // rondando ese valor hace titilar el header al cruzarlo de a poco.
    setHeaderScrolled(prev => {
      if (!prev && top > 80) return true;
      if (prev && top < 20) return false;
      return prev;
    });
    if (top < 20) setHeaderExpandido(false);
  }

  // La vista lista fluye con el scroll del body (no tiene su propio
  // contenedor interno) para que el footer no quede en un contexto de
  // scroll anidado y "ancle" al querer volver arriba.
  useEffect(() => {
    if (vista !== 'lista') return;
    function onScroll() { actualizarHeaderScroll(window.scrollY); }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [vista]);

  // Lee la URL real recién después de montar (no durante la hidratación)
  // para que el primer render del cliente coincida con el del servidor —
  // leer window.location.search en el inicializador del useState causaba
  // un hydration mismatch cuando la URL traía query params.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const f: import('@/types').FiltrosEspacios = {};
    if (p.get('tipo'))          f.tipo = p.get('tipo') as EspacioTipo;
    if (p.get('barrio'))        f.barrio = p.get('barrio')!;
    if (p.get('pais'))          f.pais = p.get('pais')!;
    if (p.get('precio_max'))    f.precio_max = Number(p.get('precio_max'));
    if (p.get('seguridad_min')) f.seguridad_min = Number(p.get('seguridad_min'));
    if (p.get('q'))             f.q = p.get('q')!;
    if (p.get('fecha_desde'))   f.fecha_desde = p.get('fecha_desde')!;
    if (p.get('fecha_hasta'))   f.fecha_hasta = p.get('fecha_hasta')!;
    if (Object.keys(f).length) aplicarFiltros(f);
    if (f.q) setBusqueda(f.q);
    if (p.get('vista') === 'mapa') setVista('mapa');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token) { setFavIds(new Set()); return; }
    import('@/lib/api').then(({ favoritosAPI }) =>
      favoritosAPI.listarIds(token).then(ids => setFavIds(new Set(ids))).catch(() => {})
    );
  }, [token]);

  function handleToggleFavorito(id: string, val: boolean) {
    setFavIds(prev => {
      const next = new Set(prev);
      if (val) next.add(id); else next.delete(id);
      return next;
    });
  }

  useEffect(() => {
    if (user?.lat && user?.lng && !userLocation) {
      setUserLocation({ lat: Number(user.lat), lng: Number(user.lng) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (vista === 'mapa')       p.set('vista', 'mapa');
    if (filtros.tipo)           p.set('tipo', filtros.tipo);
    if (filtros.barrio)         p.set('barrio', filtros.barrio);
    if (filtros.pais)           p.set('pais', filtros.pais);
    if (filtros.precio_max !== undefined) p.set('precio_max', String(filtros.precio_max));
    if (filtros.seguridad_min)  p.set('seguridad_min', String(filtros.seguridad_min));
    if (filtros.q)              p.set('q', filtros.q);
    if (filtros.fecha_desde)    p.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta)    p.set('fecha_hasta', filtros.fecha_hasta);
    const qs = p.toString();
    history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [filtros, vista]);

  function handleCercaMio() {
    if (!navigator.geolocation) { setGeoError('Tu navegador no soporta geolocalización'); return; }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
        setFiltrosOpen(false);
      },
      () => { setGeoError('No se pudo obtener tu ubicación'); setGeoLoading(false); }
    );
  }

  const [contactoOpen, setContactoOpen] = useState(false);

  function handleMarkerClick(espacio: Espacio) {
    setSelectedEspacio(espacio);
  }

  // URL actual (filtros, búsqueda y vista ya sincronizados por el efecto
  // de arriba) para que "Volver" desde la publicación traiga de vuelta
  // exactamente los mismos filtros activos.
  function volverQS() {
    return encodeURIComponent(`/${window.location.search}`);
  }

  function handleReservar(espacio: Espacio) {
    router.push(`/espacio/${espacio.id}/reservar`);
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBusqueda = useCallback((q: string) => {
    setBusqueda(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      aplicarFiltros({ q: q || undefined });
    }, 350);
  }, [aplicarFiltros]);

  function fmtCorta(iso?: string): string {
    if (!iso) return '';
    return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }

  const PRECIO_MAX_DIA = 10000;
  const PRECIO_STEP = 500;
  const precioValHome = filtros.precio_max ?? PRECIO_MAX_DIA;

  const filtrosActivos = !!(filtros.tipo || filtros.precio_max !== undefined || filtros.barrio || filtros.q || filtros.pais || filtros.seguridad_min || filtros.fecha_desde);
  const hayFiltrosActivos = !!(filtros.tipo || filtros.precio_max !== undefined || userLocation || filtros.q || filtros.pais || filtros.seguridad_min || filtros.fecha_desde);

  return (
    <div style={{
      height: vista === 'mapa' ? '100vh' : 'auto',
      minHeight: vista === 'lista' ? '100vh' : undefined,
      display: 'flex', flexDirection: 'column', background: 'var(--bg)',
    }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <SiteHeader
        onLoginClick={() => { setAuthTab('login'); setAuthModal(true); }}
        onRegisterClick={() => { setAuthTab('register'); setAuthModal(true); }}
        onLogoClick={() => { if (vista === 'mapa') setVista('lista'); }}
      />

      {/* ── Content ────────────────────────────────────────── */}
      <div style={{
        flex: vista === 'mapa' ? 1 : undefined,
        overflow: vista === 'mapa' ? 'hidden' : 'visible',
        position: 'relative',
      }}>

        {/* ── Mapa ─────────────────────────────────────────── */}
        {vista === 'mapa' && (
          <div style={{ height: '100%', position: 'relative' }}>

            {/* Ver lista — flotante arriba izquierda */}
            <button
              onClick={() => setVista('lista')}
              style={{
                position: 'absolute', top: '1.1rem', left: '1rem', zIndex: 110,
                background: 'rgba(255,255,255,.97)',
                border: '1.5px solid var(--border2)',
                borderRadius: '999px',
                padding: '.48rem 1.1rem',
                fontSize: '.82rem', fontWeight: 700,
                fontFamily: 'Sora, sans-serif',
                cursor: 'pointer',
                boxShadow: '0 2px 14px rgba(0,0,0,.1)',
                backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', gap: '.4rem',
                color: 'var(--text)',
                transition: 'all .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--text)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'; }}
            >
              {t('verLista')}
            </button>

            {/* Filtros — flotante arriba derecha */}
            <div
              style={{ position: 'absolute', top: '1.1rem', right: '4.5rem', zIndex: 110 }}
              onMouseEnter={() => setFiltrosOpen(true)}
              onMouseLeave={() => setFiltrosOpen(false)}
            >
              <button
                onClick={() => setFiltrosOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.45rem',
                  background: filtrosActivos ? 'rgba(232,98,42,.1)' : 'rgba(255,255,255,.97)',
                  border: `1.5px solid ${filtrosActivos ? 'rgba(232,98,42,.35)' : 'var(--border2)'}`,
                  borderRadius: '999px', padding: '.48rem 1.1rem',
                  fontSize: '.82rem', fontWeight: 700, fontFamily: 'Sora, sans-serif',
                  cursor: 'pointer',
                  boxShadow: '0 2px 14px rgba(0,0,0,.1)',
                  color: filtrosActivos ? 'var(--orange)' : 'var(--text)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all .15s',
                }}
              >
                <span>⚙️</span>
                {t('filtros')}
                {filtrosActivos && (
                  <span style={{
                    background: 'var(--orange)', color: '#fff',
                    borderRadius: '50%', width: 18, height: 18,
                    fontSize: '.65rem', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {[filtros.tipo, filtros.precio_max !== undefined].filter(Boolean).length}
                  </span>
                )}
              </button>

              {filtrosOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, paddingTop: '.5rem' }}>
                  <div style={{
                    background: 'var(--surface)',
                    border: '1.5px solid var(--border)', borderRadius: 16,
                    padding: '1.2rem', width: 280,
                    boxShadow: 'var(--s3)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.9rem', color: 'var(--text)' }}>
                        Filtros
                      </span>
                      <button onClick={() => setFiltrosOpen(false)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text3)', fontSize: '1.1rem', lineHeight: 1,
                      }}>✕</button>
                    </div>
                    <FiltrosEspacios
                      filtros={filtros}
                      onChange={aplicarFiltros}
                      onReset={limpiarFiltros}
                      onCercaMio={handleCercaMio}
                      cercaMioActive={!!userLocation}
                      cercaMioLoading={geoLoading}
                      onQuitarCercaMio={() => setUserLocation(null)}
                      geoError={geoError}
                    />
                  </div>
                </div>
              )}
            </div>

            <MapaEspacios
              espacios={espacios}
              onMarkerClick={handleMarkerClick}
              selectedId={selectedEspacio?.id}
              center={userLocation ?? undefined}
              filtrosActivos={filtrosActivos}
            />
            {selectedEspacio && (
              <MarkerEspacioCard
                espacio={selectedEspacio}
                onClose={() => setSelectedEspacio(null)}
                onVerDetalle={() => router.push(`/espacio/${selectedEspacio.id}?volver=${volverQS()}`)}
                onReservar={() => router.push(`/espacio/${selectedEspacio.id}/reservar?from=mapa`)}
              />
            )}
          </div>
        )}

        {/* ── Lista ────────────────────────────────────────── */}
        {vista === 'lista' && (
          <div className="page-scroll" style={{ height: 'auto', overflowY: 'visible' }}>

            {/* Sticky search + filters header — colapsa a una pastilla al scrollear */}
            <div className="list-search-header">
              <div className={`search-collapsible ${headerScrolled && !headerExpandido ? 'is-visible' : ''}`}>
                <div className="search-collapsible__inner">
                  <div className="search-pill-compact">
                    <button
                      type="button"
                      className="search-pill-compact__segment"
                      onClick={() => setHeaderExpandido(true)}
                    >
                      <span>🔍</span>
                      <span className="search-pill-compact__item">{busqueda || t('searchPlaceholder')}</span>
                      <span className="search-pill-compact__dot">·</span>
                      <span className="search-pill-compact__item">
                        {filtros.fecha_desde ? `${fmtCorta(filtros.fecha_desde)} - ${fmtCorta(filtros.fecha_hasta)}` : 'Fechas'}
                      </span>
                    </button>
                    <span className="search-pill-compact__dot">·</span>
                    <button
                      type="button"
                      ref={precioPillRef}
                      className="search-pill-compact__segment"
                      onClick={() => {
                        const rect = precioPillRef.current?.getBoundingClientRect();
                        if (rect) setPrecioPillPos({ top: rect.bottom + 8, left: Math.min(rect.left, window.innerWidth - 240 - 16) });
                      }}
                    >
                      <span className="search-pill-compact__item">
                        {precioValHome < PRECIO_MAX_DIA ? `$${precioValHome.toLocaleString('es-AR')}/día` : 'Precio'}
                      </span>
                    </button>
                  </div>

                  {precioPillPos && (
                    <>
                      <div onClick={() => setPrecioPillPos(null)} style={{ position: 'fixed', inset: 0, zIndex: 499 }} />
                      <div style={{
                        position: 'fixed', top: precioPillPos.top, left: precioPillPos.left, zIndex: 500,
                        background: 'var(--surface)', border: '1.5px solid var(--border)',
                        borderRadius: 'var(--r3)', padding: '1rem', boxShadow: 'var(--s3)', width: 240,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.6rem' }}>
                          <span style={{ fontSize: '.75rem', fontWeight: 700, fontFamily: 'Sora, sans-serif', color: 'var(--text)' }}>💰 Precio máx/día</span>
                          <span style={{ fontSize: '.82rem', fontWeight: 700, color: precioValHome < PRECIO_MAX_DIA ? 'var(--orange)' : 'var(--text3)' }}>
                            {precioValHome < PRECIO_MAX_DIA ? `$${precioValHome.toLocaleString('es-AR')}` : 'Sin límite'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0} max={PRECIO_MAX_DIA} step={PRECIO_STEP}
                          value={precioValHome > PRECIO_MAX_DIA ? PRECIO_MAX_DIA : precioValHome}
                          onChange={e => {
                            const val = Number(e.target.value);
                            aplicarFiltros({ precio_max: val < PRECIO_MAX_DIA ? val : undefined });
                          }}
                          style={{ width: '100%', height: 4, cursor: 'pointer', accentColor: 'var(--orange)' }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className={`search-collapsible ${!(headerScrolled && !headerExpandido) ? 'is-visible' : ''}`}>
                <div className="search-collapsible__inner">
              {headerScrolled && (
                <button className="search-pill-close" onClick={() => setHeaderExpandido(false)}>
                  ✕ Cerrar
                </button>
              )}
              {/* Search bar row */}
              <div className="list-search-row">
                <div className="search-bar-wrap">
                  <span style={{ color: 'var(--text3)', fontSize: '1rem', flexShrink: 0 }}>🔍</span>
                  <input
                    type="text"
                    className="search-bar-input"
                    placeholder={t('searchPlaceholder')}
                    value={busqueda}
                    onChange={e => handleBusqueda(e.target.value)}
                  />
                  {busqueda && (
                    <button
                      onClick={() => handleBusqueda('')}
                      style={{
                        background: 'var(--surface3)', border: 'none', borderRadius: '50%',
                        width: 22, height: 22, fontSize: '.7rem', cursor: 'pointer',
                        color: 'var(--text2)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >✕</button>
                  )}
                </div>

                <FiltroFechas
                  fechaDesde={filtros.fecha_desde}
                  fechaHasta={filtros.fecha_hasta}
                  onChange={(fecha_desde, fecha_hasta) => aplicarFiltros({ fecha_desde, fecha_hasta })}
                />
              </div>

                </div>
              </div>
            </div>

            {/* Hero */}
            <div style={{
              background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)',
              borderBottom: '1px solid var(--border)',
              padding: '3rem 1.5rem 2.5rem',
              textAlign: 'center',
            }}>
              <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3.2rem)', lineHeight: 1.15, marginBottom: '1.25rem' }}>
                <span style={{ color: 'var(--text)', display: 'block' }}>{tc('heroTitulo1')}</span>
                <span style={{ color: 'var(--orange)', display: 'block' }}>{tc('heroTitulo2')}</span>
              </h1>
              <p style={{ color: 'var(--text2)', fontSize: '.95rem', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
                {tc('heroDesc')}
              </p>
            </div>

            {/* Filtros — sección propia, independiente del header que se colapsa */}
            <div className="filter-pills-bar">

              {/* País */}
              <select
                value={filtros.pais || ''}
                onChange={e => aplicarFiltros({ pais: e.target.value || undefined })}
                className={`filter-pill ${filtros.pais ? 'active' : ''}`}
                style={{ cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <option value="">{t('pais')}</option>
                <option value="Argentina">🇦🇷 Argentina</option>
                <option value="Uruguay">🇺🇾 Uruguay</option>
                <option value="Chile">🇨🇱 Chile</option>
                <option value="Colombia">🇨🇴 Colombia</option>
                <option value="México">🇲🇽 México</option>
                <option value="Brasil">🇧🇷 Brasil</option>
                <option value="Perú">🇵🇪 Perú</option>
                <option value="Paraguay">🇵🇾 Paraguay</option>
                <option value="Puerto Rico">🇵🇷 Puerto Rico</option>
              </select>

              {/* Tipo */}
              <button
                className={`filter-pill ${filtros.tipo === 'exclusivo' ? 'active' : ''}`}
                onClick={() => aplicarFiltros({ tipo: (filtros.tipo === 'exclusivo' ? '' : 'exclusivo') as EspacioTipo })}
              >
                {t('exclusivo')}
              </button>
              <button
                className={`filter-pill ${filtros.tipo === 'compartido' ? 'active' : ''}`}
                onClick={() => aplicarFiltros({ tipo: (filtros.tipo === 'compartido' ? '' : 'compartido') as EspacioTipo })}
              >
                {t('compartido')}
              </button>

              {/* Precio máximo por día */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '.5rem',
                padding: '.3rem .65rem .3rem .9rem',
                borderRadius: 999, flexShrink: 0,
                border: `1.5px solid ${precioValHome < PRECIO_MAX_DIA ? 'var(--text)' : 'var(--border2)'}`,
                background: precioValHome < PRECIO_MAX_DIA ? 'var(--text)' : 'var(--surface)',
              }}>
                <span style={{
                  fontSize: '.82rem', fontWeight: 700, whiteSpace: 'nowrap',
                  color: precioValHome < PRECIO_MAX_DIA ? '#fff' : 'var(--text)',
                  fontFamily: 'Sora, sans-serif',
                }}>
                  💰 {precioValHome < PRECIO_MAX_DIA ? `$${precioValHome.toLocaleString('es-AR')}/día` : t('precioDia')}
                </span>
                <input
                  type="range"
                  min={0} max={PRECIO_MAX_DIA} step={PRECIO_STEP}
                  value={precioValHome > PRECIO_MAX_DIA ? PRECIO_MAX_DIA : precioValHome}
                  onChange={e => {
                    const val = Number(e.target.value);
                    aplicarFiltros({ precio_max: val < PRECIO_MAX_DIA ? val : undefined });
                  }}
                  style={{ width: 180, height: 4, cursor: 'pointer', accentColor: precioValHome < PRECIO_MAX_DIA ? '#fff' : 'var(--orange)' }}
                />
              </div>

              {/* Nivel de Seguridad */}
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0, gap: '.3rem' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '.15rem',
                  padding: '.3rem .9rem',
                  borderRadius: 999,
                  border: `1.5px solid ${filtros.seguridad_min ? 'var(--text)' : 'var(--border2)'}`,
                  background: filtros.seguridad_min ? 'var(--text)' : 'var(--surface)',
                }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      onClick={() => aplicarFiltros({ seguridad_min: filtros.seguridad_min === star ? undefined : star })}
                      style={{
                        fontSize: '1rem', cursor: 'pointer', lineHeight: 1,
                        color: star <= (filtros.seguridad_min || 0) ? 'var(--amber)' : filtros.seguridad_min ? 'rgba(255,255,255,.25)' : 'var(--border)',
                        transition: 'color .12s',
                      }}
                    >★</span>
                  ))}
                  <span style={{
                    fontSize: '.78rem', fontWeight: 700, whiteSpace: 'nowrap',
                    color: filtros.seguridad_min ? '#fff' : 'var(--text)',
                    fontFamily: 'Sora, sans-serif', marginLeft: '.3rem',
                  }}>
                    {filtros.seguridad_min ? `${filtros.seguridad_min}+ ★` : t('nivelSeguridad')}
                  </span>
                </div>

                {/* Info icon */}
                <span
                  ref={seguridadInfoIconRef}
                  onMouseEnter={() => {
                    const rect = seguridadInfoIconRef.current?.getBoundingClientRect();
                    if (rect) setSeguridadInfoPos({ top: rect.bottom + 8, left: Math.min(rect.left, window.innerWidth - 270 - 16) });
                  }}
                  onMouseLeave={() => setSeguridadInfoPos(null)}
                  style={{ fontSize: '.78rem', cursor: 'help', color: 'var(--text3)', lineHeight: 1, userSelect: 'none' }}
                >ℹ️</span>

                {/* Popover */}
                {seguridadInfoPos && (
                  <div style={{
                    position: 'fixed', top: seguridadInfoPos.top, left: seguridadInfoPos.left, zIndex: 500,
                    background: 'var(--surface)', border: '1.5px solid var(--border)',
                    borderRadius: 'var(--r3)', padding: '1rem',
                    boxShadow: 'var(--s3)', width: 270,
                    pointerEvents: 'none',
                  }}>
                    <p style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 .6rem', fontFamily: 'Sora, sans-serif' }}>
                      🔒 ¿Qué mide la seguridad?
                    </p>
                    <p style={{ fontSize: '.72rem', color: 'var(--text3)', margin: '0 0 .75rem', lineHeight: 1.5 }}>
                      Cada publicación responde un checklist de 8 características. El puntaje refleja cuántas cumple.
                    </p>
                    {[
                      { stars: '★', label: 'Básico', desc: 'Cerradura en la entrada' },
                      { stars: '★★', label: 'Elemental', desc: '+ Estructura seca y ventilada' },
                      { stars: '★★★', label: 'Intermedio', desc: '+ Iluminación en el espacio' },
                      { stars: '★★★★', label: 'Avanzado', desc: '+ Cámaras o acceso controlado' },
                      { stars: '★★★★★', label: 'Máximo', desc: '+ Acceso 24hs y extintor' },
                    ].map(row => (
                      <div key={row.stars} style={{ display: 'flex', alignItems: 'baseline', gap: '.5rem', marginBottom: '.35rem' }}>
                        <span style={{ fontSize: '.72rem', color: 'var(--amber)', minWidth: 56, flexShrink: 0 }}>{row.stars}</span>
                        <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text2)', minWidth: 64, flexShrink: 0 }}>{row.label}</span>
                        <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{row.desc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Limpiar */}
              {hayFiltrosActivos && (
                <button
                  className="filter-pill"
                  style={{ color: 'var(--orange)', borderColor: 'rgba(232,98,42,.3)' }}
                  onClick={() => { limpiarFiltros(); setUserLocation(null); setBusqueda(''); }}
                >
                  {t('limpiar')}
                </button>
              )}
            </div>

            {/* Results grid */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.25rem 1.5rem 7rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontFamily: 'Sora, sans-serif', fontSize: '.82rem', fontWeight: 600, color: 'var(--text2)' }}>
                  {loading ? t('cargando') : espaciosError ? t('errorCargar') : t('espaciosEncontrados', { count: espacios.length })}
                </span>
              </div>

              {espaciosError && !loading && (
                <div className="alert alert--error" style={{ marginBottom: '1rem' }}>
                  {espaciosError} {t('errorConexion')}
                </div>
              )}

              <GridEspacios
                espacios={espacios}
                loading={loading}
                onCardClick={espacio => router.push(`/espacio/${espacio.id}?volver=${volverQS()}`)}
                favoritos={favIds}
                onToggleFavorito={handleToggleFavorito}
                token={token}
              />
            </div>

            <ComoFuncionaFlow titulo="El flujo para hacer una reserva" pasos={PASOS_RESERVAR} />

            <ComoFuncionaFlow titulo="El flujo para publicar tu espacio" pasos={PASOS_PUBLICAR} />

            {/* CTA publicar — debajo del flujo de publicación, arriba de las preguntas frecuentes */}
            <div style={{ textAlign: 'center', padding: '0 1.5rem 3rem' }}>
              <button className="btn-primary" onClick={() => router.push('/publicar')}>
                {tc('publicarBtn')}
              </button>
            </div>

            {/* Preguntas frecuentes */}
            <div id="preguntas-frecuentes" style={{ maxWidth: 720, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.3rem', textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text)' }}>
                Preguntas frecuentes
              </h2>
              <div style={{ display: 'grid', gap: '.75rem' }}>
                {FAQ.map((item, i) => (
                  <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                    <button
                      onClick={() => setFaqAbierta(faqAbierta === i ? null : i)}
                      style={{
                        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem',
                        padding: '.9rem 1.1rem', textAlign: 'left',
                        fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.9rem', color: 'var(--text)',
                      }}
                    >
                      {item.q}
                      <span style={{ color: 'var(--orange)', flexShrink: 0, transform: faqAbierta === i ? 'rotate(45deg)' : 'none', transition: 'transform .15s', fontSize: '1.1rem' }}>+</span>
                    </button>
                    {faqAbierta === i && (
                      <p style={{ margin: 0, padding: '0 1.1rem 1rem', fontSize: '.85rem', color: 'var(--text2)', lineHeight: 1.6 }}>
                        {item.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Floating "Ver en Mapa" button */}
            <button className="btn-ver-mapa" onClick={() => setVista('mapa')}>
              {t('verMapa')}
              {!loading && espacios.length > 0 && (
                <span style={{
                  background: 'rgba(255,255,255,.2)',
                  borderRadius: 999,
                  padding: '2px 8px',
                  fontSize: '.78rem',
                  fontWeight: 600,
                }}>
                  {espacios.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Floating Contacto button */}
      <button
        className="contacto-btn"
        onClick={() => setContactoOpen(true)}
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem',
          background: 'var(--surface)', border: '1.5px solid var(--border2)',
          borderRadius: 'var(--r4)', padding: '.6rem 1.1rem',
          color: 'var(--text2)', fontSize: '.82rem', fontWeight: 600,
          boxShadow: 'var(--s2)', zIndex: 200, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '.4rem',
          transition: 'border-color .15s, color .15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--orange)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--orange)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'; }}
      >
        💬<span className="contacto-label"> Contacto</span>
      </button>

      {/* Contacto modal */}
      <Modal
        open={contactoOpen}
        onClose={() => setContactoOpen(false)}
        title="💬 Contactanos"
        subtitle="Consultás, reclamos o sugerencias. Te respondemos a la brevedad."
        maxWidth="520px"
      >
        <ContactoForm onDone={() => setContactoOpen(false)} />
      </Modal>

      {/* Auth Modal */}
      <Modal
        open={authModal}
        onClose={() => setAuthModal(false)}
        title={emailConfirmPending ? '📧 Revisá tu email' : otpPending ? '🔐 Verificación' : authTab === 'login' ? '👋 Iniciar sesión' : '🚀 Crear cuenta'}
        subtitle={emailConfirmPending ? undefined : otpPending ? undefined : authTab === 'login' ? 'Ingresá a tu cuenta de TodasMisCosas' : 'Únite a la comunidad de almacenamiento urbano'}
      >
        {emailConfirmPending ? (
          <div style={{ textAlign: 'center', padding: '.5rem 0' }}>
            <p style={{ color: 'var(--text2)', fontSize: '.88rem', lineHeight: 1.6, marginBottom: '.5rem' }}>
              Te enviamos un link de confirmación a{' '}
              <strong style={{ color: 'var(--text)' }}>{emailConfirmEmail}</strong>.
            </p>
            <p style={{ color: 'var(--text2)', fontSize: '.88rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              Hacé clic en ese link para activar tu cuenta y recibir el código de acceso.
            </p>
            <p style={{ fontSize: '.78rem', color: 'var(--text3)' }}>¿No llegó? Revisá la carpeta de spam.</p>
          </div>
        ) : otpPending ? (
          <OTPStep
            emailHint={otpEmailHint}
            canales={otpCanales}
            onVerify={async (codigo) => {
              const ok = await verifyOTP(codigo);
              if (ok) { setAuthModal(false); router.push('/panel'); }
              return ok;
            }}
            onReenviar={reenviarOTP}
            loading={authLoading}
            error={authError}
          />
        ) : authTab === 'login' ? (
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
              if (ok && ok !== 'email-confirm' && !otpPending) setAuthModal(false);
              return ok;
            }}
            onSwitch={() => setAuthTab('login')}
            error={authError}
            loading={authLoading}
          />
        )}
      </Modal>

    </div>
  );
}
