const { query, queryOne } = require('../db/connection');
const { sendNuevaConsultaPublica, sendRespuestaConsultaPublica } = require('../services/emailService');

// GET /api/espacios/:id/consultas  — público
async function listar(req, res, next) {
  try {
    const rows = await query(
      `SELECT id, autor_nombre, pregunta, respuesta, respuesta_at, created_at
       FROM consultas_espacio
       WHERE espacio_id = ?
       ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/espacios/:id/consultas  — requiere auth (demandante)
async function crear(req, res, next) {
  try {
    const { pregunta } = req.body;
    if (!pregunta?.trim()) {
      return res.status(400).json({ error: 'La pregunta no puede estar vacía' });
    }

    const espacio = await queryOne(
      `SELECT e.id, e.nombre, e.oferente_id, u.nombre AS oferente_nombre, u.email AS oferente_email
       FROM espacios e
       JOIN usuarios u ON e.oferente_id COLLATE utf8mb4_bin = u.id COLLATE utf8mb4_bin
       WHERE e.id = ? AND e.activo = TRUE`,
      [req.params.id]
    );
    if (!espacio) return res.status(404).json({ error: 'Espacio no encontrado' });
    if (espacio.oferente_id === req.user.id) {
      return res.status(400).json({ error: 'No podés consultar tu propio espacio' });
    }

    const autorNombre = req.user.nombre?.split(' ')[0] || 'Usuario';

    await query(
      `INSERT INTO consultas_espacio (espacio_id, autor_id, autor_nombre, pregunta)
       VALUES (?, ?, ?, ?)`,
      [req.params.id, req.user.id, autorNombre, pregunta.trim()]
    );

    const nueva = await queryOne(
      `SELECT id, autor_nombre, pregunta, respuesta, respuesta_at, created_at
       FROM consultas_espacio WHERE espacio_id = ? AND autor_id = ?
       ORDER BY created_at DESC LIMIT 1`,
      [req.params.id, req.user.id]
    );

    // Notificar al oferente por email (fire-and-forget)
    sendNuevaConsultaPublica(espacio.oferente_email, espacio.oferente_nombre, {
      autorNombre,
      espacioNombre: espacio.nombre,
      pregunta: pregunta.trim(),
      espacioId: espacio.id,
    }).catch(() => {});

    res.status(201).json(nueva);
  } catch (err) {
    next(err);
  }
}

// POST /api/consultas/:id/responder  — solo el oferente dueño del espacio
async function responder(req, res, next) {
  try {
    const { respuesta } = req.body;
    if (!respuesta?.trim()) {
      return res.status(400).json({ error: 'La respuesta no puede estar vacía' });
    }

    const consulta = await queryOne(
      `SELECT c.id, c.pregunta, c.autor_id,
              e.id AS espacio_id, e.nombre AS espacio_nombre, e.oferente_id
       FROM consultas_espacio c
       JOIN espacios e ON c.espacio_id = e.id
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (!consulta) return res.status(404).json({ error: 'Consulta no encontrada' });
    if (consulta.oferente_id !== req.user.id) {
      return res.status(403).json({ error: 'Solo el oferente puede responder' });
    }

    await query(
      `UPDATE consultas_espacio SET respuesta = ?, respuesta_at = NOW() WHERE id = ?`,
      [respuesta.trim(), req.params.id]
    );

    const actualizada = await queryOne(
      `SELECT id, autor_nombre, pregunta, respuesta, respuesta_at, created_at
       FROM consultas_espacio WHERE id = ?`,
      [req.params.id]
    );

    // Notificar al demandante (query separada para evitar mix de collations)
    const autor = await queryOne(
      'SELECT nombre, email FROM usuarios WHERE id = ?',
      [consulta.autor_id]
    );
    if (autor?.email) {
      sendRespuestaConsultaPublica(autor.email, autor.nombre, {
        espacioNombre: consulta.espacio_nombre,
        pregunta: consulta.pregunta,
        respuesta: respuesta.trim(),
        espacioId: consulta.espacio_id,
      }).catch(e => console.warn('Email respuesta consulta pública:', e.message));
    }

    res.json(actualizada);
  } catch (err) {
    next(err);
  }
}

// GET /api/consultas/mis-espacios  — oferente: consultas sin responder de sus espacios
async function sinResponder(req, res, next) {
  try {
    const rows = await query(
      `SELECT c.id, c.espacio_id, e.nombre AS espacio_nombre,
              c.autor_nombre, c.pregunta, c.created_at
       FROM consultas_espacio c
       JOIN espacios e ON c.espacio_id = e.id
       WHERE e.oferente_id = ? AND c.respuesta IS NULL
       ORDER BY c.created_at ASC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/consultas/mis-espacios/respondidas  — oferente: historial Q&A
async function consultasRespondidas(req, res, next) {
  try {
    const rows = await query(
      `SELECT c.id, e.nombre AS espacio_nombre,
              c.autor_nombre, c.pregunta, c.respuesta, c.respuesta_at, c.created_at
       FROM consultas_espacio c
       JOIN espacios e ON c.espacio_id = e.id
       WHERE e.oferente_id = ? AND c.respuesta IS NOT NULL
       ORDER BY c.respuesta_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, crear, responder, sinResponder, consultasRespondidas };
