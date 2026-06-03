/**
 * Cron cada 5 minutos:
 * Busca reservas pendientes/confirmadas de las últimas 24h y las sincroniza
 * contra MercadoPago. Si el webhook no llegó o fue rechazado, este job las rescata.
 */
const cron = require('node-cron');
const { query } = require('../db/connection');
const mercadopagoService = require('../services/mercadopagoService');

async function procesarSyncPagos() {
  let pendientes;
  try {
    pendientes = await query(`
      SELECT * FROM reservas
      WHERE estado IN ('pendiente', 'confirmada')
        AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);
  } catch (e) {
    console.warn('[syncPagos] Error consultando reservas:', e.message);
    return;
  }

  if (!pendientes.length) return;

  console.log(`[syncPagos] Revisando ${pendientes.length} reserva(s) pendiente(s)…`);

  // Importar procesarPagada aquí para evitar dependencia circular en el arranque
  const { procesarPagada } = require('../controllers/pagosController');

  for (const reserva of pendientes) {
    try {
      const payment = await mercadopagoService.buscarPagoPorReferencia(reserva.id);
      if (!payment || payment.status !== 'approved') continue;

      await query(
        'UPDATE reservas SET estado = ?, mp_payment_id = ?, mp_status = ? WHERE id = ?',
        ['pagada', String(payment.id), payment.status, reserva.id]
      );

      const [reservaActualizada] = await query('SELECT * FROM reservas WHERE id = ?', [reserva.id]);
      procesarPagada(reservaActualizada || reserva, payment.id)
        .catch(e => console.warn(`[syncPagos] emails reserva ${reserva.id}:`, e.message));

      console.log(`[syncPagos] ✅ Reserva ${reserva.id} → pagada`);
    } catch (e) {
      console.warn(`[syncPagos] Error reserva ${reserva.id}:`, e.message);
    }
  }
}

function iniciarCronSyncPagos() {
  cron.schedule('*/5 * * * *', procesarSyncPagos);
  console.log('[syncPagos] Cron programado — cada 5 minutos');
}

module.exports = { iniciarCronSyncPagos, procesarSyncPagos };
