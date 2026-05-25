const { query, queryOne, transaction } = require('../db/connection');
const { validationResult } = require('express-validator');
const path = require('path');
require('dotenv').config();

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const BASE_URL   = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;

function buildFotoUrl(filename) {
  return `${BASE_URL}/uploads/espacios/${filename}`;
}

async function getEspacioWithFotos(id) {
  const espacio = await queryOne(
    `SELECT e.*, u.nombre AS oferente_nombre, u.email AS oferente_email, u.tel AS oferente_tel
     FROM espacios e
     JOIN usuarios u ON e.oferente_id = u.id
     WHERE e.id = ? AND e.activo = TRUE`,
    [id]
  );
  if (!espacio) return null;

  const fotos = await query(
    'SELECT url FROM espacio_fotos WHERE espacio_id = ? ORDER BY orden ASC',
    [id]
  );
  espacio.imgs = fotos.map(f => f.url);
  return espacio;
}

// GET /api/espacios
async function listar(req, res, next) {
  try {
    const { barrio, tipo, precio_max, precio_min, disponible, q } = req.query;

    let sql = `
      SELECT e.id, e.nombre, e.direccion, e.barrio, e.m2, e.tipo,
             e.precio_dia, e.precio_mes, e.descripcion,
             e.lat, e.lng, e.disponible, e.rating, e.reviews_count,
             e.reservas_mes, e.badge, e.created_at,
             u.nombre AS oferente_nombre, u.email AS oferente_email, u.tel AS oferente_tel,
             (SELECT url FROM espacio_fotos ef WHERE ef.espacio_id = e.id ORDER BY ef.orden LIMIT 1) AS img_principal
      FROM espacios e
      JOIN usuarios u ON e.oferente_id = u.id
      WHERE e.activo = TRUE
    `;
    const params = [];

    if (barrio)      { sql += ' AND e.barrio = ?';               params.push(barrio); }
    if (tipo)        { sql += ' AND e.tipo = ?';                 params.push(tipo); }
    if (precio_max)  { sql += ' AND e.precio_mes <= ?';          params.push(Number(precio_max)); }
    if (precio_min)  { sql += ' AND e.precio_mes >= ?';          params.push(Number(precio_min)); }
    if (disponible !== undefined) { sql += ' AND e.disponible = ?'; params.push(disponible === 'true' ? 1 : 0); }
    if (q) {
      sql += ' AND (e.nombre LIKE ? OR e.descripcion LIKE ? OR e.barrio LIKE ? OR e.direccion LIKE ?)';
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }

    sql += ' ORDER BY e.reservas_mes DESC, e.rating DESC';

    const espacios = await query(sql, params);

    // Build full foto arrays
    const ids = espacios.map(e => e.id);
    let fotoMap = {};
    if (ids.length > 0) {
      const fotos = await query(
        `SELECT espacio_id, url FROM espacio_fotos WHERE espacio_id IN (${ids.map(() => '?').join(',')}) ORDER BY orden ASC`,
        ids
      );
      fotos.forEach(f => {
        if (!fotoMap[f.espacio_id]) fotoMap[f.espacio_id] = [];
        fotoMap[f.espacio_id].push(f.url);
      });
    }

    const result = espacios.map(e => ({
      ...e,
      moneda: e.moneda || 'ARS',
      imgs: fotoMap[e.id] || (e.img_principal ? [e.img_principal] : []),
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}

// GET /api/espacios/:id
async function obtener(req, res, next) {
  try {
    const espacio = await getEspacioWithFotos(req.params.id);
    if (!espacio) return res.status(404).json({ error: 'Espacio no encontrado' });

    const reviews = await query(
      `SELECT r.id, r.rating, r.texto, r.util_count, r.created_at,
              u.nombre AS autor_nombre, u.id AS autor_id
       FROM reviews r
       JOIN usuarios u ON r.autor_id = u.id
       WHERE r.espacio_id = ?
       ORDER BY r.created_at DESC
       LIMIT 20`,
      [espacio.id]
    );

    espacio.reviews_data = reviews;
    res.json(espacio);
  } catch (err) {
    next(err);
  }
}

// POST /api/espacios
async function crear(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: 'Datos inválidos', details: errors.array() });
    }

    const { nombre, direccion, barrio, m2, tipo, categoria, precio_dia, precio_mes, descripcion, lat, lng, disponibilidad, seguridad, moneda } = req.body;

    // Base INSERT — always works regardless of migration state
    await transaction(async (conn) => {
      await conn.execute(
        `INSERT INTO espacios (nombre, direccion, barrio, m2, tipo, precio_dia, precio_mes, descripcion, oferente_id, lat, lng)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nombre, direccion, barrio || '', m2 || null, tipo || 'exclusivo',
         precio_dia || 0, precio_mes || 0, descripcion || '', req.user.id, lat || -34.6037, lng || -58.3816]
      );
    });

    const nuevo = await queryOne(
      'SELECT * FROM espacios WHERE oferente_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    if (!nuevo) return res.status(500).json({ error: 'Error al crear el espacio' });

    // Optional UPDATE for newer columns (only if they exist in DB)
    try {
      await query(
        `UPDATE espacios SET categoria = ?, disponibilidad = ?, seguridad = ?, moneda = ? WHERE id = ?`,
        [categoria || null,
         disponibilidad ? JSON.stringify(disponibilidad) : null,
         seguridad ? JSON.stringify(seguridad) : null,
         moneda || 'ARS',
         nuevo.id]
      );
    } catch (_) {
      // Columns may not exist yet — run migrations on VPS
    }

    res.status(201).json(nuevo);
  } catch (err) {
    next(err);
  }
}

// PUT /api/espacios/:id
async function actualizar(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: 'Datos inválidos', details: errors.array() });
    }

    const espacio = await queryOne('SELECT * FROM espacios WHERE id = ?', [req.params.id]);
    if (!espacio) return res.status(404).json({ error: 'Espacio no encontrado' });
    if (espacio.oferente_id !== req.user.id && req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Sin permisos para modificar este espacio' });
    }

    const { nombre, direccion, barrio, m2, tipo, precio_dia, precio_mes, descripcion, lat, lng, disponible, moneda, categoria, disponibilidad } = req.body;

    await query(
      `UPDATE espacios SET nombre=?, direccion=?, barrio=?, m2=?, tipo=?, precio_dia=?,
       precio_mes=?, descripcion=?, lat=?, lng=?, disponible=?
       WHERE id=?`,
      [nombre, direccion, barrio, m2, tipo, precio_dia, precio_mes, descripcion || '', lat, lng,
       disponible !== undefined ? Boolean(disponible) : espacio.disponible,
       req.params.id]
    );

    // Update newer columns if they exist
    try {
      await query(
        `UPDATE espacios SET moneda = ?, categoria = ?, disponibilidad = ?, ultima_actividad = NOW(), inactiva_auto = 0 WHERE id = ?`,
        [moneda || 'ARS', categoria || null, disponibilidad ? JSON.stringify(disponibilidad) : null, req.params.id]
      );
    } catch (_) { /* columns may not exist yet */ }

    const updated = await getEspacioWithFotos(req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/espacios/:id
async function eliminar(req, res, next) {
  try {
    const espacio = await queryOne('SELECT * FROM espacios WHERE id = ?', [req.params.id]);
    if (!espacio) return res.status(404).json({ error: 'Espacio no encontrado' });
    if (espacio.oferente_id !== req.user.id && req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Sin permisos para eliminar este espacio' });
    }

    await query('UPDATE espacios SET activo = FALSE WHERE id = ?', [req.params.id]);
    res.json({ message: 'Espacio eliminado', id: req.params.id });
  } catch (err) {
    next(err);
  }
}

// POST /api/espacios/:id/fotos
async function subirFotos(req, res, next) {
  try {
    const espacio = await queryOne('SELECT id, oferente_id FROM espacios WHERE id = ?', [req.params.id]);
    if (!espacio) return res.status(404).json({ error: 'Espacio no encontrado' });
    if (espacio.oferente_id !== req.user.id && req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No se enviaron fotos' });
    }

    // Get current max order
    const maxOrden = await queryOne(
      'SELECT COALESCE(MAX(orden), -1) AS max_orden FROM espacio_fotos WHERE espacio_id = ?',
      [espacio.id]
    );
    let orden = (maxOrden?.max_orden ?? -1) + 1;

    const urls = [];
    for (const file of files) {
      const url = `${BASE_URL}/uploads/espacios/${file.filename}`;
      await query(
        'INSERT INTO espacio_fotos (espacio_id, url, orden) VALUES (?, ?, ?)',
        [espacio.id, url, orden++]
      );
      urls.push(url);
    }

    res.json({ urls });
  } catch (err) {
    next(err);
  }
}

// GET /api/espacios/mis-espacios
async function misEspacios(req, res, next) {
  try {
    const espacios = await query(
      `SELECT e.*,
              (SELECT url FROM espacio_fotos ef WHERE ef.espacio_id = e.id ORDER BY ef.orden LIMIT 1) AS img_principal,
              COUNT(DISTINCT r.id) AS total_reservas,
              SUM(CASE WHEN r.estado IN ('confirmada','pagada') THEN r.precio_total ELSE 0 END) AS ingresos_total
       FROM espacios e
       LEFT JOIN reservas r ON e.id = r.espacio_id
       WHERE e.oferente_id = ? AND (e.activo = TRUE OR e.inactiva_auto = 1)
       GROUP BY e.id
       ORDER BY e.created_at DESC`,
      [req.user.id]
    );
    res.json(espacios);
  } catch (err) {
    next(err);
  }
}

// POST /api/espacios/:id/reactivar
async function reactivar(req, res, next) {
  try {
    const espacio = await queryOne(
      'SELECT id, oferente_id, nombre, activo, inactiva_auto FROM espacios WHERE id = ?',
      [req.params.id]
    );
    if (!espacio) return res.status(404).json({ error: 'Espacio no encontrado' });
    if (espacio.oferente_id !== req.user.id && req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    if (!espacio.inactiva_auto) {
      return res.status(400).json({ error: 'Esta publicación no puede reactivarse desde aquí' });
    }

    await query(
      `UPDATE espacios SET activo = TRUE, inactiva_auto = 0, ultima_actividad = NOW(), disponible = TRUE WHERE id = ?`,
      [req.params.id]
    );

    res.json({ ok: true, message: 'Publicación reactivada exitosamente' });
  } catch (err) {
    next(err);
  }
}

async function fechasOcupadas(req, res, next) {
  try {
    const reservas = await query(
      `SELECT fecha_desde, fecha_hasta FROM reservas
       WHERE espacio_id = ? AND estado IN ('confirmada','pagada','activa')`,
      [req.params.id]
    );
    const ocupadas = new Set();
    reservas.forEach(({ fecha_desde, fecha_hasta }) => {
      const desde = new Date(fecha_desde);
      const hasta = new Date(fecha_hasta);
      for (let d = new Date(desde); d <= hasta; d.setDate(d.getDate() + 1)) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        ocupadas.add(`${y}-${m}-${day}`);
      }
    });
    res.json({ fechas: [...ocupadas] });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar, subirFotos, misEspacios, reactivar, fechasOcupadas };
