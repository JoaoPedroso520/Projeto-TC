const express = require('express');
const router = express.Router();
const Categoria = require('../models/Categoria');

function escapeRegex(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Listar categorias
router.get('/', async (req, res) => {
  try {
    const categorias = await Categoria.find().sort({ nome: 1 });
    res.json(categorias);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao carregar categorias' });
  }
});

// Criar categoria
router.post('/', async (req, res) => {
  try {
    const nome = String(req.body.nome || '').trim();
    if (!nome) {
      return res.status(400).json({ erro: 'Nome da categoria é obrigatório' });
    }

    const existente = await Categoria.findOne({ nome: new RegExp(`^${escapeRegex(nome)}$`, 'i') });
    if (existente) {
      return res.status(409).json({ erro: 'Categoria já existe' });
    }

    const categoria = await Categoria.create({ nome });
    res.status(201).json(categoria);
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
});

// Deletar categoria
router.delete('/:id', async (req, res) => {
  try {
    const categoria = await Categoria.findByIdAndDelete(req.params.id);
    if (!categoria) {
      return res.status(404).json({ erro: 'Categoria não encontrada' });
    }
    res.json({ mensagem: 'Categoria deletada com sucesso' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao deletar categoria' });
  }
});

module.exports = router;
