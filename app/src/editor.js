// editor.js — Vice City Nights v2 state + editor UI wiring.
// Owns createState(), the side-panel controls, canvas pointer/keyboard
// interaction, Look presets, Randomize and the PNG export.

import { SIZES, LAYOUTS, GRADES, TITLE_STYLES, freshPanels, drawCover, renderCoverCanvas } from './cover.js';

export const CAPTION_PRESETS = [
  { title: 'Sunset Heist', subtitle: 'VICE CITY · EST. 2026', grade: 'vice' },
  { title: 'Boulevard Queen', subtitle: 'OCEAN DRIVE · MIAMI', grade: 'gold' },
  { title: 'Vice City Nights', subtitle: 'NEON AFTER DARK', grade: 'neon' },
  { title: 'Neon Reign', subtitle: 'KING OF THE STRIP', grade: 'midnight' },
  { title: 'Ocean Drive', subtitle: 'PALMS · SUN · SPEED', grade: 'ocean' },
  { title: 'Midnight Run', subtitle: 'NO BRAKES · NO REGRETS', grade: 'bubble' },
];

export const LOOK_PRESETS = {
  'Golden Hour': { grade: 'gold', layout: 'poster', titleStyle: 'sunset', glow: 75, grain: 45, vignette: 55, halftone: 50, skylineOn: false, sunOn: true },
  'Neon Nights': { grade: 'neon', layout: 'wide', titleStyle: 'neon', glow: 80, grain: 55, vignette: 65, halftone: 60, skylineOn: true, sunOn: true },
  'Bubblegum Pop': { grade: 'bubble', layout: 'poster', titleStyle: 'bubble', glow: 70, grain: 40, vignette: 50, halftone: 70, skylineOn: false, sunOn: true },
  'Noir Drive': { grade: 'midnight', layout: 'strip', titleStyle: 'chrome', glow: 55, grain: 60, vignette: 85, halftone: 45, skylineOn: true, sunOn: false },
};

export function createState() {
  return {
    size: '1080x1350',
    layout: 'poster',
    grade: 'vice',
    glow: 65,
    grain: 50,
    vignette: 60,
    halftone: 55,
    border: 0,
    sunOn: true,
    sunScale: 1,
    skylineOn: false,
    badgesOn: true,
    caption: 'Sunset Heist',
    subtitle: 'VICE CITY · EST. 2026',
    titleStyle: 'sunset',
    titleScale: 1,
    exportScale: 1,
    onePhotoAll: false,
    photos: [null, null, null, null, null, null],
    panels: freshPanels('poster', 0),
    selected: 0,
    heroSlot: 0,
  };
}

function $(id) { return document.getElementById(id); }
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function photoCount(state) {
  return state.photos.filter(Boolean).length;
}

function refreshPanels(state) {
  const count = photoCount(state);
  const fresh = freshPanels(state.layout, count);
  // Keep per-panel tweaks the user already made on the same layout.
  state.panels = fresh.map((p, i) => {
    const old = state.panels && state.panels[i];
    if (old && old.name === p.name) {
      return { ...p, zoom: old.zoom, ox: old.ox, oy: old.oy, filter: old.filter };
    }
    return p;
  });
  if (state.onePhotoAll && count > 0) {
    const first = state.photos.findIndex(Boolean);
    state.panels.forEach((p) => { p.photoIndex = first; });
  }
  // Starred photo becomes panel 0's photo.
  if (state.panels[0] && state.photos[state.heroSlot]) {
    state.panels[0].photoIndex = state.heroSlot;
  }
}

export function render(state, canvas) {
  const size = SIZES[state.size] || SIZES['1080x1350'];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  const ctx = canvas.getContext('2d');
  drawCover(ctx, state, canvas.width, canvas.height);
}

export async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

export async function loadSamplePhotos(state) {
  const pier = await loadImage('./samples/pier.jpg');
  const boulevard = await loadImage('./samples/boulevard.jpg');
  state.photos[0] = pier;
  state.photos[1] = boulevard;
  refreshPanels(state);
}

// --- slots ---------------------------------------------------------------

export function refreshSlotsUI(state) {
  refreshSlots(state);
}

