const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const emailService = require('../services/emailService');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validationResult } = require('express-validator');

// POST /api/email/contacto  (public)
router.post('/contacto', [
  body('nombre').trim().notEmpty(),
  body('emailRemitente').isEmail(),
  body('asunto').trim().notEmpty(),
  body('mensaje').trim().notEmpty().isLength({ min: 10, max: 2000 }),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: 'Datos inválidos', details: errors.array() });
  }
  try {
    await emailService.sendContacto(
      process.env.ADMIN_EMAILS || process.env.SMTP_USER || 'contacto@todasmiscosas.com',
      req.body
    );
    res.json({ message: 'Consulta enviada' });
  } catch (err) {
    next(err);
  }
});

// POST /api/email/bienvenida  (admin only)
router.post('/bienvenida', requireAuth, requireAdmin, async (req, res, next) => {
  const { toEmail, nombre, tipo } = req.body;
  try {
    await emailService.sendBienvenida(toEmail, nombre, tipo);
    res.json({ message: 'Email enviado' });
  } catch (err) {
    next(err);
  }
});

// POST /api/email/mejorar-puntuacion  (auth required)
router.post('/mejorar-puntuacion', requireAuth, async (req, res, next) => {
  try {
    const { espacioNombre, puntajeActual } = req.body;
    await emailService.sendMejorarPuntuacion({
      nombre:        req.user.nombre,
      email:         req.user.email,
      tel:           req.user.tel || '',
      espacioNombre: espacioNombre || '',
      puntajeActual: puntajeActual ?? 0,
    });
    res.json({ message: 'Solicitud enviada' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
