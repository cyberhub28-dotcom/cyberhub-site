
/* ---------- look ---------- */
const ACCENTS = [["navy", "Navy", "#24304D"], ["evergreen", "Evergreen", "#2F6B45"], ["plum", "Plum", "#5E3A8F"], ["rose", "Rose", "#A3375A"], ["sunset", "Sunset", "#A94C1A"], ["graphite", "Graphite", "#334155"], ["brass", "Brass", "#7A5A16"], ["voltage", "Voltage", "#C2410C"], ["chalk", "Chalkboard", "#2E3B36"], ["ledger", "Ledger", "#146C55"], ["oxblood", "Oxblood", "#7A2335"]];
const look = () => { const L = Object.assign({ accent: P.accent || "navy", theme: "auto", hidden: [] }, S.look || {}); if (!Array.isArray(L.hidden)) L.hidden = []; return L; };
/* to-do and notes live beside the calendar now, not on Home */
const ON_CAL = ["todo", "notes"];
const HOME_IDS = { ce: "homeCE", todo: "homeTodo", practice: "homePractice", creds: "homeCreds", notes: "homeNotes" };
function applyLook(L) {
  L = L || look(); const root = document.documentElement;
  if (L.accent && L.accent !== "navy") root.setAttribute("data-accent", L.accent); else root.removeAttribute("data-accent");
  if (L.theme === "light" || L.theme === "dark") root.setAttribute("data-theme", L.theme); else root.removeAttribute("data-theme");
  root.setAttribute("data-pack", P.id);
  const bm = document.getElementById("bmName"); if (bm) bm.innerHTML = esc(P.appName).replace(" ", "<br>");
  /* each profession lays Home out its own way: its sections, in its order */
  const hid = new Set(L.hidden), order = P.home.map(h => h[0]).filter(k => !ON_CAL.includes(k)), box = document.getElementById("homeGroups");
  order.forEach(k => { const el = document.getElementById(HOME_IDS[k]); if (el && box) box.appendChild(el); });
  Object.entries(HOME_IDS).forEach(([k, id]) => { const el = document.getElementById(id); if (el) el.hidden = hid.has(k) || !order.includes(k); });
  const name = String(S.profile.name || "").trim().split(" ")[0];
  try { document.title = name ? name + "'s Credentials" : P.appName; } catch (e) {}
}

