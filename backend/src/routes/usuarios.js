const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const ctrl = require('../controllers/usuariosController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { uploadMiddleware, validateMagicBytes } = require('../middleware/upload');
const { verifyToken } = require('../services/supabaseService');

// Validates that the Bearer token belongs to the supabase_id being synced.
// Prevents unauthenticated or cross-user sync calls without interfering with
// the MySQL auto-creation that requireAuth would trigger.
async function requireSyncAuth(req, res, next) {
  const token = req.headers.authorization?.slice(7);
  if (!token) return res.status(401).json({ error: 'Token requerido para sincronizar' });
  const supabaseUser = await verifyToken(token).catch(() => null);
  if (!supabaseUser || supabaseUser.id !== req.body.supabase_id) {
    return res.status(403).json({ error: 'Token no corresponde al usuario a sincronizar' });
  }
  next();
}

router.get('/me',           requireAuth, ctrl.perfil);
router.put('/me',           requireAuth, [
  body('nombre').trim().notEmpty().isLength({ max: 120 }),
  body('dni').optional({ nullable: true }).isLength({ max: 20 }),
  body('email').optional({ nullable: true }).isEmail(),
  body('cbu_alias').optional({ nullable: true }).isLength({ max: 100 }),
], ctrl.actualizar);
router.post('/me/avatar',   requireAuth, uploadMiddleware.single('avatar'), validateMagicBytes, ctrl.subirAvatar);
router.post('/me/solicitar-cambio-tel', requireAuth, [
  body('tel_nuevo').trim().notEmpty(),
], ctrl.solicitarCambioTel);
router.post('/me/verificar-cambio-tel', requireAuth, [
  body('codigo').trim().notEmpty().isLength({ min: 6, max: 6 }),
], ctrl.verificarCambioTel);
router.post('/me/solicitar-cambio-perfil', requireAuth, ctrl.solicitarCambioPerfil);
router.post('/me/verificar-cambio-perfil', requireAuth, [
  body('codigo').trim().notEmpty().isLength({ min: 6, max: 6 }),
], ctrl.verificarCambioPerfil);
router.patch('/me/terminos', requireAuth, ctrl.aceptarTerminos);
router.post('/sync',        requireSyncAuth, [
  body('supabase_id').notEmpty(),
  body('nombre').trim().notEmpty(),
  body('email').isEmail(),
], ctrl.sync);
router.get('/',             requireAuth, requireAdmin, ctrl.listar);
router.get('/:id',          ctrl.verPerfil);
router.patch('/:id/tipo',   requireAuth, requireAdmin, ctrl.cambiarTipo);

module.exports = router;
