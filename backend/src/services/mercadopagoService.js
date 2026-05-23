const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
require('dotenv').config();

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  options: { timeout: 5000 },
});

const preferenceAPI = new Preference(client);
const paymentAPI    = new Payment(client);

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
    payer: {
      email: usuarioEmail,
      name: usuarioNombre,
    },
    back_urls: {
      success: `${FRONTEND_URL}/reserva/${reservaId}/confirmacion?estado=success`,
      failure: `${FRONTEND_URL}/reserva/${reservaId}/confirmacion?estado=failure`,
      pending: `${FRONTEND_URL}/reserva/${reservaId}/confirmacion?estado=pending`,
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
      success: `${FRONTEND_URL}/panel?extension=success`,
      failure: `${FRONTEND_URL}/panel?extension=failure`,
      pending: `${FRONTEND_URL}/panel?extension=pending`,
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

module.exports = { crearPreferencia, crearPreferenciaExtension, obtenerPago };
