'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEspacio } from '@/hooks/useEspacios';
import { useAuth } from '@/hooks/useAuth';
import { DetalleEspacio } from '@/components/espacios/DetalleEspacio';
import { Modal } from '@/components/ui/Modal';
import { ChatModal } from '@/components/chat/ChatModal';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { OTPStep } from '@/components/auth/OTPStep';
import { SiteLogo } from '@/components/ui/SiteLogo';

export default function EspacioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { espacio, loading, error } = useEspacio(id);
  const { user, token, login, register, loading: authLoading, error: authError,
    otpPending, otpEmailHint, otpCanales, verifyOTP, reenviarOTP } = useAuth();

  const [chatModal, setChatModal] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [authTab, setAuthTab]     = useState<'login' | 'register'>('login');

  function handleReservar() {
    router.push(`/espacio/${id}/reservar`);
  }

  function handleChat() {
    if (!user) { setAuthModal(true); return; }
    setChatModal(true);
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
        onClose={() => { if (!otpPending) setAuthModal(false); }}
        title={otpPending ? '🔐 Verificación' : authTab === 'login' ? '👋 Iniciar sesión' : '🚀 Crear cuenta'}
      >
        {otpPending ? (
          <OTPStep
            emailHint={otpEmailHint}
            canales={otpCanales}
            onVerify={async (codigo) => {
              const ok = await verifyOTP(codigo);
              if (ok) setAuthModal(false);
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
          />
        )}
      </Modal>
    </div>
  );
}
