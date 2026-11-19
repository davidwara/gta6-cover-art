# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/davidwara/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/davidwara/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice City Nights** — a web app that turns your photo + caption into GTA 6-style multi-panel cover art and exports it as a PNG to share.

- Multi-panel poster layouts (poster, square collage, wide cinematic) in the common post sizes 1080 &times; 1080, 1080 &times; 1350 and 1920 &times; 1080.
- Load up to 4 of your own photos, or use the bundled samples; one photo can fill every panel, or each panel can hold its own.
- Crop and position each photo per panel (click to select, drag to move, scroll or Zoom to crop), with Fit / Fill shortcuts.
- Vice City colour grades (Vice Sunset, Neon Night, Palm Gold) with a Sunset glow slider, a retro sun, palm silhouettes, halftone dots and film grain.
- Editable caption with three title styles and a size slider, on a tilted title ribbon with a level subtitle.
- One-click Export PNG at the full post size.

100% offline: the app is plain static files under `app/`, with no build step and no network request. Photos are read on your machine and never uploaded. No Rockstar Games logo, artwork, character or font is used.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser.

## Screenshots

`screenshots/` holds four renders of the app: the wide cover, the editor with a photo loaded, the square neon cover, and the portrait gold cover.

---

Built for [make.fun](https://make.fun/?ref=davidwara) — enter the competition at https://make.fun/c/gta6-cover-art-01
