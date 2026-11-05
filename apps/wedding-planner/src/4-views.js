/* ================= Views ================= */
const R = {};

/* ---------- Home ---------- */
R.home = function () {
  const w = weddingMoment(), c = S.couple;
  const where = [c.venue, c.city].filter(Boolean).join(', ');
  const dateLine = w ? fmtDate(w, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + (S.couple.time ? ' · ' + w.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '') : 'Add your wedding date to start the countdown';
  let cd = '';
  if (w) {
    const diff = w - Date.now(), day = weddingDay(), dd = daysBetween(today0(), day);
    if (dd === 0) cd = '<div class="bigday">Today’s the day. Congratulations!</div>';
    else if (diff < 0) cd = '<div class="bigday">Married ' + Math.abs(dd) + ' day' + (Math.abs(dd) === 1 ? '' : 's') + ' ago</div>';
    else cd = '<div class="cd" aria-live="off">' + ['Days', 'Hours', 'Minutes', 'Seconds'].map((l, i) => '<div><b class="num" data-cd="' + i + '">00</b><span>' + l + '</span></div>').join('') + '</div>';
  }
  const gs = guestStats(), meals = mealCounts();
  const left = w ? daysBetween(today0(), weddingDay()) : null;
  return '<div class="phead"><div><h1>Our Wedding</h1>' + (left != null && left > 0 ? '<p>' + left + ' day' + (left === 1 ? '' : 's') + ' to go</p>' : '') + '</div></div>' +
    '<section class="hero' + (c.photo ? ' photo' : '') + '" aria-label="Countdown"' + (c.photo ? ' style="--photo:url(\'' + esc(c.photo) + '\')"' : '') + '>' + heroMotif('br') +
      '<div class="hero-tools"><a class="iconbtn" href="#style" aria-label="Change the look">' + ic('brush') + '</a><button class="iconbtn" type="button" data-act="edit-couple" aria-label="Edit wedding details">' + ic('edit') + '</button></div>' +
      '<div class="in"><div class="lbl">The wedding of</div>' +
      '<h2>' + coupleNames(true) + '</h2>' +
      '<div class="when">' + esc(dateLine) + (where ? '<br>' + esc(where) : '') + '</div>' + cd +
      (c.photo ? '' : '<button class="hero-go" type="button" data-act="edit-couple">' + ic('heart', 'sm') + 'Add a photo of you two</button>') + '</div>' +
    '</section>' +
    quickAddCard() +
    nudgeCard() +
    '<div class="cols home-cols"><div class="col">' + standCard() + '</div><div class="col">' + comingCard() + '</div></div>' +
    walletStrip() +
    '<div class="group"><div class="group-h"><h2>RSVPs and meals</h2><a href="#guests">Guests' + ic('chev', 'sm') + '</a></div>' +
      '<div class="pstats">' + [['Invited', gs.invited], ['Coming', gs.yes], ['Waiting', gs.pending], ['Declined', gs.no]].map(x => '<div><b class="num">' + x[1] + '</b><small>' + x[0] + '</small></div>').join('') + '</div>' +
      (meals.list.length || meals.unset ? '<div class="list" style="margin-top:12px">' + meals.list.map(([m, n]) => '<div class="li"><span class="tx"><b>' + esc(m) + '</b></span><span class="amt num">' + n + '</span></div>').join('') + (meals.unset ? '<div class="li"><span class="tx"><b class="faint">No choice yet</b></span><span class="amt num">' + meals.unset + '</span></div>' : '') + '</div>' : '') +
    '</div>';
};
R.homeAfter = function (main) { wireAskBox(main); wireDots(main); };

/* Quick add: the type box, with plain words that say what it does (same card as the Credentials Tracker). */
function quickAddCard() {
  return '<section class="qa" aria-labelledby="qaHd"><div class="qahd"><span class="qaic">' + ic('chat') + '</span><div><h2 id="qaHd">Quick add</h2><p>Type it like a text. I’ll add it, update it, or answer.</p></div></div>' + askBoxHTML() + '</section>';
}

/* Where you stand: one ring each, in a tidy row, with a name and one plain line under each. */
function ringBox(pct, mid, sub, col) {
  const p = clamp(pct, 0, 1), done = p >= 1;
  return '<span class="ringsvg"><svg viewBox="0 0 36 36" aria-hidden="true"><circle class="trk" cx="18" cy="18" r="15.9155" stroke-width="3.2"/>' +
    (p > 0 ? '<circle class="arc" cx="18" cy="18" r="15.9155" stroke-width="3.2" pathLength="100" stroke="' + col + '" style="stroke-dashoffset:' + (100 - p * 100).toFixed(1) + '"/>' : '') + '</svg>' +
    '<span class="mid">' + (done ? ic('check') : '<b class="num">' + mid + '</b>' + (sub ? '<small>' + sub + '</small>' : '')) + '</span></span>';
}
function standCard() {
  const gs = guestStats(), ppl = people(), seated = ppl.filter(p => p.table).length;
  const done = S.tasks.filter(t => t.done).length, bt = budgetTotals();
  const back = gs.yes + gs.no;
  const rings = [
    { pct: S.tasks.length ? done / S.tasks.length : 0, n: 'To-dos', line: S.tasks.length ? (S.tasks.length - done) + ' left' : 'None yet', to: 'checklist', col: 'var(--accent)' },
    { pct: gs.invited ? back / gs.invited : 0, n: 'RSVPs back', line: gs.invited ? (gs.pending ? gs.pending + ' waiting' : 'All in') : 'No guests yet', to: 'guests', col: 'var(--good)' },
    { pct: ppl.length ? seated / ppl.length : 0, n: 'Seated', line: ppl.length ? (ppl.length - seated ? (ppl.length - seated) + ' to seat' : 'Everyone') : 'No guests yet', to: 'seating', col: 'var(--info)' }
  ];
  const over = bt.total && bt.spent > bt.total, spentPct = bt.total ? clamp(bt.spent / bt.total, 0, 1) : 0, paidPct = bt.total ? clamp(bt.paid / bt.total, 0, 1) : 0;
  return '<div class="group"><div class="group-h"><h2>Where you stand</h2></div>' +
    '<div class="ringcard"><div class="rings">' + rings.map(r => '<a class="ringit" href="#' + r.to + '">' + ringBox(r.pct, Math.round(r.pct * 100) + '%', '', r.col) + '<span class="rt"><b>' + r.n + '</b><small class="' + (r.pct >= 1 ? 'ok' : '') + '">' + esc(r.line) + '</small></span></a>').join('') + '</div></div>' +
    '<a class="card moneycard" href="#budget"><div class="mtop"><span><small>Budget</small><b class="num">' + money(bt.spent) + '</b><i> of ' + money(bt.total) + '</i></span><span class="mright ' + (over ? 'bad' : '') + '">' + (over ? 'Over by ' + money(bt.spent - bt.total) : money(Math.max(0, bt.left)) + ' left') + '</span></div>' +
      '<span class="track"><span class="ts" style="width:' + (spentPct * 100).toFixed(1) + '%"></span><span class="tp" style="width:' + (paidPct * 100).toFixed(1) + '%"></span></span>' +
      '<div class="mkey"><span><i class="kp"></i>Paid ' + money(bt.paid) + '</span><span><i class="ks"></i>Still to pay ' + money(Math.max(0, bt.spent - bt.paid)) + '</span></div></a>' +
  '</div>';
}

/* Coming up: payments, to-dos, RSVP deadline and the big day, as rows with a date chip. */
function comingItems() {
  const t0 = today0(), out = [], gs = guestStats();
  for (const p of payments()) if (p.due) out.push({ d: p.due, icon: 'cash', t: p.kind + ' · ' + vendorTitle(p.v), s: money(p.amount), act: 'wallet-open', id: p.v.id });
  const vNames = new Set(S.vendors.filter(v => v.status !== 'needed').flatMap(v => [vendorTitle(v).trim().toLowerCase(), v.kind.toLowerCase()]));
  for (const it of S.budget.items) { const d = parseDay(it.due); if (d && it.paid < it.cost && !vNames.has(it.name.trim().toLowerCase())) out.push({ d, icon: 'cash', t: it.name, s: money(it.cost - it.paid) + ' left to pay', act: 'edit-item', id: it.id }); }
  for (const t of S.tasks) { const d = parseDay(t.due); if (d && !t.done) out.push({ d, icon: 'checklist', t: t.t, s: 'To-do', act: 'edit-task', id: t.id }); }
  let upcomingBuckets = 0;
  for (const b of BUCKETS) {
    const left = S.tasks.filter(t => t.b === b.k && !t.done && !t.due).length, d = bucketDue(b);
    if (!left || !d || b.k === 'after') continue;
    if (d >= t0 && upcomingBuckets++ >= 2) continue;
    out.push({ d, icon: 'checklist', t: left + ' to-do' + (left === 1 ? '' : 's') + ' to finish', s: b.label, act: 'go', to: 'checklist' });
  }
  const rb = parseDay(S.couple.rsvpBy);
  if (rb && gs.pending) out.push({ d: rb, icon: 'mail', t: 'RSVPs due', s: gs.pending + ' still waiting', act: 'go', to: 'guests' });
  const wd = weddingDay();
  if (wd && wd >= t0) out.push({ d: wd, icon: 'ring', t: 'Your wedding day', s: [S.couple.venue, S.couple.city].filter(Boolean).join(', ') || 'The big day', act: 'go', to: 'home', big: true });
  out.sort((a, b) => a.d - b.d);
  const late = out.filter(x => x.d < t0), next = out.filter(x => x.d >= t0);
  return late.slice(0, 3).concat(next.slice(0, Math.max(3, 6 - Math.min(3, late.length))));
}
function dateChip(d, tone) { return '<span class="dchip ' + (tone || '') + '"><small>' + esc(fmtDate(d, { month: 'short' })) + '</small><b class="num">' + d.getDate() + '</b></span>'; }
function comingCard() {
  const items = comingItems(), t0 = today0();
  return '<div class="group"><div class="group-h"><h2>Coming up</h2><a href="#checklist">To-do list' + ic('chev', 'sm') + '</a></div>' +
    (items.length ? '<div class="list clist">' + items.map(x => {
      const n = daysBetween(t0, x.d), tone = x.big ? 'big' : n < 0 ? 'late' : n <= 14 ? 'soon' : '';
      return '<button type="button" class="li crow" data-act="' + x.act + '"' + (x.id ? ' data-id="' + esc(x.id) + '"' : '') + (x.to ? ' data-to="' + x.to + '"' : '') + '>' + dateChip(x.d, tone) +
        '<span class="tx"><b>' + esc(x.t) + '</b><small>' + esc(x.s) + ' · <span class="' + (n < 0 ? 'bad' : n <= 14 ? 'warnt' : '') + '">' + esc(n < 0 ? dueWords(x.d) : relDay(x.d)) + '</span></small></span>' + ic('chev', 'sm') + '</button>';
    }).join('') + '<button type="button" class="li addrow" data-act="ics"><span class="liic t-plain">' + ic('calendar') + '</span><span class="tx">Add these to your Calendar</span></button></div>'
    : '<div class="list"><div class="empty"><b>Nothing on the calendar</b><br>' + (S.couple.date ? 'Add vendors with due dates to see payments here.' : 'Add your wedding date to see what’s coming.') + '</div></div>') +
  '</div>';
}

/* Home: your vendors as a row of small wallet cards you swipe, with dots under it. */
function walletStrip() {
  if (!S.vendors.length) return '';
  const ord = walletOrder(), pos = new Map(ord.map((v, i) => [v.id, i])), need = v => v.status === 'needed';
  const cards = ord.slice().sort((a, b) => need(a) - need(b) || (need(a) ? VENDOR_KINDS.indexOf(a.kind) - VENDOR_KINDS.indexOf(b.kind) : pos.get(b.id) - pos.get(a.id)));
  return '<div class="group"><div class="group-h"><h2>Your vendors</h2><a href="#vendors">See all' + ic('chev', 'sm') + '</a></div>' +
    '<div class="wscroll wstrip" data-dots="vdots">' + cards.map(v => walletCard(v, true)).join('') + '</div>' +
    (cards.length > 1 ? '<div class="rdots" id="vdots">' + cards.map((_, i) => '<i' + (i ? '' : ' class="on"') + '></i>').join('') + '</div>' : '') + '</div>';
}
function wireDots(main) {
  $$('[data-dots]', main).forEach(row => {
    const dots = $('#' + row.dataset.dots, main); if (!dots) return;
    let raf = 0;
    row.addEventListener('scroll', () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; const kids = row.children; if (!kids.length) return; const w = kids[0].offsetWidth + 12, i = Math.min(kids.length - 1, Math.round(row.scrollLeft / Math.max(1, w))); $$('i', dots).forEach((d, k) => d.classList.toggle('on', k === i)); }); }, { passive: true });
  });
}
let tickTimer = null;
function startTick() {
  clearInterval(tickTimer);
  if (route !== 'home' || !$('[data-cd]')) return;
  const tick = () => {
    const w = weddingMoment(); if (!w) return;
    let s = Math.max(0, Math.floor((w - Date.now()) / 1000));
    const v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
    $$('[data-cd]').forEach(el => { const i = +el.dataset.cd; el.textContent = i === 0 ? String(v[0]) : pad(v[i]); });
    if (s === 0) { clearInterval(tickTimer); if (!startTick.done) { startTick.done = true; render(); } }
  };
  tick(); tickTimer = setInterval(tick, 1000);
}

