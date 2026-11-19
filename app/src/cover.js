// Vice City Nights — cover renderer.
// Draws the multi-panel GTA-style cover onto any 2D canvas: photos with a
// Vice City colour grade, a retro sun, palm silhouettes, halftone + grain,
// a vignette, and the tilted title ribbon with a level subtitle.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, layout: 'square' },
  '1080x1350': { w: 1080, h: 1350, layout: 'poster' },
  '1920x1080': { w: 1920, h: 1080, layout: 'wide' },
};

// Normalised panel rects (0..1). The first panel of every layout is the hero.
export const LAYOUTS = {
  poster: [
    { name: 'Hero', x: 0, y: 0, w: 1, h: 0.5 },
    { name: 'Street', x: 0, y: 0.5, w: 0.5, h: 0.25 },
    { name: 'Night drive', x: 0.5, y: 0.5, w: 0.5, h: 0.25 },
    { name: 'Beach', x: 0, y: 0.75, w: 0.5, h: 0.25 },
    { name: 'Skyline', x: 0.5, y: 0.75, w: 0.5, h: 0.25 },
  ],
  square: [
    { name: 'Hero', x: 0, y: 0, w: 0.6, h: 0.62 },
    { name: 'Neon', x: 0.6, y: 0, w: 0.4, h: 0.31 },
    { name: 'Street', x: 0.6, y: 0.31, w: 0.4, h: 0.31 },
    { name: 'Beach', x: 0, y: 0.62, w: 1, h: 0.38 },
  ],
  wide: [
    { name: 'Hero', x: 0, y: 0, w: 0.56, h: 1 },
    { name: 'Night drive', x: 0.56, y: 0, w: 0.44, h: 0.48 },
    { name: 'Street', x: 0.56, y: 0.48, w: 0.22, h: 0.52 },
    { name: 'Skyline', x: 0.78, y: 0.48, w: 0.22, h: 0.52 },
  ],
};

export const GRADES = {
  vice: {
    label: 'Vice Sunset',
    filter: 'saturate(1.35) contrast(1.12) brightness(1.04)',
    top: '#ff2e88', mid: '#ff7a18', bottom: '#2b0a4d', glow: '#ff7a18',
  },
  neon: {
    label: 'Neon Night',
    filter: 'saturate(1.5) contrast(1.18) brightness(0.96)',
    top: '#2de2ff', mid: '#7b2fff', bottom: '#0b1030', glow: '#2de2ff',
  },
  gold: {
    label: 'Palm Gold',
    filter: 'saturate(1.25) contrast(1.08) brightness(1.08)',
    top: '#ffc93c', mid: '#ff9a3c', bottom: '#4d1a08', glow: '#ffc93c',
  },
};

export const TITLE_STYLES = {
  sunset: { fill: ['#ffffff', '#ffd9a0'], stroke: '#16041f', shadow: '#ff2e88' },
  vice: { fill: ['#ff2e88', '#ff7a18', '#ffc93c'], stroke: '#16041f', shadow: '#7b2fff' },
  neon: { fill: ['#eafcff', '#2de2ff'], stroke: '#0b1030', shadow: '#2de2ff' },
};

/** Deterministic PRNG so the grain is identical on every render. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Panels for a layout, photos cycling through the loaded slots. */
export function freshPanels(layout, photoCount) {
  return LAYOUTS[layout].map((def, i) => ({
    name: def.name,
    x: def.x, y: def.y, w: def.w, h: def.h,
    photo: photoCount > 0 ? i % photoCount : null,
    zoom: 1.15, ox: 0, oy: 0,
  }));
}

