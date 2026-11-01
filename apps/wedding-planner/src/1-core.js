(function(){
'use strict';

/* ================= Helpers ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
/* Ids from storage or a backup file: only letters, digits, - and _, kept short. Anything else gets a new id. */
const cleanId = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v) && !(v in Object.prototype) && v !== '__proto__' ? v : '';
/* Does a fixed list (a plain object) really have this key? Built-in words like "constructor" don't count. */
const own = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
const objs = v => Array.isArray(v) ? v.filter(x => x && typeof x === 'object' && !Array.isArray(x)) : [];
const byId = (arr, id) => arr.find(x => x.id === id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const num = v => { if (typeof v !== 'number' && typeof v !== 'string') return 0; const n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; };
const sum = (arr, f) => arr.reduce((t, x) => t + (f ? f(x) : x), 0);
const pad = n => String(n).padStart(2, '0');
const isoDay = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parseDay = s => { if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null; const [y, m, d] = s.split('-').map(Number); const x = new Date(y, m - 1, d); return x.getMonth() === m - 1 && x.getDate() === d ? x : null; };
const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const daysBetween = (a, b) => Math.round((b - a) / 86400000);
const initials = n => { const p = String(n || '?').trim().split(/\s+/).filter(Boolean); return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); };
const firstName = n => String(n || '').trim().split(/\s+/)[0] || 'Guest';
const lastName = n => { const p = String(n || '').trim().split(/\s+/); return (p[p.length - 1] || '').toLowerCase(); };
const shortName = n => { const p = String(n || '').trim().split(/\s+/).filter(Boolean); return p.length > 1 ? p[0] + ' ' + p[p.length - 1][0] + '.' : (p[0] || 'Guest'); };
const fmtDate = (d, opt) => d ? d.toLocaleDateString(undefined, opt || { month: 'short', day: 'numeric', year: 'numeric' }) : '';
const isTouch = () => matchMedia('(pointer:coarse)').matches;

const ICONS = {
  home:'<path d="M3.5 10.5 12 3.5l8.5 7V19a1.5 1.5 0 0 1-1.5 1.5h-4v-6h-6v6H5A1.5 1.5 0 0 1 3.5 19z"/>',
  guests:'<path d="M15.5 20v-1.2a3.8 3.8 0 0 0-3.8-3.8H7.3a3.8 3.8 0 0 0-3.8 3.8V20"/><circle cx="9.5" cy="8" r="3.6"/><path d="M20.5 20v-1.2a3.8 3.8 0 0 0-2.7-3.6M15.3 4.6a3.6 3.6 0 0 1 0 6.8"/>',
  seating:'<circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="3.8" r="1.6"/><circle cx="12" cy="20.2" r="1.6"/><circle cx="3.8" cy="12" r="1.6"/><circle cx="20.2" cy="12" r="1.6"/><circle cx="6.2" cy="6.2" r="1.3"/><circle cx="17.8" cy="17.8" r="1.3"/><circle cx="17.8" cy="6.2" r="1.3"/><circle cx="6.2" cy="17.8" r="1.3"/>',
  budget:'<path d="M20.5 13A8.5 8.5 0 1 1 11 3.5V13z"/><path d="M14 3.6A8.5 8.5 0 0 1 20.4 10H14z"/>',
  vendors:'<path d="M3.5 8.5h17V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z"/><path d="M8.5 8.5V6.5a2.5 2.5 0 0 1 2.5-2.5h2a2.5 2.5 0 0 1 2.5 2.5v2M3.5 13.5h17"/>',
  checklist:'<path d="M10 6.5h10M10 12h10M10 17.5h10M3.8 6.5l1.4 1.4 2.4-2.6M3.8 12l1.4 1.4 2.4-2.6M3.8 17.5l1.4 1.4 2.4-2.6"/>',
  more:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x:'<path d="M6 6l12 12M18 6 6 18"/>',
  trash:'<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
  save:'<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  upload:'<path d="M12 16V5M7 9.5l5-5 5 5M5 20h14"/>',
  print:'<path d="M7 9V3.5h10V9M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v6.5H7z"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.8M12 17h.01"/>',
  phone:'<path d="M5 3.8h3l1.6 4.1-2 1.5a11 11 0 0 0 7 7l1.5-2 4.1 1.6v3a1.6 1.6 0 0 1-1.7 1.6A16.5 16.5 0 0 1 3.4 5.5 1.6 1.6 0 0 1 5 3.8z"/>',
  mail:'<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4.5 7 7.5 6 7.5-6"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  copy:'<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2"/><path d="M15.5 8.5V6A2 2 0 0 0 13.5 4H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  edit:'<path d="M4 20h4L19.5 8.5a2.8 2.8 0 0 0-4-4L4 16z"/>',
  shield:'<path d="M12 3.5 19 6.5v5.5c0 4.4-3 7.4-7 8.6-4-1.2-7-4.2-7-8.6V6.5z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  listadd:'<path d="M4 6h12M4 12h12M4 18h7M17.5 15v6M14.5 18h6"/>',
  alert:'<path d="M12 4 21 19.5H3z"/><path d="M12 10v4M12 17h.01"/>',
  cash:'<rect x="3" y="6.5" width="18" height="11" rx="2"/><circle cx="12" cy="12" r="2.6"/>',
  addhome:'<rect x="4" y="4" width="16" height="16" rx="4.5"/><path d="M12 8.5v7M8.5 12h7"/>',
  heart:'<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
  chev:'<path d="m9 6 6 6-6 6"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  table:'<rect x="3.5" y="8" width="17" height="8" rx="2"/><circle cx="7" cy="4.5" r="1.4"/><circle cx="12" cy="4.5" r="1.4"/><circle cx="17" cy="4.5" r="1.4"/><circle cx="7" cy="19.5" r="1.4"/><circle cx="12" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
  rings:'<circle cx="9" cy="13.5" r="5.5"/><circle cx="15" cy="13.5" r="5.5"/><path d="M13.6 4.3 15 2.8l1.4 1.5L15 6z"/>'
};
const ic = (n, cls) => '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || '') + '</svg>';
const RINGS = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="13.5" r="5.5"/><circle cx="15" cy="13.5" r="5.5"/><path d="M13.6 4.3 15 2.8l1.4 1.5L15 6z"/></svg>';

/* Botanical sprig drawn from code: a curved stem with almond leaves that shrink toward the tip. */
function sprigSVG(cls) {
  const P = t => { const u = 1 - t; return [u*u*u*20 + 3*u*u*t*40 + 3*u*t*t*120 + t*t*t*190, u*u*u*230 + 3*u*u*t*150 + 3*u*t*t*90 + t*t*t*20]; };
  const D = t => { const u = 1 - t; return [3*u*u*20 + 6*u*t*80 + 3*t*t*70, 3*u*u*(-80) + 6*u*t*(-60) + 3*t*t*(-70)]; };
  let leaves = '';
  for (let i = 1; i <= 11; i++) {
    const t = i / 12, [x, y] = P(t), [dx, dy] = D(t), base = Math.atan2(dy, dx) * 180 / Math.PI, side = i % 2 ? 1 : -1;
    const L = 46 - t * 26, W = L * .32, ang = base + side * (48 - t * 10);
    leaves += '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')"><path d="M0 0Q' + (L / 2).toFixed(1) + ' ' + (-W).toFixed(1) + ' ' + L.toFixed(1) + ' 0Q' + (L / 2).toFixed(1) + ' ' + W.toFixed(1) + ' 0 0Z"/><path d="M2 0H' + (L * .8).toFixed(1) + '" fill="none"/></g>';
  }
  const [ex, ey] = P(1);
  leaves += '<g transform="translate(' + ex.toFixed(1) + ' ' + ey.toFixed(1) + ') rotate(-62)"><path d="M0 0Q9 -6 20 0Q9 6 0 0Z"/></g>';
  return '<svg class="sprig ' + cls + '" viewBox="0 0 220 250" aria-hidden="true"><path d="M20 230C40 150 120 90 190 20" fill="none"/>' + leaves + '</svg>';
}
const DIAMOND = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 0 10 5 5 10 0 5z"/></svg>';
const PHOTO_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

