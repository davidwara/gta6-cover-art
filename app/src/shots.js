// Vice City Nights v2 — screenshot scenes.
// `runShot` configures the state from URL params, loads the sample photo,
// renders once, and signals readiness for the screenshot harness.

import { SIZES, LAYOUTS, GRADES, TITLE_STYLES, freshPanels } from './cover.js';

export async function runShot(shot, query, state, canvas, render) {
  const q = new URLSearchParams(query);
  const photo = q.get('photo') || 'pier';
  const caption = q.get('caption');
  const size = q.get('size');
  const layout = q.get('layout');
  const grade = q.get('grade');
  const titleStyle = q.get('titleStyle');
  const subtitle = q.get('subtitle');

  if (size && SIZES[size]) state.size = size;
  if (layout && LAYOUTS[layout]) state.layout = layout;
  if (grade && GRADES[grade]) state.grade = grade;
  if (titleStyle && TITLE_STYLES[titleStyle]) state.titleStyle = titleStyle;
  if (caption != null) state.caption = caption;
  if (subtitle != null) state.subtitle = subtitle;
  if (q.get('skyline') === '1') state.skylineOn = true;
  if (q.get('skyline') === '0') state.skylineOn = false;
  if (q.get('badges') === '0') state.badgesOn = false;
  if (q.get('sun') === '0') state.sunOn = false;
  if (q.get('border')) state.border = Number(q.get('border'));
  if (q.get('halftone')) state.halftone = Number(q.get('halftone'));
  if (q.get('glow')) state.glow = Number(q.get('glow'));

  const s = SIZES[state.size];
  canvas.width = s.w;
  canvas.height = s.h;

  // Load the requested sample photo into slot 0 (hero).
  const img = new Image();
  await new Promise((resolve) => {
    img.onload = resolve;
    img.onerror = resolve;
    img.src = `./samples/${photo}.jpg`;
  });
  if (img.naturalWidth) {
    state.photos[0] = { img, url: `./samples/${photo}.jpg`, name: `${photo}.jpg` };
    // Fill a second slot with the other sample so multi-panel shots look full.
    const other = photo === 'pier' ? 'boulevard' : 'pier';
    const img2 = new Image();
    await new Promise((resolve) => {
      img2.onload = resolve;
      img2.onerror = resolve;
      img2.src = `./samples/${other}.jpg`;
    });
    if (img2.naturalWidth) {
      state.photos[1] = { img: img2, url: `./samples/${other}.jpg`, name: `${other}.jpg` };
    }
  }
  state.panels = freshPanels(state.layout, state.photos.filter(Boolean).length);

  if (shot === 'cover') document.body.classList.add('shot-cover');

  try { await document.fonts.ready; } catch { /* font already usable */ }
  render();
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.__shotReady = true;
}