/* ---------- Guests ---------- */
/* The Guests page itself is in 7h-people.js. */
function guestFields() {
  const meals = [{ v: '', l: 'Not chosen yet' }].concat(S.settings.meals.map(m => ({ v: m, l: m })));
  return [
    { k: 'name', label: 'Full name', required: true, ph: 'First and last name' },
    { k: 'side', label: 'Guest of', type: 'seg', options: [{ v: 'a', l: S.couple.a || 'Partner 1' }, { v: 'b', l: S.couple.b || 'Partner 2' }, { v: 'both', l: 'Both' }] },
    { k: 'rsvp', label: 'RSVP', type: 'seg', options: [{ v: 'pending', l: 'Waiting' }, { v: 'yes', l: 'Coming' }, { v: 'no', l: 'Declined' }] },
    { row: [{ k: 'group', label: 'Group', ph: 'Family, Friends, Work' }, { k: 'meal', label: 'Meal', type: 'select', options: meals }] },
    { k: 'diet', label: 'Allergies or dietary needs', ph: 'Optional' },
    { k: 'contact', label: 'Phone or email', ph: 'Optional' },
    { k: 'plus', label: 'Bringing a plus-one', type: 'toggle' },
    { row: [{ k: 'plusName', label: 'Plus-one name', ph: 'If known', showIf: v => v.plus }, { k: 'plusMeal', label: 'Plus-one meal', type: 'select', options: meals, showIf: v => v.plus }] },
    { k: 'notes', label: 'Notes', type: 'textarea', ph: 'Optional' }
  ];
}
function editGuest(id, pre) {
  const g = id ? byId(S.guests, id) : null;
  const values = Object.assign(g ? Object.assign({}, g) : { side: 'both', rsvp: 'pending', meal: '', plusMeal: '' }, pre || {});
  openSheet({
    title: g ? 'Edit guest' : 'New guest', fields: guestFields(), values,
    onSave: v => {
      if (g) {
        Object.assign(g, v);
        if (g.rsvp === 'no') { g.table = null; g.plusTable = null; }
        if (!g.plus) g.plusTable = null;
      } else S.guests.push(Object.assign({ id: uid(), table: null, plusTable: null, hh: '' }, v));
      commit(); toast(g ? 'Guest saved' : 'Guest added');
    },
    onDelete: g ? close => { const snap = snapshot(); S.guests = S.guests.filter(x => x !== g); close(); commit(); toast(g.name + ' removed', () => restoreSnapshot(snap)); } : null,
    deleteLabel: 'Remove guest'
  });
}
function bulkGuests() {
  openSheet({
    title: 'Add a list of guests', saveLabel: 'Add',
    top: '<p class="muted" style="margin:0">Paste or type one name per line. You can fill in meals and plus-ones later.</p>',
    fields: [
      { k: 'names', label: 'Names', type: 'textarea', ph: 'Grace Bennett\nMark Bennett\nAva Thompson' },
      { k: 'side', label: 'Guest of', type: 'seg', options: [{ v: 'a', l: S.couple.a || 'Partner 1' }, { v: 'b', l: S.couple.b || 'Partner 2' }, { v: 'both', l: 'Both' }] },
      { k: 'group', label: 'Group', ph: 'Family, Friends, Work' }
    ], values: { side: 'both' },
    onSave: v => {
      const names = v.names.split(/\r?\n/).map(s => s.replace(/^[\s\-*•\d.)]+/, '').trim()).filter(Boolean).slice(0, 1000);
      if (!names.length) return false;
      names.forEach(n => S.guests.push({ id: uid(), name: n.slice(0, 120), side: v.side || 'both', group: v.group, contact: '', rsvp: 'pending', meal: '', diet: '', plus: false, plusName: '', plusMeal: '', table: null, plusTable: null, notes: '' }));
      commit(); toast(names.length + ' guest' + (names.length === 1 ? '' : 's') + ' added');
    }
  });
}

