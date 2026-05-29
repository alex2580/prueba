/**
 * Cron job: revisa cada minuto si hay campañas de mailing programadas para enviar.
 * Soporta envíos únicos (una fecha específica), semanales (día de semana) y mensuales (día del mes).
 * Respeta la hora de Buenos Aires (UTC-3) independientemente del timezone del servidor.
 * Funciona cualquier día incluyendo fines de semana y feriados.
 */
const cron = require('node-cron');
const { query } = require('../db/connection');
const { sendCampana, initTables } = require('../controllers/mailingController');

function horaBA() {
  const now = new Date();
  const ba = new Date(now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
  return {
    hora: `${String(ba.getHours()).padStart(2, '0')}:${String(ba.getMinutes()).padStart(2, '0')}`,
    diaSemana: ba.getDay(),   // 0=Dom .. 6=Sab
    diaMes: ba.getDate(),     // 1-31
    fecha: `${ba.getFullYear()}-${String(ba.getMonth() + 1).padStart(2, '0')}-${String(ba.getDate()).padStart(2, '0')}`,
  };
}

async function procesarMailing() {
  const { hora, diaSemana, diaMes, fecha } = horaBA();

  let campanas;
  try {
    campanas = await query(
      `SELECT * FROM mailing_campanas
       WHERE prog_activa = 1
         AND estado NOT IN ('enviando')
         AND prog_hora = ?
         AND (prog_ultimo_envio IS NULL OR DATE(prog_ultimo_envio) < CURDATE())`,
      [hora]
    );
  } catch {
    return; // tabla puede no existir todavía
  }

  for (const c of campanas) {
    let debeEnviar = false;
    if (c.prog_tipo === 'unica'    && c.prog_fecha    === fecha)      debeEnviar = true;
    if (c.prog_tipo === 'semanal'  && c.prog_dia_semana === diaSemana) debeEnviar = true;
    if (c.prog_tipo === 'mensual'  && c.prog_dia_mes   === diaMes)     debeEnviar = true;

    if (!debeEnviar) continue;

    try {
      const { ok, err } = await sendCampana(c);
      // Para envío único: desactivar después de enviar
      if (c.prog_tipo === 'unica') {
        await query(`UPDATE mailing_campanas SET prog_activa = 0 WHERE id = ?`, [c.id]);
      }
      console.log(`[mailing] "${c.nombre}" → ${ok} enviados, ${err} errores`);
    } catch (e) {
      console.error(`[mailing] Error en campaña "${c.nombre}":`, e.message);
    }
  }
}

function iniciarCronMailing() {
  // Ejecuta cada minuto — checks BA time internally
  cron.schedule('* * * * *', () => {
    procesarMailing().catch(e => console.error('[mailing cron]', e.message));
  });
  console.log('[mailing] Cron de envíos programados iniciado');
}

module.exports = { iniciarCronMailing };
