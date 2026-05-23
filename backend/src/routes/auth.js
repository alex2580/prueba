const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// Ambas rutas requieren un JWT válido de Supabase (el usuario se autenticó
// con email/password pero aún no completó la verificación OTP).
router.post('/solicitar-otp',  requireAuth, ctrl.solicitarOTP);
router.post('/verificar-otp',  requireAuth, ctrl.verificarOTP);

module.exports = router;
