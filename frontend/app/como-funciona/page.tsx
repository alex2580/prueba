'use client';

import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/ui/SiteHeader';

const PASOS_RESERVAR = [
  {
    icon: '🔍',
    titulo: 'Buscás un espacio',
    desc: 'Seleccioná una tarjeta o hacé click en las publicaciones del mapa. Puede ser compartido o solo para vos.',
  },
  {
    icon: '📦',
    titulo: 'Elegís y reservás',
    desc: 'Seleccioná el espacio que más te conviene. Alquilá por día o por mes.',
  },
  {
    icon: '💳',
    titulo: 'Pagás de forma segura',
    desc: 'Podés pagar con Mercado Pago.',
  },
  {
    icon: '🔑',
    titulo: 'Coordinás el acceso',
    desc: 'Vos y el que publicó el espacio recibirán el mismo PIN de 4 dígitos por correo para que puedan identificarse.',
  },
];

const PASOS_PUBLICAR = [
  {
    icon: '📢',
    titulo: 'Publicás tu espacio',
    desc: 'Andá al botón "Publicar espacio" y contale a todos qué espacio ofrecés. Si es para uso exclusivo o compartido, si lo alquilás por día, por mes o de ambas formas. Marcá en el calendario los días o meses en que estará disponible (podés marcar hasta 90 días desde hoy). Tu publicación tiene una vigencia de 90 días — 30 días antes de que venza te avisamos por mail.',
  },
  {
    icon: '📷',
    titulo: 'Subís fotos',
    desc: 'Podés subir hasta un máximo de 5 fotos.',
  },
  {
    icon: '🛡️',
    titulo: 'Definís el grado de seguridad',
    desc: 'Hacé click en las medidas de seguridad que tiene tu espacio. Esto le permite saber a quienes buscan espacio con qué medidas de seguridad disponés para cuidar sus bienes.',
  },
  {
    icon: '👤',
    titulo: 'Te registrás',
    desc: 'Si no te identificaste aún, este es el momento. Cuando alguien proceda con la reserva de tu sitio, ambos recibirán un PIN de 4 dígitos por correo para identificarse.',
  },
];

const PARA_QUIEN = [
  { icon: '👤', titulo: 'Particulares', desc: 'Muebles, mudanzas, objetos de temporada.' },
  { icon: '📦', titulo: 'E-commerce', desc: 'Stock cerca de tus clientes.' },
  { icon: '🏭', titulo: 'Empresas', desc: 'Archivo, materiales, flota.' },
  { icon: '🚚', titulo: 'Logística', desc: 'Galpones con acceso para camiones.' },
];

