// Vice City Nights — editor state and UI wiring.
// Owns the app state, the photo slots, the control panel, canvas pointer
// interaction (click to select, drag to reposition, wheel to zoom) and PNG export.

import { SIZES, freshPanels, drawCover, renderCoverCanvas } from './cover.js';

export function createState() {
  const state = {
    size: '1080x1350',
    layout: 'poster',
    grade: 'vice',
    glow: 65,
    caption: 'Sunset Heist',
    subtitle: 'VICE CITY · EST. 2026',
    titleStyle: 'sunset',
    titleScale: 1,
    onePhotoAll: false,
    photos: [null, null, null, null],
    panels: [],
    selected: 0,
  };
  state.panels = freshPanels(state.layout, 0);
  return state;
}

export function loadedCount(state) {
  return state.photos.filter(Boolean).length;
}

function firstLoadedIndex(state) {
  return state.photos.findIndex(Boolean);
}

function applyPhotoMode(state) {
  if (state.onePhotoAll) {
    const first = firstLoadedIndex(state);
    for (const panel of state.panels) panel.photo = first >= 0 ? first : null;
  }
}

function rebuildPanels(state) {
  state.panels = freshPanels(state.layout, loadedCount(state));
  applyPhotoMode(state);
  state.selected = Math.min(state.selected, state.panels.length - 1);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

/** Loads the bundled sample photos into slots 0 (pier) and 1 (boulevard). */
export async function loadSamplePhotos(state) {
  const [pier, boulevard] = await Promise.all([
    loadImage('./samples/pier.jpg'),
    loadImage('./samples/boulevard.jpg'),
  ]);
  state.photos[0] = pier;
  state.photos[1] = boulevard;
  rebuildPanels(state);
}

export function render(state, canvas) {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  const ctx = canvas.getContext('2d');
  drawCover(ctx, state, size.w, size.h);
}

const $ = (id) => document.getElementById(id);

export function refreshSlots(state) {
  const wrap = $('photoSlots');
  wrap.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'slot' + (photo ? ' assigned' : '');
    slot.dataset.slot = String(i);
    slot.title = photo ? `Slot ${i + 1} — click to replace` : `Slot ${i + 1} — click to add a photo`;
    slot.innerHTML = photo
      ? `<img src="${photo.src}" alt="Photo ${i + 1}"><span class="badge">${i + 1}</span>`
      : `<span aria-hidden="true">+</span><span class="badge">${i + 1}</span>`;
    slot.addEventListener('click', () => {
      pendingSlot = i;
      const input = $('photoInput');
      input.multiple = false;
      input.click();
    });
    wrap.appendChild(slot);
  });
}

let pendingSlot = null;

export function refreshPanelControls(state) {
  const panel = state.panels[state.selected];
  if (!panel) return;
  $('panelNote').textContent = `Panel ${state.selected + 1} — ${panel.name}`;
  $('zoomSlider').value = String(panel.zoom);
  $('zoomVal').textContent = `${panel.zoom.toFixed(2)}×`;
  $('posXSlider').value = String(panel.ox);
  $('posXVal').textContent = String(panel.ox.toFixed(2));
  $('posYSlider').value = String(panel.oy);
  $('posYVal').textContent = String(panel.oy.toFixed(2));
}

function syncChips(state) {
  document.querySelectorAll('.size-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.size);
  });
  document.querySelectorAll('#layoutChips .chip').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#gradeChips .chip').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('#titleStyleChips .chip').forEach((b) => {
    b.classList.toggle('active', b.dataset.titleStyle === state.titleStyle);
  });
}

/** Push the whole state back into the controls (used after a ?shot= scene). */
export function syncEditorUI(state) {
  syncChips(state);
  $('titleInput').value = state.caption;
  $('subtitleInput').value = state.subtitle;
  $('glowSlider').value = String(state.glow);
  $('glowVal').textContent = String(state.glow);
  $('titleSizeSlider').value = String(state.titleScale);
  $('titleSizeVal').textContent = `${state.titleScale.toFixed(2)}×`;
  $('onePhotoAll').checked = state.onePhotoAll;
}

function setSize(state, sizeKey, canvas) {
  state.size = sizeKey;
  state.layout = SIZES[sizeKey].layout;
  rebuildPanels(state);
  syncChips(state);
  refreshPanelControls(state);
  render(state, canvas);
}

function setLayout(state, layout, canvas) {
  const sizeKey = Object.keys(SIZES).find((k) => SIZES[k].layout === layout);
  if (!sizeKey) return;
  setSize(state, sizeKey, canvas);
}

function setStatus(text) {
  $('status').textContent = text;
}

