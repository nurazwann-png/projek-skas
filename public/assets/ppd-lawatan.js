/* Lawatan berpandu (tutorial kali pertama) untuk Portal PPD Dalat dan aplikasinya.
   PPDLawatan.mula(id, langkah, { paksa }) — langkah: [{ sel, alt?, tajuk, teks, sebelum? }]
   - sel/alt: pemilih CSS (atau fungsi) elemen yang diserlahkan; alt digunakan jika sel tidak kelihatan
     (contohnya menu sisi yang tersembunyi di telefon). Langkah tanpa elemen dipaparkan di tengah skrin.
   - Dipaparkan automatik SEKALI sahaja bagi setiap aplikasi (portal, skas, spm) untuk setiap pengguna, iaitu kali
     pertama pengguna membukanya. Ditanda "sudah" sebaik dipaparkan dan disimpan dalam profil pengguna di pelayan
     (ppd_profil.lawatan), jadi tidak muncul lagi di peranti lain, selepas tukar peranan, atau selepas dipasang
     sebagai aplikasi. Butang panduan (paksa: true) sentiasa boleh membukanya semula. */
(function () {
  const uid = () => (window.PPDAuth?.currentUser?.() || {}).id || 'tetamu';
  const app = id => String(id).split('-')[0]; // 'portal-admin' -> 'portal', 'skas-teacher' -> 'skas'
  const KUNCI = id => `ppd_lawatan:${app(id)}:${uid()}`;
  const KUNCI_LAMA = id => `ppd_lawatan:${id}:${uid()}`; // format sebelum ini (setiap peranan)
  const profil = () => { try { return window.PPDData?.skas?.profil?.(uid()) || {}; } catch { return {}; } };
  const sudah = id => {
    try { if (localStorage.getItem(KUNCI(id)) || localStorage.getItem(KUNCI_LAMA(id))) return true; } catch {}
    const l = profil().lawatan;
    return !!(l && l[app(id)]);
  };
  const tandaSudah = id => {
    try { localStorage.setItem(KUNCI(id), String(Date.now())); } catch {}
    // Simpan dalam profil pengguna (disegerak ke pelayan) supaya kekal merentas peranti
    try {
      const D = window.PPDData, u = uid();
      if (!D?.skas?.saveProfil || u === 'tetamu') return;
      const p = D.skas.profil(u) || {};
      if (p.lawatan && p.lawatan[app(id)]) return;
      D.skas.saveProfil(u, { ...p, lawatan: { ...(p.lawatan || {}), [app(id)]: Date.now() } });
    } catch {}
  };

  const CSS = `
.pl-latar{position:fixed;inset:0;z-index:2147482999;background:rgba(7,20,38,.62)}
.pl-sorot{position:fixed;z-index:2147483000;border-radius:12px;box-shadow:0 0 0 4px #c8962a;pointer-events:none;transition:all .25s ease}
.pl-sorot.tengah{display:none}
.pl-kad{position:fixed;z-index:2147483001;width:min(360px,calc(100vw - 24px));background:#fff;color:#1a2433;border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.35);padding:16px 16px 12px;font:14px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
.pl-kad h3{margin:0 0 6px;font-size:15.5px;font-weight:700;line-height:1.3;color:#0b2a4a}
.pl-kad b{font-weight:700;color:#1a2433}
.pl-kad p{margin:0;color:#475467;font-size:13.5px}
.pl-kaki{display:flex;align-items:center;gap:8px;margin-top:14px}
.pl-kaki .bil{font-size:12px;color:#98a2b3;margin-right:auto}
.pl-kaki button{border:0;border-radius:9px;padding:8px 14px;font:700 13px inherit;cursor:pointer;min-height:38px}
.pl-langkau{background:none!important;color:#6b7686;padding:8px 6px!important}
.pl-balik{background:#eef1f5;color:#0b2a4a}
.pl-terus{background:#0b2a4a;color:#fff}
.pl-titik{display:flex;gap:4px;margin-top:10px}
.pl-titik i{width:6px;height:6px;border-radius:50%;background:#dde3eb}
.pl-titik i.on{background:#c8962a;width:16px;border-radius:3px}
@media (max-width:600px){.pl-kad{left:12px!important;right:12px;width:auto;bottom:calc(12px + env(safe-area-inset-bottom,0px))!important;top:auto!important}}
@media (prefers-reduced-motion:reduce){.pl-sorot{transition:none}}`;

  let aktif = null;

  function kelihatan(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const s = getComputedStyle(el);
    return s.visibility !== 'hidden' && r.right > 0 && r.left < innerWidth;
  }
  function cari(p) {
    if (!p) return null;
    const el = typeof p === 'function' ? p() : document.querySelector(p);
    return kelihatan(el) ? el : null;
  }

  function lukis() {
    const { langkah, i, sorot, kad } = aktif;
    const L = langkah[i];
    const el = cari(L.sel) || cari(L.alt);
    kad.innerHTML = `<h3>${L.tajuk}</h3><p>${L.teks}</p>
      <div class="pl-titik">${langkah.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="pl-kaki"><span class="bil">${i + 1} / ${langkah.length}</span>
        ${i < langkah.length - 1 ? '<button type="button" class="pl-langkau">Langkau</button>' : ''}
        ${i ? '<button type="button" class="pl-balik">Kembali</button>' : ''}
        <button type="button" class="pl-terus">${i === langkah.length - 1 ? 'Selesai' : 'Seterusnya'}</button></div>`;
    kad.querySelector('.pl-langkau')?.addEventListener('click', tamat);
    kad.querySelector('.pl-balik')?.addEventListener('click', () => pergi(i - 1));
    kad.querySelector('.pl-terus').addEventListener('click', () => (i === langkah.length - 1 ? tamat() : pergi(i + 1)));
    kad.querySelector('.pl-terus').focus({ preventScroll: true });
    aktif.el = el;
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(letak, el ? 320 : 0);
  }
  function letak() {
    if (!aktif) return;
    const { sorot, kad, el, latar } = aktif;
    if (!el) {
      sorot.classList.add('tengah');
      latar.style.clipPath = 'none';
      if (innerWidth > 600) Object.assign(kad.style, { left: Math.max(12, (innerWidth - kad.offsetWidth) / 2) + 'px', top: Math.max(12, (innerHeight - kad.offsetHeight) / 2) + 'px' });
      return;
    }
    sorot.classList.remove('tengah');
    const r = el.getBoundingClientRect(), pad = 6;
    const x1 = Math.max(0, r.left - pad), y1 = Math.max(0, r.top - pad), x2 = Math.min(innerWidth, r.right + pad), y2 = Math.min(innerHeight, r.bottom + pad);
    Object.assign(sorot.style, { left: x1 + 'px', top: y1 + 'px', width: Math.max(0, x2 - x1) + 'px', height: Math.max(0, y2 - y1) + 'px' });
    // Lapisan gelap dengan "lubang" di sekeliling elemen (evenodd)
    latar.style.clipPath = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${x1}px ${y1}px, ${x1}px ${y2}px, ${x2}px ${y2}px, ${x2}px ${y1}px, ${x1}px ${y1}px)`;
    if (innerWidth <= 600) return; // kad di bawah skrin (CSS)
    const kw = kad.offsetWidth, kh = kad.offsetHeight, jarak = 14;
    let left, top;
    if (r.bottom + jarak + kh <= innerHeight - 12) top = r.bottom + jarak;               // bawah
    else if (r.top - jarak - kh >= 12) top = r.top - jarak - kh;                          // atas
    if (top !== undefined) left = r.left + r.width / 2 - kw / 2;
    else if (r.right + jarak + kw <= innerWidth - 12) { left = r.right + jarak; top = r.top; }   // kanan
    else if (r.left - jarak - kw >= 12) { left = r.left - jarak - kw; top = r.top; }            // kiri
    else { left = innerWidth - kw - 16; top = innerHeight - kh - 16; }                           // penjuru bawah
    Object.assign(kad.style, { left: Math.min(innerWidth - kw - 12, Math.max(12, left)) + 'px', top: Math.min(innerHeight - kh - 12, Math.max(12, top)) + 'px' });
  }
  async function pergi(j) {
    if (!aktif) return;
    aktif.i = j;
    const L = aktif.langkah[j];
    if (L.sebelum) { try { await L.sebelum(); } catch {} await new Promise(r => setTimeout(r, 250)); }
    lukis();
  }
  function tamat() {
    if (!aktif) return;
    tandaSudah(aktif.id);
    aktif.sorot.remove(); aktif.kad.remove(); aktif.latar.remove();
    removeEventListener('resize', letak); removeEventListener('scroll', letak, true); removeEventListener('keydown', kekunci);
    const selesai = aktif.selesai; aktif = null;
    selesai?.();
  }
  function kekunci(e) {
    if (e.key === 'Escape') tamat();
    else if (e.key === 'ArrowRight' && aktif.i < aktif.langkah.length - 1) pergi(aktif.i + 1);
    else if (e.key === 'ArrowLeft' && aktif.i > 0) pergi(aktif.i - 1);
  }

  function mula(id, langkah, o = {}) {
    if (aktif || (!o.paksa && sudah(id))) return false;
    // Langkah yang menunjuk elemen yang tiada untuk peranan/paparan ini dilangkau
    langkah = (langkah || []).filter(L => !L.sel || L.sebelum || cari(L.sel) || cari(L.alt));
    if (!langkah.length) return false;
    if (!document.getElementById('pl-css')) { const s = document.createElement('style'); s.id = 'pl-css'; s.textContent = CSS; document.head.appendChild(s); }
    const latar = document.createElement('div'); latar.className = 'pl-latar';
    const sorot = document.createElement('div'); sorot.className = 'pl-sorot';
    const kad = document.createElement('div'); kad.className = 'pl-kad'; kad.setAttribute('role', 'dialog'); kad.setAttribute('aria-modal', 'true'); kad.setAttribute('aria-label', 'Panduan penggunaan');
    document.body.append(latar, sorot, kad);
    aktif = { id, langkah, i: 0, sorot, kad, latar, el: null, selesai: o.selesai };
    // Ditanda sebaik dipaparkan: walaupun pengguna beralih halaman di tengah lawatan, ia tidak muncul semula
    if (!o.paksa) tandaSudah(id);
    addEventListener('resize', letak); addEventListener('scroll', letak, true); addEventListener('keydown', kekunci);
    pergi(0);
    return true;
  }

  window.PPDLawatan = { mula, sudah, set: id => { try { localStorage.removeItem(KUNCI(id)); } catch {} } };
})();