/* ---------- render ---------- */
const TC_SEL = ".group-h h2, .group-h > a, .group-h > .lnk, .li.addrow .tx, #moreBody button.li:not([data-act=profile]) .tx > b, .btn, .addtile, .segc button, .seg.ctl button, .hero .lbl, .addhd, .lnk, .sample-bar b, .sbtn.txt";
function tcText(el) { el.childNodes.forEach(n => { if (n.nodeType === 3 && /[a-z]/.test(n.nodeValue)) n.nodeValue = titleCase(n.nodeValue); }); }
function tcPass(scope) {
  scope.querySelectorAll(TC_SEL).forEach(tcText);
  scope.querySelectorAll(".field > label, .field > .flabel").forEach(l => { const t = l.textContent.trim(); if (!/\?$/.test(t) && t.split(/\s+/).length <= 3) tcText(l); });
}
/* anything drawn later gets the same Title Case pass */
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { const el = n.nodeType === 1 ? n : n.parentElement; if (!el) return; if (el.matches(TC_SEL)) tcText(el); if (n.nodeType === 1) tcPass(el); }))).observe(document.body, { childList: true, subtree: true });
function render() {
  P = own(PACKS, S.profile.pack) ? PACKS[S.profile.pack] : PACKS.nursing;
  applyLook();
  $("#ceTab").textContent = P.ceTab; $("#ceTitle").textContent = P.ceTab;
  renderHome(); renderCreds(); renderCE(); renderDue(); renderPlan(); renderMore(); renderNudge();
  const u = upcoming(), minW = Math.min(...S.settings.windows), n = u.overdue.length + u.soon.filter(e => inDays(e.date) <= minW && e.kind !== "renewOpens").length;
  const b = $("#dueBadge"); b.hidden = !n; b.textContent = n > 9 ? "9+" : n;
  /* bars and rings fill up once when the app opens; after a save they just show the new number, so nothing replays */
  if (!render.done) { render.done = true; requestAnimationFrame(() => requestAnimationFrame(() => fillIn(document))); }
  else { const root = document.documentElement; root.classList.add("instant"); fillIn(document, true); void root.offsetWidth; requestAnimationFrame(() => root.classList.remove("instant")); }
}
function fillIn(scope, all) {
  scope.querySelectorAll("[data-w]").forEach(el => { if (all || !el.closest("[hidden]")) el.style.width = el.dataset.w; });
  scope.querySelectorAll("[data-arc]").forEach(el => { if (all || !el.closest("[hidden]")) el.style.strokeDashoffset = 100 - (+el.dataset.arc || 0); });
}
/* a ring like the Fitness app */
function ringSvg(outer, inner, mid, cls) {
  const arc = (r, w, pct, col) => `<circle class="trk" cx="50" cy="50" r="${r}" style="stroke-width:${w}"/>${pct > 0 ? `<circle class="arc" cx="50" cy="50" r="${r}" pathLength="100" style="stroke-width:${w};stroke:${col}" data-arc="${Math.min(100, pct).toFixed(1)}"/>` : ""}`;
  return `<span class="ringsvg ${cls || ""}"><svg viewBox="0 0 100 100" aria-hidden="true">${arc(43, 10, outer[0], outer[1])}${inner ? arc(29.5, 7, inner[0], inner[1]) : ""}</svg><span class="mid">${mid}</span></span>`;
}
/* one requirement as one ring, like the Fitness app: hours in the middle, name and one plain status line under it */
function reqRing(r) {
  const p = prog(r), pc = pace(r), behind = !p.met && !p.closed && pc && pc.behind;
  const col = r.manual || p.met ? "var(--ok)" : p.closed || behind ? "var(--warn)" : "var(--brand)";
  const mins = [];
  Object.entries(r.subs || {}).forEach(([k, v]) => { if (v && p.sub[k] < v) mins.push(`${P.subShort[k] || P.sub[k] || k} ${hrs(p.sub[k])} of ${hrs(v)}`); });
  if (r.caps) ["A", "B", "C"].forEach(k => { if (r.caps[k] && p.cat[k] < r.caps[k][0]) mins.push(`${CATS(k)} ${hrs(p.cat[k])} of ${hrs(r.caps[k][0])}`); });
  const status = r.manual || p.met ? `<small class="ok">Met</small>` : p.closed ? `<small class="behind">Window closed</small>` : behind ? `<small class="behind">Behind pace</small>` : `<small>${hrs(p.left)} hrs to go</small>`;
  const extra = !r.manual && !p.met && mins.length ? `<small>${esc(mins[0])}</small>` : "";
  const mid = r.manual || p.met ? ICON.check : `<b class="num">${hrs(p.total)}</b><small>of ${hrs(r.target)}</small>`;
  return `<button class="ringit press" data-act="rule-open" data-id="${esc(r.id)}" aria-label="${esc(r.name)}: ${hrs(p.total)} of ${hrs(r.target)} hours, ${esc(p.label)}">${ringSvg([r.manual ? 100 : p.pct, col], null, mid)}<span class="rt"><b>${esc(r.name)}</b>${status}${extra}</span></button>`;
}
/* a credential as a card in a wallet */
const CARD_DATE = c => c.kind === "priv" ? [FLABEL("priv", "reappt", "Reappointment").replace(/ due$/, ""), c.reappt] : c.kind === "license" && !c.expires && c.renewDue ? [FLABEL("license", "renewDue", "Renewal due"), c.renewDue] : [(SECT(c.kind) || {}).dateWord || "Expires", c.expires];
function walletCard(c, mini, act) {
  const s = credStatus(c), [dl, d] = CARD_DATE(c), sec = SECT(c.kind) || {};
  const top = c.kind === "license" ? (c.issuer || sec.top) : c.kind === "cert" ? (c.issuer ? c.issuer + " " + (sec.certWord || "certification") : sec.top) : c.kind === "life" ? (c.issuer || sec.top) : c.kind === "id" ? sec.top : c.kind === "mal" ? (sec.topFromTitle ? (c.title || sec.top) : sec.top) : sec.statusFirst ? (c.privStatus || "") + " " + sec.top : sec.top + (c.privStatus && c.privStatus !== "Active" ? " · " + c.privStatus : "");
  const title = c.kind === "license" ? (c.title || sec.top) : c.kind === "cert" ? (c.title || c.issuer || sec.top) : c.kind === "mal" ? (c.issuer || "Policy") : c.kind === "priv" ? (c.title || sec.defTitle) : credName(c);
  const hasDoc = (S.docs || []).some(x => x.credId === c.id);
  const clip = hasDoc ? `<svg class="clip" viewBox="0 0 24 24" aria-label="Has a file"><path d="M16.5 7.5l-7.6 7.6a2 2 0 0 0 2.8 2.8l7.8-7.8a4 4 0 0 0-5.7-5.7l-7.9 7.9a6 6 0 0 0 8.5 8.5l6.6-6.6" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round"/></svg>` : "";
  if (c.setup) return `<button class="wcard setup k-${esc(c.kind)} press ${mini ? "mini" : ""}" data-act="${act || "setup-card"}" data-id="${esc(c.id)}"><span class="w1"><small>${esc(top)}</small>${clip}</span><span class="w2"><b>${esc(title)}</b></span>
    <span class="w3"><span class="add">${ICON.plus}${NOEXP(c) ? "Add the number" : "Add the date"}</span><span class="ex"><small>${esc(sec.one || "")}</small></span></span></button>`;
  const n = d ? inDays(d) : null, wp = s.s === "expired" ? "bad" : s.s === "attention" ? "warn" : "";
  const num = c.number || c.numStore === "onfile" ? maskNum(c) : "";
  return `<button class="wcard k-${esc(c.kind)} press ${mini ? "mini" : ""}" data-act="${act || "cred-open"}" data-id="${esc(c.id)}" aria-label="${esc(credFullName(c))}, ${esc(s.label)}${d ? ", " + dl + " " + longD(d) : ""}">
    <span class="w1"><small>${esc(top)}</small>${clip}<span class="wpill ${wp}">${s.s === "active" || s.s === "met" ? ICON.check : ""}${esc(s.s === "attention" ? "Due soon" : s.label.replace("*", ""))}</span></span>
    <span class="w2"><b>${esc(title)}</b>${d ? `<span class="num">${MON[D(d).getMonth()]} ’${String(D(d).getFullYear()).slice(2)}</span>` : ""}</span>
    <span class="w3">${mini ? `<span class="no">${num}</span>` : `<span style="display:flex;align-items:center;gap:10px;min-width:0"><i class="chip"></i><span class="no">${num}</span></span>`}
      ${d ? `<span class="ex"><small>${dl}</small><b>${longD(d)}</b>${mini ? "" : `<small style="letter-spacing:0;text-transform:none;font-weight:600;margin-top:1px">${n < 0 ? Math.abs(n) + " days ago" : n === 0 ? "today" : n + " days left"}</small>`}</span>` : c.kind === "id" ? `<span class="ex"><small>No expiration</small></span>` : ""}</span></button>`;
}
/* cards in a section: furthest date at the back, soonest and unfinished at the front where you see them whole */
const walletOrder = list => list.slice().sort((a, b) => (a.setup - b.setup) || String((CARD_DATE(b)[1]) || "0").localeCompare(String(CARD_DATE(a)[1] || "0")));
const monY = d => MON[D(d).getMonth()] + " " + D(d).getFullYear();
const bar = (pct, color, cls) => `<span class="${cls || "mini-track"}"><span style="background:${color}" data-w="${Math.max(0, Math.min(100, pct)).toFixed(1)}%"></span></span>`;
const statusColor = s => s === "met" ? "var(--ok)" : s === "notstarted" || s === "closed" ? "var(--warn)" : "var(--info)";

