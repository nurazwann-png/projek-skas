/* Kesan skrol ringan untuk halaman portal (tanpa pustaka luar).
   Atribut:
     data-parallax="0.35"     lapisan bergerak lebih perlahan daripada halaman (nisbah kelajuan, relatif kepada elemen induk)
     data-parallax-pudar      kandungan naik sedikit dan pudar semasa induknya diskrol keluar (cth. teks hero)
     data-muncul              elemen naik + muncul apabila masuk ke skrin
     data-muncul-anak="80"    setiap anak muncul berperingkat (ms antara anak); anak yang ditambah kemudian turut dipantau
   Juga: bar kemajuan skrol di atas skrin, dan kelas body.ppds-diskrol selepas 80px, dibuang di bawah 16px (kepala halaman mengecil).
   Semua kesan dimatikan jika pengguna memilih "kurangkan gerakan" (prefers-reduced-motion). */
(function () {
  const kurangGerak = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const css = document.createElement('style');
  css.textContent = `
[data-muncul]{opacity:0;transform:translateY(26px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1);transition-delay:var(--ppds-lengah,0ms)}
[data-muncul].ppds-tiba{opacity:1;transform:none}
.ppds-bar{position:fixed;top:0;left:0;right:0;height:3px;z-index:1000;pointer-events:none;transform-origin:0 50%;transform:scaleX(0);background:linear-gradient(90deg,#c8962a,#e5c066)}
[data-parallax],[data-parallax-pudar]{will-change:transform}
@media (prefers-reduced-motion:reduce){[data-muncul]{opacity:1!important;transform:none!important;transition:none!important}.ppds-bar{display:none}}`;
  document.head.appendChild(css);

  // ---- Muncul semasa skrol ----
  const pemerhati = 'IntersectionObserver' in window && !kurangGerak ? new IntersectionObserver(entri => {
    entri.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      pemerhati.unobserve(el);
      el.classList.add('ppds-tiba');
      // Selepas animasi, buang atribut supaya transform/hover asal elemen (cth. kad naik bila dihover) berfungsi semula.
      // Hanya peralihan elemen ini sendiri dikira (transitionend daripada anak juga naik ke sini).
      const siap = () => {
        el.removeEventListener('transitionend', akhir);
        el.removeAttribute('data-muncul'); el.classList.remove('ppds-tiba'); el.style.removeProperty('--ppds-lengah');
      };
      const akhir = ev => { if (ev.target === el && ev.propertyName === 'transform') siap(); };
      el.addEventListener('transitionend', akhir);
      // Sandaran jika transitionend tidak berlaku (cth. tab tersembunyi): lengah berperingkat + tempoh animasi + kelonggaran
      setTimeout(siap, (parseFloat(el.style.getPropertyValue('--ppds-lengah')) || 0) + 1100);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }) : null;

  function pantau(el) {
    if (!pemerhati) { el.removeAttribute('data-muncul'); return; }
    pemerhati.observe(el);
  }
  function pantauAnak(bekas) {
    const langkah = +bekas.dataset.munculAnak || 80;
    const proses = () => [...bekas.children].forEach((anak, i) => {
      if (anak.dataset.ppdsDilihat) return;
      anak.dataset.ppdsDilihat = '1';
      anak.setAttribute('data-muncul', '');
      anak.style.setProperty('--ppds-lengah', Math.min(i, 8) * langkah + 'ms');
      pantau(anak);
    });
    proses();
    // Kandungan yang dijana kemudian (cth. kad KPI ikut peranan) turut dianimasikan
    new MutationObserver(proses).observe(bekas, { childList: true });
  }

  // ---- Parallax, pudar dan bar kemajuan (satu kitaran rAF setiap skrol) ----
  let lapis = [], pudar = [], bar = null, menunggu = false;
  function kemaskini() {
    menunggu = false;
    const y = window.scrollY, tinggi = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${tinggi > 0 ? Math.min(1, y / tinggi) : 0})`;
    // Dua ambang (histeresis): kepala halaman yang mengecil mengurangkan tinggi halaman dan pelayar melaraskan skrol,
    // jadi satu ambang sahaja menyebabkan kelas bertukar berulang-ulang (berkelip) di sekitar ambang itu.
    const diskrol = document.body.classList.contains('ppds-diskrol');
    if (!diskrol && y > 80) document.body.classList.add('ppds-diskrol');
    else if (diskrol && y < 16) document.body.classList.remove('ppds-diskrol');
    lapis.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > innerHeight + 100) return; // di luar skrin: jangan kira
      // Anjakan bermula 0 apabila induk mula kelihatan (bagi hero: di atas halaman), kemudian ikut nisbah kelajuan
      el.style.transform = `translate3d(0, ${(Math.max(0, y - el._mulaY) * el._laju).toFixed(1)}px, 0)`;
    });
    pudar.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (el._atas - r.top) / Math.max(1, r.height)));
      el.style.transform = `translate3d(0, ${(p * 60).toFixed(1)}px, 0)`;
      el.style.opacity = Math.max(0, 1 - p * 1.15).toFixed(3);
    });
  }
  const minta = () => { if (!menunggu) { menunggu = true; requestAnimationFrame(kemaskini); } };

  function mula() {
    document.querySelectorAll('[data-muncul]').forEach(pantau);
    document.querySelectorAll('[data-muncul-anak]').forEach(pantauAnak);
    if (kurangGerak) return;
    lapis = [...document.querySelectorAll('[data-parallax]')];
    // Kedudukan rujukan dikira pada skrol 0: _mulaY = skrol ketika induk mula masuk skrin; _atas = jarak induk dari atas tetingkap
    const docTop = el => el.parentElement.getBoundingClientRect().top + scrollY;
    lapis.forEach(el => { el._laju = parseFloat(el.dataset.parallax) || 0.3; el._mulaY = Math.max(0, docTop(el) - innerHeight); });
    pudar = [...document.querySelectorAll('[data-parallax-pudar]')];
    pudar.forEach(el => { el._atas = Math.min(docTop(el), innerHeight); });
    bar = document.createElement('div');
    bar.className = 'ppds-bar'; bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    addEventListener('scroll', minta, { passive: true });
    addEventListener('resize', minta);
    kemaskini();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mula); else mula();
  window.PPDScrolly = { pantau, pantauAnak };
})();
