const { query } = require('../db/connection');
const { sendWaitlistBienvenidaProveedor, sendWaitlistBienvenidaCliente, sendWaitlistNotificacionAdmin } = require('../services/emailService');

const ADMIN_EMAIL = process.env.WAITLIST_NOTIFY_EMAIL || process.env.ADMIN_EMAILS?.split(',')[0]?.trim();

// POST /api/waitlist — público, sin auth
async function registrar(req, res) {
  try {
    const { tipo, nombre, email, whatsapp, barrio, tipo_espacio, descripcion, para_que, duracion } = req.body;

    if (!tipo || !['proveedor', 'cliente'].includes(tipo)) {
      return res.status(400).json({ error: 'tipo debe ser proveedor o cliente' });
    }
    if (!nombre?.trim()) return res.status(400).json({ error: 'nombre requerido' });
    if (!email?.trim() || !email.includes('@')) return res.status(400).json({ error: 'email inválido' });

    await query(
      `INSERT INTO waitlist (tipo, nombre, email, whatsapp, barrio, tipo_espacio, descripcion, para_que, duracion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tipo,
        nombre.trim(),
        email.trim().toLowerCase(),
        whatsapp?.trim() || null,
        barrio?.trim() || null,
        tipo_espacio?.trim() || null,
        descripcion?.trim() || null,
        para_que?.trim() || null,
        duracion?.trim() || null,
      ]
    );

    try {
      if (tipo === 'proveedor') {
        await sendWaitlistBienvenidaProveedor(email.trim().toLowerCase(), nombre.trim());
      } else {
        await sendWaitlistBienvenidaCliente(email.trim().toLowerCase(), nombre.trim());
      }
    } catch (emailErr) {
      console.error('[waitlist] email bienvenida error:', emailErr.message);
    }

    try {
      if (ADMIN_EMAIL) {
        await sendWaitlistNotificacionAdmin(ADMIN_EMAIL, {
          tipo, nombre: nombre.trim(), email: email.trim().toLowerCase(),
          whatsapp: whatsapp?.trim() || null,
          barrio: barrio?.trim() || null,
          tipo_espacio: tipo_espacio?.trim() || null,
          descripcion: descripcion?.trim() || null,
          para_que: para_que?.trim() || null,
          duracion: duracion?.trim() || null,
        });
      }
    } catch (notifErr) {
      console.error('[waitlist] email admin error:', notifErr.message);
    }

    res.status(201).json({ ok: true });
  } catch (e) {
    console.error('[waitlist] registrar:', e.message);
    res.status(500).json({ error: 'Error interno' });
  }
}

// GET /api/admin/waitlist — requireAdmin
async function listar(req, res) {
  try {
    const { tipo, page = 1 } = req.query;
    const limit = 50;
    const offset = (parseInt(page) - 1) * limit;

    const where = tipo && ['proveedor', 'cliente'].includes(tipo) ? 'WHERE tipo = ?' : '';
    const params = where ? [tipo, limit, offset] : [limit, offset];

    const rows = await query(
      `SELECT id, tipo, nombre, email, whatsapp, barrio, tipo_espacio, descripcion, para_que, duracion, created_at
       FROM waitlist ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      params
    );

    const [{ total }] = await query(
      `SELECT COUNT(*) AS total FROM waitlist ${where}`,
      where ? [tipo] : []
    );

    const [{ proveedores }] = await query("SELECT COUNT(*) AS proveedores FROM waitlist WHERE tipo = 'proveedor'");
    const [{ clientes }] = await query("SELECT COUNT(*) AS clientes FROM waitlist WHERE tipo = 'cliente'");

    res.json({ rows, total, proveedores, clientes });
  } catch (e) {
    console.error('[waitlist] listar:', e.message);
    res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { registrar, listar };
