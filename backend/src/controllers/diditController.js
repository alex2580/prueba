const { query } = require('../db/connection');
const diditService = require('../services/diditService');

// POST /api/didit/iniciar
async function iniciar(req, res, next) {
  try {
    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://todasmiscosas.com';
    const sesion = await diditService.crearSesion({
      usuarioId: req.user.id,
      callback: `${FRONTEND_URL}/es/panel?didit=return`,
    });
    res.json({ url: sesion.url });
  } catch (err) {
    next(err);
  }
}

// POST /api/didit/webhook (público — lo llama Didit, no un usuario logueado)
async function webhook(req, res) {
  try {
    const rawBody = req.rawBody ? req.rawBody.toString('utf-8') : JSON.stringify(req.body);
    const firmaValida = diditService.verificarFirmaWebhook({
      rawBody,
      body: req.body,
      headers: req.headers,
    });
    if (!firmaValida) {
      console.warn('[didit webhook] Firma inválida — request rechazada');
      return res.sendStatus(401);
    }

    const { session_id, status, vendor_data: usuarioId } = req.body;
    if (!usuarioId) return res.sendStatus(200);

    if (status === 'Approved') {
      await query(
        `UPDATE usuarios SET verificado = 1, verificado_at = NOW(), didit_session_id = ? WHERE id = ?`,
        [session_id, usuarioId]
      );
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('[didit webhook] Error:', err.message);
    res.sendStatus(200); // Siempre 200 a Didit para que no reintente indefinidamente
  }
}

module.exports = { iniciar, webhook };
