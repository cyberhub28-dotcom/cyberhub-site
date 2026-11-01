
/* ---------- sheet (forms) ---------- */
let sheetClose = null, sheetPrevFocus = null;
const LB = l => { const s = String(l || ""); return /\?|</.test(s) || s.replace(/\(.*?\)/g, "").trim().split(/\s+/).length > 3 ? s : tc(s); };
const AT = (o) => o ? Object.entries(o).map(([k, v]) => `${k}="${esc(v)}"`).join(" ") : 'autocomplete="off"';
const F = {
  text: (key, label, value, ph, hint, at) => `<div class="field"><label for="f_${key}">${LB(label)}</label><input id="f_${key}" data-key="${esc(key)}" type="text" value="${esc(value == null ? "" : value)}" ${ph ? `placeholder="${esc(ph)}"` : ""} ${AT(at)}>${hint ? `<span class="hint">${hint}</span>` : ""}</div>`,
  tel: (key, label, value, at) => `<div class="field"><label for="f_${key}">${LB(label)}</label><input id="f_${key}" data-key="${esc(key)}" type="tel" inputmode="tel" value="${esc(value || "")}" placeholder="(555) 555-0123" ${AT(at)}></div>`,
  email: (key, label, value, at) => `<div class="field"><label for="f_${key}">${LB(label)}</label><input id="f_${key}" data-key="${esc(key)}" type="email" inputmode="email" autocapitalize="off" value="${esc(value || "")}" placeholder="name@email.com" ${AT(at)}></div>`,
  date: (key, label, value, hint) => `<div class="field"><label for="f_${key}">${LB(label)}</label><input id="f_${key}" data-key="${esc(key)}" type="date" value="${esc(value || "")}">${hint ? `<span class="hint">${hint}</span>` : ""}</div>`,
  time: (key, label, value) => `<div class="field"><label for="f_${key}">${LB(label)}</label><input id="f_${key}" data-key="${esc(key)}" type="time" value="${esc(value || "")}"></div>`,
  num: (key, label, value, ph, hint) => `<div class="field"><label for="f_${key}">${LB(label)}</label><input id="f_${key}" data-key="${esc(key)}" type="number" inputmode="decimal" step="any" min="0" value="${value == null || value === "" ? "" : esc(value)}" ${ph ? `placeholder="${esc(ph)}"` : ""}>${hint ? `<span class="hint">${hint}</span>` : ""}</div>`,
  money: (key, label, value, hint) => `<div class="field"><label for="f_${key}">${LB(label)}</label><span class="moneyin"><i aria-hidden="true">$</i><input id="f_${key}" data-key="${esc(key)}" type="number" inputmode="decimal" step="any" min="0" value="${value == null || value === "" ? "" : esc(value)}" placeholder="0.00"></span>${hint ? `<span class="hint">${hint}</span>` : ""}</div>`,
  area: (key, label, value, ph) => `<div class="field"><label for="f_${key}">${LB(label)}</label><textarea id="f_${key}" data-key="${esc(key)}" rows="3" ${ph ? `placeholder="${esc(ph)}"` : ""}>${esc(value || "")}</textarea></div>`,
  select: (key, label, value, opts, hint) => `<div class="field"><label for="f_${key}">${LB(label)}</label><select id="f_${key}" data-key="${esc(key)}">${opts.map(o => { const [v, n] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(value) ? "selected" : ""}>${esc(n)}</option>`; }).join("")}</select>${hint ? `<span class="hint">${hint}</span>` : ""}</div>`,
  seg: (key, label, value, opts) => `<div class="field"><span class="flabel">${LB(label)}</span><div class="seg${opts.length <= 3 && opts.every(o => !/</.test(o[1]) && String(o[1]).length <= 13) ? " ctl" : ""}" data-key="${esc(key)}" role="group" aria-label="${esc(label)}">${opts.map(([v, n]) => `<button type="button" data-v="${esc(v)}" class="${String(value) === String(v) ? "on" : ""}" aria-pressed="${String(value) === String(v)}">${n}</button>`).join("")}</div></div>`,
  check: (key, label, on, sub) => `<div class="checks one"><label><input type="checkbox" id="f_${key}" data-key="${esc(key)}" ${on ? "checked" : ""}><span>${label}${sub ? `<small>${sub}</small>` : ""}</span></label></div>`,
  /* an address is five boxes, like Contacts: street, apt, then city, state and ZIP on one line */
  addr: (o, label, own) => { const a = k => own ? { autocomplete: k } : null; return `<fieldset class="field addr"><legend class="flabel">${LB(label || "Address")}</legend>
    <label class="sr" for="f_street">Street address</label><input id="f_street" data-key="street" type="text" value="${esc(o.street || "")}" placeholder="Street address" ${AT(a("address-line1"))}>
    <label class="sr" for="f_apt">Apartment, suite or unit</label><input id="f_apt" data-key="apt" type="text" value="${esc(o.apt || "")}" placeholder="Apt, suite or unit (optional)" ${AT(a("address-line2"))}>
    <div class="addr3"><label class="sr" for="f_city">City</label><input id="f_city" data-key="city" type="text" value="${esc(o.city || "")}" placeholder="City" ${AT(a("address-level2"))}>
      <label class="sr" for="f_state">State</label><input id="f_state" data-key="state" type="text" value="${esc(o.state || "")}" placeholder="State" autocapitalize="characters" ${AT(a("address-level1"))}>
      <label class="sr" for="f_zip">ZIP code</label><input id="f_zip" data-key="zip" type="text" inputmode="numeric" value="${esc(o.zip || "")}" placeholder="ZIP" maxlength="10" ${AT(a("postal-code"))}></div></fieldset>`; },
  client: (value, label, optional) => `<div class="field"><label for="f_clientId">${LB(label || Wd(P.client, 1))}</label><select id="f_clientId" data-key="clientId">${optional ? `<option value="">None</option>` : `<option value="" ${value ? "" : "selected"} disabled>Pick a ${esc(P.client)}</option>`}${activeClients().map(c => `<option value="${esc(c.id)}" ${c.id === value ? "selected" : ""}>${esc(c.name)}</option>`).join("")}<option value="__new">New ${esc(tc(P.client))}…</option></select></div>
    <div class="field" id="newClientWrap" hidden><label for="f_newClient">Name</label><input id="f_newClient" data-key="newClient" type="text" autocomplete="off" autocapitalize="words" placeholder="First and last"></div>`
};
const activeClients = () => S.clients.filter(c => !c.gone).sort((a, b) => a.name.localeCompare(b.name));
const numOr = (v, d) => { if (v === "" || v == null) return d; const n = parseFloat(v); return isFinite(n) ? n : NaN; };
const ADDR_KEYS = ["street", "apt", "city", "state", "zip"];
const cleanAddr = v => { const o = {}; ADDR_KEYS.forEach(k => { o[k] = String(v[k] || "").slice(0, k === "street" ? 120 : 60); }); o.state = o.state.length <= 3 ? o.state.toUpperCase() : o.state; return o; };
function wireClient(form) {
  const s = form.querySelector("#f_clientId"), w = form.querySelector("#newClientWrap"); if (!s || !w) return;
  s.addEventListener("change", () => { w.hidden = s.value !== "__new"; if (!w.hidden) setTimeout(() => form.querySelector("#f_newClient").focus(), 60); });
  /* Quick add heard a name that isn't a client yet: start them as a new one */
  if (pendingNewName) { s.value = "__new"; w.hidden = false; form.querySelector("#f_newClient").value = pendingNewName; pendingNewName = null; }
}
/* turns the picker into a client id, making the new client only once everything else checks out */
function resolveClient(v, optional) {
  if (v.clientId === "__new") { const n = String(v.newClient || "").trim(); if (!n) return { err: "Add the new " + P.client + "'s name." }; return { make: n }; }
  if (!v.clientId && !optional) return { err: "Pick a " + P.client + "." };
  return { id: v.clientId || "" };
}
const clientIdOf = r => { if (!r.make) return r.id; const c = { id: uid(), name: r.make.slice(0, 80), created: iso(TODAY) }; S.clients.push(c); return c.id; };

/* sheets stay inside the part of the screen the keyboard leaves showing */
const VV = window.visualViewport;
function fitSheet() {
  const sc = $("#scrim"); if (!sc) return;
  if (VV) { sc.style.top = VV.offsetTop + "px"; sc.style.height = VV.height + "px"; sc.style.bottom = "auto"; }
}
if (VV) { VV.addEventListener("resize", fitSheet); VV.addEventListener("scroll", fitSheet); }

let sheetHide = null, sheetClosedAt = 0;
function openSheet(title, html, onSave, o) {
  o = o || {};
  const root = $("#sheetRoot");
  let scrim = $("#scrim");
  /* a sheet opened right after another one slides in inside the same sheet, like a page in a stack */
  const reuse = !!scrim && scrim.classList.contains("show") && (!!sheetClose || !!sheetHide);
  if (sheetClose) sheetClose(true, reuse);
  if (sheetHide) { clearTimeout(sheetHide); sheetHide = null; }
  /* a save like "Save" or "Add" is the check circle at the top right; a short word ("Edit", "Next") sits there as text;
     anything longer is a full-width button at the bottom. Cancel and Close are the gray X at the top left. */
  const sl = tc(o.saveLabel || "Save"), cl = tc(o.cancelLabel || "Cancel");
  const okIcon = !o.noSave && /^(Save|Add|Done|Log|Book|Start|Save (Invoice|Quote))$/.test(sl), navTxt = !o.noSave && !okIcon && sl.length <= 6, bottom = !o.noSave && !okIcon && !navTxt;
  const xCancel = !o.noCancel && /^(Cancel|Close)$/.test(cl), doneCancel = !o.noCancel && o.noSave && cl === "Done";
  const left = o.noCancel || doneCancel ? "<span></span>" : xCancel ? `<button type="button" class="sbtn" id="sheetCancel" aria-label="${esc(cl)}">${ICON.xmark}</button>` : `<button type="button" class="sbtn txt" id="sheetCancel">${esc(cl)}</button>`;
  const right = doneCancel ? `<button type="button" class="sbtn ok" id="sheetCancel" aria-label="Done">${ICON.ok}</button>` : okIcon ? `<button type="submit" class="sbtn ok" aria-label="${esc(sl)}">${ICON.ok}</button>` : navTxt ? `<button type="submit" class="sbtn txt ok">${esc(sl)}</button>` : "<span></span>";
  const formHtml = `<form class="sheet${reuse ? " swap" : ""}" id="sheetForm" role="dialog" aria-modal="true" aria-labelledby="sheetTitle" novalidate>
    <div class="grab" aria-hidden="true"></div><div class="snav">${left}<h3 id="sheetTitle">${/\?/.test(title) ? title : tc(title)}</h3>${right}</div>${o.dots || ""}${o.lead ? `<p class="lead">${o.lead}</p>` : ""}${html}<div class="err" id="sheetErr" role="alert"></div>
    ${bottom ? `<div class="sheet-actions"><button type="submit" class="btn primary">${esc(sl)}</button></div>` : ""}${o.onDelete ? '<button type="button" class="delrow" id="sheetDel">Delete</button>' : ""}</form>`;
  let prevFocus = document.activeElement;
  if (reuse) {
    const old = $("#sheetForm"), oldH = old ? old.offsetHeight : 0;
    scrim.innerHTML = formHtml;
    const nf = $("#sheetForm"), newH = nf.offsetHeight;
    if (!reduce && oldH && Math.abs(newH - oldH) > 2) {
      nf.style.height = oldH + "px"; nf.style.overflow = "hidden"; void nf.offsetHeight;
      nf.style.transition = "height .42s cubic-bezier(.32,.72,0,1), transform .5s cubic-bezier(.32,.72,0,1)"; nf.style.height = newH + "px";
      setTimeout(() => { nf.style.height = ""; nf.style.overflow = ""; nf.style.transition = ""; }, 440);
    }
    prevFocus = sheetPrevFocus || prevFocus;
  } else {
    if (scrim) scrim.remove();
    root.innerHTML = `<div class="scrim" id="scrim">${formHtml}</div>`;
    scrim = $("#scrim");
    fitSheet();
    requestAnimationFrame(() => requestAnimationFrame(() => scrim.classList.add("show")));
  }
  sheetPrevFocus = prevFocus;
  const form = $("#sheetForm");
  groupFields(form);
  requestAnimationFrame(() => requestAnimationFrame(() => fillIn(form)));
  if (o.focus !== false) { const first = form.querySelector("input:not([type=checkbox]),select,textarea"); if (first && !("ontouchstart" in window)) setTimeout(() => first.focus({ preventScroll: true }), 80); }
  form.querySelectorAll(".seg").forEach(sg => sg.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; sg.querySelectorAll("button").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); }); }));
  /* when the keyboard comes up, bring the box you tapped to the middle of the sheet so its label shows too */
  form.addEventListener("focusin", e => {
    const f = e.target.closest("input:not([type=checkbox]),textarea,select"); if (!f) return;
    setTimeout(() => { fitSheet(); const box = f.closest(".field,.itrow,.addr3") || f, fr = box.getBoundingClientRect(), sr = form.getBoundingClientRect();
      if (fr.top < sr.top + 8 || fr.bottom > sr.bottom - 8) form.scrollTo({ top: form.scrollTop + fr.top - sr.top - Math.max(16, (sr.height - fr.height) / 3), behavior: reduce ? "auto" : "smooth" }); }, 320);
  });
  let closed = false;
  const close = (now, keep) => {
    if (closed) return; closed = true;
    if (o.onClose) o.onClose();
    document.removeEventListener("keydown", onKey); if (sheetClose === close) sheetClose = null; sheetClosedAt = Date.now();
    if (keep) return;
    if (document.activeElement && form.contains(document.activeElement)) document.activeElement.blur();
    if (now) { scrim.remove(); return; }
    /* wait a moment: if another sheet opens right away it takes over this one instead of the sheet dropping and rising again */
    sheetHide = setTimeout(() => {
      sheetHide = null; scrim.classList.remove("show"); form.style.transform = "";
      setTimeout(() => { if (scrim.parentNode && !scrim.classList.contains("show")) { scrim.remove(); if (!sheetClose && prevFocus && prevFocus.focus && document.contains(prevFocus)) prevFocus.focus({ preventScroll: true }); } }, 460);
    }, 90);
  };
  const onKey = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey); sheetClose = close;
  scrim.addEventListener("click", e => { if (e.target === scrim && sheetClose === close) close(); });
  /* pull the sheet down by its top edge to close it */
  let y0 = null, t0 = 0, dy = 0;
  form.addEventListener("pointerdown", e => {
    if (e.button || e.target.closest("input,select,textarea,button,a,.seg,.ask")) return;
    const top = form.getBoundingClientRect().top;
    if (e.clientY - top > 64 || form.scrollTop > 0) return;
    y0 = e.clientY; t0 = Date.now(); dy = 0; form.classList.add("dragging");
    try { form.setPointerCapture(e.pointerId); } catch (x) {}
  });
  form.addEventListener("pointermove", e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); form.style.transform = `translateY(${dy}px)`; scrim.style.backgroundColor = `rgba(10,16,30,${Math.max(0, .4 - dy / 900)})`; });
  const endDrag = () => {
    if (y0 == null) return; const v = dy / Math.max(1, Date.now() - t0); y0 = null;
    form.classList.remove("dragging"); scrim.style.backgroundColor = "";
    if (dy > 120 || (dy > 30 && v > .6)) { form.style.transform = "translateY(100%)"; close(); }
    else form.style.transform = "";
  };
  form.addEventListener("pointerup", endDrag); form.addEventListener("pointercancel", endDrag);
  if (!o.noCancel) $("#sheetCancel").onclick = () => { close(); if (o.onCancel) later(o.onCancel); };
  if (o.onDelete) { const del = $("#sheetDel"); del.onclick = () => {
    if (!del.classList.contains("armed")) { del.classList.add("armed"); del.textContent = "Tap Again to Delete"; clearTimeout(del._t); del._t = setTimeout(() => { del.classList.remove("armed"); del.textContent = "Delete"; }, 4000); return; }
    const snap = JSON.stringify(S), msg = o.onDelete(); close(); commit();
    toast(msg || "Deleted", () => { S = JSON.parse(snap); commit("Brought it back"); }); }; }
  form.onsubmit = e => {
    e.preventDefault();
    const v = {};
    form.querySelectorAll("[data-key]").forEach(el => {
      if (el.classList.contains("seg")) { const on = el.querySelector(".on"); v[el.dataset.key] = on ? on.dataset.v : null; }
      else if (el.type === "checkbox") v[el.dataset.key] = el.checked;
      else v[el.dataset.key] = el.value.trim();
    });
    const msg = onSave ? onSave(v, form) : undefined;
    if (typeof msg === "string" && msg !== "nocommit") { const er = $("#sheetErr"); er.textContent = msg; er.scrollIntoView({ block: "nearest" }); return; }
    if (msg === false) return;
    close(); if (msg !== "nocommit") commit();
  };
  wireClient(form);
  return form;
}
/* fields next to each other become one grouped list, like iOS Settings; two side-by-side boxes become two rows */
function groupFields(form) {
  form.querySelectorAll(".row2").forEach(r => { while (r.firstChild) r.parentNode.insertBefore(r.firstChild, r); r.remove(); });
  const isF = el => el && el.nodeType === 1 && (el.matches(".field:not(:has(> .packs)):not(:has(> .checks)), .checks.one") || (el.tagName === "DIV" && !el.className && el.children.length === 1 && el.firstElementChild.matches(".field")));
  let g = null;
  [...form.children].forEach(el => {
    if (isF(el)) { if (!g) { g = document.createElement("div"); g.className = "fgroup"; el.before(g); } g.appendChild(el); }
    else if (!(el.nodeType === 1 && el.hidden && g)) g = null;
  });
}
function toast(t, undo, label) {
  const el = $("#toast");
  el.innerHTML = `<span>${esc(t)}</span>` + (undo ? `<button type="button" id="toastUndo">${esc(label || "Undo")}</button>` : "");
  el.classList.toggle("act", !!undo); el.classList.add("show");
  if (undo) $("#toastUndo").onclick = () => { el.classList.remove("show"); clearTimeout(toast.t); undo(); };
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), undo ? 4500 : 2200);
}
function commit(msg) { save(); render(); if (msg) toast(msg); }
/* right after a sheet closes, the next step opens fast enough to take over the same sheet */
const later = fn => setTimeout(fn, Date.now() - sheetClosedAt < 60 ? 30 : 300);
const withUndo = (msg, fn) => { const snap = JSON.stringify(S); fn(); commit(); toast(msg, () => { S = JSON.parse(snap); commit("Undone"); }); };
const badDate = (...ds) => ds.some(d => d && !ISO_RX.test(d));
const aOrAn = w => (/^[aeiou]/i.test(w) ? "an " : "a ") + w;

/* --- clients --- */
function clientForm(c, pre, after) {
  const isNew = !c; c = c || Object.assign({}, pre || {});
  const ph = { trades: "Gate code 4412. Dog is friendly.", beauty: "Likes it textured. Color 6N + 20 vol.", creative: "Invoices go to accounts@. Net 30.", food: "No nuts. Pickup after 4.", retail: "Ships to work address.", cleaning: "Key under the blue pot. Skip the office." }[P.id];
  openSheet(isNew ? "New " + esc(P.client) : "Edit " + esc(c.name),
    F.text("name", "Name", c.name, "First and last", "", { autocomplete: "off", autocapitalize: "words" }) + F.text("company", "Company", c.company, "Optional") +
    `<div class="row2">${F.tel("phone", "Phone", c.phone)}${F.email("email", "Email", c.email)}</div>` + F.addr(c) + F.area("notes", "Notes", c.notes, ph), v => {
    if (!v.name) return "Add a name.";
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return "Check the email address.";
    const out = Object.assign({ name: v.name.slice(0, 80), company: v.company.slice(0, 80), phone: v.phone.slice(0, 30), email: v.email.slice(0, 120), notes: v.notes.slice(0, 2000) }, cleanAddr(v));
    if (isNew) { const n = Object.assign({ id: uid(), created: iso(TODAY) }, out); S.clients.push(n); toast(n.name + " added"); if (after) later(() => after(n)); }
    else { Object.assign(c, out); toast("Saved"); }
  }, { onDelete: isNew ? null : () => {
    /* money records keep the name; the card leaves the list */
    const kept = S.invoices.some(x => x.clientId === c.id) || S.payments.some(p => p.clientId === c.id);
    S.jobs = S.jobs.filter(j => !(j.clientId === c.id && j.status !== "done" && j.date >= iso(TODAY)));
    if (kept) c.gone = true; else { S.clients = S.clients.filter(x => x !== c); S.jobs = S.jobs.filter(j => j.clientId !== c.id); S.time = S.time.filter(t => t.clientId !== c.id); }
    clientFocus = null; return c.name + " deleted";
  } });
}

/* --- quotes and invoices --- */
function itemRow(it) {
  return `<div class="itrow"><input class="it-d" type="text" value="${esc(it.desc || "")}" placeholder="What you did or sold" aria-label="Description" autocomplete="off">
    <div class="it-n"><label><small>Qty</small><input class="it-q" type="number" inputmode="decimal" step="any" min="0" value="${it.qty == null ? 1 : esc(it.qty)}" aria-label="Quantity"></label>
    <label><small>Price</small><span class="moneyin"><i aria-hidden="true">$</i><input class="it-r" type="number" inputmode="decimal" step="any" min="0" value="${it.rate == null || it.rate === "" ? "" : esc(it.rate)}" placeholder="0" aria-label="Price each"></span></label>
    <b class="it-t num" aria-live="off"></b><button type="button" class="it-del" aria-label="Remove this line">${ICON.erase}</button></div></div>`;
}
const readItems = form => [...form.querySelectorAll(".itrow")].map(r => ({ desc: r.querySelector(".it-d").value.trim().slice(0, 160), qty: r2(numOr(r.querySelector(".it-q").value, 1)), rate: r2(numOr(r.querySelector(".it-r").value, 0)) }))
  .filter(it => it.desc || it.rate);
function docForm(kind, x, pre) {
  const isNew = !x, pf = S.profile, isQ = kind === "quote";
  x = x || Object.assign({ kind, date: iso(TODAY), items: [], taxPct: +pf.salesTax || 0, discount: 0, notes: "" }, pre || {});
  const items = x.items.length ? x.items : [{ desc: "", qty: 1, rate: "" }];
  const num = isNew ? (isQ ? pf.nextQuote : pf.nextInv) : x.num, word = isQ ? "quote" : "invoice";
  const due = isQ ? (x.valid || T(30)) : (x.due || iso(addDays(D(x.date), +pf.terms || 0)));
  const form = openSheet((isNew ? "New " + word : "Edit " + word) + ` <span class="docno">${isQ ? "Q-" : "#"}${num}</span>`,
    F.client(x.clientId) +
    `<div class="row2">${F.date("date", isQ ? "Date" : "Invoice date", x.date)}${F.date("due", isQ ? "Good until" : "Due", due)}</div>
    <div class="flabel itemshd">Items</div><div class="items" id="items">${items.map(itemRow).join("")}</div>
    <button type="button" class="addline press" id="addItem">${ICON.plus}Add Line</button>
    <div class="svc" aria-label="Quick picks">${P.services.map((s, i) => `<button type="button" class="press" data-svc="${i}">${esc(s[0])}<small>${money(s[1])}${s[2] ? "/" + s[2] : ""}</small></button>`).join("")}</div>
    <div class="row2">${F.money("discount", "Discount", x.discount || "")}${F.num("taxPct", "Sales tax (%)", x.taxPct || "", "0")}</div>
    <div class="tots" id="tots"></div>` +
    F.area("notes", "Note on the " + word, x.notes, isQ ? "Price good for 30 days. 50% to start." : "Thank you!") +
    F.check("draft", "Draft", x.status === "draft", isQ ? "Drafts are for quotes you haven't sent yet." : "Drafts don't count as owed until you send them."), v => {
    const its = readItems(form);
    if (!its.length) return "Add at least one line with a price.";
    if (its.some(i => !i.desc)) return "Give each line a short description.";
    if (!ISO_RX.test(v.date) || badDate(v.due)) return "Check the dates.";
    if (v.due && v.due < v.date) return (isQ ? "Good until" : "Due") + " can't be before the date.";
    const dis = numOr(v.discount, 0), tax = numOr(v.taxPct, 0);
    if (Number.isNaN(dis) || Number.isNaN(tax) || tax > 30) return "Check the discount and sales tax.";
    const rc = resolveClient(v); if (rc.err) return rc.err;
    const out = { clientId: clientIdOf(rc), date: v.date, items: its, discount: r2(dis), taxPct: r2(tax), notes: v.notes.slice(0, 1000) };
    if (isQ) out.valid = v.due; else out.due = v.due;
    if (isNew) {
      Object.assign(x, out, { id: uid(), kind, num, created: iso(TODAY), status: v.draft ? "draft" : "sent" }); S.invoices.push(x);
      if (isQ) pf.nextQuote = num + 1; else pf.nextInv = num + 1;
      if (pre && pre.jobId) { const j = S.jobs.find(y => y.id === pre.jobId); if (j) j.invId = x.id; }
      if (pre && pre.timeIds) S.time.forEach(t => { if (pre.timeIds.includes(t.id)) t.billed = true; });
      if (pre && pre.fromQuote) { const q = S.invoices.find(y => y.id === pre.fromQuote); if (q) { q.status = "accepted"; q.invId = x.id; } }
      if (pre && pre.ask) { askLast = null; askPending = null; }
      toast((isQ ? "Quote " : "Invoice ") + docNum(x) + " saved");
      later(() => invDetail(x));
    } else {
      Object.assign(x, out); if (v.draft) x.status = "draft"; else if (x.status === "draft") x.status = "sent";
      toast("Saved");
    }
  }, { onDelete: isNew ? null : () => { S.invoices = S.invoices.filter(y => y !== x); S.payments.forEach(p => { if (p.invId === x.id) p.invId = ""; }); S.jobs.forEach(j => { if (j.invId === x.id) j.invId = ""; }); return docWord(x) + " " + docNum(x) + " deleted"; }, saveLabel: isNew ? "Save " + word : "Save" });
  const box = form.querySelector("#items");
  const recalc = () => {
    box.querySelectorAll(".itrow").forEach(r => { const t = lineTotal({ qty: numOr(r.querySelector(".it-q").value, 1), rate: numOr(r.querySelector(".it-r").value, 0) }); r.querySelector(".it-t").textContent = t ? money2(t) : ""; });
    const tmp = { kind: "quote", items: readItems(form), discount: numOr(form.querySelector("#f_discount").value, 0) || 0, taxPct: numOr(form.querySelector("#f_taxPct").value, 0) || 0 }, t = totals(tmp);
    form.querySelector("#tots").innerHTML = `${t.disc || t.tax ? `<div><span>Subtotal</span><b class="num">${money2(t.sub)}</b></div>` : ""}${t.disc ? `<div><span>Discount</span><b class="num">−${money2(t.disc)}</b></div>` : ""}${t.tax ? `<div><span>Sales tax</span><b class="num">${money2(t.tax)}</b></div>` : ""}<div class="tt"><span>Total</span><b class="num">${money2(t.total)}</b></div>`;
    box.querySelectorAll(".it-del").forEach(b => { b.hidden = box.children.length < 2; });
  };
  form.addEventListener("input", recalc);
  box.addEventListener("click", e => { const d = e.target.closest(".it-del"); if (!d) return; d.closest(".itrow").remove(); recalc(); });
  const addRow = it => { const last = box.lastElementChild; if (last && !last.querySelector(".it-d").value && !last.querySelector(".it-r").value && it) last.remove(); box.insertAdjacentHTML("beforeend", itemRow(it || { qty: 1 })); recalc(); const n = box.lastElementChild; if (!it) n.querySelector(".it-d").focus(); };
  form.querySelector("#addItem").onclick = () => addRow();
  form.querySelector(".svc").addEventListener("click", e => { const b = e.target.closest("[data-svc]"); if (!b) return; const s = P.services[+b.dataset.svc]; addRow({ desc: s[0], qty: 1, rate: s[1] }); });
  recalc();
  return form;
}
const invoiceForm = (x, pre) => docForm("invoice", x, pre);
const quoteForm = (x, pre) => docForm("quote", x, pre);
/* a quote becomes an invoice in one tap: same lines, today's date, your usual terms */
function quoteConvert(q) {
  const pf = S.profile, snap = JSON.stringify(S), num = pf.nextInv;
  const x = { id: uid(), kind: "invoice", num, created: iso(TODAY), status: "sent", clientId: q.clientId, date: iso(TODAY), due: iso(addDays(TODAY, +pf.terms || 0)), items: q.items.map(i => Object.assign({}, i)), discount: q.discount || 0, taxPct: q.taxPct || 0, notes: "" };
  S.invoices.push(x); pf.nextInv = num + 1; q.status = "accepted"; q.invId = x.id;
  commit(); invDetail(x);
  toast("Invoice " + docNum(x) + " made from the quote", () => { if (sheetClose) sheetClose(); S = JSON.parse(snap); commit("Undone"); });
}
function invDetail(x) {
  const t = totals(x), s = invStatus(x), c = clientOf(x.clientId), isQ = x.kind === "quote", pays = S.payments.filter(p => p.invId === x.id).sort((a, b) => a.date.localeCompare(b.date));
  const big = isQ ? t.total : t.due || t.total, cap = isQ ? "Quote total" : s.s === "paid" ? "Paid in full" : t.paid ? "Left to pay" : "Amount due";
  const when = isQ ? `Sent ${shortD(x.date)}${x.valid ? " · good until " + shortD(x.valid) : ""}` : `Sent ${shortD(x.date)}${x.due ? " · due " + shortD(x.due) : ""}`;
  const row = (act, kind, svg, b, sm) => `<button type="button" class="li" data-act="${act}" data-id="${esc(x.id)}">${ic(kind, svg)}<span class="tx"><b>${b}</b>${sm ? `<small>${sm}</small>` : ""}</span>${ICON.chev}</button>`;
  const acts = [row("inv-pdf", "brand", ICON.pdf, "Share PDF", "Text, email or print it")];
  if (!isQ && t.due > 0 && x.status !== "draft") acts.push(row("pay-new", "ok", ICON.cash, "Log Payment", "Cash, check, card or an app"), row("remind", "warn", ICON.msg, "Draft Reminder", x.reminded ? "Last one " + shortD(x.reminded) : "You send it from your phone"));
  if (x.status === "draft") acts.push(row("inv-sent", "info", ICON.send, "Mark as Sent", isQ ? "" : "Then it counts as owed"));
  if (isQ && !x.invId) acts.push(row("quote-convert", "brand", ICON.invoice, "Make Invoice", "Same lines, dated today"), row(x.status === "declined" ? "quote-open" : "quote-lost", "danger", ICON.erase, x.status === "declined" ? "Mark as Open" : "Mark as Declined", ""));
  if (isQ && x.invId) { const iv = S.invoices.find(y => y.id === x.invId); if (iv) acts.push(`<button type="button" class="li" data-act="inv-open" data-id="${esc(iv.id)}">${ic("ok", ICON.check)}<span class="tx"><b>Invoice ${docNum(iv)}</b></span>${ICON.chev}</button>`); }
  const body = `<div class="docbig"><div>${pill(s.s, s.label)}<small>${cap}</small></div><b class="num">${money2(big)}</b><span>${esc(c ? c.name : "No " + P.client)} · ${when}</span></div>
    <div class="list ilines">${x.items.map(it => `<div class="li"><span class="tx"><b>${esc(it.desc)}</b>${+it.qty !== 1 ? `<small>${num(it.qty)} × ${money2(it.rate)}</small>` : ""}</span><span class="amt num">${money2(lineTotal(it))}</span></div>`).join("")}
      ${t.disc || t.tax ? `<div class="li sub"><span class="tx">Subtotal${t.disc ? ", less " + money2(t.disc) + " off" : ""}${t.tax ? ", plus " + num(x.taxPct) + "% tax" : ""}</span><span class="amt num">${money2(t.total)}</span></div>` : ""}
      ${pays.map(p => `<button type="button" class="li sub" data-act="pay-edit" data-id="${esc(p.id)}"><span class="tx">Paid ${shortD(p.date)}${p.method ? " · " + esc(p.method) : ""}</span><span class="amt num" style="color:var(--ok)">−${money2(p.amount)}</span></button>`).join("")}</div>
    <div class="list">${acts.join("")}</div>${x.notes ? `<p class="muted" style="margin:-4px 2px 14px">${esc(x.notes)}</p>` : ""}`;
  openSheet(`${docWord(x)} <span class="docno">${docNum(x)}</span>`, body, () => { later(() => docForm(x.kind, x)); return "nocommit"; }, { saveLabel: "Edit", cancelLabel: "Close", focus: false });
}

/* --- payments --- */
const METHODS = [["Cash", "Cash"], ["Check", "Check"], ["Card", "Card"], ["App", "Venmo, Zelle or app"], ["Bank", "Bank transfer"]];
function payForm(p, pre) {
  const isNew = !p; p = p || Object.assign({ date: iso(TODAY), method: "" }, pre || {});
  const inv = p.invId && S.invoices.find(x => x.id === p.invId);
  if (isNew && inv && !p.amount) p.amount = totals(inv).due;
  if (inv && !p.clientId) p.clientId = inv.clientId;
  const openFor = cid => owedList().concat(S.invoices.filter(x => x.kind === "invoice" && x.status === "draft")).filter(x => !cid || x.clientId === cid);
  const invOpts = cid => [["", "No invoice, just log it"]].concat(openFor(cid).concat(inv && !openFor(cid).includes(inv) ? [inv] : []).map(x => [x.id, `${docNum(x)} · ${money(totals(x).due)} owed${cid ? "" : " · " + clientName(x.clientId)}`]));
  const form = openSheet(isNew ? "Log a payment" : "Edit payment", F.money("amount", "Amount", p.amount) + F.client(p.clientId, "From") +
    `<div id="invPick">${F.select("invId", "For invoice", p.invId || "", invOpts(p.clientId))}</div>` +
    `<div class="row2">${F.date("date", "Date paid", p.date)}${F.select("method", "How", p.method, [["", "Choose"]].concat(METHODS))}</div>` + F.text("note", "Note", p.note, "Optional"), v => {
    const amt = numOr(v.amount, 0); if (!(amt > 0)) return "Add the amount.";
    if (!ISO_RX.test(v.date)) return "Check the date.";
    const rc = resolveClient(v, true); if (rc.err) return rc.err;
    const out = { amount: r2(amt), date: v.date, method: v.method, note: v.note.slice(0, 200), invId: v.invId, clientId: clientIdOf(rc) };
    const iv = out.invId && S.invoices.find(x => x.id === out.invId);
    if (iv) { out.clientId = iv.clientId; if (iv.status === "draft") iv.status = "sent"; }
    if (isNew) { S.payments.push(Object.assign({ id: uid() }, out)); if (pre && pre.ask) { askLast = null; askPending = null; } }
    else Object.assign(p, out);
    const left = iv ? totals(iv).due : 0;
    toast(iv ? (left > 0 ? money(left) + " still owed on " + docNum(iv) : docNum(iv) + " is paid in full") : "Payment logged");
  }, { onDelete: isNew ? null : () => { S.payments = S.payments.filter(x => x !== p); return "Payment deleted"; } });
  const cs = form.querySelector("#f_clientId"), is = () => form.querySelector("#f_invId");
  cs.addEventListener("change", () => { if (cs.value === "__new") return; const keep = is().value; $("#invPick").innerHTML = F.select("invId", "For invoice", "", invOpts(cs.value)); const n = is(); if ([...n.options].some(o => o.value === keep)) n.value = keep; else if (n.options.length === 2) { n.selectedIndex = 1; fillAmt(); } });
  const fillAmt = () => { const iv = S.invoices.find(x => x.id === is().value), a = form.querySelector("#f_amount"); if (iv && !a.value) a.value = totals(iv).due; };
  form.addEventListener("change", e => { if (e.target.id === "f_invId") { const iv = S.invoices.find(x => x.id === e.target.value); if (iv) { cs.value = iv.clientId; fillAmt(); } } });
}

/* --- reminders: written here, sent by you from Messages or Mail --- */
function remindSheet(x) {
  const c = clientOf(x.clientId) || {}, t = totals(x), late = x.due ? -inDays(x.due) : 0, pf = S.profile;
  const first = firstName(c.name) || "there", me = [firstName(pf.owner), pf.biz].filter(Boolean).join(", "), pay = pf.payNote ? ` You can pay by ${pf.payNote.replace(/\.$/, "")}.` : "";
  const drafts = {
    friendly: `Hi ${first}, just a friendly reminder that invoice ${docNum(x)} for ${money2(t.due)} ${late > 0 ? "was due " + longD(x.due) : late === 0 ? "is due today" : "is due " + longD(x.due)}.${pay} Thank you so much!${me ? "\n" + me : ""}`,
    firm: `Hi ${first}, invoice ${docNum(x)} for ${money2(t.due)} is now ${late > 0 ? pl(late, "day") + " past due" : "due"}. Could you send payment this week?${pay} If something looks wrong on the bill, just let me know and we'll sort it out. Thanks,${me ? "\n" + me : ""}`
  };
  const tone0 = late > 21 ? "firm" : "friendly", tel = String(c.phone || "").replace(/[^\d+]/g, "");
  const form = openSheet("Payment reminder", F.seg("tone", "Tone", tone0, [["friendly", "Friendly"], ["firm", "Firm but kind"]]) +
    `<div class="field"><label for="remText">Message to ${esc(c.name || "your " + P.client)}</label><textarea id="remText" rows="7">${esc(drafts[tone0])}</textarea><span class="hint">Nothing is sent until you send it.</span></div>
    <div class="remacts"><a class="btn primary press" id="remSms" href="#">${ICON.msg}Text</a><a class="btn ghost press" id="remMail" href="#">${ICON.mail}Email</a><button type="button" class="btn ghost press" id="remCopy">${ICON.copy}Copy</button></div>
    ${!tel && !c.email ? `<p class="muted" style="margin:10px 2px 0">No phone or email saved for ${esc(c.name || "them")}. Copy it, or add them to the ${esc(P.client)}'s card.</p>` : ""}`, null, { noSave: true, cancelLabel: "Done", focus: false });
  const ta = form.querySelector("#remText"), smsA = form.querySelector("#remSms"), mailA = form.querySelector("#remMail");
  const sync = () => {
    const b = encodeURIComponent(ta.value);
    smsA.href = "sms:" + tel + (isIOS ? "&" : "?") + "body=" + b;
    mailA.href = "mailto:" + encodeURIComponent(c.email || "") + "?subject=" + encodeURIComponent(`Invoice ${docNum(x)} from ${pf.biz || "me"}`) + "&body=" + b;
    mailA.hidden = !c.email; smsA.hidden = !tel;
  };
  sync(); ta.addEventListener("input", sync);
  form.querySelector(".seg").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { ta.value = drafts[b.dataset.v]; sync(); } });
  const mark = () => { x.reminded = iso(TODAY); save(); };
  smsA.addEventListener("click", mark); mailA.addEventListener("click", mark);
  form.querySelector("#remCopy").onclick = async () => { try { await navigator.clipboard.writeText(ta.value); mark(); toast("Copied. Paste it in a text or email."); } catch (e) { ta.select(); toast("Select and copy it from the box"); } };
}

