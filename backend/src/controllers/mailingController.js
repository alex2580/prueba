const { query, queryOne } = require('../db/connection');
const { sendNewsletter } = require('../services/emailService');

// ── Bootstrap ──────────────────────────────────────────────────
async function initTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS mailing_campanas (
      id              VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
      nombre          VARCHAR(255) NOT NULL,
      asunto          VARCHAR(500) NOT NULL,
      cuerpo_html     LONGTEXT     NOT NULL,
      destinatarios   ENUM('todos','oferentes','demandantes') NOT NULL DEFAULT 'todos',
      estado          ENUM('borrador','programada','enviando','enviada') NOT NULL DEFAULT 'borrador',
      enviada_en      DATETIME     NULL,
      total_enviados  INT          NOT NULL DEFAULT 0,
      prog_activa     TINYINT(1)   NOT NULL DEFAULT 0,
      prog_tipo       ENUM('unica','semanal','mensual') NOT NULL DEFAULT 'unica',
      prog_fecha      DATE         NULL,
      prog_hora       VARCHAR(5)   NOT NULL DEFAULT '09:00',
      prog_dia_semana TINYINT      NULL,
      prog_dia_mes    TINYINT      NULL,
      prog_ultimo_envio DATETIME   NULL,
      creado_por      VARCHAR(36)  NOT NULL,
      created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS mailing_log (
      id          VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
      campana_id  VARCHAR(36)  NOT NULL,
      email       VARCHAR(255) NOT NULL,
      nombre      VARCHAR(255) NOT NULL DEFAULT '',
      estado      ENUM('ok','error') NOT NULL DEFAULT 'ok',
      error_msg   TEXT         NULL,
      enviado_en  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_campana (campana_id),
      INDEX idx_enviado (enviado_en)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

// ── Helpers ────────────────────────────────────────────────────
function recipientsWhere(dest) {
  if (dest === 'oferentes')   return `activo = 1 AND tipo = 'oferente'`;
  if (dest === 'demandantes') return `activo = 1 AND tipo = 'demandante'`;
  return `activo = 1 AND tipo IN ('oferente','demandante')`;
}

async function sendCampana(campana) {
  const usuarios = await query(
    `SELECT id, nombre, email FROM usuarios WHERE ${recipientsWhere(campana.destinatarios)}`
  );

  await query(`UPDATE mailing_campanas SET estado = 'enviando' WHERE id = ?`, [campana.id]);

  let ok = 0, err = 0;
  for (const u of usuarios) {
    try {
      await sendNewsletter(u.email, u.nombre, {
        asunto: campana.asunto,
        cuerpoHtml: campana.cuerpo_html,
      });
      await query(
        `INSERT INTO mailing_log (campana_id, email, nombre, estado) VALUES (?, ?, ?, 'ok')`,
        [campana.id, u.email, u.nombre || '']
      );
      ok++;
    } catch (e) {
      await query(
        `INSERT INTO mailing_log (campana_id, email, nombre, estado, error_msg) VALUES (?, ?, ?, 'error', ?)`,
        [campana.id, u.email, u.nombre || '', e.message]
      );
      err++;
    }
  }

  await query(
    `UPDATE mailing_campanas
     SET estado = 'enviada', enviada_en = NOW(),
         total_enviados = total_enviados + ?,
         prog_ultimo_envio = NOW()
     WHERE id = ?`,
    [ok, campana.id]
  );

  return { ok, err, total: usuarios.length };
}

// ── Controllers ────────────────────────────────────────────────

// GET /api/mailing/campanas
async function listar(req, res, next) {
  try {
    await initTables();
    const rows = await query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM mailing_log l WHERE l.campana_id = c.id AND l.estado = 'ok') AS enviados_ok,
              (SELECT COUNT(*) FROM mailing_log l WHERE l.campana_id = c.id AND l.estado = 'error') AS enviados_err
       FROM mailing_campanas c ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
}

// POST /api/mailing/campanas
async function crear(req, res, next) {
  try {
    await initTables();
    const { nombre, asunto, cuerpo_html, destinatarios = 'todos' } = req.body;
    if (!nombre?.trim() || !asunto?.trim() || !cuerpo_html?.trim()) {
      return res.status(400).json({ error: 'nombre, asunto y cuerpo_html son requeridos' });
    }
    const id = require('crypto').randomUUID();
    await query(
      `INSERT INTO mailing_campanas (id, nombre, asunto, cuerpo_html, destinatarios, creado_por)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, nombre.trim(), asunto.trim(), cuerpo_html, destinatarios, req.user.id]
    );
    const campana = await queryOne(`SELECT * FROM mailing_campanas WHERE id = ?`, [id]);
    res.status(201).json(campana);
  } catch (err) { next(err); }
}

// PATCH /api/mailing/campanas/:id
async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    const {
      nombre, asunto, cuerpo_html, destinatarios,
      prog_activa, prog_tipo, prog_fecha, prog_hora,
      prog_dia_semana, prog_dia_mes,
    } = req.body;

    const c = await queryOne(`SELECT * FROM mailing_campanas WHERE id = ?`, [id]);
    if (!c) return res.status(404).json({ error: 'Campaña no encontrada' });

    const nuevoEstado = prog_activa ? 'programada' : (c.estado === 'programada' ? 'borrador' : c.estado);

    await query(
      `UPDATE mailing_campanas SET
        nombre          = COALESCE(?, nombre),
        asunto          = COALESCE(?, asunto),
        cuerpo_html     = COALESCE(?, cuerpo_html),
        destinatarios   = COALESCE(?, destinatarios),
        estado          = ?,
        prog_activa     = COALESCE(?, prog_activa),
        prog_tipo       = COALESCE(?, prog_tipo),
        prog_fecha      = ?,
        prog_hora       = COALESCE(?, prog_hora),
        prog_dia_semana = ?,
        prog_dia_mes    = ?,
        updated_at      = NOW()
       WHERE id = ?`,
      [
        nombre ?? null, asunto ?? null, cuerpo_html ?? null, destinatarios ?? null,
        nuevoEstado,
        prog_activa ?? null, prog_tipo ?? null,
        prog_fecha ?? null,
        prog_hora ?? null,
        prog_dia_semana ?? null,
        prog_dia_mes ?? null,
        id,
      ]
    );

    const updated = await queryOne(`SELECT * FROM mailing_campanas WHERE id = ?`, [id]);
    res.json(updated);
  } catch (err) { next(err); }
}

// DELETE /api/mailing/campanas/:id
async function eliminar(req, res, next) {
  try {
    const { id } = req.params;
    await query(`DELETE FROM mailing_campanas WHERE id = ?`, [id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// POST /api/mailing/campanas/:id/enviar
async function enviar(req, res, next) {
  try {
    const { id } = req.params;
    const campana = await queryOne(`SELECT * FROM mailing_campanas WHERE id = ?`, [id]);
    if (!campana) return res.status(404).json({ error: 'Campaña no encontrada' });

    const result = await sendCampana(campana);
    res.json({ ok: true, ...result });
  } catch (err) { next(err); }
}

// GET /api/mailing/campanas/:id/log
async function verLog(req, res, next) {
  try {
    const { id } = req.params;
    const rows = await query(
      `SELECT * FROM mailing_log WHERE campana_id = ? ORDER BY enviado_en DESC LIMIT 500`,
      [id]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

// GET /api/mailing/preview-destinatarios?dest=todos|oferentes|demandantes
async function previewDestinatarios(req, res, next) {
  try {
    await initTables();
    const dest = req.query.dest || 'todos';
    const rows = await query(
      `SELECT COUNT(*) AS total FROM usuarios WHERE ${recipientsWhere(dest)}`
    );
    res.json({ total: rows[0].total });
  } catch (err) { next(err); }
}

module.exports = { listar, crear, actualizar, eliminar, enviar, verLog, previewDestinatarios, initTables, sendCampana };
