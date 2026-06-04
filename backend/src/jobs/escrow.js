const cron = require('node-cron');
const { query } = require('../db/connection');

async function procesarEscrowAutorelease() {
  let reservas;
  try {
    reservas = await query(`
      SELECT r.*,
             e.nombre AS espacio_nombre,
             u.nombre  AS usuario_nombre, u.email   AS usuario_email,
             u2.nombre AS oferente_nombre, u2.email  AS oferente_email, u2.cbu_alias AS oferente_cbu
      FROM reservas r
      JOIN espacios e  ON r.espacio_id   = e.id
      JOIN usuarios u  ON r.usuario_id   = u.id
      JOIN usuarios u2 ON e.oferente_id  = u2.id
      WHERE r.estado = 'pagada'
        AND r.escrow_liberado = 0
        AND r.fecha_desde <= DATE_SUB(NOW(), INTERVAL 48 HOUR)
    `);
  } catch (e) {
    console.warn('[escrow] Error consultando reservas:', e.message);
    return;
  }

  if (!reservas.length) return;

  console.log(`[escrow] Auto-liberando ${reservas.length} escrow(s) vencidos…`);

  const emailService = require('../services/emailService');
  const adminEmail   = process.env.ADMIN_EMAILS || 'contacto@todasmiscosas.com';

  for (const reserva of reservas) {
    try {
      await query(
        `UPDATE reservas SET escrow_liberado = 1, escrow_liberado_at = NOW() WHERE id = ?`,
        [reserva.id]
      );

      const neto = Number(reserva.escrow_neto_oferente) || Math.round(Number(reserva.precio_total) * 0.85);

      emailService.sendEscrowLiberadoAdmin(adminEmail, {
        reservaId:      reserva.id,
        espacioNombre:  reserva.espacio_nombre,
        oferenteNombre: reserva.oferente_nombre,
        oferenteCbu:    reserva.oferente_cbu || '(sin CBU/alias registrado)',
        monto:          neto,
        demandanteNombre: reserva.usuario_nombre,
        autoRelease:    true,
      }).catch(e => console.warn(`[escrow] Email admin reserva ${reserva.id}:`, e.message));

      emailService.sendAccesoConfirmadoOferente(reserva.oferente_email, reserva.oferente_nombre, {
        espacioNombre: reserva.espacio_nombre,
        monto:         neto,
        reservaId:     reserva.id,
        autoRelease:   true,
      }).catch(e => console.warn(`[escrow] Email oferente reserva ${reserva.id}:`, e.message));

      console.log(`[escrow] Reserva ${reserva.id} liberada — $${neto} → ${reserva.oferente_nombre}`);
    } catch (e) {
      console.error(`[escrow] Error procesando reserva ${reserva.id}:`, e.message);
    }
  }
}

function iniciarCronEscrow() {
  // Cada hora, en el minuto 30
  cron.schedule('30 * * * *', () => {
    procesarEscrowAutorelease().catch(e => console.error('[escrow] Error cron:', e.message));
  });
  console.log('✅ Cron escrow iniciado (cada hora :30)');
}

module.exports = { iniciarCronEscrow };