/* --- jobs --- */
const LENGTHS = [["", "Not set"], ["30", "30 min"], ["60", "1 hour"], ["90", "1½ hours"], ["120", "2 hours"], ["180", "3 hours"], ["240", "4 hours"], ["480", "All day"]];
function jobForm(j, pre) {
  const isNew = !j; j = j || Object.assign({ date: iso(TODAY), time: "", dur: "", status: "booked" }, pre || {});
  const word = Wd(P.job, 1);
  const form = openSheet(isNew ? "Book " + aOrAn(esc(P.job)) : "Edit " + esc(P.job),
    F.text("title", "What", j.title, P.services[0][0]) +
    `<div class="svc" aria-label="Quick picks">${P.services.map((s, i) => `<button type="button" class="press" data-svc="${i}">${esc(s[0])}<small>${money(s[1])}${s[2] ? "/" + s[2] : ""}</small></button>`).join("")}</div>` +
    F.client(j.clientId) + `<div class="row2">${F.date("date", "Day", j.date)}${F.time("time", "Time", j.time)}</div>` +
    `<div class="row2">${F.select("dur", "How long", String(j.dur || ""), LENGTHS)}${F.money("price", "Price", j.price)}</div>` +
    F.area("notes", "Notes", j.notes, "Bring the long ladder") + (isNew ? "" : F.check("done", word + " is done", j.status === "done")), v => {
    if (!v.title) return "Say what the " + P.job + " is.";
    if (!ISO_RX.test(v.date)) return "Check the day.";
    const pr = numOr(v.price, 0); if (Number.isNaN(pr)) return "Check the price.";
    const rc = resolveClient(v); if (rc.err) return rc.err;
    const out = { title: v.title.slice(0, 100), clientId: clientIdOf(rc), date: v.date, time: v.time, dur: +v.dur || "", price: r2(pr), notes: v.notes.slice(0, 1000) };
    if (isNew) { S.jobs.push(Object.assign({ id: uid(), status: "booked" }, out)); if (pre && pre.ask) { askLast = null; askPending = null; } toast(word + " booked for " + shortD(v.date) + (v.time ? " at " + clock(v.time) : "")); }
    else { Object.assign(j, out); const was = j.status; j.status = v.done ? "done" : "booked"; toast("Saved"); if (was !== "done" && j.status === "done") later(() => afterDone(j)); }
  }, { onDelete: isNew ? null : () => { S.jobs = S.jobs.filter(x => x !== j); return word + " deleted"; } });
  form.querySelector(".svc").addEventListener("click", e => { const b = e.target.closest("[data-svc]"); if (!b) return; const s = P.services[+b.dataset.svc]; form.querySelector("#f_title").value = s[0]; const p = form.querySelector("#f_price"); if (!p.value || isNew) p.value = s[1]; });
}
/* a finished job with a price and no invoice: offer the invoice right there */
function afterDone(j) { if (j.price > 0 && !j.invId) toast(Wd(P.job, 1) + " done. Bill it?", () => invoiceForm(null, { clientId: j.clientId, items: [{ desc: j.title, qty: 1, rate: j.price }], jobId: j.id }), "Invoice"); }

