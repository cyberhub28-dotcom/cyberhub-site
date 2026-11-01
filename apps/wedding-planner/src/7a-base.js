/* ================= Upgrade: shared bits (icons, vendor colors, helpers) ================= */
Object.assign(ICONS, {
  wand: '<path d="m4 20 10.5-10.5M13 5.5V3M18.5 11H21M16.7 7.3l1.8-1.8M9.8 4.8l.9 1.6M19.2 14.2l-1.6-.9"/><path d="m14.5 9.5 2 2"/>',
  send: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  file: '<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/>',
  clip: '<path d="M16.5 7.5l-7.6 7.6a2 2 0 0 0 2.8 2.8l7.8-7.8a4 4 0 0 0-5.7-5.7l-7.9 7.9a6 6 0 0 0 8.5 8.5l6.6-6.6"/>',
  pdf: '<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5M9 13h6M9 16.5h4"/>',
  share: '<path d="M12 15V4M8 7.5l4-4 4 4"/><path d="M7 11H6a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 18 11h-1"/>',
  camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2.5h6L16.5 7h2A1.5 1.5 0 0 1 20 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z"/><circle cx="12" cy="13" r="3.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  sparkle: '<path d="M12 3.5 13.8 10 20.5 12l-6.7 2L12 20.5 10.2 14 3.5 12l6.7-2z"/>',
  ring: '<circle cx="12" cy="14" r="6.5"/><path d="m9.5 4.5 2.5 3 2.5-3-1-1.5h-3z"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>'
});

/* Wallet colors by vendor type: two-stop gradients with white ink, picked to read as a set of real cards. */
const VENDOR_STYLE = {
  'Venue': ['#2B3A67', '#1A2445'], 'Caterer': ['#B2532F', '#83351C'], 'Photographer': ['#2E2F36', '#16171C'],
  'Videographer': ['#3E4A5E', '#262E3D'], 'Florist': ['#B24A68', '#84304A'], 'DJ or band': ['#5B3F94', '#3C2869'],
  'Officiant': ['#8A6A2C', '#634A1A'], 'Hair & makeup': ['#C0627C', '#8F4259'], 'Cake & desserts': ['#A0663A', '#744525'],
  'Planner': ['#3F6B52', '#294A37'], 'Rentals': ['#4B6676', '#304654'], 'Transportation': ['#355C8A', '#223F63'],
  'Stationery': ['#6B6B3A', '#4A4A24'], 'Attire': ['#6E3F6B', '#4C2A4A'], 'Other': ['#5A5A66', '#3B3B44']
};
const vendorTitle = v => v.name || v.kind;
const vendorStyle = v => { const c = own(VENDOR_STYLE, v.kind) ? VENDOR_STYLE[v.kind] : VENDOR_STYLE.Other; return '--c1:' + c[0] + ';--c2:' + c[1]; };
const vendorBalance = v => Math.max(0, v.cost - v.deposit);
/* What a vendor card should say about money right now. */
function vendorMoney(v) {
  if (v.status === 'needed') return { tone: '', label: 'Still to book', line: '' };
  const bal = vendorBalance(v);
  if (v.deposit > 0 && !v.depositPaid) { const d = parseDay(v.depositDue); return { tone: d && daysBetween(today0(), d) < 0 ? 'bad' : d && daysBetween(today0(), d) <= 30 ? 'warn' : '', label: 'Deposit due', amount: v.deposit, due: d }; }
  if (v.status === 'booked' && bal > 0 && !v.balancePaid) { const d = parseDay(v.balanceDue); return { tone: d && daysBetween(today0(), d) < 0 ? 'bad' : d && daysBetween(today0(), d) <= 30 ? 'warn' : '', label: 'Balance due', amount: bal, due: d }; }
  if (v.status === 'booked' && v.cost > 0) return { tone: 'good', label: 'Paid in full', amount: v.cost };
  return { tone: '', label: v.status === 'booked' ? 'Booked' : 'Considering', amount: v.cost };
}
const shortDate = d => d ? fmtDate(d, { month: 'short', day: 'numeric' }) : '';
const dueWords = d => { if (!d) return ''; const n = daysBetween(today0(), d); return n < 0 ? Math.abs(n) + (n === -1 ? ' day late' : ' days late') : n === 0 ? 'today' : n === 1 ? 'tomorrow' : 'in ' + n + ' days'; };
function relDay(d) { const n = daysBetween(today0(), d); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? 'Yesterday' : n < 0 ? Math.abs(n) + ' days ago' : n < 60 ? 'In ' + n + ' days' : fmtDate(d, { month: 'short', day: 'numeric', year: d.getFullYear() !== today0().getFullYear() ? 'numeric' : undefined }); }
const later = fn => setTimeout(fn, 260);
/* Actions added by the upgrade files. 6-app.js merges these into its action list. */
const EXTRA_ACTS = {};
Object.assign(ICONS, {
  music: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8c-1.5-3-5-4-5-1.5S10 8 12 8zm0 0c1.5-3 5-4 5-1.5S14 8 12 8z"/>',
  bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 7.6v.2"/>',
  palette: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.3-1.2-1.6-1.2-2.8 0-1 .8-1.6 1.8-1.6h2.1A4 4 0 0 0 20.5 10C20.5 6.4 16.7 3.5 12 3.5z"/><circle cx="7.8" cy="11" r="1.2"/><circle cx="10.5" cy="7.4" r="1.2"/><circle cx="15" cy="7.6" r="1.2"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7h7M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15v2.5M8.5 18h.01M12 18h.01"/>',
  chat: '<path d="M5 18.5V6.5A2 2 0 0 1 7 4.5h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9z"/><path d="M8.5 9h7M8.5 12h4"/>',
  brush: '<path d="M14.5 4.5 19.5 9.5 11 18l-5-5z"/><path d="M6 13c-2 0-2.5 1.6-2.5 3s-.5 3-.5 3c2 .3 5.5 0 6-3"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.4"/><path d="M15.8 14.2A4.5 4.5 0 0 1 21 18.5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  seat: '<path d="M7 4v9h10M7 13v7M17 13v7M7 9h9"/>'
});
/* Copy text, or open the share sheet when the phone has one. */
async function shareText(title, text) {
  if (navigator.share && isTouch()) { try { await navigator.share({ title, text }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  copyText(text);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Copied. Paste it anywhere.'); return; } catch (e) {}
  const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-1000px;opacity:0'; document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
  ta.remove(); toast(ok ? 'Copied. Paste it anywhere.' : 'Couldn’t copy. Press and hold the text to copy it.');
}
const hm = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(s || ''); return m ? +m[1] * 60 + +m[2] : null; };
const hmStr = n => { n = ((Math.round(n) % 1440) + 1440) % 1440; return pad(Math.floor(n / 60)) + ':' + pad(n % 60); };
const timeWords = s => { const n = hm(s); if (n == null) return ''; const d = new Date(2000, 0, 1, Math.floor(n / 60), n % 60); return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); };
const firstOf = n => (String(n || '').trim().split(/\s+/)[0] || '');
