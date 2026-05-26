'use client';

import { SiteHeader } from '@/components/ui/SiteHeader';

const sectionStyle = {
  marginBottom: '2rem',
};

const h2Style = {
  fontFamily: 'Sora, sans-serif',
  fontWeight: 700,
  fontSize: '1rem',
  color: 'var(--text)',
  marginBottom: '.6rem',
};

const pStyle = {
  color: 'var(--text2)',
  fontSize: '.9rem',
  lineHeight: 1.75,
};

const ulStyle = {
  color: 'var(--text2)',
  fontSize: '.9rem',
  lineHeight: 1.75,
  paddingLeft: '1.4rem',
  display: 'grid',
  gap: '.3rem',
} as React.CSSProperties;

const tagStyle = (color: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: 99,
  fontSize: '.75rem',
  fontWeight: 700,
  fontFamily: 'Sora, sans-serif',
  background: `${color}18`,
  color,
  border: `1px solid ${color}30`,
  marginRight: '.35rem',
  marginBottom: '.35rem',
});

export default function LegalesPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />

      <div className="page-scroll" style={{ flex: 1 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '.5rem' }}>
            📋 Términos y Condiciones
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: '.82rem', marginBottom: '2.5rem' }}>
            Última actualización: mayo 2026
          </p>

          {/* 1 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>1. Objeto del servicio</h2>
            <p style={pStyle}>
              TodasMisCosas.com es una plataforma digital que conecta personas que necesitan almacenar objetos
              ("demandantes") con personas o empresas que tienen espacios disponibles ("oferentes").
              TodasMisCosas.com actúa como intermediario y no es parte del contrato de locación de espacio.
            </p>
          </section>

          {/* 2 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>2. Obligaciones del oferente</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Al publicar un espacio en la plataforma, el oferente se compromete a:
            </p>
            <ul style={ulStyle}>
              <li>Describir el espacio con veracidad: dimensiones, condiciones de acceso y características de seguridad reales.</li>
              <li>Mantener las condiciones declaradas durante toda la vigencia del alquiler (impermeabilidad, iluminación, ventilación, acceso).</li>
              <li>Garantizar el acceso al demandante en los horarios pactados.</li>
              <li>No ceder ni subalquilar el espacio a un tercero distinto del demandante sin consentimiento de la plataforma.</li>
              <li>Informar de inmediato cualquier evento que afecte el espacio (inundación, robo, cierre del inmueble).</li>
              <li>Cumplir con la legislación vigente en materia de alquileres, impuestos y habilitaciones municipales.</li>
              <li>No permitir el ingreso de objetos prohibidos (ver sección 5).</li>
              <li>Conservar el espacio limpio y libre de plagas durante la locación.</li>
            </ul>
          </section>

          {/* 3 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>3. Obligaciones del demandante</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Al reservar un espacio, el demandante se compromete a:
            </p>
            <ul style={ulStyle}>
              <li>Almacenar únicamente objetos lícitos, acordes a los permitidos en la sección 4 y en las condiciones acordadas con el oferente.</li>
              <li>Respetar los horarios de acceso pactados.</li>
              <li>No subarrendar ni ceder el espacio a terceros sin autorización escrita.</li>
              <li>Retirar sus objetos en la fecha de vencimiento del contrato.</li>
              <li>No introducir objetos que superen la capacidad de peso o volumen del espacio.</li>
              <li>Informar al oferente y a la plataforma si los objetos almacenados cambian de naturaleza (ej.: un objeto que inicialmente era inerte y pasa a requerir climatización).</li>
              <li>Mantener el espacio en las condiciones en que lo recibió y asumir el costo de los daños causados por sus objetos.</li>
            </ul>
          </section>

          {/* 4 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>4. Objetos permitidos para almacenar</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Se pueden almacenar, entre otros:
            </p>
            <div style={{ marginBottom: '1rem' }}>
              {[
                'Muebles y electrodomésticos',
                'Ropa y calzado de temporada',
                'Libros, documentos y archivos',
                'Bicicletas y artículos deportivos',
                'Herramientas y materiales de construcción',
                'Stock e inventario de e-commerce',
                'Cajas y mudanzas',
                'Vehículos (en cocheras habilitadas)',
                'Equipos de oficina',
                'Decoración y objetos de temporada',
              ].map(o => <span key={o} style={tagStyle('#10b981')}>{o}</span>)}
            </div>
            <p style={pStyle}>
              En todos los casos el oferente puede establecer restricciones adicionales según las características
              de su espacio (peso máximo, tamaño, tipo de acceso).
            </p>
          </section>

          {/* 5 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>5. Objetos prohibidos</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Queda estrictamente prohibido almacenar los siguientes tipos de objetos:
            </p>
            <div style={{ marginBottom: '1rem' }}>
              {[
                'Sustancias ilegales o estupefacientes',
                'Armas de fuego y explosivos',
                'Materiales inflamables, corrosivos o radioactivos',
                'Alimentos perecederos sin refrigeración adecuada',
                'Animales vivos',
                'Objetos robados o de procedencia ilícita',
                'Residuos peligrosos o patológicos',
                'Dinero en efectivo o valores negociables',
                'Obras de arte sin declaración de valor y seguro',
              ].map(o => <span key={o} style={tagStyle('#ef4444')}>{o}</span>)}
            </div>
            <p style={pStyle}>
              El incumplimiento de esta sección habilita al oferente a dar por terminado el contrato de inmediato
              y a TodasMisCosas.com a suspender o eliminar la cuenta del demandante, sin perjuicio de las
              acciones legales que correspondan.
            </p>
          </section>

          {/* 6 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>6. Pagos y comisiones</h2>
            <p style={pStyle}>
              Los pagos se procesan a través de MercadoPago. TodasMisCosas.com cobra una comisión de servicio
              sobre cada transacción completada. El monto de la comisión se muestra claramente antes de confirmar
              la reserva. El oferente recibe el importe neto una vez confirmado el inicio del período de locación
              mediante el PIN de verificación.
            </p>
          </section>

          {/* 7 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>7. Política de cancelación</h2>
            <p style={pStyle}>
              Las cancelaciones realizadas con más de 48 horas de anticipación al inicio del período reservado
              dan derecho a reembolso total. Las cancelaciones con menos de 48 horas pueden estar sujetas
              a una penalidad equivalente a un día de alquiler. Las cancelaciones realizadas por el oferente
              sin causa justificada están sujetas a una penalidad que se acredita al demandante.
            </p>
          </section>

          {/* 8 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>8. Privacidad y datos personales</h2>
            <p style={pStyle}>
              Los datos personales son tratados conforme a la Ley 25.326 de Protección de Datos Personales
              (Argentina). No vendemos ni cedemos datos a terceros. Los datos son utilizados exclusivamente
              para la prestación del servicio y la resolución de disputas entre las partes.
            </p>
          </section>

          {/* 9 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>9. Limitación de responsabilidad</h2>
            <p style={pStyle}>
              TodasMisCosas.com actúa como intermediario y no es depositario de los objetos almacenados.
              No nos responsabilizamos por daños, robos o pérdidas de objetos almacenados. Recomendamos
              contratar un seguro para objetos de valor. La plataforma tampoco es responsable por
              incumplimientos entre las partes, ni por daños derivados de caso fortuito o fuerza mayor.
            </p>
          </section>

          {/* 10 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>10. Jurisdicción</h2>
            <p style={pStyle}>
              Para cualquier controversia derivada del uso de la plataforma, las partes se someten
              a la jurisdicción de los Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires,
              renunciando a cualquier otro fuero que pudiera corresponder.
            </p>
          </section>

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
