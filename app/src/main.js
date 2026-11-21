// Vice City Nights v2 — boot.
// Creates the state, wires the editor, renders the cover. In shot mode
// (?shot=cover|editor) it runs the screenshot scene instead of the
// interactive editor defaults.

import { SIZES, drawCover } from './cover.js';
import { createState, initEditor, loadSamplePhotos } from './editor.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const state = createState();

function render() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w) canvas.width = size.w;
  if (canvas.height !== size.h) canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCover(ctx, state, canvas.width, canvas.height);
}

const editor = initEditor(state, canvas, render);

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, location.search, state, canvas, render).then(() => {
    editor.refreshSlots();
    editor.refreshPanelNote();
  });
} else {
  loadSamplePhotos(state).then(() => {
    editor.refreshSlots();
    editor.refreshPanelNote();
    return document.fonts ? document.fonts.ready : Promise.resolve();
  }).then(() => render());
}