/* one requirement as a card: big hours, bar, and a bar for every minimum or category */
function ruleCard(r, opts) {
  const p = prog(r), c = credOf(r), color = statusColor(p.status);
  const subs = [];
  Object.entries(r.subs || {}).forEach(([k, v]) => { if (v) subs.push([P.sub[k] || k, p.sub[k], v, SUBCOL(k), null]); });
  if (r.caps) ["A", "B", "C"].forEach(k => { if (r.caps[k]) subs.push([CATN(k) + (r.elective ? ` (at least ${hrs(r.caps[k][0])})` : ` (${r.caps[k][0]} to ${r.caps[k][1]})`), p.cat[k], r.caps[k][0], `var(--cat-${k.toLowerCase()})`, r.elective ? null : r.caps[k][1]]); });
  const subH = subs.length ? `<span class="subs">${subs.map(([n, have, need, col, max]) => `<span class="sub"><span>${esc(n)}</span><b class="num" style="color:${have >= need ? "var(--ok)" : "var(--ink)"}">${hrs(have)} / ${hrs(need)}${max != null && have > max ? ` <span class="muted">(${hrs(max)} count)</span>` : ""}${have >= need ? " ✓" : ""}</b>${bar(need ? have / need * 100 : 100, col)}</span>`).join("")}</span>` : "";
  const days = inDays(r.end);
  const pc = pace(r);
  const foot = r.manual ? esc(r.manual.note || "Marked met by you") : p.met ? `Your logged hours meet the target you set.` : p.closed ? `Window closed ${longD(r.end)}.` : `${hrs(p.left)} hrs to go by ${longD(r.end)} · ${relDays(days)}`;
  const paceH = pc ? `<div class="${pc.behind ? "warnline" : "foot"}">${pc.behind ? `Behind pace: about ${hrs(Math.round(pc.expected))} hrs would be done by now. ` : ""}About ${hrs(pc.perMonth)} hrs a month finishes on time.</div>` : "";
  const group = r.group && groupRules(r.group).length > 1 ? `<div class="foot">Shares no hours with ${esc(groupRules(r.group).filter(x => x !== r).map(x => x.name).join(", "))}.</div>` : "";
  const unc = p.uncategorized > 0 ? `<div class="warnline">${hrs(p.uncategorized)} hrs have no ${esc(P.catWord.toLowerCase())}, so they don't count yet.</div>` : "";
  if (opts && opts.compact) {
    /* the sideways row keeps each card short; the full detail opens on tap */
    const cf = r.manual ? foot : p.met || p.closed ? foot : `${pc && pc.behind ? "Behind pace · " : ""}${hrs(p.left)} hrs to go by ${monY(r.end)}`;
    return `<button class="rule press" data-act="rule-open" data-id="${esc(r.id)}" aria-label="${esc(r.name)}, ${hrs(p.total)} of ${hrs(r.target)} hours, ${esc(p.label)}">
    <span class="top"><span class="tx"><b>${esc(r.name)}</b><small>${c ? esc(credFullName(c)) + " · " : ""}${monY(r.start)} to ${monY(r.end)}</small></span>${p.status === "progress" ? "" : pill(p.status, p.label)}</span>
    ${r.manual ? "" : `<span class="fig num">${hrs(p.total)}<small>of ${hrs(r.target)} ${r.caps && !r.elective ? "CERPs" : "hrs"}</small></span>${bar(p.pct, color, "track")}`}
    ${subH}<div class="${pc && pc.behind && !p.met ? "warnline" : "foot"} cfoot">${cf}</div>${unc}</button>`;
  }
  return `<button class="rule press" data-act="rule-open" data-id="${esc(r.id)}" aria-label="${esc(r.name)}, ${hrs(p.total)} of ${hrs(r.target)} hours, ${esc(p.label)}">
    <span class="top"><span class="tx"><b>${esc(r.name)}</b><small>${c ? esc(credFullName(c)) + " · " : ""}${monY(r.start)} to ${monY(r.end)}</small></span>${p.status === "progress" ? "" : pill(p.status, p.label)}</span>
    ${r.manual ? "" : `<span class="fig num">${hrs(p.total)}<small>of ${hrs(r.target)} ${r.caps && !r.elective ? "CERPs" : "hrs"}</small></span>${bar(p.pct, color, "track")}`}
    ${subH}<div class="foot">${foot}</div>${paceH}${group}${unc}</button>`;
}
function groupCards(only) {
  const groups = (only ? [only] : [...new Set(S.rules.map(r => r.group).filter(Boolean))]).filter(g => groupRules(g).length > 1);
  return groups.map(g => {
    const rs = groupRules(g), have = sum(rs, r => prog(r).total), need = sum(rs, r => r.target), ok = have >= need;
    return `<div class="rule"><span class="top"><span class="tx"><b>${esc(g)} total</b><small>${esc(rs.map(r => r.name).join(" + "))} · ${hrs(need)} separate hours</small></span>${ok || !have ? pill(ok ? "met" : "notstarted", ok ? "Met" : "Not started") : ""}</span>
      <span class="fig num">${hrs(have)}<small>of ${hrs(need)} hrs</small></span>${bar(need ? have / need * 100 : 0, statusColor(ok ? "met" : "progress"), "track")}
      <div class="foot cfoot">One course hour counts toward only one of these.</div></div>`;
  }).join("");
}
const activeRules = () => S.rules.filter(r => D(r.end) >= addDays(TODAY, -60)).sort((a, b) => a.end.localeCompare(b.end));

/* requirement cards in deadline order, each shared-hours total just before its first member */
function ruleCards(list) { const seen = new Set(); return list.map(r => { let pre = ""; if (r.group && !seen.has(r.group)) { seen.add(r.group); pre = groupCards(r.group); } return pre + ruleCard(r, { compact: true }); }).join(""); }

