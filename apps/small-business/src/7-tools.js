/* ---------- Tools: the calculators, messages and paperwork a one-person business reaches for every week.
   Everything works on the phone. Last-used numbers are kept in S.tools so each tool opens where you left it. ---------- */
Object.assign(ICON, {
  calc: sv(`<rect x="5" y="3" width="14" height="18" rx="3" ${st(2)}/><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01" ${st(2.4)}/>`),
  tag: sv(`<path d="M3.5 12.2V4.8c0-.7.6-1.3 1.3-1.3h7.4l8.3 8.3a1.3 1.3 0 0 1 0 1.8l-7.4 7.4a1.3 1.3 0 0 1-1.8 0z" ${st(2)}/><circle cx="8" cy="8" r="1.4" style="fill:currentColor"/>`),
  percent: sv(`<path d="M18.5 5.5l-13 13" ${st(2.2)}/><circle cx="7" cy="7" r="2.3" ${st(2)}/><circle cx="17" cy="17" r="2.3" ${st(2)}/>`),
  qr: sv(`<rect x="4" y="4" width="6" height="6" rx="1" ${st(2)}/><rect x="14" y="4" width="6" height="6" rx="1" ${st(2)}/><rect x="4" y="14" width="6" height="6" rx="1" ${st(2)}/><path d="M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 19h.01M19 14h.01" ${st(1.8)}/>`),
  card: sv(`<rect x="3" y="5" width="18" height="14" rx="2.5" ${st(2)}/><circle cx="9" cy="11" r="2.2" ${st(1.8)}/><path d="M5.8 16.2c.6-1.5 1.8-2.2 3.2-2.2s2.6.7 3.2 2.2M14.5 10h3.5M14.5 13.5h3.5" ${st(1.8)}/>`),
  trend: sv(`<path d="M3.5 17l5.5-5.5 4 4 7.5-7.5M15 8h5.5v5.5" ${st(2.2)}/>`),
  grid: sv(`<rect x="4" y="4" width="7" height="7" rx="2" ${st(2)}/><rect x="13" y="4" width="7" height="7" rx="2" ${st(2)}/><rect x="4" y="13" width="7" height="7" rx="2" ${st(2)}/><rect x="13" y="13" width="7" height="7" rx="2" ${st(2)}/>`),
  list: sv(`<path d="M9 6.5h11M9 12h11M9 17.5h11" ${st(2)}/><path d="M4.5 6.5l1 1 2-2M4.5 12l1 1 2-2M4.5 17.5l1 1 2-2" ${st(1.8)}/>`),
  handshake: sv(`<path d="M3 11l3.5-4 4 1.5L14 6.5l7 4.5M3 11l5 5.5c.8.8 2 .8 2.8 0M21 11l-4.5 5c-.8.9-2.1.9-2.9 0l-3.5-3.8M10.5 8.5l3.7 3.3" ${st(1.9)}/>`),
  repeat: sv(`<path d="M17 3.5l3 3-3 3M4 11.5v-1a4 4 0 0 1 4-4h12M7 20.5l-3-3 3-3M20 12.5v1a4 4 0 0 1-4 4H4" ${st(2)}/>`)
});

const TV = id => (S.tools && S.tools[id]) || {};
const setTV = (id, v) => { if (!S.tools || typeof S.tools !== "object") S.tools = {}; S.tools[id] = Object.assign({}, S.tools[id] || {}, v); save(); };
const n0 = v => { const x = parseFloat(v); return isFinite(x) ? x : 0; };
const pctTxt = v => (isFinite(v) ? Math.round(v * 10) / 10 : 0).toLocaleString("en-US") + "%";
const up50 = v => Math.ceil(r2(v) * 2 - 1e-9) / 2;
const planTotal = () => r2(Object.values(S.budget.cats || {}).reduce((a, x) => a + (+x || 0), 0));
const avgSale = () => { const a = iso(addDays(TODAY, -90)), ps = S.payments.filter(p => p.date >= a && p.amount > 0); return ps.length ? r2(sum(ps, p => p.amount) / ps.length) : 0; };
const avgSpend = () => { const a = iso(addMonths(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1, 12), -3)), b = iso(addDays(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1, 12), -1)); return r2(spentIn(a, b) / 3); };
const hrService = () => { const s = P.services.find(x => x[2] === "hr"); return s ? s[1] : 0; };
const meLine = () => [firstName(S.profile.owner), S.profile.biz].filter(Boolean).join(", ");
async function copyText(t, msg) { try { await navigator.clipboard.writeText(t); toast(msg || "Copied"); return true; } catch (e) { toast("Couldn't copy here. Select the text and copy it."); return false; } }

/* ---------- one sheet for every calculator: the answer sits on top and changes as you type ---------- */
function calcField(f, v) {
  const L = f.label;
  if (f.type === "money") return F.money(f.k, L, v, f.hint);
  if (f.type === "seg") return F.seg(f.k, L, v, f.opts);
  if (f.type === "select") return F.select(f.k, L, v, typeof f.opts === "function" ? f.opts() : f.opts, f.hint);
  if (f.type === "date") return F.date(f.k, L, v, f.hint);
  return F.num(f.k, L, v, f.ph || "0", f.hint);
}
function calcOut(r) {
  if (!r) return "";
  const big = r.big ? `<div class="cbig ${r.big[2] || ""}"><small>${esc(r.big[0])}</small><b class="num">${r.big[1]}</b>${r.big[3] ? `<span>${r.big[3]}</span>` : ""}</div>` : "";
  const rows = (r.rows || []).filter(Boolean).map(x => x === "-" ? `<i class="crule"></i>` : `<div class="crow ${x[2] || ""}"><span>${x[0]}</span><b class="num">${x[1]}</b></div>`).join("");
  return big + (rows ? `<div class="crows">${rows}</div>` : "") + (r.note ? `<p class="cnote">${r.note}</p>` : "");
}
function calcSheet(def) {
  const saved = TV(def.id), dv = f => typeof f.def === "function" ? f.def() : f.def;
  const fields = def.fields.map(f => calcField(f, saved[f.k] != null && saved[f.k] !== "" ? saved[f.k] : dv(f))).join("");
  const acts = (def.actions || []).map((a, i) => `<button type="button" class="btn ${i ? "ghost" : "primary"} press" data-tact="${i}">${esc(a.label)}</button>`).join("");
  const form = openSheet(def.title, `<div class="calcout" id="calcOut" aria-live="polite"></div>${fields}${acts ? `<div class="btnrow tacts">${acts}</div>` : ""}${def.foot ? `<p class="fnote">${def.foot}</p>` : ""}`,
    null, { noSave: true, cancelLabel: "Done", focus: false, lead: def.lead });
  const read = () => { const v = {}; def.fields.forEach(f => { const el = form.querySelector(`[data-key="${f.k}"]`); if (!el) return; if (el.classList.contains("seg")) { const on = el.querySelector(".on"); v[f.k] = on ? on.dataset.v : dv(f); } else v[f.k] = el.value; }); return v; };
  const nums = v => { const o = {}; def.fields.forEach(f => { o[f.k] = /^(seg|select|date)$/.test(f.type) ? v[f.k] : n0(v[f.k]); }); return o; };
  let res = null;
  const upd = () => { const raw = read(); setTV(def.id, raw); const v = nums(raw); if (def.show) def.fields.forEach(f => { const el = form.querySelector(`[data-key="${f.k}"]`), box = el && el.closest(".field"); if (box) box.hidden = !def.show(f.k, v); });
    res = def.calc(v); form.querySelector("#calcOut").innerHTML = calcOut(res); };
  form.addEventListener("input", upd); form.addEventListener("change", upd);
  form.addEventListener("click", e => { if (e.target.closest(".seg button")) setTimeout(upd, 0); const b = e.target.closest("[data-tact]"); if (b) def.actions[+b.dataset.tact].fn(nums(read()), res, form); });
  upd();
  return form;
}

