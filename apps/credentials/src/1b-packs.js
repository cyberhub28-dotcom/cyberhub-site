
/* ---------- more professions ----------
   Each pack is data: words, sections, requirement presets, starter kit, words the type box knows, and a style
   (accent, card colors, font and hero art in app.css under [data-pack]). Rules are Ohio examples plus national
   ones; every preset note tells people to check with their board. */
const SEC = (kind, label, one, o, fields) => Object.assign({ kind, label, one, fields }, o);

/* healthcare: pharmacists, EMTs and paramedics join the nurse pack */
(() => {
  const N = PACKS.nursing;
  Object.assign(N, { name: "Healthcare", who: "Nurses, NPs, PAs, physicians, pharmacists, EMTs and paramedics", appName: "Healthcare Credentials" });
  N.roles = ["RN", "NP / APRN", "PA", "MD / DO", "Pharmacist", "EMT", "Paramedic", "Other"];
  const life = N.sections.find(s => s.kind === "life"); life.fields[0][3] = ["BLS", "ACLS", "PALS", "NRP", "ATLS", "PHTLS", "AMLS", "Other"];
  const lic = N.sections.find(s => s.kind === "license"); lic.fields[0][3] = "RN, APRN-CNP, Pharmacist, Paramedic…"; lic.fields[1][3] = "Ohio Board of Nursing, Ohio EMS…";
  N.presets.splice(N.presets.length - 1, 0,
    { id: "oh-pharm", name: "Ohio pharmacist", years: 2, target: 30, subs: { law: 2 }, note: "30 hours every 2 years, ending Sept 15 of odd years. At least 2 hours of law and 2 of patient safety." },
    { id: "oh-emt", name: "Ohio EMT", years: 3, target: 40, note: "40 hours over a full 3-year cycle: 6 pediatric, 2 geriatric, 1 dementia and 8 trauma. Fewer if your certificate is newer." },
    { id: "oh-aemt", name: "Ohio AEMT", years: 3, target: 60, note: "60 hours over a full 3-year cycle: 8 pediatric, 4 geriatric, 1 dementia and 8 trauma." },
    { id: "oh-medic", name: "Ohio paramedic", years: 3, target: 75, note: "75 hours over a full 3-year cycle: 12 pediatric, 4 geriatric, 6 cardiac (an ACLS class counts), 1 dementia and 8 trauma." },
    { id: "nremt-emt", name: "NREMT EMT", years: 2, target: 40, note: "40 credits every 2 years, split into national, local and individual parts." },
    { id: "nremt-p", name: "NREMT paramedic", years: 2, target: 60, note: "60 credits every 2 years: 30 national, 15 local and 15 individual." });
  Object.assign(N.kit.items, {
    rph: { kind: "license", title: "Pharmacist", label: "Pharmacist license", board: true, ohio: ["oh-pharm"] },
    immun: { kind: "cert", issuer: "APhA", title: "Immunization delivery", label: "Immunization certificate" },
    emt: { kind: "license", title: "EMT", label: "EMT certificate", ohio: ["oh-emt"] },
    aemt: { kind: "license", title: "AEMT", label: "AEMT certificate", ohio: ["oh-aemt"] },
    medic: { kind: "license", title: "Paramedic", label: "Paramedic certificate", ohio: ["oh-medic"] },
    nremt: { kind: "cert", issuer: "NREMT", title: "NREMT", label: "National Registry (EMT)", ce: ["nremt-emt"] },
    nrp: { kind: "cert", issuer: "NREMT", title: "NRP", label: "National Registry (NRP)", ce: ["nremt-p"] },
    phtls: { kind: "life", lifeType: "PHTLS", label: "PHTLS" }
  });
  Object.assign(N.kit.roles, {
    "Pharmacist": { on: ["rph", "npi", "bls"], more: ["immun", "mal", "acls", "pals"] },
    "EMT": { on: ["emt", "nremt", "bls"], more: ["aemt", "phtls", "pals", "mal"] },
    "Paramedic": { on: ["medic", "nrp", "bls", "acls", "pals"], more: ["phtls", "npi", "mal"] }
  });
  N.kit.roles.Other.more.push("rph", "emt", "medic", "nremt", "nrp", "phtls");
  const S2 = k => N.sections.find(s => s.kind === k);
  Object.assign(S2("cert"), { certWord: "certification" });
  Object.assign(S2("life"), { top: "Life support", short: "Life support", dateWord: "Renew by", expWord: " card renewal" });
  Object.assign(S2("id"), { top: "Identifier", short: "ID" });
  Object.assign(S2("mal"), { top: "Malpractice", short: "Malpractice" });
  Object.assign(S2("priv"), { top: "privileges", statusFirst: true, short: "Privileges", defTitle: "Hospital privileges" });
  Object.assign(N, {
    publicIds: ["NPI"], noExpiryIds: ["NPI"], heroTex: "rings",
    subRx: { pharm: /pharm/, law: /\b(law|laws|rules|jurisprudence)\b/ },
    kindWords: { license: /\blicen[cs]e|\bcertificate\b/, cert: /\bcert(ification)?s?\b|\bboard\b|\bregistry\b/, life: /\b(bls|acls|pals|nrp|atls|phtls|amls|life support|cpr)\b/, id: /\b(npi|dea|csr)\b/, mal: /\b(malpractice|insurance|policy)\b/, priv: /\b(privilege|reappoint|hospital|facility)/ },
    credWords: [
      [/\bbls\b|\bcpr\b/, { kind: "life", lifeType: "BLS" }], [/\bacls\b/, { kind: "life", lifeType: "ACLS" }], [/\bpals\b/, { kind: "life", lifeType: "PALS" }], [/\bnrp\b(?! cert)/, { kind: "life", lifeType: "NRP" }], [/\batls\b/, { kind: "life", lifeType: "ATLS" }], [/\bphtls\b/, { kind: "life", lifeType: "PHTLS" }], [/\bamls\b/, { kind: "life", lifeType: "AMLS" }],
      [/\bnpi\b/, { kind: "id", idKind: "NPI" }], [/\bdea\b/, { kind: "id", idKind: "DEA" }], [/\bcsr\b|controlled substance/, { kind: "id", idKind: "State CSR" }],
      [/\bmalpractice\b|liability insurance/, { kind: "mal" }], [/\bprivileges?\b|\breappoint/, { kind: "priv" }],
      [/\bnremt\b|national registry/, { kind: "cert", issuer: "NREMT" }], [/\bimmuniz/, { kind: "cert", title: "Immunization delivery" }],
      [/\bccrn\b/, { kind: "cert", issuer: "AACN", title: "CCRN" }], [/\b(?:fnp|agpcnp|agacnp|pmhnp|pnp|whnp|anp|gnp|ane|cns)-?bc\b/, { kind: "cert", issuer: "ANCC", titleFrom: 0 }],
      [/\b(?:fnp|agnp|enp)-c\b/, { kind: "cert", issuer: "AANP", titleFrom: 0 }], [/\bancc\b/, { kind: "cert", issuer: "ANCC" }], [/\baanp\b/, { kind: "cert", issuer: "AANP" }], [/\bnccpa\b|\bpa-c\b/, { kind: "cert", issuer: "NCCPA", title: "PA-C" }],
      [/\bparamedic\b/, { kind: "license", title: "Paramedic" }], [/\baemt\b/, { kind: "license", title: "AEMT" }], [/\bemt\b/, { kind: "license", title: "EMT" }], [/\bpharmacist\b/, { kind: "license", title: "Pharmacist" }],
      [/\baprn\b|\bcnp\b|\bnp licen/, { kind: "license", title: "APRN-CNP" }], [/\brn\b/, { kind: "license", title: "RN" }], [/\bpa licen/, { kind: "license", title: "PA" }], [/\bmedical licen/, { kind: "license", title: "Medical license" }],
      [/\blicen[cs]e\b/, { kind: "license" }], [/\bcertification\b|\bboard cert/, { kind: "cert" }]],
    askEx: () => [`2 hrs ${N.sub.pharm.toLowerCase()} yesterday`, "ACLS expires March 2027", `When does my ${(S.creds.find(c => c.kind === "license") || { title: "license" }).title} expire?`, "What's due?", "Am I on pace?", "Remind me to renew ACLS"],
    askHelp: ["“1.5 hrs pharmacology from ANA yesterday”", "“3 hours on sepsis care, Cat A, last Tuesday”", "“ACLS expires March 2027”", "“When does my RN expire?”"],
    addEx: { creds: "BLS expires May 2027", all: "3 hrs pharm yesterday", tip: "Try “ACLS expires March 2027” or “Remind me to renew my DEA by June”." },
    todoHint: "Renew ACLS, send CE certificates…",
    docTags: ["Resume or CV", "License", "Certification", "BLS card", "ACLS card", "PALS card", "Diploma or transcript", "Immunizations", "Photo ID", "Insurance", "Reference letter", "Other"],
    vaultNote: "Resume, life support cards, diplomas, immunizations. Take a photo or pick a PDF. Kept on this phone only and included in your backup.",
    packet: { name: "Privileging packet", desc: "Licenses, certifications, life support, malpractice, privileges and CE totals. Private ID numbers print as the last 4 digits unless you choose.", idHint: "DEA and state numbers show as …last 4 unless you turn this on. License numbers and NPI are public, so they show in full." },
    practice: { title: "Practice hours", empty: "Track hours you need to show, like direct-care or practice hours.", add: "Track practice hours" },
    sampleWho: "a made-up nurse practitioner"
  });
})();