/* ================= Constants ================= */
const KEY = 'wedding-command-center/v1';
const PALETTES = [
  { k: 'midnight', name: 'Midnight', c: 'linear-gradient(140deg,#1B2042 50%,#C9A66B 50%)' },
  { k: 'blush', name: 'Blush', c: 'linear-gradient(140deg,#6A3045 50%,#EC97AA 50%)' },
  { k: 'sage', name: 'Sage', c: 'linear-gradient(140deg,#2E4A3A 50%,#95C5A1 50%)' },
  { k: 'dusk', name: 'Dusty blue', c: 'linear-gradient(140deg,#2A4266 50%,#94B5E0 50%)' },
  { k: 'plum', name: 'Plum', c: 'linear-gradient(140deg,#45295C 50%,#BCA0D8 50%)' },
  { k: 'blacktie', name: 'Black tie', c: 'linear-gradient(140deg,#0F0F12 50%,#E7E3DA 50%)' }
];
const CURRENCIES = ['USD','CAD','GBP','EUR','AUD','NZD','MXN','INR','ZAR','JPY'];
const CAT_SPLIT = [
  ['Venue & rentals', 22], ['Food & drink', 28], ['Photo & video', 12], ['Attire & beauty', 8], ['Flowers & decor', 9],
  ['Music & entertainment', 7], ['Rings', 4], ['Stationery', 3], ['Transportation', 2], ['Favors & gifts', 2],
  ['Officiant & license', 1], ['Cushion for surprises', 2]
];
const VENDOR_KINDS = ['Venue','Caterer','Photographer','Videographer','Florist','DJ or band','Officiant','Hair & makeup','Cake & desserts','Planner','Rentals','Transportation','Stationery','Attire','Other'];
const BUCKETS = [
  { k: 'm12', label: '12 months or more before', m: -12 },
  { k: 'm9', label: '9 to 11 months before', m: -9 },
  { k: 'm6', label: '6 to 8 months before', m: -6 },
  { k: 'm4', label: '4 to 5 months before', m: -4 },
  { k: 'm2', label: '2 to 3 months before', m: -2 },
  { k: 'm1', label: '1 month before', m: -1 },
  { k: 'w2', label: '1 to 2 weeks before', d: -7 },
  { k: 'd0', label: 'The day before and the big day', d: 0 },
  { k: 'after', label: 'After the wedding', d: 30 }
];
const TASKS = {
  m12: ['Agree on your total budget','Draft your guest list','Choose your wedding date','Book the ceremony and reception venue','Decide if you want a wedding planner','Ask your wedding party','Start a wedding website or info page'],
  m9: ['Book your photographer','Book a videographer','Book your caterer (if the venue doesn’t provide one)','Book your DJ or band','Book your officiant','Start shopping for wedding attire','Reserve a hotel room block for guests'],
  m6: ['Send save-the-dates','Book your florist','Book hair and makeup','Set up your gift registry','Plan the honeymoon','Book a cake tasting','Book guest and wedding-party transportation'],
  m4: ['Order the wedding cake','Order invitations','Buy your wedding rings','Plan the rehearsal dinner','Choose ceremony readings and music','Order wedding-party attire'],
  m2: ['Mail invitations (6 to 8 weeks before)','Schedule final attire fittings','Write your vows','Finalize the menu with your caterer','Buy favors and wedding-party gifts','Plan the day-of timeline'],
  m1: ['Get your marriage license (check your local rules for timing)','Follow up on missing RSVPs','Finish the seating chart','Confirm details with every vendor','Break in your wedding shoes'],
  w2: ['Give the final headcount to your caterer','Make final vendor payments','Share the day-of timeline with vendors and the wedding party','Give your music list to the DJ or band','Pack for the honeymoon','Pick up attire and rings'],
  d0: ['Rehearsal and rehearsal dinner','Hand tips and final payments to a trusted person','Pack rings, license and vows','Eat a real breakfast and enjoy every minute'],
  after: ['Send thank-you notes','Return rentals and borrowed items','Preserve the dress and bouquet','Update your name on documents (if you’re changing it)','Leave reviews for your favorite vendors']
};
function defaultTasks() { const out = []; for (const b of BUCKETS) for (const t of TASKS[b.k]) out.push({ id: uid(), b: b.k, t, done: false }); return out; }
function defaultCats() { return CAT_SPLIT.map(([name]) => ({ id: uid(), name, planned: 0 })); }

