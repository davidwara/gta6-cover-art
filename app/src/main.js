// main.js — Vice City Nights v2 boot.
// Creates the state, wires the editor, renders; in shot mode runs the shot
// scene instead of the default sample load.

import { createState, initEditor, render, loadSamplePhotos, refreshPanelControls, refreshSlotsUI } from './editor.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const state = createState();

initEditor(state, canvas);

const query = new URLSearchParams(window.location.search);
const shot = query.get('shot');

if (shot) {
  runShot(shot, query, state, canvas, () => render(state, canvas)).catch((err) => {
    console.error('shot failed', err);
    window.__shotReady = true;
  });
} else {
  loadSamplePhotos(state)
    .then(() => {
      refreshSlotsUI(state);
      refreshPanelControls(state);
      render(state, canvas);
    })
    .catch((err) => {
      console.error('sample photos failed', err);
      render(state, canvas);
    });
}
