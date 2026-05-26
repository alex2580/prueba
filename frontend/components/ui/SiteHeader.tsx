'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { SiteLogo } from '@/components/ui/SiteLogo';

interface SiteHeaderProps {
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
}

export function SiteHeader({ onLoginClick, onRegisterClick }: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className="site-header">
      <SiteLogo onClick={() => router.push('/')} />

      <nav className="nav">
        <button
          className="nav-btn"
          onClick={() => router.push('/')}
        >
          🔍 Buscar espacios
        </button>
        <button
          className={`nav-btn ${pathname === '/como-funciona' ? 'active' : ''}`}
          onClick={() => router.push('/como-funciona')}
        >
          💡 Cómo funciona
        </button>
        <button
          className={`nav-btn ${pathname === '/legales' ? 'active' : ''}`}
          onClick={() => router.push('/legales')}
        >
          📋 Legales
        </button>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', justifyContent: 'flex-end' }}>
        {user ? (
          <>
            {isAdmin && (
              <button
                className="nav-btn"
                style={{ color: 'var(--orange)', fontWeight: 700 }}
                onClick={() => router.push('/admin')}
              >
                Admin
              </button>
            )}
            <button className="nav-btn" onClick={() => router.push('/panel')}>Mi cuenta</button>
            <button className="nav-btn" onClick={logout}>Salir</button>
            <button className="btn-register" onClick={() => router.push('/publicar')}>
              Publicar espacio
            </button>
          </>
        ) : (
          <>
            <button
              className="btn-login"
              onClick={onLoginClick ?? (() => router.push('/auth/login'))}
            >
              Ingresar
            </button>
            <button
              className="btn-register"
              onClick={onRegisterClick ?? (() => router.push('/auth/register'))}
            >
              Registrarse
            </button>
          </>
        )}
      </div>
    </header>
  );
}
