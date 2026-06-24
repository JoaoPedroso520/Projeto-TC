const express = require('express');
const router = express.Router();
const noticiaController = require('../controllers/noticiaController');

// Rotas Admin (específicas primeiro - ANTES de /:id para evitar conflito)
router.get('/admin/todas', noticiaController.obterParaAdmin);

// Rotas públicas - específicas primeiro
router.get('/categoria/:categoria', noticiaController.obterPorCategoria);

// Rotas públicas - genéricas por último
router.get('/', noticiaController.obterTodas);
router.get('/:id', noticiaController.obterPorId);

// Rotas Admin de escrita
router.post('/', noticiaController.criar);
router.put('/:id', noticiaController.atualizar);
router.delete('/:id', noticiaController.deletar);

module.exports = router;