/* --- home --- */
function renderHome() {
  const name = String(S.profile.name || "").trim(), first = name.split(" ")[0];
  const u = upcoming(), next = u.all.filter(e => e.deadline && inDays(e.date) >= 0);
  const subtitle = [S.profile.role, S.profile.states, next[0] ? "next deadline in " + inDays(next[0].date) + " days" : ""].filter(Boolean).join(" · ");
  $("#hello").innerHTML = `<small>${esc(TODAY.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }))}</small><h1>${first ? esc(first) + "'s Credentials" : "Your Credentials"}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ""}`;
  const left = S.creds.filter(c => c.setup), kitN = S.creds.filter(c => c.kit).length || left.length;
  $("#sampleBar").innerHTML = (S.sample ? `<a class="sample-bar press" href="#more" data-act="onboard"><span><b>Example.</b> ${esc(S.profile.name)} is made up. Start your own from here.</span>${ICON.chev}</a>` : "") +
    (left.length ? `<button class="setupcard press" data-act="setup-card" data-id="${esc(left[0].id)}">${ringSvg([(kitN - left.length) / kitN * 100, "var(--ok)"], null, `<b class="num">${kitN - left.length}/${kitN}</b>`, "ringmini")}<b>Finish your cards</b><small>${left.length} still need ${left.length === 1 ? "a date" : "dates"}. Next: ${esc(credFullName(left[0]))}</small><span class="btn primary go">Add the next date</span></button>` : "");
  renderAsk();
  const h = $("#hero");
  if (!next.length) {
    h.setAttribute("aria-label", "Next deadline: all clear. Opens the calendar.");
    h.innerHTML = `${heroTex()}<div class="in"><div><div class="lbl">Next deadline</div><div class="big">All clear</div><div class="sub">${S.creds.length ? "Nothing with a date coming up." : "Add a license or certification and its dates show up here."}</div></div></div>`;
  } else {
    const e = next[0], n = inDays(e.date);
    h.setAttribute("aria-label", `Next deadline: ${e.title}${e.sub ? ", " + e.sub : ""}, ${n === 0 ? "today" : n + (n === 1 ? " day" : " days") + " left"}, ${WD[D(e.date).getDay()]} ${longD(e.date)}.${next.length > 1 ? " " + (next.length - 1) + " more coming up." : ""} Opens the calendar.`);
    h.innerHTML = `${heroTex()}<div class="in">
      <div><div class="lbl">Next deadline</div>
        <div class="big num">${n === 0 ? "Today" : n}${n === 0 ? "" : `<small>${n === 1 ? "day" : "days"}</small>`}</div>
        <div class="what">${esc(e.title)}</div><div class="sub">${WD[D(e.date).getDay()]}, ${longD(e.date)}${e.sub ? " · " + esc(e.sub) : ""}</div></div>
      <span class="hero-go">${next.length > 1 ? `${next.length - 1} more coming up` : "See what's due"} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" style="fill:none;stroke:currentColor;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round"/></svg></span></div>`;
  }
  const maxW = Math.max(...S.settings.windows);
  const ar = activeRules(), logged = sum(S.ce.filter(e => ar.some(r => credit(e, r) > 0)), e => e.hours);
  const activeCount = S.creds.filter(c => credStatus(c).s === "active" || credStatus(c).s === "info").length;
  const tile = (href, col, svg, title, big, cap) => `<a class="tile press" href="${href}"><span class="th" style="color:var(--${col})">${svg}<span>${title}</span></span><b class="num">${big}</b><small>${cap}</small></a>`;
  $("#homeTiles").innerHTML =
    tile("#due", u.overdue.length ? "warn" : "info", ICON.clock, "Due", u.soon.filter(e => e.kind !== "renewOpens").length + u.overdue.length, `next ${maxW} days`) +
    tile("#ce", "ok", ICON.ce, P.ce, hrs(logged), "hours this cycle") +
    tile("#creds", "k-license", ICON.license, "Cards", activeCount, `active of ${S.creds.length}`);
  // CE progress
  $("#homeCE").innerHTML = `<div class="group-h"><h2>${esc((P.home.find(h => h[0] === "ce") || [0, P.ce + " progress"])[1])}</h2><a href="#ce" class="press">Details${ICON.chev}</a></div>` +
    (ar.length ? `<div class="ringcard"><div class="rings n${Math.min(ar.length, 3)}">${ar.map(reqRing).join("")}</div></div>` : `<div class="list">${empty("var(--ok)", "Add a CE requirement to a license or certification to see your hours fill up.")}<button class="li addrow" data-act="rule-new"><span class="ic">${ICON.plus}</span><span class="tx">Add a ${P.ce} requirement</span></button></div>`);
  // practice
  $("#homePractice").innerHTML = `<div class="group-h"><h2>${esc(P.practice.title)}</h2></div><div class="list">
    ${S.practice.map(practiceRow).join("") || empty("var(--info)", P.practice.empty)}
    <button class="li addrow" data-act="prac-new"><span class="ic">${ICON.plus}</span><span class="tx">${esc(P.practice.add)}</span></button></div>`;
  // all credentials (compact)
  const soonest = S.creds.slice().sort((a, b) => (b.setup - a.setup) || String(CARD_DATE(a)[1] || "9").localeCompare(String(CARD_DATE(b)[1] || "9")));
  $("#homeCreds").innerHTML = `<div class="group-h"><h2>${esc(P.cardsTitle)}</h2><a href="#creds" class="press">See all${ICON.chev}</a></div>` +
    (soonest.length ? `<div class="wscroll">${soonest.map(c => walletCard(c, true)).join("")}</div>` : `<div class="list">${empty("var(--info)", "No credentials yet.")}</div>`);
}
function todoRow(t) {
  const n = t.due ? inDays(t.due) : null, late = !t.done && n != null && n < 0;
  return `<div class="lrow ${t.done ? "done" : ""}" style="padding-left:14px">
    <button class="check ${t.done ? "on" : ""}" data-act="todo-toggle" data-id="${esc(t.id)}" aria-pressed="${!!t.done}" aria-label="Mark ${esc(t.text)} ${t.done ? "not done" : "done"}"><span>${ICON.check}</span></button>
    <button class="li-main" data-act="todo-edit" data-id="${esc(t.id)}"><span class="tx"><b>${esc(t.text)}</b>${t.due ? `<small style="${late ? "color:var(--warn);font-weight:700" : ""}">${t.done ? "Done" : "By " + short(D(t.due)) + " · " + relDays(n)}</small>` : ""}</span></button></div>`;
}
function practiceRow(p) {
  const met = p.met || p.logged >= p.target, recentOk = !p.recentTarget || p.recent >= p.recentTarget, ok = met && recentOk;
  return `<button class="li prow" data-act="prac-edit" data-id="${esc(p.id)}">${ic("info", ICON.clock)}<span class="tx"><span class="ptop"><b>${esc(p.name)}</b><span class="pst${ok ? " ok" : ""}">${ok ? (p.met ? "Met (you said)" : "Met") : "In progress"}</span></span>
    <small class="num">${hrs(p.logged)} of ${hrs(p.target)} hrs</small>${p.recentTarget ? `<small class="num">Last 12 months: ${hrs(p.recent)} of ${hrs(p.recentTarget)}</small>` : ""}${bar(p.target ? p.logged / p.target * 100 : 0, met ? "var(--ok)" : "var(--info)")}</span></button>`;
}

/* --- credentials --- */
function credRow(c, compact) {
  const s = credStatus(c), d = c.expires || c.reappt || c.renewDue;
  const sub = [c.kind === "license" || c.kind === "cert" ? (c.kind === "license" ? c.issuer : "") : c.kind === "life" ? c.issuer : c.kind === "priv" ? (c.privStatus || "") : c.kind === "mal" ? c.limits : "",
    c.number || c.numStore === "onfile" ? maskNum(c) : ""].filter(Boolean);
  const rules = S.rules.filter(r => r.credId === c.id && !r.manual);
  const rp = !compact && rules.length ? rules.map(r => { const p = prog(r); return `${hrs(p.total)}/${hrs(r.target)}`; }).join(" · ") : "";
  return `<button class="li" data-act="cred-open" data-id="${esc(c.id)}">${kic(c.kind)}<span class="tx"><b>${esc(credFullName(c))}</b><small>${sub.map(x => x.startsWith("On file") || x.startsWith("…") || x === "—" ? x : esc(x)).join(" · ") || "—"}${rp ? " · " + P.ce + " " + rp : ""}</small></span>
    <span class="cred-date">${d && !compact ? `<b class="num">${short(D(d))}<span class="muted" style="font-weight:600"> ’${String(D(d).getFullYear()).slice(2)}</span></b>` : ""}${pill(s.s, s.label)}</span></button>`;
}
/* --- credentials: one stack like Apple Wallet. Tap a card and it opens on top with its details;
   the rest drop to a small pile at the bottom. --- */