/* ---------- pricing ---------- */
const T_PRICE = () => ({
  id: "price", title: tc("Price " + aOrAn(P.job)),
  fields: [
    { k: "hours", label: "Hours of work", def: 2 },
    { k: "rate", label: "Your hourly rate", type: "money", def: () => Math.round(n0(TV("rate").out) || hrService() || 75) },
    { k: "mat", label: "Materials and supplies", type: "money", def: 0 },
    { k: "markup", label: "Markup on materials (%)", def: 20, hint: "Covers your time to buy and haul them." },
    { k: "miles", label: "Round-trip miles", def: 0 },
    { k: "extra", label: "Other costs", type: "money", def: 0, hint: "Permits, rentals, dump fees, a helper." },
    { k: "profit", label: "Extra for profit (%)", def: 10 }
  ],
  calc: v => {
    const labor = v.hours * v.rate, mat = v.mat * (1 + v.markup / 100), trip = v.miles * mileRate(iso(TODAY)), sub = labor + mat + trip + v.extra, prof = sub * v.profit / 100, price = Math.ceil(sub + prof);
    const cost = v.mat + trip + v.extra, keep = price - cost;
    return { big: ["Charge about", money(price), "", price ? `You keep ${money(keep)}${v.hours ? `, about ${money(keep / v.hours)} an hour` : ""}, before taxes` : ""],
      rows: [["Your time", money2(labor)], v.mat ? ["Materials with markup", money2(mat)] : null, v.miles ? ["Travel at " + money2(mileRate(iso(TODAY))) + " a mile", money2(trip)] : null, v.extra ? ["Other costs", money2(v.extra)] : null, v.profit ? ["Profit", money2(prof)] : null, "-", ["What it costs you", money2(cost)]] };
  },
  actions: [{ label: "Make a Quote", fn: v => {
    const k = 1 + v.profit / 100, items = [];
    if (v.hours && v.rate) items.push({ desc: "Labor", qty: v.hours, rate: r2(v.rate * k) });
    if (v.mat) items.push({ desc: "Materials", qty: 1, rate: r2(v.mat * (1 + v.markup / 100) * k) });
    if (v.miles) items.push({ desc: "Trip charge", qty: 1, rate: r2(v.miles * mileRate(iso(TODAY)) * k) });
    if (v.extra) items.push({ desc: "Other costs", qty: 1, rate: r2(v.extra * k) });
    if (!items.length) { toast("Add hours or costs first"); return; }
    const want = TP_PRICE(v), got = items.reduce((t, i) => t + i.qty * i.rate, 0), last = items[items.length - 1], gap = r2(want - got);
    if (gap > 0) last.rate = r2(last.rate + gap / last.qty);
    if (sheetClose) sheetClose(); later(() => quoteForm(null, { items }));
  } }, { label: "Find My Hourly Rate", fn: () => { if (sheetClose) sheetClose(); later(() => calcSheet(T_RATE())); } }]
});
function TP_PRICE(v) { const sub = v.hours * v.rate + v.mat * (1 + v.markup / 100) + v.miles * mileRate(iso(TODAY)) + v.extra; return Math.ceil(sub + sub * v.profit / 100); }
const T_RATE = () => ({
  id: "rate", title: "Find Your Hourly Rate", lead: "What to charge so the business pays you what you want.",
  fields: [
    { k: "pay", label: "Take-home pay you want a year", type: "money", def: 50000 },
    { k: "costs", label: "Business costs a month", type: "money", def: () => planTotal() || avgSpend() || 500, hint: "Supplies, phone, insurance, gas, fees." },
    { k: "hours", label: "Hours you can bill a week", def: 25, hint: "Driving, quotes and paperwork don't count." },
    { k: "off", label: "Weeks off a year", def: 3 },
    { k: "tax", label: "Set aside for taxes (%)", def: () => +S.profile.setAside || 25 }
  ],
  calc: v => {
    const weeks = Math.max(1, 52 - v.off), hrs = weeks * v.hours, tax = Math.min(.6, v.tax / 100), need = v.pay / (1 - tax) + v.costs * 12, rate = hrs ? need / hrs : 0;
    setTV("rate", { out: Math.ceil(rate) });
    return { big: ["Charge at least", hrs ? money(Math.ceil(rate)) + "<small>/hr</small>" : "—", "", hrs ? `${num(Math.round(hrs))} billable hours a year` : "Add the hours you can bill."],
      rows: [["Bring in each year", money(need)], ["Each month", money(need / 12)], ["Each working week", money(need / weeks)], "-", ["For taxes", money(v.pay / (1 - tax) - v.pay)], ["For business costs", money(v.costs * 12)]],
      note: "Most new owners charge too little. If you're booked solid, raise your price." };
  },
  actions: [{ label: tc("Use in Price " + aOrAn(P.job)), fn: () => { setTV("price", { rate: String(n0(TV("rate").out)) }); if (sheetClose) sheetClose(); later(() => calcSheet(T_PRICE())); } }]
});
const T_PRODUCT = () => ({
  id: "product", title: "Price a Product", lead: "Cost per item, then a price that pays you.",
  fields: [
    { k: "batch", label: "Materials for one batch", type: "money", def: 40, hint: P.id === "food" ? "Flour, butter, sugar, everything in it." : "Wax, jars, fabric, everything in it." },
    { k: "makes", label: "Items in a batch", def: 12 },
    { k: "pack", label: "Packaging per item", type: "money", def: .5 },
    { k: "mins", label: "Your time per batch (minutes)", def: 90 },
    { k: "pay", label: "Your pay per hour", type: "money", def: 20 },
    { k: "fees", label: "Selling fees (%)", def: 3, hint: "Card reader, Etsy or market fees." },
    { k: "margin", label: "Profit you want (%)", def: 35 }
  ],
  calc: v => {
    const n = Math.max(1, v.makes), mat = v.batch / n + v.pack, time = v.mins / 60 * v.pay / n, cost = mat + time, keep = 1 - v.fees / 100 - v.margin / 100;
    if (keep <= .05) return { big: ["Sell for", "—", "bad"], note: "Fees and profit add up to too much. Lower one of them." };
    const price = up50(cost / keep), fee = price * v.fees / 100, prof = price - cost - fee;
    return { big: ["Sell for", money2(price), "", `${money2(prof)} profit on each one`],
      rows: [["Materials and packaging", money2(mat)], ["Your time", money2(time)], ["Cost per item", money2(cost), "strong"], ["Fees per item", money2(fee)], "-", ["A full batch brings in", money2(price * n)], ["Batch profit", money2(prof * n)]],
      note: "Selling to a store? They usually pay about half your shelf price, so check that still covers your cost." };
  }
});
const T_MARGIN = () => ({
  id: "margin", title: "Markup and Margin",
  fields: [
    { k: "mode", label: "I want to", type: "seg", def: "check", opts: [["check", "Check a Price"], ["goal", "Set a Price"]] },
    { k: "cost", label: "Your cost", type: "money", def: 40 },
    { k: "price", label: "Your price", type: "money", def: 65 },
    { k: "goal", label: "Margin you want (%)", def: 40 }
  ],
  show: (k, v) => k === "price" ? v.mode !== "goal" : k === "goal" ? v.mode === "goal" : true,
  calc: v => {
    if (v.mode === "goal") { const g = Math.min(95, v.goal) / 100, p = v.cost / (1 - g); return { big: ["Charge", money2(p), "", `${money2(p - v.cost)} profit on each sale`], rows: [["Markup on cost", pctTxt(v.cost ? (p - v.cost) / v.cost * 100 : 0)], ["Margin", pctTxt(g * 100)]], note: "Margin is the share of the price you keep. Markup is what you add on top of your cost." }; }
    const pr = v.price - v.cost;
    return { big: ["Margin", v.price ? pctTxt(pr / v.price * 100) : "—", pr < 0 ? "bad" : "", `${money2(pr)} profit on each sale`], rows: [["Markup on cost", v.cost ? pctTxt(pr / v.cost * 100) : "—"]], note: "Margin is the share of the price you keep. Markup is what you add on top of your cost." };
  }
});
const T_DISCOUNT = () => ({
  id: "discount", title: "Discount Check", lead: "See what a sale really costs you.",
  fields: [
    { k: "price", label: "Regular price", type: "money", def: 100 },
    { k: "cost", label: "Your cost per sale", type: "money", def: 40 },
    { k: "off", label: "Discount (%)", def: 20 }
  ],
  calc: v => {
    const sale = v.price * (1 - v.off / 100), before = v.price - v.cost, after = sale - v.cost;
    if (after <= 0) return { big: ["Sale price", money2(sale), "bad", "You'd lose money on every sale"], rows: [["Profit now", money2(before)], ["Profit on sale", money2(after), "bad"]] };
    const more = before > 0 ? (before / after - 1) * 100 : 0;
    return { big: ["Sale price", money2(sale), "", more > 0 ? `You need ${pctTxt(Math.round(more))} more sales to make the same money` : ""],
      rows: [["Profit now", money2(before)], ["Profit on sale", money2(after)], ["You give up per sale", money2(before - after)]] };
  }
});
const T_BREAK = () => ({
  id: "break", title: "Break-Even", lead: "How many sales cover your costs each month.",
  fields: [
    { k: "fixed", label: "Monthly costs", type: "money", def: () => planTotal() || avgSpend() || 1000, hint: "Rent, phone, insurance, software, your truck." },
    { k: "avg", label: "Average sale", type: "money", def: () => Math.round(avgSale()) || 100 },
    { k: "varc", label: "Cost per sale", type: "money", def: 0, hint: "Materials or ingredients that go into each one." }
  ],
  calc: v => {
    const per = v.avg - v.varc;
    if (per <= 0) return { big: ["Sales a month", "—", "bad", "Each sale costs more than it brings in."] };
    const n = Math.ceil(v.fixed / per), pm = period("month"), made = S.payments.filter(p => inRange(p.date, pm.a, pm.b)).length;
    return { big: ["Sales a month to break even", num(n), "", `About ${num(Math.ceil(n / 4.33))} a week`],
      rows: [["Money in needed", money(n * v.avg)], ["Paid sales in " + MONTHS[TODAY.getMonth()] + " so far", num(made), made >= n ? "good" : ""]], note: "Every sale past this line is profit." };
  }
});

