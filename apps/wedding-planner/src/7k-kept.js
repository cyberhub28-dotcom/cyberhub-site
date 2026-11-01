/* ================= A saved plan the app couldn't open. It's kept aside (see keepAside), never overwritten, and can be saved as a file. ================= */
function saveKept(k) {
  let raw = null; try { raw = localStorage.getItem(k); } catch (e) {}
  if (!raw) { toast('That copy is no longer on this phone'); return; }
  saveFile('wedding-plan-kept-' + isoDay(new Date()) + '.json', raw, 'application/json', true).then(r => { if (r === 'saved') toast('Kept copy saved'); else if (r === 'failed') toast('This browser blocked the file.'); });
}
function keptNotice() {
  const k = keptNow;
  openSheet({
    title: 'We couldn’t open your saved plan', noFocus: true,
    body: '<p class="muted" style="margin:0">It’s kept safe on this phone, and nothing will save over it. You’re looking at the sample wedding for now.</p>' +
      '<p class="muted" style="margin:0">Save the kept copy as a file and keep it with your backups. If you have a recent backup, you can restore it from Menu.</p>' +
      '<button class="btn primary block" type="button" data-b="kept">' + ic('save') + 'Save the kept copy</button>' +
      '<p class="hint" style="margin:0">You can do this later too: Menu, then Your data.</p>',
    onMount: (sc, close) => { $('[data-b="kept"]', sc).onclick = () => { close(); saveKept(k); }; }
  });
}
Object.assign(EXTRA_ACTS, { 'save-kept': () => { const all = keptCopies(); if (all.length) saveKept(all[all.length - 1]); } });
