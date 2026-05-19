const { query, queryOne } = require('../db/connection');

// ── Bootstrap tables ───────────────────────────────────────────
async function initTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS admin_notificaciones (
      id          VARCHAR(36)   PRIMARY KEY,
      tipo        VARCHAR(50)   NOT NULL,
      mensaje     TEXT          NOT NULL,
      fecha       DATETIME      NOT NULL,
      leido       TINYINT(1)    DEFAULT 0,
      datos       JSON,
      created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS admin_consultas (
      id          VARCHAR(36)   PRIMARY KEY,
      nombre      VARCHAR(255)  NOT NULL,
      email       VARCHAR(255)  NOT NULL,
      asunto      VARCHAR(255)  NOT NULL,
      mensaje     TEXT          NOT NULL,
      tipo        ENUM('consulta','queja','sugerencia') NOT NULL DEFAULT 'consulta',
      estado      ENUM('pendiente','respondida','resuelta') NOT NULL DEFAULT 'pendiente',
      respuesta   TEXT,
      fecha       DATETIME      NOT NULL,
      created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS admin_campanas (
      id           VARCHAR(36)  PRIMARY KEY,
      titulo       VARCHAR(255) NOT NULL,
      descripcion  TEXT,
      tipo         VARCHAR(50)  NOT NULL DEFAULT 'comunicado',
      fecha_inicio DATE         NOT NULL,
      fecha_fin    DATE         NOT NULL,
      activa       TINYINT(1)   DEFAULT 1,
      color        VARCHAR(20)  DEFAULT '#e8622a',
      created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Call on module load
initTables().catch(err => console.error('[admin] initTables error:', err));

// ── Notificaciones ─────────────────────────────────────────────

// GET /api/admin/notificaciones
async function getNotificaciones(req, res, next) {
  try {
    const rows = await query(
      'SELECT * FROM admin_notificaciones ORDER BY fecha DESC LIMIT 200'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/notificaciones/:id/leido
async function marcarLeido(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      'UPDATE admin_notificaciones SET leido = 1 WHERE id = ?',
      [id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Notificación no encontrada' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ── Consultas ──────────────────────────────────────────────────

// POST /api/admin/consultas  (public)
async function crearConsulta(req, res, next) {
  try {
    const { nombre, email, asunto, mensaje, tipo } = req.body;
    if (!nombre || !email || !asunto || !mensaje) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO admin_consultas (id, nombre, email, asunto, mensaje, tipo, fecha)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [id, nombre, email, asunto, mensaje, tipo || 'consulta']
    );
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/consultas
async function getConsultas(req, res, next) {
  try {
    const rows = await query(
      'SELECT * FROM admin_consultas ORDER BY fecha DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/consultas/:id/responder
async function responderConsulta(req, res, next) {
  try {
    const { id } = req.params;
    const { respuesta } = req.body;
    if (!respuesta) return res.status(400).json({ error: 'Respuesta requerida' });
    const result = await query(
      `UPDATE admin_consultas SET respuesta = ?, estado = 'respondida' WHERE id = ?`,
      [respuesta, id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Consulta no encontrada' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/consultas/:id/estado
async function actualizarEstadoConsulta(req, res, next) {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    if (!['pendiente', 'respondida', 'resuelta'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    const result = await query(
      'UPDATE admin_consultas SET estado = ? WHERE id = ?',
      [estado, id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Consulta no encontrada' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ── Campañas ───────────────────────────────────────────────────

// GET /api/admin/campanas
async function getCampanas(req, res, next) {
  try {
    const rows = await query(
      'SELECT * FROM admin_campanas ORDER BY fecha_inicio DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/campanas
async function crearCampana(req, res, next) {
  try {
    const { titulo, descripcion, tipo, fecha_inicio, fecha_fin, color } = req.body;
    if (!titulo || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO admin_campanas (id, titulo, descripcion, tipo, fecha_inicio, fecha_fin, color)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, titulo, descripcion || '', tipo || 'comunicado', fecha_inicio, fecha_fin, color || '#e8622a']
    );
    const campana = await queryOne('SELECT * FROM admin_campanas WHERE id = ?', [id]);
    res.status(201).json(campana);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/campanas/:id
async function eliminarCampana(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM admin_campanas WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Campaña no encontrada' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotificaciones,
  marcarLeido,
  crearConsulta,
  getConsultas,
  responderConsulta,
  actualizarEstadoConsulta,
  getCampanas,
  crearCampana,
  eliminarCampana,
};
