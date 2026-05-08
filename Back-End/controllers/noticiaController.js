const Noticia = require('../models/Noticia');
const { withOptimizedImage } = require('../utils/imageHelpers');

function escapeRegex(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Obter todas as notícias
exports.obterTodas = async (req, res) => {
  try {
    const noticias = await Noticia.find({ ativo: true })
      .sort({ createdAt: -1 })
      .select('titulo foto categoria views createdAt updatedAt ativo')
      .limit(50)
      .lean();
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json(noticias.map(noticia => withOptimizedImage(req, noticia, 'noticias', 720, 58)));
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

// Obter notícia por ID
exports.obterPorId = async (req, res) => {
  try {
    const noticia = await Noticia.findById(req.params.id).lean();
    if (!noticia) {
      return res.status(404).json({ erro: 'Notícia não encontrada' });
    }
    if (req.query.raw === '1') {
      return res.json(noticia);
    }

    if (req.query.preview === '1') {
      return res.json(withOptimizedImage(req, noticia, 'noticias', 1200, 68));
    }

    const viewsAtualizadas = (noticia.views || 0) + 1;
    await Noticia.updateOne(
      { _id: req.params.id },
      { $inc: { views: 1 } },
      { timestamps: false }
    );

    const noticiaComViews = {
      ...noticia,
      views: viewsAtualizadas,
    };

    res.json(withOptimizedImage(req, noticiaComViews, 'noticias', 1200, 68));
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
    })
      .sort({ createdAt: -1 })
      .select('titulo foto categoria views createdAt updatedAt ativo')
      .limit(50)
      .lean();
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json(noticias.map(noticia => withOptimizedImage(req, noticia, 'noticias', 720, 58)));
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
