/* ================= Smart helpers. They run on this device with simple rules, no AI service, so nothing leaves the phone. ================= */
const VENDOR_LEAD = { 'Venue': 12, 'Planner': 12, 'Photographer': 10, 'Caterer': 10, 'Videographer': 9, 'DJ or band': 9, 'Attire': 9, 'Florist': 8, 'Officiant': 6, 'Hair & makeup': 6, 'Stationery': 6, 'Cake & desserts': 5, 'Rentals': 5, 'Transportation': 4, 'Other': 4 };
const HELPERS = [
  { k: 'checkup', icon: 'sparkle', name: 'Plan check-up', sub: 'What needs you now, and why' },
  { k: 'day', icon: 'clock', name: 'Build my day', sub: 'A full timeline from your ceremony time' },
  { k: 'math', icon: 'calc', name: 'Party math', sub: 'Drinks, cake, chairs, favors, invitations' },
  { k: 'seat', icon: 'seating', name: 'Seat everyone', sub: 'Fills tables by family and friend group' },
  { k: 'msg', icon: 'chat', name: 'Write a message', sub: 'To vendors, guests or your wedding party' },
  { k: 'thanks', icon: 'gift', name: 'Thank-you notes', sub: 'A warm, personal note in one tap' },
  { k: 'budget', icon: 'cash', name: 'Budget coach', sub: 'Where your money goes, and where to save' },
  { k: 'vows', icon: 'pen', name: 'Vow starter', sub: 'Prompts to get the words flowing' }
];

/* ---------- Plan check-up: plain rules that catch what couples usually miss ---------- */
function nudges() {
  const out = [], t0 = today0(), w = weddingDay(), days = w ? daysBetween(t0, w) : null, gs = guestStats();
  const add = (tone, t, s, act, extra) => out.push(Object.assign({ tone, t, s, act }, extra || {}));
  if (!w) add('warn', 'Add your wedding date', 'Due dates, the countdown and these tips all start from it.', 'edit-couple');
  if (w && days >= 0) {
    const months = days / 30.4;
    S.vendors.filter(v => v.status === 'needed').forEach(v => { const lead = own(VENDOR_LEAD, v.kind) ? VENDOR_LEAD[v.kind] : 4; if (months < lead + 1) add(months < lead ? 'bad' : 'warn', 'Book your ' + v.kind.toLowerCase() + ' soon', 'Most couples book about ' + lead + ' months ahead. You have ' + Math.max(0, Math.round(months)) + ' months left.', 'wallet-open', { id: v.id }); });
    const inv = S.tasks.find(x => /invitation/i.test(x.t) && !x.done);
    if (inv && days <= 70 && days > 21) add(days < 42 ? 'bad' : 'warn', 'Send your invitations', 'Invitations usually go out 6 to 8 weeks before. You’re ' + Math.round(days / 7) + ' weeks out.', 'edit-task', { id: inv.id });
    if (!S.couple.rsvpBy && days > 21) add('info', 'Pick an RSVP deadline', 'Most couples ask for answers about 4 weeks before, so the caterer gets a count in time.', 'edit-couple');
    const lic = S.tasks.find(x => /licen[cs]e/i.test(x.t) && !x.done);
    if (lic && days <= 60) add('warn', 'Get your marriage license', 'In many places it’s only good for 30 to 90 days. Check your county’s rules and what ID to bring.', 'edit-task', { id: lic.id });
    if (days <= 21 && gs.pending) add('warn', 'Give your caterer a final count', 'Caterers usually want it about 2 weeks before. ' + gs.pending + ' guests still haven’t answered.', 'helper', { k: 'msg', for: 'rsvp' });
    if (days <= 90 && !S.day.length) add('info', 'Build your day-of timeline', 'One tap makes a full schedule from your ceremony time. Share it with your wedding party.', 'helper', { k: 'day' });
  }
  const rb = parseDay(S.couple.rsvpBy);
  if (rb && rb < t0 && gs.pending) add('bad', gs.pending + ' guests haven’t answered', 'Your RSVP date has passed. A friendly reminder usually does it.', 'helper', { k: 'msg', for: 'rsvp' });
  for (const p of payments()) { if (!p.due) continue; const n = daysBetween(t0, p.due); if (n < 0) add('bad', vendorTitle(p.v) + ' ' + p.kind.toLowerCase() + ' is late', money(p.amount) + ' was due ' + shortDate(p.due) + '.', 'wallet-open', { id: p.v.id }); else if (n <= 14) add('warn', vendorTitle(p.v) + ' ' + p.kind.toLowerCase() + ' is due ' + dueWords(p.due), money(p.amount) + ' on ' + shortDate(p.due) + '.', 'wallet-open', { id: p.v.id }); }
  const ppl = people(), seats = sum(S.tables, t => t.seats), noMeal = S.guests.filter(g => g.rsvp === 'yes' && (!g.meal || (g.plus && !g.plusMeal))).length;
  if (noMeal) add('info', noMeal + ' coming guest' + (noMeal === 1 ? ' has' : 's have') + ' no meal picked', 'Your caterer will need every meal choice.', 'go', { to: 'guests' });
  if (S.tables.length && ppl.length > seats) add('warn', 'You need ' + (ppl.length - seats) + ' more seats', ppl.length + ' people could come, and your tables seat ' + seats + '.', 'go', { to: 'seating' });
  else if (w && days <= 42 && ppl.some(p => !p.table && !p.pending)) add('info', ppl.filter(p => !p.table && !p.pending).length + ' coming guests have no seat', 'Seat everyone can fill the tables by group for you.', 'helper', { k: 'seat' });
  const bt = budgetTotals();
  if (bt.total && bt.spent > bt.total) add('bad', 'You’re ' + money(bt.spent - bt.total) + ' over budget', 'The budget coach shows which categories ran over.', 'helper', { k: 'budget' });
  if (w && days < 0) { const left = S.gifts.filter(g => !g.thanked).length; if (left) add('warn', left + ' thank-you note' + (left === 1 ? '' : 's') + ' to write', 'Most couples send them within 3 months. The helper writes a first draft.', 'helper', { k: 'thanks' }); }
  if (needsBackup()) add('info', 'Save a backup', 'Your plan lives only on this device.', 'backup-now');
  const rank = { bad: 0, warn: 1, info: 2 };
  return out.sort((a, b) => rank[a.tone] - rank[b.tone]);
}
function nudgeRow(n) {
  return '<button type="button" class="nudge ' + n.tone + '" data-act="' + n.act + '"' + (n.id ? ' data-id="' + esc(n.id) + '"' : '') + (n.to ? ' data-to="' + n.to + '"' : '') + (n.k ? ' data-k="' + n.k + '"' : '') + (n.for ? ' data-for="' + n.for + '"' : '') + '><span class="ndot" aria-hidden="true">' + ic(n.tone === 'info' ? 'sparkle' : 'alert', 'sm') + '</span><span class="tx"><b>' + esc(n.t) + '</b><small>' + esc(n.s) + '</small></span>' + ic('chev', 'sm') + '</button>';
}
function nudgeCard() {
  const n = nudges().filter(x => x.act !== 'backup-now');
  if (!n.length) return '';
  return '<section class="card nudgecard"><div class="card-head"><h2>' + ic('sparkle', 'sm') + 'Smart tip</h2>' + (n.length > 1 ? '<a href="#helpers">' + (n.length - 1) + ' more</a>' : '') + '</div>' + nudgeRow(n[0]) + '</section>';
}

