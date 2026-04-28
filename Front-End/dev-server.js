const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname);
const port = Number(process.env.PORT) || 5173;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function getContentType(filePath) {
  return mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function safeJoin(base, target) {
  const targetPath = path.resolve(base, target);
  if (!targetPath.startsWith(base)) {
    return null;
  }
  return targetPath;
}

const server = http.createServer((req, res) => {
  const requestPath = decodeURIComponent(req.url.split('?')[0]);
  const initialPath = requestPath === '/' ? '/index.html' : requestPath;
  const filePath = safeJoin(rootDir, `.${initialPath}`);

  if (!filePath) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    let finalPath = filePath;
    if (!err && stats.isDirectory()) {
      finalPath = path.join(filePath, 'index.html');
    }

    fs.readFile(finalPath, (readErr, data) => {
      if (readErr) {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }
      res.setHeader('Content-Type', getContentType(finalPath));
      res.end(data);
    });
  });
});

server.listen(port, () => {
  console.log(`Front-end rodando em http://localhost:${port}`);
});
