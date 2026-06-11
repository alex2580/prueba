const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const ctrl = require('../controllers/adminController');
const consultasCtrl = require('../controllers/consultasEspacioController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { contactLimiter } = require('../middleware/rateLimits');

const SERVICIOS_PERMITIDOS = ['seguro', 'embalaje', 'transporte', 'limpieza'];

// ── Public (contact forms — intentionally no auth) ─────────────
router.post('/consultas', contactLimiter, ctrl.crearConsulta);
router.post('/notificar-servicios', contactLimiter, [
  body('emailDemandante').isEmail().normalizeEmail(),
  body('nombreDemandante').optional().trim().isLength({ max: 255 }),
  body('telDemandante').optional().trim().isLength({ max: 30 }),
  body('espacioNombre').trim().notEmpty().isLength({ max: 255 }),
  body('servicios').isArray({ min: 1, max: 10 })
    .custom(arr => arr.every(s => SERVICIOS_PERMITIDOS.includes(s))),
  body('fechaDesde').optional().isISO8601(),
  body('fechaHasta').optional().isISO8601(),
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'Datos inválidos', details: errors.array() });
  next();
}, ctrl.notificarServicios);

// ── All routes below require admin auth ───────────────────────
router.use(requireAuth, requireAdmin);

// Notificaciones
router.get('/notificaciones',           ctrl.getNotificaciones);
router.patch('/notificaciones/:id/leido', ctrl.marcarLeido);

// Consultas (admin side)
router.get('/consultas',                ctrl.getConsultas);
router.post('/consultas/:id/responder', ctrl.responderConsulta);
router.patch('/consultas/:id/estado',   ctrl.actualizarEstadoConsulta);
router.delete('/consultas/:id',         ctrl.eliminarConsulta);

// Campañas
router.get('/campanas',                 ctrl.getCampanas);
router.post('/campanas',                ctrl.crearCampana);
router.delete('/campanas/:id',          ctrl.eliminarCampana);

// Usuarios
router.get('/usuarios',                         ctrl.getUsuarios);
router.patch('/usuarios/:id/bloquear',          ctrl.bloquearUsuario);
router.patch('/usuarios/:id/desbloquear',       ctrl.desbloquearUsuario);

// Solicitudes de mejora de puntuación
router.get('/solicitudes-puntuacion',                      ctrl.getSolicitudesPuntuacion);
router.patch('/solicitudes-puntuacion/:id/estado',         ctrl.actualizarEstadoSolicitud);
router.delete('/solicitudes-puntuacion/:id',               ctrl.eliminarSolicitudPuntuacion);

// Publicaciones (espacios)
router.get('/publicaciones',                               ctrl.getPublicaciones);
router.patch('/publicaciones/:id/disponible',              ctrl.toggleDisponibleAdmin);

// Operaciones / Finanzas
router.get('/operaciones',                                 ctrl.getOperaciones);
router.get('/movimientos',                                 ctrl.getMovimientos);

// Configuración de emails
router.get('/email-config',                                ctrl.getEmailConfig);
router.patch('/email-config',                              ctrl.updateEmailConfig);

// Sincronizar reservas pendientes contra MercadoPago
router.post('/sincronizar-pendientes',                     ctrl.sincronizarPendientes);

// Auditoría de cambios de perfil
router.get('/auditoria-perfil',                            ctrl.getAuditoriaPerfil);

// Consultas públicas (consultas_espacio)
router.get('/consultas-publicas',                          consultasCtrl.listarAdmin);
router.delete('/consultas-publicas/:id',                   consultasCtrl.eliminarAdmin);

module.exports = router;
