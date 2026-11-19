// Vice City Nights — the cover renderer. Everything on the cover is drawn by
// code: multi-panel layouts, a Vice City sunset/neon colour grade, a retro sun
// disc and palm silhouettes, halftone and grain, and bold Bebas Neue lettering
// with a thick outline. No Rockstar logo, artwork or font is used anywhere.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, layout: 'square' },
  '1080x1350': { w: 1080, h: 1350, layout: 'poster' },
  '1920x1080': { w: 1920, h: 1080, layout: 'wide' },
};

// Panel rects are normalised (0..1) so one layout serves every export size.
// The first panel is always the hero: it carries the sun disc and the palms.
export const LAYOUTS = {
  poster: {
    label: 'Poster grid',
    panels: [
      { name: 'Hero', x: 0, y: 0, w: 1, h: 0.5 },
      { name: 'Street', x: 0, y: 0.5, w: 0.5, h: 0.25 },
      { name: 'Night drive', x: 0.5, y: 0.5, w: 0.5, h: 0.25 },
      { name: 'Beach', x: 0, y: 0.75, w: 0.5, h: 0.25 },
      { name: 'Skyline', x: 0.5, y: 0.75, w: 0.5, h: 0.25 },
    ],
  },
  square: {
    label: 'Square collage',
    panels: [
      { name: 'Hero', x: 0, y: 0, w: 0.6, h: 0.62 },
      { name: 'Neon', x: 0.6, y: 0, w: 0.4, h: 0.31 },
      { name: 'Street', x: 0.6, y: 0.31, w: 0.4, h: 0.31 },
      { name: 'Beach', x: 0, y: 0.62, w: 1, h: 0.38 },
    ],
  },
  wide: {
    label: 'Wide cinematic',
    panels: [
      { name: 'Hero', x: 0, y: 0, w: 0.56, h: 1 },
      { name: 'Night drive', x: 0.56, y: 0, w: 0.44, h: 0.48 },
      { name: 'Street', x: 0.56, y: 0.48, w: 0.22, h: 0.52 },
      { name: 'Skyline', x: 0.78, y: 0.48, w: 0.22, h: 0.52 },
    ],
  },
};

export const GRADES = {
  vice: {
    label: 'Vice Sunset',
    filter: 'saturate(1.35) contrast(1.12) brightness(1.04)',
    top: '#ff2e88', mid: '#ff7a18', bottom: '#2b0a4d',
    glow: '#ff7a18',
  },
  neon: {
    label: 'Neon Night',
    filter: 'saturate(1.5) contrast(1.18) brightness(0.96)',
    top: '#2de2ff', mid: '#7b2fff', bottom: '#0b1030',
    glow: '#2de2ff',
  },
  gold: {
    label: 'Palm Gold',
    filter: 'saturate(1.25) contrast(1.08) brightness(1.08)',
    top: '#ffc93c', mid: '#ff9a3c', bottom: '#4d1a08',
    glow: '#ffc93c',
  },
};

export const TITLE_STYLES = {
  sunset: { label: 'Sunset', fill: ['#ffffff', '#ffd9a0'], stroke: '#16041f', shadow: '#ff2e88' },
  vice: { label: 'Vice gradient', fill: ['#ff2e88', '#ff7a18', '#ffc93c'], stroke: '#16041f', shadow: '#7b2fff' },
  neon: { label: 'Neon glow', fill: ['#eafcff', '#2de2ff'], stroke: '#0b1030', shadow: '#2de2ff' },
};

// A tiny deterministic PRNG so the grain looks the same on every export.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fitPhoto(img, pw, ph, zoom, ox, oy) {
  // Cover-fit the photo into the panel, then zoom about its centre and shift
  // it by ox/oy (each -1..1) across the spare room the zoom opens up.
  const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
  const scale = base * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const spareX = Math.max(dw - pw, 0) / 2;
  const spareY = Math.max(dh - ph, 0) / 2;
  return {
    dx: (pw - dw) / 2 + ox * spareX,
    dy: (ph - dh) / 2 + oy * spareY,
    dw, dh,
  };
}

