// shots.js — screenshot scenes for Vice City Nights. runShot reads the
// shot parameters from the URL, loads the sample photos, renders, and
// signals window.__shotReady so the capture script can take the shot.
import { SIZES, freshPanels } from './cover.js';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

export async function runShot(shot, query, state, canvas, render) {
  const params = new URLSearchParams(query);
  const photoName = params.get('photo') || 'pier';
  const caption = params.get('caption');
  const size = params.get('size');
  const layout = params.get('layout');
  const grade = params.get('grade');
  const titleStyle = params.get('titleStyle');
  const subtitle = params.get('subtitle');

  if (size && SIZES[size]) state.size = size;
  if (layout) state.layout = layout;
  if (grade) state.grade = grade;
  if (titleStyle) state.titleStyle = titleStyle;
  if (caption) state.caption = caption;
  if (subtitle) state.subtitle = subtitle;

  // Load both samples, then swap the hero to the requested photo.
  const [pier, boulevard] = await Promise.all([
    loadImage('./samples/pier.jpg'),
    loadImage('./samples/boulevard.jpg'),
  ]);
  const hero = photoName === 'boulevard' ? boulevard : pier;
  const other = photoName === 'boulevard' ? pier : boulevard;
  state.photos = [hero, other, null, null];
  state.panels = freshPanels(state.layout, 2);
  state.selected = 0;

  if (shot === 'cover') document.body.classList.add('shot-cover');
  await document.fonts.ready;
  render();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
