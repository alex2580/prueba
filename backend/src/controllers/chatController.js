const { query, queryOne, transaction } = require('../db/connection');
const { validationResult } = require('express-validator');
const { sendNuevoMensajeChat } = require('../services/emailService');

const CHAT_EMAIL_COOLDOWN_MIN = 15;

// ── HTTP controllers ────────────────────────────────────────────

// GET /api/chat/admin/conversaciones  (admin only)
async function listarConversacionesAdmin(req, res, next) {
  try {
    const { espacio_id, demandante_id, oferente_id } = req.query;
    let sql = `
      SELECT c.*,
             e.nombre AS espacio_nombre, e.barrio,
             (SELECT url FROM espacio_fotos WHERE espacio_id = e.id ORDER BY orden LIMIT 1) AS espacio_img,
             ud.nombre AS demandante_nombre, ud.email AS demandante_email,
             uo.nombre AS oferente_nombre, uo.email AS oferente_email,
             (SELECT COUNT(*) FROM mensajes m WHERE m.conversacion_id = c.id) AS total_mensajes
      FROM conversaciones c
      JOIN espacios e   ON c.espacio_id    = e.id
      JOIN usuarios ud  ON c.demandante_id = ud.id
      JOIN usuarios uo  ON c.oferente_id   = uo.id
      WHERE 1=1
    `;
    const params = [];
    if (espacio_id)   { sql += ' AND c.espacio_id = ?';    params.push(espacio_id); }
    if (demandante_id){ sql += ' AND c.demandante_id = ?'; params.push(demandante_id); }
    if (oferente_id)  { sql += ' AND c.oferente_id = ?';   params.push(oferente_id); }
    sql += ' ORDER BY c.ultimo_msg_at DESC, c.created_at DESC LIMIT 200';

    const convs = await query(sql, params);
    res.json(convs);
  } catch (err) {
    next(err);
  }
}

// GET /api/chat/conversaciones
async function listarConversaciones(req, res, next) {
  try {
    const userId = req.user.id;
    const convs = await query(
      `SELECT c.*,
              e.nombre AS espacio_nombre, e.barrio,
              (SELECT url FROM espacio_fotos WHERE espacio_id = e.id ORDER BY orden LIMIT 1) AS espacio_img,
              ud.nombre AS demandante_nombre,
              uo.nombre AS oferente_nombre,
              (SELECT COUNT(*) FROM mensajes m WHERE m.conversacion_id = c.id AND m.leido = FALSE AND m.autor_id != ?) AS no_leidos
       FROM conversaciones c
       JOIN espacios e   ON c.espacio_id    = e.id
       JOIN usuarios ud  ON c.demandante_id = ud.id
       JOIN usuarios uo  ON c.oferente_id   = uo.id
       WHERE c.demandante_id = ? OR c.oferente_id = ?
       ORDER BY c.ultimo_msg_at DESC, c.created_at DESC`,
      [userId, userId, userId]
    );
    res.json(convs);
  } catch (err) {
    next(err);
  }
}

// GET /api/chat/conversaciones/:id/mensajes
async function obtenerMensajes(req, res, next) {
  try {
    const conv = await queryOne('SELECT * FROM conversaciones WHERE id = ?', [req.params.id]);
    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });

    if (conv.demandante_id !== req.user.id && conv.oferente_id !== req.user.id) {
      return res.status(403).json({ error: 'Sin acceso a esta conversación' });
    }

    const mensajes = await query(
      `SELECT m.*, u.nombre AS autor_nombre
       FROM mensajes m
       JOIN usuarios u ON m.autor_id = u.id
       WHERE m.conversacion_id = ?
       ORDER BY m.created_at ASC`,
      [req.params.id]
    );

    // Mark as read
    await query(
      'UPDATE mensajes SET leido = TRUE WHERE conversacion_id = ? AND autor_id != ?',
      [req.params.id, req.user.id]
    );

    res.json(mensajes);
  } catch (err) {
    next(err);
  }
}

