
/* ---------- receipt photos: kept in the browser's on-device database, shrunk before saving ---------- */
const IMG = (() => {
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => { try { const rq = indexedDB.open(KEY + "-photos", 1); rq.onupgradeneeded = () => rq.result.createObjectStore("p"); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); } catch (e) { rej(e); } }));
  const tx = (mode, fn) => open().then(db => new Promise((res, rej) => { const t = db.transaction("p", mode), s = t.objectStore("p"); const r = fn(s); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }));
  return {
    /* answers true only when the photo really saved on the phone, so the app never points at a photo that isn't there */
    put: (id, url) => okImg(url) ? tx("readwrite", s => s.put(url, id)).then(() => true, () => false) : Promise.resolve(false),
    get: id => tx("readonly", s => s.get(id)).then(v => okImg(v) ? v : null, () => null),
    del: id => tx("readwrite", s => s.delete(id)).catch(() => {}),
    clear: () => tx("readwrite", s => s.clear()).catch(() => {})
  };
})();
function shrinkImage(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => { const max = 1400, k = Math.min(1, max / Math.max(im.width, im.height)); const cv = document.createElement("canvas"); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
      const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); res(cv.toDataURL("image/jpeg", .72)); };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error("bad image")); };
    im.src = url;
  });
}
function pickFile(accept, cb) {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = accept; inp.style.display = "none";
  document.body.appendChild(inp);
  inp.onchange = () => { const f = inp.files && inp.files[0]; inp.remove(); if (f) cb(f); };
  inp.click();
}
async function storageLine() {
  try { if (!navigator.storage || !navigator.storage.estimate) return ""; const e = await navigator.storage.estimate(); const mb = (e.usage || 0) / 1048576;
    const warn = e.quota && e.usage / e.quota > .8; return `${mb < .1 ? "Under 0.1" : mb.toFixed(1)} MB used on this device${warn ? ". Storage is nearly full: back up, then remove old receipt photos." : mb > 60 ? ". That's a lot of receipt photos; backups will be big." : "."}`; } catch (e) { return ""; }
}

/* ---------- saving files ---------- */
let downloads = null; /* set only in the Claude preview build (preview-only.js), never in the shipped app */
async function saveFile(name, data, mime, title) {
  try {
    if (downloads) { await downloads.save({ filename: name, data }); return true; }
    const blob = new Blob([data], { type: mime });
    const file = typeof File === "function" ? new File([blob], name, { type: mime }) : null;
    if (file && /iP(hone|ad|od)|Android/.test(navigator.userAgent) && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title }); return true; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); return true;
  } catch (e) {
    if (e && (e.code === "declined" || e.name === "AbortError")) toast("Canceled");
    else if (e && e.code === "rejected_extension") toast("This file type can't be saved here. Open the app from your Home Screen.");
    else toast("Couldn't save the file here");
    return false;
  }
}
const fileSlug = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