R.helpers = function () {
  const n = nudges();
  return '<div class="phead"><div><div class="eyebrow">Your planning sidekick</div><h1>Smart helpers</h1><p>Private, right on this phone</p></div></div>' +
    '<section class="card"><div class="card-head"><h2>Plan check-up</h2><span class="pill ' + (n.some(x => x.tone === 'bad') ? 'bad' : n.length ? 'warn' : 'good') + '">' + (n.length ? n.length + ' to look at' : 'All good') + '</span></div>' +
      (n.length ? '<div class="nudges">' + n.map(nudgeRow).join('') + '</div>' : '<div class="empty" style="padding:16px"><div class="big">You’re on track</div>Nothing needs you right now.</div>') + '</section>' +
    '<div class="bdgrid" style="margin-top:16px">' + HELPERS.filter(h => h.k !== 'checkup').map(h => '<button type="button" class="bdtile" data-act="helper" data-k="' + h.k + '"><span class="bdic">' + ic(h.icon) + '</span><b>' + h.name + '</b><small>' + h.sub + '</small></button>').join('') + '</div>';
};

/* ---------- Build my day ---------- */
function buildDay(o) {
  const c = hm(o.time) || 990, out = [], v = k => { const x = S.vendors.find(y => y.kind === k && y.status === 'booked'); return x ? vendorTitle(x) : ''; };
  const who = S.party.length ? 'Wedding party' : '';
  const at = (min, t, w, place) => out.push({ id: uid(), time: hmStr(c + min), t, who: w || '', where: place || '' });
  const cer = +o.cer || 30, cock = +o.cock || 60, rec = (+o.rec || 5) * 60, fl = !!o.firstLook;
  const hmLen = Math.max(120, (+o.people || 4) * 45 / 2), ready = fl ? -210 : -150;
  at(ready - hmLen, 'Hair and makeup start', v('Hair & makeup') || 'Hair & makeup', '');
  at(ready - 30, 'Photographer arrives for detail shots', v('Photographer') || 'Photographer');
  at(ready, 'Get dressed', who);
  if (fl) { at(-180, 'First look, just the two of you', v('Photographer')); at(-150, 'Couple and wedding party photos', v('Photographer')); at(-90, 'Family photos', v('Photographer')); }
  at(-60, 'Vendors finish setup', v('Florist') || 'Florist and rentals');
  at(-30, 'Guests arrive. Hide away and relax.', '');
  at(0, 'Ceremony', v('Officiant') || 'Officiant');
  at(cer, fl ? 'Cocktail hour. Join your guests!' : 'Cocktail hour. Family and couple photos.', v('Caterer'));
  at(cer + cock, 'Grand entrance', v('DJ or band') || 'DJ or band');
  at(cer + cock + 10, 'Dinner is served', v('Caterer') || 'Caterer');
  at(cer + cock + 50, 'Toasts', 'Best man and maid of honor');
  at(cer + cock + 70, 'First dance', v('DJ or band'));
  at(cer + cock + 80, 'Parent dances', v('DJ or band'));
  at(cer + cock + 90, 'Dancing starts', v('DJ or band'));
  if (o.golden) at(cer + cock + 110, 'Sneak out for 15 minutes of golden hour photos', v('Photographer'));
  at(cer + cock + 140, 'Cake cutting', v('Cake & desserts'));
  at(cer + rec - 20, 'Last dance', v('DJ or band'));
  if (o.sendoff) at(cer + rec - 5, 'Send-off', 'Everyone');
  at(cer + rec, 'Reception ends', '');
  return out;
}
function helperDay() {
  openSheet({
    title: 'Build my day', saveLabel: 'Build it',
    top: '<p class="muted" style="margin:0">Tell me a few things and I’ll lay out the whole day. You can change any time after.</p>',
    fields: [
      { k: 'time', label: 'Ceremony starts', type: 'time' },
      { k: 'cer', label: 'Ceremony length', type: 'seg', options: [{ v: '20', l: '20 min' }, { v: '30', l: '30 min' }, { v: '45', l: '45 min' }, { v: '60', l: '1 hour' }] },
      { k: 'firstLook', label: 'See each other before the ceremony (first look)', type: 'toggle', hint: 'Lets you take most photos early and join cocktail hour.' },
      { k: 'cock', label: 'Cocktail hour', type: 'seg', options: [{ v: '45', l: '45 min' }, { v: '60', l: '1 hour' }, { v: '90', l: '90 min' }] },
      { k: 'rec', label: 'Reception', type: 'seg', options: [{ v: '4', l: '4 hours' }, { v: '5', l: '5 hours' }, { v: '6', l: '6 hours' }] },
      { k: 'people', label: 'People getting hair and makeup', type: 'number', min: 1, max: 20 },
      { k: 'golden', label: 'Golden hour photos during the reception', type: 'toggle' },
      { k: 'sendoff', label: 'Sparkler or bubble send-off', type: 'toggle' }
    ],
    values: { time: S.couple.time || '16:00', cer: '30', firstLook: true, cock: '60', rec: '5', people: 4, golden: true, sendoff: true },
    body: S.day.length ? '<p class="hint" style="margin:0">This replaces your ' + S.day.length + ' current moments. You can undo it.</p>' : '',
    onSave: v => { const snap = snapshot(); S.day = buildDay(v); if (/^\d{2}:\d{2}$/.test(v.time)) S.couple.time = v.time; bdOpen = 'timeline'; commit(); if (route !== 'bigday') go('bigday'); toast('Your day is ready: ' + S.day.length + ' moments', () => restoreSnapshot(snap)); }
  });
}