/* --- spending --- */
const catOpts = cur => { const ids = P.cats.slice(); if (cur && !ids.includes(cur)) ids.splice(ids.length - 1, 0, cur); return ids.map(id => [id, catName(id)]); };
function expenseForm(e, pre) {
  const isNew = !e; e = e || Object.assign({ date: iso(TODAY), cat: "" }, pre || {});
  let photo = pre && pre.photoData || null, drop = false, touched = !isNew || !!e.cat;
  const cat0 = e.cat || guessCat(e.vendor + " " + (e.note || "")) || P.cats[0];
  const form = openSheet(isNew ? "Add an expense" : "Edit expense", F.money("amount", "Amount", e.amount) +
    `<div class="row2">${F.date("date", "Date", e.date)}${F.select("cat", "Category", cat0, catOpts(cat0))}</div>` +
    F.text("vendor", "Where", e.vendor, "Store or company", "", { autocomplete: "off", autocapitalize: "words" }) + F.text("note", "Note (optional)", e.note, "") +
    F.client(e.clientId, "For a " + esc(P.client) + " (optional)", true) +
    `<div class="field"><span class="flabel">Receipt</span><div class="rcbox" id="rcBox"></div></div>`, v => {
    const amt = numOr(v.amount, 0); if (!(amt > 0)) return "Add the amount.";
    if (!ISO_RX.test(v.date)) return "Check the date.";
    const rc = resolveClient(v, true); if (rc.err) return rc.err;
    const out = { amount: r2(amt), date: v.date, cat: v.cat || "other", vendor: v.vendor.slice(0, 80), note: v.note.slice(0, 200), clientId: clientIdOf(rc) };
    const it = isNew ? Object.assign({ id: uid() }, out) : Object.assign(e, out);
    if (isNew) S.expenses.push(it);
    if (photo) { const had = !!it.photo, key = it.photo = "rc:" + it.id;
      IMG.put(key, photo).then(ok => { if (ok) return; if (!had && it.photo === key) { it.photo = ""; commit(); } toast("The receipt photo couldn't be saved on this phone. Storage may be full: back up, then remove old receipt photos."); }); } else if (drop && it.photo) { IMG.del(it.photo); it.photo = ""; }
    if (pre && pre.ask) { askLast = null; askPending = null; }
    toast(isNew ? money(amt) + " added to " + catName(it.cat) : "Saved");
  }, { onDelete: isNew ? null : () => { S.expenses = S.expenses.filter(x => x !== e); return "Expense deleted"; } });
  const sel = form.querySelector("#f_cat");
  sel.addEventListener("change", () => { touched = true; });
  form.querySelector("#f_vendor").addEventListener("input", ev => { if (touched) return; const g = guessCat(ev.target.value); if (g) sel.value = g; });
  const box = form.querySelector("#rcBox");
  const draw = url => {
    if (!okImg(url)) url = null;
    box.innerHTML = url ? `<img src="${esc(url)}" alt="Receipt photo"><div class="rcacts"><button type="button" class="smallbtn press" id="rcNew">Replace</button><button type="button" class="smallbtn press" id="rcDrop">Remove</button></div>`
      : `<button type="button" class="rcadd press" id="rcNew">${ICON.camera}<span><b>Add a photo of the receipt</b><small>Take one or pick from Photos</small></span></button>`;
    box.querySelector("#rcNew").onclick = () => pickFile("image/*", f => shrinkImage(f).then(u => { photo = u; drop = false; draw(u); }, () => toast("That photo couldn't be opened")));
    const d = box.querySelector("#rcDrop"); if (d) d.onclick = () => { photo = null; drop = true; draw(null); };
  };
  draw(photo); if (!photo && e.photo) IMG.get(e.photo).then(u => { if (u && !photo && !drop) draw(u); });
}
function receiptFirst() { pickFile("image/*", f => shrinkImage(f).then(u => expenseForm(null, { photoData: u }), () => toast("That photo couldn't be opened"))); }
function tripForm(t, pre) {
  const isNew = !t; t = t || Object.assign({ date: iso(TODAY) }, pre || {});
  const form = openSheet(isNew ? "Log a trip" : "Edit trip", `<div class="row2">${F.date("date", "Day", t.date)}${F.num("miles", "Miles", t.miles, "0")}</div>` +
    (isNew ? F.check("round", "Round trip", false, "Doubles the miles for the drive back") : "") +
    `<div class="row2">${F.text("from", "From", t.from, "Home")}${F.text("to", "To", t.to, "Job site")}</div>` +
    F.text("purpose", "Why", t.purpose, "Estimate at the Parks house") + F.client(t.clientId, "For a " + esc(P.client) + " (optional)", true) +
    `<p class="hint" id="tripHint" style="margin:-4px 2px 12px"></p>`, v => {
    let mi = numOr(v.miles, 0); if (!(mi > 0) || mi > 2000) return "Add the miles.";
    if (!ISO_RX.test(v.date)) return "Check the day.";
    if (v.round) mi *= 2;
    const rc = resolveClient(v, true); if (rc.err) return rc.err;
    const out = { date: v.date, miles: r2(mi), from: v.from.slice(0, 80), to: v.to.slice(0, 80), purpose: v.purpose.slice(0, 120), clientId: clientIdOf(rc) };
    if (isNew) S.trips.push(Object.assign({ id: uid() }, out)); else Object.assign(t, out);
    if (pre && pre.ask) { askLast = null; askPending = null; }
    toast(num(out.miles) + " miles logged · about " + money(out.miles * mileRate(out.date)) + " deduction");
  }, { onDelete: isNew ? null : () => { S.trips = S.trips.filter(x => x !== t); return "Trip deleted"; } });
  const hint = () => { let mi = numOr(form.querySelector("#f_miles").value, 0) || 0; const r = form.querySelector("#f_round"); if (r && r.checked) mi *= 2; const d = form.querySelector("#f_date").value || iso(TODAY);
    form.querySelector("#tripHint").textContent = mi ? `${num(mi)} miles × ${Math.round(mileRate(d) * 1000) / 10}¢ = about ${money(mi * mileRate(d))} off your taxable profit` : `Each mile lowers your taxable profit by about ${Math.round(mileRate(d) * 1000) / 10}¢.`; };
  form.addEventListener("input", hint); form.addEventListener("change", hint); hint();
}