function blankPlan() {
  return Object.assign({
    app: 'wedding-command-center', v: 1, sample: false,
    couple: { a: '', b: '', date: '', time: '16:00', venue: '', city: '', photo: '', rsvpBy: '' },
    settings: { palette: 'midnight', mode: 'auto', currency: 'USD', meals: ['Chicken','Beef','Fish','Vegetarian','Kids meal'], style: blankStyle() },
    guests: [], tables: [], households: [],
    budget: { total: 0, cats: defaultCats(), items: [] },
    vendors: [], tasks: defaultTasks(), docs: [],
    meta: { created: Date.now(), lastBackup: 0, changes: 0, snooze: 0, homeHide: 0, askHint: 0 }
  }, blankExtra());
}

/* A copy of saved data without keys that name built-in parts of JavaScript ("constructor", "toString", "__proto__" and so on),
   so a hand-made file can't trip up the checks below. */
function scrub(v, depth) {
  if (depth > 12) return null;
  if (Array.isArray(v)) return v.slice(0, 5000).map(x => scrub(x, depth + 1));
  if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) if (!(k in Object.prototype) && k !== '__proto__') o[k] = scrub(v[k], depth + 1); return o; }
  return v;
}
/* Fill gaps and fix types in a plan (used on load and on restore). */
function normalize(p) {
  p = scrub(p, 0);
  const b = blankPlan();
  if (!p || typeof p !== 'object') return b;
  const str = (v, d) => typeof v === 'string' ? v.slice(0, 500) : typeof v === 'number' && isFinite(v) ? String(v) : d;
  const out = b;
  out.sample = !!p.sample;
  const ob = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const c = ob(p.couple);
  out.couple = { a: str(c.a, ''), b: str(c.b, ''), date: parseDay(c.date) ? c.date : '', time: /^\d{2}:\d{2}$/.test(c.time || '') ? c.time : '16:00', venue: str(c.venue, ''), city: str(c.city, ''), photo: typeof c.photo === 'string' && c.photo.length < 3e6 && PHOTO_RE.test(c.photo) ? c.photo : '', rsvpBy: parseDay(c.rsvpBy) ? c.rsvpBy : '' };
  const s = ob(p.settings);
  out.settings = {
    palette: PALETTES.some(x => x.k === s.palette) ? s.palette : 'midnight',
    mode: ['auto','light','dark'].includes(s.mode) ? s.mode : 'auto',
    currency: CURRENCIES.includes(s.currency) ? s.currency : 'USD',
    meals: Array.isArray(s.meals) && s.meals.length ? s.meals.map(m => str(m, '')).filter(Boolean).slice(0, 20) : b.settings.meals,
    style: normStyle(s.style, s.palette)
  };
  const tableIds = new Set();
  out.tables = objs(p.tables).map((t, i) => {
    const id = cleanId(t.id) || uid(); tableIds.add(id);
    return { id, name: str(t.name, 'Table ' + (i + 1)), shape: t.shape === 'long' ? 'long' : 'round', seats: clamp(Math.round(num(t.seats)) || 8, 1, 30) };
  });
  out.guests = objs(p.guests).filter(g => g && g.name).map(g => ({
    id: cleanId(g.id) || uid(), name: str(g.name, ''), side: ['a','b','both'].includes(g.side) ? g.side : 'both',
    group: str(g.group, ''), contact: str(g.contact, ''), rsvp: ['yes','no','pending'].includes(g.rsvp) ? g.rsvp : 'pending',
    meal: str(g.meal, ''), diet: str(g.diet, ''), plus: !!g.plus, plusName: str(g.plusName, ''), plusMeal: str(g.plusMeal, ''),
    table: tableIds.has(g.table) ? g.table : null, plusTable: tableIds.has(g.plusTable) ? g.plusTable : null, notes: str(g.notes, ''),
    addr: parseAddr(g.addr), hh: cleanId(g.hh)
  }));
  out.households = objs(p.households).filter(h => cleanId(h.id)).slice(0, 2000).map(h => ({ id: cleanId(h.id), name: str(h.name, ''), addr: parseAddr(h.addr) }));
  cleanHouseholds(out);
  for (const g of out.guests) { if (g.rsvp === 'no') { g.table = null; g.plusTable = null; } if (!g.plus) g.plusTable = null; }
  const bu = ob(p.budget);
  out.budget.total = Math.max(0, num(bu.total));
  const cats0 = objs(bu.cats);
  if (cats0.length) out.budget.cats = cats0.map(x => ({ id: cleanId(x.id) || uid(), name: str(x.name, 'Category'), planned: Math.max(0, num(x.planned)) }));
  const catIds = new Set(out.budget.cats.map(x => x.id));
  out.budget.items = objs(bu.items).map(x => ({ id: cleanId(x.id) || uid(), cat: catIds.has(x.cat) ? x.cat : out.budget.cats[0].id, name: str(x.name, 'Expense'), cost: Math.max(0, num(x.cost)), paid: Math.max(0, num(x.paid)), due: parseDay(x.due) ? x.due : '', note: str(x.note, '') }));
  out.vendors = objs(p.vendors).filter(v => v && (v.name || v.status === 'needed')).map(v => ({
    id: cleanId(v.id) || uid(), kind: VENDOR_KINDS.includes(v.kind) ? v.kind : 'Other', name: str(v.name, ''), status: ['booked', 'needed'].includes(v.status) ? v.status : 'considering',
    contact: str(v.contact, ''), phone: str(v.phone, ''), email: str(v.email, ''), web: str(v.web, ''),
    cost: Math.max(0, num(v.cost)), deposit: Math.max(0, num(v.deposit)), depositDue: parseDay(v.depositDue) ? v.depositDue : '', depositPaid: !!v.depositPaid,
    balanceDue: parseDay(v.balanceDue) ? v.balanceDue : '', balancePaid: !!v.balancePaid, notes: str(v.notes, '')
  }));
  if (Array.isArray(p.tasks)) out.tasks = objs(p.tasks).filter(t => t.t).map(t => ({ id: cleanId(t.id) || uid(), b: BUCKETS.some(x => x.k === t.b) ? t.b : 'm1', t: str(t.t, ''), done: !!t.done, due: parseDay(t.due) ? t.due : '' }));
  out.docs = objs(p.docs).filter(d => cleanId(d.id)).slice(0, 500).map(d => ({ id: cleanId(d.id), name: str(d.name, 'File').slice(0, 80), type: /^(image\/jpeg|image\/png|application\/pdf|application\/[\w.+-]+|text\/plain)$/.test(d.type) ? d.type : 'application/octet-stream', ext: str(d.ext, '').replace(/[^a-z0-9]/gi, '').slice(0, 6), size: Math.max(0, num(d.size)), added: parseDay(d.added) ? d.added : isoDay(new Date()), vendorId: cleanId(d.vendorId), tag: str(d.tag, 'Other').slice(0, 40) }));
  const m = ob(p.meta);
  out.meta = { created: num(m.created) || Date.now(), lastBackup: num(m.lastBackup), changes: num(m.changes), snooze: num(m.snooze), homeHide: num(m.homeHide), askHint: num(m.askHint) };
  normalizeExtra(p, out);
  return out;
}

