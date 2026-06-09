function isDataImage(value) {
  return /^data:image\/[a-z0-9.+-]+;base64,/i.test(String(value || ''));
}

function publicBaseUrl(req) {
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  return `${proto}://${req.get('host')}`;
}

function optimizedImageUrl(req, tipo, id, updatedAt, width = 720, quality = 62) {
  const version = updatedAt ? new Date(updatedAt).getTime() : Date.now();
  const params = new URLSearchParams({
    w: String(width),
    q: String(quality),
    v: String(version),
  });

  return `${publicBaseUrl(req)}/api/imagens/${tipo}/${id}?${params.toString()}`;
}

function withOptimizedImage(req, item, tipo, width = 720, quality = 62) {
  if (!item || !isDataImage(item.foto)) return item;

  return {
    ...item,
    foto: optimizedImageUrl(req, tipo, item._id, item.updatedAt, width, quality),
  };
}

function parseDataImage(value) {
  const match = String(value || '').match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) return null;

  return {
    mime: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

module.exports = {
  isDataImage,
  optimizedImageUrl,
  parseDataImage,
  withOptimizedImage,
};
