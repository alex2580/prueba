const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const ctrl  = require('../controllers/espaciosController');
const { requireAuth, requireOferente, optionalAuth } = require('../middleware/auth');
const { uploadMiddleware, validateMagicBytes } = require('../middleware/upload');

const validarEspacio = [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido').isLength({ max: 200 }),
  body('direccion').trim().notEmpty().withMessage('Dirección requerida'),
  body('barrio').trim().notEmpty().withMessage('Barrio requerido'),
  body('m2').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('m2 inválido'),
  body('tipo').isIn(['exclusivo', 'compartido']).withMessage('Tipo inválido'),
  body('precio_dia').isFloat({ min: 0 }).withMessage('Precio día inválido'),
  body('precio_mes').isFloat({ min: 0 }).withMessage('Precio mes inválido'),
  body('lat').isFloat().withMessage('Latitud inválida'),
  body('lng').isFloat().withMessage('Longitud inválida'),
];

// Public routes
router.get('/',                    optionalAuth, ctrl.listar);
router.get('/mis-espacios',        requireAuth, requireOferente, ctrl.misEspacios);
router.get('/:id/fechas-ocupadas', ctrl.fechasOcupadas);
router.get('/:id',                 optionalAuth, ctrl.obtener);

// Protected routes
router.post('/',              requireAuth, requireOferente, validarEspacio, ctrl.crear);
router.put('/:id',            requireAuth, requireOferente, validarEspacio, ctrl.actualizar);
router.post('/:id/reactivar',  requireAuth, ctrl.reactivar);
router.patch('/:id/cupo',      requireAuth, requireOferente, ctrl.toggleCupo);
router.delete('/:id',          requireAuth, ctrl.eliminar);

// Fotos
router.post(
  '/:id/fotos',
  requireAuth,
  uploadMiddleware.array('fotos', 10),
  validateMagicBytes,
  ctrl.subirFotos
);

module.exports = router;
