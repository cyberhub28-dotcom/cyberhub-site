//@@expense
function expenseForm(e, pre) {
  const p = !e && pre ? pre : {};
  openSheet(e ? "Edit purchase" : "Add spending", [
    { key: "amount", label: "Amount", type: "money", value: e ? e.amount : (p.amount || ""), ph: "0.00" },
    { key: "cat", label: "Category", type: "seg", value: e ? e.cat : (p.cat || (actCat !== "all" ? actCat : S.cats[0] && S.cats[0].id)), options: catOpts().map(([id, n]) => [id, esc(n)]) },
    { key: "note", label: "What was it?", type: "text", value: e ? e.note : (p.note || ""), ph: "Coffee, groceries, gift…", req: false },
    { key: "date", label: "Date", type: "date", value: e ? e.date : (p.date || defaultDate()) }],
    v => { if (!v.cat) return "Pick a category."; if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date)) return "Pick a date."; if (e) Object.assign(e, v); else S.expenses.push({ id: uid(), ...v }); toast(e ? "Purchase updated" : "Added " + money(v.amount, true)); },
    e ? () => { S.expenses = S.expenses.filter(x => x !== e); return "Purchase deleted"; } : null);
}
//@@bill
function billForm(b, kind, day, pre) {
  const p = !b && pre ? pre : {};
  const k = b ? b.kind : (kind || "bill"), isSub = k === "sub";
  openSheet(b ? (isSub ? "Edit subscription" : "Edit bill") : (isSub ? "Add a subscription" : "Add a bill"), [
    { key: "name", label: "Name", type: "text", value: b ? b.name : (p.name || ""), ph: isSub ? "Music, cloud storage, an app…" : "Phone, rent, power…" },
    { key: "amount", label: "Monthly amount", type: "money", value: b ? b.amount : (p.amount || "") },
    { key: "day", label: isSub ? "Renews on day of the month (1 to 31)" : "Due day of the month (1 to 31)", type: "number", step: "1", min: 1, max: 31, value: b ? b.day : (day || p.day || "") },
    { key: "kind", label: "Kind", type: "seg", value: k, options: [["bill", "Bill"], ["sub", "Subscription"]] },
    { key: "group", label: "Need or want", type: "seg", value: b ? b.group : (isSub ? "wants" : "needs"), options: [["needs", "Need"], ["wants", "Want"]] }],
    v => { v.day = Math.round(v.day); if (!(v.day >= 1 && v.day <= 31)) return "Pick a day from 1 to 31."; if (b) Object.assign(b, v); else S.bills.push({ id: uid(), ...v }); toast(v.kind === "sub" ? "Subscription saved" : "Bill saved"); },
    b ? () => { S.bills = S.bills.filter(x => x !== b); return isSub ? "Subscription deleted" : "Bill deleted"; } : null);
}
function incomeForm(i, pre) {
  const p = !i && pre ? pre : {};
  openSheet(i ? "Edit income" : "Add extra income", [
    { key: "name", label: "Source", type: "text", value: i ? i.name : (p.name || ""), ph: "Side job, refund, gift…" },
    { key: "amount", label: "Amount", type: "money", value: i ? i.amount : (p.amount || "") },
    { key: "date", label: "Date received", type: "date", value: i ? i.date : (p.date || defaultDate()) }],
    v => { if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date)) return "Pick a date."; if (i) Object.assign(i, v); else S.incomes.push({ id: uid(), ...v }); toast("Income saved"); },
    i ? () => { S.incomes = S.incomes.filter(x => x !== i); return "Income deleted"; } : null);
}
//@@add
/* the + button: say it in your own words first, or pick from the grid underneath */
const ADD = [
  ["Money in and out", [["spend", "Spending", "spend", () => expenseForm()], ["income", "Income", "income", () => incomeForm()], ["bill", "Bill", "bills", () => billForm(null, "bill")],
    ["sub", "Subscription", "subs", () => billForm(null, "sub")], ["goal-add", "Add to savings", "save", () => pickGoal()], ["debt-pay", "Pay a debt", "debt", () => pickDebt()]]],
  ["Set up", [["goal", "New goal", "save", () => goalForm()], ["debt", "New debt", "debt", () => debtForm()], ["cat", "New category", "spend", () => catForm()]]]];
