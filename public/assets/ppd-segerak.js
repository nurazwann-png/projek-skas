/* Penyegerakan stor Portal PPD Dalat dengan pelayan (PostgreSQL).
   Aplikasi terus membaca/menulis localStorage seperti biasa. Skrip ini (dimuatkan SEBELUM ppd-auth.js):
     1. semasa halaman dibuka: menghantar perubahan tertunggak, kemudian memuat keadaan terkini dari pelayan ke localStorage;
     2. memintas setiap tulisan ke kunci kongsi, mengira item yang berubah dan menghantarnya ke pelayan;
     3. luar talian: perubahan disimpan dalam baris gilir pada peranti dan dihantar apabila talian pulih.
   Pelayan ialah sumber sebenar; localStorage hanyalah salinan kerja pada peranti. */
(function () {
  if (window.PPDSegerak) return;

  // Mesti sepadan dengan src/lib/pelayan/stor.ts
  const KOLEKSI = {
    ppd_users: { jenis: 'senarai', id: ['id'] },
    ppd_organisasi: { jenis: 'senarai', id: ['kod'] },
    ppd_audit: { jenis: 'senarai', id: ['t', 'olehId'] },
    ppd_pengumuman: { jenis: 'senarai', id: ['id'] },
    skas_kelas: { jenis: 'senarai', id: ['id'] },
    skas_marks: { jenis: 'peta' },
    ppd_skas_rekod: { jenis: 'peta' },
    ppd_efasiliti_tiket: { jenis: 'senarai', id: ['id'] },
    ppd_peringatan: { jenis: 'senarai', id: ['kelasId'] },
    ppd_spm_intervensi: { jenis: 'senarai', id: ['id'] },
    ppd_skas_maklumbalas_ai: { jenis: 'senarai', id: ['t', 'olehId'] },
  };
  const AWALAN = ['skas_gps_sejarah:', 'skas_gps_sasaran:'];
  const K_BARIS = 'ppd_segerak_baris', K_SESI = 'ppd_sesi';

  let LS;
  try { LS = window.localStorage; LS.getItem('x'); } catch { return; } // tanpa localStorage: tiada apa boleh disegerakkan
  const P = Storage.prototype;
  const asal = { set: P.setItem, get: P.getItem, buang: P.removeItem };
  const baca = k => { try { return JSON.parse(asal.get.call(LS, k)); } catch { return null; } };
  const tulisMentah = (k, v) => { try { asal.set.call(LS, k, JSON.stringify(v)); return true; } catch { return false; } };
  const buangMentah = k => { try { asal.buang.call(LS, k); } catch {} };
  const takrif = k => KOLEKSI[k] || (AWALAN.some(a => k.startsWith(a) && k.length > a.length) ? { jenis: 'nilai' } : null);

  // Bentuk seragam untuk membandingkan: { item: {id: json}, tertib: [id] }
  function bentuk(k, v) {
    const t = takrif(k), item = {}; let tertib = null;
    if (v == null) return { item, tertib };
    if (t.jenis === 'senarai') {
      tertib = [];
      (Array.isArray(v) ? v : []).forEach(x => {
        if (x == null) return;
        const id = t.id.map(f => x[f] == null ? '' : x[f]).join(':');
        if (!(id in item)) tertib.push(id);
        item[id] = JSON.stringify(x);
      });
    } else if (t.jenis === 'peta') {
      if (typeof v === 'object' && !Array.isArray(v)) Object.keys(v).forEach(id => { if (v[id] !== undefined) item[id] = JSON.stringify(v[id]); });
    } else item._ = JSON.stringify(v);
    return { item, tertib };
  }
  function beza(k, lama, baru) {
    const set = {}, del = []; let ada = false;
    Object.keys(baru.item).forEach(id => { if (lama.item[id] !== baru.item[id]) { set[id] = JSON.parse(baru.item[id]); ada = true; } });
    Object.keys(lama.item).forEach(id => { if (!(id in baru.item)) { del.push(id); ada = true; } });
    const op = { k };
    if (Object.keys(set).length) op.set = set;
    if (del.length) op.del = del;
    if (baru.tertib && JSON.stringify(baru.tertib) !== JSON.stringify(lama.tertib || [])) { op.tertib = baru.tertib; ada = true; }
    return ada ? op : null;
  }

  const salin = {};          // keadaan terakhir yang diketahui pelayan (atau sedang dalam baris gilir)
  let baris = baca(K_BARIS); // op yang belum disahkan pelayan
  if (!Array.isArray(baris)) baris = [];
  let luarTalian = false, sedangHantar = 0, masa = null;
  const keadaan = { demo: false, clientId: null };
  const simpanBaris = () => { baris.length ? tulisMentah(K_BARIS, baris) : buangMentah(K_BARIS); lukisPetunjuk(); };

  function xhr(kaedah, url, badan) {
    const x = new XMLHttpRequest();
    try {
      x.open(kaedah, url, false);
      if (badan) x.setRequestHeader('Content-Type', 'application/json');
      x.send(badan ? JSON.stringify(badan) : null);
    } catch { return null; }
    if (!x.status) return null;
    let j = null; try { j = JSON.parse(x.responseText); } catch {}
    return { status: x.status, j };
  }

  const kunciKongsiTempatan = () => {
    const ks = Object.keys(KOLEKSI);
    try { for (let i = 0; i < LS.length; i++) { const k = LS.key(i); if (AWALAN.some(a => k.startsWith(a))) ks.push(k); } } catch {}
    return ks;
  };
  function ambilSalin() { kunciKongsiTempatan().forEach(k => { salin[k] = bentuk(k, baca(k)); }); }

  // Guna keadaan pelayan pada localStorage. penuh = pengguna log masuk (kunci yang tiada di pelayan dibuang).
  function guna(j, penuh) {
    const stor = (j && j.stor) || {};
    const berubah = [];
    const ks = penuh ? [...new Set([...kunciKongsiTempatan(), ...Object.keys(stor)])] : Object.keys(stor);
    ks.forEach(k => {
      if (!takrif(k)) return;
      const lama = asal.get.call(LS, k);
      if (k in stor) { const s = JSON.stringify(stor[k]); if (s !== lama) { tulisMentah(k, stor[k]); berubah.push(k); } }
      else if (lama != null) { buangMentah(k); berubah.push(k); }
      salin[k] = bentuk(k, stor[k]);
    });
    return berubah;
  }
  function tetapSesi(j) {
    if (j && j.pengguna && j.pengguna.id) {
      const s = baca(K_SESI);
      if (!s || s.uid !== j.pengguna.id) tulisMentah(K_SESI, { uid: j.pengguna.id, t: Date.now() });
    } else buangMentah(K_SESI);
  }

  // Muat segerak (menyekat) supaya skrip aplikasi selepas ini melihat data terkini
  function muat() {
    if (baris.length) {
      const r = xhr('POST', '/api/stor', { ops: baris });
      if (!r) { luarTalian = true; ambilSalin(); return false; }
      if (r.status === 200) { baris = []; simpanBaris(); }
      // 401: sesi tamat; baris gilir dikekalkan dan dihantar selepas log masuk semula
    }
    const r = xhr('GET', '/api/stor');
    if (!r || !r.j) { luarTalian = true; ambilSalin(); return false; }
    luarTalian = false;
    keadaan.demo = !!r.j.demo; keadaan.clientId = r.j.clientId || null;
    // Data contoh hanya dijana oleh pelayar dalam mod demo; sistem sebenar bermula kosong
    window.PPD_TANPA_BENIH = !keadaan.demo;
    if (r.status === 200) { guna(r.j, true); tetapSesi(r.j); }
    else {
      guna(r.j, false);
      if (!keadaan.demo) { buangMentah('ppd_users'); salin.ppd_users = bentuk('ppd_users', null); }
      tetapSesi(null);
      ambilSalin();
    }
    return r.status === 200;
  }

  /* ── Pintasan tulisan ───────────────────────────── */
  function ubah(k) {
    if (!takrif(k)) return;
    const baru = bentuk(k, baca(k));
    const op = beza(k, salin[k] || { item: {}, tertib: null }, baru);
    salin[k] = baru;
    if (!op) return;
    // Gabung dengan op terakhir bagi kunci yang sama jika ia belum dalam penghantaran
    const akhir = baris.length > sedangHantar ? baris[baris.length - 1] : null;
    if (akhir && akhir.k === k) {
      const del = new Set(akhir.del || []);
      akhir.set = akhir.set || {};
      Object.keys(op.set || {}).forEach(id => { akhir.set[id] = op.set[id]; del.delete(id); });
      (op.del || []).forEach(id => { delete akhir.set[id]; del.add(id); });
      if (!Object.keys(akhir.set).length) delete akhir.set;
      if (del.size) akhir.del = [...del]; else delete akhir.del;
      if (op.tertib) akhir.tertib = op.tertib;
    } else baris.push(op);
    simpanBaris();
    clearTimeout(masa); masa = setTimeout(hantar, 250);
  }
  P.setItem = function (k, v) { asal.set.call(this, k, v); if (this === LS) ubah(String(k)); };
  P.removeItem = function (k) { asal.buang.call(this, k); if (this === LS) ubah(String(k)); };

  // Sesi tamat: ke halaman log masuk (sekali sahaja; tidak memuat semula jika sudah di sana)
  function keWelcome() {
    buangMentah(K_SESI);
    if (!location.pathname.endsWith('/welcome.html')) location.replace('/welcome.html');
  }
  async function hantar() {
    if (sedangHantar || !baris.length || !baca(K_SESI)) return;
    const n = baris.length; sedangHantar = n;
    try {
      const res = await fetch('/api/stor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ops: baris.slice(0, n) }) });
      if (res.status === 401) { sedangHantar = 0; keWelcome(); return; } // baris gilir dikekalkan; dihantar selepas log masuk semula
      if (!res.ok) throw new Error('pelayan ' + res.status);
      const j = await res.json();
      baris = baris.slice(n); sedangHantar = 0; luarTalian = false; simpanBaris();
      if (j.ditolak && j.ditolak.length) {
        // Pelayan menolak (cth. tiada kebenaran): pulihkan keadaan sebenar
        try { sessionStorage.setItem('ppd_segerak_mesej', j.ditolak[0].sebab || 'Perubahan tidak dibenarkan.'); } catch {}
        location.reload();
        return;
      }
      if (baris.length) hantar();
    } catch {
      sedangHantar = 0; luarTalian = true; lukisPetunjuk();
      clearTimeout(masa); masa = setTimeout(hantar, 15000);
    }
  }
  addEventListener('online', () => { luarTalian = false; hantar(); lukisPetunjuk(); });
  addEventListener('offline', () => { luarTalian = true; lukisPetunjuk(); });

  // Segar semula berkala supaya perubahan pengguna lain kelihatan tanpa memuat semula halaman (halaman React mendengar 'storage')
  async function segar() {
    if (baris.length || sedangHantar || document.hidden || !baca(K_SESI)) return;
    try {
      const res = await fetch('/api/stor', { cache: 'no-store' });
      if (res.status === 401) { keWelcome(); return; }
      if (!res.ok) return;
      const j = await res.json();
      if (baris.length || sedangHantar) return; // pengguna menulis semasa menunggu: jangan timpa
      luarTalian = false;
      guna(j, true).forEach(k => { try { dispatchEvent(new StorageEvent('storage', { key: k })); } catch {} });
      lukisPetunjuk();
    } catch { luarTalian = true; lukisPetunjuk(); }
  }
  setInterval(segar, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { hantar(); segar(); } });

  /* ── Petunjuk luar talian ───────────────────────── */
  let pil = null;
  function lukisPetunjuk() {
    if (!document.body) return;
    const n = baris.reduce((a, o) => a + Object.keys(o.set || {}).length + (o.del || []).length + (o.tertib && !o.set && !o.del ? 1 : 0), 0);
    const tunjuk = luarTalian;
    if (!tunjuk) { if (pil) pil.hidden = true; return; }
    if (!pil) {
      pil = document.createElement('div');
      pil.setAttribute('role', 'status');
      pil.style.cssText = 'position:fixed;left:max(16px,env(safe-area-inset-left,0px));bottom:max(16px,env(safe-area-inset-bottom,0px));z-index:9990;max-width:calc(100vw - 32px);display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:999px;background:#7a2e0e;color:#fff;font:600 12.5px/1.3 "Public Sans",system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25)';
      document.body.appendChild(pil);
    }
    pil.hidden = false;
    pil.textContent = n ? `Luar talian · ${n} perubahan disimpan pada peranti ini dan akan dihantar apabila talian pulih`
      : 'Luar talian · memaparkan data terakhir yang dimuat';
  }
  function bilaSedia() {
    lukisPetunjuk();
    let m = null; try { m = sessionStorage.getItem('ppd_segerak_mesej'); sessionStorage.removeItem('ppd_segerak_mesej'); } catch {}
    if (m) {
      const d = document.createElement('div');
      d.setAttribute('role', 'alert');
      d.style.cssText = 'position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:10001;max-width:calc(100vw - 32px);padding:11px 16px;border-radius:10px;background:#b42318;color:#fff;font:600 13px/1.4 "Public Sans",system-ui,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,.25)';
      d.textContent = 'Perubahan tidak disimpan: ' + m;
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 7000);
    }
    if (baris.length) hantar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bilaSedia); else bilaSedia();

  /* ── Log masuk / keluar ─────────────────────────── */
  async function pos(url, badan) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(badan || {}) });
      const j = await res.json().catch(() => ({}));
      return j && typeof j === 'object' ? j : {};
    } catch { return { ok: false, mesej: 'Tidak dapat menghubungi pelayan. Semak sambungan internet anda.' }; }
  }
  // Selepas pelayan menetapkan kuki sesi: muat stor dan pulangkan pengguna
  function selepasMasuk(j) {
    if (!j.ok) return j;
    muat();
    const A = window.PPDAuth, s = A && A.session();
    return s ? { ok: true, user: A.findById(s.uid), level: s.level } : { ok: false, mesej: 'Sesi tidak dapat dimulakan. Cuba lagi.' };
  }

  const pertama = muat();

  // Pekerja servis: halaman dan aset disimpan supaya portal boleh dibuka tanpa talian
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || baca('ppd_sw_uji'))) {
    addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
  }

  window.PPDSegerak = {
    get demo() { return keadaan.demo; },
    get clientId() { return keadaan.clientId; },
    get luarTalian() { return luarTalian; },
    get menunggu() { return baris.length; },
    logMasuk: pertama,
    muat, hantar,
    google: async kredensial => selepasMasuk(await pos('/api/auth/google', { kredensial })),
    demoMasuk: async emel => selepasMasuk(await pos('/api/auth/demo', { emel })),
    daftar: async d => selepasMasuk(await pos('/api/auth/daftar', d)),
    keluar() { xhr('POST', '/api/auth/keluar', {}); buangMentah(K_SESI); },
  };
})();
