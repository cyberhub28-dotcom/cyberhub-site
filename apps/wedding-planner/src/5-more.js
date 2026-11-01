/* ---------- Backup & settings ---------- */
R.more = function () {
  const c = S.couple, sa = isStandalone(), ios = isIOS(), and = isAndroid(), st = styleNow();
  const li = (act, tone, icon, t, sub, extra) => '<button type="button" class="li" data-act="' + act + '"' + (extra || '') + '><span class="liic t-' + tone + '">' + ic(icon) + '</span><span class="tx"><b>' + t + '</b><small>' + sub + '</small></span>' + ic('chev', 'sm') + '</button>';
  const iosSteps = '<ol class="steps"><li>In Safari, tap <b>Share</b> (the square with an arrow).</li><li>Scroll and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>. Then open it from the new icon.</li></ol>';
  const andSteps = '<ol class="steps"><li>In Chrome, tap the <b>three dots</b> at the top right.</li><li>Tap <b>Add to Home screen</b> or <b>Install app</b>.</li><li>Tap <b>Install</b>. Then open it from the new icon.</li></ol>';
  const w = c.date ? fmtDate(parseDay(c.date), { month: 'long', day: 'numeric', year: 'numeric' }) : 'No date yet';
  return '<div class="phead"><div><h1>Menu</h1></div></div>' +
    '<div class="cols"><div class="col">' +
    '<div class="group"><div class="list">' +
      li('edit-couple', 'accent', 'heart', esc(coupleNames(false)), esc([w, c.venue].filter(Boolean).join(' · '))) +
      '<a class="li" href="#style"><span class="liic t-solid">' + ic('brush') + '</span><span class="tx"><b>Make it yours</b><small>' + esc(st.vibe.name + (st.custom ? ', your way' : '')) + ' · ' + (S.settings.mode === 'auto' ? 'matches your phone' : S.settings.mode) + '</small></span>' + ic('chev', 'sm') + '</a>' +
      '<a class="li" href="#help"><span class="liic t-info">' + ic('help') + '</span><span class="tx"><b>How to use</b><small>Quick add, the wallet, backups and more</small></span>' + ic('chev', 'sm') + '</a>' +
      '<label class="li" for="set-cur"><span class="liic t-good">' + ic('cash') + '</span><span class="tx"><b>Currency</b><small>For every price and payment</small></span><select class="lisel" id="set-cur">' + CURRENCIES.map(x => '<option' + (x === S.settings.currency ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></label>' +
    '</div></div>' +
    '<div class="group"><div class="group-h"><h2>Share and print</h2></div><div class="list">' +
      li('pdf-guests', 'accent', 'guests', 'Guest list (PDF)', 'Names, RSVPs, meals, plus-ones and tables') +
      li('pdf-seating', 'info', 'seating', 'Seating chart (PDF)', 'Every table, plus a find-your-seat list') +
      li('pdf-vendors', 'warn', 'vendors', 'Vendor contacts (PDF)', 'Phone, email and what’s still owed') +
      li('envelopes', 'pink', 'mail', 'Envelopes and address labels', 'One per household, ready to print') +
      li('ics', 'info', 'calendar', 'Add dates to Calendar', 'Payments, RSVP date and the big day, with alerts') +
      li('doc-bundle', 'pink', 'clip', 'Files in one PDF', 'Pick contracts, receipts or photos') +
      li('export-csv', 'good', 'save', 'Guest list for Excel or Sheets', 'A CSV file') +
    '</div></div>' +
    '<div class="group"><div class="group-h"><h2>Meal options</h2></div><div class="list">' +
      S.settings.meals.map((m, i) => '<div class="li"><span class="tx"><b>' + esc(m) + '</b></span><button class="lx" type="button" data-act="del-meal" data-i="' + i + '" aria-label="Remove ' + esc(m) + '">' + ic('x', 'sm') + '</button></div>').join('') +
      '<form id="meal-form" class="li addin"><span class="liic t-plain">' + ic('plus') + '</span><input id="meal-new" placeholder="Add a meal option" aria-label="New meal option" autocomplete="off"><button class="lnk" type="submit">Add</button></form>' +
    '</div></div>' +
    '</div><div class="col">' +
    '<div class="group"><div class="group-h"><h2>Backup</h2></div><div class="list">' +
      '<div class="li"><span class="liic t-' + (S.meta.lastBackup && !needsBackup() ? 'good' : 'warn') + '">' + ic('upload') + '</span><span class="tx"><b>' + (S.meta.lastBackup ? esc(lastBackupText()) : 'No backup yet') + '</b><small>Everything in one file, photos and files included</small></span></div>' +
      '<div class="btnrow"><button class="btn primary" type="button" data-act="backup-now">Back up now</button><button class="btn ghost" type="button" data-act="restore">Restore a backup</button></div>' +
      '<button type="button" class="li sublink" data-act="backup"><span class="tx"><small>File won’t save? Copy it as text instead</small></span>' + ic('chev', 'sm') + '</button>' +
    '</div>' +
    '<details class="card keep"><summary><span><b>Your data lives only on this phone</b><span class="kp">Back up often and keep the file private. CyberHub can’t see or restore it.</span></span>' + ic('chev', 'sm') + '</summary>' +
      '<div class="kh">What erases it</div><ul><li>Deleting the app from your Home Screen</li><li>A new or reset phone, until you restore a backup</li><li>In a browser tab: clearing website data, or Safari clearing it after about 7 days unused</li><li>On Android: clearing Chrome’s data for this site, even if it’s on your Home Screen</li></ul>' +
      '<div class="kh">What keeps it safe</div><ul><li>Use it from your Home Screen. On iPhone, clearing Safari history doesn’t touch it there.</li><li>Back up after big changes, and save the file in Files, iCloud Drive or Google Drive. If it’s been a week, Home shows a reminder when you open the app.</li><li>Moving from a browser tab to the Home Screen? Back up in one, restore in the other.</li></ul>' +
      '<p class="muted" style="margin:12px 0 0">The backup file isn’t locked with a password. Keep it somewhere private. <span id="storeLine"></span></p>' +
    '</details></div>' +
    '<div class="group"><div class="group-h"><h2>Put it on your Home Screen</h2></div><div class="list">' +
      '<div class="li"><span class="liic t-accent">' + ic('addhome') + '</span><span class="tx"><b>' + (sa ? 'You’re all set' : 'Open it like an app') + '</b><small>' + (sa ? 'You’re using it from your Home Screen.' : 'It gets its own icon, opens full screen, and your plan stays on this phone.') + '</small></span></div>' +
      (sa ? '' : (and ? '' : (ios ? '' : '<div class="kh2">iPhone</div>') + iosSteps) + (ios ? '' : (and ? '' : '<div class="kh2">Android</div>') + andSteps)) +
    '</div></div>' +
    '<div class="group"><div class="group-h"><h2>Your data</h2></div><div class="list">' +
      (keptCopies().length || holdSave ? li('save-kept', 'warn', 'save', 'Save the plan we couldn’t open', holdSave ? 'Saving is paused until you do.' : 'It’s kept on this phone. Save it as a file.') : '') +
      (S.sample ? li('start-own', 'good', 'sparkle', 'Start my own plan', 'Clears the sample and sets you up') : '') +
      li('load-sample', 'warn', 'heart', 'See the sample wedding', S.sample ? 'You’re looking at it now' : 'A made-up wedding. Replaces what’s here.') +
      '<button type="button" class="li" data-act="reset"><span class="liic t-danger">' + ic('trash') + '</span><span class="tx"><b class="danger">' + (S.sample ? 'Clear the sample' : 'Delete all data') + '</b><small>Erases everything on this device</small></span></button>' +
    '</div></div>' +
    '</div></div>' +
    aboutHTML();
};
/* The bottom of the Menu, same as the Credentials Tracker: the CyberHub mark, the app name, the disclaimer and the privacy line. */
const CYBERHUB_MARK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1l6 3.5v7L8 15l-6-3.5v-7z" style="fill:none;stroke:currentColor;stroke-width:1.6"/><path d="M8 5l3 1.75v3.5L8 12 5 10.25v-3.5z" style="fill:currentColor"/></svg>';
function aboutHTML() {
  return '<div class="about"><div class="mark">' + CYBERHUB_MARK + 'CyberHub Software</div><div><b>Wedding Command Center</b></div>' +
    '<p>This app keeps track of the plans, guests and money you enter. It doesn’t give legal, tax or contract advice, and it doesn’t book or pay vendors for you. Check every contract, date and payment with your vendor.</p>' +
    '<p>No account, no ads, no tracking. Your plan stays on this phone unless you save or share it.</p>' +
    '<button type="button" class="linkbtn" data-act="credits">Credits and licenses</button></div>';
}
R.moreAfter = function (main) {
  storageLine().then(t => { const el = $('#storeLine', main); if (el) el.textContent = t; });
  $('#set-cur', main).addEventListener('change', e => { S.settings.currency = e.target.value; moneyFmt = null; commit({ quiet: true }); });
  $('#meal-form', main).addEventListener('submit', e => { e.preventDefault(); const v = $('#meal-new', main).value.trim(); if (!v || S.settings.meals.includes(v)) return; S.settings.meals.push(v.slice(0, 40)); commit(); });
};
R.help = function () {
  const sec = (title, inner) => '<section class="card help">' + '<h2>' + title + '</h2>' + inner + '</section>';
  return '<div class="phead"><div><div class="eyebrow">Getting started</div><h1>How to use</h1></div></div>' +
    '<div class="cols">' +
    sec('Start here', '<ol class="steps"><li><div><b>Add your details.</b> Tap the pencil on the Home countdown to add your names, date, venue and a photo.</div></li><li><div><b>Tap + and just say it.</b> Type or dictate “Add Grace and Mark Bennett, family” or “Florist Magnolia, $2,900, $500 deposit due May 1”. You check it, then it’s added.</div></li><li><div><b>Build your guest list.</b> Add guests one by one, or paste a whole list at once.</div></li><li><div><b>Plan your money.</b> Set a total budget and let the app split it into categories.</div></li><li><div><b>Save a backup.</b> Do it now, then after every big change.</div></li></ol>') +
    sec('Guests and RSVPs', '<ul><li>Tap a guest to open their card. Change their RSVP in one tap, pick their seat, or call, text or email them.</li><li>Tap <b>Edit guest</b> on the card for their meal, plus-one, allergies and notes.</li><li>The colored RSVP tag on each row also switches between Waiting, Coming and Declined.</li><li>Search by name, show only who’s coming or still waiting, and sort by group, last name or table.</li><li>The meal count and the allergy list update on their own, ready for your caterer.</li></ul>') +
    sec('Invitations and addresses', '<ul><li>Add a mailing address on a guest’s card. Tap <b>Household</b> to put a family on one invitation with one address.</li><li>Under <b>Invitations</b> on Guests, tap <b>Envelopes and labels</b>. You’ll see who still needs an address, and can switch to thank-you notes.</li><li>Print address labels that fit 30-per-sheet labels like Avery 5160. Print a test page on plain paper first.</li><li>Need addresses? <b>Ask for addresses</b> writes a friendly text for you.</li></ul>') +
    sec('Calendar alerts', '<ul><li>In the Menu, tap <b>Add dates to Calendar</b>, or the same button under Coming up on Home.</li><li>It adds your payments, RSVP date, to-do deadlines and the big day to your phone’s Calendar, each with an alert a week before.</li><li>Dates change? Delete the old ones from Calendar, then add them again.</li></ul>') +
    sec('Seating chart', '<ul><li>Tap a name under <b>Need a seat</b> and pick a table. Or press, hold and drag it onto a table. On a computer, drag with your mouse.</li><li>Tap a table to see it drawn big, with everyone seated there. Tap <b>Add guests</b> to tick who sits there, all at once.</li><li>From the same screen you can move someone, take them off, or tap <b>Edit table</b> to rename it, change its shape or seats, or delete it.</li><li><b>Seat everyone</b> fills your tables by group for you. Dashed names haven’t answered yet.</li></ul>') +
    sec('Vendors and budget', '<ul><li>Vendors are a stack of cards, like Apple Wallet. Tap one to bring it to the top with its contact, payments and files.</li><li>Cards that say <b>To book</b> are vendors you still need. Tap one and add who you booked.</li><li>Each budget category shows what you’ve spent against what you planned, and turns red if you go over.</li><li>Upcoming payments show on Home so nothing sneaks up on you.</li></ul>') +
    sec('Checklist', '<ul><li>Tasks are grouped by how far before the wedding to do them. Due dates come from your wedding date.</li><li>Add your own tasks to any month, or tap a task to change or delete it.</li></ul>') +
    sec('Your plan and your privacy', '<ul><li>No account. No sign-in. Your plan is saved in this browser and stays on this phone. The app only goes online to check your unlock key, get app updates, and load its PDF tools if they’re missing.</li><li>That also means it isn’t backed up for you. Tap <b>Back up now</b> after big changes, and keep the file in Files, iCloud Drive or Google Drive. If it’s been a week, Home shows a reminder when you open the app.</li><li>The backup file includes your files and photos. It isn’t locked with a password, so keep it private.</li><li>To use your plan on another device, open the app there and choose <b>Restore from a backup</b>.</li><li>Clearing your browser’s history or website data can erase your plan. A backup keeps it safe.</li></ul>') +
    sec('Put it on your Home Screen', '<ul><li><b>iPhone or iPad:</b> open it in Safari, tap the Share button, then <b>Add to Home Screen</b>. It opens like an app, full screen. Do this before you start, because iPhone keeps the Home Screen app’s plan separate from Safari. Already started in Safari? Back up there, then restore in the Home Screen app.</li><li><b>Android:</b> open it in Chrome, tap the ⋮ menu, then <b>Add to Home screen</b> or <b>Install app</b>. On Android, clearing Chrome’s site data erases the plan even from the Home Screen, so keep backups.</li><li><b>Computer:</b> bookmark it, or pin the tab.</li></ul><p class="small">In a Safari tab, iPhone can clear the plan after about 7 days without a visit. The Home Screen app isn’t affected by that or by clearing Safari history.</p>') +
    sec('Big day', '<ul><li>Under <b>Plan</b>, tap <b>Big day</b> for your day-of timeline, wedding party, music, photo list, gifts, day-of kit, guest info and vows.</li><li>Tap <b>Build it for me</b> on the timeline and get a full day from your ceremony time.</li><li>Share any list with your DJ, photographer or wedding party in one tap.</li></ul>') +
    sec('Smart helpers', '<ul><li>Under <b>Plan</b>, tap <b>Helpers</b>. The plan check-up shows what needs you and why.</li><li>Party math figures drinks, cake, chairs and invitations. Seat everyone fills your tables by group.</li><li>The message and thank-you writers give you a warm first draft. Nothing is sent until you send it.</li><li>They run on this device with simple rules, not an AI service, so your details stay private.</li></ul>') +
    sec('Look and style', '<ul><li>Tap the brush on the Home countdown, or <b>Make it yours</b> in the Menu.</li><li>Pick a wedding style, then change the main color, the countdown card, the detail color, the font and the decoration.</li><li>Tap <b>Back to</b> your style any time to undo your own changes.</li></ul>') +
    sec('Sharing and printing', '<ul><li>In the Menu, make a PDF of your guest list, seating chart or vendor contacts.</li><li>Send it from the share sheet, or choose <b>Print</b> there.</li><li>Need it in Excel or Google Sheets? Save the guest list as a CSV file in the Menu.</li></ul>') +
    sec('About', '<p>Wedding Command Center is made by CyberHub Software. Licensed for your household’s personal use. Please don’t resell or share the file.</p><p class="small">The Bodoni Moda typeface is by Owen Earl and used under the SIL Open Font License 1.1.</p>') +
    '</div>';
};
function editCouple() {
  const c = S.couple;
  openSheet({
    title: 'Wedding details',
    fields: [
      { row: [{ k: 'a', label: 'Partner 1', ph: 'First name' }, { k: 'b', label: 'Partner 2', ph: 'First name' }] },
      { row: [{ k: 'date', label: 'Wedding date', type: 'date' }, { k: 'time', label: 'Ceremony time', type: 'time' }] },
      { k: 'venue', label: 'Venue', ph: 'Optional' },
      { k: 'city', label: 'City', ph: 'Optional' },
      { k: 'rsvpBy', label: 'RSVPs due by', type: 'date', hint: 'Optional. Shows on Home so you know who to chase.' }
    ],
    values: c,
    body: '<div class="field"><span class="flabel">Photo for your countdown</span><div class="photo-prev"><img id="ph-img" alt="Your photo"' + (c.photo ? ' src="' + esc(c.photo) + '"' : ' hidden') + '><div class="actions"><label class="btn" for="ph-file" style="cursor:pointer">' + ic('upload') + (c.photo ? 'Change photo' : 'Choose photo') + '</label><button class="btn ghost" type="button" id="ph-del"' + (c.photo ? '' : ' hidden') + '>Remove</button></div></div><input id="ph-file" type="file" accept="image/*" class="vh"><div class="hint">An engagement photo looks beautiful here. It stays on this device.</div></div>',
    onMount: sc => {
      const img = $('#ph-img', sc), del = $('#ph-del', sc);
      sc._photo = c.photo;
      $('#ph-file', sc).addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (!f) return; shrinkPhoto(f).then(url => { sc._photo = url; img.src = url; img.hidden = false; del.hidden = false; }).catch(() => toast('That photo couldn\u2019t be opened. Try a JPG or PNG.')); });
      del.addEventListener('click', () => { sc._photo = ''; img.hidden = true; del.hidden = true; });
    },
    onSave: (v, sc) => { if (v.date && !parseDay(v.date)) v.date = ''; if (v.rsvpBy && !parseDay(v.rsvpBy)) v.rsvpBy = ''; if (!/^\d{2}:\d{2}$/.test(v.time)) v.time = '16:00'; v.photo = sc._photo || ''; Object.assign(S.couple, v); commit(); if (!storageOK && v.photo) { S.couple.photo = ''; persist(); toast('Photo too large for this browser\u2019s storage'); render(); } else toast('Details saved'); }
  });
}

