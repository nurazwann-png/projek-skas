/* Pekerja servis Portal PPD Dalat: rangkaian dahulu, salinan simpanan jika tiada talian.
   Panggilan /api tidak disentuh (data disegerakkan oleh assets/ppd-segerak.js). */
const NAMA = 'ppd-dalat-v1';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== NAMA).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin && url.pathname.startsWith('/api/')) return;
  if (url.hostname.endsWith('googleapis.com') && url.pathname.startsWith('/maps')) return; // peta Google memerlukan talian
  if (url.hostname === 'accounts.google.com') return;
  e.respondWith((async () => {
    const cache = await caches.open(NAMA);
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch (err) {
      const simpan = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
      if (simpan) return simpan;
      throw err;
    }
  })());
});
