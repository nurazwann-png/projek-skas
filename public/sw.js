/* Pekerja servis Portal PPD Dalat (PWA): rangkaian dahulu, salinan simpanan jika tiada talian.
   Panggilan /api tidak disentuh (data disegerakkan oleh assets/ppd-segerak.js). */
const NAMA = 'ppd-dalat-v3';
// Cengkerang aplikasi disimpan semasa pemasangan supaya portal boleh dibuka tanpa talian sejak awal
const CENGKERANG = [
  '/welcome.html', '/ppd-dalat.html', '/skas-preview.html', '/offline.html', '/manifest.webmanifest',
  '/icons/ikon-192.png', '/icons/ikon-512.png', '/icons/ikon-32.png', '/icons/apple-touch-icon.png',
  '/assets/ppd-theme.css', '/assets/ppd-segerak.js', '/assets/ppd-auth.js', '/assets/ppd-data.js', '/assets/ppd-ui.js',
  '/assets/ppd-pembantu.js', '/assets/ppd-lawatan.js', '/assets/ppd-lokasi.js', '/assets/logo-kpm.jpg', '/assets/logo-skas.png',
];
// Selain fail portal sendiri, hanya CDN ini disimpan untuk luar talian. Permintaan lain (Google Maps, Esri dsb.) tidak disentuh.
const CDN = ['cdnjs.cloudflare.com', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  // Setiap fail disimpan berasingan: satu fail gagal tidak menggagalkan pemasangan
  e.waitUntil(caches.open(NAMA).then(c => Promise.all(CENGKERANG.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
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
      // Halaman yang belum pernah dibuka: papar halaman luar talian
      if (req.mode === 'navigate') {
        const luar = await cache.match('/offline.html');
        if (luar) return luar;
      }
      throw err;
    }
  })());
});
