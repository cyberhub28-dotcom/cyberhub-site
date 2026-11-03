
/* ---------- look ---------- */
const ACCENTS = [["voltage", "Copper", "#B83C0B"], ["rose", "Rose", "#A3375A"], ["plum", "Plum", "#5E3A8F"], ["sunset", "Sunset", "#A94C1A"], ["ledger", "Ledger", "#146C55"], ["evergreen", "Evergreen", "#2F6B45"], ["navy", "Navy", "#24304D"], ["graphite", "Graphite", "#334155"], ["oxblood", "Oxblood", "#7A2335"], ["brass", "Brass", "#7A5A16"]];
const look = () => { const L = Object.assign({ accent: P.accent || "navy", theme: "auto", hidden: [] }, S.look || {}); if (!Array.isArray(L.hidden)) L.hidden = []; return L; };
const HOME_IDS = ["owed", "next", "time", "profit", "budget", "best", "tax", "miles"];
function applyLook(L) {
  L = L || look(); const root = document.documentElement;
  if (L.accent && L.accent !== "navy") root.setAttribute("data-accent", L.accent); else root.removeAttribute("data-accent");
  if (L.theme === "light" || L.theme === "dark") root.setAttribute("data-theme", L.theme); else root.removeAttribute("data-theme");
  root.setAttribute("data-pack", P.id);
  /* each business type lays Home out its own way: its sections, in its order */
  const hid = new Set(L.hidden);
  HOME_IDS.forEach(k => { const el = $("#h-" + k); if (el) el.hidden = hid.has(k) || !P.home.some(h => h[0] === k); });
  placeGroups();
  try { document.title = S.profile.biz || "Small Business"; } catch (e) {}
  syncBarColor();
}
/* Home's sections in this business type's order. On the open foldable iPhone or iPad they deal into two columns
   (first left, second right, and so on); on phones they stay in one column */
const wideQ = window.matchMedia ? window.matchMedia("(min-width: 860px) and (min-height: 500px)") : null;
function placeGroups() {
  const a = $("#hgA"), b = $("#hgB"); if (!a || !b || typeof P === "undefined" || !P) return;
  const wide = !!(wideQ && wideQ.matches); let n = 0;
  P.home.forEach(h => { const el = $("#h-" + h[0]); if (!el) return; (wide && !el.hidden && n++ % 2 ? b : a).appendChild(el); });
}
try { if (wideQ) { if (wideQ.addEventListener) wideQ.addEventListener("change", placeGroups); else if (wideQ.addListener) wideQ.addListener(placeGroups); } } catch (e) {}
/* the phone's own bars (and the side strip on iPhone Duo, which Safari fills with the page's background color)
   match the app's background, including when Appearance is set to Light or Dark by hand */
function syncBarColor() {
  try { const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim(); if (!bg) return;
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute("content", bg)); } catch (e) {}
}
try { const dq = window.matchMedia("(prefers-color-scheme: dark)"); if (dq.addEventListener) dq.addEventListener("change", syncBarColor); else if (dq.addListener) dq.addListener(syncBarColor); } catch (e) {}
const homeTitle = k => (P.home.find(h => h[0] === k) || [0, k])[1];
/* one page head for every tab: a big centered title with a gray line under it; the title slides into the bar on scroll */
const SUBS = {};
function setSub(t, s) { SUBS[t] = s || ""; if (t === (typeof tab === "undefined" ? null : tab) || (!tab && t === "home")) setTitles(); }
function setTitles() {
  const t = (typeof tab === "undefined" ? null : tab) || "home", s = SUBS[t] || "";
  const title = t === "home" ? (S.profile.biz || "Small Business") : t === "clients" ? Wd(P.clients, 1) : { money: "Money", cal: "Calendar", tools: "Tools", more: "Menu" }[t] || "";
  const pt = $("#pageTitle"), bt = $("#barTitleT"), bs = $("#barSub"), ps = $("#pageSub");
  if (pt) pt.textContent = title; if (bt) bt.textContent = title; if (bs) bs.textContent = s; if (ps) { ps.textContent = s; ps.hidden = !s; }
}

/* ---------- render ---------- */
function render() {
  P = own(PACKS, S.profile.type) ? PACKS[S.profile.type] : PACKS.trades;
  applyLook();
  $("#clientsTab").textContent = Wd(P.clients, 1); $("#clientBack").textContent = "All " + Wd(P.clients, 1); $("#bmIc").innerHTML = packIcon(P.id);
  renderHome(); renderClients(); renderInv(); renderSpend(); renderBudget(); renderCalTab(); renderTime(); renderTodo(); renderTools(); renderMore(); renderNudge();
  const late = overdueList().length, mb = $("#moneyBadge"); mb.hidden = !late; mb.textContent = late > 9 ? "9+" : late;
  const today = S.jobs.filter(j => j.date === iso(TODAY) && j.status !== "done").length, cb = $("#calBadge"); cb.hidden = !today; cb.textContent = today > 9 ? "9+" : today;
  if (!render.done) { render.done = true; requestAnimationFrame(() => requestAnimationFrame(() => fillIn(document))); }
  else { const root = document.documentElement; root.classList.add("instant"); fillIn(document, true); void root.offsetWidth; requestAnimationFrame(() => root.classList.remove("instant")); }
  pagersFit(); setTitles();
}
function fillIn(scope, all) {
  scope.querySelectorAll("[data-w]").forEach(el => { if (all || !el.closest("[hidden]")) el.style.width = el.dataset.w; });
  scope.querySelectorAll("[data-h]").forEach(el => { if (all || !el.closest("[hidden]")) el.style.height = el.dataset.h; });
  scope.querySelectorAll("[data-arc]").forEach(el => { if (all || !el.closest("[hidden]")) el.style.strokeDashoffset = 100 - (+el.dataset.arc || 0); });
}
/* one ring, like the Fitness app */
function ringSvg(pct, col, mid, cls) {
  return `<span class="ringsvg ${cls || ""}"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="trk" cx="50" cy="50" r="43" style="stroke-width:10"/>${pct > 0 ? `<circle class="arc" cx="50" cy="50" r="43" pathLength="100" style="stroke-width:10;stroke:${col}" data-arc="${Math.min(100, pct).toFixed(1)}"/>` : ""}</svg><span class="mid">${mid}</span></span>`;
}
const bar = (pct, color, cls) => `<span class="${cls || "mini-track"}"><span style="background:${color}" data-w="${Math.max(0, Math.min(100, pct)).toFixed(1)}%"></span></span>`;
const pill = (s, label) => `<span class="pilltag st-${s}">${s === "paid" || s === "won" ? ICON.check.replace("<svg", '<svg width="11" height="11"') : ""}${esc(label)}</span>`;
const heroGo = t => `<span class="hero-go">${esc(t)} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" style="fill:none;stroke:currentColor;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round"/></svg></span>`;
const dchip = (d, col, top) => { const dt = D(d); return `<span class="dchip" style="background:color-mix(in srgb, ${col} 13%, var(--surface))"><small>${top || MON[dt.getMonth()]}</small><b class="num" style="color:${col}">${dt.getDate()}</b></span>`; };

