// Vice City Nights — make.fun entrypoint (Node 22, standard library only).
//
// Copies the static app (app/) and its screenshots (screenshots/) from this
// repository into the hand-in directory, then writes dossier.json there with
// buildDossier from ./vendor/makefun-app.ts. Run it as:
//
//   MAKEFUN_OUTPUT_DIR=/tmp/vcn-out node --experimental-strip-types main.ts
//
// Outside the grader MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const APP_DIR = join(REPO_ROOT, 'app');
const SHOTS_DIR = join(REPO_ROOT, 'screenshots');

function isImageFile(name: string): boolean {
  return /\.(png|jpe?g)$/i.test(name);
}

function listShots(): string[] {
  return listShotsIn(SHOTS_DIR);
}

function listShotsIn(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => isImageFile(name))
    .filter((name) => {
      const full = join(dir, name);
      return statSync(full).isFile();
    })
    .sort();
}

function main(): void {
  if (!existsSync(APP_DIR) || !statSync(APP_DIR).isDirectory()) {
    throw new Error(`app/ is missing next to main.ts (${APP_DIR})`);
  }

  const shots = listShots();
  if (shots.length === 0) {
    throw new Error(
      'screenshots/ holds no PNG or JPEG — the hand-in needs 3 or 4 screenshots, ' +
        'the first by name being the cover',
    );
  }

  mkdirSync(OUT_DIR, { recursive: true });
  cpSync(APP_DIR, join(OUT_DIR, 'app'), { recursive: true });
  cpSync(SHOTS_DIR, join(OUT_DIR, 'screenshots'), { recursive: true });

  const dossier = buildDossier(OUT_DIR, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(OUT_DIR, 'dossier.json'), dossier);

  // The gate refuses a dossier over 1.5 MiB: fail here instead of at grading.
  const DOSSIER_MAX_BYTES = 1572864;
  if (dossier.length > DOSSIER_MAX_BYTES) {
    throw new Error(`dossier.json is ${dossier.length} bytes, over the ${DOSSIER_MAX_BYTES} cap`);
  }

  // Confirm the copy landed whole: the hand-in's screenshots must be exactly
  // the ones this run counted.
  const copied = listShotsIn(join(OUT_DIR, 'screenshots'));
  if (copied.length !== shots.length || copied.some((n, i) => n !== shots[i])) {
    throw new Error('copied screenshots do not match the source screenshots/');
  }

  console.log(`handed in: ${shots.length} screenshot(s)`);
  for (const name of shots) console.log(`  screenshot: ${name}`);
  console.log(`dossier.json: ${dossier.length} bytes`);
}

main();