/* ---------- money ---------- */
function forecast() {
  const end = T(30), owed = owedList(), late = owed.filter(x => x.due && x.due < iso(TODAY)), soon = owed.filter(x => !x.due || (x.due >= iso(TODAY) && x.due <= end));
  const bills = S.bills.filter(b => b.next && b.next <= end && !b.off).map(b => ({ name: b.name, amount: +b.amount || 0, date: b.next }));
  const t = taxNow(), tax = t.next && !t.next.paid && t.next.due <= end ? r2(t.next.set) : 0;
  const other = Math.max(0, r2(avgSpend() - sum(S.bills, b => billMonthly(b))));
  return { soon, late, bills, tax, taxDue: t.next && t.next.due, other, inSoon: sum(soon, x => totals(x).due), inLate: sum(late, x => totals(x).due), outBills: sum(bills, b => b.amount) };
}
const T_FORECAST = () => ({
  id: "forecast", title: "Next 30 Days", lead: "Money coming in and going out, from what's in the app.",
  fields: [{ k: "cash", label: "Cash in the bank now", type: "money", def: "" }],
  calc: v => {
    const f = forecast(), out = r2(f.outBills + f.tax + f.other), end = r2(v.cash + f.inSoon - out);
    return { big: ["In 30 days you may have", money(end), end < 0 ? "bad" : "", end < 0 ? "Money could run short. Chase late invoices first." : f.inLate ? `Plus ${money(f.inLate)} if late invoices get paid` : ""],
      rows: [["Cash now", money(v.cash)], ["Invoices due", "+" + money(f.inSoon), "good"], ...f.bills.slice(0, 6).map(b => [esc(b.name) + " · " + shortD(b.date), "−" + money(b.amount)]), f.bills.length > 6 ? ["Other bills", "−" + money(sum(f.bills.slice(6), b => b.amount))] : null,
        f.tax ? ["Quarterly taxes · " + shortD(f.taxDue), "−" + money(f.tax)] : null, f.other ? ["Usual spending", "−" + money(f.other)] : null],
      note: "Usual spending is your 3-month average, not counting bills." };
  }
});
const T_PAY = () => ({
  id: "payself", title: "Pay Yourself", lead: "A safe amount to move to your own account.",
  fields: [
    { k: "profit", label: "Profit last month", type: "money", def: () => { const lm = period("month", addMonths(TODAY, -1)); return Math.max(0, Math.round(profitOf(lm.a, lm.b).net)); } },
    { k: "tax", label: "Set aside for taxes (%)", def: () => +S.profile.setAside || 25 },
    { k: "keep", label: "Keep in the business (%)", def: 10, hint: "A cushion for slow months and new tools." }
  ],
  calc: v => {
    const tax = v.profit * v.tax / 100, keep = v.profit * v.keep / 100, pay = Math.max(0, v.profit - tax - keep);
    return { big: ["Pay yourself", money(pay), "", "Move taxes to their own savings account too"], rows: [["Profit", money(v.profit)], ["For taxes", "−" + money(tax)], ["Cushion", "−" + money(keep)]] };
  }
});
const T_SALESTAX = () => ({
  id: "salestax", title: "Sales Tax",
  fields: [
    { k: "mode", label: "The price", type: "seg", def: "add", opts: [["add", "Add Tax"], ["in", "Tax Included"]] },
    { k: "amount", label: "Amount", type: "money", def: 100 },
    { k: "rate", label: "Tax rate (%)", def: () => +S.profile.salesTax || 7 }
  ],
  calc: v => {
    const r = v.rate / 100;
    if (v.mode === "in") { const pre = v.amount / (1 + r); return { big: ["Tax in that price", money2(v.amount - pre)], rows: [["Price before tax", money2(pre)], ["Total", money2(v.amount)]] }; }
    return { big: ["Customer pays", money2(v.amount * (1 + r))], rows: [["Price", money2(v.amount)], ["Sales tax", money2(v.amount * r)]], note: "Rates and what's taxed change by state and city. Check your state's tax site." };
  }
});
const T_DEPOSIT = () => ({
  id: "deposit", title: "Deposit and Payments", lead: "Split a big " + P.job + " into a deposit and payments.",
  fields: [
    { k: "total", label: "Total price", type: "money", def: 1500 },
    { k: "dep", label: "Deposit (%)", def: 30 },
    { k: "count", label: "Payments after the deposit", def: 2 },
    { k: "every", label: "Paid", type: "seg", def: "month", opts: [["week", "Weekly"], ["2week", "Every 2 Wks"], ["month", "Monthly"]] },
    { k: "start", label: "First payment", type: "date", def: () => T(14) }
  ],
  calc: v => { const p = depPlan(v); return { big: ["Deposit today", money2(p.dep), "", p.n ? `Then ${pl(p.n, "payment")} of ${money2(p.each)}` : "Paid in full up front"], rows: p.dates.map((d, i) => ["Payment " + (i + 1) + " · " + shortD(d), money2(i === p.n - 1 ? p.last : p.each)]) }; },
  actions: [{ label: "Copy the Plan", fn: v => { const p = depPlan(v); copyText([`Payment plan for ${money2(v.total)}:`, `Deposit to book: ${money2(p.dep)}`, ...p.dates.map((d, i) => `${longD(d)}: ${money2(i === p.n - 1 ? p.last : p.each)}`)].join("\n"), "Plan copied. Paste it in a text or a quote note."); } }]
});
function depPlan(v) {
  const dep = r2(v.total * Math.min(100, v.dep) / 100), n = Math.max(0, Math.min(24, Math.round(v.count))), rest = r2(v.total - dep), each = n ? Math.floor(rest / n * 100) / 100 : 0, last = n ? r2(rest - each * (n - 1)) : 0;
  const s = ISO_RX.test(v.start || "") ? D(v.start) : addDays(TODAY, 14), dates = Array.from({ length: n }, (_, i) => iso(v.every === "week" ? addDays(s, 7 * i) : v.every === "2week" ? addDays(s, 14 * i) : addMonths(s, i)));
  if (v.every === "month") dates.forEach((d, i) => { const x = addMonths(new Date(s.getFullYear(), s.getMonth(), 1, 12), i), last2 = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate(); dates[i] = iso(new Date(x.getFullYear(), x.getMonth(), Math.min(s.getDate(), last2), 12)); });
  return { dep, n, each, last, dates };
}
const T_LOAN = () => ({
  id: "loan", title: "Loan Payment", lead: "For a truck, a chair, an oven or other gear.",
  fields: [
    { k: "amount", label: "Amount borrowed", type: "money", def: 8000 },
    { k: "apr", label: "Interest rate (%)", def: 9 },
    { k: "months", label: "Months to pay", def: 36 },
    { k: "gain", label: "Extra profit it brings a month", type: "money", def: 0, hint: "Optional. Skip if it won't bring in more work." }
  ],
  calc: v => {
    const n = Math.max(1, Math.round(v.months)), r = v.apr / 1200, pay = r ? v.amount * r / (1 - Math.pow(1 + r, -n)) : v.amount / n, tot = pay * n;
    return { big: ["Monthly payment", money2(pay), "", v.gain ? (v.gain >= pay ? `It pays for itself, with ${money(v.gain - pay)} a month left over` : `It costs ${money(pay - v.gain)} a month more than it brings in`) : ""],
      rows: [["Total you'll pay", money(tot)], ["Interest", money(tot - v.amount)]] };
  }
});

