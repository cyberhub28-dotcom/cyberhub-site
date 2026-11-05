/* ================= Theme ================= */
let themeSetByApp = false;
function applyTheme() {
  const root = document.documentElement;
  const pal = S ? S.settings.palette : 'midnight';
  if (pal === 'midnight') root.removeAttribute('data-palette'); else root.setAttribute('data-palette', pal);
  const mode = S ? S.settings.mode : 'auto';
  if (mode === 'light' || mode === 'dark') { root.setAttribute('data-theme', mode); themeSetByApp = true; }
  else if (themeSetByApp) { root.removeAttribute('data-theme'); themeSetByApp = false; }
  applyStyle();
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim() || '#F5F4F7');
}

/* ================= Small UI pieces ================= */
function ringSVG(pct, size, stroke) {
  size = size || 52; stroke = stroke || 5;
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = clamp(pct, 0, 1) * c;
  return '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true"><circle class="trk" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-width="' + stroke + '"/><circle class="val" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-width="' + stroke + '" stroke-dasharray="' + v.toFixed(2) + ' ' + c.toFixed(2) + '"' + (v < .5 ? ' visibility="hidden"' : '') + '/></svg>';
}
let toastTimer = null;
function toast(msg, undo) {
  const old = $('.toast'); if (old) old.remove();
  clearTimeout(toastTimer);
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
  t.innerHTML = '<span>' + esc(msg) + '</span>' + (undo ? '<button type="button">Undo</button>' : '');
  if (undo) t.querySelector('button').onclick = () => { undo(); t.remove(); };
  document.body.appendChild(t);
  toastTimer = setTimeout(() => t.remove(), undo ? 6000 : 2800);
}
function lock(on) { document.documentElement.classList.toggle('locked', !!($('.scrim') || on)); }

/* A question ("Delete this file?", "Replace your plan?") opens the same frosted glass card as every other window:
   it rises from the bottom of the screen you're looking at, with the answer buttons at the bottom. */
function askConfirm(title, message, okLabel, danger) {
  return new Promise(res => {
    const opener = document.activeElement;
    const sc = document.createElement('div'); sc.className = 'scrim confirm'; sc.style.zIndex = 120;
    sc.innerHTML = '<div class="sheet dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-m"><h3 id="dlg-t">' + esc(title) + '</h3><p id="dlg-m">' + esc(message) + '</p><div class="actions"><button class="btn ' + (danger ? 'danger solid' : 'primary') + '" type="button" data-r="1">' + esc(okLabel || 'OK') + '</button><button class="btn" type="button" data-r="0">Cancel</button></div></div>';
    let over = false;
    const done = v => {
      if (over) return; over = true;
      document.removeEventListener('keydown', key);
      sc.className = 'scrim-gone confirm show'; lock();
      if (reduceMotion()) sc.remove(); else { requestAnimationFrame(() => sc.classList.remove('show')); setTimeout(() => sc.remove(), 460); }
      try { if (opener && opener.isConnected && opener.focus) opener.focus({ preventScroll: true }); } catch (e) {}
      res(v);
    };
    const key = e => { if (e.key === 'Escape') done(false); };
    sc.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (b) done(b.dataset.r === '1'); else if (e.target === sc) done(false); });
    document.addEventListener('keydown', key);
    document.body.appendChild(sc); lock(true);
    if (reduceMotion()) sc.classList.add('show'); else requestAnimationFrame(() => requestAnimationFrame(() => sc.classList.add('show')));
    sc.querySelector('[data-r="1"]').focus({ preventScroll: true });
  });
}