/* ================= Sample wedding ================= */
function samplePlan() {
  const p = blankPlan();
  p.sample = true;
  const d = today0(); d.setDate(d.getDate() + 230); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  p.couple = { a: 'Olivia', b: 'James', date: isoDay(d), time: '16:30', venue: 'Willow Creek Estate', city: 'Charleston, SC', photo: '' };
  const T = (name, shape, seats) => { const t = { id: uid(), name, shape, seats }; p.tables.push(t); return t.id; };
  const head = T('Head table', 'long', 10), t1 = T('Table 1', 'round', 8), t2 = T('Table 2', 'round', 8), t3 = T('Table 3', 'round', 8), t4 = T('Table 4', 'round', 8), t5 = T('Table 5', 'round', 8);
  const G = (name, side, group, rsvp, meal, plus, plusName, plusMeal, table, plusTable, diet) => p.guests.push({ id: uid(), name, side, group, contact: '', rsvp, meal: meal || '', diet: diet || '', plus: !!plus, plusName: plusName || '', plusMeal: plusMeal || '', table: table || null, plusTable: plusTable || null, notes: '', addr: '', hh: '' });
  G('Grace Bennett','a','Family','yes','Fish',1,'Daniel Bennett','Beef',t1,t1);
  G('Mark Bennett','a','Family','yes','Beef',1,'Karen Bennett','Chicken',t1,t1);
  G('Ava Thompson','a','Wedding party','yes','Vegetarian',0,'','',head,null,'No nuts');
  G('Chloe Ramirez','a','Wedding party','yes','Chicken',1,'Leo Ramirez','Chicken',head,t2);
  G('Mia Patel','a','Friends','yes','Vegetarian',1,'Arjun Patel','Vegetarian',t2,t2);
  G('Sophie Nguyen','a','Friends','pending','',1,'','',null,null);
  G('Emma Lopez','a','Work','yes','Fish',0,'','',t2,null);
  G('Hannah Brooks','a','Friends','no','',0,'','',null,null);
  G('Isabella Rossi','a','Family','yes','Chicken',0,'','',t1,null);
  G('Ruth Bennett','a','Family','yes','Fish',0,'','',t1,null,'Gluten free');
  G('Natalie Kim','a','Work','pending','',0,'','',null,null);
  G('Zoe Carter','b','Family','yes','Beef',1,'Ethan Carter','Beef',t3,t3);
  G('Robert Carter','b','Family','yes','Beef',1,'Linda Carter','Fish',t3,t3);
  G('Noah Williams','b','Wedding party','yes','Beef',1,'Lily Williams','Vegetarian',head,head);
  G('Liam Johnson','b','Wedding party','yes','Chicken',0,'','',head,null);
  G('Owen Davis','b','Friends','yes','Beef',1,'Priya Davis','Fish',t4,t4);
  G('Lucas Martin','b','Friends','pending','',1,'','',null,null);
  G('Henry Clark','b','Work','yes','Chicken',0,'','',t4,null);
  G('Samuel Lewis','b','Friends','no','',0,'','',null,null);
  G('Jack Walker','b','Friends','yes','Fish',1,'Ella Walker','Fish',null,null);
  G('Benjamin Hall','b','Work','pending','',0,'','',null,null);
  G('Dorothy Carter','b','Family','yes','Chicken',0,'','',t3,null);
  G('Ben Carter','b','Family','yes','Kids meal',0,'','',t3,null);
  G('Aunt Marie Young','both','Family','yes','Fish',1,'Paul Young','Beef',t5,t5);
  G('Father Michael Reed','both','Officiant','yes','Chicken',0,'','',t5,null);
  G('Claire Adams','both','Friends','pending','',1,'','',null,null);
  G('Tom Wright','both','Neighbors','yes','Beef',1,'Julie Wright','Chicken',null,null);
  G('Rachel Scott','both','Friends','yes','Vegetarian',0,'','',null,null);
  p.budget.total = 38000;
  const plan = [9000, 10800, 4200, 3000, 3000, 2200, 1500, 600, 500, 500, 400, 2300];
  p.budget.cats.forEach((c, i) => c.planned = plan[i]);
  const cat = n => p.budget.cats.find(c => c.name === n).id;
  const due = (days) => { const x = today0(); x.setDate(x.getDate() + days); return isoDay(x); };
  const I = (c, name, cost, paid, dd) => p.budget.items.push({ id: uid(), cat: cat(c), name, cost, paid, due: dd || '', note: '' });
  I('Venue & rentals','Willow Creek Estate',8200,2500,due(120)); I('Venue & rentals','Chairs and linens',650,0,due(200));
  I('Food & drink','Catering (110 guests)',9600,3000,due(200)); I('Food & drink','Bar package',1500,0,due(200));
  I('Photo & video','Photographer',3800,1000,due(190)); I('Attire & beauty','Wedding dress',2100,2100);
  I('Attire & beauty','Suit',780,780); I('Flowers & decor','Florist',2900,500,due(60)); I('Music & entertainment','DJ',1800,400,due(210));
  I('Rings','Wedding bands',1450,1450); I('Stationery','Save-the-dates',340,340);
  const V = (kind, name, status, contact, phone, email, web, cost, deposit, depositPaid, depositDue, balanceDue) => p.vendors.push({ id: uid(), kind, name, status, contact, phone, email, web, cost, deposit, depositPaid, depositDue: depositDue || '', balanceDue: balanceDue || '', balancePaid: false, notes: '' });
  V('Venue','Willow Creek Estate','booked','Meredith (events)','(843) 555-0142','events@willowcreek.example','https://willowcreek.example',8200,2500,true,'',due(120));
  V('Caterer','Lowcountry Table','booked','Andre','(843) 555-0187','hello@lowcountrytable.example','',9600,3000,true,'',due(200));
  V('Photographer','Golden Hour Studio','booked','Tessa','(843) 555-0110','tessa@goldenhour.example','https://goldenhour.example',3800,1000,true,'',due(190));
  V('Florist','Magnolia & Moss','booked','Jen','(843) 555-0199','jen@magnoliamoss.example','',2900,500,false,due(9),due(200));
  V('DJ or band','Southern Sound DJs','booked','Marcus','(843) 555-0133','book@southernsound.example','',1800,400,true,'',due(210));
  V('Hair & makeup','Glow Bridal Co.','considering','Priya','(843) 555-0174','','https://glowbridal.example',950,200,false,due(30),'');
  V('Officiant','','needed','','','','',0,0,false,'','');
  V('Cake & desserts','','needed','','','','',0,0,false,'','');
  p.couple.rsvpBy = isoDay(new Date(d.getTime() - 35 * 864e5));
  sampleMail(p);
  for (const t of p.tasks) if (t.b === 'm12' || (t.b === 'm9' && !/videographer|hotel/i.test(t.t))) t.done = true;
  p.meta.lastBackup = Date.now();
  sampleExtra(p);
  const keep = S; S = p; p.day = buildDay({ time: p.couple.time, cer: 30, firstLook: true, cock: 60, rec: 5, people: 5, golden: true, sendoff: true }); S = keep;
  return p;
}

