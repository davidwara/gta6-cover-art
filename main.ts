// Vice City Nights — hand-in entrypoint (Node 22, standard library only).
//
// The app is plain static files a desktop browser loads offline: app/
// (index.html + ES modules, no library, no network request) and the
// screenshots/ renders. This program copies both from beside itself to the
// output directory and writes dossier.json with the vendored make.fun
// library, the summary the judge reads.
//
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
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

const shotNames = readdirSync(join(out, 'screenshots')).sort();
if (shotNames.length === 0) {
  throw new Error('no screenshots in screenshots/ — capture them first (see shots.json)');
}
console.log(`handed in: ${shotNames.length} screenshot(s) — ${shotNames.join(', ')}`);

// The scorer's own caps (from the bounty's gate.json): only text_max_bytes
// shapes the bytes; the others refuse an entry the scorer would refuse
// (more than 4 screenshots or one over 256 KiB; more than 993 files in
// app/ or 48 MiB of app files in all, or a path under app/ over 1000 bytes).
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
