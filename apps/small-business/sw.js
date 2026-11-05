/* Small Business: lets the app open with no signal once it has been opened once.
   The app page is network-first, so updates arrive whenever there's a connection.
   Only the app's own files are kept: its page, PDF and QR tools, icons and manifest. Any other page in this folder
   (or anywhere else) is never saved or served from here, and nothing from the key server is ever stored.
   build.py sets the cache name from the shipped files and this helper, so every update gets a fresh copy. */
const CACHE = "smallbiz-a49b634575";
const FILES = ["./", "./index.html", "./lib/jspdf.umd.min.js", "./lib/qrcode.js", "./manifest.webmanifest", "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png"];
self.addEventListener("install", e => {
  /* one missing file must not stop the rest from being saved */
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("smallbiz-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return; /* key server, cdnjs and everything else go straight to the network */
  const scope = new URL(self.registration.scope).pathname;
  if (!u.pathname.startsWith(scope)) return;
  const isApp = u.pathname === scope || u.pathname === scope + "index.html";
  if (isApp) {
    /* the app page (also what the Home Screen icon opens): network first, the saved copy when offline */
    e.respondWith(fetch(r).then(res => { if (res.ok && res.type === "basic" && !res.redirected) { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); } return res; })
      .catch(() => caches.match("./index.html").then(m => m || caches.match("./"))));
    return;
  }
  /* other pages in this folder are never kept: straight to the network */
  if (r.mode === "navigate") return;
  /* the app's own tools and icons: saved copy first, the network when it isn't saved yet (nothing new is stored) */
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(m => m || fetch(r)));
});