/* an invoice as a card in a wallet */
function invCard(x, mini) {
  const t = totals(x), s = invStatus(x), c = clientOf(x.clientId) || { name: "No " + P.client, id: "x" };
  const hue = s.s === "over" ? "late" : "h" + clientHue(c);
  return `<button class="wcard ${hue} press ${mini ? "mini" : ""}" data-act="inv-open" data-id="${esc(x.id)}" aria-label="Invoice ${esc(x.num)}, ${esc(c.name)}, ${money(t.due)} owed, ${esc(s.label)}">
    <span class="w1"><small>Invoice ${docNum(x)}</small><span class="wpill ${s.s === "over" ? "bad" : ""}">${esc(s.label)}</span></span>
    <span class="w2"><b>${esc(c.name)}</b></span>
    <span class="w3"><span class="no">${esc(x.items[0] ? x.items[0].desc : "")}</span><span class="ex"><small>${t.paid ? "Left to pay" : "Owed"}</small><b class="num big">${money(t.due)}</b></span></span></button>`;
}
/* a client as a card */
function clientCard(c, act) {
  const owes = sum(owedList().filter(x => x.clientId === c.id), x => totals(x).due), yr = period("year"), paid = sum(S.payments.filter(p => p.clientId === c.id && inRange(p.date, yr.a, yr.b)), p => p.amount);
  const late = overdueList().some(x => x.clientId === c.id), nextJob = upcomingJobs().find(j => j.clientId === c.id);
  return `<button class="wcard h${clientHue(c)} press" data-act="${act || "client-open"}" data-id="${esc(c.id)}" aria-label="${esc(c.name)}${owes ? ", owes " + money(owes) : ""}">
    <span class="w1"><small>${esc(c.company && c.company !== c.name ? c.company : c.city || Wd(P.client, 1))}</small>${owes ? `<span class="wpill ${late ? "bad" : "warn"}">Owes ${money(owes)}</span>` : paid ? `<span class="wpill">${ICON.check}Paid up</span>` : ""}</span>
    <span class="w2"><b>${esc(c.name)}</b></span>
    <span class="w3"><span class="no">${nextJob ? "Next: " + shortD(nextJob.date) + (nextJob.time ? ", " + clock(nextJob.time) : "") : esc(c.phone || "")}</span><span class="ex"><small>This year</small><b class="num">${money(paid)}</b></span></span></button>`;
}

