// Vice City Nights v2 — make.fun entrypoint (Node 22).
// Copies app/ + screenshots/ to $MAKEFUN_OUTPUT_DIR (or /output) and
// writes /output/dossier.json via the kit's buildDossier helper, which
// reads the copied tree back and returns the dossier as canonical JSON.

import { cp, mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const shotsDir = join(HERE, 'screenshots');
const shots = (await readdir(shotsDir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
if (shots.length === 0) throw new Error('no screenshots in screenshots/ — nothing to hand in');
if (shots.length > 4) throw new Error(`too many screenshots: ${shots.length} (max 4)`);

await mkdir(OUT, { recursive: true });
await cp(join(HERE, 'app'), join(OUT, 'app'), { recursive: true });
await cp(shotsDir, join(OUT, 'screenshots'), { recursive: true });

const dossier = buildDossier(OUT, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
await writeFile(join(OUT, 'dossier.json'), dossier);
console.log(`handed in: ${shots.length} screenshot(s): ${shots.join(', ')}`);
console.log(`dossier.json: ${dossier.length} bytes`);
for (const f of shots) {
  const { stat: shotStat } = await import('node:fs/promises');
  console.log(`screenshot ${f}: ${(await shotStat(join(shotsDir, f))).size} bytes`);
}
