/* ================= Vendors as a Wallet: one stack of cards, tap one to bring it to the top ================= */
let walletFocus = null;
const clipSVG = '<svg class="clip" viewBox="0 0 24 24" aria-label="Has files">' + ICONS.clip + '</svg>';
function walletCard(v, mini) {
  const m = vendorMoney(v), hasDoc = (S.docs || []).some(d => d.vendorId === v.id);
  const act = mini ? 'wallet-open' : walletFocus === v.id ? 'wallet-done' : 'wallet-open';
  if (v.status === 'needed') return '<button type="button" class="vcard setup' + (mini ? ' mini' : '') + '" style="' + vendorStyle(v) + '" data-act="' + act + '" data-id="' + esc(v.id) + '" aria-label="' + esc(v.kind) + ', still to book">' +
    '<span class="vc1"><small>Not booked yet</small>' + (hasDoc ? clipSVG : '') + '<span class="wpill">To book</span></span>' +
    '<span class="vc2"><b>' + esc(v.kind) + '</b></span>' +
    '<span class="vc3"><span class="add">' + ic('plus', 'sm') + 'Add who you booked</span></span></button>';
  const who = v.contact || v.phone || v.email || (v.status === 'booked' ? 'Booked' : 'Considering');
  return '<button type="button" class="vcard' + (mini ? ' mini' : '') + '" style="' + vendorStyle(v) + '" data-act="' + act + '" data-id="' + esc(v.id) + '" aria-label="' + esc([vendorTitle(v), v.kind, v.status === 'considering' ? 'Considering' : m.tone === 'bad' ? 'Late' : m.tone === 'warn' ? 'Due soon' : 'Booked', m.amount ? m.label + ' ' + money(m.amount) + (m.due ? ', ' + shortDate(m.due) + ', ' + dueWords(m.due) : '') : ''].filter(Boolean).join(', ')) + '">' +
    '<span class="vc1"><small>' + esc(v.kind) + '</small>' + (hasDoc ? clipSVG : '') + '<span class="wpill ' + m.tone + '">' + (m.tone === 'good' || (v.status === 'booked' && !m.tone) ? ic('check', 'sm') : '') + esc(v.status === 'considering' ? 'Considering' : m.tone === 'bad' ? 'Late' : m.tone === 'warn' ? 'Due soon' : 'Booked') + '</span></span>' +
    '<span class="vc2"><b>' + esc(vendorTitle(v)) + '</b></span>' +
    '<span class="vc3"><span class="who">' + esc(who) + '</span>' +
      (m.amount ? '<span class="ex"><small>' + esc(m.label) + '</small><b class="num">' + money(m.amount) + '</b>' + (m.due && !mini ? '<small class="when">' + esc(shortDate(m.due)) + ' · ' + esc(dueWords(m.due)) + '</small>' : '') + '</span>' : '') +
    '</span></button>';
}
/* Back of the stack to front: still-to-book on top, then calm cards, the most urgent payment last so it shows in full. */
function walletOrder() {
  const rank = v => { if (v.status === 'needed') return [0, 0]; const m = vendorMoney(v); if (!m.due) return [m.tone === 'good' ? 1 : v.status === 'considering' ? 2 : 3, 0]; return [4, -m.due.getTime()]; };
  return S.vendors.slice().sort((a, b) => { const x = rank(a), y = rank(b); return x[0] - y[0] || x[1] - y[1] || VENDOR_KINDS.indexOf(a.kind) - VENDOR_KINDS.indexOf(b.kind); });
}
R.vendors = function () {
  const v = walletFocus && byId(S.vendors, walletFocus);
  if (!v) walletFocus = null;
  const booked = S.vendors.filter(x => x.status === 'booked').length, need = S.vendors.filter(x => x.status === 'needed').length;
  const pays = payments(), owed = sum(pays, p => p.amount), next = pays.find(p => p.due);
  const head = '<div class="phead wallet-head"><div><div class="eyebrow">Your wedding team</div><h1>Vendors</h1><p>' + (v ? esc(v.kind) : booked + ' booked' + (need ? ' · ' + need + ' to book' : '') + (S.vendors.length - booked - need ? ' · ' + (S.vendors.length - booked - need) + ' considering' : '')) + '</p></div>' +
    (v ? '<button class="hdrbtn txt" type="button" data-act="wallet-done">Done</button>' : '<button class="hdrbtn" type="button" data-act="vendor-add-menu" aria-label="Add a vendor">' + ic('plus') + '</button>') + '</div>';
  if (v) {
    const rest = walletOrder().filter(x => x !== v);
    return head + '<div class="wfocus">' + walletCard(v) + vendorActions(v) + '<div class="wdet card">' + vendorDetail(v) + '</div>' +
      (rest.length ? '<div class="wpile" aria-label="Your other vendors">' + rest.slice(-5).map(x => walletCard(x)).join('') + '</div>' : '') + '</div>';
  }
  const late = next && daysBetween(today0(), next.due) < 0;
  const where = '<div class="pstats">' +
    '<div><b class="num">' + booked + '<span class="of"> of ' + S.vendors.length + '</span></b><small>Booked</small></div>' +
    '<div><b class="num">' + money(owed) + '</b><small>Still to pay</small></div>' +
    '<div><b class="' + (late ? 'bad' : '') + '">' + (next ? esc(shortDate(next.due)) : '—') + '</b><small>' + (next ? 'Next payment' : 'No payments due') + '</small></div></div>';
  const stack = S.vendors.length ? '<div class="wallet">' + walletOrder().map(x => walletCard(x)).join('') + '</div>'
    : '<div class="card empty"><div class="big">Your wedding team, in one place</div>Tap + to add a vendor, or say it: “Photographer Golden Hour, $3,800, $1,000 deposit due May 1”.<br><button class="btn primary" type="button" data-act="vendor-add-menu">' + ic('plus') + 'Add a vendor</button></div>';
  return head + where + stack + '<section class="vault-wrap" id="vaultBox">' + vaultHTML() + '</section>';
};
R.vendorsAfter = function (main) { loadThumbs(main); };
function vendorActions(v) {
  const m = vendorMoney(v), b = [];
  if (v.status === 'needed') b.push('<button class="btn primary" type="button" data-act="edit-vendor" data-id="' + esc(v.id) + '">' + ic('plus') + 'Add who you booked</button>');
  else {
    b.push('<button class="btn primary" type="button" data-act="edit-vendor" data-id="' + esc(v.id) + '">' + ic('edit') + 'Edit</button>');
    if (v.deposit > 0 && !v.depositPaid) b.push('<button class="btn" type="button" data-act="pay-vendor" data-id="' + esc(v.id) + '" data-what="deposit">' + ic('check') + 'Deposit paid</button>');
    else if (v.status === 'booked' && vendorBalance(v) > 0 && !v.balancePaid) b.push('<button class="btn" type="button" data-act="pay-vendor" data-id="' + esc(v.id) + '" data-what="balance">' + ic('check') + 'Paid in full</button>');
    else if (v.status === 'considering') b.push('<button class="btn" type="button" data-act="book-vendor" data-id="' + esc(v.id) + '">' + ic('check') + 'We booked them</button>');
  }
  b.push('<button class="btn" type="button" data-act="doc-add" data-vendor="' + esc(v.id) + '">' + ic('clip') + 'Add a file</button>');
  return '<div class="wacts">' + b.join('') + '</div>';
}
function vendorDetail(v) {
  if (v.status === 'needed') return '<p class="muted" style="margin:0">You haven’t booked a ' + esc(v.kind.toLowerCase()) + ' yet. When you do, tap <b>Add who you booked</b> and fill in their contact, price and deposit. Or type it in the + box, like “' + esc(v.kind) + ' ' + (v.kind === 'Officiant' ? 'Rev. Ana Cruz, $450' : 'Sweet Layers, $650, $200 deposit due June 1') + '”.</p>' + vendorFiles(v);
  const phoneHref = v.phone.replace(/[^\d+]/g, ''), web = /^https?:\/\//i.test(v.web) ? v.web : (v.web ? 'https://' + v.web : '');
  const rows = [];
  if (v.contact) rows.push(['Contact', esc(v.contact)]);
  if (v.phone) rows.push(['Phone', '<a href="tel:' + esc(phoneHref) + '" class="num">' + esc(v.phone) + '</a>']);
  if (v.email) rows.push(['Email', '<a href="mailto:' + esc(v.email) + '">' + esc(v.email) + '</a>']);
  if (web) rows.push(['Website', '<a href="' + esc(web) + '" target="_blank" rel="noopener noreferrer">' + esc(v.web.replace(/^https?:\/\//i, '')) + '</a>']);
  const bal = vendorBalance(v);
  const payline = (label, amt, due, paid) => '<div class="payline' + (paid ? ' paid' : '') + '"><span class="pl-l"><b>' + label + '</b>' + (paid ? '<small>Paid</small>' : due ? '<small>Due ' + esc(fmtDate(due)) + ' · ' + esc(dueWords(due)) + '</small>' : amt ? '<small>No due date yet</small>' : '') + '</span><b class="num">' + money(amt) + '</b>' + (paid ? '<span class="pchk">' + ic('check', 'sm') + '</span>' : '') + '</div>';
  return (rows.length ? '<div class="kv">' + rows.map(r => '<div' + ((r[0] !== 'Contact' && r[0] !== 'Phone') || rows.filter(x => x[0] === 'Contact' || x[0] === 'Phone').length === 1 ? ' class="full"' : '') + '><small>' + r[0] + '</small><b>' + r[1] + '</b></div>').join('') + '</div>' : '<p class="muted" style="margin:0 0 6px">No contact details yet. Tap Edit to add them.</p>') +
    '<div class="sub-h">Money</div>' +
    '<div class="paylines">' + payline('Total', v.cost, null, false) + (v.deposit ? payline('Deposit', v.deposit, parseDay(v.depositDue), v.depositPaid) : '') + (bal && v.status === 'booked' ? payline('Final balance', bal, parseDay(v.balanceDue), v.balancePaid) : '') + '</div>' +
    (v.notes ? '<div class="sub-h">Notes</div><p class="notes">' + esc(v.notes) + '</p>' : '') + vendorFiles(v);
}
function vendorFiles(v) {
  const docs = (S.docs || []).filter(d => d.vendorId === v.id);
  if (!docs.length) return '';
  return '<div class="sub-h">Files</div><div class="vault small">' + docs.map(docTile).join('') + '</div>';
}
function openVendorCard(id) {
  walletFocus = id;
  if (route !== 'vendors') go('vendors'); else { render(); toTop(); }
}
function payVendor(v, what) {
  const snap = snapshot();
  if (what === 'deposit') v.depositPaid = true; else { v.balancePaid = true; v.depositPaid = true; }
  if (v.status !== 'booked') v.status = 'booked';
  syncExpense(v);
  commit(); toast((what === 'deposit' ? 'Deposit' : 'Final balance') + ' marked paid', () => restoreSnapshot(snap));
}
/* Keep the budget's matching expense in step when a vendor payment is marked paid. */
function syncExpense(v) {
  const it = S.budget.items.find(i => i.name.trim().toLowerCase() === vendorTitle(v).trim().toLowerCase());
  if (!it) return;
  const paid = v.balancePaid ? v.cost : v.depositPaid ? v.deposit : 0;
  if (paid > it.paid) it.paid = Math.min(it.cost || paid, paid);
}