/* ================= State & storage ================= */
let S = null;
let storageOK = true;
let route = 'home';
/* Never lose a plan we can't read: keep the saved copy under its own name before the app starts fresh,
   tell the couple, and let them save it as a backup file (Menu > Your data). Later saves never touch it. */
const KEPT = KEY + '-unreadable-';
let keptNow = '';
function keepAside() {
  try { const raw = localStorage.getItem(KEY); if (!raw) return ''; const k = KEPT + Date.now(); localStorage.setItem(k, raw); keptNow = k; return k; } catch (e) { return ''; }
}
function keptCopies() { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf(KEPT) === 0) out.push(k); } } catch (e) {} return out.sort(); }
function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { storageOK = false; return null; }
  if (!raw) return null;
  try { return normalize(JSON.parse(raw)); }
  catch (e) { keepAside(); return null; }
}
function persist() {
  if (!S) return;
  try { localStorage.setItem(KEY, JSON.stringify(S)); storageOK = true; }
  catch (e) { const was = storageOK; storageOK = false; if (was && typeof toast === 'function') toast('Couldn’t save on this phone. It may be full. Save a backup now.'); }
}
function commit(opts) {
  cleanHouseholds(S);
  if (!(opts && opts.quiet)) S.meta.changes = (S.meta.changes || 0) + 1;
  persist();
  render();
}
function snapshot() { return JSON.stringify(S); }
function restoreSnapshot(s) { S = normalize(JSON.parse(s)); persist(); applyTheme(); render(); }

