// shots.js — screenshot scene runner for the make.fun capture.
// Reads the shot params from the URL, loads the sample photos, renders the
// cover, then raises window.__shotReady so the capture script can shoot.

import { render, loadImage, refreshPanelControls, refreshSlotsUI } from './editor.js';
import { SIZES, GRADES, freshPanels } from './cover.js';

function param(query, key, fallback) {
  const v = query.get(key);
  return v === null || v === '' ? fallback : v;
}

export async function runShot(shot, query, state, canvas, rerender) {
  const photo = param(query, 'photo', 'pier');
  const caption = param(query, 'caption', 'Sunset Heist');
  const size = param(query, 'size', '1080x1350');
  const layout = param(query, 'layout', 'poster');
  const grade = param(query, 'grade', 'vice');
  const titleStyle = param(query, 'titleStyle', 'sunset');
  const subtitle = param(query, 'subtitle', 'VICE CITY · EST. 2026');
  const skyline = query.get('skyline') === '1';
  const badges = query.get('badges') !== '0';
  const border = Number(param(query, 'border', '0')) || 0;
  const sun = query.get('sun') !== '0';
  const halftone = query.get('halftone');
  const gradeKey = grade in GRADES ? grade : 'vice';

  state.size = size in SIZES ? size : '1080x1350';
  state.layout = layout;
  state.grade = gradeKey;
  state.titleStyle = titleStyle;
  state.caption = decodeURIComponent(caption);
  state.subtitle = decodeURIComponent(subtitle);
  state.skylineOn = skyline;
  state.badgesOn = badges;
  state.border = border;
  state.sunOn = sun;
  if (halftone !== null) state.halftone = Number(halftone);

  // Load the requested sample as the hero photo, the other sample as slot 2.
  const hero = await loadImage(`./samples/${photo}.jpg`);
  const other = await loadImage(`./samples/${photo === 'pier' ? 'boulevard' : 'pier'}.jpg`);
  state.photos[0] = hero;
  state.photos[1] = other;
  state.heroSlot = 0;

  state.panels = freshPanels(state.layout, 2);
  state.panels[0].photoIndex = 0;
  if (state.onePhotoAll) state.panels.forEach((p) => { p.photoIndex = 0; });

  if (shot === 'cover') document.body.classList.add('shot-cover');

  await document.fonts.ready;
  rerender();
  refreshSlotsUI(state);
  refreshPanelControls(state);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.__shotReady = true;
}
