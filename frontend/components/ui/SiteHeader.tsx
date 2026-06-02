'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/navigation';
import { useAuth } from '@/hooks/useAuth';
import { SiteLogo } from '@/components/ui/SiteLogo';

interface SiteHeaderProps {
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
}

function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const other = locale === 'es' ? 'pt' : 'es';
  const flags: Record<string, string> = { es: '🇦🇷', pt: '🇧🇷' };
  const codes: Record<string, string> = { es: 'ES', pt: 'PT' };

  return (
    <button
      onClick={() => router.replace(pathname, { locale: other })}
      title={other === 'pt' ? 'Cambiar a Português' : 'Cambiar a Español'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '.35rem',
        padding: '.28rem .75rem',
        borderRadius: 999,
        border: '1.5px solid var(--border2)',
        background: 'var(--surface)',
        cursor: 'pointer',
        fontSize: '.78rem',
        fontWeight: 700,
        fontFamily: 'Sora, sans-serif',
        color: 'var(--text2)',
        transition: 'all .15s',
        flexShrink: 0,
        lineHeight: 1,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--orange)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--orange)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)';
      }}
    >
      <span style={{ fontSize: '1rem', lineHeight: 1 }}>{flags[locale]}</span>
      {codes[locale]}
    </button>
  );
}

export function SiteHeader({ onLoginClick, onRegisterClick }: SiteHeaderProps) {
  const t = useTranslations('header');
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  const navItems = [
    { label: t('buscar'),       path: '/' },
    { label: t('comoFunciona'), path: '/como-funciona' },
    { label: t('legales'),      path: '/legales' },
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
            {t('publicar')}
          </button>
        </nav>

        {/* Acciones derecha — desktop */}
        <div className="header-actions">
          <LocaleSwitcher />
          {user ? (
            <>
              {isAdmin && (
                <button className="nav-btn" style={{ color: 'var(--orange)', fontWeight: 700 }}
                  onClick={() => router.push('/admin')}>
                  {t('admin')}
                </button>
              )}
              <button className="nav-btn" onClick={() => router.push('/panel')}>{t('miCuenta')}</button>
              <button className="nav-btn" onClick={logout}>{t('salir')}</button>
            </>
          ) : (
            <>
              <button className="btn-login" onClick={onLoginClick ?? (() => router.push('/auth/login'))}>
                {t('ingresar')}
              </button>
              <button className="btn-login" onClick={onRegisterClick ?? (() => router.push('/auth/register'))}>
                {t('registrarse')}
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
            {t('publicar')}
          </button>
          <div className="mobile-menu__divider" />
          {user ? (
            <>
              {isAdmin && (
                <button className="mobile-menu__item"
                  onClick={() => { router.push('/admin'); close(); }}>
                  ⚙️ {t('admin')}
                </button>
              )}
              <button className="mobile-menu__item"
                onClick={() => { router.push('/panel'); close(); }}>
                {t('miCuenta')}
              </button>
              <button className="mobile-menu__item"
                onClick={() => { logout(); close(); }}>
                {t('salir')}
              </button>
            </>
          ) : (
            <>
              <button className="mobile-menu__item"
                onClick={() => { (onLoginClick ?? (() => router.push('/auth/login')))(); close(); }}>
                {t('ingresar')}
              </button>
              <button className="mobile-menu__item"
                onClick={() => { (onRegisterClick ?? (() => router.push('/auth/register')))(); close(); }}>
                {t('registrarse')}
              </button>
            </>
          )}
          <div className="mobile-menu__divider" />
          <div style={{ padding: '.4rem 1rem' }}>
            <LocaleSwitcher />
          </div>
        </div>
      )}
    </>
  );
}