/* --- home --- */
function renderHome() {
  setSub("home", TODAY.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
  $("#sampleBar").innerHTML = S.sample ? `<button class="sample-bar press" data-act="onboard"><span><b>Example data.</b> Set up your own business.</span>${ICON.chev}</button>` : "";
  renderAsk();
  renderHero(); renderHomeToday(); renderHomeWeek(); renderHomeTools();
  renderHomeOwed(); renderHomeNext(); renderHomeTime(); renderHomeProfit(); renderHomeBudget(); renderHomeBest(); renderHomeTax(); renderHomeMiles();
}
function renderHero() {
  const h = $("#hero"), owed = owedList(), late = overdueList(), jobs = upcomingJobs();
  let html = "", href = "#money";
  if (P.hero === "owed" && owed.length) {
    const tot = sum(owed, x => totals(x).due);
    html = `<div><div class="lbl">Owed to You</div><div class="big num">${moneyK(tot)}</div><div class="what">${pl(owed.length, "unpaid invoice")}${late.length ? ` · ${late.length} late` : ""}</div><div class="sub">${late.length ? "Oldest was due " + longD(late[0].due) : "Next due " + longD(owed[0].due)}</div></div>`;
  } else if ((P.hero === "today" || P.hero === "next" || P.hero === "owed") && jobs.length) {
    const j = jobs[0], n = inDays(j.date), c = clientOf(j.clientId), more = jobs.filter(x => x.date === j.date).length - 1; href = "#cal";
    const big = n === 0 && j.time ? clock(j.time).replace(/ (AM|PM)/, "<small>$1</small>") : n === 0 ? "Today" : n === 1 ? "Tomorrow" : n + "<small>days</small>";
    html = `<div><div class="lbl">${n === 0 ? "Next Up Today" : tc("Next " + P.job)}</div><div class="big num">${big}</div><div class="what">${esc(j.title)}${c ? " · " + esc(c.name) : ""}</div><div class="sub">${WD[D(j.date).getDay()]}, ${longD(j.date)}${j.time && n !== 0 ? " at " + clock(j.time) : ""}${j.price ? " · " + money(j.price) : ""}</div></div>`;
  } else {
    const pm = period("month"), pr = profitOf(pm.a, pm.b), lm = period("month", addMonths(TODAY, -1)), last = profitOf(lm.a, lm.b);
    const diff = r2(pr.net - last.net); href = "#money";
    html = `<div><div class="lbl">Profit in ${MONTHS[TODAY.getMonth()]}</div><div class="big num">${moneyK(pr.net)}</div><div class="what">${money(pr.inc)} in · ${money(pr.out)} out</div><div class="sub">${last.inc || last.out ? (diff >= 0 ? "Up " : "Down ") + money(Math.abs(diff)) + " from all of " + MONTHS[D(lm.a).getMonth()] : "Nothing logged last month."}</div></div>`;
  }
  h.setAttribute("href", href);
  h.innerHTML = `<div class="in">${html}</div>`;
  /* label from the card's own lines, after they're drawn, so a screen reader hears the numbers too */
  h.setAttribute("aria-label", [...h.querySelectorAll(".lbl, .big, .what, .sub")].map(x => x.textContent.trim()).filter(Boolean).join(". "));
}
function renderHomeOwed() {
  const owed = owedList(), tot = sum(owed, x => totals(x).due);
  $("#h-owed").innerHTML = `<div class="group-h"><h2>${esc(homeTitle("owed"))}</h2>${owed.length ? `<span class="tot num">${money(tot)}</span>` : ""}<a href="#money" class="press">See All</a></div>` +
    (owed.length ? `<div class="wscroll">${owed.map(x => invCard(x, true)).join("")}</div>` : `<div class="list">${empty("var(--ok)", "Nobody owes you right now.")}<button class="li addrow" data-act="inv-new"><span class="ic">${ICON.plus}</span><span class="tx">New Invoice</span></button></div>`);
}
function jobRow(j, withDate) {
  const c = clientOf(j.clientId), done = j.status === "done", dt = D(j.date);
  return `<div class="lrow jrow ${done ? "done" : ""}" style="padding-left:14px">
    <button class="check ${done ? "on" : ""}" data-act="job-done" data-id="${esc(j.id)}" aria-pressed="${done}" aria-label="Mark ${esc(j.title)} ${done ? "not done" : "done"}"><span>${ICON.check}</span></button>
    <button class="li-main" data-act="job-edit" data-id="${esc(j.id)}"><span class="tx"><b>${esc(j.title || Wd(P.job, 1))}</b><small>${esc([c ? c.name : "", withDate ? WD[dt.getDay()].slice(0, 3) + ", " + short(dt) : "", j.time ? clock(j.time) : ""].filter(Boolean).join(" · "))}</small></span>${j.price ? `<span class="amt num">${money(j.price)}</span>` : ""}</button></div>`;
}
function renderHomeNext() {
  const up = upcomingJobs(), today = up.filter(j => j.date === iso(TODAY)), rest = up.filter(j => j.date !== iso(TODAY)).slice(0, Math.max(2, 5 - today.length));
  $("#h-next").innerHTML = `<div class="group-h"><h2>${esc(homeTitle("next"))}</h2><a href="#cal" class="press">See All</a></div>
    <div class="list">${today.length ? `<div class="secthead">Today</div>${today.map(j => jobRow(j)).join("")}` : ""}${rest.length ? `<div class="secthead">${today.length ? "Next" : "Coming up"}</div>${rest.map(j => jobRow(j, true)).join("")}` : ""}
    ${up.length ? "" : empty("var(--info)", "Nothing booked yet.")}<button class="li addrow" data-act="job-new"><span class="ic">${ICON.plus}</span><span class="tx">${esc(tc("Book " + aOrAn(P.job)))}</span></button></div>`;
}
function timerCard(compact) {
  const on = !!S.timer, m = timerMins(), c = on && clientOf(S.timer.clientId);
  return `<div class="timer ${on ? "on" : ""}"><div class="tt"><small>${on ? "Running" + (c ? " · " + esc(c.name) : "") : "Timer"}</small><b class="num" id="${compact ? "timerHome" : "timerBig"}" data-tick="1">${on ? tick(m) : "0:00:00"}</b>${on && S.timer.note ? `<span>${esc(S.timer.note)}</span>` : ""}</div>
    <button class="tbtn press" data-act="${on ? "timer-stop" : "timer-start"}" aria-label="${on ? "Stop the timer" : "Start the timer"}">${on ? ICON.stop : ICON.play}<span>${on ? "Stop" : "Start"}</span></button></div>`;
}
const tick = m => { const s = Math.floor(m * 60), h = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60; return h + ":" + String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0"); };
function renderHomeTime() {
  const wk = period("week"), mins = sum(S.time.filter(t => inRange(t.date, wk.a, wk.b)), t => t.mins) + timerMins(), goal = P.weekGoal || 0, unb = S.time.filter(t => !t.billed);
  $("#h-time").innerHTML = `<div class="group-h"><h2>${esc(homeTitle("time"))}</h2><button class="lnk press" data-act="go-time">See All</button></div>
    <div class="ringcard"><div class="rings n1"><div class="ringit">${ringSvg(goal ? mins / 60 / goal * 100 : 0, "var(--brand)", `<b class="num">${num(hrsOf(mins))}</b><small>${goal ? "of " + goal + " hrs" : "hrs"}</small>`)}<span class="rt"><b>${num(hrsOf(mins))} hours this week</b><small>${unb.length ? money(sum(unb, t => hrsOf(t.mins) * (t.rate || 0))) + " not billed yet" : "Everything is billed"}</small></span></div></div>${timerCard(true)}</div>`;
}
let profitRange = "month";
function renderHomeProfit() {
  const p = period(profitRange), pr = profitOf(p.a, p.b), max = Math.max(pr.inc, pr.out, 1);
  /* six months of in and out, side by side */
  const months = Array.from({ length: 6 }, (_, i) => period("month", addMonths(TODAY, i - 5))), vals = months.map(m => profitOf(m.a, m.b)), top = Math.max(1, ...vals.map(v => Math.max(v.inc, v.out)));
  const best = bestClients(p.a, p.b).slice(0, 3);
  $("#h-profit").innerHTML = `<div class="group-h"><h2>${esc(homeTitle("profit"))}</h2></div><div class="card pcard">
    <div class="segc" role="group" aria-label="Profit for">${[["month", "Month"], ["quarter", "Quarter"], ["year", "Year"]].map(([k, n]) => `<button class="press ${profitRange === k ? "on" : ""}" data-act="profit-range" data-id="${k}" aria-pressed="${profitRange === k}">${n}</button>`).join("")}</div>
    <div class="pfig"><small>${esc(p.label)} profit</small><b class="num ${pr.net < 0 ? "neg" : ""}">${money(pr.net)}</b></div>
    <div class="io"><div><span><i style="background:var(--ok)"></i>In</span><b class="num">${money(pr.inc)}</b>${bar(pr.inc / max * 100, "var(--ok)")}</div><div><span><i style="background:var(--warn)"></i>Out</span><b class="num">${money(pr.out)}</b>${bar(pr.out / max * 100, "var(--warn)")}</div></div>
    <div class="bars" aria-label="Last six months">${months.map((m, i) => `<div class="bcol"><div class="bpair"><i class="bi" style="background:var(--ok)" data-h="${(vals[i].inc / top * 100).toFixed(1)}%"></i><i class="bo" style="background:var(--warn)" data-h="${(vals[i].out / top * 100).toFixed(1)}%"></i></div><small>${MON[D(m.a).getMonth()]}</small></div>`).join("")}</div>
    ${best.length ? `<div class="kh">Best ${esc(P.clients)}, ${esc(p.label.toLowerCase() === "this week" ? "this week" : p.label)}</div><div class="best">${best.map((b, i) => `<button class="press" data-act="client-open" data-id="${esc(b.c.id)}"><span class="rk">${i + 1}</span><span class="tx"><b>${esc(b.c.name)}</b></span><b class="num">${money(b.v)}</b></button>`).join("")}</div>` : ""}</div>`;
}
function renderHomeBudget() {
  const b = budgetNow(), cats = b.cats.filter(c => c.plan).sort((x, y) => y.plan - x.plan).slice(0, 3);
  $("#h-budget").innerHTML = `<div class="group-h"><h2>${esc(homeTitle("budget"))}</h2><span class="tot">${b.plan ? (b.left >= 0 ? money(b.left) + " left" : money(-b.left) + " over") : ""}</span><button class="lnk press" data-act="go-budget">See All</button></div>` +
    (cats.length ? `<div class="ringcard"><div class="rings n${Math.min(3, cats.length)}">${cats.map(catRing).join("")}</div></div>` : `<div class="list">${empty("var(--info)", "No budget yet.")}<button class="li addrow" data-act="budget-edit"><span class="ic">${ICON.plus}</span><span class="tx">Set Up Budget</span></button></div>`);
}
function catRing(c) {
  const pct = c.plan ? c.spent / c.plan * 100 : 0, over = c.spent > c.plan;
  return `<button class="ringit press" data-act="cat-open" data-id="${esc(c.id)}" aria-label="${esc(catName(c.id))}: ${money(c.spent)} of ${money(c.plan)}">${ringSvg(pct, over ? "var(--warn)" : catColor(c.id), `<b class="num">${moneyK(c.spent)}</b><small>of ${moneyK(c.plan)}</small>`)}<span class="rt"><b>${esc(catName(c.id))}</b>${over ? `<small class="behind">${money(c.spent - c.plan)} over</small>` : `<small>${money(c.plan - c.spent)} left</small>`}</span></button>`;
}
function renderHomeBest() {
  const y = period("year"), best = bestClients(y.a, y.b).slice(0, 5), top = best[0] ? best[0].v : 1;
  $("#h-best").innerHTML = `<div class="group-h"><h2>${esc(homeTitle("best"))}</h2><span class="tot">${TODAY.getFullYear()}</span><a href="#clients" class="press">See All</a></div><div class="list">` +
    (best.length ? best.map(b => `<button class="li" data-act="client-open" data-id="${esc(b.c.id)}"><span class="ic av h${clientHue(b.c)}" aria-hidden="true">${ICON.person}</span><span class="tx"><b>${esc(b.c.name)}</b>${bar(b.v / top * 100, "var(--brand)")}</span><span class="amt num">${money(b.v)}</span></button>`).join("") : empty("var(--ok)", "No payments yet this year.")) + `</div>`;
}
function renderHomeTax() {
  const t = taxNow(), set = t.yr.set, pct = set ? t.paid / set * 100 : 0;
  $("#h-tax").innerHTML = `<div class="group-h"><h2>${esc(homeTitle("tax"))}</h2><button class="lnk press" data-act="tax-open">Details</button></div>
    <button class="ringcard taxcard press" data-act="tax-open"><div class="rings n1"><div class="ringit">${ringSvg(pct, pct >= 100 ? "var(--ok)" : "var(--brand)", `<b class="num">${moneyK(t.paid)}</b><small>paid</small>`)}<span class="rt"><b>Set aside about ${money(set)}</b><small>${Math.round(pctOf() * 100)}% of ${money(t.yr.base)} profit so far in ${t.y}</small>${t.next ? `<small class="${!t.next.paid && inDays(t.next.due) <= 21 ? "behind" : ""}">${t.next.paid ? "Paid for " + esc(t.next.label) : "Next payment " + shortD(t.next.due) + ", about " + money(t.next.set)}</small>` : ""}</span></div></div>
    <span class="est">An estimate to help you save. Not tax advice.</span></button>`;
}
function renderHomeMiles() {
  const y = period("year"), m = period("month"), mi = milesIn(y.a, y.b), ded = mileDed(y.a, y.b);
  $("#h-miles").innerHTML = `<div class="group-h"><h2>${esc(homeTitle("miles"))}</h2><button class="lnk press" data-act="go-miles">See All</button></div>
    <div class="stats"><div><b class="num">${num(milesIn(m.a, m.b))}</b><small>Miles in ${MON[TODAY.getMonth()]}</small></div><div><b class="num">${num(mi)}</b><small>Miles in ${TODAY.getFullYear()}</small></div><div><b class="num" style="color:var(--ok)">${moneyK(ded)}</b><small>Deduction est.</small></div></div>
    <div class="list" style="margin-top:10px"><button class="li addrow" data-act="trip-new"><span class="ic">${ICON.plus}</span><span class="tx">Log a Trip</span></button></div>`;
}

/* --- clients: one stack like Apple Wallet. Tap a card and it opens on top with everything about that person --- */
let clientFocus = null, clientQ = "";
function renderClients() {
  const c = clientFocus && clientOf(clientFocus);
  if (!c) clientFocus = null;
  $("#clientTools").hidden = !c;
  setSub("clients", c ? "" : activeClients().length ? pl(activeClients().length, P.client, P.clients) : "");
  if (c) { $("#clientsBody").innerHTML = clientDetail(c); return; }
  const q = clientQ.trim().toLowerCase(), list = S.clients.filter(x => !x.gone).filter(x => !q || [x.name, x.company, x.city, x.phone, x.email, x.notes].join(" ").toLowerCase().includes(q))
    .sort((a, b) => lastSeen(a).localeCompare(lastSeen(b)));
  $("#clientsBody").innerHTML = `<label class="search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" style="fill:none;stroke:currentColor;stroke-width:2.2"/><path d="M16 16l4 4" style="stroke:currentColor;stroke-width:2.2;stroke-linecap:round"/></svg><span class="sr">Search ${esc(P.clients)}</span><input type="search" id="cq" value="${esc(clientQ)}" placeholder="Search ${esc(P.clients)}" autocomplete="off" enterkeyhint="search"></label>` +
    (list.length ? `<div class="wallet one">${list.map(x => clientCard(x)).join("")}</div>${q ? "" : `<div class="list" style="margin-top:18px"><button class="li addrow" data-act="client-new"><span class="ic">${ICON.plus}</span><span class="tx">${esc(tc("Add " + P.client))}</span></button></div>`}` : `<div class="list" style="margin-top:14px">${q ? "" : `<button class="li addrow" data-act="client-new"><span class="ic">${ICON.plus}</span><span class="tx">${esc(tc("Add " + P.client))}</span></button>`}${empty("var(--info)", q ? "No matches." : "No " + P.clients + " yet.")}</div>`);
  const inp = $("#cq"); inp.oninput = () => { clientQ = inp.value; const pos = inp.selectionStart; renderClients(); const n = $("#cq"); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} };
}
/* most recent at the front of the stack, where you see it whole */
const lastSeen = c => { const d = [...S.jobs.filter(j => j.clientId === c.id).map(j => j.date), ...S.payments.filter(p => p.clientId === c.id).map(p => p.date), c.created || ""].sort().pop() || ""; return d; };
function clientDetail(c) {
  const jobs = S.jobs.filter(j => j.clientId === c.id).sort((a, b) => b.date.localeCompare(a.date)), invs = S.invoices.filter(x => x.clientId === c.id).sort((a, b) => b.date.localeCompare(a.date));
  const owes = sum(owedList().filter(x => x.clientId === c.id), x => totals(x).due), life = sum(S.payments.filter(p => p.clientId === c.id), p => p.amount);
  const addr = addrLines(c), tel = String(c.phone || "").replace(/[^\d+]/g, "");
  const rest = S.clients.filter(x => x !== c && !x.gone).slice(-5);
  return `<div class="wfocus">${clientCard(c, "client-done")}
    <div class="cacts">${tel ? `<a class="cact press" href="tel:${esc(tel)}">${ICON.call}<span>Call</span></a><a class="cact press" href="sms:${esc(tel)}">${ICON.msg}<span>Text</span></a>` : ""}${c.email ? `<a class="cact press" href="mailto:${esc(c.email)}">${ICON.mail}<span>Email</span></a>` : ""}<button class="cact press" data-act="client-edit" data-id="${esc(c.id)}">${ICON.brush}<span>Edit</span></button></div>
    <div class="stats"><div><b class="num">${money(life)}</b><small>Paid in all</small></div><div><b class="num" style="${owes ? "color:var(--warn)" : ""}">${money(owes)}</b><small>Owes now</small></div><div><b class="num">${jobs.length}</b><small>${Wd(P.jobs, 1)}</small></div></div>
    <div class="list">
      <button class="li" data-act="quote-new" data-client="${esc(c.id)}">${ic("violet", ICON.quote)}<span class="tx"><b>New Quote</b></span>${ICON.chev}</button>
      <button class="li" data-act="inv-new" data-client="${esc(c.id)}">${ic("brand", ICON.invoice)}<span class="tx"><b>New Invoice</b></span>${ICON.chev}</button>
      <button class="li" data-act="job-new" data-client="${esc(c.id)}">${ic("info", ICON.cal)}<span class="tx"><b>${esc(tc("Book " + aOrAn(P.job)))}</b></span>${ICON.chev}</button>
      ${owes ? `<button class="li" data-act="remind" data-client="${esc(c.id)}">${ic("warn", ICON.msg)}<span class="tx"><b>Draft Payment Reminder</b><small>You send it from your phone</small></span>${ICON.chev}</button>` : ""}
    </div>
    ${addr.length || c.phone || c.email || c.notes ? `<div class="wdet"><div class="kv">${c.phone ? `<div><small>Phone</small><b>${esc(c.phone)}</b></div>` : ""}${c.email ? `<div><small>Email</small><b>${esc(c.email)}</b></div>` : ""}${addr.length ? `<div class="full"><small>Address</small><b>${addr.map(esc).join("<br>")}</b></div>` : ""}</div>${c.notes ? `<div class="cnote"><small>Notes</small><p>${esc(c.notes)}</p></div>` : ""}</div>` : ""}
    ${invs.length ? `<div class="mhd"><b>Quotes and Invoices</b><span class="num">${invs.length}</span></div><div class="list">${invs.slice(0, 8).map(invRow).join("")}</div>` : ""}
    <div class="mhd"><b>${esc(tc(P.job))} History</b><span class="num">${jobs.length}</span></div><div class="list">${jobs.slice(0, 12).map(j => jobRow(j, true)).join("") || empty("var(--info)", "No " + P.jobs + " yet.")}</div>
    ${rest.length ? `<div class="wpile" aria-label="Other ${esc(P.clients)}">${rest.map(x => clientCard(x, "client-done")).join("")}</div>` : ""}</div>`;
}
function openClient(id) { clientFocus = id; if (sheetClose) sheetClose(true); if (tab === "clients") { renderClients(); fillIn($("#v-clients")); window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); } else { scrollPos.clients = 0; go("clients"); renderClients(); fillIn($("#v-clients")); } }