const ADDICON = { spend: ICON.spend, income: ICON.income, bill: ICON.bills, sub: ICON.subs, "goal-add": ICON.save, "debt-pay": ICON.debt, goal: ICON.goal[0], debt: ICON.debt, cat: ICON.sliders };
const ADDFN = {}; ADD.forEach(([, items]) => items.forEach(it => { ADDFN[it[0]] = it[3]; }));
function tile(c) { return `background:var(--${c}-soft);color:var(--${c})`; }
function addMenu() {
  const html = `<div class="addask"><p>Tell me what to add, with the details, and I'll fill it in for you.</p>
      <div class="ask"><label class="sr" for="addAskIn">What to add</label><input id="addAskIn" type="text" enterkeyhint="go" autocomplete="off" placeholder="e.g. Gas 40 yesterday"><button type="button" id="addAskGo" aria-label="Go">${ICON.send}</button></div>
      <small>Like “Coffee 5.50”, “Phone bill 72 due the 9th” or “Put 50 in savings”. Tap the mic on your keyboard to say it.</small>
      <div class="ask-inline" id="addAskOut"></div></div>
    <div class="addor"><span>or pick one</span></div>` +
    ADD.map(([hd, items]) => `<div class="addhd">${hd}</div><div class="addgrid">${items.map(([k, label, c]) => `<button type="button" class="addtile press" data-add="${k}"><span class="ic" style="${tile(c)}">${ADDICON[k]}</span>${label}</button>`).join("")}</div>`).join("");
  const form = openSheet("Add", [], () => {}, null, html, "Close", null, true, { focus: false });
  if (!form) return;
  const inp = form.querySelector("#addAskIn"), run = () => { const v = inp.value.trim(); if (!v) { inp.focus(); return; } runAsk(v, form.querySelector("#addAskOut")); inp.value = ""; inp.blur(); };
  form.querySelector("#addAskGo").onclick = run;
  inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); run(); } });
}
//@@nudge
function renderNudge() {
  const el = $("#nudge"); if (!el) return;
  const days = S.lastBackup ? Math.floor((TODAY - new Date(S.lastBackup + "T12:00:00")) / 864e5) : null;
  let dismissed = null; try { dismissed = sessionStorage.getItem(KEY + "-nudge"); } catch (e) {}
  if (!hasData() || dismissed || (days != null && days < 7)) { el.innerHTML = ""; return; }
  el.innerHTML = `<div class="backup-nudge" role="note">${ic("info", ICON.up)}
    <p><b>${days == null ? "Back up your budget" : "Time for a fresh backup"}</b>${days == null ? "Your budget lives only on this device. Save a copy you can restore anytime." : "Your last one was " + days + " days ago."}<br><button class="lnk" data-act="backup">Back up now</button></p>
    <button class="x" id="nudgeX" aria-label="Not now">×</button></div>`;
  $("#nudgeX").onclick = () => { try { sessionStorage.setItem(KEY + "-nudge", "1"); } catch (e) {} el.innerHTML = ""; };
}

/* ---------- Quick add: plain words in, a purchase, a bill or an answer out.
   It runs on the phone with simple word matching. Nothing is sent anywhere. ---------- */
