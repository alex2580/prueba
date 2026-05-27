const { query } = require('../db/connection');

// GET /api/favoritos — espacios completos del usuario
async function listar(req, res, next) {
  try {
    const espacios = await query(
      `SELECT e.id, e.nombre, e.direccion, e.barrio, e.m2, e.tipo,
              e.precio_dia, e.precio_mes, e.descripcion, e.moneda,
              e.lat, e.lng, e.disponible, e.rating, e.reviews_count,
              e.reservas_mes, e.badge,
              (SELECT url FROM espacio_fotos ef WHERE ef.espacio_id = e.id ORDER BY ef.orden LIMIT 1) AS img_principal
       FROM favoritos f
       JOIN espacios e ON e.id = f.espacio_id
       WHERE f.usuario_id = ? AND e.activo = TRUE
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );

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

    res.json(espacios.map(e => ({
      ...e,
      moneda: e.moneda || 'ARS',
      imgs: fotoMap[e.id] || (e.img_principal ? [e.img_principal] : []),
    })));
  } catch (err) {
    next(err);
  }
}

// GET /api/favoritos/ids — solo IDs para inicializar el estado en el cliente
async function listarIds(req, res, next) {
  try {
    const rows = await query(
      'SELECT espacio_id FROM favoritos WHERE usuario_id = ?',
      [req.user.id]
    );
    res.json(rows.map(r => r.espacio_id));
  } catch (err) {
    next(err);
  }
}

// POST /api/favoritos
async function agregar(req, res, next) {
  try {
    const { espacio_id } = req.body;
    if (!espacio_id) return res.status(400).json({ error: 'espacio_id requerido' });
    await query(
      'INSERT IGNORE INTO favoritos (usuario_id, espacio_id) VALUES (?, ?)',
      [req.user.id, espacio_id]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/favoritos/:espacio_id
async function eliminar(req, res, next) {
  try {
    await query(
      'DELETE FROM favoritos WHERE usuario_id = ? AND espacio_id = ?',
      [req.user.id, req.params.espacio_id]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, listarIds, agregar, eliminar };