/* --- money: invoices --- */
let invFilter = "open";
function invRow(x) {
  const t = totals(x), s = invStatus(x), c = clientOf(x.clientId);
  return `<button class="li irow" data-act="inv-open" data-id="${esc(x.id)}">${ic(x.kind === "quote" ? "violet" : s.s === "over" ? "warn" : s.s === "paid" ? "ok" : "brand", x.kind === "quote" ? ICON.quote : ICON.invoice)}<span class="tx"><b>${esc(c ? c.name : "No " + P.client)}</b><small>${docWord(x)} ${docNum(x)} · ${esc(x.items[0] ? x.items[0].desc : "")}</small></span><span class="amt num">${money(x.kind === "invoice" && s.s !== "paid" && t.paid ? t.due : t.total)}<span class="pwrap">${pill(s.s, s.label)}</span></span></button>`;
}
function renderInv() {
  const owed = owedList(), late = overdueList(), pm = period("month");
  const lists = { open: owed, quotes: S.invoices.filter(x => x.kind === "quote"), paid: S.invoices.filter(x => x.kind === "invoice" && invStatus(x).s === "paid"), draft: S.invoices.filter(x => x.status === "draft" && x.kind === "invoice"), all: S.invoices.slice() };
  const list = (lists[invFilter] || owed).slice().sort((a, b) => invFilter === "open" ? String(a.due || "9").localeCompare(String(b.due || "9")) : b.date.localeCompare(a.date) || b.num - a.num);
  const months = []; if (invFilter !== "open") list.forEach(x => { const m = x.date.slice(0, 7); if (!months.length || months[months.length - 1].m !== m) months.push({ m, items: [] }); months[months.length - 1].items.push(x); });
  $("#pgInv").innerHTML = `<div class="pstats"><div><b class="num">${moneyK(sum(owed, x => totals(x).due))}</b><small>Owed</small></div><div><b class="num" style="${late.length ? "color:var(--warn)" : ""}">${moneyK(sum(late, x => totals(x).due))}</b><small>Late</small></div><div><b class="num" style="color:var(--ok)">${moneyK(incomeIn(pm.a, pm.b))}</b><small>Paid in ${MON[TODAY.getMonth()]}</small></div></div>
    ${late.length ? `<div class="latecard"><div>${ic("warn", ICON.bell)}<span class="tx"><b>${pl(late.length, "invoice")} past due</b><small>A friendly reminder usually does it.</small></span></div><button class="btn primary press" data-act="remind" data-id="${late[0].id}">Draft Reminder</button></div>` : ""}
    <div class="chips" role="group" aria-label="Show">${[["open", "Owed", owed.length], ["quotes", "Quotes", lists.quotes.length], ["paid", "Paid", lists.paid.length], ["draft", "Drafts", lists.draft.length], ["all", "All", S.invoices.length]].filter(([k, , n]) => n || k === "open" || k === "all").map(([k, n, c]) => `<button class="press ${invFilter === k ? "on" : ""}" data-act="inv-filter" data-id="${k}" aria-pressed="${invFilter === k}">${n}<span class="cnt">${c}</span></button>`).join("")}</div>
    ${list.length ? (invFilter === "open" ? `<div class="list" style="margin-top:14px">${list.map(invRow).join("")}</div>` : months.slice(0, 12).map(({ m, items }) => { const dt = D(m + "-01"); return `<div class="mhd"><b>${MONTHS[dt.getMonth()]}${dt.getFullYear() !== TODAY.getFullYear() ? " " + dt.getFullYear() : ""}</b><span class="num">${money(sum(items, x => totals(x).total))}</span></div><div class="list">${items.map(invRow).join("")}</div>`; }).join("")) : `<div class="list" style="margin-top:14px">${empty("var(--ok)", invFilter === "open" ? "Nobody owes you right now." : "Nothing here yet.")}</div>`}
    <div class="list" style="margin-top:22px"><button class="li addrow" data-act="inv-new"><span class="ic">${ICON.plus}</span><span class="tx">New Invoice</span></button><button class="li addrow" data-act="quote-new"><span class="ic">${ICON.plus}</span><span class="tx">New Quote</span></button><button class="li addrow" data-act="pay-new"><span class="ic">${ICON.plus}</span><span class="tx">Log a Payment</span></button></div>`;
}