const T = n => iso(addDays(TODAY, n));
const qwords = s => String(s || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const QSTOP = new Set("a an the my of for to in on at and or is are was be i me it this that just today yesterday paid pay paying payment payments put save saved saving toward towards into from spent spend bought got bill bills due monthly month every each renews renew subscription sub plus with off".split(" "));
/* the best match by shared words; whole-name matches win ties */
function nameHit(raw, list, nameOf) {
  const qw = qwords(raw).filter(w => !QSTOP.has(w) && !/^\d/.test(w));
  let best = null, top = 0, full = false;
  list.forEach(x => {
    const nw = qwords(nameOf(x)).filter(w => !QSTOP.has(w)); if (!nw.length) return;
    const sc = nw.filter(n => qw.some(w => w === n || (w.length > 3 && n.startsWith(w)) || (n.length > 3 && w.startsWith(n)))).length;
    if (sc > top || (sc === top && sc > 0 && sc === nw.length && !full)) { top = sc; best = x; full = sc === nw.length; }
  });
  return best ? { x: best, sc: top, full } : null;
}
function qDate(t) {
  if (/\byesterday\b/.test(t)) return T(-1);
  if (/\btoday\b|\bthis morning\b|\btonight\b/.test(t)) return iso(TODAY);
  const wd = t.match(/\b(?:last |on )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (wd) { const i = WD.map(x => x.toLowerCase()).indexOf(wd[1]); let n = (TODAY.getDay() - i + 7) % 7; if (n === 0) n = 7; return T(-n); }
  const ago = t.match(/\b(\d+|a|one|two|three) (day|week)s? ago\b/);
  if (ago) { const n = { a: 1, one: 1, two: 2, three: 3 }[ago[1]] || +ago[1]; return T(-n * (ago[2] === "week" ? 7 : 1)); }
  const md = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.? (\d{1,2})(?:st|nd|rd|th)?(?:,? (\d{4}))?\b/);
  if (md) { const m = MON.map(x => x.toLowerCase()).indexOf(md[1].slice(0, 3)); const y = md[3] ? +md[3] : TODAY.getFullYear(); let dt = new Date(y, m, +md[2], 12); if (!md[3] && dt > TODAY) dt = new Date(y - 1, m, +md[2], 12); return iso(dt); }
  const sl = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (sl) { let y = sl[3] ? +sl[3] : TODAY.getFullYear(); if (y < 100) y += 2000; let dt = new Date(y, +sl[1] - 1, +sl[2], 12); if (!sl[3] && dt > TODAY) dt = new Date(y - 1, +sl[1] - 1, +sl[2], 12); if (dt.getMonth() === +sl[1] - 1) return iso(dt); }
  return null;
}
/* "due the 9th", "renews on the 3rd", "every month on the 15" */
function qDay(t) {
  const m = t.match(/\b(?:due|renews?|on|every month on|monthly on)\s+(?:on\s+)?(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\b(?!\s*(?:\/|day|week|%))/) || t.match(/\b(?:the\s+)?(\d{1,2})(st|nd|rd|th)\b/);
  const d = m ? +m[1] : 0; return d >= 1 && d <= 31 ? d : null;
}
const DATE_BITS = [/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g, /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.? \d{1,2}(?:st|nd|rd|th)?(?:,? \d{4})?\b/g,
  /\b(?:due|renews?|on|every month on|monthly on)\s+(?:on\s+)?(?:the\s+)?\d{1,2}(?:st|nd|rd|th)?\b/g, /\b(?:the\s+)?\d{1,2}(?:st|nd|rd|th)\b/g, /\b(?:\d+|a|one|two|three) (?:day|week)s? ago\b/g, /\b\d+(?:\.\d+)?\s*%/g];
function qAmount(t) {
  let s = " " + t + " "; DATE_BITS.forEach(re => { s = s.replace(re, " "); });
  const all = [...s.matchAll(/(\$\s*)?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?(?!\d)/g)];
  if (!all.length) return null;
  const pick = all.find(m => m[1] || m[3]) || all[0];
  const v = parseFloat(pick[2].replace(/,/g, "") + (pick[3] ? "." + pick[3] : ""));
  return v > 0 && v < 1e7 ? r2(v) : null;
}
const FILLER = /\b(?:i|just|spent|spend|bought|buy|paid|pay|got|grabbed|picked up|dollars?|bucks?|usd|today|yesterday|this morning|tonight|last|ago|add|log|new|a|an|my|due|renews?|every month|monthly|a month|per month|twice a year|every 6 months|every six months|semi-?annual(?:ly)?|yearly|annual(?:ly)?|every year|once a year|per year|a year|quarterly|every 3 months|every three months|in (?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*|subscription|sub|membership(?= fee))\b/gi;
function qNote(raw) {
  let s = " " + raw + " "; s = s.replace(/\b(?:twice a year|every (?:\d+|three|six) months|semi-?annual(?:ly)?|yearly|annual(?:ly)?|every year|once a year|per year|a year|quarterly|every month|per month|a month|monthly)\b/gi, " "); DATE_BITS.forEach(re => { s = s.replace(new RegExp(re.source, "gi"), " "); });
  s = s.replace(/\$?\s*\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\$?\s*\d+(?:\.\d{1,2})?/g, " ").replace(/\b(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi, " ").replace(FILLER, " ");
  s = s.replace(/[“”"$,.!?]/g, " ").replace(/\s+/g, " ").trim().replace(/^(?:(?:on|for|of|at|in|to|and)\s+)+/i, "").replace(/\s+(?:at|in|to|and|on)$/i, "");
  return s ? s.replace(/^\w/, c => c.toUpperCase()).slice(0, 60) : "";
}
const SUBWORD = /\b(subscription|renews?|membership|netflix|spotify|hulu|disney|max\b|hbo|prime video|amazon prime|icloud|google one|youtube|apple music|apple tv|paramount|peacock|audible|xbox game pass|playstation plus|gym|patreon|chatgpt|dropbox)\b/;
const INCWORD = /\b(bonus|refund|tax return|side (?:job|gig|hustle)|tips?|reimburs\w*|cash ?back|interest|dividend|income|sold|earned|got paid|paycheck|gift from|birthday money|venmo from|zelle from|cash app from|stipend|overtime)\b/;
const fmtWhen = d => { const n = dayDiff(TODAY, D(d)); return n === 0 ? "Today" : n === -1 ? "Yesterday" : n === 1 ? "Tomorrow" : WD[D(d).getDay()].slice(0, 3) + ", " + short(D(d)); };
const nth = n => n + (n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th");
function understand(raw) {
  const t = " " + raw.toLowerCase().replace(/[“”]/g, '"').replace(/’/g, "'") + " ";
  const amount = qAmount(t), date = qDate(t) || iso(TODAY);
  const payWord = /\b(paid|pay|paying|payment|toward|towards|put)\b/.test(t);
  const saveWord = /\b(save|saved|saving|savings|put|toward|towards|into|add|added|set aside|stash|stashed)\b/.test(t);
  const dh = S.debts.length ? nameHit(raw, S.debts, d => d.name) : null;
  const gh = S.goals.length ? nameHit(raw, S.goals, g => g.name) : null;
  const bh = S.bills.length ? nameHit(raw, S.bills, b => b.name) : null;
  // a debt payment, unless a bill matches better
  if (amount && payWord && dh && !(bh && bh.sc > dh.sc)) return { type: "debt", d: dh.x, amount, date };
  // money set aside for a goal
  if (amount && saveWord && !/\b(spent|bought)\b/.test(t)) {
    if (gh && !(dh && dh.sc > gh.sc)) return { type: "goal", g: gh.x, amount, date };
    if (/\bsavings?\b|\bset aside\b|\bstash/.test(t) && S.goals.length) return S.goals.length === 1 ? { type: "goal", g: S.goals[0], amount, date } : { type: "goal-pick", amount, date };
  }
  // a bill you paid
  if (/\b(paid|pay)\b/.test(t) && bh && !qDay(t)) {
    const occ = [...billsIn(periodAt(0)), ...billsIn(periodAt(1)), ...billsIn(periodAt(-1))].filter(o => o.id === bh.x.id);
    const next = occ.filter(o => !S.paid[o.key]).sort((a, b) => a.date - b.date)[0];
    return { type: "billpaid", b: bh.x, occ: next || null, done: !next && occ.some(o => S.paid[o.key]) };
  }
  // "Rent 1150": a bill's whole name and an amount, no spending words, means it was paid
  const day = qDay(t), isSub = SUBWORD.test(t);
  if (amount && bh && bh.full && !day && !/\b(spent|bought|due|renews?|new|monthly|a month|per month|every month|yearly|annual\w*|a year|quarterly|twice)\b/.test(t)) {
    const occ = [...billsIn(periodAt(0)), ...billsIn(periodAt(1)), ...billsIn(periodAt(-1))].filter(o => o.id === bh.x.id);
    const next = occ.filter(o => !S.paid[o.key]).sort((a, b) => a.date - b.date)[0];
    if (next) return { type: "billpaid", b: bh.x, occ: next, done: false };
  }
  // a new bill or subscription, monthly or every few months ("Car registration 120 yearly due March 15")
  const every = /\b(twice a year|every (?:6|six) months|semi-?annual(?:ly)?)\b/.test(t) ? 6 : /\b(yearly|annual(?:ly)?|every year|once a year|per year|a year)\b/.test(t) ? 12 : /\b(quarterly|every (?:3|three) months)\b/.test(t) ? 3 : 1;
  const md = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?(?: (\d{1,2})(?:st|nd|rd|th)?\b)?/);
  const bday = md && md[2] && +md[2] <= 31 ? +md[2] : day;
  if (amount && (bday || isSub || every > 1 || /\b(bill|monthly|a month|per month|every month)\b/.test(t)) && !/\b(spent|bought)\b/.test(t) && !(md && every === 1 && !day && !isSub && !/\b(bill|due|renews?)\b/.test(t))) {
    const name = qNote(raw) || (isSub ? "Subscription" : "Bill"), d0 = bday || TODAY.getDate();
    const mon = md ? MON.map(x => x.toLowerCase()).indexOf(md[1].slice(0, 3)) : (d0 >= TODAY.getDate() ? TODAY.getMonth() : (TODAY.getMonth() + 1) % 12);
    return { type: "newbill", name, amount, day: d0, every, mon, kind: isSub ? "sub" : "bill", same: bh && bh.full ? bh.x : null };
  }
  // money coming in
  if (amount && INCWORD.test(t) && !/\b(spent|bought)\b/.test(t)) {
    const plain = /\b(got paid|paycheck)\b/.test(t) && !/\b(bonus|extra|side|overtime|tips?)\b/.test(t);
    return { type: "income", name: qNote(raw.replace(/\b(got paid|paycheck)\b/gi, " ")) || (plain ? "Paycheck" : "Extra income"), amount, date, plain };
  }
  // anything else with an amount is spending
  if (amount) {
    const note = qNote(raw), ch = nameHit(raw, S.cats, c => c.name);
    if (!S.cats.length) return null;
    return { type: "spend", amount, date, note, cat: ch ? ch.x.id : guessCat(note || raw) };
  }
  return null;
}
/* answers about the numbers already in the app */
function answer(raw) {
  const t = " " + raw.toLowerCase().replace(/’/g, "'") + " ";
  const p0 = periodAt(0), c0 = calc(p0), toPay = dayDiff(TODAY, p0.next);
  const payTxt = `${WD[p0.next.getDay()]}, ${short(p0.next)}${toPay === 1 ? " (tomorrow)" : toPay > 1 ? " (in " + toPay + " days)" : ""}`;
  if (/\b(payday|get paid|paid next|next paycheck|next pay)\b/.test(t)) return { html: `<p>Your next payday is <b>${payTxt}</b>.</p>` };
  if (/\b(due|coming up|upcoming|owe this|bills? (?:soon|this week|next))\b/.test(t) && !/\bdebt/.test(t)) {
    const u = upcoming().slice(0, 4);
    if (!u.length) return { html: `<p>Nothing is due before your next two paydays. All caught up.</p>` };
    return { html: `<p>Next up:</p><ul>${u.map(b => `<li><b>${esc(b.name)}</b>, ${money(b.amount, true)}, ${esc(dueWhen(b.date).replace(/^\w/, c => c.toLowerCase()))}</li>`).join("")}</ul>`, acts: [["Open Calendar", "go:calendar"]] };
  }
  if (/\bsubscri/.test(t)) {
    const subs = S.bills.filter(b => b.kind === "sub"), m = sum(subs, perMonth);
    return { html: subs.length ? `<p>You have <b>${subs.length} ${subs.length === 1 ? "subscription" : "subscriptions"}</b> for <b>${money(m, true)} a month</b>. That's ${money(m * 12)} a year.</p>` : `<p>No subscriptions yet.</p>`, acts: [["Open Budget", "go:budget"]] };
  }
  if (/\b(spent|spend|spending)\b/.test(t) && !/\bcan i\b|\bleft\b/.test(t)) {
    const ch = nameHit(raw, S.cats, c => c.name);
    if (ch) { const r = plan(p0, "paycheck").cats.find(x => x.c.id === ch.x.id); return { html: `<p>You've spent <b>${money(r.spent, true)}</b> on ${esc(ch.x.name)} this paycheck${r.plan ? `, of ${money(r.plan)} planned. ${r.spent > r.plan ? "That's " + money(r.spent - r.plan, true) + " over." : money(r.plan - r.spent, true) + " left."}` : "."}</p>`, acts: [["See purchases", "cat:" + ch.x.id]] }; }
    return { html: `<p>You've spent <b>${money(c0.spent, true)}</b> this paycheck, since ${short(p0.start)}.</p>`, acts: [["Open Activity", "go:activity"]] };
  }
  if (/\b(goals?|sav(e|ed|ing|ings))\b/.test(t)) {
    if (!S.goals.length) return { html: `<p>No savings goals yet.</p>`, acts: [["Add a goal", "goal-new"]] };
    return { html: `<ul>${S.goals.map(g => { const s = goalSaved(g); return `<li><b>${esc(g.name)}</b>: ${money(s)} of ${money(g.target)}${s >= g.target ? ", reached" : ""}</li>`; }).join("")}</ul>` };
  }
  if (/\b(debts?|owe|balance|loans?|cards?)\b/.test(t)) {
    if (!S.debts.length) return { html: `<p>No debts listed.</p>` };
    return { html: `<ul>${S.debts.map(d => { const bal = Math.max(0, d.start - debtPaid(d)); return `<li><b>${esc(d.name)}</b>: ${bal > 0 ? money(bal) + " left" : "paid off"}</li>`; }).join("")}</ul>` };
  }
  const aff = t.match(/\bafford\b.*?\$?\s*(\d+(?:\.\d{1,2})?)/);
  if (aff) { const v = +aff[1]; return { html: v <= c0.left ? `<p>Yes. After ${money(v, true)} you'd still have <b>${money(c0.left - v, true)}</b> left until ${short(p0.next)}.</p>` : `<p>Not this paycheck. You have <b>${money(Math.max(0, c0.left), true)}</b> left, so it's ${money(v - Math.max(0, c0.left), true)} short.</p>` }; }
  if (/\b(left|remaining|how much|allowance|budget|can i spend|status|doing)\b/.test(t)) {
    if (c0.left < 0) return { html: `<p>You're <b>${money(-c0.left, true)} over</b> this paycheck. Payday is ${payTxt}.</p>`, acts: [["Open Budget", "go:budget"]] };
    return { html: `<p>You have <b>${money(c0.left, true)}</b> left to spend this paycheck. That's about <b>${money(c0.left / Math.max(1, toPay), true)} a day</b> until payday, ${payTxt}.</p>`, acts: [["Open Budget", "go:budget"]] };
  }
  return null;
}
let askLast = null, askPending = null;
function renderAsk() {
  const el = $("#askWrap"); if (!el) return;
  const g = S.goals.find(x => goalSaved(x) < x.target);
  const ex = ["Coffee 5.50", "How much is left?", g ? "Put 50 in " + g.name : "Gas 40 yesterday", "What's due soon?"];
  el.innerHTML = `<section class="qa" aria-labelledby="qaHd"><div class="qahd"><span class="qaic">${ICON.chat}</span><div><h2 id="qaHd">Quick add</h2><p>Type it like a text. I'll log it, update the date, or answer.</p></div></div>
    <form class="ask" id="askForm" role="search"><label class="sr" for="askIn">Quick add: type a purchase, a bill or a question</label><input id="askIn" type="text" enterkeyhint="go" autocomplete="off" placeholder="e.g. Coffee 5.50"><button type="submit" aria-label="Go">${ICON.send}</button></form>
    ${askLast ? "" : `<div class="ask-try">Try one</div><div class="ask-ex">${ex.map(x => `<button type="button" data-ask="${esc(x)}">${esc(x)}</button>`).join("")}</div>`}<div id="askOut">${askLast || ""}</div></section>`;
  $("#askForm").onsubmit = e => { e.preventDefault(); const i = $("#askIn"); runAsk(i.value); };
}
const got = pairs => `<div class="got">${pairs.filter(Boolean).map(([k, v]) => `<span><b>${k}</b>${v}</span>`).join("")}</div>`;
const SAVE_MSG = "<p>Here's what I got. Nothing is saved until you tap below.</p>";
function runAsk(raw, outEl) {
  raw = String(raw || "").trim().slice(0, 200); if (!raw) return;
  const t = raw.toLowerCase();
  const isQ = /\?\s*$/.test(t) || /^(when|what|whats|what's|how|hows|how's|which|where|show|list|tell me|any|am i|is (?:my|the|anything)|are (?:my|there|any)|do i|did i|can i|will)\b/.test(t);
  let html = "", acts = []; askPending = null;
  const it = isQ ? null : understand(raw);
  if (it) {
    askPending = it;
    const catName = id => esc((S.cats.find(c => c.id === id) || { name: "Other" }).name);
    if (it.type === "spend") { html = SAVE_MSG + got([["Spent", money(it.amount, true)], ["Category", catName(it.cat)], it.note && ["What", esc(it.note)], ["Date", fmtWhen(it.date)]]); acts = [["Save it", "save"], ["Edit first", "edit"]]; }
    else if (it.type === "income") { html = (it.plain ? `<p>Your regular pay is already counted on each payday. If this is extra money, add it as income.</p>` : SAVE_MSG) + got([["Income", money(it.amount, true)], ["From", esc(it.name)], ["Date", fmtWhen(it.date)]]); acts = [[it.plain ? "Add as extra income" : "Save it", "save"], ["Edit first", "edit"]]; }
    else if (it.type === "newbill") { html = SAVE_MSG + got([[it.kind === "sub" ? "Subscription" : "Bill", esc(it.name)], [it.every > 1 ? "Each time" : "Monthly", money(it.amount, true)], it.every > 1 && ["How often", EVERY[it.every]], [it.kind === "sub" ? "Renews" : "Due", it.every > 1 ? MON[it.mon] + " " + it.day : "the " + nth(it.day)]]) + (it.same ? `<p class="muted">You already have ${esc(it.same.name)}. I can update it or add a new one.</p>` : ""); acts = it.same ? [["Update " + it.same.name, "save"], ["Add a new one", "save-new"], ["Edit first", "edit"]] : [["Save it", "save"], ["Edit first", "edit"]]; }
    else if (it.type === "goal") { html = SAVE_MSG + got([["Set aside", money(it.amount, true)], ["For", esc(it.g.name)], ["Date", fmtWhen(it.date)]]); acts = [["Save it", "save"], ["Edit first", "edit"]]; }
    else if (it.type === "goal-pick") { html = `<p>Which goal gets ${money(it.amount, true)}?</p>`; acts = S.goals.map(g => [g.name, "goal:" + g.id]); }
    else if (it.type === "debt") { html = SAVE_MSG + got([["Payment", money(it.amount, true)], ["To", esc(it.d.name)], ["Date", fmtWhen(it.date)]]); acts = [["Save it", "save"], ["Edit first", "edit"]]; }
    else if (it.type === "billpaid") {
      if (it.occ) { html = SAVE_MSG + got([["Mark paid", esc(it.b.name)], ["Amount", money(it.b.amount, true)], ["Was due", fmtWhen(iso(it.occ.date))]]); acts = [["Mark it paid", "save"]]; }
      else { askPending = null; html = it.done ? `<p>${esc(it.b.name)} is already marked paid.</p>` : `<p>${esc(it.b.name)} isn't due before your next two paydays.</p>`; acts = [["Open Calendar", "go:calendar"]]; }
    }
  } else {
    const a = answer(raw);
    if (a) { html = a.html; acts = a.acts || []; }
    else html = `<p>I didn't catch that. Try one of these:</p><ul><li>“Groceries 82.40”</li><li>“Gas 40 yesterday”</li><li>“Phone bill 72 due the 9th”</li><li>“Car registration 120 yearly due March 15”</li><li>“Paid rent”</li>${S.goals[0] ? `<li>“Put 50 in ${esc(S.goals[0].name)}”</li>` : ""}<li>“How much is left?”</li></ul>`;
  }
  const out = `<div class="ask-out" role="status"><div class="q">“${esc(raw)}”</div>${html}<div class="acts">${acts.map(([l, a], i) => `<button type="button" class="btn ${i || !askPending ? "ghost" : "primary"} press" data-askact="${esc(a)}">${esc(l)}</button>`).join("")}<button type="button" class="btn ghost press" data-askact="clear">Clear</button></div></div>`;
  if (outEl) { outEl.innerHTML = out; return; }
  askLast = out; renderAsk(); $("#askIn").value = "";
}
/* save, then offer Undo in the toast */
function withUndo(msg, fn) {
  const snap = JSON.stringify(S);
  fn();
  save(); fmtCache = {}; render();
  toast(msg, () => { S = JSON.parse(snap); locateToday(); commit("Undone"); });
}
function askSave(it, asNew) {
  if (it.type === "spend") withUndo("Added " + money(it.amount, true), () => S.expenses.push({ id: uid(), amount: it.amount, cat: it.cat, note: it.note, date: it.date }));
  else if (it.type === "income") withUndo("Income saved", () => S.incomes.push({ id: uid(), name: it.name, amount: it.amount, date: it.date }));
  else if (it.type === "newbill") withUndo(it.kind === "sub" ? "Subscription saved" : "Bill saved", () => {
    const extra = it.every > 1 ? { every: it.every, mon: it.mon } : {};
    if (it.same && !asNew) { if (it.every === 1) { delete it.same.every; delete it.same.mon; } Object.assign(it.same, { amount: it.amount, day: it.day }, extra); }
    else S.bills.push({ id: uid(), name: it.name, amount: it.amount, day: it.day, kind: it.kind, group: it.kind === "sub" ? "wants" : "needs", ...extra });
  });
  else if (it.type === "goal") withUndo(money(it.amount) + " added to " + it.g.name, () => S.contrib.push({ id: uid(), goal: it.g.id, amount: it.amount, date: it.date }));
  else if (it.type === "debt") withUndo("Payment logged", () => S.payments.push({ id: uid(), debt: it.d.id, amount: it.amount, date: it.date }));
  else if (it.type === "billpaid" && it.occ) withUndo(it.b.name + " marked paid", () => { S.paid[it.occ.key] = true; });
}
function askEdit(it) {
  if (it.type === "spend") expenseForm(null, { amount: it.amount, cat: it.cat, note: it.note, date: it.date });
  else if (it.type === "income") incomeForm(null, { name: it.name, amount: it.amount, date: it.date });
  else if (it.type === "newbill") { if (it.same) billForm(it.same); else billForm(null, it.kind, it.day, { name: it.name, amount: it.amount, every: it.every, mon: it.mon }); }
  else if (it.type === "goal") { const g = it.g; quickAmount("Add to " + esc(g.name), "Amount to set aside", it.amount, v => { S.contrib.push({ id: uid(), goal: g.id, ...v }); toast(money(v.amount) + " added to " + g.name); }); }
  else if (it.type === "debt") { const d = it.d; quickAmount("Payment to " + esc(d.name), "Payment amount", it.amount, v => { S.payments.push({ id: uid(), debt: d.id, ...v }); toast("Payment logged"); }); }
}
document.addEventListener("click", e => {
  const ex = e.target.closest("[data-ask]"); if (ex) { runAsk(ex.dataset.ask); return; }
  const b = e.target.closest("[data-askact]"); if (!b) return;
  const a = b.dataset.askact, inl = b.closest(".ask-inline"), it = askPending;
  const done = () => { askPending = null; if (inl) { if (sheetClose) sheetClose(); } else { askLast = null; renderAsk(); } };
  if (a === "clear") { askPending = null; if (inl) inl.innerHTML = ""; else { askLast = null; renderAsk(); } }
  else if ((a === "save" || a === "save-new") && it) { askLast = null; askSave(it, a === "save-new"); done(); }
  else if (a === "edit" && it) { askLast = null; if (!inl) renderAsk(); askPending = null; askEdit(it); }
  else if (a.startsWith("goal:") && it && it.type === "goal-pick") { const g = S.goals.find(x => x.id === a.slice(5)); if (!g) return; askLast = null; askSave({ type: "goal", g, amount: it.amount, date: it.date }); done(); }
  else if (a.startsWith("go:")) { done(); go(a.slice(3)); }
  else if (a.startsWith("cat:")) { done(); actCat = a.slice(4); render(); go("activity"); }
  else if (a === "goal-new") { askPending = null; goalForm(); }
});
