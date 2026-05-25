'use client';

import { useRouter } from 'next/navigation';
import { SiteLogo } from '@/components/ui/SiteLogo';

const PASOS = [
  {
    icon: '🔍',
    titulo: 'Buscás un espacio',
    desc: 'Usá el mapa para explorar depósitos, cocheras y galpones. Filtrá por tipo, barrio y precio.',
  },
  {
    icon: '📦',
    titulo: 'Elegís y reservás',
    desc: 'Seleccioná el espacio que más te conviene. Alquilá por día o por mes.',
  },
  {
    icon: '💳',
    titulo: 'Pagás de forma segura',
    desc: 'MercadoPago retiene el dinero hasta que confirmás el acceso al espacio.',
  },
  {
    icon: '🔑',
    titulo: 'Usás tu espacio',
    desc: 'Coordinás el acceso con el oferente. TodasMisCosas.com te respalda durante toda la operación.',
  },
  {
    icon: '🔐',
    titulo: 'Acceso verificado con PIN',
    desc: 'Tanto el demandante como el oferente reciben el mismo PIN de 4 dígitos para confirmar el inicio y fin de la operación.',
  },
];

const PARA_QUIEN = [
  { icon: '🏠', titulo: 'Particulares', desc: 'Muebles, mudanzas, objetos de temporada.' },
  { icon: '📦', titulo: 'E-commerce', desc: 'Stock cerca de tus clientes.' },
  { icon: '🏭', titulo: 'Empresas', desc: 'Archivo, materiales, flota.' },
  { icon: '🚚', titulo: 'Logística', desc: 'Galpones con acceso para camiones.' },
];

export default function ComoFuncionaPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="site-header">
        <SiteLogo onClick={() => router.push('/')} />
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.95rem', color: 'var(--orange)' }}>
            💡 Cómo funciona
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="nav-btn" onClick={() => router.push('/')}>← Volver al mapa</button>
        </div>
      </header>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '3rem 1.5rem 2.5rem',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.8rem', marginBottom: '.75rem' }}>💡</div>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: '.75rem' }}>
          ¿Cómo <span style={{ color: 'var(--orange)' }}>funciona</span>?
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '.95rem', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 1.75rem' }}>
          Conectamos personas y empresas que necesitan guardar cosas con quienes tienen espacio disponible.
        </p>
        <button className="btn-primary" onClick={() => router.push('/publicar')}>
          ➕ Publicar mi espacio
        </button>
      </div>

      <div className="page-scroll" style={{ flex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

          {/* Pasos */}
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.15rem', marginBottom: '1.25rem', color: 'var(--text)' }}>
            Los 5 pasos
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
            {PASOS.map((paso, i) => (
              <div key={paso.titulo} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r3)',
                padding: '1.25rem 1.4rem',
                display: 'flex', gap: '1rem', alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(232,98,42,.12)', border: '1px solid rgba(232,98,42,.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem', position: 'relative',
                }}>
                  {paso.icon}
                  <span style={{
                    position: 'absolute', top: -8, right: -8,
                    background: 'var(--orange)', color: '#fff',
                    borderRadius: '50%', width: 18, height: 18,
                    fontSize: '.65rem', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Sora, sans-serif',
                  }}>{i + 1}</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.95rem', color: 'var(--text)', marginBottom: '.3rem' }}>
                    {paso.titulo}
                  </div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.65 }}>
                    {paso.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Para quién */}
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.15rem', marginBottom: '1.25rem', color: 'var(--text)' }}>
            ¿Para quién es TodasMisCosas.com?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
            {PARA_QUIEN.map(p => (
              <div key={p.titulo} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r3)',
                padding: '1.4rem 1rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '.6rem' }}>{p.icon}</div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.9rem', color: 'var(--text)', marginBottom: '.35rem' }}>
                  {p.titulo}
                </div>
                <div style={{ fontSize: '.78rem', color: 'var(--text2)', lineHeight: 1.6 }}>
                  {p.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Tipos de espacio */}
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.15rem', marginBottom: '1.25rem', color: 'var(--text)' }}>
            Tipos de espacio
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(130,196,255,.28)', borderRadius: 'var(--r3)', padding: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.75rem' }}>
                <span style={{ fontSize: '1.6rem' }}>🔒</span>
                <div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--blue)' }}>Exclusivo</div>
                  <span className="pill pill--blue">Mayor privacidad</span>
                </div>
              </div>
              <div style={{ fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.65 }}>
                Solo vos usás el espacio. Acceso privado, tu candado.
              </div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(232,98,42,.28)', borderRadius: 'var(--r3)', padding: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.75rem' }}>
                <span style={{ fontSize: '1.6rem' }}>🤝</span>
                <div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--orange)' }}>Compartido</div>
                  <span className="pill pill--orange">Mejor precio</span>
                </div>
              </div>
              <div style={{ fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.65 }}>
                Compartís con otros. Costo dividido, ideal largo plazo.
              </div>
            </div>
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
