
/* ---------- the smart type box: plain words in, a course to confirm or an answer out.
   It runs on the phone with simple word matching. Nothing is sent anywhere. ---------- */
const STOP = new Set("a an the my of for to in on at and or is are was be do does did i me how many much what when which where who will can hours hrs hour hr ce cme ceu credits credit course courses class log logged add done finished took complete completed just today yesterday need needed left still renew renewal expire expires expiring due by about with from via this that it its".split(" "));
const words = s => String(s || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const KIND_WORDS = () => P.kindWords || {};
function matchScore(qw, text) { const tw = new Set(words(text).filter(w => !STOP.has(w))); return qw.filter(w => tw.has(w)).length; }
function bestRules(q) {
  const qw = words(q).filter(w => !STOP.has(w)); if (!qw.length) return [];
  const sc = S.rules.map(r => { const c = credOf(r); return [r, matchScore(qw, r.name + " " + (c ? credFullName(c) + " " + (c.issuer || "") : ""))]; }).filter(x => x[1] > 0);
  const top = Math.max(0, ...sc.map(x => x[1])); return sc.filter(x => x[1] === top).map(x => x[0]);
}
function bestCreds(q) {
  const qw = words(q).filter(w => !STOP.has(w)), t = q.toLowerCase();
  const sc = S.creds.map(c => [c, matchScore(qw, credFullName(c) + " " + (c.issuer || "") + " " + (c.title || "") + " " + (c.lifeType || "") + " " + (c.idKind || "")) + (KIND_WORDS()[c.kind] && KIND_WORDS()[c.kind].test(t) ? .5 : 0)]).filter(x => x[1] > 0);
  const top = Math.max(0, ...sc.map(x => x[1])); return sc.filter(x => x[1] === top).map(x => x[0]);
}
function findDate(t) {
  if (/\byesterday\b/.test(t)) return T(-1);
  if (/\btoday\b|\bthis morning\b|\btonight\b/.test(t)) return iso(TODAY);
  const wd = t.match(/\b(?:last |on )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (wd) { const i = WD.map(x => x.toLowerCase()).indexOf(wd[1]); let n = (TODAY.getDay() - i + 7) % 7; if (n === 0) n = 7; return T(-n); }
  const ago = t.match(/\b(\d+|a|one|two|three) (day|week)s? ago\b/);
  if (ago) { const n = { a: 1, one: 1, two: 2, three: 3 }[ago[1]] || +ago[1]; return T(-n * (ago[2] === "week" ? 7 : 1)); }
  const md = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.? (\d{1,2})(?:,? (\d{4}))?\b/);
  if (md) { const m = MON.map(x => x.toLowerCase()).indexOf(md[1].slice(0, 3)); let y = md[3] ? +md[3] : TODAY.getFullYear(); let dt = new Date(y, m, +md[2], 12); if (!md[3] && dt > TODAY) dt = new Date(y - 1, m, +md[2], 12); return iso(dt); }
  const sl = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (sl) { let y = sl[3] ? +sl[3] : TODAY.getFullYear(); if (y < 100) y += 2000; let dt = new Date(y, +sl[1] - 1, +sl[2], 12); if (!sl[3] && dt > TODAY) dt = new Date(y - 1, +sl[1] - 1, +sl[2], 12); if (dt.getMonth() === +sl[1] - 1) return iso(dt); }
  return null;
}
const NUMW = { half: .5, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12 };
function understandLog(raw) {
  let t = " " + raw.toLowerCase().replace(/[“”]/g, '"') + " ";
  t = t.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|twelve) and a half\b/g, (m, w) => String(NUMW[w] + .5)).replace(/\b(an|one|a) hour and a half\b/g, "1.5 hours").replace(/\bhalf an hour\b/g, "0.5 hours").replace(/\ban hour\b/g, "1 hour")
    .replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|twelve)\b(?= ?(h|hr|hrs|hour|hours|contact|ce|cme|cerps?|credits?|pd|cle|cpe)\b)/g, w => NUMW[w]);
  const hm = t.match(/(\d+(?:\.\d+)?)\s*(?:h\b|hrs?\b|hours?\b|contact hours?|ce\b|cme\b|ceus?\b|cerps?\b|credits?\b|pd\b|cle\b|cpe\b)/) || t.match(/\b(?:did|took|finished|completed|log|logged)\s+(\d+(?:\.\d+)?)\b/);
  if (!hm) return null;
  const hours = r2(+hm[1]);
  if (!(hours > 0 && hours < 200)) return null;
  const out = { hours, date: findDate(t) || iso(TODAY), pharm: 0, law: 0, cat: "", title: "", provider: "" };
  const rx1 = P.sub.pharm && P.subRx.pharm, rx2 = P.sub.law && P.subRx.law;
  if (rx1 && rx1.test(t)) { const phm = P.id === "nursing" ? t.match(/(\d+(?:\.\d+)?)\s*(?:hrs?|hours?)?\s*(?:of\s+)?(?:advanced\s+)?pharm/) : null; out.pharm = phm && +phm[1] <= hours && phm.index !== hm.index ? r2(+phm[1]) : hours; }
  if (rx2 && rx2.test(t)) out.law = hours;
  const cm = t.match(/\bcat(?:egory)?\.?\s*([abc])\b(?! law)/); if (cm && !out.law) out.cat = cm[1].toUpperCase();
  if (!out.cat) ["A", "B", "C"].some(k => P.catRx[k] && P.catRx[k].test(t) && (out.cat = k));
  const qt = raw.match(/["“]([^"”]{3,})["”]/);
  const R0 = " " + raw + " ", keepCase = s => s === s.toLowerCase() ? s.replace(/\b\w/g, c => c.toUpperCase()) : s;
  const pv = R0.match(/\b(?:from|via|through|by|with)\s+([a-z0-9][a-z0-9 &.'-]{1,40}?)(?=\s+(?:on|yesterday|today|last|for|about|counts?|toward)\b|\s*[,.]|\s*$)/i);
  if (pv && !/^\d/.test(pv[1])) out.provider = keepCase(pv[1].trim());
  const tp = R0.match(/\b(?:on|about|course on|class on|called|titled)\s+([a-z][a-z0-9 &'/-]{2,60}?)(?=\s+(?:from|via|through|yesterday|today|last|on|counts?|toward|for|cat|category)\b|\s*[.,]|\s*$)/i);
  if (qt) out.title = qt[1].trim();
  else if (tp && !findDate(" " + tp[1].toLowerCase() + " ") && !/^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i.test(tp[1])) out.title = tp[1].trim().replace(/^\w/, c => c.toUpperCase());
  else out.title = out.cat && P.cats[out.cat] ? P.cats[out.cat] : out.pharm ? P.sub.pharm + " " + P.ce : out.law ? P.sub.law + " " + P.ce : P.ce + " course";
  // which requirements: named ones, else every requirement whose dates include the course
  const named = S.rules.filter(r => !r.manual && matchScore(words(t).filter(w => !STOP.has(w) && !/^pharm|^law$|^rules$|^ethics$|^code$/.test(w)), r.name + " " + (credOf(r) ? credFullName(credOf(r)) : "")) > 0);
  out.applies = (named.length ? named : S.rules.filter(r => !r.manual)).filter(r => inWin(r, out.date)).map(r => r.id);
  out.named = named.length > 0;
  return out;
}
/* "ACLS expires March 2027": a date for a card you have, or a new card to confirm */
const MI = w => MON.map(x => x.toLowerCase()).indexOf(String(w).slice(0, 3));
const MRX = "(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
function findAnyDate(t) {
  let m = t.match(new RegExp("\\b" + MRX + " (\\d{1,2})(?:st|nd|rd|th)?,? (\\d{4})\\b"));
  if (m) return iso(new Date(+m[3], MI(m[1]), +m[2], 12));
  m = t.match(new RegExp("\\b(\\d{1,2})(?:st|nd|rd|th)? (?:of )?" + MRX + ",? (\\d{4})\\b"));
  if (m) return iso(new Date(+m[3], MI(m[2]), +m[1], 12));
  m = t.match(new RegExp("\\b" + MRX + ",? (\\d{4})\\b"));
  if (m) return iso(new Date(+m[2], MI(m[1]) + 1, 0, 12));
  m = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/); if (m) return m[0];
  m = t.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (m) { let y = +m[3]; if (y < 100) y += 2000; const dt = new Date(y, +m[1] - 1, +m[2], 12); if (dt.getMonth() === +m[1] - 1) return iso(dt); }
  m = t.match(/\b(\d{1,2})\/(\d{4})\b/); if (m && +m[1] >= 1 && +m[1] <= 12) return iso(new Date(+m[2], +m[1], 0, 12));
  m = t.match(new RegExp("\\b" + MRX + " (\\d{1,2})(?:st|nd|rd|th)?\\b"));
  if (m) { let dt = new Date(TODAY.getFullYear(), MI(m[1]), +m[2], 12); if (dt < TODAY) dt = addYears(dt, 1); return iso(dt); }
  m = t.match(/\bin (\d+|a|one|two|three) (year|month)s?\b/);
  if (m) { const n = { a: 1, one: 1, two: 2, three: 3 }[m[1]] || +m[1]; const dt = new Date(TODAY); if (m[2] === "year") dt.setFullYear(dt.getFullYear() + n); else dt.setMonth(dt.getMonth() + n); return iso(dt); }
  return null;
}
function understandCred(raw) {
  const t = " " + raw.toLowerCase() + " ";
  if (!/\b(expires?|expired|expiring|exp|renew|renewal|renews|good (?:until|through|thru|till)|valid (?:until|through|thru|till)|due|ends?|reappointment)\b/.test(t)) return null;
  if (/\d\s*(?:h\b|hrs?\b|hours?\b|cerps?\b|credits?\b)/.test(t)) return null;
  const hit = (P.credWords || []).find(([rx]) => rx.test(t)); if (!hit) return null;
  const date = findAnyDate(t); if (!date) return null;
  const spec = Object.assign({}, hit[1]);
  if (spec.titleFrom === 0) { const m0 = t.match(hit[0])[0].trim().toUpperCase(); spec.title = P.id === "nursing" ? m0.replace(/(BC|C)$/, mm => "-" + mm).replace("--", "-") : m0; delete spec.titleFrom; }
  const fixedKey = spec.key; delete spec.key;
  const key = fixedKey ? fixedKey : spec.kind === "priv" ? "reappt" : (spec.kind === "license" || spec.kind === "cert") && /renewal (?:is )?due|application due/.test(t) ? "renewDue" : "expires";
  const same = c => c.kind === spec.kind && (spec.lifeType ? c.lifeType === spec.lifeType : spec.idKind ? c.idKind === spec.idKind : spec.title && spec.kind === "license" ? String(c.title || "").toLowerCase() === spec.title.toLowerCase() : spec.title ? String(c.title || "").toLowerCase() === spec.title.toLowerCase() || (spec.issuer && c.issuer === spec.issuer && !c.title) : spec.issuer ? c.issuer === spec.issuer : true);
  let found = S.creds.filter(same);
  if (found.length > 1) { const best = bestCreds(raw).filter(c => found.includes(c)); if (best.length) found = best; }
  return { spec, date, key, found: found.slice(0, 3) };
}
const KEY_WORD = { expires: "Expires", renewDue: "Renewal due", reappt: "Renews" };
function answer(raw) {
  const t = raw.toLowerCase();
  if (P.helpClinical && /\b(dose|dosing|prescrib|diagnos|treat|medication for|side effect|interaction)\b/.test(t) && !/\b(ce|hours?|course|credit)\b/.test(t)) return { html: `<p>${esc(P.helpClinical)}</p>` };
  const u = upcoming();
  // what's due / next deadline
  if (/\b(what'?s due|whats due|coming up|next deadline|deadlines?|upcoming|overdue|late)\b/.test(t) && !bestCreds(raw).length) {
    const list = [...u.overdue, ...u.all.filter(e => inDays(e.date) >= 0)].slice(0, 4);
    if (!list.length) return { html: `<p>Nothing with a date coming up.</p>` };
    return { html: `<p>${u.overdue.length ? `<b>${u.overdue.length} overdue.</b> ` : ""}Next up:</p><ul>${list.map(e => `<li><b>${esc(e.title)}</b>, ${longD(e.date)} (${relDays(inDays(e.date))})</li>`).join("")}</ul>`, acts: [["Open What's due", "go-due"]] };
  }
  // expired
  if (/\bexpired\b/.test(t)) { const ex = S.creds.filter(c => credStatus(c).s === "expired"); return { html: ex.length ? `<p>Expired: ${ex.map(c => `<b>${esc(credFullName(c))}</b> (${longD(c.expires)})`).join(", ")}.</p>` : `<p>Nothing has expired.</p>` }; }
  // hours questions
  if (/\b(hours?|hrs|ce|cme|cerps?|credits?|behind|pace|on track|how am i doing)\b/.test(t)) {
    let rules = bestRules(raw); if (!rules.length) rules = activeRules().filter(r => !r.manual);
    if (!rules.length) return { html: `<p>You haven't added any ${P.ce} requirements yet.</p>`, acts: [["Add a requirement", "rule-new"]] };
    return { html: `<ul>${rules.slice(0, 5).map(r => { const p = prog(r), pc = pace(r); return `<li><b>${esc(r.name)}</b>: ${r.manual ? "met (self-reported)" : `${hrs(p.total)} of ${hrs(r.target)} hrs`}${Object.entries(r.subs || {}).filter(([, v]) => v).map(([k, v]) => `, ${P.subShort[k].toLowerCase()} ${hrs(p.sub[k])} of ${hrs(v)}`).join("")}. ${p.met ? "Target met." : p.closed ? "Window closed." : `${hrs(p.left)} to go by ${longD(r.end)}${pc ? `, about ${hrs(pc.perMonth)} a month${pc.behind ? " (behind pace)" : ""}` : ""}.`}</li>`; }).join("")}</ul>`, acts: [["Open " + P.ceTab, "go-ce"]] };
  }
  // a credential: when does it expire / renew, its number
  const creds = bestCreds(raw);
  if (creds.length) {
    return { html: `<ul>${creds.slice(0, 4).map(c => { const bits = [];
      if (c.expires) bits.push(`${D(c.expires) < TODAY ? "expired" : c.kind === "life" ? "renew by" : "expires"} ${longD(c.expires)} (${relDays(inDays(c.expires))})`);
      if (c.renewOpens && D(c.renewOpens) >= TODAY) bits.push(`renewal opens ${longD(c.renewOpens)}`);
      if (c.renewDue) bits.push(`renewal due ${longD(c.renewDue)}`);
      if (c.reappt) bits.push(`reappointment ${longD(c.reappt)}`);
      if (c.docsDue) bits.push(`documents due ${longD(c.docsDue)}`);
      if (/\b(number|#|id)\b/.test(t) && (c.number || c.numStore === "onfile")) bits.push("number " + maskNum(c));
      return `<li><b>${esc(credFullName(c))}</b>: ${bits.join(", ") || "no dates saved yet"}.</li>`; }).join("")}</ul>`, acts: creds.length === 1 ? [["Open " + credFullName(creds[0]), "cred:" + creds[0].id]] : [] };
  }
  return null;
}
let askLast = null;
function renderAsk() {
  const ex = P.askEx();
  $("#askWrap").innerHTML = `<section class="qa" aria-label="Quick add">
    <form class="ask" id="askForm" role="search"><span class="lead">${ICON.plus}</span><label class="sr" for="askIn">Quick add: type a course, a date or a question</label><input id="askIn" type="text" enterkeyhint="go" autocomplete="off" placeholder="Quick add"><button type="submit" aria-label="Go">${ICON.send}</button></form>
    ${askLast ? "" : `<div class="ask-ex">${ex.map(x => `<button type="button" data-ask="${esc(x)}">${esc(x)}</button>`).join("")}</div>`}<div id="askOut">${askLast || ""}</div></section>`;
  $("#askForm").onsubmit = e => { e.preventDefault(); runAsk($("#askIn").value); };
}
let askPending = null;
function runAsk(raw, outEl) {
  raw = String(raw || "").trim(); if (!raw) return;
  const t = raw.toLowerCase(); let html = "", acts = [];
  const todo = raw.match(/^(?:remind me to|reminder to|to ?do:?|add (?:a )?to-?do:?|i need to)\s+(.+)$/i);
  const isQ = /\?\s*$/.test(t) || /^(when|what|whats|what's|how|which|where|show|list|tell me|any|am i|is (?:my|the|anything)|are (?:my|there|any)|do i|does (?:my|the)|did i|will)\b/.test(t);
  if (todo) {
    const due = (() => { const m = todo[1].match(/\b(?:by|before|on)\s+(.+)$/i); if (!m) return ""; const d = findDate(" " + m[1].toLowerCase() + " "); if (!d) return ""; let dt = D(d); if (dt < TODAY) dt = addYears(dt, 1); return iso(dt); })();
    const text = todo[1].replace(/\s+\b(?:by|before|on)\s+.+$/i, "").replace(/^\w/, c => c.toUpperCase());
    askPending = { type: "todo", text, due };
    html = `<p>Not saved yet. Check it, then save.</p><div class="got"><span><b>To-do</b>${esc(text)}</span>${due ? `<span><b>By</b>${longD(due)}</span>` : ""}</div>`; acts = [["Review and save", "ask-todo"]];
  } else {
    const cr = !isQ ? understandCred(raw) : null;
    const log = !isQ && !cr ? understandLog(raw) : null;
    if (cr) {
      askPending = { type: "cred", cr };
      const what = cr.found.length ? credFullName(cr.found[0]) : (cr.spec.title || cr.spec.lifeType || cr.spec.idKind || cr.spec.issuer || (SECT(cr.spec.kind) || {}).one || "Credential");
      html = `<p>Not saved yet. Check it, then tap below.</p><div class="got"><span><b>${cr.found.length ? "Card" : "New card"}</b>${esc(what)}</span><span><b>${KEY_WORD[cr.key]}</b>${longD(cr.date)}</span></div>
        ${cr.found.length > 1 ? `<p class="muted">You have more than one. Pick the right card.</p>` : cr.found.length ? "" : `<p class="muted">You don't have this card yet. Saving makes it.</p>`}`;
      acts = cr.found.length ? cr.found.map(c => [cr.found.length > 1 ? "Save to " + credFullName(c) : "Save the date", "cred-upd:" + c.id]) : [["Make the card", "cred-make"]];
    } else if (log) {
      askPending = { type: "ce", log };
      const names = log.applies.map(id => ruleOf(id).name);
      html = `<p>Not saved yet. Check it, then save.</p><div class="got"><span><b>Hours</b>${hrs(log.hours)}</span><span><b>Date</b>${longD(log.date)}</span><span><b>Course</b>${esc(log.title)}</span>${log.provider ? `<span><b>From</b>${esc(log.provider)}</span>` : ""}${log.pharm ? `<span><b>${esc(P.subShort.pharm)}</b>${hrs(log.pharm)}</span>` : ""}${log.law ? `<span><b>${esc(P.subShort.law)}</b>${hrs(log.law)}</span>` : ""}${log.cat ? `<span><b>${esc(P.catWord)}</b>${esc(CATS(log.cat))}</span>` : ""}</div>
        <p class="muted">${names.length ? `Counts toward ${esc(names.join(", "))}${log.named ? "" : " (everything with dates that include it)"}. You can change that next.` : "No requirement covers that date yet. You can still log it."}</p>`;
      acts = [["Review and save", "ask-ce"]];
    } else {
      const a = answer(raw);
      if (a) { html = a.html; acts = a.acts || []; askPending = null; }
      else { askPending = null; html = `<p>Try it like one of these:</p><ul>${P.askHelp.map(x => `<li>${esc(x)}</li>`).join("")}<li>“How many hours do I still need?”</li><li>“Remind me to send my ${esc(P.ce)} certificates by Dec 1”</li></ul>`; }
    }
  }
  const out = `<div class="ask-out" role="status"><div class="q">“${esc(raw)}”</div>${html}${acts.length ? `<div class="acts">${acts.map(([l, a], i) => `<button type="button" class="btn ${i ? "ghost" : "primary"} press" data-askact="${esc(a)}">${esc(l)}</button>`).join("")}<button type="button" class="btn ghost press" data-askact="clear">Clear</button></div>` : `<div class="acts"><button type="button" class="btn ghost press" data-askact="clear">Clear</button></div>`}</div>`;
  if (outEl) { outEl.innerHTML = out; return; }
  askLast = out; renderAsk(); $("#askIn").value = "";
}
document.addEventListener("click", e => {
  const ex = e.target.closest("[data-ask]"); if (ex) { runAsk(ex.dataset.ask); return; }
  const b = e.target.closest("[data-askact]"); if (!b) return;
  const a = b.dataset.askact;
  if (a === "clear") { const box = b.closest(".ask-inline"); askPending = null; if (box) { box.innerHTML = ""; return; } askLast = null; renderAsk(); }
  else if (a === "ask-ce" && askPending && askPending.type === "ce") { const l = askPending.log; ceForm(null, { title: l.title, hours: l.hours, date: l.date, pharm: l.pharm || "", law: l.law || "", cat: l.cat, provider: l.provider, applies: l.applies }); }
  else if (a === "ask-todo" && askPending && askPending.type === "todo") todoForm(null, { text: askPending.text, due: askPending.due });
  else if (a.startsWith("cred-upd:") && askPending && askPending.type === "cred") {
    const c = S.creds.find(x => x.id === a.slice(9)), cr = askPending.cr; if (!c) return;
    withUndo(credFullName(c) + " saved", () => { c[cr.key] = cr.date; if (c.setup) { c.setup = false; kitRules(c); } });
    const inl = b.closest(".ask-inline"); askPending = null; if (inl) { if (sheetClose) sheetClose(); } else { askLast = null; renderAsk(); }
  }
  else if (a === "cred-make" && askPending && askPending.type === "cred") { const cr = askPending.cr, pre = Object.assign({}, cr.spec); pre[cr.key] = cr.date; if (pre.lifeType) pre.title = pre.lifeType; if (pre.idKind) pre.title = pre.idKind; if (pre.kind === "id" && !SENSITIVE(pre)) pre.numStore = "full"; credForm(pre.kind, null, pre); }
  else if (a === "go-due") go("due");
  else if (a === "go-ce") go("ce");
  else if (a === "rule-new") ruleForm();
  else if (a.startsWith("cred:")) openCard(a.slice(5));
});