/* --- money: spending and mileage --- */
let spendMode = "exp", spendCat = "all";
function expRow(e) {
  return `<button class="li" data-act="exp-edit" data-id="${esc(e.id)}"><span class="ic" style="background:${catColor(e.cat)}" aria-hidden="true">${glyph(catName(e.cat) + " " + (e.vendor || ""), "receipt")}</span><span class="tx"><b>${esc(e.vendor || catName(e.cat))}${e.photo ? `<i class="clip" aria-label="Receipt saved">${ICON.camera}</i>` : ""}</b><small>${esc(catName(e.cat))} · ${shortD(e.date)}${e.note ? " · " + esc(e.note) : ""}</small></span><span class="amt num">${money(e.amount)}</span></button>`;
}
function tripRow(t) {
  return `<button class="li" data-act="trip-edit" data-id="${esc(t.id)}">${ic("info", ICON.car)}<span class="tx"><b>${esc(t.purpose || [t.from, t.to].filter(Boolean).join(" to ") || "Trip")}</b><small>${shortD(t.date)}${t.from || t.to ? " · " + esc([t.from, t.to].filter(Boolean).join(" to ")) : ""}</small></span><span class="amt num">${num(t.miles)} mi<small>${money(t.miles * mileRate(t.date))}</small></span></button>`;
}
function renderSpend() {
  const pm = period("month"), y = period("year");
  const head = `<div class="pstats"><div><b class="num">${moneyK(spentIn(pm.a, pm.b))}</b><small>Spent in ${MON[TODAY.getMonth()]}</small></div><div><b class="num">${S.expenses.filter(e => e.photo).length}</b><small>Receipts</small></div><div><b class="num">${num(milesIn(y.a, y.b))}</b><small>Miles in ${TODAY.getFullYear()}</small></div></div>
    <div class="segc" role="group" aria-label="Show"><button class="press ${spendMode === "exp" ? "on" : ""}" data-act="spend-mode" data-id="exp" aria-pressed="${spendMode === "exp"}">Expenses</button><button class="press ${spendMode === "trip" ? "on" : ""}" data-act="spend-mode" data-id="trip" aria-pressed="${spendMode === "trip"}">Mileage</button></div>`;
  if (spendMode === "trip") {
    const list = S.trips.slice().sort((a, b) => b.date.localeCompare(a.date)), months = groupMonths(list);
    const own = parseFloat(S.profile.mileRate);
    $("#pgSpend").innerHTML = head + `<div class="card mrate"><div>${ic("ok", ICON.car)}<span class="tx"><b>${money(mileDed(y.a, y.b))} deduction so far</b><small>${isFinite(own) && own > 0 ? `Your rate: ${Math.round(own * 1000) / 10}¢ a mile` : `IRS rate: 76¢ a mile from July 1, 2026 (72.5¢ before)`}</small></span></div><button class="smallbtn press" data-act="rates">Edit</button></div>` +
      (months.length ? months.slice(0, 12).map(({ m, items }) => `<div class="mhd"><b>${monthLabel(m)}</b><span class="num">${num(sum(items, t => t.miles))} mi</span></div><div class="list">${items.map(tripRow).join("")}</div>`).join("") : `<div class="list" style="margin-top:14px">${empty("var(--info)", "No trips yet.")}</div>`) +
      `<div class="list" style="margin-top:22px"><button class="li addrow" data-act="trip-new"><span class="ic">${ICON.plus}</span><span class="tx">Log a Trip</span></button></div><div class="note">The app doesn't track your location.</div>`;
    return;
  }
  const cats = [...new Set(S.expenses.map(e => e.cat))].sort((a, b) => P.cats.indexOf(a) - P.cats.indexOf(b));
  if (spendCat !== "all" && !cats.includes(spendCat)) spendCat = "all";
  const list = S.expenses.filter(e => spendCat === "all" || e.cat === spendCat).sort((a, b) => b.date.localeCompare(a.date)), months = groupMonths(list);
  $("#pgSpend").innerHTML = head + `<div class="chips" role="group" aria-label="Category">${[["all", "All"], ...cats.map(c => [c, catName(c)])].map(([k, n]) => `<button class="press ${spendCat === k ? "on" : ""}" data-act="spend-cat" data-id="${k}" aria-pressed="${spendCat === k}">${k !== "all" ? `<i class="dot" style="background:${catColor(k)}"></i>` : ""}${esc(n)}</button>`).join("")}</div>` +
    (months.length ? months.slice(0, 12).map(({ m, items }) => `<div class="mhd"><b>${monthLabel(m)}</b><span class="num">${money(sum(items, e => e.amount))}</span></div><div class="list">${items.map(expRow).join("")}</div>`).join("") : `<div class="list" style="margin-top:14px">${empty("var(--ok)", "No expenses yet.")}</div>`) +
    `<div class="list" style="margin-top:22px"><button class="li addrow" data-act="exp-new"><span class="ic">${ICON.plus}</span><span class="tx">Add Expense</span></button><button class="li addrow" data-act="exp-photo"><span class="ic">${ICON.camera}</span><span class="tx">Snap a Receipt</span></button></div>`;
}
const groupMonths = list => { const out = []; list.forEach(x => { const m = x.date.slice(0, 7); if (!out.length || out[out.length - 1].m !== m) out.push({ m, items: [] }); out[out.length - 1].items.push(x); }); return out; };
const monthLabel = m => { const dt = D(m + "-01"); return MONTHS[dt.getMonth()] + (dt.getFullYear() !== TODAY.getFullYear() ? " " + dt.getFullYear() : ""); };

