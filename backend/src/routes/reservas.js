const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const ctrl = require('../controllers/reservasController');
const { requireAuth, requireOferente } = require('../middleware/auth');

const validarReserva = [
  body('espacio_id').notEmpty().withMessage('espacio_id requerido'),
  body('fecha_desde').isDate().withMessage('fecha_desde inválida (YYYY-MM-DD)'),
  body('fecha_hasta').isDate().withMessage('fecha_hasta inválida (YYYY-MM-DD)'),
];

router.get('/',              requireAuth, ctrl.listar);
router.get('/recibidas',     requireAuth, requireOferente, ctrl.recibidas);
router.get('/:id',           requireAuth, ctrl.obtener);
router.post('/',             requireAuth, validarReserva, ctrl.crear);
router.post('/:id/extender',        requireAuth, ctrl.extender);
router.post('/:id/confirmar-acceso', requireAuth, ctrl.confirmarAcceso);
router.patch('/:id/estado',  requireAuth, ctrl.cambiarEstado);
router.delete('/:id',        requireAuth, ctrl.cancelar);
router.patch('/:id/ocultar', requireAuth, ctrl.ocultar);

module.exports = router;
