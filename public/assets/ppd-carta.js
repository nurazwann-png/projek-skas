/* Besarkan carta + huraian. Carta Chart.js dikesan automatik; carta HTML/CSS ditanda dengan data-carta='{spec JSON}'. */
(function () {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const GPS_BACA = 'GPS (Gred Purata Sekolah) berskala 1 hingga 10 — nilai <b>lebih rendah lebih baik</b> (1 = semua A+, 10 = semua gagal).';

  // Huraian ikut id kanvas / id carta. gps:true = nilai rendah lebih baik.
  const HURAIAN = {
    'ppd-trend-chart': { apa: 'Purata GPS seluruh daerah bagi setiap peperiksaan dalam tahun yang dipilih: AR1, AR2, Percubaan dan SPM sebenar.', baca: GPS_BACA + ' Garis yang menurun ke kanan bermakna prestasi daerah bertambah baik dari satu peperiksaan ke peperiksaan seterusnya.', gps: true },
    'sk-trend-chart': { apa: 'GPS SPM sekolah anda bagi beberapa tahun lepas, berbanding sasaran.', baca: GPS_BACA + ' Garis menurun = sekolah semakin baik dari tahun ke tahun. Gunakan trend ini untuk menilai sama ada sasaran GPS tahun ini realistik.', gps: true },
    'analisis-trend-chart': { apa: 'Purata markah kelas bagi setiap ujian (AR1 → AR2 → Percubaan).', baca: 'Paksi menegak ialah markah purata (0–100). Garis menaik bermakna kelas semakin baik. Penurunan antara dua ujian ialah isyarat untuk menyemak topik yang lemah sebelum SPM.' },
    'analisis-gred-chart': { apa: 'Bilangan murid dalam kelas bagi setiap gred SPM untuk ujian yang dipilih.', baca: 'Bar di sebelah kiri (A+, A, A-) ialah Cemerlang; bar di sebelah kanan (D, E, G) ialah murid yang hampir atau sudah gagal. Taburan yang condong ke kiri menunjukkan kelas yang kukuh.' },
    'jurang-chart-ses': { tajuk: 'Jurang Pencapaian mengikut SES', apa: 'GPS murid mengikut latar sosioekonomi (B40, M40, T20).', baca: GPS_BACA + ' Perbezaan ketinggian bar ialah <b>jurang pencapaian</b>. Jurang besar bermakna murid daripada keluarga berpendapatan rendah memerlukan sokongan tambahan.', gps: true },
    'jurang-chart-lokasi': { tajuk: 'Jurang Pencapaian mengikut Lokasi', apa: 'GPS murid mengikut lokasi kediaman (Bandar, Luar Bandar, Pedalaman).', baca: GPS_BACA + ' Jurang antara lokasi menunjukkan kesan akses (internet, pengangkutan, tuisyen) terhadap pencapaian.', gps: true },
    'jurang-chart-jantina': { tajuk: 'Jurang Pencapaian mengikut Jantina', apa: 'GPS murid lelaki berbanding perempuan.', baca: GPS_BACA + ' Bar yang lebih tinggi ialah kumpulan yang lebih lemah dan perlu diberi fokus intervensi.', gps: true },
    'jurang-chart-penginapan': { tajuk: 'Jurang Pencapaian: Asrama vs Harian', apa: 'GPS murid asrama berbanding murid harian.', baca: GPS_BACA + ' Perbezaan menunjukkan sama ada persekitaran asrama yang berstruktur membantu pencapaian.', gps: true },
    'ppd-ses-chart': { apa: 'GPS seluruh daerah mengikut latar sosioekonomi murid.', baca: GPS_BACA + ' Beza antara bar tertinggi dan terendah ialah jurang SES daerah.', gps: true },
    'ppd-jantina-chart': { apa: 'GPS seluruh daerah mengikut jantina.', baca: GPS_BACA, gps: true },
    'ppd-lokasi-chart': { apa: 'GPS seluruh daerah mengikut lokasi kediaman murid.', baca: GPS_BACA + ' Sekolah pedalaman biasanya memerlukan sokongan sumber yang lebih.', gps: true },
    'ppd-penginapan-chart': { apa: 'GPS seluruh daerah bagi murid asrama berbanding harian.', baca: GPS_BACA, gps: true },
    'ppd-gap-chart': { apa: 'Magnitud jurang (beza GPS antara kumpulan terbaik dan terlemah) bagi setiap dimensi: SES, jantina, lokasi dan penginapan.', baca: 'Bar yang paling panjang ialah dimensi dengan ketidaksamaan terbesar di daerah — ia patut menjadi keutamaan program intervensi.' },
    'bench-radar-chart': { apa: 'Profil GPS setiap subjek bagi 3 sekolah terbaik berbanding purata daerah.', baca: 'Setiap paksi ialah satu subjek. Bentuk yang lebih <b>kecil/ke tengah</b> bermakna GPS lebih rendah (lebih baik). Bandingkan bentuk sekolah dengan purata daerah untuk mengenal pasti subjek kekuatan dan kelemahan.', gps: true },
    'subjek-bar-chart': { apa: 'Purata GPS setiap mata pelajaran di peringkat daerah, disusun daripada yang paling lemah.', baca: GPS_BACA + ' Subjek di bahagian atas senarai ialah keutamaan untuk bengkel atau program peningkatan daerah.', gps: true },
    'ramal-bar-chart': { apa: 'GPS SPM tahun lepas berbanding ramalan GPS tahun ini bagi setiap sekolah, berdasarkan trend markah semasa.', baca: GPS_BACA + ' Jika bar ramalan lebih rendah daripada bar tahun lepas, sekolah dijangka bertambah baik.', gps: true },
    'modal-sk-trend-chart': { tajuk: 'Trend GPS Sekolah', apa: 'Trend GPS sekolah yang dipilih.', baca: GPS_BACA, gps: true },
    'modal-sk-ar-chart': { tajuk: 'Purata Markah Mengikut Ujian', apa: 'Purata markah sekolah yang dipilih bagi setiap ujian.', baca: 'Garis menaik bermakna markah murid bertambah baik dari AR1 ke Percubaan.' },
    'modal-sk-ses-chart': { tajuk: 'GPS Sekolah mengikut SES', apa: 'GPS sekolah yang dipilih mengikut SES.', baca: GPS_BACA, gps: true },
    'modal-sk-lokasi-chart': { tajuk: 'GPS Sekolah mengikut Lokasi', apa: 'GPS sekolah yang dipilih mengikut lokasi.', baca: GPS_BACA, gps: true },
    'modal-sk-jantina-chart': { tajuk: 'GPS Sekolah mengikut Jantina', apa: 'GPS sekolah yang dipilih mengikut jantina.', baca: GPS_BACA, gps: true },
    'pelajar-spark-chart': { tajuk: 'Trend Markah Murid', apa: 'Markah murid ini bagi setiap ujian.', baca: 'Garis menurun lebih daripada 5 markah ialah tanda murid berisiko dan perlu intervensi.' },
    'sk-pelajar-spark-chart': { tajuk: 'Trend Markah Murid', apa: 'Markah murid ini bagi setiap ujian.', baca: 'Garis menurun lebih daripada 5 markah ialah tanda murid berisiko dan perlu intervensi.' },
    // SK@S (carta HTML)
    'skas-trend-serahan': { apa: 'Bilangan rekod pencapaian yang dihantar setiap bulan, dibahagikan kepada rekod guru (SKPM 5.4.1) dan rekod sekolah (SKPM 5.4.2).', baca: 'Bar yang tinggi menunjukkan bulan paling aktif. Bulan tanpa bar bermakna tiada rekod dihantar — semak sama ada guru perlu diingatkan.' },
    'skas-peringkat-guru': { apa: 'Rekod pencapaian guru yang <b>layak</b> SKPM 5.4.1, mengikut peringkat pertandingan.', baca: 'Peringkat lebih tinggi (Antarabangsa, Kebangsaan) memberi skor SKPM lebih tinggi. Taburan yang banyak di peringkat Sekolah/Daerah menunjukkan ruang untuk menggalakkan penyertaan peringkat lebih tinggi.' },
    'skas-peringkat-sekolah': { apa: 'Rekod pencapaian sekolah yang <b>layak</b> SKPM 5.4.2, mengikut peringkat.', baca: 'Sama seperti carta guru: lebih banyak rekod di peringkat tinggi = skor aspek 5.4.2 yang lebih baik.' },
    'skas-peranan-guru': { apa: 'Bilangan rekod guru mengikut peranan (Peserta, Jurulatih, Penyelidik dan lain-lain), dibahagi kepada layak dan tidak layak.', baca: 'Peranan dengan banyak rekod tidak layak menunjukkan guru perlu dibimbing tentang syarat kelayakan SKPM 5.4.1.' },
  };
  const ikutId = id => HURAIAN[id] || HURAIAN[String(id).replace(/2$/, '')] || null;

  /* ── Rumusan automatik daripada data ── */
  const fmt = v => (typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(2)) : v ?? '—');
  function rumusan(spec, gps) {
    const out = [];
    const L = spec.label || [];
    spec.siri.forEach(s => {
      const pts = s.data.map((v, i) => ({ v: typeof v === 'object' && v ? v.y : v, l: L[i] })).filter(p => typeof p.v === 'number');
      if (pts.length < 2) return;
      const nama = spec.siri.length > 1 ? `<b>${esc(s.nama)}</b>: ` : '';
      const maks = pts.reduce((a, b) => b.v > a.v ? b : a), min = pts.reduce((a, b) => b.v < a.v ? b : a);
      const terbaik = gps ? min : maks, terlemah = gps ? maks : min;
      if (spec.jenis === 'line') {
        const d = pts[pts.length - 1].v - pts[0].v;
        const baik = gps ? d < 0 : d > 0;
        out.push(`${nama}Dari ${esc(pts[0].l)} (${fmt(pts[0].v)}) ke ${esc(pts[pts.length - 1].l)} (${fmt(pts[pts.length - 1].v)}): ${Math.abs(d) < 0.005 ? 'tiada perubahan' : `<span class="${baik ? 'ppdc-baik' : 'ppdc-lemah'}">${baik ? 'bertambah baik' : 'merosot'} ${fmt(Math.abs(d))}</span>`}.`);
      } else if (spec.jenis === 'radar') {
        out.push(`${nama}${gps ? 'Subjek terkuat' : 'Tertinggi'}: ${esc(terbaik.l)} (${fmt(terbaik.v)}); ${gps ? 'paling lemah' : 'terendah'}: ${esc(terlemah.l)} (${fmt(terlemah.v)}).`);
      } else {
        out.push(`${nama}${gps ? 'Terbaik' : 'Tertinggi'}: <b>${esc(terbaik.l)}</b> (${fmt(terbaik.v)}) · ${gps ? 'terlemah' : 'terendah'}: <b>${esc(terlemah.l)}</b> (${fmt(terlemah.v)})${pts.length > 1 ? ` · beza ${fmt(Math.abs(maks.v - min.v))}` : ''}.`);
      }
    });
    if (!out.length) out.push('Data tidak mencukupi untuk rumusan.');
    return out;
  }

  /* ── Modal ── */
  const CSS = `
.ppdc-btn{position:absolute;top:6px;right:6px;z-index:3;display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 9px;border-radius:7px;
  border:1px solid var(--ppd-border,#dde3eb);background:color-mix(in srgb,var(--ppd-surface,#fff) 92%,transparent);color:var(--ppd-t2,#475467);
  font:600 11.5px var(--ppd-font,system-ui);cursor:pointer;opacity:.85;transition:opacity .15s,border-color .15s;backdrop-filter:blur(4px)}
.ppdc-btn:hover,.ppdc-btn:focus-visible{opacity:1;border-color:var(--ppd-accent,#13406e);color:var(--ppd-accent,#13406e);outline:none}
.ppdc-btn svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.ppdc-host{position:relative}
.ppdc-btn.ppdc-inline{position:static;flex-shrink:0}
.ppdc-ov{position:fixed;inset:0;z-index:20000;background:rgba(7,28,51,.6);display:flex;align-items:center;justify-content:center;
  padding:max(16px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) 16px max(16px,env(safe-area-inset-left,0px));font-family:var(--ppd-font,system-ui)}
.ppdc-box{width:100%;max-width:1180px;max-height:calc(100vh - 32px);display:flex;flex-direction:column;background:var(--ppd-surface,#fff);color:var(--ppd-t1,#1a2433);
  border-radius:14px;border-top:4px solid var(--ppd-gold,#c8962a);box-shadow:0 24px 64px rgba(0,0,0,.35);overflow:hidden}
.ppdc-h{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px 20px 12px;border-bottom:1px solid var(--ppd-border,#dde3eb)}
.ppdc-k{font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ppd-gold,#c8962a)}
.ppdc-t{font-size:18px;font-weight:800;line-height:1.3;margin-top:2px}
.ppdc-s{font-size:12.5px;color:var(--ppd-t3,#6b7686);margin-top:2px}
.ppdc-x{border:0;background:none;color:var(--ppd-t3,#6b7686);cursor:pointer;width:40px;height:40px;border-radius:8px;display:grid;place-items:center;flex-shrink:0}
.ppdc-x:hover{background:var(--ppd-surface-2,#f8fafc);color:var(--ppd-t1,#1a2433)}
.ppdc-x svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round}
.ppdc-b{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(280px,1fr);gap:0;overflow:auto;min-height:0}
.ppdc-chart{padding:18px 20px;min-width:0}
.ppdc-cv{position:relative;height:min(58vh,520px)}
.ppdc-side{padding:18px 20px;border-left:1px solid var(--ppd-border,#dde3eb);background:var(--ppd-surface-2,#f8fafc);display:flex;flex-direction:column;gap:16px;min-width:0}
.ppdc-sec h4{margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--ppd-t3,#6b7686)}
.ppdc-sec p,.ppdc-sec li{font-size:13.5px;line-height:1.6;color:var(--ppd-t2,#475467);margin:0}
.ppdc-sec ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px}
.ppdc-sec b{color:var(--ppd-t1,#1a2433)}
.ppdc-baik{color:var(--ppd-ok,#067647);font-weight:700}.ppdc-lemah{color:var(--ppd-danger,#b42318);font-weight:700}
.ppdc-jadual{grid-column:1/-1;padding:4px 20px 20px;border-top:1px solid var(--ppd-border,#dde3eb)}
.ppdc-jadual summary{cursor:pointer;font-size:13px;font-weight:700;padding:12px 0;list-style:none;display:flex;align-items:center;gap:8px}
.ppdc-jadual summary::before{content:'▸';transition:transform .15s}.ppdc-jadual[open] summary::before{transform:rotate(90deg)}
.ppdc-tw{overflow-x:auto;border:1px solid var(--ppd-border,#dde3eb);border-radius:10px}
.ppdc-tw table{width:100%;border-collapse:collapse;font-size:13px}
.ppdc-tw th,.ppdc-tw td{padding:8px 12px;text-align:right;border-bottom:1px solid var(--ppd-border,#dde3eb);white-space:nowrap;font-variant-numeric:tabular-nums}
.ppdc-tw th:first-child,.ppdc-tw td:first-child{text-align:left}
.ppdc-tw thead th{background:var(--ppd-surface-2,#f8fafc);font-size:11.5px;color:var(--ppd-t2,#475467)}
.ppdc-tw tr:last-child td{border-bottom:0}
@media (max-width:820px){.ppdc-b{grid-template-columns:1fr}.ppdc-side{border-left:0;border-top:1px solid var(--ppd-border,#dde3eb)}.ppdc-cv{height:46vh}}
@media (max-width:560px){.ppdc-ov{padding:0}.ppdc-box{max-height:100vh;height:100%;border-radius:0}.ppdc-btn span{display:none}}
@media (pointer:coarse){.ppdc-btn{height:36px;min-width:36px;justify-content:center;opacity:1}}`;
  function gaya() {
    if (document.getElementById('ppdc-css')) return;
    const st = document.createElement('style'); st.id = 'ppdc-css'; st.textContent = CSS; document.head.appendChild(st);
  }

  const ICON = '<svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
  let semasa = null;

  function klon(v) {
    if (Array.isArray(v)) return v.map(klon);
    if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) { const o = {}; for (const k in v) o[k] = klon(v[k]); return o; }
    return v;
  }

  // spec: { tajuk, sub, jenis, label[], siri:[{nama,data[],warna}], tindan, mendatar, config? (Chart.js) }
  function buka(spec, huraian) {
    gaya();
    tutup();
    const gps = huraian ? !!huraian.gps : /GPS|GPMP/i.test(spec.tajuk + ' ' + (spec.sub || ''));
    const prev = document.activeElement;
    const ov = document.createElement('div');
    ov.className = 'ppdc-ov';
    ov.innerHTML = `<div class="ppdc-box" role="dialog" aria-modal="true" aria-labelledby="ppdc-t">
      <div class="ppdc-h"><div style="min-width:0"><div class="ppdc-k">Paparan terperinci</div><div class="ppdc-t" id="ppdc-t">${esc(spec.tajuk)}</div>${spec.sub ? `<div class="ppdc-s">${esc(spec.sub)}</div>` : ''}</div>
        <button type="button" class="ppdc-x" aria-label="Tutup"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
      <div class="ppdc-b">
        <div class="ppdc-chart"><div class="ppdc-cv"><canvas></canvas></div></div>
        <div class="ppdc-side">
          <div class="ppdc-sec"><h4>Apa yang ditunjukkan</h4><p>${huraian ? huraian.apa : esc(spec.sub || 'Visualisasi data bagi bahagian ini.')}</p></div>
          <div class="ppdc-sec"><h4>Cara membaca</h4><p>${huraian ? huraian.baca : (gps ? GPS_BACA : 'Halakan tetikus (atau sentuh) pada bar/titik untuk melihat nilai tepat. Klik nama dalam legenda untuk sembunyi/papar siri data.')}</p></div>
          <div class="ppdc-sec"><h4>Rumusan data</h4><ul>${rumusan(spec, gps).map(x => `<li>${x}</li>`).join('')}</ul></div>
          <div class="ppdc-sec"><p style="font-size:12px;color:var(--ppd-t3,#6b7686)">Halakan atau sentuh carta untuk nilai tepat. Klik legenda untuk sembunyi/papar siri.</p></div>
        </div>
        <details class="ppdc-jadual"><summary>Jadual data</summary><div class="ppdc-tw"><table>
          <thead><tr><th>${esc(spec.paksiLabel || 'Kategori')}</th>${spec.siri.map(s => `<th>${esc(s.nama)}</th>`).join('')}</tr></thead>
          <tbody>${(spec.label || []).map((l, i) => `<tr><td>${esc(l)}</td>${spec.siri.map(s => { const v = s.data[i]; return `<td>${fmt(typeof v === 'object' && v ? v.y : v)}</td>`; }).join('')}</tr>`).join('')}</tbody>
        </table></div></details>
      </div></div>`;
    document.body.appendChild(ov);
    document.documentElement.style.overflow = 'hidden';
    const cv = ov.querySelector('canvas');
    let chart = null;
    if (window.Chart) {
      const cfg = spec.config ? spec.config : {
        type: spec.jenis === 'hbar' ? 'bar' : spec.jenis,
        data: { labels: spec.label, datasets: spec.siri.map(s => ({ label: s.nama, data: s.data, backgroundColor: s.warna, borderColor: s.warna, borderWidth: spec.jenis === 'line' ? 3 : 0, borderRadius: 4, tension: .3, fill: false })) },
        options: { indexAxis: spec.jenis === 'hbar' ? 'y' : 'x', scales: { x: { stacked: !!spec.tindan }, y: { stacked: !!spec.tindan, beginAtZero: true, ticks: { precision: 0 } } } },
      };
      const opts = klon(cfg.options || {});
      opts.responsive = true; opts.maintainAspectRatio = false; opts.animation = { duration: 400 };
      opts.plugins = Object.assign({}, opts.plugins, { legend: Object.assign({ display: spec.siri.length > 1 }, (opts.plugins || {}).legend, { position: 'bottom' }),
        tooltip: Object.assign({}, (opts.plugins || {}).tooltip, { enabled: true }) });
      chart = new Chart(cv, { type: cfg.type, data: klon(cfg.data), options: opts, plugins: cfg.plugins || [] });
    } else {
      ov.querySelector('.ppdc-cv').innerHTML = '<p style="padding:20px;color:var(--ppd-t3)">Carta tidak dapat dipaparkan. Lihat jadual data di bawah.</p>';
      ov.querySelector('.ppdc-jadual').open = true;
    }
    const x = ov.querySelector('.ppdc-x');
    x.focus();
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); tutup(); } };
    document.addEventListener('keydown', onKey, true);
    ov.addEventListener('click', e => { if (e.target === ov) tutup(); });
    x.addEventListener('click', tutup);
    semasa = { ov, chart, onKey, prev };
  }
  function tutup() {
    if (!semasa) return;
    semasa.chart && semasa.chart.destroy();
    document.removeEventListener('keydown', semasa.onKey, true);
    semasa.ov.remove();
    document.documentElement.style.overflow = '';
    semasa.prev && semasa.prev.focus && semasa.prev.focus();
    semasa = null;
  }

  /* ── Pengesanan & butang ── */
  function tajukDekat(el) {
    const kad = el.closest('.chart-card, .card, .panel, .jurang-panel, .modal, [class*="modal"]') || el.parentElement;
    const t = kad && kad.querySelector('.chart-title, .sh-title, .ph .pt');
    const s = kad && kad.querySelector('.chart-sub');
    return { tajuk: t ? t.textContent.trim() : 'Carta', sub: s ? s.textContent.trim() : '' };
  }
  function specDariChart(ch, el) {
    const src = ch.config._config || { type: ch.config.type, data: ch.data, options: ch.options };
    const { tajuk, sub } = tajukDekat(el);
    const jenis = src.type === 'bar' && (src.options || {}).indexAxis === 'y' ? 'hbar' : src.type;
    return { tajuk, sub, jenis, label: (ch.data.labels || []).map(String),
      siri: ch.data.datasets.map((d, i) => ({ nama: d.label || `Siri ${i + 1}`, data: d.data.slice() })), config: src };
  }
  function pasangButang(host, onClick, label) {
    if (host.dataset.ppdcOk) return;
    host.dataset.ppdcOk = '1';
    const slot = host.querySelector('[data-carta-slot]');
    if (!slot && getComputedStyle(host).position === 'static') host.classList.add('ppdc-host');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ppdc-btn' + (slot ? ' ppdc-inline' : '');
    b.setAttribute('aria-label', 'Besarkan carta: ' + label);
    b.innerHTML = ICON + '<span>Besarkan</span>';
    b.addEventListener('click', e => { e.stopPropagation(); onClick(); });
    (slot || host).appendChild(b);
  }
  function imbas() {
    gaya();
    if (window.Chart) document.querySelectorAll('canvas').forEach(cv => {
      if (cv.closest('.ppdc-ov')) return;
      const ch = Chart.getChart(cv);
      if (!ch || !cv.parentElement) return;
      pasangButang(cv.parentElement, () => {
        const kini = Chart.getChart(cv);
        if (!kini) return;
        const h = ikutId(cv.id), sp = specDariChart(kini, cv);
        if (h && h.tajuk) sp.tajuk = h.tajuk;
        buka(sp, h);
      }, tajukDekat(cv).tajuk);
    });
    document.querySelectorAll('[data-carta]').forEach(el => {
      let spec; try { spec = JSON.parse(el.dataset.carta); } catch { return; }
      pasangButang(el, () => { try { const s = JSON.parse(el.dataset.carta); buka(s, ikutId(s.id)); } catch {} }, spec.tajuk);
    });
  }
  let t = null;
  const jadual = () => { clearTimeout(t); t = setTimeout(imbas, 120); };
  function mula() {
    imbas();
    new MutationObserver(jadual).observe(document.body, { childList: true, subtree: true });
    setInterval(imbas, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mula); else mula();
  window.PPDCarta = { buka, imbas, HURAIAN };
})();
