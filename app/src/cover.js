// Vice City Nights — the cover renderer (app/src/cover.js).
// Pure canvas drawing: no DOM, no network. Given a state (size, layout,
// grade, photos, caption) it paints the multi-panel GTA-style cover.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, layout: 'square' },
  '1080x1350': { w: 1080, h: 1350, layout: 'poster' },
  '1920x1080': { w: 1920, h: 1080, layout: 'wide' },
};

// Normalised 0..1 rects. The first panel of every layout is the hero.
export const LAYOUTS = {
  poster: [
    { x: 0, y: 0, w: 1, h: 0.5, label: 'Hero' },
    { x: 0, y: 0.5, w: 0.5, h: 0.25, label: 'Street' },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.25, label: 'Night drive' },
    { x: 0, y: 0.75, w: 0.5, h: 0.25, label: 'Beach' },
    { x: 0.5, y: 0.75, w: 0.5, h: 0.25, label: 'Skyline' },
  ],
  square: [
    { x: 0, y: 0, w: 0.6, h: 0.62, label: 'Hero' },
    { x: 0.6, y: 0, w: 0.4, h: 0.31, label: 'Neon' },
    { x: 0.6, y: 0.31, w: 0.4, h: 0.31, label: 'Street' },
    { x: 0, y: 0.62, w: 1, h: 0.38, label: 'Beach' },
  ],
  wide: [
    { x: 0, y: 0, w: 0.56, h: 1, label: 'Hero' },
    { x: 0.56, y: 0, w: 0.44, h: 0.48, label: 'Night drive' },
    { x: 0.56, y: 0.48, w: 0.22, h: 0.52, label: 'Street' },
    { x: 0.78, y: 0.48, w: 0.22, h: 0.52, label: 'Skyline' },
  ],
};

export const GRADES = {
  vice: {
    name: 'Vice Sunset',
    filter: { saturate: 1.35, contrast: 1.12, brightness: 1.04 },
    top: '#ff2e88', mid: '#ff7a18', bottom: '#2b0a4d', glow: '#ff7a18',
  },
  neon: {
    name: 'Neon Night',
    filter: { saturate: 1.5, contrast: 1.18, brightness: 0.96 },
    top: '#2de2ff', mid: '#7b2fff', bottom: '#0b1030', glow: '#2de2ff',
  },
  gold: {
    name: 'Palm Gold',
    filter: { saturate: 1.25, contrast: 1.08, brightness: 1.08 },
    top: '#ffc93c', mid: '#ff9a3c', bottom: '#4d1a08', glow: '#ffc93c',
  },
};

export const TITLE_STYLES = {
  sunset: { fill: ['#ffffff', '#ffd9a0'], stroke: '#16041f', shadow: '#ff2e88' },
  vice: { fill: ['#ff2e88', '#ff7a18', '#ffc93c'], stroke: '#16041f', shadow: '#7b2fff' },
  neon: { fill: ['#eafcff', '#2de2ff'], stroke: '#0b1030', shadow: '#2de2ff' },
};

// Deterministic PRNG so the grain is identical on every render.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function freshPanels(layout, photoCount, onePhotoAll = false) {
  return LAYOUTS[layout].map((p, i) => ({
    ...p,
    photo: photoCount > 0 ? (onePhotoAll ? 0 : i % photoCount) : null,
    zoom: 1.15,
    ox: 0,
    oy: 0,
  }));
}

function drawPhotoPanel(ctx, panel, img, grade, glow01, px, py, pw, ph) {
  const { saturate, contrast, brightness } = grade.filter;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  ctx.filter = `saturate(${saturate}) contrast(${contrast}) brightness(${brightness})`;
  const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * panel.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = px + (pw - dw) / 2 + panel.ox * Math.max(0, (dw - pw) / 2);
  const dy = py + (ph - dh) / 2 + panel.oy * Math.max(0, (dh - ph) / 2);
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  // Soft-light vertical grade wash.
  const wash = ctx.createLinearGradient(0, py, 0, py + ph);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(0.5, grade.mid);
  wash.addColorStop(1, grade.bottom);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.35 + 0.55 * glow01;
  ctx.fillStyle = wash;
  ctx.fillRect(px, py, pw, ph);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  // Dark foot so the caption stays legible over bright photos.
  const foot = ctx.createLinearGradient(0, py + ph * 0.55, 0, py + ph);
  foot.addColorStop(0, 'rgba(10, 2, 20, 0)');
  foot.addColorStop(1, 'rgba(10, 2, 20, 0.55)');
  ctx.fillStyle = foot;
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();
}

