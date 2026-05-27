const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { listar, listarIds, agregar, eliminar } = require('../controllers/favoritosController');

router.get('/',              requireAuth, listar);
router.get('/ids',           requireAuth, listarIds);
router.post('/',             requireAuth, agregar);
router.delete('/:espacio_id', requireAuth, eliminar);

module.exports = router;
