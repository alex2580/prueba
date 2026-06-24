const crypto = require('crypto');
const { queryOne, query } = require('../db/connection');
const mercadopagoService = require('../services/mercadopagoService');
const emailService = require('../services/emailService');
const ledgerService = require('../services/ledgerService');
const { validationResult } = require('express-validator');

// Verifies the x-signature header sent by MercadoPago.
// Returns true if valid, or true when MP_WEBHOOK_SECRET is not configured (graceful degradation).
// Docs: https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks
function verifyMPSignature(req) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  const signatureHeader = req.headers['x-signature'] || '';

  // Si MP no manda x-signature, aceptar (el secret puede no estar configurado en el dashboard de MP)
  if (!signatureHeader) {
    if (secret) console.warn('[webhook] MP no envió x-signature — aceptando sin verificar firma');
    return true;
  }

  // Si hay firma pero no tenemos secret, aceptar igual
  if (!secret) {
    console.warn('[webhook] MP_WEBHOOK_SECRET no configurado — saltando verificación');
    return true;
  }

  // Verificar firma
  const requestId = req.headers['x-request-id'] || '';
  const { data }  = req.body;
  const tsMatch   = signatureHeader.match(/ts=([^,]+)/);
  const v1Match   = signatureHeader.match(/v1=([^,]+)/);
  if (!tsMatch || !v1Match) {
    console.warn('[webhook] Formato de x-signature inválido:', signatureHeader);
    return false;
  }

  const ts       = tsMatch[1];
  const received = v1Match[1];
  const dataId   = data?.id ?? '';
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts}`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch { return false; }
}

// ── Helper compartido: notificaciones al confirmar pago ────────
async function _procesarPagada(reserva, paymentId) {
  const usuario = await queryOne('SELECT * FROM usuarios WHERE id = ?', [reserva.usuario_id]);
  const espacio = await queryOne('SELECT nombre, oferente_id FROM espacios WHERE id = ?', [reserva.espacio_id]);
  if (!usuario || !espacio) return;

  const oferente = await queryOne('SELECT * FROM usuarios WHERE id = ?', [espacio.oferente_id]);
  const fDesde = reserva.fecha_desde instanceof Date
    ? reserva.fecha_desde.toISOString().slice(0, 10)
    : String(reserva.fecha_desde).slice(0, 10);
  const fHasta = reserva.fecha_hasta instanceof Date
    ? reserva.fecha_hasta.toISOString().slice(0, 10)
    : String(reserva.fecha_hasta).slice(0, 10);

  // Inicializar escrow
  const netoOferente = Math.round(Number(reserva.precio_total) * 0.85);
  await query(
    `UPDATE reservas SET escrow_liberado = 0, escrow_neto_oferente = ? WHERE id = ?`,
    [netoOferente, reserva.id]
  ).catch(e => console.warn('SET escrow:', e.message));

  // Registro contable: cliente → tmc.escrow
  ledgerService.registrarPago(
    reserva.id, reserva.usuario_id, reserva.precio_total,
    `Pago MercadoPago — ${espacio.nombre}`
  ).catch(e => console.warn('Ledger pago:', e.message));

  // Email demandante: tu pago está protegido en escrow
  emailService.sendEscrowRetenidoDemandante(usuario.email, usuario.nombre, {
    espacioNombre: espacio.nombre, monto: reserva.precio_total,
    reservaId: reserva.id, fechaDesde: fDesde,
  }).catch(e => console.warn('Email escrow demandante:', e.message));

  // Email oferente: pago retenido en escrow, lo recibirás al confirmar acceso
  if (oferente) {
    emailService.sendEscrowRetenidoOferente(oferente.email, oferente.nombre, {
      demandanteNombre: usuario.nombre, espacioNombre: espacio.nombre,
      monto: reserva.precio_total, reservaId: reserva.id, fechaDesde: fDesde,
    }).catch(e => console.warn('Email escrow oferente:', e.message));
  }

  emailService.sendReservaConfirmada(usuario.email, usuario.nombre, {
    espacioNombre: espacio.nombre, fechaDesde: fDesde, fechaHasta: fHasta,
    precioTotal: reserva.precio_total, reservaId: reserva.id, pin: reserva.pin_acceso,
  }).catch(e => console.warn('Email reserva confirmada:', e.message));

  if (oferente) {
    emailService.sendNuevaReserva(oferente.email, oferente.nombre, {
      demandanteNombre: usuario.nombre, demandanteEmail: usuario.email || '',
      demandanteTel: usuario.tel || '', espacioNombre: espacio.nombre,
      fechaDesde: fDesde, fechaHasta: fHasta,
      precioTotal: reserva.precio_total, reservaId: reserva.id, pin: reserva.pin_acceso,
    }).catch(e => console.warn('Email nueva reserva oferente:', e.message));
  }

  const legalData = {
    espacioNombre: espacio.nombre, fechaDesde: fDesde, fechaHasta: fHasta,
    precioTotal: reserva.precio_total, reservaId: reserva.id,
  };
  emailService.sendAceptacionOperacion(usuario.email, usuario.nombre, { rol: 'demandante', ...legalData })
    .catch(e => console.warn('Email legal demandante:', e.message));
  if (oferente) {
    emailService.sendAceptacionOperacion(oferente.email, oferente.nombre, { rol: 'oferente', ...legalData })
      .catch(e => console.warn('Email legal oferente:', e.message));
  }

  const servicios = await query(
    "SELECT tipo FROM servicios_adicionales WHERE reserva_id = ? AND estado = 'activo'",
    [reserva.id]
  );
  if (servicios.length > 0) {
    const tiposServicios = servicios.map(s => s.tipo);
    query(
      'INSERT INTO admin_notificaciones (id, tipo, mensaje, fecha, datos) VALUES (UUID(), ?, ?, NOW(), ?)',
      [
        'servicios_adicionales',
        `🛎️ Servicios adicionales — ${espacio.nombre} (${usuario.nombre || usuario.email})`,
        JSON.stringify({
          reservaId: reserva.id,
          nombreDemandante: usuario.nombre, emailDemandante: usuario.email,
          telDemandante: usuario.tel, espacioNombre: espacio.nombre,
          servicios: tiposServicios, fechaDesde: fDesde, fechaHasta: fHasta,
        }),
      ]
    ).catch(e => console.warn('Admin notif servicios:', e.message));
    emailService.sendServiciosAdicionales('contacto@todasmiscosas.com', {
      nombreDemandante: usuario.nombre || 'Sin nombre', emailDemandante: usuario.email,
      telDemandante: usuario.tel || '', espacioNombre: espacio.nombre,
      servicios: tiposServicios, fechaDesde: fDesde, fechaHasta: fHasta,
    }).catch(e => console.warn('Email servicios adicionales:', e.message));
  }
}

// POST /api/pagos/preferencia
// Crea una preferencia de pago en MercadoPago y devuelve el init_point
async function crearPreferencia(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: 'Datos inválidos', details: errors.array() });
    }

    const { reserva_id } = req.body;

    const reserva = await queryOne(
      `SELECT r.*, e.nombre AS espacio_nombre, e.barrio, u.nombre AS usuario_nombre, u.email AS usuario_email
       FROM reservas r
       JOIN espacios e ON r.espacio_id = e.id
       JOIN usuarios u ON r.usuario_id = u.id
       WHERE r.id = ?`,
      [reserva_id]
    );

    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (reserva.usuario_id !== req.user.id) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    if (reserva.estado === 'pagada') {
      return res.status(409).json({ error: 'Esta reserva ya fue pagada' });
    }
    if (reserva.estado === 'cancelada') {
      return res.status(409).json({ error: 'Esta reserva está cancelada' });
    }

    const preference = await mercadopagoService.crearPreferencia({
      titulo: `Reserva ${reserva.espacio_nombre} — ${reserva.barrio}`,
      monto: parseFloat(reserva.precio_total),
      reservaId: reserva.id,
      usuarioEmail: reserva.usuario_email,
      usuarioNombre: reserva.usuario_nombre,
      fechaDesde: reserva.fecha_desde,
      fechaHasta: reserva.fecha_hasta,
    });

    // Save preference ID on reserva
    await query(
      'UPDATE reservas SET mp_preference_id = ? WHERE id = ?',
      [preference.id, reserva.id]
    );

    res.json({
      preference_id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/pagos/webhook
// MercadoPago llama a este endpoint cuando el pago se procesa
async function webhook(req, res, next) {
  try {
    if (!verifyMPSignature(req)) {
      console.warn('[webhook] Firma inválida — request rechazada');
      return res.sendStatus(401);
    }

    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data?.id;
      if (!paymentId) return res.sendStatus(200);

      const payment = await mercadopagoService.obtenerPago(paymentId);
      const externalRef = payment?.external_reference || '';
      const metadataTipo = payment?.metadata?.tipo;

      // ── Pago de extensión de reserva ───────────────────────────
      if (metadataTipo === 'extension' || externalRef.startsWith('ext_')) {
        const extensionId = payment?.metadata?.extension_id
          || (externalRef.startsWith('ext_') ? externalRef.slice(4) : null);

        if (!extensionId) return res.sendStatus(200);

        const extension = await queryOne(
          'SELECT * FROM reserva_extensiones WHERE id = ?',
          [extensionId]
        );
        if (!extension || extension.estado !== 'pendiente') return res.sendStatus(200);

        const status = payment.status;

        if (status === 'approved') {
          // Actualizar extensión → pagada
          await query(
            'UPDATE reserva_extensiones SET estado = ?, mp_payment_id = ?, mp_status = ? WHERE id = ?',
            ['pagada', String(paymentId), status, extensionId]
          );
          // Extender la fecha_hasta en la reserva y resetear recordatorios
          await query(
            `UPDATE reservas
             SET fecha_hasta = ?, recordatorio_5d = 0, recordatorio_2d = 0,
                 recordatorio_1d = 0, recordatorio_0d = 0
             WHERE id = ?`,
            [extension.nueva_fecha_hasta, extension.reserva_id]
          );
          // Email al demandante: extensión confirmada
          const reserva = await queryOne(
            `SELECT r.*, e.nombre AS espacio_nombre, u.nombre AS usuario_nombre, u.email AS usuario_email
             FROM reservas r
             JOIN espacios e ON r.espacio_id = e.id
             JOIN usuarios u ON r.usuario_id = u.id
             WHERE r.id = ?`,
            [extension.reserva_id]
          );
          if (reserva) {
            emailService.sendExtensionConfirmada(reserva.usuario_email, reserva.usuario_nombre, {
              espacioNombre: reserva.espacio_nombre,
              fechaHastaAnterior: reserva.fecha_hasta instanceof Date
                ? reserva.fecha_hasta.toISOString().slice(0, 10)
                : String(reserva.fecha_hasta).slice(0, 10),
              nuevaFechaHasta: extension.nueva_fecha_hasta instanceof Date
                ? extension.nueva_fecha_hasta.toISOString().slice(0, 10)
                : String(extension.nueva_fecha_hasta).slice(0, 10),
              monto: extension.precio,
              reservaId: reserva.id,
            }).catch(e => console.warn('Email extension confirmada:', e.message));
          }
        } else if (status === 'rejected' || status === 'cancelled') {
          await query(
            'UPDATE reserva_extensiones SET estado = ?, mp_status = ? WHERE id = ?',
            ['cancelada', status, extensionId]
          );
        }

        return res.sendStatus(200);
      }

      // ── Pago normal de reserva ──────────────────────────────────
      const reservaId = payment?.metadata?.reserva_id || externalRef;

      if (!reservaId) return res.sendStatus(200);

      const reserva = await queryOne('SELECT * FROM reservas WHERE id = ?', [reservaId]);
      if (!reserva) return res.sendStatus(200);

      // Si ya está pagada, ignorar cualquier webhook posterior (evita retroceso por webhooks fuera de orden)
      if (reserva.estado === 'pagada') return res.sendStatus(200);

      const status = payment.status; // approved | pending | rejected | cancelled

      let nuevoEstado;
      if (status === 'approved')  nuevoEstado = 'pagada';
      else if (status === 'rejected' || status === 'cancelled') nuevoEstado = 'cancelada';
      else nuevoEstado = 'pendiente';

      // El UPDATE solo afecta la fila si todavía no está "pagada" — evita que este
      // webhook y /api/pagos/sincronizar (el fallback del frontend) procesen el
      // mismo pago dos veces si llegan casi en simultáneo.
      const result = await query(
        "UPDATE reservas SET estado = ?, mp_payment_id = ?, mp_status = ? WHERE id = ? AND estado != 'pagada'",
        [nuevoEstado, String(paymentId), status, reservaId]
      );

      if (nuevoEstado === 'pagada' && result.affectedRows > 0) {
        _procesarPagada(reserva, paymentId).catch(e => console.warn('procesarPagada webhook:', e.message));
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(200); // Always 200 to MP
  }
}

// GET /api/pagos/estado/:reservaId
async function estado(req, res, next) {
  try {
    const reserva = await queryOne(
      `SELECT r.id, r.estado, r.mp_payment_id, r.mp_status, r.precio_total,
              e.nombre AS espacio_nombre
       FROM reservas r
       JOIN espacios e ON r.espacio_id = e.id
       WHERE r.id = ?`,
      [req.params.reservaId]
    );
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json(reserva);
  } catch (err) {
    next(err);
  }
}

// POST /api/pagos/sincronizar/:reservaId
// Fallback: consulta MP directo y confirma el pago si está aprobado.
// Lo llama el frontend cuando el webhook no llegó a tiempo.
async function sincronizar(req, res, next) {
  try {
    const reserva = await queryOne('SELECT * FROM reservas WHERE id = ?', [req.params.reservaId]);
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (reserva.usuario_id !== req.user.id) return res.status(403).json({ error: 'Sin permisos' });

    if (reserva.estado === 'pagada') return res.json({ estado: 'pagada' });

    const payment = await mercadopagoService.buscarPagoPorReferencia(reserva.id);
    if (!payment || payment.status !== 'approved') {
      return res.json({ estado: reserva.estado });
    }

    // Igual que en el webhook: el UPDATE solo afecta la fila si todavía no está
    // "pagada", para que esta llamada y el webhook no disparen _procesarPagada
    // dos veces si llegan casi en simultáneo.
    const result = await query(
      "UPDATE reservas SET estado = ?, mp_payment_id = ?, mp_status = ? WHERE id = ? AND estado != 'pagada'",
      ['pagada', String(payment.id), payment.status, reserva.id]
    );

    if (result.affectedRows > 0) {
      // Leer la reserva actualizada para que _procesarPagada tenga los datos frescos
      const reservaActualizada = await queryOne('SELECT * FROM reservas WHERE id = ?', [reserva.id]);
      _procesarPagada(reservaActualizada, payment.id).catch(e => console.warn('procesarPagada sincronizar:', e.message));
    }

    res.json({ estado: 'pagada' });
  } catch (err) {
    next(err);
  }
}

module.exports = { crearPreferencia, webhook, estado, sincronizar, procesarPagada: _procesarPagada };
