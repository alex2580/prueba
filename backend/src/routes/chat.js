const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const ctrl = require('../controllers/chatController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/admin/conversaciones',               requireAuth, requireAdmin, ctrl.listarConversacionesAdmin);
router.get('/conversaciones',                     requireAuth, ctrl.listarConversaciones);
router.post('/conversaciones',                    requireAuth, [
  body('espacio_id').notEmpty(),
], ctrl.iniciarConversacion);
router.get('/conversaciones/:id/mensajes',        requireAuth, ctrl.obtenerMensajes);
router.post('/conversaciones/:id/mensajes',       requireAuth, [
  body('texto').trim().notEmpty().isLength({ max: 2000 }),
], ctrl.enviarMensaje);

module.exports = router;
