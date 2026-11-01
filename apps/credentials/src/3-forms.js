
/* ---------- sheet (forms) ---------- */
let sheetClose = null, sheetPrevFocus = null;
const F = {
  text: (key, label, value, ph, hint) => `<div class="field"><label for="f_${key}">${label}</label><input id="f_${key}" data-key="${key}" type="text" value="${esc(value == null ? "" : value)}" ${ph ? `placeholder="${esc(ph)}"` : ""} autocomplete="off">${hint ? `<span class="hint">${hint}</span>` : ""}</div>`,
  url: (key, label, value, ph) => `<div class="field"><label for="f_${key}">${label}</label><input id="f_${key}" data-key="${key}" type="url" inputmode="url" value="${esc(value || "")}" placeholder="${esc(ph || "https://")}" autocomplete="off"></div>`,
  date: (key, label, value, hint) => `<div class="field"><label for="f_${key}">${label}</label><input id="f_${key}" data-key="${key}" type="date" value="${esc(value || "")}">${hint ? `<span class="hint">${hint}</span>` : ""}</div>`,
  num: (key, label, value, ph, hint) => `<div class="field"><label for="f_${key}">${label}</label><input id="f_${key}" data-key="${key}" type="number" inputmode="decimal" step="0.01" min="0" value="${value == null ? "" : esc(value)}" ${ph ? `placeholder="${esc(ph)}"` : ""}>${hint ? `<span class="hint">${hint}</span>` : ""}</div>`,
  area: (key, label, value, ph) => `<div class="field"><label for="f_${key}">${label}</label><textarea id="f_${key}" data-key="${key}" ${ph ? `placeholder="${esc(ph)}"` : ""}>${esc(value || "")}</textarea></div>`,
  select: (key, label, value, opts, hint) => `<div class="field"><label for="f_${key}">${label}</label><select id="f_${key}" data-key="${key}">${opts.map(o => { const [v, n] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(value) ? "selected" : ""}>${esc(n)}</option>`; }).join("")}</select>${hint ? `<span class="hint">${hint}</span>` : ""}</div>`,
  seg: (key, label, value, opts) => `<div class="field"><span class="flabel">${label}</span><div class="seg" data-key="${key}" role="group" aria-label="${esc(label)}">${opts.map(([v, n]) => `<button type="button" data-v="${esc(v)}" class="${String(value) === String(v) ? "on" : ""}" aria-pressed="${String(value) === String(v)}">${n}</button>`).join("")}</div></div>`,
  check: (key, label, on, sub) => `<div class="checks one" style="margin-bottom:12px"><label><input type="checkbox" id="f_${key}" data-key="${key}" ${on ? "checked" : ""}><span>${label}${sub ? `<small>${sub}</small>` : ""}</span></label></div>`
};
const numOr = (v, d) => { if (v === "" || v == null) return d; const n = parseFloat(v); return isFinite(n) ? n : NaN; };
let sheetHide = null, sheetClosedAt = 0;
/* Title Case for button labels, the way iOS writes them */
function titleCase(s) { return String(s).replace(/(^|\s)([a-z])/g, (m, a, c, i) => i > 0 && /^(a|an|the|of|on|to|in|for|and|or|as|by)\b/.test(String(s).slice(i + a.length)) ? m : a + c.toUpperCase()); }
/* form rows sit together in one rounded group, like the Settings app; two-up rows stack */
function groupFields(form) {
  form.querySelectorAll(".row2, .row3").forEach(r => { if (r.querySelector(":scope > .field")) r.classList.add("stacked"); });
  const kids = [...form.children]; let run = [];
  const flush = () => { if (run.length) { const g = document.createElement("div"); g.className = "fgroup"; run[0].before(g); run.forEach(x => g.appendChild(x)); } run = []; };
  const rowish = k => k.matches(".field, .row2.stacked, .row3.stacked") && !k.querySelector(":scope > .checks");
  kids.forEach(k => { if (rowish(k)) run.push(k); else flush(); }); flush();
  form.querySelectorAll(".box").forEach(bx => { const ks = [...bx.children]; let r = []; const fl = () => { if (r.length) { const g = document.createElement("div"); g.className = "fgroup"; r[0].before(g); r.forEach(x => g.appendChild(x)); } r = []; }; ks.forEach(k => { if (rowish(k)) r.push(k); else fl(); }); fl(); });
}
function openSheet(title, html, onSave, o) {
  o = o || {};
  const root = $("#sheetRoot");
  let scrim = $("#scrim");
  /* a sheet opened right after another one slides in inside the same sheet, like a page in a stack */
  const reuse = !!scrim && scrim.classList.contains("show") && (!!sheetClose || !!sheetHide);
  if (sheetClose) sheetClose(true, reuse);
  if (sheetHide) { clearTimeout(sheetHide); sheetHide = null; }
  /* Save and Done are the check circle at the top right, Edit is a text button there; longer actions get a full-width button at the bottom.
     The X at the top left cancels. "Skip" stays a word under the main button, because it moves the setup along. */
  const lbl = o.saveLabel || "Save", navOk = !o.noSave && (lbl === "Save" || lbl === "Done"), navTxt = !o.noSave && lbl === "Edit";
  const cl = o.cancelLabel || "Cancel", skip = !o.noCancel && cl === "Skip";
  const formHtml = `<form class="sheet${reuse ? " swap" : ""}" id="sheetForm" role="dialog" aria-modal="true" aria-labelledby="sheetTitle" novalidate>
    <div class="grab" aria-hidden="true"></div>
    <div class="snav">${o.noCancel ? "<span></span>" : `<button type="button" class="sbtn" id="${skip ? "sheetX" : "sheetCancel"}" aria-label="${skip ? "Close" : esc(cl)}">${ICON.xmark}</button>`}<h3 id="sheetTitle">${title}</h3>${navOk ? `<button type="submit" class="sbtn ok" aria-label="${esc(lbl)}">${ICON.check}</button>` : navTxt ? `<button type="submit" class="sbtn txt">${esc(lbl)}</button>` : "<span></span>"}</div>
    ${o.dots || ""}${o.lead ? `<p class="lead">${o.lead}</p>` : ""}${html}<div class="err" id="sheetErr" role="alert"></div>
    ${navOk || navTxt || o.noSave ? "" : `<div class="sheet-actions"><button type="submit" class="btn primary">${titleCase(lbl)}</button>${skip ? '<button type="button" class="btn plain" id="sheetCancel">Skip</button>' : ""}</div>`}${o.onDelete ? '<button type="button" class="delrow" id="sheetDel">Delete</button>' : ""}</form>`;
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
    requestAnimationFrame(() => requestAnimationFrame(() => scrim.classList.add("show")));
  }
  sheetPrevFocus = prevFocus;
  const form = $("#sheetForm");
  groupFields(form); tcPass(form); tcText($("#sheetTitle"));
  requestAnimationFrame(() => requestAnimationFrame(() => fillIn(form)));
  if (o.focus !== false) { const first = form.querySelector("input:not([type=checkbox]),select,textarea"); if (first && !("ontouchstart" in window)) setTimeout(() => first.focus({ preventScroll: true }), 80); }
  form.querySelectorAll(".seg").forEach(sg => sg.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; sg.querySelectorAll("button").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); }); }));
  let closed = false;
  const close = (now, keep) => {
    if (closed) return; closed = true;
    if (o.onClose) o.onClose();
    document.removeEventListener("keydown", onKey); if (sheetClose === close) sheetClose = null; sheetClosedAt = Date.now();
    if (keep) return;
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
  form.addEventListener("pointermove", e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); form.style.transform = `translateY(${dy < 0 ? 0 : dy}px)`; scrim.style.backgroundColor = `rgba(10,16,30,${Math.max(0, .4 - dy / 900)})`; });
  const endDrag = () => {
    if (y0 == null) return; const v = dy / Math.max(1, Date.now() - t0); y0 = null;
    form.classList.remove("dragging"); scrim.style.backgroundColor = "";
    if (dy > 120 || (dy > 30 && v > .6)) { form.style.transform = "translateY(100%)"; close(); }
    else form.style.transform = "";
  };
  form.addEventListener("pointerup", endDrag); form.addEventListener("pointercancel", endDrag);
  if (!o.noCancel) $("#sheetCancel").onclick = () => { close(); if (o.onCancel) later(o.onCancel); };
  if ($("#sheetX")) $("#sheetX").onclick = () => close();
  if (o.onDelete) { const del = $("#sheetDel"); del.onclick = () => {
    if (!del.classList.contains("armed")) { del.classList.add("armed"); del.textContent = "Tap again to delete"; return; }
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
    if (msg === "nocommit") { close(); return; }
    if (typeof msg === "string") { $("#sheetErr").textContent = msg; return; }
    if (msg === false) return;
    close(); commit();
  };
  return form;
}
function toast(t, undo) {
  const el = $("#toast");
  el.innerHTML = `<span>${esc(t)}</span>` + (undo ? '<button type="button" id="toastUndo">Undo</button>' : "");
  el.classList.toggle("act", !!undo); el.classList.add("show");
  if (undo) $("#toastUndo").onclick = () => { el.classList.remove("show"); clearTimeout(toast.t); undo(); };
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), undo ? 4500 : 2200);
}
function commit(msg) { save(); render(); if (msg) toast(msg); }
/* right after a sheet closes, the next step opens fast enough to take over the same sheet */
const later = fn => setTimeout(fn, Date.now() - sheetClosedAt < 60 ? 30 : 300);
const withUndo = (msg, fn) => { const snap = JSON.stringify(S); fn(); commit(); toast(msg, () => { S = JSON.parse(snap); commit("Undone"); }); };

/* --- credentials --- */
function credForm(kind, c, pre) {
  const sec = SECT(kind) || P.sections[0], isNew = !c;
  c = c || Object.assign({ kind, numStore: kind === "id" ? "last4" : "full", status: "auto" }, pre || {});
  const opt0 = key => { const f = sec.fields.find(x => x[0] === key); return f && Array.isArray(f[3]) ? f[3][0] : ""; };
  if (kind === "life" && !c.lifeType) c.lifeType = opt0("lifeType");
  if (kind === "id" && !c.idKind) { c.idKind = opt0("idKind"); if (!SENSITIVE(c)) c.numStore = "full"; }
  const html = sec.fields.map(([key, label, type, x]) => {
    if (type === "text") return F.text(key, label, c[key], x);
    if (type === "date") return F.date(key, label, c[key]);
    if (type === "number") return F.num(key, label, c[key], "");
    if (type === "area") return F.area(key, label, c[key], "Anything you want to remember");
    if (type === "select") return F.select(key, label, c[key], x);
    if (type === "status") return F.select("status", label, c.status || "auto", STATUS_OPTS, "Leave this on “Work it out for me” and the app sets it from your dates and hours.") + `<div id="statusNoteWrap" ${c.status && c.status !== "auto" ? "" : "hidden"}>${F.text("statusNote", "Why you changed it", c.statusNote, "Board confirmed renewal by phone")}</div>`;
    if (type === "idnum") return F.text("number", label, c.numStore === "onfile" ? "" : c.number, "", SENSITIVE(c) ? "Private numbers are safest in a password manager." : "") +
      F.seg("numStore", "Keep on this device", c.numStore || "full", [["full", "Full number"], ["last4", "Last 4 only"], ["onfile", "Just “On file”"]]);
    return "";
  }).join("");
  const form = openSheet(isNew ? "Add " + (/^[aeiou]/i.test(sec.one) ? "an " : "a ") + esc(sec.one) : "Edit " + esc(credFullName(c)), `<div class="row2-auto">${html}</div>`, v => {
    const out = Object.assign({}, v);
    ["hoursNeeded"].forEach(k => { if (k in out) { const n = numOr(out[k], null); if (Number.isNaN(n)) return; out[k] = n; } });
    if (kind === "life") out.title = out.lifeType !== "Other" ? out.lifeType : (out.title || sec.top);
    if (kind === "id") out.title = out.idKind !== "Other" ? out.idKind : (out.title || "ID");
    if (kind === "mal" && !sec.topFromTitle) out.title = out.issuer;
    if (!String(out.title || out.issuer || "").trim()) return "Give it a name so you can find it.";
    for (const k of ["issued", "expires", "renewOpens", "renewDue", "reappt", "docsDue"]) if (out[k] && !ISO_RX.test(out[k])) return "Check the dates.";
    if (out.issued && out.expires && out.expires < out.issued) return "Expires can't be before it was issued.";
    if (out.numStore === "last4" && out.number) out.number = out.number.replace(/\s/g, "").slice(-4);
    if (out.numStore === "onfile") out.number = "";
    if (out.status === "auto") out.statusNote = "";
    if (isNew) { const n = Object.assign({ id: uid(), kind }, pre && pre.kit ? { kit: pre.kit } : {}, out); S.creds.push(n); if (typeof askPending !== "undefined" && askPending && askPending.type === "cred") { askLast = null; askPending = null; } const added = kitRules(n); toast(credFullName(n) + " added" + (added.length ? ", with " + added.join(" and ") + " hours" : "")); }
    else { Object.assign(c, out); if (c.setup && (c.expires || c.reappt || c.number)) { c.setup = false; const added = kitRules(c); toast(added.length ? "Saved. " + added.join(" and ") + " hours added" : "Saved"); } else toast("Saved"); }
  }, { onDelete: isNew ? null : () => { S.creds = S.creds.filter(x => x !== c); S.rules = S.rules.filter(r => r.credId !== c.id); return credFullName(c) + " deleted"; } });
  const s = form.querySelector("#f_status"); if (s) s.onchange = () => { $("#statusNoteWrap").hidden = s.value === "auto"; };
}
function credBody(c) {
  const sec = SECT(c.kind), s = credStatus(c), rules = S.rules.filter(r => r.credId === c.id), prac = S.practice.filter(p => p.credId === c.id);
  const kv = [];
  sec.fields.forEach(([key, label, type]) => {
    if (type === "status" || key === "notes" || (key === "title" && (c.kind === "life" || c.kind === "id" || c.kind === "priv" || c.kind === "license"))) return;
    if (type === "idnum") { kv.push(`<div class="full"><small>${label}</small><b class="num numshow">${maskNum(c)}${SENSITIVE(c) && c.numStore === "full" && c.number ? `<button type="button" class="reveal" data-act="reveal" data-id="${esc(c.id)}">Show</button>` : ""}</b></div>`); return; }
    const val = c[key];
    const shown = val == null || val === "" ? "—" : type === "date" ? `${longD(val)}${inDays(val) >= 0 ? `<small style="display:inline;margin-left:6px">${relDays(inDays(val))}</small>` : ""}` : esc(val);
    kv.push(`<div class="${type === "date" && (key === "expires") ? "full" : ""}"><small>${label}</small><b class="${key === "expires" ? "big num" : ""}">${shown}</b></div>`);
  });
  for (let i = 0, run = 0; i < kv.length; i++) {
    const full = kv[i].startsWith('<div class="full"');
    if (full) { run = 0; continue; }
    const nextFull = i + 1 >= kv.length || kv[i + 1].startsWith('<div class="full"');
    if (run % 2 === 0 && nextFull) kv[i] = kv[i].replace('<div class=""', '<div class="full"');
    else run++;
  }
  return `<div style="display:flex;gap:8px;align-items:center;margin:-2px 0 12px">${pill(s.s, s.label)}${s.why ? `<span class="muted">${esc(s.why)}</span>` : ""}</div>
    <div class="kv">${kv.join("")}${c.notes ? `<div class="full"><small>Notes</small><b style="font-weight:500">${esc(c.notes)}</b></div>` : ""}</div>
    ${rules.length ? `<div class="flabel" style="margin-bottom:8px">${P.ce} requirements</div><div class="rules" style="margin-bottom:12px">${rules.map(r => ruleCard(r)).join("")}</div>` : ""}
    ${prac.length ? `<div class="list" style="margin-bottom:12px">${prac.map(practiceRow).join("")}</div>` : ""}
    <div class="flabel" style="margin:4px 0 8px">Files</div><div class="list" style="margin-bottom:12px">${(S.docs || []).filter(d => d.credId === c.id).map(d => `<button type="button" class="li" data-act="doc-open" data-id="${esc(d.id)}">${ic("info", ICON.note)}<span class="tx"><b>${esc(d.name)}</b><small>${esc(d.tag || "Other")}</small></span>${ICON.chev}</button>`).join("")}<button type="button" class="li addrow" data-act="doc-add" data-cred="${esc(c.id)}"><span class="ic">${ICON.plus}</span><span class="tx">Add a photo or PDF of it</span></button></div>
    ${c.kind === "license" || c.kind === "cert" || c.kind === "life" ? `<div class="list"><button type="button" class="li addrow" data-act="rule-new" data-cred="${esc(c.id)}"><span class="ic">${ICON.plus}</span><span class="tx">Add a ${P.ce} requirement</span></button></div>` : ""}`;
}
function credDetail(c) {
  openSheet(esc(credFullName(c)), credBody(c), () => { later(() => credForm(c.kind, c)); return "nocommit"; }, { saveLabel: "Edit", cancelLabel: "Close", focus: false });
}

/* --- requirements --- */
function ruleForm(r, credId, presetId) {
  const isNew = !r, creds = S.creds.filter(c => c.kind === "license" || c.kind === "cert" || c.kind === "life");
  if (!creds.length) { toast("Add a license or certification first"); later(() => credForm("license")); return; }
  const pre = P.presets.find(x => x.id === presetId);
  r = r || { credId: credId || creds[0].id, name: pre ? pre.name : "", start: T(-30), end: T(700), target: pre ? pre.target : "", subs: {}, group: "" };
  const others = S.rules.filter(x => x !== r);
  const shareVal = r.group ? (others.find(x => x.group === r.group) || {}).id || "" : "";
  const caps = r.caps || {};
  const html = `${isNew ? "" : `<div class="rules" style="margin-bottom:14px">${ruleCard(r).replace("<button", "<div").replace(/<\/button>$/, "</div>")}</div>`}
    ${isNew ? F.select("preset", "Start from", presetId || "custom", P.presets.map(p => [p.id, p.name]), "Fills in typical numbers. Always check them with your board.") : ""}
    <div id="presetNote" class="muted" style="margin:-6px 0 12px">${pre ? esc(pre.note) : ""}</div>
    ${F.select("credId", "Belongs to", r.credId, creds.map(c => [c.id, credFullName(c)]))}
    ${F.text("name", "Name", r.name, P.presets[0].name + "…")}
    <div class="row2">${F.date("start", "Courses count from", r.start)}${F.date("end", "Deadline", r.end)}</div>
    ${F.num("target", "Hours needed", r.target, "24")}
    ${F.select("share", "Hours can't also count toward", shareVal, [["", "Nothing (hours can be shared)"], ...others.filter(x => !x.manual).map(x => [x.id, x.name])], "Use this when two requirements need separate hours, like an RN 24 plus an APRN 24.")}
    <div class="flabel" style="margin-bottom:6px">Minimums inside those hours (leave blank if none)</div>
    <div class="row${SUBS_ON().length + 1}">${SUBS_ON().map(k => F.num("s_" + k, P.subShort[k], r.subs[k] || "", "")).join("")}${F.num("s_approved", P.subShort.approved, r.subs.approved || "", "")}</div>
    ${F.check("useCaps", P.catsLabel || "Uses categories A, B and C", !!r.caps, P.catsHint || "Each category has a least and a most that count, like CCRN CERPs.")}
    <div id="capBox" class="box" ${r.caps ? "" : "hidden"}>${["A", "B", "C"].map(k => `<div class="row2">${F.num("cmin" + k, CATN(k) + " at least", caps[k] ? caps[k][0] : "", "")}${F.num("cmax" + k, "at most", caps[k] ? caps[k][1] : "", "")}</div>`).join("")}</div>
    ${F.check("manualMet", "Mark it met (self-reported)", !!r.manual, "For things you show another way, like practice hours.")}
    <div id="manBox" ${r.manual ? "" : "hidden"}>${F.text("manNote", "How you met it", r.manual ? r.manual.note : "", "1,000+ practice hours, employer letter on file")}${F.url("manProof", "Proof link (optional)", r.manual ? r.manual.proof : "")}</div>
    ${F.area("plan", "Plan or notes", r.plan, "Example: 48 Ohio hours by June, then CERPs")}`;
  const form = openSheet(isNew ? `Add a ${P.ce} requirement` : "Edit requirement", html, v => {
    const target = numOr(v.target, NaN);
    if (!v.name) return "Give it a name.";
    if (!ISO_RX.test(v.start) || !ISO_RX.test(v.end)) return "Pick both dates.";
    if (v.end < v.start) return "The deadline can't be before the start.";
    if (!(target >= 0) && !v.manualMet) return "Enter the hours needed.";
    const subs = {}; for (const k of SUBS_ON().concat("approved")) { const n = numOr(v["s_" + k], 0); if (Number.isNaN(n) || n < 0) return "Check the minimums."; if (n) subs[k] = n; }
    let capsOut = null;
    if (v.useCaps) { capsOut = {}; for (const k of ["A", "B", "C"]) { const a = numOr(v["cmin" + k], null), b = numOr(v["cmax" + k], null); if (Number.isNaN(a) || Number.isNaN(b)) return "Check the category numbers."; if (a != null || b != null) { if (b != null && a != null && b < a) return `${CATN(k)}: “at most” is less than “at least”.`; capsOut[k] = [a || 0, b == null ? 9999 : b]; } } if (!Object.keys(capsOut).length) return "Fill in at least one category, or turn categories off."; }
    const pre2 = P.presets.find(x => x.id === (r.preset || v.preset));
    const out = { credId: v.credId, name: v.name, start: v.start, end: v.end, target: target >= 0 ? target : 1, subs, caps: capsOut, elective: !!(capsOut && (r.elective || (pre2 && pre2.elective) || P.catNone !== "None")), plan: v.plan,
      manual: v.manualMet ? { note: v.manNote, proof: v.manProof } : null, preset: r.preset || v.preset };
    const target2 = isNew ? Object.assign({ id: uid() }, out) : Object.assign(r, out);
    // exclusive groups
    if (v.share) { const o2 = ruleOf(v.share); const g = o2.group || r.group || (credFullName(credOf(o2) || {}) ? (out.name.split(" ")[0] + " shared") : "Shared"); o2.group = g; target2.group = g; }
    else if (target2.group) { const was = target2.group; target2.group = ""; const left = groupRules(was); if (left.length === 1) left[0].group = ""; }
    if (isNew) S.rules.push(target2);
    toast(isNew ? "Requirement added" : "Saved");
  }, { onDelete: isNew ? null : () => { S.rules = S.rules.filter(x => x !== r); S.ce.forEach(e => { e.applies = e.applies.filter(id => id !== r.id); delete e.alloc[r.id]; }); return "Requirement deleted"; }, focus: false });
  const useCaps = form.querySelector("#f_useCaps"), man = form.querySelector("#f_manualMet");
  useCaps.onchange = () => { $("#capBox").hidden = !useCaps.checked; };
  man.onchange = () => { $("#manBox").hidden = !man.checked; };
  const ps = form.querySelector("#f_preset");
  if (ps) ps.onchange = () => {
    const p = P.presets.find(x => x.id === ps.value); if (!p) return;
    $("#presetNote").textContent = p.note;
    if (p.id !== "custom") $("#f_name").value = p.name;
    $("#f_target").value = p.target;
    SUBS_ON().concat("approved").forEach(k => { $("#f_s_" + k).value = (p.subs && p.subs[k]) || ""; });
    if (p.fixedEnd || p.endRule) { const w = presetWindow(p, $("#f_end").value || T(365)); $("#f_start").value = w.start; $("#f_end").value = w.end; }
    useCaps.checked = !!p.caps; $("#capBox").hidden = !p.caps;
    ["A", "B", "C"].forEach(k => { $("#f_cmin" + k).value = p.caps && p.caps[k] ? p.caps[k][0] : ""; $("#f_cmax" + k).value = p.caps && p.caps[k] ? p.caps[k][1] : ""; });
    man.checked = !!p.manual; $("#manBox").hidden = !p.manual;
    if (p.group) { const mate = S.rules.find(x => x.group === p.group) || S.rules.find(x => P.presets.some(pp => pp.group === p.group && pp.id === x.preset)); if (mate) $("#f_share").value = mate.id; }
  };
  if (ps && presetId) ps.onchange();
}

/* --- CE courses --- */
function ceForm(e, pre) {
  const isNew = !e, rules = S.rules.filter(r => !r.manual);
  e = e || Object.assign({ date: iso(TODAY), title: "", provider: "", hours: "", pharm: "", law: "", cat: "", approved: true, proof: "", notes: "", ceId: "" }, pre || {});
  let applies = e.applies ? e.applies.slice() : (pre && pre.applies) ? pre.applies.slice() : rules.filter(r => inWin(r, e.date)).map(r => r.id);
  let alloc = Object.assign({}, e.alloc || {});
  const hasCats = S.rules.some(r => r.caps);
  const html = `${F.text("title", "Course name", e.title, P.askEx()[0].replace(/^[\d.]+ hrs? /, "").replace(/ yesterday$/, "").replace(/^\w/, ch => ch.toUpperCase()) + "…")}
    <div class="row2">${F.num("hours", "Hours", e.hours, "1.5")}${F.date("date", "Finished on", e.date)}</div>
    ${F.text("provider", "Provider", e.provider, "Who gave the credit")}
    ${SUBS_ON().length ? `<div class="row${SUBS_ON().length}">${SUBS_ON().map(k => F.num(k, (k === "pharm" ? P.sub.pharm : P.subShort.law) + " hrs", e[k] || "", "0", k === "law" && P.sub.law !== P.subShort.law ? P.sub.law : "")).join("")}</div>` : ""}
    ${hasCats ? F.seg("cat", P.catWord, e.cat || "", [["", P.catNone], ...["A", "B", "C"].map(k => [k, P.cats[k] ? CATS(k) : k])]) : ""}
    <div class="box"><div class="flabel">Counts toward</div><div class="checks one" id="appliesBox"></div></div>
    <div id="splitBox"></div>
    <div class="field"><span class="flabel">Certificate photo</span><div id="photoBox" class="photo-box"></div></div>
    ${F.check("approved", "From a formally approved provider", e.approved !== false, "Accredited or board-approved credit.")}
    <div class="row2">${F.text("ceId", "Certificate or CE ID", e.ceId, "Optional")}${F.url("proof", "Proof link", e.proof, "Optional")}</div>
    ${F.area("notes", "Notes", e.notes, "")}`;
  const form = openSheet(isNew ? "Log a course" : "Edit course", html, v => {
    readSplit();
    const hours = numOr(v.hours, NaN), ph = numOr(v.pharm, 0), lw = numOr(v.law, 0);
    if (!v.title) return "Add the course name.";
    if (!(hours > 0)) return "Enter the hours, like 1.5.";
    if (!ISO_RX.test(v.date)) return "Pick the date you finished it.";
    if (Number.isNaN(ph) || Number.isNaN(lw) || ph < 0 || lw < 0) return "Check the topic hours.";
    if (ph > hours || lw > hours) return "Those hours can't be more than the course's " + hrs(hours) + " hours.";
    const outAlloc = {};
    for (const [g, ids] of Object.entries(splitGroups())) {
      const tot = r2(ids.reduce((a, id) => a + (+alloc[id] || 0), 0));
      if (ids.some(id => (+alloc[id] || 0) < 0)) return "Split hours can't be below zero.";
      if (tot > hours + 1e-9) return `${g}: you split ${hrs(tot)} hrs, but the course is ${hrs(hours)}. The same hour can't count twice.`;
      ids.forEach(id => outAlloc[id] = r2(+alloc[id] || 0));
    }
    const out = { title: v.title, date: v.date, hours: r2(hours), provider: v.provider, pharm: r2(ph), law: r2(lw), cat: v.cat || "", approved: v.approved, ceId: v.ceId, proof: v.proof, notes: v.notes, applies: applies.slice(), alloc: outAlloc };
    if (photo.changed) {
      if (e.photo) IMG.del(e.photo);
      out.photo = photo.url ? uid() : "";
      if (photo.url) IMG.put(out.photo, photo.url);
    }
    if (pre) { askLast = null; askPending = null; }
    if (isNew) { S.ce.push(Object.assign({ id: uid() }, out)); toast("Logged " + hrs(hours) + " hrs"); }
    else { Object.assign(e, out); toast("Course saved"); }
  }, { onDelete: isNew ? null : () => { S.ce = S.ce.filter(x => x !== e); return "Course deleted"; }, focus: isNew && !pre });
  const val = id => form.querySelector("#f_" + id).value;
  function splitGroups() { const g = {}; applies.forEach(id => { const r = ruleOf(id); if (r && r.group) (g[r.group] = g[r.group] || []).push(id); }); Object.keys(g).forEach(k => { if (g[k].length < 2) delete g[k]; }); return g; }
  function readSplit() { form.querySelectorAll("[data-alloc]").forEach(inp => { alloc[inp.dataset.alloc] = numOr(inp.value, 0); }); }
  function drawApplies() {
    const d = val("date");
    $("#appliesBox").innerHTML = rules.length ? rules.map(r => { const c = credOf(r), out = ISO_RX.test(d) && !inWin(r, d);
      return `<label><input type="checkbox" data-apply="${esc(r.id)}" ${applies.includes(r.id) ? "checked" : ""}><span>${esc(r.name)}<small>${c ? esc(credFullName(c)) : ""}${out ? " · this date is outside its window, so it won't count" : ""}${r.group ? " · separate hours from " + esc(groupRules(r.group).filter(x => x !== r).map(x => x.name).join(", ")) : ""}</small></span></label>`; }).join("")
      : `<div class="muted">No requirements yet. You can still log the course, then add a requirement to a license or certification.</div>`;
  }
  function drawSplit(suggest) {
    const groups = splitGroups(), hours = numOr(val("hours"), 0) || 0;
    if (suggest) Object.values(groups).forEach(ids => Object.assign(alloc, suggestSplit(hours, numOr(val("pharm"), 0) || 0, numOr(val("law"), 0) || 0, ids, isNew ? null : e.id)));
    $("#splitBox").innerHTML = Object.entries(groups).map(([g, ids]) => {
      ids.forEach(id => { if (alloc[id] == null) alloc[id] = 0; });
      const tot = r2(ids.reduce((a, id) => a + (+alloc[id] || 0), 0));
      return `<div class="box" style="border-style:solid"><div class="flabel">Split between ${esc(g)} <button type="button" class="smallbtn" data-suggest="1">Suggest</button></div>
        ${ids.map(id => `<label class="alloc"><span>${esc(ruleOf(id).name)}</span><input type="number" inputmode="decimal" step="0.01" min="0" data-alloc="${esc(id)}" value="${hrs(alloc[id]).replace(/,/g, "")}" aria-label="Hours for ${esc(ruleOf(id).name)}"></label>`).join("")}
        <div class="${tot > hours + 1e-9 ? "badline" : "okline"}" id="splitMsg">${tot > hours + 1e-9 ? `That's ${hrs(tot)} hrs. Only ${hrs(hours)} to split.` : tot < hours ? `${hrs(r2(hours - tot))} hrs not used here.` : "Every hour counts once."}</div></div>`;
    }).join("");
  }
  const photo = { url: null, changed: false };
  function drawPhoto() {
    const box = $("#photoBox"); if (!box) return;
    const has = photo.changed ? !!photo.url : !!e.photo;
    box.innerHTML = has ? `<img id="photoImg" alt="Certificate for this course"><div class="photo-acts"><button type="button" class="smallbtn" data-photo="pick">Replace</button><button type="button" class="smallbtn" data-photo="del" style="color:var(--warn)">Remove</button></div>`
      : `<button type="button" class="photo-add" data-photo="pick">${ICON.plus}<span>Add a photo of the certificate<small>Take one or pick from Photos. Kept only on this device.</small></span></button>`;
    const img = $("#photoImg"); if (img) { if (photo.changed) img.src = photo.url; else IMG.get(e.photo).then(u => { if (u) img.src = u; else img.alt = "Photo not found on this device"; }); }
  }
  drawPhoto();
  form.addEventListener("click", ev => { const pb = ev.target.closest("[data-photo]"); if (!pb) return; ev.preventDefault();
    if (pb.dataset.photo === "del") { photo.url = null; photo.changed = true; drawPhoto(); return; }
    pickFile("image/*", f => { if (f.size > 25e6) { toast("That photo is too big"); return; } shrinkImage(f).then(u => { photo.url = u; photo.changed = true; drawPhoto(); }, () => toast("Couldn't read that photo. Try a JPEG or PNG.")); }); });
  drawApplies(); drawSplit(isNew);
  form.addEventListener("change", ev => {
    const t = ev.target;
    if (t.dataset.apply) { const id = t.dataset.apply; applies = t.checked ? [...applies, id] : applies.filter(x => x !== id); readSplit(); drawSplit(true); }
    else if (t.id === "f_date") drawApplies();
    else if (t.id === "f_hours" || t.id === "f_pharm" || t.id === "f_law") { readSplit(); drawSplit(true); }
  });
  form.addEventListener("input", ev => { if (ev.target.dataset.alloc) { readSplit(); const groups = splitGroups(), hours = numOr(val("hours"), 0) || 0; const m = $("#splitMsg"); if (!m) return; Object.values(groups).forEach(ids => { const tot = r2(ids.reduce((a, id) => a + (+alloc[id] || 0), 0)); m.className = tot > hours + 1e-9 ? "badline" : "okline"; m.textContent = tot > hours + 1e-9 ? `That's ${hrs(tot)} hrs. Only ${hrs(hours)} to split.` : tot < hours ? `${hrs(r2(hours - tot))} hrs not used here.` : "Every hour counts once."; }); } });
  form.addEventListener("click", ev => { if (ev.target.closest("[data-suggest]")) { ev.preventDefault(); drawSplit(true); toast("Suggested. Change it if you like."); } });
}