export function initEditor(state, canvas) {
  const doRender = () => render(state, canvas);

  // ---- size buttons (header) ----
  document.querySelectorAll('.size-btn').forEach((btn) => {
    btn.addEventListener('click', () => setSize(state, btn.dataset.size, canvas));
  });

  // ---- photo slots ----
  $('addPhotosBtn').addEventListener('click', () => {
    pendingSlot = null;
    const input = $('photoInput');
    input.multiple = true;
    input.click();
  });
  $('sampleBtn').addEventListener('click', async () => {
    setStatus('Loading sample photos…');
    try {
      await loadSamplePhotos(state);
      refreshSlots(state);
      refreshPanelControls(state);
      doRender();
      setStatus('Sample photos loaded — pick a layout and export.');
    } catch {
      setStatus('Could not load the sample photos.');
    }
  });
  $('photoInput').addEventListener('change', async (ev) => {
    const files = [...ev.target.files];
    if (!files.length) return;
    setStatus(`Loading ${files.length} photo(s)…`);
    if (pendingSlot != null) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      try {
        state.photos[pendingSlot] = await loadImage(url);
        rebuildPanels(state);
      } catch {
        setStatus('That file could not be read as a photo.');
      }
      pendingSlot = null;
    } else {
      for (const file of files) {
        const slot = state.photos.findIndex((p) => !p);
        if (slot < 0) break;
        const url = URL.createObjectURL(file);
        try {
          state.photos[slot] = await loadImage(url);
        } catch { /* skip unreadable files */ }
      }
      rebuildPanels(state);
    }
    ev.target.value = '';
    refreshSlots(state);
    refreshPanelControls(state);
    doRender();
    setStatus(`${loadedCount(state)} photo(s) loaded.`);
  });
  $('onePhotoAll').addEventListener('change', (ev) => {
    state.onePhotoAll = ev.target.checked;
    applyPhotoMode(state);
    doRender();
  });

  // ---- layout & grade ----
  document.querySelectorAll('#layoutChips .chip').forEach((btn) => {
    btn.addEventListener('click', () => setLayout(state, btn.dataset.layout, canvas));
  });
  document.querySelectorAll('#gradeChips .chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.grade = btn.dataset.grade;
      syncChips(state);
      doRender();
    });
  });
  $('glowSlider').addEventListener('input', (ev) => {
    state.glow = Number(ev.target.value);
    $('glowVal').textContent = String(state.glow);
    doRender();
  });

  // ---- selected panel ----
  const panelSlider = (id, apply) => {
    $(id).addEventListener('input', (ev) => {
      const panel = state.panels[state.selected];
      if (!panel) return;
      apply(panel, Number(ev.target.value));
      refreshPanelControls(state);
      doRender();
    });
  };
  panelSlider('zoomSlider', (p, v) => { p.zoom = v; });
  panelSlider('posXSlider', (p, v) => { p.ox = v; });
  panelSlider('posYSlider', (p, v) => { p.oy = v; });
  $('fitBtn').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = 1;
    panel.ox = 0;
    panel.oy = 0;
    refreshPanelControls(state);
    doRender();
  });
  $('fillBtn').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = 1.6;
    refreshPanelControls(state);
    doRender();
  });

  // ---- caption ----
  $('titleInput').addEventListener('input', (ev) => {
    state.caption = ev.target.value;
    doRender();
  });
  $('subtitleInput').addEventListener('input', (ev) => {
    state.subtitle = ev.target.value;
    doRender();
  });
  document.querySelectorAll('#titleStyleChips .chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.titleStyle = btn.dataset.titleStyle;
      syncChips(state);
      doRender();
    });
  });
  $('titleSizeSlider').addEventListener('input', (ev) => {
    state.titleScale = Number(ev.target.value);
    $('titleSizeVal').textContent = `${state.titleScale.toFixed(2)}×`;
    doRender();
  });

  // ---- canvas: click to select, drag to move, wheel to zoom ----
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  const toCanvasPoint = (ev) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (ev.clientX - rect.left) * (canvas.width / rect.width),
      y: (ev.clientY - rect.top) * (canvas.height / rect.height),
    };
  };
  const hitPanel = (x, y) => {
    const size = SIZES[state.size];
    return state.panels.findIndex((p) =>
      x >= p.x * size.w && x < (p.x + p.w) * size.w &&
      y >= p.y * size.h && y < (p.y + p.h) * size.h);
  };

  canvas.addEventListener('pointerdown', (ev) => {
    const pt = toCanvasPoint(ev);
    const idx = hitPanel(pt.x, pt.y);
    if (idx < 0) return;
    state.selected = idx;
    refreshPanelControls(state);
    dragging = true;
    lastX = pt.x;
    lastY = pt.y;
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!dragging) return;
    const pt = toCanvasPoint(ev);
    const panel = state.panels[state.selected];
    const img = panel && panel.photo != null ? state.photos[panel.photo] : null;
    if (panel && img) {
      const size = SIZES[state.size];
      const pw = panel.w * size.w;
      const ph = panel.h * size.h;
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const scale = Math.max(pw / iw, ph / ih) * panel.zoom;
      const spareX = iw * scale - pw;
      const spareY = ih * scale - ph;
      if (spareX > 0) panel.ox = Math.max(-1, Math.min(1, panel.ox + (2 * (pt.x - lastX)) / spareX));
      if (spareY > 0) panel.oy = Math.max(-1, Math.min(1, panel.oy + (2 * (pt.y - lastY)) / spareY));
      refreshPanelControls(state);
      doRender();
    }
    lastX = pt.x;
    lastY = pt.y;
  });
  const endDrag = () => { dragging = false; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = Math.max(1, Math.min(3, panel.zoom * (ev.deltaY < 0 ? 1.1 : 0.9)));
    refreshPanelControls(state);
    doRender();
  }, { passive: false });

  // ---- export ----
  $('exportBtn').addEventListener('click', async () => {
    setStatus('Rendering PNG…');
    try {
      await document.fonts.ready;
      const out = renderCoverCanvas(state);
      const blob = await new Promise((resolve) => out.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('canvas did not produce a PNG');
      const name = `vice-city-nights-${state.size}.png`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setStatus(`Exported ${name} — check your downloads.`);
    } catch {
      setStatus('Export failed — try again.');
    }
  });

  syncChips(state);
  refreshSlots(state);
  refreshPanelControls(state);
}
