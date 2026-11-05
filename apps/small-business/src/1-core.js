(() => {
"use strict";
const KEY = "cyberhub-smallbiz-v1";
const APP_ID = "cyberhub-smallbiz";
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
/* a safe "is this one of ours" check: plain obj[name] also finds built-in names like "constructor" or "toString",
   so a hand-made backup could pick them and break the app */
const own = (o, k) => o != null && typeof k === "string" && Object.prototype.hasOwnProperty.call(o, k);
const BUILTIN = k => k === "__proto__" || k in Object.prototype;
const uid = () => Math.random().toString(36).slice(2, 9);
const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
/* running inside a preview frame (not Safari or the Home Screen)? A few spacing tweaks use this */
try { if (window.self !== window.top) document.documentElement.classList.add("framed"); } catch (e) { document.documentElement.classList.add("framed"); }
/* on big screens (open foldable iPhone, iPad) the page scrolls inside the body so the top bar and tab bar stay put;
   phones scroll the whole window as always. Read and set the scroll only through these two. */
const shellQ = window.matchMedia ? matchMedia("(min-width: 600px) and (min-height: 500px)") : null;
/* held sideways on a wide screen (the open iPhone Duo, iPad) the tabs move to a glass column of icons down the right side,
   like the iPhone's own apps. Regular iPhones held sideways are under 500 tall, so they keep the bar at the bottom. In a
   preview frame (claude.ai) the open Duo held sideways is only about 440 tall, so there 380 is enough */
const railQ = window.matchMedia ? matchMedia("(min-width: 900px) and (min-height: 500px) and (orientation: landscape)") : null;
const railQf = window.matchMedia ? matchMedia("(min-width: 900px) and (min-height: 380px) and (orientation: landscape)") : null;
const isRail = () => !!((railQ && railQ.matches) || (document.documentElement.classList.contains("framed") && railQf && railQf.matches));
function setRail() { document.documentElement.classList.toggle("rail", isRail()); }
setRail();
try { [railQ, railQf].forEach(q => { if (!q) return; if (q.addEventListener) q.addEventListener("change", setRail); else if (q.addListener) q.addListener(setRail); }); } catch (e) {}
const inShell = () => !!(shellQ && shellQ.matches) || document.documentElement.classList.contains("rail");
const getY = () => inShell() ? document.body.scrollTop : window.scrollY;
function scrollToY(top, smooth) {
  const s = inShell() ? document.body : window;
  try { s.scrollTo(smooth && !reduce ? { top, behavior: "smooth" } : { top, left: 0 }); } catch (e) { if (s === window) window.scrollTo(0, top); else s.scrollTop = top; }
}
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };

/* ---------- dates (local noon avoids daylight-saving drift) ---------- */
const ISO_RX = /^\d{4}-\d{2}-\d{2}$/;
const D = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d, 12); };
const iso = dt => dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
const addDays = (dt, n) => { const x = new Date(dt); x.setDate(x.getDate() + n); return x; };
const addMonths = (dt, n) => { const x = new Date(dt.getFullYear(), dt.getMonth() + n, 1, 12); const last = new Date(x.getFullYear(), x.getMonth() + 1, 0, 12).getDate(); x.setDate(Math.min(dt.getDate(), last)); return x; };
const addYears = (dt, n) => addMonths(dt, n * 12);
const dayDiff = (a, b) => Math.round((b - a) / 864e5);
const TODAY = (() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12); })();
const T = n => iso(addDays(TODAY, n));
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WD = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const short = dt => MON[dt.getMonth()] + " " + dt.getDate();
const longD = s => { if (!s) return "—"; const dt = D(s); return MON[dt.getMonth()] + " " + dt.getDate() + ", " + dt.getFullYear(); };
const shortD = s => { const dt = D(s); return short(dt) + (dt.getFullYear() !== TODAY.getFullYear() ? ", " + dt.getFullYear() : ""); };
const inDays = s => dayDiff(TODAY, D(s));
function relDays(n) {
  if (n === 0) return "today"; if (n === 1) return "tomorrow"; if (n === -1) return "yesterday";
  if (n < 0) return Math.abs(n) + " days ago";
  return "in " + n + " days";
}
/* "14:30" -> "2:30 PM" */
const clock = t => { if (!t) return ""; const [h, m] = t.split(":").map(Number); return ((h % 12) || 12) + (m ? ":" + String(m).padStart(2, "0") : "") + " " + (h < 12 ? "AM" : "PM"); };
const minsToHM = m => { m = Math.round(m || 0); const h = Math.floor(m / 60), r = m % 60; return h ? h + " hr" + (r ? " " + r + " min" : "") : r + " min"; };
const hrsOf = m => Math.round((m || 0) / 60 * 100) / 100;

/* ---------- money ---------- */
const r2 = v => Math.round((+v || 0) * 100) / 100;
const sum = (arr, f) => r2(arr.reduce((a, x) => a + (f ? (+f(x) || 0) : (+x || 0)), 0));
const fmt0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmt2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
/* whole dollars when it's a whole number, cents when there are cents */
const money = v => { v = r2(v); return (v % 1 ? fmt2 : fmt0).format(v); };
const money2 = v => fmt2.format(r2(v));
const moneyK = v => { v = r2(v); const a = Math.abs(v); return a >= 100000 ? (v < 0 ? "-" : "") + "$" + Math.round(a / 1000) + "k" : a >= 10000 ? (v < 0 ? "-" : "") + "$" + (a / 1000).toFixed(1).replace(/\.0$/, "") + "k" : fmt0.format(v); };
const num = v => (+v || 0).toLocaleString("en-US", { maximumFractionDigits: 1 });
const pl = (n, one, many) => num(n) + " " + (n === 1 ? one : (many || one + "s"));

