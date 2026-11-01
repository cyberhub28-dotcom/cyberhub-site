function billRow(b, opts) {
  const paid = !!S.paid[b.key], late = !paid && b.date < TODAY, soon = !paid && !late && dayDiff(TODAY, b.date) <= 3;
  const tagH = paid ? '<span class="pilltag ok">Paid</span>' : late ? '<span class="pilltag late">Overdue</span>' : soon ? '<span class="pilltag soon">Soon</span>' : "";
  const kindLbl = opts && (opts.inSheet || opts.kindLbl);
  return `<div class="lrow ${paid ? "paid" : ""}" style="padding-left:16px">
    <button class="check ${paid ? "on" : ""}" data-act="bill-toggle" data-key="${b.key}" aria-pressed="${paid}" aria-label="Mark ${esc(b.name)} ${paid ? "unpaid" : "paid"}"><span>${ICON.check}</span></button>
    <button class="li-main" style="padding-left:2px" data-act="${opts && opts.inSheet ? "bill-edit-sheet" : "bill-edit"}" data-id="${b.id}"><span class="tx"><b>${esc(b.name)}</b><small>${kindLbl ? (b.kind === "sub" ? "Subscription" : "Bill") : dueWhen(b.date)}${b.kind === "sub" && !kindLbl ? " · subscription" : ""}</small></span>${tagH}<span class="amt num">${amt(b.amount)}</span></button></div>`;
}
function expRow(e, showDate) {
  const cat = S.cats.find(x => x.id === e.cat) || { name: "Other", color: 0 };
  return `<button class="li" data-act="exp-edit" data-id="${e.id}">${letterIc(cat.name, PALETTE[cat.color % 6])}<span class="tx"><b>${esc(e.note || cat.name)}</b><small>${esc(cat.name)}${showDate ? " · " + short(D(e.date)) : ""}</small></span><span class="amt num">${money(e.amount, true)}</span>${ICON.chev}</button>`;
}
/* one ring like the Fitness app: what's spent in the middle, the name and one plain status line under it */
function ringSvg(pct, col, mid) {
  return `<span class="ringsvg"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="trk" cx="50" cy="50" r="43" style="stroke-width:10"/>${pct > 0 ? `<circle class="arc" cx="50" cy="50" r="43" pathLength="100" style="stroke-width:10;stroke:${col}" data-arc="${Math.min(100, pct).toFixed(1)}"/>` : ""}</svg><span class="mid">${mid}</span></span>`;
}
function catRing(r) {
  const over = r.spent > r.plan + .004, pct = r.plan ? r.spent / r.plan * 100 : (r.spent ? 100 : 0);
  const col = over ? "var(--debt)" : PALETTE[r.c.color % 6];
  const status = over ? `<small class="behind">Over by ${money(r.spent - r.plan)}</small>` : `<small>${money(r.plan - r.spent)} left</small>`;
  return `<button class="ringit press" data-act="ring-cat" data-id="${r.c.id}" aria-label="${esc(r.c.name)}: ${money(r.spent)} spent of ${money(r.plan)}. Opens its purchases.">${ringSvg(pct, col, `<b class="num">${money(r.spent)}</b><small>of ${money(r.plan)}</small>`)}<span class="rt"><b>${esc(r.c.name)}</b>${status}</span></button>`;
}
/* savings goals and debts as cards in a wallet */
function goalCard(g) {
  const saved = goalSaved(g), pct = Math.min(100, saved / g.target * 100), done = saved >= g.target;
  const e = done ? "" : eta(g.target - saved, g.per), when = e.includes(" · ") ? e.split(" · ")[1] : "";
  return `<button class="wcard mini g${g.icon % 4} press" data-act="goal-edit" data-id="${g.id}" aria-label="${esc(g.name)}: ${money(saved)} saved of ${money(g.target)}${when ? ", done by " + when : ""}">
    <span class="w1"><small>Savings goal</small><span class="wpill">${done ? ICON.check + "Reached" : Math.floor(pct) + "%"}</span></span>
    <span class="w2"><b>${esc(g.name)}</b></span>
    <span class="wbar"><span data-w="${pct.toFixed(1)}%"></span></span>
    <span class="w3"><span class="no"><b>${money(saved)}</b> of ${money(g.target)}</span>${when ? `<span class="ex"><small>Done by</small><b>${when}</b></span>` : done ? "" : `<span class="ex"><small>Plan</small><b>${money(g.per)}</b></span>`}</span></button>`;
}
function debtCard(d) {
  const paid = debtPaid(d), bal = Math.max(0, d.start - paid), pct = Math.min(100, paid / d.start * 100);
  const e = bal <= 0 ? "" : eta(bal, d.per, d.apr), when = e.includes(" · ") ? e.split(" · ")[1] : "", stuck = /interest/.test(e);
  return `<button class="wcard mini debt press" data-act="debt-edit" data-id="${d.id}" aria-label="${esc(d.name)}: ${money(bal)} left${when ? ", paid off by " + when : ""}">
    <span class="w1"><small>Debt${d.apr ? " · " + d.apr + "% APR" : ""}</small><span class="wpill ${stuck ? "warn" : ""}">${bal <= 0 ? ICON.check + "Paid off" : stuck ? "Interest only" : Math.floor(pct) + "% paid"}</span></span>
    <span class="w2"><b>${esc(d.name)}</b></span>
    <span class="wbar"><span data-w="${pct.toFixed(1)}%"></span></span>
    <span class="w3"><span class="no"><b>${money(bal)}</b> left</span>${when ? `<span class="ex"><small>Free by</small><b>${when}</b></span>` : bal > 0 ? `<span class="ex"><small>Pay</small><b>${money(d.per)}</b></span>` : ""}</span></button>`;
}
function renderHome(p, c, lbl) {
  const L = look(), name = String(L.name || "").trim();
  const h = new Date().getHours(), part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  $("#hello").innerHTML = `<small>${esc(TODAY.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }))}</small><h1>${part}${name ? ", " + esc(name) : ""}</h1>`;
  $("#sampleBar").innerHTML = S.sample ? `<a class="sample-bar press" href="#more"><span><b>Example.</b> These numbers are made up. Start fresh in the Menu.</span>${ICON.chev}</a>` : "";
  renderAsk();
  const used = c.income > 0 ? (c.income - c.left) / c.income : 0, pct = Math.round(used * 100);
  const C = 2 * Math.PI * 50, off = C * (1 - Math.min(1, Math.max(0, used)));
  let daysTxt, daysLbl;
  if (sel === 0) { const n = dayDiff(TODAY, p.next); daysTxt = n === 1 ? "1 day" : n + " days"; daysLbl = "Until payday"; }
  else if (sel < 0) { daysTxt = short(p.end); daysLbl = "Ended"; }
  else { daysTxt = dayDiff(TODAY, p.start) + " days"; daysLbl = "Until it starts"; }
  const over = c.left < 0, daily = sel === 0 && !over ? c.left / Math.max(1, dayDiff(TODAY, p.next)) : null;
  $("#hero").innerHTML = `${HERO_TEX}<div class="in">
    <div><div class="lbl">${over ? "Over budget" : "Left to spend"} · ${esc(lbl.toLowerCase())}</div>
      <div class="big num">${over ? "−" : ""}${cnt(Math.abs(c.left), "heroLeft")}</div>
      <div class="sub">From ${money(c.income)} in, after <b>${money(c.billsTotal)}</b> in bills, <b>${money(c.saving)}</b> for goals and debt, and <b>${money(c.spent)}</b> spent.</div></div>
    <div class="stats">
      <div class="ring" role="img" aria-label="${pct}% of this paycheck is used or planned">
        <svg viewBox="0 0 120 120"><circle class="trk" cx="60" cy="60" r="50" fill="none" stroke-width="12"/><circle class="bar ${over ? "over" : ""}" cx="60" cy="60" r="50" fill="none" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-off="${off}"/></svg>
        <div class="mid"><b class="num">${pct}%</b><small>used</small></div></div>
      <div class="minis"><div class="mini"><small>${daysLbl}</small><b class="num">${daysTxt}</b></div>
        <div class="mini"><small>Daily allowance</small><b class="num">${daily == null ? "—" : money(daily)}</b></div></div>
    </div>
    <span class="hero-go">See budget <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" style="fill:none;stroke:currentColor;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round"/></svg></span></div>`;
  // shortcut tiles
  const pb = plan(p, "paycheck"), next = upcoming()[0];
  const tile = (href, col, svg, title, big, cap) => `<a class="tile press" href="${href}"><span class="th" style="color:var(--${col})">${svg}<span>${title}</span></span><b class="num">${big}</b><small>${cap}</small></a>`;
  $("#homeTiles").innerHTML =
    tile("#budget", pb.left < 0 ? "debt" : "bills", ICON.list, "Budget", cnt(Math.abs(pb.left), "tileLeft"), pb.left < 0 ? "over plan" : "left to plan") +
    tile("#activity", "spend", ICON.bars, "Activity", cnt(c.spent, "tileSpent"), "spent so far") +
    tile("#calendar", "save", ICON.cal, "Calendar", next ? short(next.date) : "All paid", next ? "next bill" : "bills");
  // due soon
  const due = upcoming().slice(0, 3);
  $("#homeDue").innerHTML = `<div class="group-h"><h2>Due soon</h2><a href="#calendar" class="press">Calendar${ICON.chev}</a></div>
    <div class="list">${due.length ? due.map(b => billRow(b)).join("") : empty("var(--income)", S.bills.length ? "All caught up. Nothing due in the next two paychecks." : "Add your bills in Budget and they'll show up here.")}</div>
    ${due.length ? '<div class="note">Tap the circle to mark a bill paid.</div>' : ""}`;
  // spending plan as single rings
  const rr = pb.cats.filter(r => r.plan > 0 || r.spent > 0);
  $("#homeRings").innerHTML = `<div class="group-h"><h2>Spending plan</h2><a href="#activity" class="press">Activity${ICON.chev}</a></div>` +
    (rr.length ? `<div class="ringcard"><div class="rings n${Math.min(rr.length, 3)}">${rr.map(catRing).join("")}</div></div>` : `<div class="list">${empty("var(--spend)", "Give each spending category a plan and watch its ring fill up.")}${addRow("cat-add", "Add a category")}</div>`);
  // goals and debts as wallet cards
  const cards = S.goals.map(goalCard).concat(S.debts.map(debtCard));
  $("#homeWallet").innerHTML = `<div class="group-h"><h2>Goals and debts</h2><a href="#budget" class="press">Budget${ICON.chev}</a></div>` +
    (cards.length ? `<div class="wscroll">${cards.join("")}<button class="wcard mini newcard press" data-act="goal-new">${ICON.plus}New goal</button></div>` : `<div class="list">${empty("var(--save)", "Set a savings goal or list a debt and it shows up here as a card.")}${addRow("goal-new", "Add a goal")}${addRow("debt-new", "Add a debt")}</div>`);
  // recent
  const recent = S.expenses.filter(e => D(e.date) <= TODAY).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  $("#homeRecent").innerHTML = `<div class="group-h"><h2>Recent purchases</h2><a href="#activity" class="press">See all${ICON.chev}</a></div>
    <div class="list">${recent.length ? recent.map(e => expRow(e, true)).join("") : empty("var(--spend)", "No purchases yet. Type one in Quick add, like “Coffee 5.50”.")}</div>`;
}

