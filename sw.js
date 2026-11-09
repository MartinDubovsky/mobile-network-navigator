/* Mobile Network Navigator – service worker of the installed app (only used when the app is served over HTTPS, e.g. GitHub Pages).
   It keeps the app's own files for offline use and nothing else: only same-origin GET requests for the files below are answered.
   Network data and captures never reach it – the app reads them locally and has no network access at all.
   Updates: the cached copy is shown at once and refreshed in the background; when a new version arrived, the page is told
   and offers a reload. */
const CACHE = 'mnn-app-v1';
const FILES = ['index.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-maskable.svg',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];
const BASE = new URL('./', self.location).href;
const KEYS = new Set(FILES.map(f => BASE + f));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(BASE + f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('mnn-app-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
/* the app page itself: the scope root or index.html (any query or fragment); other pages under the scope are not touched */
function keyOf(req) {
  const u = new URL(req.url);
  if (u.origin !== self.location.origin) return null;
  const p = u.origin + u.pathname;
  if (req.mode === 'navigate') return p === BASE || p === BASE + 'index.html' ? BASE + 'index.html' : null;
  return KEYS.has(p) ? p : null;
}
/* cached: a copy of the cached response (its body is read here) */
async function refresh(key, cached) {
  try {
    const r = await fetch(key, { cache: 'no-cache' });
    if (!r.ok) return;
    const c = await caches.open(CACHE);
    if (key.endsWith('/index.html') && cached) {
      const [a, b] = await Promise.all([r.clone().text(), cached.text()]);
      if (a === b) return;
      await c.put(key, r);
      (await self.clients.matchAll({ type: 'window' })).forEach(w => w.postMessage({ type: 'mnn-update' }));
      return;
    }
    await c.put(key, r);
  } catch (e) { /* offline – keep the cached copy */ }
}
/* a page that just started asks whether the cache already holds another version than its own (the download may have finished
   before the page existed, so the message after refresh() would not reach it) */
self.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'mnn-hello' || !e.source) return;
  e.waitUntil((async () => {
    const r = await caches.match(BASE + 'index.html');
    if (!r) return;
    const m = (await r.text()).match(/<meta name="version" content="([^"]+)"/);
    if (m && m[1] !== e.data.version) e.source.postMessage({ type: 'mnn-update' });
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const key = keyOf(req);
  if (!key) return;
  e.respondWith((async () => {
    const cached = await caches.match(key);
    const upd = refresh(key, cached && cached.clone());   /* cloned before the original goes to the page */
    if (cached) { e.waitUntil(upd); return cached; }
    await upd;
    return (await caches.match(key)) || fetch(req);
  })());
});
