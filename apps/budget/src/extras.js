//@@every
/* bills can repeat every month, every 3 months, twice a year or once a year.
   b.every is how many months apart (1 when missing); b.mon is one month it's due in. */
const EVERY = { 1: "Monthly", 3: "Every 3 months", 6: "Twice a year", 12: "Yearly" };
const everyOf = b => EVERY[+b.every] ? +b.every : 1;
const dueIn = (b, y, m) => { const e = everyOf(b); return e === 1 || ((y * 12 + m - (+b.mon || 0)) % e + e) % e === 0; };
const perMonth = b => b.amount / everyOf(b);
function nextDue(b, from) {
  from = from || TODAY; let y = from.getFullYear(), m = from.getMonth();
  for (let i = 0; i < 26; i++) { if (dueIn(b, y, m)) { const dt = dueOn(b, y, m); if (dt >= from) return dt; } m++; if (m > 11) { m = 0; y++; } }
  return dueOn(b, from.getFullYear(), from.getMonth());
}
const monthOpts = () => Array.from({ length: 12 }, (_, i) => { const d = new Date(TODAY.getFullYear(), TODAY.getMonth() + i, 1, 12); return [d.getMonth(), MONTHS[d.getMonth()] + " " + d.getFullYear()]; });
//@@billform
function billForm(b, kind, day, pre) {
  const p = !b && pre ? pre : {};
  const k = b ? b.kind : (kind || "bill"), isSub = k === "sub", ev = b ? everyOf(b) : (p.every || 1);
  const form = openSheet(b ? (isSub ? "Edit subscription" : "Edit bill") : (isSub ? "Add a subscription" : "Add a bill"), [
    { key: "name", label: "Name", type: "text", value: b ? b.name : (p.name || ""), ph: isSub ? "Music, cloud storage, an app…" : "Phone, rent, car registration…" },
    { key: "amount", label: "Amount each time", type: "money", value: b ? b.amount : (p.amount || "") },
    { key: "every", label: "How often", type: "seg", value: ev, options: [[1, "Monthly"], [3, "Every 3 months"], [6, "Twice a year"], [12, "Yearly"]] },
    { key: "mon", label: "Next due in", type: "select", value: b ? nextDue(b).getMonth() : (p.mon != null ? p.mon : TODAY.getMonth()), options: monthOpts() },
    { key: "day", label: isSub ? "Day it renews (1 to 31)" : "Day it's due (1 to 31)", type: "number", step: "1", min: 1, max: 31, value: b ? b.day : (day || p.day || "") },
    { key: "kind", label: "Kind", type: "seg", value: k, options: [["bill", "Bill"], ["sub", "Subscription"]] },
    { key: "group", label: "Need or want", type: "seg", value: b ? b.group : (isSub ? "wants" : "needs"), options: [["needs", "Need"], ["wants", "Want"]] }],
    v => {
      v.day = Math.round(v.day); if (!(v.day >= 1 && v.day <= 31)) return "Pick a day from 1 to 31.";
      v.every = EVERY[+v.every] ? +v.every : 1; v.mon = +v.mon || 0; if (v.every === 1) delete v.mon;
      if (b) { if (v.every === 1) delete b.mon; Object.assign(b, v); } else S.bills.push({ id: uid(), ...v });
      toast(v.kind === "sub" ? "Subscription saved" : "Bill saved");
    },
    b ? () => { S.bills = S.bills.filter(x => x !== b); return isSub ? "Subscription deleted" : "Bill deleted"; } : null);
  if (!form) return;
  const seg = form.querySelector('.seg[data-key="every"]'), row = form.querySelector("#f_mon").closest(".field");
  const sync = () => { const on = seg.querySelector(".on"); row.hidden = !on || on.dataset.v === "1"; };
  sync(); seg.addEventListener("click", () => setTimeout(sync));
}
//@@tools
/* ---------- files: save one on the phone (Files, share sheet or a download) ---------- */
async function saveFile(name, data, mime, title) {
  try {
    if (downloads) { await downloads.save({ filename: name, data }); return true; }
    const blob = new Blob([data], { type: mime });
    const file = typeof File === "function" ? new File([blob], name, { type: mime }) : null;
    if (file && /iP(hone|ad|od)|Android/.test(navigator.userAgent) && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title }); return true; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); return true;
  } catch (e) {
    if (e && (e.code === "declined" || e.name === "AbortError")) toast("Canceled");
    else if (e && e.code === "rejected_extension") toast("This file can't be saved here. Open the app from your Home Screen.");
    else toast("Couldn't save the file here");
    return false;
  }
}

