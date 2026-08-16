const express = require('express');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const Noticia = require('../models/Noticia');
const Anuncio = require('../models/Anuncio');
const { parseDataImage } = require('../utils/imageHelpers');

const router = express.Router();

// Garantir que a pasta de cache exista
const cacheDir = path.join(__dirname, '..', 'cache_imagens');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

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

    let imageBuffer;
    if (/^https?:\/\//i.test(item.foto)) {
      try {
        const https = require('https');
        const http = require('http');
        const parsedUrl = new URL(item.foto);
        const client = parsedUrl.protocol === 'https:' ? https : http;
        
        imageBuffer = await new Promise((resolve, reject) => {
          client.get(item.foto, { rejectUnauthorized: false }, (resp) => {
            if (resp.statusCode !== 200 && resp.statusCode !== 301 && resp.statusCode !== 302) {
              return reject(new Error('Falha ao baixar imagem'));
            }
            // Simple redirect handling if needed, but usually not required for direct image links
            if (resp.statusCode === 301 || resp.statusCode === 302) {
               const redirectUrl = resp.headers.location;
               client.get(redirectUrl, { rejectUnauthorized: false }, (resRedirect) => {
                  const chunks = [];
                  resRedirect.on('data', (chunk) => chunks.push(chunk));
                  resRedirect.on('end', () => resolve(Buffer.concat(chunks)));
               }).on('error', reject);
               return;
            }

            const chunks = [];
            resp.on('data', (chunk) => chunks.push(chunk));
            resp.on('end', () => resolve(Buffer.concat(chunks)));
          }).on('error', reject);
        });
      } catch (err) {
        console.error('Erro ao baixar imagem externa:', err);
        return res.status(502).json({ erro: 'Falha ao buscar imagem externa' });
      }
    } else {
      const dataImage = parseDataImage(item.foto);
      if (!dataImage) {
        return res.status(415).json({ erro: 'Formato de imagem nao suportado' });
      }
      imageBuffer = dataImage.buffer;
    }

    const width = clampNumber(req.query.w, 720, 120, 1600);
    const quality = clampNumber(req.query.q, 62, 35, 85);

    // Nome do arquivo de cache (baseado no ID, largura, qualidade e data de modificação)
    const version = item.updatedAt ? new Date(item.updatedAt).getTime() : 'v1';
    const cacheFilename = `${req.params.tipo}_${item._id}_w${width}_q${quality}_v${version}.webp`;
    const cachePath = path.join(cacheDir, cacheFilename);

    // Se já existir no cache (salvo no HD), devolvemos o arquivo super rápido
    if (fs.existsSync(cachePath)) {
      res.set({
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      });
      return res.sendFile(cachePath);
    }

    // Se não existir, processamos a imagem com o Sharp
    const output = await sharp(imageBuffer, { limitInputPixels: 24_000_000 })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

    // E então salvamos o resultado no HD para o próximo usuário
    fs.writeFileSync(cachePath, output);

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
