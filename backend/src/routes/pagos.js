const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const ctrl = require('../controllers/pagosController');
const { requireAuth } = require('../middleware/auth');

router.post('/preferencia',  requireAuth, [
  body('reserva_id').notEmpty(),
], ctrl.crearPreferencia);

// MercadoPago webhook — no auth (MP calls this directly)
// express.json() global ya parsea el body; express.raw() en ruta lo pisaba con Buffer vacío
router.post('/webhook', ctrl.webhook);

router.get('/estado/:reservaId', requireAuth, ctrl.estado);
router.post('/sincronizar/:reservaId', requireAuth, ctrl.sincronizar);

module.exports = router;
