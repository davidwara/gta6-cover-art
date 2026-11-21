// Vice City Nights v2 — tiny static server for app/.
// Usage: node serve.ts [--port 8080]
// Serves only files under app/; anything else is refused.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const ROOT = resolve(import.meta.dirname, 'app');
const port = Number(process.argv.find((a) => a.startsWith('--port='))?.split('=')[1] ||
  process.argv[process.argv.indexOf('--port') + 1] || 8080);

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  let path = decodeURIComponent(url.pathname);
  if (path === '/') path = '/index.html';
  const file = resolve(join(ROOT, path));
  if (!file.startsWith(ROOT + '/') && file !== ROOT) {
    res.writeHead(403, { 'content-type': 'text/plain' });
    res.end('forbidden\n');
    console.log(`${req.method} ${url.pathname} -> 403`);
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
    console.log(`${req.method} ${url.pathname} -> 200 (${body.length} bytes)`);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found\n');
    console.log(`${req.method} ${url.pathname} -> 404`);
  }
});

server.listen(port, () => {
  console.log(`Vice City Nights — http://localhost:${port}`);
});
