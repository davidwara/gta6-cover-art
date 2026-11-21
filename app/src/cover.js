// cover.js — the Vice City Nights v2 renderer.
// Draws the multi-panel GTA-style cover onto a canvas from a plain state
// object. No DOM, no network: pure canvas 2D. Exported for the editor,
// the shot runner and the PNG exporter.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: '1080×1080 Square', natural: 'square' },
  '1080x1350': { w: 1080, h: 1350, label: '1080×1350 Poster', natural: 'poster' },
  '1920x1080': { w: 1920, h: 1080, label: '1920×1080 Wide', natural: 'wide' },
  '1080x1920': { w: 1080, h: 1920, label: '1080×1920 Story', natural: 'story' },
};

// Layouts: normalised 0..1 rects [x, y, w, h]. The first panel is the hero.
export const LAYOUTS = {
  poster: [
    { name: 'hero', rect: [0, 0, 1, 0.5] },
    { name: 'Street', rect: [0, 0.5, 0.5, 0.25] },
    { name: 'Night drive', rect: [0.5, 0.5, 0.5, 0.25] },
    { name: 'Beach', rect: [0, 0.75, 0.5, 0.25] },
    { name: 'Skyline', rect: [0.5, 0.75, 0.5, 0.25] },
  ],
  six: [
    { name: 'hero', rect: [0, 0, 0.66, 0.5] },
    { name: 'Neon', rect: [0.66, 0, 0.34, 0.25] },
    { name: 'Street', rect: [0.66, 0.25, 0.34, 0.25] },
    { name: 'Beach', rect: [0, 0.5, 0.33, 0.25] },
    { name: 'Night drive', rect: [0.33, 0.5, 0.33, 0.25] },
    { name: 'Skyline', rect: [0.66, 0.5, 0.34, 0.25] },
    { name: 'Palm row', rect: [0, 0.75, 1, 0.25] },
  ],
  square: [
    { name: 'hero', rect: [0, 0, 0.6, 0.62] },
    { name: 'Neon', rect: [0.6, 0, 0.4, 0.31] },
    { name: 'Street', rect: [0.6, 0.31, 0.4, 0.31] },
    { name: 'Beach', rect: [0, 0.62, 1, 0.38] },
  ],
  wide: [
    { name: 'hero', rect: [0, 0, 0.56, 1] },
    { name: 'Night drive', rect: [0.56, 0, 0.44, 0.48] },
    { name: 'Street', rect: [0.56, 0.48, 0.22, 0.52] },
    { name: 'Skyline', rect: [0.78, 0.48, 0.22, 0.52] },
  ],
  strip: [
    { name: 'hero', rect: [0, 0, 1, 0.62] },
    { name: 'Beach', rect: [0, 0.62, 0.25, 0.38] },
    { name: 'Street', rect: [0.25, 0.62, 0.25, 0.38] },
    { name: 'Night drive', rect: [0.5, 0.62, 0.25, 0.38] },
    { name: 'Skyline', rect: [0.75, 0.62, 0.25, 0.38] },
  ],
  story: [
    { name: 'hero', rect: [0, 0, 1, 0.4] },
    { name: 'Neon', rect: [0, 0.4, 0.5, 0.2] },
    { name: 'Street', rect: [0.5, 0.4, 0.5, 0.2] },
    { name: 'Beach', rect: [0, 0.6, 1, 0.2] },
    { name: 'Skyline', rect: [0, 0.8, 1, 0.2] },
  ],
};

export const GRADES = {
  vice: { name: 'Vice Sunset', filter: 'saturate(1.35) contrast(1.12) brightness(1.04)', top: '#ff2e88', mid: '#ff7a18', bottom: '#2b0a4d', glow: '#ff7a18' },
  neon: { name: 'Neon Night', filter: 'saturate(1.5) contrast(1.18) brightness(0.96)', top: '#2de2ff', mid: '#7b2fff', bottom: '#0b1030', glow: '#2de2ff' },
  gold: { name: 'Palm Gold', filter: 'saturate(1.25) contrast(1.08) brightness(1.08)', top: '#ffc93c', mid: '#ff9a3c', bottom: '#4d1a08', glow: '#ffc93c' },
  ocean: { name: 'Ocean Drive', filter: 'saturate(1.4) contrast(1.1) brightness(1.02)', top: '#00e5c7', mid: '#0077ff', bottom: '#062a4d', glow: '#00e5c7' },
  midnight: { name: 'Midnight Vice', filter: 'saturate(1.3) contrast(1.2) brightness(0.92)', top: '#b388ff', mid: '#5b2ee5', bottom: '#0a0618', glow: '#b388ff' },
  bubble: { name: 'Bubblegum', filter: 'saturate(1.55) contrast(1.05) brightness(1.06)', top: '#ff7ad9', mid: '#ff2e88', bottom: '#3d0a3d', glow: '#ff7ad9' },
};

