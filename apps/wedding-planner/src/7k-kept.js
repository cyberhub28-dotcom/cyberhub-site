/* ================= A saved plan the app couldn't open. It's kept aside (see keepAside), never overwritten, and can be saved as a file.
   If the phone was too full to keep a copy aside, the plan stays where it was and saving pauses (holdSave) until the couple
   saves it as a file or chooses to start fresh. ================= */
function releaseHold() { holdSave = false; heldWarned = false; persist(); render(); }
function saveKept(k) {
  let raw = null; try { raw = localStorage.getItem(k); } catch (e) {}
  if (!raw) { toast('That copy is no longer on this phone'); return; }
  saveFile('wedding-plan-kept-' + isoDay(new Date()) + '.json', raw, 'application/json', true).then(r => {
    if (r === 'saved') { if (holdSave && k === KEY) { releaseHold(); toast('Old plan saved as a file. Saving is back on.'); } else toast('Kept copy saved'); }
    else if (r === 'failed') toast('This browser blocked the file.');
  });
}
function startFreshFromHold() {
  askConfirm('Start fresh?', 'The plan we couldn’t open will be replaced on this phone. Save it as a file first if you might want it.', 'Start fresh', true)
    .then(ok => { if (ok) { releaseHold(); toast('Saving is back on'); } });
}
function keptNotice() {
  const held = holdSave, k = held ? KEY : keptNow || keptCopies().slice(-1)[0];
  openSheet({
    title: 'We couldn’t open your saved plan', noFocus: true,
    body: (held
      ? '<p class="muted" style="margin:0">This phone is too full to keep a spare copy, so it’s still saved where it was. Saving is paused so nothing replaces it. You’re looking at the sample wedding for now.</p>' +
        '<p class="muted" style="margin:0">Save it as a file and keep it with your backups. Saving turns back on after that.</p>'
      : '<p class="muted" style="margin:0">It’s kept safe on this phone, and nothing will save over it. You’re looking at the sample wedding for now.</p>' +
        '<p class="muted" style="margin:0">Save the kept copy as a file and keep it with your backups. If you have a recent backup, you can restore it from Menu.</p>') +
      '<button class="btn primary block" type="button" data-b="kept">' + ic('save') + (held ? 'Save my old plan as a file' : 'Save the kept copy') + '</button>' +
      (held ? '<button class="btn block" type="button" data-b="fresh">Start fresh instead</button>' : '') +
      '<p class="hint" style="margin:0">You can do this later too: Menu, then Your data.</p>',
    onMount: (sc, close) => {
      $('[data-b="kept"]', sc).onclick = () => { close(); if (k) saveKept(k); };
      const f = $('[data-b="fresh"]', sc); if (f) f.onclick = () => { close(); startFreshFromHold(); };
    }
  });
}
Object.assign(EXTRA_ACTS, { 'save-kept': () => { if (holdSave) { keptNotice(); return; } const all = keptCopies(); if (all.length) saveKept(all[all.length - 1]); } });