// POST /api/chat/conversaciones
async function iniciarConversacion(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: 'Datos inválidos', details: errors.array() });
    }

    const { espacio_id, mensaje } = req.body;
    const demandante_id = req.user.id;

    const espacio = await queryOne('SELECT id, oferente_id FROM espacios WHERE id = ? AND activo = TRUE', [espacio_id]);
    if (!espacio) return res.status(404).json({ error: 'Espacio no encontrado' });
    if (espacio.oferente_id === demandante_id) {
      return res.status(400).json({ error: 'No puedes iniciar conversación con tu propio espacio' });
    }

    const conv = await transaction(async (conn) => {
      // Check if conversation already exists
      const [existing] = await conn.execute(
        'SELECT id FROM conversaciones WHERE espacio_id = ? AND demandante_id = ?',
        [espacio_id, demandante_id]
      );
      if (existing.length > 0) {
        const convId = existing[0].id;
        if (mensaje) {
          await conn.execute(
            'INSERT INTO mensajes (conversacion_id, autor_id, texto) VALUES (?, ?, ?)',
            [convId, demandante_id, mensaje]
          );
          await conn.execute(
            'UPDATE conversaciones SET ultimo_msg = ?, ultimo_msg_at = NOW() WHERE id = ?',
            [mensaje, convId]
          );
        }
        const [rows] = await conn.execute('SELECT * FROM conversaciones WHERE id = ?', [convId]);
        return rows[0];
      }

      // Create new conversation
      await conn.execute(
        'INSERT INTO conversaciones (espacio_id, demandante_id, oferente_id, ultimo_msg, ultimo_msg_at) VALUES (?, ?, ?, ?, NOW())',
        [espacio_id, demandante_id, espacio.oferente_id, mensaje || '']
      );

      const [convRows] = await conn.execute(
        'SELECT * FROM conversaciones WHERE espacio_id = ? AND demandante_id = ?',
        [espacio_id, demandante_id]
      );
      const newConv = convRows[0];

      if (mensaje) {
        await conn.execute(
          'INSERT INTO mensajes (conversacion_id, autor_id, texto) VALUES (?, ?, ?)',
          [newConv.id, demandante_id, mensaje]
        );
      }

      return newConv;
    });

    // Notificar al oferente del primer mensaje
    if (mensaje) {
      notificarDestinatario(conv, demandante_id, mensaje);
    }

    res.status(201).json(conv);
  } catch (err) {
    next(err);
  }
}

// POST /api/chat/conversaciones/:id/mensajes
async function enviarMensaje(req, res, next) {
  try {
    const { texto } = req.body;
    if (!texto?.trim()) return res.status(400).json({ error: 'El mensaje no puede estar vacío' });

    const conv = await queryOne('SELECT * FROM conversaciones WHERE id = ?', [req.params.id]);
    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });

    if (conv.demandante_id !== req.user.id && conv.oferente_id !== req.user.id) {
      return res.status(403).json({ error: 'Sin acceso a esta conversación' });
    }

    await query(
      'INSERT INTO mensajes (conversacion_id, autor_id, texto) VALUES (?, ?, ?)',
      [conv.id, req.user.id, texto.trim()]
    );
    await query(
      'UPDATE conversaciones SET ultimo_msg = ?, ultimo_msg_at = NOW() WHERE id = ?',
      [texto.trim().slice(0, 200), conv.id]
    );

    const msg = await queryOne(
      `SELECT m.*, u.nombre AS autor_nombre
       FROM mensajes m JOIN usuarios u ON m.autor_id = u.id
       WHERE m.conversacion_id = ? AND m.autor_id = ?
       ORDER BY m.created_at DESC LIMIT 1`,
      [conv.id, req.user.id]
    );

    // Emit via Socket.io
    const io = req.app?.get?.('io');
    if (io) {
      io.to(`conv:${conv.id}`).emit('nuevo_mensaje', msg);
    }

    // Email al destinatario (sin await — no bloquea la respuesta)
    notificarDestinatario(conv, req.user.id, texto.trim());

    res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
}

// ── Email notification helper ──────────────────────────────────
async function notificarDestinatario(conv, autorId, texto) {
  try {
    const destinatarioId = conv.demandante_id === autorId ? conv.oferente_id : conv.demandante_id;

    // Cooldown: si el mismo autor ya mandó un mensaje en los últimos N minutos, no reenviar email
    const reciente = await queryOne(
      `SELECT id FROM mensajes
       WHERE conversacion_id = ? AND autor_id = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
         AND id != (SELECT MAX(id) FROM mensajes WHERE conversacion_id = ? AND autor_id = ?)
       LIMIT 1`,
      [conv.id, autorId, CHAT_EMAIL_COOLDOWN_MIN, conv.id, autorId]
    );
    if (reciente) return;

    const [destinatario, autor, espacio] = await Promise.all([
      queryOne('SELECT nombre, email FROM usuarios WHERE id = ?', [destinatarioId]),
      queryOne('SELECT nombre FROM usuarios WHERE id = ?', [autorId]),
      queryOne('SELECT nombre FROM espacios WHERE id = ?', [conv.espacio_id]),
    ]);

    if (destinatario?.email && autor && espacio) {
      await sendNuevoMensajeChat(destinatario.email, destinatario.nombre, {
        nombreRemitente: autor.nombre,
        espacioNombre: espacio.nombre,
        previewMensaje: texto,
        conversacionId: conv.id,
      });
    }
  } catch (_) { /* no bloquear el flujo si el email falla */ }
}

// ── Socket.io handlers ─────────────────────────────────────────

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a conversation room
    socket.on('join_conversation', (conversacionId) => {
      socket.join(`conv:${conversacionId}`);
    });

    // Leave a conversation room
    socket.on('leave_conversation', (conversacionId) => {
      socket.leave(`conv:${conversacionId}`);
    });

    // Typing indicator
    socket.on('typing', ({ conversacionId, nombre }) => {
      socket.to(`conv:${conversacionId}`).emit('user_typing', { nombre });
    });

    socket.on('stop_typing', ({ conversacionId }) => {
      socket.to(`conv:${conversacionId}`).emit('user_stop_typing');
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = {
  listarConversacionesAdmin,
  listarConversaciones,
  obtenerMensajes,
  iniciarConversacion,
  enviarMensaje,
  setupSocketHandlers,
};
