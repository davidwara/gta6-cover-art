// Vice City Nights — screenshot scenes (?shot=...).
// Reads the shot parameters from the URL, loads the sample photos, swaps the
// hero panel to the requested photo, renders, and signals readiness so the
// screenshot tool can capture the frame.

import { SIZES } from './cover.js';
import { loadSamplePhotos } from './editor.js';

/**
 * @param {string} shot - the ?shot= value ('cover' or 'editor')
 * @param {string} query - location.search
 * @param {object} state - editor state to fill in
 * @param {HTMLCanvasElement} canvas - the cover canvas
 * @param {(state: object, canvas: HTMLCanvasElement) => void} render
 */
export async function runShot(shot, query, state, canvas, render) {
  const params = new URLSearchParams(query);

  const size = params.get('size');
  if (size && SIZES[size]) {
    state.size = size;
    state.layout = SIZES[size].layout;
  }
  const layout = params.get('layout');
  if (layout && ['poster', 'square', 'wide'].includes(layout)) {
    state.layout = layout;
  }
  const grade = params.get('grade');
  if (grade && ['vice', 'neon', 'gold'].includes(grade)) state.grade = grade;
  const titleStyle = params.get('titleStyle');
  if (titleStyle && ['sunset', 'vice', 'neon'].includes(titleStyle)) state.titleStyle = titleStyle;
  const caption = params.get('caption');
  if (caption) state.caption = caption;
  const subtitle = params.get('subtitle');
  if (subtitle) state.subtitle = subtitle;

  if (shot === 'cover') document.body.classList.add('shot-cover');

  await loadSamplePhotos(state);

  // Swap the hero panel to the requested sample photo.
  const photo = params.get('photo');
  if (photo === 'boulevard') state.panels[0].photo = 1;
  else state.panels[0].photo = 0;

  try {
    await document.fonts.ready;
  } catch { /* fall back to whatever fonts are available */ }
  render(state, canvas);

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
