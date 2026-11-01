/* Paycheck Budget: lets the app open with no signal from the Home Screen.
   It only ever saves and serves Budget's own files (the list below). Any other page that happens to
   sit under this folder, and anything from other sites (like the key server), goes straight to the
   network and is never saved.
   The app page is fetched fresh when online (so updates arrive) and saved for offline.
   Change VERSION whenever a file in lib/ or icons/ (or the manifest) changes, so phones fetch the new
   copies. Old saved copies are deleted when the new version takes over. */
const VERSION = "2026-11-01b";
const CACHE = "paycheck-budget-" + VERSION;
const FILES = ["./index.html", "./manifest.webmanifest", "./lib/jspdf.umd.min.js", "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", e => {
  /* one missing file must not stop the rest from being saved */
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("paycheck-budget-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const base = new URL(self.registration.scope).pathname;          /* this app's folder, like /apps/budget/ */
  if (!url.pathname.startsWith(base)) return;
  const rel = url.pathname.slice(base.length);                     /* "" or "index.html" for the app itself */
  if (rel === "" || rel === "index.html") {
    /* Budget's own page: network first, saved copy when offline. Only a real page answer is saved. */
    e.respondWith(fetch(req).then(res => {
      if (res.ok && res.type === "basic" && !res.redirected && (res.headers.get("content-type") || "").includes("text/html")) {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy));
      }
      return res;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  if (FILES.includes("./" + rel)) {
    /* Budget's PDF tool, icons and manifest: saved copy first */
    e.respondWith(caches.match("./" + rel).then(r => r || fetch(req)));
  }
  /* anything else under this folder (another page, a shop page): not touched, never saved */
});