/* ---------- Seating ---------- */
/* The Seating page itself is in 7h-people.js. */
function personByKey(key) { return people().find(p => p.key === key); }
function setSeat(key, tid) {
  const [id, pl] = key.split(':'); const g = byId(S.guests, id); if (!g) return;
  if (pl === '1') g.plusTable = tid; else g.table = tid;
}
function tableHasRoom(tid, key) { const t = byId(S.tables, tid); if (!t) return false; const at = people().filter(p => p.table === tid && p.key !== key); return at.length < t.seats; }
function editTable(id, pre) {
  const t = id ? byId(S.tables, id) : null;
  const at = t ? people().filter(p => p.table === t.id) : [];
  openSheet({
    title: t ? 'Edit table' : 'New table',
    fields: [
      { k: 'name', label: 'Table name', required: true, ph: 'Table 1, Head table, Family' },
      { k: 'shape', label: 'Shape', type: 'seg', options: [{ v: 'round', l: 'Round' }, { v: 'long', l: 'Long' }] },
      { k: 'seats', label: 'Seats', type: 'number', min: 1, max: 30, hint: t && at.length ? at.length + ' guests are seated here, so it needs at least ' + at.length + ' seats.' : 'Up to 30.' }
    ],
    values: Object.assign({}, t || { name: 'Table ' + (S.tables.length + 1), shape: 'round', seats: 8 }, pre || {}),
    onSave: v => {
      const seated = t ? people().filter(p => p.table === t.id).length : 0;
      v.seats = clamp(Math.round(v.seats) || 8, Math.max(1, seated), 30);
      if (t) Object.assign(t, v); else S.tables.push(Object.assign({ id: uid() }, v));
      commit();
    },
    onDelete: t ? close => { const snap = snapshot(); S.tables = S.tables.filter(x => x !== t); S.guests.forEach(g => { if (g.table === t.id) g.table = null; if (g.plusTable === t.id) g.plusTable = null; }); close(); commit(); toast(t.name + ' deleted', () => restoreSnapshot(snap)); } : null,
    deleteLabel: 'Delete table'
  });
}

