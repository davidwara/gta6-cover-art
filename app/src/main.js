// Vice City Nights — boot.
// Creates the state, wires the editor, and renders. With ?shot= in the URL
// it runs the screenshot scene instead of the plain editor start.

import { createState, initEditor, loadSamplePhotos, render, refreshSlots, refreshPanelControls, syncEditorUI } from './editor.js';
import { runShot } from './shots.js';

const state = createState();
const canvas = document.getElementById('cover');

initEditor(state, canvas);

// Load the display font early so the first render already uses Bebas Neue.
if (document.fonts?.load) {
  document.fonts.load('100px "Bebas Neue"').catch(() => {});
  document.fonts.ready.then(() => render(state, canvas)).catch(() => {});
}

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, location.search, state, canvas, render).then(() => {
    syncEditorUI(state);
    refreshSlots(state);
    refreshPanelControls(state);
  });
} else {
  loadSamplePhotos(state).then(() => {
    refreshSlots(state);
    refreshPanelControls(state);
    render(state, canvas);
    document.getElementById('status').textContent = 'Sample photos loaded — pick a layout and export.';
  }).catch(() => {
    render(state, canvas);
  });
}
