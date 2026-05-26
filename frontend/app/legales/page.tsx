'use client';

import { SiteHeader } from '@/components/ui/SiteHeader';

export default function LegalesPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />

      <div className="page-scroll" style={{ flex: 1 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '.5rem' }}>
            📋 Términos y Condiciones
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: '.82rem', marginBottom: '2rem' }}>
            Última actualización: mayo 2026
          </p>

          {[
            {
              titulo: '1. Objeto del servicio',
              texto: 'TodasMisCosas.com es una plataforma digital que conecta personas que necesitan almacenar objetos ("demandantes") con personas o empresas que tienen espacios disponibles ("oferentes"). TodasMisCosas.com actúa como intermediario y no es parte del contrato de locación de espacio.',
            },
            {
              titulo: '2. Responsabilidades del oferente',
              texto: 'El oferente es responsable de describir con veracidad el espacio publicado, mantener las condiciones de seguridad indicadas, garantizar el acceso pactado, y cumplir con la legislación vigente en materia de alquileres y habilitaciones.',
            },
            {
              titulo: '3. Responsabilidades del demandante',
              texto: 'El demandante se compromete a utilizar el espacio únicamente para el almacenamiento de objetos lícitos, respetar las condiciones pactadas, y no subarrendar ni ceder el espacio a terceros sin autorización.',
            },
            {
              titulo: '4. Pagos y comisiones',
              texto: 'Los pagos se procesan a través de MercadoPago. TodasMisCosas.com cobra una comisión de servicio sobre cada transacción completada. El monto de la comisión se muestra claramente antes de confirmar la reserva.',
            },
            {
              titulo: '5. Política de cancelación',
              texto: 'Las cancelaciones realizadas con más de 48 horas de anticipación dan derecho a reembolso total. Las cancelaciones con menos de 48 horas pueden estar sujetas a penalidades según lo acordado en cada publicación.',
            },
            {
              titulo: '6. Privacidad y datos personales',
              texto: 'Los datos personales son tratados conforme a la Ley 25.326 de Protección de Datos Personales (Argentina). No vendemos ni cedemos datos a terceros. Los datos son utilizados exclusivamente para la prestación del servicio.',
            },
            {
              titulo: '7. Limitación de responsabilidad',
              texto: 'TodasMisCosas.com no se responsabiliza por daños, robos o pérdidas de objetos almacenados. Recomendamos contratar un seguro para objetos de valor. La plataforma tampoco es responsable por incumplimientos entre las partes.',
            },
            {
              titulo: '8. Jurisdicción',
              texto: 'Para cualquier controversia derivada del uso de la plataforma, las partes se someten a la jurisdicción de los Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires.',
            },
          ].map(s => (
            <section key={s.titulo} style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontFamily: 'Sora, sans-serif', fontWeight: 700,
                fontSize: '1rem', color: 'var(--text)',
                marginBottom: '.6rem',
              }}>
                {s.titulo}
              </h2>
              <p style={{ color: 'var(--text2)', fontSize: '.9rem', lineHeight: 1.75 }}>
                {s.texto}
              </p>
            </section>
          ))}

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r3)',
            padding: '1.25rem 1.5rem',
            marginTop: '2rem',
            fontSize: '.82rem',
            color: 'var(--text3)',
          }}>
            ¿Tenés dudas legales? Escribinos a{' '}
            <a href="mailto:legal@todasmiscosas.com" style={{ color: 'var(--orange)', textDecoration: 'none' }}>
              legal@todasmiscosas.com
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