function drawEmptyPanel(ctx, label, px, py, pw, ph) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  const g = ctx.createLinearGradient(px, py, px + pw, py + ph);
  g.addColorStop(0, '#2b0a4d');
  g.addColorStop(0.55, '#4d1a6e');
  g.addColorStop(1, '#7b2fff');
  ctx.fillStyle = g;
  ctx.fillRect(px, py, pw, ph);
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = '#c9b8e8';
  ctx.lineWidth = Math.max(1, pw * 0.004);
  ctx.beginPath();
  ctx.moveTo(px, py + ph);
  ctx.lineTo(px + pw, py);
  ctx.stroke();
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#f5efff';
  ctx.font = `400 ${Math.max(14, pw * 0.07)}px 'Bebas Neue', 'Arial Narrow', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.toUpperCase(), px + pw / 2, py + ph / 2);
  ctx.restore();
}

// Retro sun: radial disc with horizontal slits across the lower half,
// widening downward. Drawn offscreen so the slits punch through the disc
// only, never the photo underneath.
function drawRetroSun(ctx, hero, grade) {
  const r = 0.16 * Math.min(hero.w, hero.h);
  const cx = hero.x + 0.8 * hero.w;
  const cy = hero.y + 0.2 * hero.h;
  const off = document.createElement('canvas');
  off.width = Math.ceil(r * 2 + 4);
  off.height = Math.ceil(r * 2 + 4);
  const o = off.getContext('2d');
  const g = o.createRadialGradient(r, r, r * 0.05, r, r, r);
  g.addColorStop(0, '#ffe9a8');
  g.addColorStop(0.45, grade.glow);
  g.addColorStop(1, '#ff2e88');
  o.fillStyle = g;
  o.beginPath();
  o.arc(r, r, r, 0, Math.PI * 2);
  o.fill();
  o.globalCompositeOperation = 'destination-out';
  let y = r + r * 0.08;
  let band = r * 0.045;
  while (y < r * 2) {
    o.fillRect(0, y, off.width, band);
    y += band + r * 0.11;
    band *= 1.55;
  }
  ctx.drawImage(off, cx - r - 2, cy - r - 2);
}

function drawPalm(ctx, x, baseY, height, lean, color) {
  const topX = x + lean;
  const topY = baseY - height;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  // Leaning trunk as a quadratic curve.
  ctx.lineWidth = Math.max(2, height * 0.05);
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + lean * 0.4, baseY - height * 0.55, topX, topY);
  ctx.stroke();
  // Seven drooping fronds fanning out from the crown.
  ctx.lineWidth = Math.max(2, height * 0.045);
  for (let i = 0; i < 7; i++) {
    const a = (-0.15 + i * 0.19) * Math.PI; // spread across the top
    const len = height * (0.36 + 0.08 * Math.sin(i * 2.3));
    const ex = topX + Math.cos(a - Math.PI / 2) * len;
    const ey = topY + Math.abs(Math.sin(a - Math.PI / 2)) * len * 0.55 + len * 0.28;
    const mx = topX + (ex - topX) * 0.45;
    const my = topY - len * 0.22;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHalftone(ctx, w, h) {
  const step = Math.max(14, w * 0.012);
  ctx.save();
  for (let gx = w * 0.72; gx <= w; gx += step) {
    for (let gy = 0; gy <= h * 0.28; gy += step) {
      const d = Math.hypot(w - gx, gy) / (w * 0.3);
      const r = Math.max(0, (1 - d) * step * 0.22);
      if (r <= 0.3) continue;
      ctx.globalAlpha = Math.max(0, 0.5 * (1 - d));
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawGrain(ctx, w, h) {
  const rand = mulberry32(20261119);
  const count = Math.floor((w * h) / 1100);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const v = rand();
    ctx.globalAlpha = 0.02 + rand() * 0.05;
    ctx.fillStyle = v > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(rand() * w, rand() * h, 1.4, 1.4);
  }
  ctx.restore();
}

function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  g.addColorStop(0, 'rgba(10, 2, 20, 0)');
  g.addColorStop(1, 'rgba(10, 2, 20, 0.38)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawTitleBand(ctx, state, w, h) {
  const grade = GRADES[state.grade] ?? GRADES.vice;
  const style = TITLE_STYLES[state.titleStyle] ?? TITLE_STYLES.sunset;
  const isWide = state.size === '1920x1080';
  const cy = (isWide ? 0.52 : 0.6) * h;
  const rh = 0.16 * h;
  const title = (state.caption || 'Sunset Heist').toUpperCase();

  ctx.save();
  ctx.translate(w / 2, cy);
  ctx.rotate(-0.05);
  // Tilted dark ribbon, wider than the canvas so the tilt never shows a gap.
  const ribbon = ctx.createLinearGradient(0, -rh / 2, 0, rh / 2);
  ribbon.addColorStop(0, 'rgba(43, 10, 77, 0.94)');
  ribbon.addColorStop(1, 'rgba(16, 4, 31, 0.94)');
  ctx.fillStyle = ribbon;
  ctx.fillRect(-w / 2 - 60, -rh / 2, w + 120, rh);
  // Thin glow edges.
  ctx.strokeStyle = grade.glow;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = Math.max(2, h * 0.003);
  ctx.shadowColor = grade.glow;
  ctx.shadowBlur = h * 0.012;
  ctx.beginPath();
  ctx.moveTo(-w / 2 - 60, -rh / 2);
  ctx.lineTo(w / 2 + 60, -rh / 2);
  ctx.moveTo(-w / 2 - 60, rh / 2);
  ctx.lineTo(w / 2 + 60, rh / 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  // Caption in Bebas Neue, fitted to the ribbon width and height.
  let fontSize = rh * 0.92 * (state.titleScale || 1);
  ctx.font = `400 ${fontSize}px 'Bebas Neue', 'Arial Narrow', sans-serif`;
  const tw = ctx.measureText(title).width;
  const maxW = w * 0.94;
  if (tw > maxW) {
    fontSize *= maxW / tw;
    ctx.font = `400 ${fontSize}px 'Bebas Neue', 'Arial Narrow', sans-serif`;
  }
  const fill = ctx.createLinearGradient(0, -fontSize * 0.5, 0, fontSize * 0.55);
  style.fill.forEach((c, i) => fill.addColorStop(i / (style.fill.length - 1), c));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = fontSize * 0.09;
  ctx.strokeStyle = style.stroke;
  ctx.shadowColor = style.shadow;
  ctx.shadowBlur = fontSize * 0.28;
  ctx.strokeText(title, 0, fontSize * 0.04);
  ctx.fillStyle = fill;
  ctx.fillText(title, 0, fontSize * 0.04);
  ctx.restore();

  // Subtitle: LEVEL (no rotation), clearly gapped below the ribbon so the
  // tilted edge never touches it.
  const subFont = Math.max(13, fontSize * 0.22);
  const subY = cy + rh / 2 + 2.2 * subFont;
  const subtitle = (state.subtitle || '').toUpperCase();
  if (subtitle) {
    ctx.save();
    ctx.font = `400 ${subFont}px 'Bebas Neue', 'Arial Narrow', sans-serif`;
    try { ctx.letterSpacing = `${Math.max(2, subFont * 0.22)}px`; } catch { /* older canvas */ }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = subFont * 0.4;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(subtitle, w / 2, subY);
    ctx.restore();
  }
}

export function drawCover(ctx, state, w, h) {
  const grade = GRADES[state.grade] ?? GRADES.vice;
  const glow01 = (state.glow ?? 65) / 100;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#150826';
  ctx.fillRect(0, 0, w, h);

  const panels = state.panels;
  const gap = Math.max(2, w * 0.002);
  panels.forEach((panel) => {
    const px = panel.x * w + gap;
    const py = panel.y * h + gap;
    const pw = panel.w * w - gap * 2;
    const ph = panel.h * h - gap * 2;
    const img = panel.photo != null ? state.photos[panel.photo] : null;
    if (img) drawPhotoPanel(ctx, panel, img, grade, glow01, px, py, pw, ph);
    else drawEmptyPanel(ctx, panel.label, px, py, pw, ph);
  });

  const hero = panels[0];
  const heroRect = { x: hero.x * w, y: hero.y * h, w: hero.w * w, h: hero.h * h };
  drawRetroSun(ctx, heroRect, grade);
  // Three palms along the hero's bottom edge — small, high corner sun and
  // low palms keep the photo's subject clear.
  const palmY = heroRect.y + heroRect.h - 2;
  drawPalm(ctx, heroRect.x + 0.1 * heroRect.w, palmY, heroRect.h * 0.3, heroRect.w * 0.05, '#16041f');
  drawPalm(ctx, heroRect.x + 0.3 * heroRect.w, palmY, heroRect.h * 0.2, -heroRect.w * 0.04, '#16041f');
  drawPalm(ctx, heroRect.x + 0.9 * heroRect.w, palmY, heroRect.h * 0.34, heroRect.w * 0.06, '#16041f');

  drawHalftone(ctx, w, h);
  drawGrain(ctx, w, h);
  drawVignette(ctx, w, h);
  drawTitleBand(ctx, state, w, h);
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