/* Resize a chosen photo so it fits comfortably in browser storage. */
function shrinkPhoto(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const max = 1400, k = Math.min(1, max / Math.max(im.width, im.height));
      const cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
      let q = .82, out = cv.toDataURL('image/jpeg', q);
      while (out.length > 700000 && q > .4) { q -= .12; out = cv.toDataURL('image/jpeg', q); }
      PHOTO_RE.test(out) ? res(out) : rej();
    };
    im.onerror = () => { URL.revokeObjectURL(url); rej(); };
    im.src = url;
  });
}

/* ---------- Saving files ---------- */
/* As a web page the app shares (phones) or downloads. The Claude preview build adds its own saver
   (preview-only.js, only with build.py --preview); the app buyers get never has it. */
let hostDl = null, IS_PREVIEW = false;
function hostDownloads() { return hostDl || Promise.resolve(null); }
/*PREVIEW*/
async function saveFile(name, data, mime, allowShare) {
  const h = await hostDownloads();
  if (h) { try { await h.save({ filename: name, data }); return 'saved'; } catch (e) { return e && e.code === 'declined' ? 'declined' : 'failed'; } }
  let file = null; try { file = new File([data], name, { type: mime }); } catch (e) {}
  if (allowShare && file && isTouch() && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return 'saved'; }
    catch (e) { if (e && e.name === 'AbortError') return 'declined'; }
  }
  try {
    const url = URL.createObjectURL(file || new Blob([data], { type: mime }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return 'saved';
  } catch (e) { return 'failed'; }
}

/* ---------- Backup / restore ---------- */
/* One file with everything: the plan plus every file and photo in the vault. */
async function backupData() {
  const files = {};
  for (const d of S.docs || []) { const u = await IMG.get('doc:' + d.id); if (u) files['doc:' + d.id] = u; }
  return JSON.stringify({ app: 'wedding-command-center', v: 2, exported: new Date().toISOString(), plan: S, files });
}
function backupName() { const n = [S.couple.a, S.couple.b].filter(Boolean).join('-').replace(/[^a-z0-9-]+/gi, '').toLowerCase(); return 'wedding-plan' + (n ? '-' + n : '') + '-' + isoDay(new Date()) + '.json'; }
function markBackedUp() { S.meta.lastBackup = Date.now(); S.meta.changes = 0; persist(); render(); }
/* One tap: save the file straight away; fall back to the sheet (copy as text) if the browser blocks it. */
async function quickBackup() {
  const name = backupName(), r = await saveFile(name, await backupData(), 'application/json', true);
  if (r === 'saved') { markBackedUp(); toast('Backup saved: ' + name); }
  else if (r === 'failed') backupSheet();
}
function homeHowSheet() {
  const ios = ['<li>Open this page in <b>Safari</b>.</li>', '<li>Tap the <b>Share</b> button (the square with an arrow).</li>', '<li>Scroll down and tap <b>Add to Home Screen</b>, then <b>Add</b>.</li>'];
  const android = ['<li>Open this page in <b>Chrome</b>.</li>', '<li>Tap the <b>⋮</b> menu at the top right.</li>', '<li>Tap <b>Add to Home screen</b>, then <b>Add</b>.</li>'];
  const desk = ['<li>Press <b>' + (/Mac/.test(navigator.platform) ? '⌘' : 'Ctrl') + ' + D</b> to bookmark this page.</li>', '<li>Or pin the tab so it’s always open.</li>'];
  const mine = isIOS() ? ios : isAndroid() ? android : isTouch() ? ios : desk;
  const others = [['iPhone or iPad', ios], ['Android', android], ['Computer', desk]].filter(o => o[1] !== mine);
  openSheet({
    title: isTouch() || isIOS() ? 'Put it on your Home Screen' : 'Keep it one click away', noFocus: true,
    body: '<ol class="howlist">' + mine.join('') + '</ol>' +
      (isIOS() ? '<p class="hint" style="margin:0"><b>Already started in Safari?</b> Your iPhone keeps the Home Screen app’s plan separate from Safari. Tap <b>Back up now</b> below first, then open the app from your Home Screen and choose <b>Restore from a backup</b>.</p>' + (S && !S.sample ? '<button class="btn block" type="button" data-b="bk">' + ic('save') + 'Back up now</button>' : '') : '') +
      '<details><summary class="small muted" style="cursor:pointer;min-height:44px;display:flex;align-items:center">Other devices</summary>' + others.map(o => '<p class="small" style="margin:8px 0 4px"><b>' + o[0] + '</b></p><ol class="howlist small">' + o[1].join('') + '</ol>').join('') + '</details>',
    onMount: (sc, close) => { const bk = $('[data-b="bk"]', sc); if (bk) bk.onclick = () => { close(); quickBackup(); }; }
  });
}
function backupSheet() {
  openSheet({
    title: 'Save a backup', noFocus: true,
    body: '<p class="muted" style="margin:0">This saves a small file with your whole plan. Keep it somewhere safe, like iCloud Drive, Google Drive or an email to yourself.</p>' +
      '<button class="btn primary block" type="button" data-b="file">' + ic('save') + (isTouch() && navigator.canShare ? 'Save or share backup file' : 'Download backup file') + '</button>' +
      '<details><summary class="small muted" style="cursor:pointer;min-height:44px;display:flex;align-items:center">File won’t save? Copy it as text instead</summary><div class="stack" style="margin-top:8px"><textarea class="input" id="bk-text" readonly style="min-height:120px;font:12px/1.3 var(--f-mono)"></textarea><button class="btn block" type="button" data-b="copy">' + ic('copy') + 'Copy backup text</button><p class="hint" style="margin:0">Paste it into a note or email to yourself. To restore, use “Restore from a backup” and paste it in.</p></div></details>',
    onMount: (sc, close) => {
      backupData().then(t => { $('#bk-text', sc).value = t; });
      sc.addEventListener('click', async e => {
        const b = e.target.closest('[data-b]'); if (!b) return;
        if (b.dataset.b === 'copy') {
          const ta = $('#bk-text', sc);
          try { await navigator.clipboard.writeText(ta.value); toast('Backup copied'); markBackedUp(); close(); }
          catch (err) { ta.focus(); ta.select(); toast('Selected. Use Copy from your keyboard or menu.'); }
          return;
        }
        const name = backupName(), r = await saveFile(name, await backupData(), 'application/json', true);
        if (r === 'saved') { markBackedUp(); close(); toast('Backup saved: ' + name); }
        else if (r === 'failed') toast('This browser blocked the file. Copy it as text instead.');
      });
    }
  });
}
let restoredFiles = {};
/* A saved file must be plain base64 data of the kind the plan says it is. Pictures can't be SVG. */
function fileOK(u, d) {
  if (typeof u !== 'string' || u.length > 60e6) return false;
  const m = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]*)$/i.exec(u);
  if (!m) return false;
  const t = m[1].toLowerCase();
  if (t.includes('svg')) return false;
  if (docKind(d) === 'image') return /^image\/(jpeg|png|webp|gif|heic|heif)$/.test(t);
  if (docKind(d) === 'pdf') return t === 'application/pdf';
  return t === String(d.type).toLowerCase() || t === 'application/octet-stream';
}
function parseBackup(text) {
  let o; try { o = JSON.parse(text); } catch (e) { return null; }
  if (!o || typeof o !== 'object') return null;
  const p = o.plan && typeof o.plan === 'object' ? o.plan : o;
  const app = o.app || p.app;
  if (app && app !== 'wedding-command-center') return 'other';
  if (!p.couple || typeof p.couple !== 'object' || !Array.isArray(p.guests)) return null;
  restoredFiles = o.files && typeof o.files === 'object' && !Array.isArray(o.files) ? o.files : {};
  try { return normalize(p); } catch (e) { return null; }
}
/* Writes the backup's files only. Old files are removed later, after the restored plan has really saved,
   so a failed write never leaves either plan pointing at files that were already deleted. */
