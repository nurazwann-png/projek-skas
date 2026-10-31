/* Urus Peranan dalam aplikasi — Admin app: Pentadbir Sekolah app itu sahaja; Superadmin: Admin + Pentadbir Sekolah */
(function () {
  const A = window.PPDAuth;
  const app = document.currentScript && document.currentScript.dataset.app;
  if (!A || !A.APPS[app]) return;

  const ICON = '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  const appLbl = A.APPS[app].label;

  function ctx() {
    const s = A.session();
    const me = s && A.findById(s.uid);
    return { s, me, roles: me ? A.assignableRoles(me, s.level, app) : [] };
  }

  function init() {
    const { s, roles } = ctx();
    const strip = document.querySelector('.ppd-strip-r');
    if (!strip || !roles.length) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ppdr-btn';
    btn.innerHTML = ICON + '<b>Urus Peranan</b>';
    btn.title = s.level === 'superadmin' ? `Tetapkan Admin & Pentadbir Sekolah ${appLbl}` : `Tetapkan Pentadbir Sekolah ${appLbl}`;
    strip.prepend(btn);

    const ov = document.createElement('div');
    ov.className = 'ppdr-ov';
    ov.hidden = true;
    ov.innerHTML = `<div class="ppdr-box" role="dialog" aria-modal="true" aria-labelledby="ppdr-t">
      <div class="ppdr-head">
        <div>
          <div class="ppdr-k">${A.esc(appLbl)}</div>
          <div class="ppdr-t" id="ppdr-t">Urus Peranan</div>
          <div class="ppdr-sub" id="ppdr-sub"></div>
        </div>
        <button type="button" class="ppdr-x" aria-label="Tutup"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <div class="ppdr-tabs" role="tablist">
        <button type="button" class="ppdr-tab on" data-tab="pengguna" role="tab" aria-selected="true">Pengguna</button>
        <button type="button" class="ppdr-tab" data-tab="sejarah" role="tab" aria-selected="false">Sejarah perubahan</button>
      </div>
      <input class="ppdr-cari" type="search" placeholder="Cari nama, emel atau sekolah">
      <div class="ppdr-list"></div>
      <div class="ppdr-sejarah aud-list" hidden></div>
      <div class="ppdr-foot" id="ppdr-foot"></div>
    </div>
    <div class="ppdr-toast" hidden></div>`;
    document.body.appendChild(ov);

    const $ = sel => ov.querySelector(sel);
    const cari = $('.ppdr-cari'), list = $('.ppdr-list'), sejarah = $('.ppdr-sejarah'), toastEl = $('.ppdr-toast');
    const ROLE_APP = ['admin_' + app, 'sekolah_' + app];
    ov.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
      ov.querySelectorAll('[data-tab]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); });
      const sej = b.dataset.tab === 'sejarah';
      list.hidden = cari.hidden = sej;
      sejarah.hidden = !sej;
      if (sej) sejarah.innerHTML = A.auditHTML(A.auditLog().filter(e => ROLE_APP.includes(e.role)));
    }));
    let tt;

    function toast(m) {
      toastEl.textContent = m;
      toastEl.hidden = false;
      clearTimeout(tt);
      tt = setTimeout(() => { toastEl.hidden = true; }, 2400);
    }

    function render() {
      const { s, me, roles } = ctx();
      if (!roles.length) { close(); btn.remove(); return; }
      const sup = s.level === 'superadmin';
      $('#ppdr-sub').textContent = sup
        ? `Sebagai Superadmin, anda boleh menetapkan Admin dan Pentadbir Sekolah bagi ${appLbl}.`
        : `Sebagai Admin ${appLbl}, anda boleh menetapkan Pentadbir Sekolah bagi ${appLbl} sahaja.`;
      $('#ppdr-foot').innerHTML = sup
        ? 'Peranan bagi semua aplikasi diurus di <a href="ppd-dalat.html">Portal PPD Dalat</a> → Urus Pengguna.'
        : 'Peranan Admin hanya boleh ditetapkan oleh Superadmin.';

      const q = cari.value.trim().toLowerCase();
      const rows = A.users()
        .filter(u => !q || [u.nama, u.emel, u.org].some(v => String(v || '').toLowerCase().includes(q)))
        .sort((a, b) => roles.filter(r => b.roles.includes(r)).length - roles.filter(r => a.roles.includes(r)).length || a.nama.localeCompare(b.nama));

      list.innerHTML = rows.length ? rows.map(u => {
        const isMe = u.id === me.id;
        const top = A.levelsFor(u).slice(-1)[0];
        const tgs = roles.map(r => {
          const on = u.roles.includes(r);
          const ok = A.canAssign(me, s.level, r, u);
          const lv = A.ROLES[r].level;
          return `<button type="button" class="ppdr-tg" aria-pressed="${on}" data-uid="${A.esc(u.id)}" data-role="${r}" style="--lv:${A.LEVELS[lv].color}"${ok ? '' : ' disabled title="Anda tidak boleh menukar peranan sendiri"'}>
            <span class="ppdr-chk"></span>${lv === 'admin' ? 'Admin' : 'Pentadbir Sekolah'}</button>`;
        }).join('');
        return `<div class="ppdr-row">
          <span class="ppdr-av" style="background:${A.LEVELS[top].color}">${A.esc(A.initials(u.nama))}</span>
          <div class="ppdr-who"><div class="ppdr-n">${A.esc(u.nama)}${isMe ? ' <em>Anda</em>' : ''}</div><div class="ppdr-e">${A.esc(u.emel)} · ${A.esc(u.org || '—')}</div></div>
          <div class="ppdr-tgs">${tgs}</div>
        </div>`;
      }).join('') : '<div class="ppdr-empty">Tiada pengguna sepadan</div>';
    }

    function open(q) {
      cari.value = typeof q === 'string' ? q : '';
      ov.querySelector('[data-tab="pengguna"]').click();
      render(); ov.hidden = false; cari.focus();
    }
    window.PPDRoles = { open };
    function close() { ov.hidden = true; }

    btn.addEventListener('click', () => open());
    $('.ppdr-x').addEventListener('click', close);
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !ov.hidden) close(); });
    cari.addEventListener('input', render);
    list.addEventListener('click', e => {
      const tg = e.target.closest('.ppdr-tg');
      if (!tg || tg.disabled) return;
      const res = A.toggleRole(tg.dataset.uid, tg.dataset.role);
      if (!res.ok) { toast('Anda tiada kebenaran untuk menukar peranan ini.'); render(); return; }
      render();
      toast(`${A.ROLES[tg.dataset.role].label} ${res.on ? 'diberikan kepada' : 'ditarik daripada'} ${res.user.nama}`);
      window.dispatchEvent(new CustomEvent('ppd-peranan-berubah', { detail: res }));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
