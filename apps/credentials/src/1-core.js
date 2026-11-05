(() => {
"use strict";
const KEY = "cyberhub-credentials-v1";
const APP_ID = "cyberhub-credentials";
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
/* on big screens (open foldable, iPad) the page scrolls inside the body, so the top bar and tab bar stay put;
   phones scroll the window as always. Read and set the scroll only through these two. */
/* Running inside a preview frame (the Claude app), not Safari or the Home Screen? The tab bar gets lifted there. */
try { if (window.self !== window.top) document.documentElement.classList.add("framed"); } catch (e) { document.documentElement.classList.add("framed"); }
const shellQ = window.matchMedia ? matchMedia("(min-width: 600px) and (min-height: 500px)") : null;
const inShell = () => !!(shellQ && shellQ.matches);
const getY = () => inShell() ? document.body.scrollTop : window.scrollY;
function scrollToY(top, smooth) {
  const s = inShell() ? document.body : window;
  try { s.scrollTo(smooth ? { top, behavior: "smooth" } : { top, left: 0 }); } catch (e) { if (s === window) window.scrollTo(0, top); else s.scrollTop = top; }
}
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };

/* ---------- dates (local noon avoids daylight-saving drift) ---------- */
const ISO_RX = /^\d{4}-\d{2}-\d{2}$/;
const D = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d, 12); };
const iso = dt => dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
const addDays = (dt, n) => { const x = new Date(dt); x.setDate(x.getDate() + n); return x; };
const addYears = (dt, n) => { const x = new Date(dt); x.setFullYear(x.getFullYear() + n); return x; };
const dayDiff = (a, b) => Math.round((b - a) / 864e5);
const TODAY = (() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12); })();
const T = n => iso(addDays(TODAY, n));
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WD = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const short = dt => MON[dt.getMonth()] + " " + dt.getDate();
const longD = s => { if (!s) return "—"; const dt = D(s); return MON[dt.getMonth()] + " " + dt.getDate() + ", " + dt.getFullYear(); };
const fmtLong = longD;
const inDays = s => dayDiff(TODAY, D(s));
function relDays(n) {
  if (n === 0) return "today"; if (n === 1) return "tomorrow"; if (n === -1) return "yesterday";
  if (n < 0) return Math.abs(n) + " days ago";
  return "in " + n + " days";
}

/* ---------- hours ---------- */
const r2 = v => Math.round((+v || 0) * 100) / 100;
const hrs = v => (r2(v)).toLocaleString(undefined, { maximumFractionDigits: 2 });
const sum = (arr, f) => r2(arr.reduce((a, x) => a + (f ? f(x) : x), 0));
const pl = (n, one, many) => hrs(n) + " " + (n === 1 ? one : (many || one + "s"));

