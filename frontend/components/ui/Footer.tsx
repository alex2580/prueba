'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/navigation';
import { SiteLogo } from './SiteLogo';

interface Columna {
  titulo: string;
  links: { label: string; path: string }[];
}

const COLUMNAS: Columna[] = [
  {
    titulo: 'Empresa',
    links: [
      { label: '¿Cómo funciona?', path: '/como-funciona' },
      { label: 'Sobre nosotros', path: '/sobre-nosotros' },
      { label: 'Publicar tu espacio', path: '/publicar' },
    ],
  },
  {
    titulo: 'Soporte',
    links: [
      { label: 'Preguntas frecuentes', path: '/#preguntas-frecuentes' },
      { label: 'Contacto', path: '/contacto' },
    ],
  },
  {
    titulo: 'Legal',
    links: [
      { label: 'Términos y Condiciones', path: '/legales' },
      { label: 'Política de Privacidad', path: '/legales#politica-privacidad' },
    ],
  },
];

export function Footer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pathname === '/' && searchParams.get('vista') === 'mapa') return null;

  // En mobile el footer se muestra en la home y en páginas de contenido
  // (cómo funciona, legales) — en el resto le come espacio de pantalla a
  // flujos donde importa más (reserva, publicación, panel, detalle de
  // espacio, etc). En tablet/desktop siempre se muestra (CSS).
  const PAGINAS_CON_FOOTER_MOBILE = ['/', '/como-funciona', '/legales'];
  const ocultarEnMobile = !PAGINAS_CON_FOOTER_MOBILE.includes(pathname);

  return (
    <footer className={`site-footer ${ocultarEnMobile ? 'site-footer--oculto-mobile' : ''}`}>
      <style>{`
        .site-footer {
          background: var(--surface);
          border-top: 1px solid var(--border);
          padding: 2.5rem 1.5rem 1.5rem;
        }
        @media (max-width: 640px) {
          .site-footer--oculto-mobile { display: none; }
        }
        .site-footer__inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1fr;
          gap: 2rem;
        }
        .site-footer__col-title {
          font-family: Sora, sans-serif;
          font-weight: 700;
          font-size: .82rem;
          color: var(--text);
          margin-bottom: .9rem;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .site-footer__link {
          display: block;
          background: none;
          border: none;
          padding: 0;
          margin-bottom: .65rem;
          font-size: .85rem;
          color: var(--text2);
          cursor: pointer;
          text-align: left;
          font-family: inherit;
        }
        .site-footer__link:hover { color: var(--orange); }
        .site-footer__tagline {
          font-size: .85rem;
          color: var(--text3);
          margin-top: .75rem;
          max-width: 280px;
          line-height: 1.6;
        }
        .site-footer__bottom {
          max-width: 1200px;
          margin: 2rem auto 0;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border);
          font-size: .78rem;
          color: var(--text3);
          text-align: center;
        }
        @media (max-width: 860px) {
          .site-footer__inner { grid-template-columns: 1fr 1fr; gap: 1.75rem; }
        }
        @media (max-width: 520px) {
          .site-footer__inner { grid-template-columns: 1fr; gap: 1.5rem; }
        }
      `}</style>

      <div className="site-footer__inner">
        <div>
          <SiteLogo />
          <p className="site-footer__tagline">
            Marketplace de espacios de guardado urbano — conectamos a quienes tienen espacio disponible con quienes lo necesitan.
          </p>
        </div>

        {COLUMNAS.map(col => (
          <div key={col.titulo}>
            <div className="site-footer__col-title">{col.titulo}</div>
            {col.links.map(link => (
              <button
                key={link.path}
                className="site-footer__link"
                onClick={() => {
                  if (link.path.includes('#') && link.path.startsWith('/#') && typeof window !== 'undefined' && window.location.pathname === '/') {
                    document.querySelector(link.path.slice(1))?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    router.push(link.path);
                  }
                }}
              >
                {link.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="site-footer__bottom">
        © {new Date().getFullYear()} TodasMisCosas.com — Todos los derechos reservados.
      </div>
    </footer>
  );
}
