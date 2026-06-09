const express = require('express');
const router = express.Router();
const Noticia = require('../models/Noticia');
const SiteInfo = require('../models/SiteInfo');
const Categoria = require('../models/Categoria');
const { withOptimizedImage } = require('../utils/imageHelpers');

// GET todas as categorias
router.get('/', async (req, res) => {
  try {
    const categorias = await Categoria.find().sort({ nome: 1 });
    res.json(categorias.map(c => c.nome));
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao carregar categorias' });
  }
});

// GET noticias por busca
router.get('/busca/:termo', async (req, res) => {
  try {
    const { termo } = req.params;

    const noticias = await Noticia.find({
      ativo: true,
      $or: [
        { titulo: { $regex: termo, $options: 'i' } },
        { conteudo: { $regex: termo, $options: 'i' } },
        { categoria: { $regex: termo, $options: 'i' } },
      ],
    })
      .sort({ createdAt: -1 })
      .select('titulo foto categoria views createdAt updatedAt ativo')
      .limit(50)
      .lean();

    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json(noticias.map(noticia => withOptimizedImage(req, noticia, 'noticias', 720, 58)));
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar notícias' });
  }
});

// GET informações do projeto/TC
router.get('/site-info', async (req, res) => {
  try {
    const info = await SiteInfo.findOne().sort({ updatedAt: -1 });
    res.json(info || {});
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao carregar informações do projeto' });
  }
});

// PUT informações do projeto/TC
router.put('/site-info', async (req, res) => {
  try {
    const payload = {
      resumo: req.body.resumo || '',
      diferencial: req.body.diferencial || '',
      desenvolvimento: req.body.desenvolvimento || '',
      requisitosFuncionais: req.body.requisitosFuncionais || '',
      requisitosNaoFuncionais: req.body.requisitosNaoFuncionais || '',
      arquitetura: req.body.arquitetura || '',
      modelagemBanco: req.body.modelagemBanco || '',
      fluxogramaUrl: req.body.fluxogramaUrl || '',
      diagramaCasoUsoUrl: req.body.diagramaCasoUsoUrl || '',
      modeloConceitualUrl: req.body.modeloConceitualUrl || '',
      diagramaClassesUrl: req.body.diagramaClassesUrl || '',
    };

    const info = await SiteInfo.findOneAndUpdate(
      {},
      payload,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(info);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao salvar informações do projeto' });
  }
});

module.exports = router;
