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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
        {(['demandante', 'oferente'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            style={{
              padding: '.75rem .5rem',
              borderRadius: 'var(--r2)',
              border: tipo === t ? '2px solid var(--orange)' : '2px solid var(--border)',
              fontFamily: 'Sora, sans-serif',
              fontSize: '.82rem',
              fontWeight: 700,
              color: tipo === t ? '#fff' : 'var(--text2)',
              background: tipo === t ? 'var(--orange)' : 'var(--surface2)',
              cursor: 'pointer',
              transition: 'all .18s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '.3rem',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>{t === 'demandante' ? '📦' : '🏠'}</span>
            {t === 'demandante' ? 'Quiero almacenar' : 'Ofrezco espacio'}
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
