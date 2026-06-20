const { query, queryOne, transaction } = require('../db/connection');
const { validationResult } = require('express-validator');
const { uploadFile } = require('../services/supabaseService');
require('dotenv').config();

function parseJsonFields(espacio) {
  if (espacio.disponibilidad && typeof espacio.disponibilidad === 'string') {
    try { espacio.disponibilidad = JSON.parse(espacio.disponibilidad); } catch (_) { espacio.disponibilidad = null; }
  }
  if (espacio.seguridad && typeof espacio.seguridad === 'string') {
    try { espacio.seguridad = JSON.parse(espacio.seguridad); } catch (_) { espacio.seguridad = null; }
  }
  return espacio;
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
  return parseJsonFields(espacio);
}

// GET /api/espacios
async function listar(req, res, next) {
  try {
    const { barrio, tipo, precio_max, precio_min, disponible, q, periodo, con_seguridad, pais, rating_min, seguridad_min, con_cupo } = req.query;

    let sql = `
      SELECT e.id, e.nombre, e.direccion, e.barrio, e.m2, e.tipo,
             e.precio_dia, e.precio_mes, e.descripcion,
             e.lat, e.lng, e.disponible, e.cupo_disponible, e.rating, e.reviews_count,
             e.reservas_mes, e.badge, e.created_at,
             u.nombre AS oferente_nombre, u.email AS oferente_email, u.tel AS oferente_tel,
             (SELECT url FROM espacio_fotos ef WHERE ef.espacio_id = e.id ORDER BY ef.orden LIMIT 1) AS img_principal
      FROM espacios e
      JOIN usuarios u ON e.oferente_id = u.id
      WHERE e.activo = TRUE
    `;
    const params = [];

    if (barrio)     { sql += ' AND e.barrio = ?';  params.push(barrio); }
    if (tipo)       { sql += ' AND e.tipo = ?';    params.push(tipo); }

    sql += ' AND e.precio_dia > 0';
    if (precio_max) { sql += ' AND e.precio_dia <= ?'; params.push(Number(precio_max)); }
    if (precio_min) { sql += ' AND e.precio_dia >= ?'; params.push(Number(precio_min)); }

    if (disponible !== undefined) { sql += ' AND e.disponible = ?'; params.push(disponible === 'true' ? 1 : 0); }
    if (con_cupo === 'true')      { sql += ' AND e.cupo_disponible = 1'; }
    if (con_seguridad === 'true') {
      sql += " AND e.seguridad IS NOT NULL AND e.seguridad NOT IN ('null', '{}', '')";
    }
    if (pais) { sql += ' AND e.pais = ?'; params.push(pais); }
    if (rating_min) { sql += ' AND e.rating >= ?'; params.push(Number(rating_min)); }
    if (seguridad_min) {
      sql += ` AND ROUND((
        IF(JSON_UNQUOTE(JSON_EXTRACT(e.seguridad,'$.techo_impermeable'))  = 'true', 1, 0) +
        IF(JSON_UNQUOTE(JSON_EXTRACT(e.seguridad,'$.cerradura'))          = 'true', 1, 0) +
        IF(JSON_UNQUOTE(JSON_EXTRACT(e.seguridad,'$.camaras'))            = 'true', 1, 0) +
        IF(JSON_UNQUOTE(JSON_EXTRACT(e.seguridad,'$.iluminacion'))        = 'true', 1, 0) +
        IF(JSON_UNQUOTE(JSON_EXTRACT(e.seguridad,'$.acceso_controlado'))  = 'true', 1, 0) +
        IF(JSON_UNQUOTE(JSON_EXTRACT(e.seguridad,'$.seco_ventilado'))     = 'true', 1, 0) +
        IF(JSON_UNQUOTE(JSON_EXTRACT(e.seguridad,'$.acceso_24h'))         = 'true', 1, 0) +
        IF(JSON_UNQUOTE(JSON_EXTRACT(e.seguridad,'$.extintor'))           = 'true', 1, 0)
      ) / 8 * 5) >= ?`;
      params.push(Number(seguridad_min));
    }
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
      cupo_disponible: e.cupo_disponible !== 0,
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

    const { nombre, direccion, barrio, m2, tipo, categoria, precio_dia, descripcion, lat, lng, disponibilidad, seguridad, moneda } = req.body;

    // Base INSERT — always works regardless of migration state
    await transaction(async (conn) => {
      await conn.execute(
        `INSERT INTO espacios (nombre, direccion, barrio, m2, tipo, precio_dia, precio_mes, descripcion, oferente_id, lat, lng)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
        [nombre, direccion, barrio || '', m2 ?? 0, tipo || 'exclusivo',
         precio_dia || 0, descripcion || '', req.user.id, lat || -34.6037, lng || -58.3816]
      );
    });

    const nuevo = await queryOne(
      'SELECT * FROM espacios WHERE oferente_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    if (!nuevo) return res.status(500).json({ error: 'Error al crear el espacio' });

    // Optional UPDATE for newer columns (only if they exist in DB)
    try {
      const oferente = await queryOne('SELECT pais FROM usuarios WHERE id = ?', [req.user.id]);
      await query(
        `UPDATE espacios SET categoria = ?, disponibilidad = ?, seguridad = ?, moneda = ?, pais = ?,
                fecha_vencimiento = DATE_ADD(NOW(), INTERVAL 90 DAY)
         WHERE id = ?`,
        [categoria || null,
         disponibilidad ? JSON.stringify(disponibilidad) : null,
         seguridad ? JSON.stringify(seguridad) : null,
         moneda || 'ARS',
         oferente?.pais || 'Argentina',
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

    const { nombre, direccion, barrio, m2, tipo, precio_dia, descripcion, lat, lng, disponible, moneda, categoria, disponibilidad } = req.body;

    const nuevoDisponible = disponible !== undefined ? Boolean(disponible) : espacio.disponible;
    await query(
      `UPDATE espacios SET nombre=?, direccion=?, barrio=?, m2=?, tipo=?, precio_dia=?,
       descripcion=?, lat=?, lng=?, disponible=?,
       activo = IF(?, TRUE, activo)
       WHERE id=?`,
      [nombre, direccion, barrio, m2, tipo, precio_dia, descripcion || '', lat, lng,
       nuevoDisponible,
       nuevoDisponible,
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

    const reservaActiva = await queryOne(
      `SELECT id FROM reservas WHERE espacio_id = ? AND estado IN ('pagada', 'activa') LIMIT 1`,
      [req.params.id]
    );
    if (reservaActiva) {
      return res.status(400).json({ error: 'No podés eliminar este espacio mientras tenga una reserva activa o pagada.' });
    }

    await query(
      'UPDATE espacios SET activo = FALSE, eliminado_por_oferente = TRUE, eliminado_at = NOW() WHERE id = ?',
      [req.params.id]
    );
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
      console.log(`[subirFotos] uploading ${file.originalname} (${file.size} bytes) to Supabase…`);
      const url = await uploadFile(file.buffer, 'espacios', file.originalname);
      console.log(`[subirFotos] uploaded → ${url}`);
      await query(
        'INSERT INTO espacio_fotos (espacio_id, url, orden) VALUES (?, ?, ?)',
        [espacio.id, url, orden++]
      );
      urls.push(url);
    }

    res.json({ urls });
  } catch (err) {
    console.error('[subirFotos] ERROR:', err.message);
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
       WHERE e.oferente_id = ? AND (e.activo = TRUE OR e.vencida = 1)
       GROUP BY e.id
       ORDER BY e.created_at DESC`,
      [req.user.id]
    );
    res.json(espacios.map(e => ({
      ...parseJsonFields(e),
      cupo_disponible: e.cupo_disponible !== 0,
    })));
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
    const espacio = await queryOne('SELECT tipo FROM espacios WHERE id = ?', [req.params.id]);
    // Compartidos: múltiples clientes coexisten — el calendario nunca bloquea por reservas previas
    if (espacio?.tipo === 'compartido') return res.json({ fechas: [] });

    const reservas = await query(
      `SELECT fecha_desde, fecha_hasta, modo, dias_json FROM reservas
       WHERE espacio_id = ? AND estado IN ('pendiente','confirmada','pagada','activa')`,
      [req.params.id]
    );
    const ocupadas = new Set();
    reservas.forEach(({ fecha_desde, fecha_hasta, modo, dias_json }) => {
      if (modo === 'dia' && dias_json) {
        // Reserva de días sueltos: solo bloquear los días exactos seleccionados
        try {
          JSON.parse(dias_json).forEach(d => ocupadas.add(d));
        } catch (_) {}
      } else {
        // Reserva de rango: expandir todos los días del rango
        const fd = String(fecha_desde).slice(0, 10);
        const fh = String(fecha_hasta).slice(0, 10);
        const d = new Date(fd + 'T12:00:00');
        const hasta = new Date(fh + 'T12:00:00');
        while (d <= hasta) {
          ocupadas.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
          d.setDate(d.getDate() + 1);
        }
      }
    });
    res.json({ fechas: [...ocupadas] });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/espacios/:id/cupo  — oferente activa/desactiva disponibilidad de compartido
async function toggleCupo(req, res, next) {
  try {
    const espacio = await queryOne('SELECT id, oferente_id, tipo, cupo_disponible FROM espacios WHERE id = ?', [req.params.id]);
    if (!espacio) return res.status(404).json({ error: 'Espacio no encontrado' });
    if (espacio.oferente_id !== req.user.id && req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'No tenés permiso para modificar este espacio' });
    }
    if (espacio.tipo !== 'compartido') {
      return res.status(400).json({ error: 'Solo los espacios compartidos tienen control de cupo' });
    }
    const nuevo = req.body.cupo_disponible ? 1 : 0;
    await query('UPDATE espacios SET cupo_disponible = ? WHERE id = ?', [nuevo, espacio.id]);
    res.json({ ok: true, cupo_disponible: nuevo === 1 });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar, subirFotos, misEspacios, reactivar, fechasOcupadas, toggleCupo };