/* ---------- Form builder ---------- */
function fieldHTML(f, v) {
  const id = 'f-' + f.k;
  const wrap = (inner, noLabel) => '<div class="field" data-k="' + f.k + '">' + (noLabel ? '' : '<label for="' + id + '">' + esc(f.label) + '</label>') + inner + (f.hint ? '<div class="hint">' + esc(f.hint) + '</div>' : '') + '</div>';
  switch (f.type) {
    case 'select': return wrap('<select class="input" id="' + id + '">' + f.options.map(o => { const ov = typeof o === 'object' ? o.v : o, ol = typeof o === 'object' ? o.l : o; return '<option value="' + esc(ov) + '"' + (String(v) === String(ov) ? ' selected' : '') + '>' + esc(ol) + '</option>'; }).join('') + '</select>');
    case 'seg': return '<div class="field" data-k="' + f.k + '"><span class="flabel" id="' + id + '-l">' + esc(f.label) + '</span><div class="seg" role="group" aria-labelledby="' + id + '-l" id="' + id + '" data-seg="' + f.k + '" data-value="' + esc(v) + '">' + f.options.map(o => '<button type="button" data-v="' + esc(o.v) + '" aria-pressed="' + (String(o.v) === String(v)) + '">' + esc(o.l) + '</button>').join('') + '</div></div>';
    case 'toggle': return '<div class="field" data-k="' + f.k + '"><label class="switch" for="' + id + '"><span class="flabel">' + esc(f.label) + '</span><input type="checkbox" role="switch" id="' + id + '"' + (v ? ' checked' : '') + '></label></div>';
    case 'textarea': return wrap('<textarea class="input" id="' + id + '" placeholder="' + esc(f.ph || '') + '">' + esc(v) + '</textarea>');
    case 'money': return wrap('<input class="input num" id="' + id + '" type="text" inputmode="decimal" autocomplete="off" placeholder="0" value="' + (v ? esc(v) : '') + '">');
    case 'number': return wrap('<input class="input num" id="' + id + '" type="number" inputmode="numeric" min="' + (f.min || 0) + '" max="' + (f.max || 999) + '" value="' + esc(v) + '">');
    default: return wrap('<input class="input" id="' + id + '" type="' + (f.type || 'text') + '"' + (f.type === 'email' ? ' inputmode="email" autocapitalize="off"' : '') + (f.type === 'url' ? ' inputmode="url" autocapitalize="off"' : '') + (f.type === 'text' || !f.type ? ' autocapitalize="words"' : '') + ' autocomplete="' + (f.ac || 'off') + '" placeholder="' + esc(f.ph || '') + '" value="' + esc(v) + '"' + (f.required ? ' required' : '') + '>');
  }
}
function readFields(fields, root) {
  const o = {};
  for (const f of fields) {
    const el = $('#f-' + f.k, root); if (!el) continue;
    if (f.type === 'seg') o[f.k] = el.dataset.value;
    else if (f.type === 'toggle') o[f.k] = el.checked;
    else if (f.type === 'money') o[f.k] = Math.max(0, num(el.value));
    else if (f.type === 'number') o[f.k] = num(el.value);
    else o[f.k] = el.value.trim();
  }
  return o;
}

/* ---------- Sheet ----------
   Same as the Credentials Tracker: a grab bar, the title, the fields, then Cancel and Save at the bottom.
   It slides up with the iPhone curve, pulls down to close, and a sheet opened right after another swaps in place. */