let walletFocus = null;
function walletStack() {
  const out = [];
  P.sections.forEach(sec => { out.push(...S.creds.filter(c => c.kind === sec.kind && !c.setup).sort((a, b) => String(CARD_DATE(b)[1] || "0").localeCompare(String(CARD_DATE(a)[1] || "0")))); });
  return out.concat(S.creds.filter(c => c.setup));
}
function renderCreds() {
  const btn = $("#walletBtn");
  const c = walletFocus && S.creds.find(x => x.id === walletFocus);
  if (!c) walletFocus = null;
  if (btn) { btn.textContent = c ? "Done" : ""; btn.innerHTML = c ? "Done" : ICON.plus; btn.dataset.act = c ? "wallet-done" : "wallet-add"; btn.classList.toggle("txt", !!c); btn.setAttribute("aria-label", c ? "Close this card" : "Add a card"); }
  $("#credsSub").textContent = c ? (SECT(c.kind) || {}).label || "Card" : `${S.creds.length} ${S.creds.length === 1 ? "card" : "cards"}`;
  $("#vaultBox").hidden = !!c;
  if (c) {
    const rest = walletStack().filter(x => x !== c);
    $("#credsBody").innerHTML = `<div class="wfocus">${walletCard(c, false, "wallet-done")}
      <div class="wacts"><button class="btn primary press" data-act="cred-edit" data-id="${esc(c.id)}">Edit</button><button class="btn ghost press" data-act="doc-add" data-cred="${esc(c.id)}">Add a photo</button></div>
      <div class="wdet">${credBody(c)}</div>
      ${rest.length ? `<div class="wpile" aria-label="Other cards">${rest.slice(-6).map(x => walletCard(x, false, "wallet-done")).join("")}</div>` : ""}</div>`;
    return;
  }
  const all = walletStack();
  $("#credsBody").innerHTML = all.length ? `<div class="wallet one">${all.map(x => walletCard(x)).join("")}</div>` : `<div class="list">${empty("var(--info)", "No cards yet. Tap + at the top to add your first license.")}</div>`;
  renderVault();
}
function openCard(id) { walletFocus = id; if (sheetClose) sheetClose(true); if (tab === "creds") { renderCreds(); fillIn($("#v-creds")); window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); } else { scrollPos.creds = 0; go("creds"); renderCreds(); fillIn($("#v-creds")); } }
/* --- CE log --- */
let ceRule = "all", ceRange = "all", ceCat = "all", ceQ = "";
function ceFiltered() {
  const q = ceQ.trim().toLowerCase();
  let list = S.ce.slice();
  if (q) list = list.filter(e => [e.title, e.provider, e.ceId, e.notes].join(" ").toLowerCase().includes(q));
  if (ceRule !== "all") { const r = ruleOf(ceRule); list = r ? list.filter(e => credit(e, r) > 0) : list; }
  if (ceRange === "12m") list = list.filter(e => e.date >= T(-365));
  else if (ceRange === "year") list = list.filter(e => e.date.slice(0, 4) === String(TODAY.getFullYear()));
  if (ceCat === "pharm") list = list.filter(e => e.pharm > 0);
  else if (ceCat === "law") list = list.filter(e => e.law > 0);
  else if (/^[ABC]$/.test(ceCat)) list = list.filter(e => e.cat === ceCat);
  return list.sort((a, b) => b.date.localeCompare(a.date));
}
function ceRow(e) {
  const tags = [], dt = D(e.date);
  if (e.pharm > 0) tags.push(`<span class="tag ph">${P.subShort.pharm} ${hrs(e.pharm)}</span>`);
  if (e.law > 0) tags.push(`<span class="tag lw">${P.subShort.law} ${hrs(e.law)}</span>`);
  if (e.cat) tags.push(`<span class="tag c${esc(String(e.cat).toLowerCase())}">${esc(CATS(e.cat))}</span>`);
  const counts = [];
  e.applies.forEach(id => { const r = ruleOf(id); if (!r) return; const c = credit(e, r); if (c > 0) counts.push(esc(r.name) + (r.group && c !== e.hours ? " " + hrs(c) : "")); });
  const clip = e.photo ? `<i class="clip" aria-label="Certificate saved">${ICON.cert}</i>` : "";
  return `<button class="li crow" data-act="ce-edit" data-id="${esc(e.id)}">
    <span class="dchip"><small>${MON[dt.getMonth()]}</small><b class="num">${dt.getDate()}</b></span>
    <span class="tx"><b><span class="t">${esc(e.title || "Course")}</span>${clip}</b>${e.provider ? `<small>${esc(e.provider)}</small>` : ""}<span class="meta">${tags.join("")}${counts.length ? `<span class="cl">${counts.slice(0, 2).join(", ")}</span>${counts.length > 2 ? `<span class="more">+${counts.length - 2}</span>` : ""}` : S.rules.some(r => !r.manual) ? `<span class="cl none">Not counting toward anything yet</span>` : ""}</span></span>
    <span class="amt num">${hrs(e.hours)}<small>hrs</small></span></button>`;
}
/* "where you stand" cards sit in one sideways row; the dots show which card you're on */
function ceDots(sc) {
  const dots = $("#ceSide .rdots"); if (!sc || !dots) return;
  const cards = [...sc.children], left = sc.scrollLeft, w = cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : 1;
  const at = Math.min(cards.length - 1, Math.round(left / w));
  [...dots.children].forEach((d, i) => d.classList.toggle("on", i === at));
}
function renderCE() {
  const rules = S.rules.filter(r => !r.manual);
  if (ceRule !== "all" && !ruleOf(ceRule)) ceRule = "all";
  const hasCats = S.rules.some(r => r.caps);
  $("#ceChips2").innerHTML = [["all", "Any time"], ["12m", "Last 12 months"], ["year", "This year"]].map(([id, n]) => `<button class="press ${ceRange === id ? "on" : ""}" data-act="ce-range" data-id="${esc(id)}" aria-pressed="${ceRange === id}">${n}</button>`).join("");
  $("#ceChips").innerHTML = [["all", "All"], ...rules.map(r => [r.id, r.name])].map(([id, n]) => `<button class="press ${ceRule === id ? "on" : ""}" data-act="ce-rule" data-id="${esc(id)}" aria-pressed="${ceRule === id}">${esc(n)}</button>`).join("") +
    (SUBS_ON().length || hasCats ? `<span class="sep"></span>` + [...SUBS_ON().map(k => [k, k === "pharm" ? P.sub.pharm : P.subShort.law]), ...(hasCats ? ["A", "B", "C"].map(k => [k, CATS(k)]) : [])].map(([id, n]) => `<button class="press ${ceCat === id ? "on" : ""}" data-act="ce-cat" data-id="${ceCat === id ? "all" : id}" aria-pressed="${ceCat === id}">${esc(n)}</button>`).join("") : "");
  const list = ceFiltered();
  const months = [];
  list.forEach(e => { const m = e.date.slice(0, 7); if (!months.length || months[months.length - 1].m !== m) months.push({ m, items: [] }); months[months.length - 1].items.push(e); });
  const html = months.map(({ m, items }) => { const dt = D(m + "-01"); return `<div class="mhd"><b>${MONTHS[dt.getMonth()]}${dt.getFullYear() !== TODAY.getFullYear() ? " " + dt.getFullYear() : ""}</b><span class="num">${pl(sum(items, x => x.hours), "hr", "hrs")}</span></div><div class="list clist">${items.map(ceRow).join("")}</div>`; }).join("");
  const total = sum(list, e => e.hours), ph = sum(list, e => e.pharm || 0), filtered = list.length !== S.ce.length;
  $("#ceSub").textContent = `${S.ce.length} courses · ${hrs(sum(S.ce, e => e.hours))} hrs in all`;
  $("#ceLog").innerHTML = `<div class="stats"><div><b class="num">${list.length}</b><small>${list.length === 1 ? "Course" : "Courses"}</small></div><div><b class="num">${hrs(total)}</b><small>Hours</small></div>${P.sub.pharm ? `<div><b class="num" style="color:var(--pharm)">${hrs(ph)}</b><small>${esc(P.subShort.pharm)}</small></div>` : ""}</div>
    ${filtered ? `<div class="fnote">Showing ${list.length} of ${S.ce.length} courses</div>` : ""}
    ${list.length ? html : `<div class="list" style="margin-top:14px">${empty("var(--ok)", ceQ ? "No courses match that." : S.ce.length ? "No courses match these filters." : "No courses here yet.")}</div>`}
    <div class="list" style="margin-top:22px"><button class="li addrow" data-act="ce-new"><span class="ic">${ICON.plus}</span><span class="tx">Log a course</span></button><button class="li addrow" data-act="import"><span class="ic">${ICON.down}</span><span class="tx">Import from a spreadsheet</span></button></div>`;
  const ar = ceRule === "all" ? activeRules().filter(r => !r.manual) : [ruleOf(ceRule)];
  const cards = (ceRule === "all" ? ruleCards(ar) : ar.map(r => ruleCard(r, { compact: true })).join("")) + `<button class="rule addcard press" data-act="rule-new"><span class="pl">${ICON.plus}</span><b>Add a requirement</b><small>Set the hours you need and by when</small></button>`;
  const old = $("#ceSide .rscroll"), keep = old ? old.scrollLeft : 0;
  $("#ceSide").innerHTML = `<div class="group-h"><h2>Where you stand</h2></div><div class="rscroll" role="list">${cards}</div><div class="rdots" aria-hidden="true"></div>`;
  const sc = $("#ceSide .rscroll"), n = sc.children.length;
  [...sc.children].forEach(c => c.setAttribute("role", "listitem"));
  $("#ceSide .rdots").innerHTML = n > 1 ? Array.from({ length: n }, () => "<i></i>").join("") : "";
  if (ceRule === "all") sc.scrollLeft = keep;
  sc.onscroll = () => { if (!sc._raf) sc._raf = requestAnimationFrame(() => { sc._raf = 0; ceDots(sc); }); };
  ceDots(sc);
}