/* ---------- bill reminders: one calendar file with a repeating event for each bill ---------- */
const icsEscape = s => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
function icsFold(line) { const out = []; while (line.length > 74) { out.push(line.slice(0, 74)); line = " " + line.slice(74); } out.push(line); return out.join("\r\n"); }
const icsDay = d => d > 28 ? "BYMONTHDAY=" + Array.from({ length: d - 27 }, (_, i) => 28 + i).join(",") + ";BYSETPOS=-1" : "BYMONTHDAY=" + d;
function remindSheet() {
  if (!S.bills.length) { toast("Add a bill first"); return; }
  openSheet("Bill reminders", [
    { key: "when", label: "Remind me", type: "seg", value: "1", options: [["0", "On the day"], ["1", "Day before"], ["3", "3 days before"]] },
    { key: "pay", label: "Show paydays too", type: "seg", value: "yes", options: [["yes", "Yes"], ["no", "No"]] }],
    v => { makeIcs(+v.when, v.pay === "yes"); if (sheetClose) sheetClose(); return false; }, null,
    `<div class="tip">Each of your ${S.bills.length} bills and subscriptions goes on your phone's calendar and repeats on its own, with an alert at 9 AM.</div>
    <ol class="steps"><li>Tap <b>Save calendar file</b>.</li><li>Open the file and tap <b>Add All</b>.</li><li>Change a bill later? Delete the old reminders in Calendar, then save a new file.</li></ol>`, "Save calendar file", null, false, { focus: false });
}
async function makeIcs(before, pays) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, ""), ymd = dt => iso(dt).replace(/-/g, "");
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CyberHub Software//Paycheck Budget//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Bills"];
  const trig = before === 0 ? "PT9H" : "-P" + (before > 1 ? (before - 1) + "D" : "") + "T15H";
  S.bills.forEach(b => {
    const dt = nextDue(b), e = everyOf(b);
    L.push("BEGIN:VEVENT", "UID:" + b.id + "@budget.cyberhubsoftware.com", "DTSTAMP:" + stamp, "DTSTART;VALUE=DATE:" + ymd(dt), "DTEND;VALUE=DATE:" + ymd(addDays(dt, 1)),
      "RRULE:FREQ=MONTHLY;INTERVAL=" + e + ";" + icsDay(b.day),
      "SUMMARY:" + icsEscape(b.name + " " + money(b.amount, true)), "DESCRIPTION:" + icsEscape((b.kind === "sub" ? "Subscription" : "Bill") + " · " + EVERY[e] + ". From Paycheck Budget."), "TRANSP:TRANSPARENT",
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEscape(b.name + (before === 0 ? " is due today" : before === 1 ? " is due tomorrow" : " is due in " + before + " days")), "TRIGGER:" + trig, "END:VALARM", "END:VEVENT");
  });
  if (pays) {
    const nx = periodAt(0).next, sc = S.settings.schedule;
    const rule = sc === "weekly" ? "FREQ=WEEKLY;INTERVAL=1" : sc === "biweekly" ? "FREQ=WEEKLY;INTERVAL=2" : sc === "semimonthly" ? "FREQ=MONTHLY;BYMONTHDAY=1,15" : "FREQ=MONTHLY;" + icsDay(nx.getDate());
    L.push("BEGIN:VEVENT", "UID:payday@budget.cyberhubsoftware.com", "DTSTAMP:" + stamp, "DTSTART;VALUE=DATE:" + ymd(nx), "DTEND;VALUE=DATE:" + ymd(addDays(nx, 1)), "RRULE:" + rule,
      "SUMMARY:Payday", "DESCRIPTION:From Paycheck Budget.", "TRANSP:TRANSPARENT", "END:VEVENT");
  }
  L.push("END:VCALENDAR");
  if (await saveFile("bill-reminders.ics", L.map(icsFold).join("\r\n"), "text/calendar", "Bill reminders")) toast("Calendar file ready");
}

