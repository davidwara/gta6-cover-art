// Vice City Nights — boot (app/src/main.js).
// Creates the state, wires the editor, renders. With ?shot= in the URL it
// runs the screenshot scene instead; otherwise it loads the sample photos
// and renders the editor.

import { drawCover, SIZES } from './cover.js';
import { createState, initEditor, loadSamplePhotos, refreshSlots, refreshPanelControls } from './editor.js';
import { runShot } from './shots.js';

const state = createState();
const canvas = document.getElementById('cover');

function render() {
  const size = SIZES[state.size] ?? SIZES['1080x1350'];
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, state, size.w, size.h);
}

initEditor(state, render);

const query = new URLSearchParams(window.location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, state, canvas, render)
    .then(() => {
      refreshSlots(state);
      refreshPanelControls(state);
    })
    .catch((err) => {
      console.error(err);
      window.__shotReady = true;
    });
} else {
  loadSamplePhotos(state)
    .then(() => {
      refreshSlots(state);
      refreshPanelControls(state);
      render();
    })
    .catch((err) => {
      console.error(err);
      render();
    });
}