export const TITLE_STYLES = {
  sunset: { fill: ['#ffffff', '#ffd9a0'], stroke: '#16041f', shadow: '#ff2e88' },
  vice: { fill: ['#ff2e88', '#ff7a18', '#ffc93c'], stroke: '#16041f', shadow: '#7b2fff' },
  neon: { fill: ['#eafcff', '#2de2ff'], stroke: '#0b1030', shadow: '#2de2ff' },
  chrome: { fill: ['#ffffff', '#c9d4e6', '#7d8aa5', '#ffffff'], stroke: '#0b1030', shadow: '#2de2ff' },
  outline: { fill: null, stroke: '#ffffff', shadow: '#ff2e88' },
  bubble: { fill: ['#fff0fa', '#ff7ad9', '#ff2e88'], stroke: '#3d0a3d', shadow: '#ff7ad9' },
};

export const PANEL_FILTERS = {
  none: '',
  bw: 'grayscale(1) contrast(1.1)',
  sepia: 'sepia(0.7) saturate(1.2)',
  cool: 'saturate(1.2) hue-rotate(190deg)',
};

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function hexA(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// --- photo panels ---------------------------------------------------------

function drawPanelPhoto(ctx, img, rect, panel, grade) {
  const [rx, ry, rw, rh] = rect;
  const zoom = clamp(panel.zoom ?? 1, 1, 3);
  const ox = clamp(panel.ox ?? 0, -1, 1);
  const oy = clamp(panel.oy ?? 0, -1, 1);
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rw / iw, rh / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  // Spare room beyond the cover-fit box; offsets slide the photo inside it.
  const spareX = Math.max(0, dw - rw) / 2;
  const spareY = Math.max(0, dh - rh) / 2;
  const dx = rx + (rw - dw) / 2 + ox * spareX;
  const dy = ry + (rh - dh) / 2 + oy * spareY;
  const panelFilter = PANEL_FILTERS[panel.filter] || '';
  ctx.filter = [grade.filter, panelFilter].filter(Boolean).join(' ');
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
}

function drawPanelPlaceholder(ctx, rect, name, grade) {
  const [rx, ry, rw, rh] = rect;
  const g = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  g.addColorStop(0, grade.top);
  g.addColorStop(0.55, grade.mid);
  g.addColorStop(1, grade.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `${Math.max(14, rh * 0.16)}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.toUpperCase(), rx + rw / 2, ry + rh / 2);
}

function drawPanelWash(ctx, rect, grade, glow) {
  const [rx, ry, rw, rh] = rect;
  const a = 0.35 + 0.55 * (glow / 100);
  const g = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  g.addColorStop(0, hexA(grade.top, a * 0.55));
  g.addColorStop(0.55, hexA(grade.mid, a * 0.35));
  g.addColorStop(1, hexA(grade.bottom, a * 0.7));
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = g;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.globalCompositeOperation = 'source-over';
  // Dark foot so captions stay legible over bright photos.
  const foot = ctx.createLinearGradient(rx, ry + rh * 0.55, rx, ry + rh);
  foot.addColorStop(0, 'rgba(10,2,20,0)');
  foot.addColorStop(1, 'rgba(10,2,20,0.55)');
  ctx.fillStyle = foot;
  ctx.fillRect(rx, ry + rh * 0.55, rw, rh * 0.45);
}

// --- decorations ----------------------------------------------------------

export function drawRetroSun(ctx, heroRect, grade, sunScale, sunOn) {
  if (!sunOn) return;
  const [hx, hy, hw, hh] = heroRect;
  const r = 0.14 * Math.min(hw, hh) * (sunScale || 1);
  const cx = hx + hw * 0.85;
  const cy = hy + hh * 0.14;
  const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
  g.addColorStop(0, '#fff3c4');
  g.addColorStop(0.45, grade.glow);
  g.addColorStop(1, '#ff2e88');
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // Horizontal slits across the lower half, widening downward.
  ctx.fillStyle = 'rgba(20,4,32,0.55)';
  const slits = 5;
  for (let i = 0; i < slits; i++) {
    const sy = cy + (r * 0.08) + (i * r * 0.18);
    const halfW = r * Math.sqrt(Math.max(0, 1 - ((sy - cy) / r) ** 2));
    const thick = r * (0.03 + i * 0.022);
    ctx.fillRect(cx - halfW, sy, halfW * 2, thick);
  }
  ctx.restore();
}

export function drawPalm(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = '#17082b';
  ctx.fillStyle = '#17082b';
  ctx.lineCap = 'round';
  // Leaning trunk.
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(lean * 14, -46, lean * 26, -88);
  ctx.stroke();
  // Seven drooping fronds from the crown.
  const cx = lean * 26;
  const cy = -88;
  for (let i = 0; i < 7; i++) {
    const ang = Math.PI * (0.08 + (i / 6) * 0.84);
    const len = 46 - Math.abs(i - 3) * 5;
    const ex = cx + Math.cos(ang) * len;
    const ey = cy + Math.sin(ang) * len * 0.55 + 16;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cx + Math.cos(ang) * len * 0.55, cy + Math.sin(ang) * len * 0.28 - 6, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawSkyline(ctx, w, h, grade, skylineOn) {
  if (!skylineOn) return;
  const rnd = mulberry32(7);
  const baseY = h;
  const top = h * 0.82;
  let x = 0;
  ctx.fillStyle = '#0d0518';
  while (x < w) {
    const bw = w * (0.05 + rnd() * 0.09);
    const bh = h * (0.06 + rnd() * 0.12);
    ctx.fillRect(x, baseY - bh, bw, bh);
    // Lit windows.
    ctx.fillStyle = hexA(grade.glow, 0.85);
    const cols = Math.max(1, Math.floor(bw / (w * 0.018)));
    const rows = Math.max(1, Math.floor(bh / (h * 0.03)));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rnd() < 0.42) {
          ctx.fillRect(x + bw * 0.14 + c * (bw * 0.72 / cols), baseY - bh + bh * 0.12 + r * (bh * 0.76 / rows), w * 0.008, h * 0.012);
        }
      }
    }
    ctx.fillStyle = '#0d0518';
    x += bw + w * 0.004;
  }
  // Roof-line glow.
  ctx.fillStyle = hexA(grade.glow, 0.35);
  ctx.fillRect(0, top, w, 2);
}

export function drawCar(ctx, heroRect, grade) {
  const [hx, hy, hw, hh] = heroRect;
  const y = hy + hh * 0.94;
  const cw = hw * 0.62;
  const x0 = hx + hw * 0.19;
  const ch = hh * 0.075;
  ctx.save();
  // Neon underglow.
  ctx.fillStyle = hexA(grade.glow, 0.5);
  ctx.beginPath();
  ctx.ellipse(x0 + cw / 2, y + ch * 0.28, cw * 0.52, ch * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: long hood + cabin.
  ctx.fillStyle = '#12061f';
  ctx.beginPath();
  ctx.roundRect(x0, y - ch * 0.55, cw, ch * 0.62, ch * 0.22);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x0 + cw * 0.3, y - ch * 1.05, cw * 0.42, ch * 0.6, ch * 0.18);
  ctx.fill();
  // Windows.
  ctx.fillStyle = hexA(grade.glow, 0.75);
  ctx.beginPath();
  ctx.roundRect(x0 + cw * 0.34, y - ch * 0.95, cw * 0.16, ch * 0.38, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x0 + cw * 0.53, y - ch * 0.95, cw * 0.15, ch * 0.38, 3);
  ctx.fill();
  // Wheels with light rims.
  for (const wx of [x0 + cw * 0.18, x0 + cw * 0.8]) {
    ctx.fillStyle = '#0a0313';
    ctx.beginPath();
    ctx.arc(wx, y + ch * 0.05, ch * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexA(grade.glow, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(wx, y + ch * 0.05, ch * 0.18, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawBirds(ctx, w, h, seed) {
  const rnd = mulberry32(seed ?? 11);
  ctx.save();
  ctx.strokeStyle = 'rgba(20,5,35,0.8)';
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const bx = w * (0.08 + rnd() * 0.55);
    const by = h * (0.03 + rnd() * 0.16);
    const s = w * (0.008 + rnd() * 0.008);
    ctx.beginPath();
    ctx.moveTo(bx - s, by);
    ctx.quadraticCurveTo(bx - s * 0.4, by - s * 0.7, bx, by);
    ctx.quadraticCurveTo(bx + s * 0.4, by - s * 0.7, bx + s, by);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawStars(ctx, w, h, grade, seed) {
  const rnd = mulberry32(seed ?? 23);
  ctx.save();
  for (let i = 0; i < 40; i++) {
    const sx = rnd() * w;
    const sy = rnd() * h * 0.33;
    const s = 1.5 + rnd() * 3.5;
    const a = 0.35 + rnd() * 0.6;
    ctx.fillStyle = hexA(grade.glow, a);
    ctx.beginPath();
    ctx.moveTo(sx, sy - s);
    ctx.quadraticCurveTo(sx, sy, sx + s, sy);
    ctx.quadraticCurveTo(sx, sy, sx, sy + s);
    ctx.quadraticCurveTo(sx, sy, sx - s, sy);
    ctx.quadraticCurveTo(sx, sy, sx, sy - s);
    ctx.fill();
  }
  ctx.restore();
}

function drawHalftone(ctx, w, h, halftone) {
  if (!halftone) return;
  const rnd = mulberry32(31);
  const maxR = w * 0.42;
  const count = Math.round((halftone / 100) * 320);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const ang = rnd() * Math.PI * 2;
    const d = Math.pow(rnd(), 0.6) * maxR;
    const dx = w - Math.cos(ang) * d * 0.7;
    const dy = Math.sin(ang) * d * 0.7;
    const fade = 1 - d / maxR;
    const r = (1 + rnd() * 3.5) * (0.4 + fade);
    ctx.fillStyle = `rgba(255,255,255,${(0.10 + fade * 0.35).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(dx, dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGrain(ctx, w, h, grain, seed) {
  if (!grain) return;
  const rnd = mulberry32(seed ?? 97);
  const count = Math.round((grain / 100) * 2600);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const gx = rnd() * w;
    const gy = rnd() * h;
    const v = rnd() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${(0.03 + rnd() * 0.05).toFixed(3)})`;
    ctx.fillRect(gx, gy, 1.4, 1.4);
  }
  ctx.restore();
}

function drawVignette(ctx, w, h, vignette) {
  if (!vignette) return;
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.72);
  g.addColorStop(0, 'rgba(8,2,18,0)');
  g.addColorStop(1, `rgba(8,2,18,${(vignette / 100) * 0.62})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawFrame(ctx, w, h, grade, border) {
  if (!border) return;
  const inset = 14;
  const lw = Math.max(1, border);
  ctx.save();
  ctx.strokeStyle = hexA(grade.glow, 0.95);
  ctx.lineWidth = lw;
  ctx.shadowColor = grade.glow;
  ctx.shadowBlur = lw * 4;
  ctx.beginPath();
  ctx.roundRect(inset, inset, w - inset * 2, h - inset * 2, 26);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(inset + lw + 5, inset + lw + 5, w - (inset + lw + 5) * 2, h - (inset + lw + 5) * 2, 20);
  ctx.stroke();
  ctx.restore();
}

function drawBadges(ctx, w, h, grade, badgesOn, heroRect) {
  if (!badgesOn) return;
  const [hx, hy, hw] = heroRect;
  const s = Math.min(hw, h) * 0.055;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // "VI" mark in a tilted square at the hero's top-left.
  const bx = hx + hw * 0.075;
  const by = hy + h * 0.045;
  ctx.translate(bx, by);
  ctx.rotate(-0.06);
  ctx.fillStyle = 'rgba(16,3,28,0.85)';
  ctx.strokeStyle = grade.glow;
  ctx.lineWidth = Math.max(2, s * 0.06);
  const half = s * 0.62;
  ctx.beginPath();
  ctx.roundRect(-half, -half, half * 2, half * 2, s * 0.14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = `${s}px "Bebas Neue", sans-serif`;
  ctx.fillText('VI', 0, s * 0.04);
  ctx.restore();
  // Starburst "EST. 2026" beside it — never overlapping the sun.
  ctx.save();
  const ex = hx + hw * 0.23;
  const ey = hy + h * 0.07;
  ctx.translate(ex, ey);
  ctx.rotate(0.05);
  const r = s * 0.52;
  ctx.fillStyle = grade.glow;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.68;
    ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(ang) * rr, Math.sin(ang) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#16041f';
  ctx.font = `${s * 0.42}px "Bebas Neue", sans-serif`;
  ctx.fillText('EST. 2026', 0, s * 0.03);
  ctx.restore();
}

// --- title -----------------------------------------------------------------

function drawTitleBand(ctx, w, h, state, grade, style) {
  const caption = (state.caption || '').trim();
  if (!caption) return;
  const layout = state.layout;
  const centreY = layout === 'wide' ? 0.52 * h : layout === 'story' ? 0.62 * h : 0.6 * h;
  const bandH = 0.16 * h;
  ctx.save();
  ctx.translate(w / 2, centreY);
  ctx.rotate(-0.05);
  // Ribbon.
  ctx.fillStyle = 'rgba(14,3,26,0.88)';
  ctx.fillRect(-w * 0.56, -bandH / 2, w * 1.12, bandH);
  ctx.fillStyle = hexA(grade.glow, 0.95);
  ctx.fillRect(-w * 0.56, -bandH / 2, w * 1.12, Math.max(2, bandH * 0.05));
  ctx.fillRect(-w * 0.56, bandH / 2 - Math.max(2, bandH * 0.05), w * 1.12, Math.max(2, bandH * 0.05));
  // Caption, fitted to the ribbon width.
  const maxW = w * 1.02;
  let fontSize = bandH * 0.92 * (state.titleScale || 1);
  ctx.font = `${fontSize}px "Bebas Neue", sans-serif`;
  const text = caption.toUpperCase();
  const tw = ctx.measureText(text).width;
  if (tw > maxW) fontSize *= maxW / tw;
  ctx.font = `${fontSize}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const lw = fontSize * (state.titleStyle === 'outline' ? 0.12 : 0.09);
  ctx.lineWidth = lw;
  ctx.strokeStyle = style.stroke;
  ctx.shadowColor = style.shadow;
  ctx.shadowBlur = fontSize * 0.22;
  ctx.strokeText(text, 0, fontSize * 0.03);
  if (style.fill) {
    const fg = ctx.createLinearGradient(0, -fontSize * 0.5, 0, fontSize * 0.5);
    style.fill.forEach((c, i) => fg.addColorStop(i / Math.max(1, style.fill.length - 1), c));
    ctx.fillStyle = fg;
    ctx.fillText(text, 0, fontSize * 0.03);
  }
  ctx.restore();
  // Subtitle, level, clearly gapped below the ribbon.
  const sub = (state.subtitle || '').trim();
  if (sub) {
    const subSize = Math.max(14, h * 0.016 * (state.titleScale || 1));
    ctx.save();
    ctx.font = `${subSize}px "Bebas Neue", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 6;
    const subY = centreY + bandH / 2 + subSize * 2.2;
    ctx.fillText(sub.toUpperCase(), w / 2, subY);
    ctx.restore();
  }
}

// --- main entry ------------------------------------------------------------

export function drawCover(ctx, state, w, h) {
  const grade = GRADES[state.grade] || GRADES.vice;
  const style = TITLE_STYLES[state.titleStyle] || TITLE_STYLES.sunset;
  const layout = LAYOUTS[state.layout] || LAYOUTS.poster;
  const glow = state.glow ?? 65;

  // Base wash so gaps between panels are never bare.
  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, grade.top);
  base.addColorStop(0.55, grade.mid);
  base.addColorStop(1, grade.bottom);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  const gap = Math.max(2, w * 0.004);
  const heroRect = layout[0].rect.map((v, i) => (i % 2 === 0 ? v * w : v * h));

  layout.forEach((panelDef, i) => {
    const [nx, ny, nw, nh] = panelDef.rect;
    const px = nx * w + (nx > 0 ? gap / 2 : 0);
    const py = ny * h + (ny > 0 ? gap / 2 : 0);
    const pw = nw * w - (nx > 0 ? gap / 2 : 0) - (nx + nw < 1 ? gap / 2 : 0);
    const ph = nh * h - (ny > 0 ? gap / 2 : 0) - (ny + nh < 1 ? gap / 2 : 0);
    const rect = [px, py, pw, ph];
    const panel = (state.panels && state.panels[i]) || {};
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    // Panel holds either a resolved Image or an index into state.photos.
    const img = panel.photo
      || (panel.photoIndex >= 0 && state.photos ? state.photos[panel.photoIndex] : null);
    if (img && (img.naturalWidth || img.width)) {
      drawPanelPhoto(ctx, img, rect, panel, grade);
    } else {
      drawPanelPlaceholder(ctx, rect, panelDef.name, grade);
    }
    drawPanelWash(ctx, rect, grade, glow);
    ctx.restore();
  });

  // Decorations, in draw order: sky first, then hero furniture.
  if (grade && (state.grade === 'neon' || state.grade === 'midnight')) {
    drawStars(ctx, w, h, grade, 23);
  }
  drawBirds(ctx, w, h, 11);
  drawRetroSun(ctx, heroRect, grade, state.sunScale ?? 1, state.sunOn !== false);
  // Palms along the hero's bottom edge.
  const palmS = Math.min(heroRect[2], heroRect[3]) * 0.0016;
  drawPalm(ctx, heroRect[0] + heroRect[2] * 0.1, heroRect[1] + heroRect[3] * 0.99, palmS, 0.4);
  drawPalm(ctx, heroRect[0] + heroRect[2] * 0.3, heroRect[1] + heroRect[3] * 0.99, palmS * 0.8, -0.3);
  drawPalm(ctx, heroRect[0] + heroRect[2] * 0.9, heroRect[1] + heroRect[3] * 0.99, palmS * 0.9, 0.5);
  if (state.layout === 'six') {
    const palmDef = layout.find((p) => p.name === 'Palm row');
    if (palmDef) {
      const pr = palmDef.rect;
      drawPalm(ctx, pr[0] * w + w * 0.06, pr[1] * h + pr[3] * h * 0.95, palmS * 0.7, 0.3);
      drawPalm(ctx, pr[0] * w + w * 0.9, pr[1] * h + pr[3] * h * 0.95, palmS * 0.7, -0.4);
    }
  }
  if (state.layout === 'wide') drawCar(ctx, heroRect, grade);
  drawSkyline(ctx, w, h, grade, !!state.skylineOn);
  drawHalftone(ctx, w, h, state.halftone ?? 55);
  drawTitleBand(ctx, w, h, state, grade, style);
  drawBadges(ctx, w, h, grade, state.badgesOn !== false, heroRect);
  drawGrain(ctx, w, h, state.grain ?? 50, 97);
  drawVignette(ctx, w, h, state.vignette ?? 60);
  drawFrame(ctx, w, h, grade, state.border ?? 0);
}

export function renderCoverCanvas(state) {
  const size = SIZES[state.size] || SIZES['1080x1350'];
  const scale = state.exportScale === 2 ? 2 : 1;
  const canvas = document.createElement('canvas');
  canvas.width = size.w * scale;
  canvas.height = size.h * scale;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, state, canvas.width, canvas.height);
  return canvas;
}

export function freshPanels(layout, photoCount) {
  const defs = LAYOUTS[layout] || LAYOUTS.poster;
  return defs.map((def, i) => {
    const isPalm = def.name === 'Palm row';
    return {
      name: def.name,
      photoIndex: photoCount > 0 ? i % photoCount : -1,
      zoom: isPalm ? 1 : 1.15,
      ox: 0,
      oy: isPalm ? -0.4 : 0.2,
      filter: 'none',
    };
  });
}
