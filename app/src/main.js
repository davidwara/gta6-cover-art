// Vice City Nights — boot.
// Builds the editor state, wires the controls, and paints the first frame.
// With ?shot=… in the URL it runs the screenshot scene instead of the
// normal editor start; without it, it loads the sample photos and renders.

import { SIZES, drawCover } from './cover.js';
import { createState, initEditor, loadSamplePhotos } from './editor.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const state = createState();

function render() {
  const size = SIZES[state.size] ?? SIZES['1080x1350'];
  if (canvas.width !== size.w) canvas.width = size.w;
  if (canvas.height !== size.h) canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, state, size.w, size.h);
}

const editor = initEditor(state, canvas, render);

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

if (shot) {
  runShot(shot, window.location.search, state, canvas, render)
    .then(() => {
      // The shot changed state behind the editor's back; sync the controls.
      editor.refreshSlots();
      editor.refreshPanelControls();
      editor.refreshSizeButtons();
      editor.refreshLayoutChips();
    })
    .catch((err) => {
      console.error('shot failed', err);
      window.__shotReady = true;
    });
} else {
  loadSamplePhotos(state)
    .then(() => {
      editor.refreshSlots();
      render();
    })
    .catch((err) => console.warn('samples failed', err));
  render();
}
