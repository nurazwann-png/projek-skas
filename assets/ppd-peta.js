/* Peta skematik Daerah Dalat & panel amaran awal — dikongsi oleh paparan Admin dalam aplikasi */
(function () {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const WARNA = { hijau: 'var(--ppd-ok)', kuning: 'var(--ppd-warn)', merah: 'var(--ppd-danger)', tiada: 'var(--ppd-t3)' };

  // titik: [{ nama, x, y (0–100), tahap: hijau|kuning|merah, nilai, sub, saiz (0–1) }]
  function peta({ titik, tajuk, nota }) {
    const W = 100, H = 64;
    const pts = titik.map(t => {
      const cx = t.x, cy = t.y * H / 100, r = 1.3 + (t.saiz || 0.5) * 1.1;
      const kanan = cx < 66;
      return `<g class="pt-g" tabindex="0" role="listitem" aria-label="${esc(t.nama)}: ${esc(t.nilai)}, ${esc(t.sub)}">
        <circle cx="${cx}" cy="${cy}" r="${r + 1.2}" fill="${WARNA[t.tahap]}" opacity=".18"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="${WARNA[t.tahap]}" stroke="var(--ppd-surface)" stroke-width=".6"/>
        <text x="${kanan ? cx + r + 1.6 : cx - r - 1.6}" y="${cy - 0.4}" text-anchor="${kanan ? 'start' : 'end'}" class="pt-n">${esc(t.nama)}</text>
        <text x="${kanan ? cx + r + 1.6 : cx - r - 1.6}" y="${cy + 3.1}" text-anchor="${kanan ? 'start' : 'end'}" class="pt-v">${esc(t.nilai)}</text>
      </g>`;
    }).join('');
    return `<div class="peta-card">
      <div class="peta-h"><div><div class="peta-t">${esc(tajuk)}</div><div class="peta-s">Rajah skematik Daerah Dalat · bukan mengikut skala</div></div>
        <div class="peta-leg"><span><i style="background:${WARNA.hijau}"></i>Baik</span><span><i style="background:${WARNA.kuning}"></i>Perhatian</span><span><i style="background:${WARNA.merah}"></i>Kritikal</span></div></div>
      <div class="peta-wrap">
        <svg viewBox="0 0 ${W} ${H}" role="list" aria-label="${esc(tajuk)}">
          <path class="peta-darat" d="M4 10 Q18 3 34 6 T66 5 Q86 4 96 14 Q98 30 94 44 Q90 58 72 60 Q50 63 30 59 Q10 57 5 44 Q2 26 4 10 Z"/>
          <path class="peta-laut" d="M4 10 Q18 3 34 6 T66 5 Q86 4 96 14 L100 0 L0 0 Z"/>
          <path class="peta-sungai" d="M14 6 Q20 16 30 18 Q44 20 50 28 Q56 36 66 40 Q78 44 86 56"/>
          <path class="peta-sungai kecil" d="M50 28 Q42 36 38 40 Q34 46 26 50"/>
          <text x="48" y="4" class="peta-lbl">Laut China Selatan</text>
          <text x="80" y="54" class="peta-lbl" transform="rotate(45 80 54)">Batang Oya</text>          ${pts}
        </svg>
      </div>
      <ul class="peta-senarai">${titik.map(t => `<li><i style="background:${WARNA[t.tahap]}"></i><div><b>${esc(t.nama)}</b><span>${esc(t.nilai)} · ${esc(t.sub)}</span></div></li>`).join('')}</ul>
      ${nota ? `<div class="peta-nota">${nota}</div>` : ''}
    </div>`;
  }

  // senarai: [{ tahap: merah|kuning, sekolah, tajuk, butiran, aksi? (html) }]
  function amaran(senarai, { tajuk = 'Amaran Awal', kosong = 'Tiada perkara memerlukan perhatian segera.' } = {}) {
    const m = senarai.filter(a => a.tahap === 'merah').length;
    return `<div class="amaran-card">
      <div class="amaran-h"><span class="amaran-t">${esc(tajuk)}</span>
        ${senarai.length ? `<span class="amaran-c">${m ? `<b class="m">${m} kritikal</b>` : ''}${senarai.length - m ? `<b class="k">${senarai.length - m} perhatian</b>` : ''}</span>` : ''}</div>
      ${senarai.length ? senarai.map(a => `<div class="amaran-row amaran-${a.tahap}">
        <span class="amaran-ic">${a.tahap === 'merah' ? '!' : '•'}</span>
        <div class="amaran-b"><div class="amaran-sk">${esc(a.sekolah)}</div><div class="amaran-tj">${esc(a.tajuk)}</div><div class="amaran-bt">${esc(a.butiran)}</div></div>
        ${a.aksi || ''}
      </div>`).join('') : `<div class="amaran-kosong">✓ ${esc(kosong)}</div>`}
    </div>`;
  }

  window.PPDPeta = { peta, amaran };
})();
