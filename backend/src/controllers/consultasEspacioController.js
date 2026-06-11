const { query } = require('../db/connection');
const { sendNuevaConsultaPublica, sendRespuestaConsultaPublica } = require('../services/emailService');

// GET /espacios/:id/consultas — public
async function listar(req, res) {
  try {
    const rows = await query(
      `SELECT id, autor_nombre, pregunta, respuesta, respuesta_at, created_at
       FROM consultas_espacio WHERE espacio_id = ? ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    console.error('[consultas] listar:', e.message);
    res.status(500).json({ error: 'Error interno' });
  }
}

// POST /espacios/:id/consultas — requireAuth
async function crear(req, res) {
  try {
    const { id: espacioId } = req.params;
    const { pregunta } = req.body;
    if (!pregunta?.trim()) return res.status(400).json({ error: 'La pregunta no puede estar vacía' });

    const { id: autorId, nombre: autorNombre } = req.user;

    await query(
      'INSERT INTO consultas_espacio (espacio_id, autor_id, autor_nombre, pregunta) VALUES (?, ?, ?, ?)',
      [espacioId, autorId, autorNombre, pregunta.trim()]
    );

    // Email al proveedor — consultas separadas para evitar collation mismatch
    try {
      const [espacio] = await query('SELECT id, nombre, oferente_id FROM espacios WHERE id = ?', [espacioId]);
      if (espacio && espacio.oferente_id !== autorId) {
        const [oferente] = await query('SELECT email, nombre FROM usuarios WHERE id = ?', [espacio.oferente_id]);
        if (oferente) {
          await sendNuevaConsultaPublica(oferente.email, oferente.nombre, {
            autorNombre,
            espacioNombre: espacio.nombre,
            pregunta: pregunta.trim(),
            espacioId,
          });
        }
      }
    } catch (e) {
      console.error('[consultas] email proveedor:', e.message);
    }

    res.status(201).json({ ok: true });
  } catch (e) {
    console.error('[consultas] crear:', e.message);
    res.status(500).json({ error: 'Error interno' });
  }
}

// POST /consultas/:id/responder — requireAuth (proveedor del espacio)
async function responder(req, res) {
  try {
    const { id } = req.params;
    const { respuesta } = req.body;
    if (!respuesta?.trim()) return res.status(400).json({ error: 'La respuesta no puede estar vacía' });

    // COLLATE utf8mb4_0900_ai_ci en c.espacio_id para que el JOIN no falle por collation mismatch
    const rows = await query(
      `SELECT c.id, c.autor_id, c.pregunta, c.espacio_id,
              e.nombre AS espacio_nombre, e.oferente_id
       FROM consultas_espacio c
       JOIN espacios e ON e.id = c.espacio_id COLLATE utf8mb4_0900_ai_ci
       WHERE c.id = ?`,
      [id]
    );
    const consulta = rows[0];
    if (!consulta) return res.status(404).json({ error: 'Consulta no encontrada' });
    if (consulta.oferente_id !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

    await query(
      'UPDATE consultas_espacio SET respuesta = ?, respuesta_at = NOW() WHERE id = ?',
      [respuesta.trim(), id]
    );

    // Email al cliente — query separada para evitar JOIN con usuarios desde consultas_espacio
    try {
      const [autor] = await query('SELECT email, nombre FROM usuarios WHERE id = ?', [consulta.autor_id]);
      if (autor) {
        await sendRespuestaConsultaPublica(autor.email, autor.nombre, {
          espacioNombre: consulta.espacio_nombre,
          pregunta: consulta.pregunta,
          respuesta: respuesta.trim(),
          espacioId: consulta.espacio_id,
        });
      }
    } catch (e) {
      console.error('[consultas] email cliente:', e.message);
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('[consultas] responder:', e.message);
    res.status(500).json({ error: 'Error interno' });
  }
}

// GET /consultas/mis-espacios — proveedor: consultas sin responder
async function sinResponder(req, res) {
  try {
    const rows = await query(
      `SELECT c.id, c.espacio_id, c.autor_nombre, c.pregunta, c.created_at,
              e.nombre AS espacio_nombre
       FROM consultas_espacio c
       JOIN espacios e ON e.id = c.espacio_id COLLATE utf8mb4_0900_ai_ci
       WHERE e.oferente_id = ? AND c.respuesta IS NULL
       ORDER BY c.created_at ASC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error('[consultas] sinResponder:', e.message);
    res.status(500).json({ error: 'Error interno' });
  }
}

// GET /consultas/mis-espacios/respondidas — proveedor: historial respondidas
async function consultasRespondidas(req, res) {
  try {
    const rows = await query(
      `SELECT c.id, c.autor_nombre, c.pregunta, c.respuesta, c.respuesta_at, c.created_at,
              e.nombre AS espacio_nombre
       FROM consultas_espacio c
       JOIN espacios e ON e.id = c.espacio_id COLLATE utf8mb4_0900_ai_ci
       WHERE e.oferente_id = ? AND c.respuesta IS NOT NULL
       ORDER BY c.respuesta_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error('[consultas] consultasRespondidas:', e.message);
    res.status(500).json({ error: 'Error interno' });
  }
}

// GET /consultas/mis-consultas — cliente: mis propias preguntas
async function misConsultasCliente(req, res) {
  try {
    const rows = await query(
      `SELECT c.id, c.espacio_id, c.pregunta, c.respuesta, c.respuesta_at, c.created_at,
              e.nombre AS espacio_nombre
       FROM consultas_espacio c
       JOIN espacios e ON e.id = c.espacio_id COLLATE utf8mb4_0900_ai_ci
       WHERE c.autor_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error('[consultas] misConsultasCliente:', e.message);
    res.status(500).json({ error: 'Error interno' });
  }
}

// GET /consultas-espacio/admin — admin: todas las consultas
async function listarAdmin(req, res) {
  try {
    const rows = await query(
      `SELECT c.id, c.espacio_id, c.autor_id, c.autor_nombre, c.pregunta,
              c.respuesta, c.respuesta_at, c.created_at,
              e.nombre AS espacio_nombre
       FROM consultas_espacio c
       JOIN espacios e ON e.id = c.espacio_id COLLATE utf8mb4_0900_ai_ci
       ORDER BY c.created_at DESC LIMIT 200`,
      []
    );
    res.json(rows);
  } catch (e) {
    console.error('[consultas] listarAdmin:', e.message);
    res.status(500).json({ error: 'Error interno' });
  }
}

// DELETE /consultas-espacio/admin/:id — admin: eliminar consulta
async function eliminarAdmin(req, res) {
  try {
    await query('DELETE FROM consultas_espacio WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('[consultas] eliminarAdmin:', e.message);
    res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { listar, crear, responder, sinResponder, consultasRespondidas, misConsultasCliente, listarAdmin, eliminarAdmin };