/* ---------- icons ---------- */
const sv = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const st = (w) => `style="fill:none;stroke:currentColor;stroke-width:${w || 2};stroke-linecap:round;stroke-linejoin:round"`;
const ICON = {
  xmark: sv(`<path d="M7 7l10 10M17 7L7 17" ${st(2.5)}/>`),
  license: sv(`<rect x="3" y="5" width="18" height="14" rx="3" ${st()}/><circle cx="8.5" cy="11" r="2" ${st(1.8)}/><path d="M5.8 16c.6-1.4 1.6-2 2.7-2s2.1.6 2.7 2M14 10h4M14 13.5h3" ${st(1.8)}/>`),
  cert: sv(`<circle cx="12" cy="9.5" r="5.5" ${st()}/><path d="M9 14.5L7.5 21l4.5-2.5 4.5 2.5-1.5-6.5" ${st()}/><path d="M10 9.5l1.4 1.4 2.8-2.8" ${st()}/>`),
  life: sv(`<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" ${st()}/><path d="M6.5 12h3l1.2-2.2 2 4.4 1.3-2.2h3.5" ${st(1.7)}/>`),
  id: sv(`<rect x="4" y="3.5" width="16" height="17" rx="3" ${st()}/><path d="M8 8.5h8M8 12h8M8 15.5h4" ${st()}/>`),
  mal: sv(`<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" ${st()}/><path d="M9 12l2 2 4-4" ${st()}/>`),
  priv: sv(`<path d="M4 20V9l8-5 8 5v11" ${st()}/><path d="M9 20v-5h6v5M10.5 9.5h3M12 8v3" ${st()}/>`),
  ce: sv(`<path d="M4 6.5C6.5 5 9.5 5 12 6.5 14.5 5 17.5 5 20 6.5V19c-2.5-1.5-5.5-1.5-8 0-2.5-1.5-5.5-1.5-8 0z" ${st()}/><path d="M12 6.5V19" ${st()}/>`),
  rule: sv(`<path d="M4 20h16M6 16V10M10 16V6M14 16v-4M18 16V8" ${st(2.2)}/>`),
  todo: sv(`<rect x="4" y="4" width="16" height="16" rx="4" ${st()}/><path d="M8.5 12l2.5 2.5 4.5-5" ${st()}/>`),
  clock: sv(`<circle cx="12" cy="12" r="8" ${st()}/><path d="M12 7.5V12l3 2" ${st()}/>`),
  note: sv(`<path d="M6 3.5h9l3 3V20.5H6z" ${st()}/><path d="M9 10h6M9 13.5h6M9 17h3" ${st()}/>`),
  cal: sv(`<rect x="3.5" y="5" width="17" height="15" rx="3" ${st()}/><path d="M3.5 10h17M8 3v4M16 3v4" ${st()}/>`),
  check: sv(`<path d="M5 12.5l4.5 4.5L19 7.5" ${st(3.2)}/>`),
  plus: sv(`<path d="M12 5v14M5 12h14" ${st(2.6)}/>`),
  chev: `<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" ${st(2.6)}/></svg>`,
  brush: sv(`<path d="M14.5 4.5l5 5L11 18l-5-5z" ${st()}/><path d="M6 13c-2 0-3 1.5-3 3.5S2 20 2 20s3.5.5 5-1 1.5-3 0-4.5" style="fill:currentColor"/>`),
  sliders: sv(`<path d="M4 7h10M18 7h2M4 17h4M12 17h8" ${st()}/><circle cx="16" cy="7" r="2.5" ${st()}/><circle cx="10" cy="17" r="2.5" ${st()}/>`),
  up: sv(`<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 14v4a2 2 0 002 2h10a2 2 0 002-2v-4" ${st()}/>`),
  down: sv(`<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 14v4a2 2 0 002 2h10a2 2 0 002-2v-4" ${st()}/>`),
  phone: sv(`<rect x="7" y="2.5" width="10" height="19" rx="2.5" ${st()}/><path d="M10.5 18.5h3" ${st()}/>`),
  chat: sv(`<path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 17h-7.5L7 20.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z" ${st(1.9)}/>`),
  sparkle: sv(`<path d="M12 3l2 5.5L19.5 10.5 14 12.5 12 18l-2-5.5L4.5 10.5 10 8.5z" ${st(1.9)}/>`),
  erase: sv(`<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" ${st()}/>`),
  pdf: sv(`<path d="M6 3.5h8.5L19 8v12.5H6z" ${st()}/><path d="M14 3.5V8h5M9 13h6M9 16.5h6" ${st()}/>`),
  bell: sv(`<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" ${st()}/><path d="M10 20.5a2 2 0 0 0 4 0" ${st()}/>`),
  person: sv(`<circle cx="12" cy="8.5" r="3.8" ${st()}/><path d="M4.5 20c1.3-3.6 4.2-5.2 7.5-5.2s6.2 1.6 7.5 5.2" ${st()}/>`),
  send: sv(`<path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" ${st(2.4)}/>`),
  wand: sv(`<path d="M5 19L15.5 8.5M14 5l1-2 1 2 2 1-2 1-1 2-1-2-2-1zM19 12l.7-1.3L21 10l-1.3-.7L19 8l-.7 1.3L17 10l1.3.7z" ${st(1.8)}/>`),
  lock: sv(`<rect x="5" y="10.5" width="14" height="10" rx="2.5" ${st()}/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" ${st()}/>`)
};
const ic = (kind, svg) => `<span class="ic" style="background:var(--${String(kind).replace(/[^a-z0-9-]/gi, "")}-fill);color:#fff" aria-hidden="true">${svg || ""}</span>`;
const kic = kind => ic("k-" + kind, ICON[kind]);
const HERO_TEX = `<svg class="tex" viewBox="0 0 400 300" preserveAspectRatio="xMaxYMin slice" aria-hidden="true">
  <g style="fill:none;stroke:var(--hero-num)"><circle cx="372" cy="10" r="70" style="opacity:.12;stroke-width:1.5"/><circle cx="372" cy="10" r="118" style="opacity:.08;stroke-width:1.5"/><circle cx="372" cy="10" r="170" style="opacity:.05;stroke-width:1.5"/></g>
  <path d="M0 250 C 70 215, 130 290, 210 250 S 340 205, 400 232 L400 300 L0 300 Z" style="fill:var(--hero-ink);opacity:.04"/>
  <path d="M0 272 C 90 245, 170 300, 260 268 S 360 248, 400 262 L400 300 L0 300 Z" style="fill:var(--hero-ink);opacity:.04"/></svg>`;
const ART_EMPTY = color => `<svg viewBox="0 0 120 80" aria-hidden="true"><ellipse cx="60" cy="72" rx="40" ry="5" style="fill:var(--line)"/>
  <rect x="30" y="16" width="60" height="46" rx="10" style="fill:var(--surface-2);stroke:var(--line);stroke-width:2"/>
  <path d="M42 32h28M42 42h20" style="stroke:var(--line);stroke-width:4;stroke-linecap:round"/>
  <circle cx="86" cy="20" r="10" style="fill:${color}"/><path d="M81.5 20.5l3 3 5.5-6" style="fill:none;stroke:var(--surface);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round"/></svg>`;
const empty = (color, text) => `<div class="empty">${ART_EMPTY(color)}<div>${text}</div></div>`;

/* ---------- profession packs ----------
   A pack sets the words, the six credential sections and their fields, the requirement presets,
   the default theme and the Home layout. Rules are data, so a new state or board is new data. */