/* Drag and drop that works with mouse, pen and touch (press and hold on touch so the page can still scroll). */
let drag = null, suppressClick = false;
function dragStart(e) {
  const chip = e.target.closest('[data-drag]'); if (!chip || (e.button && e.button !== 0)) return;
  drag = { chip, key: chip.dataset.drag, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, active: false, touch: e.pointerType !== 'mouse', timer: 0 };
  if (drag.touch) drag.timer = setTimeout(() => { if (drag && !drag.active) beginDrag(); }, 260);
}
function beginDrag() {
  const d = drag; d.active = true;
  const r = d.chip.getBoundingClientRect();
  const g = d.chip.cloneNode(true); g.classList.add('drag-ghost'); g.removeAttribute('data-drag'); g.style.width = r.width + 'px';
  document.body.appendChild(g); d.ghost = g; d.chip.classList.add('lifting'); document.body.classList.add('dragging');
  if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) {}
  moveGhost();
  autoScroll();
}
function moveGhost() {
  const d = drag; if (!d || !d.ghost) return;
  d.ghost.style.left = d.x + 'px'; d.ghost.style.top = d.y + 'px';
  const el = document.elementFromPoint(d.x, d.y);
  const target = el && el.closest('[data-drop]');
  $$('.drop-ok,.drop-full').forEach(x => x.classList.remove('drop-ok', 'drop-full'));
  d.target = null;
  if (target) {
    const id = target.dataset.drop;
    if (id === 'none') { const p = personByKey(d.key); if (p && p.table) { target.classList.add('drop-ok'); d.target = 'none'; } }
    else { const ok = tableHasRoom(id, d.key); target.classList.add(ok ? 'drop-ok' : 'drop-full'); d.target = id; d.ok = ok; }
  }
}
function autoScroll() {
  if (!drag || !drag.active) return;
  const edge = 70, h = window.innerHeight;
  let dy = 0;
  if (drag.y < edge + 50) dy = -Math.ceil((edge + 50 - drag.y) / 6);
  else if (drag.y > h - edge - 70) dy = Math.ceil((drag.y - (h - edge - 70)) / 6);
  if (dy) { scrollToY(getY() + dy); moveGhost(); }
  requestAnimationFrame(autoScroll);
}
function dragMove(e) {
  if (!drag) return;
  drag.x = e.clientX; drag.y = e.clientY;
  const dist = Math.hypot(drag.x - drag.x0, drag.y - drag.y0);
  if (!drag.active) {
    if (drag.touch) { if (dist > 10) { clearTimeout(drag.timer); drag = null; } }
    else if (dist > 6) beginDrag();
    return;
  }
  e.preventDefault();
  moveGhost();
}
function dragEnd() {
  if (!drag) return;
  const d = drag; drag = null; clearTimeout(d.timer);
  if (!d.active) return;
  suppressClick = true; setTimeout(() => suppressClick = false, 50);
  if (d.ghost) d.ghost.remove();
  d.chip.classList.remove('lifting'); document.body.classList.remove('dragging');
  $$('.drop-ok,.drop-full').forEach(x => x.classList.remove('drop-ok', 'drop-full'));
  const p = personByKey(d.key); if (!p) return;
  if (d.target === 'none') { setSeat(d.key, null); commit(); toast(shortName(p.name) + ' unseated'); return; }
  if (!d.target || d.target === p.table) return;
  const t = byId(S.tables, d.target);
  if (!d.ok) { const el = $('[data-drop="' + esc(d.target) + '"]'); if (el) { el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 400); } toast(t.name + ' is full'); return; }
  setSeat(d.key, t.id); commit(); toast(shortName(p.name) + ' → ' + t.name);
}
function dragCancel() { if (drag && drag.active) { const d = drag; drag = null; if (d.ghost) d.ghost.remove(); d.chip.classList.remove('lifting'); document.body.classList.remove('dragging'); $$('.drop-ok,.drop-full').forEach(x => x.classList.remove('drop-ok', 'drop-full')); } else if (drag) { clearTimeout(drag.timer); drag = null; } }
document.addEventListener('pointerdown', dragStart);
document.addEventListener('pointermove', dragMove, { passive: false });
document.addEventListener('pointerup', dragEnd);
document.addEventListener('pointercancel', dragCancel);
document.addEventListener('touchmove', e => { if (drag && drag.active && drag.ghost && drag.ghost.isConnected) e.preventDefault(); }, { passive: false });
/* Safety net: if a lifted guest gets stuck (the phone dropped the finger-up), let go so the page can scroll again. */
document.addEventListener('touchend', () => { if (drag) setTimeout(() => { if (drag) dragEnd(); }, 0); });
document.addEventListener('touchcancel', dragCancel);
window.addEventListener('blur', dragCancel);
document.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('[data-drag]')) e.preventDefault(); });
document.addEventListener('dragstart', e => { if (e.target.closest && e.target.closest('[data-drag]')) e.preventDefault(); });