/* --- due: a 12-month strip, then a timeline by month --- */
const EV_ICON = { exp: "clock", renewDue: "license", renewOpens: "cal", reappt: "priv", docsDue: "note", ruleEnd: "rule", todo: "todo" };
function evColor(e) {
  const n = inDays(e.date), minW = Math.min(...S.settings.windows);
  if (n < 0 && e.kind !== "renewOpens") return "var(--warn)";
  if (n <= minW && e.kind !== "renewOpens") return "var(--warn)";
  if (e.kind === "renewOpens") return "var(--info)";
  if (e.todo) return "var(--ink-3)";
  if (e.rule) return "var(--ok)";
  return "var(--k-" + (e.credKind || "license") + ")";
}
function tlItem(e) {
  const n = inDays(e.date), late = n < 0, minW = Math.min(...S.settings.windows), dt = D(e.date);
  const act = e.todo ? "todo-edit" : e.rule ? "rule-open" : "cred-open";
  const label = late ? (e.kind === "exp" ? "Expired" : "Overdue") : n <= minW && e.kind !== "renewOpens" ? "Soon" : e.kind === "renewOpens" ? "Opens" : "";
  const kindWord = KIND_WORD()[e.kind] || "";
  const col = evColor(e);
  return `<button class="tli press" data-act="${act}" data-id="${esc(e.ref)}">
    <span class="dchip" style="background:color-mix(in srgb, ${col} 13%, var(--surface))"><small>${WD[dt.getDay()].slice(0, 3)}</small><b class="num" style="color:${col}">${dt.getDate()}</b></span>
    <span class="tx"><b>${esc(e.title)}</b><small>${esc([kindWord, e.sub].filter(Boolean).join(" · "))}</small></span>
    <span class="when">${late || e.kind === "renewOpens" ? pill(late ? "expired" : "info", label) : ""}<b class="num ${!late && n <= minW && e.kind !== "renewOpens" ? "soon" : ""}" style="${late ? "color:var(--warn)" : ""}">${late ? Math.abs(n) + "d ago" : n === 0 ? "Today" : n + "d"}</b></span></button>`;
}
/* --- calendar: a month like the iPhone Calendar app, the day you tap, then everything coming up --- */
let calMonth = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1, 12), calSel = iso(TODAY);
function calMove(dir) {
  calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + dir, 1, 12);
  const key = iso(calMonth).slice(0, 7), firstEv = events().find(e => e.date.slice(0, 7) === key);
  /* this month opens on today; other months open on their first date, or the 1st if there's none */
  calSel = key === iso(TODAY).slice(0, 7) ? iso(TODAY) : firstEv ? firstEv.date : iso(calMonth);
  renderCal(dir);
}
function renderCal(dir) {
  const ev = events(), y = calMonth.getFullYear(), m = calMonth.getMonth();
  const byDay = {}; ev.forEach(e => { (byDay[e.date] = byDay[e.date] || []).push(e); });
  const start = new Date(y, m, 1 - new Date(y, m, 1, 12).getDay(), 12), weeks = Math.ceil((new Date(y, m, 1, 12).getDay() + new Date(y, m + 1, 0, 12).getDate()) / 7);
  const todayIso = iso(TODAY), isNow = y === TODAY.getFullYear() && m === TODAY.getMonth();
  let cells = "";
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12), k = iso(d), list = byDay[k] || [], out = d.getMonth() !== m;
    const dots = list.slice(0, 3).map(e => `<i style="background:${evColor(e)}"></i>`).join("");
    cells += `<button class="cday${out ? " out" : ""}${k === todayIso ? " today" : ""}${k === calSel ? " sel" : ""}${list.length ? " has" : ""}" data-act="cal-day" data-id="${k}" aria-label="${WD[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}${list.length ? ", " + list.length + (list.length === 1 ? " date" : " dates") : ""}"${k === calSel ? ' aria-pressed="true"' : ""}><span class="n num">${d.getDate()}</span><span class="cdots">${dots}</span></button>`;
  }
  const monthCount = ev.filter(e => e.date.slice(0, 7) === iso(calMonth).slice(0, 7)).length;
  $("#calCard").innerHTML = `<div class="cal">
    <div class="calhd"><div><h2>${MONTHS[m]} <span>${y}</span></h2><small>${monthCount ? monthCount + (monthCount === 1 ? " date" : " dates") + " this month" : "Nothing this month"}</small></div>
      ${isNow ? "" : `<button class="caltoday press" data-act="cal-today">Today</button>`}
      <button class="calnav press" data-act="cal-prev" aria-label="Previous month"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" style="fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round"/></svg></button>
      <button class="calnav press" data-act="cal-next" aria-label="Next month"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" style="fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round"/></svg></button></div>
    <div class="calwd" aria-hidden="true">${WD.map(w => `<span>${w[0]}</span>`).join("")}</div>
    <div class="calgrid${dir > 0 ? " in-r" : dir < 0 ? " in-l" : ""}" id="calGrid">${cells}</div></div>`;
  // the day you tapped
  const sel = D(calSel), list = byDay[calSel] || [], n = inDays(calSel);
  const when = n === 0 ? "Today" : n === 1 ? "Tomorrow" : n === -1 ? "Yesterday" : n > 0 ? "In " + n + " days" : Math.abs(n) + " days ago";
  $("#dayList").innerHTML = `<div class="dayhd"><b>${WD[sel.getDay()]}, ${MONTHS[sel.getMonth()]} ${sel.getDate()}</b><span>${when}</span></div>` +
    (list.length ? `<div class="list dayl">${list.map(dayItem).join("")}</div>` : `<div class="dayempty">Nothing due${n === 0 ? " today" : " this day"}.</div>`);
  calSwipe();
}
/* swipe the month left or right */
function calSwipe() {
  const g = $("#calGrid"); if (!g) return;
  let x0 = null, y0 = 0;
  g.addEventListener("pointerdown", e => { x0 = e.clientX; y0 = e.clientY; });
  g.addEventListener("pointerup", e => { if (x0 == null) return; const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { g.dataset.swiped = "1"; calMove(dx < 0 ? 1 : -1); } });
  g.addEventListener("click", e => { if (g.dataset.swiped) { e.stopPropagation(); e.preventDefault(); delete g.dataset.swiped; } }, true);
}
const KIND_WORD = () => ({ exp: "Expiration", renewDue: "Renewal deadline", renewOpens: "Renewal window opens", reappt: FLABEL("priv", "reappt", "Reappointment").replace(/ due$/, ""), docsDue: FLABEL("priv", "docsDue", "Paperwork").replace(/ due$/, ""), ruleEnd: P.ce + " deadline", todo: "To-do" });
function dayItem(e) {
  const act = e.todo ? "todo-edit" : e.rule ? "rule-open" : "cred-open", col = evColor(e);
  return `<button class="li" data-act="${act}" data-id="${esc(e.ref)}"><i class="evbar" style="background:${col}"></i><span class="tx"><b>${esc(e.title)}</b><small>${esc([KIND_WORD()[e.kind], e.sub].filter(Boolean).join(" · "))}</small></span>${ICON.chev}</button>`;
}
function renderDue() {
  const u = upcoming(), W = S.settings.windows.slice().sort((a, b) => a - b);
  const ahead = [...u.soon, ...u.later];
  let html = "";
  if (u.overdue.length) html += `<div class="tlm"><h3 class="over">Overdue</h3><span>${u.overdue.length}</span></div><div class="tl">${u.overdue.map(tlItem).join("")}</div>`;
  let last = "";
  ahead.forEach(e => {
    const key = e.date.slice(0, 7);
    if (key !== last) { if (last) html += `</div>`; last = key; const dt = D(e.date), cnt = ahead.filter(x => x.date.slice(0, 7) === key).length;
      html += `<div class="tlm" id="m-${key}"><h3>${MONTHS[dt.getMonth()]}${dt.getFullYear() !== TODAY.getFullYear() ? " " + dt.getFullYear() : ""}</h3><span>${cnt} ${cnt === 1 ? "date" : "dates"}</span></div><div class="tl">`; }
    html += tlItem(e);
  });
  if (last) html += `</div>`;
  const nx = ahead.find(e => e.deadline);
  calSub = nx ? `Next deadline in ${inDays(nx.date)} ${inDays(nx.date) === 1 ? "day" : "days"}` : "Renewals and deadlines";
  $("#dueList").innerHTML = `<div class="group-h"><h2>Coming up</h2><span class="tot">Amber is inside ${W[0]} days</span></div>${html || `<div class="list">${empty("var(--ok)", "Nothing with a date in the next two years.")}</div>`}`;
  $("#dueSide").innerHTML = `<div class="group-h"><h2>Reminders</h2></div><div class="list">
      <button class="li" data-act="ics">${ic("info", ICON.bell)}<span class="tx"><b>Add to your phone's Calendar</b><small>Alerts ${W.slice().reverse().join(", ")} days before each date</small></span>${ICON.chev}</button>
      <button class="li" data-act="windows">${ic("k-license", ICON.sliders)}<span class="tx"><b>Reminder windows</b><small>${W.slice().reverse().join(" / ")} days</small></span>${ICON.chev}</button>
    </div>`;
  renderCal(0);
}

