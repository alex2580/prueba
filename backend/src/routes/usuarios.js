const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const ctrl = require('../controllers/usuariosController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');

router.get('/me',           requireAuth, ctrl.perfil);
router.put('/me',           requireAuth, [
  body('nombre').trim().notEmpty().isLength({ max: 120 }),
  body('dni').optional({ nullable: true }).isLength({ max: 20 }),
  body('email').optional({ nullable: true }).isEmail(),
], ctrl.actualizar);
router.post('/me/avatar',   requireAuth, uploadMiddleware.single('avatar'), ctrl.subirAvatar);
router.post('/me/solicitar-cambio-tel', requireAuth, [
  body('tel_nuevo').trim().notEmpty(),
], ctrl.solicitarCambioTel);
router.post('/me/verificar-cambio-tel', requireAuth, [
  body('codigo').trim().notEmpty().isLength({ min: 6, max: 6 }),
], ctrl.verificarCambioTel);
router.post('/sync',        [
  body('supabase_id').notEmpty(),
  body('nombre').trim().notEmpty(),
  body('email').isEmail(),
], ctrl.sync);
router.get('/',             requireAuth, requireAdmin, ctrl.listar);
router.get('/:id',          ctrl.verPerfil);
router.patch('/:id/tipo',   requireAuth, requireAdmin, ctrl.cambiarTipo);

module.exports = router;
