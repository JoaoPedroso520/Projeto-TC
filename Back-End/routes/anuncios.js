const express = require('express');
const router = express.Router();
const anuncioController = require('../controllers/anuncioController');
const authMiddleware = require('../middleware/authMiddleware');

// Rotas Admin (protegidas - adicionar middleware de autenticação após)
router.get('/admin/todos', authMiddleware, anuncioController.obterTodos);

// Rotas públicas - específicas primeiro
router.get('/posicao/:posicao', anuncioController.obterPorPosicao);
router.post('/:id/clique', anuncioController.registrarClique);

// Rotas públicas - genéricas por último
router.get('/', anuncioController.obterAtivos);
router.post('/', authMiddleware, anuncioController.criar);
router.put('/:id', authMiddleware, anuncioController.atualizar);
router.delete('/:id', authMiddleware, anuncioController.deletar);

module.exports = router;