const STATUS_OPTS = [["auto", "Work it out for me"], ["active", "Active"], ["progress", "In progress"], ["notstarted", "Not started"], ["attention", "Needs attention"]];
const PACKS = {
  nursing: {
    id: "nursing", name: "Nurses, NPs and clinicians", short: "Clinician", who: "RNs, nurse practitioners, PAs and physicians",
    appName: "Clinician Credentials", accent: "navy",
    roles: ["RN", "NP / APRN", "PA", "MD / DO", "Other"],
    ce: "CE", ceLong: "Continuing education", ceTab: "CE Log", hoursWord: "contact hours",
    sub: { pharm: "Pharmacology", law: "Law and rules (Category A)", approved: "Formally approved" },
    subShort: { pharm: "Pharm", law: "Law", approved: "Approved" },
    catWord: "CERP category",
    home: [["creds", "Your cards"], ["ce", "CE progress"], ["todo", "To do"], ["practice", "Practice hours"], ["notes", "Notes"]],
    sections: [
      { kind: "license", label: "Licenses", one: "license", fields: [
        ["title", "License type", "text", "RN, APRN-CNP, PA…"], ["issuer", "State or board", "text", "Ohio Board of Nursing"], ["number", "License number", "idnum"],
        ["issued", "Issued", "date"], ["expires", "Expires", "date"], ["renewOpens", "Renewal opens", "date"], ["renewDue", "Renewal due", "date"], ["status", "Status", "status"], ["notes", "Notes", "area"]] },
      { kind: "cert", label: "Board certifications", one: "certification", fields: [
        ["issuer", "Certifying body", "text", "ANCC, AACN, AANP, NCCPA…"], ["title", "Credential", "text", "FNP-BC, CCRN…"], ["number", "Number or ID", "idnum"],
        ["issued", "Certified since", "date"], ["expires", "Expires", "date"], ["recert", "How you recertify", "text", "Hours, or retake the exam"], ["hoursNeeded", "Hours needed", "number"],
        ["renewDue", "Renewal application due", "date"], ["status", "Status", "status"], ["notes", "Notes", "area"]] },
      { kind: "life", label: "Life support", one: "life support card", fields: [
        ["lifeType", "Type", "select", ["BLS", "ACLS", "PALS", "NRP", "ATLS", "Other"]], ["title", "Name (if Other)", "text", "TNCC, ENPC…", true], ["issuer", "Provider", "text", "American Heart Association"],
        ["expires", "Renew by", "date"], ["number", "Card #", "idnum"], ["notes", "Notes", "area"]] },
      { kind: "id", label: "IDs", one: "ID", fields: [
        ["idKind", "Kind", "select", ["NPI", "DEA", "State CSR", "Other"]], ["title", "Name (if Other)", "text", "CAQH ID…", true], ["number", "Number", "idnum"], ["expires", "Expires", "date"], ["notes", "Notes", "area"]] },
      { kind: "mal", label: "Malpractice", one: "policy", fields: [
        ["issuer", "Carrier", "text", "Insurance company"], ["number", "Policy #", "idnum"], ["limits", "Limits", "text", "$1M / $3M"], ["expires", "Expires", "date"], ["notes", "Notes", "area"]] },
      { kind: "priv", label: "Privileges", one: "facility", fields: [
        ["title", "Facility", "text", "Hospital or clinic"], ["privStatus", "Status", "select", ["Active", "Provisional", "Pending", "Inactive"]], ["reappt", "Reappointment due", "date"], ["docsDue", "Documents due", "date"], ["notes", "Notes", "area"]] }
    ],
    presets: [
      { id: "oh-rn", name: "Ohio RN", years: 2, target: 24, subs: { law: 1 }, group: "Ohio nursing", note: "24 contact hours each renewal, at least 1 on Ohio nursing law and rules (Category A)." },
      { id: "oh-aprn", name: "Ohio APRN", years: 2, target: 24, subs: { pharm: 12 }, group: "Ohio nursing", note: "24 more hours on top of the RN 24, with at least 12 in advanced pharmacology. The same hour can't count for both." },
      { id: "ancc", name: "ANCC renewal", years: 5, target: 75, subs: { pharm: 25, approved: 60 }, note: "75 CE hours (at least 60 formally approved, 25 pharmacology) plus one professional development category." },
      { id: "ancc-pd", name: "ANCC professional development", years: 5, target: 1, manual: true, note: "Often met by 1,000+ practice hours. Mark it met with a note." },
      { id: "ccrn", name: "CCRN renewal", years: 3, target: 100, caps: { A: [60, 80], B: [10, 30], C: [10, 30] }, note: "100 CERPs: Category A 60 to 80, B 10 to 30, C 10 to 30. Or retake the exam." },
      { id: "custom", name: "Something else", target: 20, note: "Set your own hours and window." }
    ],
    /* The starter kit: pick a role and the usual cards are made for you, waiting only for dates.
       on = ticked for that role, more = shown but not ticked. ohio = requirements added once a date is in (Ohio only);
       ce = requirements added in any state. */
    kit: {
      items: {
        rn: { kind: "license", title: "RN", label: "RN license", board: true, ohio: ["oh-rn"] },
        aprn: { kind: "license", title: "APRN-CNP", label: "APRN license", board: true, ohio: ["oh-aprn"] },
        pa: { kind: "license", title: "PA", label: "PA license", board: true },
        md: { kind: "license", title: "Medical license", label: "Medical license", board: true },
        ancc: { kind: "cert", issuer: "ANCC", label: "ANCC certification", ce: ["ancc"] },
        aanp: { kind: "cert", issuer: "AANP", label: "AANP certification" },
        nccpa: { kind: "cert", issuer: "NCCPA", title: "PA-C", label: "NCCPA (PA-C)" },
        board: { kind: "cert", issuer: "Specialty board", label: "Board certification" },
        ccrn: { kind: "cert", issuer: "AACN", title: "CCRN", label: "CCRN", ce: ["ccrn"] },
        bls: { kind: "life", lifeType: "BLS", label: "BLS" }, acls: { kind: "life", lifeType: "ACLS", label: "ACLS" }, pals: { kind: "life", lifeType: "PALS", label: "PALS" },
        npi: { kind: "id", idKind: "NPI", label: "NPI" }, dea: { kind: "id", idKind: "DEA", label: "DEA" }, csr: { kind: "id", idKind: "State CSR", label: "State CSR" },
        mal: { kind: "mal", label: "Malpractice" }, priv: { kind: "priv", label: "Hospital privileges" }
      },
      roles: {
        "RN": { on: ["rn", "bls"], more: ["acls", "pals", "ccrn", "npi", "mal"] },
        "NP / APRN": { on: ["rn", "aprn", "bls", "npi", "dea", "mal"], more: ["ancc", "aanp", "acls", "pals", "ccrn", "csr", "priv"] },
        "PA": { on: ["pa", "nccpa", "bls", "npi", "dea", "mal"], more: ["acls", "pals", "csr", "priv"] },
        "MD / DO": { on: ["md", "board", "bls", "acls", "npi", "dea", "mal", "priv"], more: ["pals", "csr"] },
        "Other": { on: ["bls"], more: ["rn", "aprn", "pa", "md", "ancc", "aanp", "nccpa", "board", "ccrn", "acls", "pals", "npi", "dea", "csr", "mal", "priv"] }
      }
    },
    practiceIdeas: ["Direct-care hours", "Practice hours", "Precepting hours"],
    lifeHint: "BLS, ACLS, PALS…",
    disclaimer: "This app tracks the dates and hours you enter. It doesn't give clinical, prescribing or legal advice, and it doesn't file anything with a board. Check every rule with the board that issued it.",
    helpClinical: "I only track credential admin. For clinical questions, use your clinical references or colleagues."
  },
};
let P = PACKS.nursing;
const SECT = kind => P.sections.find(s => s.kind === kind);
const SENSITIVE = c => c.kind === "id" && !(P.publicIds || []).includes(c.idKind);