function PasoCard({ paso, index, accentColor, bgColor, borderColor }: {
  paso: { icon: string; titulo: string; desc: string };
  index: number;
  accentColor: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--r3)',
      padding: '1.1rem 1.25rem',
      display: 'flex', gap: '.9rem', alignItems: 'flex-start',
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 11, flexShrink: 0,
        background: bgColor, border: `1px solid ${borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem', position: 'relative',
      }}>
        {paso.icon}
        <span style={{
          position: 'absolute', top: -8, right: -8,
          background: accentColor, color: '#fff',
          borderRadius: '50%', width: 18, height: 18,
          fontSize: '.62rem', fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Sora, sans-serif',
        }}>{index + 1}</span>
      </div>
      <div>
        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.92rem', color: 'var(--text)', marginBottom: '.25rem' }}>
          {paso.titulo}
        </div>
        <div style={{ fontSize: '.8rem', color: 'var(--text2)', lineHeight: 1.65 }}>
          {paso.desc}
        </div>
      </div>
    </div>
  );
}

export default function ComoFuncionaPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .cf-sections { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
        @media (min-width: 860px) { .cf-sections { grid-template-columns: 1fr 1fr; } }
        .cf-steps { display: grid; grid-template-columns: 1fr; gap: .75rem; }
        @media (min-width: 560px) { .cf-steps { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 860px) { .cf-steps { grid-template-columns: 1fr; } }
        .pq-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        @media (min-width: 640px) { .pq-grid { grid-template-columns: repeat(4, 1fr); } }
      `}</style>

      <SiteHeader />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '3rem 1.5rem 2.5rem',
        textAlign: 'center',
      }}>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3.2rem)', lineHeight: 1.15, marginBottom: '1.25rem' }}>
          <span style={{ color: 'var(--text)', display: 'block' }}>Guardá lo que querés</span>
          <span style={{ color: 'var(--orange)', display: 'block' }}>Donde querés.</span>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '.95rem', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 1.75rem' }}>
          Conectamos personas y empresas que necesitan guardar cosas con quienes tienen espacio disponible.
        </p>
        <button className="btn-primary" onClick={() => router.push('/publicar')}>
          ➕ Publicar mi espacio
        </button>
      </div>

      <div className="page-scroll" style={{ flex: 1 }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '2.5rem 1.25rem' }}>

          {/* Tipos de espacio */}
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', marginBottom: '1.1rem', color: 'var(--text)' }}>
            Tipos de espacio
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2.5rem', justifyItems: 'center', justifyContent: 'center', maxWidth: 640, margin: '0 auto 2.5rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(30,41,59,.18)', borderRadius: 'var(--r3)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.65rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🔒</span>
                <div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.95rem', color: 'var(--text)' }}>Exclusivo</div>
                  <span className="pill pill--dark">Mayor privacidad</span>
                </div>
              </div>
              <div style={{ fontSize: '.8rem', color: 'var(--text2)', lineHeight: 1.65 }}>
                Solo vos usás el espacio. Acceso privado, tu candado.
              </div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(232,98,42,.28)', borderRadius: 'var(--r3)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.65rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🤝</span>
                <div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.95rem', color: 'var(--orange)' }}>Compartido</div>
                  <span className="pill pill--orange">Mejor precio</span>
                </div>
              </div>
              <div style={{ fontSize: '.8rem', color: 'var(--text2)', lineHeight: 1.65 }}>
                Compartís con otros. Costo dividido, ideal largo plazo.
              </div>
            </div>
          </div>

          {/* Doble sección: Reservar + Publicar */}
          <div className="cf-sections" style={{ marginBottom: '2.5rem' }}>

            {/* ── Para Reservar ── */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r4)',
              overflow: 'hidden',
            }}>
              {/* Header sección */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(232,98,42,.12) 0%, rgba(232,98,42,.04) 100%)',
                borderBottom: '1px solid rgba(232,98,42,.2)',
                padding: '1.1rem 1.4rem',
                display: 'flex', alignItems: 'center', gap: '.75rem',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(232,98,42,.15)', border: '1px solid rgba(232,98,42,.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
                }}>🔍</div>
                <div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1rem', color: 'var(--orange)' }}>
                    Para Reservar
                  </div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>4 pasos simples</div>
                </div>
                {/* Sello GRATIS — búsqueda */}
                <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'linear-gradient(145deg, #22c55e 0%, #16a34a 55%, #15803d 100%)',
                    boxShadow: '0 0 0 2.5px #fff, 0 0 0 5px #16a34a, 0 6px 20px rgba(22,163,74,.55)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    transform: 'rotate(-10deg)',
                    gap: 1,
                  }}>
                    <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>✓</span>
                    <span style={{
                      fontFamily: 'Sora, sans-serif', fontWeight: 900,
                      fontSize: '.78rem', color: '#fff',
                      letterSpacing: '.06em', lineHeight: 1,
                      textShadow: '0 1px 3px rgba(0,0,0,.25)',
                    }}>GRATIS</span>
                  </div>
                </div>
              </div>
              {/* Steps */}
              <div className="cf-steps" style={{ padding: '1.1rem' }}>
                {PASOS_RESERVAR.map((paso, i) => (
                  <PasoCard
                    key={paso.titulo}
                    paso={paso}
                    index={i}
                    accentColor="var(--orange)"
                    bgColor="rgba(232,98,42,.09)"
                    borderColor="rgba(232,98,42,.18)"
                  />
                ))}
              </div>
            </div>

            {/* ── Para Publicar ── */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r4)',
              overflow: 'hidden',
            }}>
              {/* Header sección */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(30,64,175,.1) 0%, rgba(30,64,175,.03) 100%)',
                borderBottom: '1px solid rgba(30,64,175,.18)',
                padding: '1.1rem 1.4rem',
                display: 'flex', alignItems: 'center', gap: '.75rem',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(30,64,175,.12)', border: '1px solid rgba(30,64,175,.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
                }}>📢</div>
                <div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#1e40af' }}>
                    Para Publicar
                  </div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>4 pasos simples</div>
                </div>
                {/* Sello GRATIS — publicar */}
                <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'linear-gradient(145deg, #22c55e 0%, #16a34a 55%, #15803d 100%)',
                    boxShadow: '0 0 0 2.5px #fff, 0 0 0 5px #16a34a, 0 6px 20px rgba(22,163,74,.55)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    transform: 'rotate(-10deg)',
                    gap: 1,
                  }}>
                    <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>✓</span>
                    <span style={{
                      fontFamily: 'Sora, sans-serif', fontWeight: 900,
                      fontSize: '.78rem', color: '#fff',
                      letterSpacing: '.06em', lineHeight: 1,
                      textShadow: '0 1px 3px rgba(0,0,0,.25)',
                    }}>GRATIS</span>
                  </div>
                </div>
              </div>
              {/* Steps */}
              <div className="cf-steps" style={{ padding: '1.1rem' }}>
                {PASOS_PUBLICAR.map((paso, i) => (
                  <PasoCard
                    key={paso.titulo}
                    paso={paso}
                    index={i}
                    accentColor="#1e40af"
                    bgColor="rgba(30,64,175,.08)"
                    borderColor="rgba(30,64,175,.15)"
                  />
                ))}
              </div>
              {/* Nota */}
              <div style={{
                margin: '0 1.1rem .6rem',
                background: 'rgba(34,197,94,.07)',
                border: '1px solid rgba(34,197,94,.3)',
                borderRadius: 'var(--r2)',
                padding: '.85rem 1rem',
                fontSize: '.78rem',
                color: 'var(--text2)',
                lineHeight: 1.7,
              }}>
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: '#15803d' }}>✅ Publicar es gratis: </span>
                Buscar un espacio y publicar uno son servicios <strong>100% gratuitos</strong>.{' '}
                <strong>TodasMisCosas cobra el 15% de comisión únicamente cuando se concreta una reserva.</strong>{' '}
                Si nadie te reserva, no pagás nada.
              </div>
              <div style={{
                margin: '0 1.1rem .6rem',
                background: 'rgba(245,158,11,.07)',
                border: '1px solid rgba(245,158,11,.3)',
                borderRadius: 'var(--r2)',
                padding: '.85rem 1rem',
                fontSize: '.78rem',
                color: 'var(--text2)',
                lineHeight: 1.7,
              }}>
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: '#b45309' }}>⏳ Vigencia 90 días: </span>
                Cada publicación tiene una vigencia de <strong>90 días</strong>. Te avisamos por mail 30 días antes de que venza.
                Al vencer, la publicación se desactiva y podés crear una nueva para seguir ofreciendo tu espacio.
              </div>
              <div style={{
                margin: '0 1.1rem 1.1rem',
                background: 'rgba(245,158,11,.07)',
                border: '1px solid rgba(245,158,11,.3)',
                borderRadius: 'var(--r2)',
                padding: '.85rem 1rem',
                fontSize: '.78rem',
                color: 'var(--text2)',
                lineHeight: 1.7,
              }}>
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: '#b45309' }}>📌 CBU / Alias: </span>
                No olvides cargarlo en el perfil de tu cuenta para recibir en <strong>48hs</strong> el importe neto cuando alguien te elija.
                Si no entendés algo, consultanos antes.
              </div>
            </div>

          </div>

          {/* Para quién */}
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', marginBottom: '1.1rem', color: 'var(--text)' }}>
            ¿Para quién es TodasMisCosas.com?
          </h2>
          <div className="pq-grid" style={{ marginBottom: '2.5rem' }}>
            {PARA_QUIEN.map(p => (
              <div key={p.titulo} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r3)',
                padding: '1.25rem 1rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>{p.icon}</div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.88rem', color: 'var(--text)', marginBottom: '.3rem' }}>
                  {p.titulo}
                </div>
                <div style={{ fontSize: '.75rem', color: 'var(--text2)', lineHeight: 1.6 }}>
                  {p.desc}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{
            background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r4)',
            padding: '2rem',
            textAlign: 'center',
          }}>
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.2rem', marginBottom: '.6rem' }}>
              ¿Tenés espacio disponible?
            </h3>
            <p style={{ color: 'var(--text2)', fontSize: '.88rem', marginBottom: '1.25rem', lineHeight: 1.7 }}>
              Publicalo en minutos y empezá a generar ingresos extras.
            </p>
            <button className="btn-primary" onClick={() => router.push('/publicar')}>
              ➕ Publicar mi espacio
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
