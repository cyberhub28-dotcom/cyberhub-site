
/* ---------- certificate photos: kept in the browser's on-device database, shrunk before saving ---------- */
const IMG = (() => {
  let dbp = null; const mem = Object.create(null);
  const open = () => dbp || (dbp = new Promise((res, rej) => { try { const rq = indexedDB.open(KEY + "-photos", 1); rq.onupgradeneeded = () => rq.result.createObjectStore("p"); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); } catch (e) { rej(e); } }));
  const tx = (mode, fn) => open().then(db => new Promise((res, rej) => { const t = db.transaction("p", mode), s = t.objectStore("p"); const r = fn(s); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }));
  return {
    /* true when the photo really saved on the phone; false means it's only kept until the app closes */
    put: (id, url) => tx("readwrite", s => s.put(url, id)).then(() => true, () => { mem[id] = url; return false; }),
    keys: () => tx("readonly", s => s.getAllKeys()).then(v => v || [], () => []),
    get: id => tx("readonly", s => s.get(id)).then(v => v || mem[id] || null).catch(() => mem[id] || null),
    del: id => tx("readwrite", s => s.delete(id)).catch(() => { delete mem[id]; }),
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
    const warn = e.quota && e.usage / e.quota > .8; return `${mb < .1 ? "Under 0.1" : mb.toFixed(1)} MB used on this device${warn ? ". Storage is nearly full: back up, then remove old certificate photos." : mb > 60 ? ". That's a lot of photos; backups will be big." : "."}`; } catch (e) { return ""; }
}

/* ---------- saving files ---------- */
let downloads = null, PREVIEW_ICS_NOTE = "";
/*PREVIEW*/
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

/* ---------- backup and restore (one JSON file, photos included) ---------- */
const hasData = () => !S.sample && (S.creds.length + S.ce.length + S.todos.length) > 0;
async function backup() {
  const photos = {};
  for (const e of S.ce) if (e.photo) { const u = await IMG.get(e.photo); if (u) photos[e.photo] = u; }
  for (const d of S.docs || []) { const u = await IMG.get("doc:" + d.id); if (u) photos["doc:" + d.id] = u; }
  const data = JSON.stringify({ app: APP_ID, version: 1, savedAt: new Date().toISOString(), state: S, photos });
  if (await saveFile("credentials-backup-" + iso(TODAY) + ".json", data, "application/json", "Credentials backup")) { S.lastBackup = iso(TODAY); commit("Backup saved"); }
}
function pickRestore() {
  pickFile(".json,application/json", f => {
    if (f.size > 150e6) { toast("That file is too big to be a backup"); return; }
    const rd = new FileReader();
    rd.onload = () => {
      let obj = null; try { obj = JSON.parse(rd.result); } catch (e) {}
      if (!obj || obj.app !== APP_ID || !validState(obj.state)) { toast("That isn't a Credentials backup"); return; }
      const st = clean(obj.state), photos = cleanPhotos(obj.photos, st);
      const day = String(obj.savedAt || "").slice(0, 10), when = ISO_RX.test(day) ? longD(day) : "an earlier date", np = Object.keys(photos).length;
      openSheet("Restore this backup?", `<p class="muted" style="font-size:.92rem;margin:0 0 14px">From ${esc(when)}: ${st.creds.length} credentials, ${st.ce.length} courses${np ? `, ${np} photos and files` : ""} and ${st.todos.length} to-dos. This replaces what's on this device now.</p>`, () => {
        /* draw the backup first; if it can't be shown, nothing on the phone changes */
        const prev = S;
        S = migrate(st); S.sample = false; S.lastBackup = S.lastBackup || iso(TODAY);
        try { render(); } catch (e) { S = prev; try { render(); } catch (e2) {} later(() => toast("That backup couldn't be opened, so nothing was changed")); return "nocommit"; }
        save();
        for (const k of Object.keys(THUMB)) delete THUMB[k];
        toast("Restoring…");
        /* save the backup's photos first, then remove the old ones, so a failed save never leaves records pointing at nothing */
        const keep = new Set(Object.keys(photos));
        Promise.all(Object.entries(photos).map(([k, v]) => IMG.put(k, v))).then(ok => IMG.keys().then(old => Promise.all(old.filter(k => !keep.has(k)).map(k => IMG.del(k)))).then(() => {
          render();
          if (ok.every(Boolean)) toast(`Restored from ${when}: ${st.creds.length} credentials, ${st.ce.length} courses`);
          else toast("Restored, but some photos couldn't be saved on this device. Free up space, then restore again.");
        })).catch(() => { render(); toast("Restored, but some photos couldn't be saved on this device. Free up space, then restore again."); });
        return "nocommit";
      }, { saveLabel: "Restore", focus: false });
    };
    rd.readAsText(f);
  });
}
/* ---------- saved data that couldn't be opened ----------
   Kept under its own name so later saves never overwrite it. If the phone has no room for a second copy,
   the original stays where it is and saving waits until it's saved as a file or deleted. */
const UNREAD_KEY = KEY + "-unreadable";
let unreadPinned = null;
/* An earlier kept copy is never replaced: a second one that can't open is held where it is (saving waits)
   until it's saved as a file or deleted, and then the earlier one is offered again. */
