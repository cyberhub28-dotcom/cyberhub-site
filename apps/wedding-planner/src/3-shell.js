/* ================= Router & shell ================= */
const VIEWS = [
  { k: 'home', label: 'Home', icon: 'home' },
  { k: 'guests', label: 'Guests', icon: 'guests' },
  { k: 'seating', label: 'Seating', icon: 'seating' },
  { k: 'budget', label: 'Budget', icon: 'budget' },
  { k: 'vendors', label: 'Vendors', icon: 'vendors' },
  { k: 'checklist', label: 'To-do list', short: 'To-do', icon: 'checklist' },
  { k: 'bigday', label: 'Big day', icon: 'sparkle' },
  { k: 'helpers', label: 'Smart helpers', icon: 'wand' }
];
const EXTRA = ['more', 'help', 'style'];
const EXTRA_TITLES = { more: 'Menu', help: 'How to use', style: 'Look & style' };
function go(k) { route = k; try { if (location.hash !== '#' + k) { skipHash = '#' + k; location.hash = k; } } catch (e) { skipHash = ''; } $$('.scrim').forEach(s => s.remove()); lock(); render(); toTop(); }
/* On big screens (the open foldable iPhone, iPad) the page scrolls inside the body, so the top bar and tab bar stay put.
   Phones never match, because both need a screen at least 600 wide and 500 tall. getY and scrollToY pick the right scroller. */
const shellQ = window.matchMedia ? matchMedia('(min-width:600px) and (min-height:500px)') : null;
const inShell = () => !!(shellQ && shellQ.matches);
const getY = () => inShell() ? document.body.scrollTop : (window.scrollY || 0);
function scrollToY(y) { try { if (inShell()) document.body.scrollTop = y; else window.scrollTo(0, y); } catch (e) {} }
/* Some phone frames ignore window.scrollTo, so set every scroller we know about. */
function toTop() { try { window.scrollTo(0, 0); } catch (e) {} const se = document.scrollingElement || document.documentElement; if (se) se.scrollTop = 0; if (document.body) document.body.scrollTop = 0; }
let skipHash = '', menuFrom = 'home';
/* Like the Credentials Tracker: a thin line under the top bar once you scroll, and the page name after a bit more. */
function onScroll() {
  const b = $('#topbar'); if (!b) return; const y = getY(); b.classList.toggle('scrolled', y > 6);
  const h1 = $('#main .phead h1'), ph = h1 && h1.closest('.phead'), bb = b.getBoundingClientRect().bottom;
  /* the big title fades out over the first few points as it reaches the bar and the small bar title takes over,
     so the two never show at once (a fast flick on iPhone can outrun a slower fade) */
  const hf = h1 ? Math.max(0, Math.min(1, (h1.getBoundingClientRect().top - bb + 12) / 14)) : 1;
  b.classList.toggle('titled', h1 ? hf < .05 : y > 70);
  /* the gray line ("230 days to go") hands over to the small line under the bar title in one quick step, so it never shows twice */
  const p = ph && $('p', ph), hasP = !!(p && p.textContent.trim());
  const pf = hasP ? Math.max(0, Math.min(1, (p.getBoundingClientRect().top - bb + 6) / 12)) : 1;
  const act = ph && $('.actions', ph), r = act && act.getBoundingClientRect();
  const af = r && r.height ? Math.max(0, Math.min(1, (r.top - bb + 6) / 12)) : 1;
  if (ph) { ph.style.setProperty('--h1-fade', hf.toFixed(2)); ph.style.setProperty('--p-fade', pf.toFixed(2)); ph.style.setProperty('--act-fade', af.toFixed(2)); }
  const sub = $('#barSub'); if (sub) sub.textContent = hasP ? p.textContent.trim() : '';
  b.classList.toggle('dated', hasP && pf < .05);
}
window.addEventListener('scroll', onScroll, { passive: true });
document.body.addEventListener('scroll', onScroll, { passive: true });
if (shellQ) { if (shellQ.addEventListener) shellQ.addEventListener('change', onScroll); else if (shellQ.addListener) shellQ.addListener(onScroll); }
function readRoute() { const h = (location.hash || '').replace('#', ''); route = VIEWS.some(v => v.k === h) || EXTRA.includes(h) ? h : 'home'; }