function coverFitDraw(ctx, img, px, py, pw, ph, zoom, ox, oy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(pw / iw, ph / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const spareX = dw - pw;
  const spareY = dh - ph;
  const dx = px - spareX / 2 + (ox * spareX) / 2;
  const dy = py - spareY / 2 + (oy * spareY) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawPhotoPanel(ctx, panel, img, grade, glowAmount, px, py, pw, ph) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  if (img) {
    ctx.filter = grade.filter;
    coverFitDraw(ctx, img, px, py, pw, ph, panel.zoom, panel.ox, panel.oy);
    ctx.filter = 'none';
    // Soft-light vertical wash in the grade's colours.
    const wash = ctx.createLinearGradient(0, py, 0, py + ph);
    wash.addColorStop(0, grade.top);
    wash.addColorStop(0.5, grade.mid);
    wash.addColorStop(1, grade.bottom);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = 0.35 + 0.55 * glowAmount;
    ctx.fillStyle = wash;
    ctx.fillRect(px, py, pw, ph);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  } else {
    const ph2 = ctx.createLinearGradient(px, py, px + pw, py + ph);
    ph2.addColorStop(0, '#4a1a7a');
    ph2.addColorStop(1, '#1a0533');
    ctx.fillStyle = ph2;
    ctx.fillRect(px, py, pw, ph);
  }
  // Dark foot so the caption stays legible over bright photos.
  const foot = ctx.createLinearGradient(0, py + ph * 0.55, 0, py + ph);
  foot.addColorStop(0, 'rgba(8,2,18,0)');
  foot.addColorStop(1, 'rgba(8,2,18,0.6)');
  ctx.fillStyle = foot;
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();
}

/** Retro sun: pale-gold centre fading to the glow colour and hot pink, with
 * horizontal slits across its lower half that widen downward. Kept small and
 * high in the hero's corner so it never covers the photo's subject. */
export function drawRetroSun(ctx, hero, glow) {
  const r = 0.16 * Math.min(hero.w, hero.h);
  const cx = hero.x + 0.8 * hero.w;
  const cy = hero.y + 0.2 * hero.h;
  ctx.save();
  const disc = ctx.createRadialGradient(cx, cy, r * 0.08, cx, cy, r);
  disc.addColorStop(0, '#fff3c4');
  disc.addColorStop(0.45, glow);
  disc.addColorStop(1, '#ff2e88');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = disc;
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = '#16041f';
  const slits = 6;
  for (let i = 0; i < slits; i++) {
    const y = cy + r * 0.08 + i * r * 0.15;
    const barH = r * 0.028 + i * r * 0.02;
    ctx.fillRect(cx - r, y, r * 2, barH);
  }
  ctx.restore();
}

/** One leaning palm silhouette: a quadratic trunk and 7 drooping fronds. */
export function drawPalm(ctx, rootX, rootY, height, lean) {
  const topX = rootX + lean;
  const topY = rootY - height;
  ctx.save();
  ctx.strokeStyle = '#1c0633';
  ctx.fillStyle = '#1c0633';
  ctx.lineCap = 'round';
  // Trunk, leaning toward the top point.
  ctx.lineWidth = Math.max(3, height * 0.05);
  ctx.beginPath();
  ctx.moveTo(rootX, rootY);
  ctx.quadraticCurveTo(rootX + lean * 0.4, rootY - height * 0.55, topX, topY);
  ctx.stroke();
  // Seven fronds: each arcs up and out from the crown, then droops down.
  ctx.lineWidth = Math.max(2, height * 0.032);
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const ang = Math.PI * (0.12 + t * 0.76);
    const len = height * (0.38 + ((i * 7) % 3) * 0.06);
    const dirX = Math.cos(ang);
    const dirY = Math.sin(ang);
    const tipX = topX + dirX * len;
    const tipY = topY + dirY * len + len * 0.35;
    const ctrlX = topX + dirX * len * 0.5;
    const ctrlY = topY + dirY * len * 0.5 - len * 0.2;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
    ctx.stroke();
  }
  ctx.restore();
}

