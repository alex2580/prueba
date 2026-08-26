const express = require('express');
const router = express.Router();
const { iniciar, callback, desconectar } = require('../controllers/mpConnectController');
const { requireAuth } = require('../middleware/auth');

router.get('/authorize', requireAuth, iniciar);
router.get('/callback', callback); // público — redirect del navegador desde MercadoPago
router.post('/disconnect', requireAuth, desconectar);

module.exports = router;