function drawPhotoPanel(ctx, img, rect, panel, grade, glowAlpha) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (img) {
    const f = fitPhoto(img, rect.w, rect.h, panel.zoom, panel.ox, panel.oy);
    ctx.filter = grade.filter;
    ctx.drawImage(img, rect.x + f.dx, rect.y + f.dy, f.dw, f.dh);
    ctx.filter = 'none';
  } else {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    g.addColorStop(0, '#3d1160');
    g.addColorStop(1, '#12081f');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  // Sunset wash: a soft-light gradient over the photo, strength from glow.
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(0.55, grade.mid);
  wash.addColorStop(1, grade.bottom);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.35 + 0.55 * glowAlpha;
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  // A gentle dark foot so the caption band stays readable over bright photos.
  const foot = ctx.createLinearGradient(rect.x, rect.y + rect.h * 0.55, rect.x, rect.y + rect.h);
  foot.addColorStop(0, 'rgba(10,2,24,0)');
  foot.addColorStop(1, 'rgba(10,2,24,0.38)');
  ctx.fillStyle = foot;
  ctx.fillRect(rect.x, rect.y + rect.h * 0.55, rect.w, rect.h * 0.45);
  ctx.restore();
}

function drawRetroSun(ctx, cx, cy, r, grade) {
  const g = ctx.createRadialGradient(cx, cy - r * 0.25, r * 0.1, cx, cy, r);
  g.addColorStop(0, '#fff3c4');
  g.addColorStop(0.45, grade.glow);
  g.addColorStop(1, '#ff2e88');
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // Slits across the sun's lower half, widening toward the bottom.
  ctx.fillStyle = 'rgba(18,8,31,0.9)';
  let y = cy + r * 0.08;
  let thick = r * 0.045;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, thick);
    y += thick + r * 0.11;
    thick *= 1.35;
  }
  ctx.restore();
}

