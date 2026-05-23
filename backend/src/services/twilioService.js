/**
 * Twilio — SMS y WhatsApp.
 *
 * Variables de entorno requeridas:
 *   TWILIO_ACCOUNT_SID   → en Twilio Console → Account Info
 *   TWILIO_AUTH_TOKEN    → en Twilio Console → Account Info
 *   TWILIO_PHONE         → número SMS (ej: +15551234567)
 *   TWILIO_WHATSAPP_FROM → número WhatsApp (ej: whatsapp:+14155238886 — sandbox de Twilio)
 *
 * Si las variables no están configuradas, los envíos se loguean en consola
 * y no fallan (modo demo / desarrollo).
 */
const twilio = require('twilio');
require('dotenv').config();

const SID   = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_SMS       = process.env.TWILIO_PHONE;
const FROM_WHATSAPP  = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

function getClient() {
  if (!SID || !TOKEN || SID === 'TWILIO_PENDIENTE') return null;
  return twilio(SID, TOKEN);
}

/**
 * Normaliza un número argentino al formato E.164 internacional.
 * Ej: "011 4523-8871" → "+541145238871"
 *     "+54 9 11 5555-1234" → "+5491155551234"
 */
function normalizarTel(tel) {
  if (!tel) return null;
  let t = tel.replace(/\D/g, '');          // solo dígitos
  if (t.startsWith('0'))  t = t.slice(1);  // quitar 0 inicial local
  if (!t.startsWith('54')) t = '54' + t;   // agregar código de Argentina
  return '+' + t;
}

async function sendSMS(tel, mensaje) {
  const to = normalizarTel(tel);
  if (!to) return;

  const client = getClient();
  if (!client) {
    console.log(`[Twilio SMS demo] → ${to}: ${mensaje}`);
    return;
  }
  try {
    await client.messages.create({ from: FROM_SMS, to, body: mensaje });
  } catch (e) {
    console.warn('[Twilio SMS error]', e.message);
  }
}

async function sendWhatsApp(tel, mensaje) {
  const toRaw = normalizarTel(tel);
  if (!toRaw) return;
  const to = 'whatsapp:' + toRaw;

  const client = getClient();
  if (!client) {
    console.log(`[Twilio WhatsApp demo] → ${to}: ${mensaje}`);
    return;
  }
  try {
    await client.messages.create({ from: FROM_WHATSAPP, to, body: mensaje });
  } catch (e) {
    console.warn('[Twilio WhatsApp error]', e.message);
  }
}

module.exports = { sendSMS, sendWhatsApp, normalizarTel };
