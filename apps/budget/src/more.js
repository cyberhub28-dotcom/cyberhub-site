function renderMore() {
  const L = look(), acc = (ACCENTS.find(a => a[0] === L.accent) || ACCENTS[0]);
  $("#moreBody").innerHTML = `
  <div class="group"><div class="list">
    <button class="li" id="openMine" data-act="mine"><span class="ic" style="background:var(--brand);color:var(--brand-ink)">${ICON.brush}</span><span class="tx"><b>Make it yours</b><small>${esc(acc[1])} · ${L.theme === "auto" ? "matches your phone" : L.theme}${L.name ? " · " + esc(L.name) : ""}</small></span>${ICON.chev}</button>
    <button class="li" id="openSettings" data-act="settings">${ic("income", ICON.sliders)}<span class="tx"><b>Budget settings</b><small>${money(S.settings.pay)} · ${SCHED_LABEL[S.settings.schedule].toLowerCase()} · ${esc(S.settings.currency)}</small></span>${ICON.chev}</button>
  </div></div>
  <div class="group"><div class="group-h"><h2>Backup</h2></div><div class="list">
    <div class="li">${ic(S.lastBackup ? "ok" : "warn", ICON.up)}<span class="tx"><b>${S.lastBackup ? "Last backup " + esc(fmtLong(S.lastBackup)) : "No backup yet"}</b><small>Everything in one file: pay, bills, purchases, goals and debts</small></span></div>
    <div class="btnrow"><button class="btn primary press" id="doBackup" data-act="backup">Back up now</button><button class="btn ghost press" id="doRestore" data-act="restore">Restore a backup</button></div>
  </div>
  <details class="card keep" id="keepCard"><summary><span><b>Your budget lives only on this phone</b><span class="kp">Back up often and keep the file private. CyberHub can't see or restore it.</span></span>${ICON.chev}</summary>
    <div class="kh">What erases it</div>
    <ul><li>Deleting the app from your Home Screen</li><li>A new or reset phone, until you restore a backup</li><li>In a Safari tab: clearing history or website data, or Safari clearing it after about 7 days unused</li><li>On Android, Pixel included: clearing Chrome's data for this site, even if it's on your Home Screen</li></ul>
    <div class="kh">What keeps it safe</div>
    <ul><li>Use it from your Home Screen${standalone ? " (you are)" : ""}. On iPhone it keeps its own storage there, so clearing Safari history and the 7-day cleanup don't touch it.</li><li>Back up after big changes, and save the file in Files, iCloud Drive or Google Drive. If it's been a week, Home shows a reminder when you open the app.</li><li>Moving from a Safari tab to the Home Screen? It doesn't move over by itself. Back up in Safari, then restore in the Home Screen app.</li></ul>
    <p class="muted">There's no account and no server, so your backup file is the only copy. It isn't locked with a password, so anyone who opens it can read your numbers. Keep it private.</p>
  </details></div>
  <div class="group"><div class="group-h"><h2>Put it on your Home Screen</h2></div><div class="list">
    <div class="li">${ic("bills", ICON.phone)}<span class="tx"><b>${standalone ? "You're all set" : "Open it like an app"}</b><small>${standalone ? "You're using it from your Home Screen." : (isAndroid ? "It gets its own icon and opens full screen, like an app." : "It gets its own icon, opens full screen, and keeps its own storage, safe from Safari cleanups.")}</small></span></div>
    ${standalone ? "" : (isAndroid ? "" : `${isIOS ? "" : '<div class="kh2">iPhone</div>'}<ol class="steps"><li>In Safari, tap <b>Share</b> (the square with an arrow).</li><li>Scroll and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>. Then open it from the new icon.</li></ol>`) + (isIOS ? "" : `${isAndroid ? "" : '<div class="kh2">Android</div>'}<ol class="steps"><li>In Chrome, tap the <b>three dots</b> at the top right.</li><li>Tap <b>Add to Home screen</b> or <b>Install app</b>.</li><li>Tap <b>Install</b> or <b>Add</b>. Then open it from the new icon.</li></ol>`)}
  </div></div>
  <div class="group"><div class="group-h"><h2>Your data</h2></div><div class="list">
    <button class="li" id="openImport" data-act="import">${ic("income", ICON.down)}<span class="tx"><b>Import purchases</b><small>From a CSV file your bank, another app or a spreadsheet saved</small></span>${ICON.chev}</button>
    <button class="li" id="loadSample" data-act="load-sample">${ic("warn", ICON.sparkle)}<span class="tx"><b>See an example</b><small>Made-up numbers to look around. Replaces what's here.</small></span>${ICON.chev}</button>
    <button class="li" id="fresh" data-act="fresh"><span class="ic" style="background:color-mix(in srgb, var(--danger) 12%, transparent);color:var(--danger)">${ICON.erase}</span><span class="tx"><b style="color:var(--danger)">Start fresh</b><small id="freshSub">Clears bills, purchases, income, goals and debts. Keeps your pay, categories and look.</small></span></button>
  </div></div>
  <div class="about">
    <div class="mark"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1l6 3.5v7L8 15l-6-3.5v-7z" style="fill:none;stroke:currentColor;stroke-width:1.6"/><path d="M8 5l3 1.75v3.5L8 12 5 10.25v-3.5z" style="fill:currentColor"/></svg>CyberHub Software</div>
    <div><b style="color:var(--ink-2)">Paycheck Budget</b></div>
    <p>This app adds up the numbers you enter. It doesn't connect to your bank, move money, or give financial, tax or legal advice.</p>
    <p>No account, no ads, no tracking. Your numbers stay on this device unless you save a backup.</p>
  </div>`;
}

