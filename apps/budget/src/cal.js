/* an iPhone-style month: tap a day to see it below, swipe the grid for another month */
let calSel = null;
function calMove(dir) { calOffset += dir; calSel = null; renderCal(dir); }
function renderCal(dir) {
  const base = new Date(TODAY.getFullYear(), TODAY.getMonth() + calOffset, 1, 12);
  const y = base.getFullYear(), m = base.getMonth(), key = iso(base).slice(0, 7);
  const paydays = paydaySet(y, m), cur = periodAt(0), items = monthItems(y, m), todayIso = iso(TODAY);
  if (!calSel || calSel.slice(0, 7) !== key) calSel = calOffset === 0 ? todayIso : (items[0] ? iso(items[0].date) : iso(base));
  const start = addDays(base, -base.getDay()), weeks = Math.ceil((base.getDay() + daysInMonth(y, m)) / 7);
  let cells = "";
  for (let i = 0; i < weeks * 7; i++) {
    const dt = addDays(start, i), k = iso(dt), out = dt.getMonth() !== m;
    const due = S.bills.filter(b => dueOn(b, dt.getFullYear(), dt.getMonth()).getDate() === dt.getDate());
    const pd = paydays.has(k);
    const dots = (pd ? '<i class="pay"></i>' : "") + due.slice(0, pd ? 2 : 3).map(b => `<i class="${S.paid[keyOf(b, dt)] ? "pd" : dt < TODAY ? "late" : b.kind === "sub" ? "sub" : ""}"></i>`).join("");
    const cls = ["cday", out ? "out" : "", inP(cur, dt) ? "inp" : "", k === todayIso ? "today" : "", k === calSel ? "sel" : "", pd ? "payday" : ""].filter(Boolean).join(" ");
    cells += `<button class="${cls}" data-act="cal-pick" data-d="${k}" aria-label="${WD[dt.getDay()]}, ${MONTHS[dt.getMonth()]} ${dt.getDate()}${pd ? ", payday" : ""}${due.length ? ", " + due.length + " due" : ""}"${k === calSel ? ' aria-pressed="true"' : ""}><span class="n num">${dt.getDate()}</span><span class="cdots">${dots}</span></button>`;
  }
  const nb = items.filter(i => i.type === "bill").length, np = items.filter(i => i.type === "pay").length;
  const chev = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" style="fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round"/></svg>`;
  $("#calCard").innerHTML = `<div class="cal">
    <div class="calhd"><div><h2>${MONTHS[m]} <span>${y}</span></h2><small>${nb || np ? [nb ? nb + (nb === 1 ? " bill" : " bills") : "", np ? np + (np === 1 ? " payday" : " paydays") : ""].filter(Boolean).join(" · ") : "Nothing this month"}</small></div>
      ${calOffset ? '<button class="caltoday press" data-act="cal-today">Today</button>' : ""}
      <button class="calnav press" data-act="cal-prev" aria-label="Previous month">${chev("M15 5l-7 7 7 7")}</button>
      <button class="calnav press" data-act="cal-next" aria-label="Next month">${chev("M9 5l7 7-7 7")}</button></div>
    <div class="calwd" aria-hidden="true">${WD.map(w => `<span>${w[0]}</span>`).join("")}</div>
    <div class="calgrid${dir > 0 ? " in-r" : dir < 0 ? " in-l" : ""}" id="calGrid">${cells}</div>
    <div class="cal-key"><span><i style="background:var(--income)"></i>Payday</span><span><i style="background:var(--bills)"></i>Bill</span><span><i style="background:var(--subs)"></i>Subscription</span><span><i style="background:var(--debt)"></i>Overdue</span><span><i style="background:var(--ink-3);opacity:.55"></i>Paid</span><span><i style="background:color-mix(in srgb, var(--brand) 22%, transparent)"></i>This paycheck</span></div></div>`;
  // the day you tapped
  const sd = D(calSel), n = dayDiff(TODAY, sd);
  const when = n === 0 ? "Today" : n === 1 ? "Tomorrow" : n === -1 ? "Yesterday" : n > 0 ? "In " + n + " days" : Math.abs(n) + " days ago";
  const dayBills = S.bills.filter(b => dueOn(b, sd.getFullYear(), sd.getMonth()).getDate() === sd.getDate()).map(b => ({ ...b, date: sd, key: keyOf(b, sd) }));
  const rows = (paydays.has(calSel) ? `<div class="li">${ic("income")}<span class="tx"><b>Payday</b><small>${SCHED_LABEL[S.settings.schedule]}</small></span><span class="amt num" style="color:var(--income)">+${money(S.settings.pay)}</span></div>` : "") + dayBills.map(b => billRow(b, { kindLbl: true })).join("");
  $("#dayList").innerHTML = `<div class="dayhd"><b>${WD[sd.getDay()]}, ${MONTHS[sd.getMonth()]} ${sd.getDate()}</b><span>${when}</span></div>
    <div class="list">${rows || `<div class="empty" style="padding:16px">Nothing due this day.</div>`}${addRow("bill-add-day", "Add a bill due this day", `data-day="${sd.getDate()}"`)}</div>`;
  // the whole month
  const billTot = sum(items.filter(i => i.type === "bill"), i => i.b.amount);
  $("#calAgenda").innerHTML = `<div class="group-h"><h2>${MONTHS[m]} at a glance</h2><div class="tot num">${money(billTot)}<small>in bills and subscriptions</small></div></div>
    <div class="list">${items.length ? items.map(it => it.type === "pay"
      ? `<div class="li">${ic("income")}<span class="tx"><b>Payday</b><small>${WD[it.date.getDay()]}, ${short(it.date)}</small></span><span class="amt num" style="color:var(--income)">+${money(S.settings.pay)}</span></div>`
      : billRow(it.b)).join("") : empty("var(--bills)", "Nothing scheduled this month.")}
    ${addRow("bill-add", "Add a bill")}</div>`;
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
function calPick(d) {
  const dt = D(d), base = new Date(TODAY.getFullYear(), TODAY.getMonth() + calOffset, 1, 12);
  const diff = (dt.getFullYear() - base.getFullYear()) * 12 + dt.getMonth() - base.getMonth();
  calSel = d;
  if (diff) { calOffset += diff; renderCal(diff); } else renderCal();
}