/* ---------- checklists: deductions and staying legal ---------- */
const DEDUCT = () => [
  ["miles", "Car and mileage", `${num(milesIn(period("year").a, iso(TODAY)))} miles logged this year, about ${money(mileDed(period("year").a, iso(TODAY)))} off.`],
  ["home", "Home office", "A space used only for work. The simple way is $5 a square foot, up to 300 square feet."],
  ["phone", "Phone and internet", "The share you use for work."],
  ["supplies", "Supplies and materials", "What you use up doing the work."],
  ["tools", "Tools and equipment", "Bigger items may be spread over years. Ask your tax pro."],
  ["software", "Software and apps", "Booking, design, bookkeeping and this kind of app."],
  ["ads", "Advertising", "Cards, flyers, ads, your website."],
  ["insure", "Business insurance", "Liability, tools, a business car policy."],
  ["fees", "Card and app fees", "Square, PayPal, Venmo business and bank fees."],
  ["permits", "Licenses and permits", "City license, trade license, permits."],
  ["training", "Classes and training", "For skills you use in the work you do now."],
  ["health", "Health insurance", "If you're self-employed and pay your own."],
  ["retire", "Retirement savings", "A SEP IRA or solo 401(k) can lower your tax."],
  ["help", "Paid help", "Helpers and contractors you pay."],
  ["meals", "Business meals", "Usually half counts. Keep the receipt and who it was with."]
];
const LEGAL = () => [
  ["license", "Business license", "Most cities or counties want one. Call your city hall."],
  ["trade", { trades: "Trade license", beauty: "Cosmetology or barber license", food: "Food permit or cottage food rules", cleaning: "Local permits", creative: "Local permits", retail: "Seller's permit" }[P.id] || "Local permits", { trades: "Plumbing, electrical and HVAC work usually needs one.", beauty: "Your state board sets the rules for you and your shop.", food: "Selling food from home or a truck has its own rules in each state.", retail: "Needed in most states to collect sales tax." }[P.id] || "Some cities need one for your kind of work."],
  ["ein", "EIN from the IRS", "Free, takes minutes online. Keeps your Social Security number off forms."],
  ["bank", "Separate bank account", "Keeps business money apart. Makes taxes far easier."],
  ["insure", "Business insurance", "Liability coverage protects you if something goes wrong on " + aOrAn(P.job) + "."],
  ["salestax", "Sales tax permit", "If you sell taxable goods or services in your state."],
  ["quarterly", "Quarterly tax payments", "If you'll owe $1,000 or more, the IRS expects payments 4 times a year."],
  ["receipts", "Keep receipts", "Keep records at least 3 years. Photos in this app count."],
  ["writing", "Get big " + P.jobs + " in writing", "A quote with the price, the work and the dates."],
  ["w9", "W-9 from helpers", "Get one from anyone you pay as a contractor."]
];
function checkSheet(id, title, lead, items, foot) {
  const on = TV(id), html = `<div class="calcout" id="calcOut"></div><div class="checks">${items.map(([k, t, s]) => `<label><input type="checkbox" data-ck="${k}" ${on[k] ? "checked" : ""}><span>${esc(t)}<small>${esc(s)}</small></span></label>`).join("")}</div>${foot ? `<p class="fnote">${foot}</p>` : ""}`;
  const form = openSheet(title, html, null, { noSave: true, cancelLabel: "Done", focus: false, lead });
  const upd = () => { const v = {}; form.querySelectorAll("[data-ck]").forEach(c => { v[c.dataset.ck] = c.checked; }); S.tools = S.tools || {}; S.tools[id] = v; save(); const n = Object.values(v).filter(Boolean).length;
    form.querySelector("#calcOut").innerHTML = calcOut({ big: [id === "deduct" ? "You're tracking" : "Done", `${n}<small> of ${items.length}</small>`, n === items.length ? "good" : ""] }); };
  form.addEventListener("change", upd); upd();
}
const deductSheet = () => checkSheet("deduct", "Deduction Checklist", "Common write-offs for small businesses. Tick the ones you track.", DEDUCT(), "General info to help you ask the right questions. Not tax advice. Your tax pro has the final word.");
const legalSheet = () => checkSheet("legal", "Stay-Legal Checklist", "The basics most small businesses need.", LEGAL(), "Rules change by state and city. Check with your city or a local pro.");

