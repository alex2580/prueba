const { query, queryOne } = require('../db/connection');
const { sendContacto, sendServiciosAdicionales, sendCuentaBloqueada, sendCuentaDesbloqueada } = require('../services/emailService');
const emailConfig = require('../services/emailConfig');

// ── Bootstrap tables ───────────────────────────────────────────
async function initTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS admin_notificaciones (
      id          VARCHAR(36)   PRIMARY KEY,
      tipo        VARCHAR(50)   NOT NULL,
      mensaje     TEXT          NOT NULL,
      fecha       DATETIME      NOT NULL,
      leido       TINYINT(1)    DEFAULT 0,
      datos       JSON,
      created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS admin_consultas (
      id          VARCHAR(36)   PRIMARY KEY,
      nombre      VARCHAR(255)  NOT NULL,
      email       VARCHAR(255)  NOT NULL,
      asunto      VARCHAR(255)  NOT NULL,
      mensaje     TEXT          NOT NULL,
      tipo        ENUM('consulta','queja','sugerencia') NOT NULL DEFAULT 'consulta',
      estado      ENUM('pendiente','respondida','resuelta') NOT NULL DEFAULT 'pendiente',
      respuesta   TEXT,
      fecha       DATETIME      NOT NULL,
      created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS admin_solicitudes_puntuacion (
      id              VARCHAR(36)   PRIMARY KEY,
      oferente_id     VARCHAR(36),
      nombre          VARCHAR(255)  NOT NULL,
      email           VARCHAR(255)  NOT NULL,
      tel             VARCHAR(50),
      espacio_nombre  VARCHAR(255),
      puntaje_actual  TINYINT       NOT NULL DEFAULT 0,
      estado          ENUM('pendiente','contactado','resuelto') NOT NULL DEFAULT 'pendiente',
      created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS admin_campanas (
      id           VARCHAR(36)  PRIMARY KEY,
      titulo       VARCHAR(255) NOT NULL,
      descripcion  TEXT,
      tipo         VARCHAR(50)  NOT NULL DEFAULT 'comunicado',
      fecha_inicio DATE         NOT NULL,
      fecha_fin    DATE         NOT NULL,
      activa       TINYINT(1)   DEFAULT 1,
      color        VARCHAR(20)  DEFAULT '#e8622a',
      created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Call on module load
initTables().catch(err => console.error('[admin] initTables error:', err));

// ── Notificaciones ─────────────────────────────────────────────

// GET /api/admin/notificaciones
async function getNotificaciones(req, res, next) {
  try {
    const rows = await query(
      'SELECT * FROM admin_notificaciones ORDER BY fecha DESC LIMIT 200'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/notificaciones/:id/leido
async function marcarLeido(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      'UPDATE admin_notificaciones SET leido = 1 WHERE id = ?',
      [id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Notificación no encontrada' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ── Consultas ──────────────────────────────────────────────────

// POST /api/admin/consultas  (public)
async function crearConsulta(req, res, next) {
  try {
    const { nombre, email, asunto, mensaje, tipo } = req.body;
    if (!nombre || !email || !asunto || !mensaje) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO admin_consultas (id, nombre, email, asunto, mensaje, tipo, fecha)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [id, nombre, email, asunto, mensaje, tipo || 'consulta']
    );

    // Notificar a los admins por email (sin bloquear la respuesta)
    const adminEmails = (process.env.ADMIN_EMAILS || 'alejandro.laporte@gmail.com')
      .split(',').map(e => e.trim()).filter(Boolean);
    for (const adminEmail of adminEmails) {
      sendContacto(adminEmail, { nombre, emailRemitente: email, asunto: `[${tipo || 'consulta'}] ${asunto}`, mensaje })
        .catch(err => console.error('Email admin error:', err.message));
    }

    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/consultas
async function getConsultas(req, res, next) {
  try {
    const rows = await query(
      'SELECT * FROM admin_consultas ORDER BY fecha DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/consultas/:id/responder
async function responderConsulta(req, res, next) {
  try {
    const { id } = req.params;
    const { respuesta } = req.body;
    if (!respuesta) return res.status(400).json({ error: 'Respuesta requerida' });
    const result = await query(
      `UPDATE admin_consultas SET respuesta = ?, estado = 'respondida' WHERE id = ?`,
      [respuesta, id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Consulta no encontrada' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/consultas/:id/estado
async function actualizarEstadoConsulta(req, res, next) {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    if (!['pendiente', 'respondida', 'resuelta'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    const result = await query(
      'UPDATE admin_consultas SET estado = ? WHERE id = ?',
      [estado, id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Consulta no encontrada' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function eliminarConsulta(req, res, next) {
  try {
    const result = await query('DELETE FROM admin_consultas WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Consulta no encontrada' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ── Campañas ───────────────────────────────────────────────────

// GET /api/admin/campanas
async function getCampanas(req, res, next) {
  try {
    const rows = await query(
      'SELECT * FROM admin_campanas ORDER BY fecha_inicio DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/campanas
async function crearCampana(req, res, next) {
  try {
    const { titulo, descripcion, tipo, fecha_inicio, fecha_fin, color } = req.body;
    if (!titulo || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO admin_campanas (id, titulo, descripcion, tipo, fecha_inicio, fecha_fin, color)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, titulo, descripcion || '', tipo || 'comunicado', fecha_inicio, fecha_fin, color || '#e8622a']
    );
    const campana = await queryOne('SELECT * FROM admin_campanas WHERE id = ?', [id]);
    res.status(201).json(campana);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/campanas/:id
async function eliminarCampana(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM admin_campanas WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Campaña no encontrada' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/notificar-servicios  (public)
async function notificarServicios(req, res, next) {
  try {
    const { nombreDemandante, emailDemandante, telDemandante, espacioNombre, servicios, fechaDesde, fechaHasta } = req.body;
    if (!emailDemandante || !espacioNombre || !Array.isArray(servicios) || !servicios.length) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Guardar siempre en el panel admin, independiente del email
    await query(
      'INSERT INTO admin_notificaciones (id, tipo, mensaje, fecha, datos) VALUES (UUID(), ?, ?, NOW(), ?)',
      [
        'servicios_adicionales',
        `🛎️ Servicios adicionales — ${espacioNombre} (${nombreDemandante || emailDemandante})`,
        JSON.stringify({ nombreDemandante, emailDemandante, telDemandante, espacioNombre, servicios, fechaDesde, fechaHasta }),
      ]
    );

    // Email secundario — no bloquea la respuesta si falla
    sendServiciosAdicionales('contacto@todasmiscosas.com', {
      nombreDemandante: nombreDemandante || 'Sin nombre',
      emailDemandante,
      telDemandante,
      espacioNombre,
      servicios,
      fechaDesde: fechaDesde || '—',
      fechaHasta: fechaHasta || '—',
    }).catch(e => console.warn('[notificarServicios] email error:', e.message));

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ── Gestión de usuarios ────────────────────────────────────────

// GET /api/admin/usuarios
async function getUsuarios(req, res, next) {
  try {
    const { q, tipo, estado } = req.query;

    let sql = `
      SELECT u.id, u.nombre, u.email, u.tel, u.tipo, u.verificado, u.activo,
             u.bloqueado_motivo, u.bloqueado_en, u.bloqueado_por,
             u.created_at,
             COUNT(DISTINCT e.id) AS espacios_count,
             COUNT(DISTINCT r.id) AS reservas_count
      FROM usuarios u
      LEFT JOIN espacios e ON e.oferente_id = u.id AND e.activo = TRUE
      LEFT JOIN reservas r ON r.usuario_id = u.id AND r.estado != 'cancelada'
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      sql += ' AND (u.nombre LIKE ? OR u.email LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    if (tipo && ['usuario','admin'].includes(tipo)) {
      sql += ' AND u.tipo = ?';
      params.push(tipo);
    }
    if (estado === 'activo')    { sql += ' AND u.activo = 1'; }
    if (estado === 'bloqueado') { sql += ' AND u.activo = 0'; }

    sql += ' GROUP BY u.id ORDER BY u.created_at DESC';

    const usuarios = await query(sql, params);
    res.json(usuarios);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/usuarios/:id/bloquear
async function bloquearUsuario(req, res, next) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const usuario = await queryOne('SELECT id, nombre, email, tipo, activo FROM usuarios WHERE id = ?', [id]);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    // No se puede bloquear a otro admin
    if (usuario.tipo === 'admin') {
      return res.status(403).json({ error: 'No se puede bloquear a un administrador' });
    }
    // No bloquearse a uno mismo
    if (usuario.id === req.user.id) {
      return res.status(403).json({ error: 'No podés bloquearte a vos mismo' });
    }

    await query(
      `UPDATE usuarios
       SET activo = 0, bloqueado_motivo = ?, bloqueado_en = NOW(), bloqueado_por = ?
       WHERE id = ?`,
      [motivo || null, req.user.id, id]
    );

    // Email al usuario bloqueado
    sendCuentaBloqueada(usuario.email, usuario.nombre, { motivo: motivo || '' })
      .catch(e => console.warn('Email bloqueo:', e.message));

    res.json({ ok: true, mensaje: `Usuario ${usuario.nombre} bloqueado` });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/usuarios/:id/desbloquear
async function desbloquearUsuario(req, res, next) {
  try {
    const { id } = req.params;

    const usuario = await queryOne('SELECT id, nombre, email, activo FROM usuarios WHERE id = ?', [id]);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    await query(
      `UPDATE usuarios
       SET activo = 1, bloqueado_motivo = NULL, bloqueado_en = NULL, bloqueado_por = NULL
       WHERE id = ?`,
      [id]
    );

    // Email al usuario desbloqueado
    sendCuentaDesbloqueada(usuario.email, usuario.nombre)
      .catch(e => console.warn('Email desbloqueo:', e.message));

    res.json({ ok: true, mensaje: `Usuario ${usuario.nombre} reactivado` });
  } catch (err) {
    next(err);
  }
}

// ── Publicaciones (espacios) ──────────────────────────────────

// GET /api/admin/publicaciones
async function getPublicaciones(req, res, next) {
  try {
    let rows;
    try {
      rows = await query(`
        SELECT e.id, e.nombre, e.barrio, e.pais, e.categoria, e.tipo,
               e.precio_dia, e.precio_mes, e.moneda,
               e.disponible, e.activo, e.inactiva_auto, e.rating, e.reviews_count,
               e.reservas_mes, e.created_at,
               e.eliminado_por_oferente, e.eliminado_at,
               e.fecha_vencimiento, e.vencida,
               u.id AS oferente_id, u.nombre AS oferente_nombre, u.email AS oferente_email
        FROM espacios e
        JOIN usuarios u ON e.oferente_id = u.id
        ORDER BY e.created_at DESC
      `);
    } catch (e) {
      if (e.code !== 'ER_BAD_FIELD_ERROR') throw e;
      // Columnas nuevas aún no migradas — fallback sin ellas
      rows = await query(`
        SELECT e.id, e.nombre, e.barrio, e.pais, e.categoria, e.tipo,
               e.precio_dia, e.precio_mes, e.moneda,
               e.disponible, e.activo, e.inactiva_auto, e.rating, e.reviews_count,
               e.reservas_mes, e.created_at,
               u.id AS oferente_id, u.nombre AS oferente_nombre, u.email AS oferente_email
        FROM espacios e
        JOIN usuarios u ON e.oferente_id = u.id
        ORDER BY e.created_at DESC
      `);
      rows = rows.map(r => ({ ...r, eliminado_por_oferente: 0, eliminado_at: null, fecha_vencimiento: null, vencida: 0 }));
    }
    res.json(rows.map(r => ({
      ...r,
      precio_dia:   r.precio_dia  != null ? parseFloat(r.precio_dia)  : null,
      precio_mes:   r.precio_mes  != null ? parseFloat(r.precio_mes)  : null,
      rating:       r.rating      != null ? parseFloat(r.rating)      : null,
    })));
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/publicaciones/:id/disponible
async function toggleDisponibleAdmin(req, res, next) {
  try {
    const { disponible } = req.body;
    const nuevoDisponible = disponible ? 1 : 0;
    const result = await query(
      'UPDATE espacios SET disponible = ?, inactiva_auto = 0, activo = ? WHERE id = ?',
      [nuevoDisponible, nuevoDisponible, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Espacio no encontrado' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ── Solicitudes de mejora de puntuación ───────────────────────

async function insertSolicitudPuntuacion({ userId, nombre, email, tel, espacioNombre, puntajeActual }) {
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO admin_solicitudes_puntuacion
       (id, oferente_id, nombre, email, tel, espacio_nombre, puntaje_actual)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, nombre, email, tel || null, espacioNombre || null, puntajeActual ?? 0]
  );
  return id;
}

// POST /api/admin/solicitudes-puntuacion  (auth required)
async function crearSolicitudPuntuacion(req, res, next) {
  try {
    const { espacioNombre, puntajeActual } = req.body;
    const id = await insertSolicitudPuntuacion({
      userId: req.user.id,
      nombre: req.user.nombre,
      email:  req.user.email,
      tel:    req.user.tel,
      espacioNombre,
      puntajeActual,
    });
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/solicitudes-puntuacion
async function getSolicitudesPuntuacion(req, res, next) {
  try {
    const rows = await query(
      'SELECT * FROM admin_solicitudes_puntuacion ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/solicitudes-puntuacion/:id/estado
async function actualizarEstadoSolicitud(req, res, next) {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    if (!['pendiente', 'contactado', 'resuelto'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    const result = await query(
      'UPDATE admin_solicitudes_puntuacion SET estado = ? WHERE id = ?',
      [estado, id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Solicitud no encontrada' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function eliminarSolicitudPuntuacion(req, res, next) {
  try {
    const result = await query('DELETE FROM admin_solicitudes_puntuacion WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Solicitud no encontrada' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ── Operaciones / Finanzas ─────────────────────────────────────

const COMISION = 0.15;

// GET /api/admin/operaciones
async function getOperaciones(req, res, next) {
  try {
    const reservas = await query(`
      SELECT r.id, r.estado, r.precio_total, r.fecha_desde, r.fecha_hasta, r.created_at,
             r.mp_payment_id, r.cancelacion_motivo,
             e.nombre   AS espacio_nombre,
             e.barrio   AS espacio_barrio,
             ud.nombre  AS demandante_nombre,
             ud.email   AS demandante_email,
             uo.nombre  AS oferente_nombre,
             uo.email   AS oferente_email
      FROM reservas r
      JOIN espacios  e  ON r.espacio_id  = e.id
      JOIN usuarios  ud ON r.usuario_id  = ud.id
      JOIN usuarios  uo ON e.oferente_id = uo.id
      ORDER BY r.created_at DESC
      LIMIT 500
    `);

    const estados = { pagada: 0, finalizada: 0, pendiente: 0, confirmada: 0, cancelada: 0 };
    let gmv = 0, gmvMes = 0;
    const ahora = new Date();
    const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

    for (const r of reservas) {
      estados[r.estado] = (estados[r.estado] || 0) + 1;
      if (r.estado === 'pagada' || r.estado === 'finalizada') {
        gmv += Number(r.precio_total);
        const mes = String(r.created_at).slice(0, 7);
        if (mes === mesActual) gmvMes += Number(r.precio_total);
      }
    }

    const comisionTotal = Math.round(gmv * COMISION);
    const comisionMes   = Math.round(gmvMes * COMISION);

    res.json({
      resumen: {
        total:       reservas.length,
        pagadas:     (estados.pagada || 0) + (estados.finalizada || 0),
        pendientes:  (estados.pendiente || 0) + (estados.confirmada || 0),
        canceladas:  estados.cancelada || 0,
        gmv,
        gmv_mes:     gmvMes,
        comision_total: comisionTotal,
        comision_mes:   comisionMes,
        neto_oferentes: gmv - comisionTotal,
      },
      reservas: reservas.map(r => ({
        ...r,
        precio_total:  Number(r.precio_total),
        comision_tmc:  Math.round(Number(r.precio_total) * COMISION),
        neto_oferente: Math.round(Number(r.precio_total) * (1 - COMISION)),
      })),
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/sincronizar-pendientes ─────────────────────
// Recorre reservas pendientes de las últimas 48h y las sincroniza contra MP.
async function sincronizarPendientes(req, res, next) {
  try {
    const mercadopagoService = require('../services/mercadopagoService');
    const { procesarPagada } = require('./pagosController');

    const pendientes = await query(`
      SELECT * FROM reservas
      WHERE estado IN ('pendiente', 'confirmada')
        AND created_at >= DATE_SUB(NOW(), INTERVAL 48 HOUR)
    `);

    let actualizadas = 0;
    for (const reserva of pendientes) {
      try {
        const payment = await mercadopagoService.buscarPagoPorReferencia(reserva.id);
        if (payment && payment.status === 'approved') {
          await query(
            'UPDATE reservas SET estado = ?, mp_payment_id = ?, mp_status = ? WHERE id = ?',
            ['pagada', String(payment.id), payment.status, reserva.id]
          );
          const reservaActualizada = await query('SELECT * FROM reservas WHERE id = ?', [reserva.id]);
          procesarPagada(reservaActualizada[0] || reserva, payment.id)
            .catch(e => console.warn(`[admin sync] emails reserva ${reserva.id}:`, e.message));
          actualizadas++;
          console.log(`[admin sync] Reserva ${reserva.id} pagada + emails disparados`);
        }
      } catch (e) {
        console.warn(`[admin sync] Error sincronizando reserva ${reserva.id}:`, e.message);
      }
    }

    res.json({ ok: true, revisadas: pendientes.length, actualizadas });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/movimientos ─────────────────────────────────
async function getMovimientos(req, res, next) {
  try {
    const movimientos = await query(`
      SELECT ml.*,
             r.precio_total, r.fecha_desde, r.fecha_hasta,
             r.estado AS reserva_estado,
             r.escrow_liberado, r.escrow_liberado_at,
             e.nombre AS espacio_nombre,
             ud.nombre AS cliente_nombre,
             uo.nombre AS proveedor_nombre
      FROM movimientos_ledger ml
      LEFT JOIN reservas r  ON ml.reserva_id = r.id
      LEFT JOIN espacios e  ON r.espacio_id  = e.id
      LEFT JOIN usuarios ud ON r.usuario_id  = ud.id
      LEFT JOIN usuarios uo ON e.oferente_id = uo.id
      ORDER BY ml.creado_at DESC
      LIMIT 500
    `);

    const resumen = await query(`
      SELECT
        COALESCE(SUM(CASE WHEN tipo = 'pago'         THEN monto ELSE 0 END), 0) AS total_pagos,
        COALESCE(SUM(CASE WHEN tipo = 'liberacion'   THEN monto ELSE 0 END), 0) AS total_liberaciones,
        COALESCE(SUM(CASE WHEN tipo = 'comision'     THEN monto ELSE 0 END), 0) AS total_comisiones,
        COALESCE(SUM(CASE WHEN tipo = 'cancelacion'  THEN monto ELSE 0 END), 0) AS total_cancelaciones,
        (SELECT COALESCE(SUM(monto),0) FROM movimientos_ledger WHERE cuenta_credito = 'tmc.escrow')
          - (SELECT COALESCE(SUM(monto),0) FROM movimientos_ledger WHERE cuenta_debito = 'tmc.escrow') AS saldo_escrow
      FROM movimientos_ledger
    `);

    res.json({ movimientos, resumen: resumen[0] });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/email-config ────────────────────────────────
async function getEmailConfig(req, res, next) {
  try {
    const rows = await emailConfig.getAll();
    const result = {};
    rows.forEach(r => { result[r.clave] = r.habilitado !== 0; });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/email-config ──────────────────────────────
async function updateEmailConfig(req, res, next) {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Body inválido' });
    }
    await emailConfig.setMany(updates);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotificaciones,
  marcarLeido,
  crearConsulta,
  getConsultas,
  responderConsulta,
  actualizarEstadoConsulta,
  eliminarConsulta,
  getCampanas,
  crearCampana,
  eliminarCampana,
  notificarServicios,
  getUsuarios,
  bloquearUsuario,
  desbloquearUsuario,
  crearSolicitudPuntuacion,
  getSolicitudesPuntuacion,
  actualizarEstadoSolicitud,
  eliminarSolicitudPuntuacion,
  insertSolicitudPuntuacion,
  getOperaciones,
  getPublicaciones,
  toggleDisponibleAdmin,
  getEmailConfig,
  updateEmailConfig,
  sincronizarPendientes,
  getMovimientos,
  getAuditoriaPerfil,
  purgarChatRetencion,
};

// ── POST /api/admin/chat/purgar ───────────────────────────────
async function purgarChatRetencion(req, res, next) {
  try {
    const result = await query(
      `DELETE FROM conversaciones WHERE purgar_after IS NOT NULL AND purgar_after < CURDATE()`
    );
    res.json({ purgadas: result.affectedRows });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/auditoria-perfil ───────────────────────────
async function getAuditoriaPerfil(req, res, next) {
  try {
    const rows = await query(`
      SELECT ap.id, ap.usuario_id, ap.campo, ap.valor_anterior, ap.valor_nuevo, ap.ip, ap.creado_at,
             u.nombre AS usuario_nombre, u.email AS usuario_email
      FROM auditoria_perfil ap
      LEFT JOIN usuarios u ON ap.usuario_id = u.id
      ORDER BY ap.creado_at DESC
      LIMIT 500
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}
