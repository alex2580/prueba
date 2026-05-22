'use client';

import { useRouter } from 'next/navigation';
import { SiteLogo } from '@/components/ui/SiteLogo';

const ESPACIOS = [
  {
    icon: '📦',
    badge: 'Popular',
    badgeColor: 'rgba(232,98,42,.15)',
    badgeText: '#e8622a',
    nombre: 'Almacenamiento Personal',
    desc: 'Guardá muebles, ropa de temporada, bicicletas o todo lo que sobra en tu departamento. Sin contratos largos, sin burocracia.',
    precio: 'Desde $350/día',
  },
  {
    icon: '🏭',
    badge: 'B2B',
    badgeColor: 'rgba(130,196,255,.15)',
    badgeText: '#82c4ff',
    nombre: 'Depósito para Empresas',
    desc: 'Stock, archivo muerto, materiales de obra o equipos industriales. Acceso para camiones y grúas. Facturación disponible.',
    precio: 'Desde $1.800/día',
  },
  {
    icon: '🚛',
    badge: 'E-commerce',
    badgeColor: 'rgba(16,185,129,.15)',
    badgeText: '#10B981',
    nombre: 'Logística & Last-Mile',
    desc: 'Puntos de acopio estratégicos cerca de tus clientes. Reducí tiempos de entrega. Ideal para distribuidoras y tiendas online.',
    precio: 'Desde $2.200/día',
  },
  {
    icon: '🔒',
    badge: 'Exclusivo',
    badgeColor: 'rgba(130,196,255,.15)',
    badgeText: '#82c4ff',
    nombre: 'Bauleras Privadas',
    desc: 'Espacios pequeños y exclusivos con cerradura propia. Acceso frecuente garantizado. Ideales para documentos o artículos de valor.',
    precio: 'Desde $480/día',
  },
  {
    icon: '🤝',
    badge: 'Económico',
    badgeColor: 'rgba(16,185,129,.15)',
    badgeText: '#10B981',
    nombre: 'Espacios Compartidos',
    desc: 'Fracción de galpón o depósito compartido. Costo dividido entre varios usuarios. La opción más económica para largo plazo.',
    precio: 'Desde $350/día',
  },
];

const SERVICIOS_ADICIONALES_INFO = [
  {
    icon: '🚚',
    nombre: 'Transporte',
    desc: 'Coordina el retiro y traslado de tus pertenencias hasta el espacio contratado. Contamos con flota propia para cargas medianas y grandes. Servicio disponible en CABA y GBA.',
    detalle: 'Incluye carga, traslado y descarga.',
    precio: 'Desde $8.500',
    color: '#82c4ff',
    colorBg: 'rgba(130,196,255,.12)',
  },
  {
    icon: '🛡️',
    nombre: 'Seguros',
    desc: 'Protección total sobre los bienes almacenados contra robo, incendio y daños accidentales. Emitido por aseguradora habilitada. Certificado digital disponible al instante.',
    detalle: 'Cobertura hasta el valor declarado.',
    precio: 'Desde $2.500/mes',
    color: '#F59E0B',
    colorBg: 'rgba(245,158,11,.12)',
  },
  {
    icon: '📦',
    nombre: 'Embalaje',
    desc: 'Kit profesional de embalaje entregado en tu domicilio: cajas de distintos tamaños, cinta de embalar, papel burbuja y marcadores. Ideal para mudanzas o guardado de larga duración.',
    detalle: 'Kit básico, estándar o premium disponibles.',
    precio: 'Desde $1.800',
    color: '#10B981',
    colorBg: 'rgba(16,185,129,.12)',
  },
];