/* --- money: budget --- */
function renderBudget() {
  const b = budgetNow(), pm = b.pm, inc = incomeIn(pm.a, pm.b), goal = +S.budget.goal || 0;
  const billsM = sum(S.bills.filter(x => x.every !== "month" && x.every !== "week"), billMonthly);
  const pacePct = b.plan ? b.spent / b.plan : 0, ahead = b.plan && pacePct > b.pace + .1;
  const cats = b.cats.slice().sort((x, y) => P.cats.indexOf(x.id) - P.cats.indexOf(y.id));
  const ringCats = cats.filter(c => c.plan);
  $("#pgBudget").innerHTML = `<div class="card bsum"><small>${MONTHS[TODAY.getMonth()]} Budget</small>
      <div class="bfig"><b class="num ${b.left < 0 ? "neg" : ""}">${money(Math.abs(b.left))}</b><span>${b.left < 0 ? "over plan" : "left to spend"}</span></div>
      ${bar(b.plan ? b.spent / b.plan * 100 : 0, b.left < 0 || ahead ? "var(--warn)" : "var(--brand)", "track")}
      <div class="bline"><span>${money(b.spent)} spent of ${money(b.plan)}</span><span>${Math.round(b.pace * 100)}% of the month gone</span></div>
      ${goal ? `<div class="bgoal"><span>Income goal</span><b class="num">${money(inc)} of ${money(goal)}</b></div>${bar(inc / goal * 100, "var(--ok)")}` : ""}</div>
    ${ringCats.length ? `<div class="ringcard" style="margin-top:12px"><div class="rings n${Math.min(3, ringCats.length)}">${ringCats.map(catRing).join("")}</div></div>` : ""}
    <div class="mhd"><b>Categories</b><button class="lnk press" data-act="budget-edit">Edit</button></div>
    <div class="list">${cats.map(c => `<button class="li brow" data-act="cat-open" data-id="${esc(c.id)}"><span class="ic" style="background:${catColor(c.id)}" aria-hidden="true">${glyph(catName(c.id), "pie")}</span><span class="tx"><span class="ptop"><b>${esc(catName(c.id))}</b><span class="num ${c.plan && c.spent > c.plan ? "over" : ""}">${money(c.spent)}${c.plan ? ` <small>of ${money(c.plan)}</small>` : ""}</span></span>${bar(c.plan ? c.spent / c.plan * 100 : c.spent ? 100 : 0, c.plan && c.spent > c.plan ? "var(--warn)" : catColor(c.id))}</span></button>`).join("") || empty("var(--info)", "No categories yet.")}
      <button class="li addrow" data-act="budget-edit"><span class="ic">${ICON.sliders}</span><span class="tx">Set Monthly Amounts</span></button></div>
    <div class="mhd"><b>Bills</b><span>${billsM ? money(billsM) + "/mo to set aside" : ""}</span></div>
    <div class="list">${S.bills.slice().sort((a, b) => String(a.next).localeCompare(String(b.next))).map(billRow).join("") || empty("var(--info)", "No bills yet.")}
      <button class="li addrow" data-act="bill-new"><span class="ic">${ICON.plus}</span><span class="tx">Add Bill</span></button></div>
    <div class="note">A paid bill is logged as an expense.</div>`;
}
function billRow(b) {
  const n = b.next ? inDays(b.next) : null, late = n != null && n < 0;
  return `<div class="lrow" style="padding-left:14px"><button class="check" data-act="bill-pay" data-id="${esc(b.id)}" aria-label="Mark ${esc(b.name)} paid"><span>${ICON.check}</span></button>
    <button class="li-main" data-act="bill-edit" data-id="${esc(b.id)}"><span class="tx"><b>${esc(b.name)}</b><small style="${late ? "color:var(--warn);font-weight:600" : ""}">${b.next ? (late ? "Was due " : "Due ") + shortD(b.next) + " · " : ""}${esc(everyWord(b.every))}</small></span><span class="amt num">${money(b.amount)}${b.every !== "month" ? `<small>${money(billMonthly(b))}/mo</small>` : ""}</span></button></div>`;
}

/* --- calendar --- */
function evColor(e) {
  if (e.kind === "job") return e.done ? "var(--ink-3)" : "var(--brand)";
  if (e.kind === "inv") return inDays(e.date) < 0 ? "var(--warn)" : "var(--info)";
  if (e.kind === "quote") return "var(--violet)";
  if (e.kind === "bill") return "var(--pink)";
  if (e.kind === "tax") return "var(--ok)";
  return "var(--ink-3)";
}
const EV_ACT = { job: "job-edit", inv: "inv-open", quote: "inv-open", bill: "bill-edit", tax: "tax-open", todo: "todo-edit" };
let calMonth = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1, 12), calSel = iso(TODAY);
function calMove(dir) {
  calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + dir, 1, 12);
  const key = iso(calMonth).slice(0, 7), firstEv = events().find(e => e.date.slice(0, 7) === key);
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
    const kinds = [...new Set(list.map(evColor))].slice(0, 3);
    cells += `<button class="cday${out ? " out" : ""}${k === todayIso ? " today" : ""}${k === calSel ? " sel" : ""}" data-act="cal-day" data-id="${k}" aria-label="${WD[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}${list.length ? ", " + list.length + (list.length === 1 ? " item" : " items") : ""}"${k === calSel ? ' aria-pressed="true"' : ""}><span class="n num">${d.getDate()}</span><span class="cdots">${kinds.map(c => `<i style="background:${c}"></i>`).join("")}</span></button>`;
  }
  const monthJobs = S.jobs.filter(j => j.date.slice(0, 7) === iso(calMonth).slice(0, 7)).length;
  $("#calCard").innerHTML = `<div class="cal">
    <div class="calhd"><div><h2>${MONTHS[m]} <span>${y}</span></h2><small>${monthJobs ? pl(monthJobs, P.job, P.jobs) + " this month" : "No " + P.jobs + " this month"}</small></div>
      ${isNow ? "" : `<button class="caltoday press" data-act="cal-today">Today</button>`}
      <button class="calnav press" data-act="cal-prev" aria-label="Previous month"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" style="fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round"/></svg></button>
      <button class="calnav press" data-act="cal-next" aria-label="Next month"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" style="fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round"/></svg></button></div>
    <div class="calwd" aria-hidden="true">${WD.map(w => `<span>${w[0]}</span>`).join("")}</div>
    <div class="calgrid${dir > 0 ? " in-r" : dir < 0 ? " in-l" : ""}" id="calGrid">${cells}</div>
    <div class="callegend" aria-hidden="true"><span><i style="background:var(--brand)"></i>${Wd(P.jobs, 1)}</span><span><i style="background:var(--info)"></i>Invoices</span><span><i style="background:var(--pink)"></i>Bills</span><span><i style="background:var(--ok)"></i>Taxes</span></div></div>`;
  const sel = D(calSel), list = byDay[calSel] || [], n = inDays(calSel);
  const when = n === 0 ? "Today" : n === 1 ? "Tomorrow" : n === -1 ? "Yesterday" : n > 0 ? "In " + n + " days" : Math.abs(n) + " days ago";
  $("#dayList").innerHTML = `<div class="dayhd"><b>${WD[sel.getDay()]}, ${MONTHS[sel.getMonth()]} ${sel.getDate()}</b><span>${when}</span></div>` +
    `<div class="list dayl">${list.map(dayItem).join("") || `<div class="dayempty0">Nothing on this day.</div>`}<button class="li addrow" data-act="job-new" data-date="${esc(calSel)}"><span class="ic">${ICON.plus}</span><span class="tx">${esc(tc("Book " + aOrAn(P.job)))} on This Day</span></button></div>`;
  calSwipe(); pagersFit();
}
function calSwipe() {
  const g = $("#calGrid"); if (!g) return;
  let x0 = null, y0 = 0;
  g.addEventListener("pointerdown", e => { x0 = e.clientX; y0 = e.clientY; });
  g.addEventListener("pointerup", e => { if (x0 == null) return; const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { g.dataset.swiped = "1"; calMove(dx < 0 ? 1 : -1); } });
  g.addEventListener("click", e => { if (g.dataset.swiped) { e.stopPropagation(); e.preventDefault(); delete g.dataset.swiped; } }, true);
}
const KIND_WORD = () => ({ job: Wd(P.job, 1), inv: "Invoice due", quote: "Quote expires", bill: "Bill", tax: "Taxes", todo: "To-do" });
function dayItem(e) {
  const col = evColor(e);
  return `<button class="li" data-act="${EV_ACT[e.kind]}" data-id="${esc(e.ref)}"><i class="evbar" style="background:${col}"></i><span class="tx"><b style="${e.done ? "text-decoration:line-through;color:var(--ink-2)" : ""}">${esc(e.title)}</b><small>${esc([KIND_WORD()[e.kind], e.sub].filter(Boolean).join(" · "))}</small></span>${ICON.chev}</button>`;
}
function tlItem(e) {
  const n = inDays(e.date), dt = D(e.date), col = evColor(e);
  return `<button class="tli press" data-act="${EV_ACT[e.kind]}" data-id="${esc(e.ref)}">${dchip(e.date, col, WD[dt.getDay()].slice(0, 3))}
    <span class="tx"><b>${esc(e.title)}</b><small>${esc([KIND_WORD()[e.kind], e.sub].filter(Boolean).join(" · "))}</small></span>
    <span class="when"><b class="num ${n <= 3 ? "soon" : ""}">${n === 0 ? "Today" : n === 1 ? "Tmrw" : n + "d"}</b></span></button>`;
}
function renderCalTab() {
  const ahead = events().filter(e => inDays(e.date) >= 0 && inDays(e.date) <= 30 && !(e.kind === "job" && e.done));
  let html = "", last = "";
  ahead.forEach(e => { const key = e.date.slice(0, 7); if (key !== last) { if (last) html += `</div>`; last = key; const cnt = ahead.filter(x => x.date.slice(0, 7) === key).length; html += `<div class="tlm"><h3>${monthLabel(key)}</h3><span>${cnt}</span></div><div class="tl">`; } html += tlItem(e); });
  if (last) html += `</div>`;
  $("#dueList").innerHTML = `<div class="group-h"><h2>Next 30 Days</h2></div>${html || `<div class="list">${empty("var(--ok)", "Nothing in the next 30 days.")}</div>`}`;
  $("#dueSide").innerHTML = `<div class="group-h"><h2>Reminders</h2></div><div class="list">
    <button class="li" data-act="ics">${ic("info", ICON.bell)}<span class="tx"><b>Add to Calendar</b><small>${Wd(P.jobs, 1)}, bills and tax dates, with alerts</small></span>${ICON.chev}</button></div>`;
  renderCal(0);
}

