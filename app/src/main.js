// Vice City Nights — boot. Wires the editor to the page, paints the first
// preview, and runs a ?shot= scene when one is asked for (screenshots).
import { createState, initEditor, loadSamplePhotos, renderPreview } from './editor.js';
import { runShot } from './shots.js';

const state = createState();
const canvas = document.getElementById('cover');
const status = document.getElementById('status');

const render = () => renderPreview(state, canvas);
const editor = initEditor(state, canvas, { status }, render);

const query = new URLSearchParams(window.location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, state, canvas, render).then(() => {
    // The shot loaded the samples; show them in the slots too.
    editor.drawSlots();
    editor.syncPanelControls();
  }).catch((err) => {
    status.textContent = `Shot failed: ${err.message}`;
    window.__shotReady = true;
  });
} else {
  loadSamplePhotos(state, () => {
    editor.drawSlots();
    render();
  });
  render();
}
