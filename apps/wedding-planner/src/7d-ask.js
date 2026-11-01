/* ================= Smart type box: add things or ask questions in plain words. Runs on this device only, no AI service. ================= */
const MON3 = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MRX = '(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?';
const WDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const NUMW = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20 };
const capWords = t => String(t).replace(/\s+/g, ' ').trim().replace(/(^|[\s\-'])([a-z])/g, (m, a, b) => a + b.toUpperCase());
const futureFix = (d, hadYear) => { if (!hadYear && d < today0()) d.setFullYear(d.getFullYear() + 1); return d; };

/* Find a date in the text. Returns { date, text } with the matched words, or null. */
function findDate(raw) {
  const t = ' ' + raw.toLowerCase() + ' ';
  let m;
  if ((m = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/))) return { date: new Date(+m[1], +m[2] - 1, +m[3]), text: m[0] };
  if ((m = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/))) { let y = m[3] ? +m[3] : today0().getFullYear(); if (y < 100) y += 2000; return { date: futureFix(new Date(y, +m[1] - 1, +m[2]), !!m[3]), text: m[0] }; }
  if ((m = t.match(new RegExp('\\b' + MRX + '\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b')))) return { date: futureFix(new Date(m[3] ? +m[3] : today0().getFullYear(), MON3.indexOf(m[1].slice(0, 3)), +m[2]), !!m[3]), text: m[0] };
  if ((m = t.match(new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?' + MRX + '(?:,?\\s+(\\d{4}))?\\b')))) return { date: futureFix(new Date(m[3] ? +m[3] : today0().getFullYear(), MON3.indexOf(m[2].slice(0, 3)), +m[1]), !!m[3]), text: m[0] };
  if ((m = t.match(new RegExp('\\b(?:end of\\s+)?' + MRX + '\\s+(\\d{4})\\b')))) return { date: new Date(+m[2], MON3.indexOf(m[1].slice(0, 3)), /end of/.test(m[0]) ? 28 : 1), text: m[0] };
  if ((m = t.match(/\b(today|tonight)\b/))) return { date: today0(), text: m[0] };
  if ((m = t.match(/\btomorrow\b/))) { const d = today0(); d.setDate(d.getDate() + 1); return { date: d, text: m[0] }; }
  if ((m = t.match(/\bnext week\b/))) { const d = today0(); d.setDate(d.getDate() + 7); return { date: d, text: m[0] }; }
  if ((m = t.match(/\bnext month\b/))) { const d = today0(); d.setMonth(d.getMonth() + 1); return { date: d, text: m[0] }; }
  if ((m = t.match(/\bin\s+(\d+|a|an|one|two|three|four|five|six|ten)\s+(day|week|month)s?\b/))) { const n = NUMW[m[1]] || +m[1], d = today0(); if (m[2] === 'day') d.setDate(d.getDate() + n); else if (m[2] === 'week') d.setDate(d.getDate() + 7 * n); else d.setMonth(d.getMonth() + n); return { date: d, text: m[0] }; }
  if ((m = t.match(/\b(?:next\s+|this\s+|on\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/))) { const d = today0(), w = WDAYS.indexOf(m[1]); let add = (w - d.getDay() + 7) % 7; if (add === 0 || /next/.test(m[0])) add += add === 0 ? 7 : 0; d.setDate(d.getDate() + add); return { date: d, text: m[0] }; }
  if ((m = t.match(new RegExp('\\b(?:in|by|before|end of)\\s+' + MRX + '\\b')))) { const d = new Date(today0().getFullYear(), MON3.indexOf(m[1].slice(0, 3)), /end of/.test(m[0]) ? 28 : 1); return { date: futureFix(d, false), text: m[0] }; }
  return null;
}
/* Money amounts in order, each with the words around it so we can tell a deposit from a total. */
function findMoney(raw) {
  const out = [], rx = /(\$\s?(\d[\d,]*(?:\.\d+)?)\s*(k)?\b)|(\b(\d[\d,]*(?:\.\d+)?)\s*(k|grand|dollars|bucks)\b)|(\b(\d{1,3}(?:,\d{3})+(?:\.\d+)?)\b)/gi;
  let m;
  while ((m = rx.exec(raw))) {
    const n = parseFloat((m[2] || m[5] || m[8]).replace(/,/g, '')) * (/^(k|grand)$/i.test(m[3] || m[6] || '') ? 1000 : 1);
    if (!isFinite(n) || n <= 0) continue;
    const before = raw.slice(Math.max(0, m.index - 22), m.index).toLowerCase(), after = raw.slice(m.index + m[0].length, m.index + m[0].length + 22).toLowerCase();
    out.push({ n, text: m[0], before, after, deposit: /deposit|down|retainer/.test(before.slice(-14)) || /^\s*(deposit|down|retainer)/.test(after) });
  }
  return out;
}
const VENDOR_WORDS = [
  ['Videographer', /\b(videographer|videography|video ?guy|film(?:maker|er)?)\b/], ['Photographer', /\b(photographer|photography|photo ?booth|photog)\b/],
  ['Caterer', /\b(caterer|catering)\b/], ['Florist', /\b(florist|flowers|floral)\b/], ['DJ or band', /\b(dj|band|musicians?)\b/],
  ['Officiant', /\b(officiant|pastor|priest|rabbi|minister|celebrant|reverend|rev\.?)\b/], ['Hair & makeup', /\b(hair|makeup|make-up|mua|stylist)\b/],
  ['Cake & desserts', /\b(cake|bakery|baker|desserts?|cupcakes?)\b/], ['Planner', /\b(planner|coordinator)\b/], ['Rentals', /\b(rentals?|tent|linens)\b/],
  ['Transportation', /\b(limo|limousine|shuttle|bus|transportation|car service|trolley)\b/], ['Stationery', /\b(stationery|stationer|invitations?|calligrapher)\b/],
  ['Attire', /\b(bridal shop|dress shop|tux(?:edo)? rental|tailor|seamstress|attire)\b/], ['Venue', /\b(venue|reception hall|ballroom|estate|vineyard|winery|barn)\b/]
];
const CAT_WORDS = [
  ['Venue & rentals', /\b(venue|chairs?|linens?|tent|rental|tables?|hall)\b/], ['Food & drink', /\b(food|cater|catering|bar|drinks?|wine|beer|alcohol|liquor|champagne|dinner|brunch)\b/],
  ['Photo & video', /\b(photo|photos|photographer|video|videographer|album|photo ?booth)\b/], ['Attire & beauty', /\b(dress|gown|suit|tux|tuxedo|shoes|veil|hair|makeup|alterations?|tailor|jewelry|accessories)\b/],
  ['Flowers & decor', /\b(flowers?|florist|bouquets?|decor|decorations?|centerpieces?|candles?|arch|signs?|balloons?)\b/], ['Music & entertainment', /\b(dj|band|music|musicians?|entertainment|sound)\b/],
  ['Rings', /\b(rings?|bands?)\b/], ['Stationery', /\b(invitations?|save.the.dates?|stationery|stamps|postage|programs?|menus? cards?|place cards?)\b/],
  ['Transportation', /\b(limo|shuttle|bus|transport|transportation|uber|car)\b/], ['Favors & gifts', /\b(favors?|gifts?|welcome bags?)\b/], ['Officiant & license', /\b(officiant|license|licence|marriage license)\b/]
];
function guessCat(t) { t = t.toLowerCase(); for (const [n, rx] of CAT_WORDS) if (rx.test(t)) { const c = S.budget.cats.find(x => x.name === n); if (c) return c; } return S.budget.cats.find(c => /cushion|other|misc/i.test(c.name)) || S.budget.cats[0]; }
const strip = (t, parts) => { parts.filter(Boolean).forEach(p => { t = t.replace(typeof p === 'string' ? new RegExp(p.trim().replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'), 'i') : p, ' '); }); return t.replace(/\s+/g, ' ').trim(); };
const plainQuotes = t => String(t).replace(/[\u2018\u2019\u02BC]/g, "'").replace(/[\u201C\u201D]/g, '"');
const cleanName = t => capWords(t.replace(/^[\s,.:;\-–]+|[\s,.:;\-–]+$/g, '').replace(/^(the|our|a|an)\s+/i, m => /^the\s+[A-Z]/.test(t) ? m : ''));
function findVendor(t) {
  t = t.toLowerCase();
  const byName = S.vendors.filter(v => v.name && t.includes(v.name.toLowerCase()));
  if (byName.length) return byName;
  const firstWord = S.vendors.filter(v => v.name && v.name.split(/\s+/)[0].length > 3 && new RegExp('\\b' + v.name.split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '') + '\\b').test(t));
  if (firstWord.length) return firstWord;
  for (const [kind, rx] of VENDOR_WORDS) if (rx.test(t)) { const hits = S.vendors.filter(v => v.kind === kind); if (hits.length) return hits; }
  return [];
}
function vendorKind(t) { for (const [kind, rx] of VENDOR_WORDS) { const m = t.toLowerCase().match(rx); if (m) return { kind, word: m[0] }; } return null; }
function findGuests(t) {
  const low = ' ' + t.toLowerCase().replace(/[^a-z0-9'\s-]/g, ' ') + ' ';
  const full = S.guests.filter(g => low.includes(' ' + g.name.toLowerCase() + ' ') || (g.plusName && low.includes(' ' + g.plusName.toLowerCase() + ' ')));
  if (full.length) return full;
  return S.guests.filter(g => { const f = firstName(g.name).toLowerCase(); return f.length > 2 && low.includes(' ' + f + ' ') && S.guests.filter(x => firstName(x.name).toLowerCase() === f).length === 1; });
}
function bucketFor(d) {
  const w = weddingDay(); if (!w) return 'm6';
  if (d > w) return 'after';
  for (const b of BUCKETS) { const due = bucketDue(b); if (due && due >= d) return b.k; }
  return 'd0';
}

/* ---------- Understand one line ---------- */
function understand(raw) {
  const t = plainQuotes(raw).trim(), low = t.toLowerCase();
  if (!/^(add|invite|put|new|remind|book|booked|hired)\b/.test(low) && !/\b(paid|pay|payed|spent|bought|sent|coming|declined)\b/.test(low) && !/\$|\d/.test(low) && low.split(/\s+/).length <= 4 && answer(t)) return { type: 'answer' };
  const isQ = /\?\s*$/.test(low) || /^(when|what|whats|what's|how|who|whos|who's|which|where|wheres|where's|show|list|tell me|any|is|are|do|does|did|will|can|have)\b/.test(low);
  if (isQ) return { type: 'answer' };
  const dt = findDate(t), money = findMoney(t);
  /* to-do */
  let m = t.match(/^(?:remind me to|reminder to|reminder:|to-?do:?|add (?:a )?(?:task|to-?do):?|i need to|we need to|need to|don'?t forget to|task:?)\s+(.+)$/i);
  if (m) {
    let text = m[1]; if (dt) text = strip(text, [new RegExp('\\b(by|before|on|due)?\\s*' + dt.text.trim().replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '\\b', 'i')]);
    return { type: 'task', t: capWords(text.charAt(0)) + text.slice(1), due: dt ? isoDay(dt.date) : '', b: dt ? bucketFor(dt.date) : 'm6' };
  }
  m = t.match(/^((?:book|call|email|text|send|mail|order|buy|pick up|pick out|choose|schedule|confirm|finalize|write|ask|research|find|get|make|set up|start|cancel|return|try on|try|plan|reserve|print|address|follow up|renew|apply for|register)\b.+)$/i);
  if (m && !money.length && !/\btables?\b/i.test(low)) {
    let text = m[1]; if (dt) text = strip(text, [new RegExp('\\b(by|before|on|due)?\\s*' + dt.text.trim().replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '\\b', 'i')]);
    return { type: 'task', t: text.charAt(0).toUpperCase() + text.slice(1), due: dt ? isoDay(dt.date) : '', b: dt ? bucketFor(dt.date) : 'm6' };
  }
  /* tables */
  if (/\btables?\b/.test(low) && !/\$/.test(low) && !findGuests(t).length) {
    const cnt = low.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty|a|an)\s+(?:more\s+)?(?:round\s+|long\s+|rectangle\s+|rectangular\s+)?tables?\b/);
    const seats = low.match(/(?:of|with|seats?|for)\s*(\d+)|(\d+)\s*(?:seats?|people|guests|each|top)/);
    const shape = /\b(long|rectangle|rectangular|banquet|head)\b/.test(low) ? 'long' : 'round';
    const named = t.match(/\b((?:head|sweetheart|kids'?|family|vip)\s+table)\b/i);
    const n = cnt ? (NUMW[cnt[1]] || +cnt[1]) : 1;
    return { type: 'tables', n: clamp(n, 1, 40), seats: clamp(seats ? +(seats[1] || seats[2]) : (/sweetheart/i.test(low) ? 2 : 8), 1, 30), shape: /sweetheart/i.test(low) ? 'long' : shape, name: named ? capWords(named[1]) : '' };
  }
  /* RSVP update for someone already on the list */
  const gs = findGuests(t);
  const yes = /\b(coming|is coming|are coming|yes|accepted|attending|will be there|rsvp'?d yes|confirmed|in)\b/.test(low) && !/\b(not|n't|can't|cannot|won't)\b/.test(low);
  const no = /\b(not coming|can'?t (?:make|come)|cannot|won'?t (?:make|be|come)|declined|regrets|no|isn'?t coming|aren'?t coming|said no)\b/.test(low);
  if (gs.length && (yes || no || S.settings.meals.some(x => low.includes(x.toLowerCase())))) {
    const meal = S.settings.meals.find(x => new RegExp('\\b' + x.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(low)) || '';
    const plus = /\b(\+1|plus.?one|bringing|with a guest|and guest)\b/.test(low);
    const pm = t.match(/\bbringing\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    return { type: 'rsvp', guests: gs.slice(0, 6), rsvp: no ? 'no' : yes ? 'yes' : '', meal, plus, plusName: pm ? pm[1] : '' };
  }
  /* a payment to a vendor we know */
  if (/\b(paid|pay|payed|sent|wired|venmo'?d|zelle'?d)\b/.test(low) && !/\b(spent|bought)\b/.test(low)) {
    const vs = findVendor(t);
    if (vs.length) {
      const v = vs[0], amt = money[0] ? money[0].n : 0, bal = vendorBalance(v);
      let what = /\b(deposit|retainer|down)\b/.test(low) ? 'deposit' : /\b(in full|balance|final|rest|remaining|off)\b/.test(low) ? 'balance' : (!v.depositPaid && v.deposit > 0 && (!amt || Math.abs(amt - v.deposit) < 1)) ? 'deposit' : (amt && amt >= bal - 1) ? 'balance' : (!v.depositPaid ? 'deposit' : 'balance');
      return { type: 'pay', vendors: vs, what, amount: amt };
    }
  }
  /* a vendor */
  const vk = vendorKind(t);
  const isSpend = /^(?:we |i )?(spent|bought|ordered|got|paid|picked up)\b/i.test(t) || /\b(spent|bought)\b/.test(low);
  if (vk && !isSpend) {
    const deposit = money.find(x => x.deposit), cost = money.find(x => !x.deposit);
    const depDue = dt && /deposit|retainer/.test(low.slice(Math.max(0, low.indexOf(dt.text.trim()) - 30), low.indexOf(dt.text.trim()))) ? dt : (dt && deposit && !/balance|final/.test(low) ? dt : null);
    const balDue = dt && !depDue ? dt : null;
    const phone = (t.match(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/) || [])[0] || '';
    const email = (t.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [])[0] || '';
    let name = strip(t, [vk.word && new RegExp('\\b' + vk.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i'), ...money.map(x => x.text), dt && dt.text.trim(), phone, email,
      /\b(deposit|retainer|down payment)\b(\s+(is\s+)?due)?/gi, /\b(booked|hired|signed|we|our|is|are|the|for|at|due|by|on|total|costs?|price|of|and|with|a|an|add|new|vendor|considering|maybe|balance|final|paid)\b/gi, /[,;:()]/g]);
    name = name.replace(/\s+-\s*$/, '').trim();
    const status = /\b(booked|hired|signed|went with|chose|picked)\b/.test(low) || deposit ? 'booked' : 'considering';
    return { type: 'vendor', kind: vk.kind, name: name.length > 1 && name.length < 60 ? capWords(name) : '', cost: cost ? cost.n : 0, deposit: deposit ? deposit.n : 0, depositDue: depDue ? isoDay(depDue.date) : '', balanceDue: balDue ? isoDay(balDue.date) : '', phone, email, status, fill: S.vendors.find(v => v.kind === vk.kind && v.status === 'needed') || null };
  }
  /* an expense */
  if (money.length) {
    const amt = money[0].n;
    const paidNow = /^(?:we |i )?(spent|bought|paid|got|picked up)\b/i.test(t) || /\b(spent|bought|paid)\b/.test(low);
    let name = strip(t, [money[0].text, dt && dt.text.trim(), /\b(spent|bought|ordered|paid|got|picked up|cost|costs|was|were|on|for|the|our|we|i|a|an|total|it|is|due|by|deposit)\b/gi, /[,;:()]/g]);
    const c = guessCat(name || t);
    return { type: 'expense', name: name ? capWords(name.charAt(0)) + name.slice(1) : 'Expense', cost: amt, paid: paidNow ? amt : 0, due: dt && !paidNow ? isoDay(dt.date) : '', cat: c ? c.id : '' };
  }
  /* new guests (the fallback when it reads like names) */
  let g = t.replace(/^(?:please\s+)?(?:add|invite|invited|put|guests?:?|new guests?:?)\s+/i, '').replace(/\s+(?:to|on) (?:the|our) (?:guest )?list\b.*$/i, '');
  let side = 'both';
  const a = S.couple.a.trim().toLowerCase(), b = S.couple.b.trim().toLowerCase();
  const sideRx = /\b([a-z]+)'?s\s+(side|family|friends?|guests?|work|coworkers?|college|team)\b|\bfrom\s+([a-z]+)'?s\s+side\b|\b(both)\s+sides?\b|\bfor\s+(both)\b/i;
  const sm = g.match(sideRx);
  if (sm) { const who = (sm[1] || sm[3] || sm[4] || sm[5] || '').toLowerCase(); if (who === 'both') side = 'both'; else if (a && who === a) side = 'a'; else if (b && who === b) side = 'b'; else if (/^(my|bride|groom)$/.test(who)) side = 'both'; }
  const grpM = g.match(/\b(family|friends?|work|coworkers?|colleagues?|neighbou?rs?|wedding party|bridesmaids?|groomsmen|college|church|school|team)\b/i);
  const group = grpM ? capWords(grpM[1].replace(/s$/i, '').replace(/^coworker|^colleague/i, 'Work').replace(/^friend$/i, 'Friends').replace(/^neighbou?r$/i, 'Neighbors').replace(/^bridesmaid$|^groomsmen$|^groomsman$/i, 'Wedding party')) : '';
  const meal = S.settings.meals.find(x => new RegExp('\\b' + x.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 's?\\b').test(g.toLowerCase())) || '';
  const plus = /(\+\s?1|\bplus.?ones?\b|\band (?:a )?guests?\b|\bwith (?:a )?guests?\b|\bplus (?:a )?guests?\b)/i.test(g);
  const coming = /\b(coming|attending|said yes|confirmed)\b/i.test(g) ? 'yes' : 'pending';
  g = strip(g, [sm && sm[0], /\b(family|friends?|work|coworkers?|colleagues?|neighbou?rs?|wedding party|bridesmaids?|groomsmen|college|church|school|team)\b/gi, /(\+\s?1|\bplus.?ones?\b|\b(and|with|plus) (a )?guests?\b)/gi,
    meal && new RegExp('\\b' + meal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 's?\\b', 'gi'), /\b(both|sides?|guests?|from|our|my|the|side|each|both of them|coming|attending|said yes|confirmed|for)\b/gi, /\bmeals?\b/gi]);
  g = g.replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '');
  const parts = g.split(/\s*(?:,|;|\n|&|\+|\band\b)\s*/i).map(x => x.trim()).filter(Boolean);
  if (!parts.length || parts.some(x => x.split(/\s+/).length > 5 || /\d/.test(x))) return { type: 'unknown' };
  /* "Grace and Mark Bennett" -> two guests who share the last name */
  const last = parts[parts.length - 1].split(/\s+/);
  const names = parts.map((x, i) => (x.split(/\s+/).length === 1 && last.length > 1 && i < parts.length - 1 && parts.slice(i + 1).every(y => y.split(/\s+/).length <= 2)) ? x + ' ' + last[last.length - 1] : x).map(capWords).slice(0, 40);
  return { type: 'guests', names, side, group, meal, plus, rsvp: coming };
}

/* ---------- Answer a question from the plan ---------- */
function answer(raw) {
  raw = plainQuotes(raw);
  const extra = answerExtra(raw); if (extra) return extra;
  const t = raw.toLowerCase(), A = (html, acts) => ({ html, acts: acts || [] });
  const gs = guestStats(), bt = budgetTotals();
  if (/(how many|how long|how much time).*(days?|weeks?|until|till|left|to go)|countdown|days (until|till|left|to go)/.test(t) && !/coming|guests|people|rsvp|money|budget|\$/.test(t)) {
    const w = weddingDay(); if (!w) return A('<p>Add your wedding date first and I’ll count down.</p>', [['Add the date', 'edit-couple']]);
    const n = daysBetween(today0(), w); return A('<p><b class="big">' + (n > 0 ? n + ' days' : n === 0 ? 'Today!' : 'Married ' + Math.abs(n) + ' days ago') + '</b></p>' + (n > 0 ? '<p class="muted">That’s about ' + Math.round(n / 7) + ' weeks, until ' + esc(fmtDate(w, { weekday: 'long', month: 'long', day: 'numeric' })) + '.</p>' : ''));
  }
  const tm = t.match(/\btable\s+(\d+|[a-z]+(?:\s+table)?)\b/) || t.match(/\b(head|sweetheart|kids)\s+table\b/);
  if (tm || /where (is|does|do|are)\b.*\b(sit|sitting|seated)\b|who('?s| is) (at|on|sitting)/.test(t)) {
    const gsx = findGuests(raw);
    if (gsx.length && /where/.test(t)) { const g = gsx[0], tb = byId(S.tables, g.table); return A('<p><b>' + esc(g.name) + '</b> ' + (tb ? 'sits at <b>' + esc(tb.name) + '</b>.' : 'doesn’t have a seat yet.') + '</p>', [['Open seating', 'go:seating']]); }
    const key = tm ? (tm[0].replace(/^table\s+/, 'table ').trim()) : '';
    const tb = S.tables.find(x => x.name.toLowerCase() === key || x.name.toLowerCase() === (tm && tm[1] + ' table') || x.name.toLowerCase().includes(key));
    if (tb) { const at = people().filter(p => p.table === tb.id); return A('<p><b>' + esc(tb.name) + '</b>: ' + at.length + ' of ' + tb.seats + ' seats taken.</p>' + (at.length ? '<ul>' + at.map(p => '<li>' + esc(p.name) + '</li>').join('') + '</ul>' : ''), [['Open seating', 'go:seating']]); }
  }
  if (/(who|which).*(hasn'?t|haven'?t|not|still|waiting|pending|yet)|waiting on|still waiting|no (reply|response|rsvp)/.test(t) && /rsvp|repl|respon|answer|waiting|heard|pending/.test(t)) {
    const w = S.guests.filter(g => g.rsvp === 'pending');
    return A(w.length ? '<p><b>' + w.length + '</b> still haven’t answered' + (S.couple.rsvpBy ? ' (RSVPs are due ' + esc(fmtDate(parseDay(S.couple.rsvpBy), { month: 'short', day: 'numeric' })) + ')' : '') + ':</p><ul>' + w.slice(0, 12).map(g => '<li>' + esc(g.name) + (g.plus ? ' +1' : '') + '</li>').join('') + (w.length > 12 ? '<li class="faint">and ' + (w.length - 12) + ' more</li>' : '') + '</ul>' : '<p>Everyone has answered. Nice.</p>', [['See the guest list', 'go:guests']]);
  }
  if (/allerg|diet|gluten|nut|vegan|celiac|dairy|shellfish/.test(t)) {
    const d = S.guests.filter(g => g.diet && g.rsvp !== 'no');
    return A(d.length ? '<p><b>' + d.length + '</b> guest' + (d.length === 1 ? ' has' : 's have') + ' a dietary note:</p><ul>' + d.map(g => '<li>' + esc(g.name) + ': ' + esc(g.diet) + '</li>').join('') + '</ul>' : '<p>No allergies or dietary notes yet.</p>');
  }
  if (/meal|chicken|beef|fish|vegetarian|steak|salmon|kids meal|entree|entrée|plates?/.test(t)) {
    const mc = mealCounts(); return A('<p>Meals for the <b>' + gs.yes + '</b> people coming:</p><div class="got">' + mc.list.map(([m, n]) => '<span><b>' + esc(m) + '</b>' + n + '</span>').join('') + (mc.unset ? '<span><b>Not chosen</b>' + mc.unset + '</span>' : '') + '</div>');
  }
  if (/(how many|count|number of|total).*(coming|attending|yes|rsvp|guests|people|invited|headcount)|headcount|guest count/.test(t)) {
    return A('<div class="got"><span><b>Invited</b>' + gs.invited + '</span><span><b>Coming</b>' + gs.yes + '</span><span><b>Waiting</b>' + gs.pending + '</span><span><b>Declined</b>' + gs.no + '</span></div><p class="muted">Plus-ones are counted.' + (gs.pending ? ' If everyone still waiting says yes, that’s ' + (gs.yes + gs.pending) + '.' : '') + '</p>', [['See guests', 'go:guests']]);
  }
  if (/(still|need|left|haven'?t|missing|yet).*(book|vendor)|vendors? (left|to book|still)|who do we still need/.test(t)) {
    const n = S.vendors.filter(v => v.status === 'needed'), c = S.vendors.filter(v => v.status === 'considering');
    return A(n.length || c.length ? (n.length ? '<p>Still to book: <b>' + n.map(v => esc(v.kind)).join(', ') + '</b>.</p>' : '') + (c.length ? '<p class="muted">Still deciding on: ' + c.map(v => esc(vendorTitle(v))).join(', ') + '.</p>' : '') : '<p>Every vendor is booked.</p>', [['Open vendors', 'go:vendors']]);
  }
  const vs = findVendor(raw);
  if (vs.length && /phone|number|email|contact|call|reach|who('?s| is)|website/.test(t)) {
    const v = vs[0];
    return A('<p><b>' + esc(vendorTitle(v)) + '</b>' + (v.kind !== vendorTitle(v) ? ' (' + esc(v.kind.toLowerCase()) + ')' : '') + '</p><div class="got">' + (v.contact ? '<span><b>Contact</b>' + esc(v.contact) + '</span>' : '') + (v.phone ? '<span><b>Phone</b>' + esc(v.phone) + '</span>' : '') + (v.email ? '<span><b>Email</b>' + esc(v.email) + '</span>' : '') + (!v.contact && !v.phone && !v.email ? '<span>No contact details yet</span>' : '') + '</div>', [['Open their card', 'vendor:' + v.id]]);
  }
  if (/owe|due|payments?|pay next|deposits?|bills?|what do we pay/.test(t)) {
    const p = payments().slice(0, 5);
    return A(p.length ? '<p>Coming up, <b>' + money(sum(payments(), x => x.amount)) + '</b> still to pay in all:</p><ul>' + p.map(x => '<li><b>' + esc(vendorTitle(x.v)) + '</b> ' + esc(x.kind.toLowerCase()) + ' ' + money(x.amount) + (x.due ? ', ' + esc(shortDate(x.due)) + ' (' + esc(dueWords(x.due)) + ')' : '') + '</li>').join('') + '</ul>' : '<p>Nothing is due. Every deposit and balance is paid.</p>', [['Open vendors', 'go:vendors']]);
  }
  if (/budget|spent|spend|left|over|money|afford|cost so far|how much/.test(t)) {
    const over = bt.total && bt.spent > bt.total;
    return A('<div class="got"><span><b>Budget</b>' + money(bt.total) + '</span><span><b>Spent</b>' + money(bt.spent) + '</span><span><b>' + (over ? 'Over by' : 'Left') + '</b>' + money(Math.abs(bt.left)) + '</span><span><b>Paid so far</b>' + money(bt.paid) + '</span></div>' + (bt.total ? '' : '<p class="muted">Set a total budget to see what’s left.</p>'), [['Open budget', 'go:budget']]);
  }
  if (/next|to.?do|tasks?|checklist|behind|overdue|what should (we|i) do|on track/.test(t)) {
    const nx = [], t0 = today0(); let late = 0;
    for (const b of BUCKETS) { const d = bucketDue(b); for (const k of S.tasks) if (k.b === b.k && !k.done) { if (d && b.k !== 'after' && d < t0) late++; if (nx.length < 4) nx.push(k); } }
    return A(nx.length ? (late ? '<p><b>' + late + '</b> task' + (late === 1 ? ' is' : 's are') + ' past due. Start here:</p>' : '<p>You’re on track. Next up:</p>') + '<ul>' + nx.map(k => '<li>' + esc(k.t) + '</li>').join('') + '</ul>' : '<p>Every task is checked off.</p>', [['Open checklist', 'go:checklist']]);
  }
  if (/\b(when|what day|date)\b.*\b(wedding|big day)\b|when('?s| is) (the|our) wedding/.test(t)) {
    const w = weddingMoment(); return A(w ? '<p><b>' + esc(fmtDate(w, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })) + '</b>' + (S.couple.venue ? ' at ' + esc(S.couple.venue) : '') + '.</p>' : '<p>You haven’t added the date yet.</p>', w ? [] : [['Add the date', 'edit-couple']]);
  }
  return null;
}

/* ---------- Show what was understood, then save on a tap ---------- */
let askPending = null, askLast = '';
const chip = (l, v) => '<span><b>' + esc(l) + '</b>' + esc(v) + '</span>';
function runAsk(raw, outEl) {
  raw = String(raw || '').trim(); if (!raw) return;
  const u = understand(raw); let html = '', acts = [];
  askPending = null;
  if (u.type === 'guests') {
    askPending = u;
    html = '<p>Here’s what I got. Nothing is saved until you tap below.</p><div class="got">' + u.names.map(n => chip('Guest', n)).join('') + chip('Guest of', sideLabel(u.side)) + (u.group ? chip('Group', u.group) : '') + (u.plus ? chip('Plus-one', 'Yes') : '') + (u.meal ? chip('Meal', u.meal) : '') + (u.rsvp === 'yes' ? chip('RSVP', 'Coming') : '') + '</div>';
    acts = [['Add ' + (u.names.length === 1 ? 'guest' : u.names.length + ' guests'), 'save']].concat(u.names.length === 1 ? [['Edit first', 'edit']] : []);
  } else if (u.type === 'rsvp') {
    askPending = u;
    html = '<p>Here’s what I got. Nothing is saved until you tap below.</p><div class="got">' + u.guests.map(g => chip('Guest', g.name)).join('') + (u.rsvp ? chip('RSVP', u.rsvp === 'yes' ? 'Coming' : 'Declined') : '') + (u.meal ? chip('Meal', u.meal) : '') + (u.plus ? chip('Plus-one', u.plusName || 'Yes') : '') + '</div>' + (u.guests.length > 1 ? '<p class="muted">That matched more than one guest. I’ll update all of them.</p>' : '');
    acts = [['Update ' + (u.guests.length === 1 ? firstName(u.guests[0].name) : u.guests.length + ' guests'), 'save']].concat(u.guests.length === 1 ? [['Edit first', 'edit']] : []);
  } else if (u.type === 'vendor') {
    askPending = u;
    html = '<p>Here’s what I got. Nothing is saved until you tap below.</p><div class="got">' + chip('Type', u.kind) + (u.name ? chip('Name', u.name) : '') + chip('Status', u.status === 'booked' ? 'Booked' : 'Considering') + (u.cost ? chip('Total', money(u.cost)) : '') + (u.deposit ? chip('Deposit', money(u.deposit)) : '') + (u.depositDue ? chip('Deposit due', fmtDate(parseDay(u.depositDue))) : '') + (u.balanceDue ? chip('Balance due', fmtDate(parseDay(u.balanceDue))) : '') + (u.phone ? chip('Phone', u.phone) : '') + (u.email ? chip('Email', u.email) : '') + '</div>' + (u.fill ? '<p class="muted">This fills in your ' + esc(u.kind.toLowerCase()) + ' card.</p>' : '');
    acts = [[u.fill ? 'Fill in the card' : 'Add the card', 'save'], ['Edit first', 'edit']];
  } else if (u.type === 'pay') {
    askPending = u; const v = u.vendors[0], amt = u.what === 'deposit' ? v.deposit : vendorBalance(v);
    html = '<p>Here’s what I got. Nothing is saved until you tap below.</p><div class="got">' + chip('Vendor', vendorTitle(v)) + chip('Mark paid', u.what === 'deposit' ? 'Deposit' : 'Final balance') + (amt ? chip('Amount', money(amt)) : '') + '</div>' + (u.amount && amt && Math.abs(u.amount - amt) > 1 ? '<p class="muted">You said ' + money(u.amount) + ', but the card says ' + money(amt) + '. Tap Edit first to fix the card.</p>' : '');
    acts = [['Mark it paid', 'save'], ['Edit first', 'edit']];
  } else if (u.type === 'expense') {
    askPending = u; const c = byId(S.budget.cats, u.cat);
    html = '<p>Here’s what I got. Nothing is saved until you tap below.</p><div class="got">' + chip('Expense', u.name) + chip('Cost', money(u.cost)) + (u.paid ? chip('Paid', money(u.paid)) : '') + (c ? chip('Category', c.name) : '') + (u.due ? chip('Due', fmtDate(parseDay(u.due))) : '') + '</div>';
    acts = [['Add to budget', 'save'], ['Edit first', 'edit']];
  } else if (u.type === 'task') {
    askPending = u; const b = BUCKETS.find(x => x.k === u.b);
    html = '<p>Here’s what I got. Nothing is saved until you tap below.</p><div class="got">' + chip('To-do', u.t) + (u.due ? chip('By', fmtDate(parseDay(u.due))) : '') + chip('In your checklist', b.label) + '</div>';
    acts = [['Add to checklist', 'save'], ['Edit first', 'edit']];
  } else if (u.type === 'tables') {
    askPending = u;
    html = '<p>Here’s what I got. Nothing is saved until you tap below.</p><div class="got">' + chip('Tables', u.n) + (u.name ? chip('Name', u.name) : '') + chip('Shape', u.shape === 'long' ? 'Long' : 'Round') + chip('Seats each', u.seats) + '</div>';
    acts = [['Add ' + (u.n === 1 ? 'the table' : u.n + ' tables'), 'save']].concat(u.n === 1 ? [['Edit first', 'edit']] : []);
  } else {
    const a = answer(raw);
    if (a) { html = a.html; acts = a.acts; }
    else html = '<p>I didn’t catch that. Try one of these:</p><ul><li>“Add Grace and Mark Bennett, ' + esc(S.couple.a || 'Olivia') + '’s family, plus one”</li><li>“Sophie Nguyen is coming, chicken”</li><li>“Florist Magnolia & Moss, $2,900, $500 deposit due May 1”</li><li>“Paid the photographer deposit”</li><li>“Spent $340 on save-the-dates”</li><li>“Remind me to book a hotel block by March 1”</li><li>“Add 3 round tables of 10”</li><li>“Who hasn’t RSVP’d?” or “What do we owe?”</li></ul>';
  }
  const out = '<div class="ask-out" role="status"><div class="q">“' + esc(raw) + '”</div>' + html + '<div class="acts">' + acts.map(([l, a], i) => '<button type="button" class="btn ' + (i ? '' : 'primary') + ' small" data-askact="' + esc(a) + '">' + esc(l) + '</button>').join('') + '<button type="button" class="btn ghost small" data-askact="clear">Clear</button></div></div>';
  if (outEl) outEl.innerHTML = out;
  if (outEl && outEl.id === 'askOut') askLast = out;
}
function closeAddSheet() { $$('.scrim').forEach(s => { if ($('.addask', s)) s.remove(); }); lock(); }
function saveAsk() {
  const u = askPending; if (!u) return; const snap = snapshot(); let msg = '';
  if (u.type === 'guests') { u.names.forEach(n => S.guests.push({ id: uid(), name: n.slice(0, 120), side: u.side, group: u.group, contact: '', rsvp: u.rsvp, meal: u.meal, diet: '', plus: u.plus, plusName: '', plusMeal: '', table: null, plusTable: null, notes: '' })); msg = u.names.length === 1 ? u.names[0] + ' added' : u.names.length + ' guests added'; }
  else if (u.type === 'rsvp') { u.guests.forEach(g => { if (u.rsvp) g.rsvp = u.rsvp; if (u.meal) g.meal = u.meal; if (u.plus) { g.plus = true; if (u.plusName) g.plusName = u.plusName; } if (g.rsvp === 'no') { g.table = null; g.plusTable = null; } }); msg = (u.guests.length === 1 ? u.guests[0].name : u.guests.length + ' guests') + ' updated'; }
  else if (u.type === 'vendor') {
    const data = { kind: u.kind, name: u.name, status: u.status, cost: u.cost, deposit: u.deposit, depositDue: u.depositDue, balanceDue: u.balanceDue, phone: u.phone, email: u.email };
    let v = u.fill && byId(S.vendors, u.fill.id);
    if (v) { Object.keys(data).forEach(k => { if (data[k]) v[k] = data[k]; }); v.status = u.status; }
    else { v = Object.assign({ id: uid(), contact: '', web: '', depositPaid: false, balancePaid: false, notes: '' }, data); S.vendors.push(v); }
    msg = vendorTitle(v) + (u.fill ? ' saved' : ' added');
  }
  else if (u.type === 'pay') { const v = u.vendors[0]; if (u.what === 'deposit') v.depositPaid = true; else { v.balancePaid = true; v.depositPaid = true; } v.status = 'booked'; syncExpense(v); msg = (u.what === 'deposit' ? 'Deposit' : 'Final balance') + ' marked paid'; }
  else if (u.type === 'expense') { S.budget.items.push({ id: uid(), cat: u.cat || S.budget.cats[0].id, name: u.name.slice(0, 120), cost: u.cost, paid: u.paid, due: u.due, note: '' }); openCats.add(u.cat); msg = 'Added to your budget'; }
  else if (u.type === 'task') { S.tasks.push({ id: uid(), t: u.t.slice(0, 200), b: u.b, done: false, due: u.due }); msg = 'Added to your checklist'; }
  else if (u.type === 'tables') { for (let i = 0; i < u.n; i++) S.tables.push({ id: uid(), name: u.name && u.n === 1 ? u.name : 'Table ' + (S.tables.length + 1), shape: u.shape, seats: u.seats }); msg = u.n === 1 ? (u.name || 'Table') + ' added' : u.n + ' tables added'; }
  askPending = null; askLast = '';
  closeAddSheet(); commit(); toast(msg, () => restoreSnapshot(snap));
}
function editAsk() {
  const u = askPending; if (!u) return; closeAddSheet(); askPending = null; askLast = '';
  if (u.type === 'guests') later(() => editGuest(null, { name: u.names[0], side: u.side, group: u.group, meal: u.meal, plus: u.plus, rsvp: u.rsvp }));
  else if (u.type === 'rsvp') later(() => editGuest(u.guests[0].id, Object.assign(u.rsvp ? { rsvp: u.rsvp } : {}, u.meal ? { meal: u.meal } : {}, u.plus ? { plus: true, plusName: u.plusName || u.guests[0].plusName } : {})));
  else if (u.type === 'vendor') { const pre = { kind: u.kind, status: u.status }; ['name', 'cost', 'deposit', 'depositDue', 'balanceDue', 'phone', 'email'].forEach(k => { if (u[k]) pre[k] = u[k]; }); later(() => editVendor(u.fill ? u.fill.id : null, pre)); }
  else if (u.type === 'pay') later(() => editVendor(u.vendors[0].id, u.what === 'deposit' ? { depositPaid: true, status: 'booked' } : { depositPaid: true, balancePaid: true, status: 'booked' }));
  else if (u.type === 'expense') later(() => editItem(null, u.cat, { name: u.name, cost: u.cost, paid: u.paid, due: u.due }));
  else if (u.type === 'task') later(() => editTask(null, u.b, { t: u.t }));
  else if (u.type === 'tables') later(() => editTable(null, { name: u.name || 'Table ' + (S.tables.length + 1), shape: u.shape, seats: u.seats }));
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-askact]'); if (!b || !S) return;
  const a = b.dataset.askact;
  if (a === 'clear') { const box = b.closest('.ask-out'); askPending = null; if (box && box.parentElement) { if (box.parentElement.id === 'askOut') askLast = ''; box.parentElement.innerHTML = ''; } return; }
  if (a === 'save') return saveAsk();
  if (a === 'edit') return editAsk();
  closeAddSheet();
  if (a.startsWith('go:')) go(a.slice(3));
  else if (a.startsWith('vendor:')) openVendorCard(a.slice(7));
  else if (a === 'edit-couple') later(editCouple);
  else if (a.startsWith('helper:')) later(() => openHelper(a.slice(7)));
  else if (a.startsWith('bd:')) { bdOpen = a.slice(3); go('bigday'); }
});

/* ---------- The + : say it first, or pick from the grid underneath ---------- */
const ADD_TILES = [
  ['guest', 'Guest', 'guests', () => editGuest(null)], ['list', 'Paste a list', 'listadd', () => bulkGuests()], ['vendor', 'Vendor', 'vendors', () => editVendor(null)],
  ['expense', 'Expense', 'cash', () => editItem(null)], ['task', 'To-do', 'checklist', () => editTask(null)], ['table', 'Table', 'seating', () => editTable(null)],
  ['file', 'File or photo', 'clip', null], ['details', 'Wedding details', 'heart', () => editCouple()]
];
function addMenu(only) {
  const tiles = only === 'vendors' ? ADD_TILES.filter(x => ['vendor', 'file', 'expense'].includes(x[0])) : ADD_TILES;
  const ph = only === 'vendors' ? 'Florist Magnolia, $2,900, $500 deposit due May 1' : 'Add Grace and Mark Bennett, family';
  const ex = only === 'vendors' ? ['Photographer Golden Hour $3,800, $1,000 deposit', 'Paid the florist deposit', 'DJ Southern Sound, $1,800'] : ['Add Ava and Leo Ramirez, plus one', 'Sophie Nguyen is coming, fish', 'Spent $340 on save-the-dates', 'Remind me to book the hotel block by March 1'];
  openSheet({
    title: only === 'vendors' ? 'Add a vendor' : 'Add', noFocus: true,
    body: '<div class="addask"><p>Tell me what to add</p>' +
      '<div class="ask" id="addAskForm" role="search"><label class="vh" for="addAskIn">What to add</label><input id="addAskIn" type="text" enterkeyhint="go" autocomplete="off" autocapitalize="sentences" placeholder="' + esc(ph) + '"><button type="button" data-addgo aria-label="Go">' + ic('send') + '</button></div>' +
      '<div class="ask-ex">' + ex.map(x => '<button type="button" data-addex="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div>' +
      '<small>Type it like a text, with the details. Tap the mic on your keyboard to say it instead.</small>' +
      '<div id="addAskOut"></div></div>' +
      '<div class="addor"><span>or pick one</span></div>' +
      '<div class="addgrid">' + tiles.map(([k, l, icon]) => '<button type="button" class="addtile" data-add="' + k + '"><span class="ati">' + ic(icon) + '</span>' + esc(l) + '</button>').join('') + '</div>',
    onMount: (sc, close) => {
      const inp = $('#addAskIn', sc), out = $('#addAskOut', sc);
      const go1 = () => { const v = inp.value.trim(); if (!v) { inp.focus(); return; } runAsk(v, out); inp.value = ''; inp.blur(); };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go1(); } });
      sc.addEventListener('click', e => {
        if (e.target.closest('[data-addgo]')) { go1(); return; }
        const x = e.target.closest('[data-addex]'); if (x) { runAsk(x.dataset.addex, out); return; }
        const b = e.target.closest('[data-add]'); if (!b) return;
        const tile = ADD_TILES.find(t => t[0] === b.dataset.add); if (!tile) return;
        if (tile[0] === 'file') { addDoc(''); return; }
        close(); later(tile[3]);
      });
      if (!isTouch()) inp.focus();
    }
  });
}
function askBoxHTML() {
  const ex = ['Who hasn’t RSVP’d?', 'What do we owe?', 'Add Ava and Leo Ramirez, plus one', 'Meal count', 'What’s next?'];
  return '<form class="ask" id="askForm" role="search"><label class="vh" for="askIn">Quick add: type a guest, a vendor, a payment or a question</label><input id="askIn" type="text" enterkeyhint="go" autocomplete="off" autocapitalize="sentences" placeholder="e.g. Sophie Nguyen is coming, fish"><button type="submit" aria-label="Go">' + ic('send') + '</button></form>' +
    (askLast ? '' : '<div class="ask-try">Try one</div><div class="ask-ex">' + ex.map(x => '<button type="button" data-act="ask-ex" data-q="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div>') +
    '<div id="askOut">' + askLast + '</div>';
}
function wireAskBox(main) {
  const f = $('#askForm', main); if (!f) return;
  f.addEventListener('submit', e => { e.preventDefault(); const i = $('#askIn', main); runAsk(i.value, $('#askOut', main)); i.value = ''; i.blur(); const exr = $('.ask-ex', main); if (exr) exr.remove(); const tr = $('.ask-try', main); if (tr) tr.remove(); });
}
