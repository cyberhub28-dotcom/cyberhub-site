/* Credentials Tracker offline helper.
   Keeps a copy of the app and its PDF tools on the phone so it opens with no signal.
   The app page is network-first, so updates arrive whenever there's a connection.
   Only files from this folder are kept. Key server answers and anything else are never stored.
   build.py sets the cache name from the PDF tools, icons and manifest, so a change to any of them
   makes phones save fresh copies and delete the old ones. */
const CACHE = "credentials-afcd0a73aa";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./lib/jspdf.umd.min.js", "./lib/pdf-lib.min.js", "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", e => {
  // one missing file must not stop the rest from being saved
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("credentials-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  const scope = new URL(self.registration.scope);
  if (!url.pathname.startsWith(scope.pathname)) return;
  const isApp = url.pathname === scope.pathname || url.pathname === scope.pathname + "index.html";
  if (req.mode === "navigate" && isApp) {
    // the app page: try the network first, fall back to the saved copy offline
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); }
      return res;
    }).catch(() => caches.match("./index.html").then(r => r || caches.match("./"))));
    return;
  }
  // PDF tools and icons: the saved copy first, the network when it isn't saved yet
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
});
