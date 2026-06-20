const { query } = require('../db/connection');
const { sendNuevaConsultaPublica, sendRespuestaConsultaPublica } = require('../services/emailService');

// GET /espacios/:id/consultas — public
async function listar(req, res) {
  try {
    const rows = await query(
      `SELECT id, autor_nombre, pregunta, respuesta, respuesta_at, created_at
       FROM consultas_espacio WHERE espacio_id = ? ORDER BY created_at DESC LIMIT 5`,
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

    // Email al proveedor — queries separadas para evitar collation mismatch
    try {
      const [espacio] = await query('SELECT id, nombre, oferente_id FROM espacios WHERE id = ?', [espacioId]);
      if (espacio && espacio.oferente_id !== autorId) {
        const [oferente] = await query('SELECT email, nombre FROM usuarios WHERE id = ?', [espacio.oferente_id]);
        if (oferente) {
          const fechaHora = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          await sendNuevaConsultaPublica(oferente.email, oferente.nombre, {
            autorNombre,
            espacioNombre: espacio.nombre,
            pregunta: pregunta.trim(),
            espacioId,
            fechaHora,
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

    const [consulta] = await query(
      'SELECT id, autor_id, pregunta, espacio_id FROM consultas_espacio WHERE id = ?',
      [id]
    );
    if (!consulta) return res.status(404).json({ error: 'Consulta no encontrada' });

    // Verificación de ownership en la misma query — evita comparación JS con posibles diferencias de tipo
    const [espacio] = await query(
      'SELECT id, nombre FROM espacios WHERE id = ? AND oferente_id = ?',
      [consulta.espacio_id, req.user.id]
    );
    if (!espacio) return res.status(403).json({ error: 'No autorizado' });

    await query(
      'UPDATE consultas_espacio SET respuesta = ?, respuesta_at = NOW() WHERE id = ?',
      [respuesta.trim(), id]
    );

    // Email al cliente
    try {
      const [autor] = await query('SELECT email, nombre FROM usuarios WHERE id = ?', [consulta.autor_id]);
      if (autor) {
        const fechaHora = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        await sendRespuestaConsultaPublica(autor.email, autor.nombre, {
          espacioNombre: espacio.nombre,
          pregunta: consulta.pregunta,
          respuesta: respuesta.trim(),
          espacioId: consulta.espacio_id,
          fechaHora,
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
    // Query 1: espacios del proveedor
    const espacios = await query(
      'SELECT id, nombre FROM espacios WHERE oferente_id = ?',
      [req.user.id]
    );
    if (!espacios.length) return res.json([]);

    const ids = espacios.map(e => e.id);
    const nombrePorId = Object.fromEntries(espacios.map(e => [e.id, e.nombre]));
    const placeholders = ids.map(() => '?').join(',');

    // Query 2: consultas sin responder para esos espacios
    const consultas = await query(
      `SELECT id, espacio_id, autor_nombre, pregunta, created_at
       FROM consultas_espacio
       WHERE espacio_id IN (${placeholders}) AND respuesta IS NULL
       ORDER BY created_at ASC`,
      ids
    );

    res.json(consultas.map(c => ({ ...c, espacio_nombre: nombrePorId[c.espacio_id] || '' })));
  } catch (e) {
    console.error('[consultas] sinResponder:', e.message);
    res.status(500).json({ error: 'Error interno' });
  }
}

// GET /consultas/mis-espacios/respondidas — proveedor: historial respondidas
async function consultasRespondidas(req, res) {
  try {
    const espacios = await query(
      'SELECT id, nombre FROM espacios WHERE oferente_id = ?',
      [req.user.id]
    );
    if (!espacios.length) return res.json([]);

    const ids = espacios.map(e => e.id);
    const nombrePorId = Object.fromEntries(espacios.map(e => [e.id, e.nombre]));
    const placeholders = ids.map(() => '?').join(',');

    const consultas = await query(
      `SELECT id, espacio_id, autor_nombre, pregunta, respuesta, respuesta_at, created_at
       FROM consultas_espacio
       WHERE espacio_id IN (${placeholders}) AND respuesta IS NOT NULL
       ORDER BY respuesta_at DESC LIMIT 50`,
      ids
    );

    res.json(consultas.map(c => ({ ...c, espacio_nombre: nombrePorId[c.espacio_id] || '' })));
  } catch (e) {
    console.error('[consultas] consultasRespondidas:', e.message);
    res.status(500).json({ error: 'Error interno' });
  }
}

// GET /consultas/mis-consultas — cliente: mis propias preguntas
async function misConsultasCliente(req, res) {
  try {
    const consultas = await query(
      `SELECT id, espacio_id, pregunta, respuesta, respuesta_at, created_at
       FROM consultas_espacio
       WHERE autor_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    if (!consultas.length) return res.json([]);

    const ids = [...new Set(consultas.map(c => c.espacio_id))];
    const placeholders = ids.map(() => '?').join(',');
    const espacios = await query(`SELECT id, nombre FROM espacios WHERE id IN (${placeholders})`, ids);
    const nombrePorId = Object.fromEntries(espacios.map(e => [e.id, e.nombre]));

    res.json(consultas.map(c => ({ ...c, espacio_nombre: nombrePorId[c.espacio_id] || '' })));
  } catch (e) {
    console.error('[consultas] misConsultasCliente:', e.message);
    res.status(500).json({ error: 'Error interno' });
  }
}

// GET /consultas-espacio/admin — admin: todas las consultas
async function listarAdmin(req, res) {
  try {
    const consultas = await query(
      `SELECT id, espacio_id, autor_id, autor_nombre, pregunta, respuesta, respuesta_at, created_at
       FROM consultas_espacio
       ORDER BY created_at DESC LIMIT 200`,
      []
    );
    if (!consultas.length) return res.json([]);

    const ids = [...new Set(consultas.map(c => c.espacio_id))];
    const placeholders = ids.map(() => '?').join(',');
    const espacios = await query(`SELECT id, nombre FROM espacios WHERE id IN (${placeholders})`, ids);
    const nombrePorId = Object.fromEntries(espacios.map(e => [e.id, e.nombre]));

    res.json(consultas.map(c => ({ ...c, espacio_nombre: nombrePorId[c.espacio_id] || '' })));
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
