'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import { supabase } from '@/lib/supabase';
import { SiteLogo } from '@/components/ui/SiteLogo';

export default function ConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (!token_hash || !type) {
      setErrorMsg('Link de confirmación inválido o incompleto.');
      setStatus('error');
      return;
    }

    supabase.auth.verifyOtp({ token_hash, type: type as 'signup' })
      .then(({ error }) => {
        if (error) {
          setErrorMsg('El link expiró o ya fue usado. Registrate nuevamente.');
          setStatus('error');
          return;
        }
        // Email confirmado → activar flag OTP y redirigir al registro
        // useAuth detectará la sesión + el flag y solicitará el OTP automáticamente
        localStorage.setItem('tmc_otp_pending', '1');
        router.replace('/auth/register');
      });
  }, [searchParams, router]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <header className="site-header">
        <SiteLogo onClick={() => router.push('/')} />
        <div /><div />
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{
          width: '100%', maxWidth: 400,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r4)', padding: '2rem',
          boxShadow: 'var(--s3)', textAlign: 'center',
        }}>
          {status === 'loading' ? (
            <>
              <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>⏳</div>
              <p style={{ color: 'var(--text2)', fontSize: '.9rem' }}>Verificando tu cuenta…</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>❌</div>
              <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '.5rem' }}>
                No pudimos confirmar tu email
              </p>
              <p style={{ color: 'var(--text2)', fontSize: '.85rem', marginBottom: '1.5rem' }}>
                {errorMsg}
              </p>
              <button
                onClick={() => router.push('/auth/register')}
                style={{
                  background: 'var(--orange)', color: '#fff', border: 'none',
                  borderRadius: 'var(--r2)', padding: '.65rem 1.5rem',
                  cursor: 'pointer', fontFamily: 'Sora, sans-serif',
                  fontWeight: 700, fontSize: '.9rem',
                }}
              >
                Volver al registro
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