PACKS.realestate = {
  licenseDateKey: "renewDue",
  id: "realestate", name: "Real estate agents and brokers", short: "Agent", who: "License CE, core topics, REALTOR ethics, dues, E&O", appName: "Agent Credentials", accent: "brass", heroTex: "roofs",
  roles: ["Salesperson", "Broker", "Other"],
  ce: "CE", ceLong: "Continuing education", ceTab: "CE Log", hoursWord: "hours",
  sub: { pharm: null, law: null, approved: "Board approved" }, subShort: { approved: "Approved" }, subRx: {},
  cats: { A: "Core law", B: "Civil rights", C: "Canons of ethics" }, catShort: { A: "Core law", B: "Civil rights", C: "Ethics" }, catWord: "Core topic", catNone: "Elective",
  catRx: { A: /\bcore law\b|\blicense law\b|\bagency law\b/, B: /\bcivil rights\b|\bfair housing\b/, C: /\bcanons?\b|\bethics\b/ },
  catsLabel: "Has required core topics", catsHint: "Each core topic needs at least a set number of hours. Other courses count as electives.",
  home: [["creds", "Your license and memberships"], ["ce", "CE progress"], ["todo", "To do"], ["notes", "Notes"]],
  cardsTitle: "License and memberships",
  sections: [
    SEC("license", "Licenses", "license", { top: "License" }, [
      ["title", "License type", "text", "Salesperson, Broker"], ["issuer", "State", "text", "Ohio Division of Real Estate"], ["number", "License number", "idnum"],
      ["issued", "Licensed since", "date"], ["expires", "Expires", "date"], ["renewDue", "CE due by", "date"], ["status", "Status", "status"], ["notes", "Notes", "area"]]),
    SEC("cert", "Designations", "designation", { top: "Designation", certWord: "designation", short: "Designation" }, [
      ["title", "Designation", "text", "ABR, CRS, GRI, SRS…"], ["issuer", "Awarded by", "text", "NAR, CRS Council…"], ["number", "Member ID", "idnum"],
      ["issued", "Earned", "date"], ["expires", "Dues paid through", "date"], ["notes", "Notes", "area"]]),
    SEC("life", "Memberships", "membership", { top: "Membership", short: "Membership", dateWord: "Dues due", expWord: " dues due" }, [
      ["lifeType", "Kind", "select", ["REALTOR (NAR)", "State REALTORS", "Local board", "MLS", "Other"]], ["title", "Name (if Other)", "text", "Commercial board…", true], ["issuer", "Association", "text", "Example County REALTORS"],
      ["expires", "Dues due", "date"], ["number", "Member number", "idnum"], ["notes", "Notes", "area"]]),
    SEC("id", "IDs and keys", "ID", { top: "ID", short: "ID or key" }, [
      ["idKind", "Kind", "select", ["NRDS ID", "MLS ID", "Lockbox key", "Other"]], ["title", "Name (if Other)", "text", "Showing app ID…", true], ["number", "Number", "idnum"], ["expires", "Expires", "date"], ["notes", "Notes", "area"]]),
    SEC("mal", "E&O insurance", "E&O policy", { top: "E&O insurance", short: "E&O insurance" }, [
      ["issuer", "Carrier", "text", "Insurance company"], ["number", "Policy number", "idnum"], ["limits", "Limits", "text", "$1M / $1M"], ["expires", "Expires", "date"], ["notes", "Notes", "area"]]),
    SEC("priv", "Brokerage", "brokerage", { top: "Brokerage", short: "Brokerage", defTitle: "My brokerage" }, [
      ["title", "Brokerage", "text", "Brokerage name"], ["privStatus", "Status", "select", ["Active", "Transferring", "Inactive"]], ["reappt", "Agreement renews", "date"], ["docsDue", "Paperwork due", "date"], ["notes", "Notes", "area"]])
  ],
  presets: [
    { id: "oh-re", name: "Ohio license CE", years: 3, target: 30, caps: { A: [3, 30], B: [3, 30], C: [3, 30] }, elective: true, note: "30 hours every 3 years, due by your birthday: 3 core law, 3 civil rights and 3 canons of ethics. The rest can be electives." },
    { id: "nar-ethics", name: "REALTOR Code of Ethics", years: 3, target: 2.5, fixedEnd: "2027-12-31", note: "At least 2.5 hours every 3-year cycle. This cycle ends Dec 31, 2027." },
    { id: "custom", name: "Something else", target: 15, note: "Set your own hours and window." }
  ],
  kit: {
    items: {
      sales: { kind: "license", title: "Salesperson", label: "Salesperson license", ohio: ["oh-re"] },
      broker: { kind: "license", title: "Broker", label: "Broker license", ohio: ["oh-re"] },
      nar: { kind: "life", lifeType: "REALTOR (NAR)", label: "REALTOR membership", ce: ["nar-ethics"] },
      state: { kind: "life", lifeType: "State REALTORS", label: "State REALTORS" }, local: { kind: "life", lifeType: "Local board", label: "Local board" },
      mls: { kind: "life", lifeType: "MLS", label: "MLS access" }, nrds: { kind: "id", idKind: "NRDS ID", label: "NRDS ID" }, lockbox: { kind: "id", idKind: "Lockbox key", label: "Lockbox key" },
      desig: { kind: "cert", label: "Designation (ABR, CRS…)" }, eo: { kind: "mal", label: "E&O insurance" }, brk: { kind: "priv", label: "Brokerage" }
    },
    roles: {
      "Salesperson": { on: ["sales", "nar", "mls", "nrds", "eo", "brk"], more: ["state", "local", "lockbox", "desig"] },
      "Broker": { on: ["broker", "nar", "mls", "nrds", "eo", "brk"], more: ["sales", "state", "local", "lockbox", "desig"] },
      "Other": { on: ["sales"], more: ["broker", "nar", "state", "local", "mls", "nrds", "lockbox", "desig", "eo", "brk"] }
    }
  },
  publicIds: ["NRDS ID", "MLS ID", "Lockbox key", "Other"], noExpiryIds: ["NRDS ID", "MLS ID"],
  kindWords: { license: /\blicen[cs]e/, cert: /\bdesignation|\babr\b|\bcrs\b|\bgri\b|\bsrs\b/, life: /\b(realtor|nar|mls|dues|membership|board)\b/, id: /\b(nrds|lockbox|supra|ekey)\b/, mal: /\b(e ?& ?o|errors and omissions|insurance|policy)\b/, priv: /\bbrokerage\b/ },
  credWords: [
    [/\brealtor dues\b|\bnar\b|\brealtor membership\b/, { kind: "life", lifeType: "REALTOR (NAR)" }], [/\bmls\b/, { kind: "life", lifeType: "MLS" }], [/\bstate realtors\b/, { kind: "life", lifeType: "State REALTORS" }], [/\blocal board\b/, { kind: "life", lifeType: "Local board" }],
    [/\bnrds\b/, { kind: "id", idKind: "NRDS ID" }], [/\blockbox\b|\bsupra\b|\bekey\b/, { kind: "id", idKind: "Lockbox key" }],
    [/\be ?& ?o\b|\berrors and omissions\b/, { kind: "mal" }], [/\bbrokerage agreement\b|\bbrokerage\b/, { kind: "priv" }],
    [/\b(abr|crs|gri|srs|e-pro|sres|psa|clhms)\b/, { kind: "cert", issuer: "NAR", titleFrom: 0 }], [/\bdesignation\b/, { kind: "cert" }],
    [/\bbroker licen/, { kind: "license", title: "Broker" }], [/\bsales(person)? licen/, { kind: "license", title: "Salesperson" }], [/\blicen[cs]e\b/, { kind: "license" }], [/\bdues\b/, { kind: "life" }]],
  askEx: () => ["3 hrs core law yesterday", "MLS dues due Jan 31 2027", "When is my license CE due?", "What's due?", "Am I on pace?", "Remind me to pay REALTOR dues"],
  askHelp: ["“3 hrs core law from the county board yesterday”", "“2 hours fair housing last Tuesday”", "“E&O expires March 2027”", "“When is my CE due?”"],
  addEx: { creds: "MLS dues due Jan 31 2027", all: "3 hrs core law yesterday", tip: "Try “E&O expires March 2027” or “Remind me to pay REALTOR dues by Dec 15”." },
  todoHint: "Pay MLS dues, send E&O certificate…",
  docTags: ["License", "Pocket card", "CE certificate", "Designation", "E&O certificate", "Brokerage agreement", "Photo ID", "W-9", "Other"],
  vaultNote: "License, CE certificates, E&O certificate, brokerage paperwork. Take a photo or pick a PDF. Kept on this phone only and included in your backup.",
  packet: { name: "Agent packet", desc: "Licenses, designations, memberships, E&O, brokerage and CE totals in one clean PDF.", idHint: "ID numbers show in full. Turn this on to also show policy numbers in full." },
  practice: { title: "Hours", empty: "Track hours you need to show.", add: "Track hours" },
  disclaimer: "This app tracks the dates and hours you enter. It doesn't give legal advice, and it doesn't file anything with your state. Check every rule with your state's real estate office.",
  sampleWho: "a made-up real estate agent"
};

