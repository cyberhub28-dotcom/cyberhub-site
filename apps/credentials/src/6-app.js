
/* ---------- tabs ---------- */
const TABS = ["home", "creds", "ce", "due", "more"];
const TITLES = { home: "Home", creds: "Credentials", ce: "CE Log", due: "Calendar", more: "Menu" };
let tab = null, menuFrom = "home"; const scrollPos = {};
let lastY = 0, lastShell = inShell();
function show(t) {
  if (!TABS.includes(t)) t = "home";
  if (t === tab) return;
  const prev = tab; if (prev) scrollPos[prev] = getY();
  if (prev === "creds" && walletFocus) { walletFocus = null; renderCreds(); }
  if (sheetClose) sheetClose(true);
  TABS.forEach(x => { document.getElementById("v-" + x).hidden = x !== t; });
  tab = t;
  document.querySelectorAll(".tabbar a").forEach(a => { const on = a.dataset.tab === t; a.classList.toggle("on", on); if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  if (t === "more" && prev && prev !== "more") menuFrom = prev;
  const mb = $("#menuBtn"); mb.classList.toggle("on", t === "more"); $("#brandmark").hidden = t === "more"; $("#backBtn").hidden = t !== "more"; $("#backBtn").setAttribute("aria-label", "Back to " + (menuFrom === "ce" ? P.ceTab : TITLES[menuFrom]));
  const v = $("#v-" + t);
  if (prev && !reduce) { v.classList.remove("enter-l", "enter-r"); void v.offsetWidth; v.classList.add(TABS.indexOf(t) > TABS.indexOf(prev) ? "enter-r" : "enter-l"); }
  scrollToY(scrollPos[t] || 0); lastY = getY();
  onScroll();
  if (t === "more") storageLine().then(s => { const el = $("#storeLine"); if (el) el.textContent = s; });
  requestAnimationFrame(() => requestAnimationFrame(() => fillIn(v)));
}
function go(t) {
  if (t === tab && t === "creds" && walletFocus) { walletFocus = null; renderCreds(); fillIn($("#v-creds")); return; }
  if (t === tab) { scrollToY(0, !reduce); return; }
  try { history.pushState({ tab: t }, "", "#" + t); } catch (e) {}
  show(t);
}
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
  if (a === "cred-open") { if (find(S.creds)) openCard(id); }
  else if (a === "wallet-done") { walletFocus = null; renderCreds(); fillIn($("#v-creds")); }
  else if (a === "wallet-add") addMenu("creds");
  else if (a === "cred-edit") { const c = find(S.creds); if (c) credForm(c.kind, c); }
  else if (a === "reveal") { const c = find(S.creds), box = t.closest(".numshow"); if (c && box) { const on = t.textContent === "Show"; box.innerHTML = maskNum(c, on) + `<button type="button" class="reveal" data-act="reveal" data-id="${esc(c.id)}">${on ? "Hide" : "Show"}</button>`; } }
  else if (a === "cred-new") credForm(t.dataset.kind);
  else if (a === "rule-open") { const r = find(S.rules); if (r) open(() => ruleForm(r)); }
  else if (a === "rule-new") open(() => ruleForm(null, t.dataset.cred));
  else if (a === "ce-new") ceForm();
  else if (a === "ce-edit") { const x = find(S.ce); if (x) ceForm(x); }
  else if (a === "ce-rule") { ceRule = id; renderCE(); fillIn($("#v-ce")); }
  else if (a === "ce-range") { ceRange = id; renderCE(); fillIn($("#v-ce")); }
  else if (a === "ce-cat") { ceCat = id; renderCE(); fillIn($("#v-ce")); }
  else if (a === "setup-card") { const c = find(S.creds); if (c) open(() => finishCard(c)); }
  else if (a === "due-page") duePageGo(+id, true);
  else if (a === "cal-prev") calMove(-1);
  else if (a === "cal-next") calMove(1);
  else if (a === "cal-today") { calSel = iso(TODAY); calMonth = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1, 12); renderCal(0); }
  else if (a === "cal-day") { calSel = id; const d = D(id); if (d.getMonth() !== calMonth.getMonth() || d.getFullYear() !== calMonth.getFullYear()) { const dir = d > calMonth ? 1 : -1; calMonth = new Date(d.getFullYear(), d.getMonth(), 1, 12); renderCal(dir); } else renderCal(0); }
  else if (a === "doc-add") addDoc(t.dataset.cred);
  else if (a === "doc-open") { const d = find(S.docs); if (d) open(() => docForm(d)); }
  else if (a === "doc-share") { const d = find(S.docs); if (d) shareDoc(d); }
  else if (a === "doc-bundle") open(() => bundleSheet());
  else if (a === "todo-new") todoForm();
  else if (a === "todo-edit") { const x = find(S.todos); if (x) open(() => todoForm(x)); }
  else if (a === "todo-toggle") { const x = find(S.todos); if (!x) return; x.done = !x.done; save(); render(); toast(x.done ? "Done" : "Marked not done", () => { x.done = !x.done; commit(); }); }
  else if (a === "prac-new") practiceForm();
  else if (a === "prac-edit") { const x = find(S.practice); if (x) open(() => practiceForm(x)); }
  else if (a === "note-new") noteForm();
  else if (a === "note-edit") { const x = find(S.notes); if (x) noteForm(x); }
  else if (a === "profile") profileForm();
  else if (a === "mine") mineForm();
  else if (a === "windows") windowsForm();
  else if (a === "ics") calendarFile();
  else if (a === "packet") packetSheet();
  else if (a === "audit") auditSheet();
  else if (a === "backup") backup();
  else if (a === "restore") pickRestore();
  else if (a === "unreadable-save") saveUnreadable();
  else if (a === "unreadable-del") {
    if (!t.classList.contains("armed")) { t.classList.add("armed"); t.textContent = "Tap again to delete it"; return; }
    dropUnreadable(); renderNudge(); renderMore(); toast("Deleted the copy that couldn't open");
  }
  else if (a === "import") open(() => pickImport());
  else if (a === "onboard") onboard();
  else if (a === "nudge-x") { try { sessionStorage.setItem(KEY + "-nudge", "1"); } catch (er) {} renderNudge(); }
  else if (a === "pace-x") { try { sessionStorage.setItem(KEY + "-pace", "1"); } catch (er) {} renderNudge(); }
  else if (a === "load-sample") openSheet("See an example", `<p class="lead" style="margin-top:-2px">Each one is a made-up person, with that profession's own cards, words and look. It replaces what's on this phone, so back up first if you need to.</p><div class="packs">${Object.values(PACKS).map(pk => `<button type="button" class="pack press" data-act="sample-pack" data-id="${esc(pk.id)}"><span class="ic pk-dot" data-pk="${esc(pk.id)}" aria-hidden="true">${ICON.license}</span><span class="tx"><b>${esc(pk.name)}</b><small>${esc(pk.who)}</small></span>${ICON.chev}</button>`).join("")}</div>`, null, { noSave: true, cancelLabel: "Close", focus: false });
  else if (a === "sample-pack") { if (sheetClose) sheetClose(true); const theme = S.look && S.look.theme; const snap = JSON.stringify(S); S = sample(id); S.look = theme ? { theme } : undefined; walletFocus = null; askLast = null; askPending = null; commit(); go("home"); scrollToY(0); toast("Example loaded", () => { S = JSON.parse(snap); commit("Undone"); }); }
  else if (a === "wipe") {
    if (!t.classList.contains("armed")) { t.classList.add("armed"); const s = $("#wipeSub"); if (s) s.textContent = "Tap again to erase everything on this device. This can't be undone."; t.querySelector("b").textContent = "Tap again to delete all"; clearTimeout(t._tm); t._tm = setTimeout(renderMore, 5000); return; }
    IMG.clear(); store.del(KEY); S = blank(); S.look = undefined; askLast = null; commit(); go("home"); toast("All data deleted"); later(onboard);
  }
});
document.addEventListener("click", e => { const p = e.target.closest("#packs [data-pack]"); if (!p || p.disabled) return; e.preventDefault(); const id = p.dataset.pack; document.querySelectorAll("#packs [data-pack]").forEach(x => { x.classList.toggle("on", x === p); x.setAttribute("aria-pressed", x === p); });  });
$("#fab").onclick = () => addMenu();
$("#menuBtn").onclick = () => go(tab === "more" ? menuFrom : "more");
$("#backBtn").onclick = () => go(menuFrom);
$("#q").addEventListener("input", e => { ceQ = e.target.value; $("#qClear").hidden = !ceQ; renderCE(); fillIn($("#v-ce")); });
$("#qClear").onclick = e => { e.preventDefault(); ceQ = ""; $("#q").value = ""; $("#qClear").hidden = true; renderCE(); fillIn($("#v-ce")); $("#q").focus(); };
/* Folding or unfolding the Duo switches which part of the page scrolls (see 1-core.js). Carry the scroll
   position across so the page doesn't jump back to the top. */