/* ---------- backup and restore (one JSON file, receipt photos included) ---------- */
const hasData = () => !S.sample && (S.clients.length + S.invoices.length + S.expenses.length + S.jobs.length) > 0;
async function backup() {
  const photos = {};
  for (const e of S.expenses) if (e.photo) { const u = await IMG.get(e.photo); if (u) photos[e.photo] = u; }
  const data = JSON.stringify({ app: APP_ID, version: 1, savedAt: new Date().toISOString(), state: S, photos });
  if (await saveFile("small-business-backup-" + iso(TODAY) + ".json", data, "application/json", "Small Business backup")) { S.lastBackup = iso(TODAY); commit("Backup saved"); }
}
function pickRestore() {
  pickFile(".json,application/json", f => {
    if (f.size > 200e6) { toast("That file is too big to be a backup"); return; }
    const rd = new FileReader();
    rd.onload = () => {
      let obj = null; try { obj = JSON.parse(rd.result); } catch (e) {}
      const st = obj && obj.state;
      if (!obj || obj.app !== APP_ID || !validState(st)) { toast("That isn't a Small Business backup"); return; }
      const when = obj.savedAt ? longD(String(obj.savedAt).slice(0, 10)) : "an earlier date", np = Object.keys(obj.photos || {}).length;
      const what = `${pl(st.clients.length, "client")}, ${pl(st.invoices.length, "quote or invoice", "quotes and invoices")}, ${pl(st.expenses.length, "expense")}${np ? ` and ${pl(np, "receipt photo")}` : ""}`;
      openSheet("Restore this backup?", `<p class="lead" style="margin-top:-2px">From ${esc(when)}: ${esc(what)}. This replaces what's on this phone now.</p>`, () => {
        let fresh; try { fresh = migrate(JSON.parse(JSON.stringify(st))); } catch (e) { return "That backup couldn't be read. Nothing was changed."; }
        const before = S, p0 = P;
        S = fresh; S.sample = false; S.lastBackup = S.lastBackup || iso(TODAY);
        const keys = new Set(S.expenses.map(e => e.photo).filter(Boolean)), src = obj.photos && typeof obj.photos === "object" ? obj.photos : {};
        const good = Object.keys(src).filter(k => keys.has(k) && okImg(src[k]));
        S.expenses.forEach(e => { if (e.photo && !good.includes(e.photo)) e.photo = ""; });
        /* try the screens with the backup first: if they can't open it, keep what's on the phone */
        try { render(); } catch (e) { S = before; P = p0; try { render(); } catch (e2) {} return "That backup couldn't be opened. Nothing was changed."; }
        clientFocus = null; askLast = null; askPending = null;
        commit(); later(() => { go("home"); window.scrollTo(0, 0); });
        IMG.clear().then(() => Promise.all(good.map(k => IMG.put(k, src[k]).then(ok => ok ? null : k)))).then(bad => {
          bad = bad.filter(Boolean);
          if (bad.length) { S.expenses.forEach(e => { if (bad.includes(e.photo)) e.photo = ""; }); commit(); toast(`Restored from ${when}. Some receipt photos couldn't be saved.`); }
          else toast(`Restored from ${when}`);
        }, () => toast(`Restored from ${when}. Some receipt photos couldn't be saved.`));
        return "nocommit";
      }, { saveLabel: "Restore", focus: false });
    };
    rd.readAsText(f);
  });
}
/* the earlier records the app couldn't open: save them as a backup file, so they can be restored or sent for help */
async function keptSave() {
  const raw = keptRaw(); if (raw == null) { toast("There's no kept copy on this phone"); return; }
  let st = null; try { st = JSON.parse(raw); } catch (e) {}
  const photos = {};
  if (st && Array.isArray(st.expenses)) for (const e of st.expenses) if (e && typeof e.photo === "string" && /^rc:[A-Za-z0-9_-]{1,40}$/.test(e.photo)) { const u = await IMG.get(e.photo); if (u) photos[e.photo] = u; }
  const data = st && typeof st === "object" ? JSON.stringify({ app: APP_ID, version: 1, savedAt: new Date().toISOString(), state: st, photos }) : raw;
  if (await saveFile("small-business-kept-records-" + iso(TODAY) + (st ? ".json" : ".txt"), data, st ? "application/json" : "text/plain", "Small Business records")) toast("Saved. Keep the file somewhere private.");
}
function keptHelp() {
  openSheet("Your earlier records", `<p class="lead" style="margin-top:-2px">The app couldn't open the records saved on this phone, so it kept them safe and opened an example instead.</p>
    <p class="muted">Save them as a file first. Then try Restore with that file, or email support@cyberhubsoftware.com and we'll help. Don't send the file unless we ask: it holds your ${esc(P.clients)}' names and numbers.</p>
    <div class="btnrow"><button class="btn ghost press" data-act="kept-remove" type="button">Remove Kept Copy</button></div>`, () => { keptSave(); return "nocommit"; }, { saveLabel: "Save the File", cancelLabel: "Close", focus: false });
}
function renderNudge() {
  const el = $("#nudge"); if (!el) return;
  if (keptRaw() != null || holdSave) { el.innerHTML = `<div class="backup-nudge kept" role="alert">${ic("warn", ICON.up)}
    <p><b>We couldn't open your saved data</b>It's kept safe on this phone. Save it as a file before you add anything new.<br><button class="lnk" data-act="kept-save">Back Up File</button> · <button class="lnk" data-act="kept-help">Get Help</button></p></div>`; return; }
  const days = S.lastBackup ? Math.floor((TODAY - D(S.lastBackup)) / 864e5) : null;
  let dismissed = null; try { dismissed = sessionStorage.getItem(KEY + "-nudge"); } catch (e) {}
  el.innerHTML = hasData() && !dismissed && !(days != null && days < 7) ? `<div class="backup-nudge" role="note">${ic("info", ICON.up)}
    <p><b>${days == null ? "Back up your business" : "Time for a fresh backup"}</b>${days == null ? "Your records stay on this phone. Save a copy you can restore anytime." : "Your last one was " + days + " days ago."}<br><button class="lnk" data-act="backup">Back up now</button></p>
    <button class="x" data-act="nudge-x" aria-label="Not now">×</button></div>` : "";
}