/* --- the Calendar tab is three pages you swipe between: Calendar, To-do, Notes --- */
let duePage = 0, calSub = "";
const noteDate = n => n.at ? "Edited " + short(D(n.at.slice(0, 10))) + (D(n.at.slice(0, 10)).getFullYear() !== TODAY.getFullYear() ? ", " + D(n.at.slice(0, 10)).getFullYear() : "") : "";
function renderPlan() {
  const open = S.todos.filter(t => !t.done).sort((a, b) => String(a.due || "9").localeCompare(String(b.due || "9")));
  const done = S.todos.filter(t => t.done);
  const late = open.filter(t => t.due && inDays(t.due) < 0).length;
  $("#pgTodo").innerHTML = `<div class="pstats"><div><b class="num">${open.length}</b><small>Open</small></div><div><b class="num" style="${late ? "color:var(--warn)" : ""}">${late}</b><small>Late</small></div><div><b class="num">${done.length}</b><small>Done</small></div></div>
    <div class="mhd"><b>Open</b><span></span></div>
    <div class="list">${open.map(todoRow).join("") || empty("var(--ok)", "Nothing on your list.")}
    <button class="li addrow" data-act="todo-new"><span class="ic">${ICON.plus}</span><span class="tx">Add a to-do</span></button></div>
    ${done.length ? `<div class="mhd"><b>Done</b><span class="num">${done.length}</span></div><div class="list">${done.map(todoRow).join("")}</div>` : ""}`;
  const notes = S.notes.slice().sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
  $("#pgNotes").innerHTML = `<div class="mhd" style="margin-top:16px"><b>${notes.length ? pl(notes.length, "note", "notes") : "Notes"}</b><span>Newest first</span></div>
    <div class="list nlist">${notes.map(n => { const lines = String(n.text).trim().split(/\n+/), t = lines[0], rest = lines.slice(1).join(" "); return `<button class="li nrow${rest ? " multi" : ""}" data-act="note-edit" data-id="${esc(n.id)}"><span class="tx"><b>${esc(t)}</b>${rest || noteDate(n) ? `<small>${noteDate(n) ? `<span class="nd">${noteDate(n)}</span>` : ""}${esc(rest)}</small>` : ""}</span>${ICON.chev}</button>`; }).join("") || empty("var(--info)", "No notes yet.")}
    <button class="li addrow" data-act="note-new"><span class="ic">${ICON.plus}</span><span class="tx">Add a note</span></button></div>
    <div class="note">Notes stay on this phone. Don't keep passwords here.</div>`;
  segSync();
}
function segSync() {
  document.querySelectorAll("#dueSeg button").forEach((b, i) => { b.classList.toggle("on", i === duePage); b.setAttribute("aria-selected", i === duePage); });
  const open = S.todos.filter(t => !t.done).length;
  $("#dueSub").textContent = duePage === 0 ? calSub : duePage === 1 ? (open ? pl(open, "thing", "things") + " to do" : "All caught up") : "Things to remember";
  fitPager();
}
/* the pager is as tall as the page you're on, so a short page has no empty space under it */
function fitPager() {
  const pg = $("#duePager"), p = pg && pg.children[duePage]; if (!p || !p.offsetHeight) return;
  pg.style.height = p.offsetHeight + "px";
}
function duePageGo(i, smooth) {
  const pg = $("#duePager"); duePage = i;
  pg.scrollTo({ left: i * pg.clientWidth, behavior: smooth && !reduce ? "smooth" : "auto" });
  segSync();
}
(function pagerInit() {
  const pg = $("#duePager"); if (!pg) return;
  let raf = 0;
  pg.addEventListener("scroll", () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; const i = Math.round(pg.scrollLeft / Math.max(1, pg.clientWidth)); if (i !== duePage) { duePage = i; segSync(); } }); }, { passive: true });
  if (window.ResizeObserver) { const ro = new ResizeObserver(fitPager); [...pg.children].forEach(c => ro.observe(c)); ro.observe(pg); }
  window.addEventListener("resize", () => { pg.scrollLeft = duePage * pg.clientWidth; fitPager(); });
})();