/* ---------- state ---------- */
let S;
const DEFAULT_WINDOWS = [90, 60, 30];
function blank(keep) {
  return { v: 1, sample: false, profile: { name: "", role: "", states: "", pack: "nursing" }, settings: { windows: DEFAULT_WINDOWS.slice() },
    creds: [], rules: [], ce: [], todos: [], practice: [], notes: [], docs: [], look: keep ? keep.look : undefined, lastBackup: keep ? keep.lastBackup : undefined };
}
function validState(s) {
  if (!s || typeof s !== "object" || Array.isArray(s)) return false;
  for (const k of ["creds", "rules", "ce", "todos", "practice", "notes"]) if (!Array.isArray(s[k])) return false;
  return true;
}
function migrate(s) {
  s.settings = s.settings || {};
  if (!Array.isArray(s.settings.windows) || !s.settings.windows.length) s.settings.windows = DEFAULT_WINDOWS.slice();
  s.ce.forEach(e => { e.applies = Array.isArray(e.applies) ? e.applies : []; e.alloc = e.alloc && typeof e.alloc === "object" ? e.alloc : {}; });
  s.rules.forEach(r => { r.subs = r.subs || {}; });
  if (!Array.isArray(s.docs)) s.docs = [];
  if (!own(PACKS, s.profile.pack) || PACKS[s.profile.pack].soon) s.profile.pack = "nursing";
  return s;
}
/* ---------- cleaning saved data ----------
   Everything read back from storage or a backup file goes through clean() first, so a hand-edited
   file can't put code into the page: ids are short and plain, numbers are numbers, dates are dates,
   choices are ones the app knows, and photos are real image data. Anything else is fixed or dropped. */
