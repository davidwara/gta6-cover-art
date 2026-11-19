// Vice City Nights — screenshot scenes (app/src/shots.js).
// Driven by the URL: ?shot=cover shows only the cover full-viewport,
// ?shot=editor shows the editor. Both read photo, caption, size, layout,
// grade, titleStyle and subtitle from the query, then signal readiness
// with window.__shotReady so the capture script can screenshot.

import { SIZES, freshPanels } from './cover.js';
import { loadSamplePhotos, loadedCount } from './editor.js';

export async function runShot(shot, query, state, canvas, render) {
  // Apply the query params to the state.
  const photoName = query.get('photo');
  const caption = query.get('caption');
  const size = query.get('size');
  const layout = query.get('layout');
  const grade = query.get('grade');
  const titleStyle = query.get('titleStyle');
  const subtitle = query.get('subtitle');

  if (size && SIZES[size]) {
    state.size = size;
    state.layout = SIZES[size].layout;
    canvas.width = SIZES[size].w;
    canvas.height = SIZES[size].h;
  }
  if (layout && ['poster', 'square', 'wide'].includes(layout)) state.layout = layout;
  if (grade && ['vice', 'neon', 'gold'].includes(grade)) state.grade = grade;
  if (titleStyle && ['sunset', 'vice', 'neon'].includes(titleStyle)) state.titleStyle = titleStyle;
  if (caption) state.caption = caption;
  if (subtitle) state.subtitle = subtitle;

  // Load the samples, then swap the requested photo into slot 0 so it is
  // the hero of the cover shot.
  await loadSamplePhotos(state);
  if (photoName && ['pier', 'boulevard'].includes(photoName)) {
    const idx = state.photos.findIndex((p) => p && p.src.endsWith(`${photoName}.jpg`));
    if (idx > 0) {
      const tmp = state.photos[0];
      state.photos[0] = state.photos[idx];
      state.photos[idx] = tmp;
    }
  }
  state.panels = freshPanels(state.layout, loadedCount(state), state.onePhotoAll);
  state.selected = 0;

  if (shot === 'cover') document.body.classList.add('shot-cover');
  await document.fonts.ready;
  render();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
