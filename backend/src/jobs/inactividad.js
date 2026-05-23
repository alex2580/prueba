/**
 * Cron job diario: desactiva publicaciones que llevan más de 90 días sin actividad.
 * Se ejecuta todos los días a las 08:00 hora Argentina.
 *
 * Lógica:
 *   - Busca espacios activos donde COALESCE(ultima_actividad, created_at) < NOW() - 90 días
 *   - Les pone activo = FALSE, inactiva_auto = 1
 *   - Envía email al oferente avisando que puede reactivarla desde el panel
 */
const cron = require('node-cron');
const { query } = require('../db/connection');
const { sendPublicacionDesactivada } = require('../services/emailService');

const DIAS_INACTIVIDAD = 90;

async function procesarInactividad() {
  console.log('[inactividad] Iniciando proceso diario —', new Date().toISOString());

  try {
    const espacios = await query(
      `SELECT e.id, e.nombre,
              u.nombre AS oferente_nombre, u.email AS oferente_email
       FROM espacios e
       JOIN usuarios u ON e.oferente_id = u.id
       WHERE e.activo = TRUE
         AND e.inactiva_auto = 0
         AND COALESCE(e.ultima_actividad, e.created_at) < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [DIAS_INACTIVIDAD]
    );

    console.log(`[inactividad] Encontrados ${espacios.length} espacios a desactivar`);

    for (const esp of espacios) {
      try {
        await query(
          'UPDATE espacios SET activo = FALSE, inactiva_auto = 1 WHERE id = ?',
          [esp.id]
        );
        await sendPublicacionDesactivada(esp.oferente_email, esp.oferente_nombre, {
          espacioNombre: esp.nombre,
          diasInactivo: DIAS_INACTIVIDAD,
        });
        console.log(`[inactividad] ✅ Desactivado: "${esp.nombre}" (${esp.oferente_email})`);
      } catch (e) {
        console.warn(`[inactividad] ❌ Error procesando espacio ${esp.id}:`, e.message);
      }
    }
  } catch (e) {
    console.error('[inactividad] Error en proceso:', e.message);
  }

  console.log('[inactividad] Proceso completado.');
}

function iniciarCronInactividad() {
  cron.schedule('0 8 * * *', procesarInactividad, {
    timezone: 'America/Argentina/Buenos_Aires',
  });
  console.log('[inactividad] Cron programado — todos los días 08:00 Argentina');
}

module.exports = { iniciarCronInactividad, procesarInactividad };
