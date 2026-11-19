// Vice City Nights — entrypoint for the gta6-cover-art-01 bounty (Node 22,
// standard library only). The app itself is the plain static folder app/
// next to this file; this program hands it in: it copies app/ and
// screenshots/ into $MAKEFUN_OUTPUT_DIR (or /output) and writes
// /output/dossier.json with the vendored make.fun library.
//
//   MAKEFUN_OUTPUT_DIR=/tmp/vcn-out node --experimental-strip-types main.ts
//
// It refuses to hand in an entry with no screenshots, because a cover-art
// entry nobody can see is not an entry at all.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir)) {
  throw new Error(`screenshots/ is missing next to main.ts (${shotsDir})`);
}
const shots = readdirSync(shotsDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
if (shots.length === 0) {
  throw new Error('no screenshots in screenshots/ — capture them before handing in');
}
if (shots.length > 4) {
  throw new Error(`too many screenshots (${shots.length}) — the dossier cap is 4`);
}
if (!existsSync(join(here, 'app'))) {
  throw new Error(`app/ is missing next to main.ts (${join(here, 'app')})`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

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

for (const shot of shots) console.log(`handed in: ${shot}`);
console.log(`handed in: ${shots.length} screenshot(s)`);
console.log(`dossier written to ${join(out, 'dossier.json')}`);
