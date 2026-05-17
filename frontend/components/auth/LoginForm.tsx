'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onSwitch: () => void;
  loading?: boolean;
  error?: string | null;
}

export function LoginForm({ onLogin, onSwitch, loading, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    await onLogin(email, password);
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
        <label className="form-label">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          minLength={6}
        />
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

      {/* Demo hint */}
      <div className="alert alert--info" style={{ fontSize: '.75rem' }}>
        💡 <strong>Demo:</strong> ana@gmail.com / demo1234 (demandante) · carlos@todasmiscosas.com / demo1234 (oferente)
      </div>
    </form>
  );
}
