// cover.js — the Vice City Nights renderer. Draws the multi-panel cover
// (photos, grades, retro sun, palms, halftone, grain, title ribbon) onto a
// 2D canvas. Pure drawing code: no DOM, no network, no side effects.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, layout: 'square' },
  '1080x1350': { w: 1080, h: 1350, layout: 'poster' },
  '1920x1080': { w: 1920, h: 1080, layout: 'wide' },
};

// Normalised panel rects [x, y, w, h]; the first panel is always the hero.
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
  sunset: {
    label: 'Sunset',
    fill: ['#ffffff', '#ffd9a0'],
    stroke: '#16041f',
    shadow: '#ff2e88',
  },
  vice: {
    label: 'Vice',
    fill: ['#ff2e88', '#ff7a18', '#ffc93c'],
    stroke: '#16041f',
    shadow: '#7b2fff',
  },
  neon: {
    label: 'Neon',
    fill: ['#eafcff', '#2de2ff'],
    stroke: '#0b1030',
    shadow: '#2de2ff',
  },
};

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

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgba(hex, alpha) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Photos cycle through the loaded slots; each panel starts zoomed in a
// touch so the grade wash has something to bite on.
export function freshPanels(layout, photoCount) {
  const rects = LAYOUTS[layout];
  return rects.map((rect, i) => ({
    name: rect.name,
    photo: photoCount > 0 ? i % photoCount : -1,
    zoom: 1.15,
    ox: 0,
    oy: 0,
  }));
}

function drawPhotoPanel(ctx, rect, photo, panel, grade, glow) {
  const px = rect.x, py = rect.y, pw = rect.w, ph = rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  if (!photo) {
    const g = ctx.createLinearGradient(px, py, px, py + ph);
    g.addColorStop(0, grade.top);
    g.addColorStop(0.55, grade.mid);
    g.addColorStop(1, grade.bottom);
    ctx.fillStyle = g;
    ctx.fillRect(px, py, pw, ph);
    ctx.restore();
    return;
  }
  // Cover-fit with zoom and pan across the spare room.
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const base = Math.max(pw / iw, ph / ih);
  const scale = base * panel.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const spareX = Math.max(0, (dw - pw) / 2);
  const spareY = Math.max(0, (dh - ph) / 2);
  const dx = px + (pw - dw) / 2 - panel.ox * spareX;
  const dy = py + (ph - dh) / 2 - panel.oy * spareY;
  ctx.filter = grade.filter;
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.filter = 'none';
  // Soft-light vertical wash in the grade colours.
  ctx.globalCompositeOperation = 'soft-light';
  const wash = ctx.createLinearGradient(px, py, px, py + ph);
  wash.addColorStop(0, rgba(grade.top, 0.35 + 0.55 * glow));
  wash.addColorStop(0.5, rgba(grade.mid, 0.35 + 0.55 * glow));
  wash.addColorStop(1, rgba(grade.bottom, 0.35 + 0.55 * glow));
  ctx.fillStyle = wash;
  ctx.fillRect(px, py, pw, ph);
  ctx.globalCompositeOperation = 'source-over';
  // Dark foot so the caption stays legible over bright photos.
  const foot = ctx.createLinearGradient(px, py + ph * 0.55, px, py + ph);
  foot.addColorStop(0, 'rgba(10,2,20,0)');
  foot.addColorStop(1, 'rgba(10,2,20,0.55)');
  ctx.fillStyle = foot;
  ctx.fillRect(px, py + ph * 0.55, pw, ph * 0.45);
  ctx.restore();
}