let sheetGoneAt = 0;
const reduceMotion = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
function openSheet(opts) {
  const reuse = Date.now() - sheetGoneAt < 160;
  $$('.scrim-gone').forEach(x => x.remove());
  const sc = document.createElement('div'); sc.className = 'scrim' + (reuse ? ' show' : '');
  const fields = opts.fields || [];
  /* iOS sheet: X on the left, the title, and a check on the right to save. A longer action ("Make PDF") is a wide button at the bottom.
     Short fields sit in one grouped list (label left, value right); notes and choice chips get their own rounded box. */
  const lbl = opts.saveLabel || 'Save', inNav = !!opts.onSave && ['Save', 'Add', 'Done'].includes(lbl);
  const del = opts.onDelete ? '<button class="delrow" type="button" data-del>' + esc(tcaseText(opts.deleteLabel || 'Delete')) + '</button>' : '';
  let fh = '', grp = '';
  const flush = () => { if (grp) { fh += '<div class="fgroup">' + grp + '</div>'; grp = ''; } };
  fields.forEach(f => (f.row || [f]).forEach(x => { const h = fieldHTML(x, (opts.values || {})[x.k]); if (x.type === 'textarea' || x.type === 'seg') { flush(); fh += h; } else grp += h; }));
  flush();
  sc.innerHTML = '<div class="sheet' + (reuse ? ' swap' : '') + '" role="dialog" aria-modal="true" aria-labelledby="sh-t"><div class="grab" aria-hidden="true"></div>' +
    '<form class="sheet-body" novalidate><div class="snav"><button class="sbtn" type="button" data-x aria-label="' + (opts.onSave ? 'Cancel' : 'Close') + '">' + SYM.x + '</button><h3 id="sh-t">' + esc(opts.title) + '</h3>' +
      (inNav ? '<button class="sbtn ok" type="button" data-save aria-label="' + esc(lbl) + '">' + SYM.ok + '</button>' : '<span></span>') + '</div>' +
    (opts.top || '') + fh + (opts.body || '') +
    (opts.onSave && !inNav ? '<div class="sheet-actions"><button class="btn primary" type="button" data-save>' + esc(tcaseText(lbl)) + '</button></div>' : '') + del + '</form></div>';
  const sheet = $('.sheet', sc);
  const flat = []; fields.forEach(f => f.row ? flat.push(...f.row) : flat.push(f));
  let closed = false;
  const opener = document.activeElement;
  const close = () => {
    if (closed) return; closed = true;
    document.removeEventListener('keydown', onKey);
    if (vv) { vv.removeEventListener('resize', onVV); vv.removeEventListener('scroll', fit); }
    sc.className = 'scrim-gone show'; sheetGoneAt = Date.now(); lock();
    setTimeout(() => { if (!sc.parentNode) return; if (reduceMotion()) { sc.remove(); return; } sc.classList.remove('show'); sheet.style.transform = ''; setTimeout(() => sc.remove(), 460); }, 90);
    if (opts.onClose) opts.onClose();
    /* focus goes back to the button that opened the window */
    setTimeout(() => { try { if (!$('.scrim') && opener && opener.isConnected && opener.focus && opener !== document.body) opener.focus({ preventScroll: true }); } catch (e) {} }, 0);
  };
  const values = () => readFields(flat, sc);
  const refreshShow = () => { const v = values(); flat.forEach(f => { if (f.showIf) { const el = $('.field[data-k="' + f.k + '"]', sc); if (el) el.hidden = !f.showIf(v); } }); };
  const save = () => {
    const v = values();
    for (const f of flat) if (f.required && !v[f.k]) { const el = $('#f-' + f.k, sc); el.focus(); el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 400); return; }
    if (opts.onSave(v, sc) !== false) close();
  };
  const onKey = e => { if (e.key === 'Escape' && !$('.scrim.confirm')) close(); };
  sc.addEventListener('click', e => {
    if (e.target === sc || e.target.closest('[data-x]')) return close();
    if (e.target.closest('[data-save]')) return save();
    const dr = e.target.closest('[data-del]');
    if (dr) {
      /* delete takes two taps: the first turns the row red and asks again, the second deletes (then a toast offers Undo) */
      if (opts.deleteAsks || dr.classList.contains('armed')) { clearTimeout(dr._t); opts.onDelete(close); return; }
      dr.classList.add('armed'); dr.textContent = tcaseText('Tap again to ' + ((opts.deleteLabel || 'Delete').split(' ')[0].toLowerCase() === 'remove' ? 'remove' : 'delete'));
      dr._t = setTimeout(() => { dr.classList.remove('armed'); dr.textContent = tcaseText(opts.deleteLabel || 'Delete'); }, 4000);
      return;
    }
    const sb = e.target.closest('.seg button');
    if (sb) { const seg = sb.parentElement; seg.dataset.value = sb.dataset.v; $$('button', seg).forEach(b => b.setAttribute('aria-pressed', String(b === sb))); refreshShow(); }
  });
  sc.addEventListener('change', refreshShow);
  $('form', sc).addEventListener('submit', e => { e.preventDefault(); if (opts.onSave) save(); });
  /* pull the sheet down by its top edge to close it */
  let y0 = null, t0 = 0, dy = 0;
  sheet.addEventListener('pointerdown', e => {
    if (e.button || e.target.closest('input,select,textarea,button,a,.seg,.ask,label')) return;
    if (e.clientY - sheet.getBoundingClientRect().top > 64 || sheet.scrollTop > 0) return;
    y0 = e.clientY; t0 = Date.now(); dy = 0; sheet.classList.add('dragging');
    try { sheet.setPointerCapture(e.pointerId); } catch (x) {}
  });
  sheet.addEventListener('pointermove', e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); sheet.style.transform = 'translateY(' + dy + 'px)'; sc.style.opacity = String(Math.max(.35, 1 - dy / 600)); });
  const endDrag = () => {
    if (y0 == null) return; const v = dy / Math.max(1, Date.now() - t0); y0 = null;
    sheet.classList.remove('dragging'); sc.style.opacity = '';
    if (dy > 120 || (dy > 30 && v > .6)) { sheet.style.transform = 'translateY(100%)'; close(); } else sheet.style.transform = '';
  };
  sheet.addEventListener('pointerup', endDrag); sheet.addEventListener('pointercancel', endDrag);
  /* keep the sheet above the iPhone keyboard, and the field you're typing in on screen */
  const vv = window.visualViewport;
  const fit = () => { if (!vv || closed) return; sc.style.top = Math.max(0, vv.offsetTop) + 'px'; sc.style.bottom = 'auto'; sc.style.height = vv.height + 'px'; };
  const keep = () => setTimeout(() => {
    const a = document.activeElement;
    if (!a || !sheet.contains(a) || !a.matches('input,textarea,select')) return;
    const r = a.getBoundingClientRect(), s = sheet.getBoundingClientRect();
    if (r.bottom > s.bottom - 20) sheet.scrollTop += r.bottom - s.bottom + 20;
    else if (r.top < s.top + 20) sheet.scrollTop -= s.top + 20 - r.top;
  }, 60);
  const onVV = () => { fit(); keep(); };
  if (vv) { vv.addEventListener('resize', onVV); vv.addEventListener('scroll', fit); }
  sheet.addEventListener('focusin', keep);
  document.addEventListener('keydown', onKey);
  document.body.appendChild(sc); lock(true); refreshShow(); fit();
  if (!reuse) requestAnimationFrame(() => requestAnimationFrame(() => sc.classList.add('show')));
  try { tcase(sc); } catch (e) {}
  if (opts.onMount) opts.onMount(sc, close);
  if (!isTouch()) { const first = $('.sheet-body input,.sheet-body textarea,.sheet-body select', sc); if (first && !opts.noFocus) first.focus({ preventScroll: true }); }
  return { el: sc, close };
}