/* ---------- Party math ---------- */
function partyMath(o) {
  const g = Math.max(0, Math.round(+o.guests || 0)), hrs = Math.max(1, +o.hours || 5), drinks = g * (hrs + 1);
  const mix = o.bar === 'wine' ? [1, 0, 0] : o.bar === 'beerwine' ? [.6, .4, 0] : o.bar === 'none' ? [0, 0, 0] : [.5, .3, .2];
  const r = n => Math.ceil(n);
  const households = S.guests.length ? r(S.guests.length * 1.1) : r(g / 1.8 * 1.1);
  return [
    ['Wine', r(drinks * mix[0] / 5), 'bottles', 'About 5 glasses a bottle'],
    ['Beer', r(drinks * mix[1]), 'bottles or cans', ''],
    ['Liquor', r(drinks * mix[2] / 16), 'bottles (750 ml)', 'About 16 drinks a bottle'],
    ['Champagne toast', o.toast ? r(g / 6) : 0, 'bottles', '6 toast pours a bottle'],
    ['Ice', r(g * 1.5), 'pounds', 'More if it’s hot out'],
    ['Cake', r(g * 1.05), 'slices', 'A few extra for the staff'],
    ['Appetizers', r(g * 5), 'pieces', 'For a 1-hour cocktail hour'],
    ['Chairs', g, 'chairs', ''],
    ['Tables of 8', r(g / 8), 'tables', 'Or ' + r(g / 10) + ' tables of 10'],
    ['Favors', g, 'favors', ''],
    ['Invitations', households, 'sets', 'One per household, plus 10% extra'],
    ['Stamps', households * 2, 'stamps', 'Invitations plus RSVP cards']
  ].filter(x => x[1] > 0 || x[0] === 'Champagne toast' && o.toast);
}
function helperMath() {
  const gs = guestStats(), est = gs.yes + gs.pending || 100;
  const draw = sc => {
    const v = readFields([{ k: 'guests', type: 'number' }, { k: 'hours', type: 'number' }, { k: 'bar', type: 'seg' }, { k: 'toast', type: 'toggle' }], sc);
    const box = $('#mathOut', sc); if (!box) return;
    box.innerHTML = '<div class="mathgrid">' + partyMath(v).map(x => '<div class="mtile"><small>' + esc(x[0]) + '</small><b class="num">' + x[1].toLocaleString() + '</b><span>' + esc(x[2]) + '</span>' + (x[3] ? '<i>' + esc(x[3]) + '</i>' : '') + '</div>').join('') + '</div>';
  };
  openSheet({
    title: 'Party math', noFocus: true,
    top: '<p class="muted" style="margin:0">Common rules of thumb. Your caterer and venue have the final say.</p>',
    fields: [
      { row: [{ k: 'guests', label: 'Guests', type: 'number', min: 1, max: 2000 }, { k: 'hours', label: 'Reception hours', type: 'number', min: 1, max: 12 }] },
      { k: 'bar', label: 'Bar', type: 'seg', options: [{ v: 'full', l: 'Full bar' }, { v: 'beerwine', l: 'Beer & wine' }, { v: 'wine', l: 'Wine only' }, { v: 'none', l: 'Dry' }] },
      { k: 'toast', label: 'Champagne toast', type: 'toggle' }
    ],
    values: { guests: est, hours: 5, bar: 'full', toast: true },
    body: '<div id="mathOut" aria-live="polite"></div><p class="hint" style="margin:0">Drinks: about one per guest each hour, plus one. Guests start from everyone coming or still waiting.</p>',
    onMount: sc => { draw(sc); sc.addEventListener('input', () => draw(sc)); sc.addEventListener('click', () => setTimeout(() => draw(sc), 0)); sc.addEventListener('change', () => draw(sc)); }
  });
}

