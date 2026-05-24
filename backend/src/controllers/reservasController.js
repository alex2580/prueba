const { query, queryOne, transaction } = require('../db/connection');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');
const mercadopagoService = require('../services/mercadopagoService');

// GET /api/reservas  (admin: all; user: own)
async function listar(req, res, next) {
  try {
    const isAdmin = req.user.tipo === 'admin';
    const sql = `
      SELECT r.*,
             e.nombre AS espacio_nombre, e.barrio AS espacio_barrio, e.lat, e.lng,
             e.oferente_id,
             u.nombre AS usuario_nombre, u.email AS usuario_email
      FROM reservas r
      JOIN espacios e ON r.espacio_id = e.id
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE ${isAdmin ? '1=1' : 'r.usuario_id = ?'}
      ORDER BY r.created_at DESC
    `;
    const params = isAdmin ? [] : [req.user.id];
    const reservas = await query(sql, params);
    res.json(reservas);
  } catch (err) {
    next(err);
  }
}

// GET /api/reservas/recibidas  (oferente: reservas de sus espacios)
async function recibidas(req, res, next) {
  try {
    const reservas = await query(
      `SELECT r.*,
              e.nombre AS espacio_nombre, e.barrio AS espacio_barrio,
              u.nombre AS usuario_nombre, u.email AS usuario_email, u.tel AS usuario_tel
       FROM reservas r
       JOIN espacios e ON r.espacio_id = e.id
       JOIN usuarios u ON r.usuario_id = u.id
       WHERE e.oferente_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(reservas);
  } catch (err) {
    next(err);
  }
}

// GET /api/reservas/:id
async function obtener(req, res, next) {
  try {
    const reserva = await queryOne(
      `SELECT r.*,
              e.nombre AS espacio_nombre, e.barrio, e.lat, e.lng, e.oferente_id,
              u.nombre AS usuario_nombre, u.email AS usuario_email, u.tel AS usuario_tel
       FROM reservas r
       JOIN espacios e ON r.espacio_id = e.id
       JOIN usuarios u ON r.usuario_id = u.id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });

    // Solo puede ver el usuario propietario, el oferente del espacio, o admin
    if (
      reserva.usuario_id !== req.user.id &&
      reserva.oferente_id !== req.user.id &&
      req.user.tipo !== 'admin'
    ) {
      return res.status(403).json({ error: 'Sin permisos para ver esta reserva' });
    }

    // Servicios adicionales
    const servicios = await query(
      'SELECT * FROM servicios_adicionales WHERE reserva_id = ?',
      [reserva.id]
    );
    reserva.servicios = servicios;

    res.json(reserva);
  } catch (err) {
    next(err);
  }
}

