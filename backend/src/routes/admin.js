const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { contactLimiter } = require('../middleware/rateLimits');

// ── Public (contact forms — intentionally no auth) ─────────────
router.post('/consultas',          contactLimiter, ctrl.crearConsulta);
router.post('/notificar-servicios', contactLimiter, ctrl.notificarServicios);

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

// Configuración de emails
router.get('/email-config',                                ctrl.getEmailConfig);
router.patch('/email-config',                              ctrl.updateEmailConfig);

module.exports = router;