/* ---------- calendar file: jobs at their time with an alert an hour before, plus due dates ---------- */
function icsEscape(s) { return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
function icsFold(line) { const out = []; while (line.length > 74) { out.push(line.slice(0, 74)); line = " " + line.slice(74); } out.push(line); return out.join("\r\n"); }
function calendarFile() {
  const ev = events().filter(e => inDays(e.date) >= 0 && inDays(e.date) <= 366 && e.kind !== "todo" && !e.done);
  if (!ev.length) { toast("Nothing coming up to add yet"); return; }
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, ""), name = S.profile.biz || "Small Business";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CyberHub Software//Small Business//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:" + icsEscape(name)];
  const jobs = ev.filter(e => e.kind === "job").length;
  ev.forEach(e => {
    const d = e.date.replace(/-/g, ""), j = e.kind === "job" ? S.jobs.find(x => x.id === e.ref) : null;
    lines.push("BEGIN:VEVENT", "UID:" + e.ref + "-" + e.kind + "-" + d + "@smallbiz.cyberhubsoftware.com", "DTSTAMP:" + stamp);
    if (j && j.time) {
      const st0 = new Date(D(e.date)); const [h, m] = j.time.split(":").map(Number); st0.setHours(h, m, 0, 0); const en = new Date(st0.getTime() + (+j.dur || 60) * 60000);
      const f = dt => iso(dt).replace(/-/g, "") + "T" + String(dt.getHours()).padStart(2, "0") + String(dt.getMinutes()).padStart(2, "0") + "00";
      lines.push("DTSTART:" + f(st0), "DTEND:" + f(en));
    } else lines.push("DTSTART;VALUE=DATE:" + d, "DTEND;VALUE=DATE:" + iso(addDays(D(e.date), 1)).replace(/-/g, ""), "TRANSP:TRANSPARENT");
    const c = j && clientOf(j.clientId), where = c ? addrLines(c).join(", ") : "";
    lines.push("SUMMARY:" + icsEscape(e.title), "DESCRIPTION:" + icsEscape([e.sub, j && j.notes, c && c.phone ? "Phone " + c.phone : ""].filter(Boolean).join("\n")));
    if (where) lines.push("LOCATION:" + icsEscape(where));
    if (j && j.time) lines.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEscape(e.title), "TRIGGER:-PT1H", "END:VALARM");
    else {
      if (e.kind === "tax" || e.kind === "bill") lines.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEscape(e.title + " in 7 days"), "TRIGGER:-P6DT15H", "END:VALARM");
      lines.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEscape(e.title), "TRIGGER:PT9H", "END:VALARM");
    }
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  const data = lines.map(icsFold).join("\r\n"), fname = (fileSlug(name) || "small-business") + "-calendar.ics";
  openSheet("Add to your Calendar", `<p class="lead" style="margin-top:-2px">${pl(ev.length, "date")} for the next year${jobs ? `, including ${pl(jobs, P.job, P.jobs)} with an alert an hour before` : ""}. Bills and tax dates alert a week before and that morning.</p>
    <ol class="steps" style="padding-left:22px"><li>Tap <b>Save Calendar File</b>.</li><li>Open the file and tap <b>Add All</b>.</li><li>If you add it again later, your phone may show old dates twice. Delete the old ones first.</li></ol>
`, () => {
    (async () => {
      try {
        const blob = new Blob([data], { type: "text/calendar" }), file = typeof File === "function" ? new File([blob], fname, { type: "text/calendar" }) : null;
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name + " calendar" }); toast("Calendar file ready"); return; }
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fname; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); toast("Calendar file saved");
      } catch (e) { if (e && e.name === "AbortError") toast("Canceled"); else toast("Couldn't save the calendar file here"); }
    })();
    return "nocommit";
  }, { saveLabel: "Save calendar file", focus: false });
}

/* ---------- PDFs, drawn on the phone ---------- */
/* PDF and QR tools ship in the app's lib folder so they work offline. The PDF tool can also come from cdnjs, with an
   integrity check, if the local copy fails; the QR tool has no outside copy at all. */