function drawRetroSun(ctx, hero, grade) {
  // Small and high in the hero's corner — it must never cover the subject.
  const r = 0.16 * Math.min(hero.w, hero.h);
  const cx = hero.x + hero.w * 0.8;
  const cy = hero.y + hero.h * 0.2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createRadialGradient(cx, cy - r * 0.4, r * 0.1, cx, cy, r);
  g.addColorStop(0, '#fff3c4');
  g.addColorStop(0.45, grade.glow);
  g.addColorStop(1, '#ff2e88');
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // Horizontal slits across the lower half, widening downward.
  ctx.fillStyle = grade.bottom;
  const slits = 5;
  for (let i = 0; i < slits; i++) {
    const y = cy + (r * 0.08) + (i * r * 0.17);
    const half = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
    const thick = 2 + i * 2.2;
    ctx.fillRect(cx - half, y, half * 2, thick);
  }
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.5;
  const halo = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 2.1);
  halo.addColorStop(0, rgba(grade.glow, 0.55));
  halo.addColorStop(1, rgba(grade.glow, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(cx - r * 2.1, cy - r * 2.1, r * 4.2, r * 4.2);
  ctx.restore();
}

function drawPalm(ctx, x, baseY, size) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.strokeStyle = '#14061f';
  ctx.fillStyle = '#14061f';
  ctx.lineWidth = Math.max(3, size * 0.045);
  ctx.lineCap = 'round';
  // Leaning trunk.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.12, -size * 0.55, size * 0.34, -size * 0.95);
  ctx.stroke();
  const topX = size * 0.34;
  const topY = -size * 0.95;
  // Seven drooping fronds.
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.08 + (i / 6) * 0.84);
    const len = size * (0.42 + (i % 2) * 0.1);
    const tipX = topX + Math.cos(a) * len;
    const tipY = topY + Math.sin(a) * len * 0.55 + size * 0.22;
    const ctrlX = topX + Math.cos(a) * len * 0.55;
    const ctrlY = topY + Math.sin(a) * len * 0.3 - size * 0.08;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
    ctx.lineWidth = Math.max(2, size * 0.03);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHalftone(ctx, w, h, grade) {
  const rng = mulberry32(20261119);
  const cell = Math.max(14, w / 72);
  ctx.save();
  for (let y = 0; y < h * 0.32; y += cell) {
    for (let x = w * 0.62; x < w; x += cell) {
      const fade = 1 - (y / (h * 0.32)) * 0.7 - ((x - w * 0.62) / (w * 0.38)) * 0.2;
      if (fade <= 0.05) continue;
      const r = cell * 0.32 * fade * (0.7 + rng() * 0.6);
      ctx.fillStyle = rgba(grade.top, 0.5 * fade);
      ctx.beginPath();
      ctx.arc(x + cell / 2, y + cell / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawGrain(ctx, w, h) {
  const rng = mulberry32(77);
  const count = Math.floor((w * h) / 2600);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const light = rng() > 0.5;
    ctx.fillStyle = light ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.restore();
}

function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(8,2,18,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function fitFont(ctx, text, maxWidth, startPx, family) {
  let px = startPx;
  ctx.font = `${px}px ${family}`;
  while (px > 24 && ctx.measureText(text).width > maxWidth) {
    px -= 4;
    ctx.font = `${px}px ${family}`;
  }
  return px;
}

function drawTitleBand(ctx, state, w, h, grade) {
  const style = TITLE_STYLES[state.titleStyle];
  const layout = state.layout;
  const ribbonY = h * (layout === 'wide' ? 0.52 : 0.6);
  const ribbonH = h * 0.16;
  const family = '"Bebas Neue", "Arial Narrow", sans-serif';

  ctx.save();
  ctx.translate(w / 2, ribbonY);
  ctx.rotate(-0.05);
  // Tilted dark ribbon with a thin glow edge top and bottom.
  ctx.fillStyle = 'rgba(12,2,22,0.88)';
  ctx.fillRect(-w * 0.52, -ribbonH / 2, w * 1.04, ribbonH);
  ctx.fillStyle = rgba(grade.glow, 0.9);
  ctx.fillRect(-w * 0.52, -ribbonH / 2, w * 1.04, Math.max(3, ribbonH * 0.045));
  ctx.fillRect(-w * 0.52, ribbonH / 2 - Math.max(3, ribbonH * 0.045), w * 1.04, Math.max(3, ribbonH * 0.045));
  // Caption, fitted to the ribbon width.
  const title = (state.caption || 'Sunset Heist').toUpperCase();
  const targetPx = ribbonH * 0.72 * (state.titleScale || 1);
  const px = fitFont(ctx, title, w * 0.96, targetPx, family);
  const fill = ctx.createLinearGradient(0, -ribbonH / 2, 0, ribbonH / 2);
  style.fill.forEach((c, i) => fill.addColorStop(i / Math.max(1, style.fill.length - 1), c));
  ctx.font = `${px}px ${family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.shadowColor = style.shadow;
  ctx.shadowBlur = px * 0.28;
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = px * 0.09;
  ctx.strokeText(title, 0, px * 0.04);
  ctx.fillStyle = fill;
  ctx.fillText(title, 0, px * 0.04);
  ctx.restore();

  // Subtitle: level, clearly gapped below the ribbon so the tilted edge
  // never touches it.
  const subPx = Math.max(20, h * 0.028 * (state.titleScale || 1));
  ctx.save();
  ctx.font = `${subPx}px ${family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = grade.glow;
  ctx.shadowBlur = subPx * 0.5;
  const sub = (state.subtitle || '').toUpperCase();
  ctx.fillText(sub, w / 2, ribbonY + ribbonH / 2 + subPx * 2.2);
  ctx.restore();
}

export function drawCover(ctx, state, w, h) {
  const grade = GRADES[state.grade];
  const glow = (state.glow ?? 65) / 100;
  const rects = LAYOUTS[state.layout];

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = grade.bottom;
  ctx.fillRect(0, 0, w, h);

  const gap = Math.max(4, w * 0.006);
  rects.forEach((rect, i) => {
    const inset = {
      x: rect.x * w + (rect.x > 0 ? gap / 2 : 0),
      y: rect.y * h + (rect.y > 0 ? gap / 2 : 0),
      w: rect.w * w - (rect.x > 0 ? gap / 2 : 0) - (rect.x + rect.w < 1 ? gap / 2 : 0),
      h: rect.h * h - (rect.y > 0 ? gap / 2 : 0) - (rect.y + rect.h < 1 ? gap / 2 : 0),
    };
    const panel = state.panels[i];
    const photo = panel && panel.photo >= 0 ? state.photos[panel.photo] : null;
    drawPhotoPanel(ctx, inset, photo, panel ?? { zoom: 1, ox: 0, oy: 0 }, grade, glow);
  });

  const hero = {
    x: rects[0].x * w,
    y: rects[0].y * h,
    w: rects[0].w * w,
    h: rects[0].h * h,
  };
  drawRetroSun(ctx, hero, grade);
  const palmSize = Math.min(hero.w, hero.h) * 0.34;
  drawPalm(ctx, hero.x + hero.w * 0.1, hero.y + hero.h * 0.99, palmSize);
  drawPalm(ctx, hero.x + hero.w * 0.3, hero.y + hero.h * 0.99, palmSize * 0.8);
  drawPalm(ctx, hero.x + hero.w * 0.9, hero.y + hero.h * 0.99, palmSize * 0.9);
  drawHalftone(ctx, w, h, grade);
  drawTitleBand(ctx, state, w, h, grade);
  drawGrain(ctx, w, h);
  drawVignette(ctx, w, h);
}

export function renderCoverCanvas(state) {
  const { w, h } = SIZES[state.size];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas.getContext('2d'), state, w, h);
  return canvas;
}