/* --- small things --- */
function todoForm(t, pre) {
  const isNew = !t; t = t || Object.assign({ text: "", due: "" }, pre || {});
  openSheet(isNew ? "Add a to-do" : "Edit to-do", F.text("text", "What needs doing?", t.text, P.todoHint) + F.date("due", "By when (optional)", t.due), v => {
    if (!v.text) return "Write what needs doing.";
    if (v.due && !ISO_RX.test(v.due)) return "Check the date.";
    if (isNew) S.todos.push({ id: uid(), text: v.text, due: v.due, done: false }); else Object.assign(t, v);
    toast(isNew ? "Added to your list" : "Saved");
  }, { onDelete: isNew ? null : () => { S.todos = S.todos.filter(x => x !== t); return "To-do deleted"; } });
}
function practiceForm(p) {
  const isNew = !p; p = p || { name: "", target: "", logged: "", recent: "", recentTarget: "", note: "", credId: "" };
  openSheet(isNew ? "Track practice hours" : "Edit practice hours", F.text("name", "What you're tracking", p.name, P.practiceIdeas.join(", ")) +
    F.select("credId", "For", p.credId || "", [["", "Not tied to one credential"], ...S.creds.filter(c => c.kind === "license" || c.kind === "cert").map(c => [c.id, credFullName(c)])]) +
    `<div class="row2">${F.num("target", "Hours needed", p.target, "432")}${F.num("logged", "Hours so far", p.logged, "0")}</div>
     <div class="row2">${F.num("recentTarget", "Needed in last 12 months", p.recentTarget || "", "Optional")}${F.num("recent", "In last 12 months", p.recent || "", "Optional")}</div>` +
    F.check("met", "Mark it met (self-reported)", !!p.met, "Keep proof, like a letter from work.") + F.area("note", "Notes", p.note, ""), v => {
    const n = {}; for (const k of ["target", "logged", "recent", "recentTarget"]) { n[k] = numOr(v[k], 0); if (Number.isNaN(n[k]) || n[k] < 0) return "Check the hours."; }
    if (!v.name) return "Name what you're tracking.";
    if (!(n.target > 0) && !v.met) return "Enter the hours needed.";
    const out = Object.assign({ name: v.name, credId: v.credId, note: v.note, met: v.met }, n);
    if (isNew) S.practice.push(Object.assign({ id: uid() }, out)); else Object.assign(p, out);
    toast("Saved");
  }, { onDelete: isNew ? null : () => { S.practice = S.practice.filter(x => x !== p); return "Deleted"; } });
}
function noteForm(n) {
  const isNew = !n;
  openSheet(isNew ? "Add a note" : "Edit note", F.area("text", "Note", n ? n.text : "", "Rules to remember, where files live…"), v => {
    if (!v.text) return "Write something first.";
    if (isNew) S.notes.push({ id: uid(), text: v.text, at: new Date().toISOString() }); else { n.text = v.text; n.at = new Date().toISOString(); }
  }, { onDelete: isNew ? null : () => { S.notes = S.notes.filter(x => x !== n); return "Note deleted"; } });
}
function packPicker(cur) {
  return `<div class="packs" id="packs">${Object.values(PACKS).map(pk => `<button type="button" class="pack ${pk.id === cur ? "on" : ""}" data-pack="${esc(pk.id)}" ${pk.soon ? "disabled" : ""} aria-pressed="${pk.id === cur}"><span class="ic pk-dot" data-pk="${esc(pk.id)}" aria-hidden="true">${ICON.license}</span><span class="tx"><b>${esc(pk.name)}</b><small>${esc(pk.who)}</small></span>${pk.id === cur ? pill("met", "Chosen") : ""}</button>`).join("")}</div>`;
}
function profileForm() {
  openSheet("Your profile", F.text("name", "Your name", S.profile.name, "Shown at the top of Home") +
    F.seg("role", "Your role", S.profile.role, P.roles.map(r => [r, esc(r)])) +
    F.text("states", "State or states", S.profile.states, "Ohio, Kentucky") +
    `<div class="field"><span class="flabel">Profession</span>${packPicker(S.profile.pack)}<span class="hint">Each profession gets its own sections, words and dashboard.</span></div>`, v => {
    if (!v.name) return "Add your name.";
    const on = document.querySelector("#sheetForm #packs .on"), pk = on && own(PACKS, on.dataset.pack) ? on.dataset.pack : S.profile.pack;
    if (pk !== S.profile.pack) { S.profile.pack = pk; S.look = S.look && S.look.theme ? { theme: S.look.theme } : undefined; }
    Object.assign(S.profile, { name: v.name.slice(0, 60), role: v.role || "", states: v.states.slice(0, 80) });
    toast("Profile saved");
  });
}
function mineForm() {
  const L = look();
  const checks = P.home.filter(([k]) => !ON_CAL.includes(k)).map(([k, label]) => `<label><input type="checkbox" data-home="${k}" ${L.hidden.includes(k) ? "" : "checked"}>${esc(label)}</label>`).join("");
  const form = openSheet("Appearance", F.seg("accent", "Color theme", L.accent, ACCENTS.map(([k, n, c]) => [k, `<i class="dot" style="background:${c}"></i>${n}`])) +
    F.seg("theme", "Light or dark", L.theme, [["auto", "Match my phone"], ["light", "Light"], ["dark", "Dark"]]) +
    `<div class="field"><span class="flabel">Show on Home</span><div class="checks">${checks}</div></div>`, v => {
    const hidden = [...document.querySelectorAll("#sheetForm [data-home]")].filter(x => !x.checked).map(x => x.dataset.home);
    S.look = { accent: v.accent || P.accent, theme: v.theme || "auto", hidden };
    toast("Looking good");
  }, { onClose: () => applyLook(), focus: false });
  const preview = () => { const pick = k => { const on = form.querySelector(`.seg[data-key="${k}"] .on`); return on ? on.dataset.v : L[k]; }; applyLook({ ...L, accent: pick("accent"), theme: pick("theme") }); };
  form.querySelectorAll(".seg").forEach(sg => sg.addEventListener("click", () => setTimeout(preview, 0)));
}
function windowsForm() {
  const W = S.settings.windows.slice().sort((a, b) => b - a);
  openSheet("Reminder windows", `<div class="row3">${F.num("w0", "First", W[0], "90")}${F.num("w1", "Second", W[1] || "", "60")}${F.num("w2", "Last", W[2] || "", "30")}</div>`, v => {
    const out = [v.w0, v.w1, v.w2].map(x => numOr(x, null)).filter(x => x != null);
    if (!out.length || out.some(x => Number.isNaN(x) || x < 1 || x > 365 || x % 1)) return "Use whole days from 1 to 365.";
    S.settings.windows = [...new Set(out)].sort((a, b) => b - a);
    toast("Windows saved");
  }, { lead: "How many days before each date things show as due, and when Calendar alerts go off. Anything inside the smallest window shows as Needs attention." });
}

