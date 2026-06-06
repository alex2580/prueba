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
            Última actualización: junio 2026
          </p>

          {/* 1 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>1. Objeto del servicio</h2>
            <p style={pStyle}>
              TodasMisCosas.com es una plataforma digital que conecta personas que necesitan almacenar objetos
              ("clientes") con personas o empresas que tienen espacios disponibles ("proveedors").
              TodasMisCosas.com actúa como intermediario y no es parte del contrato de locación de espacio.
            </p>
          </section>

          {/* 2 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>2. Obligaciones del proveedor</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Al publicar un espacio en la plataforma, el proveedor se compromete a:
            </p>
            <ul style={ulStyle}>
              <li>Describir el espacio con veracidad: dimensiones, condiciones de acceso y características de seguridad reales.</li>
              <li>Mantener las condiciones declaradas durante toda la vigencia del alquiler (impermeabilidad, iluminación, ventilación, acceso).</li>
              <li>Garantizar el acceso al cliente en los horarios pactados.</li>
              <li>No ceder ni subalquilar el espacio a un tercero distinto del cliente sin consentimiento de la plataforma.</li>
              <li>Informar de inmediato cualquier evento que afecte el espacio (inundación, robo, cierre del inmueble).</li>
              <li>Cumplir con la legislación vigente en materia de alquileres, impuestos y habilitaciones municipales.</li>
              <li>No permitir el ingreso de objetos prohibidos (ver sección 5).</li>
              <li>Conservar el espacio limpio y libre de plagas durante la locación.</li>
              <li>Renovar la publicación creando una nueva cuando venza el plazo de 90 días, si desea continuar ofreciendo el espacio (ver sección 11).</li>
            </ul>
          </section>

          {/* 3 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>3. Obligaciones del cliente</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Al reservar un espacio, el cliente se compromete a:
            </p>
            <ul style={ulStyle}>
              <li>Almacenar únicamente objetos lícitos, acordes a los permitidos en la sección 4 y en las condiciones acordadas con el proveedor.</li>
              <li>Respetar los horarios de acceso pactados.</li>
              <li>No subarrendar ni ceder el espacio a terceros sin autorización escrita.</li>
              <li>Retirar sus objetos en la fecha de vencimiento del contrato.</li>
              <li>No introducir objetos que superen la capacidad de peso o volumen del espacio.</li>
              <li>Informar al proveedor y a la plataforma si los objetos almacenados cambian de naturaleza (ej.: un objeto que inicialmente era inerte y pasa a requerir climatización).</li>
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
              En todos los casos el proveedor puede establecer restricciones adicionales según las características
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
                'Animales muertos',
                'Elementos de riesgo biológico',
                'Objetos robados o de procedencia ilícita',
                'Residuos peligrosos o patológicos',
                'Dinero en efectivo o valores negociables',
                'Obras de arte sin declaración de valor y seguro',
              ].map(o => <span key={o} style={tagStyle('#ef4444')}>{o}</span>)}
            </div>
            <p style={pStyle}>
              El incumplimiento de esta sección habilita al proveedor a dar por terminado el contrato de inmediato
              y a TodasMisCosas.com a suspender o eliminar la cuenta del cliente, sin perjuicio de las
              acciones legales que correspondan.
            </p>
          </section>

          {/* 6 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>6. Pagos y comisiones</h2>
            <p style={pStyle}>
              La publicación de espacios y la búsqueda de los mismos son servicios <strong>completamente gratuitos</strong> para todos los usuarios.
              Los pagos se procesan a través de MercadoPago. TodasMisCosas.com cobra una <strong>comisión del 15%</strong> exclusivamente sobre
              las transacciones completadas — no se cobra ningún importe por publicar un espacio ni por realizar una reserva.
              El monto de la comisión se desglosa claramente antes de confirmar la reserva.
              El pago queda retenido en custodia (escrow) hasta que el cliente confirme el acceso al espacio.
              El proveedor recibe el importe neto (precio acordado menos la comisión del 15%) dentro de las <strong>48 horas hábiles</strong> de
              la confirmación de acceso, siempre que tenga cargado su CBU o Alias bancario en el perfil de su cuenta.
              Ver sección 12 para el detalle completo del sistema escrow.
            </p>
          </section>

          {/* 7 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>7. Política de cancelación</h2>
            <p style={pStyle}>
              Las cancelaciones realizadas con más de 48 horas de anticipación al inicio del período reservado
              dan derecho a reembolso total. Las cancelaciones con menos de 48 horas pueden estar sujetas
              a una penalidad equivalente a un día de alquiler. Las cancelaciones realizadas por el proveedor
              sin causa justificada están sujetas a una penalidad que se acredita al cliente.
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

          {/* 11 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>11. Vigencia de las publicaciones</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Cada publicación de espacio tiene una vigencia de <strong>90 días corridos</strong> contados desde la fecha de publicación.
              Durante ese período, el espacio es visible para los clientes y puede recibir reservas.
            </p>
            <ul style={ulStyle}>
              <li><strong>Aviso previo:</strong> 30 días antes del vencimiento, la plataforma notifica al proveedor por correo electrónico para que pueda tomar acción.</li>
              <li><strong>Vencimiento automático:</strong> Al cumplirse los 90 días, la publicación se desactiva automáticamente y deja de ser visible para los clientes.</li>
              <li><strong>Renovación:</strong> Para continuar ofreciendo el espacio, el proveedor debe crear una nueva publicación. No existe renovación automática.</li>
              <li><strong>Reservas vigentes:</strong> Las reservas confirmadas al momento del vencimiento no se ven afectadas y continúan normalmente hasta su fecha de finalización.</li>
              <li><strong>Sin costo:</strong> Crear una nueva publicación tras el vencimiento es gratuito, igual que la publicación original.</li>
            </ul>
          </section>

          {/* 12 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>12. Sistema de protección escrow</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              TodasMisCosas.com utiliza un sistema de <strong>custodia de pago (escrow)</strong> para proteger tanto al cliente como al proveedor en cada transacción:
            </p>
            <ul style={ulStyle}>
              <li><strong>Retención del pago:</strong> Al completarse el pago por MercadoPago, el monto queda retenido por la plataforma. El proveedor <strong>no recibe el dinero en ese momento</strong>.</li>
              <li><strong>Confirmación de acceso:</strong> Una vez llegada la fecha de inicio de la reserva, el cliente debe confirmar desde su panel que efectivamente accedió al espacio.</li>
              <li><strong>Liberación del pago:</strong> Tras la confirmación, la plataforma transfiere el importe neto (precio total menos la comisión del 15%) al CBU o Alias bancario registrado por el proveedor en su perfil, dentro de las 48 horas hábiles.</li>
              <li><strong>Liberación automática:</strong> Si el cliente no confirma el acceso dentro de las 48 horas posteriores al inicio de la reserva, el sistema libera el pago automáticamente al proveedor.</li>
              <li><strong>Disputas:</strong> Si el cliente tiene inconvenientes para acceder al espacio, debe contactar a TodasMisCosas.com <strong>antes de confirmar el acceso</strong>, escribiendo a <a href="mailto:contacto@todasmiscosas.com" style={{ color: 'var(--orange)' }}>contacto@todasmiscosas.com</a>. Una vez confirmado el acceso, el pago es definitivo.</li>
              <li><strong>CBU / Alias requerido:</strong> Para recibir las transferencias, el proveedor debe tener su CBU o Alias bancario cargado en su perfil. TodasMisCosas.com no se responsabiliza por demoras causadas por datos bancarios incorrectos o faltantes.</li>
            </ul>
            <p style={{ ...pStyle, marginTop: '.75rem' }}>
              Este mecanismo no constituye intermediación financiera en los términos de la Ley 21.526, sino una mediación comercial destinada a garantizar el cumplimiento de las obligaciones de ambas partes antes de liberar los fondos.
            </p>
          </section>

          {/* 13 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>13. Espacios compartidos</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Los espacios del tipo <strong>"compartido"</strong> permiten que múltiples clientes almacenen sus objetos en el mismo espacio de forma simultánea. En este modelo aplican las siguientes reglas:
            </p>
            <ul style={ulStyle}>
              <li><strong>Disponibilidad múltiple:</strong> el calendario no bloquea fechas por reservas previas. El espacio puede recibir nuevas reservas aunque ya tenga clientes activos, siempre que el proveedor tenga el cupo habilitado.</li>
              <li><strong>Control de cupo:</strong> el proveedor puede activar o desactivar la disponibilidad para nuevas reservas en cualquier momento desde su panel, usando el botón <strong>🟢 Tengo Espacio</strong> (acepta nuevas reservas) / <strong>🔴 No tengo Espacio</strong> (cupo cerrado). Cuando el cupo está desactivado, la plataforma bloquea automáticamente la posibilidad de nuevas reservas para ese espacio.</li>
              <li><strong>Reservas vigentes:</strong> el cambio de estado del cupo no afecta las reservas ya confirmadas y pagadas. Estas continúan normalmente hasta su fecha de finalización.</li>
              <li><strong>Responsabilidad del proveedor:</strong> en espacios compartidos, el proveedor es responsable de asegurar que la capacidad real del espacio sea suficiente para todos los clientes simultáneos. Deberá cerrar el cupo cuando el espacio se encuentre al límite de su capacidad, antes de aceptar nuevas reservas.</li>
              <li><strong>Privacidad entre clientes:</strong> los datos de contacto de otros clientes que comparten el mismo espacio no son visibles entre sí en ningún momento.</li>
            </ul>
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