/* --- time --- */
const lastRate = cid => { const t = S.time.filter(x => x.clientId === cid && x.rate).sort((a, b) => b.date.localeCompare(a.date))[0]; if (t) return t.rate; const h = P.services.find(s => s[2] === "hr"); return h ? h[1] : ""; };
function timeForm(t, pre) {
  const isNew = !t; t = t || Object.assign({ date: iso(TODAY) }, pre || {});
  const form = openSheet(isNew ? "Add time" : "Edit time", `<div class="row2">${F.date("date", "Day", t.date)}${F.num("hours", "Hours", t.mins ? hrsOf(t.mins) : "", "1.5", "1.5 is an hour and a half")}</div>` +
    F.client(t.clientId, Wd(P.client, 1), true) + F.text("note", "What you worked on", t.note, "Logo round 2") +
    F.money("rate", "Rate per hour (optional)", t.rate != null ? t.rate : lastRate(t.clientId)) + (isNew ? "" : F.check("billed", "Already billed", !!t.billed)), v => {
    const h = numOr(v.hours, 0); if (!(h > 0) || h > 24) return "Add the hours, up to 24.";
    if (!ISO_RX.test(v.date)) return "Check the day.";
    const rt = numOr(v.rate, 0); if (Number.isNaN(rt)) return "Check the rate.";
    const rc = resolveClient(v, true); if (rc.err) return rc.err;
    const out = { date: v.date, mins: Math.round(h * 60), clientId: clientIdOf(rc), note: v.note.slice(0, 160), rate: r2(rt) };
    if (isNew) S.time.push(Object.assign({ id: uid(), billed: false }, out)); else Object.assign(t, out, { billed: !!v.billed });
    if (pre && pre.ask) { askLast = null; askPending = null; }
    toast(minsToHM(out.mins) + " logged");
  }, { onDelete: isNew ? null : () => { S.time = S.time.filter(x => x !== t); return "Time deleted"; } });
  const cs = form.querySelector("#f_clientId"), rt = form.querySelector("#f_rate");
  cs.addEventListener("change", () => { if (cs.value && cs.value !== "__new") { const r = lastRate(cs.value); if (r) rt.value = r; } });
}
function timerStart() {
  openSheet("Start the timer", F.client("", Wd(P.client, 1), true) + F.text("note", "What you're working on", "", "Logo round 2"), v => {
    const rc = resolveClient(v, true); if (rc.err) return rc.err;
    S.timer = { start: new Date().toISOString(), clientId: clientIdOf(rc), note: v.note.slice(0, 160) };
    toast("Timer started");
  }, { saveLabel: "Start", focus: false });
}
function timerStop() {
  if (!S.timer) return;
  const m = Math.max(1, Math.round(timerMins())), tm = S.timer, cid = tm.clientId;
  withUndo(minsToHM(m) + " logged", () => { S.time.push({ id: uid(), date: iso(new Date(tm.start)), mins: m, clientId: cid, note: tm.note || "Work", rate: cid ? r2(+lastRate(cid) || 0) : 0, billed: false }); S.timer = null; });
}
/* unbilled hours become an invoice, one line per day */
function billTime(cid) {
  const ts = S.time.filter(t => !t.billed && t.clientId === cid).sort((a, b) => a.date.localeCompare(b.date)); if (!ts.length) return;
  invoiceForm(null, { clientId: cid, items: ts.map(t => ({ desc: (t.note || "Work") + ", " + shortD(t.date), qty: hrsOf(t.mins), rate: t.rate || +lastRate(cid) || 0 })), timeIds: ts.map(t => t.id) });
}

