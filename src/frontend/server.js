import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4173;
const distDir = join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

const server = createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = join(distDir, filePath);

  try {
    const content = readFileSync(filePath);
    const ext = filePath.substring(filePath.lastIndexOf('.'));
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    if (ext === '.html') {
      const apiBaseUrl = process.env.VITE_API_BASE_URL || '/api';
      const modifiedContent = content
        .toString()
        .replace('</head>', `<script>window.__VITE_API_BASE_URL__="${apiBaseUrl}";</script></head>`);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(modifiedContent, 'utf-8');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      try {
        const indexPath = join(distDir, 'index.html');
        const content = readFileSync(indexPath);
        const apiBaseUrl = process.env.VITE_API_BASE_URL || '/api';
        const modifiedContent = content
          .toString()
          .replace('</head>', `<script>window.__VITE_API_BASE_URL__="${apiBaseUrl}";</script></head>`);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(modifiedContent, 'utf-8');
      } catch (err) {
        res.writeHead(404);
        res.end('Not found');
      }
    } else {
      res.writeHead(500);
      res.end('Server error');
    }
  }
});

server.listen(PORT, () => {
  console.log(`Frontend server running on http://localhost:${PORT}`);
});
