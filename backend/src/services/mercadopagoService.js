const { MercadoPagoConfig, Preference, Payment, PaymentRefund, OAuth } = require('mercadopago');
require('dotenv').config();

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  options: { timeout: 5000 },
});

const preferenceAPI = new Preference(client);
const paymentAPI    = new Payment(client);
const refundAPI     = new PaymentRefund(client);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Crea una preferencia de pago en MercadoPago.
 * @returns {Promise<{ id: string, init_point: string, sandbox_init_point: string }>}
 */
async function crearPreferencia({ titulo, monto, reservaId, usuarioEmail, usuarioNombre, fechaDesde, fechaHasta }) {
  const body = {
    items: [
      {
        id: reservaId,
        title: titulo,
        quantity: 1,
        unit_price: Number(monto),
        currency_id: 'ARS',
        description: `Reserva ${fechaDesde} al ${fechaHasta}`,
      },
    ],
    back_urls: {
      success: `${FRONTEND_URL}/es/reserva/${reservaId}/confirmacion?estado=success`,
      failure: `${FRONTEND_URL}/es/reserva/${reservaId}/confirmacion?estado=failure`,
      pending: `${FRONTEND_URL}/es/reserva/${reservaId}/confirmacion?estado=pending`,
    },
    auto_return: 'approved',
    external_reference: reservaId,
    metadata: { reserva_id: reservaId },
    notification_url: `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/pagos/webhook`,
    expires: false,
  };

  const result = await preferenceAPI.create({ body });
  return {
    id: result.id,
    init_point: result.init_point,
    sandbox_init_point: result.sandbox_init_point,
  };
}

/**
 * Crea una preferencia de pago para una extensión de reserva.
 * external_reference = "ext_<extensionId>" para distinguirla en el webhook.
 */
async function crearPreferenciaExtension({ extensionId, reservaId, espacioNombre, monto, nuevaFechaHasta, usuarioEmail, usuarioNombre }) {
  const body = {
    items: [
      {
        id: extensionId,
        title: `Extensión de reserva — ${espacioNombre}`,
        quantity: 1,
        unit_price: Number(monto),
        currency_id: 'ARS',
        description: `Extensión hasta ${nuevaFechaHasta}`,
      },
    ],
    payer: { email: usuarioEmail, name: usuarioNombre },
    back_urls: {
      success: `${FRONTEND_URL}/es/panel?extension=success`,
      failure: `${FRONTEND_URL}/es/panel?extension=failure`,
      pending: `${FRONTEND_URL}/es/panel?extension=pending`,
    },
    auto_return: 'approved',
    external_reference: `ext_${extensionId}`,
    metadata: { tipo: 'extension', extension_id: extensionId, reserva_id: reservaId },
    notification_url: `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/pagos/webhook`,
    expires: false,
  };

  const result = await preferenceAPI.create({ body });
  return {
    id: result.id,
    init_point: result.init_point,
    sandbox_init_point: result.sandbox_init_point,
  };
}

/**
 * Obtiene un pago de MercadoPago por ID.
 */
async function obtenerPago(paymentId) {
  const payment = await paymentAPI.get({ id: paymentId });
  return payment;
}

/**
 * Busca pagos por external_reference (= reservaId).
 * Retorna el pago aprobado más reciente, o null.
 */
async function buscarPagoPorReferencia(externalRef) {
  try {
    const result = await paymentAPI.search({
      options: { external_reference: externalRef, sort: 'date_created', criteria: 'desc' },
    });
    const pagos = result?.results || [];
    return pagos.find(p => p.status === 'approved') || pagos[0] || null;
  } catch {
    return null;
  }
}

/**
 * Reembolsa el 100% de un pago aprobado en MercadoPago.
 * @throws si MP rechaza el reembolso (pago ya reembolsado, fuera de plazo, etc.)
 */
async function reembolsarPago(paymentId) {
  return refundAPI.total({ payment_id: paymentId });
}

/**
 * Transfiere dinero desde la cuenta de MP de TMC (MP_ACCESS_TOKEN) a la cuenta
 * de MP de un proveedor que conectó su cuenta vía OAuth (mp-connect) — usada
 * para pagarle al liberar el depósito de garantía, en vez de la transferencia
 * manual por CBU/alias.
 *
 * A diferencia del primer intento (identificar al destinatario por un alias
 * tipeado a mano), acá se usa `mpUserId` — el ID numérico real que devuelve
 * MercadoPago al conectar la cuenta por OAuth. Probado el 26 ago 2026 con un
 * alias suelto (sin OAuth de por medio): rechazado siempre con 401
 * "Unauthorized use of live credentials", incluso con el permiso "Online
 * Payout" habilitado — la hipótesis es que MP exige una referencia verificada
 * (el `user_id` de una cuenta que autorizó explícitamente a la app) en vez de
 * un alias suelto. Falta confirmar que este cambio efectivamente lo resuelve.
 * @throws si MP rechaza la transferencia
 */
async function transferirDinero({ mpUserId, monto, referencia, descripcion }) {
  const res = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'X-Idempotency-Key': `payout-${referencia}`,
    },
    body: JSON.stringify({
      transaction_amount: Number(monto),
      payment_method_id: 'account_money',
      operation_type: 'money_transfer',
      collector: { id: mpUserId },
      external_reference: String(referencia),
      description: descripcion,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `MP money_transfer falló (HTTP ${res.status})`);
  }
  return data;
}

// ── MercadoPago Connect (OAuth) ─────────────────────────────────────
// El flujo de OAuth (autorizar / intercambiar código / refrescar) siempre
// corre con las credenciales de la aplicación de la plataforma, no con el
// token de ningún proveedor.
function getAuthorizationUrl(state) {
  const oauth = new OAuth(client);
  return oauth.getAuthorizationURL({
    options: {
      client_id:    process.env.MP_CLIENT_ID,
      state,
      redirect_uri: process.env.MP_CONNECT_REDIRECT_URI,
    },
  });
}

async function intercambiarCodigo(code) {
  const oauth = new OAuth(client);
  return oauth.create({
    body: {
      client_secret: process.env.MP_CLIENT_SECRET,
      client_id:     process.env.MP_CLIENT_ID,
      code,
      redirect_uri:  process.env.MP_CONNECT_REDIRECT_URI,
    },
  });
}

async function refrescarToken(refresh_token) {
  const oauth = new OAuth(client);
  return oauth.refresh({
    body: {
      client_secret: process.env.MP_CLIENT_SECRET,
      client_id:     process.env.MP_CLIENT_ID,
      refresh_token,
    },
  });
}

module.exports = {
  crearPreferencia, crearPreferenciaExtension, obtenerPago, buscarPagoPorReferencia,
  reembolsarPago, transferirDinero,
  getAuthorizationUrl, intercambiarCodigo, refrescarToken,
};
