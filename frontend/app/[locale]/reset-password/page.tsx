'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, updatePassword } from '@/lib/supabase';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Button } from '@/components/ui/Button';

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase detecta el token del hash automáticamente y establece la sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      setError('No se pudo actualizar la contraseña. El link puede haber expirado.');
    } else {
      setDone(true);
      setTimeout(() => router.push('/'), 3000);
    }
  }

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
          boxShadow: 'var(--s3)',
        }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            🔐 Nueva contraseña
          </h2>

          {done ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>✅</div>
              <div style={{ color: '#10b981', fontWeight: 600, marginBottom: '.4rem' }}>Contraseña actualizada</div>
              <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>Redirigiendo al inicio…</div>
            </div>
          ) : !ready ? (
            <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '1rem' }}>
              <div style={{ marginBottom: '.5rem' }}>⏳</div>
              Verificando link de recuperación…
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '.85rem' }}>
              <div>
                <label className="form-label">Nueva contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoFocus
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)',
                      display: 'flex', alignItems: 'center', padding: 2 }}>
                    <EyeIcon visible={showPass} />
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Confirmar contraseña</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && <div className="alert alert--error">{error}</div>}

              <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '.3rem' }}>
                Guardar nueva contraseña
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
