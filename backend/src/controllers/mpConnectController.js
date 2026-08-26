const crypto = require('crypto');
const { query } = require('../db/connection');
const { encrypt } = require('../services/cryptoService');
const {
  getAuthorizationUrl,
  intercambiarCodigo,
} = require('../services/mercadopagoService');

// Estados de OAuth en vuelo — mapea el `state` random que le pasamos a MP
// contra quién inició la conexión. Vive 10 minutos y se consume una sola
// vez (se borra en el callback, se use o no).
const ESTADOS_TTL_MS = 10 * 60 * 1000;
const estados = new Map();

function limpiarExpirados() {
  const ahora = Date.now();
  for (const [state, info] of estados) {
    if (info.expiresAt < ahora) estados.delete(state);
  }
}

function nextValido(next) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

// ── Iniciar conexión ─────────────────────────────────────────────
async function iniciar(req, res) {
  limpiarExpirados();

  const state = crypto.randomBytes(24).toString('hex');
  estados.set(state, {
    usuarioId: req.user.id,
    returnTo:  nextValido(req.query.next),
    expiresAt: Date.now() + ESTADOS_TTL_MS,
  });

  const url = getAuthorizationUrl(state);
  res.json({ url });
}

// ── Callback de MercadoPago (público, sin Bearer token) ─────────────
async function callback(req, res) {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://todasmiscosas.com';
  const { code, state } = req.query;

  const info = state && estados.get(state);
  if (info) estados.delete(state); // un solo uso, se borre o no la conexión

  if (!code || !info || info.expiresAt < Date.now()) {
    return res.redirect(`${FRONTEND_URL}/es/panel?mp=error`);
  }

  try {
    const tokens = await intercambiarCodigo(code);
    await query(
      `UPDATE usuarios SET
        mp_user_id          = ?,
        mp_access_token      = ?,
        mp_refresh_token     = ?,
        mp_public_key        = ?,
        mp_token_expires_at  = DATE_ADD(NOW(), INTERVAL ? SECOND),
        mp_connected_at      = NOW()
       WHERE id = ?`,
      [
        tokens.user_id,
        encrypt(tokens.access_token),
        encrypt(tokens.refresh_token),
        tokens.public_key || null,
        tokens.expires_in || 0,
        info.usuarioId,
      ]
    );
    res.redirect(`${FRONTEND_URL}${info.returnTo || '/es/panel'}?mp=connected`);
  } catch (err) {
    console.error('[MP-CONNECT] Error en callback:', err.message);
    res.redirect(`${FRONTEND_URL}/es/panel?mp=error`);
  }
}

// ── Desconectar ──────────────────────────────────────────────────
async function desconectar(req, res) {
  await query(
    `UPDATE usuarios SET
      mp_user_id = NULL, mp_access_token = NULL, mp_refresh_token = NULL,
      mp_public_key = NULL, mp_token_expires_at = NULL, mp_connected_at = NULL
     WHERE id = ?`,
    [req.user.id]
  );
  res.json({ ok: true });
}

module.exports = { iniciar, callback, desconectar };