/** Halftone dots fading out of the top-right corner. */
function drawHalftone(ctx, w, h) {
  const step = Math.max(10, w * 0.016);
  ctx.save();
  for (let x = w * 0.74; x < w; x += step) {
    for (let y = 0; y < h * 0.26; y += step) {
      const d = Math.hypot((w - x) / w, y / h);
      const a = Math.max(0, 0.55 - d * 2.4);
      if (a <= 0.02) continue;
      ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.2, step * 0.16), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Deterministic film grain over the whole cover. */
function drawGrain(ctx, w, h) {
  const rand = mulberry32(20261119);
  const count = Math.floor((w * h) / 1100);
  const dot = Math.max(1, w / 1080);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const light = rand() > 0.5;
    ctx.fillStyle = light ? `rgba(255,255,255,${(0.04 + rand() * 0.08).toFixed(3)})`
      : `rgba(0,0,0,${(0.04 + rand() * 0.08).toFixed(3)})`;
    ctx.fillRect(x, y, dot, dot);
  }
  ctx.restore();
}

function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
  g.addColorStop(0, 'rgba(10,2,20,0)');
  g.addColorStop(1, 'rgba(10,2,20,0.38)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** The tilted title ribbon and the level subtitle beneath it. */
export function drawTitleBand(ctx, state, w, h) {
  const grade = GRADES[state.grade];
  const style = TITLE_STYLES[state.titleStyle];
  const isWide = state.layout === 'wide';
  const cy = (isWide ? 0.52 : 0.6) * h;
  const rh = 0.16 * h;
  const rw = w * 1.06;

  ctx.save();
  ctx.translate(w / 2, cy);
  ctx.rotate(-0.05);
  // Ribbon body.
  const body = ctx.createLinearGradient(0, -rh / 2, 0, rh / 2);
  body.addColorStop(0, 'rgba(43,10,77,0.9)');
  body.addColorStop(1, 'rgba(22,4,31,0.92)');
  ctx.fillStyle = body;
  ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
  // Thin glow edges, top and bottom.
  const edgeH = Math.max(2, h * 0.003);
  ctx.shadowColor = grade.glow;
  ctx.shadowBlur = h * 0.02;
  ctx.fillStyle = grade.glow;
  ctx.fillRect(-rw / 2, -rh / 2, rw, edgeH);
  ctx.fillRect(-rw / 2, rh / 2 - edgeH, rw, edgeH);
  ctx.shadowBlur = 0;

  // Caption, fitted to the ribbon width, in Bebas Neue.
  let size = rh * 0.72 * (state.titleScale || 1);
  const caption = (state.caption || '').toUpperCase();
  const setFont = () => { ctx.font = `${size.toFixed(1)}px "Bebas Neue", "Arial Narrow", sans-serif`; };
  setFont();
  while (ctx.measureText(caption).width > rw * 0.92 && size > 12) {
    size *= 0.94;
    setFont();
  }
  const fill = ctx.createLinearGradient(0, -size * 0.5, 0, size * 0.5);
  const stops = style.fill;
  stops.forEach((c, i) => fill.addColorStop(i / (stops.length - 1), c));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.09;
  ctx.strokeStyle = style.stroke;
  ctx.shadowColor = style.shadow;
  ctx.shadowBlur = size * 0.35;
  ctx.strokeText(caption, 0, size * 0.03);
  ctx.fillStyle = fill;
  ctx.fillText(caption, 0, size * 0.03);
  ctx.restore();

  // Subtitle: LEVEL, clearly gapped below the ribbon's lowest tilted edge.
  const sub = h * 0.024;
  const lowestRibbonEdge = cy + (rh / 2) * Math.cos(0.05) + (rw / 2) * Math.sin(0.05);
  const baseline = lowestRibbonEdge + 2.2 * sub;
  ctx.save();
  ctx.font = `600 ${sub.toFixed(1)}px system-ui, "Segoe UI", sans-serif`;
  try { ctx.letterSpacing = `${(sub * 0.22).toFixed(1)}px`; } catch { /* older canvas: ignore */ }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = sub * 0.4;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText(state.subtitle || '', w / 2, baseline);
  ctx.restore();
}

/** Draw the whole cover for `state` onto `ctx` at `w` x `h`. */
export function drawCover(ctx, state, w, h) {
  const grade = GRADES[state.grade];
  const glowAmount = Math.max(0, Math.min(1, (state.glow ?? 65) / 100));
  const gutter = Math.max(3, w * 0.004);

  ctx.save();
  ctx.fillStyle = '#16041f';
  ctx.fillRect(0, 0, w, h);

  const hero = state.panels[0];
  for (const panel of state.panels) {
    const px = panel.x * w + gutter;
    const py = panel.y * h + gutter;
    const pw = panel.w * w - gutter * 2;
    const ph = panel.h * h - gutter * 2;
    const img = panel.photo != null ? state.photos[panel.photo] : null;
    drawPhotoPanel(ctx, panel, img, grade, glowAmount, px, py, pw, ph);
  }

  if (hero) {
    const heroPx = { x: hero.x * w + gutter, y: hero.y * h + gutter, w: hero.w * w - gutter * 2, h: hero.h * h - gutter * 2 };
    drawRetroSun(ctx, heroPx, grade.glow);
    // Three palms along the hero's bottom edge.
    const palmSpots = [
      { x: 0.1, h: 0.3, lean: 14 },
      { x: 0.3, h: 0.24, lean: -10 },
      { x: 0.9, h: 0.27, lean: 12 },
    ];
    for (const spot of palmSpots) {
      const scale = heroPx.w / 1080;
      drawPalm(
        ctx,
        heroPx.x + spot.x * heroPx.w,
        heroPx.y + heroPx.h,
        spot.h * heroPx.h,
        spot.lean * scale,
      );
    }
  }

  drawHalftone(ctx, w, h);
  drawGrain(ctx, w, h);
  drawVignette(ctx, w, h);
  drawTitleBand(ctx, state, w, h);
  ctx.restore();
}

/** A fresh canvas at the state's export size with the cover drawn on it. */
export function renderCoverCanvas(state) {
  const size = SIZES[state.size];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, state, size.w, size.h);
  return canvas;
}
