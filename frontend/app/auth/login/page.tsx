'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loading, error } = useAuth();

  useEffect(() => {
    if (user) router.push('/panel');
  }, [user, router]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r4)', overflow: 'hidden',
        width: 'min(420px, 100%)', boxShadow: 'var(--s5)',
      }}>
        <div style={{ height: 5, background: 'linear-gradient(90deg, var(--orange), var(--amber) 40%, var(--blue) 70%, var(--mint))' }} />
        <div style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>📦</div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.4rem', marginBottom: '.25rem' }}>
              Bienvenido de vuelta
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '.85rem' }}>Ingresá a tu cuenta de TodasMisCosas</p>
          </div>
          <LoginForm
            onLogin={async (email, password) => {
              const ok = await login(email, password);
              if (ok) router.push('/panel');
              return ok;
            }}
            onSwitch={() => router.push('/auth/register')}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
