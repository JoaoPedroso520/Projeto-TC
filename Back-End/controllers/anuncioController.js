const Anuncio = require('../models/Anuncio');

// Obter todos os anúncios ativos
exports.obterAtivos = async (req, res) => {
  try {
    const agora = new Date();
    const anuncios = await Anuncio.find({
      ativo: true,
      dataInicio: { $lte: agora },
      dataFim: { $gte: agora },
    });
    res.json(anuncios);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

// Obter anúncios por posição
exports.obterPorPosicao = async (req, res) => {
  try {
    const agora = new Date();
    const anuncios = await Anuncio.find({
      posicao: req.params.posicao,
      ativo: true,
      dataInicio: { $lte: agora },
      dataFim: { $gte: agora },
    });
    res.json(anuncios);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

// Criar anúncio (Admin)
exports.criar = async (req, res) => {
  try {
    const { titulo, foto, link, dataInicio, dataFim, posicao, tempoRotacaoSeg } = req.body;
    const anuncio = new Anuncio({
      titulo,
      foto,
      link,
      dataInicio,
      dataFim,
      posicao,
      tempoRotacaoSeg,
    });
    await anuncio.save();
    res.status(201).json(anuncio);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
};

// Atualizar anúncio (Admin)
exports.atualizar = async (req, res) => {
  try {
    const anuncio = await Anuncio.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!anuncio) {
      return res.status(404).json({ erro: 'Anúncio não encontrado' });
    }
    res.json(anuncio);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
};

// Deletar anúncio (Admin)
exports.deletar = async (req, res) => {
  try {
    const anuncio = await Anuncio.findByIdAndDelete(req.params.id);
    if (!anuncio) {
      return res.status(404).json({ erro: 'Anúncio não encontrado' });
    }
    res.json({ mensagem: 'Anúncio deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

// Registrar clique no anúncio
exports.registrarClique = async (req, res) => {
  try {
    const anuncio = await Anuncio.findByIdAndUpdate(
      req.params.id,
      { $inc: { cliques: 1 } },
      { new: true }
    );
    if (!anuncio) {
      return res.status(404).json({ erro: 'Anúncio não encontrado' });
    }
    res.json(anuncio);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

// Obter todos os anúncios (Admin)
exports.obterTodos = async (req, res) => {
  try {
    const anuncios = await Anuncio.find().sort({ createdAt: -1 });
    res.json(anuncios);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