function loadScript(src, sri) {
  return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; if (sri) { s.integrity = sri; s.crossOrigin = "anonymous"; } s.onload = res; s.onerror = () => { s.remove(); rej(new Error("load failed")); }; document.head.appendChild(s); });
}
function loadLib(local, cdn, sri, ready) {
  if (ready()) return Promise.resolve(ready());
  return loadScript(local).catch(e => cdn ? loadScript(cdn, sri) : Promise.reject(e)).then(() => ready() || Promise.reject(new Error("not loaded")));
}
let jsPDFp = null;
function loadPDF() {
  return jsPDFp || (jsPDFp = loadLib("lib/jspdf.umd.min.js", "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    "sha512-qZvrmS2ekKPF2mSznTQsxqPgnpkI4DNTlrdUmTzrDgektczlKNRRhy5X5AAOnx5S09ydFYWWNSfcEqDTTHgtNA==", () => window.jspdf && window.jspdf.jsPDF).catch(e => { jsPDFp = null; throw e; }));
}
const pdfText = s => String(s == null ? "" : s).replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\u2014|\u2013|\u2212/g, "-").replace(/\u203A/g, ">").replace(/[^\x20-\x7E\u00A0-\u00FF\u2022\u2026\n]/g, "");
const hexRgb = h => { const n = parseInt(String(h).replace("#", ""), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const accentRgb = () => hexRgb((ACCENTS.find(a => a[0] === look().accent) || ACCENTS.find(a => a[0] === P.accent) || ACCENTS[6])[2]);
function pdfKit(doc) {
  const M = 48, W = 612 - M * 2, H = 792; let y = M;
  const ink = [28, 34, 48], acc = accentRgb(), grey = [107, 117, 135], amber = [176, 104, 20];
  const k = {
    doc, M, W, H, acc, ink, grey, get y() { return y; }, set y(v) { y = v; },
    room(h) { if (y + h > H - M - 20) { doc.addPage(); y = M; return true; } return false; },
    title(t, sub) { doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(...ink); doc.text(pdfText(t), M, y + 18); y += 30; if (sub) { doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(...grey); doc.splitTextToSize(pdfText(sub), W).forEach(l => { doc.text(l, M, y + 10); y += 14; }); } y += 8; },
    band(t, right) { k.room(60); doc.setFillColor(...acc.map(c => Math.round(c * .1 + 255 * .9))); doc.roundedRect(M, y, W, 24, 5, 5, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...acc); doc.text(pdfText(t).toUpperCase(), M + 10, y + 16); if (right) { doc.setTextColor(...grey); doc.text(pdfText(right), M + W - 10, y + 16, { align: "right" }); } y += 32; },
    note(t) { doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(70, 78, 98); doc.splitTextToSize(pdfText(t), W).forEach(l => { k.room(14); doc.text(l, M + 4, y + 10); y += 13; }); y += 8; },
    empty(t) { k.room(20); doc.setFont("helvetica", "italic"); doc.setFontSize(9.5); doc.setTextColor(...grey); doc.text(pdfText(t), M + 4, y + 10); y += 22; },
    table(cols, rows, totals) {
      const draw = (cells, bold, fill) => { const h = 18; if (k.room(h + 4) && !bold) head(); if (fill) { doc.setFillColor(...fill); doc.rect(M, y, W, h, "F"); }
        doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(8.8); doc.setTextColor(...(bold ? ink : [60, 66, 84]));
        let x = M + 4; cells.forEach((c, i) => { const col = cols[i]; const t = doc.splitTextToSize(pdfText(c), col.w - 8)[0] || ""; doc.text(t, col.right ? x + col.w - 8 : x, y + 12, col.right ? { align: "right" } : undefined); x += col.w; });
        y += h; };
      const head = () => draw(cols.map(c => c.t), true, [242, 244, 248]);
      head(); rows.forEach((r, i) => draw(r, false, i % 2 ? [250, 251, 253] : null)); if (totals) draw(totals, true, acc.map(c => Math.round(c * .12 + 255 * .88))); y += 12;
    },
    footer(label) { const n = doc.getNumberOfPages(); for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...grey); doc.text(pdfText(label), M, H - 26); doc.text("Page " + i + " of " + n, M + W, H - 26, { align: "right" }); } }
  };
  return k;
}
const m2 = v => money2(v).replace("−", "-");

/* an invoice or quote your customer would be glad to get */
async function makeDocPDF(x) {
  toast("Making the PDF…");
  let JsPDF; try { JsPDF = await loadPDF(); } catch (e) { toast("Couldn't load the PDF maker. Check your connection."); return; }
  const doc = new JsPDF({ unit: "pt", format: "letter" }), k = pdfKit(doc), { M, W, acc, ink, grey } = k, pf = S.profile, c = clientOf(x.clientId) || { name: "" }, t = totals(x), isQ = x.kind === "quote";
  /* header: color band, business on the left, the document on the right */
  doc.setFillColor(...acc); doc.rect(0, 0, 612, 10, "F");
  let y = 58;
  doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(...ink); doc.text(pdfText(pf.biz || pf.owner || "Invoice"), M, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...grey);
  const me = [pf.biz && pf.owner ? pf.owner : "", ...addrLines(pf), pf.phone, pf.email].filter(Boolean); me.forEach((l, i) => doc.text(pdfText(l), M, y + 16 + i * 13));
  doc.setFont("helvetica", "bold"); doc.setFontSize(26); doc.setTextColor(...acc); doc.text(isQ ? "QUOTE" : "INVOICE", M + W, y, { align: "right" });
  const meta = [[isQ ? "Quote" : "Invoice", docNum(x)], ["Date", longD(x.date)], isQ ? ["Good until", x.valid ? longD(x.valid) : ""] : ["Due", x.due ? (x.due === x.date ? "On receipt" : longD(x.due)) : ""]].filter(r => r[1]);
  meta.forEach(([a, b], i) => { doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...grey); doc.text(a, M + W - 110, y + 18 + i * 14, { align: "right" }); doc.setFont("helvetica", "bold"); doc.setTextColor(...ink); doc.text(pdfText(b), M + W, y + 18 + i * 14, { align: "right" }); });
  y += Math.max(16 + me.length * 13, 18 + meta.length * 14) + 22;
  /* bill to */
  doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(...grey); doc.text(isQ ? "PREPARED FOR" : "BILL TO", M, y);
  doc.setFontSize(12); doc.setTextColor(...ink); doc.text(pdfText(c.name || ""), M, y + 16);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(70, 78, 98);
  const to = [c.company && c.company !== c.name ? c.company : "", ...addrLines(c), c.email].filter(Boolean); to.forEach((l, i) => doc.text(pdfText(l), M, y + 30 + i * 13));
  /* amount due callout */
  const bigLabel = isQ ? "Total" : t.due > 0 ? "Amount due" : "Paid in full", bigVal = isQ ? t.total : t.due > 0 ? t.due : t.total;
  doc.setFillColor(...acc.map(v => Math.round(v * .08 + 255 * .92))); doc.roundedRect(M + W - 190, y - 12, 190, 56, 8, 8, "F");
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...grey); doc.text(bigLabel, M + W - 176, y + 6);
  doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(...acc); doc.text(pdfText(m2(bigVal)), M + W - 176, y + 30);
  y += Math.max(30 + to.length * 13, 56) + 24;
  /* lines */
  const cols = [{ t: "Description", w: W - 230 }, { t: "Qty", w: 60, right: true }, { t: "Price", w: 80, right: true }, { t: "Amount", w: 90, right: true }];
  doc.setDrawColor(...acc); doc.setLineWidth(1.2); doc.line(M, y, M + W, y); y += 4;
  const drawRow = (cells, bold) => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(bold ? 8.5 : 10); doc.setTextColor(...(bold ? grey : ink));
    const desc = doc.splitTextToSize(pdfText(cells[0]), cols[0].w - 10), h = Math.max(1, desc.length) * 13 + 10;
    if (y + h > k.H - 110) { doc.addPage(); y = M; }
    let xx = M; desc.forEach((l, i) => doc.text(bold ? l.toUpperCase() : l, xx + 2, y + 14 + i * 13)); xx += cols[0].w;
    cells.slice(1).forEach((v, i) => { const col = cols[i + 1]; doc.text(pdfText(bold ? String(v).toUpperCase() : v), xx + col.w - 4, y + 14, { align: "right" }); xx += col.w; });
    y += h; if (!bold) { doc.setDrawColor(228, 231, 238); doc.setLineWidth(.6); doc.line(M, y, M + W, y); }
  };
  drawRow(cols.map(c => c.t), true);
  x.items.forEach(it => drawRow([it.desc, num(it.qty), m2(it.rate), m2(lineTotal(it))]));
  y += 12;
  /* totals */
  const tot = [["Subtotal", m2(t.sub)]]; if (t.disc) tot.push(["Discount", "-" + m2(t.disc)]); if (t.tax) tot.push(["Sales tax (" + num(x.taxPct) + "%)", m2(t.tax)]);
  tot.push(["Total", m2(t.total)]); if (!isQ && t.paid) tot.push(["Paid", "-" + m2(t.paid)], ["Balance due", m2(t.due)]);
  if (y + tot.length * 18 + 20 > k.H - 90) { doc.addPage(); y = M; }
  tot.forEach(([a, b], i) => { const last = i === tot.length - 1; if (last) { doc.setFillColor(...acc.map(v => Math.round(v * .1 + 255 * .9))); doc.roundedRect(M + W - 230, y - 2, 230, 22, 5, 5, "F"); }
    doc.setFont("helvetica", last ? "bold" : "normal"); doc.setFontSize(last ? 11 : 10); doc.setTextColor(...(last ? acc : ink)); doc.text(pdfText(a), M + W - 220, y + 13); doc.text(pdfText(b), M + W - 8, y + 13, { align: "right" }); y += last ? 24 : 18; });
  y += 18;
  /* how to pay, notes, thanks */
  const block = (hd, body) => { if (!body) return; const ls = doc.splitTextToSize(pdfText(body), W - 20); if (y + ls.length * 13 + 30 > k.H - 60) { doc.addPage(); y = M; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(...grey); doc.text(hd, M, y); doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...ink); ls.forEach((l, i) => doc.text(l, M, y + 15 + i * 13)); y += 15 + ls.length * 13 + 14; };
  if (!isQ) block("HOW TO PAY", pf.payNote);
  block("NOTE", x.notes);
  if (isQ) block("TO GO AHEAD", "Just reply or call" + (pf.phone ? " " + pf.phone : "") + " and we'll get you on the schedule.");
  const thanks = pf.thanks || P.thanks;
  if (thanks) { if (y + 30 > k.H - 50) { doc.addPage(); y = M; } doc.setFont("helvetica", "italic"); doc.setFontSize(11); doc.setTextColor(...acc); doc.text(pdfText(thanks), M, y + 8); }
  const n = doc.getNumberOfPages(); for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...grey); doc.text(pdfText((pf.biz || "") + " · " + docWord(x) + " " + docNum(x)), M, k.H - 26); if (n > 1) doc.text("Page " + i + " of " + n, M + W, k.H - 26, { align: "right" }); }
  const fname = (fileSlug(pf.biz) ? fileSlug(pf.biz) + "-" : "") + (isQ ? "quote-" : "invoice-") + x.num + ".pdf";
  if (await saveFile(fname, doc.output("arraybuffer"), "application/pdf", docWord(x) + " " + docNum(x))) {
    if (x.status === "draft") { x.status = "sent"; commit(); }
    toast(docWord(x) + " PDF ready");
  }
}

