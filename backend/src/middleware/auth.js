const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const { queryOne, query } = require('../db/connection');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '',
  { realtime: { transport: ws } }
);

/**
 * Verifica el JWT de Supabase y adjunta el usuario al request.
 * El token debe ir en el header: Authorization: Bearer <token>
 */
async function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  const token = header.slice(7);

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    // Buscar usuario en nuestra DB por supabase_id o email
    let usuario = await queryOne(
      'SELECT id, nombre, email, tel, tipo, verificado, activo FROM usuarios WHERE supabase_id = ?',
      [data.user.id]
    );

    // Si no existe por supabase_id, buscar por email y linkear
    if (!usuario) {
      usuario = await queryOne(
        'SELECT id, nombre, email, tel, tipo, verificado, activo FROM usuarios WHERE email = ?',
        [data.user.email]
      );
      if (usuario) {
        await query('UPDATE usuarios SET supabase_id = ? WHERE id = ?', [data.user.id, usuario.id]);
      }
    }

    // Si definitivamente no existe, crearlo automáticamente
    if (!usuario) {
      const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
      const tipo = adminEmails.includes(data.user.email.toLowerCase()) ? 'admin' : 'demandante';
      const nombre = data.user.user_metadata?.nombre || data.user.email.split('@')[0];

      await query(
        'INSERT INTO usuarios (supabase_id, nombre, email, tipo, tel) VALUES (?, ?, ?, ?, ?)',
        [data.user.id, nombre, data.user.email, tipo, '']
      );
      usuario = await queryOne(
        'SELECT id, nombre, email, tel, tipo, verificado, activo FROM usuarios WHERE supabase_id = ?',
        [data.user.id]
      );
    }

    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado en el sistema' });
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: 'Cuenta suspendida' });
    }

    req.user = { ...usuario, supabase_id: data.user.id };
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Error de autenticación' });
  }
}

/**
 * Solo permite el acceso a usuarios con tipo 'admin'.
 */
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  if (req.user.tipo !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido a administradores' });
  }
  next();
}

/**
 * Solo permite el acceso a usuarios con tipo 'oferente'.
 */
function requireOferente(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  if (req.user.tipo !== 'oferente' && req.user.tipo !== 'admin') {
    return res.status(403).json({ error: 'Solo los oferentes pueden realizar esta acción' });
  }
  next();
}

/**
 * Middleware opcional: si hay token válido lo adjunta, pero no falla si no hay.
 */
async function optionalAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) return next();

  const token = header.slice(7);
  try {
    const { data } = await supabase.auth.getUser(token);
    if (data?.user) {
      const usuario = await queryOne(
        'SELECT id, nombre, email, tel, tipo, verificado, activo FROM usuarios WHERE supabase_id = ?',
        [data.user.id]
      );
      if (usuario && usuario.activo) {
        req.user = { ...usuario, supabase_id: data.user.id };
      }
    }
  } catch {}
  next();
}

module.exports = { requireAuth, requireAdmin, requireOferente, optionalAuth };
