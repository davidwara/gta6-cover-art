// Vice City Nights — hand-in entrypoint (Node 22, standard library only).
// Copies app/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json with the vendored make.fun library. Outside the
// grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The app itself is plain static files under app/ (index.html + ES modules,
// no build step, no network request) that turn your photos and a caption
// into GTA-style multi-panel cover art, exported as a PNG.
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

const shotNames = readdirSync(join(out, 'screenshots')).filter((n) => !n.startsWith('.'));
if (shotNames.length === 0) {
  throw new Error('no screenshots to hand in: run the capture step first');
}
console.log(`handed in: ${shotNames.length} screenshot(s) — ${shotNames.join(', ')}`);

// The scorer's own caps: only text_max_bytes shapes the bytes; the others
// refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files in app/ or 48 MiB of app files in all,
// or a path under app/ over 1000 bytes).
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
const dossierBytes = statSync(join(out, 'dossier.json')).size;
console.log(`dossier size: ${dossierBytes} bytes (cap 1572864)`);
if (dossierBytes > 1572864) throw new Error('dossier over the 1.5 MiB cap');
