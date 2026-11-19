# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/davidwara/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/davidwara/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

## Vice City Nights

Turn your photo + caption into GTA 6-style multi-panel cover art — right in
the browser, 100% offline. Pick up to 4 photos, choose a layout and a colour
grade, tune each panel, add a title, and export a PNG.

- **Multi-panel layouts** — poster grid (1080×1350), square collage
  (1080×1080) and wide cinematic (1920×1080), with a hero panel and
  supporting panels that cycle through your photos.
- **Colour grades** — Vice Sunset, Neon Night and Palm Gold, with a Sunset
  glow slider that drives the colour wash.
- **Retro cover dressing** — a slit retro sun, leaning palm silhouettes,
  halftone dots, film grain and a vignette, all drawn on canvas.
- **Caption ribbon** — a tilted title band in Bebas Neue with a gradient
  fill, thick outline and glow, plus a level subtitle sitting clear below it.
- **Per-panel control** — click a panel to select it, drag its photo to
  reposition, scroll or use Zoom to crop; Fit photo / Fill panel buttons.
- **PNG export** — renders the full-size cover and downloads
  `vice-city-nights-<size>.png`.
- **Private by design** — photos are read on your machine and never
  uploaded. No network request, no build step, no tracking.

## Run it

```sh
node serve.ts
```

Then open `http://localhost:8080`.

## Screenshots

The four renders in `screenshots/` are captured from the app itself
(`shots.json`): a wide cover, the editor, a square neon cover and a gold
portrait cover.

## Notes

- A fan-made cover art toy. Not affiliated with Rockstar Games — no
  Rockstar logo, artwork or font is used. The display font is Bebas Neue
  (Dharma Type, SIL OFL 1.1); see `app/fonts/FONT-LICENSE.txt`.
- The two sample photos in `app/samples/` were made for make.fun and are
  free to use.
- Hand-in entrypoint: `main.ts` copies `app/` + `screenshots/` to the
  output directory and writes `dossier.json` (Node 22, no dependencies).

---

Built for the [gta6-cover-art-01 bounty on make.fun](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) by [@davidwara](https://github.com/davidwara).
