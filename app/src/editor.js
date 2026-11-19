// Vice City Nights — the editor. Owns the app state, the photo slots, the
// panel picking and dragging, the sliders and chips, and the PNG export.
// The cover itself is drawn by cover.js; this file only drives it.

import { GRADES, LAYOUTS, SIZES, TITLE_STYLES, drawCover, freshPanels, renderCoverCanvas } from './cover.js';

export const SAMPLE_PHOTOS = ['pier', 'boulevard'];

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

export function loadSamplePhotos(state, onDone) {
  const jobs = SAMPLE_PHOTOS.map((name) => loadImage(`./samples/${name}.jpg`));
  Promise.all(jobs).then((imgs) => {
    state.photos = [imgs[0], imgs[1], null, null];
    state.panels = freshPanels(state.layout, 2);
    onDone(null);
  }).catch((err) => onDone(err));
}

function loadUserPhotos(state, files, onDone) {
  const imgs = [...files].slice(0, 4);
  if (!imgs.length) return;
  let done = 0;
  const loaded = [];
  imgs.forEach((file, i) => {
    const url = URL.createObjectURL(file);
    loadImage(url).then((img) => {
      loaded[i] = img;
    }).catch(() => {
      loaded[i] = null;
    }).finally(() => {
      done += 1;
      if (done === imgs.length) {
        const fresh = loaded.filter(Boolean);
        fresh.forEach((img, j) => { state.photos[j] = img; });
        const count = state.photos.filter(Boolean).length;
        state.panels = freshPanels(state.layout, count);
        onDone(fresh.length);
      }
    });
  });
}

function panelPoint(state, canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  const layout = LAYOUTS[state.layout];
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const p = layout.panels[i];
    if (x >= p.x * canvas.width && x < (p.x + p.w) * canvas.width &&
        y >= p.y * canvas.height && y < (p.y + p.h) * canvas.height) {
      return { index: i, x, y };
    }
  }
  return { index: -1, x, y };
}

function chipRow(el, options, current, onPick) {
  el.innerHTML = '';
  Object.entries(options).forEach(([key, value]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (key === current ? ' active' : '');
    b.textContent = value.label;
    b.addEventListener('click', () => onPick(key));
    el.appendChild(b);
  });
}

