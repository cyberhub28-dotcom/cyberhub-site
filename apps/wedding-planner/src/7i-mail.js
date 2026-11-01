/* ================= Mail and dates: households, mailing addresses, envelopes, labels and calendar alerts =================
   A household is a few guests who get one invitation and one envelope, like a family. Its address lives on the household.
   A guest on their own keeps their own address. */
const hhById = id => id ? (S.households || []).find(h => h.id === id) : null;
const hhMembers = id => S.guests.filter(g => g.hh === id);
/* An address is kept in parts: street, unit, city, state, ZIP and country. */
const AK = ['s', 'u', 'c', 'st', 'z', 'co'];
function parseAddr(x) {
  const out = { s: '', u: '', c: '', st: '', z: '', co: '' };
  if (x && typeof x === 'object') { AK.forEach(k => { const v = x[k]; out[k] = typeof v === 'string' || (typeof v === 'number' && isFinite(v)) ? String(v).trim().slice(0, 120) : ''; }); return out; }
  /* Older plans kept the address as lines of text: read the street, unit, "City, State ZIP" and country back out. */
  const L = (typeof x === 'string' ? x : '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (!L.length) return out;
  let ci = -1; for (let i = L.length - 1; i > 0; i--) if (L[i].includes(',')) { ci = i; break; }
  if (ci < 0 && L.length > 1) ci = L.length - 1;
  if (ci < 0) { out.s = L[0].slice(0, 120); return out; }
  out.s = L[0]; out.u = L.slice(1, ci).join(', '); out.co = L.slice(ci + 1).join(', ');
  const cl = L[ci], k = cl.indexOf(',');
  if (k < 0) out.c = cl; else {
    out.c = cl.slice(0, k).trim();
    const m = cl.slice(k + 1).trim().match(/^(.*?)\s*(\d[\d-]{3,9}|[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d)?$/);
    out.st = (m && m[1] || '').trim(); out.z = (m && m[2] || '').trim();
  }
  return parseAddr(out);
}
const hasAddr = a => !!a && AK.some(k => a[k]);
function addrText(a) { a = parseAddr(a); const cl = [a.c, [a.st, a.z].filter(Boolean).join(' ')].filter(Boolean).join(', '); return [a.s, a.u, cl, a.co].filter(Boolean).join('\n'); }
const rawAddr = g => { const h = hhById(g.hh); return parseAddr(h ? h.addr : g.addr); };
const addrOf = g => addrText(rawAddr(g));
const addrLines = a => String(a || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
/* Drop households with fewer than two people left, and links to households that are gone. */
function cleanHouseholds(p) {
  p = p || S; if (!p || !Array.isArray(p.guests)) return;
  if (!Array.isArray(p.households)) p.households = [];
  const ids = new Set(p.households.map(h => h.id));
  p.guests.forEach(g => { if (g.hh && !ids.has(g.hh)) g.hh = ''; });
  p.households = p.households.filter(h => {
    const m = p.guests.filter(g => g.hh === h.id);
    if (m.length >= 2) return true;
    m.forEach(g => { if (!hasAddr(g.addr)) g.addr = parseAddr(h.addr); g.hh = ''; });
    return false;
  });
}
/* Every name on one invitation: the guests and any plus-ones whose names you know. */
function unitNames(guests) {
  const out = []; let unknown = 0;
  guests.forEach(g => { out.push(g.name.trim()); if (g.plus) { if (g.plusName.trim()) out.push(g.plusName.trim()); else unknown++; } });
  return { out, unknown };
}
/* How the envelope is addressed: "Grace and Daniel Bennett", "The Carter Family", "Natalie Kim and Guest". */
function envName(guests, hh) {
  if (hh && hh.name.trim()) return hh.name.trim();
  const { out, unknown } = unitNames(guests);
  const parts = out.map(n => { const p = n.split(/\s+/); return { first: p.slice(0, -1).join(' ') || p[0], last: p.length > 1 ? p[p.length - 1] : '' }; });
  const lasts = new Set(parts.map(p => p.last.toLowerCase()));
  if (out.length === 1) return out[0] + (unknown ? ' and Guest' : '');
  if (lasts.size === 1 && parts[0].last) return out.length === 2 ? parts[0].first + ' and ' + parts[1].first + ' ' + parts[0].last : 'The ' + parts[0].last + ' Family';
  if (out.length === 2) return out[0] + ' and ' + out[1];
  return out[0] + ', ' + out[1] + ' and family';
}
/* One row per invitation, sorted by last name. */
function inviteUnits() {
  const units = [];
  (S.households || []).forEach(h => { const m = hhMembers(h.id); if (m.length) units.push({ key: 'h:' + h.id, hh: h, guests: m }); });
  S.guests.filter(g => !hhById(g.hh)).forEach(g => units.push({ key: 'g:' + g.id, hh: null, guests: [g] }));
  units.forEach(u => { u.name = envName(u.guests, u.hh); u.raw = parseAddr(u.hh ? u.hh.addr : u.guests[0].addr); u.addr = addrText(u.raw); u.yes = u.guests.some(g => g.rsvp === 'yes'); u.no = u.guests.every(g => g.rsvp === 'no'); });
  return units.sort((a, b) => lastName(a.guests[0].name).localeCompare(lastName(b.guests[0].name)) || a.name.localeCompare(b.name));
}
const unitOf = g => inviteUnits().find(u => u.guests.includes(g));
const unitByKey = k => inviteUnits().find(u => u.key === k);
function mailStats() { const u = inviteUnits(); return { units: u.length, missing: u.filter(x => !x.addr.trim()).length }; }

/* ---------- Edit an address ---------- */
function editAddress(u, back) {
  if (!u) return;
  const lead = u.hh ? 'For everyone in ' + esc(u.name) + '.' : 'For ' + esc(u.name) + '.';
  openSheet({
    title: 'Mailing address', top: '<p class="lead">' + lead + '</p>', noFocus: true,
    fields: [
      { k: 's', label: 'Street address', ph: '123 Main Street', ac: 'address-line1' },
      { k: 'u', label: 'Apartment, suite or unit', ph: 'Optional', ac: 'address-line2' },
      { k: 'c', label: 'City', ph: 'City', ac: 'address-level2' },
      { row: [{ k: 'st', label: 'State', ph: 'State', ac: 'address-level1' }, { k: 'z', label: 'ZIP code', ph: 'ZIP', ac: 'postal-code' }] },
      { k: 'co', label: 'Country', ph: 'Only if it’s in another country', ac: 'country-name' }
    ],
    values: u.raw,
    onSave: v => {
      const a = parseAddr(v);
      if (u.hh) u.hh.addr = a; else u.guests[0].addr = a;
      commit(); toast(hasAddr(a) ? 'Address saved' : 'Address cleared');
      if (back) setTimeout(back, 30);
    }
  });
}

/* ---------- Households ---------- */
function householdSheet(g, back) {
  const cur = hhById(g.hh), inIt = new Set(cur ? hhMembers(cur.id).map(x => x.id) : [g.id]);
  const ln = lastName(g.name), others = S.guests.filter(x => x !== g);
  const score = x => (inIt.has(x.id) ? 0 : lastName(x.name) === ln ? 1 : x.group && x.group === g.group ? 2 : 3);
  others.sort((a, b) => score(a) - score(b) || lastName(a.name).localeCompare(lastName(b.name)) || a.name.localeCompare(b.name));
  const row = x => { const oh = hhById(x.hh); return '<label class="li pick">' + avatarHTML(x.name, x.side) + '<span class="tx"><b>' + esc(x.name) + '</b><small>' + esc(oh && oh.id !== (cur && cur.id) ? 'Now with ' + envName(hhMembers(oh.id), oh) : [x.group, x.plus ? '+1' : ''].filter(Boolean).join(' · ') || sideLabel(x.side)) + '</small></span><input type="checkbox" value="' + esc(x.id) + '"' + (inIt.has(x.id) ? ' checked' : '') + ' aria-label="' + esc(x.name) + ' lives with ' + esc(g.name) + '"></label>'; };
  const top = others.filter(x => score(x) < 3).slice(0, 12), rest = others.filter(x => !top.includes(x));
  openSheet({
    title: 'Household', saveLabel: 'Save', noFocus: true,
    top: '<p class="lead">Tick who lives with ' + esc(firstName(g.name)) + '. They’ll share one invitation, one envelope and one address.</p>',
    fields: [{ k: 'name', label: 'Name on the envelope', ph: 'Leave blank to write it for you' }],
    values: { name: cur ? cur.name : '' },
    body: (others.length ? (top.length ? '<div class="sub-h" style="margin-top:4px">Suggested</div><div class="list glist">' + top.map(row).join('') + '</div>' : '') +
      (rest.length ? '<details class="keep morepick"><summary>' + (top.length ? 'Everyone else' : 'Your guests') + ' (' + rest.length + ')</summary><div class="list glist">' + rest.map(row).join('') + '</div></details>' : '')
      : '<div class="empty">Add more guests first.</div>') +
      '<p class="hint" id="hhPreview" style="margin:0 2px 12px"></p>' +
      (cur ? '<button class="btn" type="button" data-do="leave">' + ic('x') + 'Take ' + esc(firstName(g.name)) + ' out of this household</button>' : ''),
    onMount: (sc, close) => {
      const picked = () => [g].concat($$('input[type=checkbox]:checked', sc).map(c => byId(S.guests, c.value)).filter(Boolean));
      const draw = () => { const p = picked(), nm = ($('[data-k="name"] input', sc) || {}).value || ''; $('#hhPreview', sc).textContent = p.length > 1 ? 'Envelope: ' + (nm.trim() || envName(p, null)) : 'Tick at least one more person to make a household.'; };
      draw();
      sc.addEventListener('change', draw); sc.addEventListener('input', draw);
      sc.addEventListener('click', e => {
        if (!e.target.closest('[data-do="leave"]')) return;
        if (!hasAddr(g.addr) && cur) g.addr = parseAddr(cur.addr);
        g.hh = ''; commit(); close(); toast(firstName(g.name) + ' has their own invitation now'); if (back) setTimeout(back, 30);
      });
    },
    onSave: (v, sc) => {
      const picked = [g].concat($$('input[type=checkbox]:checked', sc).map(c => byId(S.guests, c.value)).filter(Boolean));
      if (picked.length < 2) {
        if (cur) { hhMembers(cur.id).forEach(x => { if (!hasAddr(x.addr)) x.addr = parseAddr(cur.addr); x.hh = ''; }); commit(); toast('Household removed'); }
        if (back) setTimeout(back, 30); return;
      }
      const h = cur || { id: uid(), name: '', addr: parseAddr('') };
      if (!cur) S.households.push(h);
      h.name = String(v.name || '').trim().slice(0, 120);
      hhMembers(h.id).forEach(x => { if (!picked.includes(x)) { if (!hasAddr(x.addr)) x.addr = parseAddr(h.addr); x.hh = ''; } });
      if (!hasAddr(h.addr)) h.addr = picked.map(rawAddr).find(hasAddr) || parseAddr('');
      picked.forEach(x => { x.hh = h.id; });
      commit(); toast('Household saved: ' + envName(picked, h));
      if (back) setTimeout(back, 30);
    }
  });
}

/* ---------- Envelopes: every invitation, who still needs an address, labels and a spreadsheet ---------- */
let envMode = 'invite';
function envelopes() {
  if (!S.guests.length) { toast('Add a guest first'); return; }
  const all = inviteUnits(), list = envMode === 'thanks' ? all.filter(u => u.yes) : all;
  const need = list.filter(u => !u.addr.trim()), ready = list.filter(u => u.addr.trim());
  const row = u => '<button type="button" class="li" data-unit="' + esc(u.key) + '"><span class="liic ' + (u.addr.trim() ? 't-good' : 't-warn') + '">' + ic(u.guests.length > 1 ? 'guests' : 'mail') + '</span><span class="tx"><b>' + esc(u.name) + '</b><small' + (u.addr.trim() ? '' : ' class="warnt"') + '>' + esc(u.addr.trim() ? addrLines(u.addr).join(', ') : 'Add an address') + '</small></span>' + ic('chev', 'sm') + '</button>';
  openSheet({
    title: 'Envelopes', noFocus: true,
    top: '<div class="segc envseg" role="group" aria-label="Which envelopes">' + [['invite', 'Invitations'], ['thanks', 'Thank-yous']].map(m => '<button type="button" data-mode="' + m[0] + '"' + (envMode === m[0] ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + m[1] + '</button>').join('') + '</div>' +
      '<p class="lead" style="margin:8px 0 2px">' + (envMode === 'thanks' ? list.length + ' thank-you note' + (list.length === 1 ? '' : 's') + ', one for each household that came.' : list.length + ' invitation' + (list.length === 1 ? '' : 's') + ', one for each household.') + (need.length ? ' ' + need.length + ' still need' + (need.length === 1 ? 's' : '') + ' an address.' : list.length ? ' Every one has an address.' : '') + '</p>',
    body: (need.length ? '<div class="sub-h">Need an address</div><div class="list">' + need.map(row).join('') + '</div>' : '') +
      (ready.length ? '<div class="sub-h">Ready to mail</div><div class="list">' + ready.map(row).join('') + '</div>' : '') +
      (!list.length ? '<div class="list"><div class="empty">' + (envMode === 'thanks' ? 'No one has said yes yet.' : 'No invitations yet.') + '</div></div>' : '') +
      '<div class="list">' +
        '<button type="button" class="li" data-do="labels"' + (ready.length ? '' : ' disabled') + '><span class="liic t-accent">' + ic('print') + '</span><span class="tx"><b>Address labels (PDF)</b><small>30 per sheet, fits Avery 5160 and similar</small></span>' + ic('chev', 'sm') + '</button>' +
        '<button type="button" class="li" data-do="csv"><span class="liic t-good">' + ic('save') + '</span><span class="tx"><b>Copy for Excel or Sheets</b><small>For a printer or mail merge</small></span>' + ic('chev', 'sm') + '</button>' +
        (need.length ? '<button type="button" class="li" data-do="ask"><span class="liic t-info">' + ic('chat') + '</span><span class="tx"><b>Ask for addresses</b><small>A friendly text you can send</small></span>' + ic('chev', 'sm') + '</button>' : '') +
      '</div>' +
      '<p class="hint" style="margin:0 2px 12px">Print one test page on plain paper first and hold it up to your label sheet.</p>',
    onMount: (sc, close) => sc.addEventListener('click', e => {
      const m = e.target.closest('[data-mode]'), u = e.target.closest('[data-unit]'), d = e.target.closest('[data-do]');
      if (m) { envMode = m.dataset.mode; close(); envelopes(); }
      else if (u) { close(); editAddress(unitByKey(u.dataset.unit), envelopes); }
      else if (d && !d.disabled) { if (d.dataset.do === 'labels') pdfLabels(ready); else if (d.dataset.do === 'csv') envelopesCSV(list); else { close(); helperMsg('addr'); } }
    })
  });
}
function envelopesCSV(list) {
  const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const rows = [['Name on envelope', 'Street', 'Apartment or unit', 'City', 'State', 'ZIP code', 'Country', 'Guests', 'RSVP']];
  list.forEach(u => { const a = u.raw; rows.push([u.name, a.s, a.u, a.c, a.st, a.z, a.co, unitNames(u.guests).out.join(', '), u.yes ? 'Coming' : u.no ? 'Declined' : 'Waiting']); });
  const csv = '\ufeff' + rows.map(r => r.map(q).join(',')).join('\r\n');
  saveFile('envelopes-' + isoDay(new Date()) + '.csv', csv, 'text/csv', true).then(r => { if (r === 'saved') toast('Envelope list saved'); else if (r === 'failed') toast('This browser blocked the download.'); });
}
/* Avery 5160 layout: 3 across, 10 down, 2.625 x 1 inch labels, half-inch top margin. */
function pdfLabels(units) {
  if (!units.length) { toast('Add an address first'); return; }
  makePdf('address-labels', P => {
    const LW = 189, LH = 72, X0 = 13.5, PITCH = 198, TOP = 36;
    units.forEach((u, i) => {
      const k = i % 30; if (k === 0) P.newPage();
      const col = k % 3, rowN = Math.floor(k / 3), x = X0 + col * PITCH + 10, w = LW - 20;
      const lines = [{ t: u.name, f: P.F.bold, s: 9.5 }].concat(addrLines(u.addr).slice(0, 4).map(t => ({ t, f: P.F.reg, s: 9 })));
      const h = lines.length * 11.5, top = P.H - TOP - rowN * LH - (LH - h) / 2;
      lines.forEach((l, j) => P.page.drawText(P.fit(l.t, l.s, l.f, w), { x, y: top - 9 - j * 11.5, size: l.s, font: l.f, color: P.ink }));
    });
  });
}

/* ---------- Calendar alerts: one file your phone's Calendar can add ---------- */
const icsEscape = s => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
function icsFold(line) { const out = []; while (line.length > 74) { out.push(line.slice(0, 74)); line = ' ' + line.slice(74); } out.push(line); return out.join('\r\n'); }
function calEvents() {
  const t0 = today0(), out = [], gs = guestStats();
  const add = (d, ref, title, note, big) => { if (d && d >= t0) out.push({ d, ref, title, note, big }); };
  for (const p of payments()) add(p.due, p.v.id + '-' + (p.kind === 'Deposit' ? 'dep' : 'bal'), vendorTitle(p.v) + ' ' + p.kind.toLowerCase() + ' due: ' + money(p.amount), p.v.kind);
  const vNames = new Set(S.vendors.filter(v => v.status !== 'needed').flatMap(v => [vendorTitle(v).trim().toLowerCase(), v.kind.toLowerCase()]));
  for (const it of S.budget.items) if (it.paid < it.cost && !vNames.has(it.name.trim().toLowerCase())) add(parseDay(it.due), 'item-' + it.id, it.name + ' due: ' + money(it.cost - it.paid), 'Budget');
  for (const t of S.tasks) if (!t.done) add(parseDay(t.due), 'task-' + t.id, t.t, 'Wedding to-do');
  for (const b of BUCKETS) { if (b.k === 'after' || b.k === 'd0') continue; const left = S.tasks.filter(t => t.b === b.k && !t.done && !t.due).length; if (left) add(bucketDue(b), 'b-' + b.k, 'Wedding to-dos due (' + left + ' left)', b.label); }
  if (gs.pending || !S.guests.length) add(parseDay(S.couple.rsvpBy), 'rsvp', 'RSVPs due', 'Follow up with anyone who hasn’t answered');
  add(weddingDay(), 'wedding', 'Our wedding day', [S.couple.venue, S.couple.city].filter(Boolean).join(', '), true);
  return out.sort((a, b) => a.d - b.d);
}
function calendarSheet() {
  const ev = calEvents();
  if (!ev.length) { toast(S.couple.date ? 'No upcoming dates to add yet' : 'Add your wedding date first'); return; }
  openSheet({
    title: 'Add dates to Calendar', saveLabel: 'Save calendar file', noFocus: true,
    top: '<p class="lead">' + ev.length + ' date' + (ev.length === 1 ? '' : 's') + ', each with an alert a week before and on the morning of.</p>',
    body: '<div class="list noicons">' + ev.slice(0, 8).map(e => '<div class="li crow">' + dateChip(e.d, e.big ? 'big' : '') + '<span class="tx"><b>' + esc(e.title) + '</b><small>' + esc(e.note || relDay(e.d)) + '</small></span></div>').join('') +
      (ev.length > 8 ? '<div class="li"><span class="tx"><small>And ' + (ev.length - 8) + ' more</small></span></div>' : '') + '</div>' +
      '<ol class="steps"><li>Tap <b>Save calendar file</b>.</li><li>Open the file and tap <b>Add All</b>.</li><li>Dates change? Delete the old ones from your Calendar first, or you may see them twice.</li></ol>',
    onSave: () => { saveFile('wedding-dates.ics', calendarText(ev), 'text/calendar', true).then(r => { if (r === 'saved') toast('Calendar file ready'); else if (r === 'failed') toast('This browser blocked the file.'); }); }
  });
}
function calendarText(ev) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const ymd = d => d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CyberHub Software//Wedding Command Center//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Wedding'];
  ev.forEach(e => {
    const nx = new Date(e.d); nx.setDate(nx.getDate() + 1);
    lines.push('BEGIN:VEVENT', 'UID:' + e.ref + '@wedding.cyberhubsoftware.com', 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + ymd(e.d), 'DTEND;VALUE=DATE:' + ymd(nx),
      'SUMMARY:' + icsEscape(e.title), 'DESCRIPTION:' + icsEscape((e.note ? e.note + '. ' : '') + 'From your Wedding Command Center.'), 'TRANSP:TRANSPARENT');
    if (daysBetween(today0(), e.d) >= 7) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape(e.title + ' in a week'), 'TRIGGER:-P6DT15H', 'END:VALARM');
    if (e.big && daysBetween(today0(), e.d) >= 1) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape('Tomorrow is the big day'), 'TRIGGER:-PT15H', 'END:VALARM');
    else lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape(e.title), 'TRIGGER:PT9H', 'END:VALARM');
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.map(icsFold).join('\r\n');
}

/* ---------- Sample wedding: made-up addresses and two households ---------- */
function sampleMail(p) {
  const ST = ['Magnolia Lane', 'Oak Street', 'Harbor View Drive', 'Willow Way', 'Palmetto Court', 'Elm Avenue', 'Meeting Street', 'Peachtree Road', 'Riverside Drive', 'Laurel Street', 'Dogwood Circle', 'Cypress Avenue'];
  const CT = ['Charleston, SC 29401', 'Savannah, GA 31401', 'Mount Pleasant, SC 29464', 'Atlanta, GA 30306', 'Columbia, SC 29201', 'Raleigh, NC 27601', 'Greenville, SC 29601', 'Charlotte, NC 28202'];
  let i = 0; const next = () => { i++; return (12 + (i * 137) % 880) + ' ' + ST[i % ST.length] + (i % 5 === 2 ? '\nApt ' + (i % 9 + 1) + 'B' : '') + '\n' + CT[(i * 3) % CT.length]; };
  const by = n => p.guests.find(g => g.name === n);
  const hh = (members, addr) => { const h = { id: uid(), name: '', addr: parseAddr(addr) }; p.households.push(h); members.map(by).filter(Boolean).forEach(g => { g.hh = h.id; }); };
  hh(['Robert Carter', 'Ben Carter'], '27 Live Oak Road\nBeaufort, SC 29902');
  hh(['Mark Bennett', 'Ruth Bennett'], next());
  p.guests.forEach(g => { if (!g.hh && !['Sophie Nguyen', 'Claire Adams', 'Benjamin Hall', 'Lucas Martin'].includes(g.name)) g.addr = parseAddr(next()); });
}

Object.assign(EXTRA_ACTS, {
  'envelopes': () => envelopes(),
  'ics': () => calendarSheet()
});