/* Phone: four tabs and a + in the middle. Guests holds the list and seating; Vendors holds the wallet and budget. */
const TABS = [
  { k: 'home', label: 'Home', icon: 'home', routes: ['home'] },
  { k: 'guests', label: 'Guests', icon: 'guests', routes: ['guests', 'seating'] },
  { k: 'vendors', label: 'Vendors', icon: 'vendors', routes: ['vendors', 'budget'] },
  { k: 'checklist', label: 'Plan', icon: 'checklist', routes: ['checklist', 'bigday', 'helpers'] }
];
const SEGS = { guests: [['guests', 'Guest list'], ['seating', 'Seating']], seating: [['guests', 'Guest list'], ['seating', 'Seating']], vendors: [['vendors', 'Vendors'], ['budget', 'Budget']], budget: [['vendors', 'Vendors'], ['budget', 'Budget']] };
['checklist', 'bigday', 'helpers'].forEach(k => { SEGS[k] = [['checklist', 'To-do'], ['bigday', 'Big day'], ['helpers', 'Helpers']]; });
const lastIn = { guests: 'guests', vendors: 'vendors', checklist: 'checklist' };
function tabHTML(t) {
  const on = t.routes.includes(route);
  const to = lastIn[t.k] || t.k;
  return '<a class="tab" href="#' + to + '"' + (on ? ' aria-current="page"' : '') + '>' + ic(t.icon) + '<span>' + t.label + '</span></a>';
}
function shell() {
  const app = $('#app');
  const counts = { guests: guestStats().invited, vendors: S.vendors.length, checklist: S.tasks.filter(t => !t.done).length };
  const nav = VIEWS.map(v => '<a class="navitem" href="#' + v.k + '"' + (route === v.k ? ' aria-current="page"' : '') + '>' + ic(v.icon) + '<span>' + v.label + '</span>' + (counts[v.k] ? '<span class="count num">' + counts[v.k] + '</span>' : '') + '</a>').join('');
  const isMenu = EXTRA.includes(route);
  if (!isMenu) menuFrom = route;
  const title = route === 'home' ? 'Our Wedding' : (VIEWS.find(v => v.k === route) || { label: EXTRA_TITLES[route] || 'Menu' }).label;
  app.innerHTML =
    '<div class="app">' +
      '<aside class="side" aria-label="Sections">' +
        '<a class="brand" href="#home"><span class="mono">' + RINGS + '</span><span><span class="brand-name">' + esc(coupleNames(false)) + '</span><br><span class="brand-sub">Wedding Command Center</span></span></a>' +
        '<button class="btn primary block side-add" type="button" data-act="add-menu">' + ic('plus') + 'Add anything</button>' +
        nav + '<div class="grow"></div>' +
        '<a class="navitem" href="#style"' + (route === 'style' ? ' aria-current="page"' : '') + '>' + ic('palette') + '<span>Look &amp; style</span></a>' +
        '<a class="navitem" href="#more"' + (route === 'more' ? ' aria-current="page"' : '') + '>' + ic('more') + '<span>Backup &amp; settings</span>' + (needsBackup() ? '<span class="count" style="color:var(--warn)">●</span>' : '') + '</a>' +
        '<a class="navitem" href="#help"' + (route === 'help' ? ' aria-current="page"' : '') + '>' + ic('help') + '<span>How to use</span></a>' +
        '<div class="side-card">' + ic('shield') + '<div><b>' + (storageOK ? 'Saved on this device' : 'Not saving in this browser') + '</b><br>' + esc(lastBackupText()) + '</div><button class="btn small" type="button" data-act="backup-now">' + ic('save', 'sm') + 'Back up now</button></div>' +
      '</aside>' +
      '<div class="maincol">' +
        '<header class="topbar" id="topbar"><div class="wrap"><div class="tb-left">' +
          (isMenu ? '<a class="glassbtn" href="#' + (route === 'more' ? menuFrom : 'more') + '" aria-label="' + (route === 'more' ? 'Back' : 'Back to Menu') + '">' + SYM.back + '</a>'
            : '<a class="brandmark" href="#home" aria-label="Wedding Command Center, go to Home"><span class="bm-ic">' + RINGS + '</span><span class="bm-tx">Wedding<br>Command Center</span></a>') +
          '</div><div class="bar-title" aria-hidden="true"><span class="bt-t">' + esc(tcaseText(title)) + '</span><small class="bt-s" id="barSub"></small></div>' +
          '<div class="tb-group" role="group" aria-label="Actions"><a class="gbtn mbtn' + (isMenu ? ' on' : '') + '" href="#' + (route === 'more' ? menuFrom : 'more') + '" aria-label="' + (route === 'more' ? 'Close Menu' : 'Menu: settings, backup and help') + '">' + SYM.dots + (needsBackup() && !isMenu ? '<i class="mdot"></i>' : '') + '</a>' +
          '<button type="button" class="gbtn add" data-act="add-menu" aria-label="Add something">' + SYM.plus + '</button></div></div></header>' +
        '<main id="main" tabindex="-1"></main>' +
      '</div>' +
      '<nav class="tabbar" aria-label="Sections"><div class="in">' + TABS.map(tabHTML).join('') + '</div></nav>' +
    '</div><div id="printroot"></div>';
}
function segHTML() {
  const seg = SEGS[route]; if (!seg) return '';
  return '<div class="segc pageseg" role="tablist" aria-label="Switch view">' + seg.map(([k, l]) => '<a role="tab" href="#' + k + '" aria-selected="' + (route === k) + '"' + (route === k ? ' class="on" aria-current="page"' : '') + '>' + l + '</a>').join('') + '</div>';
}
/* Swipe sideways on a page with a switcher to move to the page next to it, like the Calendar tab in the Credentials Tracker. */
let swipe0 = null, slideFrom = 0;
function swipeStart(e) {
  if (!SEGS[route] || $('.scrim') || e.touches.length !== 1) { swipe0 = null; return; }
  if (e.target.closest('input,textarea,select,.actions,.wstrip,.wscroll,.chips,.ask-ex,.chiprow,.tray,[data-drag],.rscroll,.mathgrid')) { swipe0 = null; return; }
  const t = e.touches[0]; swipe0 = { x: t.clientX, y: t.clientY, at: Date.now() };
}
function swipeEnd(e) {
  if (!swipe0) return; const s0 = swipe0; swipe0 = null;
  const t = e.changedTouches[0], dx = t.clientX - s0.x, dy = t.clientY - s0.y;
  if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * .6 || Date.now() - s0.at > 700) return;
  const seg = SEGS[route], i = seg.findIndex(x => x[0] === route), j = i + (dx < 0 ? 1 : -1);
  if (j < 0 || j >= seg.length) return;
  slideFrom = dx < 0 ? 1 : -1; go(seg[j][0]);
}
document.addEventListener('touchstart', swipeStart, { passive: true });
document.addEventListener('touchend', swipeEnd, { passive: true });
/* Section titles sit above their card, like Settings on iPhone: move each card's own heading out in front of it. */
function liftHeads(main) {
  $$('.card > .card-head:first-child', main).forEach(h => {
    const card = h.parentElement; if (card.closest('.sheet') || card.classList.contains('nolift')) return;
    const g = document.createElement('div'); g.className = 'group';
    card.parentNode.insertBefore(g, card); h.classList.add('group-h'); g.appendChild(h); g.appendChild(card);
    if (!card.children.length) card.remove();
  });
}
function render() {
  if (!S) { renderWelcome(); return; }
  const y = getY();
  const keepScroll = render.last === route;
  shell();
  const main = $('#main');
  if (route === 'guests' || route === 'seating') lastIn.guests = route;
  if (route === 'vendors' || route === 'budget') lastIn.vendors = route;
  if (['checklist', 'bigday', 'helpers'].includes(route)) lastIn.checklist = route;
  let html = segHTML();
  if (S.sample && (route === 'home' || route === 'more')) html += '<div class="sample-bar"><span><b>Sample wedding.</b>Nothing here is real.</span><button type="button" data-act="start-own">Start my own</button></div>';
  if (S.sample) {} else if (!storageOK) html += nudgeBox('warn', 'alert', 'This browser isn’t saving your plan', 'Private browsing can cause this. Back up before you close the page.', 'Back up', 'backup');
  else if (needsBackup() && route !== 'more') html += nudgeBox('info', 'save', 'Time for a backup', esc(lastBackupText()) + '. One tap saves a copy, photos and files included.', 'Back up now', 'backup-now', 'snooze-backup');
  if (route === 'home' && showHomeNudge() && !needsBackup()) html += nudgeBox('info', 'addhome', isTouch() ? 'Put it on your Home Screen' : 'Bookmark it', isTouch() ? 'It opens full screen like an app.' : 'Keep your plan one click away.', 'Show me how', 'home-how', 'home-later');
  let page = '', failed = null;
  try { page = (R[route] || R.home)(); } catch (e) { failed = e; }
  if (failed) page = pageError(failed);
  html += page;
  main.innerHTML = html;
  if (slideFrom) { main.classList.remove('slide-l', 'slide-r'); void main.offsetWidth; main.classList.add(slideFrom > 0 ? 'slide-l' : 'slide-r'); slideFrom = 0; }
  if (!failed && R[route + 'After']) { try { R[route + 'After'](main); } catch (e) { reportSnag(e); } }
  try { liftHeads(main); } catch (e) {}
  /* the big title comes first; the page switcher and any reminders sit under it */
  try { const ph = $('.phead', main); if (ph && ph.parentNode === main) { let at = ph; [...main.children].filter(c => c !== ph && (c.compareDocumentPosition(ph) & Node.DOCUMENT_POSITION_FOLLOWING)).forEach(c => { at.after(c); at = c; }); } } catch (e) {}
  try { tcase(main); } catch (e) {}
  document.title = (route === 'home' ? '' : ((VIEWS.find(v => v.k === route) || {}).label || EXTRA_TITLES[route] || 'Menu') + ' · ') + 'Wedding Command Center';
  if (keepScroll) scrollToY(y);
  render.last = route;
  onScroll();
  lock();
  startTick();
}


