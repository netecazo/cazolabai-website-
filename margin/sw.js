/* Offline support: the app shell is cached on install; fonts are cached as they load.
 * Bump VERSION whenever a shell file changes so phones pick up the new build. */
const VERSION = 'margin-v1';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'engine.js', 'store.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png',
    'samples/sales.csv', 'samples/payroll.csv', 'samples/bank.csv', 'samples/ads.csv',
    'samples/2026-08/sales.csv', 'samples/2026-08/payroll.csv', 'samples/2026-08/bank.csv', 'samples/2026-08/ads.csv'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);
    const font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
    if (url.origin !== location.origin && !font) return;
    // Network first for the app's own files so updates show; cache first for fonts.
    e.respondWith(font
        ? caches.match(e.request).then(hit => hit || fetch(e.request).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return res; }))
        : fetch(e.request).then(res => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); } return res; })
            .catch(() => caches.match(e.request).then(hit => hit || caches.match('index.html'))));
});
