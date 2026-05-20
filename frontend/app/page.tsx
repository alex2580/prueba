'use client';

import { useState } from 'react';
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
  const { espacios, loading, filtros, aplicarFiltros, limpiarFiltros } = useEspacios();

  const [vista, setVista] = useState<Vista>('mapa');
  const [selectedEspacio, setSelectedEspacio] = useState<Espacio | null>(null);
  const [authModal, setAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [busqueda, setBusqueda] = useState('');

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
    if (!user) {
      setAuthModal(true);
      return;
    }
    router.push(`/reserva/${espacio.id}`);
  }

  function handleBusqueda(q: string) {
    setBusqueda(q);
    aplicarFiltros({ ...filtros, q: q || undefined });
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <header className="site-header" style={{ gap: '.5rem' }}>
        <SiteLogo onClick={() => router.push('/')} />

        {/* Vista toggle — always visible, left of center */}
        <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 'var(--r1)', padding: '3px', gap: '2px', flexShrink: 0 }}>
          {(['mapa', 'lista'] as Vista[]).map(v => (
            <button key={v} onClick={() => setVista(v)} style={{
              padding: '.28rem .7rem', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: vista === v ? 'var(--surface)' : 'transparent',
              color: vista === v ? 'var(--orange)' : 'var(--text2)',
              fontSize: '.78rem', fontWeight: vista === v ? 700 : 500,
              boxShadow: vista === v ? 'var(--s0)' : 'none',
              whiteSpace: 'nowrap',
            }}>
              {v === 'mapa' ? '🗺️ Mapa' : '☰ Lista'}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexShrink: 0 }}>
          <a href="/legal.html" target="_blank" rel="noopener noreferrer" className="nav-btn" style={{ fontSize: '.75rem', opacity: .7 }}>
            ⚖️ Legal
          </a>

          {user ? (
            <>
              {isAdmin && (
                <button className="nav-btn" style={{ color: 'var(--orange)', fontWeight: 700 }} onClick={() => router.push('/admin')}>
                  ⚙️ Admin
                </button>
              )}
              <button className="nav-btn" onClick={() => router.push('/panel')}>Mi Panel</button>
              <button className="nav-btn" onClick={logout}>Salir</button>
              {user.tipo === 'oferente' && (
                <button className="btn-publish" onClick={() => router.push('/publicar')}>
                  ➕ Publicar
                </button>
              )}
            </>
          ) : (
            <>
              <button className="nav-btn" onClick={() => { setAuthTab('login'); setAuthModal(true); }}>
                Iniciar sesión
              </button>
              <button className="btn-publish" onClick={() => { setAuthTab('register'); setAuthModal(true); }}>
                Registrarse
              </button>
            </>
          )}
        </div>
      </header>

      {/* Filters bar */}
      <div style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)', padding: '.6rem 1.2rem', flexShrink: 0, overflowX: 'auto' }}>
        <FiltrosEspacios filtros={filtros} onChange={aplicarFiltros} onReset={limpiarFiltros} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Mapa */}
        {vista === 'mapa' && (
          <div style={{ height: '100%', position: 'relative' }}>
            {/* Floating search bar */}
            <div style={{
              position: 'absolute',
              top: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
              background: 'rgba(10, 14, 26, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(232,98,42,0.45)',
              borderRadius: '999px',
              display: 'flex', alignItems: 'center',
              padding: '.15rem .5rem .15rem 1rem', gap: '.5rem',
              width: 'min(500px, calc(100vw - 2rem))',
              boxShadow: '0 4px 32px rgba(232,98,42,.18), 0 2px 12px rgba(0,0,0,.6)',
              transition: 'border-color .2s, box-shadow .2s',
            }}
            onFocus={() => {}}
            >
              <span style={{ color: 'var(--orange)', fontSize: '1rem', flexShrink: 0 }}>🔍</span>
              <input
                type="text"
                value={busqueda}
                onChange={e => handleBusqueda(e.target.value)}
                placeholder="Buscar por barrio, tipo, descripción…"
                style={{
                  flex: 1, background: 'none', border: 'none',
                  color: 'var(--text)', fontSize: '.9rem',
                  padding: '.65rem 0', width: '100%',
                  outline: 'none',
                }}
              />
              {busqueda && (
                <button
                  onClick={() => handleBusqueda('')}
                  style={{
                    background: 'rgba(232,98,42,.15)', border: 'none',
                    color: 'var(--orange)', borderRadius: '50%',
                    width: 24, height: 24, cursor: 'pointer',
                    fontSize: '.8rem', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >✕</button>
              )}
            </div>
            <MapaEspacios
              espacios={espacios}
              onMarkerClick={handleMarkerClick}
              selectedId={selectedEspacio?.id}
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
          <div className="page-scroll" style={{ padding: '1.5rem' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text2)' }}>
                  {loading ? 'Cargando…' : `${espacios.length} espacio${espacios.length !== 1 ? 's' : ''} encontrado${espacios.length !== 1 ? 's' : ''}`}
                </h2>
              </div>
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
