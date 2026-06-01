/**
 * Cron diario 09:00 Argentina:
 *   - Vence publicaciones cuya fecha_vencimiento llegó → activo=FALSE, vencida=1
 *   - Envía aviso al oferente cuando faltan exactamente 30 días
 */
const cron = require('node-cron');
const { query } = require('../db/connection');
const { sendAvisoVencimientoPublicacion, sendPublicacionVencida } = require('../services/emailService');

async function procesarVencimientos() {
  console.log('[vencimiento] Iniciando proceso diario —', new Date().toISOString());

  try {
    // ── 1. Expirar publicaciones vencidas ──────────────────────────
    const vencidas = await query(`
      SELECT e.id, e.nombre,
             u.nombre AS oferente_nombre, u.email AS oferente_email
      FROM espacios e
      JOIN usuarios u ON e.oferente_id = u.id
      WHERE e.activo = TRUE
        AND e.vencida = 0
        AND e.fecha_vencimiento IS NOT NULL
        AND e.fecha_vencimiento < CURDATE()
    `);

    for (const esp of vencidas) {
      try {
        await query(
          'UPDATE espacios SET activo = FALSE, vencida = 1, disponible = FALSE WHERE id = ?',
          [esp.id]
        );
        await sendPublicacionVencida(esp.oferente_email, esp.oferente_nombre, {
          espacioNombre: esp.nombre,
        });
        console.log(`[vencimiento] ✅ Vencida: "${esp.nombre}" (${esp.oferente_email})`);
      } catch (e) {
        console.warn(`[vencimiento] ❌ Error expirando espacio ${esp.id}:`, e.message);
      }
    }

    // ── 2. Avisos a 30 días ────────────────────────────────────────
    const proximas = await query(`
      SELECT e.id, e.nombre, e.fecha_vencimiento,
             u.nombre AS oferente_nombre, u.email AS oferente_email
      FROM espacios e
      JOIN usuarios u ON e.oferente_id = u.id
      WHERE e.activo = TRUE
        AND e.vencida = 0
        AND e.aviso_vencimiento_enviado = 0
        AND e.fecha_vencimiento IS NOT NULL
        AND DATEDIFF(e.fecha_vencimiento, CURDATE()) = 30
    `);

    for (const esp of proximas) {
      try {
        const fecha = new Date(esp.fecha_vencimiento).toLocaleDateString('es-AR', {
          day: '2-digit', month: 'long', year: 'numeric',
        });
        await sendAvisoVencimientoPublicacion(esp.oferente_email, esp.oferente_nombre, {
          espacioNombre: esp.nombre,
          fechaVencimiento: fecha,
        });
        await query(
          'UPDATE espacios SET aviso_vencimiento_enviado = 1 WHERE id = ?',
          [esp.id]
        );
        console.log(`[vencimiento] 📧 Aviso 30d enviado: "${esp.nombre}" (${esp.oferente_email})`);
      } catch (e) {
        console.warn(`[vencimiento] ❌ Error enviando aviso espacio ${esp.id}:`, e.message);
      }
    }
  } catch (e) {
    console.error('[vencimiento] Error en proceso:', e.message);
  }

  console.log('[vencimiento] Proceso completado.');
}

function iniciarCronVencimiento() {
  cron.schedule('0 9 * * *', procesarVencimientos, {
    timezone: 'America/Argentina/Buenos_Aires',
  });
  console.log('[vencimiento] Cron programado — todos los días 09:00 Argentina');
}

module.exports = { iniciarCronVencimiento, procesarVencimientos };
