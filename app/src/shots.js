// Vice City Nights — screenshot scene driver.
// Reads the shot parameters out of the URL (?shot=cover&photo=pier&...),
// sets the editor state to match, renders once, then raises
// window.__shotReady so the capture harness knows the frame is done.

import { SIZES, freshPanels } from './cover.js';
import { loadSamplePhotos } from './editor.js';

const SAMPLE_INDEX = { pier: 0, boulevard: 1 };

export async function runShot(shot, query, state, canvas, render) {
  const params = new URLSearchParams(query);

  const size = params.get('size');
  if (size && SIZES[size]) state.size = size;

  const layout = params.get('layout');
  if (layout) state.layout = layout;

  const grade = params.get('grade');
  if (grade) state.grade = grade;

  const titleStyle = params.get('titleStyle');
  if (titleStyle) state.titleStyle = titleStyle;

  const caption = params.get('caption');
  if (caption) state.caption = caption;

  const subtitle = params.get('subtitle');
  if (subtitle) state.subtitle = subtitle;

  // Load the bundled samples, then point the hero panel at the requested photo.
  await loadSamplePhotos(state);
  const wanted = params.get('photo');
  if (wanted && SAMPLE_INDEX[wanted] !== undefined && state.panels[0]) {
    state.panels[0].photo = SAMPLE_INDEX[wanted];
  }
  state.selected = 0;

  if (shot === 'cover') {
    // Cover shots show only the artwork, no editor chrome.
    document.body.classList.add('shot-cover');
  }

  try {
    await document.fonts.ready;
  } catch {
    // Bebas Neue may already be cached or missing; render anyway.
  }
  render();

  // Two frames so the canvas paint is actually on screen before we signal.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
  return state;
}
