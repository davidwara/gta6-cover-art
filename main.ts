// Vice City Nights — a GTA 6-style cover art maker (make.fun gta6-cover-art-01).
// The program hands the app in: it copies app/ and screenshots/ from beside this
// file to /output and writes /output/dossier.json with the vendored make.fun
// library (vendor/makefun-app.ts, the kit's copy, unchanged). The app itself is
// plain static files a desktop browser loads offline (app/index.html and its ES
// modules, one vendored OFL font, two sample photos), with no network request:
// a photo and a caption become a multi-panel Vice City cover, exported as PNG.
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir) || readdirSync(shotsDir).filter((n) => !n.startsWith('.')).length === 0) {
  throw new Error('screenshots/ is empty: take the 3-4 screenshots first (see shots.json), the gate refuses an entry without them');
}
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside
// /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

const shots = existsSync(join(out, 'screenshots'))
  ? readdirSync(join(out, 'screenshots')).filter((n) => !n.startsWith('.')).sort()
  : [];
console.log(`Vice City Nights handed in: ${shots.length} screenshot(s) (${shots.join(', ')})`);
