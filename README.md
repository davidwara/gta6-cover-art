# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/davidwara/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/davidwara/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice City Nights** turns a photo + caption into GTA 6-style multi-panel
cover art and exports it as a PNG. 100% static files under `app/` — no
network request, no build step, no upload: photos are read on your machine
and never leave it.

- 4 photo slots, sample photos included, one-photo-fills-every-panel mode
- Poster (1080×1350), square (1080×1080) and wide cinematic (1920×1080) sizes
- 3 panel layouts, 3 colour grades (Vice Sunset, Neon Night, Palm Gold),
  sunset-glow slider
- Per-panel zoom + position (drag the photo, scroll to zoom), Fit / Fill
- Bebas Neue title ribbon with 3 title styles, subtitle, title-size slider
- Retro sun, palm silhouettes, halftone dots and film grain baked into every cover
- Export PNG at the full cover size (`vice-city-nights-<size>.png`)

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Node 22, standard library only. `main.ts` is the make.fun entrypoint: it
copies `app/` + `screenshots/` to `$MAKEFUN_OUTPUT_DIR` and writes
`dossier.json`.

## Screenshots

The four shots in `screenshots/` (defined in `shots.json`) show the wide
cover, the editor, the square neon cover and the portrait gold cover.

## Notes

A fan-made cover art maker. No Rockstar logo, artwork or font is used.
Bebas Neue is licensed under the SIL Open Font License 1.1 — see
`app/fonts/FONT-LICENSE.txt`.

Built for [make.fun](https://make.fun/bounty/gta6-cover-art-01?ref=davidwara) — bounty `gta6-cover-art-01`.
