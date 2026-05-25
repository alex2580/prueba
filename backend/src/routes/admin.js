const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ── Public ─────────────────────────────────────────────────────
// Contact form — no auth required
router.post('/consultas', ctrl.crearConsulta);
// Additional services notification — no auth required
router.post('/notificar-servicios', ctrl.notificarServicios);

// ── All routes below require admin auth ───────────────────────
router.use(requireAuth, requireAdmin);

// Notificaciones
router.get('/notificaciones',           ctrl.getNotificaciones);
router.patch('/notificaciones/:id/leido', ctrl.marcarLeido);

// Consultas (admin side)
router.get('/consultas',                ctrl.getConsultas);
router.post('/consultas/:id/responder', ctrl.responderConsulta);
router.patch('/consultas/:id/estado',   ctrl.actualizarEstadoConsulta);

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

module.exports = router;