/* ---------- Budget ---------- */
const openCats = new Set();
R.budget = function () {
  const bt = budgetTotals();
  const over = bt.total && bt.spent > bt.total;
  const cats = S.budget.cats.map((c, i) => ({ c, i, spent: catSpent(c.id) }));
  const withSpend = cats.filter(x => x.spent > 0).sort((a, b) => b.spent - a.spent);
  const top = withSpend.slice(0, 7), rest = withSpend.slice(7);
  const slices = top.map((x, i) => ({ name: x.c.name, v: x.spent, col: 'var(--s' + (i + 1) + ')' }));
  if (rest.length) slices.push({ name: 'Other', v: sum(rest, x => x.spent), col: 'var(--s8)' });
  const donut = donutSVG(slices, bt.spent);
  const unsplit = bt.total > 0 && bt.planned === 0;
  return '<div class="phead"><div><div class="eyebrow">The money</div><h1>Budget</h1><p>' + money(bt.spent) + ' spent' + (bt.total ? ' of ' + money(bt.total) : '') + '</p></div>' +
    '<div class="actions"><button class="btn" type="button" data-act="add-cat">' + ic('plus') + 'Category</button><button class="btn primary" type="button" data-act="add-item">' + ic('plus') + 'Add expense</button></div></div>' +
    '<div class="money-hero">' +
      '<section class="card"><div class="card-head"><h2>Overview</h2><button class="linkbtn" type="button" data-act="edit-total">' + (bt.total ? 'Change total' : 'Set total budget') + '</button></div>' +
        '<div class="kpis"><div class="kpi"><span>Total budget</span><b>' + money(bt.total) + '</b></div><div class="kpi"><span>Spent</span><b>' + money(bt.spent) + '</b></div><div class="kpi' + (over ? ' over' : '') + '"><span>' + (over ? 'Over by' : 'Left') + '</span><b>' + money(Math.abs(bt.left)) + '</b></div></div>' +
        '<div style="margin-top:16px"><div class="bar' + (over ? ' over' : '') + '" role="img" aria-label="Spent ' + money(bt.spent) + ' of ' + money(bt.total) + '"><i style="width:' + (bt.total ? clamp(bt.spent / bt.total * 100, 0, 100) : 0) + '%"></i></div>' +
        '<div class="small muted" style="display:flex;justify-content:space-between;gap:10px;margin-top:8px;flex-wrap:wrap"><span>Paid so far <b class="num" style="color:var(--ink)">' + money(bt.paid) + '</b></span><span>Still to pay <b class="num" style="color:var(--ink)">' + money(Math.max(0, bt.spent - bt.paid)) + '</b></span></div></div>' +
        (unsplit ? '<div class="banner info" style="margin:16px 0 0">' + ic('budget') + '<div class="txt"><b>Want a starting plan?</b>We can split your total across categories using typical wedding percentages. You can change any of it.</div><button class="btn primary small" type="button" data-act="split-budget">Split it for me</button></div>' : '') +
        (bt.total && bt.planned && Math.abs(bt.planned - bt.total) >= 1 ? '<p class="hint" style="margin:12px 0 0">Your categories add up to ' + money(bt.planned) + ', which is ' + money(Math.abs(bt.planned - bt.total)) + (bt.planned > bt.total ? ' more' : ' less') + ' than your total.</p>' : '') +
      '</section>' +
      '<section class="card"><div class="card-head"><h2>Where it’s going</h2></div>' +
        (bt.spent ? '<div class="donut-wrap">' + donut + '<div class="legend">' + slices.map(s => '<div><i style="background:' + s.col + '"></i><span>' + esc(s.name) + '</span><b>' + money(s.v) + '</b></div>').join('') + '</div></div>'
          : '<div class="empty"><div class="big">No spending yet</div>Add an expense and this chart fills in.</div>') +
      '</section>' +
    '</div>' +
    '<section class="card" style="margin-top:16px"><div class="card-head"><h2>Spent vs planned</h2></div>' +
      cats.map(({ c, spent }) => {
        const ov = c.planned > 0 && spent > c.planned, items = S.budget.items.filter(i => i.cat === c.id), open = openCats.has(c.id);
        return '<div class="cat"><div class="cat-top" role="button" tabindex="0" data-act="toggle-cat" data-id="' + esc(c.id) + '" style="cursor:pointer"><div class="t">' + esc(c.name) + ' <span class="faint small">(' + items.length + ')</span></div><div class="v"><b class="num">' + money(spent) + '</b> of <span class="num">' + money(c.planned) + '</span>' + (ov ? '<br><span class="overtag">' + ic('alert', 'sm') + 'Over by ' + money(spent - c.planned) + '</span>' : '') + '</div></div>' +
          '<div class="bar' + (ov ? ' over' : '') + '" role="img" aria-label="' + esc(c.name) + ': ' + money(spent) + ' spent of ' + money(c.planned) + ' planned"><i style="width:' + (c.planned ? clamp(spent / c.planned * 100, 0, 100) : (spent ? 100 : 0)) + '%"></i></div>' +
          (open ? '<div class="cat-items">' + (items.length ? items.map(i => '<div class="item" role="button" tabindex="0" data-act="edit-item" data-id="' + esc(i.id) + '"><span class="n">' + esc(i.name) + (i.due && i.paid < i.cost ? '<br><span class="faint small">Due ' + esc(fmtDate(parseDay(i.due))) + '</span>' : '') + '</span><span class="small muted num">' + (i.paid >= i.cost && i.cost ? 'Paid' : 'Paid ' + money(i.paid)) + '</span><span class="a">' + money(i.cost) + '</span></div>').join('') : '<div class="hint" style="padding:8px">No expenses yet.</div>') +
            '<div class="cat-actions"><button class="btn small" type="button" data-act="add-item" data-cat="' + esc(c.id) + '">' + ic('plus', 'sm') + 'Add expense</button><button class="btn small ghost" type="button" data-act="edit-cat" data-id="' + esc(c.id) + '">Edit category</button></div></div>' : '') +
          '</div>';
      }).join('') +
    '</section>';
};
function donutSVG(slices, total) {
  const size = 170, r = 66, sw = 22, c = 2 * Math.PI * r, gap = slices.length > 1 ? 2 : 0;
  let off = 0, arcs = '';
  for (const s of slices) {
    const len = total ? s.v / total * c : 0;
    arcs += '<circle cx="85" cy="85" r="' + r + '" fill="none" stroke="' + s.col + '" stroke-width="' + sw + '" stroke-dasharray="' + Math.max(0, len - gap).toFixed(2) + ' ' + c.toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 85 85)"><title>' + esc(s.name) + ': ' + money(s.v) + '</title></circle>';
    off += len;
  }
  return '<svg class="donut" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" role="img" aria-label="Spending by category">' + '<circle cx="85" cy="85" r="' + r + '" fill="none" stroke="var(--surface-3)" stroke-width="' + sw + '"/>' + arcs +
    '<text x="85" y="80" text-anchor="middle" style="font:600 11px var(--f-ui);fill:var(--ink-2)">SPENT</text><text x="85" y="102" text-anchor="middle" style="font:600 19px var(--f-display);fill:var(--ink)">' + esc(money(total)) + '</text></svg>';
}
function editItem(id, catId, pre) {
  const it = id ? byId(S.budget.items, id) : null;
  openSheet({
    title: it ? 'Edit expense' : 'New expense',
    fields: [
      { k: 'name', label: 'What is it?', required: true, ph: 'Photographer, Dress, Invitations' },
      { k: 'cat', label: 'Category', type: 'select', options: S.budget.cats.map(c => ({ v: c.id, l: c.name })) },
      { row: [{ k: 'cost', label: 'Total cost', type: 'money' }, { k: 'paid', label: 'Paid so far', type: 'money' }] },
      { k: 'due', label: 'Next payment due', type: 'date', hint: 'Optional' },
      { k: 'note', label: 'Notes', type: 'textarea', ph: 'Optional' }
    ],
    values: Object.assign({}, it || { cat: catId || (S.budget.cats[0] || {}).id, cost: '', paid: '' }, pre || {}),
    onSave: v => { if (it) Object.assign(it, v); else S.budget.items.push(Object.assign({ id: uid() }, v)); openCats.add(v.cat); commit(); toast(it ? 'Expense saved' : 'Expense added'); },
    onDelete: it ? close => { const snap = snapshot(); S.budget.items = S.budget.items.filter(x => x !== it); close(); commit(); toast('Expense deleted', () => restoreSnapshot(snap)); } : null,
    deleteLabel: 'Delete expense'
  });
}
function editCat(id) {
  const c = id ? byId(S.budget.cats, id) : null;
  openSheet({
    title: c ? 'Edit category' : 'New category',
    fields: [{ k: 'name', label: 'Category name', required: true }, { k: 'planned', label: 'Planned amount', type: 'money' }],
    values: c ? c : { planned: '' },
    onSave: v => { if (c) Object.assign(c, v); else S.budget.cats.push(Object.assign({ id: uid() }, v)); commit(); },
    onDelete: c && S.budget.cats.length > 1 ? close => {
      const n = S.budget.items.filter(i => i.cat === c.id).length;
      askConfirm('Delete ' + c.name + '?', n ? 'Its ' + n + ' expense' + (n === 1 ? '' : 's') + ' will be deleted too.' : 'This category has no expenses.', 'Delete', true).then(ok => {
        if (!ok) return; const snap = snapshot(); S.budget.items = S.budget.items.filter(i => i.cat !== c.id); S.budget.cats = S.budget.cats.filter(x => x !== c); close(); commit(); toast('Category deleted', () => restoreSnapshot(snap));
      });
    } : null,
    deleteLabel: 'Delete category', deleteAsks: true
  });
}
function editTotal() {
  openSheet({
    title: 'Total budget',
    fields: [{ k: 'total', label: 'How much do you want to spend in total?', type: 'money' }],
    values: { total: S.budget.total || '' },
    onSave: v => { S.budget.total = v.total; commit(); }
  });
}
function splitBudget() {
  const t = S.budget.total; if (!t) return;
  splitInto(t); commit(); toast('Budget split across categories');
}
/* Round each category to $50, then put the few dollars left over on the biggest one so the plan matches the total exactly. */
function splitInto(t) {
  const hit = [];
  S.budget.cats.forEach(c => { const m = CAT_SPLIT.find(x => x[0] === c.name); if (m) { c.planned = Math.round(t * m[1] / 100 / 50) * 50; hit.push(c); } });
  if (!hit.length) return;
  const diff = t - sum(S.budget.cats, c => c.planned || 0), big = hit.reduce((a, b) => b.planned > a.planned ? b : a);
  big.planned = Math.max(0, big.planned + diff);
}

