'use client';

import { SiteHeader } from '@/components/ui/SiteHeader';

export default function SobreNosotrosPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />

      <div style={{ flex: 1 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem 4rem' }}>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', marginBottom: '1.5rem', color: 'var(--text)' }}>
            Sobre Nosotros
          </h1>

          <div style={{ display: 'grid', gap: '1.25rem', color: 'var(--text2)', fontSize: '.95rem', lineHeight: 1.75 }}>
            <p>
              <strong style={{ color: 'var(--text)' }}>TodasMisCosas.com</strong> nació de un problema bien concreto: en las
              ciudades grandes sobra gente con espacio de guardado libre — una cochera vacía, un sótano, una habitación
              de más — y sobra gente que necesita guardar cosas por un tiempo y no quiere (ni le conviene) pagar un
              depósito tradicional. Conectar a esas dos puntas es la idea central de la plataforma.
            </p>
            <p>
              Funcionamos como un marketplace, estilo Airbnb pero para almacenamiento: cualquier persona puede publicar
              su espacio disponible — exclusivo o compartido — y cualquier persona o empresa puede reservarlo por el
              tiempo que necesite, con pago protegido y coordinación directa por chat.
            </p>
            <p>
              El dinero de cada reserva queda retenido como depósito en garantía hasta que el cliente confirma que
              accedió al espacio — recién ahí se libera al proveedor. Es nuestra forma de que ambas partes puedan
              confiar en una transacción entre desconocidos.
            </p>
            <p>
              Estamos en Buenos Aires, Argentina, arrancando — así que si tenés sugerencias, encontraste algo que no
              funciona bien, o simplemente querés contarnos tu experiencia, en la página de <a href="/contacto" style={{ color: 'var(--orange)', fontWeight: 600 }}>Contacto</a> te leemos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