/* --- budget and bills --- */
function billForm(b, pre) {
  const isNew = !b; b = b || Object.assign({ every: "month", next: T(7), cat: P.cats.includes("rent") ? "rent" : P.cats[0] }, pre || {});
  openSheet(isNew ? "Add a bill" : "Edit bill", F.text("name", "Name", b.name, "Truck insurance") + `<div class="row2">${F.money("amount", "Amount", b.amount)}${F.select("every", "How often", b.every, EVERY.map(e => [e[0], e[1]]))}</div>` +
    `<div class="row2">${F.date("next", "Next due", b.next)}${F.select("cat", "Category", b.cat, catOpts(b.cat))}</div>` +
    `<p class="hint" style="margin:-4px 2px 12px">For a bill that comes every few months, the budget shows how much to put away each month so it's ready.</p>`, v => {
    if (!v.name) return "Give the bill a name.";
    const amt = numOr(v.amount, 0); if (!(amt > 0)) return "Add the amount.";
    if (badDate(v.next)) return "Check the date.";
    const out = { name: v.name.slice(0, 80), amount: r2(amt), every: v.every, next: v.next, cat: v.cat };
    if (isNew) S.bills.push(Object.assign({ id: uid() }, out)); else Object.assign(b, out);
    toast(isNew ? "Bill added" : "Saved");
  }, { onDelete: isNew ? null : () => { S.bills = S.bills.filter(x => x !== b); return "Bill deleted"; } });
}
function billPay(b) {
  withUndo(b.name + " paid. Next due " + shortD(nextAfter(b.next || iso(TODAY), b.every)), () => {
    S.expenses.push({ id: uid(), date: iso(TODAY), amount: b.amount, cat: b.cat || "other", vendor: b.name, note: "Bill" });
    b.next = nextAfter(b.next || iso(TODAY), b.every);
  });
}
function budgetForm() {
  const ids = P.cats, form = openSheet("Monthly budget", F.money("goal", "Income goal for the month (optional)", S.budget.goal || "") +
    `<div class="flabel" style="margin:4px 0 8px">How much you plan to spend each month</div><div class="row2 bplan">${ids.map(id => F.money("c_" + id, `<i class="dot" style="background:${catColor(id)}"></i>${esc(catName(id))}`, S.budget.cats[id] || "")).join("")}</div>
    <button type="button" class="addline press" id="suggest">${ICON.wand}Fill in typical amounts for ${esc(P.short.toLowerCase())}</button>`, v => {
    const g = numOr(v.goal, 0); if (Number.isNaN(g)) return "Check the income goal.";
    const cats = {}; for (const id of ids) { const n = numOr(v["c_" + id], 0); if (Number.isNaN(n)) return "Check the amount for " + catName(id) + "."; if (n) cats[id] = r2(n); }
    Object.keys(S.budget.cats).forEach(id => { if (!ids.includes(id)) cats[id] = S.budget.cats[id]; });
    S.budget = { cats, goal: r2(g) }; toast("Budget saved");
  }, { focus: false, lead: "Change these anytime." });
  form.querySelector("#suggest").onclick = () => { ids.forEach(id => { const el = form.querySelector("#f_c_" + id); if (el && !el.value && P.budget[id]) el.value = P.budget[id]; }); toast("Filled in. Change any of them."); };
}
function catSheet(id) {
  const b = budgetNow(), c = b.cats.find(x => x.id === id) || { id, plan: +S.budget.cats[id] || 0, spent: 0 }, pm = b.pm;
  const list = S.expenses.filter(e => e.cat === id && inRange(e.date, pm.a, pm.b)).sort((a, x) => x.date.localeCompare(a.date));
  const over = c.plan && c.spent > c.plan, pct = c.plan ? c.spent / c.plan * 100 : 0;
  openSheet(esc(catName(id)), `<div class="catsum">${ringSvg(pct, over ? "var(--warn)" : catColor(id), `<b class="num">${moneyK(c.spent)}</b><small>${c.plan ? "of " + moneyK(c.plan) : "spent"}</small>`, "lg")}
      <div><b>${c.plan ? (over ? money(c.spent - c.plan) + " over" : money(c.plan - c.spent) + " left") : "No plan set"}</b><small>${MONTHS[TODAY.getMonth()]} · ${Math.round(b.pace * 100)}% of the month gone</small></div></div>` +
    F.money("plan", "Monthly plan", c.plan || "") +
    `<div class="list">${list.map(expRow).join("") || `<div class="dayempty0">Nothing spent here this month.</div>`}</div>`, v => {
    const n = numOr(v.plan, 0); if (Number.isNaN(n)) return "Check the amount.";
    if (n) S.budget.cats[id] = r2(n); else delete S.budget.cats[id];
    toast("Saved");
  }, { focus: false });
}