/* ---------- Vendors (the wallet lives in 7b-wallet.js) ---------- */
function editVendor(id, pre) {
  const v = id ? byId(S.vendors, id) : null;
  const filling = v && v.status === 'needed';
  openSheet({
    title: filling ? 'Your ' + v.kind.toLowerCase() : v ? 'Edit vendor' : 'New vendor',
    fields: [
      { k: 'name', label: 'Business name', ph: 'Leave blank if you haven’t picked one yet' },
      { row: [{ k: 'kind', label: 'Type', type: 'select', options: VENDOR_KINDS }, { k: 'status', label: 'Status', type: 'select', options: [{ v: 'needed', l: 'Still to book' }, { v: 'considering', l: 'Considering' }, { v: 'booked', l: 'Booked' }] }] },
      { k: 'contact', label: 'Contact person' },
      { row: [{ k: 'phone', label: 'Phone', type: 'tel' }, { k: 'email', label: 'Email', type: 'email' }] },
      { k: 'web', label: 'Website', type: 'url', ph: 'Optional' },
      { k: 'cost', label: 'Total cost', type: 'money' },
      { row: [{ k: 'deposit', label: 'Deposit', type: 'money' }, { k: 'depositDue', label: 'Deposit due', type: 'date' }] },
      { k: 'depositPaid', label: 'Deposit paid', type: 'toggle' },
      { k: 'balanceDue', label: 'Final balance due', type: 'date' },
      { k: 'balancePaid', label: 'Final balance paid', type: 'toggle' },
      { k: 'notes', label: 'Notes', type: 'textarea', ph: 'Contract details, what’s included, questions to ask' }
    ],
    values: Object.assign(v ? Object.assign({}, v, filling ? { status: 'booked' } : {}) : { kind: 'Photographer', status: 'considering', cost: '', deposit: '' }, pre || {}),
    onSave: x => {
      if (x.status !== 'needed' && !x.name) x.name = '';
      if (!x.name && x.status !== 'needed' && !x.contact && !x.cost) x.status = 'needed';
      let nv = v;
      if (v) Object.assign(v, x); else { nv = Object.assign({ id: uid() }, x); S.vendors.push(nv); }
      commit(); toast(v ? vendorTitle(nv) + ' saved' : vendorTitle(nv) + ' added');
    },
    onDelete: v ? close => { const snap = snapshot(); S.vendors = S.vendors.filter(x => x !== v); if (walletFocus === v.id) walletFocus = null; close(); commit(); toast(vendorTitle(v) + ' removed', () => restoreSnapshot(snap)); } : null,
    deleteLabel: 'Delete vendor'
  });
}