function refreshSlots(state, onChange) {
  const wrap = $('photoSlots');
  if (!wrap) return;
  wrap.querySelectorAll('.slot').forEach((el, i) => {
    const img = state.photos[i];
    el.classList.toggle('assigned', !!img);
    el.classList.toggle('hero', state.heroSlot === i && !!img);
    const thumb = el.querySelector('img');
    const label = el.querySelector('.slot-label');
    if (img) {
      if (!thumb) {
        const im = document.createElement('img');
        im.src = img.src;
        im.alt = `Photo ${i + 1}`;
        el.prepend(im);
      } else {
        thumb.src = img.src;
      }
      label.textContent = `Photo ${i + 1}${state.heroSlot === i ? ' ★ hero' : ''}`;
    } else {
      thumb?.remove();
      label.textContent = `Slot ${i + 1} — empty`;
    }
    const star = el.querySelector('.slot-star');
    if (star) star.textContent = state.heroSlot === i ? '★' : '☆';
  });
  if (onChange) onChange();
}

// --- control builders ------------------------------------------------------

function chipRow(container, items, active, onPick) {
  container.innerHTML = '';
  items.forEach(([value, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (value === active ? ' active' : '');
    b.textContent = label;
    b.addEventListener('click', () => onPick(value));
    container.appendChild(b);
  });
}

function bindSlider(id, get, set, format) {
  const el = $(id);
  if (!el) return;
  el.value = get();
  const out = document.querySelector(`[data-out="${id}"]`);
  const show = () => { if (out) out.textContent = format(get()); };
  show();
  el.addEventListener('input', () => { set(Number(el.value)); show(); });
}

function bindToggle(id, get, set) {
  const el = $(id);
  if (!el) return;
  el.checked = get();
  el.addEventListener('change', () => set(el.checked));
}

// --- export ----------------------------------------------------------------

export function exportPNG(state) {
  const canvas = renderCoverCanvas(state);
  const size = SIZES[state.size] || SIZES['1080x1350'];
  canvas.toBlob((blob) => {
    if (!blob) { setStatus('Export failed — canvas is empty'); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vice-city-nights-${state.size}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setStatus(`Exported ${size.w}×${size.h} PNG${state.exportScale === 2 ? ' (2×)' : ''}`);
  }, 'image/png');
}

export function setStatus(text) {
  const el = $('status');
  if (el) el.textContent = text;
}

// --- panel interaction -------------------------------------------------------

function panelAt(state, canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  const defs = LAYOUTS[state.layout] || LAYOUTS.poster;
  for (let i = defs.length - 1; i >= 0; i--) {
    const [nx, ny, nw, nh] = defs[i].rect;
    if (x >= nx && x < nx + nw && y >= ny && y < ny + nh) return i;
  }
  return 0;
}

function nudgeSelected(state, dx, dy) {
  const p = state.panels[state.selected];
  if (!p) return;
  p.ox = clamp((p.ox ?? 0) + dx, -1, 1);
  p.oy = clamp((p.oy ?? 0) + dy, -1, 1);
}

function zoomSelected(state, delta) {
  const p = state.panels[state.selected];
  if (!p) return;
  p.zoom = clamp((p.zoom ?? 1) + delta, 1, 3);
}

// --- init --------------------------------------------------------------------

export function initEditor(state, canvas) {
  let swapArmed = false;
  const rerender = () => render(state, canvas);
  const syncAll = () => { refreshSlots(state); refreshPanelControls(state); rerender(); };

  // Size buttons.
  const sizeWrap = $('sizeButtons');
  if (sizeWrap) {
    chipRow(sizeWrap, Object.entries(SIZES).map(([k, v]) => [k, v.label]), state.size, (v) => {
      state.size = v;
      const natural = SIZES[v].natural;
      const defs = LAYOUTS[state.layout];
      const fits = state.layout === natural || true; // every layout renders at any size
      if (!fits) state.layout = natural;
      refreshPanels(state);
      chipRow(sizeWrap, Object.entries(SIZES).map(([k, s]) => [k, s.label]), state.size, () => {});
      initEditorSizeButtons(state, canvas, rerender);
      syncAll();
      setStatus(`Size ${SIZES[v].label}`);
    });
  }

  // Layout chips.
  const layoutWrap = $('layoutChips');
  if (layoutWrap) {
    chipRow(layoutWrap, Object.keys(LAYOUTS).map((k) => [k, k]), state.layout, (v) => {
      state.layout = v;
      refreshPanels(state);
      chipRow(layoutWrap, Object.keys(LAYOUTS).map((k) => [k, k]), state.layout, () => {});
      initEditorLayoutChips(state, canvas, rerender);
      syncAll();
      setStatus(`Layout ${v}`);
    });
  }

  // Grade chips.
  const gradeWrap = $('gradeChips');
  if (gradeWrap) {
    chipRow(gradeWrap, Object.entries(GRADES).map(([k, g]) => [k, g.name]), state.grade, (v) => {
      state.grade = v;
      chipRow(gradeWrap, Object.entries(GRADES).map(([k, g]) => [k, g.name]), state.grade, () => {});
      initEditorGradeChips(state, canvas, rerender);
      rerender();
      setStatus(`Grade ${GRADES[v].name}`);
    });
  }

  // Look sliders + toggles.
  bindSlider('glowSlider', () => state.glow, (v) => { state.glow = v; rerender(); }, (v) => `${v}%`);
  bindSlider('grainSlider', () => state.grain, (v) => { state.grain = v; rerender(); }, (v) => `${v}%`);
  bindSlider('vignetteSlider', () => state.vignette, (v) => { state.vignette = v; rerender(); }, (v) => `${v}%`);
  bindSlider('halftoneSlider', () => state.halftone, (v) => { state.halftone = v; rerender(); }, (v) => `${v}%`);
  bindSlider('borderSlider', () => state.border, (v) => { state.border = v; rerender(); }, (v) => (v === 0 ? 'off' : `${v}px`));
  bindSlider('sunSlider', () => state.sunScale, (v) => { state.sunScale = v; rerender(); }, (v) => `${v.toFixed(1)}×`);
  bindToggle('sunToggle', () => state.sunOn, (v) => { state.sunOn = v; rerender(); });
  bindToggle('skylineToggle', () => state.skylineOn, (v) => { state.skylineOn = v; rerender(); });
  bindToggle('badgesToggle', () => state.badgesOn, (v) => { state.badgesOn = v; rerender(); });

  // Selected panel controls.
  bindSlider('zoomSlider', () => state.panels[state.selected]?.zoom ?? 1, (v) => { const p = state.panels[state.selected]; if (p) { p.zoom = v; rerender(); } }, (v) => `${v.toFixed(2)}×`);
  bindSlider('oxSlider', () => state.panels[state.selected]?.ox ?? 0, (v) => { const p = state.panels[state.selected]; if (p) { p.ox = v; rerender(); } }, (v) => v.toFixed(2));
  bindSlider('oySlider', () => state.panels[state.selected]?.oy ?? 0, (v) => { const p = state.panels[state.selected]; if (p) { p.oy = v; rerender(); } }, (v) => v.toFixed(2));

  const filterWrap = $('filterChips');
  if (filterWrap) {
    const draw = () => chipRow(filterWrap, [['none', 'None'], ['bw', 'B&W'], ['sepia', 'Sepia'], ['cool', 'Cool']], state.panels[state.selected]?.filter || 'none', (v) => {
      const p = state.panels[state.selected];
      if (p) p.filter = v;
      draw();
      rerender();
    });
    draw();
    state._redrawFilters = draw;
  }

  const fitBtn = $('fitBtn');
  fitBtn?.addEventListener('click', () => {
    const p = state.panels[state.selected];
    if (p) { p.zoom = 1; p.ox = 0; p.oy = 0; refreshPanelControls(state); rerender(); setStatus('Photo fitted to panel'); }
  });
  const fillBtn = $('fillBtn');
  fillBtn?.addEventListener('click', () => {
    const p = state.panels[state.selected];
    if (p) { p.zoom = 1.15; p.ox = 0; p.oy = 0.2; refreshPanelControls(state); rerender(); setStatus('Panel filled (face-biased)'); }
  });
  const swapBtn = $('swapBtn');
  swapBtn?.addEventListener('click', () => {
    swapArmed = !swapArmed;
    swapBtn.classList.toggle('armed', swapArmed);
    swapBtn.textContent = swapArmed ? 'Swap: click another panel…' : 'Swap panels';
    setStatus(swapArmed ? 'Click another panel to exchange photos' : 'Swap cancelled');
  });

  // Photos: file input + samples + one-photo toggle + slot stars.
  const fileInput = $('photoInput');
  fileInput?.addEventListener('change', async () => {
    const files = [...(fileInput.files || [])];
    let slot = state.photos.findIndex((p) => !p);
    for (const f of files) {
      if (slot === -1) break;
      const url = URL.createObjectURL(f);
      try { state.photos[slot] = await loadImage(url); } catch { /* skip unreadable files */ }
      slot = state.photos.findIndex((p) => !p);
    }
    fileInput.value = '';
    refreshPanels(state);
    syncAll();
    setStatus(`${photoCount(state)} photo(s) loaded`);
  });
  $('loadSamplesBtn')?.addEventListener('click', async () => {
    await loadSamplePhotos(state);
    syncAll();
    setStatus('Sample photos loaded');
  });
  bindToggle('onePhotoToggle', () => state.onePhotoAll, (v) => { state.onePhotoAll = v; refreshPanels(state); syncAll(); });

  const slotsWrap = $('photoSlots');
  slotsWrap?.querySelectorAll('.slot').forEach((el, i) => {
    el.addEventListener('click', (ev) => {
      if (ev.target.closest('.slot-star')) {
        state.heroSlot = i;
        refreshPanels(state);
        syncAll();
        setStatus(`Photo ${i + 1} is now the hero`);
      }
    });
  });

  // Caption.
  const titleInput = $('titleInput');
  if (titleInput) {
    titleInput.value = state.caption;
    titleInput.addEventListener('input', () => { state.caption = titleInput.value; rerender(); });
  }
  const subInput = $('subtitleInput');
  if (subInput) {
    subInput.value = state.subtitle;
    subInput.addEventListener('input', () => { state.subtitle = subInput.value; rerender(); });
  }
  const styleWrap = $('titleStyleChips');
  if (styleWrap) {
    chipRow(styleWrap, Object.keys(TITLE_STYLES).map((k) => [k, k]), state.titleStyle, (v) => {
      state.titleStyle = v;
      chipRow(styleWrap, Object.keys(TITLE_STYLES).map((k) => [k, k]), state.titleStyle, () => {});
      initEditorTitleChips(state, canvas, rerender);
      rerender();
    });
  }
  bindSlider('titleScaleSlider', () => state.titleScale, (v) => { state.titleScale = v; rerender(); }, (v) => `${v.toFixed(1)}×`);

  const captionWrap = $('captionPresets');
  if (captionWrap) {
    chipRow(captionWrap, CAPTION_PRESETS.map((p) => [p.title, p.title]), state.caption, (v) => {
      const p = CAPTION_PRESETS.find((x) => x.title === v);
      if (!p) return;
      state.caption = p.title;
      state.subtitle = p.subtitle;
      state.grade = p.grade;
      if (titleInput) titleInput.value = p.title;
      if (subInput) subInput.value = p.subtitle;
      chipRow(captionWrap, CAPTION_PRESETS.map((x) => [x.title, x.title]), state.caption, () => {});
      initEditorCaptionChips(state, canvas, rerender);
      chipRow(gradeWrap, Object.entries(GRADES).map(([k, g]) => [k, g.name]), state.grade, () => {});
      initEditorGradeChips(state, canvas, rerender);
      rerender();
      setStatus(`Caption "${p.title}" · grade ${GRADES[p.grade].name}`);
    });
  }

  // Look presets + randomize.
  const lookWrap = $('lookPresets');
  if (lookWrap) {
    Object.keys(LOOK_PRESETS).forEach((name) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset-card';
      b.textContent = name;
      b.addEventListener('click', () => {
        applyLook(state, LOOK_PRESETS[name]);
        syncLookControls(state);
        syncAll();
        setStatus(`Look "${name}" applied`);
      });
      lookWrap.appendChild(b);
    });
  }
  $('randomBtn')?.addEventListener('click', () => {
    const grades = Object.keys(GRADES);
    const layouts = Object.keys(LAYOUTS);
    const styles = Object.keys(TITLE_STYLES);
    state.grade = grades[Math.floor(Math.random() * grades.length)];
    state.layout = layouts[Math.floor(Math.random() * layouts.length)];
    state.titleStyle = styles[Math.floor(Math.random() * styles.length)];
    state.glow = 40 + Math.floor(Math.random() * 50);
    state.grain = 30 + Math.floor(Math.random() * 50);
    refreshPanels(state);
    syncLookControls(state);
    syncAll();
    setStatus('Surprise me — new grade, layout & title style');
  });

  // Export.
  const scaleSel = $('exportScale');
  if (scaleSel) {
    scaleSel.value = String(state.exportScale);
    scaleSel.addEventListener('change', () => { state.exportScale = Number(scaleSel.value); });
  }
  $('exportBtn')?.addEventListener('click', () => exportPNG(state));

  // Canvas pointer: click selects, drag moves the photo, wheel zooms.
  let drag = null;
  canvas.addEventListener('pointerdown', (ev) => {
    const idx = panelAt(state, canvas, ev.clientX, ev.clientY);
    if (swapArmed && idx !== state.selected) {
      const a = state.panels[state.selected];
      const b = state.panels[idx];
      if (a && b) {
        const tmp = a.photoIndex; a.photoIndex = b.photoIndex; b.photoIndex = tmp;
        const tz = a.zoom; a.zoom = b.zoom; b.zoom = tz;
      }
      swapArmed = false;
      swapBtn?.classList.remove('armed');
      if (swapBtn) swapBtn.textContent = 'Swap panels';
      state.selected = idx;
      syncAll();
      setStatus(`Swapped panels ${state.selected + 1} ↔ ${idx + 1}`);
      return;
    }
    state.selected = idx;
    refreshPanelControls(state);
    rerender();
    const p = state.panels[idx];
    drag = { x: ev.clientX, y: ev.clientY, ox: p?.ox ?? 0, oy: p?.oy ?? 0, moved: false };
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const p = state.panels[state.selected];
    if (!p) return;
    const dx = (ev.clientX - drag.x) / rect.width;
    const dy = (ev.clientY - drag.y) / rect.height;
    if (Math.abs(dx) + Math.abs(dy) > 0.005) drag.moved = true;
    p.ox = clamp(drag.ox + dx * 2, -1, 1);
    p.oy = clamp(drag.oy + dy * 2, -1, 1);
    rerender();
  });
  canvas.addEventListener('pointerup', () => {
    if (drag?.moved) refreshPanelControls(state);
    drag = null;
  });
  canvas.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    zoomSelected(state, ev.deltaY < 0 ? 0.1 : -0.1);
    refreshPanelControls(state);
    rerender();
  }, { passive: false });

  // Keyboard shortcuts.
  window.addEventListener('keydown', (ev) => {
    if (ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT' || ev.target.tagName === 'TEXTAREA')) return;
    const step = 0.05;
    if (ev.key === 'ArrowLeft') { nudgeSelected(state, -step, 0); rerender(); }
    else if (ev.key === 'ArrowRight') { nudgeSelected(state, step, 0); rerender(); }
    else if (ev.key === 'ArrowUp') { nudgeSelected(state, 0, -step); rerender(); }
    else if (ev.key === 'ArrowDown') { nudgeSelected(state, 0, step); rerender(); }
    else if (ev.key === '+' || ev.key === '=') { zoomSelected(state, 0.1); refreshPanelControls(state); rerender(); }
    else if (ev.key === '-' || ev.key === '_') { zoomSelected(state, -0.1); refreshPanelControls(state); rerender(); }
    else if (/^[1-6]$/.test(ev.key)) {
      const idx = Number(ev.key) - 1;
      if (state.panels[idx]) { state.selected = idx; refreshPanelControls(state); rerender(); }
    }
  });

  refreshSlots(state);
  refreshPanelControls(state);
}

