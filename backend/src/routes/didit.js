const express = require('express');
const router = express.Router();
const { iniciar, webhook } = require('../controllers/diditController');
const { requireAuth } = require('../middleware/auth');

router.post('/iniciar', requireAuth, iniciar);
router.post('/webhook', webhook); // público — lo llama Didit

module.exports = router;