PACKS.trades = {
  id: "trades", name: "Electricians and plumbers", short: "Trades", who: "State and city licenses, code hours, safety cards, bonds and insurance", appName: "Trade Licenses", accent: "voltage", heroTex: "grid",
  roles: ["Electrician", "Plumber", "Both", "Other"],
  ce: "CE", ceLong: "Continuing education", ceTab: "CE Log", hoursWord: "classroom hours",
  sub: { pharm: "Electrical code", law: null, approved: "Board approved" }, subShort: { pharm: "Code", approved: "Approved" }, subRx: { pharm: /\b(code|nec)\b/ },
  home: [["ce", "CE progress"], ["creds", "Your licenses and cards"], ["practice", "Work hours"], ["todo", "To do"], ["notes", "Notes"]],
  cardsTitle: "Licenses and cards",
  sections: [
    SEC("license", "Licenses", "license", { top: "License" }, [
      ["title", "License", "text", "Electrical contractor, Journeyman plumber…"], ["issuer", "State or city", "text", "Ohio OCILB, City of Columbus"], ["number", "License number", "idnum"],
      ["issued", "Issued", "date"], ["expires", "Expires", "date"], ["renewDue", "Renewal due", "date"], ["status", "Status", "status"], ["notes", "Notes", "area"]]),
    SEC("cert", "Certifications", "certification", { top: "Certification", certWord: "certification", short: "Certification" }, [
      ["title", "Credential", "text", "Backflow tester, Fire alarm…"], ["issuer", "Issued by", "text", "NICET, ASSE, NFPA…"], ["number", "Number", "idnum"],
      ["issued", "Issued", "date"], ["expires", "Expires", "date"], ["notes", "Notes", "area"]]),
    SEC("life", "Safety cards", "safety card", { top: "Safety training", short: "Safety card", dateWord: "Renew by", expWord: " card renewal" }, [
      ["lifeType", "Kind", "select", ["OSHA 10", "OSHA 30", "First aid / CPR", "NFPA 70E", "Confined space", "Other"]], ["title", "Name (if Other)", "text", "Lift operator…", true], ["issuer", "Provider", "text", "Training company"],
      ["expires", "Renew by", "date"], ["number", "Card number", "idnum"], ["notes", "Notes", "area"]]),
    SEC("id", "Registrations", "registration", { top: "Registration", short: "Registration" }, [
      ["idKind", "Kind", "select", ["Contractor registration", "Business license", "Apprentice card", "Other"]], ["title", "Name (if Other)", "text", "Permit account…", true], ["number", "Number", "idnum"], ["expires", "Expires", "date"], ["notes", "Notes", "area"]]),
    SEC("mal", "Insurance and bonds", "policy or bond", { top: "Insurance", short: "Insurance or bond", topFromTitle: true }, [
      ["title", "Kind", "text", "General liability, Surety bond, Workers' comp"], ["issuer", "Carrier or surety", "text", "Company name"], ["number", "Policy or bond number", "idnum"], ["limits", "Amount", "text", "$1M / $2M"], ["expires", "Expires", "date"], ["notes", "Notes", "area"]]),
    SEC("priv", "City registrations", "city", { top: "City registration", short: "City", defTitle: "City registration" }, [
      ["title", "City", "text", "City of Columbus"], ["privStatus", "Status", "select", ["Active", "Pending", "Inactive"]], ["reappt", "Renews", "date"], ["docsDue", "Paperwork due", "date"], ["notes", "Notes", "area"]])
  ],
  presets: [
    { id: "oh-elec", name: "Ohio electrical contractor CE", years: 1, target: 10, subs: { pharm: 5 }, note: "10 classroom hours each year, at least 5 on the electrical code. Extra hours don't carry over." },
    { id: "oh-plumb", name: "Ohio plumbing contractor CE", years: 1, target: 10, note: "10 classroom hours each year in board-approved courses. Extra hours don't carry over." },
    { id: "custom", name: "Something else", target: 8, note: "Set your own hours and window. Many cities set their own rules." }
  ],
  kit: {
    items: {
      ec: { kind: "license", title: "Electrical contractor", label: "Electrical contractor", ohio: ["oh-elec"] }, je: { kind: "license", title: "Journeyman electrician", label: "Journeyman electrician" },
      pc: { kind: "license", title: "Plumbing contractor", label: "Plumbing contractor", ohio: ["oh-plumb"] }, jp: { kind: "license", title: "Journeyman plumber", label: "Journeyman plumber" },
      backflow: { kind: "cert", title: "Backflow tester", label: "Backflow tester" }, medgas: { kind: "cert", title: "Medical gas installer", label: "Medical gas" }, firealarm: { kind: "cert", issuer: "NICET", title: "Fire alarm", label: "NICET fire alarm" },
      osha10: { kind: "life", lifeType: "OSHA 10", label: "OSHA 10" }, osha30: { kind: "life", lifeType: "OSHA 30", label: "OSHA 30" }, cpr: { kind: "life", lifeType: "First aid / CPR", label: "First aid / CPR" }, nfpa: { kind: "life", lifeType: "NFPA 70E", label: "NFPA 70E" },
      reg: { kind: "id", idKind: "Contractor registration", label: "Contractor registration" }, biz: { kind: "id", idKind: "Business license", label: "Business license" }, app: { kind: "id", idKind: "Apprentice card", label: "Apprentice card" },
      gl: { kind: "mal", title: "General liability", label: "Liability insurance" }, bond: { kind: "mal", title: "Surety bond", label: "Bond" }, wc: { kind: "mal", title: "Workers' comp", label: "Workers' comp" },
      city: { kind: "priv", label: "City registration" }
    },
    roles: {
      "Electrician": { on: ["ec", "osha10", "nfpa", "reg", "gl", "bond", "city"], more: ["je", "firealarm", "osha30", "cpr", "biz", "app", "wc"] },
      "Plumber": { on: ["pc", "osha10", "reg", "gl", "bond", "city"], more: ["jp", "backflow", "medgas", "osha30", "cpr", "biz", "app", "wc"] },
      "Both": { on: ["ec", "pc", "osha10", "nfpa", "reg", "gl", "bond", "city"], more: ["je", "jp", "backflow", "medgas", "osha30", "cpr", "biz", "wc"] },
      "Other": { on: ["osha10"], more: ["ec", "je", "pc", "jp", "backflow", "medgas", "firealarm", "osha30", "cpr", "nfpa", "reg", "biz", "app", "gl", "bond", "wc", "city"] }
    }
  },
  publicIds: ["Contractor registration", "Business license", "Apprentice card", "Other"], noExpiryIds: [],
  kindWords: { license: /\blicen[cs]e|\bcontractor\b|\bjourneyman\b/, cert: /\bcert(ification)?s?\b|\bbackflow\b|\bmed(ical)? gas\b|\bnicet\b/, life: /\b(osha|70e|cpr|first aid|safety|confined)\b/, id: /\b(registration|business license|apprentice)\b/, mal: /\b(insurance|bond|liability|workers'? comp|policy)\b/, priv: /\bcity\b/ },
  credWords: [
    [/\bosha ?30\b/, { kind: "life", lifeType: "OSHA 30" }], [/\bosha ?10\b|\bosha\b/, { kind: "life", lifeType: "OSHA 10" }], [/\b70e\b|\barc flash\b/, { kind: "life", lifeType: "NFPA 70E" }], [/\bcpr\b|\bfirst aid\b/, { kind: "life", lifeType: "First aid / CPR" }], [/\bconfined space\b/, { kind: "life", lifeType: "Confined space" }],
    [/\bbackflow\b/, { kind: "cert", title: "Backflow tester" }], [/\bmed(ical)? gas\b/, { kind: "cert", title: "Medical gas installer" }], [/\bnicet\b|\bfire alarm\b/, { kind: "cert", issuer: "NICET", title: "Fire alarm" }],
    [/\bsurety\b|\bbond\b/, { kind: "mal", title: "Surety bond" }], [/\bworkers'? comp/, { kind: "mal", title: "Workers' comp" }], [/\bliability\b|\binsurance\b/, { kind: "mal", title: "General liability" }],
    [/\bcontractor registration\b|\bregistration\b/, { kind: "id", idKind: "Contractor registration" }], [/\bbusiness license\b/, { kind: "id", idKind: "Business license" }], [/\bapprentice\b/, { kind: "id", idKind: "Apprentice card" }],
    [/\bjourneyman electric/, { kind: "license", title: "Journeyman electrician" }], [/\bjourneyman plumb/, { kind: "license", title: "Journeyman plumber" }],
    [/\bplumbing contractor\b|\bplumbing licen/, { kind: "license", title: "Plumbing contractor" }], [/\belectrical contractor\b|\belectrical licen|\bcontractor licen/, { kind: "license", title: "Electrical contractor" }], [/\blicen[cs]e\b/, { kind: "license" }]],
  askEx: () => ["4 hrs NEC code update yesterday", "OSHA 30 card expires May 2028", "When does my contractor license expire?", "What's due?", "Am I on pace?", "Remind me to renew my bond"],
  askHelp: ["“4 hrs NEC code update from the trade school yesterday”", "“2 hours arc flash safety last Tuesday”", "“Bond expires March 2027”", "“When does my contractor license expire?”"],
  addEx: { creds: "Liability insurance expires June 2027", all: "4 hrs code update yesterday", tip: "Try “Surety bond expires March 2027” or “Remind me to renew my city registration by June”." },
  todoHint: "Renew city registration, send insurance certificate…",
  docTags: ["License", "Pocket card", "OSHA card", "CE certificate", "Insurance certificate", "Bond", "W-9", "Photo ID", "Other"],
  vaultNote: "Licenses, OSHA cards, insurance certificates, bonds. Take a photo or pick a PDF. Kept on this phone only and included in your backup.",
  packet: { name: "Contractor packet", desc: "Licenses, certifications, safety cards, insurance and bonds, city registrations and CE totals. Handy for bids and permit offices.", idHint: "Registration numbers show in full. Turn this on to also show full policy and bond numbers." },
  practice: { title: "Work hours", empty: "Track work hours you need to show, like apprentice or field hours toward a license.", add: "Track work hours" },
  disclaimer: "This app tracks the dates and hours you enter. It doesn't give code, safety or legal advice, and it doesn't file anything with a board or city. Check every rule with the office that issued it.",
  sampleWho: "a made-up electrical contractor"
};

PACKS.teachers = {
  id: "teachers", name: "Teachers and school staff", short: "Educator", who: "License renewal, PD hours, endorsements, background checks", appName: "Educator Credentials", accent: "chalk", heroTex: "ruled",
  roles: ["Teacher", "Intervention specialist", "Administrator", "Substitute", "Other"],
  ce: "PD", ceLong: "Professional development", ceTab: "PD Log", hoursWord: "contact hours",
  sub: { pharm: null, law: null, approved: "LPDC approved" }, subShort: { approved: "Approved" }, subRx: {},
  home: [["ce", "PD progress"], ["todo", "To do"], ["creds", "Your license and checks"], ["notes", "Notes"]],
  cardsTitle: "License and checks",
  sections: [
    SEC("license", "Licenses", "license", { top: "License" }, [
      ["title", "License", "text", "5-year professional, Resident educator…"], ["issuer", "State", "text", "Ohio Department of Education and Workforce"], ["number", "Educator ID", "idnum"],
      ["issued", "Issued", "date"], ["expires", "Expires", "date"], ["renewDue", "Send renewal by", "date"], ["status", "Status", "status"], ["notes", "Notes", "area"]]),
    SEC("cert", "Endorsements", "endorsement", { top: "Endorsement", certWord: "endorsement", short: "Endorsement" }, [
      ["title", "Endorsement", "text", "Reading, TESOL, Gifted…"], ["issuer", "Issued by", "text", "State education department"], ["issued", "Added", "date"], ["expires", "Expires", "date"], ["notes", "Notes", "area"]]),
    SEC("life", "Trainings and checks", "training or check", { top: "Training", short: "Training or check", dateWord: "Redo by", expWord: " due" }, [
      ["lifeType", "Kind", "select", ["FBI background check", "BCI background check", "CPR / First aid", "Mandated reporter", "Pupil activity permit", "Other"]], ["title", "Name (if Other)", "text", "Concussion training…", true], ["issuer", "Provider", "text", "Where you did it"],
      ["expires", "Redo by", "date"], ["notes", "Notes", "area"]]),
    SEC("id", "IDs", "ID", { top: "ID", short: "ID" }, [
      ["idKind", "Kind", "select", ["Educator ID", "District ID", "Other"]], ["title", "Name (if Other)", "text", "Union member number…", true], ["number", "Number", "idnum"], ["expires", "Expires", "date"], ["notes", "Notes", "area"]]),
    SEC("mal", "Liability coverage", "policy", { top: "Liability coverage", short: "Liability coverage" }, [
      ["issuer", "Provider", "text", "Union or insurer"], ["number", "Policy or member number", "idnum"], ["limits", "Limits", "text", "$1M"], ["expires", "Expires", "date"], ["notes", "Notes", "area"]]),
    SEC("priv", "School or district", "school", { top: "Your school", short: "School contract", defTitle: "My district" }, [
      ["title", "School or district", "text", "District name"], ["privStatus", "Contract", "select", ["Active", "Continuing contract", "Limited contract", "Inactive"]], ["reappt", "Contract renews", "date"], ["docsDue", "IPDP due", "date"], ["notes", "Notes", "area"]])
  ],
  presets: [
    { id: "oh-5yr", name: "Ohio 5-year license", years: 5, target: 180, note: "180 contact hours (18 CEUs) or 6 semester hours, approved by your LPDC, before your license expires." },
    { id: "oh-5yr-sem", name: "Ohio 5-year license (college credit)", years: 5, target: 6, note: "6 semester hours of coursework tied to your teaching area, approved by your LPDC. Log each course's semester hours." },
    { id: "custom", name: "Something else", target: 60, note: "Set your own hours and window." }
  ],
  kit: {
    items: {
      lic5: { kind: "license", title: "5-year professional", label: "5-year professional license", ohio: ["oh-5yr"] }, resident: { kind: "license", title: "Resident educator", label: "Resident educator license" },
      sublic: { kind: "license", title: "Substitute", label: "Substitute license" }, admin: { kind: "license", title: "Principal", label: "Administrator license", ohio: ["oh-5yr"] },
      endorse: { kind: "cert", label: "Endorsement" }, fbi: { kind: "life", lifeType: "FBI background check", label: "FBI background check" }, bci: { kind: "life", lifeType: "BCI background check", label: "BCI background check" },
      cpr: { kind: "life", lifeType: "CPR / First aid", label: "CPR / First aid" }, mand: { kind: "life", lifeType: "Mandated reporter", label: "Mandated reporter" }, pap: { kind: "life", lifeType: "Pupil activity permit", label: "Pupil activity permit" },
      oid: { kind: "id", idKind: "Educator ID", label: "Educator ID" }, ins: { kind: "mal", label: "Liability coverage" }, school: { kind: "priv", label: "School contract" }
    },
    roles: {
      "Teacher": { on: ["lic5", "fbi", "oid", "school"], more: ["resident", "endorse", "bci", "cpr", "mand", "pap", "ins"] },
      "Intervention specialist": { on: ["lic5", "endorse", "fbi", "oid", "school"], more: ["resident", "bci", "cpr", "mand", "ins"] },
      "Administrator": { on: ["admin", "fbi", "oid", "school"], more: ["lic5", "bci", "cpr", "mand", "ins"] },
      "Substitute": { on: ["sublic", "fbi", "oid"], more: ["bci", "cpr", "mand"] },
      "Other": { on: ["fbi"], more: ["lic5", "resident", "sublic", "admin", "endorse", "bci", "cpr", "mand", "pap", "oid", "ins", "school"] }
    }
  },
  publicIds: ["Educator ID", "District ID", "Other"], noExpiryIds: ["Educator ID", "District ID"],
  kindWords: { license: /\blicen[cs]e/, cert: /\bendorsement/, life: /\b(fbi|bci|background|fingerprint|cpr|first aid|mandated|pupil activity|permit|training)\b/, id: /\b(educator id|oh ?id|district id)\b/, mal: /\b(liability|insurance|coverage)\b/, priv: /\b(contract|district|school|ipdp)\b/ },
  credWords: [
    [/\bfbi\b|\bfingerprint/, { kind: "life", lifeType: "FBI background check" }], [/\bbci\b/, { kind: "life", lifeType: "BCI background check" }], [/\bcpr\b|\bfirst aid\b/, { kind: "life", lifeType: "CPR / First aid" }],
    [/\bmandated reporter\b/, { kind: "life", lifeType: "Mandated reporter" }], [/\bpupil activity\b|\bcoaching permit\b/, { kind: "life", lifeType: "Pupil activity permit" }],
    [/\bendorsement\b/, { kind: "cert" }], [/\bipdp\b|\bcontract\b/, { kind: "priv" }], [/\bliability\b|\binsurance\b/, { kind: "mal" }],
    [/\bresident educator\b/, { kind: "license", title: "Resident educator" }], [/\bsubstitute licen/, { kind: "license", title: "Substitute" }], [/\b5.year\b|\bfive.year\b|\bprofessional licen/, { kind: "license", title: "5-year professional" }], [/\blicen[cs]e\b/, { kind: "license" }]],
  askEx: () => ["6 hrs reading PD yesterday", "FBI check due June 2027", "When does my license expire?", "What's due?", "Am I on pace?", "Remind me to get my IPDP signed"],
  askHelp: ["“6 hrs reading workshop from the ESC yesterday”", "“3 hours classroom tech last Tuesday”", "“FBI check due June 2027”", "“When does my license expire?”"],
  addEx: { creds: "CPR expires May 2027", all: "6 hrs PD yesterday", tip: "Try “FBI check due June 2027” or “Remind me to get my IPDP signed by May”." },
  todoHint: "Get IPDP signed, schedule fingerprints…",
  docTags: ["License", "Transcript", "CEU certificate", "Background check", "IPDP", "Evaluation", "Resume", "Photo ID", "Other"],
  vaultNote: "License, transcripts, CEU certificates, background checks, your IPDP. Take a photo or pick a PDF. Kept on this phone only and included in your backup.",
  packet: { name: "Educator packet", desc: "Licenses, endorsements, trainings and checks, coverage and PD totals in one clean PDF.", idHint: "IDs show in full. Turn this on to also show policy or member numbers in full." },
  practice: { title: "Hours", empty: "Track hours you need to show, like coaching or mentoring hours.", add: "Track hours" },
  disclaimer: "This app tracks the dates and hours you enter. It doesn't give legal or HR advice, and it doesn't file anything with your state or district. Check every rule with your state or your LPDC.",
  sampleWho: "a made-up teacher"
};

PACKS.cpa = {
  id: "cpa", name: "CPAs and accountants", short: "CPA", who: "CPA license, CPE hours and ethics, PTIN, firm registration", appName: "CPA Credentials", accent: "ledger", heroTex: "ledger",
  roles: ["CPA", "Enrolled agent", "Other"],
  ce: "CPE", ceLong: "Continuing professional education", ceTab: "CPE Log", hoursWord: "CPE hours",
  sub: { pharm: "Ethics", law: null, approved: "Board approved" }, subShort: { pharm: "Ethics", approved: "Approved" }, subRx: { pharm: /\bethic/ },
  home: [["ce", "CPE progress"], ["creds", "Your license and registrations"], ["todo", "To do"], ["notes", "Notes"]],
  cardsTitle: "License and registrations",
  sections: [
    SEC("license", "Licenses", "license", { top: "License" }, [
      ["title", "License", "text", "CPA"], ["issuer", "State board", "text", "Accountancy Board of Ohio"], ["number", "License number", "idnum"],
      ["issued", "Issued", "date"], ["expires", "Expires", "date"], ["renewDue", "Renewal due", "date"], ["status", "Status", "status"], ["notes", "Notes", "area"]]),
    SEC("cert", "Certifications", "certification", { top: "Certification", certWord: "certification", short: "Certification" }, [
      ["title", "Credential", "text", "CMA, CFE, CFP, EA…"], ["issuer", "Issued by", "text", "IMA, ACFE, CFP Board, IRS…"], ["number", "Number", "idnum"],
      ["issued", "Earned", "date"], ["expires", "Expires", "date"], ["recert", "How you renew", "text", "30 CPE hours a year"], ["hoursNeeded", "Hours needed", "number"], ["notes", "Notes", "area"]]),
    SEC("life", "Registrations", "registration", { top: "Registration", short: "Registration", dateWord: "Renew by", expWord: " renewal" }, [
      ["lifeType", "Kind", "select", ["PTIN", "EFIN", "Firm registration", "Peer review", "Other"]], ["title", "Name (if Other)", "text", "State tax account…", true], ["issuer", "Issued by", "text", "IRS, state board…"],
      ["expires", "Renew by", "date"], ["number", "Number", "idnum"], ["notes", "Notes", "area"]]),
    SEC("id", "IDs", "ID", { top: "ID", short: "ID" }, [
      ["idKind", "Kind", "select", ["AICPA member", "State society member", "CAF number", "Other"]], ["title", "Name (if Other)", "text", "Software login ID…", true], ["number", "Number", "idnum"], ["expires", "Expires", "date"], ["notes", "Notes", "area"]]),
    SEC("mal", "Professional liability", "policy", { top: "Professional liability", short: "Liability insurance" }, [
      ["issuer", "Carrier", "text", "Insurance company"], ["number", "Policy number", "idnum"], ["limits", "Limits", "text", "$1M / $1M"], ["expires", "Expires", "date"], ["notes", "Notes", "area"]]),
    SEC("priv", "Firm", "firm", { top: "Firm", short: "Firm", defTitle: "My firm" }, [
      ["title", "Firm or employer", "text", "Firm name"], ["privStatus", "Your role", "select", ["Active", "Owner", "Partner", "Inactive"]], ["reappt", "Renews", "date"], ["docsDue", "Peer review due", "date"], ["notes", "Notes", "area"]])
  ],
  presets: [
    { id: "oh-cpa", name: "Ohio CPA CPE", years: 3, target: 120, subs: { pharm: 3 }, note: "120 hours every 3 years, at least 20 each year, including 3 hours of board-approved ethics. Due Dec 31." },
    { id: "ea", name: "IRS enrolled agent", years: 3, target: 72, subs: { pharm: 6 }, note: "72 hours every 3 years, at least 16 each year, with 2 hours of ethics each year." },
    { id: "cma", name: "CMA CPE", years: 1, target: 30, subs: { pharm: 2 }, note: "30 hours each calendar year, including 2 hours of ethics." },
    { id: "custom", name: "Something else", target: 40, note: "Set your own hours and window." }
  ],
  kit: {
    items: {
      cpa: { kind: "license", title: "CPA", label: "CPA license", ohio: ["oh-cpa"] }, ea: { kind: "cert", issuer: "IRS", title: "EA", label: "Enrolled agent", ce: ["ea"] },
      cma: { kind: "cert", issuer: "IMA", title: "CMA", label: "CMA", ce: ["cma"] }, cfe: { kind: "cert", issuer: "ACFE", title: "CFE", label: "CFE" }, cfp: { kind: "cert", issuer: "CFP Board", title: "CFP", label: "CFP" },
      ptin: { kind: "life", lifeType: "PTIN", label: "PTIN" }, efin: { kind: "life", lifeType: "EFIN", label: "EFIN" }, firmreg: { kind: "life", lifeType: "Firm registration", label: "Firm registration" }, peer: { kind: "life", lifeType: "Peer review", label: "Peer review" },
      aicpa: { kind: "id", idKind: "AICPA member", label: "AICPA membership" }, caf: { kind: "id", idKind: "CAF number", label: "CAF number" }, ins: { kind: "mal", label: "Liability insurance" }, firm: { kind: "priv", label: "Firm" }
    },
    roles: {
      "CPA": { on: ["cpa", "ptin", "aicpa", "ins", "firm"], more: ["ea", "cma", "cfe", "cfp", "efin", "firmreg", "peer", "caf"] },
      "Enrolled agent": { on: ["ea", "ptin", "efin", "caf"], more: ["cpa", "ins", "firm"] },
      "Other": { on: ["ptin"], more: ["cpa", "ea", "cma", "cfe", "cfp", "efin", "firmreg", "peer", "aicpa", "caf", "ins", "firm"] }
    }
  },
  publicIds: ["AICPA member", "State society member", "Other"], noExpiryIds: ["AICPA member", "State society member", "CAF number"],
  kindWords: { license: /\blicen[cs]e|\bcpa\b/, cert: /\bcert(ification)?s?\b|\bcma\b|\bcfe\b|\bcfp\b|\benrolled agent\b/, life: /\b(ptin|efin|registration|peer review)\b/, id: /\b(aicpa|society|caf)\b/, mal: /\b(liability|insurance|policy)\b/, priv: /\bfirm\b/ },
  credWords: [
    [/\bptin\b/, { kind: "life", lifeType: "PTIN" }], [/\befin\b/, { kind: "life", lifeType: "EFIN" }], [/\bpeer review\b/, { kind: "life", lifeType: "Peer review" }], [/\bfirm registration\b|\bfirm permit\b/, { kind: "life", lifeType: "Firm registration" }],
    [/\baicpa\b/, { kind: "id", idKind: "AICPA member" }], [/\bcaf\b/, { kind: "id", idKind: "CAF number" }],
    [/\bcma\b/, { kind: "cert", issuer: "IMA", title: "CMA" }], [/\bcfe\b/, { kind: "cert", issuer: "ACFE", title: "CFE" }], [/\bcfp\b/, { kind: "cert", issuer: "CFP Board", title: "CFP" }], [/\benrolled agent\b|\bea\b/, { kind: "cert", issuer: "IRS", title: "EA" }],
    [/\bliability\b|\binsurance\b/, { kind: "mal" }], [/\bcpa\b|\blicen[cs]e\b/, { kind: "license", title: "CPA" }]],
  askEx: () => ["8 hrs tax update CPE yesterday", "PTIN renews Dec 31 2026", "When does my CPA license expire?", "What's due?", "Am I on pace?", "Remind me to renew my PTIN"],
  askHelp: ["“8 hrs federal tax update from the state society yesterday”", "“2 hours ethics CPE last Tuesday”", "“PTIN renews Dec 31 2026”", "“When does my CPA license expire?”"],
  addEx: { creds: "PTIN renews Dec 31 2026", all: "8 hrs CPE yesterday", tip: "Try “Liability insurance expires June 2027” or “Remind me to renew my PTIN by Nov 30”." },
  todoHint: "Renew PTIN, send peer review letter…",
  docTags: ["License", "CPE certificate", "Ethics certificate", "PTIN letter", "Peer review letter", "Insurance certificate", "Photo ID", "Other"],
  vaultNote: "License, CPE certificates, PTIN and peer review letters. Take a photo or pick a PDF. Kept on this phone only and included in your backup.",
  packet: { name: "CPA packet", desc: "Licenses, certifications, registrations, liability insurance, firm and CPE totals in one clean PDF.", idHint: "Member numbers show in full. Turn this on to also show your CAF and policy numbers in full." },
  practice: { title: "Hours", empty: "Track hours you need to show.", add: "Track hours" },
  disclaimer: "This app tracks the dates and hours you enter. It doesn't give tax, accounting or legal advice, and it doesn't file anything with a board or the IRS. Check every rule with the board that issued it.",
  sampleWho: "a made-up CPA"
};

PACKS.legal = {
  licenseDateKey: "renewDue",
  id: "legal", name: "Lawyers", short: "Attorney", who: "Bar admissions, CLE hours, attorney registration, malpractice", appName: "Attorney Credentials", accent: "oxblood", heroTex: "columns",
  roles: ["Attorney", "New lawyer", "Other"],
  ce: "CLE", ceLong: "Continuing legal education", ceTab: "CLE Log", hoursWord: "credit hours",
  sub: { pharm: "Professional conduct", law: null, approved: "Approved for credit" }, subShort: { pharm: "Conduct", approved: "Approved" },
  subRx: { pharm: /\bethic|\bprofessional conduct\b|\bprofessionalism\b|\bsubstance\b|\bmental health\b|\bwell-?being\b|\baccess to justice\b/ },
  home: [["ce", "CLE progress"], ["creds", "Your admissions"], ["todo", "To do"], ["notes", "Notes"]],
  cardsTitle: "Bar and court admissions",
  sections: [
    SEC("license", "Bar admissions", "bar admission", { top: "Bar admission" }, [
      ["title", "Admission", "text", "Ohio bar, Kentucky bar…"], ["issuer", "Court or bar", "text", "Supreme Court of Ohio"], ["number", "Registration number", "idnum"],
      ["issued", "Admitted", "date"], ["expires", "Expires", "date"], ["renewDue", "Registration due", "date"], ["status", "Status", "status"], ["notes", "Notes", "area"]]),
    SEC("cert", "Specialist certifications", "certification", { top: "Certification", certWord: "certification", short: "Specialist certification" }, [
      ["title", "Specialty", "text", "Estate planning, Workers' comp…"], ["issuer", "Certified by", "text", "State bar or board"], ["number", "Number", "idnum"],
      ["issued", "Certified since", "date"], ["expires", "Expires", "date"], ["notes", "Notes", "area"]]),
    SEC("life", "Court admissions", "court admission", { top: "Court admission", short: "Court admission", dateWord: "Renew by", expWord: " renewal" }, [
      ["lifeType", "Court", "select", ["U.S. District Court", "U.S. Court of Appeals", "U.S. Supreme Court", "Pro hac vice", "Other"]], ["title", "Name (if Other)", "text", "Tax Court…", true], ["issuer", "Which one", "text", "S.D. Ohio"],
      ["expires", "Renew by", "date"], ["number", "Bar number there", "idnum"], ["notes", "Notes", "area"]]),
    SEC("id", "IDs", "ID", { top: "ID", short: "ID" }, [
      ["idKind", "Kind", "select", ["Attorney registration", "Bar number", "Other"]], ["title", "Name (if Other)", "text", "E-filing login…", true], ["number", "Number", "idnum"], ["expires", "Expires", "date"], ["notes", "Notes", "area"]]),
    SEC("mal", "Malpractice", "malpractice policy", { top: "Malpractice", short: "Malpractice" }, [
      ["issuer", "Carrier", "text", "Insurance company"], ["number", "Policy number", "idnum"], ["limits", "Limits", "text", "$1M / $3M"], ["expires", "Expires", "date"], ["notes", "Notes", "area"]]),
    SEC("priv", "Firm", "firm", { top: "Firm", short: "Firm", defTitle: "My firm" }, [
      ["title", "Firm or employer", "text", "Firm name"], ["privStatus", "Your role", "select", ["Active", "Partner", "Of counsel", "Inactive"]], ["reappt", "Renews", "date"], ["docsDue", "Filings due", "date"], ["notes", "Notes", "area"]])
  ],
  presets: [
    { id: "oh-cle", name: "Ohio CLE", years: 2, endRule: "ohcle", target: 24, subs: { pharm: 2.5 }, note: "24 hours every 2 years, with 2.5 on professional conduct. Due Dec 31: odd years if your last name starts A to L, even years for M to Z. Up to 12 extra hours carry over." },
    { id: "oh-nlt", name: "Ohio new lawyers training", years: 2, target: 12, note: "12 hours in your first period, including 3 on professionalism, law office management and client funds." },
    { id: "custom", name: "Something else", target: 12, note: "Set your own hours and window." }
  ],
  kit: {
    items: {
      ohbar: { kind: "license", title: "Bar", label: "State bar admission", ohio: ["oh-cle"] }, otherbar: { kind: "license", title: "Second state bar", label: "Another state's bar" },
      fed: { kind: "life", lifeType: "U.S. District Court", label: "Federal district court" }, app: { kind: "life", lifeType: "U.S. Court of Appeals", label: "Court of appeals" }, phv: { kind: "life", lifeType: "Pro hac vice", label: "Pro hac vice" },
      spec: { kind: "cert", label: "Specialist certification" }, reg: { kind: "id", idKind: "Attorney registration", label: "Attorney registration number" }, mal: { kind: "mal", label: "Malpractice insurance" }, firm: { kind: "priv", label: "Firm" }
    },
    roles: {
      "Attorney": { on: ["ohbar", "reg", "mal", "firm"], more: ["otherbar", "fed", "app", "phv", "spec"] },
      "New lawyer": { on: ["ohbar", "reg", "firm"], more: ["mal", "otherbar", "fed"] },
      "Other": { on: ["ohbar"], more: ["otherbar", "fed", "app", "phv", "spec", "reg", "mal", "firm"] }
    }
  },
  publicIds: ["Attorney registration", "Bar number", "Other"], noExpiryIds: ["Attorney registration", "Bar number"],
  kindWords: { license: /\bbar\b|\blicen[cs]e|\bregistration\b/, cert: /\bspecialist|\bcertif/, life: /\bcourt\b|\bpro hac\b|\bfederal\b/, id: /\bregistration number\b|\bbar number\b/, mal: /\b(malpractice|insurance|policy)\b/, priv: /\bfirm\b/ },
  credWords: [
    [/\bpro hac vice\b|\bphv\b/, { kind: "life", lifeType: "Pro hac vice" }], [/\bcourt of appeals\b|\bcircuit\b/, { kind: "life", lifeType: "U.S. Court of Appeals" }], [/\bdistrict court\b|\bfederal court\b/, { kind: "life", lifeType: "U.S. District Court" }],
    [/\bmalpractice\b|\binsurance\b/, { kind: "mal" }], [/\bspecialist\b|\bboard certif/, { kind: "cert" }],
    [/\battorney registration\b|\bregistration\b/, { kind: "license", key: "renewDue" }], [/\bbar\b|\blicen[cs]e\b/, { kind: "license" }]],
  askEx: () => ["1.5 hrs ethics CLE yesterday", "Malpractice renews March 2027", "When is my CLE due?", "What's due?", "Am I on pace?", "Remind me to file attorney registration"],
  askHelp: ["“3 hrs estate planning CLE from the state bar yesterday”", "“1 hour professional conduct last Tuesday”", "“Malpractice expires March 2027”", "“When is my CLE due?”"],
  addEx: { creds: "Malpractice renews March 2027", all: "3 hrs CLE yesterday", tip: "Try “Pro hac vice expires May 2027” or “Remind me to file attorney registration by Aug 15”." },
  todoHint: "File attorney registration, renew malpractice…",
  docTags: ["Bar card", "Certificate of good standing", "CLE certificate", "Malpractice declarations", "Court admission", "Resume", "Photo ID", "Other"],
  vaultNote: "Bar card, good standing certificates, CLE certificates, malpractice declarations. Take a photo or pick a PDF. Kept on this phone only and included in your backup.",
  packet: { name: "Attorney packet", desc: "Bar and court admissions, certifications, malpractice, firm and CLE totals in one clean PDF.", idHint: "Registration and bar numbers are public, so they show in full. Turn this on to also show policy numbers in full." },
  practice: { title: "Hours", empty: "Track hours you want to show, like pro bono hours.", add: "Track hours" },
  disclaimer: "This app tracks the dates and hours you enter. It doesn't give legal advice about your own compliance, and it doesn't file anything with a court. Check every rule with the court or bar that set it.",
  sampleWho: "a made-up attorney"
};

/* every pack gets the same keys, so the rest of the app never has to check */
Object.values(PACKS).forEach(pk => {
  pk.sub = Object.assign({ pharm: null, law: null, approved: "Formally approved" }, pk.sub);
  pk.subShort = Object.assign({}, pk.subShort);
  ["pharm", "law", "approved"].forEach(k => { if (pk.sub[k] && !pk.subShort[k]) pk.subShort[k] = pk.sub[k]; });
  pk.subRx = pk.subRx || {}; pk.cats = pk.cats || {}; pk.catShort = pk.catShort || {}; pk.catRx = pk.catRx || {};
  pk.catWord = pk.catWord || "Category"; pk.catNone = pk.catNone || "None";
  pk.publicIds = pk.publicIds || []; pk.noExpiryIds = pk.noExpiryIds || [];
  pk.home = pk.home || [["ce", "CE progress"], ["todo", "To do"], ["creds", "Your cards"], ["notes", "Notes"]];
  pk.cardsTitle = pk.cardsTitle || "Your cards";
  pk.sections.forEach(s => { s.top = s.top || s.label; s.short = s.short || s.one.replace(/^\w/, c => c.toUpperCase()); s.dateWord = s.dateWord || "Expires"; s.expWord = s.expWord || " expires"; s.defTitle = s.defTitle || s.top; });
});
const CATN = k => P.cats[k] || "Category " + k;
const CATS = k => P.catShort[k] || P.cats[k] || "Cat " + k;
const NOEXP = c => c.kind === "id" && P.noExpiryIds.includes(c.idKind);
const FLABEL = (kind, key, d) => { const s = SECT(kind), f = s && s.fields.find(x => x[0] === key); return f ? f[1] : d; };
const SUBCOL = k => k === "pharm" ? "var(--pharm)" : k === "law" ? "var(--law)" : "var(--ok)";
const SUBS_ON = () => ["pharm", "law"].filter(k => P.sub[k]);

/* ---------- example people, one per profession. Every name, number and company is made up. ---------- */
function sampleTools(s) {
  const C = o => { const c = Object.assign({ id: uid(), numStore: "full", status: "auto" }, o); s.creds.push(c); return c; };
  const R = o => { const r = Object.assign({ id: uid(), subs: {} }, o); s.rules.push(r); return r; };
  const E = (days, title, provider, hours, o, applies, alloc) => s.ce.push(Object.assign({ id: uid(), date: T(days), title, provider, hours, pharm: 0, law: 0, cat: "", approved: true, applies: applies.map(r => r.id), alloc: {}, proof: "", notes: "" }, o, { alloc: Object.fromEntries((alloc || []).map(([r, h]) => [r.id, h])) }));
  const todo = (text, due, done) => s.todos.push({ id: uid(), text, due, done: !!done });
  const note = text => s.notes.push({ id: uid(), text });
  const back = (end, years) => iso(addDays(addYears(D(end), -years), 1));
  return { C, R, E, todo, note, back };
}
const SAMPLES = {
  realestate(s) {
    s.profile = { name: "Morgan Ellis", role: "Salesperson", states: "Ohio", pack: "realestate" };
    const { C, R, E, todo, note, back } = sampleTools(s), ceEnd = T(210);
    const lic = C({ kind: "license", title: "Salesperson", issuer: "Ohio Division of Real Estate", number: "SAL.0000000000", issued: "2019-03-14", renewDue: ceEnd, notes: "CE is due by my birthday every 3 years." });
    const nar = C({ kind: "life", lifeType: "REALTOR (NAR)", title: "REALTOR (NAR)", issuer: "Example County REALTORS", number: "000000000", expires: T(63), notes: "Dues cover local, state and national." });
    C({ kind: "life", lifeType: "MLS", title: "MLS", issuer: "Example Regional MLS", expires: T(93), notes: "Quarterly fees on autopay." });
    C({ kind: "id", idKind: "NRDS ID", title: "NRDS ID", number: "000000000" });
    C({ kind: "id", idKind: "Lockbox key", title: "Lockbox key", number: "0000", expires: T(155), notes: "Key app subscription." });
    C({ kind: "cert", title: "ABR", issuer: "NAR", issued: "2022-05-01", expires: T(245), notes: "Accredited Buyer's Representative. Yearly dues keep it active." });
    C({ kind: "mal", issuer: "Example E&O Insurance", title: "Example E&O Insurance", number: "EO-000000", limits: "$1M / $1M", expires: T(118) });
    C({ kind: "priv", title: "Example Realty Group", privStatus: "Active", reappt: T(300), docsDue: T(20), notes: "Send them the new E&O certificate." });
    const rOH = R({ credId: lic.id, name: "Ohio license CE", start: back(ceEnd, 3), end: ceEnd, target: 30, caps: { A: [3, 30], B: [3, 30], C: [3, 30] }, elective: true, preset: "oh-re" });
    const rNAR = R({ credId: nar.id, name: "REALTOR Code of Ethics", start: "2025-01-01", end: "2027-12-31", target: 2.5, preset: "nar-ethics" });
    E(-700, "Ohio core law", "Example Real Estate School", 3, { cat: "A" }, [rOH]);
    E(-520, "Civil rights and fair housing", "Example Real Estate School", 3, { cat: "B" }, [rOH]);
    E(-400, "Pricing homes in a shifting market", "Example CE Online", 6, {}, [rOH]);
    E(-260, "Contracts and disclosures", "Example County REALTORS", 4, {}, [rOH]);
    E(-150, "Code of Ethics for REALTORS", "Example County REALTORS", 3, { cat: "C" }, [rOH, rNAR]);
    E(-60, "Advertising and social media rules", "Example CE Online", 3, {}, [rOH]);
    E(-14, "Safety for agents", "Example County REALTORS", 2, {}, [rOH]);
    todo("Pay REALTOR dues", T(55)); todo("Send new E&O certificate to the brokerage", T(18)); todo("Book 6 more CE hours", T(150)); todo("Renew lockbox key", T(-3), true);
    note("CE is due by my birthday every 3 years."); note("Keep every CE certificate in Files › Real estate."); note("Check each rule with the Ohio Division of Real Estate.");
  },
  trades(s) {
    s.profile = { name: "Casey Brooks", role: "Electrician", states: "Ohio", pack: "trades" };
    const { C, R, E, todo, note, back } = sampleTools(s), licEnd = T(150);
    const ec = C({ kind: "license", title: "Electrical contractor", issuer: "Ohio OCILB", number: "EL.00000", issued: "2018-04-02", expires: licEnd, notes: "10 CE hours a year, 5 on the code." });
    C({ kind: "license", title: "Journeyman electrician", issuer: "City of Columbus", number: "J-0000", expires: T(400) });
    C({ kind: "cert", title: "Fire alarm, Level II", issuer: "NICET", number: "000000", issued: "2021-09-01", expires: T(520) });
    C({ kind: "life", lifeType: "OSHA 30", title: "OSHA 30", issuer: "Example Safety Training", notes: "Card doesn't expire. Some jobs want a refresher every 5 years." });
    C({ kind: "life", lifeType: "NFPA 70E", title: "NFPA 70E", issuer: "Example Safety Training", expires: T(240) });
    C({ kind: "life", lifeType: "First aid / CPR", title: "First aid / CPR", issuer: "Example Safety Training", expires: T(40) });
    C({ kind: "id", idKind: "Contractor registration", title: "Contractor registration", number: "CR-0000", expires: T(75) });
    C({ kind: "mal", title: "General liability", issuer: "Example Insurance Co.", number: "GL-000000", limits: "$1M / $2M", expires: licEnd });
    C({ kind: "mal", title: "Surety bond", issuer: "Example Surety", number: "BD-000000", limits: "$25,000", expires: licEnd });
    C({ kind: "priv", title: "City of Columbus", privStatus: "Active", reappt: T(75), docsDue: T(45) });
    C({ kind: "priv", title: "City of Dublin", privStatus: "Active", reappt: T(200) });
    const rEC = R({ credId: ec.id, name: "Ohio electrical contractor CE", start: back(licEnd, 1), end: licEnd, target: 10, subs: { pharm: 5 }, preset: "oh-elec" });
    E(-180, "NEC changes, part 1", "Example Trade School", 4, { pharm: 4 }, [rEC]);
    E(-90, "Arc flash safety", "Example Safety Training", 2, {}, [rEC]);
    E(-20, "Grounding and bonding", "Example Trade School", 1, { pharm: 1 }, [rEC]);
    todo("Renew Columbus contractor registration", T(70)); todo("Send liability certificate to Example Builders", T(10)); todo("Book 3 more CE hours", T(120)); todo("Renew CPR card", T(35));
    s.practice = [{ id: uid(), name: "Work hours this year", credId: null, target: 2000, logged: 1650, recent: 0, recentTarget: 0, note: "Handy proof for a license that asks for work experience." }];
    note("Contractor license: 10 CE hours a year, 5 on the electrical code."); note("Each city wants a current insurance certificate on file."); note("Check each rule with OCILB and the city.");
  },
  teachers(s) {
    s.profile = { name: "Taylor Nguyen", role: "Teacher", states: "Ohio", pack: "teachers" };
    const { C, R, E, todo, note, back } = sampleTools(s), licEnd = T(244);
    const lic = C({ kind: "license", title: "5-year professional", issuer: "Ohio Department of Education and Workforce", number: "OH0000000", issued: back(licEnd, 5), expires: licEnd, notes: "Grades 4 to 9, language arts and social studies." });
    C({ kind: "cert", title: "Reading endorsement", issuer: "Ohio Department of Education and Workforce", issued: "2023-08-15", expires: licEnd });
    C({ kind: "life", lifeType: "FBI background check", title: "FBI background check", issuer: "Example Fingerprinting", expires: T(130), notes: "Every 5 years." });
    C({ kind: "life", lifeType: "CPR / First aid", title: "CPR / First aid", issuer: "Example Safety Training", expires: T(35) });
    C({ kind: "life", lifeType: "Pupil activity permit", title: "Pupil activity permit", issuer: "Ohio Department of Education and Workforce", expires: T(300), notes: "For coaching cross country." });
    C({ kind: "id", idKind: "Educator ID", title: "Educator ID", number: "OH0000000" });
    C({ kind: "mal", issuer: "Example Teachers Union", title: "Example Teachers Union", limits: "$1M", expires: T(250) });
    C({ kind: "priv", title: "Example City Schools", privStatus: "Continuing contract", docsDue: T(30) });
    const rL = R({ credId: lic.id, name: "Ohio 5-year license", start: back(licEnd, 5), end: licEnd, target: 180, preset: "oh-5yr" });
    E(-1300, "Summer literacy institute", "Example University", 30, {}, [rL]);
    E(-1000, "Classroom management workshop", "Example ESC", 12, {}, [rL]);
    E(-760, "Reading endorsement coursework", "Example University", 45, {}, [rL]);
    E(-500, "Supporting English learners", "Example ESC", 18, {}, [rL]);
    E(-300, "Science of reading training", "Example ESC", 24, {}, [rL]);
    E(-120, "Teaching with technology", "Example City Schools", 9, {}, [rL]);
    E(-30, "Trauma-informed classrooms", "Example ESC", 6, {}, [rL]);
    todo("Get IPDP signed by the LPDC", T(28)); todo("Schedule FBI fingerprinting", T(100)); todo("Renew CPR before spring sports", T(30));
    note("Renewal: 180 contact hours or 6 semester hours, approved by the LPDC."); note("FBI check every 5 years."); note("Check each rule with the state and your LPDC.");
  },
  cpa(s) {
    s.profile = { name: "Jamie Carter", role: "CPA", states: "Ohio", pack: "cpa" };
    const { C, R, E, todo, note } = sampleTools(s), yEnd = T(63), cycleEnd = T(428);
    const lic = C({ kind: "license", title: "CPA", issuer: "Accountancy Board of Ohio", number: "CPA.00000", issued: "2016-10-01", expires: cycleEnd });
    const cma = C({ kind: "cert", title: "CMA", issuer: "IMA", number: "000000", issued: "2020-02-01", expires: yEnd, recert: "30 CPE hours a year", hoursNeeded: 30 });
    C({ kind: "life", lifeType: "PTIN", title: "PTIN", issuer: "IRS", number: "P00000000", expires: yEnd, notes: "Renews each fall for the next year." });
    C({ kind: "life", lifeType: "Firm registration", title: "Firm registration", issuer: "Accountancy Board of Ohio", expires: cycleEnd });
    C({ kind: "id", idKind: "AICPA member", title: "AICPA member", number: "0000000" });
    C({ kind: "mal", issuer: "Example Liability Co.", title: "Example Liability Co.", number: "PL-000000", limits: "$1M / $1M", expires: T(180) });
    C({ kind: "priv", title: "Example & Co. CPAs", privStatus: "Owner", docsDue: T(240) });
    const rC = R({ credId: lic.id, name: "Ohio CPA CPE", start: "2025-01-01", end: cycleEnd, target: 120, subs: { pharm: 3 }, preset: "oh-cpa" });
    const rM = R({ credId: cma.id, name: "CMA CPE", start: "2026-01-01", end: yEnd, target: 30, subs: { pharm: 2 }, preset: "cma" });
    E(-560, "Federal tax update", "Example CPA Society", 16, {}, [rC]);
    E(-480, "Ethics for Ohio CPAs", "Example CPA Society", 3, { pharm: 3 }, [rC]);
    E(-350, "Lease accounting deep dive", "Example CPE Online", 8, {}, [rC]);
    E(-250, "Data analytics in Excel", "Example CPE Online", 12, {}, [rC, rM]);
    E(-150, "Internal controls", "Example CPE Online", 10, {}, [rC, rM]);
    E(-70, "Business ethics for CMAs", "Example CPE Online", 2, { pharm: 2 }, [rC, rM]);
    E(-25, "Year-end tax planning", "Example CPA Society", 8, {}, [rC, rM]);
    todo("Renew PTIN for next year", T(40)); todo("Send peer review letter to the board", T(240)); todo("Plan next year's CPE", T(70));
    note("Ohio: 120 hours every 3 years, at least 20 each year, 3 on ethics."); note("PTIN renews every fall."); note("Check each rule with the Accountancy Board.");
  },
  legal(s) {
    s.profile = { name: "Riley Morgan", role: "Attorney", states: "Ohio", pack: "legal" };
    const { C, R, E, todo, note } = sampleTools(s), cleEnd = T(63);
    const bar = C({ kind: "license", title: "Ohio bar", issuer: "Supreme Court of Ohio", number: "0000000", issued: "2014-11-10", renewDue: T(307), notes: "Attorney registration every 2 years." });
    C({ kind: "license", title: "Kentucky bar", issuer: "Kentucky", number: "00000", issued: "2018-04-20", renewDue: T(245) });
    C({ kind: "life", lifeType: "U.S. District Court", title: "U.S. District Court", issuer: "S.D. Ohio", expires: T(520), notes: "Check the court's renewal rule." });
    C({ kind: "life", lifeType: "Pro hac vice", title: "Pro hac vice", issuer: "Example County Court, Indiana", expires: T(90) });
    C({ kind: "cert", title: "Estate planning specialist", issuer: "Example State Bar", issued: "2021-06-01", expires: T(700) });
    C({ kind: "id", idKind: "Attorney registration", title: "Attorney registration", number: "0000000" });
    C({ kind: "mal", issuer: "Example Lawyers Mutual", title: "Example Lawyers Mutual", number: "LM-000000", limits: "$1M / $3M", expires: T(55) });
    C({ kind: "priv", title: "Example Morgan Law LLC", privStatus: "Partner" });
    const rL = R({ credId: bar.id, name: "Ohio CLE", start: "2025-01-01", end: cleEnd, target: 24, subs: { pharm: 2.5 }, preset: "oh-cle" });
    E(-600, "Estate planning institute", "Example State Bar", 6, {}, [rL]);
    E(-420, "Ethics in client communication", "Example County Bar", 1.5, { pharm: 1.5 }, [rL]);
    E(-300, "Trust administration update", "Example CLE Online", 3, {}, [rL]);
    E(-180, "Elder law essentials", "Example County Bar", 3, {}, [rL]);
    E(-90, "Lawyer well-being", "Example CLE Online", 1, { pharm: 1 }, [rL]);
    E(-40, "Tax update for estate planners", "Example State Bar", 4, {}, [rL]);
    todo("Finish 5.5 CLE hours by Dec 31", T(60)); todo("Renew malpractice policy", T(50)); todo("Renew pro hac vice in Indiana", T(80));
    note("Last name M to Z: CLE due Dec 31 of even years."); note("Attorney registration every 2 years, by Sept 1 of odd years."); note("Up to 12 extra hours carry over.");
  }
};
SAMPLES.nursing = sampleNursing;
function sample(pack) { const s = blank(); s.sample = true; (own(SAMPLES, pack) ? SAMPLES[pack] : SAMPLES.nursing)(s); return s; }
/* the requirement window a preset brings: back from the card's renewal date, or a fixed cycle */
function presetWindow(pre, end) {
  let e = pre.fixedEnd || end;
  /* Ohio CLE: due Dec 31 of odd years for last names A to L, even years for M to Z */
  if (pre.endRule === "ohcle") { const last = String(S.profile.name || "").trim().split(/\s+/).pop() || "A", odd = /^[a-l]/i.test(last); let y = TODAY.getFullYear(); if ((y % 2 === 1) !== odd) y++; e = y + "-12-31"; }
  return { start: iso(addDays(addYears(D(e), -(pre.years || 2)), 1)), end: e }; }
/* the art behind Home's big deadline card, one per profession */
const TEX_OPEN = `<svg class="tex" viewBox="0 0 400 300" preserveAspectRatio="xMaxYMin slice" aria-hidden="true">`;
const lines = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join("");
const HERO_TEXES = {
  roofs: TEX_OPEN + `<path d="M0 300v-50l40-30 40 30v-20l35-26 35 26v24l45-34 45 34v-14l30-22 30 22v-6l50-38 50 38v68z" style="fill:var(--hero-ink);opacity:.05"/>
    <g style="fill:none;stroke:var(--hero-num);stroke-width:1.5;stroke-linejoin:round"><path d="M250 120l70-52 70 52" style="opacity:.2"/><path d="M268 106v94h104v-94" style="opacity:.14"/><path d="M308 200v-42h24v42" style="opacity:.14"/><path d="M210 146l110-84 110 84" style="opacity:.07"/></g></svg>`,
  grid: TEX_OPEN + `<g style="stroke:var(--hero-ink);stroke-width:1;opacity:.07">${lines(11, i => `<path d="M${200 + i * 20} 0v300"/>`)}${lines(16, i => `<path d="M180 ${i * 20}h220"/>`)}</g>
    <path d="M338 26l-44 76h32l-26 66 66-88h-34l28-54z" style="fill:none;stroke:var(--hero-num);stroke-width:2;stroke-linejoin:round;opacity:.22"/></svg>`,
  ruled: TEX_OPEN + `<g style="stroke:var(--hero-ink);stroke-width:1;opacity:.07">${lines(14, i => `<path d="M0 ${22 + i * 22}h400"/>`)}</g><path d="M372 0v300" style="stroke:var(--hero-num);stroke-width:1.5;opacity:.25"/>
    <g style="fill:none;stroke:var(--hero-num);stroke-width:1.6;stroke-linecap:round;opacity:.2"><path d="M300 40c10-14 26-14 30 2 4 16-14 26-24 18"/><path d="M290 70l40-6"/></g></svg>`,
  ledger: TEX_OPEN + `<g style="stroke:var(--hero-ink);stroke-width:1;opacity:.07">${lines(4, i => `<path d="M${250 + i * 50} 0v300"/>`)}${lines(12, i => `<path d="M230 ${18 + i * 24}h170"/>`)}</g>
    <g style="fill:var(--hero-num);opacity:.13">${[70, 110, 90, 140, 170].map((h, i) => `<rect x="${262 + i * 26}" y="${230 - h}" width="16" height="${h}" rx="3"/>`).join("")}</g>
    <path d="M262 150l26-30 26 14 26-40 26 8 26-44" style="fill:none;stroke:var(--hero-num);stroke-width:2;opacity:.24;stroke-linejoin:round"/></svg>`,
  columns: TEX_OPEN + `<g style="fill:none;stroke:var(--hero-num);stroke-width:1.5;stroke-linejoin:round"><path d="M226 92L318 44l92 48z" style="opacity:.2"/><path d="M226 100h184M226 230h184M218 244h200" style="opacity:.16"/>
    ${lines(5, i => `<path d="M${240 + i * 36} 108v114M${254 + i * 36} 108v114" style="opacity:.13"/>`)}</g></svg>`
};
const heroTex = () => HERO_TEXES[P.heroTex] || HERO_TEX;
