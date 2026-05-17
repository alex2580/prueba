'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';

interface RegisterFormProps {
  onRegister: (nombre: string, email: string, password: string, tipo: 'oferente' | 'demandante', tel?: string) => Promise<boolean>;
  onSwitch: () => void;
  loading?: boolean;
  error?: string | null;
}

export function RegisterForm({ onRegister, onSwitch, loading, error }: RegisterFormProps) {
  const [nombre,   setNombre]   = useState('');
  const [email,    setEmail]    = useState('');
  const [tel,      setTel]      = useState('');
  const [password, setPassword] = useState('');
  const [tipo,     setTipo]     = useState<'demandante' | 'oferente'>('demandante');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nombre || !email || !password) return;
    await onRegister(nombre, email, password, tipo, tel);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '.85rem' }}>
      {/* Tipo switch */}
      <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 'var(--r2)', padding: 3, gap: 3 }}>
        {(['demandante', 'oferente'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            style={{
              flex: 1, padding: '.44rem', borderRadius: 13, border: 'none',
              fontFamily: 'DM Sans, sans-serif', fontSize: '.83rem',
              fontWeight: tipo === t ? 700 : 500,
              color: tipo === t ? 'var(--orange)' : 'var(--text2)',
              background: tipo === t ? 'var(--surface)' : 'transparent',
              boxShadow: tipo === t ? 'var(--s1)' : 'none',
              transition: 'all .2s',
              cursor: 'pointer',
            }}
          >
            {t === 'demandante' ? '📦 Quiero almacenar' : '🏠 Ofrezco espacio'}
          </button>
        ))}
      </div>

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
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres" required autoComplete="new-password" minLength={6} />
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '.3rem' }}>
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
