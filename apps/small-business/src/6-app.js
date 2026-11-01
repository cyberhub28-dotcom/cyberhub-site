
/* ---------- tabs ---------- */
const TABS = ["home", "clients", "money", "cal", "tools", "more"];
const TITLES = { home: "Home", clients: "Clients", money: "Money", cal: "Calendar", tools: "Tools", more: "Menu" };
let tab = null, menuFrom = "home"; const scrollPos = {};
function show(t) {
  if (!TABS.includes(t)) t = "home";
  if (t === tab) return;
  const prev = tab; if (prev) scrollPos[prev] = window.scrollY;
  if (prev === "clients" && clientFocus) { clientFocus = null; renderClients(); }
  if (sheetClose) sheetClose(true);
  TABS.forEach(x => { document.getElementById("v-" + x).hidden = x !== t; });
  tab = t;
  document.querySelectorAll(".tabbar a").forEach(a => { const on = a.dataset.tab === t; a.classList.toggle("on", on); if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  if (t === "more" && prev && prev !== "more") menuFrom = prev;
  $("#menuBtn").classList.toggle("on", t === "more"); $("#brandmark").hidden = t === "more"; $("#backBtn").hidden = t !== "more";
  $("#backBtn").setAttribute("aria-label", "Back to " + (menuFrom === "clients" ? Wd(P.clients, 1) : TITLES[menuFrom]));
  setTitles();
  const v = $("#v-" + t);
  if (prev && !reduce) { v.classList.remove("enter-l", "enter-r"); void v.offsetWidth; v.classList.add(TABS.indexOf(t) > TABS.indexOf(prev) ? "enter-r" : "enter-l"); }
  window.scrollTo(0, scrollPos[t] || 0);
  onScroll(); pagersFit();
  if (t === "more") storageLine().then(s => { const el = $("#storeLine"); if (el) el.textContent = s; });
  requestAnimationFrame(() => requestAnimationFrame(() => fillIn(v)));
}
function go(t) {
  if (t === tab && t === "clients" && clientFocus) { clientFocus = null; renderClients(); fillIn($("#v-clients")); return; }
  if (t === tab) { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); return; }
  try { history.pushState({ tab: t }, "", "#" + t); } catch (e) {}
  show(t);
}
/* jump to a page inside Money or Calendar */
function goPage(t, k, i) { if (sheetClose) sheetClose(true); go(t); pageGo(k, i, false); window.scrollTo(0, 0); }
function route() { show((location.hash || "").replace("#", "")); }
window.addEventListener("popstate", route);
window.addEventListener("hashchange", route);
document.addEventListener("click", e => {
  const a = e.target.closest('a[href^="#"]'); if (!a || a.dataset.act) return;
  const t = a.getAttribute("href").slice(1); if (!TABS.includes(t)) return;
  e.preventDefault(); go(t);
});

/* ---------- events ---------- */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-act]"); if (!t) return;
  const a = t.dataset.act, id = t.dataset.id, find = arr => arr.find(x => x.id === id);
  if (t.tagName === "A") e.preventDefault();
  const fromSheet = !!t.closest("#sheetRoot"), open = fn => { if (fromSheet && sheetClose) { sheetClose(); later(fn); } else fn(); };
  const cl = t.dataset.client, dt = t.dataset.date;
  if (a === "page") pageGo(t.dataset.pager, +id, true);
  /* home */
  else if (a === "go-profit") { const el = $("#h-profit"); if (el && !el.hidden) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); else goPage("money", "money", 0); }
  else if (a === "go-miles") { spendMode = "trip"; renderSpend(); goPage("money", "money", 1); }
  else if (a === "go-time") goPage("cal", "cal", 1);
  else if (a === "go-budget") goPage("money", "money", 2);
  else if (a === "go-best") go("clients");
  else if (a === "go-cal") goPage("cal", "cal", 0);
  /* tools and the Needs You Today list */
  else if (a === "tool") open(() => openTool(id));
  else if (a === "snooze") { S.snooze = S.snooze || {}; S.snooze[id] = T(7); save(); renderHomeToday(); toast("Hidden for a week", () => { delete S.snooze[id]; save(); renderHomeToday(); }); }
  else if (a === "today-more") { todayAll = !todayAll; renderHomeToday(); }
  else if (a === "job-bill") { const j = find(S.jobs); if (j) open(() => invoiceForm(null, { clientId: j.clientId, items: [{ desc: j.title || Wd(P.job, 1), qty: 1, rate: j.price }], jobId: j.id })); }
  else if (a === "tpl") { const q = id && S.invoices.find(x => x.id === id); open(() => msgSheet(t.dataset.tpl, { clientId: cl, extra: q ? { quoteAmt: money2(totals(q).total) } : null, onSent: q ? () => { q.followed = iso(TODAY); save(); renderHomeToday(); } : () => renderHomeToday() })); }
  else if (a === "profit-range") { profitRange = id; renderHomeProfit(); fillIn($("#h-profit"), true); }
  /* clients */
  else if (a === "client-open") { if (find(S.clients)) openClient(id); }
  else if (a === "client-done") { clientFocus = null; renderClients(); fillIn($("#v-clients")); }
  else if (a === "client-new") clientForm();
  else if (a === "client-edit") { const c = find(S.clients); if (c) clientForm(c); }
  /* quotes, invoices, payments */
  else if (a === "inv-open") { const x = find(S.invoices); if (x) invDetail(x); }
  else if (a === "inv-new") open(() => invoiceForm(null, cl ? { clientId: cl } : null));
  else if (a === "quote-new") open(() => quoteForm(null, cl ? { clientId: cl } : null));
  else if (a === "inv-filter") { invFilter = id; renderInv(); fitPager("money"); }
  else if (a === "inv-pdf") { const x = find(S.invoices); if (x) makeDocPDF(x); }
  else if (a === "inv-sent") { const x = find(S.invoices); if (x) { x.status = "sent"; commit(); open(() => invDetail(x)); toast(docWord(x) + " marked as sent"); } }
  else if (a === "quote-convert") { const q = find(S.invoices); if (q && !q.invId) open(() => quoteConvert(q)); }
  else if (a === "quote-lost") { const q = find(S.invoices); if (q) { withUndo("Quote " + docNum(q) + " marked declined", () => { q.status = "declined"; }); if (sheetClose) sheetClose(); } }
  else if (a === "quote-open") { const q = find(S.invoices); if (q) { q.status = "sent"; commit("Quote " + docNum(q) + " is open again"); if (sheetClose) sheetClose(); } }
  else if (a === "pay-new") open(() => payForm(null, id ? { invId: id } : cl ? { clientId: cl } : null));
  else if (a === "pay-edit") { const p = find(S.payments); if (p) open(() => payForm(p)); }
  else if (a === "remind") {
    const x = id ? find(S.invoices) : owedList().filter(y => y.clientId === cl).sort((p, q) => String(p.due).localeCompare(String(q.due)))[0];
    if (x) open(() => remindSheet(x)); else toast("Nothing owed right now");
  }
  /* jobs */
  else if (a === "job-new") open(() => jobForm(null, cl || dt ? { clientId: cl || "", date: dt || iso(TODAY) } : null));
  else if (a === "job-edit") { const j = find(S.jobs); if (j) open(() => jobForm(j)); }
  else if (a === "job-done") { const j = find(S.jobs); if (!j) return; j.status = j.status === "done" ? "booked" : "done"; commit(); if (j.status === "done") afterDone(j); else toast("Marked not done"); }
  /* time */
  else if (a === "timer-start") timerStart();
  else if (a === "timer-stop") timerStop();
  else if (a === "time-new") timeForm();
  else if (a === "time-edit") { const x = find(S.time); if (x) timeForm(x); }
  else if (a === "bill-time") billTime(cl);
  /* spending */
  else if (a === "spend-mode") { spendMode = id; renderSpend(); fillIn($("#pgSpend"), true); fitPager("money"); }
  else if (a === "spend-cat") { spendCat = id; renderSpend(); fitPager("money"); }
  else if (a === "exp-new") expenseForm();
  else if (a === "exp-photo") receiptFirst();
  else if (a === "exp-edit") { const x = find(S.expenses); if (x) open(() => expenseForm(x)); }
  else if (a === "trip-new") tripForm();
  else if (a === "trip-edit") { const x = find(S.trips); if (x) tripForm(x); }
  else if (a === "rates") open(() => ratesForm());
  /* budget, bills, taxes */
  else if (a === "budget-edit") budgetForm();
  else if (a === "cat-open") catSheet(id);
  else if (a === "bill-new") billForm();
  else if (a === "bill-edit") { const b = find(S.bills); if (b) open(() => billForm(b)); }
  else if (a === "bill-pay") { const b = find(S.bills); if (b) billPay(b); }
  else if (a === "tax-open") open(() => taxSheet());
  else if (a === "tax-pay") open(() => taxPayForm(id));
  /* calendar */
  else if (a === "cal-prev") calMove(-1);
  else if (a === "cal-next") calMove(1);
  else if (a === "cal-today") { calSel = iso(TODAY); calMonth = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1, 12); renderCal(0); }
  else if (a === "cal-day") { calSel = id; const d = D(id); if (d.getMonth() !== calMonth.getMonth() || d.getFullYear() !== calMonth.getFullYear()) { const dir = d > calMonth ? 1 : -1; calMonth = new Date(d.getFullYear(), d.getMonth(), 1, 12); renderCal(dir); } else renderCal(0); }
  else if (a === "ics") open(() => calendarFile());
  /* to-do */
  else if (a === "todo-new") todoForm();
  else if (a === "todo-edit") { const x = find(S.todos); if (x) open(() => todoForm(x)); }
  else if (a === "todo-toggle") { const x = find(S.todos); if (!x) return; x.done = !x.done; save(); render(); toast(x.done ? "Done" : "Marked not done", () => { x.done = !x.done; commit(); }); }
  /* menu */
  else if (a === "profile") profileForm();
  else if (a === "invset") invSetForm();
  else if (a === "mine") mineForm();
  else if (a === "packet") packetSheet();
  else if (a === "backup") backup();
  else if (a === "restore") pickRestore();
  else if (a === "onboard") onboard();
  else if (a === "kept-save") keptSave();
  else if (a === "kept-help") keptHelp();
  else if (a === "kept-remove") {
    if (!t.classList.contains("armed")) { t.classList.add("armed"); t.textContent = "Tap Again to Remove"; clearTimeout(t._tm); t._tm = setTimeout(() => { t.classList.remove("armed"); t.textContent = "Remove Kept Copy"; }, 5000); return; }
    KEPT.forEach(k => store.del(k)); holdSave = false; saveWarned = false; if (sheetClose) sheetClose(true); save(); render(); toast("Kept copy removed");
  }
  else if (a === "nudge-x") { try { sessionStorage.setItem(KEY + "-nudge", "1"); } catch (er) {} renderNudge(); }
  else if (a === "load-sample") openSheet("Load Example", `<p class="lead">A made-up business with its own Home, words and look. It replaces what's on this phone, so back up first.</p><div class="packs">${Object.values(PACKS).map(pk => `<button type="button" class="pack press" data-act="sample-pack" data-id="${esc(pk.id)}"><span class="ic pk-dot" data-pk="${esc(pk.id)}" aria-hidden="true">${packIcon(pk.id)}</span><span class="tx"><b>${esc(pk.name)}</b><small>${esc(pk.who)}</small></span>${ICON.chev}</button>`).join("")}</div>`, null, { noSave: true, cancelLabel: "Close", focus: false });
  else if (a === "sample-pack") { if (sheetClose) sheetClose(true); const theme = S.look && S.look.theme; const snap = JSON.stringify(S); S = sample(id); S.look = theme ? { theme } : undefined; clientFocus = null; askLast = null; askPending = null; invFilter = "open"; spendMode = "exp"; spendCat = "all"; commit(); go("home"); window.scrollTo(0, 0); toast("Example loaded", () => { S = JSON.parse(snap); commit("Undone"); }); }
  else if (a === "wipe") {
    if (!t.classList.contains("armed")) { t.classList.add("armed"); const s = $("#wipeSub"); if (s) s.textContent = "Tap again to erase everything on this phone. This can't be undone."; t.querySelector("b").textContent = "Tap Again to Delete All"; clearTimeout(t._tm); t._tm = setTimeout(renderMore, 5000); return; }
    IMG.clear(); store.del(KEY); KEPT.forEach(k => store.del(k)); holdSave = false; S = blank(); S.look = undefined; askLast = null; askPending = null; clientFocus = null; commit(); go("home"); toast("All data deleted"); later(onboard);
  }
});
document.addEventListener("click", e => { const p = e.target.closest("#packs [data-pack]"); if (!p) return; e.preventDefault(); document.querySelectorAll("#packs [data-pack]").forEach(x => { const on = x === p; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); const tag = x.querySelector(".pilltag"); if (tag) tag.remove(); if (on) x.insertAdjacentHTML("beforeend", pill("paid", "Chosen")); }); });
$("#fab").onclick = () => addMenu();
$("#menuBtn").onclick = () => go(tab === "more" ? menuFrom : "more");
$("#backBtn").onclick = () => go(menuFrom);
function onScroll() {
  const y = window.scrollY, b = $("#topbar");
  b.classList.toggle("scrolled", y > 6);
  /* the small title shows once the big one has scrolled under the bar */
  const h1 = $("#pageTitle"), ph = $("#pagehead");
  b.classList.toggle("titled", !!h1 && h1.getBoundingClientRect().bottom < b.getBoundingClientRect().bottom - 4);
  if (ph) ph.style.setProperty("--ph-fade", Math.max(0, Math.min(1, 1 - y / 80)).toFixed(2));
}
window.addEventListener("scroll", onScroll, { passive: true });
/* the running timer counts up on screen */
setInterval(() => { if (!S || !S.timer) return; const m = timerMins(); document.querySelectorAll("[data-tick]").forEach(el => { el.textContent = tick(m); }); }, 1000);

/* ---------- boot ---------- */
/* if anything about the saved records stops the screens from opening, keep them safe and open the example instead */
try { S = load() || sample("trades"); render(); }
catch (e) { keepRaw(store.get(KEY)); try { S = sample("trades"); render(); } catch (e2) {} }
/* ask the phone not to clear this app's storage when space runs low (Android Chrome honors this for installed apps) */
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => { if (!p) navigator.storage.persist(); }).catch(() => {}); } catch (e) {}
route();
/* works offline from the Home Screen: only on the real site, not inside a preview frame */
try { if ("serviceWorker" in navigator && location.protocol === "https:" && window.top === window) navigator.serviceWorker.register("sw.js").catch(() => {}); } catch (e) {}
/*TESTHOOK*/
})();
