const { query, queryOne, transaction } = require('../db/connection');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');
const mercadopagoService = require('../services/mercadopagoService');
const ledgerService = require('../services/ledgerService');

function expandirRango(fechaDesde, fechaHasta) {
  const dias = [];
  const d = new Date(fechaDesde + 'T12:00:00');
  const hasta = new Date(fechaHasta + 'T12:00:00');
  while (d <= hasta) {
    dias.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    d.setDate(d.getDate() + 1);
  }
  return dias;
}

function parseSeguridad(r) {
  if (r.espacio_seguridad && typeof r.espacio_seguridad === 'string') {
    try { r.espacio_seguridad = JSON.parse(r.espacio_seguridad); } catch (_) { r.espacio_seguridad = null; }
  }
  return r;
}

// Inicializa la tabla de reservas ocultas (lazy, idempotente)
let _ocultasTableReady = false;
async function ensureOcultasTable() {
  if (_ocultasTableReady) return;
  const { pool } = require('../db/connection');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservas_ocultas (
      reserva_id VARCHAR(36) NOT NULL,
      usuario_id VARCHAR(36) NOT NULL,
      oculta_en  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (reserva_id, usuario_id),
      INDEX idx_usuario (usuario_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  _ocultasTableReady = true;
}

// GET /api/reservas  — reservas propias del usuario logueado (admin o no)
// El panel admin usa /api/admin/operaciones para la vista global
async function listar(req, res, next) {
  try {
    await ensureOcultasTable();

    const sql = `SELECT r.*,
               e.nombre AS espacio_nombre, e.barrio AS espacio_barrio, e.lat, e.lng,
               e.oferente_id, e.seguridad AS espacio_seguridad,
               u.nombre AS usuario_nombre, u.email AS usuario_email
         FROM reservas r
         JOIN espacios e ON r.espacio_id = e.id
         JOIN usuarios u ON r.usuario_id = u.id
         LEFT JOIN reservas_ocultas ro ON ro.reserva_id = r.id AND ro.usuario_id = ?
         WHERE r.usuario_id = ? AND r.estado != 'pendiente' AND ro.reserva_id IS NULL
         ORDER BY r.created_at DESC`;

    const reservas = await query(sql, [req.user.id, req.user.id]);
    res.json(reservas.map(parseSeguridad));
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
              e.seguridad AS espacio_seguridad,
              u.nombre AS usuario_nombre, u.email AS usuario_email, u.tel AS usuario_tel
       FROM reservas r
       JOIN espacios e ON r.espacio_id = e.id
       JOIN usuarios u ON r.usuario_id = u.id
       WHERE e.oferente_id = ? AND r.estado != 'pendiente'
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(reservas.map(parseSeguridad));
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
              e.seguridad AS espacio_seguridad,
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

    res.json(parseSeguridad(reserva));
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

    const { espacio_id, fecha_desde, fecha_hasta, notas, servicios: serviciosReq, modo, diasMulti } = req.body;
    const serviciosValidos = ['seguro', 'embalaje', 'transporte', 'limpieza'];
    const serviciosFiltrados = Array.isArray(serviciosReq)
      ? serviciosReq.filter(s => serviciosValidos.includes(s))
      : [];

    // Para reservas de días sueltos, los días vienen en diasMulti (ordenados)
    const esMododia = modo === 'dia' && Array.isArray(diasMulti) && diasMulti.length > 0;
    const diasOrdenados = esMododia ? [...diasMulti].sort() : null;
    const fdDesde = esMododia ? diasOrdenados[0] : fecha_desde;
    const fdHasta = esMododia ? diasOrdenados[diasOrdenados.length - 1] : fecha_hasta;

    // Verify espacio exists and is available
    const espacio = await queryOne(
      'SELECT id, precio_dia, precio_mes, disponible, cupo_disponible, tipo, oferente_id, nombre FROM espacios WHERE id = ? AND activo = TRUE',
      [espacio_id]
    );
    if (!espacio) return res.status(404).json({ error: 'Espacio no encontrado' });
    if (!espacio.disponible) return res.status(409).json({ error: 'El espacio no está disponible' });
    if (espacio.tipo === 'compartido' && !espacio.cupo_disponible) {
      return res.status(409).json({ error: 'Este espacio compartido no tiene disponibilidad en este momento. El oferente informará cuando vuelva a tener cupo.' });
    }
    if (espacio.oferente_id === req.user.id) {
      return res.status(400).json({ error: 'No puedes reservar tu propio espacio' });
    }

    // Check no overlapping reservas (solo para espacios exclusivos)
    if (espacio.tipo === 'compartido') {
      // Compartidos permiten múltiples reservas simultáneas — no se chequea solapamiento
    } else
    if (esMododia) {
      // Para días sueltos: verificar que ninguno de los días seleccionados esté ocupado
      const ocupadas = await query(
        `SELECT fecha_desde, fecha_hasta, dias_json, modo FROM reservas
         WHERE espacio_id = ? AND estado NOT IN ('cancelada')
           AND fecha_desde <= ? AND fecha_hasta >= ?`,
        [espacio_id, fdHasta, fdDesde]
      );
      for (const r of ocupadas) {
        const diasOcupados = r.modo === 'dia' && r.dias_json
          ? JSON.parse(r.dias_json)
          : expandirRango(r.fecha_desde, r.fecha_hasta);
        const conflicto = diasOrdenados.some(d => diasOcupados.includes(d));
        if (conflicto) {
          return res.status(409).json({ error: 'Uno o más días seleccionados ya están reservados por otro usuario.' });
        }
      }
    } else {
      const overlap = await queryOne(
        `SELECT id FROM reservas
         WHERE espacio_id = ? AND estado NOT IN ('cancelada')
           AND fecha_desde <= ? AND fecha_hasta >= ?`,
        [espacio_id, fdHasta, fdDesde]
      );
      if (overlap) {
        return res.status(409).json({ error: 'El espacio ya está reservado para esas fechas' });
      }
    }

    // Calculate price
    const desde = new Date(fdDesde + 'T12:00:00');
    const hasta  = new Date(fdHasta + 'T12:00:00');
    const dias   = esMododia ? diasOrdenados.length : (Math.ceil((hasta - desde) / (1000 * 60 * 60 * 24)) + 1);

    if (dias < 1) return res.status(400).json({ error: 'Las fechas seleccionadas no son válidas.' });
    if (dias > 90) return res.status(400).json({ error: 'La reserva no puede superar los 90 días (3 meses).' });
    const precio_total = dias >= 28
      ? Math.ceil(dias / 30) * espacio.precio_mes
      : dias * espacio.precio_dia;

    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const diasJsonStr = esMododia ? JSON.stringify(diasOrdenados) : null;

    const reserva = await transaction(async (conn) => {
      await conn.execute(
        `INSERT INTO reservas (espacio_id, usuario_id, fecha_desde, fecha_hasta, precio_total, notas, pin_acceso, modo, dias_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [espacio_id, req.user.id, fdDesde, fdHasta, precio_total, notas || '', pin, modo || null, diasJsonStr]
      );
      const [rows] = await conn.execute(
        'SELECT * FROM reservas WHERE usuario_id = ? ORDER BY created_at DESC LIMIT 1',
        [req.user.id]
      );
      const nuevaReserva = rows[0];
      for (const tipo of serviciosFiltrados) {
        await conn.execute(
          'INSERT INTO servicios_adicionales (reserva_id, tipo, precio) VALUES (?, ?, 0)',
          [nuevaReserva.id, tipo]
        );
      }
      return nuevaReserva;
    });

    // Emails y notificaciones se envían únicamente cuando el pago se confirma (webhook MP)
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

    // Registro contable: si la reserva estaba pagada había dinero en escrow → devolver al cliente
    if (reserva.estado === 'pagada') {
      ledgerService.registrarCancelacion(
        reserva.id, reserva.usuario_id, reserva.precio_total,
        `Cancelación — ${reserva.espacio_nombre}`
      ).catch(e => console.warn('Ledger cancelacion:', e.message));
    }

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

// PATCH /api/reservas/:id/ocultar  (demandante: ocultar del historial propio)
async function ocultar(req, res, next) {
  try {
    await ensureOcultasTable();

    const reserva = await queryOne(
      'SELECT id, usuario_id, estado FROM reservas WHERE id = ?',
      [req.params.id]
    );
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (reserva.usuario_id !== req.user.id) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    if (!['cancelada', 'finalizada'].includes(reserva.estado)) {
      return res.status(400).json({ error: 'Solo podés borrar reservas canceladas o finalizadas' });
    }

    await query(
      'INSERT INTO reservas_ocultas (reserva_id, usuario_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE reserva_id = reserva_id',
      [reserva.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/reservas/:id/confirmar-acceso  (demandante confirma que ingresó al espacio)
async function confirmarAcceso(req, res, next) {
  try {
    const reserva = await queryOne(
      `SELECT r.*,
              e.nombre AS espacio_nombre, e.oferente_id,
              u.nombre AS usuario_nombre, u.email AS usuario_email,
              u2.nombre AS oferente_nombre, u2.email AS oferente_email, u2.cbu_alias AS oferente_cbu
       FROM reservas r
       JOIN espacios e ON r.espacio_id = e.id
       JOIN usuarios u ON r.usuario_id = u.id
       JOIN usuarios u2 ON e.oferente_id = u2.id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (reserva.usuario_id !== req.user.id) {
      return res.status(403).json({ error: 'Solo el demandante puede confirmar el acceso' });
    }
    if (reserva.estado !== 'pagada') {
      return res.status(409).json({ error: 'Solo podés confirmar el acceso en reservas en estado pagada' });
    }
    if (reserva.escrow_liberado) {
      return res.status(409).json({ error: 'El escrow ya fue liberado para esta reserva' });
    }

    const hoy   = new Date();
    const desde = new Date(reserva.fecha_desde);
    // Ignorar hora — comparar solo fecha
    hoy.setHours(0, 0, 0, 0);
    desde.setHours(0, 0, 0, 0);
    if (hoy < desde) {
      const dStr = String(reserva.fecha_desde).slice(0, 10);
      return res.status(409).json({ error: `No podés confirmar el acceso antes de la fecha de inicio (${dStr})` });
    }

    const neto = Number(reserva.escrow_neto_oferente) || Math.round(Number(reserva.precio_total) * 0.85);

    await query(
      `UPDATE reservas SET escrow_liberado = 1, escrow_liberado_at = NOW() WHERE id = ?`,
      [reserva.id]
    );

    // Registro contable: tmc.escrow → proveedor (85%) + tmc.comision (15%)
    ledgerService.registrarLiberacion(
      reserva.id, reserva.oferente_id, reserva.precio_total,
      `Acceso confirmado — ${reserva.espacio_nombre}`
    ).catch(e => console.warn('Ledger liberacion:', e.message));

    const adminEmail = process.env.ADMIN_EMAILS || 'contacto@todasmiscosas.com';
    emailService.sendEscrowLiberadoAdmin(adminEmail, {
      reservaId: reserva.id,
      espacioNombre: reserva.espacio_nombre,
      oferenteNombre: reserva.oferente_nombre,
      oferenteCbu: reserva.oferente_cbu || '(sin CBU/alias registrado)',
      monto: neto,
      demandanteNombre: reserva.usuario_nombre,
      autoRelease: false,
    }).catch(e => console.warn('Email escrow admin:', e.message));

    emailService.sendAccesoConfirmadoOferente(reserva.oferente_email, reserva.oferente_nombre, {
      espacioNombre: reserva.espacio_nombre,
      monto: neto,
      reservaId: reserva.id,
      autoRelease: false,
    }).catch(e => console.warn('Email acceso oferente:', e.message));

    emailService.sendAccesoConfirmadoDemandante(reserva.usuario_email, reserva.usuario_nombre, {
      espacioNombre: reserva.espacio_nombre,
      reservaId: reserva.id,
    }).catch(e => console.warn('Email acceso demandante:', e.message));

    res.json({ ok: true, message: 'Acceso confirmado. El pago será transferido al oferente dentro de las 48 horas hábiles.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, recibidas, obtener, crear, cambiarEstado, cancelar, extender, ocultar, confirmarAcceso };
