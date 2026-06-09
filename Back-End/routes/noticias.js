const express = require('express');
const router = express.Router();
const noticiaController = require('../controllers/noticiaController');

// Rotas públicas
router.get('/categoria/:categoria', noticiaController.obterPorCategoria);
router.get('/:id', noticiaController.obterPorId);
router.get('/', noticiaController.obterTodas);

// Rotas Admin (protegidas - adicionar middleware de autenticação após)
router.post('/', noticiaController.criar);
router.put('/:id', noticiaController.atualizar);
router.delete('/:id', noticiaController.deletar);

module.exports = router;
