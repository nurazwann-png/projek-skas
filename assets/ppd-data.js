/* Stor data kongsi Portal PPD Dalat — prototaip (localStorage). Semua aplikasi & dashboard membaca dari sini. */
(function () {
  const K = { kelas: 'skas_kelas', marks: 'skas_marks', skas: 'ppd_skas_rekod', tiket: 'ppd_efasiliti_tiket', ingat: 'ppd_peringatan', seed: 'ppd_data_v' };
  const VERSI = 7;

  const SEED_SEKOLAH = [
    { id: 'smk-dalat',       nama: 'SMK DALAT',       kod: 'YEA6101', zon: 'Zon 1', lokasi: 'Bandar',      x: 52, y: 40 },
    { id: 'smk-oya',         nama: 'SMK OYA',         kod: 'YEA6102', zon: 'Zon 2', lokasi: 'Luar Bandar', x: 22, y: 26 },
    { id: 'smk-batang-igan', nama: 'SMK BATANG IGAN', kod: 'YEA6103', zon: 'Zon 3', lokasi: 'Pedalaman',   x: 78, y: 60 },
    { id: 'smk-agama-igan',  nama: 'SMK AGAMA IGAN',  kod: 'YEA6104', zon: 'Zon 2', lokasi: 'Luar Bandar', x: 26, y: 80 },
  ];
  const UJIAN = [
    { key: 'ar1',       label: 'AR1',       full: 'Ujian Pertengahan Tahun' },
    { key: 'ar2',       label: 'AR2',       full: 'Ujian Akhir Tahun' },
    { key: 'percubaan', label: 'Percubaan', full: 'Percubaan SPM' },
  ];
  const PEPERIKSAAN_SEMASA = { key: 'percubaan', label: 'Percubaan SPM 2026', buka: '2026-10-28', tarikhAkhir: '2026-11-13' };

  const besar = v => String(v ?? '').replace(/\s+/g, ' ').trim().toLocaleUpperCase('ms-MY');

  // Senarai sekolah semasa = senarai induk (jenis Sekolah) + zon/kedudukan peta daripada data benih jika ada
  function sekolahList() {
    const A = window.PPDAuth;
    const induk = A ? A.organisasi().filter(o => o.jenis === 'Sekolah') : SEED_SEKOLAH;
    return induk.map((o, i) => {
      const b = SEED_SEKOLAH.find(x => x.kod === o.kod);
      const h = [...o.kod].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
      return { id: b ? b.id : o.kod, kod: o.kod, nama: besar(o.nama), lokasi: o.lokasi || (b && b.lokasi) || 'Bandar',
        zon: b ? b.zon : 'Zon ' + (1 + (h % 3)), x: b ? b.x : 14 + (h % 70), y: b ? b.y : 22 + ((h >> 7) % 62) };
    });
  }
  const namaIkutKod = kod => { const s = kod && sekolahList().find(x => x.kod === kod); return s ? s.nama : null; };
  const kodIkutNama = nama => { const s = SEED_SEKOLAH.find(x => besar(x.nama) === besar(nama)) || sekolahList().find(x => x.nama === besar(nama)); return s ? s.kod : ''; };
  // Format seragam: nama murid, guru, sekolah & kelas dalam HURUF BESAR
  const seragamKelas = k => ({ ...k, kodSekolah: k.kodSekolah || kodIkutNama(k.sekolah),
    sekolah: namaIkutKod(k.kodSekolah || kodIkutNama(k.sekolah)) || besar(k.sekolah), guru: besar(k.guru), kelas: besar(k.kelas),
    pelajar: (k.pelajar || []).map(p => ({ ...p, nama: besar(p.nama) })) });
  const seragamTiket = t => ({ ...t, kodSekolah: t.kodSekolah || kodIkutNama(t.sekolah),
    sekolah: namaIkutKod(t.kodSekolah || kodIkutNama(t.sekolah)) || besar(t.sekolah),
    timeline: (t.timeline || []).map(x => ({ ...x, oleh: besar(x.oleh) })) });

  function read(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }

  /* ── Penjana data contoh (deterministik) ── */
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const NAMA = {
    lM: ['Ahmad', 'Muhammad Haziq', 'Awang Faizal', 'Abang Zulkarnain', 'Mohd Syahmi', 'Amirul', 'Danial', 'Hairul', 'Iskandar', 'Jelani', 'Rizal', 'Firdaus', 'Aiman', 'Hakim', 'Zulhilmi', 'Shahrul'],
    pM: ['Nur Aisyah', 'Siti Nurhaliza', 'Dayang Nabilah', 'Nur Syafiqah', 'Farhana', 'Aina Maisarah', 'Saripah', 'Nurul Izzah', 'Fatin', 'Qistina', 'Hidayah', 'Amirah', 'Syuhada', 'Najwa', 'Balqis', 'Liyana'],
    bapa: ['Abdullah', 'Jamil', 'Morshidi', 'Sulaiman', 'Hamdan', 'Rosli', 'Bujang', 'Ismail', 'Hassan', 'Zakaria', 'Dollah', 'Sahari', 'Mahmud', 'Osman'],
    lI: ['Jimbun', 'Ricky', 'Melvin', 'Gerald', 'Nyandang', 'Juing'], pI: ['Dayang', 'Melissa', 'Rosalind', 'Nancy', 'Lidia', 'Sindai'],
    bapaI: ['Gerang', 'Nyipa', 'Entali', 'Jugah', 'Ugak', 'Saling'],
    cina: ['Wong', 'Lim', 'Tiong', 'Ling', 'Lau', 'Ting'], given: ['Kah Hui', 'Mei Ling', 'Siew Ching', 'Wei Jie', 'Jia Hao', 'Pei Shan', 'Zi Xuan', 'Yong Sheng'],
  };
  function namaMurid(r) {
    const pick = a => a[Math.floor(r() * a.length)];
    const L = r() < 0.5, x = r();
    if (x < 0.7) return { nama: `${pick(L ? NAMA.lM : NAMA.pM)} ${L ? 'bin' : 'binti'} ${pick(NAMA.bapa)}`, jantina: L ? 'Lelaki' : 'Perempuan', agama: 'Islam' };
    if (x < 0.85) return { nama: `${pick(L ? NAMA.lI : NAMA.pI)} anak ${pick(NAMA.bapaI)}`, jantina: L ? 'Lelaki' : 'Perempuan', agama: 'Kristian' };
    return { nama: `${pick(NAMA.cina)} ${pick(NAMA.given)}`, jantina: L ? 'Lelaki' : 'Perempuan', agama: r() < 0.75 ? 'Buddha' : 'Kristian' };
  }
  const SUBJEK = [
    { s: 'Matematik', kod: 'mt', adj: -3 }, { s: 'Bahasa Melayu', kod: 'bm', adj: 6 }, { s: 'Bahasa Inggeris', kod: 'bi', adj: -5 },
    { s: 'Sains', kod: 'sn', adj: -1 }, { s: 'Sejarah', kod: 'sj', adj: 2 },
  ];
  const GURU = {
    'smk-dalat':       [['Azman bin Harun', 'u_azman'], ['Rodzi bin Masduki'], ['Salmah binti Idris'], ['Johari bin Taib'], ['Asma binti Rashid']],
    'smk-oya':         [['Rokiah binti Sulaiman'], ['Faizal bin Nordin'], ['Hasimah binti Daud'], ['Azmi bin Saad'], ['Norhayati binti Ali']],
    'smk-batang-igan': [['Jonathan anak Ugak'], ['Mazlan bin Bujang'], ['Ling Siew Ping'], ['Zuraidah binti Morshidi'], ['Awang Hipni bin Sahari']],
    'smk-agama-igan':  [['Ustaz Hafiz bin Jamil'], ['Ustazah Rahmah binti Osman'], ['Khairul bin Zakaria'], ['Nurul Huda binti Hassan'], ['Sabariah binti Dollah']],
  };
  const PROFIL = {
    'smk-dalat':       { base: 66, tren: 1,  ses: [0.38, 0.78], asrama: 0.25 },
    'smk-oya':         { base: 61, tren: 0,  ses: [0.6, 0.92],  asrama: 0.4 },
    'smk-batang-igan': { base: 56, tren: -2, ses: [0.8, 0.98],  asrama: 0.7 },
    'smk-agama-igan':  { base: 63, tren: 1,  ses: [0.5, 0.88],  asrama: 0.85 },
  };
  const NAMA_KELAS = ['Amanah', 'Bestari'];
  // Bil. murid yang sudah diisi markah Percubaan (daripada 20) — ikut susunan kelas × subjek
  const ISI_PERC = {
    'smk-dalat':       [12, 20, 20, 9, 20,   0, 20, 15, 20, 20],
    'smk-oya':         [20, 20, 14, 20, 0,   20, 20, 20, 6, 20],
    'smk-batang-igan': [6, 0, 20, 11, 0,     20, 0, 14, 20, 8],
    'smk-agama-igan':  [20, 20, 20, 20, 20,  20, 17, 20, 20, 20],
  };

  // Setiap murid ada satu rekod per subjek (id = muridId-kodSubjek) supaya analisis LMS boleh gabung BM + Sejarah
  function janaSPM() {
    const r = rng(20261031);
    const kelas = [], marks = {};
    const c = v => Math.max(5, Math.min(99, Math.round(v)));
    let mid = 0;
    SEED_SEKOLAH.forEach(sk => {
      const pf = PROFIL[sk.id];
      let ci = 0;
      NAMA_KELAS.forEach(kn => {
        const roster = Array.from({ length: 20 }, () => {
          const m = namaMurid(r), x = r();
          const ses = x < pf.ses[0] ? 'B40' : x < pf.ses[1] ? 'M40' : 'T20';
          return { muridId: 'm' + (++mid), nama: m.nama, jantina: m.jantina, agama: m.agama, ses,
            lokasi: r() < 0.75 ? sk.lokasi : ['Bandar', 'Luar Bandar', 'Pedalaman'][Math.floor(r() * 3)],
            penginapan: r() < pf.asrama ? 'Asrama' : 'Harian',
            upaya: (r() - 0.5) * 26 + (ses === 'B40' ? -5 : ses === 'T20' ? 8 : 0) };
        });
        SUBJEK.forEach((sub, si) => {
          const g = GURU[sk.id][si];
          const isi = ISI_PERC[sk.id][ci++] ?? 20;
          const pelajar = roster.map((s, n) => {
            const id = `${s.muridId}-${sub.kod}`;
            const ar1 = c(pf.base + sub.adj + s.upaya + (r() - 0.5) * 12);
            const ar2 = c(ar1 + pf.tren + (r() - 0.5) * 12);
            marks[id] = { ar1, ar2 };
            if (n < isi) marks[id].percubaan = r() < 0.03 ? null : c(ar2 + pf.tren + (r() - 0.5) * 12);
            return { id, muridId: s.muridId, nama: s.nama, jantina: s.jantina, agama: s.agama, ses: s.ses, lokasi: s.lokasi, penginapan: s.penginapan };
          });
          kelas.push({ id: `${sk.id}-${kn.toLowerCase()}-${sub.kod}`, sekolah: sk.nama, kodSekolah: sk.kod, sekolahId: sk.id, subjek: sub.s,
            tingkatan: '5', kelas: kn, tahun: '2026', guru: g[0], guruId: g[1] || null, pelajar });
        });
      });
    });
    return { kelas, marks };
  }

  /* ── Rekod pencapaian SK@S (contoh untuk Azman) ── */
  const SKAS_REKOD_AZMAN = [
    { id: 'r1', program: 'Anugerah Hari Guru Peringkat Kebangsaan 2026 -- Guru Inovatif', level: 'NAT', peranan: 'Peserta', tarikh: '2026-05-16', tahap: 'T1', pengesahan: 'Sijil KPM rasmi', pautanEviden: 'https://drive.google.com/...', status: 'approved',
      draft: 'Guru telah menerima Anugerah Hari Guru Peringkat Kebangsaan 2026 (Guru Inovatif), pencapaian tertinggi pengiktirafan profesionalisme guru di peringkat kebangsaan yang dianjurkan oleh KPM.', tags: ['#Kebangsaan', '#5.4.1', '#AHG2026'] },
    { id: 'r2', program: 'SEAMEO-Japan ESD Award 2026', level: 'INT', peranan: 'Peserta', tarikh: '2026-09-10', tahap: 'T2', pengesahan: 'Sijil SEAMEO', pautanEviden: 'https://drive.google.com/...', status: 'approved',
      draft: 'Guru telah bersaing dalam SEAMEO-Japan Education for Sustainable Development (ESD) Award 2026 di peringkat Antarabangsa dan berjaya meraih Tempat Kedua.', tags: ['#Antarabangsa', '#5.4.1', '#SEAMEO'] },
    { id: 'r3', program: 'Anugerah Kualiti Guru PPD Dalat 2026', level: 'DAE', peranan: 'Peserta', tarikh: '2026-07-20', tahap: 'T1', pengesahan: 'Sijil PPD', pautanEviden: '', status: 'approved',
      draft: 'Guru telah menerima Anugerah Kualiti Guru PPD Dalat 2026, pengiktirafan rasmi atas kecemerlangan pengajaran dan pembelajaran di peringkat daerah.', tags: ['#Daerah', '#5.4.1'] },
    { id: 'r4', program: 'Kursus Jurulatih Bola Sepak Kebangsaan (Lesen C AFC) 2026', level: 'NAT', peranan: 'Jurulatih', tarikh: '2026-03-08', tahap: 'T1', pengesahan: 'Lesen C AFC -- FAM', pautanEviden: 'https://drive.google.com/...', status: 'pending',
      draft: 'Guru telah memperoleh pengiktirafan rasmi Lesen C AFC sebagai Jurulatih Bola Sepak bertauliah peringkat Kebangsaan.', tags: ['#Kebangsaan', '#5.4.1', '#Jurulatih'] },
    { id: 'r5', program: 'Pertandingan Penulisan Esei Guru Daerah Dalat 2026', level: 'DAE', peranan: 'Peserta', tarikh: '2026-09-18', tahap: 'T1', pengesahan: 'Sijil penyertaan PPD', pautanEviden: '', status: 'pending',
      draft: 'Guru telah menyertai Pertandingan Penulisan Esei Guru Daerah Dalat 2026 dan berjaya meraih tempat pertama.', tags: ['#Daerah', '#5.4.1'] },
    { id: 'r6', program: 'Pertandingan Catur Guru Peringkat Sekolah 2026', level: 'SKL', peranan: 'Peserta', tarikh: '2026-05-20', tahap: 'T1', pengesahan: 'Sijil sekolah', pautanEviden: '', status: 'approved', draft: null, tags: ['#Sekolah'] },
  ];

  /* ── Tiket e-Fasiliti contoh ── */
  function tl(tarikh, tindakan, oleh, status) { return { tarikh, tindakan, oleh, status }; }
  const TIKET = [
    { id: 'TKT-2026-001', tajuk: 'Paip pecah di tandas blok A', kategori: 'Paip & Sanitasi', sekolah: 'SMK Dalat', zon: 'Zon 1', tarikh: '2026-09-02', status: 'Selesai', keutamaan: 'Kritikal', pelaporId: 'u_razif',
      butiran: 'Paip utama di tandas blok A tingkat 2 pecah menyebabkan air melimpah ke koridor. Keadaan licin dan berbahaya kepada pelajar.',
      notaPJ: 'Paip PVC 4 inci perlu diganti. Anggaran kos RM 850.', notaPPD: 'Bajet diluluskan. Kontraktor dilantik.',
      timeline: [tl('2026-09-02 08:30', 'Aduan dihantar oleh sekolah', 'SMK Dalat', 'Baru'), tl('2026-09-02 14:15', 'Lawatan tapak oleh PJ. Aduan disahkan.', 'En. Haziq (PJ Zon 1)', 'Disemak PJ'), tl('2026-09-03 09:00', 'Bajet RM 850 diluluskan oleh PPD', 'PPD Dalat', 'Lulus Bajet'), tl('2026-09-05 16:00', 'Kerja pembaikan selesai', 'Kontraktor', 'Selesai')] },
    { id: 'TKT-2026-002', tajuk: 'Bumbung dewan bocor ketika hujan lebat', kategori: 'Bumbung', sekolah: 'SMK Oya', zon: 'Zon 2', tarikh: '2026-09-14', status: 'Lulus Bajet', keutamaan: 'Tinggi', pelaporId: 'u_salmah',
      butiran: 'Bumbung dewan sekolah bocor di 3 titik semasa hujan lebat. Air menitis ke atas kerusi pelajar semasa perhimpunan.',
      notaPJ: 'Jubin bumbung retak seluas 12m². Anggaran RM 3,200.', notaPPD: null,
      timeline: [tl('2026-09-14 10:00', 'Aduan dihantar oleh sekolah', 'SMK Oya', 'Baru'), tl('2026-09-16 11:30', 'Lawatan tapak disahkan. Kritikal sebelum musim tengkujuh.', 'Pn. Farah (PJ Zon 2)', 'Disemak PJ'), tl('2026-09-22 09:00', 'Bajet RM 3,200 diluluskan', 'PPD Dalat', 'Lulus Bajet')] },
    { id: 'TKT-2026-003', tajuk: 'Litar elektrik trip berulang kali di makmal sains', kategori: 'Elektrik', sekolah: 'SMK Batang Igan', zon: 'Zon 3', tarikh: '2026-09-08', status: 'Disemak PJ', keutamaan: 'Kritikal', pelaporId: null,
      butiran: 'Bekalan elektrik di makmal sains trip 3-4 kali sehari. Menjejaskan penggunaan peralatan makmal.',
      notaPJ: 'Panel elektrik lama perlu dinaik taraf. Anggaran RM 5,500.', notaPPD: null,
      timeline: [tl('2026-09-08 07:45', 'Aduan dihantar oleh sekolah', 'SMK Batang Igan', 'Baru'), tl('2026-09-12 13:00', 'Disahkan oleh PJ. Panel elektrik usang, berisiko.', 'En. Rafie (PJ Zon 3)', 'Disemak PJ')] },
    { id: 'TKT-2026-004', tajuk: 'Pagar sekolah rosak, keselamatan terjejas', kategori: 'Struktur & Pagar', sekolah: 'SMK Agama Igan', zon: 'Zon 2', tarikh: '2026-10-20', status: 'Baru', keutamaan: 'Tinggi', pelaporId: null,
      butiran: 'Bahagian pagar besi di pintu masuk belakang rebah. Pelajar boleh keluar masuk tanpa kawalan.', notaPJ: null, notaPPD: null,
      timeline: [tl('2026-10-20 08:00', 'Aduan dihantar oleh sekolah', 'SMK Agama Igan', 'Baru')] },
    { id: 'TKT-2026-005', tajuk: 'Kipas siling bilik darjah 5 Amanah tidak berfungsi', kategori: 'Elektrik', sekolah: 'SMK Dalat', zon: 'Zon 1', tarikh: '2026-10-24', status: 'Disemak PJ', keutamaan: 'Sederhana', pelaporId: 'u_azman',
      butiran: '3 buah kipas siling di bilik darjah 5 Amanah, blok B tidak berfungsi. Cuaca panas menyebabkan murid tidak selesa semasa belajar.',
      notaPJ: 'Kapasitor kipas rosak. Boleh diganti oleh PJ.', notaPPD: null,
      timeline: [tl('2026-10-24 09:15', 'Aduan dihantar oleh AZMAN BIN HARUN', 'SMK Dalat', 'Baru'), tl('2026-10-27 10:40', 'Disahkan oleh PJ. Kapasitor perlu diganti.', 'En. Haziq (PJ Zon 1)', 'Disemak PJ')] },
    { id: 'TKT-2026-006', tajuk: 'Tangki air asrama bocor', kategori: 'Paip & Sanitasi', sekolah: 'SMK Batang Igan', zon: 'Zon 3', tarikh: '2026-08-25', status: 'Lulus Bajet', keutamaan: 'Kritikal', pelaporId: null,
      butiran: 'Tangki air utama asrama lelaki bocor. Bekalan air ke asrama terputus setiap petang.', notaPJ: 'Tangki gentian kaca perlu diganti. Anggaran RM 7,800.', notaPPD: null,
      timeline: [tl('2026-08-25 07:30', 'Aduan dihantar oleh sekolah', 'SMK Batang Igan', 'Baru'), tl('2026-08-29 15:00', 'Lawatan tapak disahkan.', 'En. Rafie (PJ Zon 3)', 'Disemak PJ'), tl('2026-09-10 11:00', 'Bajet RM 7,800 diluluskan', 'PPD Dalat', 'Lulus Bajet')] },
    { id: 'TKT-2026-007', tajuk: 'Siling bilik guru runtuh sebahagian', kategori: 'Bumbung', sekolah: 'SMK Oya', zon: 'Zon 2', tarikh: '2026-09-21', status: 'Baru', keutamaan: 'Tinggi', pelaporId: 'u_salmah',
      butiran: 'Papan siling di bilik guru runtuh sebahagian akibat kebocoran. Bilik guru tidak dapat digunakan sepenuhnya.', notaPJ: null, notaPPD: null,
      timeline: [tl('2026-09-21 13:20', 'Aduan dihantar oleh sekolah', 'SMK Oya', 'Baru')] },
    { id: 'TKT-2026-008', tajuk: 'Pintu makmal komputer tidak boleh dikunci', kategori: 'Struktur & Pagar', sekolah: 'SMK Dalat', zon: 'Zon 1', tarikh: '2026-10-29', status: 'Baru', keutamaan: 'Sederhana', pelaporId: 'u_razif',
      butiran: 'Tombol pintu makmal komputer rosak dan tidak boleh dikunci. Risiko kecurian peralatan.', notaPJ: null, notaPPD: null,
      timeline: [tl('2026-10-29 11:05', 'Aduan dihantar oleh sekolah', 'SMK Dalat', 'Baru')] },
  ];

  function seed() {
    if (read(K.seed) === VERSI && read(K.kelas)) return;
    const { kelas, marks } = janaSPM();
    write(K.kelas, kelas.map(seragamKelas));
    write(K.marks, marks);
    write(K.skas, { u_azman: SKAS_REKOD_AZMAN });
    write(K.tiket, TIKET.map(seragamTiket));
    write(K.ingat, []);
    write(K.seed, VERSI);
  }
  seed();

  const hari = (a, b = new Date()) => Math.floor((new Date(b) - new Date(a)) / 86400000);

  const spm = {
    kelas: () => (read(K.kelas) || []).map(seragamKelas),
    marks: () => read(K.marks) || {},
    save(kelas, marks) { return write(K.kelas, kelas.map(seragamKelas)) && write(K.marks, marks); },
    kelasGuru: uid => spm.kelas().filter(k => k.guruId === uid),
    kelasSekolah: nama => spm.kelas().filter(k => k.sekolah === besar(nama)),
    // Bil. murid yang belum diisi bagi ujian (undefined = belum; null = TH dikira selesai)
    belumIsi(k, key, marks = spm.marks()) { return (k.pelajar || []).filter(p => !marks[p.id] || marks[p.id][key] === undefined).length; },
  };
  const skas = {
    all: () => read(K.skas) || {},
    rekod: uid => (read(K.skas) || {})[uid] || [],
    save(uid, list) { const all = skas.all(); all[uid] = list; return write(K.skas, all); },
  };
  const efasiliti = {
    tiket: () => (read(K.tiket) || []).map(seragamTiket),
    save: list => write(K.tiket, list.map(seragamTiket)),
    bukaHari: t => hari(t.tarikh),
    aktif: t => !['Selesai', 'Ditolak'].includes(t.status),
  };

  // Peringatan pengisian markah daripada pentadbir sekolah kepada guru
  const peringatan = {
    all: () => read(K.ingat) || [],
    hantar(kelasId, dari) {
      const list = peringatan.all();
      const item = { kelasId, dariId: dari.id, dariNama: dari.nama, t: Date.now() };
      write(K.ingat, [...list.filter(x => x.kelasId !== kelasId), item]);
      return item;
    },
    untukKelas: kelasId => peringatan.all().find(x => x.kelasId === kelasId) || null,
  };

  function sekolahUser(u) {
    if (!u) return null;
    const list = sekolahList();
    return list.find(s => s.kod === u.kodSekolah) || list.find(s => s.nama === besar(u.org)) || null;
  }

  // Tugasan peribadi pengguna (paparan Pengguna Biasa di dashboard)
  function tugasan(u) {
    if (!u) return [];
    const out = [];
    const marks = spm.marks();
    const pe = PEPERIKSAAN_SEMASA, baki = -hari(pe.tarikhAkhir);
    spm.kelasGuru(u.id).forEach(k => {
      const belum = spm.belumIsi(k, pe.key, marks);
      if (!belum) return;
      const ing = peringatan.untukKelas(k.id);
      const bilaIng = ing ? new Date(ing.t).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' }) : '';
      out.push({ app: 'spm', belum, tahap: ing || baki <= 3 ? 'merah' : baki <= 7 ? 'kuning' : 'biru',
        tajuk: `Isi markah ${pe.label}`,
        butiran: `${k.subjek} · ${k.tingkatan} ${k.kelas} — ${belum}/${k.pelajar.length} murid belum diisi${ing ? ` · Peringatan daripada ${ing.dariNama} (${bilaIng})` : ''}`,
        tarikh: pe.tarikhAkhir, baki, url: `spm-analytics.html?kelas=${encodeURIComponent(k.id)}&ujian=${pe.key}` });
    });
    const pending = skas.rekod(u.id).filter(r => r.status === 'pending').length;
    if (pending) out.push({ app: 'skas', tahap: 'biru', tajuk: `${pending} rekod pencapaian menunggu pengesahan`, butiran: 'Pentadbir sekolah akan menyemak rekod SKPM 5.4.1 anda', url: 'skas-preview.html' });
    efasiliti.tiket().filter(t => t.pelaporId === u.id && efasiliti.aktif(t)).forEach(t => {
      out.push({ app: 'efasiliti', tahap: 'abu', tajuk: `Aduan anda: ${t.tajuk}`, butiran: `${t.id} · status ${t.status} · ${efasiliti.bukaHari(t)} hari lalu`, url: `e-fasiliti.html?tiket=${encodeURIComponent(t.id)}` });
    });
    return out;
  }
  // Lencana ringkas setiap aplikasi bagi pengguna
  function lencana(u) {
    const t = tugasan(u);
    const c = app => t.filter(x => x.app === app);
    const spmT = c('spm'), belum = spmT.reduce((a, x) => a + x.belum, 0);
    return {
      spm: spmT.length ? { teks: `${belum} markah belum diisi`, tahap: spmT[0].tahap } : null,
      skas: c('skas').length ? { teks: `${skas.rekod(u.id).filter(r => r.status === 'pending').length} menunggu pengesahan`, tahap: 'biru' } : null,
      efasiliti: c('efasiliti').length ? { teks: `${c('efasiliti').length} aduan aktif`, tahap: 'abu' } : null,
    };
  }

  /* ── Ringkasan & amaran awal untuk PPD (dipaparkan dalam aplikasi, bukan dashboard) ── */
  const GPS = m => m >= 90 ? 1 : m >= 80 ? 2 : m >= 70 ? 3 : m >= 65 ? 4 : m >= 60 ? 5 : m >= 55 ? 6 : m >= 50 ? 7 : m >= 45 ? 8 : m >= 40 ? 9 : 10;
  const num = v => typeof v === 'number';
  function ringkasanSPM() {
    const marks = spm.marks(), pe = PEPERIKSAAN_SEMASA;
    return sekolahList().map(sk => {
      const ks = spm.kelasSekolah(sk.nama);
      const rek = ks.flatMap(k => k.pelajar.map(p => ({ p, m: marks[p.id] || {} })));
      const akhir = m => num(m.percubaan) ? m.percubaan : num(m.ar2) ? m.ar2 : m.ar1;
      const ada = rek.filter(x => num(akhir(x.m)));
      const gps = ada.length ? ada.reduce((a, x) => a + GPS(akhir(x.m)), 0) / ada.length : null;
      const gagalKini = ada.filter(x => akhir(x.m) < 40).length / (ada.length || 1) * 100;
      const ar1 = rek.filter(x => num(x.m.ar1));
      const gagalAR1 = ar1.filter(x => x.m.ar1 < 40).length / (ar1.length || 1) * 100;
      const murid = new Set(rek.map(x => x.p.muridId || x.p.id));
      // Murid berisiko: purata markah terkini semua subjek < 45, atau purata merosot > 5 markah sejak AR1
      const perM = {};
      ada.forEach(x => { const k = x.p.muridId || x.p.id; const o = perM[k] = perM[k] || { s: 0, d: 0, n: 0 };
        o.s += akhir(x.m); o.d += num(x.m.ar1) ? x.m.ar1 - akhir(x.m) : 0; o.n++; });
      const risiko = new Set(Object.entries(perM).filter(([, o]) => o.s / o.n < 45 || o.d / o.n > 5).map(([k]) => k));
      const tot = rek.length, belum = ks.reduce((a, k) => a + spm.belumIsi(k, pe.key, marks), 0);
      return { ...sk, gps: gps && +gps.toFixed(2), murid: murid.size, risikoPct: Math.round(risiko.size / (murid.size || 1) * 100),
        gagalKini: Math.round(gagalKini), gagalAR1: Math.round(gagalAR1), isiPct: tot ? Math.round((tot - belum) / tot * 100) : 0,
        kelasBelum: ks.filter(k => spm.belumIsi(k, pe.key, marks) > 0).length, kelas: ks.length };
    });
  }
  function amaranSPM() {
    const baki = -hari(PEPERIKSAAN_SEMASA.tarikhAkhir), out = [];
    ringkasanSPM().filter(s => s.kelas > 0).forEach(s => {
      const naik = s.gagalKini - s.gagalAR1;
      if (s.risikoPct >= 30) out.push({ tahap: 'merah', sekolah: s.nama, tajuk: `${s.risikoPct}% murid berisiko`, butiran: `Kadar gagal ${s.gagalKini}% (AR1: ${s.gagalAR1}%)${naik > 0 ? ` · naik ${naik} mata peratus` : ''}` });
      else if (naik >= 4) out.push({ tahap: 'kuning', sekolah: s.nama, tajuk: `Kadar gagal meningkat ${naik} mata peratus`, butiran: `Daripada ${s.gagalAR1}% (AR1) kepada ${s.gagalKini}% (ujian terkini)` });
      if (s.isiPct < 70 && baki <= 14) out.push({ tahap: baki <= 7 ? 'merah' : 'kuning', sekolah: s.nama, tajuk: `Pengisian ${PEPERIKSAAN_SEMASA.label} baru ${s.isiPct}%`, butiran: `${s.kelasBelum}/${s.kelas} kelas belum lengkap · tarikh akhir ${baki} hari lagi` });
    });
    return out.sort((a, b) => (a.tahap === 'merah' ? 0 : 1) - (b.tahap === 'merah' ? 0 : 1));
  }
  function amaranEfasiliti() {
    const out = [];
    efasiliti.tiket().filter(efasiliti.aktif).forEach(t => {
      const d = efasiliti.bukaHari(t);
      if (d > 30) out.push({ tahap: 'merah', sekolah: t.sekolah, tiket: t.id, tajuk: `${t.tajuk}`, butiran: `${t.id} · ${d} hari tanpa penyelesaian · status ${t.status}` });
      else if (t.keutamaan === 'Kritikal' && d > 14) out.push({ tahap: 'kuning', sekolah: t.sekolah, tiket: t.id, tajuk: `Aduan kritikal: ${t.tajuk}`, butiran: `${t.id} · ${d} hari · status ${t.status}` });
    });
    return out.sort((a, b) => (a.tahap === 'merah' ? 0 : 1) - (b.tahap === 'merah' ? 0 : 1));
  }

  window.PPDData = { besar, sekolahList, UJIAN, PEPERIKSAAN_SEMASA, spm, skas, efasiliti, peringatan, sekolahUser, tugasan, lencana, hari, ringkasanSPM, amaranSPM, amaranEfasiliti };
  Object.defineProperty(window.PPDData, 'SEKOLAH', { get: sekolahList, enumerable: true });
})();
