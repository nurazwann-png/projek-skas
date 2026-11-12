/* Pembantu AI Portal PPD Dalat: butang terapung + panel perbualan.
   Soalan dihantar ke /api/ai/pembantu; AI membaca data portal melalui alat di pelayan (mengikut skop peranan pengguna).
   Tindakan yang dicadangkan AI (peringatan pengisian markah) hanya dilaksanakan selepas pengguna menekan "Hantar". */
(function () {
  if (window.PPDPembantu || !window.PPDAuth || !PPDAuth.session()) return;
  const esc = PPDAuth.esc;
  const css = document.createElement('style');
  css.textContent = `
.pb-btn{position:fixed;right:max(18px,env(safe-area-inset-right,0px));bottom:max(18px,env(safe-area-inset-bottom,0px));z-index:900;display:inline-flex;align-items:center;gap:9px;height:50px;padding:0 18px 0 14px;border:0;border-radius:999px;cursor:pointer;color:#fff;font:700 13.5px/1 'Public Sans',system-ui,sans-serif;background:linear-gradient(135deg,#13406e,#0b2a4a);box-shadow:0 10px 28px rgba(7,28,51,.35),inset 0 0 0 1px rgba(229,192,102,.55);transition:transform .18s}
.pb-btn:hover{transform:translateY(-2px)}
.pb-btn:focus-visible,.pb-x:focus-visible,.pb-hantar:focus-visible{outline:3px solid #c8962a;outline-offset:2px}
.pb-btn svg{width:20px;height:20px;fill:none;stroke:#f3d68a;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.pb-panel{position:fixed;right:max(18px,env(safe-area-inset-right,0px));bottom:max(18px,env(safe-area-inset-bottom,0px));z-index:901;width:min(420px,calc(100vw - 24px));height:min(620px,calc(100dvh - 36px));display:flex;flex-direction:column;background:#fff;border:1px solid #dde3eb;border-radius:18px;box-shadow:0 28px 70px rgba(2,12,27,.38);overflow:hidden;font:14px/1.55 'Public Sans',system-ui,sans-serif;color:#1a2433}
.pb-kepala{display:flex;align-items:center;gap:10px;padding:14px 16px;color:#fff;background:radial-gradient(90% 140% at 100% 0%,rgba(229,192,102,.25),transparent 60%),linear-gradient(150deg,#0b2a4a,#071c33)}
.pb-kepala b{display:block;font-size:14.5px}.pb-kepala small{display:block;font-size:11.5px;color:#c3d0df}
.pb-x{margin-left:auto;width:34px;height:34px;border:0;border-radius:10px;background:rgba(255,255,255,.12);color:#fff;cursor:pointer;font-size:18px;line-height:1}
.pb-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f6f8fb}
.pb-m{max-width:88%;padding:10px 13px;border-radius:14px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:13.5px}
.pb-m.saya{align-self:flex-end;background:#13406e;color:#fff;border-bottom-right-radius:4px}
.pb-m.ai{align-self:flex-start;background:#fff;border:1px solid #dde3eb;border-bottom-left-radius:4px}
.pb-m.ralat{align-self:flex-start;background:#fdecea;color:#8a1c12;border:1px solid #f3c2bc}
.pb-fikir{align-self:flex-start;color:#6b7686;font-size:12.5px;padding:4px 6px}
.pb-cadang{align-self:stretch;background:#fbf3e1;border:1px solid #ecd9a6;border-radius:14px;padding:12px 13px;font-size:13px}
.pb-cadang b{display:block;margin-bottom:6px}.pb-cadang ul{margin:0 0 10px 18px;padding:0}.pb-cadang li{margin:2px 0}
.pb-cadang button{border:0;border-radius:8px;padding:8px 14px;font:700 12.5px/1 inherit;cursor:pointer;margin-right:8px}
.pb-ya{background:#0b2a4a;color:#fff}.pb-tak{background:#fff;color:#475467;box-shadow:inset 0 0 0 1px #dde3eb}
.pb-cth{display:flex;flex-wrap:wrap;gap:6px}
.pb-cth button{border:1px solid #dde3eb;background:#fff;border-radius:999px;padding:7px 12px;font:600 12.5px/1.2 inherit;color:#13406e;cursor:pointer;text-align:left}
.pb-cth button:hover{border-color:#13406e;background:#e6eef7}
.pb-borang{display:flex;gap:8px;padding:12px;border-top:1px solid #dde3eb;background:#fff}
.pb-borang textarea{flex:1;min-height:44px;max-height:120px;resize:none;border:1px solid #dde3eb;border-radius:12px;padding:10px 12px;font:inherit;font-size:16px;color:inherit}
.pb-borang textarea:focus{outline:2px solid #c8962a;border-color:#c8962a}
.pb-hantar{width:46px;border:0;border-radius:12px;background:#0b2a4a;color:#fff;cursor:pointer}.pb-hantar:disabled{opacity:.5;cursor:default}
.pb-hantar svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.pb-nota{font-size:11px;color:#6b7686;padding:0 14px 10px;background:#fff}
@media (max-width:560px){.pb-btn span{display:none}.pb-btn{width:50px;padding:0;justify-content:center}}
@media (prefers-reduced-motion:reduce){.pb-btn{transition:none}.pb-btn:hover{transform:none}}`;
  document.head.appendChild(css);

  const IKON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>';
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'pb-btn'; btn.setAttribute('aria-haspopup', 'dialog');
  btn.innerHTML = IKON + '<span>Tanya Pembantu</span>';
  btn.setAttribute('aria-label', 'Buka Pembantu AI');
  document.body.appendChild(btn);

  let panel = null, sibuk = false;
  const perbualan = []; // {role, content}
  const CONTOH = ['Kelas mana yang belum lengkap isi markah Percubaan?', 'Ringkaskan prestasi SPM setiap sekolah', 'Aduan fasiliti mana yang paling lama terbuka?', 'Sediakan draf laporan ringkas untuk mesyuarat minggu ini'];

  function tambah(html, kelas) {
    const log = panel.querySelector('.pb-log');
    const d = document.createElement('div');
    d.className = kelas; d.innerHTML = html;
    log.appendChild(d); log.scrollTop = log.scrollHeight;
    return d;
  }
  function paparCadangan(senarai) {
    const d = tambah(`<b>Cadangan: hantar peringatan pengisian markah kepada ${senarai.length} kelas</b>
      <ul>${senarai.map(c => `<li>${esc(c.label)} · ${c.belumDiisi} belum diisi</li>`).join('')}</ul>
      <button type="button" class="pb-ya">Hantar peringatan</button><button type="button" class="pb-tak">Batal</button>`, 'pb-cadang');
    d.querySelector('.pb-tak').onclick = () => { d.innerHTML = 'Cadangan dibatalkan. Tiada peringatan dihantar.'; };
    d.querySelector('.pb-ya').onclick = async () => {
      d.querySelectorAll('button').forEach(b => { b.disabled = true; });
      try {
        const res = await fetch('/api/ai/pembantu/laksana', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kelasIds: senarai.map(c => c.kelasId) }) });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.ralat || 'Gagal menghantar peringatan.');
        d.innerHTML = `<b>Peringatan dihantar kepada ${j.dihantar.length} kelas.</b>Guru akan melihatnya dalam Tugasan Saya dan dalam Analitik SPM.`;
        if (window.PPDSegerak) PPDSegerak.muat(); // segarkan salinan tempatan
      } catch (e) { d.innerHTML = esc(e.message); d.className = 'pb-m ralat'; }
    };
  }
  async function hantar(teks) {
    teks = teks.trim();
    if (!teks || sibuk) return;
    sibuk = true;
    const cth = panel.querySelector('.pb-cth'); if (cth) cth.remove();
    const ta = panel.querySelector('textarea'), bh = panel.querySelector('.pb-hantar');
    ta.value = ''; bh.disabled = true;
    perbualan.push({ role: 'user', content: teks });
    tambah(esc(teks), 'pb-m saya');
    const f = tambah('Pembantu sedang menyemak data…', 'pb-fikir');
    try {
      const res = await fetch('/api/ai/pembantu', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mesej: perbualan }) });
      const j = await res.json().catch(() => ({}));
      f.remove();
      if (!res.ok) throw new Error(j.ralat || 'Pembantu tidak dapat dihubungi.');
      perbualan.push({ role: 'assistant', content: j.jawapan });
      tambah(esc(j.jawapan), 'pb-m ai');
      if (j.cadangan && j.cadangan.length) paparCadangan(j.cadangan);
    } catch (e) {
      f.remove(); perbualan.pop();
      tambah(esc(e.message || 'Ralat tidak dijangka.'), 'pb-m ralat');
    }
    sibuk = false; bh.disabled = false; ta.focus();
  }
  function buka() {
    if (panel) { panel.hidden = false; btn.hidden = true; panel.querySelector('textarea').focus(); return; }
    panel = document.createElement('div');
    panel.className = 'pb-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Pembantu AI');
    panel.innerHTML = `<div class="pb-kepala">${IKON.replace('<svg', '<svg style="width:22px;height:22px;fill:none;stroke:#f3d68a;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"')}
        <div><b>Pembantu Portal</b><small>Menjawab daripada data portal mengikut peranan anda</small></div>
        <button type="button" class="pb-x" aria-label="Tutup pembantu">×</button></div>
      <div class="pb-log" aria-live="polite">
        <div class="pb-m ai">Saya boleh menyemak pengisian markah, prestasi SPM, rekod SK@S dan aduan fasiliti, serta menyediakan draf ringkasan. Apa yang anda ingin tahu?</div>
        <div class="pb-cth">${CONTOH.map(c => `<button type="button">${esc(c)}</button>`).join('')}</div>
      </div>
      <form class="pb-borang"><textarea rows="1" placeholder="Taip soalan anda…" aria-label="Soalan kepada pembantu"></textarea>
        <button class="pb-hantar" type="submit" aria-label="Hantar soalan"><svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></button></form>
      <div class="pb-nota">Jawapan dijana oleh AI dan mungkin tersilap. Semak angka penting dalam aplikasi berkenaan.</div>`;
    document.body.appendChild(panel);
    btn.hidden = true;
    const ta = panel.querySelector('textarea');
    panel.querySelector('.pb-x').onclick = tutup;
    panel.querySelector('form').onsubmit = e => { e.preventDefault(); hantar(ta.value); };
    ta.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); hantar(ta.value); } else if (e.key === 'Escape') tutup(); };
    panel.querySelectorAll('.pb-cth button').forEach(b => { b.onclick = () => hantar(b.textContent); });
    ta.focus();
  }
  function tutup() { if (panel) panel.hidden = true; btn.hidden = false; btn.focus(); }
  btn.onclick = buka;
  window.PPDPembantu = { buka, tutup };
})();
