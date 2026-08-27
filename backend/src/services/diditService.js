const { createHmac, timingSafeEqual } = require('crypto');

const BASE_URL = 'https://verification.didit.me';

/**
 * Crea una sesión de verificación de identidad (biometría + DNI vs RENAPER).
 * vendor_data es el id interno del usuario en `usuarios` — así el webhook
 * sabe a quién actualizar sin exponer el email a Didit en ese campo.
 */
async function crearSesion({ usuarioId, callback }) {
  const res = await fetch(`${BASE_URL}/v3/session/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.DIDIT_API_KEY,
    },
    body: JSON.stringify({
      workflow_id: process.env.DIDIT_WORKFLOW_ID,
      vendor_data: String(usuarioId),
      callback,
    }),
  });
  const data = await res.json();
  if (res.status !== 201) {
    throw new Error(data?.message || data?.error || data?.detail || `Didit crearSesion falló (HTTP ${res.status})`);
  }
  return data; // { session_id, url, session_token }
}

/**
 * Fallback si el webhook no llega — consulta el resultado de una sesión.
 */
async function consultarDecision(sessionId) {
  const res = await fetch(`${BASE_URL}/v3/session/${sessionId}/decision/`, {
    headers: { 'X-API-Key': process.env.DIDIT_API_KEY },
  });
  if (!res.ok) throw new Error(`Didit consultarDecision falló (HTTP ${res.status})`);
  return res.json();
}

// ── Verificación de firma de webhook ────────────────────────────────
// Porta las 3 estrategias del repo demo oficial de Didit (didit-protocol/
// didit-full-demo) en ese orden de preferencia — V2 evita problemas de
// re-encoding de JSON, Simple es inmune a eso por completo, Original queda
// como último recurso sobre el body crudo.
const REPLAY_WINDOW_SECONDS = 300;

function _tiempoValido(timestamp) {
  const ahora = Math.floor(Date.now() / 1000);
  return Math.abs(ahora - Number(timestamp)) <= REPLAY_WINDOW_SECONDS;
}

function _hmacHex(data, secret) {
  return createHmac('sha256', secret).update(data, 'utf-8').digest('hex');
}

function _compararHex(esperada, recibida) {
  const a = Buffer.from(esperada, 'hex');
  const b = Buffer.from(recibida, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

function _shortenFloats(data) {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(_shortenFloats);
  if (typeof data === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(data)) out[k] = _shortenFloats(v);
    return out;
  }
  if (typeof data === 'number' && !Number.isInteger(data) && data === Math.floor(data)) {
    return Math.floor(data);
  }
  return data;
}

function _stableStringify(obj) {
  if (obj === null || obj === undefined) return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(_stableStringify).join(',') + ']';
  if (typeof obj === 'object') {
    return '{' + Object.keys(obj).sort()
      .map(k => JSON.stringify(k) + ':' + _stableStringify(obj[k]))
      .join(',') + '}';
  }
  return JSON.stringify(obj);
}

function _verificarV2(body, firma, secret) {
  if (!_tiempoValido(body.created_at)) return false;
  const encoded = _stableStringify(_shortenFloats(body));
  return _compararHex(_hmacHex(encoded, secret), firma);
}

function _verificarSimple(body, firma, secret) {
  if (!_tiempoValido(body.created_at)) return false;
  const canonical = [body.created_at, body.session_id, body.status, body.webhook_type]
    .map(v => String(v || '')).join(':');
  return _compararHex(_hmacHex(canonical, secret), firma);
}

function _verificarOriginal(rawBody, firma, secret, timestamp) {
  if (!_tiempoValido(timestamp)) return false;
  return _compararHex(_hmacHex(rawBody, secret), firma);
}

/**
 * Verifica la firma de un webhook de Didit probando V2 → Simple → Original,
 * en ese orden. `rawBody` es el string crudo del body (necesario para el
 * método Original); `body` es el mismo body ya parseado como objeto.
 */
function verificarFirmaWebhook({ rawBody, body, headers }) {
  const secret = process.env.DIDIT_WEBHOOK_SECRET;
  if (!secret) return false;

  const v2 = headers['x-signature-v2'];
  if (v2 && _verificarV2(body, v2, secret)) return true;

  const simple = headers['x-signature-simple'];
  if (simple && _verificarSimple(body, simple, secret)) return true;

  const original = headers['x-signature'];
  if (original && _verificarOriginal(rawBody, original, secret, body.created_at)) return true;

  return false;
}

module.exports = { crearSesion, consultarDecision, verificarFirmaWebhook };
