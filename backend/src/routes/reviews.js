const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const ctrl = require('../controllers/reviewsController');
const { requireAuth } = require('../middleware/auth');

router.get('/',          ctrl.listar);
router.post('/',         requireAuth, [
  body('espacio_id').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating debe ser entre 1 y 5'),
  body('texto').trim().notEmpty().isLength({ min: 10, max: 1000 }),
], ctrl.crear);
router.post('/:id/util', requireAuth, ctrl.marcarUtil);
router.delete('/:id',    requireAuth, ctrl.eliminar);

module.exports = router;