/* --- time --- */
function renderTime() {
  const wk = period("week"), wkList = S.time.filter(t => inRange(t.date, wk.a, wk.b)), mins = sum(wkList, t => t.mins) + timerMins();
  const unb = S.time.filter(t => !t.billed), byClient = {}; unb.forEach(t => { byClient[t.clientId || ""] = (byClient[t.clientId || ""] || []).concat(t); });
  const days = groupDays(S.time.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60));
  $("#pgTime").innerHTML = `<div class="card tcard">${timerCard(false)}</div>
    <div class="pstats"><div><b class="num">${num(hrsOf(mins))}</b><small>Hours this week</small></div><div><b class="num">${num(hrsOf(sum(unb, t => t.mins)))}</b><small>Not billed</small></div><div><b class="num" style="color:var(--ok)">${moneyK(sum(unb, t => hrsOf(t.mins) * (t.rate || 0)))}</b><small>Ready to bill</small></div></div>
    ${Object.keys(byClient).filter(k => k && clientOf(k)).length ? `<div class="mhd"><b>Ready to Bill</b></div><div class="list">${Object.entries(byClient).filter(([k]) => k && clientOf(k)).map(([k, ts]) => `<button class="li" data-act="bill-time" data-client="${k}"><span class="ic av h${clientHue(clientOf(k))}" aria-hidden="true">${ICON.person}</span><span class="tx"><b>${esc(clientName(k))}</b><small>${num(hrsOf(sum(ts, t => t.mins)))} hrs not billed</small></span><span class="amt num">${money(sum(ts, t => hrsOf(t.mins) * (t.rate || 0)))}</span></button>`).join("")}</div>` : ""}
    ${days.map(({ d, items }) => `<div class="mhd"><b>${d === iso(TODAY) ? "Today" : WD[D(d).getDay()] + ", " + shortD(d)}</b><span class="num">${num(hrsOf(sum(items, t => t.mins)))} hrs</span></div><div class="list">${items.map(timeRow).join("")}</div>`).join("") || `<div class="list" style="margin-top:14px">${empty("var(--info)", "No time logged yet.")}</div>`}
    <div class="list" style="margin-top:22px"><button class="li addrow" data-act="time-new"><span class="ic">${ICON.plus}</span><span class="tx">Add Time</span></button></div>`;
}
const groupDays = list => { const out = []; list.forEach(x => { if (!out.length || out[out.length - 1].d !== x.date) out.push({ d: x.date, items: [] }); out[out.length - 1].items.push(x); }); return out; };
function timeRow(t) {
  const c = clientOf(t.clientId);
  return `<button class="li" data-act="time-edit" data-id="${esc(t.id)}">${ic(t.billed ? "ok" : "info", ICON.clock)}<span class="tx"><b>${esc(t.note || "Work")}</b><small>${esc([c ? c.name : "", t.billed ? "Billed" : "Not billed"].filter(Boolean).join(" · "))}</small></span><span class="amt num">${minsToHM(t.mins)}${t.rate ? `<small>${money(hrsOf(t.mins) * t.rate)}</small>` : ""}</span></button>`;
}

/* --- to-do --- */
function todoRow(t) {
  const n = t.due ? inDays(t.due) : null, late = !t.done && n != null && n < 0;
  return `<div class="lrow ${t.done ? "done" : ""}" style="padding-left:14px">
    <button class="check ${t.done ? "on" : ""}" data-act="todo-toggle" data-id="${esc(t.id)}" aria-pressed="${t.done}" aria-label="Mark ${esc(t.text)} ${t.done ? "not done" : "done"}"><span>${ICON.check}</span></button>
    <button class="li-main" data-act="todo-edit" data-id="${esc(t.id)}"><span class="tx"><b>${esc(t.text)}</b>${t.due ? `<small style="${late ? "color:var(--warn);font-weight:600" : ""}">${t.done ? "Done" : "By " + shortD(t.due) + " · " + relDays(n)}</small>` : ""}</span></button></div>`;
}
function renderTodo() {
  const open = S.todos.filter(t => !t.done).sort((a, b) => String(a.due || "9").localeCompare(String(b.due || "9"))), done = S.todos.filter(t => t.done), late = open.filter(t => t.due && inDays(t.due) < 0).length;
  $("#pgTodo").innerHTML = `<div class="pstats"><div><b class="num">${open.length}</b><small>Open</small></div><div><b class="num" style="${late ? "color:var(--warn)" : ""}">${late}</b><small>Late</small></div><div><b class="num">${done.length}</b><small>Done</small></div></div>
    <div class="mhd"><b>Open</b></div>
    <div class="list">${open.map(todoRow).join("") || empty("var(--ok)", "Nothing on your list.")}<button class="li addrow" data-act="todo-new"><span class="ic">${ICON.plus}</span><span class="tx">Add To-Do</span></button></div>
    ${done.length ? `<div class="mhd"><b>Done</b><span class="num">${done.length}</span></div><div class="list">${done.map(todoRow).join("")}</div>` : ""}`;
}

