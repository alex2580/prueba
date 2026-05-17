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

// Dynamic import to avoid SSR issues with Google Maps
const MapaEspacios = dynamic(() => import('@/components/mapa/MapaEspacios').then(m => ({ default: m.MapaEspacios })), { ssr: false });
const MarkerEspacioCard = dynamic(() => import('@/components/mapa/MarkerEspacio').then(m => ({ default: m.MarkerEspacioCard })), { ssr: false });

type Vista = 'mapa' | 'lista';

export default function HomePage() {
  const router = useRouter();
  const { user, token, loading: authLoading, login, register, logout, error: authError } = useAuth();
  const { espacios, loading, filtros, aplicarFiltros, limpiarFiltros } = useEspacios();

  const [vista, setVista] = useState<Vista>('mapa');
  const [selectedEspacio, setSelectedEspacio] = useState<Espacio | null>(null);
  const [authModal, setAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [busqueda, setBusqueda] = useState('');

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
      <header className="site-header">
        <div className="logo" onClick={() => router.push('/')}>
          <span style={{ fontSize: '1.4rem' }}>📦</span>
          <span>Todas<span style={{ color: 'var(--orange)' }}>Mis</span>Cosas</span>
        </div>

        {/* Search */}
        <div style={{
          background: 'var(--surface2)',
          border: '1.5px solid var(--border)',
          borderRadius: '999px',
          display: 'flex', alignItems: 'center',
          padding: '.1rem 1rem', gap: '.5rem',
          maxWidth: 400, width: '100%', margin: '0 auto',
          transition: 'border-color .15s, box-shadow .15s',
        }}>
          <span style={{ color: 'var(--text3)', fontSize: '1rem' }}>🔍</span>
          <input
            type="text"
            value={busqueda}
            onChange={e => handleBusqueda(e.target.value)}
            placeholder="Buscar por barrio, tipo, descripción…"
            style={{
              flex: 1, background: 'none', border: 'none',
              color: 'var(--text)', fontSize: '.88rem',
              padding: '.6rem 0', width: '100%',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          {/* Vista toggle */}
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 'var(--r1)', padding: '3px', gap: '2px' }}>
            {(['mapa', 'lista'] as Vista[]).map(v => (
              <button key={v} onClick={() => setVista(v)} style={{
                padding: '.28rem .7rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: vista === v ? 'var(--surface)' : 'transparent',
                color: vista === v ? 'var(--orange)' : 'var(--text2)',
                fontSize: '.78rem', fontWeight: vista === v ? 700 : 500,
                boxShadow: vista === v ? 'var(--s0)' : 'none',
              }}>
                {v === 'mapa' ? '🗺️ Mapa' : '☰ Lista'}
              </button>
            ))}
          </div>

          {user ? (
            <>
              <button className="nav-btn" onClick={() => router.push('/panel')}>Panel</button>
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
              if (ok) setAuthModal(false);
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
