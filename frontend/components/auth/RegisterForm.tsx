'use client';

import { useState, FormEvent } from 'react';
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

interface RegisterFormProps {
  onRegister: (nombre: string, email: string, password: string, tipo: 'usuario', tel?: string, terminos_aceptados?: boolean) => Promise<boolean | string>;
  onSwitch: () => void;
  loading?: boolean;
  error?: string | null;
}

export function RegisterForm({ onRegister, onSwitch, loading, error }: RegisterFormProps) {
  const [nombre,    setNombre]    = useState('');
  const [email,     setEmail]     = useState('');
  const [tel,       setTel]       = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [mayorEdad, setMayorEdad] = useState(false);
  const [terminos,  setTerminos]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nombre || !email || !password || !mayorEdad || !terminos) return;
    await onRegister(nombre, email, password, 'usuario', tel, terminos);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '.85rem' }}>
      <div>
        <label className="form-label">Nombre completo</label>
        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
          placeholder="Tu nombre" required autoComplete="name" />
      </div>

      <div>
        <label className="form-label">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="tu@email.com" required autoComplete="email" />
      </div>

      <div>
        <label className="form-label">Teléfono (opcional)</label>
        <input type="tel" value={tel} onChange={e => setTel(e.target.value)}
          placeholder="+54 11 1234-5678" autoComplete="tel" />
      </div>

      <div>
        <label className="form-label">Contraseña</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            autoComplete="new-password"
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

      <label style={{ display: 'flex', alignItems: 'center', gap: '.6rem', cursor: 'pointer', userSelect: 'none' }}>
        <input
          type="checkbox"
          checked={mayorEdad}
          onChange={e => setMayorEdad(e.target.checked)}
          required
          style={{ width: 18, height: 18, accentColor: 'var(--orange)', flexShrink: 0, cursor: 'pointer' }}
        />
        <span style={{ fontSize: '.83rem', color: 'var(--text2)' }}>
          Soy mayor de 18 años
        </span>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: '.6rem', cursor: 'pointer', userSelect: 'none' }}>
        <input
          type="checkbox"
          checked={terminos}
          onChange={e => setTerminos(e.target.checked)}
          required
          style={{ width: 18, height: 18, accentColor: 'var(--orange)', flexShrink: 0, cursor: 'pointer' }}
        />
        <span style={{ fontSize: '.83rem', color: 'var(--text2)' }}>
          Acepto los{' '}
          <a href="/es/legales" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--orange)', textDecoration: 'underline' }}>
            Términos y Condiciones
          </a>
          {' '}y la{' '}
          <a href="/es/legales#politica-privacidad" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--orange)', textDecoration: 'underline' }}>
            Política de Privacidad
          </a>
        </span>
      </label>

      {error && <div className="alert alert--error">{error}</div>}

      <Button type="submit" loading={loading} disabled={!mayorEdad || !terminos} style={{ width: '100%', marginTop: '.3rem' }}>
        Crear cuenta
      </Button>

      <div style={{ textAlign: 'center', fontSize: '.82rem', color: 'var(--text2)', marginTop: '.3rem' }}>
        ¿Ya tenés cuenta?{' '}
        <button type="button" onClick={onSwitch}
          style={{ background: 'none', border: 'none', color: 'var(--orange)', fontWeight: 700, cursor: 'pointer', fontSize: '.82rem' }}>
          Iniciá sesión
        </button>
      </div>
    </form>
  );
}