/* ---------- Seat everyone ---------- */
function autoSeat(o) {
  const head = t => /head|sweetheart/i.test(t.name);
  const tables = S.tables.filter(t => !(o.skipHead && head(t)));
  const room = t => t.seats - people().filter(p => p.table === t.id).length;
  const units = [];
  for (const g of S.guests) {
    if (g.rsvp === 'no' || (g.rsvp === 'pending' && !o.waiting)) continue;
    const keys = [];
    if (!g.table) keys.push(g.id + ':0');
    if (g.plus && !g.plusTable) keys.push(g.id + ':1');
    if (keys.length) units.push({ g, keys, size: keys.length, sortKey: (g.side === 'a' ? '0' : g.side === 'b' ? '2' : '1') + (g.group || 'zz').toLowerCase() });
  }
  units.sort((a, b) => a.sortKey.localeCompare(b.sortKey) || b.size - a.size);
  let seated = 0, left = 0;
  for (const u of units) {
    /* A table that already has their group, then the table with the most room that fits. */
    const fits = tables.filter(t => room(t) >= u.size);
    const same = fits.find(t => people().some(p => p.table === t.id && p.g.group === u.g.group && p.g.side === u.g.side));
    const pick = same || fits.sort((a, b) => room(b) - room(a))[0];
    if (!pick) { left += u.size; continue; }
    u.keys.forEach(k => setSeat(k, pick.id)); seated += u.size;
  }
  return { seated, left };
}
function helperSeat() {
  if (!S.tables.length) { toast('Add tables first. Try typing “Add 8 round tables of 8” in the + box.'); return; }
  const un = people().filter(p => !p.table);
  openSheet({
    title: 'Seat everyone', saveLabel: 'Seat them',
    top: '<p class="muted" style="margin:0">' + (un.length ? un.length + ' people don’t have a seat yet. I’ll keep plus-ones together and sit families and friend groups side by side. Anyone you already seated stays put.' : 'Everyone already has a seat.') + '</p>',
    fields: [{ k: 'waiting', label: 'Include guests who haven’t answered', type: 'toggle' }, { k: 'skipHead', label: 'Leave the head table alone', type: 'toggle' }],
    values: { waiting: false, skipHead: true },
    onSave: v => { const snap = snapshot(); const r = autoSeat(v); commit(); if (route !== 'seating') go('seating'); toast(r.seated ? 'Seated ' + r.seated + (r.left ? '. ' + r.left + ' didn’t fit. Add a table.' : '. Drag anyone to move them.') : (r.left ? 'No room left. Add a table first.' : 'Nobody new to seat'), r.seated ? () => restoreSnapshot(snap) : null); }
  });
}