/* ---------- icons ---------- */
const sv = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const st = (w) => `style="fill:none;stroke:currentColor;stroke-width:${w || 2};stroke-linecap:round;stroke-linejoin:round"`;
const ICON = {
  cart: sv('<path d="M3 4h2.3l2 10a1.6 1.6 0 0 0 1.6 1.3h8.3a1.6 1.6 0 0 0 1.5-1.2L20.4 8H6.1" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"/><circle cx="9.5" cy="19.3" r="1.5" style="fill:currentColor"/><circle cx="17" cy="19.3" r="1.5" style="fill:currentColor"/>'),
  fuel: sv('<path d="M5 20V5.5A1.5 1.5 0 0 1 6.5 4h6A1.5 1.5 0 0 1 14 5.5V20M3.5 20h12M5 10h9M14 9h1.5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 0 3 0V8.2L17.6 6" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"/>'),
  house: sv('<path d="M4 10.5L12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19z" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linejoin:round"/>'),
  fork: sv('<path d="M7 3v6.5a2 2 0 0 0 2 2V21M11 3v6.5a2 2 0 0 1-2 2M9 3v5.5M17 21V3.5c-2 1.3-3 4-3 7V14h3" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"/>'),
  star: sv('<path d="M12 3.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linejoin:round"/>'),
  wifi: sv('<path d="M3.5 9.5a12 12 0 0 1 17 0M6.5 12.8a7.5 7.5 0 0 1 11 0M9.6 16a3.2 3.2 0 0 1 4.8 0" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round"/><circle cx="12" cy="19" r="1.3" style="fill:currentColor"/>'),
  bolt: sv('<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linejoin:round"/>'),
  drop: sv('<path d="M12 3.5S6 10 6 14a6 6 0 0 0 12 0c0-4-6-10.5-6-10.5z" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linejoin:round"/>'),
  cloud: sv('<path d="M7 18.5h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.5 1.6A3.3 3.3 0 0 0 7 18.5z" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linejoin:round"/>'),
  cup: sv('<path d="M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8.5 3.5v2M12 3.5v2" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"/>'),
  gift: sv('<rect x="4.5" y="10" width="15" height="10" rx="1.5" style="fill:none;stroke:currentColor;stroke-width:2"/><path d="M3.5 7.5h17V10h-17zM12 7.5V20M12 7.5C10.5 4.5 7 4 7 6s3.5 1.5 5 1.5zm0 0C13.5 4.5 17 4 17 6s-3.5 1.5-5 1.5z" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linejoin:round"/>'),
  bag: sv('<rect x="4" y="7.5" width="16" height="12" rx="2" style="fill:none;stroke:currentColor;stroke-width:2"/><path d="M9 7.5V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2M4 13h16" style="fill:none;stroke:currentColor;stroke-width:2"/>'),
  book: sv('<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linejoin:round"/>'),
  box: sv('<path d="M4 7.5L12 4l8 3.5v9L12 20l-8-3.5zM4 7.5l8 3.5 8-3.5M12 11v9" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linejoin:round"/>'),
  tool: sv('<path d="M14.5 5.5a4 4 0 0 0 4.9 4.9l-9 9a2 2 0 0 1-2.8-2.8l9-9a4 4 0 0 0-2.1-2.1z" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linejoin:round"/>'),
  scissors: sv('<circle cx="6.5" cy="6.5" r="2.8" style="fill:none;stroke:currentColor;stroke-width:2"/><circle cx="6.5" cy="17.5" r="2.8" style="fill:none;stroke:currentColor;stroke-width:2"/><path d="M8.6 8.4L20 18M8.6 15.6L20 6" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round"/>'),
  xmark: sv('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" style="fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round"/>'),
  ok: sv('<path d="M5 12.5l4.5 4.5L19 7.5" style="fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round"/>'),
  person: sv(`<circle cx="12" cy="8.5" r="3.8" ${st()}/><path d="M4.5 20c1.3-3.6 4.2-5.2 7.5-5.2s6.2 1.6 7.5 5.2" ${st()}/>`),
  people: sv(`<circle cx="9" cy="9" r="3.3" ${st()}/><path d="M3 19c1-3 3.3-4.4 6-4.4s5 1.4 6 4.4" ${st()}/><path d="M15.5 5.8a3.2 3.2 0 0 1 0 6.3M17.5 14.8c1.7.6 2.9 2 3.5 4.2" ${st()}/>`),
  invoice: sv(`<path d="M6 3.5h12v17l-2.5-1.6L13 20.5l-2.5-1.6L8 20.5l-2-1.3z" ${st()}/><path d="M9 8.5h6M9 12h6M9 15.5h3.5" ${st()}/>`),
  quote: sv(`<path d="M6 3.5h8.5L19 8v12.5H6z" ${st()}/><path d="M14 3.5V8h5" ${st()}/><path d="M9.5 13.5l1.8 1.8 3.5-3.6" ${st()}/>`),
  cash: sv(`<rect x="2.5" y="6" width="19" height="12" rx="2.5" ${st()}/><circle cx="12" cy="12" r="2.6" ${st()}/><path d="M6 9.5v5M18 9.5v5" ${st()}/>`),
  receipt: sv(`<path d="M6 3.5h12v17l-2.5-1.6L13 20.5l-2.5-1.6L8 20.5l-2-1.3z" ${st()}/><path d="M9 8h6M9 11.5h6M12 14v3" ${st()}/>`),
  car: sv(`<path d="M4 15.5l1.6-5.2A2 2 0 0 1 7.5 9h9a2 2 0 0 1 1.9 1.3l1.6 5.2v3H4z" ${st()}/><path d="M4 15.5h16" ${st()}/><circle cx="7.5" cy="18.5" r="1.5" ${st(1.8)}/><circle cx="16.5" cy="18.5" r="1.5" ${st(1.8)}/>`),
  clock: sv(`<circle cx="12" cy="12" r="8" ${st()}/><path d="M12 7.5V12l3 2" ${st()}/>`),
  timer: sv(`<circle cx="12" cy="13.5" r="7" ${st()}/><path d="M12 10v3.5l2.2 1.4M10 3h4M12 3v3.5M18.5 6.5l1.2-1.2" ${st()}/>`),
  play: sv(`<path d="M8 5.5v13l10.5-6.5z" style="fill:currentColor"/>`),
  stop: sv(`<rect x="6.5" y="6.5" width="11" height="11" rx="2.5" style="fill:currentColor"/>`),
  cal: sv(`<rect x="3.5" y="5" width="17" height="15" rx="3" ${st()}/><path d="M3.5 10h17M8 3v4M16 3v4" ${st()}/>`),
  job: sv(`<rect x="3.5" y="7" width="17" height="12.5" rx="2.5" ${st()}/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17" ${st()}/>`),
  pie: sv(`<path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12z" ${st()}/><path d="M15 2.8A8.5 8.5 0 0 1 21.2 9H15z" ${st()}/>`),
  chart: sv(`<path d="M4 20h16M6 16V11M10 16V7M14 16v-6M18 16V5" ${st(2.2)}/>`),
  bank: sv(`<path d="M3.5 9.5L12 4l8.5 5.5z" ${st()}/><path d="M5.5 10v7M10 10v7M14 10v7M18.5 10v7M3.5 20h17" ${st()}/>`),
  bill: sv(`<rect x="4" y="4" width="16" height="16" rx="3.5" ${st()}/><path d="M8 9h8M8 12.5h5" ${st()}/><circle cx="16" cy="16" r="1.4" style="fill:currentColor"/>`),
  todo: sv(`<rect x="4" y="4" width="16" height="16" rx="4" ${st()}/><path d="M8.5 12l2.5 2.5 4.5-5" ${st()}/>`),
  note: sv(`<path d="M6 3.5h9l3 3V20.5H6z" ${st()}/><path d="M9 10h6M9 13.5h6M9 17h3" ${st()}/>`),
  check: sv(`<path d="M5 12.5l4.5 4.5L19 7.5" ${st(3.2)}/>`),
  plus: sv(`<path d="M12 5v14M5 12h14" ${st(2.6)}/>`),
  chev: `<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" ${st(2.6)}/></svg>`,
  brush: sv(`<path d="M14.5 4.5l5 5L11 18l-5-5z" ${st()}/><path d="M6 13c-2 0-3 1.5-3 3.5S2 20 2 20s3.5.5 5-1 1.5-3 0-4.5" style="fill:currentColor"/>`),
  sliders: sv(`<path d="M4 7h10M18 7h2M4 17h4M12 17h8" ${st()}/><circle cx="16" cy="7" r="2.5" ${st()}/><circle cx="10" cy="17" r="2.5" ${st()}/>`),
  up: sv(`<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 14v4a2 2 0 002 2h10a2 2 0 002-2v-4" ${st()}/>`),
  down: sv(`<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 14v4a2 2 0 002 2h10a2 2 0 002-2v-4" ${st()}/>`),
  phone: sv(`<rect x="7" y="2.5" width="10" height="19" rx="2.5" ${st()}/><path d="M10.5 18.5h3" ${st()}/>`),
  call: sv(`<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3A2 2 0 0 1 18.5 20 15 15 0 0 1 4.5 6a2 2 0 0 1 2-2.5z" ${st(1.9)}/>`),
  mail: sv(`<rect x="3" y="5.5" width="18" height="13" rx="2.5" ${st()}/><path d="M3.5 7l8.5 6 8.5-6" ${st()}/>`),
  msg: sv(`<path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 17h-7.5L7 20.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z" ${st(1.9)}/>`),
  copy: sv(`<rect x="8" y="8" width="12" height="12" rx="2.5" ${st()}/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" ${st()}/>`),
  pin: sv(`<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" ${st()}/><circle cx="12" cy="10" r="2.3" ${st()}/>`),
  chat: sv(`<path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 17h-7.5L7 20.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z" ${st(1.9)}/>`),
  sparkle: sv(`<path d="M12 3l2 5.5L19.5 10.5 14 12.5 12 18l-2-5.5L4.5 10.5 10 8.5z" ${st(1.9)}/>`),
  erase: sv(`<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" ${st()}/>`),
  pdf: sv(`<path d="M6 3.5h8.5L19 8v12.5H6z" ${st()}/><path d="M14 3.5V8h5M9 13h6M9 16.5h6" ${st()}/>`),
  bell: sv(`<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" ${st()}/><path d="M10 20.5a2 2 0 0 0 4 0" ${st()}/>`),
  send: sv(`<path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" ${st(2.4)}/>`),
  wand: sv(`<path d="M5 19L15.5 8.5M14 5l1-2 1 2 2 1-2 1-1 2-1-2-2-1zM19 12l.7-1.3L21 10l-1.3-.7L19 8l-.7 1.3L17 10l1.3.7z" ${st(1.8)}/>`),
  camera: sv(`<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.5-2.2h5.6L16.3 7h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" ${st()}/><circle cx="12" cy="12.8" r="3.3" ${st()}/>`),
  shield: sv(`<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" ${st()}/><path d="M12 8v5M12 16v.5" ${st(2.2)}/>`),
  store: sv(`<path d="M4 9.5L5.5 4h13L20 9.5" ${st()}/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5.5 12v8h13v-8M10 20v-5h4v5" ${st()}/>`),
  arrowR: sv(`<path d="M9 5l7 7-7 7" ${st(2.6)}/>`)
};
const ic = (kind, svg) => `<span class="ic" style="background:var(--${kind}-fill)" aria-hidden="true">${svg || ""}</span>`;
/* Title Case for buttons, headers, nav titles and labels, the way iOS writes them. Small words stay small. */
const SMALLW = /^(a|an|the|of|on|to|in|for|and|or|so|at|by|per|with|from|as|vs\.?)$/i;
const tc = s => String(s == null ? "" : s).replace(/^[^<]*/, m => m.split(" ").map((w, i) => (i && SMALLW.test(w)) || !/(^|-)[a-z]/.test(w) ? w : w.replace(/(^|-)([a-z])/g, (x, p, c) => p + c.toUpperCase())).join(" "));
/* a glyph picked from the name (fuel gets a pump, rent gets a house); anything else gets the fallback */
const GLYPHS = [[/insur/, "shield"], [/rent|mortgage|lease|office|studio|shop space|booth|storage unit/, "house"], [/grocer|ingredient|produce|costco|walmart|food|market/, "cart"],
  [/meal|restaurant|lunch|dinner|catering/, "fork"], [/coffee|cafe/, "cup"], [/gas\b|fuel|diesel/, "fuel"], [/vehicle|truck|car\b|auto|parking|toll|uber|lyft|travel|trip/, "car"],
  [/phone|mobile|cell/, "phone"], [/internet|wifi|wi-fi|broadband|web|domain|hosting/, "wifi"], [/electric|power|energy|utilit/, "bolt"], [/water|trash/, "drop"],
  [/software|subscript|app\b|apps|adobe|cloud/, "cloud"], [/tool|equipment|hardware|home depot|lowe/, "tool"], [/material|supplies|supply|lumber|parts/, "box"],
  [/advert|marketing|ads?\b|promo|social/, "star"], [/fee|bank|processing|square|stripe|paypal/, "bank"], [/licen|permit|legal|account|cpa|bookkeep|tax/, "book"],
  [/training|class|course|education|school/, "book"], [/pack|shipping|postage|usps|ups|fedex/, "box"], [/product|inventory|stock|retail/, "bag"], [/cloth|uniform|apron/, "bag"],
  [/beauty|salon|hair|color|nail/, "scissors"], [/clean|chemical|mop|soap/, "drop"], [/gift|client gift/, "gift"], [/print|paper|office supplies/, "receipt"], [/contract|labor|help|wage|payroll/, "people"]];