/* ---------- sheet (forms) ---------- */
/* A sheet slides up from the bottom. Pull it down by the top to close it. A sheet opened right after
   another one slides in inside the same sheet, like a page in a stack. */
let sheetClose = null, sheetHide = null, sheetPrevFocus = null;
function openSheet(title, fields, onSave, onDelete, extraHtml, saveLabel, onClose, noCancel, o) {
  o = o || {};
  const root = $("#sheetRoot");
  let scrim = $("#scrim");
  const reuse = !!scrim && scrim.classList.contains("show") && (!!sheetClose || !!sheetHide);
  if (sheetClose) sheetClose(true, reuse);
  if (sheetHide) { clearTimeout(sheetHide); sheetHide = null; }
  const fh = fields.map(f => {
    const id = "f_" + f.key;
    if (f.type === "seg") return `<div class="field"><label>${f.label}</label><div class="seg" data-key="${f.key}" role="group" aria-label="${f.label}">${f.options.map(o => `<button type="button" data-v="${esc(o[0])}" class="${String(f.value) === String(o[0]) ? "on" : ""}" aria-pressed="${String(f.value) === String(o[0])}">${o[1]}</button>`).join("")}</div></div>`;
    if (f.type === "select") return `<div class="field"><label for="${id}">${f.label}</label><select id="${id}" data-key="${f.key}">${f.options.map(o => `<option value="${esc(o[0])}" ${String(o[0]) === String(f.value) ? "selected" : ""}>${esc(o[1])}</option>`).join("")}</select></div>`;
    const t = f.type === "money" || f.type === "number" ? "number" : f.type;
    return `<div class="field"><label for="${id}">${f.label}</label><input id="${id}" data-key="${f.key}" type="${t}" ${t === "number" ? `inputmode="decimal" step="${f.step || "0.01"}" min="${f.min != null ? f.min : 0}"${f.max != null ? ` max="${f.max}"` : ""}` : ""} value="${esc(f.value == null ? "" : f.value)}" ${f.ph ? `placeholder="${esc(f.ph)}"` : ""} autocomplete="off"></div>`;
  }).join("");
  const formHtml = `<form class="sheet${reuse ? " swap" : ""}" id="sheetForm" role="dialog" aria-modal="true" aria-labelledby="sheetTitle" novalidate>
    <div class="grab" aria-hidden="true"></div><h3 id="sheetTitle">${title}</h3>${fh}${extraHtml || ""}<div class="err" id="sheetErr" role="alert"></div>
    <div class="sheet-actions">${onDelete ? '<button type="button" class="btn danger" id="sheetDel">Delete</button>' : ""}${noCancel ? "" : '<button type="button" class="btn ghost" id="sheetCancel">Cancel</button>'}<button type="submit" class="btn primary">${saveLabel || "Save"}</button></div></form>`;
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
  /* on a phone the keyboard waits for your tap; on a computer the first box is ready to type in */
  if (o.focus !== false) { const first = form.querySelector("input:not([type=checkbox]),select"); if (first && !("ontouchstart" in window)) setTimeout(() => first.focus({ preventScroll: true }), 80); }
  form.querySelectorAll(".seg").forEach(sg => sg.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; sg.querySelectorAll("button").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); }); }));
  let closed = false;
  const close = (now, keep) => {
    if (closed) return; closed = true;
    if (onClose) onClose();
    document.removeEventListener("keydown", onKey); if (sheetClose === close) sheetClose = null;
    if (keep) return;
    if (now) { scrim.remove(); return; }
    /* wait a moment: if another sheet opens right away it takes over this one instead of dropping and rising again */
    sheetHide = setTimeout(() => {
      sheetHide = null; scrim.classList.remove("show"); form.style.transform = "";
      setTimeout(() => { if (scrim.parentNode && !scrim.classList.contains("show")) { scrim.remove(); if (!sheetClose && prevFocus && prevFocus.focus && document.contains(prevFocus)) prevFocus.focus({ preventScroll: true }); } }, 460);
    }, 90);
  };
  const onKey = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey); sheetClose = close;
  scrim.onclick = e => { if (e.target === scrim && sheetClose === close) close(); };
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
  if (!noCancel) $("#sheetCancel").onclick = () => close();
  if (onDelete) { const del = $("#sheetDel"); del.onclick = () => {
    if (!del.classList.contains("armed")) { del.classList.add("armed"); del.textContent = "Tap again to delete"; return; }
    const snap = JSON.stringify(S), msg = onDelete(); close(); save(); fmtCache = {}; render();
    toast(msg || "Deleted", () => { S = JSON.parse(snap); locateToday(); commit("Brought it back"); }); }; }
  form.onsubmit = e => {
    e.preventDefault();
    const v = {};
    form.querySelectorAll("[data-key]").forEach(el => { if (el.classList.contains("seg")) { const on = el.querySelector(".on"); v[el.dataset.key] = on ? on.dataset.v : null; } else v[el.dataset.key] = el.value.trim(); });
    for (const f of fields) {
      if (f.type === "money" || f.type === "number") { const n = parseFloat(v[f.key]); if (!isFinite(n) || n < (f.min != null ? f.min : 0) || (f.max != null && n > f.max) || (f.req !== false && v[f.key] === "")) { $("#sheetErr").textContent = `${f.label}: enter a number${f.max != null ? ` from ${f.min || 0} to ${f.max}` : " of 0 or more"}.`; return; } v[f.key] = f.type === "money" ? r2(n) : n; }
      else if (f.req !== false && !v[f.key]) { $("#sheetErr").textContent = `${f.label} can't be empty.`; return; }
    }
    const msg = onSave(v); if (typeof msg === "string") { $("#sheetErr").textContent = msg; return; } if (msg === false) return;
    close(); commit();
  };
  return form;
}