/* --- taxes --- */
function taxSheet() {
  const y = TODAY.getFullYear(), qs = taxQuarters(y), t = taxNow();
  const rows = qs.map(q => { const done = S.taxPaid.filter(p => p.year === y && p.q === q.q), est = taxEst(q.a, q.b < iso(TODAY) ? q.b : iso(TODAY)), future = q.a > iso(TODAY);
    return `<button type="button" class="li" data-act="tax-pay" data-id="${y}-${q.q}">${ic(done.length ? "ok" : !future && inDays(q.due) <= 21 ? "warn" : "info", done.length ? ICON.check : ICON.bank)}<span class="tx"><b>${q.label}</b><small>Due ${shortD(q.due)}${done.length ? " · paid " + money(sum(done, p => p.amount)) : future ? "" : " · about " + money(est.set)}</small></span>${ICON.chev}</button>`; }).join("");
  openSheet("Taxes", `<div class="catsum">${ringSvg(t.yr.set ? t.paid / t.yr.set * 100 : 0, "var(--ok)", `<b class="num">${moneyK(t.paid)}</b><small>paid</small>`, "lg")}
      <div><b>Set aside about ${money(t.yr.set)}</b><small>${Math.round(pctOf() * 100)}% of ${money(t.yr.base)} profit in ${y}, after ${money(t.yr.ded)} for mileage</small></div></div>
    <div class="flabel" style="margin:4px 0 8px">Quarterly payments for ${y}</div><div class="list">${rows}</div>
    <details class="card keep inset"><summary><span><b>How this number works</b><span class="kp">A rough guide to help you save, not tax advice.</span></span>${ICON.chev}</summary>
      <ul><li>It takes money in, minus expenses and the mileage deduction, then the percent you set.</li><li>Many self-employed people put away 25 to 30% to cover federal income tax and self-employment tax. State tax may be extra.</li><li>Federal payments are usually due Apr 15, Jun 15, Sep 15 and Jan 15. You pay them yourself, for example at irs.gov.</li><li>Your real tax depends on your whole situation. A tax pro can set the right amount.</li></ul></details>
    <div class="list" style="margin-top:12px"><button type="button" class="li" data-act="rates">${ic("brand", ICON.sliders)}<span class="tx"><b>Change the percent</b><small>Now ${Math.round(pctOf() * 100)}%</small></span>${ICON.chev}</button></div>`, null, { noSave: true, cancelLabel: "Close", focus: false });
}
function taxPayForm(key) {
  const [y, q] = String(key).split("-").map(Number), qq = taxQuarters(y).find(x => x.q === q) || taxQuarters(y)[0], ex = S.taxPaid.find(p => p.year === y && p.q === q);
  const est = taxEst(qq.a, qq.b < iso(TODAY) ? qq.b : iso(TODAY));
  openSheet(`Taxes for ${qq.label}`, `<p class="lead" style="margin-top:-2px">Due ${longD(qq.due)}. The app's estimate is about ${money(est.set)}. Log what you actually paid.</p>` +
    `<div class="row2">${F.money("amount", "Amount paid", ex ? ex.amount : "")}${F.date("date", "Date paid", ex ? ex.date : iso(TODAY))}</div>`, v => {
    const a = numOr(v.amount, 0); if (!(a > 0)) return "Add the amount you paid.";
    if (!ISO_RX.test(v.date)) return "Check the date.";
    if (ex) Object.assign(ex, { amount: r2(a), date: v.date }); else S.taxPaid.push({ id: uid(), year: y, q, date: v.date, amount: r2(a) });
    toast("Tax payment logged");
  }, { onDelete: ex ? () => { S.taxPaid = S.taxPaid.filter(p => p !== ex); return "Tax payment deleted"; } : null });
}
function ratesForm() {
  const pf = S.profile;
  openSheet("Taxes and mileage", F.num("setAside", "Set aside for taxes (%)", pf.setAside, "25", "Used for the tax estimate on Home. Many people use 25 to 30%.") +
    F.num("mileRate", "Your own mileage rate ($ per mile)", pf.mileRate, "Leave blank for the IRS rate", "Blank uses the IRS business rate: 70¢ for 2025, 72.5¢ to June 30, 2026 and 76¢ from July 1, 2026."), v => {
    const p = numOr(v.setAside, 0), m = numOr(v.mileRate, 0);
    if (Number.isNaN(p) || p > 60) return "Pick a percent from 0 to 60.";
    if (Number.isNaN(m) || m > 5) return "The mileage rate is dollars per mile, like 0.76.";
    pf.setAside = r2(p); pf.mileRate = v.mileRate ? r2(m) : ""; toast("Saved");
  });
}

