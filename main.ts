// Vice City Nights v2 — make.fun gta6-cover-art-01 entrypoint (Node 22, stdlib only).
// Copies app/ and screenshots/ from beside this file to $MAKEFUN_OUTPUT_DIR
// (or /output), refuses to hand in an entry with no screenshots, then writes
// /output/dossier.json with the vendored make.fun library.
//
// Serve the app locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
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

// Fail loudly if there are no screenshots to hand in — a screenshot-less
// entry scores nothing, so stop here instead of writing a hollow dossier.
const shotNames = readdirSync(join(out, 'screenshots')).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
if (shotNames.length === 0) {
  throw new Error('no screenshots found in screenshots/ — capture them before handing in');
}
console.log(`handed in: ${shotNames.length} screenshot(s): ${shotNames.join(', ')}`);

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
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
console.log('dossier.json written');
console.log(`dossier size: ${statSync(join(out, 'dossier.json')).size} bytes`);
