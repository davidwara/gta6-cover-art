// Vice City Nights — editor state + UI wiring.
// Owns the mutable state, the side-panel controls and the canvas gestures.
// The renderer (cover.js) stays pure: it only reads this state.

import { GRADES, LAYOUTS, SIZES, TITLE_STYLES, freshPanels, renderCoverCanvas } from './cover.js';

export const SAMPLE_FILES = ['pier.jpg', 'boulevard.jpg'];

export function createState() {
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
    photos: [null, null, null, null],
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

// Loads the two bundled samples into slots 1 and 2 (pier first).
export async function loadSamplePhotos(state) {
  const loaded = [];
  for (const file of SAMPLE_FILES) {
    try {
      const img = await loadImage(`./samples/${file}`);
      loaded.push({ name: file, img, url: `./samples/${file}` });
    } catch (err) {
      console.warn(err.message);
    }
  }
  loaded.forEach((photo, i) => {
    state.photos[i] = photo;
  });
  state.panels = freshPanels(state.layout, state.photos.filter(Boolean).length);
  return loaded.length;
}

function setStatus(text) {
  const el = document.getElementById('status');
  if (el) el.textContent = text;
}

export function initEditor(state, canvas, render) {
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // ---------- photo slots ----------
  const slotsEl = $('photoSlots');
  const fileInput = $('addPhotos');

  function refreshSlots() {
    if (!slotsEl) return;
    slotsEl.innerHTML = '';
    state.photos.forEach((photo, i) => {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'slot' + (photo ? ' assigned' : '');
      slot.dataset.slot = String(i);
      slot.setAttribute('aria-label', photo ? `Photo slot ${i + 1}: ${photo.name}` : `Photo slot ${i + 1}: empty`);
      if (photo) {
        const thumb = document.createElement('img');
        thumb.src = photo.url;
        thumb.alt = photo.name;
        slot.appendChild(thumb);
      } else {
        const plus = document.createElement('span');
        plus.className = 'slot-plus';
        plus.textContent = '+';
        slot.appendChild(plus);
      }
      const badge = document.createElement('span');
      badge.className = 'slot-num';
      badge.textContent = String(i + 1);
      slot.appendChild(badge);
      slot.addEventListener('click', () => {
        // Click a slot to replace just that one photo.
        fileInput.dataset.replaceSlot = String(i);
        fileInput.click();
      });
      slotsEl.appendChild(slot);
    });
  }

  function addUserPhotos(files) {
    const replace = fileInput.dataset.replaceSlot;
    delete fileInput.dataset.replaceSlot;
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    if (replace !== undefined && replace !== '') {
      const idx = Number(replace);
      const file = list[0];
      state.photos[idx] = { name: file.name, img: null, url: URL.createObjectURL(file) };
      loadImage(state.photos[idx].url).then((img) => {
        state.photos[idx].img = img;
        state.panels = freshPanels(state.layout, state.photos.filter(Boolean).length);
        refreshSlots();
        render();
      });
      setStatus(`Slot ${idx + 1} replaced with ${file.name}.`);
    } else {
      let added = 0;
      for (const file of list) {
        const empty = state.photos.findIndex((p) => !p);
        if (empty === -1) break;
        state.photos[empty] = { name: file.name, img: null, url: URL.createObjectURL(file) };
        loadImage(state.photos[empty].url).then((img) => {
          state.photos[empty].img = img;
          state.panels = freshPanels(state.layout, state.photos.filter(Boolean).length);
          refreshSlots();
          render();
        });
        added += 1;
      }
      setStatus(added ? `${added} photo${added > 1 ? 's' : ''} added.` : 'All 4 photo slots are full — click a slot to replace it.');
    }
    state.panels = freshPanels(state.layout, state.photos.filter(Boolean).length);
    refreshSlots();
    render();
  }

  $('addPhotosBtn')?.addEventListener('click', () => {
    delete fileInput.dataset.replaceSlot;
    fileInput.click();
  });
  fileInput?.addEventListener('change', () => {
    addUserPhotos(fileInput.files);
    fileInput.value = '';
  });
  $('loadSamples')?.addEventListener('click', async () => {
    setStatus('Loading sample photos…');
    const n = await loadSamplePhotos(state);
    refreshSlots();
    render();
    setStatus(n ? `${n} sample photos loaded.` : 'Sample photos could not be loaded.');
  });
  $('onePhotoAll')?.addEventListener('change', (ev) => {
    state.onePhotoAll = ev.target.checked;
    render();
    setStatus(state.onePhotoAll ? 'One photo fills every panel.' : 'Panels cycle through your photos.');
  });

  // ---------- size buttons ----------
  function refreshSizeButtons() {
    $$('.size-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.size === state.size);
    });
  }
  $$('.size-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.size = btn.dataset.size;
      const natural = SIZES[state.size].layout;
      state.layout = natural;
      state.panels = freshPanels(natural, state.photos.filter(Boolean).length);
      state.selected = 0;
      refreshSizeButtons();
      refreshLayoutChips();
      refreshPanelControls();
      render();
      setStatus(`Canvas ${state.size} — ${natural} layout.`);
    });
  });

  // ---------- layout + grade chips ----------
  function refreshLayoutChips() {
    $$('.layout-chip').forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.layout === state.layout);
    });
  }
  $$('.layout-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.layout = chip.dataset.layout;
      state.panels = freshPanels(state.layout, state.photos.filter(Boolean).length);
      state.selected = 0;
      refreshLayoutChips();
      refreshPanelControls();
      render();
    });
  });

  function refreshGradeChips() {
    $$('.grade-chip').forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.grade === state.grade);
    });
  }
  $$('.grade-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.grade = chip.dataset.grade;
      refreshGradeChips();
      render();
      setStatus(`Grade: ${GRADES[state.grade].label}.`);
    });
  });

  // ---------- sliders ----------
  function bindRange(id, valId, format, apply) {
    const input = $(id);
    const label = $(valId);
    if (!input) return;
    input.addEventListener('input', () => {
      const v = Number(input.value);
      if (label) label.textContent = format(v);
      apply(v);
      render();
    });
  }

  bindRange('glowRange', 'glowVal', (v) => String(v), (v) => { state.glow = v; });
  bindRange('zoomRange', 'zoomVal', (v) => `${v.toFixed(2)}×`, (v) => {
    const panel = state.panels[state.selected];
    if (panel) panel.zoom = v;
  });
  bindRange('posXRange', 'posXVal', (v) => v.toFixed(2), (v) => {
    const panel = state.panels[state.selected];
    if (panel) panel.ox = v;
  });
  bindRange('posYRange', 'posYVal', (v) => v.toFixed(2), (v) => {
    const panel = state.panels[state.selected];
    if (panel) panel.oy = v;
  });
  bindRange('titleSizeRange', 'titleSizeVal', (v) => `${Math.round(v * 100)}%`, (v) => {
    state.titleScale = v;
  });

  $('fitBtn')?.addEventListener('click', () => {
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = 1;
    panel.ox = 0;
    panel.oy = 0;
    refreshPanelControls();
    render();
    setStatus('Photo fitted to its panel.');
  });
  $('fillBtn')?.addEventListener('click', () => {
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = 1.6;
    panel.ox = 0;
    panel.oy = 0;
    refreshPanelControls();
    render();
    setStatus('Panel filled — photo cropped in.');
  });

  // ---------- caption ----------
  $('titleInput')?.addEventListener('input', (ev) => {
    state.caption = ev.target.value;
    render();
  });
  $('subtitleInput')?.addEventListener('input', (ev) => {
    state.subtitle = ev.target.value;
    render();
  });
  $$('.title-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.titleStyle = chip.dataset.style;
      $$('.title-chip').forEach((c) => c.classList.toggle('active', c === chip));
      render();
      setStatus(`Title style: ${TITLE_STYLES[state.titleStyle].label}.`);
    });
  });

  // ---------- selected panel readout ----------
  function refreshPanelControls() {
    const panel = state.panels[state.selected];
    const note = $('panelNote');
    if (note) {
      note.textContent = panel
        ? `Panel ${state.selected + 1} — ${panel.name}`
        : 'No panel selected';
    }
    const setRange = (id, valId, value, format) => {
      const input = $(id);
      const label = $(valId);
      if (input) input.value = String(value);
      if (label) label.textContent = format(value);
    };
    if (panel) {
      setRange('zoomRange', 'zoomVal', panel.zoom, (v) => `${v.toFixed(2)}×`);
      setRange('posXRange', 'posXVal', panel.ox, (v) => v.toFixed(2));
      setRange('posYRange', 'posYVal', panel.oy, (v) => v.toFixed(2));
    }
  }

  // ---------- canvas gestures: click to select, drag to move, wheel to zoom ----------
  function panelAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    return state.panels.findIndex((panel) => {
      const [px, py, pw, ph] = panel.rect;
      return nx >= px && nx <= px + pw && ny >= py && ny <= py + ph;
    });
  }

  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener('pointerdown', (ev) => {
    const idx = panelAt(ev.clientX, ev.clientY);
    if (idx === -1) return;
    state.selected = idx;
    refreshPanelControls();
    render();
    dragging = true;
    lastX = ev.clientX;
    lastY = ev.clientY;
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!dragging) return;
    const panel = state.panels[state.selected];
    if (!panel) return;
    const rect = canvas.getBoundingClientRect();
    const [,, pw, ph] = panel.rect;
    const spareX = Math.max(0, (panel.zoom - 1) * pw * rect.width);
    const spareY = Math.max(0, (panel.zoom - 1) * ph * rect.height);
    if (spareX > 0) panel.ox = Math.max(-1, Math.min(1, panel.ox - ((ev.clientX - lastX) / spareX) * 2));
    if (spareY > 0) panel.oy = Math.max(-1, Math.min(1, panel.oy - ((ev.clientY - lastY) / spareY) * 2));
    lastX = ev.clientX;
    lastY = ev.clientY;
    refreshPanelControls();
    render();
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  canvas.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = Math.max(1, Math.min(3, panel.zoom - ev.deltaY * 0.0015));
    refreshPanelControls();
    render();
  }, { passive: false });

  // ---------- export ----------
  $('exportBtn')?.addEventListener('click', () => {
    setStatus('Rendering PNG…');
    const out = renderCoverCanvas(state);
    out.toBlob((blob) => {
      if (!blob) {
        setStatus('Export failed — the canvas could not produce a PNG.');
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

  refreshSlots();
  refreshSizeButtons();
  refreshLayoutChips();
  refreshGradeChips();
  refreshPanelControls();

  return { refreshSlots, refreshPanelControls, refreshSizeButtons, refreshLayoutChips };
}