function keepUnreadable(raw) {
  const old = store.get(UNREAD_KEY);
  if (old === raw) return;
  if (old || !store.set(UNREAD_KEY, raw)) unreadPinned = raw;
}
function unreadable() { return unreadPinned || store.get(UNREAD_KEY); }
function dropUnreadable() { if (unreadPinned) { unreadPinned = null; save(); } else store.del(UNREAD_KEY); }
async function saveUnreadable() {
  const raw = unreadable(); if (!raw) return;
  let state = null; try { state = JSON.parse(raw); } catch (e) {}
  let data = raw;
  if (state && typeof state === "object") {
    const photos = {}; for (const k of await IMG.keys()) { if (typeof k !== "string") continue; const u = await IMG.get(k); if (u) photos[k] = u; }
    data = JSON.stringify({ app: APP_ID, version: 1, savedAt: new Date().toISOString(), note: "Saved data that couldn't be opened", state, photos });
  }
  if (await saveFile("credentials-kept-copy-" + iso(TODAY) + ".json", data, "application/json", "Credentials kept copy")) {
    toast("Saved. Keep this file private, along with your other backups.");
    if (unreadPinned) { unreadPinned = null; save(); renderNudge(); renderMore(); }
  }
}
function unreadableCard() {
  if (!unreadable()) return "";
  return `<div class="backup-nudge" role="note">${ic("warn", ICON.up)}
    <p><b>Your saved data couldn't be opened</b>It's kept safe on this phone${unreadPinned ? ". Changes won't save until you save it as a file or delete it" : ""}. Save it as a file, or restore a backup.<br><span style="display:inline-flex;flex-wrap:wrap;gap:4px 22px"><button class="lnk" data-act="unreadable-save">Save it as a file</button><button class="lnk" data-act="restore">Restore a backup</button></span></p></div>`;
}
function renderNudge() {
  const el = $("#nudge"); if (!el) return;
  const days = S.lastBackup ? Math.floor((TODAY - D(S.lastBackup)) / 864e5) : null;
  let dismissed = null; try { dismissed = sessionStorage.getItem(KEY + "-nudge"); } catch (e) {}
  let html = unreadableCard();
  const behind = S.rules.map(r => [r, pace(r)]).filter(([, p]) => p && p.behind);
  let paceOff = null; try { paceOff = sessionStorage.getItem(KEY + "-pace"); } catch (e) {}
  if (behind.length && !paceOff) {
    const [r, p] = behind[0];
    html += `<div class="backup-nudge" role="note">${ic("warn", ICON.rule)}
      <p><b>${esc(r.name)} is behind pace</b>About ${hrs(p.perMonth)} hrs a month gets you there by ${short(D(r.end))}.${behind.length > 1 ? ` ${behind.length - 1} more behind.` : ""}<br><button class="lnk" data-act="ce-new">Log a course</button></p>
      <button class="x" data-act="pace-x" aria-label="Not now">×</button></div>`;
  }
  if (hasData() && !dismissed && !(days != null && days < 7)) html += `<div class="backup-nudge" role="note">${ic("info", ICON.up)}
    <p><b>${days == null ? "Back up your credentials" : "Time for a fresh backup"}</b>${days == null ? "Your data lives only on this device. Save a copy you can restore anytime." : "Your last one was " + days + " days ago."}<br><button class="lnk" data-act="backup">Back up now</button></p>
    <button class="x" data-act="nudge-x" aria-label="Not now">×</button></div>`;
  el.innerHTML = html;
}

/* ---------- pace coach ---------- */
function pace(r) {
  if (r.manual) return null;
  const p = prog(r); if (p.met || p.closed) return null;
  const s = D(r.start), e = D(r.end), span = Math.max(1, dayDiff(s, e)), gone = Math.min(1, Math.max(0, dayDiff(s, TODAY) / span));
  const monthsLeft = Math.max(.5, dayDiff(TODAY, e) / 30.44), perMonth = Math.max(.1, Math.ceil(p.left / monthsLeft * 10) / 10);
  const expected = r2(r.target * gone), behind = gone > .1 && p.total < expected - Math.max(1, r.target * .05);
  return { perMonth, expected, behind, monthsLeft };
}