/* ---------- Thank-you notes ---------- */
const TY = {
  open: ['Dear {name},', 'Hi {name},', 'Dear {name},'],
  item: ['Thank you so much for the {gift}. {touch}We already love it, and we’ll think of you every time we use it.', 'We were so touched by the {gift} you gave us. {touch}It’s already found a home with us, and it makes us smile.', 'Thank you for the thoughtful {gift}. {touch}It’s exactly the kind of thing we’ll use for years.'],
  money: ['Thank you so much for your generous gift. {touch}We’re putting it toward {use}, and we can’t wait.', 'We were blown away by your generosity. {touch}It’s going straight toward {use}, and we’re so grateful.', 'Thank you for your kind and generous gift. {touch}It means a lot as we start {use}.'],
  experience: ['Thank you for the {gift}! {touch}We can’t wait to do it together and tell you all about it.', 'What a fun gift. Thank you for the {gift}. {touch}It’s already on our calendar.', 'Thank you so much for the {gift}. {touch}It’s a memory we’ll get to make together.'],
  came: ['Having you there to celebrate with us made the day even more special.', 'It meant so much to have you with us on our wedding day.', 'Seeing you there, cheering us on, was one of our favorite parts of the day.'],
  missed: ['We missed you at the wedding, and we hope to celebrate with you soon.', 'We wish you could have been there, and we can’t wait to see you soon.', 'You were in our thoughts on the big day. Let’s celebrate together soon.'],
  close: ['With love,', 'With so much love,', 'Love and thanks,']
};
function thankNote(o, n) {
  const pick = a => a[n % a.length], g = S.guests.find(x => x.name.toLowerCase() === String(o.from || '').toLowerCase());
  const touch = o.touch ? o.touch.trim().replace(/([^.!?])$/, '$1.') + ' ' : '';
  const body = pick(TY[o.kind] || TY.item).replace('{gift}', (o.gift || 'gift').replace(/\s*\(.*\)\s*$/, '').toLowerCase()).replace('{use}', o.use || (n % 2 ? 'our first home' : 'our new life together')).replace('{touch}', touch);
  const came = g ? g.rsvp === 'yes' : true;
  return pick(TY.open).replace('{name}', o.from ? o.from.split(/\s+(?:and|&)\s+/i).map(firstOf).join(' and ') : 'friend') + '\n\n' + body + ' ' + pick(came ? TY.came : TY.missed) + '\n\n' + pick(TY.close) + '\n' + coupleNames(false);
}
function helperThanks(giftId) {
  const g = giftId ? byId(S.gifts, giftId) : S.gifts.find(x => !x.thanked);
  let n = 0;
  openSheet({
    title: 'Thank-you note', noFocus: true,
    fields: [
      { k: 'from', label: 'To', ph: 'Who gave the gift' }, { k: 'kind', label: 'Kind', type: 'seg', options: [{ v: 'item', l: 'Gift' }, { v: 'money', l: 'Money' }, { v: 'experience', l: 'Experience' }] },
      { k: 'gift', label: 'What it was', ph: 'Stand mixer' }, { k: 'use', label: 'What you’ll use it for', ph: 'our honeymoon', showIf: v => v.kind === 'money' },
      { k: 'touch', label: 'A personal touch', ph: 'Optional, like “Your toast had everyone in tears”' }
    ],
    values: g ? { from: g.from, kind: g.kind, gift: g.gift, use: g.use } : { kind: 'item' },
    body: '<div class="field"><span class="flabel">Your note</span><textarea class="input" id="tyOut" style="min-height:220px" aria-label="Your note"></textarea><span class="hint">Edit anything. Then copy it into a card or a text.</span></div>' +
      '<div class="actions"><button class="btn" type="button" id="tyNew">' + ic('wand') + 'Another version</button><button class="btn primary" type="button" id="tyCopy">' + ic('copy') + 'Copy</button>' + (g && !g.thanked ? '<button class="btn" type="button" id="tyDone">' + ic('check') + 'Mark sent</button>' : '') + '</div>',
    onMount: sc => {
      const flat = [{ k: 'from' }, { k: 'kind', type: 'seg' }, { k: 'gift' }, { k: 'use' }, { k: 'touch' }];
      const draw = () => { $('#tyOut', sc).value = thankNote(readFields(flat, sc), n); };
      draw();
      sc.addEventListener('input', e => { if (e.target.id !== 'tyOut') draw(); });
      sc.addEventListener('click', e => {
        if (e.target.closest('.seg button')) setTimeout(draw, 0);
        if (e.target.closest('#tyNew')) { n++; draw(); }
        if (e.target.closest('#tyCopy')) copyText($('#tyOut', sc).value);
        if (e.target.closest('#tyDone') && g) { g.thanked = true; persist(); e.target.closest('#tyDone').remove(); toast('Marked sent'); render(); }
      });
    }
  });
}

