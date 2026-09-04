'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { reservasAPI } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { OTPStep } from '@/components/auth/OTPStep';
import { SiteLogo } from '@/components/ui/SiteLogo';

export default function CheckinPage() {
  const { token: qrToken } = useParams<{ token: string }>();
  const router = useRouter();
  const { user, token, login, register, loading: authLoading, error: authError,
    otpPending, otpEmailHint, otpCanales, verifyOTP, reenviarOTP } = useAuth();

  const [authModal, setAuthModal] = useState(false);
  const [authTab, setAuthTab]     = useState<'login' | 'register'>('login');
  const [confirmando, setConfirmando] = useState(false);
  const [resultado, setResultado] = useState<{ espacio_nombre: string; usuario_nombre: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) setAuthModal(true);
  }, [authLoading, user]);

  async function confirmar() {
    if (!token) return;
    setConfirmando(true);
    setError('');
    try {
      const d = await reservasAPI.checkinPorQR(qrToken, token);
      setResultado(d.reserva);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo confirmar el acceso');
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="site-header">
        <SiteLogo onClick={() => router.push('/')} />
      </header>

      <div className="page-scroll">
        <div style={{ maxWidth: 420, margin: '0 auto', padding: '2rem 1.5rem' }}>
          <h1 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '.4rem', textAlign: 'center' }}>
            Confirmar acceso
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            Escaneaste el QR de una reserva.
          </p>

          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            {resultado ? (
              <div>
                <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>✅</div>
                <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '.3rem' }}>Acceso confirmado</p>
                <p style={{ color: 'var(--text2)', fontSize: '.9rem', marginBottom: '.2rem' }}>{resultado.usuario_nombre}</p>
                <p style={{ color: 'var(--text3)', fontSize: '.8rem' }}>{resultado.espacio_nombre}</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>🔑</div>
                <p style={{ color: 'var(--text2)', fontSize: '.9rem', marginBottom: '1.5rem' }}>
                  Vas a confirmar que le diste acceso al cliente. Una vez confirmado, el pago queda liberado a tu favor.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={confirmar}
                  disabled={confirmando || !user}
                  style={{ width: '100%', padding: '.9rem' }}
                >
                  {confirmando ? 'Confirmando…' : '✅ Confirmar acceso'}
                </button>
              </div>
            )}
            {error && <p style={{ color: 'var(--red)', fontSize: '.85rem', marginTop: '1rem' }}>{error}</p>}
          </div>
        </div>
      </div>

      <Modal
        open={authModal && !user}
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
              if (ok) setAuthModal(false);
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