/* ---------- messages: ready-made texts with the names filled in ---------- */
const TPL = {
  thanks: ["Thank You", ICON.gift, "pink", (o) => `Hi ${o.first}, thank you for choosing ${o.biz}! It was a pleasure ${o.jobDone}. If anything comes up, just reach out.${o.me}`],
  review: ["Ask for a Review", ICON.star, "warn", (o) => `Hi ${o.first}, thanks again for your business! If you were happy with ${o.biz}, would you mind leaving a quick review? It really helps a small business like mine.${o.link ? "\n" + o.link : ""}${o.me}`, c => { c.reviewAsked = iso(TODAY); }],
  quote: ["Quote Follow-Up", ICON.quote, "violet", (o) => `Hi ${o.first}, just checking in on the quote I sent${o.quoteAmt ? " for " + o.quoteAmt : ""}. Happy to answer any questions or adjust it. Would you like to get on the schedule?${o.me}`],
  confirm: ["Appointment Reminder", ICON.cal, "info", (o) => `Hi ${o.first}, a quick reminder about your ${P.job}${o.when ? " " + o.when : ""}. Reply to confirm, or let me know if you need to move it.${o.me}`],
  late: ["Running Late", ICON.clock, "warn", (o) => `Hi ${o.first}, I'm running about 15 minutes behind. So sorry for the wait. I'll be there as soon as I can.${o.me}`],
  deposit: ["Deposit Request", ICON.cash, "ok", (o) => `Hi ${o.first}, to hold your spot, a deposit${o.depAmt ? " of " + o.depAmt : ""} is due before we start.${o.pay} Once it's in, you're all set.${o.me}`],
  checkin: ["Check In", ICON.repeat, "brand", (o) => `Hi ${o.first}, it's been a while! Just checking in to see if you need anything. I have a few openings coming up if you'd like one.${o.me}`, c => { c.checkedIn = iso(TODAY); }],
  referral: ["Ask for a Referral", ICON.handshake, "ok", (o) => `Hi ${o.first}, thank you for being a great ${P.client}. Most of my work comes from people like you. If you know anyone who could use ${o.biz}, I'd be grateful if you passed my name along.${o.me}`],
  raise: ["New Prices Notice", ICON.trend, "violet", (o) => `Hi ${o.first}, a quick heads-up: starting ${longD(T(30))}, my prices are going up a little to keep up with costs. Anything booked before then stays at today's price. Thank you for your support!${o.me}`],
  closed: ["Closed for a Holiday", ICON.cal, "pink", (o) => `Hi ${o.first}, just so you know, ${o.biz} will be closed from ___ to ___. If you need anything before then, let me know soon so I can fit you in.${o.me}`],
  decline: ["Turn Down a Job", ICON.xmark, "danger", (o) => `Hi ${o.first}, thank you so much for thinking of me. I'm not able to take this one on, but I hope you find the right person for it.${o.me}`],
  welcome: ["Welcome Message", ICON.person, "info", (o) => `Hi ${o.first}, welcome, and thanks for choosing ${o.biz}! Save this number so you can reach me anytime. Looking forward to working with you.${o.me}`]
};
function tplFill(c, extra) {
  const pf = S.profile, me = meLine();
  return Object.assign({ first: firstName(c && c.name) || "there", biz: pf.biz || "my business", me: me ? "\n" + me : "", link: pf.reviewUrl || "", pay: pf.payNote ? ` You can pay by ${pf.payNote.replace(/\.$/, "")}.` : "",
    jobDone: "working with you", quoteAmt: "", when: "", depAmt: "" }, extra || {});
}
function msgList() {
  openSheet("Message Templates", `<div class="list">${Object.entries(TPL).map(([k, t]) => `<button type="button" class="li" data-tpl="${k}">${ic(t[2], t[1])}<span class="tx"><b>${esc(t[0])}</b></span>${ICON.chev}</button>`).join("")}</div>`,
    null, { noSave: true, cancelLabel: "Done", focus: false, lead: "Pick one. Names fill in, and you can change any word." });
  $("#sheetForm").addEventListener("click", e => { const b = e.target.closest("[data-tpl]"); if (!b) return; if (sheetClose) sheetClose(); later(() => msgSheet(b.dataset.tpl)); });
}
function msgSheet(k, o) {
  o = o || {}; const t = own(TPL, k) ? TPL[k] : TPL.thanks; let c = o.clientId ? clientOf(o.clientId) : null;
  const opts = `<option value="">Anyone</option>` + activeClients().map(x => `<option value="${esc(x.id)}" ${c && c.id === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("");
  const form = openSheet(t[0], `<div class="field"><label for="tplTo">To</label><select id="tplTo">${opts}</select></div>
    <div class="field"><label for="tplText">Message</label><textarea id="tplText" rows="7"></textarea><span class="hint">Nothing is sent until you send it.</span></div>
    ${k === "review" && !S.profile.reviewUrl ? `<button type="button" class="li addrow tlink" data-act="tool" data-id="review"><span class="ic">${ICON.plus}</span><span class="tx">Add Your Review Link</span></button>` : ""}
    <div class="remacts"><a class="btn primary press" id="tSms" href="#">${ICON.msg}Text</a><a class="btn ghost press" id="tMail" href="#">${ICON.mail}Email</a><button type="button" class="btn ghost press" id="tCopy">${ICON.copy}Copy</button></div>`, null, { noSave: true, cancelLabel: "Done", focus: false });
  const to = form.querySelector("#tplTo"), ta = form.querySelector("#tplText"), smsA = form.querySelector("#tSms"), mailA = form.querySelector("#tMail");
  const fill = () => { c = to.value ? clientOf(to.value) : null; ta.value = t[3](tplFill(c, o.extra)); sync(); };
  const sync = () => { const tel = String(c && c.phone || "").replace(/[^\d+]/g, ""), b = encodeURIComponent(ta.value);
    smsA.href = "sms:" + tel + (isIOS ? "&" : "?") + "body=" + b; mailA.href = "mailto:" + encodeURIComponent(c && c.email || "") + "?subject=" + encodeURIComponent(t[0] === "Thank You" ? "Thank you" : (S.profile.biz || t[0])) + "&body=" + b; mailA.hidden = !!c && !c.email; };
  const mark = () => { if (c && t[4]) { t[4](c); save(); } if (o.onSent) o.onSent(); };
  to.addEventListener("change", fill); ta.addEventListener("input", sync); fill();
  smsA.addEventListener("click", mark); mailA.addEventListener("click", mark);
  form.querySelector("#tCopy").onclick = async () => { if (await copyText(ta.value, "Copied. Paste it in a text or email.")) mark(); };
}

/* ---------- review link, QR codes and a contact card ---------- */
let qrP = null;
function loadQR() {
  return qrP || (qrP = loadLib("lib/qrcode.js", null, null, () => window.qrcode).catch(e => { qrP = null; throw e; }));
}
/* draws the code on a canvas, big enough to print */
async function qrCanvas(text, px) {
  const q = await loadQR(), qr = q(0, "M"); qr.addData(unescape(encodeURIComponent(text))); qr.make();
  const n = qr.getModuleCount(), quiet = 4, cell = Math.max(2, Math.floor((px || 640) / (n + quiet * 2))), size = (n + quiet * 2) * cell, cv = document.createElement("canvas");
  cv.width = cv.height = size; const g = cv.getContext && cv.getContext("2d"); if (!g) throw new Error("no canvas");
  g.fillStyle = "#fff"; g.fillRect(0, 0, size, size); g.fillStyle = "#111";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) g.fillRect((c + quiet) * cell, (r + quiet) * cell, cell, cell);
  return cv;
}
async function showQR(box, text) {
  box.innerHTML = `<div class="qrwait">Making the code…</div>`;
  try { const cv = await qrCanvas(text, 640); box.innerHTML = ""; const img = new Image(); img.src = cv.toDataURL("image/png"); img.alt = "QR code"; box.appendChild(img); return cv; }
  catch (e) { box.innerHTML = `<div class="qrwait">Couldn't make the code. Check your connection.</div>`; return null; }
}
const canvasBytes = cv => { const b = atob(cv.toDataURL("image/png").split(",")[1]), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a.buffer; };
const okUrl = u => /^https:\/\/[^\s/$.?#][^\s]*$/i.test(String(u || "").trim());
function reviewSheet() {
  const pf = S.profile;
  const form = openSheet("Reviews", `<div class="field"><label for="f_rev">Review link</label><input id="f_rev" type="url" inputmode="url" autocapitalize="off" placeholder="https://g.page/r/…" value="${esc(pf.reviewUrl || "")}"><span class="hint">In your Google Business Profile, tap Ask for Reviews and copy the link.</span></div>
    <div class="qrbox" id="qrBox" hidden></div>
    <div class="btnrow tacts"><button type="button" class="btn primary press" id="revAsk">Ask a ${esc(Wd(P.client, 1))}</button><button type="button" class="btn ghost press" id="revSave">Save QR Code</button></div>
    <p class="fnote">Print the code on cards, receipts or a sign by your register.</p>`, null, { noSave: true, cancelLabel: "Done", focus: false, lead: "Happy " + P.clients + " bring the next ones. Make it easy for them." });
  const inp = form.querySelector("#f_rev"), box = form.querySelector("#qrBox"); let cv = null, tm = null;
  const upd = () => { const u = inp.value.trim(); pf.reviewUrl = okUrl(u) ? u : ""; save(); box.hidden = !pf.reviewUrl; clearTimeout(tm); if (pf.reviewUrl) tm = setTimeout(async () => { cv = await showQR(box, pf.reviewUrl); }, 250); };
  inp.addEventListener("input", upd); upd();
  form.querySelector("#revAsk").onclick = () => { if (sheetClose) sheetClose(); later(() => msgSheet("review")); };
  form.querySelector("#revSave").onclick = async () => { if (!pf.reviewUrl) { toast("Add your review link first"); inp.focus(); return; } cv = cv || await qrCanvas(pf.reviewUrl, 900).catch(() => null); if (!cv) { toast("Couldn't make the code. Check your connection."); return; } if (await saveFile((fileSlug(pf.biz) || "my") + "-review-qr.png", canvasBytes(cv), "image/png", "Review QR code")) toast("QR code saved"); };
}
function vcard() {
  const pf = S.profile, e = s => String(s || "").replace(/\\/g, "\\\\").replace(/[,;]/g, m => "\\" + m).replace(/\r?\n/g, " "), nm = String(pf.owner || "").trim().split(/\s+/);
  return ["BEGIN:VCARD", "VERSION:3.0", `N:${e(nm.slice(1).join(" "))};${e(nm[0] || "")};;;`, `FN:${e(pf.owner || pf.biz)}`, pf.biz ? `ORG:${e(pf.biz)}` : "", pf.phone ? `TEL;TYPE=WORK,VOICE:${e(pf.phone)}` : "", pf.email ? `EMAIL;TYPE=WORK:${e(pf.email)}` : "",
    pf.street || pf.city ? `ADR;TYPE=WORK:;${e(pf.apt)};${e(pf.street)};${e(pf.city)};${e(pf.state)};${e(pf.zip)};` : "", pf.web ? `URL:${e(pf.web)}` : "", `NOTE:${e(P.name)}`, "END:VCARD"].filter(Boolean).join("\r\n");
}
function cardSheet() {
  const pf = S.profile, hasAny = pf.biz || pf.owner;
  const form = openSheet("Digital Business Card", `<div class="bizcard"><span class="bm-ic">${packIcon(P.id)}</span><b>${esc(pf.biz || "Your Business")}</b><span>${esc(pf.owner || "")}</span><small>${esc([pf.phone, pf.email].filter(Boolean).join(" · ") || "Add your phone and email")}</small></div>
    <div class="field"><label for="f_web">Website</label><input id="f_web" type="url" inputmode="url" autocapitalize="off" placeholder="Optional" value="${esc(pf.web || "")}"></div>
    <div class="qrbox" id="qrBox"></div>
    <div class="btnrow tacts"><button type="button" class="btn primary press" id="vcSave">Share Contact Card</button><button type="button" class="btn ghost press" id="vcEdit">Edit Business Info</button></div>
    <p class="fnote">${esc(Wd(P.clients, 1))} scan the code with their camera to save you in their contacts.</p>`, null, { noSave: true, cancelLabel: "Done", focus: false });
  const box = form.querySelector("#qrBox"), web = form.querySelector("#f_web"); let tm = null;
  const upd = () => { pf.web = okUrl(web.value) ? web.value.trim() : ""; save(); clearTimeout(tm); if (hasAny) tm = setTimeout(() => showQR(box, vcard()), 250); else box.innerHTML = ""; };
  web.addEventListener("input", upd); upd();
  form.querySelector("#vcSave").onclick = async () => { if (!hasAny) { toast("Add your business name first"); return; } if (await saveFile((fileSlug(pf.biz || pf.owner) || "contact") + ".vcf", vcard(), "text/vcard", pf.biz || "Contact")) toast("Contact card ready"); };
  form.querySelector("#vcEdit").onclick = () => { if (sheetClose) sheetClose(); later(profileForm); };
}

/* ---------- repeat customers: who hasn't been back in a while ---------- */
const CHECK_DAYS = { trades: 180, beauty: 42, creative: 120, food: 60, retail: 90, cleaning: 30 };
const checkDays = () => Math.max(7, Math.round(n0(TV("repeat").days)) || CHECK_DAYS[P.id] || 90);
function dueCheckins() {
  const d = checkDays(), up = new Set(upcomingJobs().map(j => j.clientId));
  return activeClients().map(c => ({ c, last: lastSeen(c) })).filter(x => x.last && !up.has(x.c.id) && -inDays(x.last) >= d && -inDays(x.last) <= d * 4 && !(x.c.checkedIn && x.c.checkedIn >= x.last && -inDays(x.c.checkedIn) < d))
    .sort((a, b) => a.last.localeCompare(b.last));
}
function repeatSheet() {
  const form = openSheet("Repeat " + Wd(P.clients, 1), F.num("days", "Check in after (days)", checkDays()) + `<div id="repList"></div>`, null, { noSave: true, cancelLabel: "Done", focus: false, lead: "It's easier to bring back a past " + P.client + " than find a new one." });
  const list = () => { const due = dueCheckins(); form.querySelector("#repList").innerHTML = `<div class="flabel itemshd">${due.length ? "Due for a check-in" : ""}</div><div class="list">${due.length ? due.slice(0, 12).map(x => `<button type="button" class="li" data-tpl="${esc(x.c.id)}"><span class="ic av h${clientHue(x.c)}">${ICON.person}</span><span class="tx"><b>${esc(x.c.name)}</b><small>Last seen ${shortD(x.last)}</small></span><span class="amt">Check In</span></button>`).join("") : empty("", "Nobody is due right now.")}</div>`; };
  form.querySelector("#f_days").addEventListener("input", e => { setTV("repeat", { days: e.target.value }); list(); render(); });
  form.addEventListener("click", e => { const b = e.target.closest("[data-tpl]"); if (!b) return; if (sheetClose) sheetClose(); later(() => msgSheet("checkin", { clientId: b.dataset.tpl })); });
  list();
}

/* ---------- a quick receipt for cash and walk-in sales ---------- */
function receiptSheet() {
  const pf = S.profile, v0 = TV("receipt");
  const form = openSheet("Quick Receipt", `<div class="field"><label for="f_rcTo">${esc(Wd(P.client, 1))}</label><select id="f_rcTo" data-key="to"><option value="">Walk-in</option>${activeClients().map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("")}</select></div>` +
    F.text("what", "For", "", P.services[0][0]) + F.money("amount", "Amount", "") + F.select("method", "Paid by", v0.method || "Cash", METHODS) + F.date("date", "Date", iso(TODAY)) +
    F.check("log", "Also log this payment", v0.log !== false, "So it counts in your profit and taxes."), v => {
    const amt = numOr(v.amount, NaN); if (!(amt > 0)) return "Add the amount.";
    setTV("receipt", { method: v.method, log: v.log });
    const no = +pf.nextRcpt || 1; pf.nextRcpt = no + 1;
    if (v.log) S.payments.push({ id: uid(), amount: r2(amt), date: v.date || iso(TODAY), method: v.method, note: ("Receipt R-" + no + (v.what ? ": " + v.what : "")).slice(0, 200), invId: "", clientId: v.to || "" });
    commit(v.log ? "Payment logged" : "");
    makeReceiptPDF({ no, to: clientOf(v.to), what: v.what, amount: r2(amt), method: (METHODS.find(m => m[0] === v.method) || [0, v.method])[1], date: v.date || iso(TODAY) });
    return "nocommit";
  }, { saveLabel: "Make Receipt" });
  return form;
}
async function makeReceiptPDF(r) {
  let JsPDF; try { JsPDF = await loadPDF(); } catch (e) { toast("Couldn't load the PDF maker. Check your connection."); return; }
  const doc = new JsPDF({ unit: "pt", format: [288, 432] }), pf = S.profile, acc = accentRgb(), M = 24, W = 288 - M * 2;
  doc.setFillColor(...acc); doc.rect(0, 0, 288, 8, "F");
  let y = 44; doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(28, 34, 48); doc.splitTextToSize(pdfText(pf.biz || pf.owner || "Receipt"), W).forEach(l => { doc.text(l, M, y); y += 18; });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(107, 117, 135); [...addrLines(pf), pf.phone, pf.email].filter(Boolean).forEach(l => { doc.text(pdfText(l), M, y); y += 11; });
  y += 14; doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...acc); doc.text("RECEIPT", M, y); doc.setTextColor(107, 117, 135); doc.setFont("helvetica", "normal"); doc.text("R-" + r.no, M + W, y, { align: "right" });
  y += 8; doc.setDrawColor(228, 231, 238); doc.line(M, y, M + W, y); y += 18;
  const row = (a, b) => { doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(107, 117, 135); doc.text(a, M, y); doc.setTextColor(28, 34, 48); doc.text(doc.splitTextToSize(pdfText(b), W - 70)[0] || "", M + W, y, { align: "right" }); y += 16; };
  row("Date", longD(r.date)); if (r.to) row("For", r.to.name); if (r.what) row("Item", r.what); row("Paid by", r.method || "");
  y += 6; doc.setFillColor(...acc.map(v => Math.round(v * .1 + 255 * .9))); doc.roundedRect(M, y, W, 40, 6, 6, "F");
  doc.setFontSize(9); doc.setTextColor(107, 117, 135); doc.text("Amount paid", M + 12, y + 16); doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(...acc); doc.text(pdfText(m2(r.amount)), M + W - 12, y + 27, { align: "right" });
  y += 64; const th = pf.thanks || P.thanks; if (th) { doc.setFont("helvetica", "italic"); doc.setFontSize(9.5); doc.setTextColor(...acc); doc.splitTextToSize(pdfText(th), W).forEach(l => { doc.text(l, M, y); y += 13; }); }
  if (await saveFile((fileSlug(pf.biz) ? fileSlug(pf.biz) + "-" : "") + "receipt-" + r.no + ".pdf", doc.output("arraybuffer"), "application/pdf", "Receipt R-" + r.no)) toast("Receipt ready");
}

/* ---------- the Tools page ---------- */
function toolGroups() {
  const f = forecast(), fc = r2(f.inSoon - f.outBills - f.tax - f.other), rate = n0(TV("rate").out), ded = Object.values(TV("deduct")).filter(Boolean).length, leg = Object.values(TV("legal")).filter(Boolean).length, rep = dueCheckins().length;
  const maker = P.id === "food" || P.id === "retail";
  const pricing = [
    ["price", tc("Price " + aOrAn(P.job)), "Time, materials, travel and profit", "brand", ICON.calc],
    ["rate", "Find Your Hourly Rate", rate ? "Yours: " + money(rate) + " an hour" : "What to charge to earn what you want", "ok", ICON.clock],
    ["product", "Price a Product", "Cost per item and a price that pays", "warn", ICON.tag],
    ["margin", "Markup and Margin", "What you really keep on a sale", "violet", ICON.percent],
    ["discount", "Discount Check", "What a sale costs you", "pink", ICON.tag],
    ["break", "Break-Even", "Sales you need to cover costs", "info", ICON.trend]];
  if (maker) pricing.unshift(pricing.splice(2, 1)[0]);
  return [
    ["Pricing", pricing],
    ["Money", [
      ["forecast", "Next 30 Days", (fc >= 0 ? "About " + money(fc) + " more in than out" : "About " + money(-fc) + " more out than in"), "ok", ICON.cash],
      ["payself", "Pay Yourself", "A safe amount from last month's profit", "brand", ICON.person],
      ["deposit", "Deposit and Payments", "Split a big " + P.job + " into payments", "info", ICON.cal],
      ["salestax", "Sales Tax", "Add it, or find it in a price", "violet", ICON.percent],
      ["loan", "Loan Payment", "Is new gear worth it?", "warn", ICON.bank]]],
    ["Customers", [
      ["messages", "Message Templates", Object.keys(TPL).length + " ready-to-send texts", "info", ICON.msg],
      ["repeat", "Repeat " + Wd(P.clients, 1), rep ? pl(rep, "person", "people") + " due for a check-in" : "Bring past " + P.clients + " back", "brand", ICON.repeat],
      ["review", "Reviews and QR Code", S.profile.reviewUrl ? "Your review link is saved" : "Get more 5-star reviews", "warn", ICON.star],
      ["card", "Digital Business Card", "A contact card and QR code", "ok", ICON.card]]],
    ["Taxes", [
      ["tax", "Tax Set-Aside", "About " + money(taxNow().yr.set) + " so far this year", "brand", ICON.pie],
      ["deduct", "Deduction Checklist", ded + " of " + DEDUCT().length + " tracked", "ok", ICON.list],
      ["miles", "Mileage Log", num(milesIn(period("year").a, iso(TODAY))) + " miles this year", "info", ICON.car],
      ["packet", "Year-End Packet", "One PDF for your tax pro", "violet", ICON.pdf]]],
    ["Paperwork", [
      ["receipt", "Quick Receipt", "For cash and walk-in sales", "pink", ICON.receipt],
      ["legal", "Stay-Legal Checklist", leg + " of " + LEGAL().length + " done", "danger", ICON.shield],
      ["ics", "Calendar Alerts", "Put " + P.jobs + " and due dates on your phone", "info", ICON.bell]]]
  ];
}
function renderTools() {
  setSub("tools", "Calculators, messages and more");
  $("#toolsBody").innerHTML = toolGroups().map(([hd, rows]) => `<div class="group"><div class="group-h"><h2>${esc(hd)}</h2></div><div class="list">${rows.map(([id, t, s, c, svg]) =>
    `<button type="button" class="li" data-act="tool" data-id="${esc(id)}">${ic(c, svg)}<span class="tx"><b>${esc(t)}</b><small>${esc(s)}</small></span>${ICON.chev}</button>`).join("")}</div></div>`).join("") +
    `<p class="note" style="text-align:center;padding:22px 16px 0">Everything here stays on this phone. Tax and legal notes are general info, not advice.</p>`;
}
function openTool(id) {
  const M = { price: T_PRICE, rate: T_RATE, product: T_PRODUCT, margin: T_MARGIN, discount: T_DISCOUNT, break: T_BREAK, forecast: T_FORECAST, payself: T_PAY, salestax: T_SALESTAX, deposit: T_DEPOSIT, loan: T_LOAN };
  if (M[id]) return calcSheet(M[id]());
  ({ messages: msgList, repeat: repeatSheet, review: reviewSheet, card: cardSheet, deduct: deductSheet, legal: legalSheet, receipt: receiptSheet, tax: taxSheet, packet: packetSheet, ics: calendarFile,
    miles: () => { spendMode = "trip"; renderSpend(); goPage("money", "money", 1); } }[id] || (() => {}))();
}

/* ---------- Home: what needs you today, and this week's money in one number ---------- */
const snoozed = k => S.snooze && S.snooze[k] && S.snooze[k] >= iso(TODAY);
function todayItems() {
  const out = [], push = (key, o) => { if (!snoozed(key)) out.push(Object.assign({ key }, o)); };
  overdueList().filter(x => !(x.reminded && inDays(x.reminded) > -4)).sort((a, b) => a.due.localeCompare(b.due)).forEach(x => { const c = clientOf(x.clientId); push("late:" + x.id, { tone: "warn", icon: ICON.bell, t: `Remind ${c ? firstName(c.name) : "them"} about ${money(totals(x).due)}`, s: `Invoice ${docNum(x)}, ${pl(-inDays(x.due), "day")} late`, act: "remind", id: x.id }); });
  S.todos.filter(t => !t.done && t.due && t.due <= iso(TODAY)).forEach(t => push("todo:" + t.id, { tone: "info", icon: ICON.todo, t: t.text, s: t.due < iso(TODAY) ? "To-do, was due " + shortD(t.due) : "To-do, due today", act: "todo-edit", id: t.id }));
  S.bills.filter(b => b.next && !b.off && inDays(b.next) <= 3).forEach(b => push("bill:" + b.id + b.next, { tone: "danger", icon: ICON.bill, t: `Pay ${b.name}`, s: `${money(+b.amount || 0)}, ${inDays(b.next) < 0 ? "was due " : "due "}${relDays(inDays(b.next)).toLowerCase()}`, act: "bill-edit", id: b.id }));
  const tx = taxNow().next; if (tx && !tx.paid && inDays(tx.due) <= 14 && tx.set > 0) push("tax:" + tx.year + tx.q, { tone: "brand", icon: ICON.pie, t: "Quarterly taxes due " + shortD(tx.due), s: "About " + money(tx.set) + " for " + tx.label, act: "tax-open" });
  S.jobs.filter(j => j.status === "done" && j.price > 0 && !j.invId && inDays(j.date) >= -14 && inDays(j.date) <= 0 && !S.payments.some(p => p.clientId === j.clientId && p.date >= j.date))
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).forEach(j => { const c = clientOf(j.clientId); push("job:" + j.id, { tone: "ok", icon: ICON.invoice, t: `Bill ${c ? firstName(c.name) : "the " + P.client} for ${j.title || P.job}`, s: `${money(j.price)}, done ${shortD(j.date)}`, act: "job-bill", id: j.id }); });
  S.invoices.filter(q => q.kind === "quote" && q.status === "sent" && !q.invId && inDays(q.date) <= -3 && inDays(q.date) >= -30 && !(q.followed && inDays(q.followed) > -7)).slice(0, 2).forEach(q => { const c = clientOf(q.clientId); push("quote:" + q.id, { tone: "violet", icon: ICON.quote, t: `Follow up with ${c ? firstName(c.name) : "them"} on a quote`, s: `${money(totals(q).total)}, sent ${shortD(q.date)}`, act: "tpl", tpl: "quote", id: q.id, cl: q.clientId }); });
  const since = iso(addDays(TODAY, -14)), seen = new Set();
  S.payments.filter(p => p.date >= since && p.clientId).sort((a, b) => b.date.localeCompare(a.date)).forEach(p => { const c = clientOf(p.clientId); if (!c || c.reviewAsked || seen.has(c.id) || seen.size >= 2) return; seen.add(c.id); push("review:" + c.id, { tone: "warn", icon: ICON.star, t: `Ask ${firstName(c.name)} for a review`, s: `Paid ${shortD(p.date)}`, act: "tpl", tpl: "review", cl: c.id }); });
  dueCheckins().slice(0, 2).forEach(x => push("check:" + x.c.id, { tone: "brand", icon: ICON.repeat, t: `Check in with ${firstName(x.c.name)}`, s: `Last ${P.job} ${shortD(x.last)}`, act: "tpl", tpl: "checkin", cl: x.c.id }));
  return out;
}
let todayAll = false;
function renderHomeToday() {
  const items = todayItems(), show = todayAll ? items : items.slice(0, 5);
  $("#h-today").innerHTML = `<div class="group-h"><h2>Needs You Today</h2>${items.length ? `<span class="tot">${items.length}</span>` : ""}</div><div class="list">` +
    (items.length ? show.map(x => `<div class="lrow trow"><button class="li-main" data-act="${x.act}" ${x.id ? `data-id="${esc(x.id)}"` : ""} ${x.cl ? `data-client="${esc(x.cl)}"` : ""} ${x.tpl ? `data-tpl="${esc(x.tpl)}"` : ""}>${ic(x.tone, x.icon)}<span class="tx"><b>${esc(x.t)}</b><small>${esc(x.s)}</small></span>${ICON.chev}</button><button class="tsnooze" data-act="snooze" data-id="${esc(x.key)}" aria-label="Hide for a week">${ICON.xmark}</button></div>`).join("") +
      (items.length > 5 ? `<button class="li addrow" data-act="today-more"><span class="tx">${todayAll ? "Show Less" : "Show " + (items.length - 5) + " More"}</span></button>` : "")
      : `<div class="allset">${ic("ok", ICON.check)}<span class="tx"><b>You're all caught up</b><small>Nothing late, nothing waiting on you.</small></span></div>`) + `</div>`;
}
function renderHomeWeek() {
  const w = period("week"), lw = period("week", addDays(TODAY, -7)), now = profitOf(w.a, w.b), last = profitOf(lw.a, lw.b), d = r2(now.net - last.net), pm = period("month"), m = profitOf(pm.a, pm.b);
  $("#h-week").innerHTML = `<div class="group-h"><h2>This Week</h2><a href="#money" class="press">Money</a></div>
    <a class="card weekcard press" href="#money"><small>${now.net >= 0 ? "You made" : "You're down"}</small><b class="num ${now.net < 0 ? "neg" : ""}">${money(Math.abs(now.net))}</b>
    <span class="wio"><span><i style="background:var(--ok-fill)"></i>${money(now.inc)} in</span><span><i style="background:var(--warn-fill)"></i>${money(now.out)} out</span></span>
    <span class="wcmp">${last.inc || last.out ? `<em class="${d >= 0 ? "up" : "down"}">${d >= 0 ? "▲" : "▼"} ${money(Math.abs(d))}</em> from last week` : "Nothing logged last week"} · ${esc(MONTHS[TODAY.getMonth()])} so far ${money(m.net)}</span></a>`;
}
function renderHomeTools() {
  const f = forecast(), fc = r2(f.inSoon - f.outBills - f.tax - f.other), maker = P.id === "food" || P.id === "retail";
  const t = [[maker ? "product" : "price", maker ? "Price a Product" : tc("Price " + aOrAn(P.job)), "brand", ICON.calc], ["messages", "Messages", "info", ICON.msg], ["forecast", (fc >= 0 ? "+" : "−") + moneyK(Math.abs(fc)) + " in 30 Days", "ok", ICON.cash], ["all", "All Tools", "violet", ICON.grid]];
  $("#h-tools").innerHTML = `<div class="group-h"><h2>Tools</h2><a href="#tools" class="press">See All</a></div><div class="qtools">${t.map(([id, l, c, svg]) => id === "all" ? `<a class="qtool press" href="#tools">${ic(c, svg)}<span>${esc(l)}</span></a>` : `<button type="button" class="qtool press" data-act="tool" data-id="${esc(id)}">${ic(c, svg)}<span>${esc(l)}</span></button>`).join("")}</div>`;
}
