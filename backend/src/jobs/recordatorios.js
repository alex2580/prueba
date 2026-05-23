/**
 * Cron job diario: envía recordatorios de vencimiento de reservas activas.
 * Se ejecuta todos los días a las 09:00 hora Argentina (UTC-3 = 12:00 UTC).
 *
 * Lógica:
 *   - Busca reservas con estado='pagada' cuya fecha_hasta sea hoy+5, hoy+2, hoy+1, o hoy.
 *   - Por cada franja, verifica que el recordatorio correspondiente no fue enviado.
 *   - Envía el email y marca la columna como enviada.
 */
const cron = require('node-cron');
const { query } = require('../db/connection');
const emailService = require('../services/emailService');

async function procesarRecordatorios() {
  console.log('[recordatorios] Iniciando proceso diario —', new Date().toISOString());

  const franjas = [
    { dias: 5, col: 'recordatorio_5d', fn: emailService.sendRecordatorio5Dias },
    { dias: 2, col: 'recordatorio_2d', fn: emailService.sendRecordatorio2Dias },
    { dias: 1, col: 'recordatorio_1d', fn: emailService.sendRecordatorio1Dia  },
    { dias: 0, col: 'recordatorio_0d', fn: emailService.sendRecordatorio0Dias },
  ];

  for (const { dias, col, fn } of franjas) {
    try {
      // DATE_ADD(CURDATE(), INTERVAL ? DAY) devuelve la fecha objetivo
      const reservas = await query(
        `SELECT r.id, r.fecha_hasta, r.precio_total,
                u.nombre AS usuario_nombre, u.email AS usuario_email,
                e.nombre AS espacio_nombre
         FROM reservas r
         JOIN usuarios u ON r.usuario_id = u.id
         JOIN espacios e ON r.espacio_id = e.id
         WHERE r.estado = 'pagada'
           AND r.fecha_hasta = DATE_ADD(CURDATE(), INTERVAL ? DAY)
           AND r.${col} = 0`,
        [dias]
      );

      for (const r of reservas) {
        try {
          await fn(r.usuario_email, r.usuario_nombre, {
            espacioNombre: r.espacio_nombre,
            fechaHasta: r.fecha_hasta instanceof Date
              ? r.fecha_hasta.toISOString().slice(0, 10)
              : String(r.fecha_hasta).slice(0, 10),
            reservaId: r.id,
          });
          await query(`UPDATE reservas SET ${col} = 1 WHERE id = ?`, [r.id]);
          console.log(`[recordatorios] ✅ ${dias}d → ${r.usuario_email} (${r.espacio_nombre})`);
        } catch (e) {
          console.warn(`[recordatorios] ❌ ${dias}d → ${r.usuario_email}:`, e.message);
        }
      }
    } catch (e) {
      console.error(`[recordatorios] Error franja ${dias}d:`, e.message);
    }
  }

  console.log('[recordatorios] Proceso completado.');
}

function iniciarCronRecordatorios() {
  // Todos los días a las 09:00 hora Argentina (America/Argentina/Buenos_Aires)
  cron.schedule('0 9 * * *', procesarRecordatorios, {
    timezone: 'America/Argentina/Buenos_Aires',
  });
  console.log('[recordatorios] Cron programado — todos los días 09:00 Argentina');
}

module.exports = { iniciarCronRecordatorios, procesarRecordatorios };