/* --- settings --- */
const PK_ICON = {
  trades: sv(`<path d="M14.5 5.5a4 4 0 0 0 4.9 4.9l-9 9a2 2 0 0 1-2.8-2.8l9-9a4 4 0 0 0-2.1-2.1z" ${st()}/><path d="M17 3.2l-1.6 1.6.8 2.4 2.4.8L20.2 6.4" ${st()}/>`),
  beauty: sv(`<circle cx="6.5" cy="6.5" r="2.8" ${st()}/><circle cx="6.5" cy="17.5" r="2.8" ${st()}/><path d="M8.6 8.4L20 18M8.6 15.6L20 6" ${st()}/>`),
  creative: sv(`<path d="M4 20l3.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11z" ${st()}/><path d="M14 6.5l3 3" ${st()}/>`),
  food: sv(`<path d="M12 21v-7" ${st()}/><path d="M12 14c-3.5 0-5-3.5-5-6.5S9 3 12 3s5 1.5 5 4.5-1.5 6.5-5 6.5z" ${st()}/><path d="M12 14c-1.5 0-2.4-3.4-2.4-6.5S10.6 3 12 3M12 14c1.5 0 2.4-3.4 2.4-6.5S13.4 3 12 3" ${st(1.6)}/>`),
  retail: sv(`<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.4 1.4 0 0 1 0 2l-6.7 6.7a1.4 1.4 0 0 1-2 0z" ${st()}/><circle cx="8" cy="8" r="1.6" style="fill:currentColor"/>`),
  cleaning: sv(`<path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14z" ${st()}/><path d="M5 19l8-8" ${st()}/>`)
};
const packIcon = id => (own(PK_ICON, id) && PK_ICON[id]) || ICON.store;
function packPicker(cur) {
  return `<div class="packs" id="packs">${Object.values(PACKS).map(pk => `<button type="button" class="pack ${pk.id === cur ? "on" : ""}" data-pack="${esc(pk.id)}" aria-pressed="${pk.id === cur}"><span class="ic pk-dot" data-pk="${esc(pk.id)}" aria-hidden="true">${packIcon(pk.id)}</span><span class="tx"><b>${esc(pk.name)}</b><small>${esc(pk.who)}</small></span>${pk.id === cur ? pill("paid", "Chosen") : ""}</button>`).join("")}</div>`;
}
function profileForm() {
  const pf = S.profile;
  openSheet("Your business", F.text("biz", "Business name", pf.biz, "On Home and invoices", "", { autocomplete: "organization" }) + F.text("owner", "Your name", pf.owner, "First and last", "", { autocomplete: "name" }) +
    `<div class="row2">${F.tel("phone", "Phone", pf.phone, { autocomplete: "tel" })}${F.email("email", "Email", pf.email, { autocomplete: "email" })}</div>` +
    F.addr(pf, "Business address (optional)", true) +
    `<div class="field packfield"><span class="flabel">Kind of Business</span>${packPicker(pf.type)}<span class="hint">Each kind gets its own Home, words, categories and look.</span></div>`, v => {
    if (!v.biz && !v.owner) return "Add your business name or your name.";
    const on = document.querySelector("#sheetForm #packs .on"), ty = on && own(PACKS, on.dataset.pack) ? on.dataset.pack : pf.type;
    if (ty !== pf.type) { pf.type = ty; S.look = S.look && S.look.theme ? { theme: S.look.theme } : undefined; }
    Object.assign(pf, { biz: v.biz.slice(0, 80), owner: v.owner.slice(0, 60), phone: v.phone.slice(0, 30), email: v.email.slice(0, 120) }, cleanAddr(v));
    toast("Saved");
  }, { focus: false });
}
function invSetForm() {
  const pf = S.profile;
  openSheet("Invoice settings", F.seg("terms", "Payment due", String(pf.terms), [["0", "On receipt"], ["7", "7 days"], ["14", "14 days"], ["30", "30 days"]]) +
    F.area("payNote", "How people can pay you", pf.payNote, "Venmo @your-business, Zelle to (555) 010-2000, or a check") +
    F.text("thanks", "Thank-you line", pf.thanks || P.thanks, "") +
    `<div class="row2">${F.num("nextInv", "Next invoice #", pf.nextInv)}${F.num("nextQuote", "Next quote #", pf.nextQuote)}</div>` +
    F.num("salesTax", "Sales tax for new invoices (%)", +pf.salesTax || "", "0", "Leave at 0 if you don't charge sales tax."), v => {
    const ni = Math.round(numOr(v.nextInv, pf.nextInv)), nq = Math.round(numOr(v.nextQuote, pf.nextQuote)), tx = numOr(v.salesTax, 0);
    if (!(ni > 0) || !(nq > 0)) return "Check the numbers.";
    if (Number.isNaN(tx) || tx > 30) return "Check the sales tax.";
    if (S.invoices.some(x => x.kind === "invoice" && x.num === ni)) return "Invoice #" + ni + " is already used.";
    Object.assign(pf, { terms: +v.terms || 0, payNote: v.payNote.slice(0, 300), thanks: v.thanks.slice(0, 160), nextInv: ni, nextQuote: nq, salesTax: r2(tx) });
    toast("Saved");
  }, { focus: false });
}
function mineForm() {
  const L = look();
  const checks = P.home.map(([k, label]) => `<label><input type="checkbox" data-home="${k}" ${L.hidden.includes(k) ? "" : "checked"}>${esc(label)}</label>`).join("");
  const form = openSheet("Appearance", F.seg("accent", "Color", L.accent, ACCENTS.map(([k, n, c]) => [k, `<i class="dot" style="background:${c}"></i>${n}`])) +
    F.seg("theme", "Mode", L.theme, [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]]) +
    `<div class="field"><span class="flabel">Show on Home</span><div class="checks">${checks}</div></div>`, v => {
    const hidden = [...document.querySelectorAll("#sheetForm [data-home]")].filter(x => !x.checked).map(x => x.dataset.home);
    S.look = { accent: v.accent || P.accent, theme: v.theme || "auto", hidden };
    toast("Saved");
  }, { onClose: () => applyLook(), focus: false });
  const preview = () => { const pick = k => { const on = form.querySelector(`.seg[data-key="${k}"] .on`); return on ? on.dataset.v : L[k]; }; applyLook({ ...L, accent: pick("accent"), theme: pick("theme") }); };
  form.querySelectorAll(".seg").forEach(sg => sg.addEventListener("click", () => setTimeout(preview, 0)));
}
function todoForm(t, pre) {
  const isNew = !t; t = t || Object.assign({ text: "", due: "" }, pre || {});
  openSheet(isNew ? "Add a to-do" : "Edit to-do", F.text("text", "To-Do", t.text, "Renew business license") + F.date("due", "Due", t.due), v => {
    if (!v.text) return "Write what needs doing.";
    if (badDate(v.due)) return "Check the date.";
    if (isNew) { S.todos.push({ id: uid(), text: v.text.slice(0, 160), due: v.due, done: false }); if (pre && pre.ask) { askLast = null; askPending = null; } } else Object.assign(t, { text: v.text.slice(0, 160), due: v.due });
    toast(isNew ? "Added to your list" : "Saved");
  }, { onDelete: isNew ? null : () => { S.todos = S.todos.filter(x => x !== t); return "To-do deleted"; } });
}

