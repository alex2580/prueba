'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { resetPasswordForEmail } from '@/lib/supabase';

const REDIRECT_URL = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://todasmiscosas.com'}/reset-password`;

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

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onSwitch: () => void;
  loading?: boolean;
  error?: string | null;
}

export function LoginForm({ onLogin, onSwitch, loading, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotDone, setForgotDone] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    await onLogin(email, password);
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotError(null);
    const { error } = await resetPasswordForEmail(forgotEmail, REDIRECT_URL);
    setForgotLoading(false);
    if (error) {
      setForgotError('No se pudo enviar el email. Verificá la dirección.');
    } else {
      setForgotDone(true);
    }
  }

  if (forgotMode) {
    return (
      <div style={{ display: 'grid', gap: '.85rem' }}>
        <div style={{ textAlign: 'center', fontSize: '.9rem', color: 'var(--text2)' }}>
          Ingresá tu email y te mandamos un link para restablecer tu contraseña.
        </div>

        {forgotDone ? (
          <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(16,185,129,.1)', borderRadius: 'var(--r2)', border: '1px solid rgba(16,185,129,.3)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '.4rem' }}>📬</div>
            <div style={{ color: '#10b981', fontWeight: 600, marginBottom: '.3rem' }}>Email enviado</div>
            <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>
              Revisá tu bandeja de entrada en <strong>{forgotEmail}</strong> y seguí el link.
            </div>
          </div>
        ) : (
          <form onSubmit={handleForgot} style={{ display: 'grid', gap: '.85rem' }}>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoFocus
              />
            </div>
            {forgotError && <div className="alert alert--error">{forgotError}</div>}
            <Button type="submit" loading={forgotLoading} style={{ width: '100%' }}>
              Enviar link de recuperación
            </Button>
          </form>
        )}

        <div style={{ textAlign: 'center', fontSize: '.82rem', marginTop: '.2rem' }}>
          <button type="button" onClick={() => { setForgotMode(false); setForgotDone(false); setForgotError(null); }}
            style={{ background: 'none', border: 'none', color: 'var(--orange)', fontWeight: 700, cursor: 'pointer', fontSize: '.82rem' }}>
            ← Volver al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '.85rem' }}>
      <div>
        <label className="form-label">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
          autoComplete="email"
        />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.3rem' }}>
          <label className="form-label" style={{ margin: 0 }}>Contraseña</label>
          <button type="button" onClick={() => { setForgotEmail(email); setForgotMode(true); }}
            style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '.75rem', cursor: 'pointer' }}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            minLength={6}
            style={{ paddingRight: '2.5rem' }}
          />
          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text3)', display: 'flex', alignItems: 'center', padding: 2,
            }}
          >
            <EyeIcon visible={showPass} />
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert--error">{error}</div>
      )}

      <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '.3rem' }}>
        Iniciar sesión
      </Button>

      <div style={{ textAlign: 'center', fontSize: '.82rem', color: 'var(--text2)', marginTop: '.3rem' }}>
        ¿No tenés cuenta?{' '}
        <button type="button" onClick={onSwitch}
          style={{ background: 'none', border: 'none', color: 'var(--orange)', fontWeight: 700, cursor: 'pointer', fontSize: '.82rem' }}>
          Registrate
        </button>
      </div>

    </form>
  );
}
