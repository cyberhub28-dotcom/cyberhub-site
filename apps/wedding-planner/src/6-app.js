/* ================= Welcome + starter kit ================= */
const KIT_SIZES = [['s', 'Under 50', 40], ['m', '50 to 100', 80], ['l', '100 to 150', 125], ['xl', '150+', 180]];
const KIT_VENDORS = ['Venue', 'Caterer', 'Photographer', 'Videographer', 'Florist', 'DJ or band', 'Officiant', 'Hair & makeup', 'Cake & desserts', 'Planner', 'Rentals', 'Transportation', 'Stationery', 'Attire'];
const KIT_ON = ['Venue', 'Caterer', 'Photographer', 'Florist', 'DJ or band', 'Officiant', 'Hair & makeup', 'Cake & desserts', 'Attire'];
let kitDraft = null;
function renderWelcome(step) {
  clearInterval(tickTimer);
  const top = '<div class="welcome"><div class="grain"></div>' + sprigSVG('br') + sprigSVG('tl') + '<div class="wcard">' + '<span class="mono">' + RINGS + '</span>';
  if (step === 2 && kitDraft) {
    $('#app').innerHTML = top +
      '<h1 class="wh2">A few quick taps</h1><p>We’ll set up your budget, tables, checklist and vendor cards, so you’re not starting from a blank page.</p>' +
      '<form class="wform" id="k-form" novalidate>' +
        '<div class="field"><span class="flabel wl">About how many guests?</span><div class="kseg" id="k-size">' + KIT_SIZES.map(z => '<button type="button" data-z="' + z[0] + '" aria-pressed="' + (kitDraft.size === z[0]) + '">' + z[1] + '</button>').join('') + '</div></div>' +
        '<div class="field"><label for="k-budget" class="wl">Total budget <span style="opacity:.7">(optional)</span></label><input class="input num" id="k-budget" inputmode="decimal" autocomplete="off" placeholder="30,000" value="' + (kitDraft.budget || '') + '"></div>' +
        '<div class="field"><span class="flabel wl">Which vendors do you need?</span><div class="kchips" id="k-vend">' + KIT_VENDORS.map(k => '<button type="button" data-k="' + esc(k) + '" aria-pressed="' + kitDraft.vendors.includes(k) + '">' + ic('check', 'sm') + esc(k) + '</button>').join('') + '</div><span class="whint">Each one becomes a card. Tap it later to add who you booked.</span></div>' +
        '<div class="field"><span class="flabel wl">Pick a style</span><div class="kvibes" id="k-vibe">' + VIBES.map(v => '<button type="button" data-v="' + v.k + '" aria-pressed="' + (kitDraft.vibe === v.k) + '"><span style="background:linear-gradient(140deg,' + v.h2 + ',' + v.l + ')"><i style="background:' + v.g + '"></i></span>' + esc(v.name) + '</button>').join('') + '</div><span class="whint">Change colors, fonts and more any time.</span></div>' +
        '<button class="btn primary block" type="submit">Build my plan</button>' +
      '</form>' +
      '<div class="wlinks"><button type="button" id="k-skip">Skip, I’ll add things myself</button></div>' +
    '</div></div><div id="printroot"></div>';
    $('#k-size').onclick = e => { const b = e.target.closest('[data-z]'); if (!b) return; kitDraft.size = b.dataset.z; $$('#k-size button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); };
    $('#k-vend').onclick = e => { const b = e.target.closest('[data-k]'); if (!b) return; const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); kitDraft.vendors = $$('#k-vend [aria-pressed="true"]').map(x => x.dataset.k); };
    $('#k-vibe').onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; kitDraft.vibe = b.dataset.v; $$('#k-vibe button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); const v = VIBES.find(x => x.k === b.dataset.v), r = document.documentElement.style; r.setProperty('--hero-1', v.h1); r.setProperty('--hero-2', v.h2); r.setProperty('--hero-gold', v.g); r.setProperty('--accent-l', v.l); r.setProperty('--accent-d', v.d); };
    $('#k-form').addEventListener('submit', e => { e.preventDefault(); kitDraft.budget = num($('#k-budget').value); buildFromKit(true); });
    $('#k-skip').onclick = () => buildFromKit(false);
    return;
  }
  $('#app').innerHTML = top +
    '<h1>Wedding <em>Command</em> Center</h1>' +
    '<div class="divider">' + DIAMOND + '</div>' +
    '<p>Your guests, seating, budget, vendors and checklist, all in one beautiful place.</p>' +
    '<form class="wform" id="w-form" novalidate>' +
      '<div class="grid2"><div class="field"><label for="w-a">Your name</label><input class="input" id="w-a" autocomplete="off" autocapitalize="words" placeholder="First name"></div><div class="field"><label for="w-b">Your partner</label><input class="input" id="w-b" autocomplete="off" autocapitalize="words" placeholder="First name"></div></div>' +
      '<div class="field"><label for="w-d">Wedding date <span style="opacity:.7">(you can add it later)</span></label><input class="input" id="w-d" type="date"></div>' +
      '<button class="btn primary block" type="submit">Next</button>' +
    '</form>' +
    (isTouch() && !isStandalone() ? '<button type="button" class="wtip" id="w-home">' + ic('addhome', 'sm') + '<span><b>Tip:</b> put it on your Home Screen first, then start your plan there.</span></button>' : '') +
    '<div class="wlinks"><button type="button" id="w-sample">Explore a sample wedding first</button><button type="button" id="w-restore">Restore from a backup</button></div>' +
    '<p class="wfine">No account needed. Your plan stays on this phone.<br>Made by CyberHub Software</p>' +
  '</div></div><div id="printroot"></div>';
  $('#w-form').addEventListener('submit', e => {
    e.preventDefault();
    const d = $('#w-d').value;
    kitDraft = { a: $('#w-a').value.trim().slice(0, 60), b: $('#w-b').value.trim().slice(0, 60), date: parseDay(d) ? d : '', size: 'm', budget: 0, vendors: KIT_ON.slice(), vibe: 'classic' };
    renderWelcome(2); toTop();
  });
  $('#w-sample').onclick = () => { S = samplePlan(); persist(); applyTheme(); go('home'); };
  $('#w-restore').onclick = () => restoreSheet(true);
  if ($('#w-home')) $('#w-home').onclick = homeHowSheet;
}
function buildFromKit(useKit) {
  const k = kitDraft || { a: '', b: '', date: '' };
  S = blankPlan();
  S.couple.a = k.a; S.couple.b = k.b; S.couple.date = k.date;
  if (k.vibe) S.settings.style.vibe = k.vibe;
  if (k.date) { const r = parseDay(k.date); r.setDate(r.getDate() - 35); if (r > today0()) S.couple.rsvpBy = isoDay(r); }
  if (useKit) {
    const est = (KIT_SIZES.find(z => z[0] === k.size) || KIT_SIZES[1])[2];
    const n = clamp(Math.ceil(est / 8), 1, 30);
    for (let i = 0; i < n; i++) S.tables.push({ id: uid(), name: 'Table ' + (i + 1), shape: 'round', seats: 8 });
    if (k.budget > 0) { S.budget.total = k.budget; splitInto(k.budget); }
    k.vendors.forEach(kind => S.vendors.push({ id: uid(), kind, name: '', status: 'needed', contact: '', phone: '', email: '', web: '', cost: 0, deposit: 0, depositDue: '', depositPaid: false, balanceDue: '', balancePaid: false, notes: '' }));
  }
  /* Tick off what setup already covered. */
  const tick = t => { const x = S.tasks.find(q => q.t === t); if (x) x.done = true; };
  if (k.date) tick('Choose your wedding date');
  if (useKit && k.budget > 0) tick('Agree on your total budget');
  kitDraft = null;
  persist(); applyTheme(); go('home');
  toast(useKit ? 'Your plan is ready. Tap + to add guests.' : 'Your plan is ready');
}

/* ================= Actions ================= */
const A = {
  'go': el => go(el.dataset.to),
  'edit-couple': editCouple,
  'toggle-task': el => { const t = byId(S.tasks, el.dataset.id); if (!t) return; t.done = !t.done; commit(); if (t.done) toast('Nice. “' + (t.t.length > 34 ? t.t.slice(0, 32) + '…' : t.t) + '” done', () => { t.done = false; commit(); }); },
  'edit-task': el => editTask(el.dataset.id),
  'add-task': el => editTask(null, el.dataset.b),
  'tfilter': el => { tFilter = el.dataset.f; render(); },
  'add-guest': () => editGuest(null),
  'edit-guest': el => editGuest(el.dataset.id),
  'bulk-guests': bulkGuests,
  'gfilter': el => { gFilter = el.dataset.f; render(); },
  'cycle-rsvp': el => { const g = byId(S.guests, el.dataset.id); if (!g) return; g.rsvp = { pending: 'yes', yes: 'no', no: 'pending' }[g.rsvp]; if (g.rsvp === 'no') { g.table = null; g.plusTable = null; } commit(); toast(g.name + ': ' + { yes: 'Coming', no: 'Declined', pending: 'Waiting' }[g.rsvp]); },
  'add-table': () => editTable(null),
  'open-table': el => tableSheet(el.dataset.id),
  'quick-tables': () => { for (let i = 0; i < 10; i++) S.tables.push({ id: uid(), name: 'Table ' + (S.tables.length + 1), shape: 'round', seats: 8 }); commit(); toast('10 tables added'); },
  'seat-person': el => seatPerson(el.dataset.key),
  'print-guests': pdfGuests,
  'print-seating': pdfSeating,
  'pdf-guests': pdfGuests,
  'pdf-seating': pdfSeating,
  'pdf-vendors': pdfVendors,
  'doc-bundle': bundleSheet,
  'doc-add': el => addDoc(el.dataset.vendor || ''),
  'doc-open': el => { const d = byId(S.docs, el.dataset.id); if (d) docForm(d, null, false); },
  'add-menu': () => addMenu(),
  'vendor-add-menu': () => addMenu('vendors'),
  'wallet-open': el => openVendorCard(el.dataset.id),
  'wallet-done': () => { walletFocus = null; render(); },
  'pay-vendor': el => { const v = byId(S.vendors, el.dataset.id); if (v) payVendor(v, el.dataset.what); },
  'book-vendor': el => { const v = byId(S.vendors, el.dataset.id); if (!v) return; v.status = 'booked'; commit(); toast(vendorTitle(v) + ' booked'); },
  'load-sample': () => askConfirm('Look at the sample wedding?', S.sample ? 'It’s already loaded.' : 'Your plan on this device will be replaced by the sample. Back up first if you want to keep it.', S.sample ? 'Reload it' : 'Replace my plan', !S.sample).then(ok => { if (!ok) return; if (!S.sample) IMG.clear(); S = samplePlan(); walletFocus = null; persist(); applyTheme(); go('home'); }),
  'ask-ex': el => { const i = $('#askIn'); if (i) { i.value = el.dataset.q; runAsk(el.dataset.q, $('#askOut')); } },
  'export-csv': exportCSV,
  'add-item': el => editItem(null, el.dataset.cat),
  'edit-item': el => editItem(el.dataset.id),
  'add-cat': () => editCat(null),
  'edit-cat': el => editCat(el.dataset.id),
  'toggle-cat': el => { const id = el.dataset.id; openCats.has(id) ? openCats.delete(id) : openCats.add(id); render(); },
  'edit-total': editTotal,
  'split-budget': splitBudget,
  'add-vendor': () => editVendor(null),
  'open-vendor': el => openVendorCard(el.dataset.id),
  'edit-vendor': el => editVendor(el.dataset.id),
  'backup': backupSheet,
  'backup-now': quickBackup,
  'snooze-backup': () => { S.meta.snooze = Date.now() + 864e5; persist(); render(); toast('We’ll remind you tomorrow'); },
  'home-how': homeHowSheet,
  'home-later': () => { S.meta.homeHide = Date.now() + 14 * 864e5; persist(); render(); toast('Find the steps any time in How to use'); },
  'restore': () => restoreSheet(false),
  'palette': el => { S.settings.palette = el.dataset.k; applyTheme(); commit({ quiet: true }); },
  'mode': el => { S.settings.mode = el.dataset.k; applyTheme(); commit({ quiet: true }); },
  'del-meal': el => { S.settings.meals.splice(+el.dataset.i, 1); commit(); },
  'start-own': () => holdSave ? keptNotice() : askConfirm('Start your own plan?', 'The sample wedding will be cleared from this device.', 'Start fresh').then(ok => { if (!ok) return; IMG.clear(); for (const k of Object.keys(THUMB)) delete THUMB[k]; S = null; walletFocus = null; try { localStorage.removeItem(KEY); } catch (e) {} applyThemeDefault(); renderWelcome(); window.scrollTo(0, 0); }),
  'reset': () => holdSave ? keptNotice() : askConfirm(S.sample ? 'Clear the sample?' : 'Erase your whole plan?', S.sample ? 'You’ll start a fresh plan.' : 'Everything on this device will be deleted. This can’t be undone unless you have a backup.', S.sample ? 'Clear it' : 'Erase everything', true).then(ok => { if (!ok) return; if (!S.sample) IMG.clear(); S = null; walletFocus = null; try { localStorage.removeItem(KEY); } catch (e) {} applyThemeDefault(); location.hash = ''; renderWelcome(); window.scrollTo(0, 0); })
};
Object.assign(A, EXTRA_ACTS);
function applyThemeDefault() { const r = document.documentElement; r.removeAttribute('data-palette'); applyStyle(); if (themeSetByApp) { r.removeAttribute('data-theme'); themeSetByApp = false; } }
document.addEventListener('click', e => {
  if (suppressClick) { e.preventDefault(); e.stopPropagation(); return; }
  if (e.target.closest('[data-stop]')) return;
  if (e.target.closest('.scrim')) return;
  /* Move between pages ourselves, so a tap always opens the page even where the frame handles links its own way. */
  const link = e.target.closest('a[href^="#"]');
  if (link && S && !link.closest('[data-act]')) {
    const k = link.getAttribute('href').slice(1) || 'home';
    if (VIEWS.some(v => v.k === k) || EXTRA.includes(k)) { e.preventDefault(); go(k); return; }
  }
  const el = e.target.closest('[data-act]');
  if (!el || !S) return;
  const fn = A[el.dataset.act];
  if (fn) { e.preventDefault(); try { const r = fn(el); if (r && r.catch) r.catch(reportSnag); } catch (err) { reportSnag(err); } }
}, true);
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role="button"][data-act]') && !$('.scrim')) { e.preventDefault(); const fn = A[e.target.dataset.act]; if (fn) fn(e.target); }
});
window.addEventListener('hashchange', () => { if (skipHash && location.hash === skipHash) { skipHash = ''; return; } skipHash = ''; readRoute(); $$('.scrim').forEach(s => s.remove()); lock(); render(); toTop(); });
window.addEventListener('error', e => { if (S && e && e.error) reportSnag(e.error); });
window.addEventListener('unhandledrejection', e => { if (S && e) reportSnag(e.reason || 'unknown'); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && S && route === 'home') startTick(); });
window.addEventListener('storage', e => { if (e.key === KEY) { S = load(); applyTheme(); render(); } });
if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener && matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme());

/* ================= Boot ================= */
S = load();
/* First visit opens on the sample wedding so the app shows what it does; the banner offers to start your own. */
if (!S && storageOK) { S = samplePlan(); persist(true); }
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}
readRoute();
try { applyTheme(); render(); }
catch (e) {
  /* The saved plan loaded but couldn't be drawn. Keep it aside, open the sample, and tell the couple. */
  keepAside(); S = samplePlan(); persist(true); route = 'home';
  applyTheme(); render();
}
if (keptNow || holdSave) keptNotice();
/* Works offline from the Home Screen. Only on the real website, never inside a preview. */
try { if ('serviceWorker' in navigator && location.protocol === 'https:' && !IS_PREVIEW) navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
})();
