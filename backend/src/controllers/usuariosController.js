const { query, queryOne } = require('../db/connection');
const { validationResult } = require('express-validator');
const supabaseService = require('../services/supabaseService');
const { sendCambioTelConfirmado, sendBienvenida, sendOTP } = require('../services/emailService');

async function _auditarCampo(usuarioId, campo, valorAnterior, valorNuevo, ip) {
  const ant = valorAnterior == null ? '' : String(valorAnterior);
  const nvo = valorNuevo   == null ? '' : String(valorNuevo);
  if (ant === nvo) return;
  await query(
    `INSERT INTO auditoria_perfil (usuario_id, campo, valor_anterior, valor_nuevo, ip) VALUES (?, ?, ?, ?, ?)`,
    [usuarioId, campo, ant || null, nvo || null, ip || null]
  ).catch(e => console.warn('Auditoría perfil:', e.message));
}

const OTP_EXPIRY_MIN = 10;

function generarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizarTelFront(tel) {
  if (!tel) return tel;
  return tel.replace(/\s/g, '');
}

// GET /api/usuarios/me
async function perfil(req, res, next) {
  try {
    let usuario;
    try {
      usuario = await queryOne(
        'SELECT id, nombre, email, tel, dni, pais, tipo, verificado, avatar_url, created_at, direccion, piso, departamento, lat, lng, cbu_alias FROM usuarios WHERE id = ?',
        [req.user.id]
      );
    } catch (_) {
      try {
        usuario = await queryOne(
          'SELECT id, nombre, email, tel, dni, pais, tipo, verificado, avatar_url, created_at, direccion, lat, lng, cbu_alias FROM usuarios WHERE id = ?',
          [req.user.id]
        );
      } catch (_2) {
        usuario = await queryOne(
          'SELECT id, nombre, email, tel, tipo, verificado, avatar_url, created_at FROM usuarios WHERE id = ?',
          [req.user.id]
        );
      }
    }
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

    const { nombre, tel, dni, pais, email, direccion, lat, lng, cbu_alias, piso, departamento } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || null;

    // Leer valores actuales para auditoría
    const actual = await queryOne('SELECT nombre, tel, dni, pais, email, direccion, cbu_alias FROM usuarios WHERE id = ?', [req.user.id]).catch(() => null);

    await query(
      'UPDATE usuarios SET nombre = ?, tel = ? WHERE id = ?',
      [nombre, tel || '', req.user.id]
    );
    if (actual) {
      await _auditarCampo(req.user.id, 'nombre',   actual.nombre,    nombre,    ip);
      await _auditarCampo(req.user.id, 'telefono',  actual.tel,       tel || '', ip);
    }

    // Update optional fields
    try {
      if (direccion !== undefined) {
        await query(
          'UPDATE usuarios SET direccion = ?, lat = ?, lng = ? WHERE id = ?',
          [direccion || null, lat || null, lng || null, req.user.id]
        );
        if (actual) await _auditarCampo(req.user.id, 'direccion', actual.direccion, direccion, ip);
      }
      if (dni !== undefined) {
        await query('UPDATE usuarios SET dni = ? WHERE id = ?', [dni || null, req.user.id]);
        if (actual) await _auditarCampo(req.user.id, 'dni', actual.dni, dni, ip);
      }
      if (pais !== undefined) {
        await query('UPDATE usuarios SET pais = ? WHERE id = ?', [pais || null, req.user.id]);
        if (actual) await _auditarCampo(req.user.id, 'pais', actual.pais, pais, ip);
      }
      if (email && email !== req.user.email) {
        await query('UPDATE usuarios SET email = ? WHERE id = ?', [email, req.user.id]);
        if (actual) await _auditarCampo(req.user.id, 'email', actual.email, email, ip);
      }
      if (cbu_alias !== undefined) {
        await query('UPDATE usuarios SET cbu_alias = ? WHERE id = ?', [cbu_alias || null, req.user.id]);
        if (actual) await _auditarCampo(req.user.id, 'cbu_alias', actual.cbu_alias, cbu_alias, ip);
      }
      if (piso !== undefined) {
        await query('UPDATE usuarios SET piso = ? WHERE id = ?', [piso || null, req.user.id]);
      }
      if (departamento !== undefined) {
        await query('UPDATE usuarios SET departamento = ? WHERE id = ?', [departamento || null, req.user.id]);
      }
    } catch (_) { /* columns may not exist yet */ }

    let updated;
    try {
      updated = await queryOne(
        'SELECT id, nombre, email, tel, dni, pais, tipo, verificado, avatar_url, direccion, piso, departamento, lat, lng, cbu_alias FROM usuarios WHERE id = ?',
        [req.user.id]
      );
    } catch (_) {
      try {
        updated = await queryOne(
          'SELECT id, nombre, email, tel, dni, pais, tipo, verificado, avatar_url, direccion, lat, lng, cbu_alias FROM usuarios WHERE id = ?',
          [req.user.id]
        );
      } catch (_2) {
        updated = await queryOne(
          'SELECT id, nombre, email, tel, tipo, verificado, avatar_url FROM usuarios WHERE id = ?',
          [req.user.id]
        );
      }
    }
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

    // Bienvenida + aceptación de términos al nuevo usuario
    sendBienvenida(email, nombre, tipoFinal)
      .catch(e => console.warn('[sync] Email bienvenida:', e.message));

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

// POST /api/usuarios/me/solicitar-cambio-tel
// Body: { tel_nuevo: "+54911XXXXXXXX" }
async function solicitarCambioTel(req, res, next) {
  try {
    const { tel_nuevo } = req.body;
    if (!tel_nuevo || tel_nuevo.trim().length < 8) {
      return res.status(400).json({ error: 'Número de teléfono inválido' });
    }

    const usuario = req.user;
    const telNormalizado = normalizarTelFront(tel_nuevo.trim());

    // Invalidar OTPs anteriores de cambio de tel
    await query(
      `UPDATE auth_otp SET usado = 1 WHERE usuario_id = ? AND tipo = 'cambio_tel' AND usado = 0`,
      [usuario.id]
    );

    const codigo = generarCodigo();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000);

    await query(
      `INSERT INTO auth_otp (usuario_id, codigo, expires_at, tipo, tel_nuevo) VALUES (?, ?, ?, 'cambio_tel', ?)`,
      [usuario.id, codigo, expiresAt, telNormalizado]
    );

    sendOTP(usuario.email, usuario.nombre, { codigo, expiraEn: OTP_EXPIRY_MIN })
      .catch(e => console.warn('[cambio-tel OTP] email error:', e.message));

    const atIdx = usuario.email.indexOf('@');
    const emailHint = usuario.email.slice(0, 2) + '***' + usuario.email.slice(atIdx);
    res.json({ ok: true, tel_hint: telNormalizado.slice(0, 4) + '***' + telNormalizado.slice(-3), email_hint: emailHint });
  } catch (err) {
    next(err);
  }
}

// POST /api/usuarios/me/verificar-cambio-tel
// Body: { codigo: "123456" }
async function verificarCambioTel(req, res, next) {
  try {
    const { codigo } = req.body;
    if (!codigo || String(codigo).length !== 6) {
      return res.status(400).json({ error: 'Código inválido — debe tener 6 dígitos' });
    }

    const usuario = req.user;

    const otp = await queryOne(
      `SELECT * FROM auth_otp
       WHERE usuario_id = ? AND tipo = 'cambio_tel' AND usado = 0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [usuario.id]
    );

    if (!otp) {
      return res.status(400).json({ error: 'El código expiró o ya fue utilizado. Solicitá uno nuevo.', code: 'OTP_EXPIRED' });
    }

    if ((otp.intentos || 0) >= 3) {
      await query('UPDATE auth_otp SET usado = 1 WHERE id = ?', [otp.id]);
      return res.status(429).json({ error: 'Demasiados intentos incorrectos. Solicitá un nuevo código.', code: 'OTP_MAX_INTENTOS' });
    }

    if (String(codigo).trim() !== String(otp.codigo)) {
      await query('UPDATE auth_otp SET intentos = intentos + 1 WHERE id = ?', [otp.id]);
      const restantes = 3 - (otp.intentos || 0) - 1;
      return res.status(400).json({
        error: `Código incorrecto. Te ${restantes > 0 ? `quedan ${restantes} intento${restantes !== 1 ? 's' : ''}` : 'queda 1 intento'}.`,
        code: 'OTP_INCORRECTO',
      });
    }

    // ✅ Código correcto — guardar el nuevo teléfono
    await query('UPDATE auth_otp SET usado = 1 WHERE id = ?', [otp.id]);
    await _auditarCampo(usuario.id, 'telefono', usuario.tel, otp.tel_nuevo, req.ip || null);
    await query('UPDATE usuarios SET tel = ? WHERE id = ?', [otp.tel_nuevo, usuario.id]);

    // Notificar por email
    sendCambioTelConfirmado(usuario.email, usuario.nombre, { telNuevo: otp.tel_nuevo })
      .catch(e => console.warn('[cambio-tel] email error:', e.message));

    const updated = await queryOne(
      'SELECT id, nombre, email, tel, tipo, verificado, avatar_url, direccion, lat, lng FROM usuarios WHERE id = ?',
      [usuario.id]
    );
    res.json({ ok: true, usuario: updated });
  } catch (err) {
    next(err);
  }
}

// Tabla dedicada para OTP de cambio de perfil — sin depender del timezone de MySQL.
// expires_at se guarda como BIGINT (Unix ms) y se compara en Node.js.
async function initPerfilOtpTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS perfil_otp (
      id          VARCHAR(36)  PRIMARY KEY,
      usuario_id  VARCHAR(36)  NOT NULL,
      codigo      VARCHAR(6)   NOT NULL,
      usado       TINYINT(1)   NOT NULL DEFAULT 0,
      intentos    INT          NOT NULL DEFAULT 0,
      expires_at  BIGINT       NOT NULL,
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_usuario (usuario_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

// POST /api/usuarios/me/solicitar-cambio-perfil
async function solicitarCambioPerfil(req, res, next) {
  try {
    const usuario = req.user;

    await initPerfilOtpTable();

    // Invalidar OTPs previos del usuario
    await query(`UPDATE perfil_otp SET usado = 1 WHERE usuario_id = ? AND usado = 0`, [usuario.id]);

    const codigo    = generarCodigo();
    const expiresAt = Date.now() + OTP_EXPIRY_MIN * 60 * 1000; // Unix ms
    const id        = require('crypto').randomUUID();

    await query(
      `INSERT INTO perfil_otp (id, usuario_id, codigo, expires_at) VALUES (?, ?, ?, ?)`,
      [id, usuario.id, codigo, expiresAt]
    );

    sendOTP(usuario.email, usuario.nombre, { codigo, expiraEn: OTP_EXPIRY_MIN })
      .catch(e => console.warn('[cambio-perfil OTP] email error:', e.message));

    const atIdx    = usuario.email.indexOf('@');
    const emailHint = usuario.email.slice(0, 2) + '***' + usuario.email.slice(atIdx);
    res.json({ ok: true, email_hint: emailHint });
  } catch (err) {
    next(err);
  }
}

// POST /api/usuarios/me/verificar-cambio-perfil
async function verificarCambioPerfil(req, res, next) {
  try {
    const { codigo } = req.body;
    if (!codigo || String(codigo).length !== 6) {
      return res.status(400).json({ error: 'Código inválido — debe tener 6 dígitos' });
    }

    const usuario = req.user;

    const otp = await queryOne(
      `SELECT * FROM perfil_otp
       WHERE usuario_id = ? AND usado = 0
       ORDER BY created_at DESC LIMIT 1`,
      [usuario.id]
    );

    if (!otp) {
      return res.status(400).json({ error: 'No hay ningún código activo. Solicitá uno nuevo.', code: 'OTP_NOT_FOUND' });
    }

    // Comparación de expiración en Node.js — sin depender del timezone de MySQL
    if (otp.expires_at < Date.now()) {
      await query('UPDATE perfil_otp SET usado = 1 WHERE id = ?', [otp.id]);
      return res.status(400).json({ error: 'El código expiró. Solicitá uno nuevo.', code: 'OTP_EXPIRED' });
    }

    if ((otp.intentos || 0) >= 3) {
      await query('UPDATE perfil_otp SET usado = 1 WHERE id = ?', [otp.id]);
      return res.status(429).json({ error: 'Demasiados intentos. Solicitá un nuevo código.', code: 'OTP_MAX_INTENTOS' });
    }

    if (String(codigo).trim() !== String(otp.codigo).trim()) {
      await query('UPDATE perfil_otp SET intentos = intentos + 1 WHERE id = ?', [otp.id]);
      const restantes = 3 - (otp.intentos || 0) - 1;
      return res.status(400).json({
        error: `Código incorrecto. Te ${restantes > 0 ? `quedan ${restantes} intento${restantes !== 1 ? 's' : ''}` : 'queda 1 intento'}.`,
        code: 'OTP_INCORRECTO',
      });
    }

    await query('UPDATE perfil_otp SET usado = 1 WHERE id = ?', [otp.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/usuarios/me/avatar
async function subirAvatar(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se envió ninguna imagen' });
    const url = await supabaseService.uploadFile(req.file.buffer, 'avatars', req.file.originalname);
    await query('UPDATE usuarios SET avatar_url = ? WHERE id = ?', [url, req.user.id]);
    res.json({ url });
  } catch (err) {
    next(err);
  }
}

module.exports = { perfil, actualizar, sync, verPerfil, listar, cambiarTipo, solicitarCambioTel, verificarCambioTel, solicitarCambioPerfil, verificarCambioPerfil, subirAvatar };
