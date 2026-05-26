'use client';

import { useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  const navItems = [
    { label: 'Buscar espacios', path: '/' },
    { label: 'Cómo funciona',   path: '/como-funciona' },
    { label: 'Legales',         path: '/legales' },
  ];

  return (
    <>
      <header className="site-header">
        <SiteLogo onClick={() => { router.push('/'); close(); }} />

        {/* Nav central — oculto en mobile, visible en tablet+ */}
        <nav className="nav">
          {navItems.map(n => (
            <button
              key={n.path}
              className={`nav-btn ${pathname === n.path ? 'active' : ''}`}
              onClick={() => router.push(n.path)}
            >
              {n.label}
            </button>
          ))}
          <button
            className={`btn-register ${pathname === '/publicar' ? 'active' : ''}`}
            onClick={() => router.push('/publicar')}
          >
            Publicar espacio
          </button>
        </nav>

        {/* Acciones derecha — desktop */}
        <div className="header-actions">
          {user ? (
            <>
              {isAdmin && (
                <button className="nav-btn" style={{ color: 'var(--orange)', fontWeight: 700 }}
                  onClick={() => router.push('/admin')}>
                  Admin
                </button>
              )}
              <button className="nav-btn" onClick={() => router.push('/panel')}>Mi cuenta</button>
              <button className="nav-btn" onClick={logout}>Salir</button>
            </>
          ) : (
            <>
              <button className="btn-login" onClick={onLoginClick ?? (() => router.push('/auth/login'))}>
                Ingresar
              </button>
              <button className="btn-login" onClick={onRegisterClick ?? (() => router.push('/auth/register'))}>
                Registrarse
              </button>
            </>
          )}
        </div>

        {/* Hamburguesa — solo mobile */}
        <button
          className="hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menú"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Menú mobile desplegable */}
      {menuOpen && (
        <div className="mobile-menu">
          {navItems.map(n => (
            <button key={n.path} className="mobile-menu__item"
              onClick={() => { router.push(n.path); close(); }}>
              {n.label}
            </button>
          ))}
          <button className="mobile-menu__item mobile-menu__item--publish"
            onClick={() => { router.push('/publicar'); close(); }}>
            Publicar espacio
          </button>
          <div className="mobile-menu__divider" />
          {user ? (
            <>
              {isAdmin && (
                <button className="mobile-menu__item"
                  onClick={() => { router.push('/admin'); close(); }}>
                  ⚙️ Admin
                </button>
              )}
              <button className="mobile-menu__item"
                onClick={() => { router.push('/panel'); close(); }}>
                Mi cuenta
              </button>
              <button className="mobile-menu__item"
                onClick={() => { logout(); close(); }}>
                Salir
              </button>
            </>
          ) : (
            <>
              <button className="mobile-menu__item"
                onClick={() => { (onLoginClick ?? (() => router.push('/auth/login')))(); close(); }}>
                Ingresar
              </button>
              <button className="mobile-menu__item"
                onClick={() => { (onRegisterClick ?? (() => router.push('/auth/register')))(); close(); }}>
                Registrarse
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