/* ---------- Message writer ---------- */
const MSGS = [
  { k: 'quote', to: 'vendor', l: 'Ask a vendor for a quote' },
  { k: 'confirm', to: 'vendor', l: 'Confirm details with a vendor' },
  { k: 'final', to: 'vendor', l: 'Ask about the final payment' },
  { k: 'vthanks', to: 'vendor', l: 'Thank a vendor after the wedding' },
  { k: 'rsvp', to: 'guest', l: 'Remind a guest to RSVP' },
  { k: 'addr', to: 'guest', l: 'Ask a guest for their mailing address' },
  { k: 'travel', to: 'guest', l: 'Send guests hotel and travel info' },
  { k: 'party', to: 'party', l: 'Send your wedding party the plan' }
];
function msgText(k, o) {
  const w = weddingMoment(), when = w ? fmtDate(w, { weekday: 'long', month: 'long', day: 'numeric' }) : 'our wedding day', place = [S.couple.venue, S.couple.city].filter(Boolean).join(', ');
  const v = o.vendor ? byId(S.vendors, o.vendor) : null, vn = v ? (v.contact ? firstOf(v.contact) : vendorTitle(v)) : 'there', me = coupleNames(false);
  const gs = guestStats(), gname = o.guest ? firstOf((byId(S.guests, o.guest) || {}).name) : '';
  const by = parseDay(S.couple.rsvpBy);
  const T = {
    quote: ['Wedding ' + (v ? v.kind.toLowerCase() : 'vendor') + ' quote for ' + when, 'Hi ' + vn + ',\n\nWe’re getting married on ' + when + (place ? ' at ' + place : '') + ', with about ' + (gs.yes + gs.pending || 100) + ' guests. We love your work and would like a quote.\n\nAre you free that day? Could you send your packages and prices, and what the deposit would be?\n\nThank you,\n' + me],
    confirm: ['Confirming details for ' + when, 'Hi ' + vn + ',\n\nWe’re so excited for ' + when + '! We wanted to confirm the details:\n\n' + (place ? 'Where: ' + place + '\n' : '') + (S.day.length ? 'Your arrival time: ' + (timeWords((dayItems().find(x => v && x.who === vendorTitle(v)) || dayItems()[0]).time)) + '\n' : '') + 'Day-of contact: ' + (S.party[0] ? S.party[0].name + (S.party[0].phone ? ', ' + S.party[0].phone : '') : 'us') + '\n\nIs there anything else you need from us?\n\nThank you,\n' + me],
    final: ['Final payment for ' + when, 'Hi ' + vn + ',\n\nCould you send us the final invoice' + (v && vendorBalance(v) ? ' (we have ' + money(vendorBalance(v)) + ' as the balance)' : '') + ' and the date it’s due? We’d also love to know the easiest way to pay.\n\nThank you,\n' + me],
    vthanks: ['Thank you!', 'Hi ' + vn + ',\n\nThank you for everything you did for our wedding. It was the best day, and you were a big part of it. We’d be glad to write you a review.\n\nWith thanks,\n' + me],
    rsvp: ['', 'Hi ' + (gname || 'there') + '! We’re so excited for our wedding on ' + when + '. Could you let us know if you can make it' + (by && by >= today0() ? ' by ' + fmtDate(by, { month: 'long', day: 'numeric' }) : ' this week') + '? It helps us give our caterer a final count. Thank you! ' + me],
    addr: ['', 'Hi ' + (gname || 'there') + '! We’re getting our invitations ready for our wedding on ' + when + '. What’s the best mailing address for you? Thank you!\n\n' + me],
    travel: ['', 'Hi! Here are the details for our wedding:\n\n' + infoText()],
    party: ['', 'Hi wedding party! Here’s the plan for ' + when + ':\n\n' + (S.day.length ? dayItems().map(x => timeWords(x.time) + '  ' + x.t).join('\n') : 'Timeline coming soon.') + '\n\n' + S.party.filter(p => p.notes).map(p => firstOf(p.name) + ': ' + p.notes).join('\n') + '\n\nThank you for standing with us. ' + me]
  };
  return T[k] || ['', ''];
}
function helperMsg(forWhat) {
  const start = forWhat === 'party' ? 'party' : forWhat === 'rsvp' ? 'rsvp' : forWhat === 'addr' ? 'addr' : 'quote';
  const vendors = S.vendors.map(v => ({ v: v.id, l: vendorTitle(v) + (v.name ? ' (' + v.kind + ')' : '') }));
  const waiting = S.guests.filter(g => g.rsvp === 'pending'), noAddr = S.guests.filter(g => !addrOf(g).trim());
  openSheet({
    title: 'Write a message', noFocus: true,
    fields: [
      { k: 'k', label: 'What do you want to say?', type: 'select', options: MSGS.map(m => ({ v: m.k, l: m.l })) },
      { k: 'vendor', label: 'Vendor', type: 'select', options: vendors.length ? vendors : [{ v: '', l: 'No vendors yet' }], showIf: v => (MSGS.find(m => m.k === v.k) || {}).to === 'vendor' },
      { k: 'guest', label: 'Guest', type: 'select', options: [{ v: '', l: 'Anyone (no name)' }].concat((waiting.length ? waiting : S.guests).map(g => ({ v: g.id, l: g.name }))), showIf: v => v.k === 'rsvp' },
      { k: 'aguest', label: 'Guest', type: 'select', options: [{ v: '', l: 'Anyone (no name)' }].concat((noAddr.length ? noAddr : S.guests).map(g => ({ v: g.id, l: g.name }))), showIf: v => v.k === 'addr' }
    ],
    values: { k: start, vendor: (S.vendors.find(v => v.status !== 'needed') || S.vendors[0] || {}).id || '', guest: '' },
    body: '<div class="field"><span class="flabel">Your message</span><input class="input" id="msgSub" placeholder="Subject" aria-label="Subject"><textarea class="input" id="msgOut" style="min-height:220px" aria-label="Your message"></textarea><span class="hint">Change anything. Nothing is sent until you send it yourself.</span></div><div class="actions" id="msgActs"></div>',
    onMount: sc => {
      const flat = [{ k: 'k', type: 'select' }, { k: 'vendor', type: 'select' }, { k: 'guest', type: 'select' }, { k: 'aguest', type: 'select' }];
      const draw = () => {
        const o = readFields(flat, sc), m = MSGS.find(x => x.k === o.k) || MSGS[0]; if (m.k === 'addr') o.guest = o.aguest; const [sub, body] = msgText(m.k, o);
        $('#msgSub', sc).value = sub; $('#msgSub', sc).hidden = !sub; $('#msgOut', sc).value = body;
        const v = m.to === 'vendor' && o.vendor ? byId(S.vendors, o.vendor) : null, g = (m.k === 'rsvp' || m.k === 'addr') && o.guest ? byId(S.guests, o.guest) : null;
        const email = v ? v.email : '', phone = v ? v.phone : (g && /\d{7,}/.test((g.contact || '').replace(/\D/g, '')) ? g.contact.replace(/[^\d+]/g, '') : '');
        $('#msgActs', sc).innerHTML = '<button class="btn primary" type="button" data-m="copy">' + ic('copy') + 'Copy</button>' + (email ? '<button class="btn" type="button" data-m="mail">' + ic('mail') + 'Email ' + esc(firstOf(vendorTitle(v))) + '</button>' : '') + (phone ? '<button class="btn" type="button" data-m="sms" data-p="' + esc(phone.replace(/[^\d+]/g, '')) + '">' + ic('chat') + 'Text</button>' : '') + (navigator.share ? '<button class="btn" type="button" data-m="share">' + ic('share') + 'Share</button>' : '');
        $('#msgActs', sc).dataset.email = email;
      };
      draw();
      sc.addEventListener('change', e => { if (e.target.closest('select')) draw(); });
      sc.addEventListener('click', e => {
        const b = e.target.closest('[data-m]'); if (!b) return;
        const sub = $('#msgSub', sc).value, body = $('#msgOut', sc).value;
        if (b.dataset.m === 'copy') copyText(body);
        else if (b.dataset.m === 'share') shareText(sub || 'Message', body);
        else if (b.dataset.m === 'mail') location.href = 'mailto:' + encodeURIComponent($('#msgActs', sc).dataset.email) + '?subject=' + encodeURIComponent(sub) + '&body=' + encodeURIComponent(body);
        else if (b.dataset.m === 'sms') location.href = 'sms:' + b.dataset.p + (isIOS() ? '&' : '?') + 'body=' + encodeURIComponent(body);
      });
    }
  });
}