/* If a page can't be drawn, say so in plain words instead of leaving it blank. */
function pageError(e) {
  try { console.error(e); } catch (x) {}
  return '<section class="card snag"><h2>This page didn’t open</h2><p>Your plan is still saved on this phone. Try Home, then come back. If it keeps happening, take a screenshot of this box and send it to us.</p>' +
    '<div class="actions"><a class="btn primary" href="#home">Go to Home</a><button class="btn" type="button" data-act="backup-now">Back up now</button></div>' +
    '<p class="snagwhy">' + esc(route + ': ' + ((e && e.message) || String(e)).slice(0, 160)) + '</p></section>';
}
let snagShown = 0;
function reportSnag(e) {
  try { console.error(e); } catch (x) {}
  if (Date.now() - snagShown < 4000) return; snagShown = Date.now();
  $$('.scrim').forEach(s => { if (!$('.sheet,.dialog', s)) s.remove(); }); lock();
  try { toast('Something didn’t work there. Your plan is still saved on this phone. (' + String((e && e.message) || e).slice(0, 80) + ')'); } catch (x) {}
}

/* A small card for one thing to do, with a close button, like the backup reminder in the Credentials Tracker. */
function nudgeBox(tone, icon, title, text, btn, act, later) {
  return '<div class="backup-nudge"><span class="liic t-' + tone + '">' + ic(icon) + '</span><p><b>' + esc(title) + '</b>' + text + '<br><button class="lnk" type="button" data-act="' + act + '">' + esc(btn) + '</button></p>' + (later ? '<button class="x" type="button" data-act="' + later + '" aria-label="Not now">' + ic('x', 'sm') + '</button>' : '<span></span>') + '</div>';
}