/* ---------- import courses from a CSV ---------- */
function parseCSV(text) {
  text = text.replace(/^\uFEFF/, "");
  const first = text.split(/\r?\n/).find(l => l.trim()) || "";
  const cnt = ch => (first.match(new RegExp(ch === "\t" ? "\t" : "\\" + ch, "g")) || []).length;
  const d = [",", ";", "\t"].sort((a, b) => cnt(b) - cnt(a))[0];
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; continue; }
    if (c === '"') q = true;
    else if (c === d) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); cell = ""; if (row.some(x => x.trim())) rows.push(row); row = []; if (rows.length > 5000) break; }
    else cell += c;
  }
  row.push(cell); if (row.some(x => x.trim())) rows.push(row);
  return rows.map(r => r.map(x => x.trim()));
}
function parseDate(s, order) {
  s = String(s || "").trim(); if (!s) return null;
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/), y, mo, d;
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/))) { y = +m[3]; if (y < 100) y += 2000; if (order === "dmy") { d = +m[1]; mo = +m[2]; } else { mo = +m[1]; d = +m[2]; } }
  else { const t = new Date(s); if (isNaN(t)) return null; y = t.getFullYear(); mo = t.getMonth() + 1; d = t.getDate(); }
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1970 || y > 2100) return null;
  const dt = new Date(y, mo - 1, d, 12); if (dt.getMonth() !== mo - 1) return null;
  return iso(dt);
}
const parseNum = s => { const n = parseFloat(String(s || "").replace(/,/g, ".").replace(/[^\d.]/g, "")); return isFinite(n) ? n : null; };
function pickImport() {
  pickFile(".csv,text/csv,text/comma-separated-values,.txt,text/plain", f => {
    if (f.size > 3e6) { toast("That file is too big. Try a smaller export."); return; }
    const rd = new FileReader();
    rd.onload = () => { const rows = parseCSV(String(rd.result || "")); if (rows.length < 1 || Math.max(...rows.slice(0, 20).map(r => r.length)) < 2) { toast("That doesn't look like a CSV file"); return; } matchColumns(rows); };
    rd.readAsText(f);
  });
}
function matchColumns(rows) {
  const width = Math.max(...rows.slice(0, 20).map(r => r.length));
  const hasHead = rows[0].filter(x => x && parseNum(x) == null && !parseDate(x, "mdy")).length >= Math.ceil(rows[0].filter(Boolean).length / 2);
  const head = hasHead ? rows[0] : [], body = hasHead ? rows.slice(1) : rows, smp = body.slice(0, 30);
  const name = i => (head[i] && head[i].slice(0, 28)) || "Column " + (i + 1);
  const hd = re => head.findIndex(h => re.test(h));
  const score = fn => { let best = -1, bi = 0; for (let i = 0; i < width; i++) { const sc = smp.filter(r => fn(r[i] || "")).length; if (sc > best) { best = sc; bi = i; } } return bi; };
  let di = hd(/date|completed|finished/i); if (di < 0) di = score(x => !!parseDate(x, "mdy"));
  let hi = hd(/total.*h|^hours|contact|credit|cerp|ceu|^hrs/i); if (hi < 0) hi = score(x => parseNum(x) != null && parseNum(x) < 100 && !parseDate(x, "mdy"));
  let ti = hd(/title|course|activity|name|topic/i); if (ti < 0 || ti === di || ti === hi) ti = score(x => /[a-z]{4}/i.test(x) && parseNum(x) == null);
  const opt = re => hd(re);
  const pi = opt(/pharm/i), li = opt(/law|cat(egory)? ?a.*hr|ohio cat/i), ci = opt(/^category$|cerp cat|cat\b/i), pri = opt(/provider|sponsor|organi/i), idi = opt(/ce ?id|cert|certificate|activity id/i);
  const dmy = smp.some(r => { const m = String(r[di] || "").match(/^(\d{1,2})[-/.](\d{1,2})[-/.]\d{2,4}/); return m && +m[1] > 12; });
  const opts = Array.from({ length: width }, (_, i) => [i, name(i)]), none = [["-1", "Not in this file"], ...opts];
  const prev = `<div class="csvprev"><table>${head.length ? `<tr>${opts.map(o => `<th>${esc(o[1])}</th>`).join("")}</tr>` : ""}${body.slice(0, 3).map(r => `<tr>${opts.map(o => `<td>${esc((r[o[0]] || "").slice(0, 30))}</td>`).join("")}</tr>`).join("")}</table></div>`;
  openSheet("Match your columns", `<p class="muted" style="margin:-4px 0 10px">First rows of your file:</p>${prev}` +
    F.select("date", "Date finished", di, opts) + F.select("hours", "Hours", hi, opts) + F.select("title", "Course name", ti, opts) +
    F.select("provider", "Provider", pri, none) + (P.sub.pharm ? F.select("pharm", P.sub.pharm + " hours", pi, none) : "") + (P.sub.law ? F.select("law", P.subShort.law + " hours", li, none) : "") +
    (S.rules.some(r => r.caps) ? F.select("cat", P.catWord, ci, none) : "") + F.select("ceId", "Certificate or CE ID", idi, none) +
    F.seg("order", "Dates are written", dmy ? "dmy" : "mdy", [["mdy", "Month first"], ["dmy", "Day first"]]), v => {
    const col = k => v[k] == null ? -1 : +v[k]; later(() => reviewImport(body, { date: col("date"), hours: col("hours"), title: col("title"), provider: col("provider"), pharm: col("pharm"), law: col("law"), cat: col("cat"), ceId: col("ceId") }, v.order)); return "nocommit";
  }, { saveLabel: "Next", focus: false });
}
function reviewImport(body, c, order) {
  const have = new Set(S.ce.map(e => e.date + "|" + r2(e.hours) + "|" + (e.title || "").toLowerCase()));
  const items = []; let bad = 0, dup = 0;
  const g = (r, i) => i >= 0 ? (r[i] || "") : "";
  for (const r of body) {
    const date = parseDate(g(r, c.date), order), hours = parseNum(g(r, c.hours));
    if (!date || !(hours > 0)) { if (r.some(Boolean)) bad++; continue; }
    const title = g(r, c.title).replace(/\s+/g, " ").slice(0, 120) || "Course";
    const k = date + "|" + r2(hours) + "|" + title.toLowerCase();
    if (have.has(k)) { dup++; continue; } have.add(k);
    const catTxt = g(r, c.cat).toLowerCase(), catRaw = g(r, c.cat).toUpperCase().match(/\b([ABC])\b/) || (["A", "B", "C"].map(k => P.catRx[k] && P.catRx[k].test(catTxt) ? [k, k] : null).find(Boolean));
    items.push({ date, hours: r2(hours), title, provider: g(r, c.provider).slice(0, 80), pharm: Math.min(r2(parseNum(g(r, c.pharm)) || 0), hours), law: Math.min(r2(parseNum(g(r, c.law)) || 0), hours), cat: catRaw ? catRaw[1] : "", ceId: g(r, c.ceId).slice(0, 40), approved: true, proof: "", notes: "" });
    if (items.length >= 1000) break;
  }
  const skipped = [dup && pl(dup, "course already in your log", "courses already in your log"), bad && pl(bad, "row with no date or hours", "rows with no date or hours")].filter(Boolean);
  if (!items.length) { openSheet("Nothing new to import", `<p class="muted" style="font-size:.92rem;margin:0 0 14px">${skipped.length ? "Skipped " + esc(skipped.join(", ")) + "." : "No courses were found."} Try matching the columns again.</p>`, null, { noSave: true, cancelLabel: "OK", focus: false }); return; }
  items.sort((a, b) => a.date.localeCompare(b.date));
  const rules = S.rules.filter(r => !r.manual), total = sum(items, x => x.hours);
  const html = `<p class="muted" style="font-size:.92rem;margin:-4px 0 12px"><b style="color:var(--ink)">${items.length} courses, ${hrs(total)} hrs</b>, ${longD(items[0].date)} to ${longD(items[items.length - 1].date)}.${skipped.length ? " Skipped " + esc(skipped.join(", ")) + "." : ""}</p>
    ${rules.length ? `<div class="box"><div class="flabel">Count them toward</div><div class="checks one">${rules.map(r => `<label><input type="checkbox" data-imp="${esc(r.id)}" checked><span>${esc(r.name)}<small>Only courses dated ${short(D(r.start))} ${D(r.start).getFullYear()} to ${short(D(r.end))} ${D(r.end).getFullYear()} count${r.group ? ". Hours are split with " + esc(groupRules(r.group).filter(x => x !== r).map(x => x.name).join(", ")) + " using the suggestion" : ""}.</small></span></label>`).join("")}</div></div>` : ""}
    <div class="list">${items.slice(0, 40).map(x => `<div class="li"><span class="tx"><b>${esc(x.title)}</b><small>${esc([x.provider, longD(x.date)].filter(Boolean).join(" · "))}${x.pharm ? " · " + P.subShort.pharm + " " + hrs(x.pharm) : ""}${x.cat ? " · " + esc(CATS(x.cat)) : ""}</small></span><span class="amt num">${hrs(x.hours)}</span></div>`).join("")}${items.length > 40 ? `<div class="note" style="padding:8px 14px">and ${items.length - 40} more</div>` : ""}</div>`;
  openSheet("Check and import", html, () => {
    const pick = [...document.querySelectorAll("#sheetForm [data-imp]")].filter(x => x.checked).map(x => x.dataset.imp);
    const snap = JSON.stringify(S);
    items.forEach(x => {
      const e = Object.assign({ id: uid(), applies: pick.filter(id => inWin(ruleOf(id), x.date)), alloc: {} }, x);
      S.ce.push(e);
      const groups = {}; e.applies.forEach(id => { const r = ruleOf(id); if (r.group) (groups[r.group] = groups[r.group] || []).push(id); });
      Object.values(groups).forEach(ids => { if (ids.length > 1) Object.assign(e.alloc, suggestSplit(e.hours, e.pharm, e.law, ids, e.id)); });
    });
    S.sample = false;
    later(() => { go("ce"); toast(`Imported ${items.length} courses`, () => { S = JSON.parse(snap); commit("Import undone"); }); });
  }, { saveLabel: `Import ${items.length}`, focus: false });
}

