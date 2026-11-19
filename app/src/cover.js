// Vice City Nights — cover renderer.
// Turns the editor state (photos, layout, grade, caption) into GTA 6-style
// multi-panel cover art on a 2D canvas. Pure canvas, no network, no libs.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, layout: 'square' },
  '1080x1350': { w: 1080, h: 1350, layout: 'poster' },
  '1920x1080': { w: 1920, h: 1080, layout: 'wide' },
};

// Normalised panel rects (x, y, w, h in 0..1 of the cover). Panel 0 is the hero.
export const LAYOUTS = {
  poster: [
    { name: 'Hero', rect: [0, 0, 1, 0.5] },
    { name: 'Street', rect: [0, 0.5, 0.5, 0.25] },
    { name: 'Night drive', rect: [0.5, 0.5, 0.5, 0.25] },
    { name: 'Beach', rect: [0, 0.75, 0.5, 0.25] },
    { name: 'Skyline', rect: [0.5, 0.75, 0.5, 0.25] },
  ],
  square: [
    { name: 'Hero', rect: [0, 0, 0.6, 0.62] },
    { name: 'Neon', rect: [0.6, 0, 0.4, 0.31] },
    { name: 'Street', rect: [0.6, 0.31, 0.4, 0.31] },
    { name: 'Beach', rect: [0, 0.62, 1, 0.38] },
  ],
  wide: [
    { name: 'Hero', rect: [0, 0, 0.56, 1] },
    { name: 'Night drive', rect: [0.56, 0, 0.44, 0.48] },
    { name: 'Street', rect: [0.56, 0.48, 0.22, 0.52] },
    { name: 'Skyline', rect: [0.78, 0.48, 0.22, 0.52] },
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
  sunset: {
    label: 'Sunset',
    stops: ['#ffffff', '#ffd9a0'],
    stroke: '#16041f',
    shadow: '#ff2e88',
  },
  vice: {
    label: 'Vice',
    stops: ['#ff2e88', '#ff7a18', '#ffc93c'],
    stroke: '#16041f',
    shadow: '#7b2fff',
  },
  neon: {
    label: 'Neon',
    stops: ['#eafcff', '#2de2ff'],
    stroke: '#0b1030',
    shadow: '#2de2ff',
  },
};

// Deterministic PRNG so the grain is identical on every render.
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

// Fresh panel list for a layout: photos cycle through the loaded slots.
export function freshPanels(layoutName, photoCount) {
  const defs = LAYOUTS[layoutName] ?? LAYOUTS.poster;
  return defs.map((def, i) => ({
    name: def.name,
    rect: def.rect,
    photo: photoCount > 0 ? i % photoCount : -1,
    zoom: 1.15,
    ox: 0,
    oy: 0,
  }));
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function drawPlaceholder(ctx, x, y, w, h, grade) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, grade.top);
  g.addColorStop(0.55, '#3d1560');
  g.addColorStop(1, grade.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = Math.max(2, w * 0.01);
  ctx.setLineDash([w * 0.04, w * 0.03]);
  ctx.strokeRect(x + w * 0.06, y + h * 0.08, w * 0.88, h * 0.84);
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `600 ${Math.round(h * 0.09)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ADD PHOTO', x + w / 2, y + h / 2);
}

function drawPhotoPanel(ctx, panel, photo, grade, glowAmount, px, py, pw, ph) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();

  if (!photo || !photo.img || !photo.img.naturalWidth) {
    drawPlaceholder(ctx, px, py, pw, ph, grade);
    ctx.restore();
    return;
  }

  const iw = photo.img.naturalWidth;
  const ih = photo.img.naturalHeight;
  const base = Math.max(pw / iw, ph / ih);
  const scale = base * panel.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  // Cover-fit: centre the photo, then shift it by ox/oy across the spare room.
  const dx = px + (pw - dw) / 2 + panel.ox * ((dw - pw) / 2);
  const dy = py + (ph - dh) / 2 + panel.oy * ((dh - ph) / 2);

  ctx.filter = grade.filter;
  ctx.drawImage(photo.img, dx, dy, dw, dh);
  ctx.filter = 'none';

  // Soft-light colour wash in the grade's palette; strength follows the glow slider.
  const alpha = 0.35 + 0.55 * glowAmount;
  const wash = ctx.createLinearGradient(px, py, px, py + ph);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(0.5, grade.mid);
  wash.addColorStop(1, grade.bottom);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = wash;
  ctx.fillRect(px, py, pw, ph);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  // Dark foot so the caption band stays legible over bright photos.
  const foot = ctx.createLinearGradient(px, py + ph * 0.55, px, py + ph);
  foot.addColorStop(0, 'rgba(12,3,26,0)');
  foot.addColorStop(1, 'rgba(12,3,26,0.5)');
  ctx.fillStyle = foot;
  ctx.fillRect(px, py + ph * 0.55, pw, ph * 0.45);

  ctx.restore();
}

function drawRetroSun(ctx, hero, grade, glowAmount) {
  const [hx, hy, hw, hh] = hero;
  const r = 0.16 * Math.min(hw, hh);
  const cx = hx + hw * 0.8;
  const cy = hy + hh * 0.2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const disc = ctx.createRadialGradient(cx, cy - r * 0.25, r * 0.08, cx, cy, r);
  disc.addColorStop(0, '#fff3c4');
  disc.addColorStop(0.45, grade.glow);
  disc.addColorStop(1, '#ff2e88');
  ctx.fillStyle = disc;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // Horizontal slits across the lower half, widening as they go down.
  ctx.fillStyle = 'rgba(22,4,31,0.92)';
  const slits = 5;
  for (let i = 0; i < slits; i++) {
    const t = i / slits; // 0 at the middle, 1 at the bottom edge
    const sy = cy + t * r * 0.95;
    const half = Math.sqrt(Math.max(0, r * r - (sy - cy) * (sy - cy)));
    const thick = r * (0.03 + 0.075 * t);
    ctx.fillRect(cx - half, sy - thick / 2, half * 2, thick);
  }
  ctx.restore();
  // Soft halo so the disc glows against the photo.
  ctx.save();
  ctx.globalAlpha = 0.25 + 0.35 * glowAmount;
  const halo = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 2.1);
  halo.addColorStop(0, grade.glow);
  halo.addColorStop(1, 'rgba(255,46,136,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPalm(ctx, baseX, baseY, size, lean) {
  const ink = '#170829';
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineCap = 'round';
  // Leaning trunk: a quadratic curve from the base up to the crown.
  const crownX = baseX + size * lean;
  const crownY = baseY - size;
  ctx.lineWidth = Math.max(2, size * 0.045);
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + size * lean * 0.4, baseY - size * 0.55, crownX, crownY);
  ctx.stroke();
  // Seven drooping fronds fanning out of the crown.
  ctx.lineWidth = Math.max(1.5, size * 0.03);
  for (let i = 0; i < 7; i++) {
    const spread = -Math.PI * 0.92 + (i / 6) * Math.PI * 0.84; // fan across the top
    const tipX = crownX + Math.cos(spread) * size * 0.62;
    const tipY = crownY + Math.sin(spread) * size * 0.3 + size * 0.34; // droop downward
    const midX = crownX + Math.cos(spread) * size * 0.34;
    const midY = crownY + Math.sin(spread) * size * 0.16 - size * 0.06;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHalftone(ctx, w, h) {
  // Dots fading out of the top-right corner.
  const rng = mulberry32(0xC0FFEE);
  const step = Math.max(14, w * 0.014);
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let gx = w - step; gx > w * 0.55; gx -= step) {
    for (let gy = step * 0.5; gy < h * 0.42; gy += step) {
      const d = Math.hypot(w - gx, gy) / (w * 0.5);
      const fade = clamp(1 - d, 0, 1);
      if (fade <= 0.02) continue;
      const r = step * 0.16 * fade * (0.8 + rng() * 0.4);
      ctx.globalAlpha = 0.55 * fade;
      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawGrain(ctx, w, h) {
  const rng = mulberry32(20261119);
  const count = Math.floor((w * h) / 2600);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const v = rng();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(rng() * w, rng() * h, 1.6, 1.6);
  }
  ctx.restore();
}

function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  g.addColorStop(0, 'rgba(10,2,20,0)');
  g.addColorStop(1, 'rgba(10,2,20,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function fitFont(ctx, text, maxWidth, startPx, family) {
  let px = startPx;
  ctx.font = `${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px *= 0.94;
    ctx.font = `${px}px ${family}`;
  }
  return px;
}

function drawTitleBand(ctx, state, w, h, grade, style) {
  const isWide = state.size === '1920x1080';
  const bandH = h * 0.16;
  const bandY = h * (isWide ? 0.52 : 0.6);
  const family = '"Bebas Neue", "Arial Narrow", sans-serif';
  const title = (state.caption || 'Sunset Heist').toUpperCase();
  const subtitle = (state.subtitle || '').toUpperCase();

  // Tilted dark ribbon, slightly wider than the canvas so the rotation
  // never exposes a gap at the edges.
  ctx.save();
  ctx.translate(w / 2, bandY);
  ctx.rotate(-0.05);
  const rw = w * 1.08;
  ctx.fillStyle = 'rgba(22,4,31,0.84)';
  ctx.fillRect(-rw / 2, -bandH / 2, rw, bandH);
  ctx.fillStyle = grade.glow;
  ctx.fillRect(-rw / 2, -bandH / 2, rw, Math.max(2, bandH * 0.035));
  ctx.fillRect(-rw / 2, bandH / 2 - Math.max(2, bandH * 0.035), rw, Math.max(2, bandH * 0.035));

  // Caption, fitted to the ribbon width.
  const fontPx = fitFont(ctx, title, rw * 0.9, bandH * 0.74 * state.titleScale, family);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fill = ctx.createLinearGradient(0, -fontPx * 0.55, 0, fontPx * 0.55);
  style.stops.forEach((c, i) => fill.addColorStop(i / Math.max(1, style.stops.length - 1), c));
  ctx.lineJoin = 'round';
  ctx.lineWidth = fontPx * 0.09;
  ctx.strokeStyle = style.stroke;
  ctx.shadowColor = style.shadow;
  ctx.shadowBlur = fontPx * 0.28;
  ctx.strokeText(title, 0, fontPx * 0.03);
  ctx.fillStyle = fill;
  ctx.fillText(title, 0, fontPx * 0.03);
  ctx.restore();

  // Subtitle: LEVEL (never rotated), gapped well below the ribbon so the
  // tilted ribbon edge can never touch it.
  if (subtitle) {
    const subPx = Math.round(fontPx * 0.26);
    ctx.save();
    ctx.font = `600 ${subPx}px system-ui, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(subPx * 0.22)}px`; } catch { /* older canvas */ }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = subPx * 0.4;
    const subY = bandY + bandH / 2 + 2.2 * subPx;
    ctx.fillText(subtitle, w / 2, subY);
    ctx.restore();
  }
}

