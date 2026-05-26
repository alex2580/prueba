'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Button } from '@/components/ui/Button';

const MapaEspacios = dynamic(() => import('@/components/mapa/MapaEspacios').then(m => ({ default: m.MapaEspacios })), { ssr: false });
const MarkerEspacioCard = dynamic(() => import('@/components/mapa/MarkerEspacio').then(m => ({ default: m.MarkerEspacioCard })), { ssr: false });

type Vista = 'mapa' | 'lista';

export default function HomePage() {
  const router = useRouter();
  const { user, token, loading: authLoading, login, register, logout, error: authError, isAdmin,
    otpPending, otpEmailHint, otpCanales, verifyOTP, reenviarOTP } = useAuth();
  const { espacios, loading, error: espaciosError, filtros, aplicarFiltros, limpiarFiltros } = useEspacios();

  const [vista, setVista] = useState<Vista>('lista');
  const [selectedEspacio, setSelectedEspacio] = useState<Espacio | null>(null);
  const [authModal, setAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [busqueda, setBusqueda] = useState('');
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.lat && user?.lng && !userLocation) {
      setUserLocation({ lat: Number(user.lat), lng: Number(user.lng) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
      aplicarFiltros({ ...filtros, q: q || undefined });
    }, 350);
  }, [filtros, aplicarFiltros]);

  const filtrosActivos = !!(filtros.tipo || filtros.precio_max || filtros.periodo || filtros.barrio || filtros.q);
  const hayFiltrosActivos = !!(filtros.tipo || filtros.precio_max || filtros.periodo || userLocation || filtros.q);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="site-header">
        <SiteLogo onClick={() => router.push('/')} />

        {/* Nav central */}
        <nav className="nav">
          <button className="nav-btn active" onClick={() => { setVista('lista'); }}>
            🏠 Inicio
          </button>
          <button className="nav-btn" onClick={() => setVista('lista')}>
            🔍 Buscar espacios
          </button>
          <button className="nav-btn" onClick={() => router.push('/como-funciona')}>
            💡 Cómo funciona
          </button>
        </nav>

        {/* Acciones derecha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', justifyContent: 'flex-end' }}>
          {user ? (
            <>
              {isAdmin && (
                <button className="nav-btn" style={{ color: 'var(--orange)', fontWeight: 700 }}
                  onClick={() => router.push('/admin')}>
                  Admin
                </button>
              )}
              <button className="nav-btn" onClick={() => router.push('/panel')}>Mi cuenta</button>
              <button className="nav-btn" onClick={logout}>Salir</button>
              <button className="btn-register" onClick={() => router.push('/publicar')}>
                Publicar espacio
              </button>
            </>
          ) : (
            <>
              <button className="btn-login" onClick={() => { setAuthTab('login'); setAuthModal(true); }}>
                Ingresar
              </button>
              <button className="btn-register" onClick={() => { setAuthTab('register'); setAuthModal(true); }}>
                Registrarse
              </button>
            </>
          )}
        </div>
      </header>

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
              ≡ Ver lista
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
                Filtros
                {filtrosActivos && (
                  <span style={{
                    background: 'var(--orange)', color: '#fff',
                    borderRadius: '50%', width: 18, height: 18,
                    fontSize: '.65rem', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {[filtros.tipo, filtros.precio_max, filtros.periodo].filter(Boolean).length}
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
                onVerDetalle={() => router.push(`/espacio/${selectedEspacio.id}`)}
                onReservar={() => handleReservar(selectedEspacio)}
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
                    placeholder="Buscar por barrio, dirección o tipo…"
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

              {/* Horizontal filter pills */}
              <div className="filter-pills-bar">
                <button
                  className={`filter-pill ${filtros.tipo === 'exclusivo' ? 'active' : ''}`}
                  onClick={() => aplicarFiltros({ ...filtros, tipo: (filtros.tipo === 'exclusivo' ? '' : 'exclusivo') as EspacioTipo })}
                >
                  🔒 Exclusivo
                </button>
                <button
                  className={`filter-pill ${filtros.tipo === 'compartido' ? 'active' : ''}`}
                  onClick={() => aplicarFiltros({ ...filtros, tipo: (filtros.tipo === 'compartido' ? '' : 'compartido') as EspacioTipo })}
                >
                  🤝 Compartido
                </button>
                <button
                  className={`filter-pill ${filtros.periodo === 'dia' ? 'active' : ''}`}
                  onClick={() => aplicarFiltros({ ...filtros, periodo: filtros.periodo === 'dia' ? '' : 'dia', precio_max: undefined })}
                >
                  📅 Por día
                </button>
                <button
                  className={`filter-pill ${filtros.periodo === 'mes' ? 'active' : ''}`}
                  onClick={() => aplicarFiltros({ ...filtros, periodo: filtros.periodo === 'mes' ? '' : 'mes', precio_max: undefined })}
                >
                  📆 Por mes
                </button>
                {userLocation ? (
                  <button className="filter-pill active" onClick={() => setUserLocation(null)}>
                    📍 Cerca mío ✕
                  </button>
                ) : (
                  <button
                    className="filter-pill"
                    onClick={handleCercaMio}
                    disabled={geoLoading}
                  >
                    {geoLoading ? '⏳ Buscando…' : '📍 Cerca mío'}
                  </button>
                )}
                {filtros.precio_max && (
                  <button
                    className="filter-pill active"
                    onClick={() => aplicarFiltros({ ...filtros, precio_max: undefined })}
                  >
                    Hasta ${filtros.precio_max.toLocaleString('es-AR')} ✕
                  </button>
                )}

                {/* Más filtros — dropdown */}
                <div
                  style={{ position: 'relative', flexShrink: 0 }}
                  onMouseEnter={() => setFiltrosOpen(true)}
                  onMouseLeave={() => setFiltrosOpen(false)}
                >
                  <button
                    className={`filter-pill ${filtros.precio_max ? 'active' : ''}`}
                    onClick={() => setFiltrosOpen(o => !o)}
                  >
                    ⚙️ Más filtros
                  </button>
                  {filtrosOpen && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, paddingTop: '.5rem', zIndex: 200 }}>
                      <div style={{
                        background: 'var(--surface)',
                        border: '1.5px solid var(--border)', borderRadius: 16,
                        padding: '1.2rem', width: 280,
                        boxShadow: 'var(--s3)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.9rem' }}>Filtros</span>
                          <button onClick={() => setFiltrosOpen(false)} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text3)', fontSize: '1.1rem', lineHeight: 1,
                          }}>✕</button>
                        </div>
                        <FiltrosEspacios
                          filtros={filtros}
                          onChange={f => { aplicarFiltros(f); }}
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

                {/* Limpiar todos */}
                {hayFiltrosActivos && (
                  <button
                    className="filter-pill"
                    style={{ color: 'var(--orange)', borderColor: 'rgba(232,98,42,.3)' }}
                    onClick={() => { limpiarFiltros(); setUserLocation(null); setBusqueda(''); }}
                  >
                    ✕ Limpiar
                  </button>
                )}

                {geoError && (
                  <span style={{ fontSize: '.75rem', color: 'var(--orange)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {geoError}
                  </span>
                )}
              </div>
            </div>

            {/* Results grid */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.25rem 1.5rem 7rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontFamily: 'Sora, sans-serif', fontSize: '.82rem', fontWeight: 600, color: 'var(--text2)' }}>
                  {loading ? 'Cargando…' : espaciosError ? 'Error al cargar' : (
                    `${espacios.length} espacio${espacios.length !== 1 ? 's' : ''} encontrado${espacios.length !== 1 ? 's' : ''}`
                  )}
                </span>
              </div>

              {espaciosError && !loading && (
                <div className="alert alert--error" style={{ marginBottom: '1rem' }}>
                  {espaciosError} — Verificá tu conexión o recargá la página.
                </div>
              )}

              <GridEspacios
                espacios={espacios}
                loading={loading}
                onCardClick={espacio => router.push(`/espacio/${espacio.id}`)}
              />
            </div>

            {/* Floating "Ver en Mapa" button */}
            <button className="btn-ver-mapa" onClick={() => setVista('mapa')}>
              🗺️ Ver en mapa
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
        💬 Contacto
      </button>

      {/* Contacto modal */}
      <Modal
        open={contactoOpen}
        onClose={() => setContactoOpen(false)}
        title="💬 Contactanos"
        subtitle="Consultás, quejas o sugerencias. Te respondemos a la brevedad."
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
                <option value="queja">Queja</option>
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
        onClose={() => { if (!otpPending) setAuthModal(false); }}
        title={otpPending ? '🔐 Verificación' : authTab === 'login' ? '👋 Iniciar sesión' : '🚀 Crear cuenta'}
        subtitle={otpPending ? undefined : authTab === 'login' ? 'Ingresá a tu cuenta de TodasMisCosas' : 'Únite a la comunidad de almacenamiento urbano'}
      >
        {otpPending ? (
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
            onRegister={async (nombre, email, password, tipo, tel) => {
              const ok = await register(nombre, email, password, tipo, tel);
              if (ok && !otpPending) setAuthModal(false);
              return ok;
            }}
            onSwitch={() => setAuthTab('login')}
            error={authError}
            loading={authLoading}
            tipoForzado="demandante"
          />
        )}
      </Modal>
    </div>
  );
}