/* --- pages you swipe between (Money and Calendar) --- */
const PAGERS = { money: { el: "#moneyPager", seg: "#moneySeg", i: 0 }, cal: { el: "#calPager", seg: "#calSeg", i: 0 } };
function segSync(k) {
  const pg = PAGERS[k]; document.querySelectorAll(pg.seg + " button").forEach((b, i) => { b.classList.toggle("on", i === pg.i); b.setAttribute("aria-selected", i === pg.i); });
  if (k === "money") setSub("money", ["Invoices and quotes", "Expenses and mileage", MONTHS[TODAY.getMonth()] + " budget"][pg.i]);
  else setSub("cal", [Wd(P.jobs, 1) + ", due dates and bills", S.timer ? "Timer running" : "Hours you work", S.todos.filter(t => !t.done).length ? pl(S.todos.filter(t => !t.done).length, "thing", "things") + " to do" : "All done"][pg.i]);
  fitPager(k);
}
function fitPager(k) { const pg = $(PAGERS[k].el), p = pg && pg.children[PAGERS[k].i]; if (!p || !p.offsetHeight) return; pg.style.height = p.offsetHeight + "px"; }
const pagersFit = () => Object.keys(PAGERS).forEach(k => segSync(k));
function pageGo(k, i, smooth) { const pg = $(PAGERS[k].el); PAGERS[k].i = i; pg.scrollTo({ left: i * pg.clientWidth, behavior: smooth && !reduce ? "smooth" : "auto" }); segSync(k); }
Object.keys(PAGERS).forEach(k => {
  const pg = $(PAGERS[k].el); let raf = 0;
  pg.addEventListener("scroll", () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; const i = Math.round(pg.scrollLeft / Math.max(1, pg.clientWidth)); if (i !== PAGERS[k].i) { PAGERS[k].i = i; segSync(k); } }); }, { passive: true });
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => fitPager(k)); [...pg.children].forEach(c => ro.observe(c)); ro.observe(pg); }
  window.addEventListener("resize", () => { pg.scrollLeft = PAGERS[k].i * pg.clientWidth; fitPager(k); });
});

/* --- menu --- */
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(navigator.userAgent);
const standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
function renderMore() {
  const L = look(), acc = ACCENTS.find(a => a[0] === L.accent) || ACCENTS[0], pf = S.profile;
  $("#moreBody").innerHTML = `
  <div class="group"><div class="list">
    <button class="li" data-act="profile"><span class="ic pk-dot" data-pk="${P.id}">${packIcon(P.id)}</span><span class="tx"><b>${esc(pf.biz || "Your business")}</b><small>${esc([pf.owner, P.name].filter(Boolean).join(" · "))}</small></span>${ICON.chev}</button>
    <button class="li" data-act="invset">${ic("brand", ICON.invoice)}<span class="tx"><b>Invoice Settings</b><small>Due in ${esc(pf.terms || 0)} days · next #${esc(pf.nextInv)}${+pf.salesTax ? " · " + esc(pf.salesTax) + "% sales tax" : ""}</small></span>${ICON.chev}</button>
    <button class="li" data-act="rates">${ic("ok", ICON.bank)}<span class="tx"><b>Taxes and Mileage</b><small>Set aside ${Math.round(pctOf() * 100)}% · ${(() => { const o = parseFloat(pf.mileRate); return isFinite(o) && o > 0 ? Math.round(o * 1000) / 10 + "¢" : "IRS rate"; })()} a mile</small></span>${ICON.chev}</button>
    <button class="li" data-act="mine"><span class="ic" style="background:var(--brand-fill)">${ICON.brush}</span><span class="tx"><b>Appearance</b><small>${esc(acc[1])} · ${L.theme === "auto" ? "Automatic" : esc(tc(L.theme))}</small></span>${ICON.chev}</button>
  </div></div>
  <div class="group"><div class="group-h"><h2>Share and Print</h2></div><div class="list">
    <button class="li" data-act="packet">${ic("ok", ICON.pdf)}<span class="tx"><b>Year-End Packet for Your CPA</b><small>A PDF of income, expenses, mileage and tax payments</small></span>${ICON.chev}</button>
    <button class="li" data-act="ics">${ic("info", ICON.cal)}<span class="tx"><b>Add ${esc(Wd(P.jobs, 1))} to Calendar</b><small>Alerts that work even when the app is closed</small></span>${ICON.chev}</button>
  </div></div>
  <div class="group"><div class="group-h"><h2>Backup</h2></div><div class="list">
    <div class="li">${ic(S.lastBackup ? "ok" : "warn", ICON.up)}<span class="tx"><b>${S.lastBackup ? "Last backup " + esc(longD(S.lastBackup)) : "No backup yet"}</b><small>Everything in one file, receipt photos included</small></span></div>
    <div class="btnrow"><button class="btn primary press" data-act="backup">Back Up Now</button><button class="btn ghost press" data-act="restore">Restore</button></div>
  </div>
  <details class="card keep"><summary><span><b>Your business records stay on this phone</b><span class="kp">Back up often and keep the file private. CyberHub can't see or restore it.</span></span>${ICON.chev}</summary>
    <div class="kh">What erases it</div>
    <ul><li>Deleting the app from your Home Screen</li><li>A new or reset phone, until you restore a backup</li><li>In a browser tab: clearing website data, or Safari clearing it after about 7 days unused</li><li>On Android: clearing Chrome's data for this site, even if it's on your Home Screen</li></ul>
    <div class="kh">How to keep it</div>
    <ul><li>Use it from your Home Screen. On iPhone, clearing Safari history doesn't touch it there.</li><li>Back up after big changes, and save the file in Files, iCloud Drive or Google Drive. If it's been a week, Home shows a reminder when you open the app.</li><li>Moving from a browser tab to the Home Screen? Back up in one, restore in the other.</li></ul>
    <p class="muted" style="margin:12px 0 0">The backup file isn't locked with a password and holds your ${esc(P.clients)}' names and numbers. Keep it somewhere private. <span id="storeLine"></span></p>
  </details></div>
  <div class="group"><div class="group-h"><h2>Home Screen</h2></div><div class="list">
    <div class="li">${ic("brand", ICON.phone)}<span class="tx"><b>${standalone ? "On Your Home Screen" : "Add to Home Screen"}</b><small>${standalone ? "You're using it from your Home Screen." : "Its own icon, full screen, and its data is safer there."}</small></span></div>
    ${standalone ? "" : `${isAndroid ? "" : `${isIOS ? "" : `<div class="kh2">iPhone</div>`}<ol class="steps"><li>In Safari, tap <b>Share</b> (the square with an arrow).</li><li>Scroll and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>. Then open it from the new icon.</li></ol>`}
      ${isIOS ? "" : `${isAndroid ? "" : `<div class="kh2">Android</div>`}<ol class="steps"><li>In Chrome, tap the <b>three dots</b> at the top right.</li><li>Tap <b>Add to Home screen</b> or <b>Install app</b>.</li><li>Tap <b>Install</b>. Then open it from the new icon.</li></ol>`}`}
  </div></div>
  <div class="group"><div class="group-h"><h2>Data</h2></div><div class="list">
    <button class="li" data-act="load-sample">${ic("warn", ICON.sparkle)}<span class="tx"><b>Load Example</b><small>A made-up business of any kind. Replaces what's here.</small></span>${ICON.chev}</button>
    ${S.sample ? `<button class="li" data-act="onboard">${ic("ok", ICON.wand)}<span class="tx"><b>Start My Own</b><small>Clears the example and sets you up</small></span>${ICON.chev}</button>` : ""}
    <button class="li" data-act="wipe"><span class="ic" style="background:var(--danger-fill)">${ICON.erase}</span><span class="tx"><b style="color:var(--danger)">Delete All Data</b><small id="wipeSub">Erases everything on this device</small></span></button>
  </div></div>
  <div class="about">
    <div class="mark"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1l6 3.5v7L8 15l-6-3.5v-7z" style="fill:none;stroke:currentColor;stroke-width:1.6"/><path d="M8 5l3 1.75v3.5L8 12 5 10.25v-3.5z" style="fill:currentColor"/></svg>CyberHub Software</div>
    <div><b style="color:var(--ink-2)">Small Business</b></div>
    <p>This app keeps the records you enter. Profit, tax and mileage numbers are estimates to help you plan. Mileage uses the IRS standard business rate for each trip's date, unless you set your own rate. It isn't tax, legal or accounting advice, and it doesn't file anything. Check with a tax pro before you rely on a number.</p>
    <p>No account, no ads, no tracking. It doesn't connect to your bank or take card payments. Your business data stays on this phone unless you save or share it.</p>
  </div>`;
}
