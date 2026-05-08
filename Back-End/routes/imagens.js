const express = require('express');
const sharp = require('sharp');
const Noticia = require('../models/Noticia');
const Anuncio = require('../models/Anuncio');
const { parseDataImage } = require('../utils/imageHelpers');

const router = express.Router();

const MODELS = {
  noticias: Noticia,
  anuncios: Anuncio,
};

function clampNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

router.get('/:tipo/:id', async (req, res) => {
  try {
    const Model = MODELS[req.params.tipo];
    if (!Model) {
      return res.status(404).json({ erro: 'Tipo de imagem invalido' });
    }

    const item = await Model.findById(req.params.id).select('foto updatedAt').lean();
    if (!item || !item.foto) {
      return res.status(404).json({ erro: 'Imagem nao encontrada' });
    }

    if (/^https?:\/\//i.test(item.foto)) {
      return res.redirect(item.foto);
    }

    const dataImage = parseDataImage(item.foto);
    if (!dataImage) {
      return res.status(415).json({ erro: 'Formato de imagem nao suportado' });
    }

    const width = clampNumber(req.query.w, 720, 120, 1600);
    const quality = clampNumber(req.query.q, 62, 35, 85);
    const output = await sharp(dataImage.buffer, { limitInputPixels: 24_000_000 })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

    res.set({
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    });
    res.send(output);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
