'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Espacio } from '@/types';
import { useEspacios } from '@/hooks/useEspacios';
import { useAuth } from '@/hooks/useAuth';
import { GridEspacios } from '@/components/espacios/GridEspacios';
import { FiltrosEspacios } from '@/components/espacios/FiltrosEspacios';
import { Modal } from '@/components/ui/Modal';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Button } from '@/components/ui/Button';

// Dynamic import to avoid SSR issues with Google Maps
const MapaEspacios = dynamic(() => import('@/components/mapa/MapaEspacios').then(m => ({ default: m.MapaEspacios })), { ssr: false });
const MarkerEspacioCard = dynamic(() => import('@/components/mapa/MarkerEspacio').then(m => ({ default: m.MarkerEspacioCard })), { ssr: false });

type Vista = 'mapa' | 'lista';

export default function HomePage() {
  const router = useRouter();
  const { user, token, loading: authLoading, login, register, logout, error: authError, isAdmin } = useAuth();
  const { espacios, loading, error: espaciosError, filtros, aplicarFiltros, limpiarFiltros } = useEspacios();

  const [vista, setVista] = useState<Vista>('mapa');
  const [selectedEspacio, setSelectedEspacio] = useState<Espacio | null>(null);
  const [authModal, setAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [busqueda, setBusqueda] = useState('');
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Auto-locate from saved profile address on login
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

  // Contacto modal state
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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <header className="site-header">
        {/* Col 1: Logo */}
        <SiteLogo onClick={() => router.push('/')} />

        {/* Col 2: Vista toggle centrado */}
        <div />

        {/* Col 3: Acciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', justifyContent: 'flex-end' }}>
          <button className="nav-btn" onClick={() => router.push('/como-funciona')}>🧭 Cómo funciona</button>
          <button className="nav-btn" onClick={() => router.push('/servicios')}>📦 Servicios</button>
          <button className="nav-btn" style={{ color: '#a78bfa' }} onClick={() => router.push('/legal.html')}>⚖️ Legal</button>
          {user ? (
            <>
              {isAdmin && (
                <button className="nav-btn" style={{ color: 'var(--orange)', fontWeight: 700 }} onClick={() => router.push('/admin')}>
                  ⚙️ Admin
                </button>
              )}
              <button className="nav-btn" onClick={() => router.push('/panel')}>🙍 Mi cuenta</button>
              <button className="nav-btn" onClick={logout}>Salir</button>
            </>
          ) : (
            <button className="nav-btn" onClick={() => { setAuthTab('login'); setAuthModal(true); }}>
              🙍 Mi cuenta
            </button>
          )}
          {/* Publicar — siempre visible, pide login si no está autenticado */}
          <button className="btn-publish" onClick={() => router.push('/publicar')}>
            🏠 Publicar
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Mapa */}
        {vista === 'mapa' && (
          <div style={{ height: '100%', position: 'relative' }}>
            {/* Botón flotante de filtros + panel — hover abre, salir cierra */}
            <div
              style={{ position: 'absolute', top: '1.25rem', right: '8rem', zIndex: 110 }}
              onMouseEnter={() => setFiltrosOpen(true)}
              onMouseLeave={() => setFiltrosOpen(false)}
            >
              <button
                onClick={() => setFiltrosOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.45rem',
                  background: (filtros.tipo || filtros.precio_max)
                    ? 'rgba(232,98,42,.18)'
                    : 'rgba(186,230,253,.55)',
                  border: `1.5px solid ${(filtros.tipo || filtros.precio_max) ? 'rgba(232,98,42,.45)' : 'rgba(125,211,252,.7)'}`,
                  borderRadius: '999px', padding: '.45rem 1.1rem',
                  fontSize: '.82rem', fontWeight: 700, fontFamily: 'Sora, sans-serif',
                  cursor: 'pointer',
                  boxShadow: '0 2px 14px rgba(0,0,0,.13)',
                  color: (filtros.tipo || filtros.precio_max) ? 'var(--orange)' : '#0369a1',
                  backdropFilter: 'blur(10px)',
                  transition: 'all .15s',
                }}
              >
                <span>⚙️</span>
                Filtros
                {(filtros.tipo || filtros.precio_max) && (
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

              {/* Panel flotante de filtros */}
              {filtrosOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + .5rem)', right: 0,
                  background: 'rgba(255,255,255,0.98)',
                  border: '1.5px solid #ddd', borderRadius: 16,
                  padding: '1.2rem', width: 280,
                  boxShadow: '0 8px 32px rgba(0,0,0,.18)',
                  backdropFilter: 'blur(12px)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.9rem', color: '#111' }}>
                      Filtros
                    </span>
                    <button onClick={() => setFiltrosOpen(false)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#888', fontSize: '1.1rem', lineHeight: 1,
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
              )}
            </div>

            <MapaEspacios
              espacios={espacios}
              onMarkerClick={handleMarkerClick}
              selectedId={selectedEspacio?.id}
              center={userLocation ?? undefined}
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

        {/* Lista */}
        {vista === 'lista' && (
          <div className="page-scroll" style={{ padding: '1.5rem', boxSizing: 'border-box' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text2)' }}>
                  {loading ? 'Cargando…' : espaciosError ? 'Error al cargar espacios' : `${espacios.length} espacio${espacios.length !== 1 ? 's' : ''} encontrado${espacios.length !== 1 ? 's' : ''}`}
                </h2>
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
          boxShadow: 'var(--s3)', zIndex: 200, cursor: 'pointer',
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
        onClose={() => setAuthModal(false)}
        title={authTab === 'login' ? '👋 Iniciar sesión' : '🚀 Crear cuenta'}
        subtitle={authTab === 'login' ? 'Ingresá a tu cuenta de TodasMisCosas' : 'Únite a la comunidad de almacenamiento urbano'}
      >
        {authTab === 'login' ? (
          <LoginForm
            onLogin={async (email, password) => {
              const ok = await login(email, password);
              if (ok) { setAuthModal(false); router.push('/panel'); }
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
              if (ok) setAuthModal(false);
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
