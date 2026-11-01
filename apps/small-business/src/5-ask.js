
/* ---------- Quick add: plain words in, a filled-in form to check or an answer out.
   It runs on the phone with simple word matching. Nothing is sent anywhere. ---------- */
let askLast = null, askPending = null, pendingNewName = null;
const words = s => String(s || "").toLowerCase().split(/[^a-z0-9&']+/).filter(Boolean);
const NOT_NAME = new Set("paid pay got received from by for to the a an at on in job order appointment appt visit project invoice quote estimate bill gas fuel miles drove hours hrs today tomorrow yesterday this next last week month monday tuesday wednesday thursday friday saturday sunday am pm and with me my i".split(" "));
/* which client does the text mean: full name, last name or first name, best match wins */
function findClient(raw) {
  const t = " " + raw.toLowerCase() + " ", ws = new Set(words(raw));
  let best = null, top = 0, tie = false;
  S.clients.filter(c => !c.gone).forEach(c => {
    const n = c.name.toLowerCase(), parts = words(c.name), co = (c.company || "").toLowerCase();
    let sc = 0;
    if (n && t.includes(" " + n + " ")) sc = 10;
    else if (co && co.length > 2 && t.includes(co)) sc = 8;
    else sc = parts.filter(p => p.length > 1 && ws.has(p)).length * 3 + (co ? words(co).filter(p => p.length > 2 && !NOT_NAME.has(p) && ws.has(p)).length * 2 : 0);
    if (sc > top) { top = sc; best = c; tie = false; } else if (sc && sc === top) tie = true;
  });
  return top && !tie ? best : null;
}
/* a name that isn't a client yet: the capitalized words after by, from or for */
function guessName(raw) {
  const m = raw.match(/\b(?:by|from|for|with|to)\s+([A-Z][a-zA-Z'.-]+(?:\s+[A-Z][a-zA-Z'.-]+)?)/) || raw.match(/^([A-Z][a-zA-Z'.-]+(?:\s+[A-Z][a-zA-Z'.-]+)?)\s+(?:paid|sent)\b/);
  if (!m) return ""; const n = m[1].split(/\s+/).filter(w => !NOT_NAME.has(w.toLowerCase())).join(" "); return n;
}
const WDL = WD.map(x => x.toLowerCase());
const MI = w => MON.map(x => x.toLowerCase()).indexOf(String(w).slice(0, 3));
/* a day in plain words; future = jobs look ahead, otherwise look back */
function findDay(t, future) {
  if (/\btoday\b|\btonight\b|\bthis morning\b/.test(t)) return iso(TODAY);
  if (/\btomorrow\b/.test(t)) return T(1);
  if (/\byesterday\b/.test(t)) return T(-1);
  const wd = t.match(/\b(next |last |this |on )?(sun|mon|tues?|wed(?:nes)?|thu(?:rs?)?|fri|sat(?:ur)?)(?:day)?\b/);
  if (wd) { const i = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(wd[2].slice(0, 3)); if (i >= 0) {
    if (future) { let n = (i - TODAY.getDay() + 7) % 7; if (wd[1] === "next " && n === 0) n = 7; return T(n); }
    return T(-((TODAY.getDay() - i + 7) % 7)); } }
  const md = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.? (\d{1,2})(?:st|nd|rd|th)?(?:,? (\d{4}))?\b/);
  if (md) { let dt = new Date(md[3] ? +md[3] : TODAY.getFullYear(), MI(md[1]), +md[2], 12); if (!md[3]) { if (future && dt < TODAY) dt = addYears(dt, 1); if (!future && dt > TODAY) dt = addYears(dt, -1); } return iso(dt); }
  const sl = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (sl) { let y = sl[3] ? +sl[3] : TODAY.getFullYear(); if (y < 100) y += 2000; let dt = new Date(y, +sl[1] - 1, +sl[2], 12); if (dt.getMonth() !== +sl[1] - 1) return null; if (!sl[3]) { if (future && dt < TODAY) dt = addYears(dt, 1); if (!future && dt > TODAY) dt = addYears(dt, -1); } return iso(dt); }
  return null;
}
function findTime(t) {
  const m = t.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)\b/) || t.match(/\bat\s+(\d{1,2}):(\d{2})\b/) || t.match(/\b(noon)\b/);
  if (!m) return "";
  if (m[1] === "noon") return "12:00";
  let h = +m[1]; const mm = +(m[2] || 0), ap = (m[3] || "").replace(/\./g, "");
  if (ap === "pm" && h < 12) h += 12; if (ap === "am" && h === 12) h = 0;
  if (!ap && h < 7) h += 12;
  if (h > 23 || mm > 59) return "";
  return String(h).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
}
/* the money in a sentence, ignoring times, dates, miles and hours */
function findAmount(t) {
  const s = t.replace(/\b\d{1,2}(:\d{2})?\s*(am|pm|a\.m\.|p\.m\.)/g, " ").replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, " ")
    .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.? \d{1,2}(st|nd|rd|th)?\b/g, " ")
    .replace(/\d+(\.\d+)?\s*(mi|miles?|h|hrs?|hours?|min|mins|minutes)\b/g, " ").replace(/#\s*\d+/g, " ").replace(/\b(19|20)\d\d\b/g, " ");
  const m = s.match(/\$\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?/) || s.match(/\b(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?\b/);
  if (!m) return 0; const v = parseFloat(m[1].replace(/,/g, "") + (m[2] ? "." + m[2] : "")); return v > 0 && v < 1e7 ? r2(v) : 0;
}
const NUMW = { half: .5, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const tidy = s => String(s || "").replace(/\s+/g, " ").trim().replace(/^\w/, c => c.toUpperCase());
const got = rows => `<div class="got">${rows.filter(r => r[1] !== "" && r[1] != null).map(([k, v]) => `<span><b>${esc(k)}</b>${esc(v)}</span>`).join("")}</div>`;
const who = (c, n) => c ? c.name : n ? n + " (new)" : "";

function understand(raw) {
  let t = " " + raw.toLowerCase().replace(/[“”]/g, '"') + " ";
  t = t.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten) and a half\b/g, (m, w) => String(NUMW[w] + .5)).replace(/\b(an|one|a) hour and a half\b/g, "1.5 hours").replace(/\bhalf an hour\b/g, "0.5 hours").replace(/\ban hour\b/g, "1 hour")
    .replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b(?= ?(h|hrs?|hours?|miles?|mi)\b)/g, w => NUMW[w]);
  const c = findClient(raw), nn = c ? "" : guessName(raw), amt = findAmount(t);
  /* to-do */
  const td = raw.match(/^(?:remind me to|reminder to|to ?do:?|add (?:a )?to-?do:?|i need to)\s+(.+)$/i);
  if (td) { let text = td[1], due = "";
    /* a day at the end ("Friday", "by tomorrow", "on Nov 3") becomes the due date */
    const m = text.match(/\s+(?:(?:by|before|on|due)\s+)?((?:next |this )?(?:today|tonight|tomorrow|(?:sun|mon|tues?|wed(?:nes)?|thu(?:rs?)?|fri|sat(?:ur)?)(?:day)?|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.? \d{1,2}(?:st|nd|rd|th)?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?))[.!]?\s*$/i);
    if (m) { const d = findDay(" " + m[1].toLowerCase() + " ", true); if (d) { due = d; text = text.slice(0, m.index); } }
    return { type: "todo", text: tidy(text), due }; }
  /* quote or invoice */
  const dm = t.match(/^\s*(invoice|bill|quote|estimate)\b/);
  if (dm && !/\b(paid|due|owe|late)\b/.test(t)) {
    const kind = /quote|estimate/.test(dm[1]) ? "quote" : "invoice";
    let desc = raw.replace(/^\s*(invoice|bill|quote|estimate)\s+(for\s+)?/i, "");
    if (c) desc = desc.replace(new RegExp("\\b" + c.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i"), "").replace(new RegExp("\\b(" + words(c.name).concat(words(c.company || "")).join("|") + ")\\b", "ig"), "");
    else if (nn) desc = desc.replace(nn, "");
    desc = tidy(desc.replace(/\$?\s*\d[\d,]*(\.\d+)?/, "").replace(/^\s*(for|to)\s+/i, "").replace(/\s+(for|to)\s*$/i, ""));
    const svc = P.services.find(s => desc && s[0].toLowerCase().includes(desc.toLowerCase().split(" ")[0]));
    return { type: kind, c, nn, items: [{ desc: desc || (svc ? svc[0] : ""), qty: 1, rate: amt || (svc ? svc[1] : "") }] };
  }
  /* payment */
  if (/\b(paid|got paid|received|got \$?\d|collected|deposit(ed)?|venmo(ed)?|zelle(d)?)\b/.test(t) && amt && !/\b(i paid|paid for|paid the|paid my)\b/.test(t)) {
    const method = /venmo|zelle|cash ?app|paypal/.test(t) ? "App" : /\bcash\b/.test(t) ? "Cash" : /\bcheck\b/.test(t) ? "Check" : /\bcard\b/.test(t) ? "Card" : "";
    const inv = c ? owedList().filter(x => x.clientId === c.id).sort((a, b) => Math.abs(totals(a).due - amt) - Math.abs(totals(b).due - amt))[0] : null;
    return { type: "pay", c, nn, amount: amt, inv, date: findDay(t, false) || iso(TODAY), method };
  }
  /* trip */
  const mi = t.match(/(\d+(?:\.\d+)?)\s*(?:mi|miles?)\b/);
  if (mi) { const pur = raw.match(/\b(?:to|for)\s+(?:the\s+)?(.+?)(?:\s+(?:today|yesterday|on|and back|round trip)\b|$)/i);
    return { type: "trip", miles: r2(+mi[1]), round: /round ?trip|and back/.test(t), purpose: pur ? tidy(pur[1]) : "", c, date: findDay(t, false) || iso(TODAY) }; }
  /* job */
  const jobRx = new RegExp("\\b(job|appointment|appt|order|visit|book|booked|project|session|" + P.job + ")\\b");
  const tm = findTime(t), day = findDay(t, true);
  if (jobRx.test(t) && (day || tm) || (tm && day && (c || nn))) {
    let title = raw.replace(/\b(book|booked|new)\b/ig, "").replace(new RegExp("\\b(job|appointment|appt|order|visit|session|project)\\b\\s*(for|with)?", "i"), "");
    title = title.replace(/\b(today|tomorrow|tonight|next|this|on|at)\b.*$/i, "").replace(/\b(sun|mon|tues?|wed(nes)?|thu(rs?)?|fri|sat(ur)?)(day)?\b.*$/i, "");
    if (c) words(c.name).forEach(w => { title = title.replace(new RegExp("\\b" + w + "\\b", "ig"), ""); }); else if (nn) title = title.replace(nn, "");
    title = tidy(title.replace(/\$?\s*\d[\d,]*(\.\d+)?/, "").replace(/^\s*(for|with)\s+|\s+(for|with)\s*$/ig, ""));
    const svc = P.services.find(s => title && s[0].toLowerCase().includes(title.toLowerCase()));
    return { type: "job", c, nn, date: day || iso(TODAY), time: tm, title: svc ? svc[0] : title, price: amt || (svc ? svc[1] : "") };
  }
  /* time worked */
  const hm = t.match(/(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)\b/), mm = t.match(/(\d+)\s*(?:min|mins|minutes)\b/);
  if ((hm || mm) && !/\?/.test(t)) { const h = r2((hm ? +hm[1] : 0) + (mm ? +mm[1] / 60 : 0)); const note = raw.replace(/\d+(\.\d+)?\s*(h|hrs?|hours?|min|mins|minutes)\b/ig, "").replace(/\b(for|on)\s*$/i, "");
    let n2 = note; if (c) words(c.name).concat(words(c.company || "")).forEach(w => { n2 = n2.replace(new RegExp("\\b" + w + "\\b", "ig"), ""); });
    return { type: "time", hours: h, c, nn, note: tidy(n2.replace(/\b(for|on|today|yesterday)\b/ig, " ")), date: findDay(t, false) || iso(TODAY) }; }
  /* expense: anything with money left over */
  if (amt && !/\?\s*$/.test(t)) {
    const at = raw.match(/\b(?:at|from)\s+([A-Za-z0-9][A-Za-z0-9&' .-]{1,40}?)(?:\s+(?:today|yesterday|on|for)\b|[,.]|$)/i);
    let what = raw.replace(/\b(?:at|from)\s+.+$/i, "").replace(/\$?\s*\d[\d,]*(\.\d+)?/, "").replace(/\b(spent|bought|paid for|i paid|paid|today|yesterday|on|for)\b/ig, " ");
    what = tidy(what);
    const vendor = at ? tidy(at[1]) : "", cat = guessCat(raw) || "";
    return { type: "exp", amount: amt, vendor: vendor || what, note: vendor ? what : "", cat, date: findDay(t, false) || iso(TODAY) };
  }
  return null;
}

/* questions about the business, answered from what's on the phone */
function answer(raw) {
  const t = " " + raw.toLowerCase() + " ";
  const per = /\bweek\b/.test(t) ? "week" : /\bquarter\b/.test(t) ? "quarter" : /\byear\b|\bso far\b/.test(t) ? "year" : "month";
  const last = /\blast (week|month|quarter|year)\b/.test(t);
  const p = last ? (per === "week" ? { a: iso(addDays(D(period("week").a), -7)), b: iso(addDays(D(period("week").a), -1)), label: "Last week" } : per === "month" ? period("month", addMonths(TODAY, -1)) : per === "quarter" ? period("quarter", addMonths(TODAY, -3)) : period("year", addYears(TODAY, -1))) : period(per);
  const lbl = last ? p.label : per === "week" ? "this week" : per === "month" ? "in " + p.label : per === "quarter" ? "in " + p.label : "in " + p.label;
  if (/\b(owe|owes|owed|unpaid|outstanding|overdue|late)\b/.test(t)) {
    const o = owedList(), late = overdueList();
    if (!o.length) return { html: `<p><b>Nobody owes you right now.</b> Every sent invoice is paid.</p>` };
    return { html: `<p><b>${money(sum(o, x => totals(x).due))} is owed to you</b> on ${pl(o.length, "invoice")}${late.length ? `, ${late.length} late` : ""}.</p><ul>${o.slice(0, 5).map(x => `<li>${esc(clientName(x.clientId))}: ${money(totals(x).due)}${x.due && inDays(x.due) < 0 ? `, ${Math.abs(inDays(x.due))} days late` : x.due ? ", due " + shortD(x.due) : ""}</li>`).join("")}</ul>`, acts: late.length ? [["Draft a reminder", "remind:" + late[0].id], ["See invoices", "go-money"]] : [["See invoices", "go-money"]] };
  }
  if (/\b(tax|taxes|set aside|irs)\b/.test(t)) {
    const x = taxNow();
    return { html: `<p><b>Set aside about ${money(x.yr.set)}</b> for ${x.y} so far. That's ${Math.round(pctOf() * 100)}% of ${money(x.yr.base)} profit after mileage.${x.paid ? ` You've logged ${money(x.paid)} in payments.` : ""}</p>${x.next ? `<p>Next payment: ${longD(x.next.due)}, about ${money(x.next.set)}.</p>` : ""}<p class="muted">An estimate to help you save. Not tax advice.</p>`, acts: [["See the details", "tax-open"]] };
  }
  if (/\b(best|top|biggest)\b.*\b(client|customer|customers|clients)\b|\bwho pays\b/.test(t)) {
    const yp = /\bmonth\b/.test(t) ? period("month") : period("year"), b = bestClients(yp.a, yp.b).slice(0, 5);
    return { html: b.length ? `<p><b>Your best ${esc(P.clients)} ${/\bmonth\b/.test(t) ? "this month" : "in " + yp.label}:</b></p><ul>${b.map(r => `<li>${esc(r.c.name)}: ${money(r.v)}</li>`).join("")}</ul>` : `<p>No payments logged ${/\bmonth\b/.test(t) ? "this month" : "this year"} yet.</p>` };
  }
  if (/\b(next|today|tomorrow|schedule|coming up|booked|this week's)\b/.test(t) && !/\b(make|made|earn|profit|spend|spent)\b/.test(t)) {
    const day = /\btomorrow\b/.test(t) ? T(1) : /\btoday\b/.test(t) ? iso(TODAY) : null, up = upcomingJobs().filter(j => !day || j.date === day).slice(0, 5);
    return { html: up.length ? `<p><b>${day ? (day === iso(TODAY) ? "Today" : "Tomorrow") + ": " + pl(up.length, P.job, P.jobs) : "Coming up"}</b></p><ul>${up.map(j => `<li>${day ? "" : WD[D(j.date).getDay()].slice(0, 3) + " " + short(D(j.date)) + ", "}${j.time ? clock(j.time) + ", " : ""}${esc(j.title)}${clientName(j.clientId) ? " for " + esc(clientName(j.clientId)) : ""}</li>`).join("")}</ul>` : `<p>Nothing booked ${day === T(1) ? "tomorrow" : day ? "today" : "yet"}.</p>`, acts: [["Open the calendar", "go-cal"]] };
  }
  if (/\b(mile|miles|mileage|drove)\b/.test(t)) {
    const y = per === "month" && !/\bmonth\b/.test(t) ? period("year") : p;
    return { html: `<p><b>${num(milesIn(y.a, y.b))} miles</b> ${y === p ? lbl : "in " + y.label}, worth about ${money(mileDed(y.a, y.b))} off your taxable profit.</p>` };
  }
  if (/\b(spend|spent|spending|expenses|cost)\b/.test(t)) {
    const cat = P.cats.find(id => (CAT[id][1] && CAT[id][1].test(t)) || t.includes(catName(id).toLowerCase()));
    return { html: `<p><b>${money(spentIn(p.a, p.b, cat))}</b> spent${cat ? " on " + esc(catName(cat).toLowerCase()) : ""} ${esc(lbl)}.</p>`, acts: [["See spending", "go-spend"]] };
  }
  if (/\b(budget|left to spend)\b/.test(t)) {
    const b = budgetNow(); return { html: b.plan ? `<p><b>${b.left >= 0 ? money(b.left) + " left" : money(-b.left) + " over"}</b> in your ${MONTHS[TODAY.getMonth()]} budget. ${money(b.spent)} spent of ${money(b.plan)}.</p>` : `<p>You haven't set a budget yet.</p>`, acts: [["Open the budget", "go-budget"]] };
  }
  if (/\b(profit|make|made|earn|earned|income|money in|bring in|brought in|net)\b/.test(t)) {
    const pr = profitOf(p.a, p.b);
    return { html: `<p><b>${money(pr.net)} profit</b> ${esc(lbl)}: ${money(pr.inc)} came in and ${money(pr.out)} went out.</p>` };
  }
  if (/\b(hours|time)\b/.test(t)) {
    const mins = sum(S.time.filter(x => inRange(x.date, p.a, p.b)), x => x.mins) + (per === "week" && !last ? timerMins() : 0);
    return { html: `<p><b>${num(hrsOf(mins))} hours</b> ${esc(lbl)}.</p>`, acts: [["See the time log", "go-time"]] };
  }
  return null;
}

function renderAsk() {
  $("#askWrap").innerHTML = `<section class="qa" aria-label="Quick add">
    <form class="ask" id="askForm" role="search"><span class="lead">${ICON.plus}</span><label class="sr" for="askIn">Quick add: a payment, an expense, a ${esc(P.job)} or a question</label><input id="askIn" type="text" enterkeyhint="go" autocomplete="off" placeholder="Quick Add"><button type="submit" aria-label="Go">${ICON.send}</button></form>
    ${askLast ? "" : `<div class="ask-ex">${P.ask.slice(1).map(x => `<button type="button" data-ask="${esc(x)}">${esc(x)}</button>`).join("")}</div>`}<div id="askOut">${askLast || ""}</div></section>`;
  $("#askForm").onsubmit = e => { e.preventDefault(); runAsk($("#askIn").value); };
}
function runAsk(raw, outEl) {
  raw = String(raw || "").trim().slice(0, 300); if (!raw) return;
  const t = raw.toLowerCase();
  const isQ = /\?\s*$/.test(t) || /^(when|what|whats|what's|how|which|where|who|show|list|tell me|any|am i|is (?:my|the|anything)|are (?:my|there|any)|do i|does|did i|will|whos|who's)\b/.test(t);
  let html = "", acts = [];
  const u = isQ ? null : understand(raw);
  const lead = `<p>Not saved yet. Check it first.</p>`;
  askPending = u;
  if (u && u.type === "todo") { html = lead + got([["To-do", u.text], ["By", u.due ? longD(u.due) : ""]]); acts = [["Review and save", "ask-go"]]; }
  else if (u && (u.type === "invoice" || u.type === "quote")) { html = lead + got([[u.type === "quote" ? "New quote" : "New invoice", who(u.c, u.nn) || "Pick a " + P.client], ["For", u.items[0].desc], ["Amount", u.items[0].rate ? money(u.items[0].rate) : ""]]); acts = [["Review and save", "ask-go"]]; }
  else if (u && u.type === "pay") { html = lead + got([["Payment", money(u.amount)], ["From", who(u.c, u.nn)], ["For", u.inv ? "Invoice " + docNum(u.inv) + " (" + money(totals(u.inv).due) + " owed)" : ""], ["Date", u.date !== iso(TODAY) ? longD(u.date) : ""], ["How", u.method]]) + (u.c && !u.inv ? `<p class="muted">${esc(u.c.name)} has no open invoice, so it's logged on its own.</p>` : ""); acts = [["Review and save", "ask-go"]]; }
  else if (u && u.type === "trip") { const mi = u.round ? u.miles * 2 : u.miles; html = lead + got([["Trip", num(mi) + " miles"], ["Why", u.purpose], ["Date", longD(u.date)], ["Worth", "about " + money(mi * mileRate(u.date))]]); acts = [["Review and save", "ask-go"]]; }
  else if (u && u.type === "job") { html = lead + got([[Wd(P.job, 1), u.title], ["For", who(u.c, u.nn)], ["Day", WD[D(u.date).getDay()] + ", " + longD(u.date)], ["Time", u.time ? clock(u.time) : ""], ["Price", u.price ? money(u.price) : ""]]); acts = [["Review and save", "ask-go"]]; }
  else if (u && u.type === "time") { html = lead + got([["Time", minsToHM(u.hours * 60)], ["For", who(u.c, u.nn)], ["On", u.note], ["Date", longD(u.date)]]); acts = [["Review and save", "ask-go"]]; }
  else if (u && u.type === "exp") { html = lead + got([["Expense", money(u.amount)], ["Where", u.vendor], ["Category", catName(u.cat || P.cats[0])], ["Date", u.date !== iso(TODAY) ? longD(u.date) : ""]]); acts = [["Review and save", "ask-go"]]; }
  else {
    askPending = null;
    const a = answer(raw);
    if (a) { html = a.html; acts = a.acts || []; }
    else html = `<p>Try it like one of these:</p><ul><li>“Paid by Jen 350”</li><li>“Gas 48” or “$85 supplies at Home Depot”</li><li>“Drove 26 miles to the Parks job”</li><li>“${esc(Wd(P.job, 1))} for Dan Friday 9am”</li><li>“Invoice Northwind 1200 brand guide”</li><li>“Who owes me?” or “Profit this month?”</li><li>“Remind me to renew my license by Dec 1”</li></ul>`;
  }
  const out = `<div class="ask-out" role="status"><div class="q">“${esc(raw)}”</div>${html}<div class="acts">${acts.map(([l, a], i) => `<button type="button" class="btn ${i ? "ghost" : "primary"} press" data-askact="${esc(a)}">${esc(tc(l))}</button>`).join("")}<button type="button" class="btn ghost press" data-askact="clear">Clear</button></div></div>`;
  if (outEl) { outEl.innerHTML = out; return; }
  askLast = out; renderAsk(); $("#askIn").value = "";
}
/* opens the right form, filled in */
function askOpen(u) {
  const cid = u.c ? u.c.id : u.nn ? "__new" : "";
  if (u.nn && !u.c) pendingNewName = u.nn;
  if (u.type === "todo") todoForm(null, { text: u.text, due: u.due, ask: 1 });
  else if (u.type === "invoice" || u.type === "quote") docForm(u.type, null, { clientId: cid, items: u.items, ask: 1 });
  else if (u.type === "pay") payForm(null, { clientId: cid, amount: u.amount, invId: u.inv ? u.inv.id : "", date: u.date, method: u.method, ask: 1 });
  else if (u.type === "trip") tripForm(null, { miles: u.round ? u.miles * 2 : u.miles, purpose: u.purpose, clientId: u.c ? u.c.id : "", date: u.date, ask: 1 });
  else if (u.type === "job") jobForm(null, { clientId: cid, date: u.date, time: u.time, title: u.title, price: u.price, ask: 1 });
  else if (u.type === "time") timeForm(null, { clientId: cid, mins: Math.round(u.hours * 60), note: u.note, date: u.date, ask: 1 });
  else if (u.type === "exp") expenseForm(null, { amount: u.amount, vendor: u.vendor, note: u.note, cat: u.cat, date: u.date, ask: 1 });
}
document.addEventListener("click", e => {
  const ex = e.target.closest("[data-ask]"); if (ex) { runAsk(ex.dataset.ask); return; }
  const b = e.target.closest("[data-askact]"); if (!b) return;
  const a = b.dataset.askact, inl = b.closest(".ask-inline");
  if (a === "clear") { askPending = null; if (inl) { inl.innerHTML = ""; return; } askLast = null; renderAsk(); return; }
  if (a === "ask-go" && askPending) { askOpen(askPending); return; }
  const nav = () => { if (inl && sheetClose) sheetClose(true); };
  if (a === "go-money") { nav(); go("money"); pageGo("money", 0); }
  else if (a === "go-spend") { nav(); go("money"); pageGo("money", 1); }
  else if (a === "go-budget") { nav(); go("money"); pageGo("money", 2); }
  else if (a === "go-cal") { nav(); go("cal"); pageGo("cal", 0); }
  else if (a === "go-time") { nav(); go("cal"); pageGo("cal", 1); }
  else if (a === "tax-open") taxSheet();
  else if (a.startsWith("remind:")) { const x = S.invoices.find(y => y.id === a.slice(7)); if (x) remindSheet(x); }
});