/* ---------- Budget coach ---------- */
const SAVE_TIPS = {
  'Venue & rentals': 'Fridays, Sundays and off-season dates often cost much less.',
  'Food & drink': 'A lunch or brunch wedding, family-style plates or a beer-and-wine bar can trim this a lot.',
  'Photo & video': 'Fewer hours of coverage, with photos ending after the first dance, can save a bundle.',
  'Attire & beauty': 'Sample sales and rentals help, and so do fewer trial runs.',
  'Flowers & decor': 'Move ceremony flowers to the reception, and pick flowers that are in season.',
  'Music & entertainment': 'A playlist for cocktail hour and dinner, with the DJ for dancing only.',
  'Stationery': 'Digital save-the-dates, and a wedding website instead of extra insert cards.',
  'Transportation': 'One shuttle loop from the hotel instead of separate cars.',
  'Favors & gifts': 'Many guests skip favors. A late-night snack is often remembered more.'
};
function helperBudget() {
  const bt = budgetTotals();
  if (!bt.total && !bt.spent) { toast('Add a total budget first, on the Budget page'); go('budget'); return; }
  const base = bt.total || bt.spent;
  const rows = S.budget.cats.map(c => {
    const spent = catSpent(c.id), typ = (CAT_SPLIT.find(x => x[0] === c.name) || [0, 0])[1], share = base ? spent / base * 100 : 0;
    const over = c.planned && spent > c.planned ? spent - c.planned : 0;
    return { c, spent, typ, share, over, high: typ && share > typ * 1.25 && spent > 0 };
  }).filter(r => r.spent || r.c.planned);
  const flagged = rows.filter(r => r.over || r.high).sort((a, b) => b.over - a.over || b.share - b.typ - (a.share - a.typ));
  openSheet({
    title: 'Budget coach', noFocus: true,
    body: '<div class="coachtop"><div><small>' + (bt.left >= 0 ? 'Left to plan with' : 'Over budget by') + '</small><b class="num ' + (bt.left < 0 ? 'bad' : '') + '">' + money(Math.abs(bt.left)) + '</b></div><div><small>Paid so far</small><b class="num">' + money(bt.paid) + '</b></div></div>' +
      (flagged.length ? '<div class="kh2" style="margin-left:0">Worth a look</div><div class="stack" style="gap:10px">' + flagged.map(r => '<div class="coach"><div class="ch"><b>' + esc(r.c.name) + '</b><span class="num">' + money(r.spent) + '</span></div><p>' + (r.over ? 'Over your plan by ' + money(r.over) + '. ' : '') + (r.high ? 'That’s ' + Math.round(r.share) + '% of your budget. Most couples spend about ' + r.typ + '%. ' : '') + '</p>' + (own(SAVE_TIPS, r.c.name) ? '<p class="tip">' + ic('sparkle', 'sm') + esc(SAVE_TIPS[r.c.name]) + '</p>' : '') + '</div>').join('') + '</div>'
        : '<div class="empty" style="padding:18px"><div class="big">Looking good</div>No category is over your plan or far above what most couples spend.</div>') +
      '<div class="kh2" style="margin-left:0">How you compare</div><div class="cmp">' + rows.map(r => '<div class="cmprow"><span>' + esc(r.c.name) + '</span><div class="cmpbar"><i style="width:' + Math.min(100, r.share * 2.5).toFixed(1) + '%"></i>' + (r.typ ? '<em style="left:' + Math.min(100, r.typ * 2.5) + '%" title="Typical"></em>' : '') + '</div><b class="num">' + Math.round(r.share) + '%</b></div>').join('') + '</div>' +
      '<p class="hint" style="margin:8px 0 0">The thin line shows a typical share. Every wedding is different, so use it as a guide.</p>'
  });
}