export function initEditor(state, canvas, els, render) {
  const $ = (id) => document.getElementById(id);

  // Photo slots: click one to replace it, the number shows its panel order.
  function drawSlots() {
    const wrap = $('photoSlots');
    wrap.innerHTML = '';
    state.photos.forEach((img, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot' + (img ? ' assigned' : '');
      b.title = img ? `Photo ${i + 1} — click to replace` : `Photo ${i + 1} — empty`;
      b.innerHTML = `<span class="slot-num">${i + 1}</span>` +
        (img ? `<img alt="Photo ${i + 1}" src="${img.src}">` : '<span class="slot-empty">+</span>');
      b.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => {
          if (!input.files?.length) return;
          loadImage(URL.createObjectURL(input.files[0])).then((loaded) => {
            state.photos[i] = loaded;
            const count = state.photos.filter(Boolean).length;
            state.panels = freshPanels(state.layout, count);
            drawSlots();
            render();
          });
        };
        input.click();
      });
      wrap.appendChild(b);
    });
  }

  function syncPanelControls() {
    const panel = state.panels[state.selected];
    const names = LAYOUTS[state.layout].panels.map((p) => p.name);
    $('selectedNote').textContent = panel
      ? `Panel ${state.selected + 1} — ${names[state.selected]}` : 'No panel selected';
    if (!panel) return;
    $('zoomRange').value = Math.round(panel.zoom * 100);
    $('zoomVal').textContent = `${panel.zoom.toFixed(2)}×`;
    $('posXRange').value = Math.round(panel.ox * 100);
    $('posXVal').textContent = String(Math.round(panel.ox * 100));
    $('posYRange').value = Math.round(panel.oy * 100);
    $('posYVal').textContent = String(Math.round(panel.oy * 100));
  }

  function syncChips() {
    chipRow($('layoutChips'), LAYOUTS, state.layout, (key) => {
      state.layout = key;
      state.panels = freshPanels(key, state.photos.filter(Boolean).length);
      state.selected = 0;
      syncChips();
      syncPanelControls();
      render();
    });
    chipRow($('gradeChips'), GRADES, state.grade, (key) => {
      state.grade = key;
      syncChips();
      render();
    });
    chipRow($('titleChips'), TITLE_STYLES, state.titleStyle, (key) => {
      state.titleStyle = key;
      syncChips();
      render();
    });
  }

  // Size buttons: each size carries its own natural layout.
  document.querySelectorAll('.size-btn').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      state.size = b.dataset.size;
      const size = SIZES[state.size];
      canvas.width = size.w;
      canvas.height = size.h;
      state.layout = size.layout;
      state.panels = freshPanels(state.layout, state.photos.filter(Boolean).length);
      state.selected = 0;
      syncChips();
      syncPanelControls();
      render();
    });
  });

  $('photoInput').addEventListener('change', (ev) => {
    loadUserPhotos(state, ev.target.files, (n) => {
      drawSlots();
      render();
      els.status.textContent = n ? `${n} photo(s) loaded — drag any panel to frame it.` : 'Those files did not load as images.';
    });
    ev.target.value = '';
  });
  $('sampleBtn').addEventListener('click', () => {
    loadSamplePhotos(state, (err) => {
      if (err) { els.status.textContent = 'Sample photos failed to load.'; return; }
      drawSlots();
      render();
      els.status.textContent = 'Sample photos loaded — swap in your own any time.';
    });
  });
  $('onePhotoAll').addEventListener('change', (ev) => {
    state.onePhotoAll = ev.target.checked;
    render();
  });

  $('glowRange').addEventListener('input', (ev) => {
    state.glow = Number(ev.target.value);
    $('glowVal').textContent = String(state.glow);
    render();
  });

  $('zoomRange').addEventListener('input', (ev) => {
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = Number(ev.target.value) / 100;
    $('zoomVal').textContent = `${panel.zoom.toFixed(2)}×`;
    render();
  });
  $('posXRange').addEventListener('input', (ev) => {
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.ox = Number(ev.target.value) / 100;
    $('posXVal').textContent = ev.target.value;
    render();
  });
  $('posYRange').addEventListener('input', (ev) => {
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.oy = Number(ev.target.value) / 100;
    $('posYVal').textContent = ev.target.value;
    render();
  });
  $('fitBtn').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = 1;
    panel.ox = 0;
    panel.oy = 0;
    syncPanelControls();
    render();
  });
  $('fillBtn').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = 1.6;
    panel.ox = 0;
    panel.oy = 0;
    syncPanelControls();
    render();
  });

  $('captionInput').addEventListener('input', (ev) => {
    state.caption = ev.target.value;
    render();
  });
  $('subtitleInput').addEventListener('input', (ev) => {
    state.subtitle = ev.target.value;
    render();
  });
  $('titleSizeRange').addEventListener('input', (ev) => {
    state.titleScale = Number(ev.target.value) / 100;
    $('titleSizeVal').textContent = `${ev.target.value}%`;
    render();
  });

  // Drag a panel's photo to reposition it; a click without a drag selects it.
  let drag = null;
  canvas.addEventListener('pointerdown', (ev) => {
    const hit = panelPoint(state, canvas, ev.clientX, ev.clientY);
    if (hit.index < 0) return;
    state.selected = hit.index;
    syncPanelControls();
    render();
    canvas.setPointerCapture(ev.pointerId);
    drag = { index: hit.index, startX: ev.clientX, startY: ev.clientY, moved: false, ox: 0, oy: 0 };
    const panel = state.panels[hit.index];
    if (panel) { drag.ox = panel.ox; drag.oy = panel.oy; }
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const dx = (ev.clientX - drag.startX) / rect.width;
    const dy = (ev.clientY - drag.startY) / rect.height;
    if (Math.abs(ev.clientX - drag.startX) + Math.abs(ev.clientY - drag.startY) > 4) drag.moved = true;
    const panel = state.panels[drag.index];
    if (!panel || !drag.moved) return;
    const layout = LAYOUTS[state.layout].panels[drag.index];
    panel.ox = Math.max(-1, Math.min(1, drag.ox + dx / Math.max(layout.w, 0.2)));
    panel.oy = Math.max(-1, Math.min(1, drag.oy + dy / Math.max(layout.h, 0.2)));
    syncPanelControls();
    render();
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = Math.max(1, Math.min(3, panel.zoom - Math.sign(ev.deltaY) * 0.08));
    syncPanelControls();
    render();
  }, { passive: false });

  $('exportBtn').addEventListener('click', () => {
    const btn = $('exportBtn');
    btn.disabled = true;
    els.status.textContent = 'Rendering your cover…';
    // Let the status paint before the (fast but synchronous) render.
    setTimeout(() => {
      try {
        const out = renderCoverCanvas(state);
        out.toBlob((blob) => {
          if (!blob) throw new Error('the browser could not make a PNG');
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `vice-city-nights-${state.size}.png`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 5000);
          els.status.textContent = `Exported ${state.size} PNG — share it anywhere.`;
        }, 'image/png');
      } catch (err) {
        els.status.textContent = `Export failed: ${err.message}`;
      } finally {
        btn.disabled = false;
      }
    }, 30);
  });

  drawSlots();
  syncChips();
  syncPanelControls();
  return { drawSlots, syncPanelControls, syncChips };
}

// Redraw the preview canvas from state (used by main.js and shots.js).
export function renderPreview(state, canvas) {
  drawCover(canvas.getContext('2d'), state, canvas.width, canvas.height);
}
