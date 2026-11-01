/* ================= Guests and Seating, in the Credentials Tracker's family look =================
   Guests: one RSVP ring, a search, a filter, then guests in Settings-style groups. Tap a guest for their card.
   Seating: one ring for who's seated, the people who still need a seat, then the room. Tap a table to fill it. */
let gFilter = 'all', gSearch = '', gSort = 'group';
const sideCls = s => s === 'b' ? 'b' : s === 'both' ? 'both' : 'a';
const avatarHTML = (name, side, big) => '<span class="avatar ' + sideCls(side) + (big ? ' big' : '') + '" aria-hidden="true">' + esc(initials(name)) + '</span>';
const RSVP_WORD = { yes: 'Coming', pending: 'Waiting', no: 'Declined' };

/* ---------- Guests ---------- */
R.guests = function () {
  const gs = guestStats(), back = gs.yes + gs.no, rb = parseDay(S.couple.rsvpBy);
  const counts = { all: S.guests.length, yes: S.guests.filter(g => g.rsvp === 'yes').length, pending: S.guests.filter(g => g.rsvp === 'pending').length, no: S.guests.filter(g => g.rsvp === 'no').length };
  const rbDays = rb ? daysBetween(today0(), rb) : 0;
  const dueLine = rb ? 'RSVPs due ' + fmtDate(rb, { month: 'short', day: 'numeric' }) + (rbDays < 0 ? ' · date passed' : rbDays === 0 ? ' · today' : rbDays < 60 ? ' · ' + rbDays + ' day' + (rbDays === 1 ? '' : 's') + ' left' : '') : '';
  const meals = mealCounts(), diets = S.guests.filter(g => g.rsvp !== 'no' && g.diet), ms = mailStats();
  const head = '<div class="phead wallet-head"><div><div class="eyebrow">Who’s coming</div><h1>Guests</h1><p>' + gs.invited + ' invited · ' + gs.yes + ' coming' + (S.guests.length ? ' · ' + ms.units + ' invitation' + (ms.units === 1 ? '' : 's') : '') + '</p></div>' +
    '<button class="hdrbtn" type="button" data-act="guest-add-menu" aria-label="Add guests">' + ic('plus') + '</button></div>';
  if (!S.guests.length) return head + '<div class="card empty" style="margin-top:16px"><div class="big">Start your guest list</div>Add guests one at a time, or paste a whole list at once.<div class="btnrow" style="padding:14px 0 0;justify-content:center"><button class="btn" type="button" data-act="bulk-guests">' + ic('listadd') + 'Paste a list</button><button class="btn primary" type="button" data-act="add-guest">' + ic('plus') + 'Add a guest</button></div></div>';
  return head +
    '<div class="ringcard rsvpcard"><div class="rings n1"><div class="ringit">' + ringBox(gs.invited ? back / gs.invited : 0, Math.round((gs.invited ? back / gs.invited : 0) * 100) + '%', 'back', 'var(--good)') +
      '<span class="rt"><b>' + (gs.pending ? gs.pending + ' still waiting' : 'Everyone has answered') + '</b><small>' + gs.yes + ' coming · ' + gs.no + ' declined</small>' +
      (dueLine ? '<small class="' + (rb && daysBetween(today0(), rb) < 0 && gs.pending ? 'late' : '') + '">' + esc(dueLine) + '</small>' : '<small><button class="lnk" type="button" data-act="edit-couple">Set an RSVP date</button></small>') +
      (gs.pending ? '<button class="lnk rsvp-nudge" type="button" data-act="helper" data-k="msg" data-for="rsvp">Write a reminder</button>' : '') + '</span></div></div></div>' +
    '<div class="searchbox gsearch">' + ic('search') + '<input class="input" id="g-search" type="search" placeholder="Search guests" aria-label="Search guests" value="' + esc(gSearch) + '"></div>' +
    '<div class="segc" role="group" aria-label="Show">' + [['all', 'All'], ['yes', 'Coming'], ['pending', 'Waiting'], ['no', 'Declined']].map(f => '<button type="button" data-act="gfilter" data-f="' + f[0] + '"' + (gFilter === f[0] ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + f[1] + ' <span class="num">' + counts[f[0]] + '</span></button>').join('') + '</div>' +
    '<div class="sortrow"><span>Sort</span><div class="seg" role="group" aria-label="Sort">' + [['group', 'Groups'], ['az', 'A to Z'], ['table', 'Tables']].map(o => '<button type="button" data-act="gsort" data-s="' + o[0] + '" aria-pressed="' + (gSort === o[0]) + '">' + o[1] + '</button>').join('') + '</div></div>' +
    '<div id="g-list"></div>' +
    '<div class="group"><div class="group-h"><h2>Invitations</h2><span class="tot">One per household</span></div><div class="list">' +
      '<button type="button" class="li" data-act="envelopes"><span class="liic t-pink">' + ic('mail') + '</span><span class="tx"><b>Envelopes and labels</b><small' + (ms.missing ? ' class="warnt"' : '') + '>' + ms.units + ' invitation' + (ms.units === 1 ? '' : 's') + (ms.missing ? ' · ' + ms.missing + ' need' + (ms.missing === 1 ? 's' : '') + ' an address' : ' · every address is in') + '</small></span>' + ic('chev', 'sm') + '</button>' +
      (ms.missing ? '<button type="button" class="li" data-act="helper" data-k="msg" data-for="addr"><span class="liic t-info">' + ic('chat') + '</span><span class="tx"><b>Ask for addresses</b><small>A friendly text you can send</small></span>' + ic('chev', 'sm') + '</button>' : '') +
    '</div></div>' +
    (meals.list.length || meals.unset ? '<div class="group"><div class="group-h"><h2>Meals</h2><span class="tot">For the ' + gs.yes + ' coming</span></div><div class="list noicons">' +
      meals.list.map(([m, n]) => '<div class="li"><span class="tx"><b>' + esc(m) + '</b></span><span class="amt num">' + n + '</span></div>').join('') +
      (meals.unset ? '<button type="button" class="li" data-act="gfilter" data-f="yes"><span class="tx"><b class="warnt">No choice yet</b><small>Meal not picked</small></span><span class="amt num warnt">' + meals.unset + '</span></button>' : '') +
      '</div><p class="note">Change the meal choices in Menu.</p></div>' : '') +
    (diets.length ? '<div class="group"><div class="group-h"><h2>Allergies and diets</h2><span class="tot">For your caterer</span></div><div class="list glist">' +
      diets.map(g => '<button type="button" class="li grow" data-act="guest-card" data-id="' + esc(g.id) + '">' + avatarHTML(g.name, g.side) + '<span class="tx"><b>' + esc(g.name) + '</b><small class="warnt">' + esc(g.diet) + '</small></span>' + ic('chev', 'sm') + '</button>').join('') + '</div></div>' : '') +
    '<div class="group"><div class="group-h"><h2>Share and add</h2></div><div class="list">' +
      '<button type="button" class="li" data-act="bulk-guests"><span class="liic t-accent">' + ic('listadd') + '</span><span class="tx"><b>Paste a list of names</b><small>One name per line, all at once</small></span>' + ic('chev', 'sm') + '</button>' +
      '<button type="button" class="li" data-act="print-guests"><span class="liic t-info">' + ic('pdf') + '</span><span class="tx"><b>Guest list PDF</b><small>Names, RSVPs, meals and tables</small></span>' + ic('chev', 'sm') + '</button>' +
      '<button type="button" class="li" data-act="export-csv"><span class="liic t-good">' + ic('save') + '</span><span class="tx"><b>Copy for Excel or Sheets</b><small>A CSV file</small></span>' + ic('chev', 'sm') + '</button>' +
    '</div></div>';
};
function guestRow(g) {
  const tbl = g.table && byId(S.tables, g.table);
  const bits = [];
  if (g.rsvp === 'yes') bits.push(g.meal || 'No meal yet');
  if (g.plus) bits.push('+1' + (g.plusName ? ' ' + firstName(g.plusName) : ''));
  if (g.rsvp !== 'no') bits.push(tbl ? tbl.name : 'No seat');
  return '<div class="li grow" role="button" tabindex="0" data-act="guest-card" data-id="' + esc(g.id) + '">' + avatarHTML(g.name, g.side) +
    '<span class="tx"><b>' + esc(g.name) + (g.diet ? '<i class="dietdot" title="' + esc(g.diet) + '" aria-label="Has a dietary need"></i>' : '') + '</b><small>' + esc(bits.join(' · ')) + '</small></span>' +
    '<button type="button" class="rsvp ' + g.rsvp + '" data-act="cycle-rsvp" data-id="' + esc(g.id) + '" aria-label="RSVP ' + RSVP_WORD[g.rsvp] + '. Tap to change">' + RSVP_WORD[g.rsvp] + '</button></div>';
}
function guestSections(rows) {
  const by = (keyOf, order) => {
    const m = new Map(); rows.forEach(g => { const k = keyOf(g); if (!m.has(k)) m.set(k, []); m.get(k).push(g); });
    return Array.from(m.entries()).sort(order);
  };
  if (gSort === 'az') return by(g => (lastName(g.name)[0] || '#').toUpperCase(), (a, b) => a[0].localeCompare(b[0]));
  if (gSort === 'table') {
    const idx = id => S.tables.findIndex(t => t.id === id);
    return by(g => g.rsvp === 'no' ? 'Not coming' : (byId(S.tables, g.table) || {}).name || 'No seat yet', (a, b) => {
      const rank = x => x[0] === 'No seat yet' ? -1 : x[0] === 'Not coming' ? 1e4 : idx((S.tables.find(t => t.name === x[0]) || {}).id);
      return rank(a) - rank(b);
    });
  }
  return by(g => g.group.trim() || 'No group', (a, b) => (a[0] === 'No group') - (b[0] === 'No group') || b[1].length - a[1].length || a[0].localeCompare(b[0]));
}
R.guestsAfter = function (main) {
  const list = $('#g-list', main); if (!list) return;
  const draw = () => {
    const q = gSearch.toLowerCase().trim();
    const rows = S.guests.filter(g => gFilter === 'all' || g.rsvp === gFilter)
      .filter(g => !q || (g.name + ' ' + g.plusName + ' ' + g.group + ' ' + g.diet).toLowerCase().includes(q))
      .sort((a, b) => lastName(a.name).localeCompare(lastName(b.name)) || a.name.localeCompare(b.name));
    list.innerHTML = rows.length ? guestSections(rows).map(([k, gs]) => '<div class="group"><div class="group-h"><h2>' + esc(k) + '</h2><span class="tot num">' + gs.length + '</span></div><div class="list glist">' + gs.map(guestRow).join('') + '</div></div>').join('')
      : '<div class="list" style="margin-top:16px"><div class="empty">' + (q ? 'No guests match “' + esc(gSearch) + '”.' : 'No one here yet.') + '</div></div>';
  };
  draw();
  $('#g-search', main).addEventListener('input', e => { gSearch = e.target.value; draw(); });
};
function guestAddMenu() {
  openSheet({
    title: 'Add guests', noFocus: true,
    body: '<div class="list">' +
      '<button type="button" class="li" data-go="one"><span class="liic t-accent">' + ic('plus') + '</span><span class="tx"><b>One guest</b><small>Name, RSVP, meal and plus-one</small></span>' + ic('chev', 'sm') + '</button>' +
      '<button type="button" class="li" data-go="list"><span class="liic t-info">' + ic('listadd') + '</span><span class="tx"><b>Paste a list</b><small>One name per line, all at once</small></span>' + ic('chev', 'sm') + '</button></div>' +
      '<p class="hint" style="margin:0">Or type it in Quick add on Home, like “Sophie Nguyen is coming, fish”.</p>',
    onMount: (sc, close) => sc.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (!b) return; close(); if (b.dataset.go === 'one') editGuest(null); else bulkGuests(); })
  });
}
/* A guest's card: who they are, their RSVP in one tap, and everything else at a glance. */
function guestCard(id) {
  const g = byId(S.guests, id); if (!g) return;
  const tbl = g.table && byId(S.tables, g.table), ptbl = g.plusTable && byId(S.tables, g.plusTable);
  const email = (g.contact.match(/[^\s,;]+@[^\s,;]+\.[a-z]{2,}/i) || [])[0] || '';
  const phoneM = g.contact.match(/\+?\d[\d\s().-]{6,}\d/), phone = phoneM ? phoneM[0].replace(/[^\d+]/g, '') : '';
  const row = (label, val, act, cls) => '<' + (act ? 'button type="button" data-do="' + act + '"' : 'div') + ' class="li kvrow"><span class="tx"><b>' + label + '</b></span><span class="val' + (cls ? ' ' + cls : '') + '">' + val + '</span>' + (act ? ic('chev', 'sm') : '') + '</' + (act ? 'button' : 'div') + '>';
  const rows = [];
  if (g.rsvp !== 'no') rows.push(row('Seat', tbl ? esc(tbl.name) : 'Not seated yet', 'seat', tbl ? '' : 'warnt'));
  if (g.rsvp === 'yes') rows.push(row('Meal', g.meal ? esc(g.meal) : 'Not chosen yet', 'edit', g.meal ? '' : 'warnt'));
  if (g.plus) rows.push(row('Plus-one', esc(g.plusName || 'Name not known yet') + (g.rsvp === 'yes' && g.plusMeal ? ' · ' + esc(g.plusMeal) : ''), g.rsvp !== 'no' ? 'seatplus' : 'edit'));
  if (g.plus && g.rsvp !== 'no') rows.push(row('Plus-one seat', ptbl ? esc(ptbl.name) : 'Not seated yet', 'seatplus', ptbl ? '' : 'warnt'));
  if (g.diet) rows.push(row('Allergies or diet', esc(g.diet), '', 'warnt'));
  const hh = hhById(g.hh), ad = addrLines(addrOf(g));
  rows.push(row('Address', ad.length ? esc(ad[0]) + (ad.length > 1 ? '<small>' + esc(ad.slice(1).join(', ')) + '</small>' : '') : 'Add address', 'addr', ad.length ? '' : 'warnt'));
  rows.push(row('Household', hh ? esc(envName(hhMembers(hh.id), hh)) + '<small>' + (unitNames(hhMembers(hh.id)).out.length) + ' people, one invitation</small>' : 'Own invitation', 'hh'));
  if (g.contact) rows.push(row('Phone or email', esc(g.contact)));
  if (g.group) rows.push(row('Group', esc(g.group)));
  const acts = (phone ? '<a class="btn" href="tel:' + esc(phone) + '">' + ic('phone') + 'Call</a><a class="btn" href="sms:' + esc(phone) + '">' + ic('chat') + 'Text</a>' : '') + (email ? '<a class="btn" href="mailto:' + esc(email) + '">' + ic('mail') + 'Email</a>' : '');
  openSheet({
    title: g.name, noFocus: true,
    top: '<div class="ghead">' + avatarHTML(g.name, g.side, true) + '<div><b>' + esc(sideLabel(g.side)) + '</b><small>' + esc(g.group || 'No group') + (g.plus ? ' · bringing a plus-one' : '') + '</small></div></div>' +
      '<div class="segc rsvpseg" role="group" aria-label="RSVP">' + ['pending', 'yes', 'no'].map(k => '<button type="button" data-rsvp="' + k + '"' + (g.rsvp === k ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + RSVP_WORD[k] + '</button>').join('') + '</div>',
    body: (rows.length ? '<div class="list noicons">' + rows.join('') + '</div>' : '') +
      (acts ? '<div class="gacts">' + acts + '</div>' : '') +
      (g.notes ? '<div class="sub-h" style="margin-top:0">Notes</div><p class="notes" style="margin:0">' + esc(g.notes) + '</p>' : '') +
      '<button class="btn primary" type="button" data-do="edit">' + ic('edit') + 'Edit guest</button>',
    onMount: (sc, close) => sc.addEventListener('click', e => {
      const r = e.target.closest('[data-rsvp]');
      if (r) {
        g.rsvp = r.dataset.rsvp; if (g.rsvp === 'no') { g.table = null; g.plusTable = null; }
        commit({ quiet: true }); close(); guestCard(g.id); toast(g.name + ': ' + RSVP_WORD[g.rsvp]); return;
      }
      const b = e.target.closest('[data-do]'); if (!b) return;
      close();
      if (b.dataset.do === 'edit') editGuest(g.id);
      else if (b.dataset.do === 'seat') seatPerson(g.id + ':0');
      else if (b.dataset.do === 'seatplus') seatPerson(g.id + ':1');
      else if (b.dataset.do === 'addr') editAddress(unitOf(g), () => guestCard(g.id));
      else if (b.dataset.do === 'hh') householdSheet(g, () => guestCard(g.id));
    })
  });
}

/* ---------- Seating ---------- */
R.seating = function () {
  const ppl = people(), unseated = ppl.filter(p => !p.table), seated = ppl.length - unseated.length;
  const cap = sum(S.tables, t => t.seats), open = Math.max(0, cap - seated);
  const head = '<div class="phead wallet-head"><div><div class="eyebrow">The reception</div><h1>Seating</h1><p>' + S.tables.length + ' table' + (S.tables.length === 1 ? '' : 's') + ' · ' + cap + ' seats</p></div>' +
    '<button class="hdrbtn" type="button" data-act="add-table" aria-label="Add a table">' + ic('plus') + '</button></div>';
  const pct = ppl.length ? seated / ppl.length : 0;
  const card = '<div class="ringcard seatcard"><div class="rings n1"><div class="ringit">' + ringBox(pct, Math.round(pct * 100) + '%', 'seated', 'var(--info)') +
    '<span class="rt"><b>' + (!ppl.length ? 'No guests to seat yet' : unseated.length ? unseated.length + ' still need a seat' : 'Everyone has a seat') + '</b><small>' + seated + ' of ' + ppl.length + ' seated · ' + open + ' open seat' + (open === 1 ? '' : 's') + '</small>' +
    (cap < ppl.length ? '<small class="late">' + (ppl.length - cap) + ' more seats needed. Add a table.</small>' : '') + '</span></div></div>' +
    '<div class="seatacts">' + (S.tables.length && unseated.length ? '<button class="btn primary" type="button" data-act="helper" data-k="seat">' + ic('wand') + 'Seat everyone</button>' : '') +
      (S.tables.length ? '<button class="btn" type="button" data-act="print-seating">' + ic('print') + 'Print chart</button>' : '') + '</div></div>';
  const chip = p => '<button type="button" class="chip ' + sideCls(p.g.side) + (p.pending ? ' pend' : '') + '" data-drag="' + esc(p.key) + '" data-act="seat-person" data-key="' + esc(p.key) + '" data-name="' + esc(p.name.toLowerCase()) + '" aria-label="' + esc(p.name) + (p.pending ? ', RSVP waiting' : '') + '. Tap to choose a table">' + '<span class="dot">' + esc(initials(p.name)) + '</span>' + esc(p.name) + '</button>';
  const tray = unseated.length ? '<div class="group"><div class="group-h"><h2>Need a seat</h2><span class="tot num">' + unseated.length + '</span></div>' +
    '<aside class="tray" data-drop="none" aria-label="Guests not seated yet">' +
      (unseated.length > 8 ? '<div class="searchbox" style="margin-bottom:10px">' + ic('search') + '<input class="input" id="s-search" type="search" placeholder="Find a guest" aria-label="Find a guest"></div>' : '') +
      '<div class="chips" id="s-chips">' + unseated.sort((a, b) => lastName(a.name).localeCompare(lastName(b.name))).map(chip).join('') + '</div>' +
      '<p class="note" style="padding:8px 2px 0">' + (isTouch() ? 'Tap a name to pick a table, or press, hold and drag it.' : 'Click a name to pick a table, or drag it onto one.') + (unseated.some(p => p.pending) ? ' Dashed names haven’t answered yet.' : '') + '</p>' +
    '</aside></div>' : '';
  const tables = '<div class="group"><div class="group-h"><h2>Tables</h2>' + '' + '</div>' +
    (S.tables.length ? '<div class="tgrid">' + S.tables.map(t => tableTile(t, ppl.filter(p => p.table === t.id))).join('') + '</div>'
      : '<div class="card empty"><div class="big">Add your tables</div>Start with one table, or add a full room at once.<div class="btnrow" style="padding:14px 0 0;justify-content:center"><button class="btn" type="button" data-act="quick-tables">' + ic('seating') + '10 round tables of 8</button><button class="btn primary" type="button" data-act="add-table">' + ic('plus') + 'One table</button></div></div>') + '</div>';
  return head + card + tray + tables;
};
/* The table drawn from above: seats around it, filled seats show initials in the guest's side color. */
function tableArt(t, at, big) {
  const n = t.seats; let seats = '';
  const sz = big ? (n > 14 ? 26 : n > 10 ? 30 : 34) : (n > 14 ? 16 : n > 10 ? 19 : 22);
  const seat = (x, y, p) => '<span class="seat' + (p ? ' on ' + sideCls(p.g.side) + (p.pending ? ' pend' : '') : '') + '" style="left:' + x.toFixed(2) + '%;top:' + y.toFixed(2) + '%;--sz:' + sz + 'px">' + (p && (big || sz >= 19) ? esc(initials(p.name)) : '') + '</span>';
  if (t.shape === 'round') for (let i = 0; i < n; i++) { const a = (-90 + i * 360 / n) * Math.PI / 180; seats += seat(50 + 42 * Math.cos(a), 50 + 42 * Math.sin(a), at[i]); }
  else { const top = Math.ceil(n / 2), bot = n - top; for (let i = 0; i < n; i++) { const isTop = i < top, k = isTop ? i : i - top, cnt = isTop ? top : bot; seats += seat(10 + 80 * (k + .5) / cnt, isTop ? 14 : 86, at[i]); } }
  const full = at.length >= n;
  return '<div class="tgfx">' + seats + '<div class="tcore' + (full ? ' full' : '') + '">' + (full ? ic('check') : '<b class="num">' + at.length + '<i>/' + n + '</i></b>') + '</div></div>';
}
function tableTile(t, at) {
  const open = t.seats - at.length;
  return '<div class="ttile ' + esc(t.shape) + '" data-drop="' + esc(t.id) + '" data-act="open-table" data-id="' + esc(t.id) + '" role="button" tabindex="0" aria-label="' + esc(t.name) + ', ' + at.length + ' of ' + esc(t.seats) + ' seats filled">' +
    tableArt(t, at) + '<div class="tl"><b>' + esc(t.name) + '</b><small class="' + (open <= 0 ? 'ok' : '') + '">' + (open <= 0 ? 'Full' : at.length ? open + ' open' : t.seats + ' seats, empty') + '</small></div></div>';
}
R.seatingAfter = function (main) {
  const s = $('#s-search', main);
  if (s) s.addEventListener('input', () => { const q = s.value.toLowerCase(); $$('#s-chips .chip', main).forEach(c => c.hidden = q && !c.dataset.name.includes(q)); });
};
/* Tap a table: see it drawn big, who sits there, and fill the open seats in one go. */
function tableSheet(id) {
  const t = byId(S.tables, id); if (!t) return;
  const at = people().filter(p => p.table === t.id), open = t.seats - at.length, waiting = people().filter(p => !p.table).length;
  openSheet({
    title: t.name, noFocus: true,
    top: '<p class="lead">' + (t.shape === 'round' ? 'Round' : 'Long') + ' table · ' + at.length + ' of ' + esc(t.seats) + ' seats taken</p>' +
      '<div class="ttile big ' + esc(t.shape) + '">' + tableArt(t, at, true) + '</div>',
    body: (at.length ? '<div class="sub-h" style="margin:0">Seated here</div><div class="list glist">' + at.map(p => '<div class="li">' + avatarHTML(p.name, p.g.side) + '<span class="tx"><b>' + esc(p.name) + '</b><small>' + esc([p.plus ? 'Plus-one of ' + firstName(p.g.name) : '', p.pending ? 'Hasn’t answered' : p.g.rsvp === 'yes' && (p.plus ? p.g.plusMeal : p.g.meal) ? (p.plus ? p.g.plusMeal : p.g.meal) : '', !p.plus && p.g.diet ? p.g.diet : ''].filter(Boolean).join(' · ') || sideLabel(p.g.side)) + '</small></span>' +
        '<button class="smallbtn" type="button" data-move="' + esc(p.key) + '">Move</button><button class="lx" type="button" data-unseat="' + esc(p.key) + '" aria-label="Take ' + esc(p.name) + ' off this table">' + ic('x', 'sm') + '</button></div>').join('') + '</div>'
      : '<div class="list"><div class="empty">No one sits here yet.</div></div>') +
      '<div class="btnrow" style="padding:0">' + (open > 0 && waiting ? '<button class="btn primary" type="button" data-do="fill">' + ic('plus') + 'Add guests</button>' : '') + '<button class="btn" type="button" data-do="edit">' + ic('edit') + 'Edit table</button></div>',
    onMount: (sc, close) => sc.addEventListener('click', e => {
      const u = e.target.closest('[data-unseat]'), m = e.target.closest('[data-move]'), d = e.target.closest('[data-do]');
      if (u) { const p = personByKey(u.dataset.unseat); setSeat(u.dataset.unseat, null); commit({ quiet: true }); close(); tableSheet(t.id); toast((p ? shortName(p.name) : 'Guest') + ' unseated'); }
      else if (m) { close(); seatPerson(m.dataset.move); }
      else if (d) { close(); if (d.dataset.do === 'fill') fillTable(t.id); else editTable(t.id); }
    })
  });
}
/* Tick who sits at a table. Groups stay together in the list so families are easy to pick. */
function fillTable(id) {
  const t = byId(S.tables, id); if (!t) return;
  const open = t.seats - people().filter(p => p.table === t.id).length;
  const un = people().filter(p => !p.table).sort((a, b) => (a.g.group || '~').localeCompare(b.g.group || '~') || lastName(a.g.name).localeCompare(lastName(b.g.name)) || a.plus - b.plus);
  let last = null, body = '';
  un.forEach(p => {
    const grp = p.g.group || 'No group';
    if (grp !== last) { body += (last === null ? '' : '</div>') + '<div class="sub-h">' + esc(grp) + '</div><div class="list glist">'; last = grp; }
    body += '<label class="li pick">' + avatarHTML(p.name, p.g.side) + '<span class="tx"><b>' + esc(p.name) + '</b><small>' + esc(p.plus ? 'Plus-one of ' + firstName(p.g.name) : p.pending ? 'Hasn’t answered' : sideLabel(p.g.side)) + '</small></span><input type="checkbox" value="' + esc(p.key) + '" aria-label="Seat ' + esc(p.name) + '"></label>';
  });
  if (last !== null) body += '</div>';
  openSheet({
    title: 'Add to ' + t.name, saveLabel: 'Seat them', noFocus: true,
    top: '<p class="lead" id="fillCount">' + open + ' open seat' + (open === 1 ? '' : 's') + '. Tick who sits here.</p>',
    body: body || '<div class="empty">Everyone already has a seat.</div>',
    onMount: sc => sc.addEventListener('change', () => {
      const n = $$('input[type=checkbox]:checked', sc).length;
      $$('input[type=checkbox]', sc).forEach(c => { c.disabled = !c.checked && n >= open; c.closest('.li').classList.toggle('off', c.disabled); });
      $('#fillCount', sc).textContent = n ? n + ' of ' + open + ' open seats picked.' : open + ' open seat' + (open === 1 ? '' : 's') + '. Tick who sits here.';
    }),
    onSave: (v, sc) => {
      const keys = $$('input[type=checkbox]:checked', sc).map(c => c.value).slice(0, open);
      if (!keys.length) { toast('Tick at least one guest'); return false; }
      keys.forEach(k => setSeat(k, t.id)); commit({ quiet: true });
      toast(keys.length + ' seated at ' + t.name);
    }
  });
}
function seatPerson(key) {
  const p = personByKey(key); if (!p) return;
  const ppl = people();
  const opts = S.tables.map(t => {
    const n = ppl.filter(x => x.table === t.id).length, here = p.table === t.id, full = n >= t.seats && !here, pct = n / t.seats;
    return '<button class="li" type="button" data-pick="' + esc(t.id) + '"' + (full ? ' disabled' : '') + '><span class="tmini">' + ringBox(pct, '', '', full ? 'var(--ink-3)' : 'var(--info)') + '</span><span class="tx"><b>' + esc(t.name) + '</b><small>' + (full ? 'Full' : (t.seats - n) + ' of ' + esc(t.seats) + ' seats open') + '</small></span>' + (here ? '<span class="rsvp yes">Here now</span>' : full ? '' : ic('chev', 'sm')) + '</button>';
  }).join('');
  openSheet({
    title: 'Seat ' + shortName(p.name), noFocus: true,
    top: p.pending ? '<p class="lead">' + esc(firstName(p.g.name)) + ' hasn’t answered yet. You can still save a seat.</p>' : '',
    body: (S.tables.length ? '<div class="list">' + opts + '</div>' : '<div class="empty">Add a table first.</div>') + (p.table ? '<button class="btn" type="button" data-pick="">' + ic('x') + 'Take off ' + esc((byId(S.tables, p.table) || {}).name || 'table') + '</button>' : ''),
    onMount: (sc, close) => sc.addEventListener('click', e => { const b = e.target.closest('[data-pick]'); if (!b || b.disabled) return; const tid = b.dataset.pick || null; setSeat(key, tid); close(); commit(); toast(tid ? shortName(p.name) + ' → ' + byId(S.tables, tid).name : shortName(p.name) + ' unseated'); })
  });
}
Object.assign(EXTRA_ACTS, {
  'guest-card': el => guestCard(el.dataset.id),
  'guest-add-menu': guestAddMenu,
  'gsort': el => { gSort = el.dataset.s; render(); }
});