/* ---------- Checklist ---------- */
let tFilter = 'todo';
R.checklist = function () {
  const done = S.tasks.filter(t => t.done).length, total = S.tasks.length;
  const t0 = today0();
  let late = 0, nowSet = false;
  const taskRow = t => { const d = parseDay(t.due); return '<div class="li task' + (t.done ? ' done' : '') + '"><button class="check' + (t.done ? ' on' : '') + '" type="button" data-act="toggle-task" data-id="' + esc(t.id) + '" aria-pressed="' + t.done + '" aria-label="' + (t.done ? 'Mark not done: ' : 'Mark done: ') + esc(t.t) + '"><span>' + ic('check') + '</span></button><div class="tx" role="button" tabindex="0" data-act="edit-task" data-id="' + esc(t.id) + '"><b>' + esc(t.t) + '</b>' + (d && !t.done ? '<small class="' + (d < t0 ? 'bad' : '') + '">Due ' + esc(shortDate(d)) + ' · ' + esc(dueWords(d)) + '</small>' : '') + '</div></div>'; };
  const sections = BUCKETS.map(b => {
    const due = bucketDue(b);
    const items = S.tasks.filter(t => t.b === b.k);
    const left = items.filter(t => !t.done).length;
    const isLate = due && b.k !== 'after' && due < t0 && left > 0;
    if (isLate) late += left;
    let state = !items.length ? 'empty' : !left ? 'done' : isLate ? 'late' : '';
    if (!state && !nowSet) { state = 'now'; nowSet = true; }
    const shown = items.filter(t => tFilter === 'all' || (tFilter === 'todo' ? !t.done : t.done));
    if (!shown.length && tFilter !== 'all') return '';
    const when = due ? (b.k === 'd0' ? fmtDate(due, { weekday: 'short', month: 'short', day: 'numeric' }) : (b.k === 'after' ? 'By ' : 'Done by ') + fmtDate(due, { month: 'long', year: 'numeric' })) : '';
    return '<section class="tln ' + state + '"><div class="mhd"><b>' + esc(b.label) + (state === 'now' ? ' <span class="nowtag">Now</span>' : '') + '</b><span>' + (isLate ? '<span class="bad">' + left + ' overdue</span>' : esc(when)) + '</span></div>' +
      '<div class="list">' + shown.map(taskRow).join('') +
      '<button class="li addrow" type="button" data-act="add-task" data-b="' + b.k + '"><span class="liic t-plain">' + ic('plus') + '</span><span class="tx">Add a to-do</span></button></div>' +
      (items.length ? '<div class="note">' + (items.length - left) + ' of ' + items.length + ' done' + (isLate && when ? ' · ' + esc(when) : '') + '</div>' : '') + '</section>';
  }).join('');
  return '<div class="phead"><div><div class="eyebrow">Month by month</div><h1>To-do</h1><p>' + done + ' of ' + total + ' done' + (S.couple.date ? '' : ' · add your wedding date to see due dates') + '</p></div>' +
    '<div class="actions"><button class="btn primary" type="button" data-act="add-task">' + ic('plus') + 'Add to-do</button></div></div>' +
    '<div class="pstats"><div><b class="num">' + (total - done) + '</b><small>Open</small></div><div><b class="num"' + (late ? ' style="color:var(--warn)"' : '') + '>' + late + '</b><small>Late</small></div><div><b class="num">' + done + '</b><small>Done</small></div></div><div class="tfil">' +
    '<div class="seg" role="group" aria-label="Show">' + [['todo', 'To do'], ['done', 'Done'], ['all', 'All']].map(f => '<button type="button" data-act="tfilter" data-f="' + f[0] + '" aria-pressed="' + (tFilter === f[0]) + '">' + f[1] + '</button>').join('') + '</div></div>' +
    (sections ? '<div class="tlist">' + sections + '</div>' : '<div class="card empty"><div class="big">' + (tFilter === 'done' ? 'Nothing checked off yet' : 'Everything is done') + '</div></div>');
};
function editTask(id, bucket, pre) {
  const t = id ? byId(S.tasks, id) : null;
  openSheet({
    title: t ? 'Edit to-do' : 'New to-do',
    fields: [{ k: 't', label: 'To-do', required: true }, { k: 'b', label: 'When', type: 'select', options: BUCKETS.map(b => ({ v: b.k, l: b.label })) }, { k: 'due', label: 'Exact due date', type: 'date', hint: 'Optional. Shows it on your Coming up timeline.' }],
    values: Object.assign({}, t || { b: bucket || 'm1', due: '' }, pre || {}),
    onSave: v => { if (t) Object.assign(t, v); else S.tasks.push({ id: uid(), t: v.t, b: v.b, due: v.due || '', done: false }); commit(); toast(t ? 'To-do saved' : 'To-do added'); },
    onDelete: t ? close => { const snap = snapshot(); S.tasks = S.tasks.filter(x => x !== t); close(); commit(); toast('To-do deleted', () => restoreSnapshot(snap)); } : null,
    deleteLabel: 'Delete to-do'
  });
}

