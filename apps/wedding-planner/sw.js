/* Wedding Command Center offline helper.
   - The app page is fetched fresh when there's a connection (so updates arrive),
     and the last copy is used when there isn't.
   - The PDF maker and icons are kept so they work offline too.
   - Only Wedding's own page and files are saved. Other pages in this folder (like a shop page) are never saved or served from here.
   - Anything from another site (the key server, cdnjs) is never touched or kept.
   - Only Wedding's own old caches are removed. The other apps on the site keep theirs. */
const CACHE = 'wedding-cc-5065928300';
const FILES = ['./', './index.html', './lib/pdf-lib.min.js', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
const OWN = FILES.filter(f => f.length > 2 && f !== './index.html').map(f => f.slice(2));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('wedding-cc-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // key server and cdnjs go straight to the network
  const scope = new URL(self.registration.scope).pathname;
  if (!url.pathname.startsWith(scope)) return;
  const rel = url.pathname.slice(scope.length);
  if (req.mode === 'navigate') {
    // Only Wedding's own page is saved and served offline. Any other page under this folder is left alone.
    if (rel !== '' && rel !== 'index.html') return;
    e.respondWith(fetch(req).then(res => {
      if (res.ok && !res.redirected) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); }
      return res;
    }).catch(() => caches.match('./index.html').then(r => r || caches.match('./'))));
    return;
  }
  // The PDF maker, icons and manifest: the saved copy first, the network when it isn't saved yet. Nothing else is kept.
  if (!OWN.includes(rel)) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