/* --- first run: one question per screen --- */
function onboard() {
  const draft = { owner: "", biz: "", type: "trades", phone: "", email: "", addr: {} };
  const dots = i => `<div class="stepdots">${[0, 1, 2, 3].map(k => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>`;
  const finish = useBudget => {
    const keep = S; S = blank(keep); S.look = keep.look && keep.look.theme ? { theme: keep.look.theme } : undefined;
    P = own(PACKS, draft.type) ? PACKS[draft.type] : PACKS.trades;
    Object.assign(S.profile, { owner: draft.owner, biz: draft.biz, type: draft.type, phone: draft.phone, email: draft.email, setAside: P.setAside }, draft.addr);
    if (useBudget) Object.entries(P.budget).forEach(([k, v]) => { if (v) S.budget.cats[k] = v; });
    askLast = null; askPending = null; clientFocus = null;
    commit(); go("home"); window.scrollTo(0, 0);
    toast("You're set. Add your first " + P.client + ".", () => clientForm(), "Add");
  };
  const step4 = () => openSheet("Start with a budget?", `<div class="list">${P.cats.filter(id => P.budget[id]).map(id => `<div class="li"><i class="dot" style="background:${catColor(id)}"></i><span class="tx"><b>${esc(catName(id))}</b></span><span class="amt num">${money(P.budget[id])}</span></div>`).join("")}
      <div class="li sub"><span class="tx"><b>A month in all</b></span><span class="amt num">${money(sum(Object.values(P.budget)))}</span></div></div>`, () => { later(() => finish(true)); return "nocommit"; },
    { dots: dots(3), lead: `Typical monthly amounts for ${esc(P.short.toLowerCase())}. You can change every one later.`, saveLabel: "Use these", cancelLabel: "Skip", onCancel: () => finish(false), focus: false });
  const step3 = () => openSheet("How people reach you", `<div class="row2">${F.tel("phone", "Phone", draft.phone, { autocomplete: "tel" })}${F.email("email", "Email", draft.email, { autocomplete: "email" })}</div>` + F.addr(draft.addr, "Business address", true), v => {
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return "Check the email address.";
    draft.phone = v.phone.slice(0, 30); draft.email = v.email.slice(0, 120); draft.addr = cleanAddr(v); later(step4); return "nocommit";
  }, { dots: dots(2), lead: "Goes on your invoices and quotes. All optional.", saveLabel: "Next", cancelLabel: "Skip", onCancel: step4, focus: false });
  const step2 = () => { const form = openSheet("What kind of business?", packPicker(draft.type), () => { const on = form.querySelector("#packs .on"); draft.type = on && own(PACKS, on.dataset.pack) ? on.dataset.pack : draft.type; P = own(PACKS, draft.type) ? PACKS[draft.type] : PACKS.trades; later(step3); return "nocommit"; },
    { dots: dots(1), lead: "Your Home, words, categories and colors change to fit your work.", saveLabel: "Next", cancelLabel: "Skip", onCancel: step3, focus: false }); };
  openSheet("Let's set up your business", F.text("biz", "Business name", "", "Rivera Plumbing", "", { autocomplete: "organization" }) + F.text("owner", "Your name", "", "First and last", "", { autocomplete: "name" }), v => {
    if (!v.biz && !v.owner) return "Add your business name or your name to keep going.";
    draft.biz = v.biz.slice(0, 80); draft.owner = v.owner.slice(0, 60); later(step2); return "nocommit";
  }, { dots: dots(0), lead: "This clears the example. Everything stays on this phone.", saveLabel: "Next" });
}

/* the + : say it in your own words first, or pick from the grid underneath */
const ADD = () => [
  ["Money", [["inv", "Invoice", "brand", ICON.invoice, () => invoiceForm()], ["quote", "Quote", "violet", ICON.quote, () => quoteForm()], ["pay", "Payment", "ok", ICON.cash, () => payForm()],
    ["exp", "Expense", "warn", ICON.receipt, () => expenseForm()], ["photo", "Receipt Photo", "warn", ICON.camera, () => receiptFirst()], ["bill", "Bill", "pink", ICON.bill, () => billForm()]]],
  ["Work", [["job", Wd(P.job, 1), "info", ICON.cal, () => jobForm()], ["client", Wd(P.client, 1), "brand", ICON.person, () => clientForm()], ["trip", "Trip", "info", ICON.car, () => tripForm()],
    ["time", "Time", "info", ICON.clock, () => timeForm()], ["timer", S.timer ? "Stop Timer" : "Start Timer", "ok", ICON.timer, () => S.timer ? timerStop() : timerStart()], ["todo", "To-Do", "info", ICON.todo, () => todoForm()]]]];
function addMenu() {
  const groups = ADD();
  const html = `<div class="addask">
      <div class="ask"><span class="lead">${ICON.plus}</span><label class="sr" for="addAskIn">What to add</label><input id="addAskIn" type="text" enterkeyhint="go" autocomplete="off" placeholder="${esc(P.ask[0])}"><button type="button" id="addAskGo" aria-label="Go">${ICON.send}</button></div>
      <small>Type it or use the mic on your keyboard, like “${esc(P.ask[1])}”.</small>
      <div class="ask-inline" id="addAskOut"></div></div>` +
    groups.map(([hd, items]) => `<div class="addhd">${hd}</div><div class="addgrid">${items.map(([k, label, c, svg]) => `<button type="button" class="addtile press" data-add="${k}"><span class="ic" style="background:var(--${c}-fill)">${svg}</span>${esc(label)}</button>`).join("")}</div>`).join("");
  const form = openSheet("Add", html, null, { noSave: true, cancelLabel: "Close", focus: false });
  const inp = form.querySelector("#addAskIn"), go = () => { const v = inp.value.trim(); if (!v) { inp.focus(); return; } runAsk(v, form.querySelector("#addAskOut")); inp.value = ""; inp.blur(); };
  form.querySelector("#addAskGo").onclick = go;
  inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); go(); } });
  form.addEventListener("click", e => { const b = e.target.closest("[data-add]"); if (!b) return;
    groups.forEach(([, items]) => items.forEach(it => { if (it[0] === b.dataset.add) { if (it[0] === "photo") { sheetClose && sheetClose(); it[4](); return; } sheetClose && sheetClose(); later(it[4]); } })); });
}