/* ================= Money & dates ================= */
let moneyFmt = null, moneyCur = '';
function money(v) {
  const cur = S ? S.settings.currency : 'USD';
  if (!moneyFmt || moneyCur !== cur) {
    try { moneyFmt = new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, maximumFractionDigits: 0 }); }
    catch (e) { moneyFmt = { format: n => '$' + Math.round(n).toLocaleString() }; }
    moneyCur = cur;
  }
  return moneyFmt.format(Math.round(v || 0));
}
function weddingDay() { return S && parseDay(S.couple.date); }
function weddingMoment() {
  const d = weddingDay(); if (!d) return null;
  const [h, m] = (S.couple.time || '16:00').split(':').map(Number);
  d.setHours(h || 0, m || 0, 0, 0); return d;
}
function bucketDue(b) {
  const w = weddingDay(); if (!w) return null;
  const d = new Date(w);
  if (b.m) { const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + b.m); d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); }
  if (b.d != null) d.setDate(d.getDate() + b.d);
  /* A step whose time had already passed when you started gets a month to catch up, so a new plan doesn't open "late". */
  if (!S.sample && b.d == null && S.meta && S.meta.created) {
    const start = new Date(S.meta.created); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() + 30);
    const cap = new Date(w); cap.setDate(cap.getDate() - 7);
    if (d < start) return start < cap ? start : (d > cap ? d : cap);
  }
  return d;
}
function coupleNames(html) {
  const a = S.couple.a.trim(), b = S.couple.b.trim();
  if (!a && !b) return html ? 'Our <em>Wedding</em>' : 'Our wedding';
  if (!b || !a) return html ? esc(a || b) : a || b;
  return html ? esc(a) + ' <em>&amp;</em> ' + esc(b) : a + ' & ' + b;
}
function sideLabel(s) { const a = S.couple.a.trim() || 'Partner 1', b = S.couple.b.trim() || 'Partner 2'; return s === 'a' ? a + '’s side' : s === 'b' ? b + '’s side' : 'Both'; }

