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

async function sendReservaConfirmada(toEmail, nombre, { espacioNombre, fechaDesde, fechaHasta, precioTotal, reservaId }) {
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
  const html = baseTemplate('Bienvenido/a', `
    <h2>👋 Bienvenido/a a TodasMisCosas</h2>
    <p>Hola <span class="highlight">${nombre}</span>, tu cuenta fue creada exitosamente.</p>
    <p>Sos parte de la comunidad de almacenamiento urbano más grande de Buenos Aires.</p>
    ${tipo === 'oferente'
      ? '<p>Desde tu panel podés publicar tus espacios y empezar a recibir reservas.</p>'
      : '<p>Desde tu panel podés buscar espacios y realizar reservas en toda la ciudad.</p>'
    }
    <a class="btn" href="${process.env.FRONTEND_URL}">Explorar espacios →</a>
  `);

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: '👋 Bienvenido/a a TodasMisCosas.com',
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
async function sendNuevaReserva(toEmail, nombreOferente, { demandanteNombre, demandanteTel, espacioNombre, fechaDesde, fechaHasta, precioTotal, reservaId }) {
  const html = baseTemplate('Nueva solicitud de reserva', `
    <h2>🔔 Nueva solicitud de reserva</h2>
    <p>Hola <span class="highlight">${nombreOferente}</span>, recibiste una solicitud para tu espacio.</p>
    <div class="info-row">
      <div><div class="info-label">Espacio</div><div class="info-val">${espacioNombre}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Solicitante</div><div class="info-val">${demandanteNombre}</div></div>
    </div>
    ${demandanteTel ? `<div class="info-row"><div><div class="info-label">Teléfono</div><div class="info-val">${demandanteTel}</div></div></div>` : ''}
    <div class="info-row">
      <div><div class="info-label">Fechas</div><div class="info-val">${fechaDesde} → ${fechaHasta}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Monto estimado</div><div class="info-val">$${Number(precioTotal).toLocaleString('es-AR')}</div></div>
    </div>
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
async function sendPagoRecibidoOferente(toEmail, nombreOferente, { demandanteNombre, espacioNombre, monto, reservaId }) {
  const html = baseTemplate('Pago recibido por tu espacio', `
    <h2>💰 Pago recibido</h2>
    <p>Hola <span class="highlight">${nombreOferente}</span>, se acreditó el pago de tu espacio.</p>
    <div class="info-row">
      <div><div class="info-label">Espacio</div><div class="info-val">${espacioNombre}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Inquilino</div><div class="info-val">${demandanteNombre}</div></div>
    </div>
    <div class="info-row">
      <div><div class="info-label">Monto acreditado</div><div class="info-val">$${Number(monto).toLocaleString('es-AR')}</div></div>
    </div>
    <p>La reserva está activa. Coordiná el acceso con tu inquilino.</p>
    <a class="btn" href="${process.env.FRONTEND_URL}/panel">Ver en mi panel →</a>
  `);
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `💰 Pago recibido — ${espacioNombre}`,
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

module.exports = {
  sendReservaConfirmada,
  sendPagoConfirmado,
  sendBienvenida,
  sendContacto,
  sendServiciosAdicionales,
  sendNuevaReserva,
  sendReservaAprobada,
  sendPagoRecibidoOferente,
  sendReservaCancelada,
  sendReservaFinalizada,
};
