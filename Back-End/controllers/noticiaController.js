const Noticia = require('../models/Noticia');

function escapeRegex(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Obter todas as notícias
exports.obterTodas = async (req, res) => {
  try {
    const noticias = await Noticia.find({ ativo: true })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(noticias);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

// Obter notícia por ID
exports.obterPorId = async (req, res) => {
  try {
    const noticia = await Noticia.findById(req.params.id);
    if (!noticia) {
      return res.status(404).json({ erro: 'Notícia não encontrada' });
    }
    noticia.views += 1;
    await noticia.save();
    res.json(noticia);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

// Criar notícia (Admin)
exports.criar = async (req, res) => {
  try {
    const { titulo, conteudo, categoria, foto, autor } = req.body;
    const noticia = new Noticia({
      titulo,
      conteudo,
      categoria,
      foto,
      autor: autor || 'Administrador',
    });
    await noticia.save();
    res.status(201).json(noticia);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
};

// Atualizar notícia (Admin)
exports.atualizar = async (req, res) => {
  try {
    const noticia = await Noticia.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!noticia) {
      return res.status(404).json({ erro: 'Notícia não encontrada' });
    }
    res.json(noticia);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
};

// Deletar notícia (Admin)
exports.deletar = async (req, res) => {
  try {
    const noticia = await Noticia.findByIdAndDelete(req.params.id);
    if (!noticia) {
      return res.status(404).json({ erro: 'Notícia não encontrada' });
    }
    res.json({ mensagem: 'Notícia deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

// Obter notícias por categoria
exports.obterPorCategoria = async (req, res) => {
  try {
    const categoria = req.params.categoria || '';
    const noticias = await Noticia.find({
      categoria: { $regex: `^${escapeRegex(categoria)}$`, $options: 'i' },
      ativo: true,
    }).sort({ createdAt: -1 });
    res.json(noticias);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