/* ---------- calendar file with alerts at each reminder window ---------- */
function icsEscape(s) { return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
function icsFold(line) { const out = []; while (line.length > 74) { out.push(line.slice(0, 74)); line = " " + line.slice(74); } out.push(line); return out.join("\r\n"); }
function calendarFile() {
  const ev = events().filter(e => inDays(e.date) >= 0 && e.kind !== "todo");
  if (!ev.length) { toast("No upcoming dates to add yet"); return; }
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CyberHub Software//Credentials Tracker//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Credentials"];
  ev.forEach(e => {
    const d = e.date.replace(/-/g, ""), nx = iso(addDays(D(e.date), 1)).replace(/-/g, "");
    lines.push("BEGIN:VEVENT", "UID:" + e.ref + "-" + e.kind + "@credentials.cyberhubsoftware.com", "DTSTAMP:" + stamp, "DTSTART;VALUE=DATE:" + d, "DTEND;VALUE=DATE:" + nx,
      "SUMMARY:" + icsEscape(e.title), "DESCRIPTION:" + icsEscape((e.sub ? e.sub + ". " : "") + "From your Credentials Tracker. Check the date with your board."), "TRANSP:TRANSPARENT");
    if (e.kind !== "renewOpens") S.settings.windows.forEach(w => { if (inDays(e.date) >= w) lines.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEscape(e.title + " in " + w + " days"), "TRIGGER:-P" + (w - 1) + "DT15H", "END:VALARM"); });
    lines.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEscape(e.title), "TRIGGER:PT9H", "END:VALARM", "END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  const data = lines.map(icsFold).join("\r\n");
  openSheet("Add deadlines to Calendar", `<p class="muted" style="font-size:.92rem;margin:0 0 10px">${ev.length} dates, each with alerts ${esc(S.settings.windows.join(", "))} days before and on the day at 9 AM.</p>${PREVIEW_ICS_NOTE}
    <ol class="steps" style="padding-left:22px"><li>Tap <b>Save calendar file</b>.</li><li>Open the file and tap <b>Add All</b>.</li><li>If you add it again later, your phone may show the old dates twice. Delete the old ones first.</li></ol>`, () => {
    (async () => {
      try {
        const blob = new Blob([data], { type: "text/calendar" }), file = typeof File === "function" ? new File([blob], "credentials-deadlines.ics", { type: "text/calendar" }) : null;
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "Credential deadlines" }); toast("Calendar file ready"); return; }
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "credentials-deadlines.ics"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); toast("Calendar file saved");
      } catch (e) { if (e && e.name === "AbortError") toast("Canceled"); else toast("Couldn't save the calendar file here"); }
    })();
    return "nocommit";
  }, { saveLabel: "Save calendar file", focus: false });
}

/* ---------- PDFs (packet and audit), drawn on the device ---------- */
let jsPDFp = null;
/* PDF tools: the copy in the app's lib folder first (works offline), then the same file from cdnjs,
   checked against its fingerprint so a changed file never runs. */
