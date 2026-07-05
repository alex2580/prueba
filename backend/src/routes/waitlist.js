const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/waitlistController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/waitlist/contador',  ctrl.contador);
router.post('/waitlist',          ctrl.registrar);
router.get('/admin/waitlist',     requireAuth, requireAdmin, ctrl.listar);

module.exports = router;