/* --- menu --- */
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(navigator.userAgent);
const standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
function renderMore() {
  const L = look(), acc = ACCENTS.find(a => a[0] === L.accent) || ACCENTS[0];
  $("#moreBody").innerHTML = `
  <div class="group"><div class="list">
    <button class="li" data-act="profile">${ic("k-license", ICON.person)}<span class="tx"><b>${esc(S.profile.name || "Your profile")}</b><small>${esc([S.profile.role, S.profile.states, P.name].filter(Boolean).join(" · "))}</small></span>${ICON.chev}</button>
    <button class="li" data-act="mine"><span class="ic" style="background:var(--k-license-fill);color:#fff" aria-hidden="true">${ICON.brush}</span><span class="tx"><b>Appearance</b><small>${esc(acc[1])} · ${L.theme === "auto" ? "matches your phone" : esc(L.theme)}</small></span>${ICON.chev}</button>
    <button class="li" data-act="windows">${ic("info", ICON.bell)}<span class="tx"><b>Reminder windows</b><small>${esc(S.settings.windows.join(" / "))} days before each date</small></span>${ICON.chev}</button>
  </div></div>
  <div class="group"><div class="group-h"><h2>Share and print</h2></div><div class="list">
    <button class="li" data-act="packet">${ic("k-cert", ICON.pdf)}<span class="tx"><b>${esc(P.packet.name)} (PDF)</b><small>Your cards and ${esc(P.ce)} totals in one file</small></span>${ICON.chev}</button>
    <button class="li" data-act="audit">${ic("ok", ICON.ce)}<span class="tx"><b>Audit packet (PDF)</b><small>Every course and certificate, ready for an audit</small></span>${ICON.chev}</button>
    <button class="li" data-act="ics">${ic("info", ICON.cal)}<span class="tx"><b>Add deadlines to Calendar</b><small>Alerts that work even when this app is closed</small></span>${ICON.chev}</button>
  </div></div>
  <div class="group"><div class="group-h"><h2>Backup</h2></div><div class="list">
    <div class="li">${ic(S.lastBackup ? "ok" : "warn", ICON.up)}<span class="tx"><b>${S.lastBackup ? "Last backup " + esc(longD(S.lastBackup)) : "No backup yet"}</b><small>Everything in one file, photos included</small></span></div>
    <div class="btnrow"><button class="btn primary press" data-act="backup">Back up now</button><button class="btn ghost press" data-act="restore">Restore a backup</button></div>
    ${unreadable() ? `<div class="li">${ic("warn", ICON.up)}<span class="tx"><b>Saved data that couldn't open</b><small>Kept on this phone. Save it as a file before you delete it.</small></span></div>
    <div class="btnrow"><button class="btn primary press" data-act="unreadable-save">Save it as a file</button><button class="btn ghost press" data-act="unreadable-del">Delete it</button></div>` : ""}
  </div>
  <details class="card keep"><summary><span><b>Your data lives only on this phone</b><span class="kp">Back up often and keep the file private. CyberHub can't see or restore it.</span></span>${ICON.chev}</summary>
    <div class="kh">What erases it</div>
    <ul><li>Deleting the app from your Home Screen</li><li>A new or reset phone, until you restore a backup</li><li>In a browser tab: clearing website data, or Safari clearing it after about 7 days unused</li><li>On Android: clearing Chrome's data for this site, even if it's on your Home Screen</li></ul>
    <div class="kh">What keeps it safe</div>
    <ul><li>Use it from your Home Screen. On iPhone, clearing Safari history doesn't touch it there.</li><li>Back up after big changes, and save the file in Files, iCloud Drive or Google Drive. If it's been a week, Home shows a reminder when you open the app.</li><li>Moving from a browser tab to the Home Screen? Back up in one, restore in the other.</li></ul>
    <p class="muted" style="margin:12px 0 0">The backup file isn't locked with a password. Keep it somewhere private. <span id="storeLine"></span></p>
  </details></div>
  <div class="group"><div class="group-h"><h2>Put it on your Home Screen</h2></div><div class="list">
    <div class="li">${ic("k-license", ICON.phone)}<span class="tx"><b>${standalone ? "You're all set" : "Open it like an app"}</b><small>${standalone ? "You're using it from your Home Screen." : "It gets its own icon, opens full screen, and your data stays on this phone."}</small></span></div>
    ${standalone ? "" : `${isAndroid ? "" : `${isIOS ? "" : `<div class="kh2">iPhone</div>`}<ol class="steps"><li>In Safari, tap <b>Share</b> (the square with an arrow).</li><li>Scroll and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>. Then open it from the new icon.</li></ol>`}
      ${isIOS ? "" : `${isAndroid ? "" : `<div class="kh2">Android</div>`}<ol class="steps"><li>In Chrome, tap the <b>three dots</b> at the top right.</li><li>Tap <b>Add to Home screen</b> or <b>Install app</b>.</li><li>Tap <b>Install</b>. Then open it from the new icon.</li></ol>`}`}
  </div></div>
  <div class="group"><div class="group-h"><h2>Your data</h2></div><div class="list">
    <button class="li" data-act="import">${ic("ok", ICON.down)}<span class="tx"><b>Import courses</b><small>From a spreadsheet or CE site file (CSV)</small></span>${ICON.chev}</button>
    <button class="li" data-act="load-sample">${ic("warn", ICON.sparkle)}<span class="tx"><b>See an example</b><small>A made-up person for any profession. Replaces what's here.</small></span>${ICON.chev}</button>
    ${S.sample ? `<button class="li" data-act="onboard">${ic("ok", ICON.wand)}<span class="tx"><b>Start my own</b><small>Clears the example and sets you up</small></span>${ICON.chev}</button>` : ""}
    <button class="li" data-act="wipe"><span class="ic" style="background:var(--sys-red);color:#fff" aria-hidden="true">${ICON.erase}</span><span class="tx"><b style="color:var(--danger)">Delete all data</b><small id="wipeSub">Erases everything on this device</small></span></button>
  </div></div>
  <div class="about">
    <div class="mark"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1l6 3.5v7L8 15l-6-3.5v-7z" style="fill:none;stroke:currentColor;stroke-width:1.6"/><path d="M8 5l3 1.75v3.5L8 12 5 10.25v-3.5z" style="fill:currentColor"/></svg>CyberHub Software</div>
    <div><b style="color:var(--ink-2)">${esc(P.appName)}</b></div>
    <p>${esc(P.disclaimer)}</p>
    <p>No account, no ads, no tracking. Your entries stay on this device unless you save or share them.</p>
  </div>`;
}
