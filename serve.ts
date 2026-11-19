// Vice City Nights — tiny static server for app/ (development only).
//
//   node serve.ts [--port 8080]
//
// Serves only files inside app/, with a small MIME table. No network
// requests are made by the app itself; this server just hands the files out.

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = resolve(join(fileURLToPath(new URL('.', import.meta.url)), 'app'));

const MIME: Record<string, string> = {
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

function portFromArgs(): number {
  const flag = process.argv.indexOf('--port');
  if (flag >= 0 && process.argv[flag + 1]) {
    const n = Number(process.argv[flag + 1]);
    if (Number.isInteger(n) && n > 0 && n < 65536) return n;
  }
  const env = Number(process.env.PORT ?? '');
  if (Number.isInteger(env) && env > 0 && env < 65536) return env;
  return 8080;
}

const server = createServer((req, res) => {
  const rawPath = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const rel = normalize(rawPath).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]/, '');
  const file = join(APP_DIR, rel === '' ? 'index.html' : rel);

  // Refuse anything outside app/.
  if (!file.startsWith(APP_DIR + sep) && file !== APP_DIR) {
    res.writeHead(403, { 'content-type': 'text/plain' });
    res.end('forbidden\n');
    return;
  }

  let target = file;
  if (existsSync(target) && statSync(target).isDirectory()) {
    target = join(target, 'index.html');
  }
  if (!existsSync(target) || !statSync(target).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found\n');
    return;
  }

  const type = MIME[extname(target).toLowerCase()] ?? 'application/octet-stream';
  res.writeHead(200, { 'content-type': type });
  res.end(readFileSync(target));
});

const port = portFromArgs();
server.listen(port, () => {
  console.log(`Vice City Nights serving app/ at http://localhost:${port}`);
});
