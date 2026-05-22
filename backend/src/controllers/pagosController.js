const { queryOne, query } = require('../db/connection');
const mercadopagoService = require('../services/mercadopagoService');
const emailService = require('../services/emailService');
const { validationResult } = require('express-validator');

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
    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data?.id;
      if (!paymentId) return res.sendStatus(200);

      const payment = await mercadopagoService.obtenerPago(paymentId);
      const reservaId = payment?.metadata?.reserva_id || payment?.external_reference;

      if (!reservaId) return res.sendStatus(200);

      const reserva = await queryOne('SELECT * FROM reservas WHERE id = ?', [reservaId]);
      if (!reserva) return res.sendStatus(200);

      const status = payment.status; // approved | pending | rejected | cancelled

      let nuevoEstado;
      if (status === 'approved')  nuevoEstado = 'pagada';
      else if (status === 'rejected' || status === 'cancelled') nuevoEstado = 'cancelada';
      else nuevoEstado = 'pendiente';

      await query(
        'UPDATE reservas SET estado = ?, mp_payment_id = ?, mp_status = ? WHERE id = ?',
        [nuevoEstado, String(paymentId), status, reservaId]
      );

      // Notify both parties on payment
      if (nuevoEstado === 'pagada') {
        const usuario = await queryOne('SELECT * FROM usuarios WHERE id = ?', [reserva.usuario_id]);
        const espacio = await queryOne('SELECT nombre, oferente_id FROM espacios WHERE id = ?', [reserva.espacio_id]);
        if (usuario && espacio) {
          // Email al demandante
          emailService.sendPagoConfirmado(usuario.email, usuario.nombre, {
            espacioNombre: espacio.nombre,
            monto: reserva.precio_total,
            reservaId: reserva.id,
            paymentId,
          }).catch(e => console.warn('Email pago demandante:', e.message));
          // Email al oferente
          const oferente = await queryOne('SELECT email, nombre FROM usuarios WHERE id = ?', [espacio.oferente_id]);
          if (oferente) {
            emailService.sendPagoRecibidoOferente(oferente.email, oferente.nombre, {
              demandanteNombre: usuario.nombre,
              espacioNombre: espacio.nombre,
              monto: reserva.precio_total,
              reservaId: reserva.id,
            }).catch(e => console.warn('Email pago oferente:', e.message));
          }
        }
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

module.exports = { crearPreferencia, webhook, estado };
