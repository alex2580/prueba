'use client';

import { useLocale } from 'next-intl';
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

function ContenidoES() {
  return (
    <>
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
              ("clientes") con personas o empresas que tienen espacios disponibles ("proveedores").
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
              El pago queda retenido en depósito en garantía hasta que el cliente confirme el acceso al espacio.
              El proveedor recibe el importe neto (precio acordado menos la comisión del 15%) dentro de las <strong>48 horas hábiles</strong> de
              la confirmación de acceso, siempre que tenga cargado su CBU o Alias bancario en el perfil de su cuenta.
              Ver sección 12 para el detalle completo del sistema de depósito en garantía.
            </p>
          </section>

          {/* 7 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>7. Política de cancelación</h2>
            <p style={pStyle}>
              Las cancelaciones realizadas con más de 48 horas de anticipación al inicio del período reservado
              dan derecho a reembolso total. Las cancelaciones con menos de 48 horas, así como las realizadas
              por el proveedor sin causa justificada, podrán estar sujetas a una penalidad —equivalente a un
              día de alquiler, acreditada a la parte afectada según corresponda— cuya aplicación y monto quedan
              a criterio exclusivo de TodasMisCosas.com, evaluando cada caso particular.
              Cuando corresponde reembolso total — incluyendo el derecho de arrepentimiento descripto en la
              sección 12 — el monto se devuelve de forma automática a través de MercadoPago, al mismo medio
              de pago utilizado por el cliente, sin necesidad de gestionarlo con soporte.
            </p>
          </section>

          {/* 8 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>8. Privacidad y datos personales</h2>
            <p style={pStyle}>
              Los datos personales son tratados conforme a la Ley 25.326 de Protección de Datos Personales
              (Argentina). No vendemos ni cedemos datos a terceros. Los datos son utilizados exclusivamente
              para la prestación del servicio y la resolución de disputas entre las partes.
              La plataforma mantiene un registro interno de auditoría de los cambios realizados al perfil de cada usuario
              (nombre, teléfono, email, dirección, CBU/Alias), accesible únicamente por el equipo de administración
              de TodasMisCosas.com con fines de seguridad y soporte.
            </p>
            <p style={pStyle}>
              <strong>Derecho al olvido / eliminación de cuenta:</strong> si querés ejercer tu derecho de acceso,
              rectificación o supresión de tus datos personales, o solicitar la eliminación definitiva de tu
              cuenta, escribinos desde la página de{' '}
              <a href="/contacto" style={{ color: 'var(--orange)' }}>Contacto</a>{' '}
              seleccionando el tipo <strong>"Consulta"</strong>, indicando tu nombre y el correo electrónico
              registrado en la plataforma. No se procesan estas solicitudes por otra vía.
            </p>
          </section>

          {/* 9 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>9. Limitación de responsabilidad</h2>
            <p style={pStyle}>
              TodasMisCosas.com actúa como intermediario y no es depositario de los objetos almacenados.
              No nos responsabilizamos por daños, robos o pérdidas de objetos almacenados. Recomendamos
              contratar un seguro para objetos de valor. TodasMisCosas.com no es una aseguradora: el
              servicio de seguro de contenido se gestiona a través de una aseguradora habilitada y
              actuamos únicamente como intermediarios entre el usuario y dicha aseguradora. El contrato
              de seguro, la cobertura y la resolución de cualquier siniestro son exclusivamente entre el
              usuario y la aseguradora. La plataforma tampoco es responsable por incumplimientos entre
              las partes, ni por daños derivados de caso fortuito o fuerza mayor.
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
              <li><strong>Aviso previo:</strong> 15 días antes del vencimiento, la plataforma notifica al proveedor por correo electrónico para que pueda tomar acción.</li>
              <li><strong>Vencimiento automático:</strong> Al cumplirse los 90 días, la publicación se desactiva automáticamente y deja de ser visible para los clientes.</li>
              <li><strong>Renovación:</strong> Para continuar ofreciendo el espacio, el proveedor debe crear una nueva publicación. No existe renovación automática.</li>
              <li><strong>Reservas vigentes:</strong> Las reservas confirmadas al momento del vencimiento no se ven afectadas y continúan normalmente hasta su fecha de finalización.</li>
              <li><strong>Sin costo:</strong> Crear una nueva publicación tras el vencimiento es gratuito, igual que la publicación original.</li>
            </ul>
          </section>

          {/* 12 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>12. Sistema de depósito en garantía</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              TodasMisCosas.com utiliza un sistema de <strong>depósito en garantía</strong> para proteger tanto al cliente como al proveedor en cada transacción:
            </p>
            <ul style={ulStyle}>
              <li><strong>Retención del pago:</strong> Al completarse el pago por MercadoPago, el monto queda retenido por la plataforma. El proveedor <strong>no recibe el dinero en ese momento</strong>.</li>
              <li><strong>Confirmación de acceso:</strong> Una vez llegada la fecha de inicio de la reserva, el cliente debe confirmar desde su panel que efectivamente accedió al espacio.</li>
              <li><strong>Liberación del pago:</strong> Tras la confirmación, la plataforma transfiere el importe neto (precio total menos la comisión del 15%) al CBU o Alias bancario registrado por el proveedor en su perfil, dentro de las 48 horas hábiles.</li>
              <li><strong>Cancelación por arrepentimiento:</strong> Si el cliente cancela la reserva antes de confirmar el acceso al espacio, la plataforma reembolsa automáticamente el 100% del monto pagado a través de MercadoPago, al mismo medio de pago utilizado, sin intervención manual.</li>
              <li>
                <strong>Liberación automática por vencimiento de plazo:</strong> Si el cliente no confirma el acceso ni presenta una disputa dentro de las <strong>48 horas corridas</strong> contadas desde la fecha y hora de inicio de la reserva, el sistema libera el pago automáticamente al proveedor, sin intervención manual. Una vez producida la liberación automática, el pago es <strong>definitivo e irrevocable</strong>: el cliente pierde el derecho a reclamar el reembolso por esta vía. La plataforma notifica al cliente por correo electrónico al inicio de la reserva recordándole el plazo disponible para confirmar el acceso o abrir una disputa.
              </li>
              <li><strong>Disputas:</strong> Si el cliente tiene inconvenientes para acceder al espacio, debe contactar a TodasMisCosas.com <strong>antes de confirmar el acceso y antes de que venza el plazo de 48 horas</strong>, escribiendo a <a href="mailto:contacto@todasmiscosas.com" style={{ color: 'var(--orange)' }}>contacto@todasmiscosas.com</a>. Los reclamos presentados después de la confirmación manual o de la liberación automática no serán considerados para reembolso.</li>
              <li><strong>CBU / Alias requerido:</strong> Para recibir las transferencias, el proveedor debe tener su CBU o Alias bancario cargado en su perfil. TodasMisCosas.com no se responsabiliza por demoras causadas por datos bancarios incorrectos o faltantes.</li>
            </ul>
            <p style={{ ...pStyle, marginTop: '.75rem' }}>
              Este mecanismo no constituye intermediación financiera en los términos de la Ley 21.526, sino una mediación comercial destinada a garantizar el cumplimiento de las obligaciones de ambas partes antes de liberar los fondos.
            </p>
            <div style={{
              background: 'rgba(245,158,11,.08)',
              border: '1.5px solid rgba(245,158,11,.35)',
              borderRadius: 'var(--r2)',
              padding: '.9rem 1.1rem',
              marginTop: '1rem',
              fontSize: '.85rem',
              color: 'var(--text2)',
              lineHeight: 1.65,
            }}>
              <strong style={{ color: '#d97706' }}>⚠️ Plazo de confirmación — importante para el cliente</strong>
              <p style={{ margin: '.4rem 0 0' }}>
                El cliente dispone de un plazo de <strong>48 horas corridas</strong> desde el inicio de la reserva para confirmar el acceso
                al espacio o para abrir una disputa. Transcurrido ese plazo sin acción del cliente, el sistema libera el pago al proveedor
                de forma automática y el cobro queda firme. Se recomienda confirmar el acceso o reportar inconvenientes de inmediato,
                sin esperar al vencimiento del plazo.
              </p>
            </div>
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

          {/* 14 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>14. Chat entre usuarios</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              La plataforma pone a disposición un canal de chat directo entre cliente y proveedor para coordinar el acceso al espacio:
            </p>
            <ul style={ulStyle}>
              <li><strong>Activación:</strong> el chat se habilita automáticamente cuando la reserva pasa al estado <strong>confirmada</strong> (pago procesado exitosamente).</li>
              <li><strong>Cierre:</strong> el chat se cierra de forma definitiva cuando el cliente confirma el acceso al espacio. Una vez liberado el depósito en garantía, la conversación queda archivada y no puede continuar.</li>
              <li><strong>Uso permitido:</strong> el chat está destinado exclusivamente a la coordinación logística de la reserva (horarios, acceso, instrucciones). Queda prohibido su uso para acordar pagos fuera de la plataforma, compartir datos de contacto con fines comerciales ajenos al servicio, o cualquier comunicación que infrinja la normativa vigente.</li>
              <li><strong>Moderación:</strong> TodasMisCosas.com se reserva el derecho de revisar las conversaciones ante una denuncia de mal uso, conforme a la Ley 25.326.</li>
            </ul>
          </section>

          {/* 15 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>15. Consultas públicas</h2>
            <p style={pStyle}>
              Cualquier usuario registrado puede realizar preguntas sobre una publicación antes de efectuar una reserva.
              Las preguntas y las respuestas del proveedor son <strong>visibles para todos los visitantes</strong> de la publicación.
              El proveedor no está obligado a responder, pero se recomienda hacerlo para generar confianza.
              TodasMisCosas.com no es responsable del contenido de las preguntas ni de las respuestas,
              aunque se reserva el derecho de eliminar publicaciones que infrinjan sus políticas de uso aceptable.
            </p>
          </section>

          {/* 16 */}
          <section style={sectionStyle} id="disputas">
            <h2 style={h2Style}>16. Proceso formal de disputas</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              TodasMisCosas.com pone a disposición un proceso formal para que cualquiera de las partes
              (cliente o proveedor) pueda presentar un reclamo relacionado con una reserva, un pago
              o el uso de la plataforma.
            </p>

            <p style={{ ...pStyle, fontWeight: 700, marginBottom: '.4rem' }}>Paso 1 — Contacto inicial</p>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Enviá un correo a{' '}
              <a href="mailto:contacto@todasmiscosas.com" style={{ color: 'var(--orange)' }}>
                contacto@todasmiscosas.com
              </a>{' '}
              con el asunto <strong>"Disputa — [ID de reserva]"</strong> e incluí la siguiente información:
            </p>
            <ul style={ulStyle}>
              <li>Nombre completo y correo electrónico registrado en la plataforma.</li>
              <li>ID de la reserva involucrada.</li>
              <li>Descripción clara y detallada del inconveniente.</li>
              <li>Evidencia de respaldo: capturas de pantalla, fotos, conversaciones u otro material relevante.</li>
            </ul>

            <p style={{ ...pStyle, fontWeight: 700, margin: '.9rem 0 .4rem' }}>Paso 2 — Revisión</p>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              El equipo de TodasMisCosas.com revisará el reclamo y responderá al correo del solicitante
              dentro de las <strong>48 horas hábiles</strong> contadas desde la recepción del mensaje.
              Durante ese período podremos solicitar información adicional a cualquiera de las partes.
            </p>

            <p style={{ ...pStyle, fontWeight: 700, marginBottom: '.4rem' }}>Paso 3 — Resolución</p>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              TodasMisCosas.com comunicará su decisión por correo a ambas partes. La resolución podrá incluir,
              según corresponda: liberación o retención del depósito en garantía, reembolso total o parcial,
              o cualquier otra medida dentro del alcance de la plataforma. La decisión de TodasMisCosas.com
              es definitiva en el ámbito de la plataforma, sin perjuicio de las acciones legales que cada
              parte pueda ejercer por vía judicial.
            </p>

            <ul style={ulStyle}>
              <li><strong>Plazo para disputar:</strong> el reclamo debe presentarse <strong>antes de que se libere el depósito en garantía</strong> — ya sea por confirmación manual del cliente o por vencimiento automático del plazo de 48 horas (ver sección 12). No se aceptarán disputas sobre pagos ya liberados.</li>
              <li><strong>Buena fe:</strong> ambas partes se comprometen a actuar de buena fe durante el proceso, aportando información veraz y completa.</li>
              <li><strong>Sin costo:</strong> el proceso de disputa es gratuito para los usuarios de la plataforma.</li>
            </ul>

            <div style={{
              background: 'rgba(16,185,129,.07)',
              border: '1.5px solid rgba(16,185,129,.3)',
              borderRadius: 'var(--r2)',
              padding: '.85rem 1.1rem',
              marginTop: '1rem',
              fontSize: '.85rem',
              color: 'var(--text2)',
              lineHeight: 1.65,
            }}>
              <strong style={{ color: '#10b981' }}>📩 Canal de disputas</strong>
              <p style={{ margin: '.4rem 0 0' }}>
                <a href="mailto:contacto@todasmiscosas.com" style={{ color: 'var(--orange)', fontWeight: 700 }}>
                  contacto@todasmiscosas.com
                </a>
                {' '}· Asunto: <strong>"Disputa — [ID de reserva]"</strong> · Respuesta en <strong>48 horas hábiles</strong>
              </p>
            </div>
          </section>

          {/* 17 */}
          <section style={sectionStyle} id="danos">
            <h2 style={h2Style}>17. Daños al espacio causados por el cliente</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              El cliente es responsable de devolver el espacio en las mismas condiciones en que lo recibió.
              Cualquier daño material ocasionado durante la vigencia de la reserva — incluyendo pero no limitado a:
              roturas, rayones o manchas en paredes, pisos o techos; daños en cerraduras, llaves o mecanismos de acceso;
              deterioro de instalaciones eléctricas, sanitarias o de gas; y cualquier otro menoscabo al espacio o a
              las instalaciones del inmueble — es responsabilidad exclusiva del cliente.
            </p>

            <p style={{ ...pStyle, fontWeight: 700, marginBottom: '.4rem' }}>Primera instancia — resolución directa entre las partes</p>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Ante la detección de un daño, el proveedor debe comunicárselo al cliente de forma directa e inmediata,
              idealmente a través del chat de la reserva (si aún está activo) o por cualquier otro medio acordado.
              Las partes tienen la posibilidad y se las alienta a llegar a un acuerdo económico directo
              sin intervención de la plataforma. TodasMisCosas.com <strong>no es responsable</strong> de los
              daños producidos ni actúa como garante del cobro de los mismos.
            </p>

            <p style={{ ...pStyle, fontWeight: 700, marginBottom: '.4rem' }}>Segunda instancia — disputa formal ante la plataforma</p>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Si las partes no logran un acuerdo directo, el proveedor puede iniciar el proceso formal de disputa
              descripto en la <strong>sección 16</strong>, enviando un correo a{' '}
              <a href="mailto:contacto@todasmiscosas.com" style={{ color: 'var(--orange)' }}>contacto@todasmiscosas.com</a>{' '}
              con el asunto <strong>"Disputa — Daños — [ID de reserva]"</strong>. En ese caso deberá aportar
              documentación del estado previo y posterior del espacio (fotos, videos u otro respaldo).
              TodasMisCosas.com evaluará la evidencia presentada y, de corresponder, actuará como
              mediador entre las partes dentro del alcance de la plataforma.
            </p>

            <ul style={ulStyle}>
              <li><strong>Documentación recomendada:</strong> se recomienda al proveedor registrar fotográficamente el estado del espacio antes y después de cada reserva como medida de respaldo ante posibles reclamos.</li>
              <li><strong>Límite de intervención:</strong> TodasMisCosas.com no tiene capacidad de ejecutar cobros compulsivos ni interviene en disputas judiciales entre las partes. La plataforma actúa únicamente como mediador dentro de su ámbito de servicio.</li>
              <li><strong>Vía judicial:</strong> sin perjuicio de lo anterior, cualquiera de las partes puede ejercer las acciones legales que correspondan ante los Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires, conforme a la sección 10.</li>
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
            <a href="mailto:contacto@todasmiscosas.com" style={{ color: 'var(--orange)', textDecoration: 'none' }}>
              contacto@todasmiscosas.com
            </a>
          </div>

          {/* ── DIVISOR ── */}
          <div style={{ borderTop: '2px solid var(--border)', margin: '3.5rem 0' }} />

          {/* ── POLÍTICA DE PRIVACIDAD ── */}
          <h1 id="politica-privacidad" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '.35rem' }}>
            🔒 Política de Privacidad
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: '.82rem', marginBottom: '.4rem' }}>
            Conforme a la Ley 25.326 de Protección de Datos Personales — República Argentina
          </p>
          <p style={{ color: 'var(--text3)', fontSize: '.82rem', marginBottom: '2.5rem' }}>
            Última actualización: junio 2026
          </p>

          {/* I */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>I. Responsable del tratamiento</h2>
            <p style={pStyle}>
              TodasMisCosas.com es responsable del tratamiento de los datos personales de sus usuarios.
              Para consultas relacionadas con privacidad y protección de datos, podés escribirnos a{' '}
              <a href="mailto:contacto@todasmiscosas.com" style={{ color: 'var(--orange)' }}>contacto@todasmiscosas.com</a>.
            </p>
          </section>

          {/* II */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>II. Datos personales que recopilamos</h2>
            <ul style={ulStyle}>
              <li><strong>Datos de registro:</strong> nombre completo, dirección de correo electrónico, número de teléfono y contraseña (almacenada en formato hash irreversible).</li>
              <li><strong>Datos de perfil:</strong> CBU o Alias bancario (únicamente proveedores, para recibir pagos por sus reservas).</li>
              <li><strong>Datos de publicación:</strong> dirección del espacio, descripción, fotografías y precios cargados por el proveedor.</li>
              <li><strong>Datos de transacción:</strong> historial de reservas, montos y estados de pago procesados a través de MercadoPago.</li>
              <li><strong>Datos de comunicación:</strong> mensajes intercambiados a través del chat de la plataforma y consultas públicas realizadas en publicaciones.</li>
              <li><strong>Datos técnicos:</strong> dirección IP, tipo de dispositivo y registros de acceso al servicio, utilizados exclusivamente con fines de seguridad y soporte.</li>
            </ul>
          </section>

          {/* III */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>III. Finalidad del tratamiento</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>Los datos personales son tratados exclusivamente para las siguientes finalidades:</p>
            <ul style={ulStyle}>
              <li>Prestar y mejorar el servicio de marketplace de almacenamiento.</li>
              <li>Procesar pagos y gestionar el sistema de depósito en garantía.</li>
              <li>Enviar notificaciones transaccionales: confirmación de reserva, PIN de acceso, avisos de vencimiento de publicación.</li>
              <li>Resolver disputas entre las partes de una reserva.</li>
              <li>Garantizar la seguridad de la plataforma y prevenir el fraude.</li>
              <li>Cumplir con las obligaciones legales vigentes en la República Argentina.</li>
            </ul>
          </section>

          {/* IV */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>IV. Base legal del tratamiento</h2>
            <p style={pStyle}>
              El tratamiento de datos se realiza con el <strong>consentimiento del titular</strong>, prestado al momento del registro en la plataforma,
              conforme al artículo 5° de la Ley 25.326. El retiro del consentimiento podrá ejercerse en cualquier momento a través de los canales
              indicados en la sección VI (Derechos ARCO).
            </p>
          </section>

          {/* V */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>V. Conservación de los datos</h2>
            <p style={pStyle}>
              Los datos personales se conservan durante la vigencia de la cuenta y por un plazo adicional de <strong>5 (cinco) años</strong> tras
              la baja de la cuenta, a efectos de cumplimiento legal y resolución de eventuales disputas. Los datos de transacción
              podrán conservarse por el plazo que exija la normativa fiscal y contable aplicable.
            </p>
          </section>

          {/* VI */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>VI. Derechos ARCO</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Conforme a los artículos 14 a 16 de la Ley 25.326, el titular de los datos tiene derecho a:
            </p>
            <ul style={ulStyle}>
              <li>
                <strong>Acceso (A):</strong> solicitar información sobre qué datos personales propios son tratados por la plataforma,
                su origen, finalidad y los destinatarios de cualquier cesión realizada o prevista.
              </li>
              <li>
                <strong>Rectificación (R):</strong> requerir la corrección de datos inexactos, incompletos, desactualizados o que induzcan a error.
              </li>
              <li>
                <strong>Cancelación (C):</strong> solicitar la supresión o bloqueo de datos cuyo tratamiento no resulte ajustado a lo dispuesto en la Ley 25.326.
              </li>
              <li>
                <strong>Oposición (O):</strong> oponerse, por motivos legítimos, al tratamiento de los propios datos en los supuestos en que la ley lo permita.
              </li>
            </ul>
            <p style={{ ...pStyle, margin: '.9rem 0 .75rem' }}>
              Para ejercer cualquiera de estos derechos, el titular debe enviar una solicitud escrita a{' '}
              <a href="mailto:contacto@todasmiscosas.com" style={{ color: 'var(--orange)' }}>contacto@todasmiscosas.com</a>{' '}
              indicando: nombre completo, número de documento (DNI) y descripción clara del derecho que desea ejercer.
            </p>
            <ul style={ulStyle}>
              <li>Solicitudes de <strong>acceso:</strong> respuesta en un plazo máximo de <strong>10 días hábiles</strong>.</li>
              <li>Solicitudes de <strong>rectificación, cancelación u oposición:</strong> respuesta en un plazo máximo de <strong>5 días hábiles</strong>.</li>
            </ul>
            <div style={{
              background: 'rgba(99,102,241,.07)',
              border: '1px solid rgba(99,102,241,.25)',
              borderRadius: 'var(--r2)',
              padding: '.85rem 1.1rem',
              marginTop: '.9rem',
              fontSize: '.83rem',
              color: 'var(--text2)',
              lineHeight: 1.65,
            }}>
              <strong>Organismo de control:</strong> la <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>, Órgano de Control
              de la Ley N° 25.326, tiene la atribución de atender denuncias y reclamos por incumplimiento de la normativa de protección de datos personales.
              Sitio web:{' '}
              <a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange)' }}>
                www.argentina.gob.ar/aaip
              </a>
            </div>
          </section>

          {/* VII */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>VII. Transferencia y compartición de datos</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              TodasMisCosas.com <strong>no vende ni cede datos personales a terceros</strong> con fines comerciales.
              Los datos pueden ser compartidos únicamente en los siguientes casos:
            </p>
            <ul style={ulStyle}>
              <li>
                <strong>Proveedores de servicio tecnológico:</strong> MercadoPago (procesamiento de pagos),
                Supabase (autenticación y almacenamiento de imágenes) y Resend (envío de correos electrónicos).
                Todos actúan como encargados del tratamiento bajo acuerdos de confidencialidad y no están autorizados
                a utilizar los datos con fines distintos a los estrictamente necesarios para prestar el servicio.
              </li>
              <li>
                <strong>Autoridades competentes:</strong> cuando sea requerido por ley, orden judicial o autoridad gubernamental competente.
              </li>
            </ul>
            <p style={{ ...pStyle, marginTop: '.75rem' }}>
              No se realizan transferencias internacionales de datos personales fuera del marco de los proveedores mencionados precedentemente.
            </p>
          </section>

          {/* VIII */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>VIII. Medidas de seguridad</h2>
            <p style={pStyle}>
              Implementamos medidas técnicas y organizativas orientadas a proteger los datos personales contra acceso no autorizado,
              pérdida, alteración o divulgación. Entre ellas: almacenamiento de contraseñas en formato hash irreversible,
              conexiones cifradas mediante HTTPS/TLS, acceso restringido a bases de datos por rol, y registros internos
              de auditoría sobre cambios en los perfiles de usuario. En caso de producirse un incidente de seguridad que afecte
              datos personales, notificaremos a los usuarios perjudicados y a la AAIP en los plazos y formas que establezca la normativa vigente.
            </p>
          </section>

          {/* IX */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>IX. Cookies</h2>
            <p style={pStyle}>
              La plataforma utiliza cookies técnicas estrictamente necesarias para el funcionamiento del servicio,
              incluyendo la gestión de sesión de usuario y las preferencias de idioma. No se utilizan cookies
              de seguimiento publicitario ni se comparte información de navegación con redes de publicidad.
              Al continuar navegando en la plataforma, el usuario acepta el uso de cookies técnicas esenciales.
            </p>
          </section>

          {/* X */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>X. Modificaciones a esta política</h2>
            <p style={pStyle}>
              Esta política podrá ser actualizada para reflejar cambios en la normativa vigente o en las funcionalidades
              del servicio. Las modificaciones sustanciales serán notificadas por correo electrónico a los usuarios registrados
              y publicadas en esta página con al menos <strong>15 días de anticipación</strong> a su entrada en vigencia.
              El uso continuado de la plataforma tras esa fecha implicará la aceptación de la política actualizada.
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
            ¿Querés ejercer tus derechos ARCO o tenés consultas sobre privacidad? Escribinos a{' '}
            <a href="mailto:contacto@todasmiscosas.com" style={{ color: 'var(--orange)', textDecoration: 'none' }}>
              contacto@todasmiscosas.com
            </a>
          </div>
    </>
  );
}

function ContenidoPT() {
  return (
    <>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '.5rem' }}>
            📋 Termos e Condições
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: '.82rem', marginBottom: '2.5rem' }}>
            Última atualização: junho de 2026
          </p>

          {/* 1 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>1. Objeto do serviço</h2>
            <p style={pStyle}>
              TodasMisCosas.com é uma plataforma digital que conecta pessoas que precisam guardar objetos
              ("clientes") com pessoas ou empresas que têm espaços disponíveis ("anunciantes").
              TodasMisCosas.com atua como intermediário e não é parte do contrato de locação do espaço.
            </p>
          </section>

          {/* 2 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>2. Obrigações do anunciante</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Ao publicar um espaço na plataforma, o anunciante se compromete a:
            </p>
            <ul style={ulStyle}>
              <li>Descrever o espaço com veracidade: dimensões, condições de acesso e características de segurança reais.</li>
              <li>Manter as condições declaradas durante toda a vigência do aluguel (impermeabilidade, iluminação, ventilação, acesso).</li>
              <li>Garantir o acesso ao cliente nos horários acordados.</li>
              <li>Não cessar nem subalugar o espaço a um terceiro distinto do cliente sem o consentimento da plataforma.</li>
              <li>Informar imediatamente qualquer evento que afete o espaço (inundação, roubo, fechamento do imóvel).</li>
              <li>Cumprir a legislação vigente em matéria de aluguéis, impostos e licenças municipais.</li>
              <li>Não permitir a entrada de objetos proibidos (ver seção 5).</li>
              <li>Manter o espaço limpo e livre de pragas durante a locação.</li>
              <li>Renovar a publicação criando uma nova quando vencer o prazo de 90 dias, caso queira continuar oferecendo o espaço (ver seção 11).</li>
            </ul>
          </section>

          {/* 3 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>3. Obrigações do cliente</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Ao reservar um espaço, o cliente se compromete a:
            </p>
            <ul style={ulStyle}>
              <li>Guardar apenas objetos lícitos, de acordo com o permitido na seção 4 e nas condições acordadas com o anunciante.</li>
              <li>Respeitar os horários de acesso acordados.</li>
              <li>Não subalugar nem cessar o espaço a terceiros sem autorização por escrito.</li>
              <li>Retirar seus objetos na data de vencimento do contrato.</li>
              <li>Não introduzir objetos que superem a capacidade de peso ou volume do espaço.</li>
              <li>Informar ao anunciante e à plataforma se os objetos guardados mudarem de natureza (ex.: um objeto inicialmente inerte que passa a exigir climatização).</li>
              <li>Manter o espaço nas condições em que o recebeu e assumir o custo dos danos causados por seus objetos.</li>
            </ul>
          </section>

          {/* 4 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>4. Objetos permitidos para guardar</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Podem ser guardados, entre outros:
            </p>
            <div style={{ marginBottom: '1rem' }}>
              {[
                'Móveis e eletrodomésticos',
                'Roupas e calçados de temporada',
                'Livros, documentos e arquivos',
                'Bicicletas e artigos esportivos',
                'Ferramentas e materiais de construção',
                'Estoque e inventário de e-commerce',
                'Caixas e mudanças',
                'Veículos (em garagens habilitadas)',
                'Equipamentos de escritório',
                'Decoração e objetos de temporada',
              ].map(o => <span key={o} style={tagStyle('#10b981')}>{o}</span>)}
            </div>
            <p style={pStyle}>
              Em todos os casos o anunciante pode estabelecer restrições adicionais de acordo com as características
              do seu espaço (peso máximo, tamanho, tipo de acesso).
            </p>
          </section>

          {/* 5 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>5. Objetos proibidos</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              É estritamente proibido guardar os seguintes tipos de objetos:
            </p>
            <div style={{ marginBottom: '1rem' }}>
              {[
                'Substâncias ilegais ou entorpecentes',
                'Armas de fogo e explosivos',
                'Materiais inflamáveis, corrosivos ou radioativos',
                'Alimentos perecíveis sem refrigeração adequada',
                'Animais vivos',
                'Animais mortos',
                'Elementos de risco biológico',
                'Objetos roubados ou de procedência ilícita',
                'Resíduos perigosos ou patológicos',
                'Dinheiro em espécie ou valores negociáveis',
                'Obras de arte sem declaração de valor e seguro',
              ].map(o => <span key={o} style={tagStyle('#ef4444')}>{o}</span>)}
            </div>
            <p style={pStyle}>
              O descumprimento desta seção habilita o anunciante a encerrar o contrato imediatamente
              e a TodasMisCosas.com a suspender ou eliminar a conta do cliente, sem prejuízo das
              ações legais que correspondam.
            </p>
          </section>

          {/* 6 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>6. Pagamentos e comissões</h2>
            <p style={pStyle}>
              A publicação de espaços e a busca pelos mesmos são serviços <strong>completamente gratuitos</strong> para todos os usuários.
              Os pagamentos são processados via MercadoPago. TodasMisCosas.com cobra uma <strong>comissão de 15%</strong> exclusivamente sobre
              as transações concluídas — não é cobrado nenhum valor por publicar um espaço nem por fazer uma reserva.
              O valor da comissão é detalhado claramente antes de confirmar a reserva.
              O pagamento fica retido em depósito de garantia até que o cliente confirme o acesso ao espaço.
              O anunciante recebe o valor líquido (preço acordado menos a comissão de 15%) dentro de <strong>48 horas úteis</strong> da
              confirmação de acesso, desde que tenha cadastrado seus dados bancários no perfil da sua conta.
              Ver seção 12 para o detalhe completo do sistema de depósito de garantia.
            </p>
          </section>

          {/* 7 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>7. Política de cancelamento</h2>
            <p style={pStyle}>
              Cancelamentos feitos com mais de 48 horas de antecedência ao início do período reservado
              dão direito a reembolso total. Cancelamentos com menos de 48 horas, assim como os feitos
              pelo anunciante sem causa justificada, poderão estar sujeitos a uma penalidade —equivalente a um
              dia de aluguel, creditada à parte afetada conforme corresponda— cuja aplicação e valor ficam
              a critério exclusivo da TodasMisCosas.com, avaliando cada caso particular.
              Quando corresponde reembolso total — incluindo o direito de arrependimento descrito na
              seção 12 — o valor é devolvido automaticamente via MercadoPago, ao mesmo meio
              de pagamento utilizado pelo cliente, sem necessidade de contato com o suporte.
            </p>
          </section>

          {/* 8 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>8. Privacidade e dados pessoais</h2>
            <p style={pStyle}>
              Os dados pessoais são tratados conforme a Lei 25.326 de Proteção de Dados Pessoais
              (Argentina). Não vendemos nem cedemos dados a terceiros. Os dados são utilizados exclusivamente
              para a prestação do serviço e a resolução de disputas entre as partes.
              A plataforma mantém um registro interno de auditoria das alterações feitas no perfil de cada usuário
              (nome, telefone, e-mail, endereço, dados bancários), acessível apenas pela equipe de administração
              da TodasMisCosas.com para fins de segurança e suporte.
            </p>
            <p style={pStyle}>
              <strong>Direito ao esquecimento / exclusão de conta:</strong> se você quiser exercer seu direito de acesso,
              retificação ou supressão dos seus dados pessoais, ou solicitar a exclusão definitiva da sua
              conta, escreva para nós pela página de{' '}
              <a href="/contacto" style={{ color: 'var(--orange)' }}>Contato</a>{' '}
              selecionando o tipo <strong>"Consulta"</strong>, indicando seu nome e o e-mail
              cadastrado na plataforma. Essas solicitações não são processadas por outra via.
            </p>
          </section>

          {/* 9 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>9. Limitação de responsabilidade</h2>
            <p style={pStyle}>
              TodasMisCosas.com atua como intermediário e não é depositário dos objetos guardados.
              Não nos responsabilizamos por danos, roubos ou perdas de objetos guardados. Recomendamos
              contratar um seguro para objetos de valor. TodasMisCosas.com não é uma seguradora: o
              serviço de seguro de conteúdo é gerenciado por uma seguradora habilitada e
              atuamos unicamente como intermediários entre o usuário e essa seguradora. O contrato
              de seguro, a cobertura e a resolução de qualquer sinistro são exclusivamente entre o
              usuário e a seguradora. A plataforma também não é responsável por descumprimentos entre
              as partes, nem por danos derivados de caso fortuito ou força maior.
            </p>
          </section>

          {/* 10 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>10. Jurisdição</h2>
            <p style={pStyle}>
              Para qualquer controvérsia derivada do uso da plataforma, as partes se submetem
              à jurisdição dos Tribunais Ordinários da Cidade Autônoma de Buenos Aires,
              renunciando a qualquer outro foro que possa corresponder.
            </p>
          </section>

          {/* 11 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>11. Vigência das publicações</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Cada publicação de espaço tem vigência de <strong>90 dias corridos</strong> contados a partir da data de publicação.
              Durante esse período, o espaço fica visível para os clientes e pode receber reservas.
            </p>
            <ul style={ulStyle}>
              <li><strong>Aviso prévio:</strong> 15 dias antes do vencimento, a plataforma notifica o anunciante por e-mail para que possa tomar uma ação.</li>
              <li><strong>Vencimento automático:</strong> ao completar 90 dias, a publicação se desativa automaticamente e deixa de ficar visível para os clientes.</li>
              <li><strong>Renovação:</strong> para continuar oferecendo o espaço, o anunciante deve criar uma nova publicação. Não existe renovação automática.</li>
              <li><strong>Reservas vigentes:</strong> as reservas confirmadas no momento do vencimento não são afetadas e continuam normalmente até sua data de finalização.</li>
              <li><strong>Sem custo:</strong> criar uma nova publicação após o vencimento é gratuito, assim como a publicação original.</li>
            </ul>
          </section>

          {/* 12 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>12. Sistema de depósito de garantia</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              TodasMisCosas.com utiliza um sistema de <strong>depósito de garantia</strong> para proteger tanto o cliente quanto o anunciante em cada transação:
            </p>
            <ul style={ulStyle}>
              <li><strong>Retenção do pagamento:</strong> ao concluir o pagamento pelo MercadoPago, o valor fica retido pela plataforma. O anunciante <strong>não recebe o dinheiro nesse momento</strong>.</li>
              <li><strong>Confirmação de acesso:</strong> chegada a data de início da reserva, o cliente deve confirmar pelo seu painel que efetivamente acessou o espaço.</li>
              <li><strong>Liberação do pagamento:</strong> após a confirmação, a plataforma transfere o valor líquido (preço total menos a comissão de 15%) para os dados bancários cadastrados pelo anunciante no seu perfil, dentro de 48 horas úteis.</li>
              <li><strong>Cancelamento por arrependimento:</strong> se o cliente cancelar a reserva antes de confirmar o acesso ao espaço, a plataforma reembolsa automaticamente 100% do valor pago via MercadoPago, ao mesmo meio de pagamento utilizado, sem intervenção manual.</li>
              <li>
                <strong>Liberação automática por vencimento do prazo:</strong> se o cliente não confirmar o acesso nem abrir uma disputa dentro de <strong>48 horas corridas</strong> contadas a partir da data e hora de início da reserva, o sistema libera o pagamento automaticamente ao anunciante, sem intervenção manual. Uma vez ocorrida a liberação automática, o pagamento é <strong>definitivo e irrevogável</strong>: o cliente perde o direito de reclamar o reembolso por essa via. A plataforma notifica o cliente por e-mail no início da reserva, lembrando o prazo disponível para confirmar o acesso ou abrir uma disputa.
              </li>
              <li><strong>Disputas:</strong> se o cliente tiver problemas para acessar o espaço, deve contatar a TodasMisCosas.com <strong>antes de confirmar o acesso e antes de vencer o prazo de 48 horas</strong>, escrevendo para{' '}<a href="mailto:contacto@todasmiscosas.com" style={{ color: 'var(--orange)' }}>contacto@todasmiscosas.com</a>. Reclamações apresentadas após a confirmação manual ou a liberação automática não serão consideradas para reembolso.</li>
              <li><strong>Dados bancários obrigatórios:</strong> para receber as transferências, o anunciante deve ter seus dados bancários cadastrados no perfil. TodasMisCosas.com não se responsabiliza por atrasos causados por dados bancários incorretos ou ausentes.</li>
            </ul>
            <p style={{ ...pStyle, marginTop: '.75rem' }}>
              Este mecanismo não constitui intermediação financeira nos termos da Lei 21.526, mas sim uma mediação comercial destinada a garantir o cumprimento das obrigações de ambas as partes antes de liberar os fundos.
            </p>
            <div style={{
              background: 'rgba(245,158,11,.08)',
              border: '1.5px solid rgba(245,158,11,.35)',
              borderRadius: 'var(--r2)',
              padding: '.9rem 1.1rem',
              marginTop: '1rem',
              fontSize: '.85rem',
              color: 'var(--text2)',
              lineHeight: 1.65,
            }}>
              <strong style={{ color: '#d97706' }}>⚠️ Prazo de confirmação — importante para o cliente</strong>
              <p style={{ margin: '.4rem 0 0' }}>
                O cliente tem um prazo de <strong>48 horas corridas</strong> a partir do início da reserva para confirmar o acesso
                ao espaço ou para abrir uma disputa. Passado esse prazo sem ação do cliente, o sistema libera o pagamento ao anunciante
                automaticamente e a cobrança fica firme. Recomendamos confirmar o acesso ou relatar problemas imediatamente,
                sem esperar o vencimento do prazo.
              </p>
            </div>
          </section>

          {/* 13 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>13. Espaços compartilhados</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Os espaços do tipo <strong>"compartilhado"</strong> permitem que vários clientes guardem seus objetos no mesmo espaço de forma simultânea. Nesse modelo se aplicam as seguintes regras:
            </p>
            <ul style={ulStyle}>
              <li><strong>Disponibilidade múltipla:</strong> o calendário não bloqueia datas por reservas anteriores. O espaço pode receber novas reservas mesmo já tendo clientes ativos, desde que o anunciante tenha a vaga habilitada.</li>
              <li><strong>Controle de vagas:</strong> o anunciante pode ativar ou desativar a disponibilidade para novas reservas em qualquer momento pelo seu painel, usando o botão <strong>🟢 Tenho Espaço</strong> (aceita novas reservas) / <strong>🔴 Não tenho Espaço</strong> (vaga fechada). Quando a vaga está desativada, a plataforma bloqueia automaticamente a possibilidade de novas reservas para esse espaço.</li>
              <li><strong>Reservas vigentes:</strong> a mudança de status da vaga não afeta as reservas já confirmadas e pagas. Estas continuam normalmente até sua data de finalização.</li>
              <li><strong>Responsabilidade do anunciante:</strong> em espaços compartilhados, o anunciante é responsável por garantir que a capacidade real do espaço seja suficiente para todos os clientes simultâneos. Deverá fechar a vaga quando o espaço estiver no limite da sua capacidade, antes de aceitar novas reservas.</li>
              <li><strong>Privacidade entre clientes:</strong> os dados de contato de outros clientes que compartilham o mesmo espaço não são visíveis entre si em nenhum momento.</li>
            </ul>
          </section>

          {/* 14 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>14. Chat entre usuários</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              A plataforma disponibiliza um canal de chat direto entre cliente e anunciante para coordenar o acesso ao espaço:
            </p>
            <ul style={ulStyle}>
              <li><strong>Ativação:</strong> o chat é habilitado automaticamente quando a reserva passa para o status <strong>confirmada</strong> (pagamento processado com sucesso).</li>
              <li><strong>Encerramento:</strong> o chat se encerra definitivamente quando o cliente confirma o acesso ao espaço. Uma vez liberado o depósito de garantia, a conversa fica arquivada e não pode continuar.</li>
              <li><strong>Uso permitido:</strong> o chat é destinado exclusivamente à coordenação logística da reserva (horários, acesso, instruções). É proibido seu uso para acordar pagamentos fora da plataforma, compartilhar dados de contato com fins comerciais alheios ao serviço, ou qualquer comunicação que infrinja a normativa vigente.</li>
              <li><strong>Moderação:</strong> TodasMisCosas.com se reserva o direito de revisar as conversas perante uma denúncia de mau uso, conforme a Lei 25.326.</li>
            </ul>
          </section>

          {/* 15 */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>15. Consultas públicas</h2>
            <p style={pStyle}>
              Qualquer usuário cadastrado pode fazer perguntas sobre uma publicação antes de fazer uma reserva.
              As perguntas e as respostas do anunciante são <strong>visíveis para todos os visitantes</strong> da publicação.
              O anunciante não é obrigado a responder, mas é recomendável fazê-lo para gerar confiança.
              TodasMisCosas.com não é responsável pelo conteúdo das perguntas nem das respostas,
              embora se reserve o direito de eliminar publicações que infrinjam suas políticas de uso aceitável.
            </p>
          </section>

          {/* 16 */}
          <section style={sectionStyle} id="disputas">
            <h2 style={h2Style}>16. Processo formal de disputas</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              TodasMisCosas.com disponibiliza um processo formal para que qualquer uma das partes
              (cliente ou anunciante) possa apresentar uma reclamação relacionada a uma reserva, um pagamento
              ou o uso da plataforma.
            </p>

            <p style={{ ...pStyle, fontWeight: 700, marginBottom: '.4rem' }}>Passo 1 — Contato inicial</p>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Envie um e-mail para{' '}
              <a href="mailto:contacto@todasmiscosas.com" style={{ color: 'var(--orange)' }}>
                contacto@todasmiscosas.com
              </a>{' '}
              com o assunto <strong>"Disputa — [ID da reserva]"</strong> e inclua as seguintes informações:
            </p>
            <ul style={ulStyle}>
              <li>Nome completo e e-mail cadastrado na plataforma.</li>
              <li>ID da reserva envolvida.</li>
              <li>Descrição clara e detalhada do problema.</li>
              <li>Evidências de apoio: capturas de tela, fotos, conversas ou outro material relevante.</li>
            </ul>

            <p style={{ ...pStyle, fontWeight: 700, margin: '.9rem 0 .4rem' }}>Passo 2 — Revisão</p>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              A equipe da TodasMisCosas.com revisará a reclamação e responderá ao e-mail do solicitante
              dentro de <strong>48 horas úteis</strong> contadas a partir do recebimento da mensagem.
              Durante esse período poderemos solicitar informações adicionais a qualquer uma das partes.
            </p>

            <p style={{ ...pStyle, fontWeight: 700, marginBottom: '.4rem' }}>Passo 3 — Resolução</p>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              TodasMisCosas.com comunicará sua decisão por e-mail a ambas as partes. A resolução poderá incluir,
              conforme corresponda: liberação ou retenção do depósito de garantia, reembolso total ou parcial,
              ou qualquer outra medida dentro do alcance da plataforma. A decisão da TodasMisCosas.com
              é definitiva no âmbito da plataforma, sem prejuízo das ações legais que cada
              parte possa exercer por via judicial.
            </p>

            <ul style={ulStyle}>
              <li><strong>Prazo para disputar:</strong> a reclamação deve ser apresentada <strong>antes da liberação do depósito de garantia</strong> — seja por confirmação manual do cliente ou por vencimento automático do prazo de 48 horas (ver seção 12). Não serão aceitas disputas sobre pagamentos já liberados.</li>
              <li><strong>Boa-fé:</strong> ambas as partes se comprometem a agir de boa-fé durante o processo, fornecendo informações verdadeiras e completas.</li>
              <li><strong>Sem custo:</strong> o processo de disputa é gratuito para os usuários da plataforma.</li>
            </ul>

            <div style={{
              background: 'rgba(16,185,129,.07)',
              border: '1.5px solid rgba(16,185,129,.3)',
              borderRadius: 'var(--r2)',
              padding: '.85rem 1.1rem',
              marginTop: '1rem',
              fontSize: '.85rem',
              color: 'var(--text2)',
              lineHeight: 1.65,
            }}>
              <strong style={{ color: '#10b981' }}>📩 Canal de disputas</strong>
              <p style={{ margin: '.4rem 0 0' }}>
                <a href="mailto:contacto@todasmiscosas.com" style={{ color: 'var(--orange)', fontWeight: 700 }}>
                  contacto@todasmiscosas.com
                </a>
                {' '}· Assunto: <strong>"Disputa — [ID da reserva]"</strong> · Resposta em <strong>48 horas úteis</strong>
              </p>
            </div>
          </section>

          {/* 17 */}
          <section style={sectionStyle} id="danos">
            <h2 style={h2Style}>17. Danos ao espaço causados pelo cliente</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              O cliente é responsável por devolver o espaço nas mesmas condições em que o recebeu.
              Qualquer dano material ocorrido durante a vigência da reserva — incluindo, mas não se limitando a:
              quebras, arranhões ou manchas em paredes, pisos ou tetos; danos em fechaduras, chaves ou mecanismos de acesso;
              deterioração de instalações elétricas, sanitárias ou de gás; e qualquer outro prejuízo ao espaço ou às
              instalações do imóvel — é de responsabilidade exclusiva do cliente.
            </p>

            <p style={{ ...pStyle, fontWeight: 700, marginBottom: '.4rem' }}>Primeira instância — resolução direta entre as partes</p>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Ao detectar um dano, o anunciante deve comunicá-lo ao cliente de forma direta e imediata,
              idealmente pelo chat da reserva (se ainda estiver ativo) ou por qualquer outro meio acordado.
              As partes têm a possibilidade e são incentivadas a chegar a um acordo econômico direto
              sem intervenção da plataforma. TodasMisCosas.com <strong>não é responsável</strong> pelos
              danos ocorridos nem atua como garante da cobrança dos mesmos.
            </p>

            <p style={{ ...pStyle, fontWeight: 700, marginBottom: '.4rem' }}>Segunda instância — disputa formal junto à plataforma</p>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Se as partes não chegarem a um acordo direto, o anunciante pode iniciar o processo formal de disputa
              descrito na <strong>seção 16</strong>, enviando um e-mail para{' '}
              <a href="mailto:contacto@todasmiscosas.com" style={{ color: 'var(--orange)' }}>contacto@todasmiscosas.com</a>{' '}
              com o assunto <strong>"Disputa — Danos — [ID da reserva]"</strong>. Nesse caso deverá fornecer
              documentação do estado anterior e posterior do espaço (fotos, vídeos ou outro respaldo).
              TodasMisCosas.com avaliará as evidências apresentadas e, se aplicável, atuará como
              mediador entre as partes dentro do alcance da plataforma.
            </p>

            <ul style={ulStyle}>
              <li><strong>Documentação recomendada:</strong> recomenda-se que o anunciante registre fotograficamente o estado do espaço antes e depois de cada reserva como medida de respaldo perante possíveis reclamações.</li>
              <li><strong>Limite de intervenção:</strong> TodasMisCosas.com não tem capacidade de executar cobranças compulsórias nem intervém em disputas judiciais entre as partes. A plataforma atua unicamente como mediadora dentro do seu âmbito de serviço.</li>
              <li><strong>Via judicial:</strong> sem prejuízo do anterior, qualquer uma das partes pode exercer as ações legais que correspondam junto aos Tribunais Ordinários da Cidade Autônoma de Buenos Aires, conforme a seção 10.</li>
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
            Tem dúvidas legais? Escreva para{' '}
            <a href="mailto:contacto@todasmiscosas.com" style={{ color: 'var(--orange)', textDecoration: 'none' }}>
              contacto@todasmiscosas.com
            </a>
          </div>

          {/* ── DIVISOR ── */}
          <div style={{ borderTop: '2px solid var(--border)', margin: '3.5rem 0' }} />

          {/* ── POLÍTICA DE PRIVACIDADE ── */}
          <h1 id="politica-privacidad" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '.35rem' }}>
            🔒 Política de Privacidade
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: '.82rem', marginBottom: '.4rem' }}>
            Conforme a Lei 25.326 de Proteção de Dados Pessoais — República Argentina
          </p>
          <p style={{ color: 'var(--text3)', fontSize: '.82rem', marginBottom: '2.5rem' }}>
            Última atualização: junho de 2026
          </p>

          {/* I */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>I. Responsável pelo tratamento</h2>
            <p style={pStyle}>
              TodasMisCosas.com é responsável pelo tratamento dos dados pessoais de seus usuários.
              Para dúvidas relacionadas a privacidade e proteção de dados, escreva para{' '}
              <a href="mailto:contacto@todasmiscosas.com" style={{ color: 'var(--orange)' }}>contacto@todasmiscosas.com</a>.
            </p>
          </section>

          {/* II */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>II. Dados pessoais que coletamos</h2>
            <ul style={ulStyle}>
              <li><strong>Dados de cadastro:</strong> nome completo, endereço de e-mail, número de telefone e senha (armazenada em formato hash irreversível).</li>
              <li><strong>Dados de perfil:</strong> dados bancários (somente anunciantes, para receber pagamentos de suas reservas).</li>
              <li><strong>Dados de publicação:</strong> endereço do espaço, descrição, fotografias e preços cadastrados pelo anunciante.</li>
              <li><strong>Dados de transação:</strong> histórico de reservas, valores e status de pagamento processados via MercadoPago.</li>
              <li><strong>Dados de comunicação:</strong> mensagens trocadas pelo chat da plataforma e perguntas públicas feitas nas publicações.</li>
              <li><strong>Dados técnicos:</strong> endereço IP, tipo de dispositivo e registros de acesso ao serviço, utilizados exclusivamente para fins de segurança e suporte.</li>
            </ul>
          </section>

          {/* III */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>III. Finalidade do tratamento</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>Os dados pessoais são tratados exclusivamente para as seguintes finalidades:</p>
            <ul style={ulStyle}>
              <li>Prestar e melhorar o serviço de marketplace de armazenamento.</li>
              <li>Processar pagamentos e gerenciar o sistema de depósito de garantia.</li>
              <li>Enviar notificações transacionais: confirmação de reserva, PIN de acesso, avisos de vencimento de publicação.</li>
              <li>Resolver disputas entre as partes de uma reserva.</li>
              <li>Garantir a segurança da plataforma e prevenir fraudes.</li>
              <li>Cumprir as obrigações legais vigentes na República Argentina.</li>
            </ul>
          </section>

          {/* IV */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>IV. Base legal do tratamento</h2>
            <p style={pStyle}>
              O tratamento de dados é realizado com o <strong>consentimento do titular</strong>, fornecido no momento do cadastro na plataforma,
              conforme o artigo 5º da Lei 25.326. A retirada do consentimento poderá ser exercida em qualquer momento através dos canais
              indicados na seção VI (Direitos ARCO).
            </p>
          </section>

          {/* V */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>V. Conservação dos dados</h2>
            <p style={pStyle}>
              Os dados pessoais são conservados durante a vigência da conta e por um prazo adicional de <strong>5 (cinco) anos</strong> após
              o encerramento da conta, para fins de cumprimento legal e resolução de eventuais disputas. Os dados de transação
              poderão ser conservados pelo prazo exigido pela normativa fiscal e contábil aplicável.
            </p>
          </section>

          {/* VI */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>VI. Direitos ARCO</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              Conforme os artigos 14 a 16 da Lei 25.326, o titular dos dados tem direito a:
            </p>
            <ul style={ulStyle}>
              <li>
                <strong>Acesso (A):</strong> solicitar informações sobre quais dados pessoais próprios são tratados pela plataforma,
                sua origem, finalidade e os destinatários de qualquer cessão realizada ou prevista.
              </li>
              <li>
                <strong>Retificação (R):</strong> requerer a correção de dados inexatos, incompletos, desatualizados ou que induzam a erro.
              </li>
              <li>
                <strong>Cancelamento (C):</strong> solicitar a supressão ou bloqueio de dados cujo tratamento não esteja conforme o disposto na Lei 25.326.
              </li>
              <li>
                <strong>Oposição (O):</strong> opor-se, por motivos legítimos, ao tratamento dos próprios dados nos casos em que a lei permita.
              </li>
            </ul>
            <p style={{ ...pStyle, margin: '.9rem 0 .75rem' }}>
              Para exercer qualquer um desses direitos, o titular deve enviar uma solicitação por escrito para{' '}
              <a href="mailto:contacto@todasmiscosas.com" style={{ color: 'var(--orange)' }}>contacto@todasmiscosas.com</a>{' '}
              indicando: nome completo, número de documento e descrição clara do direito que deseja exercer.
            </p>
            <ul style={ulStyle}>
              <li>Solicitações de <strong>acesso:</strong> resposta em prazo máximo de <strong>10 dias úteis</strong>.</li>
              <li>Solicitações de <strong>retificação, cancelamento ou oposição:</strong> resposta em prazo máximo de <strong>5 dias úteis</strong>.</li>
            </ul>
            <div style={{
              background: 'rgba(99,102,241,.07)',
              border: '1px solid rgba(99,102,241,.25)',
              borderRadius: 'var(--r2)',
              padding: '.85rem 1.1rem',
              marginTop: '.9rem',
              fontSize: '.83rem',
              color: 'var(--text2)',
              lineHeight: 1.65,
            }}>
              <strong>Órgão de controle:</strong> a <strong>Agência de Acesso à Informação Pública (AAIP)</strong>, Órgão de Controle
              da Lei N° 25.326, tem a atribuição de atender denúncias e reclamações por descumprimento da normativa de proteção de dados pessoais.
              Site:{' '}
              <a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange)' }}>
                www.argentina.gob.ar/aaip
              </a>
            </div>
          </section>

          {/* VII */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>VII. Transferência e compartilhamento de dados</h2>
            <p style={{ ...pStyle, marginBottom: '.75rem' }}>
              TodasMisCosas.com <strong>não vende nem cede dados pessoais a terceiros</strong> para fins comerciais.
              Os dados podem ser compartilhados unicamente nos seguintes casos:
            </p>
            <ul style={ulStyle}>
              <li>
                <strong>Fornecedores de serviço tecnológico:</strong> MercadoPago (processamento de pagamentos),
                Supabase (autenticação e armazenamento de imagens) e Resend (envio de e-mails).
                Todos atuam como operadores do tratamento sob acordos de confidencialidade e não estão autorizados
                a utilizar os dados para fins distintos dos estritamente necessários para prestar o serviço.
              </li>
              <li>
                <strong>Autoridades competentes:</strong> quando exigido por lei, ordem judicial ou autoridade governamental competente.
              </li>
            </ul>
            <p style={{ ...pStyle, marginTop: '.75rem' }}>
              Não são realizadas transferências internacionais de dados pessoais fora do âmbito dos fornecedores mencionados anteriormente.
            </p>
          </section>

          {/* VIII */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>VIII. Medidas de segurança</h2>
            <p style={pStyle}>
              Implementamos medidas técnicas e organizacionais voltadas a proteger os dados pessoais contra acesso não autorizado,
              perda, alteração ou divulgação. Entre elas: armazenamento de senhas em formato hash irreversível,
              conexões criptografadas via HTTPS/TLS, acesso restrito a bancos de dados por perfil, e registros internos
              de auditoria sobre alterações nos perfis de usuário. Caso ocorra um incidente de segurança que afete
              dados pessoais, notificaremos os usuários afetados e a AAIP nos prazos e formas estabelecidos pela normativa vigente.
            </p>
          </section>

          {/* IX */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>IX. Cookies</h2>
            <p style={pStyle}>
              A plataforma utiliza cookies técnicos estritamente necessários para o funcionamento do serviço,
              incluindo a gestão de sessão do usuário e as preferências de idioma. Não são utilizados cookies
              de rastreamento publicitário nem é compartilhada informação de navegação com redes de publicidade.
              Ao continuar navegando na plataforma, o usuário aceita o uso de cookies técnicos essenciais.
            </p>
          </section>

          {/* X */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>X. Alterações a esta política</h2>
            <p style={pStyle}>
              Esta política poderá ser atualizada para refletir mudanças na normativa vigente ou nas funcionalidades
              do serviço. Alterações substanciais serão notificadas por e-mail aos usuários cadastrados
              e publicadas nesta página com pelo menos <strong>15 dias de antecedência</strong> à sua entrada em vigência.
              O uso continuado da plataforma após essa data implicará a aceitação da política atualizada.
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
            Quer exercer seus direitos ARCO ou tem dúvidas sobre privacidade? Escreva para{' '}
            <a href="mailto:contacto@todasmiscosas.com" style={{ color: 'var(--orange)', textDecoration: 'none' }}>
              contacto@todasmiscosas.com
            </a>
          </div>
    </>
  );
}

export default function LegalesPage() {
  const locale = useLocale();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />

      <div className="page-scroll" style={{ flex: 1 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
          {locale === 'pt' ? <ContenidoPT /> : <ContenidoES />}
        </div>
      </div>
    </div>
  );
}