/* ---------- Apple look helpers ---------- */
const SYM = {
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" style="fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round"/></svg>',
  dots: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5.5" cy="12" r="1.9" style="fill:currentColor"/><circle cx="12" cy="12" r="1.9" style="fill:currentColor"/><circle cx="18.5" cy="12" r="1.9" style="fill:currentColor"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5v15M4.5 12h15" style="fill:none;stroke:currentColor;stroke-width:2.3;stroke-linecap:round"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" style="fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round"/></svg>',
  ok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" style="fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round"/></svg>'
};
/* Title Case for headings, buttons and form labels, the way iOS writes them. Words that already have a capital are left alone. */
const SMALLW = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'or', 'per', 'the', 'to', 'vs', 'via', 'with']);
function tcaseText(t, cont) {
  let first = !cont;
  return String(t).replace(/[A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F’'\-]*/g, (w, i, all) => {
    const prev = all.slice(0, i).trimEnd(), start = first || /[:·—]$/.test(prev); first = false;
    if (/[A-Z]/.test(w)) return w;
    if (!start && SMALLW.has(w)) return w;
    return w[0].toUpperCase() + w.slice(1);
  });
}
function tcaseEl(el, maxWords) {
  if (!el || el.dataset.tc) return; el.dataset.tc = '1';
  const t = (el.textContent || '').trim();
  if (!t || /[?]/.test(t) || (maxWords && t.split(/\s+/).length > maxWords)) return;
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n, seen = false;
  while ((n = tw.nextNode())) { if (!n.nodeValue.trim()) continue; n.nodeValue = tcaseText(n.nodeValue, seen); seen = true; }
}
function tcase(root) {
  $$('.phead h1,.group-h h2,.card-head h2,.sect-title,.segc a,.segc button', root).forEach(el => tcaseEl(el, 7));
  $$('.btn,.linkbtn,.lnk,.chipbtn', root).forEach(el => tcaseEl(el, 5));
  $$('.sheet h3,.fgroup .field>label,.fgroup .flabel,.sheet-body>.field>label,.sheet-body>.field>.flabel', root).forEach(el => tcaseEl(el, 5));
}