/* --- starter kit: cards made from a role, finished one date at a time --- */
const KIT_ICON = { license: "license", cert: "cert", life: "life", id: "id", mal: "mal", priv: "priv" };
const inOhio = () => /\b(ohio|oh)\b/i.test(S.profile.states || "");
/* Requirements a starter card brings once it has a date. The window runs back from the renewal date by the
   preset's cycle; the person checks it with the board. Returns the names added. */
function kitRules(c) {
  const item = c.kit && P.kit && P.kit.items[c.kit]; if (!item) return [];
  const end = c.renewDue || c.expires; if (!end || !ISO_RX.test(end)) return [];
  const ids = (item.ce || []).concat(inOhio() ? item.ohio || [] : []), added = [];
  ids.forEach(pid => {
    const pre = P.presets.find(x => x.id === pid); if (!pre) return;
    if (S.rules.some(r => r.credId === c.id && r.preset === pid)) return;
    const w = presetWindow(pre, end);
    S.rules.push({ id: uid(), credId: c.id, name: pre.name, start: w.start, end: w.end, target: pre.target, subs: Object.assign({}, pre.subs || {}), caps: pre.caps ? JSON.parse(JSON.stringify(pre.caps)) : null, elective: !!pre.elective, group: pre.group || "", manual: null, preset: pid, fromKit: true });
    added.push(pre.name);
  });
  return added;
}
function kitCred(key) {
  const it = P.kit.items[key], st = String(S.profile.states || "").split(",")[0].trim();
  const c = { id: uid(), kind: it.kind, kit: key, setup: true, status: "auto", numStore: "full" };
  if (it.kind === "license") { c.title = it.title; c.issuer = st; }
  if (it.kind === "cert") { c.issuer = it.issuer; c.title = it.title || ""; }
  if (it.kind === "life") { c.lifeType = it.lifeType; c.title = it.lifeType; }
  if (it.kind === "id") { c.idKind = it.idKind; c.title = it.idKind; if (SENSITIVE(c)) c.numStore = "last4"; }
  if (it.kind === "mal") c.title = it.title || SECT("mal").top;
  if (it.kind === "priv") c.title = SECT("priv").defTitle;
  return c;
}
function kitPicker(role) {
  const plan = (P.kit.roles[role] || P.kit.roles.Other), keys = plan.on.concat(plan.more);
  return `<div class="kit" id="kitGrid">${keys.map(k => { const it = P.kit.items[k], on = plan.on.includes(k);
    return `<button type="button" class="kitem press ${on ? "on" : ""}" data-kit="${k}" aria-pressed="${on}">${kic(it.kind === "life" ? "life" : KIT_ICON[it.kind])}<span>${esc(it.label)}</span><i class="tick">${ICON.check}</i></button>`; }).join("")}</div>`;
}
const setupLeft = () => S.creds.filter(c => c.setup);
/* One card, only the fields that matter now. Saving opens the next card that still needs a date. */
function finishCard(c) {
  const left = setupLeft(), total = S.creds.filter(x => x.kit).length || left.length, done = total - left.length;
  const k = c.kind, sens = SENSITIVE(c);
  let html = "";
  const sec = SECT(k), fl = key => FLABEL(k, key, key), ph = key => { const f = sec.fields.find(x => x[0] === key); return f && typeof f[3] === "string" ? f[3] : ""; };
  if (k === "cert") html += F.text("title", fl("title"), c.title, c.issuer === "ANCC" ? "FNP-BC, AGPCNP-BC…" : c.issuer === "AANP" ? "FNP-C, AGNP-C…" : ph("title"));
  if (k === "mal") html += F.text("issuer", fl("issuer"), c.issuer, ph("issuer"));
  if (k === "priv") html += F.text("title", fl("title"), c.title === sec.defTitle ? "" : c.title, ph("title"));
  if (k === "priv") html += F.date("reappt", fl("reappt"), c.reappt);
  else if (!NOEXP(c)) { const dk = k === "license" && P.licenseDateKey ? P.licenseDateKey : "expires"; html += F.date(dk, dk === "expires" ? sec.dateWord : fl(dk), c[dk], k === "license" ? P.id === "legal" ? "The date on your court's attorney lookup." : "The date on your license or the board's lookup." : ""); }
  if (k === "id") html += F.text("number", c.idKind + " number", "", c.idKind === "NPI" ? "10 digits" : "", sens ? "Only the last 4 are kept on this phone." : "");
  if (k === "license") html += F.text("number", fl("number") + " (optional)", c.number, "");
  const next = () => { const n = setupLeft()[0]; if (n) later(() => finishCard(n)); };
  openSheet(esc(credFullName(c)), html, v => {
    const date = v.expires || v.reappt || v.renewDue;
    if (date && !ISO_RX.test(date)) return "Check the date.";
    if (NOEXP(c) ? !v.number : !date) return NOEXP(c) ? "Add the number, or tap Skip." : "Add the date, or tap Skip.";
    if (v.title != null && k === "priv" && !v.title) return "Add the " + fl("title").toLowerCase() + ".";
    Object.keys(v).forEach(key => { if (v[key] !== "") c[key] = v[key]; });
    if (sens && c.number) c.number = c.number.replace(/\s/g, "").slice(-4);
    c.setup = false;
    const added = kitRules(c);
    toast(added.length ? `Saved. ${added.join(" and ")} hours added` : "Saved");
    later(() => { if (setupLeft().length) next(); });
  }, { lead: `${done} of ${total} done${k === "life" || k === "license" ? ". Only the date is needed now." : ""}`, saveLabel: left.length > 1 ? "Save and next" : "Save", cancelLabel: "Skip",
    onCancel: () => { const rest = setupLeft(), i = rest.indexOf(c), n = rest[i + 1]; if (n) finishCard(n); },
    dots: `<div class="kitbar"><span data-w="${total ? (done / total * 100).toFixed(1) : 0}%"></span></div>`, focus: false });
}

