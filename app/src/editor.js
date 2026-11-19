// Vice City Nights — state + UI wiring (app/src/editor.js).
// Owns the editor state, the photo slots, every chip/slider/button and the
// canvas pointer interaction. Rendering itself lives in cover.js; main.js
// passes the render callback in.

import { SIZES, freshPanels, renderCoverCanvas } from './cover.js';

export function createState() {
  const photos = [null, null, null, null];
  return {
    size: '1080x1350',
    layout: 'poster',
    grade: 'vice',
    glow: 65,
    caption: 'Sunset Heist',
    subtitle: 'VICE CITY · EST. 2026',
    titleStyle: 'sunset',
    titleScale: 1,
    onePhotoAll: false,
    photos,
    panels: freshPanels('poster', 0),
    selected: 0,
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

export async function loadSamplePhotos(state) {
  const [pier, boulevard] = await Promise.all([
    loadImage('./samples/pier.jpg'),
    loadImage('./samples/boulevard.jpg'),
  ]);
  state.photos[0] = pier;
  state.photos[1] = boulevard;
  state.panels = freshPanels(state.layout, loadedCount(state), state.onePhotoAll);
}

export function loadedCount(state) {
  return state.photos.filter(Boolean).length;
}

function refreshPanels(state) {
  state.panels = freshPanels(state.layout, loadedCount(state), state.onePhotoAll);
}

function setStatus(text) {
  const el = document.getElementById('status');
  if (el) el.textContent = text;
}

export function refreshSlots(state) {
  const wrap = document.getElementById('photoSlots');
  if (!wrap) return;
  wrap.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = `slot${photo ? ' assigned' : ''}`;
    slot.dataset.slot = String(i);
    slot.title = photo ? `Replace photo ${i + 1}` : `Add photo ${i + 1}`;
    if (photo) {
      const img = document.createElement('img');
      img.src = photo.src;
      img.alt = `Photo ${i + 1}`;
      slot.appendChild(img);
    } else {
      const plus = document.createElement('span');
      plus.className = 'slot-plus';
      plus.textContent = '+';
      slot.appendChild(plus);
    }
    const num = document.createElement('span');
    num.className = 'slot-num';
    num.textContent = String(i + 1);
    slot.appendChild(num);
    slot.addEventListener('click', () => {
      const input = document.getElementById('photoInput');
      input.dataset.slot = String(i);
      input.click();
    });
    wrap.appendChild(slot);
  });
}

export function refreshPanelControls(state) {
  const panel = state.panels[state.selected];
  const note = document.getElementById('panelNote');
  if (note) note.textContent = panel ? `Panel ${state.selected + 1} — ${panel.label}` : 'No panel selected';
  const setVal = (id, valId, value, fmt) => {
    const input = document.getElementById(id);
    const val = document.getElementById(valId);
    if (input) input.value = String(value);
    if (val) val.textContent = fmt(value);
  };
  if (panel) {
    setVal('zoomSlider', 'zoomValue', panel.zoom, (v) => `${Number(v).toFixed(2)}×`);
    setVal('posXSlider', 'posXValue', panel.ox, (v) => Number(v).toFixed(2));
    setVal('posYSlider', 'posYValue', panel.oy, (v) => Number(v).toFixed(2));
  }
  const glow = document.getElementById('glowSlider');
  const glowVal = document.getElementById('glowValue');
  if (glow) glow.value = String(state.glow);
  if (glowVal) glowVal.textContent = String(state.glow);
  const titleScale = document.getElementById('titleScaleSlider');
  const titleScaleVal = document.getElementById('titleScaleValue');
  if (titleScale) titleScale.value = String(state.titleScale);
  if (titleScaleVal) titleScaleVal.textContent = `${Number(state.titleScale).toFixed(2)}×`;
}

function markActive(containerId, attr, value) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.querySelectorAll('.chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset[attr] === value);
  });
}

function markSizeButtons(size) {
  document.querySelectorAll('.size-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.size === size);
  });
}

function panelAt(state, canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  for (let i = 0; i < state.panels.length; i++) {
    const p = state.panels[i];
    if (x >= p.x * canvas.width && x < (p.x + p.w) * canvas.width
      && y >= p.y * canvas.height && y < (p.y + p.h) * canvas.height) {
      return i;
    }
  }
  return -1;
}

