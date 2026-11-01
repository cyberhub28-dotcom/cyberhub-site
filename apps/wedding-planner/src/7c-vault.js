/* ================= Files vault: contracts, receipts, inspiration. Kept in the browser's on-device database. ================= */
const IMG = (() => {
  let dbp = null; const mem = {};
  const open = () => dbp || (dbp = new Promise((res, rej) => { try { const rq = indexedDB.open(KEY + '-files', 1); rq.onupgradeneeded = () => rq.result.createObjectStore('f'); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); } catch (e) { rej(e); } }));
  const tx = (mode, fn) => open().then(db => new Promise((res, rej) => { const t = db.transaction('f', mode), s = t.objectStore('f'); const r = fn(s); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }));
  return {
    /* true when the file is really stored on the phone; false when it only lives in memory until the page closes */
    put: (id, url) => tx('readwrite', s => s.put(url, id)).then(() => true).catch(() => { mem[id] = url; return false; }),
    keys: () => tx('readonly', s => s.getAllKeys()).then(k => (k || []).concat(Object.keys(mem))).catch(() => Object.keys(mem)),
    get: id => tx('readonly', s => s.get(id)).then(v => v || mem[id] || null).catch(() => mem[id] || null),
    del: id => tx('readwrite', s => s.delete(id)).catch(() => { delete mem[id]; }),
    clear: () => tx('readwrite', s => s.clear()).catch(() => {})
  };
})();
const DOC_TAGS = ['Contract', 'Receipt', 'Quote', 'Invoice', 'Inspiration', 'Marriage license', 'Vows', 'Menu', 'Day-of timeline', 'Floor plan', 'Other'];
const THUMB = Object.create(null);
const docKind = d => /pdf/.test(d.type) ? 'pdf' : /^image\//.test(d.type) ? 'image' : 'file';
const docExt = d => docKind(d) === 'pdf' ? 'pdf' : docKind(d) === 'image' ? 'jpg' : (d.ext || 'docx');
const fmtSize = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
function dataBytes(u) { const b = atob(String(u).split(',')[1] || ''), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
function docThumb(d) {
  if (docKind(d) === 'image') return '<img alt="" data-doc="' + esc(d.id) + '"' + (THUMB[d.id] ? ' src="' + esc(THUMB[d.id]) + '"' : '') + '>';
  return '<span class="ft">' + ic('file') + esc(docExt(d).toUpperCase()) + '</span>';
}
function docTile(d) {
  const v = d.vendorId && byId(S.vendors, d.vendorId);
  return '<button type="button" class="doc" data-act="doc-open" data-id="' + esc(d.id) + '"><span class="th">' + docThumb(d) + '<span class="tagb">' + esc(d.tag || 'Other') + '</span></span><b>' + esc(d.name || 'Untitled') + '</b><small>' + (v ? esc(vendorTitle(v)) : fmtSize(d.size || 0)) + '</small></button>';
}
function loadThumbs(scope) { $$('img[data-doc]:not([src])', scope).forEach(im => IMG.get('doc:' + im.dataset.doc).then(u => { if (u) { THUMB[im.dataset.doc] = u; im.src = u; } })); }
function vaultHTML() {
  const docs = (S.docs || []).slice().sort((a, b) => String(b.added).localeCompare(String(a.added)));
  return '<div class="card-head" style="margin:26px 0 10px"><h2 class="sect-title">Files &amp; photos</h2><span class="faint small num">' + docs.length + '</span></div>' +
    '<div class="vault">' + docs.map(docTile).join('') + '<button type="button" class="doc addd" data-act="doc-add"><span class="th"><span>' + ic('plus') + 'Add a file</span></span><b>&nbsp;</b></button></div>' +
    (docs.length ? '<div class="actions" style="margin-top:12px"><button class="btn" type="button" data-act="doc-bundle">' + ic('pdf') + 'Put several in one PDF</button></div>' : '') +
    '<p class="hint" style="margin:10px 0 0">Contracts, receipts, quotes, inspiration photos, your marriage license. Snap a photo or pick a PDF. Kept on this device only and included in your backup.</p>';
}
function pickFile(accept, cb) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept; inp.style.display = 'none';
  document.body.appendChild(inp);
  inp.onchange = () => { const f = inp.files && inp.files[0]; inp.remove(); if (f) cb(f); };
  inp.click();
}
function shrinkImage(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => { const max = 1600, k = Math.min(1, max / Math.max(im.width, im.height)); const cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
      const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); res(cv.toDataURL('image/jpeg', .74)); };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad image')); };
    im.src = url;
  });
}
function guessTag(name) {
  const t = String(name).toLowerCase();
  return /contract|agreement|signed/.test(t) ? 'Contract' : /receipt/.test(t) ? 'Receipt' : /quote|estimate|proposal/.test(t) ? 'Quote' : /invoice|bill/.test(t) ? 'Invoice' : /license|licence/.test(t) ? 'Marriage license' : /vow/.test(t) ? 'Vows' : /menu/.test(t) ? 'Menu' : /timeline|schedule|run of show/.test(t) ? 'Day-of timeline' : /floor|layout/.test(t) ? 'Floor plan' : /inspo|inspiration|idea|dress|cake|flower|bouquet|decor/.test(t) ? 'Inspiration' : '';
}
/* Pick first (the file chooser must open right on the tap), then name it. */
function addDoc(vendorId) {
  pickFile('image/*,application/pdf,.pdf,.docx,.doc,.txt', async f => {
    if (f.size > 25e6) { toast('That file is over 25 MB. Try a smaller copy.'); return; }
    let url;
    try {
      if (/^image\//.test(f.type) && !/svg|gif/.test(f.type)) url = await shrinkImage(f);
      else url = await new Promise((res, rej) => { const rd = new FileReader(); rd.onload = () => res(rd.result); rd.onerror = rej; rd.readAsDataURL(f); });
    } catch (e) { toast('Couldn’t read that file'); return; }
    const isImg = /^data:image\/jpeg/.test(url), base = String(f.name || '').replace(/\.[a-z0-9]+$/i, '');
    const d = { id: uid(), name: isImg && /^(image|img|photo|IMG_?\d*|PXL_?\d*)$/i.test(base) ? '' : base.slice(0, 60), type: isImg ? 'image/jpeg' : (/pdf/.test(f.type) || /\.pdf$/i.test(f.name) ? 'application/pdf' : f.type || 'application/octet-stream'), ext: (String(f.name).match(/\.([a-z0-9]+)$/i) || [])[1] || '', size: Math.round(url.length * .75), added: isoDay(new Date()), vendorId: vendorId || '', tag: '' };
    THUMB[d.id] = isImg ? url : null;
    $$('.scrim').forEach(s => s.remove()); lock();
    docForm(d, url, true);
  });
}
function docForm(d, url, isNew) {
  const prev = docKind(d) === 'image' ? '<img alt="" src="' + esc(THUMB[d.id] || url || '') + '" id="docImg">' : '<span class="ft">' + ic('file') + esc(docExt(d).toUpperCase()) + ' · ' + fmtSize(d.size || 0) + '</span>';
  openSheet({
    title: isNew ? 'Add to your files' : (d.name || 'File'), noFocus: !isNew,
    top: '<div class="docprev">' + prev + '</div>',
    fields: [
      { k: 'name', label: 'Name', ph: 'Venue contract, Florist receipt…', required: true },
      { row: [{ k: 'tag', label: 'Kind', type: 'select', options: DOC_TAGS }, { k: 'vendorId', label: 'Goes with', type: 'select', options: [{ v: '', l: 'No vendor' }].concat(S.vendors.map(v => ({ v: v.id, l: vendorTitle(v) }))) }] }
    ],
    values: { name: d.name, tag: d.tag || guessTag(d.name) || 'Other', vendorId: d.vendorId },
    body: isNew ? '' : '<button class="btn block" type="button" id="docShare">' + ic('share') + 'Share, save or print</button>',
    onMount: sc => {
      if (!isNew && docKind(d) === 'image' && !THUMB[d.id]) IMG.get('doc:' + d.id).then(u => { const im = $('#docImg', sc); if (u && im) { THUMB[d.id] = u; im.src = u; } });
      const sh = $('#docShare', sc); if (sh) sh.onclick = () => shareDoc(d);
      const nm = $('#f-name', sc); if (isNew && nm) nm.addEventListener('input', () => { const g = guessTag(nm.value); if (g) $('#f-tag', sc).value = g; });
    },
    onSave: v => {
      Object.assign(d, { name: v.name.slice(0, 80), tag: v.tag, vendorId: v.vendorId });
      if (isNew) { S.docs.push(d); IMG.put('doc:' + d.id, url).then(ok => { if (!ok) toast('This file couldn’t be stored on this phone. It may be full. Save a backup now.'); }); }
      commit(); toast(isNew ? 'Saved to your files' : 'Saved');
    },
    onDelete: isNew ? null : close => { askConfirm('Delete this file?', 'It will be removed from this device. A backup you saved earlier still has it.', 'Delete', true).then(ok => { if (!ok) return; S.docs = S.docs.filter(x => x !== d); IMG.del('doc:' + d.id); delete THUMB[d.id]; close(); commit(); toast('File deleted'); }); },
    deleteLabel: 'Delete file'
  });
}
async function shareDoc(d) {
  const u = await IMG.get('doc:' + d.id); if (!u) { toast('Couldn’t find that file on this device'); return; }
  const name = (d.name || 'file').replace(/[\\/:*?"<>|]+/g, ' ').trim() + '.' + docExt(d);
  const r = await saveFile(name, new Blob([dataBytes(u)], { type: d.type }), d.type, true);
  if (r === 'failed') toast('This file type can’t be saved here. Open the app from your Home Screen.');
}

/* ---------- PDFs (made on the device, then shared, saved or printed from the share sheet) ---------- */
let pdfLibP = null;
/* The PDF maker ships in lib/ beside the app. If that copy is missing, it falls back to cdnjs, checked against a fixed hash. */
const PDF_LIB = [{ src: 'lib/pdf-lib.min.js' }, { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js', sri: 'sha384-weMABwrltA6jWR8DDe9Jp5blk+tZQh7ugpCsF3JwSA53WZM9/14PjS5LAJNHNjAI' }];
function loadPdfLib() {
  if (window.PDFLib) return Promise.resolve(window.PDFLib);
  const one = o => new Promise((res, rej) => { const s = document.createElement('script'); s.src = o.src; if (o.sri) { s.integrity = o.sri; s.crossOrigin = 'anonymous'; } s.onload = () => window.PDFLib ? res(window.PDFLib) : rej(new Error('empty')); s.onerror = () => { s.remove(); rej(new Error('load')); }; document.head.appendChild(s); });
  return pdfLibP || (pdfLibP = PDF_LIB.reduce((p, o) => p.catch(() => one(o)), Promise.reject(new Error('start'))).catch(e => { pdfLibP = null; throw e; }));
}
/* The built-in PDF fonts only have Western European letters. Other letters are simplified (Ł to L, ạ to a), and the couple is told if any had to be left out. */
const PDF_SWAP = { 'Ł': 'L', 'ł': 'l', 'Đ': 'D', 'đ': 'd', 'Ħ': 'H', 'ħ': 'h', 'ı': 'i', 'Œ': 'OE', 'œ': 'oe', 'ŋ': 'n', 'Ŋ': 'N', 'ſ': 's', 'Ŧ': 'T', 'ŧ': 't', 'ʼ': "'", '„': '"', '‚': "'", '•': '-', '€': 'EUR', '™': 'TM' };
let pdfLost = 0, pdfSimplified = 0;
const pdfText = t => String(t == null ? '' : t).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...').replace(/·/g, '-').replace(/[^\x20-\x7E\xA0-\xFF]/g, c => {
  if (/[\n\r\t]/.test(c)) return ' ';
  const base = c.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/^[\x20-\x7E\xA0-\xFF]+$/.test(base)) { pdfSimplified++; return base; }
  if (PDF_SWAP[c]) { pdfSimplified++; return PDF_SWAP[c]; }
  if (/[\u0300-\u036f\u200b-\u200d\ufe0f]/.test(c)) return '';
  pdfLost++; return '';
});
async function makePdf(filename, build) {
  toast('Making your PDF…');
  let L; try { L = await loadPdfLib(); } catch (e) { toast('Couldn’t load the PDF maker. Check your connection.'); return; }
  pdfLost = 0; pdfSimplified = 0;
  const out = await L.PDFDocument.create();
  const F = { reg: await out.embedFont(L.StandardFonts.Helvetica), bold: await out.embedFont(L.StandardFonts.HelveticaBold), serif: await out.embedFont(L.StandardFonts.TimesRoman), ital: await out.embedFont(L.StandardFonts.TimesRomanItalic) };
  const W = 612, H = 792, M = 50, ink = L.rgb(.1, .1, .14), grey = L.rgb(.45, .45, .52), line = L.rgb(.86, .85, .84), gold = L.rgb(.55, .42, .2);
  const P = { L, out, F, W, H, M, ink, grey, gold, line, page: null, y: 0, n: 0 };
  P.newPage = () => { P.page = out.addPage([W, H]); P.y = H - M; P.n++; P.page.drawText(pdfText('Wedding Command Center by CyberHub Software'), { x: M, y: 26, size: 7.5, font: F.reg, color: grey }); };
  P.ensure = h => { if (!P.page || P.y - h < M) P.newPage(); };
  P.fit = (t, size, f, w) => { t = pdfText(t); if (f.widthOfTextAtSize(t, size) <= w) return t; while (t.length > 1 && f.widthOfTextAtSize(t + '...', size) > w) t = t.slice(0, -1); return t + '...'; };
  P.text = (t, o) => { o = o || {}; const size = o.size || 10, f = o.font || F.reg; P.ensure(size + 6); const s = P.fit(t, size, f, o.w || W - 2 * M); const x = o.center ? (W - f.widthOfTextAtSize(s, size)) / 2 : (o.x || M); P.page.drawText(s, { x, y: P.y - size, size, font: f, color: o.color || ink }); if (!o.keep) P.y -= size + (o.gap == null ? 6 : o.gap); };
  P.wrap = (t, o) => { o = o || {}; const size = o.size || 10, f = o.font || F.reg, w = o.w || W - 2 * M; const words = pdfText(t).split(/\s+/); let ln = ''; for (const wd of words) { const tryL = ln ? ln + ' ' + wd : wd; if (f.widthOfTextAtSize(tryL, size) > w && ln) { P.text(ln, o); ln = wd; } else ln = tryL; } if (ln) P.text(ln, o); };
  P.row = (cols, o) => { o = o || {}; const size = o.size || 9.5; P.ensure(size + 8); cols.forEach(c => { const f = c.font || (o.bold ? F.bold : F.reg); const s = P.fit(c.t, size, f, c.w - 6); const x = c.right ? c.x + c.w - f.widthOfTextAtSize(s, size) - 4 : c.x; P.page.drawText(s, { x, y: P.y - size, size, font: f, color: c.color || ink }); }); P.y -= size + 5; P.page.drawLine({ start: { x: M, y: P.y + 1 }, end: { x: W - M, y: P.y + 1 }, thickness: o.bold ? 1 : .5, color: o.bold ? ink : line }); P.y -= 5; };
  P.gap = n => { P.y -= n; };
  P.head = sub => { P.newPage(); P.text(coupleNames(false), { size: 26, font: F.serif, center: true, gap: 4 }); P.text(sub.toUpperCase() + (weddingDay() ? '  -  ' + fmtDate(weddingDay(), { month: 'long', day: 'numeric', year: 'numeric' }) : ''), { size: 8.5, font: F.bold, color: gold, center: true, gap: 20 }); };
  try { await build(P); } catch (e) { toast('Couldn’t make that PDF'); return; }
  const bytes = await out.save();
  const r = await saveFile(filename + '-' + isoDay(new Date()) + '.pdf', new Blob([bytes], { type: 'application/pdf' }), 'application/pdf', true);
  const note = pdfLost ? ' Some letters can’t show in PDFs and were left out.' : pdfSimplified ? ' A few accented letters are simplified in the PDF.' : '';
  if (r === 'saved') toast('PDF ready. Print it from the share sheet.' + note); else if (r === 'failed') toast('This browser blocked the file.');
}
function pdfGuests() {
  if (!S.guests.length) { toast('Add a guest first'); return; }
  makePdf('guest-list', P => {
    P.head('Guest list');
    const gs = guestStats(), meals = mealCounts();
    P.text(gs.invited + ' invited   ' + gs.yes + ' coming   ' + gs.pending + ' waiting   ' + gs.no + ' declined', { size: 10, center: true, gap: 4 });
    P.text(meals.list.map(([m, n]) => m + ': ' + n).join('   ') + (meals.unset ? '   No meal yet: ' + meals.unset : ''), { size: 9, color: P.grey, center: true, gap: 16 });
    const X = P.M, cols = w => { let x = X; return w.map(v => { const c = { x, w: v }; x += v; return c; }); };
    const c = cols([150, 92, 62, 82, 82, 44]);
    const hdr = () => P.row(['Name', 'Guest of', 'RSVP', 'Meal', 'Plus-one', 'Table'].map((t, i) => Object.assign({ t, font: P.F.bold }, c[i])), { bold: true, size: 8 });
    hdr();
    S.guests.slice().sort((a, b) => lastName(a.name).localeCompare(lastName(b.name))).forEach(g => {
      if (P.y < P.M + 30) { P.newPage(); hdr(); }
      P.row([g.name + (g.diet ? ' (' + g.diet + ')' : ''), sideLabel(g.side), { yes: 'Coming', no: 'Declined', pending: 'Waiting' }[g.rsvp], g.meal, g.plus ? (g.plusName || 'Yes') + (g.plusMeal ? ', ' + g.plusMeal : '') : '', (byId(S.tables, g.table) || {}).name || ''].map((t, i) => Object.assign({ t }, c[i])));
    });
  });
}
function pdfSeating() {
  if (!S.tables.length) { toast('Add a table first'); return; }
  makePdf('seating-chart', P => {
    P.head('Seating chart');
    const ppl = people(), colW = (P.W - 2 * P.M - 24) / 3;
    let col = 0, top = P.y, maxY = P.y;
    S.tables.forEach(t => {
      const at = ppl.filter(p => p.table === t.id), h = 22 + at.length * 13 + 10;
      if (col === 0 && top - h < P.M) { P.newPage(); top = P.y; maxY = P.y; }
      const x = P.M + col * (colW + 12);
      P.page.drawRectangle({ x, y: top - h, width: colW, height: h, borderColor: P.line, borderWidth: 1 });
      P.page.drawText(P.fit(t.name + '  (' + at.length + '/' + t.seats + ')', 11, P.F.bold, colW - 16), { x: x + 8, y: top - 16, size: 11, font: P.F.bold, color: P.ink });
      at.forEach((p, i) => P.page.drawText(P.fit(p.name, 9.5, P.F.reg, colW - 16), { x: x + 8, y: top - 32 - i * 13, size: 9.5, font: P.F.reg, color: P.ink }));
      maxY = Math.min(maxY, top - h - 12);
      col++; if (col === 3) { col = 0; top = maxY; }
    });
    P.y = Math.min(maxY, top) - 6;
    const seated = ppl.filter(p => p.table).sort((a, b) => lastName(a.name).localeCompare(lastName(b.name)) || a.name.localeCompare(b.name));
    if (seated.length) { P.ensure(60); P.text('Find your seat', { size: 15, font: P.F.serif, gap: 8 }); const c = [{ x: P.M, w: 220 }, { x: P.M + 220, w: 120 }]; seated.forEach(p => P.row([Object.assign({ t: p.name }, c[0]), Object.assign({ t: byId(S.tables, p.table).name, font: P.F.bold }, c[1])], { size: 9 })); }
    const un = ppl.filter(p => !p.table);
    if (un.length) { P.gap(8); P.text('Not seated yet (' + un.length + ')', { size: 12, font: P.F.serif, gap: 6 }); P.wrap(un.map(p => p.name).join(', '), { size: 9, color: P.grey }); }
  });
}
function pdfVendors() {
  if (!S.vendors.length) { toast('Add a vendor first'); return; }
  makePdf('vendor-contacts', P => {
    P.head('Vendor contacts');
    walletOrder().reverse().forEach(v => {
      P.ensure(70);
      P.text(v.kind.toUpperCase(), { size: 7.5, font: P.F.bold, color: P.gold, gap: 3 });
      P.text(vendorTitle(v) + (v.status === 'needed' ? '  (still to book)' : ''), { size: 13, font: P.F.bold, gap: 4 });
      const bits = [v.contact, v.phone, v.email, v.web].filter(Boolean).join('   ');
      if (bits) P.text(bits, { size: 9.5, color: P.grey, gap: 4 });
      if (v.status !== 'needed' && v.cost) { const m = vendorMoney(v); P.text('Total ' + money(v.cost) + (v.deposit ? '   Deposit ' + money(v.deposit) + (v.depositPaid ? ' (paid)' : '') : '') + '   ' + m.label + (m.amount && m.label !== 'Paid in full' ? ' ' + money(m.amount) : '') + (m.due ? ' by ' + fmtDate(m.due) : ''), { size: 9.5, gap: 4 }); }
      P.gap(10);
    });
  });
}
function bundleSheet() {
  const docs = (S.docs || []).filter(d => docKind(d) !== 'file'), others = (S.docs || []).length - docs.length;
  if (!docs.length) { toast('Add a photo or PDF first'); return; }
  openSheet({
    title: 'Put files in one PDF', saveLabel: 'Make PDF', noFocus: true,
    top: '<p class="muted" style="margin:0">Makes one PDF you can email, text, save to Files or print from the share sheet.</p>',
    fields: [{ k: 'cover', label: 'Start with a vendor contact page', type: 'toggle' }],
    values: { cover: true },
    body: '<div class="pickl">' + docs.map(d => '<label><input type="checkbox" data-pick="' + esc(d.id) + '" checked>' + (docKind(d) === 'image' ? '<img alt="" data-doc="' + esc(d.id) + '"' + (THUMB[d.id] ? ' src="' + esc(THUMB[d.id]) + '"' : '') + '>' : '<span class="pth">' + ic('file') + '</span>') + '<span>' + esc(d.name) + '<small>' + esc(d.tag || 'Other') + '</small></span></label>').join('') + '</div>' +
      (others ? '<p class="hint" style="margin:0">' + others + ' Word or text file' + (others === 1 ? ' can’t' : 's can’t') + ' go in a PDF. Share ' + (others === 1 ? 'it' : 'them') + ' on ' + (others === 1 ? 'its' : 'their') + ' own.</p>' : ''),
    onMount: sc => loadThumbs(sc),
    onSave: (v, sc) => {
      const ids = $$('[data-pick]', sc).filter(x => x.checked).map(x => x.dataset.pick);
      if (!ids.length && !v.cover) { toast('Pick at least one'); return false; }
      makeBundle(ids, v.cover);
    }
  });
}
function makeBundle(ids, cover) {
  makePdf('wedding-files', async P => {
    const { L, out } = P;
    if (cover && S.vendors.length) {
      P.head('Vendor contacts');
      walletOrder().reverse().filter(v => v.status !== 'needed').forEach(v => { P.ensure(40); P.text(v.kind + ':  ' + vendorTitle(v), { size: 11, font: P.F.bold, gap: 3 }); const bits = [v.contact, v.phone, v.email].filter(Boolean).join('   '); if (bits) P.text(bits, { size: 9, color: P.grey, gap: 8 }); else P.gap(5); });
    }
    let skipped = 0;
    for (const id of ids) {
      const d = byId(S.docs, id); const u = d && await IMG.get('doc:' + id); if (!u) { skipped++; continue; }
      try {
        if (docKind(d) === 'pdf') { const src = await L.PDFDocument.load(dataBytes(u), { ignoreEncryption: true }); const pages = await out.copyPages(src, src.getPageIndices()); pages.forEach(p => out.addPage(p)); }
        else {
          const img = await out.embedJpg(dataBytes(u)); const pg = out.addPage([612, 792]); const m = 36, sc = Math.min((612 - 2 * m) / img.width, (792 - 2 * m - 24) / img.height, 1);
          pg.drawText(pdfText(d.name), { x: m, y: 792 - m - 10, size: 11, font: P.F.bold, color: P.ink });
          pg.drawImage(img, { x: (612 - img.width * sc) / 2, y: 792 - m - 24 - img.height * sc, width: img.width * sc, height: img.height * sc });
        }
      } catch (e) { skipped++; }
    }
    if (!out.getPageCount()) throw new Error('empty');
    if (skipped) later(() => toast(skipped + ' file' + (skipped === 1 ? '' : 's') + ' couldn’t be added (locked or damaged PDF)'));
  });
}
async function storageLine() {
  try { if (!navigator.storage || !navigator.storage.estimate) return ''; const e = await navigator.storage.estimate(); const mb = (e.usage || 0) / 1048576;
    const warn = e.quota && e.usage / e.quota > .8; return (mb < .1 ? 'Under 0.1' : mb.toFixed(1)) + ' MB used on this device' + (warn ? '. Storage is nearly full: back up, then remove big files you don’t need here.' : mb > 60 ? '. That’s a lot of files, so backups will be big.' : '.'); } catch (e) { return ''; }
}
