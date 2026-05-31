const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER || 'resend',
    pass: process.env.SMTP_PASS || '',
  },
});

const FROM = `"📦 TodasMisCosas" <${process.env.SMTP_FROM || 'contacto@todasmiscosas.com'}>`;

function baseTemplate(titulo, contenido) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
  <style>
    body { font-family: 'Sora', Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
    .wrap { max-width: 540px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #1e293b; border-radius: 18px; padding: 32px; border: 1px solid #334155; }
    .logo { font-size: 28px; font-weight: 800; color: #e8622a; margin-bottom: 8px; }
    .logo span { color: #82c4ff; }
    h2 { color: #f1f5f9; margin: 0 0 16px; font-size: 20px; }
    p { color: #94a3b8; line-height: 1.7; margin: 8px 0; }
    .highlight { color: #e8622a; font-weight: 700; }
    .btn { display: inline-block; background: linear-gradient(135deg, #e8622a, #d4521a); color: #fff; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; margin: 20px 0; }
    .info-row { background: #0f172a; border-radius: 10px; padding: 12px 16px; margin: 8px 0; display: flex; justify-content: space-between; }
    .info-label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
    .info-val { color: #e2e8f0; font-weight: 600; }
    .footer { text-align: center; color: #475569; font-size: 12px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="logo">📦 TodasMisCosas<span>.com</span></div>
      ${contenido}
    </div>
    <div class="footer">
      Este email fue enviado desde TodasMisCosas.com — Buenos Aires<br>
      Si no realizaste esta acción, ignorá este mensaje.
    </div>
  </div>
</body>
</html>`;
}

async function sendReservaConfirmada(toEmail, nombre, { espacioNombre, fechaDesde, fechaHasta, precioTotal, reservaId, pin }) {
  const html = baseTemplate('Reserva confirmada', `
    <h2>✅ Reserva confirmada</h2>
    <p>Hola <span class="highlight">${nombre}</span>, tu reserva fue registrada correctamente.</p>
    <div class="info-row">
      <div><div class="info-label">Espacio</div><div class="info-val">${espacioNombre}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Fechas</div><div class="info-val">${fechaDesde} → ${fechaHasta}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Total</div><div class="info-val">$${Number(precioTotal).toLocaleString('es-AR')}</div></div>
    </div>
    ${pin ? `
    <div style="margin:24px 0;padding:20px;background:#0f172a;border-radius:12px;text-align:center;">
      <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;text-transform:uppercase;letter-spacing:.08em;">🔐 PIN de acceso al espacio</p>
      <span style="font-family:monospace;font-size:2.6rem;font-weight:900;color:#e8622a;letter-spacing:.4em;">${pin}</span>
      <p style="margin:10px 0 0;color:#64748b;font-size:12px;">Guardá este código — lo vas a necesitar al ingresar al espacio.</p>
    </div>` : ''}
    <p>Ahora podés completar el pago desde la plataforma.</p>
    <a class="btn" href="${process.env.FRONTEND_URL}/reserva/${reservaId}/checkout">Ir al checkout →</a>
  `);

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `✅ Reserva confirmada — ${espacioNombre}`,
    html,
  });
}

async function sendPagoConfirmado(toEmail, nombre, { espacioNombre, monto, reservaId, paymentId }) {
  const html = baseTemplate('Pago confirmado', `
    <h2>💳 Pago aprobado</h2>
    <p>Hola <span class="highlight">${nombre}</span>, tu pago fue acreditado exitosamente.</p>
    <div class="info-row">
      <div><div class="info-label">Espacio</div><div class="info-val">${espacioNombre}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Monto</div><div class="info-val">$${Number(monto).toLocaleString('es-AR')}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">N° de pago</div><div class="info-val">${paymentId}</div></div>
    </div>
    <a class="btn" href="${process.env.FRONTEND_URL}/panel">Ver mis reservas →</a>
  `);

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `💳 Pago confirmado — ${espacioNombre}`,
    html,
  });
}

async function sendBienvenida(toEmail, nombre, tipo) {
  const accionPrincipal = tipo === 'oferente'
    ? '<p>Desde tu panel podés publicar tus espacios y empezar a recibir reservas.</p>'
    : '<p>Desde tu panel podés buscar espacios y realizar reservas en toda la ciudad.</p>';

  const html = baseTemplate('Bienvenido/a a TodasMisCosas', `
    <h2>👋 Bienvenido/a a TodasMisCosas</h2>
    <p>Hola <span class="highlight">${nombre}</span>, tu cuenta fue creada exitosamente.</p>
    <p>Sos parte de la comunidad de almacenamiento urbano más grande de Buenos Aires.</p>
    ${accionPrincipal}
    <a class="btn" href="${process.env.FRONTEND_URL}">Explorar espacios →</a>

    <div style="margin-top:28px;border-top:1px solid #334155;padding-top:20px;">
      <div style="color:#f1f5f9;font-weight:700;font-size:13px;margin-bottom:10px;">⚖️ Aceptación de Términos de Uso</div>
      <p style="font-size:12px;color:#94a3b8;line-height:1.75;margin:0 0 12px;">
        Al crear tu cuenta en <strong style="color:#e2e8f0">TodasMisCosas.com</strong> aceptaste los
        <strong style="color:#e2e8f0">Términos de Uso y Disclaimers</strong> de la plataforma. A continuación,
        un resumen de los puntos principales:
      </p>
      <div style="background:#0f172a;border-radius:10px;padding:14px 16px;margin-bottom:14px;">
        <ul style="font-size:12px;color:#94a3b8;line-height:2;padding-left:18px;margin:0;">
          <li>TodasMisCosas opera como <strong style="color:#e2e8f0">plataforma de conexión</strong> entre Demandante y Oferente. No es parte del contrato de almacenamiento ni responsable por daños a los bienes.</li>
          <li>Queda <strong style="color:#e2e8f0">prohibido</strong> almacenar o transportar bienes peligrosos, ilegales, armas, explosivos, sustancias controladas o de procedencia no comprobable.</li>
          <li>Cada usuario es <strong style="color:#e2e8f0">responsable de sus bienes y del espacio</strong> que ofrece o utiliza.</li>
          <li>TodasMisCosas cobra una <strong style="color:#e2e8f0">comisión del 15%</strong> sobre el valor de cada reserva efectivamente cobrada al Oferente.</li>
          <li>Las transacciones se realizan a través de <strong style="color:#e2e8f0">MercadoPago</strong>. El pago queda retenido hasta la confirmación de acceso al espacio.</li>
        </ul>
      </div>
      <a href="${process.env.FRONTEND_URL}/legal" style="font-size:12px;color:#82c4ff;text-decoration:underline;">
        📄 Ver los Términos y Condiciones completos →
      </a>
    </div>
  `);

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: '👋 Bienvenido/a a TodasMisCosas.com — Confirmación de Términos',
    html,
  });
}

// ── Ambas partes: confirmación legal al crear una reserva ────────
async function sendAceptacionOperacion(toEmail, nombre, { rol, espacioNombre, fechaDesde, fechaHasta, precioTotal, reservaId }) {
  const esOferente = rol === 'oferente';
  const rolLabel   = esOferente ? 'Oferente' : 'Demandante';

  const obligaciones = esOferente
    ? [
        'Garantizar que el espacio se encuentre en las condiciones acordadas y disponible desde la fecha pactada.',
        'No denegar el acceso una vez confirmada y pagada la reserva, salvo causa de fuerza mayor debidamente documentada.',
        'Informar inmediatamente ante cualquier incidente que afecte los bienes almacenados.',
        'Recordá que TodasMisCosas retiene el 15% de comisión sobre el monto cobrado.',
      ]
    : [
        'Declarar veraz y completamente el tipo de bienes que serán almacenados.',
        'No ingresar al espacio bienes prohibidos, peligrosos, ilegales o de procedencia no comprobable.',
        'Respetar los horarios y condiciones de acceso acordados con el Oferente.',
        'Asumir responsabilidad civil por daños que tus bienes pudieran causar al espacio o a terceros.',
      ];

  const listaObligaciones = obligaciones
    .map(o => `<li style="padding:4px 0">${o}</li>`)
    .join('');

  const html = baseTemplate('Confirmación legal de operación', `
    <h2>📋 Confirmación de operación y Términos</h2>
    <p>Hola <span class="highlight">${nombre}</span>, te confirmamos que como <strong>${rolLabel}</strong> en la siguiente operación aceptás los Términos de Uso de TodasMisCosas.com.</p>

    <div class="info-row">
      <div><div class="info-label">Espacio</div><div class="info-val">${espacioNombre}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Fechas</div><div class="info-val">${fechaDesde} → ${fechaHasta}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Monto</div><div class="info-val">$${Number(precioTotal).toLocaleString('es-AR')}</div></div>
    </div>

    <div style="margin:20px 0;">
      <div style="color:#f1f5f9;font-weight:700;font-size:13px;margin-bottom:10px;">
        ✅ Tus obligaciones como ${rolLabel}
      </div>
      <div style="background:#0f172a;border-radius:10px;padding:14px 16px;">
        <ul style="font-size:12px;color:#94a3b8;line-height:2;padding-left:18px;margin:0;">
          ${listaObligaciones}
        </ul>
      </div>
    </div>

    <div style="background:#0f172a;border:1px solid #334155;border-radius:10px;padding:14px 16px;margin:16px 0;">
      <p style="font-size:12px;color:#94a3b8;line-height:1.75;margin:0 0 8px;">
        <strong style="color:#e2e8f0">TodasMisCosas.com</strong> actúa como plataforma de conexión.
        No es parte del contrato, no custodia bienes ni garantiza su integridad.
        Recomendamos contratar seguro de contenido al momento de la reserva.
      </p>
      <a href="${process.env.FRONTEND_URL}/legal" style="font-size:12px;color:#82c4ff;text-decoration:underline;">
        📄 Ver Términos y Condiciones completos →
      </a>
    </div>

    <a class="btn" href="${process.env.FRONTEND_URL}/panel">Ir a mi panel →</a>
  `);

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `📋 Confirmación legal — ${espacioNombre} (${fechaDesde} → ${fechaHasta})`,
    html,
  });
}

async function sendContacto(toEmail, { nombre, emailRemitente, asunto, mensaje }) {
  const html = baseTemplate('Consulta recibida', `
    <h2>📩 Nueva consulta</h2>
    <p><strong>De:</strong> ${nombre} (${emailRemitente})</p>
    <p><strong>Asunto:</strong> ${asunto}</p>
    <p style="background:#0f172a;border-radius:10px;padding:16px;">${mensaje}</p>
  `);

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    replyTo: emailRemitente,
    subject: `📩 Contacto: ${asunto}`,
    html,
  });
}

async function sendServiciosAdicionales(toEmail, { nombreDemandante, emailDemandante, telDemandante, espacioNombre, servicios, fechaDesde, fechaHasta }) {
  const etiquetas = {
    transporte: '🚚 Servicio de Transporte',
    seguro:     '🛡️ Seguro de Contenido',
    embalaje:   '📦 Kit de Embalaje',
    limpieza:   '🧹 Limpieza del Espacio',
  };
  const lista = servicios.map(s => `<li style="padding:4px 0">${etiquetas[s] || s}</li>`).join('');

  const html = baseTemplate('Solicitud de servicios adicionales', `
    <h2>🛎️ Nueva solicitud de servicios adicionales</h2>
    <p>Un demandante solicitó servicios adicionales al reservar un espacio. Contactarlo a la brevedad.</p>
    <div class="info-row">
      <div><div class="info-label">Demandante</div><div class="info-val">${nombreDemandante}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Email</div><div class="info-val">${emailDemandante}</div></div>
    </div>
    ${telDemandante ? `<div class="info-row"><div><div class="info-label">Teléfono</div><div class="info-val">${telDemandante}</div></div></div>` : ''}
    <div class="info-row">
      <div><div class="info-label">Espacio</div><div class="info-val">${espacioNombre}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Fechas</div><div class="info-val">${fechaDesde} → ${fechaHasta}</div></div>
    </div>
    <p style="margin-top:16px;color:#f1f5f9;font-weight:700">Servicios solicitados:</p>
    <ul style="color:#e2e8f0;line-height:1.9;padding-left:20px">${lista}</ul>
  `);

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `🛎️ Servicios adicionales — ${espacioNombre}`,
    html,
  });
}

// ── Oferente: nueva solicitud de reserva recibida ───────────────
async function sendNuevaReserva(toEmail, nombreOferente, { demandanteNombre, demandanteEmail, demandanteTel, espacioNombre, fechaDesde, fechaHasta, precioTotal, reservaId, pin }) {
  const html = baseTemplate('Nueva solicitud de reserva', `
    <h2>🔔 Nueva solicitud de reserva</h2>
    <p>Hola <span class="highlight">${nombreOferente}</span>, recibiste una solicitud para tu espacio.</p>
    <div class="info-row">
      <div><div class="info-label">Espacio</div><div class="info-val">${espacioNombre}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Solicitante</div><div class="info-val">${demandanteNombre}</div></div>
    </div>
    ${demandanteEmail ? `<div class="info-row"><div><div class="info-label">Email</div><div class="info-val"><a href="mailto:${demandanteEmail}" style="color:#82c4ff;">${demandanteEmail}</a></div></div></div>` : ''}
    ${demandanteTel ? `<div class="info-row"><div><div class="info-label">Teléfono</div><div class="info-val"><a href="tel:${demandanteTel}" style="color:#82c4ff;">${demandanteTel}</a></div></div></div>` : ''}
    <div class="info-row">
      <div><div class="info-label">Fechas</div><div class="info-val">${fechaDesde} → ${fechaHasta}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Monto estimado</div><div class="info-val">$${Number(precioTotal).toLocaleString('es-AR')}</div></div>
    </div>
    ${pin ? `
    <div style="margin:24px 0;padding:20px;background:#0f172a;border-radius:12px;text-align:center;">
      <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;text-transform:uppercase;letter-spacing:.08em;">🔐 PIN de acceso al espacio</p>
      <span style="font-family:monospace;font-size:2.6rem;font-weight:900;color:#e8622a;letter-spacing:.4em;">${pin}</span>
      <p style="margin:10px 0 0;color:#64748b;font-size:12px;">El demandante tiene el mismo código — verificalo al momento de la entrega.</p>
    </div>` : ''}
    <p>Ingresá a tu panel para confirmar o rechazar la solicitud.</p>
    <a class="btn" href="${process.env.FRONTEND_URL}/panel">Ver solicitud en mi panel →</a>
  `);
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `🔔 Nueva reserva — ${espacioNombre}`,
    html,
  });
}

// ── Demandante: el oferente aprobó su reserva ────────────────────
async function sendReservaAprobada(toEmail, nombreDemandante, { espacioNombre, fechaDesde, fechaHasta, precioTotal, reservaId }) {
  const html = baseTemplate('Tu reserva fue aprobada', `
    <h2>✅ ¡Tu reserva fue aprobada!</h2>
    <p>Hola <span class="highlight">${nombreDemandante}</span>, el oferente confirmó tu solicitud.</p>
    <div class="info-row">
      <div><div class="info-label">Espacio</div><div class="info-val">${espacioNombre}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Fechas</div><div class="info-val">${fechaDesde} → ${fechaHasta}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Total a pagar</div><div class="info-val">$${Number(precioTotal).toLocaleString('es-AR')}</div></div>
    </div>
    <p>Ya podés completar el pago para asegurar tu espacio.</p>
    <a class="btn" href="${process.env.FRONTEND_URL}/reserva/${reservaId}/checkout">Ir al pago →</a>
  `);
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `✅ Reserva aprobada — ${espacioNombre}`,
    html,
  });
}

// ── Oferente: se acreditó el pago de su espacio ──────────────────
const COMISION_PLATAFORMA = 0.15; // 15%

async function sendPagoRecibidoOferente(toEmail, nombreOferente, { demandanteNombre, espacioNombre, monto, reservaId }) {
  const montoTotal    = Number(monto);
  const comision      = Math.round(montoTotal * COMISION_PLATAFORMA);
  const montoNeto     = montoTotal - comision;

  const html = baseTemplate('Pago recibido por tu espacio', `
    <h2>💰 ¡Pago acreditado!</h2>
    <p>Hola <span class="highlight">${nombreOferente}</span>, el demandante completó el pago de tu espacio.</p>
    <div class="info-row">
      <div><div class="info-label">Espacio</div><div class="info-val">${espacioNombre}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Inquilino</div><div class="info-val">${demandanteNombre}</div></div>
    </div>
    <div style="margin:20px 0;background:#0f172a;border-radius:12px;padding:16px 20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="color:#94a3b8;font-size:13px;">Valor total de la reserva</span>
        <span style="color:#e2e8f0;font-weight:600;">$${montoTotal.toLocaleString('es-AR')}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #1e293b;">
        <span style="color:#94a3b8;font-size:13px;">Comisión TodasMisCosas (15%)</span>
        <span style="color:#ef4444;font-weight:600;">- $${comision.toLocaleString('es-AR')}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#f1f5f9;font-size:15px;font-weight:700;">Monto a recibir</span>
        <span style="color:#10b981;font-size:18px;font-weight:800;">$${montoNeto.toLocaleString('es-AR')}</span>
      </div>
    </div>
    <div style="background:#1a2e1a;border:1px solid #166534;border-radius:10px;padding:12px 16px;margin-bottom:20px;">
      <p style="color:#86efac;font-size:13px;margin:0;">
        ⏱️ <strong>Recibirás $${montoNeto.toLocaleString('es-AR')} dentro de las próximas 48 horas hábiles</strong> en la cuenta bancaria registrada en tu perfil.
      </p>
    </div>
    <p>Coordiná el acceso al espacio con tu inquilino cuando estés listo.</p>
    <a class="btn" href="${process.env.FRONTEND_URL}/panel">Ver en mi panel →</a>
  `);
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `💰 Pago recibido — $${montoNeto.toLocaleString('es-AR')} en camino · ${espacioNombre}`,
    html,
  });
}

// ── Ambos: la reserva fue cancelada ─────────────────────────────
async function sendReservaCancelada(toEmail, nombre, { espacioNombre, fechaDesde, fechaHasta, canceladoPor }) {
  const html = baseTemplate('Reserva cancelada', `
    <h2>❌ Reserva cancelada</h2>
    <p>Hola <span class="highlight">${nombre}</span>, la siguiente reserva fue cancelada.</p>
    <div class="info-row">
      <div><div class="info-label">Espacio</div><div class="info-val">${espacioNombre}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Fechas</div><div class="info-val">${fechaDesde} → ${fechaHasta}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Cancelada por</div><div class="info-val">${canceladoPor}</div></div>
    </div>
    <p>Si tenés alguna consulta, contactanos por la plataforma.</p>
    <a class="btn" href="${process.env.FRONTEND_URL}/panel">Ir a mi panel →</a>
  `);
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `❌ Reserva cancelada — ${espacioNombre}`,
    html,
  });
}

// ── Demandante: recordatorios de vencimiento de reserva ─────────

function _recordatorioBase(diasRestantes, { nombre, espacioNombre, fechaHasta, reservaId }) {
  const configs = {
    5: { emoji: '⏰', titulo: 'Tu reserva vence en 5 días', bajada: 'Quedan <strong>5 días</strong> para que expire tu reserva.' },
    2: { emoji: '⚡', titulo: 'Tu reserva vence en 2 días', bajada: 'Quedan solo <strong>2 días</strong> para que expire tu reserva.' },
    1: { emoji: '🚨', titulo: 'Tu reserva vence mañana',   bajada: '<strong>¡Mañana vence</strong> tu reserva!' },
    0: { emoji: '🔔', titulo: 'Tu reserva vence hoy',      bajada: '<strong>¡Hoy es el último día</strong> de tu reserva.' },
  };
  const { emoji, titulo, bajada } = configs[diasRestantes];
  return baseTemplate(titulo, `
    <h2>${emoji} ${titulo}</h2>
    <p>Hola <span class="highlight">${nombre}</span>, ${bajada}</p>
    <div class="info-row">
      <div><div class="info-label">Espacio</div><div class="info-val">${espacioNombre}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Vencimiento</div><div class="info-val">${fechaHasta}</div></div>
    </div>
    <p>¿Querés seguir usando el espacio? Extendé tu reserva antes de que venza pagando por anticipado.</p>
    <a class="btn" href="${process.env.FRONTEND_URL}/panel">📅 Extender mi reserva →</a>
    <p style="font-size:12px;color:#64748b;margin-top:12px">Si no extendés, tu reserva finalizará automáticamente al vencer el plazo.</p>
  `);
}

async function sendRecordatorio5Dias(toEmail, nombre, datos) {
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `⏰ Tu reserva en ${datos.espacioNombre} vence en 5 días`,
    html: _recordatorioBase(5, { nombre, ...datos }),
  });
}
async function sendRecordatorio2Dias(toEmail, nombre, datos) {
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `⚡ Tu reserva en ${datos.espacioNombre} vence en 2 días`,
    html: _recordatorioBase(2, { nombre, ...datos }),
  });
}
async function sendRecordatorio1Dia(toEmail, nombre, datos) {
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `🚨 Tu reserva en ${datos.espacioNombre} vence mañana`,
    html: _recordatorioBase(1, { nombre, ...datos }),
  });
}
async function sendRecordatorio0Dias(toEmail, nombre, datos) {
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `🔔 Hoy finaliza tu reserva en ${datos.espacioNombre}`,
    html: _recordatorioBase(0, { nombre, ...datos }),
  });
}

// ── Demandante: extensión de reserva confirmada ──────────────────
async function sendExtensionConfirmada(toEmail, nombre, { espacioNombre, fechaHastaAnterior, nuevaFechaHasta, monto, reservaId }) {
  const html = baseTemplate('Extensión confirmada', `
    <h2>✅ Extensión de reserva confirmada</h2>
    <p>Hola <span class="highlight">${nombre}</span>, tu extensión fue procesada exitosamente.</p>
    <div class="info-row">
      <div><div class="info-label">Espacio</div><div class="info-val">${espacioNombre}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Vencimiento anterior</div><div class="info-val">${fechaHastaAnterior}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Nuevo vencimiento</div><div class="info-val">${nuevaFechaHasta}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Monto pagado</div><div class="info-val">$${Number(monto).toLocaleString('es-AR')}</div></div>
    </div>
    <p>¡Seguís usando tu espacio sin interrupciones!</p>
    <a class="btn" href="${process.env.FRONTEND_URL}/panel">Ver mis reservas →</a>
  `);
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `✅ Extensión confirmada — ${espacioNombre}`,
    html,
  });
}

// ── Demandante: reserva finalizada — invitación a dejar reseña ──
async function sendReservaFinalizada(toEmail, nombreDemandante, { espacioNombre, reservaId }) {
  const html = baseTemplate('Tu estadía finalizó', `
    <h2>🏁 Tu estadía finalizó</h2>
    <p>Hola <span class="highlight">${nombreDemandante}</span>, tu reserva en <strong>${espacioNombre}</strong> fue marcada como finalizada.</p>
    <p>¿Qué tal fue tu experiencia? Tu opinión ayuda a otros usuarios a elegir el mejor espacio.</p>
    <a class="btn" href="${process.env.FRONTEND_URL}/panel">Dejar una reseña →</a>
    <p style="font-size:12px;color:#64748b;margin-top:16px">¡Gracias por usar TodasMisCosas!</p>
  `);
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `🏁 Estadía finalizada — ${espacioNombre}`,
    html,
  });
}

// ── OTP: código de verificación de acceso ───────────────────────
async function sendOTP(toEmail, nombre, { codigo, expiraEn }) {
  const html = baseTemplate('Código de verificación', `
    <h2>🔐 Código de verificación</h2>
    <p>Hola <span class="highlight">${nombre}</span>, alguien (esperemos que seas vos) está intentando ingresar a tu cuenta.</p>
    <p>Tu código de verificación es:</p>
    <div style="text-align:center; margin: 24px 0;">
      <div style="display:inline-block; background:#0f172a; border:2px solid #e8622a; border-radius:14px; padding:18px 36px;">
        <span style="font-family:monospace; font-size:2.4rem; font-weight:900; color:#e8622a; letter-spacing:.4em;">${codigo}</span>
      </div>
    </div>
    <p style="text-align:center; font-size:.82rem; color:#64748b;">Válido por <strong style="color:#e2e8f0">${expiraEn} minutos</strong>. No lo compartás con nadie.</p>
    <div style="background:#1a1200; border:1px solid #d97706; border-radius:8px; padding:10px 14px; color:#fcd34d; font-size:13px; margin:16px 0;">
      ⚠️ Si no fuiste vos, ignorá este mensaje y cambiá tu contraseña inmediatamente.
    </div>
  `);
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `🔐 ${codigo} — Código de verificación TodasMisCosas`,
    html,
  });
}

// ── Notificación de acceso exitoso ───────────────────────────────
async function sendLoginNotificacion(toEmail, nombre, { fecha, ip, dispositivo }) {
  const html = baseTemplate('Acceso confirmado a tu cuenta', `
    <h2>✅ Acceso confirmado</h2>
    <p>Hola <span class="highlight">${nombre}</span>, se registró un acceso exitoso a tu cuenta.</p>
    <div class="info-row">
      <div><div class="info-label">Fecha y hora</div><div class="info-val">${fecha}</div></div>
    </div>
    ${ip ? `<div class="info-row"><div><div class="info-label">IP</div><div class="info-val">${ip}</div></div></div>` : ''}
    ${dispositivo ? `<div class="info-row"><div><div class="info-label">Dispositivo</div><div class="info-val">${dispositivo}</div></div></div>` : ''}
    <div style="background:#1a1200; border:1px solid #d97706; border-radius:8px; padding:12px 16px; margin:16px 0;">
      <p style="color:#fcd34d; font-size:.88rem; margin:0 0 8px; font-weight:700;">⚠️ ¿No fuiste vos?</p>
      <p style="color:#fcd34d; font-size:.82rem; margin:0;">Escribinos de inmediato a <a href="mailto:contacto@todasmiscosas.com" style="color:#e8622a; font-weight:700;">contacto@todasmiscosas.com</a> para bloquear tu cuenta y proteger tu información.</p>
    </div>
    <a class="btn" href="mailto:contacto@todasmiscosas.com?subject=Acceso no autorizado a mi cuenta&body=Nombre: ${encodeURIComponent(nombre)}%0AFecha: ${encodeURIComponent(fecha)}%0AIP: ${encodeURIComponent(ip || 'desconocida')}">No fui yo — Reportar acceso →</a>
  `);
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: '✅ Acceso confirmado a tu cuenta de TodasMisCosas',
    html,
  });
}

// ── Cuenta bloqueada por admin ───────────────────────────────────
async function sendCuentaBloqueada(toEmail, nombre, { motivo }) {
  const html = baseTemplate('Cuenta suspendida', `
    <h2>⛔ Tu cuenta ha sido suspendida</h2>
    <p>Hola <span class="highlight">${nombre}</span>, tu cuenta en TodasMisCosas fue suspendida por un administrador.</p>
    ${motivo ? `
    <div class="info-row">
      <div><div class="info-label">Motivo</div><div class="info-val">${motivo}</div></div>
    </div>` : ''}
    <p>Si creés que esto es un error o querés apelar la decisión, contactanos respondiendo este email.</p>
    <a class="btn" href="mailto:contacto@todasmiscosas.com">Contactar soporte →</a>
    <p style="font-size:12px;color:#64748b;margin-top:16px">TodasMisCosas se reserva el derecho de suspender cuentas que no respeten las normas de uso de la plataforma.</p>
  `);
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: '⛔ Tu cuenta en TodasMisCosas fue suspendida',
    html,
  });
}

// ── Cuenta desbloqueada por admin ────────────────────────────────
async function sendCuentaDesbloqueada(toEmail, nombre) {
  const html = baseTemplate('Cuenta reactivada', `
    <h2>✅ Tu cuenta fue reactivada</h2>
    <p>Hola <span class="highlight">${nombre}</span>, nos complace informarte que tu cuenta en TodasMisCosas fue reactivada.</p>
    <p>Ya podés ingresar normalmente y seguir usando la plataforma.</p>
    <a class="btn" href="${process.env.FRONTEND_URL}">Ingresar a TodasMisCosas →</a>
  `);
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: '✅ Tu cuenta en TodasMisCosas fue reactivada',
    html,
  });
}

// ── Cambio de teléfono confirmado ────────────────────────────────
async function sendCambioTelConfirmado(toEmail, nombre, { telNuevo }) {
  const html = baseTemplate('Teléfono actualizado', `
    <h2>📱 Tu teléfono fue actualizado</h2>
    <p>Hola <span class="highlight">${nombre}</span>, te confirmamos que el número de teléfono asociado a tu cuenta fue actualizado exitosamente.</p>
    <div class="info-row">
      <div><div class="info-label">Nuevo número</div><div class="info-val">${telNuevo}</div></div>
    </div>
    <p>Este número se usará para recibir tu código de verificación en futuros ingresos.</p>
    <p style="font-size:12px;color:#64748b;margin-top:16px">¿No realizaste este cambio? Contactanos de inmediato a <a href="mailto:contacto@todasmiscosas.com" style="color:#e8622a">contacto@todasmiscosas.com</a></p>
  `);
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: '📱 Tu teléfono en TodasMisCosas fue actualizado',
    html,
  });
}

// ── Publicación desactivada por inactividad ──────────────────────
async function sendPublicacionDesactivada(toEmail, nombre, { espacioNombre, diasInactivo }) {
  const html = baseTemplate('Publicación desactivada por inactividad', `
    <h2>⏸️ Publicación pausada automáticamente</h2>
    <p>Hola <span class="highlight">${nombre}</span>, tu publicación estuvo inactiva durante más de ${diasInactivo} días y fue pausada automáticamente para mantener la calidad del marketplace.</p>
    <div class="info-row">
      <div><div class="info-label">Publicación</div><div class="info-val">${espacioNombre}</div></div>
    </div>
    <p>Podés reactivarla en cualquier momento desde tu panel de control.</p>
    <a class="btn" href="${process.env.FRONTEND_URL}/panel">Reactivar publicación →</a>
    <p style="font-size:12px;color:#64748b;margin-top:16px">Si ya no querés ofrecer este espacio, podés eliminarlo directamente desde el panel.</p>
  `);
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `⏸️ Tu publicación "${espacioNombre}" fue pausada por inactividad`,
    html,
  });
}

async function sendMejorarPuntuacion({ nombre, email, tel, espacioNombre, puntajeActual }) {
  const adminTo = process.env.ADMIN_EMAILS || 'contacto@todasmiscosas.com';
  const html = baseTemplate('Solicitud para mejorar puntuación de seguridad', `
    <h2>🛡️ Solicitud: Mejorar puntuación de seguridad</h2>
    <p>Un oferente quiere mejorar la puntuación de seguridad de su publicación. Contactarlo a la brevedad.</p>
    <div class="info-row"><div><div class="info-label">Nombre</div><div class="info-val">${nombre}</div></div></div>
    <div class="info-row"><div><div class="info-label">Email</div><div class="info-val"><a href="mailto:${email}" style="color:#e8622a">${email}</a></div></div></div>
    <div class="info-row"><div><div class="info-label">Teléfono</div><div class="info-val">${tel || 'No informado'}</div></div></div>
    <div class="info-row"><div><div class="info-label">Espacio</div><div class="info-val">${espacioNombre || 'No especificado'}</div></div></div>
    <div class="info-row"><div><div class="info-label">Puntuación actual</div><div class="info-val">${puntajeActual} / 5 estrellas</div></div></div>
    <a class="btn" href="mailto:${email}?subject=Mejorá la seguridad de tu espacio en TodasMisCosas">Responder al oferente →</a>
  `);

  await transporter.sendMail({
    from: FROM,
    to: adminTo,
    replyTo: email,
    subject: `🛡️ Mejorar puntuación — ${nombre} (${espacioNombre || 'sin espacio'})`,
    html,
  });
}

// ── Chat: nuevo mensaje recibido ────────────────────────────────
async function sendNuevoMensajeChat(toEmail, nombreDestinatario, { nombreRemitente, espacioNombre, previewMensaje, conversacionId }) {
  const preview = previewMensaje?.length > 120
    ? previewMensaje.slice(0, 120) + '…'
    : previewMensaje;

  const html = baseTemplate('Nuevo mensaje en tu chat', `
    <h2>💬 Nuevo mensaje de ${nombreRemitente}</h2>
    <p>Hola <span class="highlight">${nombreDestinatario}</span>, recibiste un mensaje en la conversación sobre <strong>${espacioNombre}</strong>.</p>
    <div style="background:#0f172a;border-left:3px solid #e8622a;border-radius:0 10px 10px 0;padding:14px 16px;margin:16px 0;">
      <p style="margin:0;color:#e2e8f0;font-style:italic;">"${preview}"</p>
      <p style="margin:8px 0 0;font-size:12px;color:#64748b;">— ${nombreRemitente}</p>
    </div>
    <a class="btn" href="${process.env.FRONTEND_URL}/panel">Responder →</a>
    <p style="font-size:12px;color:#64748b;margin-top:16px">Ingresá a tu panel y abrí el chat para responder.</p>
  `);

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `💬 ${nombreRemitente} te envió un mensaje — ${espacioNombre}`,
    html,
  });
}

// ── Consulta pública en una publicación ─────────────────────────
async function sendNuevaConsultaPublica(toEmail, nombreOferente, { autorNombre, espacioNombre, pregunta, espacioId }) {
  const preview = pregunta?.length > 160 ? pregunta.slice(0, 160) + '…' : pregunta;

  const html = baseTemplate('Nueva consulta en tu publicación', `
    <h2>❓ Nueva consulta de ${autorNombre}</h2>
    <p>Hola <span class="highlight">${nombreOferente}</span>, alguien hizo una consulta en tu publicación <strong>${espacioNombre}</strong>.</p>
    <div style="background:#0f172a;border-left:3px solid #e8622a;border-radius:0 10px 10px 0;padding:14px 16px;margin:16px 0;">
      <p style="margin:0;color:#e2e8f0;font-style:italic;">"${preview}"</p>
      <p style="margin:8px 0 0;font-size:12px;color:#64748b;">— ${autorNombre}</p>
    </div>
    <a class="btn" href="${process.env.FRONTEND_URL}/panel">Responder desde mi panel →</a>
    <p style="font-size:12px;color:#64748b;margin-top:16px">Ingresá a tu panel y buscá la sección <strong>Consultas pendientes</strong> para responderla.</p>
  `);

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `❓ Nueva consulta en "${espacioNombre}" — TodasMisCosas.com`,
    html,
  });
}

// ── Newsletter / Mailing masivo ──────────────────────────────────
async function sendNewsletter(toEmail, nombre, { asunto, cuerpoHtml }) {
  const html = baseTemplate(asunto, `
    <p style="font-size:.88rem; color:#94a3b8; margin:0 0 20px;">
      Hola <span class="highlight">${nombre}</span>, te traemos novedades de <strong style="color:#e8622a;">TodasMisCosas.com</strong>.
    </p>
    ${cuerpoHtml}
    <div style="border-top:1px solid #2d3748; margin-top:28px; padding-top:16px; text-align:center; font-size:11px; color:#475569;">
      Recibís este email porque sos usuario de TodasMisCosas.com.<br>
      Para darte de baja escribinos a
      <a href="mailto:contacto@todasmiscosas.com" style="color:#e8622a;">contacto@todasmiscosas.com</a>
    </div>
  `);
  await transporter.sendMail({ from: FROM, to: toEmail, subject: asunto, html });
}

module.exports = {
  sendReservaConfirmada,
  sendPagoConfirmado,
  sendBienvenida,
  sendAceptacionOperacion,
  sendContacto,
  sendServiciosAdicionales,
  sendNuevaReserva,
  sendReservaAprobada,
  sendPagoRecibidoOferente,
  sendReservaCancelada,
  sendReservaFinalizada,
  sendRecordatorio5Dias,
  sendRecordatorio2Dias,
  sendRecordatorio1Dia,
  sendRecordatorio0Dias,
  sendExtensionConfirmada,
  sendCuentaBloqueada,
  sendCuentaDesbloqueada,
  sendOTP,
  sendLoginNotificacion,
  sendCambioTelConfirmado,
  sendPublicacionDesactivada,
  sendMejorarPuntuacion,
  sendNewsletter,
  sendNuevoMensajeChat,
  sendNuevaConsultaPublica,
};