const ID_RX = /^[A-Za-z0-9_-]{1,40}$/;
/* a saved word only picks from a list if the list really has it: built-in words like "constructor" or "__proto__" never count */
const own = (o, k) => typeof k === "string" && Object.prototype.hasOwnProperty.call(o, k);
const okId = x => typeof x === "string" && ID_RX.test(x) && !(x in Object.prototype);
const IMG_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
const DOC_TYPES = IMG_TYPES.concat(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"]);
const dataUrlOk = (u, types) => { if (typeof u !== "string") return false; const m = /^data:([a-z0-9.+\/-]+);base64,/i.exec(u); return !!m && types.includes(m[1].toLowerCase()) && /^[A-Za-z0-9+/]*={0,2}$/.test(u.slice(m[0].length)); };
const DATE_KEYS = ["issued", "expires", "renewOpens", "renewDue", "reappt", "docsDue", "date", "due", "start", "end", "added"];
const NUM_KEYS = ["hours", "pharm", "law", "target", "hoursNeeded", "logged", "recent", "recentTarget", "size"];
const REF_KEYS = ["credId", "photo"];
const BOOL_KEYS = ["done", "approved", "setup", "elective"];
const OBJ_KEYS = ["subs", "alloc", "manual", "caps", "applies"];
/* fields each kind of record must have as text, so sorting and drawing never trip on a missing one */
const NEED_TEXT = { creds: ["title"], rules: ["name", "start", "end"], ce: ["date", "title"], todos: ["text"], practice: ["name"], notes: ["text"], docs: ["name"] };
function cleanVal(v, depth) {
  if (typeof v === "string") return v.slice(0, 5000);
  if (typeof v === "number") return isFinite(v) ? v : undefined;
  if (typeof v === "boolean" || v === null) return v;
  if (depth > 3 || typeof v !== "object") return undefined;
  if (Array.isArray(v)) return v.slice(0, 500).map(x => cleanVal(x, depth + 1)).filter(x => x !== undefined);
  const o = {};
  for (const k of Object.keys(v)) { if (!/^[A-Za-z][A-Za-z0-9_]{0,40}$/.test(k) || k in Object.prototype || k === "prototype") continue; const x = cleanVal(v[k], depth + 1); if (x !== undefined) o[k] = x; }
  return o;
}
const numMap = o => { const m = {}; if (o && typeof o === "object" && !Array.isArray(o)) for (const k of Object.keys(o)) { const n = +o[k]; if (okId(k) && isFinite(n)) m[k] = Math.max(0, n); } return m; };
function cleanRec(r, seen, need) {
  if (!r || typeof r !== "object" || Array.isArray(r)) return null;
  const o = cleanVal(r, 1);
  if (!okId(o.id) || seen.has(o.id)) o.id = uid();
  seen.add(o.id);
  for (const k of DATE_KEYS) if (k in o && !(typeof o[k] === "string" && (o[k] === "" || ISO_RX.test(o[k])))) o[k] = "";
  for (const k of NUM_KEYS) if (k in o) { const n = +o[k]; o[k] = isFinite(n) ? Math.max(0, n) : 0; }
  for (const k of REF_KEYS) if (k in o && o[k] !== null && !(typeof o[k] === "string" && (o[k] === "" || okId(o[k])))) o[k] = "";
  for (const k of BOOL_KEYS) if (k in o) o[k] = o[k] === true;
  for (const k of Object.keys(o)) {
    if (OBJ_KEYS.includes(k)) { if (typeof o[k] !== "object" || o[k] === null) delete o[k]; continue; }
    if (NUM_KEYS.includes(k) || BOOL_KEYS.includes(k) || (REF_KEYS.includes(k) && o[k] === null)) continue;
    /* everything else is text: a number becomes its digits, anything else becomes empty */
    if (typeof o[k] !== "string") o[k] = typeof o[k] === "number" ? String(o[k]) : "";
  }
  for (const k of need || []) if (typeof o[k] !== "string") o[k] = "";
  return o;
}
function clean(s) {
  const kinds = new Set(Object.values(PACKS).flatMap(p => (p.sections || []).map(x => x.kind)));
  const list = (k, fn) => { const seen = new Set(); return (Array.isArray(s[k]) ? s[k] : []).slice(0, 5000).map(r => cleanRec(r, seen, NEED_TEXT[k])).filter(r => r && (!fn || fn(r) !== false)); };
  const str = v => typeof v === "string" ? v.slice(0, 200) : "";
  const pr = s.profile && typeof s.profile === "object" && !Array.isArray(s.profile) ? s.profile : {};
  const out = { v: 1, sample: s.sample === true, profile: { name: str(pr.name), role: str(pr.role), states: str(pr.states), pack: own(PACKS, pr.pack) && !PACKS[pr.pack].soon ? pr.pack : "nursing" } };
  const w = (s.settings && Array.isArray(s.settings.windows) ? s.settings.windows : []).map(n => Math.round(+n)).filter(n => isFinite(n) && n > 0 && n <= 730).slice(0, 6);
  out.settings = { windows: w.length ? w : DEFAULT_WINDOWS.slice() };
  out.creds = list("creds", c => {
    if (typeof c.kind !== "string" || !kinds.has(c.kind)) return false;
    if (!["full", "last4", "onfile"].includes(c.numStore)) c.numStore = "full";
    if (c.status && c.status !== "auto" && !Object.prototype.hasOwnProperty.call(STATUS_LABEL, c.status)) c.status = "auto";
    for (const k of ["setup"]) if (k in c) c[k] = c[k] === true;
  });
  out.rules = list("rules", r => {
    r.subs = numMap(r.subs);
    if (r.caps) { const caps = {}; for (const k of ["A", "B", "C"]) { const a = Array.isArray(r.caps[k]) ? r.caps[k].map(Number) : null; if (a && a.length === 2 && a.every(isFinite)) caps[k] = [Math.max(0, a[0]), Math.max(0, a[1])]; } r.caps = Object.keys(caps).length ? caps : undefined; if (!r.caps) delete r.caps; }
    if (r.manual) { r.manual = { note: typeof r.manual.note === "string" ? r.manual.note.slice(0, 2000) : "" }; }
  });
  out.ce = list("ce", e => {
    e.applies = (Array.isArray(e.applies) ? e.applies : []).filter(okId);
    e.alloc = numMap(e.alloc);
    if ("cat" in e && !["", "A", "B", "C"].includes(e.cat)) e.cat = "";
    if ("approved" in e) e.approved = e.approved === true;
  });
  out.todos = list("todos", t => { t.done = t.done === true; });
  out.practice = list("practice");
  out.notes = list("notes");
  out.docs = list("docs", d => {
    if (!DOC_TYPES.includes(String(d.type).toLowerCase())) return false;
    if ("ext" in d && !/^[a-z0-9]{1,8}$/i.test(d.ext || "")) d.ext = "";
  });
  const L = s.look;
  if (L && typeof L === "object") {
    out.look = {};
    if (typeof L.accent === "string" && ACCENTS.some(a => a[0] === L.accent)) out.look.accent = L.accent;
    out.look.theme = ["auto", "light", "dark"].includes(L.theme) ? L.theme : "auto";
    if (Array.isArray(L.hidden)) out.look.hidden = L.hidden.filter(x => okId(x) && x.length <= 30).slice(0, 30);
  }
  if (typeof s.lastBackup === "string" && ISO_RX.test(s.lastBackup)) out.lastBackup = s.lastBackup;
  return out;
}
/* photos and files that ride along in a backup: only real image (or document) data, only for records that exist */
function cleanPhotos(photos, st) {
  const out = {}; if (!photos || typeof photos !== "object") return out;
  const ceP = new Set(st.ce.map(e => e.photo).filter(Boolean)), docs = new Set(st.docs.map(d => "doc:" + d.id));
  for (const k of Object.keys(photos)) {
    if (docs.has(k) && dataUrlOk(photos[k], DOC_TYPES)) out[k] = photos[k];
    else if (ceP.has(k) && dataUrlOk(photos[k], IMG_TYPES)) out[k] = photos[k];
  }
  return out;
}
function load() { try { const raw = localStorage.getItem(KEY); if (raw) { const v = JSON.parse(raw); if (validState(v)) return migrate(clean(v)); } } catch (e) {} return null; }
let saveWarned = false;
function save() { if (typeof unreadPinned === "string") return; if (!store.set(KEY, JSON.stringify(S)) && !saveWarned) { saveWarned = true; setTimeout(() => toast("Couldn't save on this device. Storage may be full or turned off. Back up now so you don't lose changes."), 0); } }

/* Example data: a made-up nurse practitioner. Every number here is invented. */
function sampleNursing(s) {
  s.profile = { name: "Alex Rivera", role: "NP / APRN", states: "Ohio", pack: "nursing" };
  const ohStart = T(-362), ohEnd = T(244), certExp = T(190), ccrnStart = T(-515), ccrnEnd = T(580);
  const C = (o) => { const c = Object.assign({ id: uid(), numStore: "full", status: "auto" }, o); s.creds.push(c); return c; };
  const rn = C({ kind: "license", title: "RN", issuer: "Ohio Board of Nursing", number: "RN.000000", issued: "2016-05-10", expires: T(367), renewOpens: T(245), renewDue: T(321), notes: "Print a fresh license verification before reappointment." });
  const aprn = C({ kind: "license", title: "APRN-CNP", issuer: "Ohio Board of Nursing", number: "APRN.CNP.000000", issued: "2021-08-02", expires: T(367), renewOpens: T(245), renewDue: T(321) });
  const fnp = C({ kind: "cert", issuer: "ANCC", title: "FNP-BC", number: "2021000000", issued: iso(addYears(D(certExp), -5)), expires: certExp, recert: "75 CE hours plus professional development", hoursNeeded: 75, renewDue: T(130), notes: "Enter courses in the ANCC portal before applying." });
  const ccrn = C({ kind: "cert", issuer: "AACN", title: "CCRN (Adult)", number: "Customer ID 0000000", issued: "2019-06-01", expires: ccrnEnd, recert: "100 CERPs or the exam", hoursNeeded: 100 });
  C({ kind: "life", lifeType: "BLS", title: "BLS", issuer: "American Heart Association", expires: T(420) });
  C({ kind: "life", lifeType: "ACLS", title: "ACLS", issuer: "American Heart Association", expires: T(26), notes: "Class through work." });
  C({ kind: "id", idKind: "NPI", title: "NPI", number: "1000000000" });
  C({ kind: "id", idKind: "DEA", title: "DEA", number: "0000", numStore: "last4", expires: T(700), notes: "Full number kept in a password manager." });
  C({ kind: "mal", issuer: "Example Mutual Insurance", title: "Example Mutual Insurance", number: "EX-000000", limits: "$1M / $3M", expires: T(64) });
  C({ kind: "priv", title: "Riverside General Hospital", privStatus: "Active", reappt: T(148), docsDue: T(118) });
  const R = (o) => { const r = Object.assign({ id: uid(), subs: {} }, o); s.rules.push(r); return r; };
  const rRN = R({ credId: rn.id, name: "Ohio RN", start: ohStart, end: ohEnd, target: 24, group: "Ohio nursing", subs: { law: 1 }, preset: "oh-rn" });
  const rAP = R({ credId: aprn.id, name: "Ohio APRN", start: ohStart, end: ohEnd, target: 24, group: "Ohio nursing", subs: { pharm: 12 }, preset: "oh-aprn" });
  const rAN = R({ credId: fnp.id, name: "ANCC renewal", start: fnp.issued, end: certExp, target: 75, subs: { pharm: 25, approved: 60 }, preset: "ancc" });
  R({ credId: fnp.id, name: "ANCC professional development", start: fnp.issued, end: certExp, target: 1, manual: { note: "1,240 NP practice hours this cycle (self-reported). Keep the employer letter." }, preset: "ancc-pd" });
  const rCC = R({ credId: ccrn.id, name: "CCRN renewal", start: ccrnStart, end: ccrnEnd, target: 100, caps: { A: [60, 80], B: [10, 30], C: [10, 30] }, preset: "ccrn" });
  const E = (days, title, provider, hours, o, applies, alloc) => s.ce.push(Object.assign({ id: uid(), date: T(days), title, provider, hours, pharm: 0, law: 0, cat: "", approved: true, applies: applies.map(r => r.id), alloc: {} , proof: "", notes: "" }, o, { alloc: Object.fromEntries((alloc || []).map(([r, h]) => [r.id, h])) }));
  E(-820, "Annual critical care conference", "Example Nursing Association", 16, { pharm: 4 }, [rAN]);
  E(-650, "Pharmacology intensive", "Example CE Online", 10, { pharm: 10 }, [rAN]);
  E(-540, "Evidence-based practice course", "Example University", 8, {}, [rAN]);
  E(-280, "Pharmacology update: antimicrobials", "Example Nursing Association", 6, { pharm: 6, cat: "A" }, [rAP, rAN, rCC], [[rAP, 6]]);
  E(-240, "Ohio nursing law and rules", "Example CE Online", 1, { law: 1 }, [rRN, rAN], [[rRN, 1]]);
  E(-210, "Sepsis recognition and early care", "Critical Care Learning", 3.5, { cat: "A" }, [rRN, rAN, rCC], [[rRN, 3.5]]);
  E(-170, "Heart failure update", "Example CE Online", 4, { pharm: 2, cat: "A" }, [rAP, rAN, rCC], [[rAP, 4]]);
  E(-150, "Leading safe handoffs", "Example University", 2, { cat: "B" }, [rRN, rAN, rCC], [[rRN, 2]]);
  E(-120, "Ethics at the end of life", "Example Nursing Association", 1.5, { cat: "C" }, [rRN, rAN, rCC], [[rRN, 1.5]]);
  E(-90, "Advanced pharmacology: pain care", "Example CE Online", 5, { pharm: 5, cat: "A" }, [rAP, rAN, rCC], [[rAP, 5]]);
  E(-60, "Stroke care update", "Critical Care Learning", 2.25, { cat: "A" }, [rRN, rAN, rCC], [[rRN, 2.25]]);
  E(-35, "Diabetes care update", "Example CE Online", 3, { pharm: 1.5, cat: "A" }, [rRN, rAP, rAN, rCC], [[rRN, 1.5], [rAP, 1.5]]);
  E(-12, "Precepting new graduates", "Riverside General Hospital", 1.75, { cat: "B" }, [rRN, rAN, rCC], [[rRN, 1.75]]);
  s.todos = [
    { id: uid(), text: "Start the ANCC renewal application", due: T(60), done: false },
    { id: uid(), text: "Sign up for an ACLS renewal class", due: T(12), done: false },
    { id: uid(), text: "Send the new malpractice certificate to Riverside", due: T(70), done: false },
    { id: uid(), text: "Enter this year's courses in the ANCC portal", due: T(-5), done: true }];
  s.practice = [
    { id: uid(), name: "Direct-care hours (CCRN)", credId: ccrn.id, target: 432, logged: 380, recent: 150, recentTarget: 144, note: "144 of the 432 must fall in the last 12 months." },
    { id: uid(), name: "NP practice hours (ANCC)", credId: fnp.id, target: 1000, logged: 1240, recent: 0, recentTarget: 0, note: "Counts toward ANCC professional development." }];
  s.notes = [
    { id: uid(), text: "RN and APRN hours can't overlap: 48 separate hours in all." },
    { id: uid(), text: "Keep every certificate in Files › Credentials." },
    { id: uid(), text: "Check each rule with the board before you renew." }];
  return s;
}

/* ---------- requirements engine ---------- */
const credOf = r => S.creds.find(c => c.id === r.credId);
const ruleOf = id => S.rules.find(r => r.id === id);
const inWin = (r, dateStr) => dateStr >= r.start && dateStr <= r.end;
const groupRules = g => S.rules.filter(r => r.group && r.group === g);
/* Hours one course gives one requirement. Requirements in the same group can't share an hour, so they use
   the course's split; a course that counts toward only one of them gives it all its hours. */
function credit(e, r) {
  if (!e.applies.includes(r.id) || !inWin(r, e.date)) return 0;
  if (r.group) {
    if (e.alloc && e.alloc[r.id] != null) return r2(e.alloc[r.id]);
    const others = e.applies.filter(id => id !== r.id && (ruleOf(id) || {}).group === r.group);
    return others.length ? 0 : r2(e.hours);
  }
  return r2(e.hours);
}
function prog(r, skipId) {
  const list = S.ce.filter(e => e.id !== skipId);
  let total = 0, uncategorized = 0, elective = 0;
  const sub = { pharm: 0, law: 0, approved: 0 }, cat = { A: 0, B: 0, C: 0 };
  list.forEach(e => {
    const c = credit(e, r); if (!c) return;
    sub.pharm += Math.min(+e.pharm || 0, c); sub.law += Math.min(+e.law || 0, c); if (e.approved !== false) sub.approved += c;
    if (r.caps) { if (cat[e.cat] != null) cat[e.cat] += c; else if (r.elective) elective += c; else uncategorized += c; }
    else total += c;
  });
  if (r.caps) total = ["A", "B", "C"].reduce((a, k) => a + (r.caps[k] ? Math.min(cat[k], r.caps[k][1]) : 0), 0) + elective;
  total = r2(total);
  Object.keys(sub).forEach(k => sub[k] = r2(sub[k])); Object.keys(cat).forEach(k => cat[k] = r2(cat[k]));
  const subsOk = Object.entries(r.subs || {}).every(([k, v]) => !v || sub[k] >= v);
  const capsOk = !r.caps || ["A", "B", "C"].every(k => !r.caps[k] || cat[k] >= r.caps[k][0]);
  const met = !!r.manual || (total >= r.target && subsOk && capsOk);
  const closed = !met && D(r.end) < TODAY;
  let status, label;
  if (r.manual) { status = "met"; label = "Met (self-reported)"; }
  else if (met) { status = "met"; label = "Met"; }
  else if (closed) { status = "closed"; label = "Window closed, not met"; }
  else if (total === 0) { status = "notstarted"; label = "Not started"; }
  else { status = "progress"; label = "In progress"; }
  return { total, target: r.target, left: r2(Math.max(0, r.target - total)), sub, cat, uncategorized: r2(uncategorized), met, closed, status, label, pct: r.target ? Math.min(100, total / r.target * 100) : (met ? 100 : 0) };
}
/* Suggest how to split a course across requirements that can't share hours:
   pharmacology first to a requirement that still needs pharmacology, law hours to one that needs law,
   then fill each up to its target. The person always confirms. */
function suggestSplit(hours, pharm, law, ids, skipId) {
  const rules = ids.map(ruleOf).filter(Boolean), out = {}; let rem = r2(hours), ph = r2(pharm), lw = r2(law);
  rules.forEach(r => out[r.id] = 0);
  const need = r => { const p = prog(r, skipId); return { all: Math.max(0, r.target - p.total), pharm: Math.max(0, (r.subs.pharm || 0) - p.sub.pharm), law: Math.max(0, (r.subs.law || 0) - p.sub.law) }; };
  const give = (r, n) => { const g = r2(Math.min(n, rem)); out[r.id] = r2(out[r.id] + g); rem = r2(rem - g); return g; };
  rules.forEach(r => { const n = need(r); if (n.pharm > 0 && ph > 0) ph -= give(r, Math.min(ph, n.pharm)); });
  rules.forEach(r => { const n = need(r); if (n.law > 0 && lw > 0) lw -= give(r, Math.min(lw, n.law)); });
  rules.forEach(r => { const n = need(r); const want = Math.max(0, n.all - out[r.id]); if (want > 0) give(r, want); });
  if (rem > 0 && rules.length) give(rules[0], rem);
  return out;
}
/* Status is worked out from dates and hours, never stored (unless the person overrides it). */
const STATUS_LABEL = { setup: "Add date", active: "Active", progress: "In progress", notstarted: "Not started", attention: "Needs attention", expired: "Expired", info: "On file" };
function credStatus(c) {
  if (c.setup) return { s: "setup", label: "Add date", why: "Waiting for its date" };
  if (c.status && c.status !== "auto" && STATUS_LABEL[c.status]) return { s: c.status, label: STATUS_LABEL[c.status] + "*", why: c.statusNote || "Set by you" };
  if (c.kind === "priv" && c.privStatus && c.privStatus !== "Active") { if (c.privStatus === "Inactive") return { s: "info", label: "Inactive" }; }
  if (c.expires && D(c.expires) < TODAY) return { s: "expired", label: "Expired", why: "Expired " + longD(c.expires) };
  const minW = Math.min(...S.settings.windows), dates = [c.expires, c.renewDue, c.reappt, c.docsDue].filter(Boolean).map(inDays);
  const overdue = dates.some(n => n < 0), soon = dates.filter(n => n >= 0).some(n => n <= minW);
  const rules = S.rules.filter(r => r.credId === c.id).map(r => prog(r));
  if (overdue) return { s: "attention", label: "Needs attention", why: "A date has passed" };
  if (rules.some(p => p.closed)) return { s: "attention", label: "Needs attention", why: "A " + P.ce + " window closed short" };
  if (soon) return { s: "attention", label: "Needs attention", why: "Due within " + minW + " days" };
  if (c.renewOpens && D(c.renewOpens) <= TODAY && c.renewDue && D(c.renewDue) >= TODAY) return { s: "notstarted", label: "Renewal open", why: "Renewal window is open" };
  if (rules.length && rules.some(p => !p.met)) return rules.every(p => p.total === 0 && !p.met) ? { s: "notstarted", label: "Not started" } : { s: "progress", label: "In progress" };
  if (c.kind === "priv" && c.privStatus && c.privStatus !== "Active") return { s: "progress", label: c.privStatus };
  if (!c.expires && c.kind === "id") return { s: "info", label: "On file" };
  return { s: "active", label: "Active" };
}
const pill = (s, label) => `<span class="pilltag st-${s}">${s === "met" || s === "active" ? ICON.check.replace("<svg", '<svg width="11" height="11"') : ""}${esc(label)}</span>`;
function credName(c) {
  if (c.kind === "life") return c.lifeType && c.lifeType !== "Other" ? c.lifeType : (c.title || (SECT("life") || {}).top || "Training");
  if (c.kind === "id") return c.idKind && c.idKind !== "Other" ? c.idKind : (c.title || "ID");
  if (c.kind === "mal") return (SECT("mal") || {}).topFromTitle ? (c.title || c.issuer || "Policy") : (c.issuer || c.title || (SECT("mal") || {}).one || "Policy");
  if (c.kind === "cert") return [c.issuer, c.title].filter(Boolean).join(" ") || "Certification";
  if (c.kind === "license") return c.title || "License";
  return c.title || "—";
}
function credFullName(c) {
  if (c.kind === "license") { const st = (c.issuer || "").replace(/ Board of .*$/i, "").replace(/^State of /i, ""); return (st && st.length < 20 ? st + " " : "") + (c.title || "License"); }
  return credName(c);
}
function maskNum(c, reveal) {
  if (c.numStore === "onfile") return "On file";
  if (!c.number) return "—";
  if (c.numStore === "last4") return "On file …" + esc(String(c.number).slice(-4));
  if (SENSITIVE(c) && !reveal) return "…" + esc(String(c.number).slice(-4));
  return esc(c.number);
}
/* Every dated thing in one list: the Due tab, the hero, the badge and the calendar file all read this. */
function events() {
  const out = [];
  S.creds.forEach(c => {
    const n = credFullName(c);
    if (c.expires) out.push({ date: c.expires, kind: "exp", title: n + ((SECT(c.kind) || {}).expWord || " expires"), ref: c.id, credKind: c.kind, deadline: true });
    if (c.renewDue) out.push({ date: c.renewDue, kind: "renewDue", title: n + " renewal due", ref: c.id, credKind: c.kind, deadline: true });
    if (c.renewOpens) out.push({ date: c.renewOpens, kind: "renewOpens", title: n + " renewal opens", ref: c.id, credKind: c.kind, deadline: false });
    if (c.reappt) out.push({ date: c.reappt, kind: "reappt", title: n + " " + FLABEL(c.kind, "reappt", "Reappointment due").toLowerCase(), ref: c.id, credKind: c.kind, deadline: true });
    if (c.docsDue) out.push({ date: c.docsDue, kind: "docsDue", title: n + " " + FLABEL(c.kind, "docsDue", "Documents due").toLowerCase(), ref: c.id, credKind: c.kind, deadline: true });
  });
  S.rules.forEach(r => { const p = prog(r); if (!p.met && r.end) out.push({ date: r.end, kind: "ruleEnd", title: r.name + " " + P.ce + " deadline", sub: hrs(p.left) + " hrs to go", ref: r.id, rule: true, deadline: true }); });
  S.todos.forEach(t => { if (!t.done && t.due) out.push({ date: t.due, kind: "todo", title: t.text, ref: t.id, todo: true, deadline: false }); });
  return out.filter(e => ISO_RX.test(e.date)).sort((a, b) => a.date.localeCompare(b.date));
}
function upcoming() {
  const ev = events(), maxW = Math.max(...S.settings.windows);
  return {
    overdue: ev.filter(e => inDays(e.date) < 0 && e.kind !== "renewOpens" && inDays(e.date) >= -365),
    soon: ev.filter(e => inDays(e.date) >= 0 && inDays(e.date) <= maxW),
    later: ev.filter(e => inDays(e.date) > maxW && inDays(e.date) <= 730),
    all: ev
  };
}