/* the year-end packet for a tax pro */
function packetSheet() {
  const years = [...new Set([...S.payments, ...S.expenses, ...S.trips].map(r => +String(r.date).slice(0, 4)).filter(Boolean))].sort((a, b) => b - a);
  const y0 = TODAY.getMonth() < 4 && years.includes(TODAY.getFullYear() - 1) ? TODAY.getFullYear() - 1 : TODAY.getFullYear();
  if (!years.includes(y0)) years.unshift(y0);
  const np = S.expenses.filter(e => e.photo).length;
  openSheet("Year-end packet", `<p class="lead" style="margin-top:-2px">One PDF for your tax pro: money in by month and by ${esc(P.client)}, expenses by category, your mileage log, tax payments and anything still unpaid.</p>` +
    F.seg("year", "Year", String(y0), years.slice(0, 4).map(y => [String(y), String(y)])) +
    (np ? F.check("photos", "Add receipt photos at the end", false, pl(np, "photo") + " saved. Makes the file bigger.") : ""), v => { makePacket(+v.year || y0, !!v.photos); return "nocommit"; }, { saveLabel: "Create PDF", focus: false });
}
async function makePacket(year, photos) {
  toast("Making your packet…");
  let JsPDF; try { JsPDF = await loadPDF(); } catch (e) { toast("Couldn't load the PDF maker. Check your connection."); return; }
  const doc = new JsPDF({ unit: "pt", format: "letter" }), k = pdfKit(doc), W = k.W, pf = S.profile, a = year + "-01-01", b = year + "-12-31";
  const pays = S.payments.filter(p => inRange(p.date, a, b)), exps = S.expenses.filter(e => inRange(e.date, a, b)).sort((x, y) => x.date.localeCompare(y.date)), trips = S.trips.filter(t => inRange(t.date, a, b)).sort((x, y) => x.date.localeCompare(y.date));
  const inc = sum(pays, p => p.amount), out = sum(exps, e => e.amount), miles = sum(trips, t => t.miles), ded = sum(trips, t => t.miles * mileRate(t.date)), taxp = S.taxPaid.filter(t => t.year === year);
  k.title((pf.biz || "Your business") + " · " + year, `${[pf.owner, ...addrLines(pf)].filter(Boolean).join(" · ")}\nPrepared ${longD(iso(TODAY))} from records the owner entered in the app. For your tax pro to review. Not tax advice.${year === TODAY.getFullYear() ? " The year isn't over, so totals run through " + longD(iso(TODAY)) + "." : ""}`);
  k.band("Summary");
  k.table([{ t: "", w: W - 140 }, { t: "Amount", w: 140, right: true }], [["Money in (payments received)", m2(inc)], ["Expenses", m2(out)], ["Profit before mileage", m2(inc - out)], [`Mileage: ${num(miles)} miles (IRS rate unless you set your own)`, m2(ded)], ["Estimated tax payments logged", m2(sum(taxp, t => t.amount))]]);
  k.band("Money in by month", m2(inc));
  k.table([{ t: "Month", w: W - 240 }, { t: "Payments", w: 100, right: true }, { t: "Amount", w: 140, right: true }], MONTHS.map((mn, i) => { const ps = pays.filter(p => +p.date.slice(5, 7) === i + 1); return [mn, ps.length, m2(sum(ps, p => p.amount))]; }), ["Total", pays.length, m2(inc)]);
  const byC = bestClients(a, b), noC = sum(pays.filter(p => !p.clientId || !clientOf(p.clientId)), p => p.amount);
  k.band("Money in by " + P.client, pl(byC.length, P.client, P.clients));
  if (byC.length || noC) k.table([{ t: Wd(P.client, 1), w: W - 140 }, { t: "Amount", w: 140, right: true }], byC.map(r => [r.c.name + (r.c.company && r.c.company !== r.c.name ? " (" + r.c.company + ")" : ""), m2(r.v)]).concat(noC ? [["Not tied to a " + P.client, m2(noC)]] : []), ["Total", m2(inc)]);
  else k.empty("No payments logged");
  const cats = [...new Set(exps.map(e => e.cat))].sort((x, y) => sum(exps.filter(e => e.cat === y), e => e.amount) - sum(exps.filter(e => e.cat === x), e => e.amount));
  k.band("Expenses by category", m2(out));
  if (cats.length) k.table([{ t: "Category", w: W - 240 }, { t: "Items", w: 100, right: true }, { t: "Amount", w: 140, right: true }], cats.map(c => { const es = exps.filter(e => e.cat === c); return [catName(c), es.length, m2(sum(es, e => e.amount))]; }), ["Total", exps.length, m2(out)]);
  else k.empty("No expenses logged");
  if (exps.length) { k.band("Every expense", pl(exps.length, "item")); k.table([{ t: "Date", w: 70 }, { t: "Where", w: W - 330 }, { t: "Category", w: 120 }, { t: "Receipt", w: 50 }, { t: "Amount", w: 90, right: true }], exps.map(e => [shortD(e.date).replace(", " + year, ""), e.vendor || e.note || "", catName(e.cat), e.photo ? "Yes" : "", m2(e.amount)]), ["", "", "", "", m2(out)]); }
  k.band("Mileage log", num(miles) + " miles");
  if (trips.length) k.table([{ t: "Date", w: 62 }, { t: "Purpose", w: W - 322 }, { t: "From and to", w: 130 }, { t: "Miles", w: 50, right: true }, { t: "Value", w: 80, right: true }], trips.map(t => [shortD(t.date).replace(", " + year, ""), t.purpose || clientName(t.clientId) || "", [t.from, t.to].filter(Boolean).join(" to "), num(t.miles), m2(t.miles * mileRate(t.date))]), ["", "", "", num(miles), m2(ded)]);
  else k.empty("No trips logged");
  k.band("Estimated tax payments");
  if (taxp.length) k.table([{ t: "Period", w: W - 240 }, { t: "Date paid", w: 100 }, { t: "Amount", w: 140, right: true }], taxp.sort((x, y) => x.q - y.q).map(t => [(taxQuarters(year).find(q => q.q === t.q) || {}).label || "Q" + t.q, shortD(t.date), m2(t.amount)]), ["Total", "", m2(sum(taxp, t => t.amount))]);
  else k.empty("None logged");
  const unpaid = S.invoices.filter(x => x.kind === "invoice" && x.status !== "draft" && x.status !== "void" && x.date <= b && totals(x).due > 0);
  k.band("Invoices still unpaid", unpaid.length ? m2(sum(unpaid, x => totals(x).due)) : "");
  if (unpaid.length) k.table([{ t: "Invoice", w: 70 }, { t: Wd(P.client, 1), w: W - 300 }, { t: "Sent", w: 70 }, { t: "Due", w: 70 }, { t: "Owed", w: 90, right: true }], unpaid.map(x => [docNum(x), clientName(x.clientId), shortD(x.date), x.due ? shortD(x.due) : "", m2(totals(x).due)]));
  else k.empty("Nothing unpaid");
  k.note("Money in counts payments on the day you got them. Expenses and mileage are what you logged. Mileage uses the IRS business rate for each trip's date (70 cents for 2025, 72.5 cents to June 30, 2026 and 76 cents from July 1, 2026) unless you set your own rate in the app.");
  if (photos) {
    const withP = exps.filter(e => e.photo);
    for (let i = 0; i < withP.length; i++) {
      const e = withP[i], u = await IMG.get(e.photo); if (!u) continue;
      if (i % 2 === 0) { doc.addPage(); k.y = k.M; if (i === 0) k.band("Receipt photos", pl(withP.length, "photo")); }
      const im = await new Promise(r => { const g = new Image(); g.onload = () => r(g); g.onerror = () => r(null); g.src = u; }); if (!im) continue;
      const boxH = (k.H - k.M * 2 - 90) / 2, sc = Math.min(W / im.width, (boxH - 24) / im.height), w = im.width * sc, h = im.height * sc;
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(...k.ink); doc.text(pdfText(`${shortD(e.date)} · ${e.vendor || catName(e.cat)} · ${m2(e.amount)}`), k.M, k.y + 10);
      try { doc.addImage(u, "JPEG", k.M, k.y + 18, w, h); } catch (er) {}
      k.y += boxH + 10;
    }
  }
  k.footer((pf.biz || "Small Business") + " · " + year + " packet · not tax advice");
  if (await saveFile((fileSlug(pf.biz) || "business") + "-" + year + "-packet.pdf", doc.output("arraybuffer"), "application/pdf", year + " packet")) toast("Packet saved");
}