export function applyLook(state, look) {
  Object.assign(state, look);
  refreshPanels(state);
}

function syncLookControls(state) {
  const set = (id, v) => { const el = $(id); if (el) el.value = v; };
  set('glowSlider', state.glow);
  set('grainSlider', state.grain);
  set('vignetteSlider', state.vignette);
  set('halftoneSlider', state.halftone);
  set('borderSlider', state.border);
  set('sunSlider', state.sunScale);
  const out = (id, text) => { const el = document.querySelector(`[data-out="${id}"]`); if (el) el.textContent = text; };
  out('glowSlider', `${state.glow}%`);
  out('grainSlider', `${state.grain}%`);
  out('vignetteSlider', `${state.vignette}%`);
  out('halftoneSlider', `${state.halftone}%`);
  out('borderSlider', state.border === 0 ? 'off' : `${state.border}px`);
  out('sunSlider', `${state.sunScale.toFixed(1)}×`);
  const tog = (id, v) => { const el = $(id); if (el) el.checked = v; };
  tog('sunToggle', state.sunOn);
  tog('skylineToggle', state.skylineOn);
  tog('badgesToggle', state.badgesOn);
}

export function refreshPanelControls(state) {
  const note = $('panelNote');
  const p = state.panels[state.selected];
  if (note) {
    note.textContent = p
      ? `Panel ${state.selected + 1} · ${p.name} — click a panel or drag its photo`
      : 'No panel selected';
  }
  const set = (id, v) => { const el = $(id); if (el) el.value = v; };
  set('zoomSlider', p?.zoom ?? 1);
  set('oxSlider', p?.ox ?? 0);
  set('oySlider', p?.oy ?? 0);
  const out = (id, text) => { const el = document.querySelector(`[data-out="${id}"]`); if (el) el.textContent = text; };
  out('zoomSlider', `${(p?.zoom ?? 1).toFixed(2)}×`);
  out('oxSlider', (p?.ox ?? 0).toFixed(2));
  out('oySlider', (p?.oy ?? 0).toFixed(2));
  if (state._redrawFilters) state._redrawFilters();
}

