/* Paycheck Budget: lets the app open with no signal from the Home Screen.
   The app page is fetched fresh when online (so updates arrive) and saved for offline.
   The PDF tool and icons are saved once. Nothing from other sites (like the key server) is ever saved. */
/* Change VERSION whenever a file in lib/ or icons/ (or the manifest) changes, so phones fetch the new copies.
   Old saved copies are deleted when the new version takes over. */
const VERSION = "2026-11-01";
const CACHE = "paycheck-budget-" + VERSION;
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./lib/jspdf.umd.min.js", "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("paycheck-budget-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; /* key server, cdnjs: straight to the network, never saved */
  if (req.mode === "navigate" || url.pathname.endsWith("/index.html") || url.pathname.endsWith("/")) {
    /* the app itself: network first, saved copy when offline */
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); }
      return res;
    }).catch(() => caches.match("./index.html").then(r => r || caches.match("./"))));
    return;
  }
  /* other files of this app: saved copy first */
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
});