function loadLib(file, cdnPath, sri, ready) {
  if (ready()) return Promise.resolve(ready());
  const tries = [["lib/" + file], ["https://cdnjs.cloudflare.com/ajax/libs/" + cdnPath + "/" + file, sri]];
  return new Promise((res, rej) => {
    const next = i => {
      if (i >= tries.length) { rej(new Error("load failed")); return; }
      const [src, integrity] = tries[i], s = document.createElement("script");
      s.src = src; if (integrity) { s.integrity = integrity; s.crossOrigin = "anonymous"; }
      s.onload = () => ready() ? res(ready()) : next(i + 1);
      s.onerror = () => { s.remove(); next(i + 1); };
      document.head.appendChild(s);
    };
    next(0);
  });
}
function loadPDF() {
  if (window.jspdf) return Promise.resolve(window.jspdf.jsPDF);
  return jsPDFp || (jsPDFp = loadLib("jspdf.umd.min.js", "jspdf/2.5.1", "sha512-qZvrmS2ekKPF2mSznTQsxqPgnpkI4DNTlrdUmTzrDgektczlKNRRhy5X5AAOnx5S09ydFYWWNSfcEqDTTHgtNA==", () => window.jspdf && window.jspdf.jsPDF).catch(e => { jsPDFp = null; throw e; }));
}
const pdfText = s => String(s == null ? "" : s).replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\u2014|\u2013/g, "-").replace(/\u203A/g, ">").replace(/[^\x20-\x7E\u00A0-\u00FF\u2022\u2026]/g, "");
function pdfKit(doc) {
  const M = 48, W = 612 - M * 2, H = 792; let y = M;
  const navy = [36, 48, 77], green = [79, 138, 101], grey = [107, 117, 145], amber = [183, 121, 31];
  const k = {
    doc, M, W, get y() { return y; }, set y(v) { y = v; },
    room(h) { if (y + h > H - M - 20) { doc.addPage(); y = M; return true; } return false; },
    title(t, sub) { doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(...navy); doc.text(pdfText(t), M, y + 18); y += 30; if (sub) { doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(...grey); doc.splitTextToSize(pdfText(sub), W).forEach(l => { doc.text(l, M, y + 10); y += 14; }); } y += 8; },
    band(t, right) { k.room(60); doc.setFillColor(241, 244, 250); doc.roundedRect(M, y, W, 24, 5, 5, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...green); doc.text(pdfText(t).toUpperCase(), M + 10, y + 16); if (right) { doc.setTextColor(...grey); doc.text(pdfText(right), M + W - 10, y + 16, { align: "right" }); } y += 32; },
    row(name, lines, right, warn) {
      doc.setFontSize(10); const wrapped = []; lines.filter(Boolean).forEach(l => wrapped.push(...doc.splitTextToSize(pdfText(l), W - 140)));
      const h = 16 + wrapped.length * 13 + 6; k.room(h);
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...navy); doc.text(doc.splitTextToSize(pdfText(name), W - 140)[0], M + 4, y + 12);
      if (right) { doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...(warn ? amber : green)); doc.text(pdfText(right), M + W - 4, y + 12, { align: "right" }); }
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(70, 78, 98); wrapped.forEach((l, i) => doc.text(l, M + 4, y + 26 + i * 13));
      y += h; doc.setDrawColor(224, 229, 238); doc.line(M, y - 3, M + W, y - 3); y += 3;
    },
    empty(t) { k.room(20); doc.setFont("helvetica", "italic"); doc.setFontSize(9.5); doc.setTextColor(...grey); doc.text(pdfText(t), M + 4, y + 10); y += 22; },
    table(cols, rows, totals) {
      const draw = (cells, bold, fill) => { const h = 18; if (k.room(h + 4)) head(); if (fill) { doc.setFillColor(...fill); doc.rect(M, y, W, h, "F"); }
        doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(8.8); doc.setTextColor(...(bold ? navy : [60, 66, 84]));
        let x = M + 4; cells.forEach((c, i) => { const col = cols[i]; const t = doc.splitTextToSize(pdfText(c), col.w - 6)[0] || ""; doc.text(t, col.right ? x + col.w - 8 : x, y + 12, col.right ? { align: "right" } : undefined); x += col.w; });
        y += h; };
      const head = () => draw(cols.map(c => c.t), true, [241, 244, 250]);
      head(); rows.forEach((r, i) => draw(r, false, i % 2 ? [249, 250, 253] : null)); if (totals) draw(totals, true, [228, 235, 245]); y += 10;
    },
    footer(label) { const n = doc.getNumberOfPages(); for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...grey); doc.text(pdfText(label), M, H - 26); doc.text("Page " + i + " of " + n, M + W, H - 26, { align: "right" }); } }
  };
  return k;
}
function packetSheet() {
  openSheet(esc(P.packet.name), `<p class="lead" style="margin-top:-2px">A clean PDF of your ${esc(P.sections.map(x => x.label.toLowerCase()).join(", "))} and ${P.ce} totals for the current cycle.</p>` +
    F.check("ids", "Include full private numbers", false, P.packet.idHint) +
    (S.practice.length ? F.check("prac", "Include " + P.practice.title.toLowerCase(), true) : ""), v => { makePacket(v.ids, v.prac); return "nocommit"; }, { saveLabel: "Make the PDF", focus: false });
}
async function makePacket(fullIds, prac) {
  toast("Making your PDF…");
  let JsPDF; try { JsPDF = await loadPDF(); } catch (e) { toast("Couldn't load the PDF maker. Check your connection."); return; }
  const doc = new JsPDF({ unit: "pt", format: "letter" }), k = pdfKit(doc);
  k.title((S.profile.name || "Credentials") + " · Credentials", [S.profile.role, S.profile.states].filter(Boolean).join(" · ") + `\nPrepared ${longD(iso(TODAY))} from records the holder entered. Verify each item with its issuing board or organization.`);
  P.sections.forEach(sec => {
    const items = S.creds.filter(c => c.kind === sec.kind); k.band(sec.label, items.length + "");
    if (!items.length) { k.empty("None listed"); return; }
    items.forEach(c => {
      const num = c.numStore === "onfile" ? "On file" : !c.number ? "" : c.numStore === "last4" ? "On file …" + String(c.number).slice(-4) : SENSITIVE(c) && !fullIds ? "…" + String(c.number).slice(-4) : c.number;
      const s = credStatus(c), lines = [
        [c.kind === "license" ? c.issuer : c.kind === "life" ? c.issuer : c.kind === "mal" ? c.limits && "Limits " + c.limits : c.kind === "priv" ? c.privStatus && "Status: " + c.privStatus : "", num && "Number: " + num].filter(Boolean).join("   ·   "),
        [c.issued && FLABEL(c.kind, "issued", "Issued") + " " + longD(c.issued), c.expires && (SECT(c.kind).dateWord || "Expires") + " " + longD(c.expires), c.renewDue && FLABEL(c.kind, "renewDue", "Renewal due") + " " + longD(c.renewDue), c.reappt && FLABEL(c.kind, "reappt", "Reappointment") + " " + longD(c.reappt), c.docsDue && FLABEL(c.kind, "docsDue", "Documents due") + " " + longD(c.docsDue)].filter(Boolean).join("   ·   "),
        c.recert && "Recertify by: " + c.recert];
      k.row(credFullName(c), lines, s.label.replace("*", ""), s.s === "expired" || s.s === "attention");
    });
  });
  const ar = activeRules();
  k.band(P.ce + " totals, current cycle", ar.length + "");
  if (!ar.length) k.empty("No requirements listed");
  ar.forEach(r => { const p = prog(r); const subs = Object.entries(r.subs || {}).filter(([, v]) => v).map(([kk, v]) => `${P.sub[kk]} ${hrs(p.sub[kk])} of ${hrs(v)}`); if (r.caps) ["A", "B", "C"].forEach(c => { if (r.caps[c]) subs.push(`${CATN(c)} ${hrs(p.cat[c])} (needs ${r.elective ? "at least " + r.caps[c][0] : r.caps[c][0] + " to " + r.caps[c][1]})`); });
    k.row(r.name, [`${longD(r.start)} to ${longD(r.end)}`, r.manual ? "Met (self-reported): " + (r.manual.note || "") : `${hrs(p.total)} of ${hrs(r.target)} hours logged`, subs.join("   ·   ")], p.label, p.status === "closed" || p.status === "notstarted"); });
  if (prac && S.practice.length) { k.band(P.practice.title); S.practice.forEach(p => k.row(p.name, [`${hrs(p.logged)} of ${hrs(p.target)} hours${p.recentTarget ? ` · last 12 months ${hrs(p.recent)} of ${hrs(p.recentTarget)}` : ""}`, p.note], p.met || p.logged >= p.target ? "Met" : "In progress", false)); }
  k.footer(P.packet.name + " · " + (S.profile.name || "") + " · " + longD(iso(TODAY)));
  if (await saveFile("credentials-packet-" + iso(TODAY) + ".pdf", doc.output("arraybuffer"), "application/pdf", "Credentials packet")) toast("Packet saved");
}
function auditSheet() {
  const rules = S.rules.filter(r => !r.manual);
  openSheet("Audit packet", `<p class="lead" style="margin-top:-2px">Every course in one clean PDF, with hours by kind and category and your certificate photos. Handy if a board audits you.</p>` +
    F.select("rule", "Which courses", rules[0] ? rules[0].id : "all", [["all", "All courses"], ...rules.map(r => [r.id, r.name + " (" + short(D(r.start)) + " " + D(r.start).getFullYear() + " to " + short(D(r.end)) + " " + D(r.end).getFullYear() + ")"])]) +
    F.check("photos", "Add certificate photos", true), v => { makeAudit(v.rule, v.photos); return "nocommit"; }, { saveLabel: "Make the PDF", focus: false });
}
async function makeAudit(ruleId, withPhotos) {
  toast("Making your PDF…");
  let JsPDF; try { JsPDF = await loadPDF(); } catch (e) { toast("Couldn't load the PDF maker. Check your connection."); return; }
  const r = ruleOf(ruleId), list = (r ? S.ce.filter(e => credit(e, r) > 0) : S.ce.slice()).sort((a, b) => a.date.localeCompare(b.date));
  const doc = new JsPDF({ unit: "pt", format: "letter" }), k = pdfKit(doc);
  k.title(r ? r.name + " · " + P.ce + " record" : "All " + P.ce + " courses", `${S.profile.name || ""}${S.profile.role ? " · " + S.profile.role : ""}\n${r ? longD(r.start) + " to " + longD(r.end) + " · " : ""}${list.length} courses · prepared ${longD(iso(TODAY))}`);
  if (r) { const p = prog(r); const subs = Object.entries(r.subs || {}).filter(([, v]) => v).map(([kk, v]) => `${P.sub[kk]} ${hrs(p.sub[kk])} of ${hrs(v)}`); if (r.caps) ["A", "B", "C"].forEach(c => { if (r.caps[c]) subs.push(`${CATN(c)}: ${hrs(p.cat[c])}`); });
    k.band("Summary"); k.row(`${hrs(p.total)} of ${hrs(r.target)} hours`, [subs.join("   ·   "), r.group ? "Hours shown are the share counted for this requirement. The same hour isn't counted toward " + groupRules(r.group).filter(x => x !== r).map(x => x.name).join(", ") + "." : ""], p.label, !p.met); }
  k.band("Courses", list.length + "");
  const hasCat = S.rules.some(x => x.caps);
  const subK = SUBS_ON(), spare = (2 - subK.length) * 37;
  const cols = [{ t: "Date", w: 66 }, { t: "Course", w: (hasCat ? 156 : 206) + spare }, { t: "Provider", w: 110 }, { t: "Hours", w: 44, right: true }, ...subK.map(kk => ({ t: P.subShort[kk], w: 37, right: true }))];
  if (hasCat) cols.push({ t: P.cats.A ? "Topic" : "Cat", w: 50 });
  cols.push({ t: "Cert", w: 16 });
  const used = list.map(e => r ? credit(e, r) : e.hours);
  const rows = list.map((e, i) => { const x = [longD(e.date).replace(/, (\d{4})$/, " $1"), e.title, e.provider || "", hrs(used[i]), ...subK.map(kk => e[kk] ? hrs(Math.min(e[kk], used[i])) : "")]; if (hasCat) x.push(e.cat ? CATS(e.cat) : ""); x.push(e.photo ? "Yes" : ""); return x; });
  const tot = ["", "Total", "", hrs(sum(used)), ...subK.map(kk => hrs(sum(list.map((e, i) => Math.min(e[kk] || 0, used[i])))))]; if (hasCat) tot.push(""); tot.push("");
  if (list.length) k.table(cols, rows, tot); else k.empty("No courses in this window");
  if (withPhotos) {
    const shots = []; for (const e of list) if (e.photo) { const u = await IMG.get(e.photo); if (u) shots.push([e, u]); }
    if (shots.length) { doc.addPage(); k.y = k.M; k.band("Certificates", shots.length + "");
      for (const [e, u] of shots) {
        const im = await new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = u; }); if (!im) continue;
        const maxW = k.W, maxH = 300, sc = Math.min(maxW / im.width, maxH / im.height), w = im.width * sc, h = im.height * sc;
        k.room(h + 40); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(36, 48, 77); doc.text(pdfText(e.title + " · " + longD(e.date) + " · " + hrs(e.hours) + " hrs"), k.M, k.y + 12);
        try { doc.addImage(u, "JPEG", k.M, k.y + 20, w, h); } catch (err) {}
        k.y = k.y + h + 36;
      } }
  }
  k.footer(P.ce + " record · " + (S.profile.name || "") + " · " + longD(iso(TODAY)));
  if (await saveFile(P.ce.toLowerCase() + "-audit-" + iso(TODAY) + ".pdf", doc.output("arraybuffer"), "application/pdf", P.ce + " audit packet")) toast("Audit packet saved");
}

