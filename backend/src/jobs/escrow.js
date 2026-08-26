const cron = require('node-cron');
const { query } = require('../db/connection');

async function procesarEscrowAutorelease() {
  let reservas;
  try {
    reservas = await query(`
      SELECT r.*,
             e.nombre AS espacio_nombre, e.oferente_id AS oferente_id,
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

  const emailService       = require('../services/emailService');
  const ledgerService      = require('../services/ledgerService');
  const mercadopagoService = require('../services/mercadopagoService');
  const { archivarConversacion } = require('../controllers/chatController');
  const adminEmail    = process.env.ADMIN_EMAILS || 'contacto@todasmiscosas.com';

  for (const reserva of reservas) {
    try {
      await query(
        `UPDATE reservas SET escrow_liberado = 1, escrow_liberado_at = NOW() WHERE id = ?`,
        [reserva.id]
      );

      archivarConversacion(reserva.espacio_id, reserva.usuario_id)
        .catch(e => console.warn(`[escrow] Chat archivar reserva ${reserva.id}:`, e.message));

      // Registro contable: tmc.escrow → proveedor (85%) + tmc.comision (15%)
      // (mismo movimiento que confirmarAcceso, acá disparado por el cron en vez del cliente)
      await ledgerService.registrarLiberacion(
        reserva.id, reserva.oferente_id, reserva.precio_total,
        `Auto-liberación 48hs — ${reserva.espacio_nombre}`
      ).catch(e => console.warn(`[escrow] Ledger liberacion reserva ${reserva.id}:`, e.message));

      const neto = Number(reserva.escrow_neto_oferente) || Math.round(Number(reserva.precio_total) * 0.85);

      // Igual que en confirmarAcceso: transferencia automática al alias de MP
      // del proveedor, con el mismo fallback al aviso manual si falla.
      let payoutOk = false;
      try {
        const payout = await mercadopagoService.transferirDinero({
          alias: reserva.oferente_cbu,
          monto: neto,
          referencia: reserva.id,
          descripcion: `Auto-liberación 48hs — ${reserva.espacio_nombre}`,
        });
        await query(
          `UPDATE reservas SET payout_estado = 'transferido', payout_mp_id = ? WHERE id = ?`,
          [String(payout.id), reserva.id]
        );
        payoutOk = true;
      } catch (e) {
        console.warn(`[escrow] Transferencia automática falló reserva ${reserva.id}:`, e.message);
        await query(
          `UPDATE reservas SET payout_estado = 'fallido', payout_error = ? WHERE id = ?`,
          [String(e.message).slice(0, 255), reserva.id]
        ).catch(() => {});
      }

      emailService.sendEscrowLiberadoAdmin(adminEmail, {
        reservaId:      reserva.id,
        espacioNombre:  reserva.espacio_nombre,
        oferenteNombre: reserva.oferente_nombre,
        oferenteCbu:    reserva.oferente_cbu || '(sin CBU/alias registrado)',
        monto:          neto,
        demandanteNombre: reserva.usuario_nombre,
        autoRelease:    true,
        payoutOk,
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