export function drawCover(ctx, state, w, h) {
  const grade = GRADES[state.grade] ?? GRADES.vice;
  const style = TITLE_STYLES[state.titleStyle] ?? TITLE_STYLES.sunset;
  const glowAmount = clamp((state.glow ?? 65) / 100, 0, 1);
  const photos = state.photos ?? [];

  // Base wash so panel seams never show bare canvas.
  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, grade.bottom);
  base.addColorStop(1, '#12041f');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  const gap = Math.max(2, Math.round(w * 0.003));
  let heroRect = null;
  for (const panel of state.panels) {
    const [nx, ny, nw, nh] = panel.rect;
    const px = nx * w;
    const py = ny * h;
    const pw = nw * w;
    const ph = nh * h;
    if (panel.name === 'Hero') heroRect = [px, py, pw, ph];
    let photo = null;
    if (state.onePhotoAll) {
      photo = photos[0] ?? null;
    } else if (panel.photo >= 0) {
      photo = photos[panel.photo] ?? null;
    }
    drawPhotoPanel(ctx, panel, photo, grade, glowAmount, px, py, pw, ph);
  }

  // Panel gutters.
  ctx.fillStyle = '#16041f';
  for (const panel of state.panels) {
    const [nx, ny, nw, nh] = panel.rect;
    ctx.fillRect(nx * w + nw * w - gap / 2, ny * h, gap, nh * h);
    ctx.fillRect(nx * w, ny * h + nh * h - gap / 2, nw * w, gap);
  }
  ctx.strokeStyle = '#16041f';
  ctx.lineWidth = gap;
  ctx.strokeRect(0, 0, w, h);

  if (heroRect) {
    drawRetroSun(ctx, heroRect, grade, glowAmount);
    const [, hy, hw, hh] = heroRect;
    const palmSize = Math.min(hw, hh) * 0.22;
    const baseY = hy + hh - Math.max(4, hh * 0.01);
    drawPalm(ctx, heroRect[0] + hw * 0.1, baseY, palmSize, 0.35);
    drawPalm(ctx, heroRect[0] + hw * 0.3, baseY, palmSize * 0.8, -0.2);
    drawPalm(ctx, heroRect[0] + hw * 0.9, baseY, palmSize * 0.9, 0.45);
  }

  drawHalftone(ctx, w, h);
  drawGrain(ctx, w, h);
  drawVignette(ctx, w, h);
  drawTitleBand(ctx, state, w, h, grade, style);
}

export function renderCoverCanvas(state) {
  const size = SIZES[state.size] ?? SIZES['1080x1350'];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, state, size.w, size.h);
  return canvas;
}
