# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/davidwara/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/davidwara/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

## Vice City Nights

An offline web app that turns your photos + caption into GTA 6-style
multi-panel cover art and exports it as a PNG. 100% static files under
`app/`, no network request, no build step. Photos are read on your machine
and never uploaded.

### v2 features

- **4 sizes** — 1080×1080 Square, 1080×1350 Poster, 1920×1080 Wide, 1080×1920 Story
- **6 layouts** — poster, six (7 panels incl. Palm row), square, wide, strip, story
- **6 colour grades** — Vice Sunset, Neon Night, Palm Gold, Ocean Drive, Midnight Vice, Bubblegum
- **6 title styles** — sunset, vice, neon, chrome, outline, bubble
- **Decorations** — retro sun, palm silhouettes, skyline, low-rider car (wide layout),
  birds, stars (neon / midnight), halftone dots, film grain, vignette, neon frame,
  VI + EST. 2026 badges
- **6 photo slots** — add your own photos, star one as the hero, one-photo-fills-all mode
- **Per-panel control** — zoom / position sliders, drag on canvas, scroll to zoom,
  photo filters (None / B&W / Sepia / Cool), Fit / Fill, panel swap, keyboard shortcuts
- **Caption presets** (6) and **Look presets** (4) plus a Randomize ("Surprise me") button
- **PNG export** at 1× or 2× in the exact post size you picked

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Screenshots

See `screenshots/` — cover (wide, six-panel, Ocean Drive), the editor,
a square Neon Reign cover, and a portrait Bubblegum cover.

---

Built for the [gta6-cover-art-01 bounty on make.fun](https://make.fun/bounty/gta6-cover-art-01?ref=davidwara).
