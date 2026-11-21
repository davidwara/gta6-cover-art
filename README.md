# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/davidwara/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/davidwara/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice City Nights v2** — an offline web app that turns your photos and a
caption into GTA 6-style multi-panel cover art and exports it as a PNG.

Load up to six of your own photos (or the two bundled samples), drop them
into the poster, square, wide or story layout, pick a colour grade — Vice
Sunset, Neon Night, Palm Gold, Ocean Drive, Midnight Vice or Bubblegum —
slide the sunset glow, grain, vignette and halftone, toggle the retro sun,
skyline, badges and neon border, crop and position each panel by dragging,
try a per-panel photo filter, write your title and subtitle (or tap a
caption preset), try a one-click Look or hit Surprise me — and export a
1080×1080, 1080×1350, 1920×1080 or 1080×1920 PNG at 1× or 2×, ready to
post. The cover is drawn entirely in code: retro sun with slits, palm
silhouettes, a lit skyline, a low-rider, birds, stars, halftone dots,
grain and a tilted title ribbon. Photos are read on your machine and never
uploaded; the app makes no network request at all.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080

No build step, no dependencies — plain static files under `app/`.

## Screenshots

![Cover](screenshots/1-cover.jpg)
![Editor](screenshots/2-editor.jpg)
![Square cover](screenshots/3-cover-square.jpg)
![Portrait cover](screenshots/4-cover-portrait.jpg)

## Notes

- Original art only: no Rockstar Games logo, wordmark, official artwork,
  character or font. The display font is Bebas Neue (SIL OFL 1.1, see
  `app/fonts/FONT-LICENSE.txt`).
- Sample photos are free to use and ship with the app.

---

Built for the make.fun bounty
[gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01?ref=davidwara).