// POST /api/reservas
async function crear(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: 'Datos inválidos', details: errors.array() });
    }

    const { espacio_id, fecha_desde, fecha_hasta, notas } = req.body;

    // Verify espacio exists and is available
    const espacio = await queryOne(
      'SELECT id, precio_dia, precio_mes, disponible, oferente_id, nombre FROM espacios WHERE id = ? AND activo = TRUE',
      [espacio_id]
    );
    if (!espacio) return res.status(404).json({ error: 'Espacio no encontrado' });
    if (!espacio.disponible) return res.status(409).json({ error: 'El espacio no está disponible' });
    if (espacio.oferente_id === req.user.id) {
      return res.status(400).json({ error: 'No puedes reservar tu propio espacio' });
    }

    // Check no overlapping reservas
    const overlap = await queryOne(
      `SELECT id FROM reservas
       WHERE espacio_id = ? AND estado NOT IN ('cancelada')
         AND fecha_desde <= ? AND fecha_hasta >= ?`,
      [espacio_id, fecha_hasta, fecha_desde]
    );
    if (overlap) {
      return res.status(409).json({ error: 'El espacio ya está reservado para esas fechas' });
    }

    // Calculate price
    const desde = new Date(fecha_desde);
    const hasta  = new Date(fecha_hasta);
    const dias   = Math.ceil((hasta - desde) / (1000 * 60 * 60 * 24)) + 1;
    const precio_total = dias >= 28
      ? Math.ceil(dias / 30) * espacio.precio_mes
      : dias * espacio.precio_dia;

    const pin = String(Math.floor(1000 + Math.random() * 9000));

    const reserva = await transaction(async (conn) => {
      await conn.execute(
        `INSERT INTO reservas (espacio_id, usuario_id, fecha_desde, fecha_hasta, precio_total, notas, pin_acceso)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [espacio_id, req.user.id, fecha_desde, fecha_hasta, precio_total, notas || '', pin]
      );
      const [rows] = await conn.execute(
        'SELECT * FROM reservas WHERE usuario_id = ? ORDER BY created_at DESC LIMIT 1',
        [req.user.id]
      );
      return rows[0];
    });

    // Email al demandante: reserva recibida
    emailService.sendReservaConfirmada(req.user.email, req.user.nombre, {
      espacioNombre: espacio.nombre,
      fechaDesde: fecha_desde,
      fechaHasta: fecha_hasta,
      precioTotal: precio_total,
      reservaId: reserva.id,
      pin,
    }).catch(e => console.warn('Email demandante:', e.message));

    // Email al oferente: nueva solicitud recibida
    const oferente = await queryOne('SELECT email, nombre FROM usuarios WHERE id = ?', [espacio.oferente_id]);
    if (oferente) {
      emailService.sendNuevaReserva(oferente.email, oferente.nombre, {
        demandanteNombre: req.user.nombre,
        demandanteTel: req.user.tel || '',
        espacioNombre: espacio.nombre,
        fechaDesde: fecha_desde,
        fechaHasta: fecha_hasta,
        precioTotal: precio_total,
        reservaId: reserva.id,
        pin,
      }).catch(e => console.warn('Email oferente:', e.message));
    }

    res.status(201).json(reserva);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/reservas/:id/estado
async function cambiarEstado(req, res, next) {
  try {
    const { estado } = req.body;
    const estadosValidos = ['pendiente', 'confirmada', 'pagada', 'cancelada', 'finalizada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: `Estado inválido. Opciones: ${estadosValidos.join(', ')}` });
    }

    const reserva = await queryOne(
      `SELECT r.*,
              e.oferente_id, e.nombre AS espacio_nombre,
              u.nombre AS usuario_nombre, u.email AS usuario_email
       FROM reservas r
       JOIN espacios e ON r.espacio_id = e.id
       JOIN usuarios u ON r.usuario_id = u.id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });

    // Only owner, oferente of the espacio, or admin can change status
    if (
      reserva.usuario_id !== req.user.id &&
      reserva.oferente_id !== req.user.id &&
      req.user.tipo !== 'admin'
    ) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    await query('UPDATE reservas SET estado = ? WHERE id = ?', [estado, reserva.id]);
    const updated = await queryOne('SELECT * FROM reservas WHERE id = ?', [reserva.id]);

    // Emails según nuevo estado
    const oferente = await queryOne('SELECT email, nombre FROM usuarios WHERE id = ?', [reserva.oferente_id]);

    if (estado === 'confirmada') {
      // Avisar al demandante que el oferente aprobó
      emailService.sendReservaAprobada(reserva.usuario_email, reserva.usuario_nombre, {
        espacioNombre: reserva.espacio_nombre,
        fechaDesde: reserva.fecha_desde,
        fechaHasta: reserva.fecha_hasta,
        precioTotal: reserva.precio_total,
        reservaId: reserva.id,
      }).catch(e => console.warn('Email aprobada:', e.message));
    }

    if (estado === 'cancelada') {
      const canceladoPor = req.user.id === reserva.usuario_id ? 'el demandante' : 'el oferente';
      emailService.sendReservaCancelada(reserva.usuario_email, reserva.usuario_nombre, {
        espacioNombre: reserva.espacio_nombre,
        fechaDesde: reserva.fecha_desde,
        fechaHasta: reserva.fecha_hasta,
        canceladoPor,
      }).catch(e => console.warn('Email cancelada (demandante):', e.message));
      if (oferente) {
        emailService.sendReservaCancelada(oferente.email, oferente.nombre, {
          espacioNombre: reserva.espacio_nombre,
          fechaDesde: reserva.fecha_desde,
          fechaHasta: reserva.fecha_hasta,
          canceladoPor,
        }).catch(e => console.warn('Email cancelada (oferente):', e.message));
      }
    }

    if (estado === 'finalizada') {
      emailService.sendReservaFinalizada(reserva.usuario_email, reserva.usuario_nombre, {
        espacioNombre: reserva.espacio_nombre,
        reservaId: reserva.id,
      }).catch(e => console.warn('Email finalizada:', e.message));
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/reservas/:id  (cancel)
async function cancelar(req, res, next) {
  try {
    const reserva = await queryOne(
      `SELECT r.*,
              e.oferente_id, e.nombre AS espacio_nombre,
              u.nombre AS usuario_nombre, u.email AS usuario_email
       FROM reservas r
       JOIN espacios e ON r.espacio_id = e.id
       JOIN usuarios u ON r.usuario_id = u.id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });

    if (
      reserva.usuario_id !== req.user.id &&
      reserva.oferente_id !== req.user.id &&
      req.user.tipo !== 'admin'
    ) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    if (['cancelada', 'finalizada'].includes(reserva.estado)) {
      return res.status(400).json({ error: `No se puede cancelar una reserva en estado "${reserva.estado}"` });
    }

    await query('UPDATE reservas SET estado = ? WHERE id = ?', ['cancelada', reserva.id]);

    // Avisar a ambas partes
    const canceladoPor = req.user.id === reserva.usuario_id ? 'el demandante' : 'el oferente';
    const emailData = {
      espacioNombre: reserva.espacio_nombre,
      fechaDesde: reserva.fecha_desde,
      fechaHasta: reserva.fecha_hasta,
      canceladoPor,
    };
    emailService.sendReservaCancelada(reserva.usuario_email, reserva.usuario_nombre, emailData)
      .catch(e => console.warn('Email cancelada (demandante):', e.message));
    const oferente = await queryOne('SELECT email, nombre FROM usuarios WHERE id = ?', [reserva.oferente_id]);
    if (oferente) {
      emailService.sendReservaCancelada(oferente.email, oferente.nombre, emailData)
        .catch(e => console.warn('Email cancelada (oferente):', e.message));
    }

    res.json({ message: 'Reserva cancelada', id: reserva.id });
  } catch (err) {
    next(err);
  }
}

// POST /api/reservas/:id/extender
// Crea una preferencia de pago para extender la fecha_hasta de una reserva pagada.
async function extender(req, res, next) {
  try {
    const { nueva_fecha_hasta } = req.body;
    if (!nueva_fecha_hasta) {
      return res.status(400).json({ error: 'nueva_fecha_hasta requerida (YYYY-MM-DD)' });
    }

    const reserva = await queryOne(
      `SELECT r.*,
              e.nombre AS espacio_nombre, e.precio_dia, e.precio_mes, e.oferente_id,
              u.nombre AS usuario_nombre, u.email AS usuario_email
       FROM reservas r
       JOIN espacios e ON r.espacio_id = e.id
       JOIN usuarios u ON r.usuario_id = u.id
       WHERE r.id = ?`,
      [req.params.id]
    );

    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (reserva.usuario_id !== req.user.id) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    if (reserva.estado !== 'pagada') {
      return res.status(409).json({ error: 'Solo podés extender reservas con estado pagada' });
    }

    const fechaHastaActual = new Date(reserva.fecha_hasta);
    const fechaNueva       = new Date(nueva_fecha_hasta);

    if (fechaNueva <= fechaHastaActual) {
      return res.status(400).json({ error: 'La nueva fecha debe ser posterior a la fecha actual de vencimiento' });
    }

    // Verificar que no hay otra reserva que ocupe ese espacio en el período de extensión
    const overlap = await queryOne(
      `SELECT id FROM reservas
       WHERE espacio_id = ? AND id != ? AND estado NOT IN ('cancelada','finalizada')
         AND fecha_desde <= ? AND fecha_hasta >= ?`,
      [reserva.espacio_id, reserva.id, nueva_fecha_hasta, reserva.fecha_hasta]
    );
    if (overlap) {
      return res.status(409).json({ error: 'El espacio ya está ocupado en ese período' });
    }

    // Calcular precio de la extensión (días adicionales)
    const diasExtra = Math.ceil((fechaNueva - fechaHastaActual) / (1000 * 60 * 60 * 24));
    const precio = diasExtra >= 28
      ? Math.ceil(diasExtra / 30) * parseFloat(reserva.precio_mes)
      : diasExtra * parseFloat(reserva.precio_dia);

    // Crear registro de extensión pendiente
    const extensionId = uuidv4();
    await query(
      `INSERT INTO reserva_extensiones (id, reserva_id, nueva_fecha_hasta, precio)
       VALUES (?, ?, ?, ?)`,
      [extensionId, reserva.id, nueva_fecha_hasta, precio]
    );

    // Crear preferencia MP
    const preference = await mercadopagoService.crearPreferenciaExtension({
      extensionId,
      reservaId: reserva.id,
      espacioNombre: reserva.espacio_nombre,
      monto: precio,
      nuevaFechaHasta: nueva_fecha_hasta,
      usuarioEmail: reserva.usuario_email,
      usuarioNombre: reserva.usuario_nombre,
    });

    // Guardar preference_id
    await query(
      'UPDATE reserva_extensiones SET mp_preference_id = ? WHERE id = ?',
      [preference.id, extensionId]
    );

    res.json({
      extension_id: extensionId,
      precio,
      dias_extra: diasExtra,
      nueva_fecha_hasta,
      preference_id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, recibidas, obtener, crear, cambiarEstado, cancelar, extender };