/* ---------- monthly report: a one-page PDF drawn on the phone ---------- */
let jsPDFp = null;
function loadPDF() {
  if (window.jspdf) return Promise.resolve(window.jspdf.jsPDF);
  return jsPDFp || (jsPDFp = new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; s.onload = () => window.jspdf ? res(window.jspdf.jsPDF) : rej(new Error("no jspdf")); s.onerror = () => { jsPDFp = null; rej(new Error("load failed")); }; document.head.appendChild(s); }));
}
const pdfText = s => String(s == null ? "" : s).replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\u2014|\u2013/g, "-").replace(/\u2212/g, "-").replace(/[^\x20-\x7E\u00A0-\u00FF\u20AC\u2022\u2026]/g, "");
const pdfMoney = (v, cents) => { const s = money(v, cents); return /[^\x20-\x7E\u00A0-\u00FF\u20AC\u2212]/.test(s) ? s.replace(/[^\d.,\-\s\u2212]/g, "").trim() + " " + S.settings.currency : s; };
function pdfKit(doc) {
  const M = 48, W = 612 - M * 2, H = 792; let y = M;
  const ink = [27, 35, 53], brand = [15, 107, 97], grey = [107, 117, 145], red = [191, 74, 98];
  const k = {
    doc, M, W, get y() { return y; }, set y(v) { y = v; },
    room(h) { if (y + h > H - M - 20) { doc.addPage(); y = M; return true; } return false; },
    title(t, sub) { doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(...ink); doc.text(pdfText(t), M, y + 18); y += 30; if (sub) { doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(...grey); doc.splitTextToSize(pdfText(sub), W).forEach(l => { doc.text(l, M, y + 10); y += 14; }); } y += 10; },
    stats(items) { k.room(64); const w = W / items.length; doc.setFillColor(243, 245, 249); doc.roundedRect(M, y, W, 56, 8, 8, "F");
      items.forEach(([lbl, val, col], i) => { const x = M + w * i + w / 2; doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...grey); doc.text(pdfText(lbl), x, y + 20, { align: "center" }); doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(...(col || ink)); doc.text(pdfText(val), x, y + 40, { align: "center" }); if (i) { doc.setDrawColor(224, 229, 238); doc.line(M + w * i, y + 12, M + w * i, y + 44); } });
      y += 70; },
    band(t, right) { k.room(60); doc.setFillColor(236, 244, 242); doc.roundedRect(M, y, W, 24, 5, 5, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...brand); doc.text(pdfText(t).toUpperCase(), M + 10, y + 16); if (right) { doc.setTextColor(...grey); doc.text(pdfText(right), M + W - 10, y + 16, { align: "right" }); } y += 32; },
    empty(t) { k.room(20); doc.setFont("helvetica", "italic"); doc.setFontSize(9.5); doc.setTextColor(...grey); doc.text(pdfText(t), M + 4, y + 10); y += 24; },
    table(cols, rows, totals) {
      const draw = (cells, bold, fill, tone) => { const h = 18; if (k.room(h + 4)) head(); if (fill) { doc.setFillColor(...fill); doc.rect(M, y, W, h, "F"); }
        doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(8.8);
        let x = M + 4; cells.forEach((c, i) => { const col = cols[i]; doc.setTextColor(...(tone && tone[i] ? tone[i] : bold ? ink : [60, 66, 84])); const t = doc.splitTextToSize(pdfText(c), col.w - 8)[0] || ""; doc.text(t, col.right ? x + col.w - 8 : x, y + 12, col.right ? { align: "right" } : undefined); x += col.w; });
        y += h; };
      const head = () => draw(cols.map(c => c.t), true, [243, 245, 249]);
      head(); rows.forEach((r, i) => draw(r.cells || r, false, i % 2 ? [249, 250, 252] : null, r.tone)); if (totals) draw(totals, true, [232, 240, 238]); y += 14;
    },
    footer(label) { const n = doc.getNumberOfPages(); for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...grey); doc.text(pdfText(label), M, H - 26); doc.text("Page " + i + " of " + n, M + W, H - 26, { align: "right" }); } }
  };
  k.red = red; k.brand = brand;
  return k;
}
function reportSheet() {
  const opts = Array.from({ length: 12 }, (_, i) => { const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1, 12); return [iso(d).slice(0, 7), MONTHS[d.getMonth()] + " " + d.getFullYear() + (i === 0 ? " (so far)" : "")]; });
  openSheet("Monthly report", [{ key: "month", label: "Which month", type: "select", value: opts[0][0], options: opts }],
    v => { makeReport(v.month); if (sheetClose) sheetClose(); return false; }, null,
    `<div class="tip">One clean PDF with money in and out, spending by category, bills, goals, debts and every purchase. Good for a monthly check-in or to share with a partner.</div>`, "Make the PDF", null, false, { focus: false });
}
async function makeReport(ym) {
  toast("Making your PDF…");
  let JsPDF; try { JsPDF = await loadPDF(); } catch (e) { toast("Couldn't load the PDF maker. Check your connection."); return; }
  const [y, m] = ym.split("-").map(Number), mi = m - 1, first = new Date(y, mi, 1, 12), last = new Date(y, mi, daysInMonth(y, mi), 12), inM = d => d >= first && d <= last;
  const its = monthItems(y, mi), pays = its.filter(i => i.type === "pay"), bills = its.filter(i => i.type === "bill");
  const extras = S.incomes.filter(i => inM(D(i.date))).sort((a, b) => a.date.localeCompare(b.date));
  const exps = S.expenses.filter(e => inM(D(e.date))).sort((a, b) => a.date.localeCompare(b.date));
  const cons = S.contrib.filter(c => inM(D(c.date))), pmts = S.payments.filter(c => inM(D(c.date)));
  const income = pays.length * S.settings.pay + sum(extras, i => i.amount), billT = sum(bills, i => i.b.amount), spent = sum(exps, e => e.amount), saved = sum(cons, c => c.amount), debtP = sum(pmts, c => c.amount);
  const left = income - billT - spent - saved - debtP, label = MONTHS[mi] + " " + y;
  const doc = new JsPDF({ unit: "pt", format: "letter" }), k = pdfKit(doc), L = look();
  k.title("Monthly report · " + label, `${L.name ? L.name + " · " : ""}Prepared ${fmtLong(iso(TODAY))} from the numbers entered in Paycheck Budget.${last > TODAY ? " This month isn't over yet." : ""}`);
  k.stats([["Money in", pdfMoney(income), k.brand], ["Money out", pdfMoney(billT + spent + saved + debtP)], [left < 0 ? "Over by" : "Left over", pdfMoney(Math.abs(left)), left < 0 ? k.red : k.brand]]);
  k.band("Where it went", pdfMoney(income));
  k.table([{ t: "", w: 380 }, { t: "Amount", w: 136, right: true }], [
    [`Paychecks (${pays.length} × ${pdfMoney(S.settings.pay)})`, pdfMoney(pays.length * S.settings.pay)], ...extras.map(i => ["Extra: " + i.name + " · " + short(D(i.date)), pdfMoney(i.amount, true)]),
    ["Bills and subscriptions", "-" + pdfMoney(billT, true)], ["Spending", "-" + pdfMoney(spent, true)], ["Saved toward goals", "-" + pdfMoney(saved, true)], ["Paid toward debts", "-" + pdfMoney(debtP, true)]],
    [left < 0 ? "Over by" : "Left over", pdfMoney(left, true)]);
  const kk = PER_YEAR[S.settings.schedule] / 12, byCat = {}; exps.forEach(e => { byCat[e.cat] = (byCat[e.cat] || 0) + e.amount; });
  k.band("Spending by category", pdfMoney(spent));
  if (S.cats.length) k.table([{ t: "Category", w: 196 }, { t: "Plan", w: 106, right: true }, { t: "Spent", w: 106, right: true }, { t: "Left", w: 108, right: true }],
    S.cats.map(c => { const pl = c.budget * kk, sp = byCat[c.id] || 0; return { cells: [c.name, pdfMoney(pl), pdfMoney(sp, true), (sp > pl ? "-" : "") + pdfMoney(Math.abs(pl - sp), true)], tone: [null, null, null, sp > pl ? k.red : null] }; }),
    ["Total", pdfMoney(sum(S.cats, c => c.budget * kk)), pdfMoney(spent, true), ""]); else k.empty("No categories");
  k.band("Bills and subscriptions", bills.length + "");
  if (bills.length) k.table([{ t: "Due", w: 70 }, { t: "Name", w: 196 }, { t: "How often", w: 110 }, { t: "Amount", w: 90, right: true }, { t: "Paid", w: 50 }],
    bills.map(i => [short(i.date), i.b.name + (i.b.kind === "sub" ? " (sub)" : ""), EVERY[everyOf(i.b)], pdfMoney(i.b.amount, true), S.paid[i.b.key] ? "Yes" : ""]), ["", "Total", "", pdfMoney(billT, true), ""]); else k.empty("Nothing due this month");
  if (S.goals.length) { k.band("Savings goals", pdfMoney(saved) + " added");
    k.table([{ t: "Goal", w: 196 }, { t: "Added", w: 106, right: true }, { t: "Saved so far", w: 106, right: true }, { t: "Target", w: 108, right: true }],
      S.goals.map(g => [g.name, pdfMoney(sum(cons.filter(c => c.goal === g.id), c => c.amount)), pdfMoney(g.start + sum(S.contrib.filter(c => c.goal === g.id && D(c.date) <= last), c => c.amount)), pdfMoney(g.target)])); }
  if (S.debts.length) { k.band("Debts", pdfMoney(debtP) + " paid");
    k.table([{ t: "Debt", w: 196 }, { t: "Paid", w: 106, right: true }, { t: "Left", w: 106, right: true }, { t: "Rate", w: 108, right: true }],
      S.debts.map(d => [d.name, pdfMoney(sum(pmts.filter(c => c.debt === d.id), c => c.amount)), pdfMoney(Math.max(0, d.start - sum(S.payments.filter(c => c.debt === d.id && D(c.date) <= last), c => c.amount))), d.apr ? d.apr + "% APR" : ""])); }
  k.band("Purchases", exps.length + "");
  const catN = id => (S.cats.find(c => c.id === id) || { name: "Other" }).name;
  if (exps.length) k.table([{ t: "Date", w: 66 }, { t: "What", w: 220 }, { t: "Category", w: 130 }, { t: "Amount", w: 100, right: true }],
    exps.map(e => [short(D(e.date)), e.note || catN(e.cat), catN(e.cat), pdfMoney(e.amount, true)]), ["", "Total", "", pdfMoney(spent, true)]); else k.empty("No purchases this month");
  k.footer("Paycheck Budget · " + label + " · Adds up what you entered. Not financial advice.");
  if (await saveFile("budget-report-" + ym + ".pdf", doc.output("arraybuffer"), "application/pdf", "Monthly report")) toast("Report saved");
}

