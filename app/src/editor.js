// Vice City Nights v2 — editor state + UI wiring.
// Owns the state object, builds the chips/slots, wires every control,
// pointer + keyboard interaction on the canvas, and the PNG export.

import {
  SIZES, LAYOUTS, GRADES, TITLE_STYLES, PANEL_FILTERS,
  CAPTION_PRESETS, LOOK_PRESETS, freshPanels, drawCover,
} from './cover.js';

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
    swapArm: false,
  };
}

function $(id) { return document.getElementById(id); }

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

export function loadSamplePhotos(state) {
  const urls = ['./samples/pier.jpg', './samples/boulevard.jpg'];
  return Promise.all(urls.map((u) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ img, url: u, name: u.split('/').pop() });
    img.onerror = () => resolve(null);
    img.src = u;
  }))).then((loaded) => {
    loaded.forEach((p, i) => { if (p) state.photos[i] = p; });
    if (state.onePhotoAll && state.photos[0]) {
      state.photos = state.photos.map(() => state.photos[0]);
    }
    state.panels = freshPanels(state.layout, state.photos.filter(Boolean).length);
    return state;
  });
}

export function initEditor(state, canvas, render) {
  const photoCount = () => state.photos.filter(Boolean).length;

  function refreshPanels(keepPhotos) {
    const n = photoCount();
    const old = state.panels;
    state.panels = freshPanels(state.layout, n);
    if (keepPhotos) {
      state.panels.forEach((p, i) => {
        if (old[i]) { p.zoom = old[i].zoom; p.ox = old[i].ox; p.oy = old[i].oy; p.filter = old[i].filter; }
      });
    }
    if (state.selected >= state.panels.length) state.selected = 0;
  }

  function setStatus(msg) { const s = $('status'); if (s) s.textContent = msg; }

  // ---- chips ----
  function buildChips(containerId, items, activeKey, onPick) {
    const box = $(containerId);
    if (!box) return;
    box.innerHTML = '';
    Object.entries(items).forEach(([key, val]) => {
      const b = el('button', 'chip' + (key === activeKey ? ' active' : ''), val.name || val);
      b.type = 'button';
      b.dataset.key = key;
      b.addEventListener('click', () => { onPick(key); });
      box.appendChild(b);
    });
  }

  function refreshChips() {
    buildChips('layoutChips', Object.fromEntries(Object.entries(LAYOUTS).map(([k, v]) => [k, { name: k[0].toUpperCase() + k.slice(1) }])), state.layout, (k) => {
      state.layout = k; refreshPanels(true); refreshChips(); refreshPanelNote(); render();
    });
    buildChips('gradeChips', GRADES, state.grade, (k) => {
      state.grade = k; refreshChips(); render();
    });
    buildChips('titleChips', TITLE_STYLES, state.titleStyle, (k) => {
      state.titleStyle = k; refreshChips(); render();
    });
    buildChips('filterChips', PANEL_FILTERS, state.panels[state.selected]?.filter || 'none', (k) => {
      const p = state.panels[state.selected];
      if (p) p.filter = k;
      refreshChips(); render();
    });
  }

  // ---- photo slots ----
  function refreshSlots() {
    const box = $('photoSlots');
    if (!box) return;
    box.innerHTML = '';
    state.photos.forEach((p, i) => {
      const slot = el('div', 'slot' + (p ? ' assigned' : ''));
      slot.dataset.slot = i;
      if (p) {
        const im = el('img');
        im.src = p.url; im.alt = p.name || `Photo ${i + 1}`;
        slot.appendChild(im);
        const tag = el('span', 'slot-tag', `${i + 1}`);
        slot.appendChild(tag);
        const heroBtn = el('button', 'slot-hero', '★');
        heroBtn.type = 'button';
        heroBtn.title = 'Use as hero photo';
        heroBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          state.panels.forEach((pn) => { if (pn.photo === i) pn.photo = state.panels[0]?.photo ?? null; });
          if (state.panels[0]) state.panels[0].photo = i;
          render();
        });
        slot.appendChild(heroBtn);
      } else {
        slot.appendChild(el('span', 'slot-plus', '+'));
        slot.appendChild(el('span', 'slot-tag', `${i + 1}`));
      }
      slot.addEventListener('click', () => {
        const input = $('addPhotos');
        if (input) { input.dataset.slot = i; input.click(); }
      });
      box.appendChild(slot);
    });
  }

  function addPhotoFiles(files, slotIndex) {
    const list = [...files].filter((f) => f.type.startsWith('image/'));
    if (!list.length) { setStatus('No image files in that selection.'); return; }
    let idx = slotIndex != null && slotIndex !== '' ? Number(slotIndex) : state.photos.findIndex((p) => !p);
    if (idx < 0) idx = 0;
    let done = 0;
    list.forEach((f) => {
      if (idx >= state.photos.length) return;
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        state.photos[idx] = { img, url, name: f.name };
        idx += 1; done += 1;
        if (state.onePhotoAll && state.photos[0]) {
          state.photos = state.photos.map(() => state.photos[0]);
        }
        refreshPanels(true);
        refreshSlots(); refreshPanelNote(); render();
        setStatus(`Loaded ${done} photo${done > 1 ? 's' : ''} — ${photoCount()} of 6 slots filled.`);
      };
      img.src = url;
    });
  }

  // ---- panel note + sliders ----
  function refreshPanelNote() {
    const note = $('panelNote');
    const p = state.panels[state.selected];
    if (!note || !p) return;
    const layout = LAYOUTS[state.layout];
    const name = layout[state.selected]?.name || p.name || `Panel ${state.selected + 1}`;
    note.textContent = state.swapArm
      ? `Swap armed — click another panel to exchange photos with Panel ${state.selected + 1} · ${name}.`
      : `Panel ${state.selected + 1} · ${name} — click a panel or drag its photo.`;
    const z = $('zoomRange'); if (z) z.value = p.zoom;
    const px = $('posXRange'); if (px) px.value = p.ox;
    const py = $('posYRange'); if (py) py.value = p.oy;
  }

  function bindRange(id, get, set) {
    const n = $(id);
    if (!n) return;
    n.value = get();
    n.addEventListener('input', () => { set(Number(n.value)); render(); });
  }

  bindRange('glowRange', () => state.glow, (v) => { state.glow = v; });
  bindRange('grainRange', () => state.grain, (v) => { state.grain = v; });
  bindRange('vignetteRange', () => state.vignette, (v) => { state.vignette = v; });
  bindRange('halftoneRange', () => state.halftone, (v) => { state.halftone = v; });
  bindRange('borderRange', () => state.border, (v) => { state.border = v; });
  bindRange('sunScaleRange', () => state.sunScale, (v) => { state.sunScale = v; });
  bindRange('titleScaleRange', () => state.titleScale, (v) => { state.titleScale = v; });
  bindRange('zoomRange', () => state.panels[state.selected]?.zoom || 1.15, (v) => {
    const p = state.panels[state.selected]; if (p) p.zoom = v;
  });
  bindRange('posXRange', () => state.panels[state.selected]?.ox || 0, (v) => {
    const p = state.panels[state.selected]; if (p) p.ox = v;
  });
  bindRange('posYRange', () => state.panels[state.selected]?.oy || 0, (v) => {
    const p = state.panels[state.selected]; if (p) p.oy = v;
  });

  function bindToggle(id, get, set) {
    const n = $(id);
    if (!n) return;
    n.checked = get();
    n.addEventListener('change', () => { set(n.checked); render(); });
  }
  bindToggle('sunToggle', () => state.sunOn, (v) => { state.sunOn = v; });
  bindToggle('skylineToggle', () => state.skylineOn, (v) => { state.skylineOn = v; });
  bindToggle('badgesToggle', () => state.badgesOn, (v) => { state.badgesOn = v; });
  bindToggle('onePhotoAll', () => state.onePhotoAll, (v) => {
    state.onePhotoAll = v;
    if (v && state.photos[0]) state.photos = state.photos.map(() => state.photos[0]);
    refreshPanels(true); refreshSlots(); render();
  });

  // ---- size buttons ----
  const sizeBox = $('sizeBtns');
  if (sizeBox) {
    sizeBox.querySelectorAll('button').forEach((b) => {
      b.addEventListener('click', () => {
        state.size = b.dataset.size;
        const natural = SIZES[state.size].natural;
        if (state.layout !== natural && !LAYOUTS[state.layout]) state.layout = natural;
        sizeBox.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
        canvas.width = SIZES[state.size].w;
        canvas.height = SIZES[state.size].h;
        refreshChips(); render();
      });
    });
  }

  // ---- caption ----
  const titleInput = $('titleInput');
  if (titleInput) {
    titleInput.value = state.caption;
    titleInput.addEventListener('input', () => { state.caption = titleInput.value; render(); });
  }
  const subInput = $('subtitleInput');
  if (subInput) {
    subInput.value = state.subtitle;
    subInput.addEventListener('input', () => { state.subtitle = subInput.value; render(); });
  }

  // Caption presets.
  const capBox = $('captionPresets');
  if (capBox) {
    CAPTION_PRESETS.forEach((p) => {
      const b = el('button', 'chip', p.title);
      b.type = 'button';
      b.addEventListener('click', () => {
        state.caption = p.title; state.subtitle = p.subtitle; state.grade = p.grade;
        if (titleInput) titleInput.value = p.title;
        if (subInput) subInput.value = p.subtitle;
        refreshChips(); render();
        setStatus(`Caption preset "${p.title}" applied.`);
      });
      capBox.appendChild(b);
    });
  }

  // Look presets.
  const lookBox = $('lookPresets');
  if (lookBox) {
    LOOK_PRESETS.forEach((p) => {
      const b = el('button', 'chip look', p.name);
      b.type = 'button';
      b.addEventListener('click', () => {
        state.grade = p.grade; state.layout = p.layout; state.titleStyle = p.titleStyle;
        state.skylineOn = p.skylineOn; state.vignette = p.vignette;
        const st = $('skylineToggle'); if (st) st.checked = p.skylineOn;
        const vg = $('vignetteRange'); if (vg) vg.value = p.vignette;
        refreshPanels(true); refreshChips(); render();
        setStatus(`Look "${p.name}" applied.`);
      });
      lookBox.appendChild(b);
    });
  }

  // Randomize.
  const randBtn = $('randomBtn');
  if (randBtn) {
    randBtn.addEventListener('click', () => {
      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      state.grade = pick(Object.keys(GRADES));
      state.layout = pick(Object.keys(LAYOUTS));
      state.titleStyle = pick(Object.keys(TITLE_STYLES));
      state.glow = 40 + Math.floor(Math.random() * 60);
      state.grain = 30 + Math.floor(Math.random() * 60);
      const g = $('glowRange'); if (g) g.value = state.glow;
      const gr = $('grainRange'); if (gr) gr.value = state.grain;
      refreshPanels(true); refreshChips(); render();
      setStatus(`Surprise! ${GRADES[state.grade].name} · ${state.layout} · ${TITLE_STYLES[state.titleStyle].name}.`);
    });
  }

  // Fit / Fill / Swap.
  const fitBtn = $('fitBtn');
  if (fitBtn) fitBtn.addEventListener('click', () => {
    const p = state.panels[state.selected]; if (!p) return;
    p.zoom = 1; p.ox = 0; p.oy = 0; refreshPanelNote(); render();
  });
  const fillBtn = $('fillBtn');
  if (fillBtn) fillBtn.addEventListener('click', () => {
    const p = state.panels[state.selected]; if (!p) return;
    p.zoom = 1.6; p.ox = 0; p.oy = 0; refreshPanelNote(); render();
  });
  const swapBtn = $('swapBtn');
  if (swapBtn) swapBtn.addEventListener('click', () => {
    state.swapArm = !state.swapArm;
    swapBtn.classList.toggle('armed', state.swapArm);
    refreshPanelNote();
  });

  // File inputs.
  const addInput = $('addPhotos');
  if (addInput) {
    addInput.addEventListener('change', () => {
      addPhotoFiles(addInput.files, addInput.dataset.slot || '');
      addInput.value = '';
      addInput.dataset.slot = '';
    });
  }
  const samplesBtn = $('loadSamples');
  if (samplesBtn) {
    samplesBtn.addEventListener('click', () => {
      loadSamplePhotos(state).then(() => {
        refreshSlots(); refreshPanelNote(); render();
        setStatus(`Sample photos loaded — ${photoCount()} of 6 slots filled.`);
      });
    });
  }

  // Export scale + export.
  const scaleSel = $('scaleSelect');
  if (scaleSel) {
    scaleSel.addEventListener('change', () => { state.exportScale = Number(scaleSel.value); });
  }
  const exportBtn = $('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      import('./cover.js').then(({ renderCoverCanvas, SIZES: SZ }) => {
        const out = renderCoverCanvas(state);
        out.toBlob((blob) => {
          if (!blob) { setStatus('Export failed — canvas is empty.'); return; }
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `vice-city-nights-${state.size}.png`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 5000);
          const s = SZ[state.size];
          setStatus(`Exported ${s.w * state.exportScale}×${s.h * state.exportScale} PNG — vice-city-nights-${state.size}.png`);
        }, 'image/png');
      });
    });
  }

  // ---- canvas pointer: select / drag / wheel zoom ----
  function panelAt(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    const x = (cx - rect.left) / rect.width;
    const y = (cy - rect.top) / rect.height;
    const layout = LAYOUTS[state.layout];
    for (let i = layout.length - 1; i >= 0; i--) {
      const r = layout[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
    }
    return 0;
  }

  let drag = null;
  canvas.addEventListener('pointerdown', (ev) => {
    const i = panelAt(ev.clientX, ev.clientY);
    if (state.swapArm) {
      const a = state.panels[state.selected];
      const b = state.panels[i];
      if (a && b && a !== b) {
        const tmp = a.photo; a.photo = b.photo; b.photo = tmp;
        setStatus(`Swapped photos of Panel ${state.selected + 1} and Panel ${i + 1}.`);
      }
      state.swapArm = false;
      const sb = $('swapBtn'); if (sb) sb.classList.remove('armed');
      state.selected = i; refreshPanelNote(); refreshChips(); render();
      return;
    }
    state.selected = i;
    refreshPanelNote(); refreshChips();
    const p = state.panels[i];
    drag = { x: ev.clientX, y: ev.clientY, panel: p };
    canvas.setPointerCapture(ev.pointerId);
    render();
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!drag || !drag.panel) return;
    const rect = canvas.getBoundingClientRect();
    const p = drag.panel;
    const layout = LAYOUTS[state.layout][state.selected];
    const pw = layout.w * rect.width;
    const ph = layout.h * rect.height;
    p.ox += ((ev.clientX - drag.x) / Math.max(1, pw)) * 2;
    p.oy += ((ev.clientY - drag.y) / Math.max(1, ph)) * 2;
    p.ox = Math.max(-1, Math.min(1, p.ox));
    p.oy = Math.max(-1, Math.min(1, p.oy));
    drag.x = ev.clientX; drag.y = ev.clientY;
    refreshPanelNote();
    render();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const p = state.panels[state.selected];
    if (!p) return;
    p.zoom = Math.max(1, Math.min(3, p.zoom + (ev.deltaY < 0 ? 0.1 : -0.1)));
    refreshPanelNote();
    render();
  }, { passive: false });

  // ---- keyboard ----
  document.addEventListener('keydown', (ev) => {
    if (ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT' || ev.target.tagName === 'TEXTAREA')) return;
    const p = state.panels[state.selected];
    if (!p) return;
    const step = 0.05;
    if (ev.key === 'ArrowLeft') { p.ox = Math.max(-1, p.ox - step); render(); }
    else if (ev.key === 'ArrowRight') { p.ox = Math.min(1, p.ox + step); render(); }
    else if (ev.key === 'ArrowUp') { p.oy = Math.max(-1, p.oy - step); render(); }
    else if (ev.key === 'ArrowDown') { p.oy = Math.min(1, p.oy + step); render(); }
    else if (ev.key === '+' || ev.key === '=') { p.zoom = Math.min(3, p.zoom + 0.1); refreshPanelNote(); render(); }
    else if (ev.key === '-') { p.zoom = Math.max(1, p.zoom - 0.1); refreshPanelNote(); render(); }
    else if (/^[1-6]$/.test(ev.key)) {
      const i = Number(ev.key) - 1;
      if (i < state.panels.length) { state.selected = i; refreshPanelNote(); refreshChips(); render(); }
    }
  });

  refreshChips();
  refreshSlots();
  refreshPanelNote();
  setStatus('Ready — add your photos or load the samples, then export your cover.');
  return { refreshSlots, refreshPanelNote, refreshChips, setStatus };
}