function onScroll() {
  const sh = inShell(); if (sh !== lastShell) { lastShell = sh; if (lastY) scrollToY(lastY); }
  const y = getY(), b = $("#topbar"); lastY = y;
  b.classList.toggle("scrolled", y > 6);
  /* the big title fades out over the first few points of scrolling and the small bar title takes over, so the big
     title never slides under the app name (a fast flick can outrun a slower fade). The line under it then hands
     over to the small line under the bar title in one quick step, so the two never show at once. */
  const v = tab && document.getElementById("v-" + tab), lt = v && v.querySelector(".lt"), h1 = lt && lt.querySelector("h1");
  if (h1) { const bb = b.getBoundingClientRect().bottom, bt = $("#barTitleT"), bs = $("#barSub");
    if (bt.textContent !== h1.textContent) bt.textContent = h1.textContent;
    const hf = Math.max(0, Math.min(1, (h1.getBoundingClientRect().top - bb + 12) / 14));
    b.classList.toggle("titled", hf < .05);
    lt.style.setProperty("--h1-fade", hf.toFixed(2));
    const sub = [...lt.querySelectorAll("small, p")].find(el => el.getClientRects().length && el.textContent.trim());
    const sf = sub ? Math.max(0, Math.min(1, (sub.getBoundingClientRect().top - bb + 6) / 12)) : 1;
    lt.style.setProperty("--sub-fade", sf.toFixed(2));
    const st = sub ? sub.textContent.trim() : ""; if (bs.textContent !== st) bs.textContent = st;
    b.classList.toggle("dated", !!sub && sf < .05); }
}
window.addEventListener("scroll", onScroll, { passive: true });
document.body.addEventListener("scroll", onScroll, { passive: true });
if (shellQ) { if (shellQ.addEventListener) shellQ.addEventListener("change", onScroll); else if (shellQ.addListener) shellQ.addListener(onScroll); }

/* ---------- boot ---------- */
/* If the saved data can't be read or drawn, the app still opens: the original copy is kept aside on this phone,
   the example opens over it, and a card on Home and in Menu offers to save that copy as a file. */
const bootRaw = store.get(KEY);
S = load();
let bootBad = !S && !!bootRaw;
if (!S) S = sample();
try { render(); route(); } catch (e) { bootBad = !!bootRaw; S = sample(); try { render(); route(); } catch (e2) {} }
if (bootBad) { keepUnreadable(bootRaw); renderNudge(); renderMore(); later(() => toast("We couldn't open your saved data, so the example opened. Your data is kept safe on this phone.")); }
/* ask the phone not to clear this app's storage when space runs low (Android Chrome honors this for installed apps) */
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => { if (!p) navigator.storage.persist(); }).catch(() => {}); } catch (e) {}
/* offline copy for the Home Screen app (only on a real https site; previews skip it) */
try { if ("serviceWorker" in navigator && location.protocol === "https:" && window.top === window) navigator.serviceWorker.register("sw.js").catch(() => {}); } catch (e) {}
})();
