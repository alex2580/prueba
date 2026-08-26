const crypto = require('crypto');

// Credenciales de MercadoPago de cada proveedor (mp_access_token/mp_refresh_token
// en `usuarios`) se guardan cifradas — nunca en texto plano en la DB.
const KEY = crypto.scryptSync(process.env.TOKEN_ENCRYPTION_KEY || '', 'tmc-mp-tokens', 32);

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString('base64');
}

function decrypt(b64) {
  if (!b64) return null;
  const buf = Buffer.from(b64, 'base64');
  const iv  = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };
