// main.js — boot for Vice City Nights. Creates the state, wires the
// editor, renders; a ?shot= URL runs the screenshot scene instead of the
// normal sample load.
import { createState, initEditor, loadSamplePhotos } from './editor.js';
import { runShot } from './shots.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const state = createState();
const canvas = document.getElementById('cover');
const editor = initEditor(state, canvas, () => {});

if (shot) {
  runShot(shot, location.search, state, canvas, () => editor.draw()).then(() => {
    editor.refreshSlots();
    editor.refreshPanel();
  });
} else {
  loadSamplePhotos(state)
    .then(() => {
      editor.refreshSlots();
      editor.refreshPanel();
      editor.draw();
    })
    .catch(() => editor.draw());
}
