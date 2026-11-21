// Vice City Nights v2 — cover renderer. Draws the multi-panel GTA-style
// cover onto a 2D canvas. Pure functions + the drawCover entry point.
// No network, no dependencies. All art is drawn in code: retro sun,
// palms, skyline, low-rider, birds, stars, halftone, grain, title ribbon.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: '1080 × 1080', natural: 'square' },
  '1080x1350': { w: 1080, h: 1350, label: '1080 × 1350', natural: 'poster' },
  '1920x1080': { w: 1920, h: 1080, label: '1920 × 1080', natural: 'wide' },
  '1080x1920': { w: 1080, h: 1920, label: '1080 × 1920', natural: 'story' },
};

// Layouts: normalised rects { name, x, y, w, h }. First panel is the hero.
export const LAYOUTS = {
  poster: [
    { name: 'Hero', x: 0, y: 0, w: 1, h: 0.5 },
    { name: 'Street', x: 0, y: 0.5, w: 0.5, h: 0.25 },
    { name: 'Night drive', x: 0.5, y: 0.5, w: 0.5, h: 0.25 },
    { name: 'Beach', x: 0, y: 0.75, w: 0.5, h: 0.25 },
    { name: 'Skyline', x: 0.5, y: 0.75, w: 0.5, h: 0.25 },
  ],
  six: [
    { name: 'Hero', x: 0, y: 0, w: 0.66, h: 0.5 },
    { name: 'Neon', x: 0.66, y: 0, w: 0.34, h: 0.25 },
    { name: 'Street', x: 0.66, y: 0.25, w: 0.34, h: 0.25 },
    { name: 'Beach', x: 0, y: 0.5, w: 0.33, h: 0.25 },
    { name: 'Night drive', x: 0.33, y: 0.5, w: 0.33, h: 0.25 },
    { name: 'Skyline', x: 0.66, y: 0.5, w: 0.34, h: 0.25 },
    { name: 'Palm row', x: 0, y: 0.75, w: 1, h: 0.25 },
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
  strip: [
    { name: 'Hero', x: 0, y: 0, w: 1, h: 0.62 },
    { name: 'Beach', x: 0, y: 0.62, w: 0.25, h: 0.38 },
    { name: 'Street', x: 0.25, y: 0.62, w: 0.25, h: 0.38 },
    { name: 'Night drive', x: 0.5, y: 0.62, w: 0.25, h: 0.38 },
    { name: 'Skyline', x: 0.75, y: 0.62, w: 0.25, h: 0.38 },
  ],
  story: [
    { name: 'Hero', x: 0, y: 0, w: 1, h: 0.4 },
    { name: 'Neon', x: 0, y: 0.4, w: 0.5, h: 0.2 },
    { name: 'Street', x: 0.5, y: 0.4, w: 0.5, h: 0.2 },
    { name: 'Beach', x: 0, y: 0.6, w: 1, h: 0.2 },
    { name: 'Skyline', x: 0, y: 0.8, w: 1, h: 0.2 },
  ],
};

export const GRADES = {
  vice: {
    name: 'Vice Sunset', filter: 'saturate(1.35) contrast(1.12) brightness(1.04)',
    top: '#ff2e88', mid: '#ff7a18', bottom: '#2b0a4d', glow: '#ff7a18',
  },
  neon: {
    name: 'Neon Night', filter: 'saturate(1.5) contrast(1.18) brightness(0.96)',
    top: '#2de2ff', mid: '#7b2fff', bottom: '#0b1030', glow: '#2de2ff',
  },
  gold: {
    name: 'Palm Gold', filter: 'saturate(1.25) contrast(1.08) brightness(1.08)',
    top: '#ffc93c', mid: '#ff9a3c', bottom: '#4d1a08', glow: '#ffc93c',
  },
  ocean: {
    name: 'Ocean Drive', filter: 'saturate(1.4) contrast(1.1) brightness(1.02)',
    top: '#00e5c7', mid: '#0077ff', bottom: '#062a4d', glow: '#00e5c7',
  },
  midnight: {
    name: 'Midnight Vice', filter: 'saturate(1.3) contrast(1.2) brightness(0.92)',
    top: '#b388ff', mid: '#5b2ee5', bottom: '#0a0618', glow: '#b388ff',
  },
  bubble: {
    name: 'Bubblegum', filter: 'saturate(1.55) contrast(1.05) brightness(1.06)',
    top: '#ff7ad9', mid: '#ff2e88', bottom: '#3d0a3d', glow: '#ff7ad9',
  },
};

export const TITLE_STYLES = {
  sunset: { name: 'Sunset', fill: ['#ffffff', '#ffd9a0'], stroke: '#16041f', shadow: '#ff2e88' },
  vice: { name: 'Vice', fill: ['#ff2e88', '#ff7a18', '#ffc93c'], stroke: '#16041f', shadow: '#7b2fff' },
  neon: { name: 'Neon', fill: ['#eafcff', '#2de2ff'], stroke: '#0b1030', shadow: '#2de2ff' },
  chrome: { name: 'Chrome', fill: ['#ffffff', '#c9d4e6', '#7d8aa5', '#ffffff'], stroke: '#0b1030', shadow: '#2de2ff' },
  outline: { name: 'Outline', fill: [], stroke: '#ffffff', shadow: '#ff2e88' },
  bubble: { name: 'Bubblegum', fill: ['#fff0fa', '#ff7ad9', '#ff2e88'], stroke: '#3d0a3d', shadow: '#ff7ad9' },
};

export const PANEL_FILTERS = {
  none: { name: 'None', filter: '' },
  bw: { name: 'B&W', filter: 'grayscale(1) contrast(1.1)' },
  sepia: { name: 'Sepia', filter: 'sepia(0.7) saturate(1.2)' },
  cool: { name: 'Cool', filter: 'saturate(1.2) hue-rotate(190deg)' },
};

export const CAPTION_PRESETS = [
  { title: 'Sunset Heist', subtitle: 'VICE CITY · EST. 2026', grade: 'vice' },
  { title: 'Boulevard Queen', subtitle: 'OCEAN DRIVE · MIAMI VICE', grade: 'gold' },
  { title: 'Vice City Nights', subtitle: 'LEONIDA · AFTER DARK', grade: 'neon' },
  { title: 'Neon Reign', subtitle: 'DOWNTOWN · 2 AM', grade: 'midnight' },
  { title: 'Ocean Drive', subtitle: 'PALMS · SALT · NEON', grade: 'ocean' },
  { title: 'Midnight Run', subtitle: 'NO BRAKES · NO CURFEW', grade: 'bubble' },
];

export const LOOK_PRESETS = [
  { name: 'Golden Hour', grade: 'gold', layout: 'poster', titleStyle: 'sunset', skylineOn: false, vignette: 60 },
  { name: 'Neon Nights', grade: 'neon', layout: 'wide', titleStyle: 'neon', skylineOn: true, vignette: 70 },
  { name: 'Bubblegum Pop', grade: 'bubble', layout: 'poster', titleStyle: 'bubble', skylineOn: false, vignette: 45 },
  { name: 'Noir Drive', grade: 'midnight', layout: 'strip', titleStyle: 'chrome', skylineOn: true, vignette: 85 },
];

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DARK = '#16041f';

function panelPx(rect, w, h, gap) {
  return {
    x: rect.x * w + gap / 2, y: rect.y * h + gap / 2,
    w: rect.w * w - gap, h: rect.h * h - gap,
  };
}

function drawImageCover(ctx, img, px, py, pw, ph, zoom, ox, oy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(pw / iw, ph / ih) * zoom;
  const dw = iw * scale, dh = ih * scale;
  const spareX = Math.max(0, (dw - pw) / 2);
  const spareY = Math.max(0, (dh - ph) / 2);
  const dx = px + (pw - dw) / 2 + ox * spareX;
  const dy = py + (ph - dh) / 2 + oy * spareY;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawPlaceholder(ctx, px, py, pw, ph, name, grade) {
  const g = ctx.createLinearGradient(px, py, px, py + ph);
  g.addColorStop(0, grade.top); g.addColorStop(0.55, grade.mid); g.addColorStop(1, grade.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(px, py, pw, ph);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `${Math.max(14, ph * 0.16)}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(name.toUpperCase(), px + pw / 2, py + ph / 2);
}

function drawPanelPhoto(ctx, panel, rect, state, grade) {
  const photo = panel.photo != null ? state.photos[panel.photo] : null;
  if (!photo || !photo.img) {
    drawPlaceholder(ctx, rect.x, rect.y, rect.w, rect.h, panel.name || 'Panel', grade);
    return;
  }
  const filt = PANEL_FILTERS[panel.filter || 'none'];
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = grade.filter + (filt.filter ? ' ' + filt.filter : '');
  drawImageCover(ctx, photo.img, rect.x, rect.y, rect.w, rect.h, panel.zoom || 1.15, panel.ox || 0, panel.oy || 0);
  ctx.filter = 'none';
  // Soft-light vertical wash in the grade colours.
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  wash.addColorStop(0, grade.top); wash.addColorStop(0.5, grade.mid); wash.addColorStop(1, grade.bottom);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.35 + 0.55 * (state.glow / 100);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  // Dark foot gradient so captions stay legible.
  const foot = ctx.createLinearGradient(rect.x, rect.y + rect.h * 0.55, rect.x, rect.y + rect.h);
  foot.addColorStop(0, 'rgba(10,4,24,0)');
  foot.addColorStop(1, 'rgba(10,4,24,0.55)');
  ctx.fillStyle = foot;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawRetroSun(ctx, hero, grade, sunScale, sunOn) {
  if (!sunOn) return;
  const r = 0.14 * Math.min(hero.w, hero.h) * sunScale;
  const cx = hero.x + hero.w * 0.85;
  const cy = hero.y + hero.h * 0.14;
  const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
  g.addColorStop(0, '#fff3c4'); g.addColorStop(0.45, grade.glow); g.addColorStop(1, '#ff2e88');
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // Horizontal slits across the lower half, widening downward.
  ctx.fillStyle = 'rgba(22,4,31,0.9)';
  const slits = 5;
  for (let i = 0; i < slits; i++) {
    const t = (i + 1) / (slits + 1);
    const y = cy + t * r * 0.95;
    const half = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
    const h = r * 0.05 + t * r * 0.09;
    ctx.fillRect(cx - half, y - h / 2, half * 2, h);
  }
  ctx.restore();
  ctx.strokeStyle = grade.glow;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawPalm(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = DARK; ctx.fillStyle = DARK;
  ctx.lineWidth = 7; ctx.lineCap = 'round';
  // Leaning trunk.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(lean * 14, -55, lean * 26, -96);
  ctx.stroke();
  const tx = lean * 26, ty = -96;
  // Seven drooping fronds.
  ctx.lineWidth = 5;
  for (let i = 0; i < 7; i++) {
    const a = (-0.15 - i * 0.22) * Math.PI + (lean > 0 ? 0.1 : -0.1);
    const len = 46 - Math.abs(i - 3) * 4;
    const fx = tx + Math.cos(a) * len;
    const fy = ty + Math.sin(a) * len * 0.55 + 16;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a) * len * 0.6, ty + Math.sin(a) * len * 0.4 - 6, fx, fy);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSkyline(ctx, w, h, grade) {
  const rnd = mulberry32(7);
  const base = h;
  const top = h * 0.86;
  let x = 0;
  ctx.fillStyle = '#0a0318';
  while (x < w) {
    const bw = w * (0.05 + rnd() * 0.075);
    const by = top + rnd() * (base - top) * 0.35;
    ctx.fillRect(x, by, bw, base - by);
    // Antenna on some towers.
    if (rnd() > 0.6) ctx.fillRect(x + bw / 2 - 1, by - h * 0.03, 2, h * 0.03);
    // Lit windows.
    ctx.fillStyle = grade.glow;
    const cols = Math.max(1, Math.floor(bw / (w * 0.018)));
    const rows = Math.max(1, Math.floor((base - by) / (h * 0.03)));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rnd() > 0.55) {
          ctx.globalAlpha = 0.5 + rnd() * 0.5;
          ctx.fillRect(x + 4 + c * (w * 0.018), by + 6 + r * (h * 0.03), Math.max(2, w * 0.006), Math.max(2, h * 0.012));
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0a0318';
    x += bw + w * 0.004;
  }
}

function drawCar(ctx, hero, grade) {
  const w = hero.w * 0.52, h = hero.h * 0.16;
  const x = hero.x + hero.w * 0.06;
  const y = hero.y + hero.h - h - hero.h * 0.04;
  ctx.save();
  // Neon underglow.
  ctx.strokeStyle = grade.glow;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = Math.max(2, h * 0.08);
  ctx.beginPath(); ctx.moveTo(x + w * 0.08, y + h * 0.98); ctx.lineTo(x + w * 0.92, y + h * 0.98); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#12041f';
  // Body.
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.62);
  ctx.lineTo(x + w * 0.06, y + h * 0.42);
  ctx.lineTo(x + w * 0.3, y + h * 0.36);
  ctx.lineTo(x + w * 0.42, y + h * 0.08);
  ctx.lineTo(x + w * 0.62, y + h * 0.08);
  ctx.lineTo(x + w * 0.74, y + h * 0.36);
  ctx.lineTo(x + w * 0.97, y + h * 0.42);
  ctx.lineTo(x + w, y + h * 0.6);
  ctx.lineTo(x + w, y + h * 0.88);
  ctx.lineTo(x, y + h * 0.88);
  ctx.closePath(); ctx.fill();
  // Windows.
  ctx.fillStyle = grade.glow;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.44, y + h * 0.14);
  ctx.lineTo(x + w * 0.6, y + h * 0.14);
  ctx.lineTo(x + w * 0.68, y + h * 0.34);
  ctx.lineTo(x + w * 0.46, y + h * 0.34);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  // Wheels.
  for (const wx of [x + w * 0.2, x + w * 0.8]) {
    ctx.fillStyle = '#05010a';
    ctx.beginPath(); ctx.arc(wx, y + h * 0.88, h * 0.17, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e8e8f0'; ctx.lineWidth = Math.max(1, h * 0.04);
    ctx.beginPath(); ctx.arc(wx, y + h * 0.88, h * 0.08, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

function drawBirds(ctx, w, h) {
  const rnd = mulberry32(11);
  ctx.strokeStyle = 'rgba(22,4,31,0.85)';
  ctx.lineWidth = Math.max(1.5, w * 0.002);
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const x = w * (0.12 + rnd() * 0.5);
    const y = h * (0.06 + rnd() * 0.14);
    const s = w * (0.008 + rnd() * 0.008);
    ctx.beginPath();
    ctx.moveTo(x - s, y); ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.7, x, y);
    ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.7, x + s, y);
    ctx.stroke();
  }
}

function drawStars(ctx, w, h) {
  const rnd = mulberry32(23);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 40; i++) {
    const x = rnd() * w;
    const y = rnd() * h * 0.32;
    const s = w * (0.0015 + rnd() * 0.003);
    ctx.globalAlpha = 0.35 + rnd() * 0.65;
    ctx.fillRect(x - s, y - s * 0.25, s * 2, s * 0.5);
    ctx.fillRect(x - s * 0.25, y - s, s * 0.5, s * 2);
  }
  ctx.globalAlpha = 1;
}

function drawHalftone(ctx, w, h, density) {
  if (density <= 0) return;
  const rnd = mulberry32(31);
  const n = Math.round(90 * (density / 100));
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < n; i++) {
    const x = w * (0.55 + rnd() * 0.45);
    const y = h * rnd() * 0.4;
    const d = 1 - ((x - w * 0.55) / (w * 0.45)) * 0.7 - (y / (h * 0.4)) * 0.3;
    if (d <= 0.05) continue;
    const r = Math.max(1, w * 0.004 * d);
    ctx.globalAlpha = 0.55 * d;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawGrain(ctx, w, h, grain) {
  if (grain <= 0) return;
  const rnd = mulberry32(99);
  const n = Math.round(900 * (grain / 100));
  for (let i = 0; i < n; i++) {
    const v = rnd();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(rnd() * w, rnd() * h, 1.6, 1.6);
  }
}

function drawVignette(ctx, w, h, vignette) {
  if (vignette <= 0) return;
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.72);
  g.addColorStop(0, 'rgba(10,2,20,0)');
  g.addColorStop(1, `rgba(10,2,20,${0.55 * (vignette / 100)})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawFrame(ctx, w, h, grade, border) {
  if (!border || border <= 0) return;
  const inset = Math.max(6, w * 0.013);
  ctx.save();
  ctx.strokeStyle = grade.glow;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = border * (w / 1080);
  ctx.beginPath();
  ctx.roundRect(inset, inset, w - inset * 2, h - inset * 2, w * 0.02);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(1, w * 0.0012);
  ctx.beginPath();
  ctx.roundRect(inset + border * (w / 1080) + 4, inset + border * (w / 1080) + 4,
    w - (inset + border * (w / 1080) + 4) * 2, h - (inset + border * (w / 1080) + 4) * 2, w * 0.016);
  ctx.stroke();
  ctx.restore();
}

function drawBadges(ctx, hero, grade) {
  const s = Math.min(hero.w, hero.h);
  const bx = hero.x + hero.w * 0.045;
  const by = hero.y + hero.h * 0.05;
  const bs = s * 0.11;
  // "VI" mark in a tilted square.
  ctx.save();
  ctx.translate(bx + bs / 2, by + bs / 2);
  ctx.rotate(-0.06);
  ctx.fillStyle = 'rgba(22,4,31,0.82)';
  ctx.fillRect(-bs / 2, -bs / 2, bs, bs);
  ctx.strokeStyle = grade.glow; ctx.lineWidth = Math.max(1.5, bs * 0.05);
  ctx.strokeRect(-bs / 2, -bs / 2, bs, bs);
  ctx.fillStyle = '#ffffff';
  ctx.font = `${bs * 0.62}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('VI', 0, bs * 0.04);
  ctx.restore();
  // Starburst "EST. 2026" beside the VI badge (top-left of the hero).
  const cx = hero.x + hero.w * 0.23;
  const cy = hero.y + hero.h * 0.07;
  const r1 = s * 0.06, r2 = s * 0.042;
  ctx.save();
  ctx.fillStyle = grade.glow;
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? r1 : r2;
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = DARK;
  ctx.font = `${s * 0.026}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('EST. 2026', cx, cy + 1);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px "Bebas Neue", sans-serif`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size *= 0.92;
    ctx.font = `${size}px "Bebas Neue", sans-serif`;
  }
  return size;
}

function drawTitleBand(ctx, w, h, state, grade, style) {
  const title = (state.caption || '').trim();
  if (!title) return;
  const isWide = state.size === '1920x1080';
  const isStory = state.size === '1080x1920';
  const cy = h * (isWide ? 0.52 : isStory ? 0.62 : 0.6);
  const bandH = h * 0.16;
  const fontBase = h * 0.105 * (state.titleScale || 1);
  ctx.save();
  ctx.translate(w / 2, cy);
  ctx.rotate(-0.05);
  // Ribbon.
  ctx.fillStyle = 'rgba(16,3,26,0.88)';
  ctx.fillRect(-w * 0.53, -bandH / 2, w * 1.06, bandH);
  ctx.fillStyle = grade.glow;
  ctx.fillRect(-w * 0.53, -bandH / 2, w * 1.06, Math.max(2, h * 0.004));
  ctx.fillRect(-w * 0.53, bandH / 2 - Math.max(2, h * 0.004), w * 1.06, Math.max(2, h * 0.004));
  // Caption.
  const size = fitFont(ctx, title.toUpperCase(), w * 0.94, fontBase);
  ctx.font = `${size}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.shadowColor = style.shadow; ctx.shadowBlur = size * 0.22;
  if (style.fill.length > 0) {
    const fg = ctx.createLinearGradient(0, -size * 0.5, 0, size * 0.5);
    style.fill.forEach((c, i) => fg.addColorStop(i / Math.max(1, style.fill.length - 1), c));
    ctx.fillStyle = fg;
    ctx.lineWidth = size * 0.09;
    ctx.strokeStyle = style.stroke;
    ctx.strokeText(title.toUpperCase(), 0, size * 0.04);
    ctx.fillText(title.toUpperCase(), 0, size * 0.04);
  } else {
    // Outline-only style.
    ctx.lineWidth = size * 0.12;
    ctx.strokeStyle = style.stroke;
    ctx.strokeText(title.toUpperCase(), 0, size * 0.04);
  }
  ctx.restore();
  // Subtitle: LEVEL, clearly gapped below the ribbon.
  const sub = (state.subtitle || '').trim();
  if (!sub) return;
  const subSize = Math.max(12, h * 0.028 * (state.titleScale || 1));
  ctx.save();
  ctx.font = `${subSize}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.shadowColor = style.shadow; ctx.shadowBlur = subSize * 0.4;
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = subSize * 0.12;
  ctx.strokeStyle = DARK;
  const sy = cy + bandH / 2 + fontBase * 0.55;
  ctx.strokeText(sub.toUpperCase(), w / 2, sy);
  ctx.fillText(sub.toUpperCase(), w / 2, sy);
  ctx.restore();
}

export function freshPanels(layoutName, photoCount) {
  const layout = LAYOUTS[layoutName] || LAYOUTS.poster;
  return layout.map((p, i) => {
    // Very wide strips (e.g. the Palm row) get a flat, high framing so the
    // photo reads as a scene instead of a giant close-up.
    const wide = p.name === 'Palm row';
    return {
      name: p.name,
      photo: photoCount > 0 ? i % photoCount : null,
      zoom: wide ? 1 : 1.15, ox: 0, oy: wide ? -0.4 : 0.2, filter: 'none',
    };
  });
}

export function drawCover(ctx, state, w, h) {
  const grade = GRADES[state.grade] || GRADES.vice;
  const style = TITLE_STYLES[state.titleStyle] || TITLE_STYLES.sunset;
  const layout = LAYOUTS[state.layout] || LAYOUTS.poster;
  const gap = Math.max(2, w * 0.005);
  ctx.save();
  ctx.fillStyle = grade.bottom;
  ctx.fillRect(0, 0, w, h);
  const heroRect = panelPx(layout[0], w, h, gap);
  state.panels.forEach((panel, i) => {
    const rect = panelPx(layout[i], w, h, gap);
    drawPanelPhoto(ctx, panel, rect, state, grade);
  });
  // Decorations over the photos.
  drawRetroSun(ctx, heroRect, grade, state.sunScale || 1, state.sunOn !== false);
  // Palms along the hero bottom edge.
  const ps = Math.min(heroRect.w, heroRect.h) / 340;
  drawPalm(ctx, heroRect.x + heroRect.w * 0.1, heroRect.y + heroRect.h * 0.985, ps, -1);
  drawPalm(ctx, heroRect.x + heroRect.w * 0.3, heroRect.y + heroRect.h * 0.985, ps * 0.8, 1);
  drawPalm(ctx, heroRect.x + heroRect.w * 0.9, heroRect.y + heroRect.h * 0.985, ps * 0.9, -1);
  if (state.layout === 'six') {
    drawPalm(ctx, heroRect.x + heroRect.w * 0.45, heroRect.y + heroRect.h * 0.985, ps * 0.6, 1);
    drawPalm(ctx, heroRect.x + heroRect.w * 0.62, heroRect.y + heroRect.h * 0.985, ps * 0.55, -1);
  }
  if (state.skylineOn) drawSkyline(ctx, w, h, grade);
  if (state.layout === 'wide') drawCar(ctx, heroRect, grade);
  drawBirds(ctx, w, h);
  if (state.grade === 'neon' || state.grade === 'midnight') drawStars(ctx, w, h);
  drawHalftone(ctx, w, h, state.halftone ?? 55);
  drawGrain(ctx, w, h, state.grain ?? 50);
  drawVignette(ctx, w, h, state.vignette ?? 60);
  drawFrame(ctx, w, h, grade, state.border || 0);
  if (state.badgesOn !== false) drawBadges(ctx, heroRect, grade);
  drawTitleBand(ctx, w, h, state, grade, style);
  ctx.restore();
}

export function renderCoverCanvas(state) {
  const size = SIZES[state.size] || SIZES['1080x1350'];
  const scale = state.exportScale || 1;
  const canvas = document.createElement('canvas');
  canvas.width = size.w * scale;
  canvas.height = size.h * scale;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, state, canvas.width, canvas.height);
  return canvas;
}
