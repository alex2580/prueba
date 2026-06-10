'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { supabase } from '@/lib/supabase';
import { SiteLogo } from '@/components/ui/SiteLogo';

export default function ConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    let done = false;

    function redirect() {
      if (done) return;
      done = true;
      router.replace('/panel');
    }

    // Caso 1: detectSessionInUrl procesa el ?code= y dispara SIGNED_IN
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        redirect();
      }
    });

    // Caso 2: exchange manual del code (si detectSessionInUrl no corrió todavía)
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (!error && data.session) {
          redirect();
        } else {
          // El code ya fue consumido por detectSessionInUrl — verificar sesión existente
          supabase.auth.getSession().then(({ data: sd }) => {
            if (sd.session) redirect();
          });
        }
      });
    } else {
      // Sin ?code= — puede ser implicit flow (hash) o ya procesado
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) redirect();
      });
    }

    const timeout = setTimeout(() => {
      if (!done) setStatus('error');
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
