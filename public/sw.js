/* Pekerja servis Portal PPD Dalat: rangkaian dahulu, salinan simpanan jika tiada talian.
   Panggilan /api tidak disentuh (data disegerakkan oleh assets/ppd-segerak.js). */
const NAMA = 'ppd-dalat-v2';
// Selain fail portal sendiri, hanya CDN ini disimpan untuk luar talian. Permintaan lain (Google Maps, Esri dsb.) tidak disentuh.
const CDN = ['cdnjs.cloudflare.com', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== NAMA).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sendiri = url.origin === location.origin;
  if (sendiri && url.pathname.startsWith('/api/')) return;
  if (!sendiri && !CDN.includes(url.hostname)) return;
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