/* ================= Derived numbers ================= */
function people() {
  const out = [];
  for (const g of S.guests) {
    if (g.rsvp === 'no') continue;
    out.push({ key: g.id + ':0', g, plus: false, name: g.name, table: g.table, pending: g.rsvp === 'pending' });
    if (g.plus) out.push({ key: g.id + ':1', g, plus: true, name: g.plusName || firstName(g.name) + '’s guest', table: g.plusTable, pending: g.rsvp === 'pending' });
  }
  return out;
}
function guestStats() {
  let invited = 0, yes = 0, pending = 0, no = 0;
  for (const g of S.guests) {
    const n = 1 + (g.plus ? 1 : 0); invited += n;
    if (g.rsvp === 'yes') yes += n; else if (g.rsvp === 'no') no += n; else pending += n;
  }
  return { invited, yes, pending, no };
}
function mealCounts() {
  const m = new Map(); S.settings.meals.forEach(x => m.set(x, 0)); let unset = 0;
  for (const g of S.guests) {
    if (g.rsvp !== 'yes') continue;
    const add = v => { if (!v) unset++; else m.set(v, (m.get(v) || 0) + 1); };
    add(g.meal); if (g.plus) add(g.plusMeal);
  }
  return { list: Array.from(m.entries()), unset };
}
function budgetTotals() {
  const spent = sum(S.budget.items, i => i.cost), paid = sum(S.budget.items, i => Math.min(i.paid, i.cost || i.paid));
  const planned = sum(S.budget.cats, c => c.planned);
  return { total: S.budget.total, spent, paid, planned, left: S.budget.total - spent };
}
function catSpent(id) { return sum(S.budget.items.filter(i => i.cat === id), i => i.cost); }
function payments() {
  const out = [];
  for (const v of S.vendors) {
    if (v.status === 'needed') continue;
    if (v.deposit > 0 && !v.depositPaid) out.push({ v, kind: 'Deposit', amount: v.deposit, due: parseDay(v.depositDue) });
    const bal = Math.max(0, v.cost - v.deposit);
    if (bal > 0 && !v.balancePaid && v.status === 'booked') out.push({ v, kind: 'Final balance', amount: bal, due: parseDay(v.balanceDue) });
  }
  return out.sort((a, b) => (a.due ? a.due.getTime() : 9e15) - (b.due ? b.due.getTime() : 9e15));
}
function dueTag(d) {
  if (!d) return '<span class="pill neutral">No due date</span>';
  const n = daysBetween(today0(), d);
  if (n < 0) return '<span class="pill bad">' + ic('alert', 'sm') + Math.abs(n) + ' day' + (n === -1 ? '' : 's') + ' late</span>';
  if (n === 0) return '<span class="pill warn">Due today</span>';
  if (n <= 30) return '<span class="pill warn">Due in ' + n + ' day' + (n === 1 ? '' : 's') + '</span>';
  return '<span class="pill neutral">Due ' + esc(fmtDate(d, { month: 'short', day: 'numeric' })) + '</span>';
}
/* Weekly backup reminder: shows once a week has passed since the last backup (or early, after the first few changes). */
function needsBackup() {
  if (!S || S.sample || !S.meta.changes) return false;
  if (Date.now() < S.meta.snooze) return false;
  const since = S.meta.lastBackup || S.meta.created;
  return Date.now() - since > 7 * 864e5 || S.meta.changes >= (S.meta.lastBackup ? 40 : 5);
}
/* Home Screen nudge: hidden once the app is opened from the Home Screen. */
const isStandalone = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = () => /Android/i.test(navigator.userAgent);
function showHomeNudge() { return !!S && !isStandalone() && Date.now() >= S.meta.homeHide; }
function lastBackupText() {
  if (!S.meta.lastBackup) return 'Never backed up';
  const n = daysBetween(new Date(S.meta.lastBackup), new Date());
  return 'Last backup ' + (n <= 0 ? 'today' : n === 1 ? 'yesterday' : n + ' days ago');
}

