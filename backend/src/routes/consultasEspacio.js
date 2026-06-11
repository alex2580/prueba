const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/consultasEspacioController');
const { requireAuth } = require('../middleware/auth');
const { rejectContactInfo } = require('../middleware/contactFilter');
const { contactLimiter } = require('../middleware/rateLimits');

router.get('/espacios/:id/consultas',             ctrl.listar);
router.post('/espacios/:id/consultas',            contactLimiter, requireAuth, rejectContactInfo, ctrl.crear);
router.post('/consultas/:id/responder',           requireAuth, rejectContactInfo, ctrl.responder);
router.get('/consultas/mis-espacios',             requireAuth, ctrl.sinResponder);
router.get('/consultas/mis-espacios/respondidas', requireAuth, ctrl.consultasRespondidas);
router.get('/consultas/mis-consultas',            requireAuth, ctrl.misConsultasCliente);

module.exports = router;
