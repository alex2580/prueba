const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const ctrl = require('../controllers/usuariosController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/me',           requireAuth, ctrl.perfil);
router.put('/me',           requireAuth, [
  body('nombre').trim().notEmpty().isLength({ max: 120 }),
], ctrl.actualizar);
router.post('/sync',        [
  body('supabase_id').notEmpty(),
  body('nombre').trim().notEmpty(),
  body('email').isEmail(),
], ctrl.sync);
router.get('/',             requireAuth, requireAdmin, ctrl.listar);
router.get('/:id',          ctrl.verPerfil);
router.patch('/:id/tipo',   requireAuth, requireAdmin, ctrl.cambiarTipo);

module.exports = router;