const glyph = (name, fallback) => { const n = String(name || "").toLowerCase(); const g = GLYPHS.find(([rx]) => rx.test(n)); return ICON[g ? g[1] : fallback] || ICON[fallback] || ICON.receipt; };
const ART_EMPTY = color => `<svg viewBox="0 0 120 80" aria-hidden="true"><ellipse cx="60" cy="72" rx="40" ry="5" style="fill:var(--line)"/>
  <rect x="30" y="16" width="60" height="46" rx="10" style="fill:var(--surface-2);stroke:var(--line);stroke-width:2"/>
  <path d="M42 32h28M42 42h20" style="stroke:var(--line);stroke-width:4;stroke-linecap:round"/>
  <circle cx="86" cy="20" r="10" style="fill:${color}"/><path d="M81.5 20.5l3 3 5.5-6" style="fill:none;stroke:var(--surface);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round"/></svg>`;
const empty = (color, text) => `<div class="empty">${text}</div>`;

/* ---------- money categories: one master list, each business type picks its own ---------- */
const CAT = {
  materials: ["Materials and parts", /\b(parts?|materials?|lumber|pipe|pipes|wire|fittings?|home depot|lowe'?s|menards|ferguson|supply house|fixtures?|valves?|breakers?)\b/],
  tools: ["Tools and equipment", /\b(tools?|drill|saw|equipment|ladder|mower|trimmer|vacuum|blower|camera|lens|laptop|computer|mixer|oven|dryer|clippers|shears|ipad|printer)\b/],
  fuel: ["Fuel", /\b(gas|fuel|diesel|shell|bp|speedway|marathon|sunoco|exxon|mobil|circle k|wawa|sheetz|chevron|fill ?up)\b/],
  vehicle: ["Vehicle upkeep", /\b(oil change|tires?|car wash|truck|van|registration|auto repair|brakes?|mechanic)\b/],
  insurance: ["Insurance", /\b(insurance|liability|bond|policy)\b/],
  permits: ["Licenses and permits", /\b(permits?|license|licence|inspection fee|cottage food)\b/],
  phone: ["Phone and software", /\b(phone|verizon|at&t|att|t-mobile|software|app|apps|subscription|quickbooks|canva|adobe|google workspace|icloud|dropbox|squarespace|wix|website|domain|internet|wifi)\b/],
  ads: ["Advertising", /\b(ads?|advertising|facebook|instagram|marketing|flyers?|business cards|yard signs?|promo|nextdoor|yelp)\b/],
  helpers: ["Helpers and subcontractors", /\b(helpers?|sub|subs|subcontractors?|labor|crew|contractor|assistant|freelancers?)\b/],
  supplies: ["Supplies", /\b(supplies|soap|bleach|gloves|towels|paper towels|trash bags|cleaner|chemicals|mop|sponges|spray)\b/],
  products: ["Products", /\b(products?|shampoo|conditioner|color|dye|developer|polish|gel|acrylic|lash(es)?|wax|foils?|sally)\b/],
  rent: ["Rent", /\b(rent|booth rent|chair rent|suite|studio|office space|storage unit|kitchen rent|commissary)\b/],
  education: ["Classes and training", /\b(class|classes|course|training|education|conference|seminar|workshop|certification|ce)\b/],
  office: ["Home office", /\b(office|desk|ink|paper|postage stamps|staples)\b/],
  travel: ["Travel and meals", /\b(hotel|flight|airbnb|uber|lyft|meals?|lunch|dinner|breakfast|parking|tolls?|coffee)\b/],
  fees: ["Fees", /\b(fees?|stripe|paypal|square|processing|bank fee|etsy fee|transaction)\b/],
  ingredients: ["Ingredients", /\b(flour|sugar|butter|eggs|groceries|ingredients|produce|meat|cheese|chocolate|restaurant depot|costco|sam'?s|aldi|kroger)\b/],
  packaging: ["Packaging", /\b(boxes|packaging|containers|labels|mailers|tape|bags|ribbon|tissue)\b/],
  shipping: ["Shipping", /\b(usps|ups|fedex|postage|shipping|stamps|pirate ship)\b/],
  inventory: ["Inventory", /\b(inventory|stock|wholesale|yarn|fabric|beads|blanks|resale|thrift|vinyl|resin|wicks|wax melts)\b/],
  booth: ["Market and booth fees", /\b(booth|market|vendor fee|craft fair|festival|pop-?up)\b/],
  laundry: ["Laundry", /\b(laundry|laundromat|linens)\b/],
  other: ["Other", null]
};
const catName = id => (own(CAT, id) ? CAT[id] : CAT.other)[0];
/* each category gets one of eight calm colors, in the order the business type lists them */
const catColor = id => { const i = Math.max(0, P.cats.indexOf(id)); return `var(--cc${i % 8})`; };
const guessCat = text => { const t = " " + String(text || "").toLowerCase() + " "; for (const id of P.cats) { const rx = own(CAT, id) ? CAT[id][1] : null; if (rx && rx.test(t)) return id; } return ""; };

/* ---------- business types ----------
   A type sets the words, the money categories, the services you sell, the Home layout, the look and the
   art behind the big card on Home. Everything is data, so a new business type is new data. */
const PACKS = {
  trades: {
    id: "trades", name: "Trades and repair", who: "Plumbers, electricians, HVAC and handymen", short: "Trades",
    accent: "voltage", art: "wrench", job: "job", jobs: "jobs", client: "customer", clients: "customers",
    hero: "owed", home: [["owed", "Who Owes You"], ["next", "Coming Up"], ["profit", "Profit"], ["budget", "Budget"], ["tax", "Taxes"]],
    cats: ["materials", "fuel", "tools", "vehicle", "helpers", "insurance", "permits", "phone", "ads", "fees", "other"],
    services: [["Service call", 95], ["Labor, per hour", 85, "hr"], ["Drain cleaning", 175], ["Water heater install", 1450], ["Faucet replacement", 225]],
    budget: { materials: 1800, fuel: 320, tools: 150, vehicle: 120, helpers: 600, insurance: 140, permits: 40, phone: 95, ads: 120, fees: 30, other: 60 },
    ask: ["Paid by Jen 350", "Gas 48", "Drove 26 miles to the Parks job", "Job for Dan Friday 9am"],
    thanks: "Thanks for your business. Call anytime something leaks, drips or sparks.", setAside: 25, weekGoal: 0
  },
  beauty: {
    id: "beauty", name: "Salon and beauty", who: "Stylists, barbers, nail, lash and brow pros", short: "Beauty",
    accent: "rose", art: "scissors", job: "appointment", jobs: "appointments", client: "client", clients: "clients",
    hero: "today", home: [["next", "Today and Next"], ["profit", "Profit"], ["budget", "Budget"], ["owed", "Who Owes You"], ["tax", "Taxes"]],
    cats: ["products", "rent", "tools", "education", "laundry", "ads", "phone", "fees", "insurance", "other"],
    services: [["Women's cut and style", 65], ["Men's cut", 35], ["All-over color", 120], ["Highlights", 165], ["Blowout", 45], ["Lash fill", 65]],
    budget: { products: 420, rent: 900, tools: 60, education: 50, laundry: 40, ads: 60, phone: 45, fees: 70, insurance: 35, other: 40 },
    ask: ["Paid by Jen 65", "Color supplies 84 at Sally", "Appointment for Maya Tuesday 2pm", "How much did I make this week?"],
    thanks: "Thank you! Can't wait to see you next time.", setAside: 25, weekGoal: 0
  },
  creative: {
    id: "creative", name: "Freelance and creative", who: "Designers, photographers, writers and consultants", short: "Freelance",
    accent: "plum", art: "pen", job: "project", jobs: "projects", client: "client", clients: "clients",
    hero: "owed", home: [["owed", "Who Owes You"], ["time", "Time This Week"], ["profit", "Profit"], ["next", "Coming Up"], ["budget", "Budget"], ["tax", "Taxes"]],
    cats: ["phone", "tools", "office", "helpers", "education", "travel", "ads", "fees", "insurance", "other"],
    services: [["Design, per hour", 85, "hr"], ["Logo package", 750], ["Brand guide", 1200], ["Photo session", 350], ["Website page", 400]],
    budget: { phone: 140, tools: 120, office: 60, helpers: 300, education: 50, travel: 90, ads: 40, fees: 60, insurance: 30, other: 40 },
    ask: ["2.5 hours for Northwind", "Adobe 59.99", "Invoice Northwind 1200 brand guide", "Who owes me?"],
    thanks: "Thank you for the great work together.", setAside: 28, weekGoal: 30
  },
  food: {
    id: "food", name: "Food and catering", who: "Caterers, bakers, meal preppers and food trucks", short: "Food",
    accent: "sunset", art: "whisk", job: "order", jobs: "orders", client: "customer", clients: "customers",
    hero: "next", home: [["next", "Upcoming Orders"], ["profit", "Profit"], ["budget", "Budget"], ["owed", "Who Owes You"], ["tax", "Taxes"]],
    cats: ["ingredients", "packaging", "rent", "tools", "fuel", "permits", "booth", "ads", "fees", "other"],
    services: [["Dozen cupcakes", 36], ["Custom cake, 8 inch", 85], ["Catering, per guest", 22, "guest"], ["Cookie tray", 45], ["Delivery", 25]],
    budget: { ingredients: 1100, packaging: 180, rent: 400, tools: 60, fuel: 120, permits: 25, booth: 80, ads: 50, fees: 60, other: 40 },
    ask: ["Paid by Jen 120", "Flour and butter 62 at Costco", "Order for Maya Saturday 10am", "Profit this month?"],
    thanks: "Thank you for your order. Enjoy!", setAside: 25, weekGoal: 0
  },
  retail: {
    id: "retail", name: "Makers and shops", who: "Crafters, Etsy and market sellers, boutiques", short: "Shop",
    accent: "ledger", art: "tag", job: "order", jobs: "orders", client: "customer", clients: "customers",
    hero: "month", home: [["profit", "Profit"], ["budget", "Budget"], ["next", "Coming Up"], ["owed", "Who Owes You"], ["tax", "Taxes"]],
    cats: ["inventory", "packaging", "shipping", "fees", "booth", "tools", "ads", "phone", "rent", "other"],
    services: [["Custom order", 60], ["Candle, 8 oz", 18], ["Gift set", 42], ["Wholesale case", 216], ["Shipping", 8]],
    budget: { inventory: 650, packaging: 90, shipping: 180, fees: 110, booth: 75, tools: 40, ads: 60, phone: 30, rent: 0, other: 30 },
    ask: ["Paid by Jen 42", "Shipping 18.40", "Market booth 75", "Best customers this year?"],
    thanks: "Thank you for supporting a small shop!", setAside: 22, weekGoal: 0
  },
  cleaning: {
    id: "cleaning", name: "Cleaning and lawn care", who: "House cleaners, lawn crews, pet sitters and errands", short: "Home services",
    accent: "evergreen", art: "leaf", job: "visit", jobs: "visits", client: "client", clients: "clients",
    hero: "today", home: [["next", "Today and Next"], ["owed", "Who Owes You"], ["profit", "Profit"], ["budget", "Budget"], ["tax", "Taxes"]],
    cats: ["supplies", "fuel", "tools", "vehicle", "helpers", "insurance", "ads", "phone", "fees", "other"],
    services: [["Standard clean", 140], ["Deep clean", 260], ["Move-out clean", 320], ["Mow and trim", 55], ["Leaf cleanup", 180]],
    budget: { supplies: 160, fuel: 260, tools: 60, vehicle: 90, helpers: 800, insurance: 75, ads: 50, phone: 45, fees: 30, other: 30 },
    ask: ["Paid by Jen 140", "Supplies 36 at Target", "Drove 18 miles", "Visit for Dan Monday 8am"],
    thanks: "Thank you! It was a pleasure taking care of your home.", setAside: 25, weekGoal: 0
  }
};
let P = PACKS.trades;
const Wd = (w, up) => up ? w.replace(/^\w/, c => c.toUpperCase()) : w;

/* ---------- state ---------- */
let S;
function blank(keep) {
  return { v: 1, sample: false,
    profile: { owner: "", biz: "", type: "trades", phone: "", email: "", street: "", apt: "", city: "", state: "", zip: "", payNote: "", terms: 14, nextInv: 1001, nextQuote: 101, setAside: P.setAside, mileRate: "", salesTax: 0 },
    clients: [], invoices: [], payments: [], jobs: [], expenses: [], trips: [], time: [], timer: null, bills: [], taxPaid: [], todos: [], tools: {}, snooze: {},
    budget: { cats: {}, goal: 0 }, look: keep ? keep.look : undefined, lastBackup: keep ? keep.lastBackup : undefined };
}
function validState(s) {
  if (!s || typeof s !== "object" || !s.profile || typeof s.profile !== "object") return false;
  for (const k of ["clients", "invoices", "payments", "jobs", "expenses", "trips", "time"]) if (!Array.isArray(s[k])) return false;
  return true;
}
/* ---------- clean every record on load and Restore, so a bad or hand-made file can't put code on the page or break it ---------- */
const ID_RX = /^[A-Za-z0-9_-]{1,40}$/, KEY_RX = /^[A-Za-z0-9_:-]{1,80}$/, TIME_RX = /^\d{2}:\d{2}$/;
const IMG_RX = /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/;
const okImg = u => typeof u === "string" && u.length < 15e6 && IMG_RX.test(u);
const NUMS = new Set(["amount", "qty", "rate", "num", "taxPct", "discount", "dur", "price", "miles", "mins", "year", "q", "terms", "nextInv", "nextQuote", "nextRcpt", "setAside", "salesTax", "goal"]);
const DATES = new Set(["date", "due", "valid", "created", "next", "reviewAsked", "checkedIn", "followed", "reminded", "paidOn"]);
const CHOICES = { kind: ["invoice", "quote"], every: ["month", "week", "quarter", "half", "year"] };
function cleanVal(k, v) {
  if (v == null) return undefined;
  if (k === "id" || /Id$/.test(k)) return typeof v === "string" && ID_RX.test(v) ? v : "";
  if (k === "photo") return typeof v === "string" && /^rc:[A-Za-z0-9_-]{1,40}$/.test(v) ? v : "";
  if (NUMS.has(k)) { const n = +v; return isFinite(n) ? Math.max(-1e9, Math.min(1e9, n)) : 0; }
  if (DATES.has(k)) return typeof v === "string" && ISO_RX.test(v) ? v : "";
  if (k === "time") return typeof v === "string" && TIME_RX.test(v) ? v : "";
  if (own(CHOICES, k)) return CHOICES[k].includes(v) ? v : CHOICES[k][0];
  if (k === "cat") return own(CAT, v) ? v : "other";
  if (k === "status") return typeof v === "string" && /^[a-z]{1,12}$/.test(v) ? v : "";
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return isFinite(v) ? v : 0;
  if (typeof v === "string") return v.slice(0, 4000);
  return undefined;
}
function cleanRec(r, deep) {
  if (!r || typeof r !== "object" || Array.isArray(r)) return null;
  const o = {};
  for (const k of Object.keys(r).slice(0, 60)) {
    if (!/^[A-Za-z][A-Za-z0-9]{0,30}$/.test(k) || BUILTIN(k)) continue;
    if (k === "items" && deep) { o.items = Array.isArray(r.items) ? r.items.slice(0, 200).map(i => cleanRec(i)).filter(Boolean) : []; continue; }
    const v = cleanVal(k, r[k]); if (v !== undefined) o[k] = v;
  }
  if ("id" in r && !o.id) o.id = uid();
  return o;
}
function cleanState(s) {
  const lists = ["clients", "invoices", "payments", "jobs", "expenses", "trips", "time", "bills", "taxPaid", "todos"];
  lists.forEach(k => {
    const seen = new Set();
    s[k] = (Array.isArray(s[k]) ? s[k] : []).slice(0, 50000).map(r => cleanRec(r, k === "invoices")).filter(Boolean).map(r => { if (!r.id || seen.has(r.id)) r.id = uid(); seen.add(r.id); return r; });
  });
  const STR = { clients: ["name"], invoices: ["notes"], jobs: ["title"], expenses: ["vendor"], bills: ["name"], todos: ["text"] };
  s.invoices.forEach(x => x.items.forEach(i => { if (typeof i.desc !== "string") i.desc = ""; if (typeof i.qty !== "number") i.qty = 1; if (typeof i.rate !== "number") i.rate = 0; }));
  const today = iso(TODAY), NEED = { invoices: ["date"], payments: ["date"], jobs: ["date"], expenses: ["date"], trips: ["date"], time: ["date"], taxPaid: ["date"], bills: ["next"], clients: ["created"] };
  for (const k in NEED) s[k].forEach(r => NEED[k].forEach(f => { if (!r[f]) r[f] = today; }));
  s.invoices.forEach(x => { if (!x.due) x.due = x.date; if (!x.kind) x.kind = "invoice"; });
  for (const k in STR) s[k].forEach(r => STR[k].forEach(f => { if (typeof r[f] !== "string") r[f] = ""; }));
  const p = cleanRec(s.profile) || {}; delete p.id;
  s.profile = p;
  if (!own(PACKS, p.type)) p.type = "trades";
  ["owner", "biz", "phone", "email", "street", "apt", "city", "state", "zip", "payNote", "mileRate", "reviewUrl", "web"].forEach(k => { if (k in p && typeof p[k] !== "string") p[k] = String(p[k]); });
  const tm = s.timer; s.timer = tm && typeof tm === "object" && typeof tm.start === "string" && !isNaN(Date.parse(tm.start)) ? { start: new Date(tm.start).toISOString(), clientId: cleanVal("clientId", tm.clientId) || "", note: String(tm.note || "").slice(0, 160) } : null;
  const b = s.budget && typeof s.budget === "object" ? s.budget : {}, cats = {};
  if (b.cats && typeof b.cats === "object") for (const c of Object.keys(b.cats)) if (own(CAT, c)) { const n = +b.cats[c]; cats[c] = isFinite(n) ? n : 0; }
  s.budget = { cats, goal: isFinite(+b.goal) ? +b.goal : 0 };
  const tools = {}; if (s.tools && typeof s.tools === "object" && !Array.isArray(s.tools)) for (const t of Object.keys(s.tools).slice(0, 60)) { if (!ID_RX.test(t) || BUILTIN(t)) continue; const r = cleanRec(s.tools[t]); if (r) { const o = {}; for (const k of Object.keys(r)) if (typeof s.tools[t][k] !== "object") o[k] = typeof s.tools[t][k] === "number" ? (isFinite(s.tools[t][k]) ? s.tools[t][k] : 0) : typeof s.tools[t][k] === "boolean" ? s.tools[t][k] : String(s.tools[t][k]).slice(0, 400); tools[t] = o; } }
  s.tools = tools;
  const sn = {}; if (s.snooze && typeof s.snooze === "object") for (const k of Object.keys(s.snooze).slice(0, 500)) if (KEY_RX.test(k) && !BUILTIN(k) && typeof s.snooze[k] === "string" && ISO_RX.test(s.snooze[k])) sn[k] = s.snooze[k];
  s.snooze = sn;
  const L = s.look;
  if (L && typeof L === "object") {
    const o = {}; if (typeof L.accent === "string" && /^[a-z]{1,16}$/.test(L.accent)) o.accent = L.accent;
    if (["auto", "light", "dark"].includes(L.theme)) o.theme = L.theme;
    if (Array.isArray(L.hidden)) o.hidden = L.hidden.filter(x => typeof x === "string" && /^[a-z]{1,16}$/.test(x)).slice(0, 20);
    s.look = o;
  } else s.look = undefined;
  s.lastBackup = typeof s.lastBackup === "string" && ISO_RX.test(s.lastBackup) ? s.lastBackup : undefined;
  s.sample = !!s.sample; s.v = 1;
  return s;
}
function migrate(s) {
  cleanState(s);
  ["bills", "taxPaid", "todos"].forEach(k => { if (!Array.isArray(s[k])) s[k] = []; });
  ["tools", "snooze"].forEach(k => { if (!s[k] || typeof s[k] !== "object" || Array.isArray(s[k])) s[k] = {}; });
  s.budget = s.budget && typeof s.budget === "object" ? s.budget : { cats: {}, goal: 0 };
  s.budget.cats = s.budget.cats || {};
  if (!own(PACKS, s.profile.type)) s.profile.type = "trades";
  const p = s.profile; if (!p.terms && p.terms !== 0) p.terms = 14; if (!p.nextInv) p.nextInv = 1001; if (!p.nextQuote) p.nextQuote = 101;
  if (p.setAside == null || p.setAside === "") p.setAside = PACKS[p.type].setAside;
  s.invoices.forEach(x => { x.items = Array.isArray(x.items) ? x.items : []; });
  return s;
}
/* ---------- if saved records can't be opened, they're kept safe under their own name and never written over ---------- */
const KEPT = [KEY + "-kept", KEY + "-kept-2"];
let holdSave = false; /* true only when the unreadable copy couldn't be kept: then the app saves nothing over it */
const keptRaw = () => { for (const k of KEPT) { const v = store.get(k); if (v != null) return v; } return null; };
function keepRaw(raw) {
  if (raw == null || raw === "") return;
  for (const k of KEPT) {
    const v = store.get(k);
    if (v === raw) return;
    if (v == null) { try { localStorage.setItem(k, raw); if (localStorage.getItem(k) === raw) return; } catch (e) {} break; }
  }
  holdSave = true;
}
function load() {
  const raw = store.get(KEY); if (raw == null) return null;
  try { const v = JSON.parse(raw); if (validState(v)) return migrate(v); } catch (e) {}
  keepRaw(raw); return null;
}
let saveWarned = false;
function save() {
  if (holdSave) { if (!saveWarned) { saveWarned = true; setTimeout(() => toast("Changes aren't being saved yet. Save your earlier records as a file first."), 0); } return; }
  let ok = false; try { localStorage.setItem(KEY, JSON.stringify(S)); ok = true; } catch (e) {}
  if (!ok && !saveWarned) { saveWarned = true; setTimeout(() => toast("This phone couldn't save your latest change. Storage may be full: back up, then remove old receipt photos."), 0); }
  if (ok) saveWarned = false;
}

/* ---------- people ---------- */
const clientOf = id => S.clients.find(c => c.id === id);
const clientName = id => { const c = clientOf(id); return c ? c.name : ""; };
const firstName = n => String(n || "").trim().split(/\s+/)[0] || "";
const initials = n => String(n || "?").trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "?";
const addrLines = o => { const l1 = [o.street, o.apt].filter(Boolean).join(", "), l2 = [o.city, [o.state, o.zip].filter(Boolean).join(" ")].filter(Boolean).join(", "); return [l1, l2].filter(Boolean); };
/* a stable card color for each client, from the six the business type's look provides */
const clientHue = c => { let h = 0; String(c.id).split("").forEach(ch => h = (h * 31 + ch.charCodeAt(0)) >>> 0); return h % 6; };

/* ---------- quotes and invoices ---------- */
const lineTotal = it => r2((+it.qty || 0) * (+it.rate || 0));
function totals(x) {
  const sub = sum(x.items, lineTotal), disc = r2(Math.min(sub, +x.discount || 0)), taxable = r2(sub - disc), tax = r2(taxable * (+x.taxPct || 0) / 100), total = r2(taxable + tax);
  const paid = x.kind === "invoice" ? sum(S.payments.filter(p => p.invId === x.id), p => p.amount) : 0;
  return { sub, disc, tax, total, paid, due: r2(Math.max(0, total - paid)) };
}
const docNum = x => (x.kind === "quote" ? "Q-" : "#") + x.num;
const docWord = x => x.kind === "quote" ? "Quote" : "Invoice";
function invStatus(x) {
  const t = totals(x);
  if (x.kind === "quote") {
    if (x.status === "accepted") return { s: "won", label: "Accepted" };
    if (x.status === "declined") return { s: "lost", label: "Declined" };
    if (x.valid && D(x.valid) < TODAY && x.status !== "accepted") return { s: "lost", label: "Expired" };
    if (x.status === "sent") return { s: "open", label: "Sent" };
    return { s: "draft", label: "Draft" };
  }
  if (x.status === "void") return { s: "lost", label: "Void" };
  if (t.total > 0 && t.due <= 0) return { s: "paid", label: "Paid" };
  if (x.status === "draft") return { s: "draft", label: "Draft" };
  if (x.due && D(x.due) < TODAY) return { s: "over", label: inDays(x.due) === -1 ? "1 day late" : Math.abs(inDays(x.due)) + " days late" };
  if (t.paid > 0) return { s: "part", label: "Part paid" };
  return { s: "open", label: x.due ? (inDays(x.due) === 0 ? "Due today" : "Due " + shortD(x.due)) : "Sent" };
}
/* money still out: sent invoices with a balance, oldest due date first */
const owedList = () => S.invoices.filter(x => x.kind === "invoice" && x.status !== "draft" && x.status !== "void" && totals(x).due > 0).sort((a, b) => String(a.due || "9").localeCompare(String(b.due || "9")));
const overdueList = () => owedList().filter(x => x.due && D(x.due) < TODAY);

/* ---------- periods and profit ---------- */
const inRange = (d, a, b) => d >= a && d <= b;
function period(kind, ref) {
  const t = ref || TODAY, y = t.getFullYear(), m = t.getMonth();
  if (kind === "week") { const s = addDays(t, -((t.getDay() + 6) % 7)); return { a: iso(s), b: iso(addDays(s, 6)), label: "This week" }; }
  if (kind === "month") return { a: iso(new Date(y, m, 1, 12)), b: iso(new Date(y, m + 1, 0, 12)), label: MONTHS[m] };
  if (kind === "quarter") { const q = Math.floor(m / 3); return { a: iso(new Date(y, q * 3, 1, 12)), b: iso(new Date(y, q * 3 + 3, 0, 12)), label: "Q" + (q + 1) + " " + y }; }
  return { a: y + "-01-01", b: y + "-12-31", label: String(y) };
}
const incomeIn = (a, b) => sum(S.payments.filter(p => inRange(p.date, a, b)), p => p.amount);
const spentIn = (a, b, cat) => sum(S.expenses.filter(e => inRange(e.date, a, b) && (!cat || e.cat === cat)), e => e.amount);
const milesIn = (a, b) => sum(S.trips.filter(t => inRange(t.date, a, b)), t => t.miles);
/* IRS business rate by date, unless you set your own. 2026: 72.5¢ to June 30, 76¢ from July 1. */
function mileRate(d) {
  const own = parseFloat(S.profile.mileRate); if (isFinite(own) && own > 0) return own;
  return d < "2026-01-01" ? .70 : d < "2026-07-01" ? .725 : .76;
}
const mileDed = (a, b) => sum(S.trips.filter(t => inRange(t.date, a, b)), t => t.miles * mileRate(t.date));
function profitOf(a, b) { const inc = incomeIn(a, b), out = spentIn(a, b); return { inc, out, net: r2(inc - out) }; }
function bestClients(a, b) {
  const m = {}; S.payments.filter(p => p.clientId && inRange(p.date, a, b)).forEach(p => { m[p.clientId] = r2((m[p.clientId] || 0) + p.amount); });
  return Object.entries(m).filter(([id]) => clientOf(id)).sort((x, y) => y[1] - x[1]).map(([id, v]) => ({ c: clientOf(id), v }));
}

/* ---------- taxes: a rough set-aside, never advice ---------- */
/* federal estimated payments: Jan to Mar by Apr 15, Apr to May by Jun 15, Jun to Aug by Sep 15, Sep to Dec by Jan 15 */
function nextBiz(dt) { while (dt.getDay() === 0 || dt.getDay() === 6) dt = addDays(dt, 1); return dt; }
function taxQuarters(y) {
  return [
    { q: 1, a: y + "-01-01", b: y + "-03-31", due: iso(nextBiz(new Date(y, 3, 15, 12))), label: "Jan to Mar" },
    { q: 2, a: y + "-04-01", b: y + "-05-31", due: iso(nextBiz(new Date(y, 5, 15, 12))), label: "Apr to May" },
    { q: 3, a: y + "-06-01", b: y + "-08-31", due: iso(nextBiz(new Date(y, 8, 15, 12))), label: "Jun to Aug" },
    { q: 4, a: y + "-09-01", b: y + "-12-31", due: iso(nextBiz(new Date(y + 1, 0, 15, 12))), label: "Sep to Dec" }];
}
const pctOf = () => Math.max(0, Math.min(60, +S.profile.setAside || 0)) / 100;
function taxEst(a, b) { const p = profitOf(a, b), ded = mileDed(a, b), base = r2(Math.max(0, p.net - ded)); return { base, ded, set: r2(base * pctOf()) }; }
function taxNow() {
  const y = TODAY.getFullYear(), yr = taxEst(y + "-01-01", iso(TODAY)), paid = sum(S.taxPaid.filter(t => t.year === y), t => t.amount);
  const qs = taxQuarters(y).concat(taxQuarters(y - 1).slice(3));
  const next = qs.filter(q => D(q.due) >= addDays(TODAY, -3)).sort((a, b) => a.due.localeCompare(b.due))[0];
  const nq = next ? Object.assign({}, next, taxEst(next.a, next.b < iso(TODAY) ? next.b : iso(TODAY)), { year: +next.a.slice(0, 4) }) : null;
  if (nq) nq.paid = S.taxPaid.some(t => t.year === nq.year && t.q === nq.q);
  return { y, yr, paid, next: nq };
}

/* ---------- budget and bills ---------- */
const EVERY = [["week", "Every week", 12 / 52], ["month", "Every month", 1], ["quarter", "Every 3 months", 3], ["half", "Every 6 months", 6], ["year", "Every year", 12]];
const everyWord = k => (EVERY.find(e => e[0] === k) || EVERY[1])[1];
const monthsPer = k => (EVERY.find(e => e[0] === k) || EVERY[1])[2];
const billMonthly = b => r2(b.amount / monthsPer(b.every));
const nextAfter = (d, every) => every === "week" ? iso(addDays(D(d), 7)) : iso(addMonths(D(d), monthsPer(every)));
function budgetNow() {
  const pm = period("month"), cats = P.cats.map(id => ({ id, plan: +S.budget.cats[id] || 0, spent: spentIn(pm.a, pm.b, id) })).filter(c => c.plan || c.spent);
  const extra = [...new Set(S.expenses.filter(e => inRange(e.date, pm.a, pm.b) && !P.cats.includes(e.cat)).map(e => e.cat))].map(id => ({ id, plan: +S.budget.cats[id] || 0, spent: spentIn(pm.a, pm.b, id) }));
  const all = cats.concat(extra), plan = sum(all, c => c.plan), spent = sum(all, c => c.spent);
  const dayOf = TODAY.getDate(), days = D(pm.b).getDate();
  return { pm, cats: all, plan, spent, left: r2(plan - spent), pace: dayOf / days };
}

/* ---------- time ---------- */
const timerMins = () => S.timer ? Math.max(0, (Date.now() - new Date(S.timer.start).getTime()) / 60000) : 0;

/* ---------- every dated thing in one list: calendar, Home and the calendar file read this ---------- */
function events() {
  const out = [];
  S.jobs.forEach(j => out.push({ date: j.date, time: j.time, kind: "job", title: (j.title || Wd(P.job, 1)) + (clientName(j.clientId) ? " · " + clientName(j.clientId) : ""), sub: [j.time ? clock(j.time) : "", j.dur ? minsToHM(j.dur) : "", j.price ? money(j.price) : ""].filter(Boolean).join(" · "), ref: j.id, done: j.status === "done" }));
  owedList().forEach(x => { if (x.due) out.push({ date: x.due, kind: "inv", title: "Invoice " + docNum(x) + " due · " + clientName(x.clientId), sub: money(totals(x).due) + " owed", ref: x.id }); });
  S.invoices.filter(x => x.kind === "quote" && x.valid && (x.status === "sent" || x.status === "draft")).forEach(x => out.push({ date: x.valid, kind: "quote", title: "Quote " + docNum(x) + " expires · " + clientName(x.clientId), sub: money(totals(x).total), ref: x.id }));
  S.bills.forEach(b => { if (b.next) out.push({ date: b.next, kind: "bill", title: b.name + " due", sub: money(b.amount) + " · " + everyWord(b.every).toLowerCase(), ref: b.id }); });
  const y = TODAY.getFullYear(); taxQuarters(y - 1).slice(3).concat(taxQuarters(y), taxQuarters(y + 1).slice(0, 1)).forEach(q => out.push({ date: q.due, kind: "tax", title: "Estimated tax due (" + q.label + ")", sub: "Federal quarterly payment", ref: q.a.slice(0, 4) + "-" + q.q }));
  S.todos.forEach(t => { if (!t.done && t.due) out.push({ date: t.due, kind: "todo", title: t.text, ref: t.id }); });
  return out.filter(e => ISO_RX.test(e.date)).sort((a, b) => a.date.localeCompare(b.date) || String(a.time || "99").localeCompare(String(b.time || "99")));
}
const upcomingJobs = () => S.jobs.filter(j => j.status !== "done" && j.date >= iso(TODAY)).sort((a, b) => (a.date + (a.time || "99")).localeCompare(b.date + (b.time || "99")));
