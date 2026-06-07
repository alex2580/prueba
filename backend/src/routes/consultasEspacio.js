const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { rejectContactInfo } = require('../middleware/contactFilter');
const { listar, crear, responder, sinResponder, consultasRespondidas } = require('../controllers/consultasEspacioController');

// Públicas
router.get('/espacios/:id/consultas', listar);

// Demandante: crear pregunta
router.post('/espacios/:id/consultas', requireAuth, rejectContactInfo, crear);

// Oferente: responder y ver historial
router.post('/consultas/:id/responder', requireAuth, rejectContactInfo, responder);
router.get('/consultas/mis-espacios', requireAuth, sinResponder);
router.get('/consultas/mis-espacios/respondidas', requireAuth, consultasRespondidas);

module.exports = router;
