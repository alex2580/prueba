const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const ctrl = require('../controllers/pagosController');
const { requireAuth } = require('../middleware/auth');

router.post('/preferencia',  requireAuth, [
  body('reserva_id').notEmpty(),
], ctrl.crearPreferencia);

// MercadoPago webhook — no auth (MP calls this directly)
router.post('/webhook', express.raw({ type: 'application/json' }), ctrl.webhook);

router.get('/estado/:reservaId', requireAuth, ctrl.estado);

module.exports = router;
