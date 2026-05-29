const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/mailingController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth, requireAdmin);

router.get('/campanas',                    ctrl.listar);
router.post('/campanas', [
  body('nombre').trim().notEmpty(),
  body('asunto').trim().notEmpty(),
  body('cuerpo_html').notEmpty(),
], ctrl.crear);
router.patch('/campanas/:id',              ctrl.actualizar);
router.delete('/campanas/:id',             ctrl.eliminar);
router.post('/campanas/:id/enviar',        ctrl.enviar);
router.get('/campanas/:id/log',            ctrl.verLog);
router.get('/preview-destinatarios',       ctrl.previewDestinatarios);

module.exports = router;