export function initEditor(state, render) {
  const canvas = document.getElementById('cover');

  // Size buttons: switch size and its natural layout.
  document.querySelectorAll('.size-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.size;
      const spec = SIZES[size];
      if (!spec) return;
      state.size = size;
      state.layout = spec.layout;
      canvas.width = spec.w;
      canvas.height = spec.h;
      refreshPanels(state);
      markSizeButtons(size);
      markActive('layoutChips', 'layout', state.layout);
      refreshPanelControls(state);
      render();
    });
  });

  // Photo slots + file input.
  refreshSlots(state);
  const input = document.getElementById('photoInput');
  document.getElementById('addPhotosBtn')?.addEventListener('click', () => {
    delete input.dataset.slot;
    input.click();
  });
  document.getElementById('loadSamplesBtn')?.addEventListener('click', async () => {
    setStatus('Loading sample photos…');
    try {
      await loadSamplePhotos(state);
      refreshSlots(state);
      refreshPanelControls(state);
      render();
      setStatus('Sample photos loaded.');
    } catch {
      setStatus('Could not load the sample photos.');
    }
  });
  input.addEventListener('change', async () => {
    const files = [...(input.files ?? [])];
    if (!files.length) return;
    const slot = input.dataset.slot != null ? Number(input.dataset.slot) : -1;
    for (const file of files) {
      try {
        const img = await loadImage(URL.createObjectURL(file));
        if (slot >= 0) {
          state.photos[slot] = img;
        } else {
          const free = state.photos.findIndex((p) => !p);
          if (free === -1) break;
          state.photos[free] = img;
        }
      } catch {
        setStatus(`Could not read ${file.name}.`);
      }
    }
    input.value = '';
    delete input.dataset.slot;
    refreshPanels(state);
    refreshSlots(state);
    refreshPanelControls(state);
    render();
    setStatus(`${loadedCount(state)} photo(s) loaded.`);
  });

  document.getElementById('onePhotoAll')?.addEventListener('change', (e) => {
    state.onePhotoAll = e.target.checked;
    refreshPanels(state);
    render();
  });

  // Layout / grade / title-style chips.
  document.querySelectorAll('#layoutChips .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.layout = chip.dataset.layout;
      refreshPanels(state);
      markActive('layoutChips', 'layout', state.layout);
      refreshPanelControls(state);
      render();
    });
  });
  document.querySelectorAll('#gradeChips .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.grade = chip.dataset.grade;
      markActive('gradeChips', 'grade', state.grade);
      render();
    });
  });
  document.querySelectorAll('#titleStyleChips .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.titleStyle = chip.dataset.titleStyle;
      markActive('titleStyleChips', 'titleStyle', state.titleStyle);
      render();
    });
  });

  // Sliders.
  const bindSlider = (id, valId, fmt, apply) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      const v = Number(el.value);
      const val = document.getElementById(valId);
      if (val) val.textContent = fmt(v);
      apply(v);
      render();
    });
  };
  bindSlider('glowSlider', 'glowValue', (v) => String(v), (v) => { state.glow = v; });
  bindSlider('zoomSlider', 'zoomValue', (v) => `${v.toFixed(2)}×`, (v) => {
    const p = state.panels[state.selected];
    if (p) p.zoom = v;
  });
  bindSlider('posXSlider', 'posXValue', (v) => v.toFixed(2), (v) => {
    const p = state.panels[state.selected];
    if (p) p.ox = v;
  });
  bindSlider('posYSlider', 'posYValue', (v) => v.toFixed(2), (v) => {
    const p = state.panels[state.selected];
    if (p) p.oy = v;
  });
  bindSlider('titleScaleSlider', 'titleScaleValue', (v) => `${v.toFixed(2)}×`, (v) => {
    state.titleScale = v;
  });

  document.getElementById('fitBtn')?.addEventListener('click', () => {
    const p = state.panels[state.selected];
    if (!p) return;
    p.zoom = 1;
    p.ox = 0;
    p.oy = 0;
    refreshPanelControls(state);
    render();
  });
  document.getElementById('fillBtn')?.addEventListener('click', () => {
    const p = state.panels[state.selected];
    if (!p) return;
    p.zoom = 1.6;
    refreshPanelControls(state);
    render();
  });

  // Caption inputs.
  document.getElementById('titleInput')?.addEventListener('input', (e) => {
    state.caption = e.target.value;
    render();
  });
  document.getElementById('subtitleInput')?.addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    render();
  });

  // Canvas pointer: click selects a panel, drag moves its photo, wheel zooms.
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    const idx = panelAt(state, canvas, e.clientX, e.clientY);
    if (idx === -1) return;
    state.selected = idx;
    refreshPanelControls(state);
    render();
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const panel = state.panels[state.selected];
    if (!panel) return;
    const rect = canvas.getBoundingClientRect();
    const pw = panel.w * rect.width;
    const ph = panel.h * rect.height;
    panel.ox = Math.max(-1, Math.min(1, panel.ox + ((e.clientX - lastX) / pw) * 2));
    panel.oy = Math.max(-1, Math.min(1, panel.oy + ((e.clientY - lastY) / ph) * 2));
    lastX = e.clientX;
    lastY = e.clientY;
    refreshPanelControls(state);
    render();
  });
  const stopDrag = () => { dragging = false; };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = Math.max(1, Math.min(3, panel.zoom * Math.exp(-e.deltaY * 0.0012)));
    refreshPanelControls(state);
    render();
  }, { passive: false });

  // Export: render the full-size canvas and download it as a PNG.
  document.getElementById('exportBtn')?.addEventListener('click', () => {
    setStatus('Rendering PNG…');
    const full = renderCoverCanvas(state);
    full.toBlob((blob) => {
      if (!blob) {
        setStatus('Export failed — the browser could not make the PNG.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vice-city-nights-${state.size}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setStatus(`Exported vice-city-nights-${state.size}.png (${state.size}).`);
    }, 'image/png');
  });
}
