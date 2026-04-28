const express = require('express');
const router = express.Router();
const anuncioController = require('../controllers/anuncioController');

// Rotas Admin (protegidas - adicionar middleware de autenticação após)
router.get('/admin/todos', anuncioController.obterTodos);

// Rotas públicas - específicas primeiro
router.get('/posicao/:posicao', anuncioController.obterPorPosicao);
router.post('/:id/clique', anuncioController.registrarClique);

// Rotas públicas - genéricas por último
router.get('/', anuncioController.obterAtivos);
router.post('/', anuncioController.criar);
router.put('/:id', anuncioController.atualizar);
router.delete('/:id', anuncioController.deletar);

module.exports = router;
