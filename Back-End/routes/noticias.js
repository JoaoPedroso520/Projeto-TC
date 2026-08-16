const express = require('express');
const router = express.Router();
const noticiaController = require('../controllers/noticiaController');
const authMiddleware = require('../middleware/authMiddleware');

// Rotas Admin (específicas primeiro - ANTES de /:id para evitar conflito)
router.get('/admin/todas', authMiddleware, noticiaController.obterParaAdmin);

// Rotas públicas - específicas primeiro
router.get('/categoria/:categoria', noticiaController.obterPorCategoria);

// Rotas públicas - genéricas por último
router.get('/', noticiaController.obterTodas);
router.get('/:id', noticiaController.obterPorId);

// Rotas Admin de escrita
router.post('/', authMiddleware, noticiaController.criar);
router.put('/:id', authMiddleware, noticiaController.atualizar);
router.delete('/:id', authMiddleware, noticiaController.deletar);

module.exports = router;
