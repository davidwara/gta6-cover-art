// editor.js — state + UI wiring for Vice City Nights. Owns the editor
// controls (photos, layout, grade, caption, sliders) and the pointer
// interaction on the preview canvas. Rendering itself lives in cover.js.
import { GRADES, LAYOUTS, SIZES, TITLE_STYLES, drawCover, freshPanels, renderCoverCanvas } from './cover.js';

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
  state.photos = [pier, boulevard, null, null];
  state.panels = freshPanels(state.layout, 2);
  return state;
}

function setStatus(text) {
  const el = document.getElementById('status');
  if (el) el.textContent = text;
}

function chip(container, label, active, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip' + (active ? ' active' : '');
  b.textContent = label;
  b.addEventListener('click', onClick);
  container.appendChild(b);
  return b;
}

export function initEditor(state, canvas, render) {
  const $ = (id) => document.getElementById(id);
  const ctx = canvas.getContext('2d');

  function draw() {
    const { w, h } = SIZES[state.size];
    canvas.width = w;
    canvas.height = h;
    drawCover(ctx, state, w, h);
    if (render) render();
  }

  // ---- Photo slots -------------------------------------------------------
  function refreshSlots() {
    const wrap = $('photoSlots');
    wrap.innerHTML = '';
    state.photos.forEach((photo, i) => {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'slot' + (photo ? ' assigned' : '');
      slot.dataset.slot = String(i);
      if (photo) {
        const img = document.createElement('img');
        img.src = photo.src;
        img.alt = `Photo ${i + 1}`;
        slot.appendChild(img);
      } else {
        slot.textContent = `+ Photo ${i + 1}`;
      }
      slot.addEventListener('click', () => replaceSlot(i));
      wrap.appendChild(slot);
    });
  }

  function replaceSlot(i) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      const img = new Image();
      img.onload = () => {
        state.photos[i] = img;
        state.panels = freshPanels(state.layout, state.photos.filter(Boolean).length);
        refreshSlots();
        refreshPanel();
        draw();
        setStatus(`Photo ${i + 1} loaded.`);
      };
      img.src = URL.createObjectURL(file);
    });
    input.click();
  }

  function addPhotos(files) {
    const list = [...files].filter((f) => f.type.startsWith('image/')).slice(0, 4);
    if (!list.length) return;
    let pending = list.length;
    list.forEach((file) => {
      const free = state.photos.findIndex((p) => !p);
      const target = free === -1 ? state.photos.length - 1 : free;
      const img = new Image();
      img.onload = () => {
        state.photos[target] = img;
        if (--pending === 0) {
          state.panels = freshPanels(state.layout, state.photos.filter(Boolean).length);
          refreshSlots();
          refreshPanel();
          draw();
          setStatus(`${list.length} photo(s) loaded.`);
        }
      };
      img.src = URL.createObjectURL(file);
    });
  }

  $('addPhotos').addEventListener('change', (e) => addPhotos(e.target.files ?? []));
  $('loadSamplesBtn').addEventListener('click', async () => {
    await loadSamplePhotos(state);
    refreshSlots();
    refreshPanel();
    draw();
    setStatus('Sample photos loaded.');
  });
  $('onePhotoAll').addEventListener('change', (e) => {
    state.onePhotoAll = e.target.checked;
    const first = state.photos.findIndex(Boolean);
    if (state.onePhotoAll && first >= 0) {
      state.panels.forEach((p) => { p.photo = first; });
    } else {
      state.panels = freshPanels(state.layout, state.photos.filter(Boolean).length);
    }
    draw();
  });

  // ---- Size, layout, grade, title style ---------------------------------
  function refreshSizeButtons() {
    document.querySelectorAll('#sizeButtons .chip').forEach((b) => {
      b.classList.toggle('active', b.dataset.size === state.size);
    });
  }
  document.querySelectorAll('#sizeButtons .chip').forEach((b) => {
    b.addEventListener('click', () => {
      state.size = b.dataset.size;
      state.layout = SIZES[state.size].layout;
      state.panels = freshPanels(state.layout, state.photos.filter(Boolean).length);
      refreshSizeButtons();
      refreshLayoutChips();
      refreshPanel();
      draw();
    });
  });

  function refreshLayoutChips() {
    const wrap = $('layoutChips');
    wrap.innerHTML = '';
    const names = Object.keys(LAYOUTS);
    names.forEach((name) => {
      chip(wrap, name[0].toUpperCase() + name.slice(1), name === state.layout, () => {
        state.layout = name;
        state.panels = freshPanels(name, state.photos.filter(Boolean).length);
        refreshLayoutChips();
        refreshPanel();
        draw();
      });
    });
  }

  function refreshGradeChips() {
    const wrap = $('gradeChips');
    wrap.innerHTML = '';
    Object.entries(GRADES).forEach(([key, g]) => {
      chip(wrap, g.label, key === state.grade, () => {
        state.grade = key;
        refreshGradeChips();
        draw();
      });
    });
  }

  function refreshTitleChips() {
    const wrap = $('titleChips');
    wrap.innerHTML = '';
    Object.entries(TITLE_STYLES).forEach(([key, s]) => {
      chip(wrap, s.label, key === state.titleStyle, () => {
        state.titleStyle = key;
        refreshTitleChips();
        draw();
      });
    });
  }

  // ---- Sliders + caption -------------------------------------------------
  function bindRange(id, get, set) {
    const el = $(id);
    el.value = String(get());
    el.addEventListener('input', () => {
      set(Number(el.value));
      draw();
    });
    return el;
  }
  bindRange('glowRange', () => state.glow, (v) => { state.glow = v; });
  const zoomEl = bindRange('zoomRange', () => state.panels[state.selected]?.zoom ?? 1, (v) => {
    if (state.panels[state.selected]) state.panels[state.selected].zoom = v;
  });
  const posXEl = bindRange('posXRange', () => state.panels[state.selected]?.ox ?? 0, (v) => {
    if (state.panels[state.selected]) state.panels[state.selected].ox = v;
  });
  const posYEl = bindRange('posYRange', () => state.panels[state.selected]?.oy ?? 0, (v) => {
    if (state.panels[state.selected]) state.panels[state.selected].oy = v;
  });
  bindRange('titleSizeRange', () => Math.round(state.titleScale * 100), (v) => { state.titleScale = v / 100; });

  function refreshPanel() {
    const panel = state.panels[state.selected];
    const note = $('panelNote');
    if (panel) {
      note.textContent = `Panel ${state.selected + 1} — ${panel.name}${panel.photo >= 0 ? ` (photo ${panel.photo + 1})` : ' (empty)'}. Click a panel on the cover to select it.`;
      zoomEl.value = String(panel.zoom);
      posXEl.value = String(panel.ox);
      posYEl.value = String(panel.oy);
    } else {
      note.textContent = 'No panel selected.';
    }
  }

  $('fitBtn').addEventListener('click', () => {
    if (state.panels[state.selected]) state.panels[state.selected].zoom = 1;
    refreshPanel();
    draw();
  });
  $('fillBtn').addEventListener('click', () => {
    if (state.panels[state.selected]) state.panels[state.selected].zoom = 1.6;
    refreshPanel();
    draw();
  });

  const titleInput = $('titleInput');
  titleInput.value = state.caption;
  titleInput.addEventListener('input', () => { state.caption = titleInput.value; draw(); });
  const subtitleInput = $('subtitleInput');
  subtitleInput.value = state.subtitle;
  subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; draw(); });

  // ---- Canvas pointer: click selects a panel, drag pans, wheel zooms ----
  let dragging = null;
  function panelAt(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const x = (clientX - r.left) / r.width;
    const y = (clientY - r.top) / r.height;
    const rects = LAYOUTS[state.layout];
    const idx = rects.findIndex((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h);
    return idx === -1 ? null : { idx, rect: rects[idx], x, y };
  }
  canvas.addEventListener('pointerdown', (e) => {
    const hit = panelAt(e.clientX, e.clientY);
    if (!hit) return;
    state.selected = hit.idx;
    const panel = state.panels[hit.idx];
    dragging = { startX: e.clientX, startY: e.clientY, ox: panel.ox, oy: panel.oy, rect: hit.rect };
    canvas.setPointerCapture(e.pointerId);
    refreshPanel();
    draw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const panel = state.panels[state.selected];
    const r = canvas.getBoundingClientRect();
    const dx = (e.clientX - dragging.startX) / r.width / Math.max(0.05, dragging.rect.w);
    const dy = (e.clientY - dragging.startY) / r.height / Math.max(0.05, dragging.rect.h);
    panel.ox = Math.max(-1, Math.min(1, dragging.ox - dx * 2));
    panel.oy = Math.max(-1, Math.min(1, dragging.oy - dy * 2));
    zoomEl.value = String(panel.zoom);
    posXEl.value = String(panel.ox);
    posYEl.value = String(panel.oy);
    draw();
  });
  canvas.addEventListener('pointerup', () => { dragging = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = Math.max(1, Math.min(3, panel.zoom - Math.sign(e.deltaY) * 0.1));
    zoomEl.value = String(panel.zoom);
    draw();
  }, { passive: false });

  // ---- Export ------------------------------------------------------------
  $('exportBtn').addEventListener('click', () => {
    const out = renderCoverCanvas(state);
    out.toBlob((blob) => {
      if (!blob) {
        setStatus('Export failed — try again.');
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-city-nights-${state.size}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      setStatus(`Exported vice-city-nights-${state.size}.png (${SIZES[state.size].w}×${SIZES[state.size].h}).`);
    }, 'image/png');
  });

  refreshSlots();
  refreshSizeButtons();
  refreshLayoutChips();
  refreshGradeChips();
  refreshTitleChips();
  refreshPanel();
  draw();

  return { draw, refreshSlots, refreshPanel, refreshLayoutChips, refreshGradeChips, refreshTitleChips };
}