/* ---------- paycheck recap: on a new paycheck, how the last one went ---------- */
function renderRecap() {
  const el = $("#recap"); if (!el) return;
  const p0 = periodAt(0), pl = periodAt(-1), key = iso(p0.start), c = calc(pl);
  if (sel !== 0 || S.recapSeen === key || dayDiff(p0.start, TODAY) > 9 || !(c.spent || c.billsTotal || c.saveAct || c.debtAct)) { el.innerHTML = ""; return; }
  const left = r2(c.left), over = left < 0, out = c.billsTotal + c.saveUse + c.debtUse + c.spent;
  const msg = over ? `You went ${money(-left, true)} over. It happens. This paycheck is a fresh start.` : left < 1 ? "Every dollar had a job. Right on plan." : `Nice. You finished with ${money(left)} to spare.${S.goals.length ? " Want to put it toward a goal?" : ""}`;
  el.innerHTML = `<section class="recap" aria-labelledby="recapHd">
    <div class="rchd">${ic(over ? "debt" : "income", over ? ICON.debt : ICON.sparkle)}<div><h2 id="recapHd">Last paycheck</h2><small>${short(pl.start)} – ${short(pl.end)}</small></div><button type="button" class="x press" data-act="recap-done" aria-label="Close the recap">×</button></div>
    <div class="trio"><div><small>Came in</small><b class="num" style="color:var(--income)">${money(c.income)}</b></div><div><small>Went out</small><b class="num">${money(out)}</b></div><div><small>${over ? "Over by" : "Left over"}</small><b class="num" style="color:${over ? "var(--debt)" : "var(--brand)"}">${money(Math.abs(left))}</b></div></div>
    <p>${msg}</p>
    <div class="acts">${!over && left >= 1 && S.goals.length ? `<button type="button" class="btn primary press" data-act="recap-move">Move ${money(left)} to a goal</button>` : ""}<button type="button" class="btn ghost press" data-act="recap-done">Done</button></div></section>`;
}
function recapMove() {
  const p0 = periodAt(0), pl = periodAt(-1), left = r2(calc(pl).left), key = iso(p0.start);
  if (left < 1) return;
  pickSheet("Move " + money(left) + " to which goal?", S.goals.map(g => ({ name: g.name, icon: ICON.goal[g.icon % ICON.goal.length] || ICON.save, sub: money(goalSaved(g)) + " of " + money(g.target),
    go: () => { if (sheetClose) sheetClose(); withUndo(money(left) + " moved to " + g.name, () => { S.contrib.push({ id: uid(), goal: g.id, amount: left, date: iso(pl.end) }); S.recapSeen = key; }); } })), "New savings goal", () => goalForm(), "save");
}