/* ---------- the art behind the big card on Home, one for each kind of business ---------- */
const TEX_OPEN = `<svg class="tex" viewBox="0 0 400 300" preserveAspectRatio="xMaxYMin slice" aria-hidden="true">`;
const HERO_RINGS = `<g style="fill:none;stroke:var(--hero-num)"><circle cx="372" cy="10" r="70" style="opacity:.1;stroke-width:1.5"/><circle cx="372" cy="10" r="124" style="opacity:.06;stroke-width:1.5"/></g>`;
const HERO_WAVE = `<path d="M0 262 C 90 238, 170 296, 260 262 S 360 246, 400 258 L400 300 L0 300 Z" style="fill:var(--hero-ink);opacity:.04"/>`;
const HG = (body, o) => `<g style="fill:none;stroke:var(--hero-num);stroke-width:${o || 2};stroke-linecap:round;stroke-linejoin:round">${body}</g>`;
const HERO_ART = {
  wrench: HG(`<path d="M300 58a34 34 0 0 0 42 42l-74 74a14 14 0 0 1-20-20l74-74a34 34 0 0 0-22-22z" style="opacity:.24"/><path d="M322 40l-13 13 6 19 19 6 13-13" style="opacity:.24"/>
    <circle cx="350" cy="190" r="26" style="opacity:.12"/><circle cx="350" cy="190" r="9" style="opacity:.12"/>${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<path d="M${(350 + Math.cos(a) * 26).toFixed(1)} ${(190 + Math.sin(a) * 26).toFixed(1)}L${(350 + Math.cos(a) * 34).toFixed(1)} ${(190 + Math.sin(a) * 34).toFixed(1)}" style="opacity:.12;stroke-width:5"/>`; }).join("")}`),
  scissors: HG(`<circle cx="292" cy="62" r="18" style="opacity:.24"/><circle cx="292" cy="132" r="18" style="opacity:.24"/><path d="M306 74l84 58M306 120l84-58" style="opacity:.24"/>
    <path d="M250 196h130" style="opacity:.12;stroke-width:6"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${258 + i * 10} 199v22" style="opacity:.12"/>`).join("")}`),
  pen: HG(`<path d="M296 160l12-44 60-60a14 14 0 0 1 20 20l-60 60z" style="opacity:.24"/><path d="M358 66l20 20M308 116l20 20" style="opacity:.2"/>
    <path d="M190 220c40-30 70 18 110-6s60-40 100-20" style="opacity:.14"/><path d="M210 250c40-22 80 14 120-8s50-26 70-16" style="opacity:.08"/>`),
  whisk: HG(`<path d="M330 186v60" style="opacity:.24;stroke-width:6"/><path d="M330 186c-34-30-34-110 0-140 34 30 34 110 0 140z" style="opacity:.24"/><path d="M330 186c-16-30-16-110 0-140 16 30 16 110 0 140z" style="opacity:.18"/><path d="M330 46v140" style="opacity:.14"/>
    <circle cx="262" cy="80" r="4" style="opacity:.2;fill:var(--hero-num)"/><circle cx="380" cy="120" r="3" style="opacity:.2;fill:var(--hero-num)"/><circle cx="270" cy="150" r="3" style="opacity:.14;fill:var(--hero-num)"/>`),
  tag: HG(`<path d="M276 48h58l52 52a10 10 0 0 1 0 14l-48 48a10 10 0 0 1-14 0l-52-52V58a10 10 0 0 1 4-10z" style="opacity:.24"/><circle cx="300" cy="74" r="8" style="opacity:.24"/><path d="M300 66c-10-24-40-30-58-16" style="opacity:.16"/>
    ${[40, 70, 56, 92, 120].map((h, i) => `<rect x="${238 + i * 26}" y="${262 - h}" width="14" height="${h}" rx="3" style="opacity:.1;fill:var(--hero-num);stroke:none"/>`).join("")}`),
  leaf: HG(`<path d="M270 170c0-70 40-110 110-110 0 70-40 110-110 110z" style="opacity:.24"/><path d="M270 170l76-76" style="opacity:.2"/>
    <path d="M340 220c0-34 20-54 54-54 0 34-20 54-54 54z" style="opacity:.14"/><path d="M250 74l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" style="opacity:.2;fill:var(--hero-num);stroke:none"/><path d="M372 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" style="opacity:.16;fill:var(--hero-num);stroke:none"/>`)
};
const heroArt = () => TEX_OPEN + HERO_RINGS + HERO_WAVE + (HERO_ART[P.art] || "") + `</svg>`;