/* --- first run: one question per screen --- */
function onboard() {
  const draft = { name: "", pack: "nursing", role: "", states: "" };
  const dots = i => `<div class="stepdots">${[0, 1, 2, 3].map(k => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>`;
  const finish = keys => {
    const keep = S; S = blank(keep); S.look = keep.look && keep.look.theme ? { theme: keep.look.theme } : undefined; S.profile = { name: draft.name, role: draft.role, states: draft.states, pack: draft.pack };
    P = own(PACKS, draft.pack) ? PACKS[draft.pack] : PACKS.nursing;
    (keys || []).forEach(k => { if (P.kit && P.kit.items[k]) S.creds.push(kitCred(k)); });
    commit(); go("home");
    if (S.creds.length) { toast(`${S.creds.length} cards made. Add a date to each.`); later(() => finishCard(S.creds[0])); }
    else { toast("You're set. Add your first " + SECT("license").one + "."); later(() => addMenu()); }
  };
  const step4 = () => {
    const form = openSheet("What do you have?", kitPicker(draft.role || "Other"), () => {
      const keys = [...form.querySelectorAll(".kitem.on")].map(b => b.dataset.kit); later(() => finish(keys)); return "nocommit";
    }, { dots: dots(3), lead: "We'll make a card for each one. Then you only add dates.", saveLabel: "Make my cards", cancelLabel: "Skip", onCancel: () => finish([]), focus: false });
    form.querySelector("#kitGrid").addEventListener("click", e => { const b = e.target.closest(".kitem"); if (!b) return; const on = !b.classList.contains("on"); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
  };
  const step3 = () => openSheet("Your role and state", F.seg("role", "Role", draft.role, P.roles.map(r => [r, esc(r)])) + F.text("states", "State or states", draft.states, "Ohio"), v => {
    draft.role = v.role || ""; draft.states = v.states; later(step4); return "nocommit";
  }, { dots: dots(2), lead: "Your role picks your starter cards. No license numbers here.", saveLabel: "Next", cancelLabel: "Skip", onCancel: step4, focus: false });
  const step2 = () => { const form = openSheet("What do you do?", packPicker(draft.pack), () => { const on = form.querySelector("#packs .on"); draft.pack = on ? on.dataset.pack : draft.pack; P = own(PACKS, draft.pack) ? PACKS[draft.pack] : PACKS.nursing; draft.role = ""; later(step3); return "nocommit"; }, { dots: dots(1), lead: "Your dashboard, sections and words change to fit your work.", saveLabel: "Next", cancelLabel: "Skip", onCancel: step3, focus: false }); };
  openSheet("Let's set up your tracker", F.text("name", "What's your name?", "", "First and last"), v => {
    if (!v.name) return "Add your name to keep going.";
    draft.name = v.name.slice(0, 60); later(step2); return "nocommit";
  }, { dots: dots(0), lead: "This clears the example. Everything stays on this device.", saveLabel: "Next" });
}

/* --- the + button --- */
const ADD = [
  ["Log", [["ce", P => "Course", "ok", ICON.ce, () => ceForm()], ["todo", () => "To-do", "info", ICON.todo, () => todoForm()], ["note", () => "Note", "info", ICON.note, () => noteForm()]]],
  ["Credentials", ["license", "cert", "life", "id", "mal", "priv"].map(k => [k, () => SECT(k).short, "k-" + k, ICON[k], () => credForm(k)])],
  ["Track", [["rule", P => P.ce + " requirement", "k-cert", ICON.rule, () => ruleForm()], ["prac", () => "Practice hours", "info", ICON.clock, () => practiceForm()], ["ics", () => "Calendar alerts", "info", ICON.bell, () => calendarFile()]]]];
/* the + : say it in your own words first, or pick from the grid underneath */
function addMenu(only) {
  const groups = only === "creds" ? [["Credentials", ADD[1][1].concat([["file", () => "File or photo", "info", ICON.note, () => addDoc()]])]] : ADD;
  const html = `<div class="addask">
      <div class="ask"><label class="sr" for="addAskIn">What to add</label><input id="addAskIn" type="text" enterkeyhint="go" autocomplete="off" placeholder="Quick Add"><button type="button" id="addAskGo" aria-label="Go">${ICON.send}</button></div>
      <small>For example: ${esc(only === "creds" ? P.addEx.creds : P.addEx.all)}</small>
      <div class="ask-inline" id="addAskOut"></div></div>
    ` +
    groups.map(([hd, items]) => `<div class="addhd">${hd}</div><div class="addgrid">${items.map(([k, label, c, svg]) => `<button type="button" class="addtile press" data-add="${k}"><span class="ic" style="background:var(--${c}-fill);color:#fff" aria-hidden="true">${svg}</span>${esc(label(P))}</button>`).join("")}</div>`).join("");
  const form = openSheet(only === "creds" ? "Add a Card" : "Add", html, null, { noSave: true, cancelLabel: "Close", focus: false });
  const inp = form.querySelector("#addAskIn"), go = () => { const v = inp.value.trim(); if (!v) { inp.focus(); return; } runAsk(v, form.querySelector("#addAskOut")); inp.value = ""; inp.blur(); };
  form.querySelector("#addAskGo").onclick = go;
  inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); go(); } });
  form.addEventListener("click", e => { const b = e.target.closest("[data-add]"); if (!b) return;
    if (b.dataset.add === "file") { addDoc(); return; }
    groups.forEach(([, items]) => items.forEach(it => { if (it[0] === b.dataset.add) { sheetClose && sheetClose(); later(it[4]); } })); });
}