/* ---------- document vault: resumes, cards, diplomas. Files stay in the on-device database next to the
   certificate photos (key "doc:" + id) and ride along in backups. ---------- */
const DOC_TAGS_ALL = () => P.docTags;
const THUMB = Object.create(null);
const docKind = d => /pdf/.test(d.type) ? "pdf" : /^image\//.test(d.type) ? "image" : "file";
const docExt = d => docKind(d) === "pdf" ? "pdf" : docKind(d) === "image" ? "jpg" : (d.ext || "docx");
const fmtSize = b => b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB";
const FILE_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" style="fill:none;stroke:currentColor;stroke-width:1.7;stroke-linejoin:round"/><path d="M14 3v5h5" style="fill:none;stroke:currentColor;stroke-width:1.7;stroke-linejoin:round"/></svg>`;
function dataBytes(u) { const b = atob(String(u).split(",")[1] || ""), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
function docThumb(d) {
  if (docKind(d) === "image") return `<img alt="" data-doc="${esc(d.id)}" ${THUMB[d.id] ? `src="${esc(THUMB[d.id])}"` : ""}>`;
  return `<span class="ft">${FILE_SVG}${esc(docExt(d).toUpperCase())}</span>`;
}
function loadThumbs(scope) { scope.querySelectorAll("img[data-doc]:not([src])").forEach(im => IMG.get("doc:" + im.dataset.doc).then(u => { if (u) { THUMB[im.dataset.doc] = u; im.src = u; } })); }
function renderVault() {
  const box = $("#vaultBox"); if (!box) return;
  const docs = (S.docs || []).slice().sort((a, b) => String(b.added).localeCompare(String(a.added)));
  box.innerHTML = `<div class="group-h"><h2>Documents</h2>${docs.length ? `<span class="tot num">${docs.length}</span>` : ""}</div>
    <div class="vault">${docs.map(d => { const c = d.credId && S.creds.find(x => x.id === d.credId);
      return `<button class="doc press" data-act="doc-open" data-id="${esc(d.id)}"><span class="th">${docThumb(d)}<span class="tagb">${esc(d.tag || "Other")}</span></span><b>${esc(d.name)}</b><small>${c ? esc(credFullName(c)) : fmtSize(d.size || 0)}</small></button>`; }).join("")}
      <button class="doc addd press" data-act="doc-add"><span class="th"><span>${ICON.plus}Add a file</span></span><b>&nbsp;</b></button></div>
    ${docs.length ? `<div class="btnrow" style="margin-top:12px"><button class="btn primary press" data-act="doc-bundle">Send or print several</button></div>` : ""}
    <div class="note">${esc(P.vaultNote)}</div>`;
  loadThumbs(box);
}
/* pick first (the file chooser has to open right on the tap), then name it */
function addDoc(credId) {
  pickFile("image/*,application/pdf,.pdf,.docx,.doc", async f => {
    if (f.size > 25e6) { toast("That file is over 25 MB. Try a smaller copy."); return; }
    if (/svg/i.test(f.type) || /\.svg$/i.test(f.name || "")) { toast("SVG files can't be saved here. Save it as a PDF or a photo first."); return; }
    let url;
    try {
      if (/^image\//.test(f.type)) url = await shrinkImage(f);
      else url = await new Promise((res, rej) => { const rd = new FileReader(); rd.onload = () => res(rd.result); rd.onerror = rej; rd.readAsDataURL(f); });
    } catch (e) { toast("Couldn't read that file"); return; }
    if (!dataUrlOk(url, DOC_TYPES)) { toast("That kind of file can't be saved here. Try a PDF, Word file or photo."); return; }
    const isImg = /^data:image\//.test(url), base = String(f.name || "").replace(/\.[a-z0-9]+$/i, "");
    const d = { id: uid(), name: isImg && /^(image|img|photo|IMG_?\d*)$/i.test(base) ? "" : base.slice(0, 60), type: isImg ? "image/jpeg" : url.slice(5, url.indexOf(";")).toLowerCase(), ext: (String(f.name).match(/\.([a-z0-9]+)$/i) || [])[1], size: Math.round(url.length * .75), added: iso(TODAY), credId: credId || "", tag: "" };
    THUMB[d.id] = isImg ? url : null;
    if (sheetClose) sheetClose(true);
    docForm(d, url, true);
  });
}
function guessTag(name) { const t = String(name).toLowerCase(); return /resume|cv\b/.test(t) ? "Resume or CV" : /\bbls\b/.test(t) ? "BLS card" : /\bacls\b/.test(t) ? "ACLS card" : /\bpals\b/.test(t) ? "PALS card" : /diploma|transcript/.test(t) ? "Diploma or transcript" : /immun|vaccin|tb\b|titer/.test(t) ? "Immunizations" : /licen/.test(t) ? "License" : /cert/.test(t) ? "Certification" : ""; }
function docForm(d, url, isNew) {
  const creds = S.creds.filter(c => !c.setup || true);
  const prev = docKind(d) === "image" ? `<img alt="" src="${esc(THUMB[d.id] || url || "")}" id="docImg">` : `<span class="ft">${FILE_SVG}${esc(docExt(d).toUpperCase())} · ${fmtSize(d.size || 0)}</span>`;
  const html = `<div class="docprev">${prev}</div>
    ${F.text("name", "Name", d.name, "My resume, BLS card…")}
    ${F.select("tag", "Kind", d.tag || guessTag(d.name) || "Other", (() => { const t = d.tag || guessTag(d.name); return DOC_TAGS_ALL().concat(t && !DOC_TAGS_ALL().includes(t) ? [t] : []); })())}
    ${F.select("credId", "Goes with", d.credId, [["", "Nothing in particular"], ...creds.map(c => [c.id, credFullName(c)])], "Shows a paperclip on that card.")}
    ${isNew ? "" : `<div class="btnrow" style="margin:4px 0 6px"><button type="button" class="btn ghost press" id="docShare">Share, save or print</button></div>`}`;
  const form = openSheet(isNew ? "Add to your documents" : esc(d.name || "Document"), html, v => {
    if (!v.name) return "Give it a name so you can find it.";
    Object.assign(d, { name: v.name.slice(0, 80), tag: v.tag, credId: v.credId });
    if (isNew) { S.docs.push(d); IMG.put("doc:" + d.id, url); toast("Saved to your documents"); } else toast("Saved");
  }, { onDelete: isNew ? null : () => { S.docs = S.docs.filter(x => x !== d); IMG.del("doc:" + d.id); delete THUMB[d.id]; return "Document deleted"; }, focus: false });
  if (!isNew && docKind(d) === "image" && !THUMB[d.id]) IMG.get("doc:" + d.id).then(u => { const im = form.querySelector("#docImg"); if (u && im) { THUMB[d.id] = u; im.src = u; } });
  const sh = form.querySelector("#docShare");
  if (sh) sh.onclick = () => shareDoc(d);
  if (isNew) { const nm = form.querySelector("#f_name"); nm.addEventListener("input", () => { const g = guessTag(nm.value); if (g) form.querySelector("#f_tag").value = g; }); }
}
async function shareDoc(d) {
  const u = await IMG.get("doc:" + d.id); if (!u) { toast("Couldn't find that file on this phone"); return; }
  const name = (d.name || "document").replace(/[\\/:*?"<>|]+/g, " ").trim() + "." + docExt(d);
  saveFile(name, new Blob([dataBytes(u)], { type: d.type }), d.type, d.name);
}
let pdfLibP = null;
function loadPdfLib() { return pdfLibP || (pdfLibP = loadLib("pdf-lib.min.js", "pdf-lib/1.17.1", "sha512-z8IYLHO8bTgFqj+yrPyIJnzBDf7DDhWwiEsk4sY+Oe6J2M+WQequeGS7qioI5vT6rXgVRb4K1UVQC5ER7MKzKQ==", () => window.PDFLib).catch(e => { pdfLibP = null; throw e; })); }
function bundleSheet() {
  const docs = (S.docs || []).filter(d => docKind(d) !== "file"), others = (S.docs || []).length - docs.length;
  if (!docs.length) { toast("Add a photo or PDF first"); return; }
  const html = `${F.check("cover", "Start with a summary page", true, "Your name, role and each credential with its dates.")}
    <div class="pickl">${docs.map(d => `<label><input type="checkbox" data-pick="${esc(d.id)}" checked>${docKind(d) === "image" ? `<img alt="" data-doc="${esc(d.id)}" ${THUMB[d.id] ? `src="${esc(THUMB[d.id])}"` : ""}>` : `<span class="pth">${FILE_SVG}</span>`}<span>${esc(d.name)}<small>${esc(d.tag || "Other")}</small></span></label>`).join("")}</div>
    ${others ? `<p class="muted" style="margin:0 0 8px;font-size:.82rem">${others} Word ${others === 1 ? "file" : "files"} can't go in a PDF. Share ${others === 1 ? "it" : "them"} on ${others === 1 ? "its" : "their"} own.</p>` : ""}`;
  const form = openSheet("Send or print several", html, v => {
    const ids = [...document.querySelectorAll("#sheetForm [data-pick]")].filter(x => x.checked).map(x => x.dataset.pick);
    if (!ids.length && !v.cover) return "Pick at least one.";
    makeBundle(ids, v.cover); return "nocommit";
  }, { lead: "Makes one PDF you can email, text, save to Files or print from the share sheet.", saveLabel: "Make one PDF", focus: false });
  loadThumbs(form);
}
async function makeBundle(ids, cover) {
  toast("Making your PDF…");
  let L; try { L = await loadPdfLib(); } catch (e) { toast("Couldn't load the PDF maker. Check your connection."); return; }
  const out = await L.PDFDocument.create(), font = await out.embedFont(L.StandardFonts.Helvetica), bold = await out.embedFont(L.StandardFonts.HelveticaBold);
  const W = 612, H = 792, M = 54, navy = L.rgb(.14, .19, .3), grey = L.rgb(.42, .46, .57);
  let skipped = 0;
  if (cover) {
    let pg = out.addPage([W, H]), y = H - M;
    const line = (t, f, size, col, x) => { if (y < M + 20) { pg = out.addPage([W, H]); y = H - M; } pg.drawText(pdfText(t).slice(0, 95), { x: x || M, y, size, font: f, color: col || navy }); y -= size + 7; };
    line(S.profile.name || "Credentials", bold, 22); line([S.profile.role, S.profile.states].filter(Boolean).join(" · ") || " ", font, 11, grey); line("Prepared " + longD(iso(TODAY)), font, 10, grey); y -= 10;
    P.sections.forEach(sec => { const items = S.creds.filter(c => c.kind === sec.kind && !c.setup); if (!items.length) return; y -= 6; line(sec.label.toUpperCase(), bold, 10, grey);
      items.forEach(c => { const [dl, d] = CARD_DATE(c); line(credFullName(c), bold, 12); line([c.kind === "id" || SENSITIVE(c) ? "" : (c.number ? "No. " + c.number : ""), d ? dl + " " + longD(d) : ""].filter(Boolean).join("   ·   ") || " ", font, 10, grey); }); });
  }
  for (const id of ids) {
    const d = S.docs.find(x => x.id === id), u = d && await IMG.get("doc:" + id); if (!u) { skipped++; continue; }
    try {
      if (docKind(d) === "pdf") { const src = await L.PDFDocument.load(dataBytes(u), { ignoreEncryption: true }); const pages = await out.copyPages(src, src.getPageIndices()); pages.forEach(p => out.addPage(p)); }
      else { const im = await out.embedJpg(dataBytes(u)), pg = out.addPage([W, H]); pg.drawText(pdfText(d.name).slice(0, 80), { x: M, y: H - M, size: 12, font: bold, color: navy });
        const sc = Math.min((W - 2 * M) / im.width, (H - 2 * M - 30) / im.height, 1.5), w = im.width * sc, h = im.height * sc; pg.drawImage(im, { x: (W - w) / 2, y: H - M - 24 - h, width: w, height: h }); }
    } catch (e) { skipped++; }
  }
  if (!out.getPageCount()) { toast("Nothing could go in the PDF"); return; }
  const bytes = await out.save();
  if (await saveFile("documents-" + iso(TODAY) + ".pdf", new Blob([bytes], { type: "application/pdf" }), "application/pdf", "Documents")) toast(skipped ? `PDF saved. ${skipped} ${skipped === 1 ? "file" : "files"} couldn't be added.` : "PDF saved");
}