export default function ServiciosPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="site-header">
        <SiteLogo onClick={() => router.push('/')} />
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.95rem', color: 'var(--orange)' }}>
            🏷️ Nuestros Servicios
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
        <div style={{ fontSize: '2.8rem', marginBottom: '.75rem' }}>🏷️</div>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: '.75rem' }}>
          Nuestros <span style={{ color: 'var(--orange)' }}>Servicios</span>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '.95rem', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
          Todo lo que necesitás para guardar, almacenar y gestionar tus espacios.
        </p>
      </div>

      {/* Grid de servicios */}
      <div className="page-scroll" style={{ flex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

          {/* Tipos de espacio */}
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text)' }}>
            🏠 Tipos de almacenamiento
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.25rem',
            marginBottom: '3rem',
          }}>
            {ESPACIOS.map(s => (
              <div key={s.nombre} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r3)',
                padding: '1.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '.5rem',
                transition: 'transform .15s, box-shadow .15s, border-color .15s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--s4)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(232,98,42,.3)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = '';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                  <span style={{
                    background: s.badgeColor,
                    color: s.badgeText,
                    fontSize: '.6rem', fontWeight: 700,
                    padding: '2px 8px', borderRadius: '99px',
                    fontFamily: 'Sora, sans-serif',
                  }}>{s.badge}</span>
                </div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.95rem', color: 'var(--text)' }}>
                  {s.nombre}
                </div>
                <div style={{ fontSize: '.8rem', color: 'var(--text2)', lineHeight: 1.65, flex: 1 }}>
                  {s.desc}
                </div>
                <div style={{ fontSize: '.85rem', color: 'var(--orange)', fontWeight: 700 }}>
                  {s.precio}
                </div>
                <button
                  onClick={() => router.push('/')}
                  style={{
                    background: 'rgba(232,98,42,.1)',
                    border: '1px solid rgba(232,98,42,.25)',
                    color: 'var(--orange)',
                    borderRadius: 'var(--r2)',
                    padding: '.45rem',
                    fontSize: '.8rem', fontWeight: 600,
                    fontFamily: 'inherit', cursor: 'pointer',
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,98,42,.2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,98,42,.1)'}
                >
                  🔍 Buscar espacios
                </button>
              </div>
            ))}
          </div>

          {/* Servicios Adicionales */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,.06) 0%, rgba(16,185,129,.02) 100%)',
            border: '1px solid rgba(16,185,129,.2)',
            borderRadius: 'var(--r4)',
            padding: '2rem',
            marginBottom: '2.5rem',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>⚡</div>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.25rem', marginBottom: '.5rem' }}>
                Servicios <span style={{ color: '#10b981' }}>Adicionales</span>
              </h2>
              <p style={{ color: 'var(--text2)', fontSize: '.88rem', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
                Complementá tu espacio de almacenamiento con servicios opcionales disponibles al momento de reservar.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.1rem' }}>
              {SERVICIOS_ADICIONALES_INFO.map(s => (
                <div key={s.nombre} style={{
                  background: 'var(--surface)',
                  border: `1.5px solid ${s.colorBg}`,
                  borderRadius: 'var(--r3)',
                  padding: '1.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '.55rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: s.colorBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.4rem', flexShrink: 0,
                    }}>
                      {s.icon}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.95rem', color: 'var(--text)' }}>
                        {s.nombre}
                      </div>
                      <div style={{ fontSize: '.72rem', color: s.color, fontWeight: 700 }}>{s.precio}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text2)', lineHeight: 1.7 }}>{s.desc}</div>
                  <div style={{
                    fontSize: '.72rem', color: s.color,
                    background: s.colorBg, borderRadius: 6,
                    padding: '4px 10px', alignSelf: 'flex-start', fontWeight: 600,
                  }}>
                    ✓ {s.detalle}
                  </div>
                  <button
                    onClick={() => router.push('/')}
                    style={{
                      background: 'none',
                      border: `1.5px solid ${s.colorBg}`,
                      color: s.color,
                      borderRadius: 'var(--r2)',
                      padding: '.4rem',
                      fontSize: '.78rem', fontWeight: 700,
                      fontFamily: 'inherit', cursor: 'pointer',
                      marginTop: '.2rem',
                    }}
                  >
                    Contratar al reservar →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Oferente */}
          <div style={{
            background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r4)',
            padding: '2rem',
            textAlign: 'center',
          }}>
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.2rem', marginBottom: '.6rem' }}>
              ¿Tenés un espacio disponible?
            </h3>
            <p style={{ color: 'var(--text2)', fontSize: '.88rem', marginBottom: '1.25rem', lineHeight: 1.7 }}>
              Sumá tu depósito, cochera o galpón y generá ingresos extras sin salir de casa.
            </p>
            <button
              className="btn-primary"
              onClick={() => router.push('/publicar')}
            >
              ➕ Publicar mi espacio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
