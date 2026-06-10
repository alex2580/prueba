'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { supabase } from '@/lib/supabase';
import { SiteLogo } from '@/components/ui/SiteLogo';

export default function ConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    let redirected = false;

    function handleConfirmed() {
      if (redirected) return;
      redirected = true;
      // Marcar OTP pendiente y redirigir — useAuth lo detectará y pedirá el código
      localStorage.setItem('tmc_otp_pending', '1');
      router.replace('/auth/register');
    }

    // Supabase con detectSessionInUrl:true procesa automáticamente los tokens
    // del hash/query de la URL y dispara SIGNED_IN antes de que montemos
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        handleConfirmed();
      }
    });

    // Por si el evento ya disparó antes de que montáramos el listener
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) handleConfirmed();
    });

    // Timeout: si en 8 segundos no hubo sesión, mostrar error
    const timeout = setTimeout(() => {
      if (!redirected) setStatus('error');
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

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
                El link expiró o ya fue usado. Intentá registrarte nuevamente.
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