// Re-bind helpers: after a chip row is rebuilt its click handlers are the
// fresh ones, so these just re-render the row with the current active value.
function initEditorSizeButtons(state, canvas, rerender) {
  const wrap = $('sizeButtons');
  if (!wrap) return;
  chipRow(wrap, Object.entries(SIZES).map(([k, v]) => [k, v.label]), state.size, (v) => {
    state.size = v;
    refreshPanels(state);
    initEditorSizeButtons(state, canvas, rerender);
    render(state, canvas);
    refreshPanelControls(state);
  });
}
function initEditorLayoutChips(state, canvas, rerender) {
  const wrap = $('layoutChips');
  if (!wrap) return;
  chipRow(wrap, Object.keys(LAYOUTS).map((k) => [k, k]), state.layout, (v) => {
    state.layout = v;
    refreshPanels(state);
    initEditorLayoutChips(state, canvas, rerender);
    render(state, canvas);
    refreshPanelControls(state);
  });
}
function initEditorGradeChips(state, canvas, rerender) {
  const wrap = $('gradeChips');
  if (!wrap) return;
  chipRow(wrap, Object.entries(GRADES).map(([k, g]) => [k, g.name]), state.grade, (v) => {
    state.grade = v;
    initEditorGradeChips(state, canvas, rerender);
    render(state, canvas);
  });
}
function initEditorTitleChips(state, canvas, rerender) {
  const wrap = $('titleStyleChips');
  if (!wrap) return;
  chipRow(wrap, Object.keys(TITLE_STYLES).map((k) => [k, k]), state.titleStyle, (v) => {
    state.titleStyle = v;
    initEditorTitleChips(state, canvas, rerender);
    render(state, canvas);
  });
}
function initEditorCaptionChips(state, canvas, rerender) {
  const wrap = $('captionPresets');
  if (!wrap) return;
  chipRow(wrap, CAPTION_PRESETS.map((p) => [p.title, p.title]), state.caption, (v) => {
    const p = CAPTION_PRESETS.find((x) => x.title === v);
    if (!p) return;
    state.caption = p.title;
    state.subtitle = p.subtitle;
    state.grade = p.grade;
    const ti = $('titleInput'); if (ti) ti.value = p.title;
    const si = $('subtitleInput'); if (si) si.value = p.subtitle;
    initEditorCaptionChips(state, canvas, rerender);
    render(state, canvas);
  });
}
