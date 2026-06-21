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
import { Modal } from '@/components/ui/Modal';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { OTPStep } from '@/components/auth/OTPStep';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { Button } from '@/components/ui/Button';

const MapaEspacios = dynamic(() => import('@/components/mapa/MapaEspacios').then(m => ({ default: m.MapaEspacios })), { ssr: false });
const MarkerEspacioCard = dynamic(() => import('@/components/mapa/MarkerEspacio').then(m => ({ default: m.MarkerEspacioCard })), { ssr: false });

type Vista = 'mapa' | 'lista';

export default function HomePage() {
  const t = useTranslations('home');
  const router = useRouter();
  const { user, token, loading: authLoading, login, register, logout, error: authError, isAdmin,
    otpPending, otpEmailHint, otpCanales, verifyOTP, reenviarOTP,
    emailConfirmPending, emailConfirmEmail } = useAuth();
  const [filtrosIniciales] = useState<import('@/types').FiltrosEspacios>(() => {
    if (typeof window === 'undefined') return {};
    const p = new URLSearchParams(window.location.search);
    const f: import('@/types').FiltrosEspacios = {};
    if (p.get('tipo'))          f.tipo = p.get('tipo') as EspacioTipo;
    if (p.get('barrio'))        f.barrio = p.get('barrio')!;
    if (p.get('pais'))          f.pais = p.get('pais')!;
    if (p.get('precio_max'))    f.precio_max = Number(p.get('precio_max'));
    if (p.get('seguridad_min')) f.seguridad_min = Number(p.get('seguridad_min'));
    if (p.get('q'))             f.q = p.get('q')!;
    return f;
  });
  const { espacios, loading, error: espaciosError, filtros, aplicarFiltros, limpiarFiltros } = useEspacios(filtrosIniciales);

  const [vista, setVista] = useState<Vista>(() => {
    if (typeof window === 'undefined') return 'lista';
    return new URLSearchParams(window.location.search).get('vista') === 'mapa' ? 'mapa' : 'lista';
  });

  const [selectedEspacio, setSelectedEspacio] = useState<Espacio | null>(null);
  const [authModal, setAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [busqueda, setBusqueda] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('q') || '';
  });
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [seguridadInfo, setSeguridadInfo] = useState(false);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

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
    if (filtros.precio_max)     p.set('precio_max', String(filtros.precio_max));
    if (filtros.seguridad_min)  p.set('seguridad_min', String(filtros.seguridad_min));
    if (filtros.q)              p.set('q', filtros.q);
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
  const [contactoForm, setContactoForm] = useState({
    nombre: '', email: '', asunto: '', tipo: 'consulta', mensaje: '',
  });
  const [contactoSending, setContactoSending] = useState(false);
  const [contactoSuccess, setContactoSuccess] = useState(false);
  const [contactoError, setContactoError] = useState('');

  async function enviarContacto() {
    if (!contactoForm.nombre || !contactoForm.email || !contactoForm.asunto || !contactoForm.mensaje) return;
    setContactoSending(true);
    setContactoError('');
    try {
      const res = await fetch('/api/admin/consultas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactoForm),
      });
      if (!res.ok) throw new Error('No se pudo enviar el mensaje');
      setContactoSuccess(true);
      setContactoForm({ nombre: '', email: '', asunto: '', tipo: 'consulta', mensaje: '' });
    } catch (e: unknown) {
      setContactoError(e instanceof Error ? e.message : 'Error al enviar');
    } finally {
      setContactoSending(false);
    }
  }

  function handleMarkerClick(espacio: Espacio) {
    setSelectedEspacio(espacio);
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

  const PRECIO_MAX_DIA = 10000;
  const PRECIO_STEP = 500;
  const precioValHome = filtros.precio_max ?? PRECIO_MAX_DIA;

  const filtrosActivos = !!(filtros.tipo || filtros.precio_max || filtros.barrio || filtros.q || filtros.pais || filtros.seguridad_min);
  const hayFiltrosActivos = !!(filtros.tipo || filtros.precio_max || userLocation || filtros.q || filtros.pais || filtros.seguridad_min);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <SiteHeader
        onLoginClick={() => { setAuthTab('login'); setAuthModal(true); }}
        onRegisterClick={() => { setAuthTab('register'); setAuthModal(true); }}
        onLogoClick={() => { if (vista === 'mapa') setVista('lista'); }}
      />

      {/* ── Content ────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

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
                    {[filtros.tipo, filtros.precio_max].filter(Boolean).length}
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
                onVerDetalle={() => router.push(`/espacio/${selectedEspacio.id}?from=mapa`)}
                onReservar={() => router.push(`/espacio/${selectedEspacio.id}/reservar?from=mapa`)}
              />
            )}
          </div>
        )}

        {/* ── Lista ────────────────────────────────────────── */}
        {vista === 'lista' && (
          <div className="page-scroll">

            {/* Sticky search + filters header */}
            <div className="list-search-header">
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
              </div>

              {/* Single filter bar — all options in one scrollable row */}
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
                    style={{ width: 80, cursor: 'pointer', accentColor: precioValHome < PRECIO_MAX_DIA ? '#fff' : 'var(--orange)' }}
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
                    onMouseEnter={() => setSeguridadInfo(true)}
                    onMouseLeave={() => setSeguridadInfo(false)}
                    style={{ fontSize: '.78rem', cursor: 'help', color: 'var(--text3)', lineHeight: 1, userSelect: 'none' }}
                  >ℹ️</span>

                  {/* Popover */}
                  {seguridadInfo && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + .5rem)', right: 0, zIndex: 500,
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
                onCardClick={espacio => router.push(`/espacio/${espacio.id}`)}
                favoritos={favIds}
                onToggleFavorito={handleToggleFavorito}
                token={token}
              />
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
        onClick={() => { setContactoOpen(true); setContactoSuccess(false); setContactoError(''); }}
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
        {contactoSuccess ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>✅</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, marginBottom: '.4rem' }}>Mensaje enviado</div>
            <p style={{ color: 'var(--text2)', fontSize: '.88rem' }}>Gracias por escribirnos. Te responderemos a la brevedad.</p>
            <button className="btn-secondary" style={{ marginTop: '1.25rem' }} onClick={() => setContactoOpen(false)}>
              Cerrar
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {contactoError && <p className="alert alert--error">{contactoError}</p>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <label className="form-label">
                Nombre *
                <input
                  value={contactoForm.nombre}
                  onChange={e => setContactoForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Tu nombre"
                  style={{ marginTop: '.4rem' }}
                />
              </label>
              <label className="form-label">
                Email *
                <input
                  type="email"
                  value={contactoForm.email}
                  onChange={e => setContactoForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="tu@email.com"
                  style={{ marginTop: '.4rem' }}
                />
              </label>
            </div>

            <label className="form-label">
              Asunto *
              <input
                value={contactoForm.asunto}
                onChange={e => setContactoForm(f => ({ ...f, asunto: e.target.value }))}
                placeholder="¿En qué te podemos ayudar?"
                style={{ marginTop: '.4rem' }}
              />
            </label>

            <label className="form-label">
              Tipo
              <select
                value={contactoForm.tipo}
                onChange={e => setContactoForm(f => ({ ...f, tipo: e.target.value }))}
                style={{ marginTop: '.4rem' }}
              >
                <option value="consulta">Consulta</option>
                <option value="reclamo">Reclamo</option>
                <option value="sugerencia">Sugerencia</option>
              </select>
            </label>

            <label className="form-label">
              Mensaje *
              <textarea
                rows={4}
                value={contactoForm.mensaje}
                onChange={e => setContactoForm(f => ({ ...f, mensaje: e.target.value }))}
                placeholder="Escribí tu mensaje acá…"
                style={{ marginTop: '.4rem' }}
              />
            </label>

            <Button
              onClick={enviarContacto}
              loading={contactoSending}
              disabled={!contactoForm.nombre || !contactoForm.email || !contactoForm.asunto || !contactoForm.mensaje}
            >
              Enviar mensaje
            </Button>
          </div>
        )}
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
