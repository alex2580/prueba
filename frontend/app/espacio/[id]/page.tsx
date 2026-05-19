'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEspacio } from '@/hooks/useEspacios';
import { useAuth } from '@/hooks/useAuth';
import { DetalleEspacio } from '@/components/espacios/DetalleEspacio';
import { Modal } from '@/components/ui/Modal';
import { FormReserva } from '@/components/reservas/FormReserva';
import { ChatModal } from '@/components/chat/ChatModal';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { reservasAPI } from '@/lib/api';
import { SiteLogo } from '@/components/ui/SiteLogo';

export default function EspacioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { espacio, loading, error } = useEspacio(id);
  const { user, token, login, register, loading: authLoading, error: authError } = useAuth();

  const [reservarModal, setReservarModal] = useState(false);
  const [chatModal, setChatModal]         = useState(false);
  const [authModal, setAuthModal]         = useState(false);
  const [authTab, setAuthTab]             = useState<'login' | 'register'>('login');
  const [reservaError, setReservaError]   = useState<string | null>(null);
  const [reservaLoading, setReservaLoading] = useState(false);
  const [intentoReservar, setIntentoReservar] = useState(false);

  function handleReservar() {
    if (!user) {
      setIntentoReservar(true);
      setAuthModal(true);
      return;
    }
    setReservarModal(true);
  }

  function handleChat() {
    if (!user) { setAuthModal(true); return; }
    setChatModal(true);
  }

  async function submitReserva(desde: string, hasta: string, notas: string) {
    if (!token || !espacio) return;
    setReservaLoading(true);
    setReservaError(null);
    try {
      const reserva = await reservasAPI.crear({ espacio_id: espacio.id, fecha_desde: desde, fecha_hasta: hasta, notas }, token);
      setReservarModal(false);
      router.push(`/reserva/${reserva.id}/checkout`);
    } catch (err) {
      setReservaError(err instanceof Error ? err.message : 'Error al crear la reserva');
    } finally {
      setReservaLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text3)', background: 'var(--bg)' }}>
        Cargando espacio…
      </div>
    );
  }

  if (error || !espacio) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text2)', gap: '1rem' }}>
        <span style={{ fontSize: '3rem' }}>😕</span>
        <p>{error || 'Espacio no encontrado'}</p>
        <button className="btn-secondary" onClick={() => router.push('/')}>Volver al inicio</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Minimal header */}
      <header className="site-header">
        <SiteLogo onClick={() => router.push('/')} />
        <div />
        <div style={{ display: 'flex', gap: '.5rem' }}>
          {user ? (
            <button className="nav-btn" onClick={() => router.push('/panel')}>Mi Panel</button>
          ) : (
            <button className="nav-btn" onClick={() => setAuthModal(true)}>Iniciar sesión</button>
          )}
        </div>
      </header>

      <div className="page-scroll">
        <DetalleEspacio
          espacio={espacio}
          onReservar={handleReservar}
          onChat={handleChat}
        />
      </div>

      {/* Reserva Modal */}
      <Modal open={reservarModal} onClose={() => setReservarModal(false)} title="📅 Reservar espacio" subtitle={espacio.nombre}>
        <FormReserva
          espacio={espacio}
          onSubmit={submitReserva}
          loading={reservaLoading}
          error={reservaError}
        />
      </Modal>

      {/* Chat Modal */}
      {user && token && (
        <ChatModal
          open={chatModal}
          onClose={() => setChatModal(false)}
          espacioId={espacio.id}
          espacioNombre={espacio.nombre}
          token={token}
          userId={user.id}
        />
      )}

      {/* Auth Modal */}
      <Modal
        open={authModal}
        onClose={() => setAuthModal(false)}
        title={authTab === 'login' ? '👋 Iniciar sesión' : '🚀 Crear cuenta'}
      >
        {authTab === 'login' ? (
          <LoginForm
            onLogin={async (email, password) => {
              const ok = await login(email, password);
              if (ok) {
                setAuthModal(false);
                if (intentoReservar) { setIntentoReservar(false); setReservarModal(true); }
              }
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
              if (ok) {
                setAuthModal(false);
                if (intentoReservar) { setIntentoReservar(false); setReservarModal(true); }
              }
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
