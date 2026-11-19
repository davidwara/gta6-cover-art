# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/davidwara/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/davidwara/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice City Nights** — turn any photo + caption into GTA 6-style multi-panel cover art, in a web app that runs 100% offline in a desktop browser. Your photos never leave your machine: everything is drawn on a canvas and exported as a PNG to share.

## What it does

- **Multi-panel poster look** — three layouts (Poster grid, Square collage, Wide cinematic) with a hero panel plus supporting panels, white gutters, a retro sun disc and palm silhouettes drawn by code.
- **Any photo** — load up to 4 photos (or one photo filling every panel), click a panel to select it, drag its photo to reposition, scroll to zoom, or use the Zoom / Position sliders. Fit and Fill presets included.
- **Bold lettering** — your caption in Bebas Neue (SIL OFL) with a thick outline and glow, in three title styles, plus a subtitle line and adjustable title size.
- **Vice City grades** — Vice Sunset, Neon Night and Palm Gold colour grades with a sunset-glow slider, halftone dots and film grain.
- **Fast** — photo to PNG in seconds, in the common post sizes 1080 × 1080, 1080 × 1350 and 1920 × 1080.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — no build step, no network request, every script, font and sample photo is a file under `app/`.

## Shots

`screenshots/` holds 4 shots taken by the app itself: the exported wide cover first, then the editor with a photo loaded, then the square and portrait covers.

---

<sub>Entered on [make.fun](https://make.fun/?ref=davidwara&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
