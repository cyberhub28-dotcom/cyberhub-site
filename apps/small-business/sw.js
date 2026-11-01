/* Small Business: lets the app open with no signal once it has been opened once.
   The page itself is network-first, so updates arrive whenever there's a connection.
   Only this app's own files are cached. Nothing from the key server or anywhere else is ever stored.
   build.py sets the cache name from the shipped files, so every update gets a fresh copy. */
const CACHE = "smallbiz-25e4ebdbb2";
const FILES = ["./", "index.html", "lib/jspdf.umd.min.js", "lib/qrcode.js", "manifest.webmanifest", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("smallbiz-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return; /* key server, cdnjs and everything else go straight to the network */
  if (r.mode === "navigate" || u.pathname.endsWith("/") || u.pathname.endsWith("/index.html")) {
    e.respondWith(fetch(r).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put("index.html", copy)); } return res; })
      .catch(() => caches.match("index.html").then(m => m || caches.match("./"))));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(m => m || fetch(r)));
});
