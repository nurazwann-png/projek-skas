/* Pengesahan & peranan pengguna Portal PPD Dalat — prototaip (localStorage, tiada backend) */
(function () {
  const USERS_KEY = 'ppd_users';
  const SESSION_KEY = 'ppd_sesi';

  const APPS = {
    skas:      { label: 'SK@S',       url: 'skas-preview.html' },
    spm:       { label: 'SPM',        url: 'spm-analytics.html' },
    efasiliti: { label: 'e-Fasiliti', url: 'e-fasiliti.html' },
  };

  const ROLES = {
    superadmin:        { label: 'Superadmin',                    level: 'superadmin' },
    admin_skas:        { label: 'Admin SK@S',                    level: 'admin',   app: 'skas' },
    admin_spm:         { label: 'Admin SPM',                     level: 'admin',   app: 'spm' },
    admin_efasiliti:   { label: 'Admin e-Fasiliti',              level: 'admin',   app: 'efasiliti' },
    sekolah_skas:      { label: 'Pentadbir Sekolah SK@S',        level: 'sekolah', app: 'skas' },
    sekolah_spm:       { label: 'Pentadbir Sekolah SPM',         level: 'sekolah', app: 'spm' },
    sekolah_efasiliti: { label: 'Pentadbir Sekolah e-Fasiliti',  level: 'sekolah', app: 'efasiliti' },
  };

  const LEVELS = {
    pengguna:   { label: 'Pengguna Biasa',    color: '#067647', appRole: 'teacher' },
    sekolah:    { label: 'Pentadbir Sekolah', color: '#6941c6', appRole: 'school_admin' },
    admin:      { label: 'Admin',             color: '#13406e', appRole: 'ppd_admin' },
    superadmin: { label: 'Superadmin',        color: '#a16207', appRole: 'ppd_admin' },
  };
  const LEVEL_ORDER = ['pengguna', 'sekolah', 'admin', 'superadmin'];

  const DEFAULT_USERS = [
    { id: 'u_norliza', nama: 'NORLIZA BINTI AHMAD',   emel: 'norliza.ahmad@moe.gov.my',    kodSekolah: 'PPDDLT',  roles: ['superadmin'] },
    { id: 'u_azlan',   nama: 'AZLAN BIN HAMID',       emel: 'azlan.hamid@moe.gov.my',      kodSekolah: 'PPDDLT',  roles: ['admin_skas', 'admin_spm', 'admin_efasiliti'] },
    { id: 'u_razif',   nama: 'RAZIF BIN OTHMAN',      emel: 'razif.othman@moe-dl.edu.my',  kodSekolah: 'YEA6101', roles: ['sekolah_skas', 'sekolah_spm', 'sekolah_efasiliti'] },
    { id: 'u_salmah',  nama: 'SALMAH BINTI JALIL',    emel: 'salmah.jalil@moe-dl.edu.my',  kodSekolah: 'YEA6102', roles: ['sekolah_efasiliti'] },
    { id: 'u_azman',   nama: 'AZMAN BIN HARUN',       emel: 'azman.harun@moe-dl.edu.my',   kodSekolah: 'YEA6101', roles: [] },
  ];

  // Senarai induk sekolah & pejabat — diselenggara oleh Superadmin. Kod sekolah menentukan sekolah pengguna.
  const ORG_KEY = 'ppd_organisasi';
  const LOKASI = ['Bandar', 'Luar Bandar', 'Pedalaman'];
  const JENIS_ORG = ['Sekolah', 'Pejabat'];
  const DEFAULT_ORG = [
    { kod: 'YEA6101', nama: 'SMK DALAT',       lokasi: 'Bandar',      jenis: 'Sekolah' },
    { kod: 'YEA6102', nama: 'SMK OYA',         lokasi: 'Luar Bandar', jenis: 'Sekolah' },
    { kod: 'YEA6103', nama: 'SMK BATANG IGAN', lokasi: 'Pedalaman',   jenis: 'Sekolah' },
    { kod: 'YEA6104', nama: 'SMK AGAMA IGAN',  lokasi: 'Luar Bandar', jenis: 'Sekolah' },
    { kod: 'PPDDLT',  nama: 'PPD DALAT',       lokasi: 'Bandar',      jenis: 'Pejabat' },
  ];
  // Domain emel rasmi yang dibenarkan mendaftar sendiri
  const DOMAIN_RASMI = ['moe.gov.my', 'moe-dl.edu.my'];

  function read(key) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  // Format seragam: nama orang & organisasi dalam HURUF BESAR, ruang tunggal
  function besar(v) { return String(v ?? '').replace(/\s+/g, ' ').trim().toLocaleUpperCase('ms-MY'); }
  const kodBesar = v => String(v ?? '').replace(/\s+/g, '').toUpperCase();

  function organisasi() {
    const list = read(ORG_KEY);
    return (Array.isArray(list) && list.length ? list : DEFAULT_ORG)
      .map(o => ({ kod: kodBesar(o.kod), nama: besar(o.nama), lokasi: LOKASI.includes(o.lokasi) ? o.lokasi : 'Bandar', jenis: JENIS_ORG.includes(o.jenis) ? o.jenis : 'Sekolah' }));
  }
  function orgByKod(kod) { const k = kodBesar(kod); return organisasi().find(o => o.kod === k) || null; }
  function saveOrganisasi(list) { write(ORG_KEY, list.map(o => ({ ...o, kod: kodBesar(o.kod), nama: besar(o.nama) }))); }

  // org (nama sekolah) sentiasa diambil daripada senarai induk melalui kod
  const seragam = u => {
    const o = u.kodSekolah ? orgByKod(u.kodSekolah) : null;
    return { ...u, nama: besar(u.nama), kodSekolah: o ? o.kod : kodBesar(u.kodSekolah), org: o ? o.nama : besar(u.org), roles: [...(u.roles || [])] };
  };

  function users() {
    const list = read(USERS_KEY);
    const base = Array.isArray(list) && list.length ? list : DEFAULT_USERS;
    // Akaun lama tanpa kod: padankan melalui nama organisasi
    return base.map(u => u.kodSekolah ? u : { ...u, kodSekolah: (organisasi().find(o => o.nama === besar(u.org)) || {}).kod || '' }).map(seragam);
  }
  function saveUsers(list) { write(USERS_KEY, list.map(seragam)); }

  // Pendaftaran kali pertama oleh pengguna sendiri
  function domainRasmi(emel) { return DOMAIN_RASMI.includes(normEmail(emel).split('@')[1] || ''); }
  function daftar({ emel, nama, kodSekolah }) {
    const e = normEmail(emel), n = besar(nama), o = orgByKod(kodSekolah);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { ok: false, medan: 'emel', msg: 'Format emel tidak sah.' };
    if (!domainRasmi(e)) return { ok: false, medan: 'emel', msg: `Hanya emel rasmi KPM (${DOMAIN_RASMI.map(d => '@' + d).join(' atau ')}) boleh mendaftar.` };
    if (findByEmail(e)) return { ok: false, medan: 'emel', msg: 'Emel ini sudah berdaftar. Sila log masuk.' };
    if (n.length < 3) return { ok: false, medan: 'nama', msg: 'Masukkan nama penuh seperti dalam rekod rasmi.' };
    if (!o) return { ok: false, medan: 'kod', msg: 'Pilih kod sekolah anda.' };
    const user = { id: 'u_' + Date.now().toString(36), nama: n, emel: e, kodSekolah: o.kod, roles: [] };
    saveUsers([...users(), user]);
    const r = login(e);
    logAudit({ tindakan: 'daftar-sendiri', sasaranId: user.id, sasaranNama: n, kodSekolah: o.kod });
    return r;
  }

  function normEmail(e) { return String(e || '').trim().toLowerCase(); }
  function findByEmail(emel) { const e = normEmail(emel); return users().find(u => normEmail(u.emel) === e) || null; }
  function findById(id) { return users().find(u => u.id === id) || null; }

  function levelsFor(u) {
    if (!u) return [];
    const has = new Set((u.roles || []).map(r => ROLES[r] && ROLES[r].level).filter(Boolean));
    return LEVEL_ORDER.filter(l => l === 'pengguna' || has.has(l));
  }
  function defaultLevel(u) {
    const lv = levelsFor(u);
    if (lv.includes('superadmin')) return 'superadmin';
    if (lv.includes('admin')) return 'admin';
    return 'pengguna';
  }
  function rolesAtLevel(u, level) {
    return (u.roles || []).filter(r => ROLES[r] && ROLES[r].level === level);
  }
  // Peranan yang dihantar ke aplikasi (?role=) bagi tahap aktif
  function appRoleFor(u, level, app) {
    if (level === 'superadmin' && (u.roles || []).includes('superadmin')) return 'ppd_admin';
    if (level === 'admin' && (u.roles || []).includes('admin_' + app)) return 'ppd_admin';
    if (level === 'sekolah' && (u.roles || []).includes('sekolah_' + app)) return 'school_admin';
    return 'teacher';
  }

  // Superadmin: Admin + Pentadbir Sekolah semua aplikasi. Admin X: Pentadbir Sekolah X sahaja.
  function assignableRoles(u, level, app) {
    if (!u) return [];
    const has = r => (u.roles || []).includes(r);
    const apps = app ? [app] : Object.keys(APPS);
    if (level === 'superadmin' && has('superadmin')) {
      return [...apps.map(a => 'admin_' + a), ...apps.map(a => 'sekolah_' + a), ...(app ? [] : ['superadmin'])];
    }
    if (level === 'admin') return apps.filter(a => has('admin_' + a)).map(a => 'sekolah_' + a);
    return [];
  }
  function canAssign(u, level, role, target) {
    if (!assignableRoles(u, level).includes(role)) return false;
    if (target && target.id === u.id && level !== 'superadmin') return false;
    return true;
  }
  function toggleRole(targetId, role) {
    const s = session();
    const me = s && findById(s.uid);
    const list = users();
    const t = list.find(x => x.id === targetId);
    if (!me || !t || !canAssign(me, s.level, role, t)) return { ok: false };
    if (role === 'superadmin' && t.roles.includes('superadmin') &&
        (t.id === me.id || list.filter(x => x.roles.includes('superadmin')).length <= 1)) return { ok: false };
    const on = !t.roles.includes(role);
    t.roles = on ? [...t.roles, role] : t.roles.filter(r => r !== role);
    saveUsers(list);
    logAudit({ tindakan: on ? 'beri' : 'tarik', role, sasaranId: t.id, sasaranNama: t.nama });
    return { ok: true, on, user: t };
  }

  // Log audit: setiap perubahan peranan / akaun direkod (siapa, apa, bila, dari mana)
  const AUDIT_KEY = 'ppd_audit';
  function auditLog() { return read(AUDIT_KEY) || []; }
  function logAudit(e) {
    const s = session();
    const me = s && findById(s.uid);
    const tempat = (location.pathname.split('/').pop() || '').replace('.html', '');
    write(AUDIT_KEY, [{ t: Date.now(), olehId: me ? me.id : null, olehNama: me ? me.nama : '—', olehTahap: s ? s.level : null, tempat, ...e }, ...auditLog()].slice(0, 500));
  }
  const TEMPAT = { 'ppd-dalat': 'Portal', 'skas-preview': 'SK@S', 'spm-analytics': 'SPM', 'e-fasiliti': 'e-Fasiliti' };
  function auditHTML(list) {
    if (!list.length) return '<div class="aud-kosong">Tiada perubahan direkodkan lagi.</div>';
    return list.map(e => {
      const lbl = e.role && ROLES[e.role] ? ROLES[e.role].label : '';
      const ayat = {
        beri: `memberi <b>${esc(lbl)}</b> kepada <b>${esc(e.sasaranNama)}</b>`,
        tarik: `menarik <b>${esc(lbl)}</b> daripada <b>${esc(e.sasaranNama)}</b>`,
        daftar: `mendaftar pengguna <b>${esc(e.sasaranNama)}</b>`,
        'daftar-sendiri': `mendaftar akaun sendiri${e.kodSekolah ? ` di <b>${esc(e.kodSekolah)}</b>` : ''}`,
        'sekolah-tambah': `menambah <b>${esc(e.sasaranNama)}</b> ke senarai sekolah`,
        'sekolah-ubah': `mengemas kini maklumat <b>${esc(e.sasaranNama)}</b>`,
        'sekolah-padam': `memadam <b>${esc(e.sasaranNama)}</b> daripada senarai sekolah`,
        padam: `memadam akaun <b>${esc(e.sasaranNama)}</b>`,
      }[e.tindakan] || esc(e.tindakan);
      const masa = new Date(e.t).toLocaleString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      return `<div class="aud-row aud-${e.tindakan}"><span class="aud-dot"></span><div><div class="aud-t">${esc(e.olehNama)} ${ayat}</div>
        <div class="aud-m">${masa} · melalui ${TEMPAT[e.tempat] || esc(e.tempat)}${e.olehTahap && LEVELS[e.olehTahap] ? ' · sebagai ' + LEVELS[e.olehTahap].label : ''}</div></div></div>`;
    }).join('');
  }

  function session() {
    const s = read(SESSION_KEY);
    if (!s || !s.uid) return null;
    const u = findById(s.uid);
    if (!u) return null;
    const lv = levelsFor(u);
    return { uid: u.id, level: lv.includes(s.level) ? s.level : defaultLevel(u), t: s.t };
  }
  function currentUser() { const s = session(); return s ? findById(s.uid) : null; }

  function login(emel) {
    const u = findByEmail(emel);
    if (!u) return { ok: false };
    const level = defaultLevel(u);
    write(SESSION_KEY, { uid: u.id, level, t: Date.now() });
    try { localStorage.removeItem('ppd_dalat_user'); } catch {}
    return { ok: true, user: u, level };
  }
  function setLevel(level) {
    const s = session();
    if (!s) return;
    const u = findById(s.uid);
    if (!levelsFor(u).includes(level)) return;
    write(SESSION_KEY, { ...s, level });
  }
  function logout() {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
    location.replace('welcome.html');
  }

  function safeNext(v) {
    return /^[a-z0-9-]+\.html(\?[\w=&-]*)?$/i.test(v || '') ? v : null;
  }
  // Panggil di <head>: tiada sesi → ke halaman log masuk
  function guard() {
    if (session()) return true;
    const here = location.pathname.split('/').pop() + location.search;
    const next = safeNext(here) && !here.startsWith('ppd-dalat.html') ? '?next=' + encodeURIComponent(here) : '';
    location.replace('welcome.html' + next);
    return false;
  }

  function initials(nama) {
    const skip = new Set(['bin', 'binti', 'bt', 'b', 'a/l', 'a/p', 'cikgu', 'encik', 'puan', 'dr', 'hj', 'hjh']);
    const parts = String(nama || '').split(/\s+/).filter(w => w && !skip.has(w.toLowerCase().replace(/\.$/, '')));
    return ((parts[0] || '?')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  }
  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  window.PPDAuth = {
    APPS, ROLES, LEVELS, LEVEL_ORDER,
    users, saveUsers, findByEmail, findById, normEmail, besar,
    organisasi, orgByKod, saveOrganisasi, LOKASI, JENIS_ORG, DOMAIN_RASMI, domainRasmi, daftar,
    levelsFor, defaultLevel, rolesAtLevel, appRoleFor,
    assignableRoles, canAssign, toggleRole, auditLog, logAudit, auditHTML,
    session, currentUser, login, setLevel, logout, guard, safeNext,
    initials, esc,
  };
})();
