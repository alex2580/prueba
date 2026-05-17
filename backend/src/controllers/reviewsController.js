const { query, queryOne } = require('../db/connection');
const { validationResult } = require('express-validator');

// GET /api/reviews?espacio_id=xxx
async function listar(req, res, next) {
  try {
    const { espacio_id } = req.query;
    if (!espacio_id) return res.status(400).json({ error: 'espacio_id requerido' });

    const reviews = await query(
      `SELECT r.id, r.rating, r.texto, r.util_count, r.created_at,
              u.id AS autor_id, u.nombre AS autor_nombre, u.avatar_url AS autor_avatar
       FROM reviews r
       JOIN usuarios u ON r.autor_id = u.id
       WHERE r.espacio_id = ?
       ORDER BY r.created_at DESC`,
      [espacio_id]
    );
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

// POST /api/reviews
async function crear(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: 'Datos inválidos', details: errors.array() });
    }

    const { espacio_id, rating, texto } = req.body;

    // Verify espacio exists
    const espacio = await queryOne('SELECT id FROM espacios WHERE id = ? AND activo = TRUE', [espacio_id]);
    if (!espacio) return res.status(404).json({ error: 'Espacio no encontrado' });

    // Check user has a completed reserva for this espacio
    const reserva = await queryOne(
      `SELECT id FROM reservas
       WHERE espacio_id = ? AND usuario_id = ? AND estado IN ('pagada','finalizada')
       LIMIT 1`,
      [espacio_id, req.user.id]
    );
    if (!reserva) {
      return res.status(403).json({ error: 'Solo puedes dejar una reseña después de completar una reserva' });
    }

    // Check hasn't already reviewed
    const existing = await queryOne(
      'SELECT id FROM reviews WHERE espacio_id = ? AND autor_id = ?',
      [espacio_id, req.user.id]
    );
    if (existing) {
      return res.status(409).json({ error: 'Ya dejaste una reseña para este espacio' });
    }

    await query(
      'INSERT INTO reviews (espacio_id, autor_id, rating, texto) VALUES (?, ?, ?, ?)',
      [espacio_id, req.user.id, rating, texto]
    );

    // Recalculate rating
    const stats = await queryOne(
      'SELECT AVG(rating) AS avg_rating, COUNT(*) AS cnt FROM reviews WHERE espacio_id = ?',
      [espacio_id]
    );
    await query(
      'UPDATE espacios SET rating = ?, reviews_count = ? WHERE id = ?',
      [parseFloat(stats.avg_rating).toFixed(2), stats.cnt, espacio_id]
    );

    const nueva = await queryOne(
      `SELECT r.*, u.nombre AS autor_nombre, u.avatar_url AS autor_avatar
       FROM reviews r JOIN usuarios u ON r.autor_id = u.id
       WHERE r.espacio_id = ? AND r.autor_id = ?
       ORDER BY r.created_at DESC LIMIT 1`,
      [espacio_id, req.user.id]
    );
    res.status(201).json(nueva);
  } catch (err) {
    next(err);
  }
}

// POST /api/reviews/:id/util
async function marcarUtil(req, res, next) {
  try {
    await query('UPDATE reviews SET util_count = util_count + 1 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Marcado como útil' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/reviews/:id
async function eliminar(req, res, next) {
  try {
    const review = await queryOne('SELECT * FROM reviews WHERE id = ?', [req.params.id]);
    if (!review) return res.status(404).json({ error: 'Reseña no encontrada' });

    if (review.autor_id !== req.user.id && req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Sin permisos para eliminar esta reseña' });
    }

    await query('DELETE FROM reviews WHERE id = ?', [review.id]);

    // Recalculate rating
    const stats = await queryOne(
      'SELECT AVG(rating) AS avg_rating, COUNT(*) AS cnt FROM reviews WHERE espacio_id = ?',
      [review.espacio_id]
    );
    await query(
      'UPDATE espacios SET rating = ?, reviews_count = ? WHERE id = ?',
      [parseFloat(stats.avg_rating || 0).toFixed(2), stats.cnt || 0, review.espacio_id]
    );

    res.json({ message: 'Reseña eliminada' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, crear, marcarUtil, eliminar };
