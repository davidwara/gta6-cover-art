// Fixed scenes for screenshots: ?shot=editor shows the page with a sample
// photo; ?shot=cover shows the cover alone, full-bleed. `photo` picks the
// sample (samples/<photo>.jpg), `caption` the words, `size` the export size
// (1080x1080, 1080x1350 or 1920x1080), `layout` and `grade` the look.
// window.__shotReady is set once the cover has been painted.
import { SIZES, freshPanels } from './cover.js';
import { loadSamplePhotos, renderPreview } from './editor.js';

export async function runShot(shot, query, state, canvas, render) {
  const photo = query.get('photo') ?? 'pier';
  const caption = query.get('caption') ?? 'Sunset Heist';
  const size = query.get('size') ?? '1080x1350';
  const layout = query.get('layout') ?? SIZES[size]?.layout ?? 'poster';
  const grade = query.get('grade') ?? 'vice';

  state.caption = caption;
  state.subtitle = query.get('subtitle') ?? 'VICE CITY · EST. 2026';
  state.size = size;
  state.layout = layout;
  state.grade = grade;
  if (query.get('titleStyle')) state.titleStyle = query.get('titleStyle');

  const dims = SIZES[size] ?? SIZES['1080x1350'];
  canvas.width = dims.w;
  canvas.height = dims.h;

  await new Promise((resolve) => {
    loadSamplePhotos(state, () => resolve());
  });
  // The shot's photo goes in the hero panel; the second sample fills the rest.
  if (photo === 'boulevard' && state.photos[0]) {
    const tmp = state.photos[0];
    state.photos[0] = state.photos[1];
    state.photos[1] = tmp;
  }
  state.panels = freshPanels(layout, state.photos.filter(Boolean).length);
  document.querySelectorAll('.size-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === size);
  });

  if (shot === 'cover') document.body.classList.add('shot-cover');
  await document.fonts.ready;
  render();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