/* ---------- Vow starter ---------- */
const VOW_PROMPTS = ['When did you know?', 'What did you notice first about them?', 'A small, everyday thing they do that you love', 'A hard time they helped you through', 'Something that always makes you laugh together', 'What you promise for the ordinary days', 'What you promise for the hard days', 'A promise that’s funny and true', 'What your life looks like in 20 years', 'One sentence that says why them'];
function helperVows() {
  openSheet({
    title: 'Vow starter', noFocus: true,
    body: '<p class="muted" style="margin:0">Most vows run 1 to 2 minutes, about 150 to 250 words. Pick three prompts, write a line or two for each, then end with your promises.</p><div class="vowp">' + VOW_PROMPTS.map((p, i) => '<div><span class="num">' + (i + 1) + '</span>' + esc(p) + '</div>').join('') + '</div>' +
      '<p class="hint" style="margin:0">A simple shape: how you met, why them, what you promise. Read it out loud once. If you stumble, shorten the sentence.</p>' +
      '<button class="btn primary block" type="button" id="vowGo">' + ic('pen') + 'Start writing</button>',
    onMount: (sc, close) => $('#vowGo', sc).addEventListener('click', () => { close(); bdOpen = 'words'; go('bigday'); })
  });
}

/* ---------- Questions for the + box ---------- */
function answerExtra(raw) {
  const t = raw.toLowerCase(), A = (html, acts) => ({ html, acts: acts || [] });
  if (/\b(wine|beer|liquor|alcohol|champagne|booze|drinks?|how much ice|how many (chairs|favors|invitations|stamps)|cake servings|how much cake)\b/.test(t)) {
    const gs = guestStats(), m = partyMath({ guests: gs.yes + gs.pending || 100, hours: 5, bar: 'full', toast: true });
    return A('<p>For about <b>' + (gs.yes + gs.pending || 100) + '</b> guests and a 5-hour full bar:</p><div class="got">' + m.slice(0, 6).map(x => '<span><b>' + esc(x[0]) + '</b>' + x[1].toLocaleString() + ' ' + esc(x[2]) + '</span>').join('') + '</div>', [['Open party math', 'helper:math']]);
  }
  if (S.day.length && /(what time|when).*(first dance|toast|cake|ceremony|dinner|photos?|hair|send.?off|entrance|cocktail)|timeline|schedule|run of show/.test(t)) {
    const key = (t.match(/first dance|toast|cake|ceremony|dinner|photo|hair|send.?off|entrance|cocktail/) || [''])[0].replace('.', '');
    const hit = key ? dayItems().filter(x => x.t.toLowerCase().replace('-', '').includes(key.replace('-', ''))) : [];
    return A(hit.length ? hit.map(x => '<p><b>' + esc(timeWords(x.time)) + '</b> ' + esc(x.t) + '</p>').join('') : '<ul>' + dayItems().slice(0, 8).map(x => '<li><b>' + esc(timeWords(x.time)) + '</b> ' + esc(x.t) + '</li>').join('') + '</ul>', [['Open the timeline', 'bd:timeline']]);
  }
  if (/thank.?you|thanked|gifts?/.test(t) && S.gifts.length) {
    const left = S.gifts.filter(g => !g.thanked);
    return A(left.length ? '<p><b>' + left.length + '</b> thank-you note' + (left.length === 1 ? '' : 's') + ' still to send:</p><ul>' + left.slice(0, 8).map(g => '<li>' + esc(g.from) + (g.gift ? ': ' + esc(g.gift) : '') + '</li>').join('') + '</ul>' : '<p>Every thank-you note is sent. Lovely.</p>', [['Write a note', 'helper:thanks']]);
  }
  if (/wedding party|bridesmaids?|groomsm[ae]n|maid of honor|best man/.test(t) && S.party.length) return A('<ul>' + S.party.map(p => '<li><b>' + esc(p.name) + '</b>, ' + esc(p.role.toLowerCase()) + '</li>').join('') + '</ul>', [['Open wedding party', 'bd:party']]);
  if (/first dance song|our song|songs?|music|playlist/.test(t) && S.music.length) return A('<ul>' + S.music.slice(0, 8).map(x => '<li><b>' + esc(x.moment) + '</b>: ' + esc(x.song) + (x.artist ? ', ' + esc(x.artist) : '') + '</li>').join('') + '</ul>', [['Open music', 'bd:music']]);
  if (/what should (we|i) (do|focus)|what am i (missing|forgetting)|forgetting|check.?up|am i on track|tips?/.test(t)) {
    const n = nudges().slice(0, 4);
    return A(n.length ? '<ul>' + n.map(x => '<li><b>' + esc(x.t) + '.</b> ' + esc(x.s) + '</li>').join('') + '</ul>' : '<p>You’re on track. Nothing needs you right now.</p>', [['Open plan check-up', 'go:helpers']]);
  }
  return null;
}

function openHelper(k, el) {
  if (k === 'day') helperDay(); else if (k === 'math') helperMath(); else if (k === 'seat') helperSeat(); else if (k === 'thanks') helperThanks(el && el.dataset.id);
  else if (k === 'msg') helperMsg(el && el.dataset.for); else if (k === 'budget') helperBudget(); else if (k === 'vows') helperVows(); else go('helpers');
}
Object.assign(EXTRA_ACTS, { 'helper': el => openHelper(el.dataset.k, el) });