function drawPalm(ctx, x, y, s, lean, colour) {
  // One stylised palm silhouette: a leaning trunk and seven drooping fronds.
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineCap = 'round';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -52, 16, -96);
  ctx.stroke();
  const topX = 16;
  const topY = -96;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.08 + (i / 6) * 0.84);
    const len = 52 - Math.abs(i - 3) * 7;
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.62 + 16;
    ctx.lineWidth = 5.5 - Math.abs(i - 3) * 0.4;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.55, topY - 14, ex, ey);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX, topY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHalftone(ctx, w, h, rand) {
  // Dots fading out of one corner, the print-poster touch.
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  const step = Math.max(14, w * 0.014);
  for (let gy = 0; gy < 7; gy++) {
    for (let gx = 0; gx < 10; gx++) {
      const r = step * 0.32 * (1 - (gx + gy) / 17) * (0.7 + rand() * 0.6);
      if (r <= 0.5) continue;
      ctx.beginPath();
      ctx.arc(w - gx * step - step, h * 0.06 + gy * step, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawGrain(ctx, w, h, rand) {
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  const n = Math.floor((w * h) / 900);
  for (let i = 0; i < n; i++) {
    const s = 1 + rand() * 2;
    ctx.fillRect(rand() * w, rand() * h, s, s);
  }
  ctx.restore();
}

function drawTitleBand(ctx, state, w, h) {
  const grade = GRADES[state.grade];
  const style = TITLE_STYLES[state.titleStyle];
  const bandY = state.size === '1920x1080' ? h * 0.52 : h * 0.6;
  const bandH = h * 0.16;
  const tilt = -0.05;
  const fontPx = Math.min(w * 0.16, bandH * 1.25) * state.titleScale;
  ctx.save();
  ctx.translate(w / 2, bandY + bandH / 2);
  ctx.rotate(tilt);
  // Ribbon behind the title so it reads over any photo.
  const ribbonW = w * 1.08;
  const ribbonH = bandH;
  ctx.fillStyle = 'rgba(22,4,31,0.82)';
  ctx.beginPath();
  ctx.moveTo(-ribbonW / 2 + 26, -ribbonH / 2);
  ctx.lineTo(ribbonW / 2 - 26, -ribbonH / 2);
  ctx.lineTo(ribbonW / 2, ribbonH / 2);
  ctx.lineTo(-ribbonW / 2, ribbonH / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = grade.glow;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.beginPath();
  ctx.moveTo(-ribbonW / 2 + 26, -ribbonH / 2);
  ctx.lineTo(ribbonW / 2 - 26, -ribbonH / 2);
  ctx.moveTo(-ribbonW / 2, ribbonH / 2);
  ctx.lineTo(ribbonW / 2, ribbonH / 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // The caption, fitted to the ribbon and stroked thick.
  const caption = (state.caption || 'VICE CITY').toUpperCase();
  const font = (px) => `${px}px 'Bebas Neue', 'Arial Narrow', 'Impact', sans-serif`;
  let px = fontPx;
  ctx.font = font(px);
  const maxW = ribbonW * 0.92;
  while (px > 24 && ctx.measureText(caption).width > maxW) {
    px *= 0.92;
    ctx.font = font(px);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.shadowColor = style.shadow;
  ctx.shadowBlur = px * 0.22;
  ctx.lineWidth = Math.max(3, px * 0.09);
  ctx.strokeStyle = style.stroke;
  ctx.strokeText(caption, 0, px * 0.04);
  const fill = ctx.createLinearGradient(0, -px / 2, 0, px / 2);
  style.fill.forEach((c, i) => fill.addColorStop(i / (style.fill.length - 1), c));
  ctx.shadowBlur = 0;
  ctx.fillStyle = fill;
  ctx.fillText(caption, 0, px * 0.04);
  ctx.restore();

  // Subtitle, level and well clear of the ribbon's tilted lower edge.
  const sub = (state.subtitle || '').toUpperCase();
  if (sub) {
    const subPx = Math.max(18, w * 0.021);
    ctx.save();
    ctx.translate(w / 2, bandY + bandH + subPx * 2.2);
    ctx.font = `600 ${subPx}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = subPx * 0.4;
    const spaced = sub.split('').join('  ');
    ctx.fillText(spaced, 0, 0);
    ctx.restore();
  }
}

// Draw the whole cover for `state` onto `ctx` at pixel size w x h.
export function drawCover(ctx, state, w, h) {
  const grade = GRADES[state.grade];
  const layout = LAYOUTS[state.layout];
  const glowAlpha = (state.glow ?? 65) / 100;
  const rand = mulberry32(20261119);
  ctx.clearRect(0, 0, w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#2b0a4d');
  sky.addColorStop(0.55, '#7b1e5e');
  sky.addColorStop(1, '#12081f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const gutter = Math.max(6, Math.round(w * 0.008));
  const rects = layout.panels.map((p) => ({
    x: p.x * w + gutter,
    y: p.y * h + gutter,
    w: p.w * w - gutter * 2,
    h: p.h * h - gutter * 2,
  }));
  state.panels.forEach((panel, i) => {
    const img = state.onePhotoAll
      ? state.photos[0]
      : state.photos[panel.photo] ?? null;
    drawPhotoPanel(ctx, img, rects[i], panel, grade, glowAlpha);
  });

  // White gutters between panels, then the frame.
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = gutter;
  rects.forEach((r) => ctx.strokeRect(r.x - gutter / 2, r.y - gutter / 2, r.w + gutter, r.h + gutter));
  ctx.lineWidth = Math.max(4, w * 0.006);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(gutter / 2, gutter / 2, w - gutter, h - gutter);

  // Sun disc and palms live in the hero panel, over its photo. The sun stays
  // small and high in its corner so it never hides the photo's subject.
  const hero = rects[0];
  const sunR = Math.min(hero.w, hero.h) * 0.16;
  drawRetroSun(ctx, hero.x + hero.w * 0.8, hero.y + hero.h * 0.2, sunR, grade);
  const palmColour = 'rgba(16,5,32,0.92)';
  const ps = Math.min(hero.w, hero.h) / 340;
  drawPalm(ctx, hero.x + hero.w * 0.1, hero.y + hero.h * 0.98, ps * 1.15, -0.06, palmColour);
  drawPalm(ctx, hero.x + hero.w * 0.3, hero.y + hero.h * 0.99, ps * 0.8, 0.1, palmColour);
  drawPalm(ctx, hero.x + hero.w * 0.9, hero.y + hero.h * 0.99, ps * 0.95, 0.12, palmColour);

  drawHalftone(ctx, w, h, rand);
  drawGrain(ctx, w, h, rand);

  // Vignette to pull the eye to the middle.
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(10,2,24,0)');
  vig.addColorStop(1, 'rgba(10,2,24,0.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  drawTitleBand(ctx, state, w, h);
}

// Render the cover for `state` to a fresh canvas at the state's export size.
export function renderCoverCanvas(state) {
  const size = SIZES[state.size];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas.getContext('2d'), state, size.w, size.h);
  return canvas;
}

// Fresh panels for a layout: photos cycle through the loaded slots.
export function freshPanels(layout, photoCount) {
  return LAYOUTS[layout].panels.map((p, i) => ({
    name: p.name,
    photo: photoCount > 0 ? i % photoCount : -1,
    zoom: 1.15,
    ox: 0,
    oy: 0,
  }));
}
