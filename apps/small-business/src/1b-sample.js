
/* ---------- example businesses, one per type. Every name, number and address here is made up. ---------- */
const VENDORS = { materials: ["Ferguson", "Home Depot", "Lowe's", "City Supply"], fuel: ["Speedway", "Shell", "Marathon"], tools: ["Harbor Freight", "Home Depot", "Amazon"], vehicle: ["Valvoline", "Discount Tire"],
  helpers: ["Helper", "Sub crew"], insurance: ["Liability insurance"], permits: ["City permit office"], phone: ["Verizon", "QuickBooks", "Google Workspace"], ads: ["Facebook ads", "Print shop"], fees: ["Card reader fees"],
  supplies: ["Target", "Costco", "Sam's Club"], products: ["Sally Beauty", "SalonCentric"], rent: ["Suite rent"], education: ["Online class"], laundry: ["Laundromat"], office: ["Staples"], travel: ["Parking", "Lunch with client"],
  ingredients: ["Costco", "Restaurant Depot", "Kroger"], packaging: ["Uline", "Amazon"], shipping: ["USPS", "Pirate Ship"], inventory: ["Wholesale supplier", "Craft store"], booth: ["Saturday market", "Holiday craft fair"], other: ["Misc"] };
const SPEC = {
  trades: { owner: "Alex Rivera", biz: "Rivera Plumbing & Repair", street: "418 Elm Street", city: "Dayton", state: "OH", zip: "45402", inv: true, perWeek: 4, miles: [6, 28], timeOn: false,
    pay: "Check, cash, Venmo or Zelle. Make checks to Rivera Plumbing & Repair.",
    clients: [["Jen Parks", "", "122 Maple Ave", "Kettering", "Kitchen remodel last spring. Dog in the backyard, use the side gate."], ["Dan Okafor", "Okafor Rentals", "9 Brown St", "Dayton", "Owns 6 rentals. Bills go to the office email. Net 30."], ["Maria Lopez", "", "77 Sunset Dr", "Centerville", "Prefers texts. Water heater is 12 years old."], ["Sam Whitfield", "", "310 Oak Ln", "Oakwood", ""], ["Priya Shah", "Shah Dental", "1500 Far Hills Ave", "Oakwood", "Office plumbing. After 5 PM only."], ["Tom Becker", "", "54 Cedar Ct", "Beavercreek", "Referred by Jen."], ["Lena Kim", "", "88 River Rd", "Dayton", ""]],
    jobs: [["Leaky faucet repair", 0, 1, 1.5], ["Drain cleaning", 2], ["Water heater install", 3], ["Toilet rebuild", 0, 1, 2], ["Garbage disposal swap", 0, 1, 2.5], ["Sump pump check", 0]],
    bills: [["Truck insurance", 690, "half", "insurance"], ["General liability", 1140, "year", "insurance"], ["Phone plan", 85, "month", "phone"], ["QuickBooks", 35, "month", "phone"], ["Plumbing license renewal", 120, "year", "permits"]] },
  beauty: { owner: "Jordan Ellis", biz: "Studio Ellis Hair", street: "220 Main St", apt: "Suite 4", city: "Columbus", state: "OH", zip: "43215", inv: false, perWeek: 14, miles: [0, 0], timeOn: false,
    pay: "Cash, card or Venmo @Example-Salon-Pay. 24-hour cancel policy.",
    clients: [["Maya Brooks", "", "", "Columbus", "Balayage every 10 weeks. Likes a warm tone."], ["Jen Carter", "", "", "Bexley", "Cut every 6 weeks. Sensitive scalp."], ["Ashley Nguyen", "", "", "Columbus", "Lash fills every 3 weeks."], ["Rob Martinez", "", "", "Upper Arlington", "Fade, #2 on sides."], ["Tessa Hall", "", "", "Columbus", "Wedding party in June."], ["Nora Price", "", "", "Worthington", "Gray coverage, 6N + 20 vol."], ["Chris Dunn", "", "", "Columbus", ""]],
    jobs: [["Women's cut and style", 0], ["Men's cut", 1], ["All-over color", 2], ["Highlights", 3], ["Blowout", 4], ["Lash fill", 5]],
    bills: [["Suite rent", 900, "month", "rent"], ["Booking app", 35, "month", "phone"], ["Liability insurance", 420, "year", "insurance"], ["Cosmetology license", 60, "year", "education"]] },
  creative: { owner: "Sam Patel", biz: "Patel Studio", street: "45 Water St", apt: "Unit 3B", city: "Cincinnati", state: "OH", zip: "45202", inv: true, perWeek: 1.2, miles: [4, 18], timeOn: true,
    pay: "Bank transfer or check within 15 days. Thank you!",
    clients: [["Northwind Coffee", "Northwind Coffee Co.", "12 Vine St", "Cincinnati", "Brand refresh. Contact: Erin, marketing lead."], ["Lakeside Yoga", "", "300 Lake Dr", "Covington", "Monthly social graphics."], ["Greenfield Law", "Greenfield & Ross", "800 Main St", "Cincinnati", "Website pages. Net 30, slow payer."], ["Ivy Bakes", "", "19 Pike St", "Newport", "Logo + menu boards."], ["Marcus Lee", "", "61 Hill Ave", "Cincinnati", "Headshots."], ["Bluebird Realty", "", "5 Court St", "Cincinnati", "Listing photos."]],
    jobs: [["Brand guide", 2], ["Logo package", 1], ["Photo session", 3], ["Website page", 4], ["Design work", 0, 1, 6]],
    bills: [["Adobe Creative Cloud", 59.99, "month", "phone"], ["Website hosting", 192, "year", "phone"], ["Laptop insurance", 120, "year", "insurance"], ["Coworking day pass", 75, "month", "office"]] },
  food: { owner: "Rosa Diaz", biz: "Sweet Rosa Bakery", street: "1730 Lincoln Way", city: "Toledo", state: "OH", zip: "43604", inv: true, perWeek: 5, miles: [3, 16], timeOn: false,
    pay: "Half down to book, rest at pickup. Cash, Venmo or Zelle.",
    clients: [["Maya Green", "", "40 Pine St", "Toledo", "Nut allergy in the family. Always nut-free."], ["Hope Church", "Hope Community Church", "200 Grace Ave", "Sylvania", "Monthly coffee hour trays."], ["Dana Wells", "", "12 Park Pl", "Perrysburg", "Daughter's birthday every May."], ["Harbor Office", "Harbor Insurance", "500 Front St", "Toledo", "Friday staff treats. Net 15."], ["Luis Ortega", "", "8 Bay Rd", "Maumee", ""], ["Kim Tran", "", "77 Oak St", "Toledo", "Wedding cake tasting in spring."]],
    jobs: [["Dozen cupcakes", 0, 2], ["Custom cake, 8 inch", 1], ["Catering, per guest", 2, 40], ["Cookie tray", 3, 2]],
    bills: [["Kitchen rent", 400, "month", "rent"], ["Food license", 150, "year", "permits"], ["Market season fee", 240, "quarter", "booth"], ["Liability insurance", 380, "year", "other"]] },
  retail: { owner: "Casey Morgan", biz: "Juniper & Wick Candle Co.", street: "61 Market St", city: "Akron", state: "OH", zip: "44308", inv: false, perWeek: 9, miles: [0, 0], timeOn: false,
    pay: "Thank you for shopping small. Questions? Text us anytime.",
    clients: [["Willow Gift Shop", "Willow Gift Shop", "14 Main St", "Hudson", "Wholesale, 2 cases a month. Net 30."], ["Maya Rivers", "", "", "Akron", "Buys every scent drop."], ["Jen Holt", "", "", "Cuyahoga Falls", "Holiday gift sets for her office."], ["Corner Cafe", "Corner Cafe", "3 Elm St", "Akron", "Candles on the counter on consignment."], ["Ben Ford", "", "", "Akron", ""], ["Online orders", "", "", "", "Etsy and website orders, all in one."]],
    jobs: [["Candle, 8 oz", 1, 3], ["Gift set", 2], ["Custom order", 0], ["Wholesale case", 3]],
    bills: [["Etsy plus", 10, "month", "fees"], ["Website plan", 29, "month", "phone"], ["Holiday market booth", 225, "year", "booth"], ["Product insurance", 300, "year", "other"]] },
  cleaning: { owner: "Taylor Brooks", biz: "Brightside Home Care", street: "902 Park Ave", city: "Cleveland", state: "OH", zip: "44113", inv: true, perWeek: 9, miles: [5, 22], timeOn: false,
    pay: "Venmo @Example-Cleaning-Pay or check. Invoices are due in 7 days.",
    clients: [["Jen Walsh", "", "18 Rose Ln", "Lakewood", "Every other Tuesday. Key under the gray pot."], ["Dan Fisher", "", "450 Elm Ave", "Shaker Heights", "Lawn weekly, Apr to Nov."], ["Maria Costa", "", "32 Lake Rd", "Rocky River", "Deep clean monthly. Two cats."], ["Oak Street Rentals", "Oak Street Rentals", "77 Oak St", "Cleveland", "Move-out cleans. Net 15."], ["Grace Liu", "", "5 Birch Ct", "Westlake", "Fragrance-free products only."], ["Pete Novak", "", "210 Hill Dr", "Parma", "Leaf cleanup each fall."], ["Ann Rossi", "", "64 Vine St", "Lakewood", ""]],
    jobs: [["Standard clean", 0], ["Deep clean", 1], ["Move-out clean", 2], ["Mow and trim", 3], ["Leaf cleanup", 4]],
    bills: [["Van insurance", 640, "half", "insurance"], ["Phone plan", 45, "month", "phone"], ["Liability and bond", 520, "year", "insurance"], ["Booking app", 29, "month", "phone"]] }
};
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function sample(type) {
  type = own(PACKS, type) ? type : "trades";
  P = PACKS[type];
  const sp = SPEC[type], R = rng(type.length * 7919 + 17), pick = a => a[Math.floor(R() * a.length)], between = (a, b) => a + R() * (b - a);
  const s = blank(); s.sample = true;
  s.profile = Object.assign(s.profile, { owner: sp.owner, biz: sp.biz, type, phone: "(555) 010-" + (2000 + type.length * 37), email: "hello@example.com", street: sp.street, apt: sp.apt || "", city: sp.city, state: sp.state, zip: sp.zip, payNote: sp.pay, terms: type === "cleaning" ? 7 : type === "creative" ? 15 : 14, setAside: P.setAside });
  sp.clients.forEach(([name, company, street, city, notes], i) => s.clients.push({ id: "c" + i + uid(), name, company, phone: "(555) 010-" + String(1100 + i * 13).slice(-4), email: name.split(" ")[0].toLowerCase() + "@example.com", street, apt: "", city, state: city ? sp.state : "", zip: "", notes, created: T(-300 + i * 20) }));
  const weightClient = () => { const r = R(); return s.clients[Math.min(s.clients.length - 1, Math.floor(r * r * s.clients.length))]; };
  let inv = 1001, q = 101;
  const mkItems = jt => { const sv = P.services[jt[1]], qty = jt[2] || 1; return [{ desc: jt[0] === sv[0] ? sv[0] : jt[0], qty: jt[3] || qty, rate: jt[3] ? P.services[1][1] : sv[1] }].concat(type === "trades" && R() < .5 ? [{ desc: "Parts and materials", qty: 1, rate: Math.round(between(30, 180)) }] : []); };
  /* the last 300 days of work */
  for (let d = -300; d <= -1; d++) {
    const dt = addDays(TODAY, d); if (dt.getDay() === 0 && type !== "food") continue;
    const n = sp.perWeek / 6; let k = Math.floor(n) + (R() < n % 1 ? 1 : 0);
    while (k-- > 0) {
      const c = weightClient(), jt = pick(sp.jobs), items = mkItems(jt), total = sum(items, lineTotal), hr = 8 + Math.floor(R() * 9);
      const job = { id: uid(), clientId: c.id, title: jt[0], date: iso(dt), time: String(hr).padStart(2, "0") + ":00", dur: type === "beauty" ? 60 : 120, price: total, status: "done", notes: "" };
      s.jobs.push(job);
      if (sp.inv) {
        const x = { id: uid(), kind: "invoice", num: inv++, clientId: c.id, date: iso(dt), due: iso(addDays(dt, s.profile.terms)), items, taxPct: 0, discount: 0, notes: "", status: "sent", jobId: job.id };
        s.invoices.push(x); job.invId = x.id;
        const late = d > -40 && R() < .45, payDay = Math.min(-1, d + Math.floor(between(1, s.profile.terms + 6)));
        if (!late) s.payments.push({ id: uid(), date: T(payDay), amount: total, clientId: c.id, invId: x.id, method: pick(["Check", "Venmo", "Zelle", "Cash"]) });
      } else s.payments.push({ id: uid(), date: iso(dt), amount: total + (type === "beauty" ? Math.round(total * .0) : 0), clientId: c.id, method: pick(["Card", "Cash", "Venmo"]) });
      if (sp.miles[1]) s.trips.push({ id: uid(), date: iso(dt), miles: Math.round(between(sp.miles[0], sp.miles[1])), from: "Shop", to: c.city || "Client", purpose: jt[0] + " for " + c.name, clientId: c.id });
    }
  }
  /* a few owed invoices, two of them late */
  if (sp.inv) {
    const open = s.invoices.filter(x => !s.payments.some(p => p.invId === x.id));
    open.slice(0, Math.max(0, open.length - 5)).forEach(x => s.payments.push({ id: uid(), date: iso(addDays(D(x.date), 9)), amount: sum(x.items, lineTotal), clientId: x.clientId, invId: x.id, method: "Check" }));
  }
  /* coming up */
  const perDay = type === "beauty" ? 4 : type === "cleaning" ? 3 : type === "food" ? 1 : type === "trades" ? 1 : 0.3;
  for (let d = 0; d <= 21; d++) {
    const dt = addDays(TODAY, d); if (dt.getDay() === 0) continue;
    let k = Math.floor(perDay) + (R() < perDay % 1 ? 1 : 0); if (d === 0) k = Math.max(k, type === "creative" ? 1 : 2);
    const times = [9, 11, 13, 15, 17].slice(0, k);
    times.forEach(h => { const c = weightClient(), jt = pick(sp.jobs), items = mkItems(jt); s.jobs.push({ id: uid(), clientId: c.id, title: jt[0], date: iso(dt), time: String(h).padStart(2, "0") + ":" + (R() < .5 ? "00" : "30"), dur: type === "beauty" ? 60 : 120, price: sum(items, lineTotal), status: "booked", notes: "" }); });
  }
  /* quotes */
  const qc = s.clients.slice(1, 4);
  const qItems = [[P.services[3] || P.services[0], 1], [P.services[2], 2], [P.services[0], 1]];
  qc.forEach((c, i) => s.invoices.push({ id: uid(), kind: "quote", num: q++, clientId: c.id, date: T(-12 + i * 4), valid: T(18 + i * 4), items: [{ desc: qItems[i][0][0], qty: qItems[i][1], rate: qItems[i][0][1] }], taxPct: 0, discount: 0, notes: "Price good for 30 days.", status: i === 2 ? "draft" : "sent" }));
  /* expenses: each budget category, most months */
  for (let m = 9; m >= 0; m--) {
    const mStart = new Date(TODAY.getFullYear(), TODAY.getMonth() - m, 1, 12), lastDay = m === 0 ? TODAY.getDate() : new Date(mStart.getFullYear(), mStart.getMonth() + 1, 0, 12).getDate();
    P.cats.forEach(cat => {
      const plan = P.budget[cat] || 0; if (!plan || ["insurance", "permits"].includes(cat) && R() < .7) return;
      const total = plan * between(.55, 1.15) * (m === 0 ? lastDay / 30 : 1); let parts = Math.max(1, Math.round(total / 140)); parts = Math.min(parts, 5);
      for (let i = 0; i < parts; i++) { const day = 1 + Math.floor(R() * lastDay); s.expenses.push({ id: uid(), date: iso(new Date(mStart.getFullYear(), mStart.getMonth(), day, 12)), amount: r2(total / parts * between(.8, 1.2)), cat, vendor: pick(VENDORS[cat] || ["Misc"]), note: "" }); }
    });
  }
  /* time, for people who bill by the hour */
  if (sp.timeOn) {
    for (let d = -60; d <= 0; d++) { const dt = addDays(TODAY, d); if (dt.getDay() === 0 || dt.getDay() === 6) continue; const k = 1 + Math.floor(R() * 2);
      for (let i = 0; i < k; i++) { const c = weightClient(); s.time.push({ id: uid(), date: iso(dt), mins: 30 * (2 + Math.floor(R() * 6)), clientId: c.id, note: pick(["Design revisions", "Client call", "Layout work", "Photo edits", "Copy edits"]), rate: 85, billed: d < -10 }); } }
  } else for (let d = -14; d <= 0; d++) { if (R() < .3) s.time.push({ id: uid(), date: T(d), mins: 60 + 30 * Math.floor(R() * 4), clientId: weightClient().id, note: "On site", rate: P.services.find(x => x[2] === "hr") ? P.services.find(x => x[2] === "hr")[1] : 0, billed: true }); }
  /* budget, bills and taxes */
  s.budget = { cats: Object.assign({}, P.budget), goal: Math.round(sum(s.payments.filter(p => p.date >= T(-90)), p => p.amount) / 3 / 100) * 100 };
  sp.bills.forEach(([name, amount, every, cat], i) => s.bills.push({ id: uid(), name, amount, every, cat, next: T(5 + i * 9) }));
  const y = TODAY.getFullYear();
  taxQuarters(y).forEach(qq => { if (D(qq.due) < TODAY) { const save = S; S = s; const e = taxEst(qq.a, qq.b); S = save; s.taxPaid.push({ id: uid(), year: y, q: qq.q, date: qq.due, amount: Math.round(e.set / 10) * 10 }); } });
  s.todos = [{ id: uid(), text: "Renew business liability insurance", due: T(24), done: false }, { id: uid(), text: "Order business cards", due: T(6), done: false }, { id: uid(), text: "Send last year's packet to the CPA", due: T(-20), done: true }];
  s.jobs.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  s.profile.nextInv = inv; s.profile.nextQuote = q;
  return s;
}
