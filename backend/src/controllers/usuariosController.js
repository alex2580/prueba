const { query, queryOne } = require('../db/connection');
const { validationResult } = require('express-validator');
const supabaseService = require('../services/supabaseService');

// GET /api/usuarios/me
async function perfil(req, res, next) {
  try {
    const usuario = await queryOne(
      'SELECT id, nombre, email, tel, tipo, verificado, avatar_url, created_at, direccion, lat, lng FROM usuarios WHERE id = ?',
      [req.user.id]
    );
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    next(err);
  }
}

// PUT /api/usuarios/me
async function actualizar(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: 'Datos inválidos', details: errors.array() });
    }

    const { nombre, tel, direccion, lat, lng } = req.body;
    await query(
      'UPDATE usuarios SET nombre = ?, tel = ? WHERE id = ?',
      [nombre, tel || '', req.user.id]
    );
    // Update profile address if columns exist
    try {
      if (direccion !== undefined) {
        await query(
          'UPDATE usuarios SET direccion = ?, lat = ?, lng = ? WHERE id = ?',
          [direccion || null, lat || null, lng || null, req.user.id]
        );
      }
    } catch (_) { /* columns may not exist yet */ }

    const updated = await queryOne(
      'SELECT id, nombre, email, tel, tipo, verificado, avatar_url, direccion, lat, lng FROM usuarios WHERE id = ?',
      [req.user.id]
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// POST /api/usuarios/sync
// Called after Supabase Auth signup to create user record in MySQL
async function sync(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: 'Datos inválidos', details: errors.array() });
    }

    const { supabase_id, nombre, email, tipo, tel } = req.body;

    // Check if already exists
    const existing = await queryOne(
      'SELECT id FROM usuarios WHERE supabase_id = ? OR email = ?',
      [supabase_id, email]
    );

    if (existing) {
      // Update supabase_id if missing
      await query(
        'UPDATE usuarios SET supabase_id = ? WHERE id = ?',
        [supabase_id, existing.id]
      );
      const user = await queryOne(
        'SELECT id, nombre, email, tel, tipo, verificado FROM usuarios WHERE id = ?',
        [existing.id]
      );
      return res.json(user);
    }

    // Auto-promote admin emails
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const tipoFinal = adminEmails.includes(email.toLowerCase()) ? 'admin' : (tipo || 'demandante');

    await query(
      'INSERT INTO usuarios (supabase_id, nombre, email, tipo, tel) VALUES (?, ?, ?, ?, ?)',
      [supabase_id, nombre, email, tipoFinal, tel || '']
    );

    const nuevo = await queryOne(
      'SELECT id, nombre, email, tel, tipo, verificado FROM usuarios WHERE supabase_id = ?',
      [supabase_id]
    );
    res.status(201).json(nuevo);
  } catch (err) {
    next(err);
  }
}

// GET /api/usuarios/:id  (public profile)
async function verPerfil(req, res, next) {
  try {
    const usuario = await queryOne(
      `SELECT u.id, u.nombre, u.tipo, u.verificado, u.avatar_url, u.created_at,
              COUNT(DISTINCT e.id) AS espacios_count,
              AVG(r.rating) AS rating_promedio,
              COUNT(DISTINCT r.id) AS reviews_count
       FROM usuarios u
       LEFT JOIN espacios e ON e.oferente_id = u.id AND e.activo = TRUE
       LEFT JOIN reviews r ON r.espacio_id = e.id
       WHERE u.id = ? AND u.activo = TRUE
       GROUP BY u.id`,
      [req.params.id]
    );
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    next(err);
  }
}

// GET /api/usuarios  (admin only)
async function listar(req, res, next) {
  try {
    const usuarios = await query(
      `SELECT id, nombre, email, tel, tipo, verificado, activo, created_at
       FROM usuarios ORDER BY created_at DESC`
    );
    res.json(usuarios);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/usuarios/:id/tipo  (admin only)
async function cambiarTipo(req, res, next) {
  try {
    const { tipo } = req.body;
    if (!['oferente', 'demandante', 'admin'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido' });
    }
    await query('UPDATE usuarios SET tipo = ? WHERE id = ?', [tipo, req.params.id]);
    res.json({ message: 'Tipo actualizado' });
  } catch (err) {
    next(err);
  }
}

module.exports = { perfil, actualizar, sync, verPerfil, listar, cambiarTipo };
