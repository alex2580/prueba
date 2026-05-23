const { query, queryOne } = require('../db/connection');
const { sendOTP, sendLoginNotificacion } = require('../services/emailService');
const { sendSMS, sendWhatsApp } = require('../services/twilioService');
require('dotenv').config();

const OTP_EXPIRY_MIN = 10;   // minutos de validez
const MAX_INTENTOS   = 3;    // intentos antes de invalidar el OTP

function generarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function formatearFecha(d) {
  return d.toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }) + ' hs (Argentina)';
}

function detectarDispositivo(userAgent) {
  if (!userAgent) return 'Desconocido';
  if (/iPhone|iPad/.test(userAgent)) return '📱 iPhone/iPad';
  if (/Android/.test(userAgent))     return '📱 Android';
  if (/Windows/.test(userAgent))     return '💻 Windows';
  if (/Mac/.test(userAgent))         return '💻 Mac';
  if (/Linux/.test(userAgent))       return '🐧 Linux';
  return '🌐 Navegador';
}

// POST /api/auth/solicitar-otp
// Requiere: Bearer token válido de Supabase (usuario autenticado pero OTP pendiente)
async function solicitarOTP(req, res, next) {
  try {
    const usuario = req.user; // inyectado por requireAuth

    // Invalidar OTPs anteriores no usados
    await query(
      `UPDATE auth_otp SET usado = 1 WHERE usuario_id = ? AND usado = 0`,
      [usuario.id]
    );

    const codigo = generarCodigo();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000);

    await query(
      `INSERT INTO auth_otp (usuario_id, codigo, expires_at) VALUES (?, ?, ?)`,
      [usuario.id, codigo, expiresAt]
    );

    const mensajeCorto = `TodasMisCosas: Tu código de verificación es ${codigo}. Válido ${OTP_EXPIRY_MIN} minutos. No lo compartas.`;

    // Enviar por los 3 canales en paralelo (sin bloquear la respuesta)
    Promise.allSettled([
      sendOTP(usuario.email, usuario.nombre, { codigo, expiraEn: OTP_EXPIRY_MIN }),
      usuario.tel ? sendSMS(usuario.tel, mensajeCorto) : Promise.resolve(),
      usuario.tel ? sendWhatsApp(usuario.tel, mensajeCorto) : Promise.resolve(),
    ]).then(results => {
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          const canal = ['email','SMS','WhatsApp'][i];
          console.warn(`[OTP] Error canal ${canal}:`, r.reason?.message);
        }
      });
    });

    res.json({
      ok: true,
      canales: {
        email: true,
        sms:       !!usuario.tel,
        whatsapp:  !!usuario.tel,
      },
      email_hint: usuario.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/verificar-otp
// Body: { codigo: "123456" }
async function verificarOTP(req, res, next) {
  try {
    const { codigo } = req.body;
    if (!codigo || String(codigo).length !== 6) {
      return res.status(400).json({ error: 'Código inválido — debe tener 6 dígitos' });
    }

    const usuario = req.user;

    // Buscar el OTP activo más reciente
    const otp = await queryOne(
      `SELECT * FROM auth_otp
       WHERE usuario_id = ? AND usado = 0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [usuario.id]
    );

    if (!otp) {
      return res.status(400).json({
        error: 'El código expiró o ya fue utilizado. Solicitá uno nuevo.',
        code: 'OTP_EXPIRED',
      });
    }

    // Demasiados intentos fallidos
    if (otp.intentos >= MAX_INTENTOS) {
      await query('UPDATE auth_otp SET usado = 1 WHERE id = ?', [otp.id]);
      return res.status(429).json({
        error: 'Demasiados intentos incorrectos. Solicitá un nuevo código.',
        code: 'OTP_MAX_INTENTOS',
      });
    }

    if (String(codigo).trim() !== String(otp.codigo)) {
      await query('UPDATE auth_otp SET intentos = intentos + 1 WHERE id = ?', [otp.id]);
      const restantes = MAX_INTENTOS - otp.intentos - 1;
      return res.status(400).json({
        error: `Código incorrecto. Te ${restantes > 0 ? `quedan ${restantes} intento${restantes !== 1 ? 's' : ''}` : 'queda 1 intento'}.`,
        code: 'OTP_INCORRECTO',
        intentos_restantes: restantes,
      });
    }

    // ✅ Código correcto
    await query('UPDATE auth_otp SET usado = 1 WHERE id = ?', [otp.id]);

    // Obtener IP y user-agent
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.socket?.remoteAddress
      || 'desconocida';
    const userAgent = req.headers['user-agent'] || '';

    // Registrar sesión
    await query(
      `INSERT INTO auth_sesiones (usuario_id, ip, user_agent) VALUES (?, ?, ?)`,
      [usuario.id, ip, userAgent]
    );

    const fecha = formatearFecha(new Date());
    const dispositivo = detectarDispositivo(userAgent);

    // Notificación de acceso exitoso — los 3 canales en paralelo
    const msgAcceso = `✅ TodasMisCosas: Acceso confirmado el ${fecha} desde ${dispositivo}. ¿No fuiste vos? Escribinos a contacto@todasmiscosas.com`;

    Promise.allSettled([
      sendLoginNotificacion(usuario.email, usuario.nombre, { fecha, ip, dispositivo }),
      usuario.tel ? sendSMS(usuario.tel, msgAcceso) : Promise.resolve(),
      usuario.tel ? sendWhatsApp(usuario.tel, msgAcceso) : Promise.resolve(),
    ]).then(results => {
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          const canal = ['email','SMS','WhatsApp'][i];
          console.warn(`[Login notif] Error canal ${canal}:`, r.reason?.message);
        }
      });
    });

    res.json({ ok: true, verificado: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { solicitarOTP, verificarOTP };
