'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEspacio } from '@/hooks/useEspacios';
import { useAuth } from '@/contexts/AuthContext';
import { DetalleEspacio } from '@/components/espacios/DetalleEspacio';
import { Modal } from '@/components/ui/Modal';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { OTPStep } from '@/components/auth/OTPStep';
import { SiteHeader } from '@/components/ui/SiteHeader';

export default function EspacioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { espacio, loading, error } = useEspacio(id);
  const { user, token, login, register, loading: authLoading, error: authError,
    otpPending, otpEmailHint, otpCanales, verifyOTP, reenviarOTP } = useAuth();

  const [authModal, setAuthModal] = useState(false);
  const [authTab, setAuthTab]     = useState<'login' | 'register'>('login');

  function handleReservar() {
    router.push(`/espacio/${id}/reservar`);
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
      <SiteHeader
        onLoginClick={() => { setAuthTab('login'); setAuthModal(true); }}
        onRegisterClick={() => { setAuthTab('register'); setAuthModal(true); }}
      />

      <div className="page-scroll">
        <DetalleEspacio
          espacio={espacio}
          onReservar={handleReservar}
          token={token}
          userId={user?.id}
        />
      </div>

      {/* Auth Modal */}
      <Modal
        open={authModal}
        onClose={() => setAuthModal(false)}
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
            onRegister={async (nombre, email, password, tipo, tel, terminos_aceptados) => {
              const ok = await register(nombre, email, password, tipo, tel, terminos_aceptados);
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