async function putRestoredFiles(plan) {
  const ok = [], keep = new Set(); let failed = 0;
  for (const d of plan.docs) {
    const u = restoredFiles['doc:' + d.id];
    if (!fileOK(u, d)) continue;
    if (await IMG.put('doc:' + d.id, u)) { ok.push(d); keep.add('doc:' + d.id); } else failed++;
  }
  plan.docs = ok;
  restoredFiles = {};
  return { failed, keep };
}
async function applyRestore(p) {
  const before = new Set(await IMG.keys());
  const { failed, keep } = await putRestoredFiles(p);
  const old = S;
  S = p; S.sample = false; S.meta.lastBackup = Date.now(); S.meta.changes = 0;
  if (!persist(true)) {
    /* The restored plan didn't save. Put the earlier plan back and remove only the files written just now. */
    S = old;
    for (const k of keep) if (!before.has(k)) await IMG.del(k);
    return { saved: false, failed };
  }
  for (const k of await IMG.keys()) if (!keep.has(k)) await IMG.del(k);
  for (const k of Object.keys(THUMB)) delete THUMB[k];
  return { saved: true, failed };
}
function restoreSheet(fromWelcome) {
  openSheet({
    title: 'Restore from a backup', noFocus: true,
    body: '<p class="muted" style="margin:0">Choose the backup file you saved. This replaces the plan on this device.</p>' +
      '<label class="btn primary block" for="rs-file" style="cursor:pointer">' + ic('upload') + 'Choose backup file</label><input id="rs-file" type="file" accept=".json,application/json,text/plain" class="vh">' +
      '<details><summary class="small muted" style="cursor:pointer;min-height:44px;display:flex;align-items:center">Saved it as text? Paste it here</summary><div class="stack" style="margin-top:8px"><textarea class="input" id="rs-text" placeholder="Paste your backup text" style="min-height:120px;font:12px/1.3 var(--f-mono)"></textarea><button class="btn block" type="button" data-b="paste">Restore from text</button></div></details>' +
      '<p class="hint" id="rs-msg" role="alert" style="margin:0;color:var(--bad)"></p>',
    onMount: (sc, close) => {
      const msg = $('#rs-msg', sc);
      const apply = async text => {
        const p = parseBackup(text);
        if (p === 'other') { msg.textContent = 'That backup is from a different app. Pick a Wedding Command Center backup.'; return; }
        if (!p) { msg.textContent = 'That doesn’t look like a Wedding Command Center backup. Check that you picked the right file.'; return; }
        if (S && !S.sample && !fromWelcome) { const ok = await askConfirm('Replace your current plan?', 'Your plan on this device will be replaced with the backup from ' + (p.couple.a || p.couple.b ? [p.couple.a, p.couple.b].filter(Boolean).join(' & ') : 'this file') + '.', 'Replace', true); if (!ok) return; }
        if (holdSave) { close(); keptNotice(); return; }
        const { saved, failed } = await applyRestore(p);
        if (!saved) { const m = 'We couldn’t save the restored plan on this phone. Your earlier plan is unchanged.'; msg.textContent = m; toast(m); return; }
        applyTheme(); close(); go('home'); render(); toast(failed ? 'Plan restored, but ' + failed + ' file' + (failed === 1 ? '' : 's') + ' couldn’t be stored on this phone. It may be full.' : 'Plan restored');
      };
      $('#rs-file', sc).addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (!f) return; if (f.size > 400e6) { msg.textContent = 'That file is too big to be a backup.'; return; } const r = new FileReader(); r.onload = () => apply(String(r.result)); r.onerror = () => { msg.textContent = 'Couldn’t read that file.'; }; r.readAsText(f); });
      sc.addEventListener('click', e => { if (e.target.closest('[data-b="paste"]')) apply($('#rs-text', sc).value); });
    }
  });
}
function exportCSV() {
  /* A cell that starts with = + - @ could run as a spreadsheet formula, so it gets a leading ' to stay plain text. */
  const q = v => { let t = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; };
  const rows = [['Name','Guest of','Group','RSVP','Meal','Dietary needs','Plus-one','Plus-one name','Plus-one meal','Table','Phone or email','Mailing address','Household','Notes']];
  for (const g of S.guests) rows.push([g.name, sideLabel(g.side), g.group, { yes: 'Coming', no: 'Declined', pending: 'Waiting' }[g.rsvp], g.meal, g.diet, g.plus ? 'Yes' : 'No', g.plusName, g.plusMeal, (byId(S.tables, g.table) || {}).name || '', g.contact, addrLines(addrOf(g)).join(', '), hhById(g.hh) ? envName(hhMembers(g.hh), hhById(g.hh)) : '', g.notes]);
  const csv = '﻿' + rows.map(r => r.map(q).join(',')).join('\r\n');
  saveFile('guest-list-' + isoDay(new Date()) + '.csv', csv, 'text/csv', true).then(r => { if (r === 'saved') toast('Guest list saved'); else if (r === 'failed') toast('This browser blocked the download.'); });
}

