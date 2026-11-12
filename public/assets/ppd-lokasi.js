/* Lokasi sekolah seliaan & PPD Dalat — peta interaktif (Google Maps JavaScript API jika kunci tersedia, jika tidak Leaflet).
   Sumber: laman Perancangan Daerah, Sektor Perancangan PPD Dalat (edudalat.my.canva.site), pautan Google Maps setiap sekolah.
   Maklumat sekolah & kod rasmi: Senarai Sekolah EMIS Online, 8 November 2026 (bilangan murid, guru dan AKP sengaja tidak dimasukkan).
   Logo: assets/logo-sekolah/ (disediakan oleh PPD Dalat). */
(function () {
  const G = id => 'https://maps.app.goo.gl/' + id;
  const LG = f => 'assets/logo-sekolah/' + f + '.webp';
  const LOKASI = [
    { kod: 'PPD',     nama: 'PEJABAT PENDIDIKAN DAERAH DALAT', jenis: 'PPD',  lat: 2.7444607, lng: 111.9400446, peta: G('y1NXZvvonVc1eYk98'), logo: 'assets/logo-kpm.jpg' },
    { kod: 'YEE3501', nama: 'SMK DALAT',                       jenis: 'SMK',  lat: 2.7437969, lng: 111.9403783, peta: G('Jwzjuua8z91cu88GA'), logo: LG('smkdalat') },
    { kod: 'YRA3201', nama: 'SMK AGAMA IGAN',                  jenis: 'SMK',  lat: 2.8240333, lng: 111.7127790, peta: G('tJ8VC36SFGaBhLrV7'), logo: LG('smkagamaigan') },
    { kod: 'YEA3501', nama: 'SMK OYA',                         jenis: 'SMK',  lat: 2.8625927, lng: 111.8858470, peta: G('wibTGvUwxmoxVjzG7'), logo: LG('smkoya') },
    { kod: 'YEA3202', nama: 'SMK BATANG IGAN',                 jenis: 'SMK',  lat: 2.6098449, lng: 111.8270645, peta: G('tFBrn7z9DUYcwMd98'), logo: LG('smkbatangigan') },
    { kod: 'YCC3502', nama: 'SJK(C) CHIN HUA',                 jenis: 'SJKC', lat: 2.7410170, lng: 111.9390696, peta: G('N8L8KfaoJYx2FdUQA'), logo: LG('sjkcchinhua') },
    { kod: 'YCC3504', nama: 'SJK(C) POI YUK',                  jenis: 'SJKC', lat: 2.7158956, lng: 111.8387927, peta: G('sKi7481XUQADHwvq7'), logo: LG('sjkcpoiyuk') },
    { kod: 'YCC3501', nama: 'SJK(C) YAK TEE',                  jenis: 'SJKC', lat: 2.8559861, lng: 111.8742858, peta: G('KPixTbKfoaP5Dxg96'), logo: LG('sjkcyaktee') },
    { kod: 'YCC3503', nama: 'SJK(C) SAN SAN',                  jenis: 'SJKC', lat: 2.6506917, lng: 112.0446848, peta: G('tgBTg5RBRKjyR5iS8'), logo: LG('sjkcsansan') },
    { kod: 'YBB3507', nama: 'SK KAMPUNG BAKONG TERUS',         jenis: 'SK',   lat: 2.8510396, lng: 111.8891978, peta: G('jux5ygh3mzGGJaur8'), logo: LG('skkgbakongterus') },
    { kod: 'YBA3202', nama: 'SK KAMPUNG KEBUAW',               jenis: 'SK',   lat: 2.7502470, lng: 111.7942243, peta: G('kfpjBM1uwvRQGy8KA'), logo: LG('skkebuaw') },
    { kod: 'YBA3203', nama: 'SK KAMPUNG IGAN',                 jenis: 'SK',   lat: 2.8231350, lng: 111.7108720, peta: G('LuB5h1tMtWSUN7xh8'), logo: LG('skkgigan') },
    { kod: 'YBB3212', nama: 'SK SG RASAU',                     jenis: 'SK',   lat: 2.6016468, lng: 111.8341186, peta: G('7DEZpjmiAB55jaVQ7'), logo: LG('sksgrasau') },
    { kod: 'YBB3222', nama: 'SK SG PINANG',                    jenis: 'SK',   lat: 2.6685518, lng: 111.8616240, peta: G('QT9BcrATQQfwr2nx7'), logo: LG('sksgpinang') },
    { kod: 'YBB3224', nama: 'SK KG BUNGAN',                    jenis: 'SK',   lat: 2.6379342, lng: 111.8202097, peta: G('dDY9nqxSJaapMviC6'), logo: LG('skkgbungan') },
    { kod: 'YBB3229', nama: 'SK SG ILAS',                      jenis: 'SK',   lat: 2.7880539, lng: 111.7872534, peta: G('2BiybwULPGvC4ex19'), logo: LG('sksgilas') },
    { kod: 'YBB3501', nama: 'SK KG TEH',                       jenis: 'SK',   lat: 2.8204650, lng: 111.8929577, peta: G('2BL5dPDQ8K72diUb9'), logo: LG('skkgteh') },
    { kod: 'YBB3503', nama: 'SK BAOH ULU',                     jenis: 'SK',   lat: 2.5756244, lng: 112.1213989, peta: G('vm9kTsXqWviS2bCh6'), logo: LG('skbaohulu') },
    // Disemak dengan Google Maps (Nov 2026): pautan asal menunjuk ke tempat lama "SK DPM OYA" ~1.2 km ke barat (kawasan rumah);
    // kawasan sekolah sebenar ialah tempat "SK DATU PENGIRAN MOHAMAD"
    { kod: 'YBE3501', nama: 'SK DATU PENGIRAN MOHAMAD',        jenis: 'SK',   lat: 2.8588096, lng: 111.8864741, peta: 'https://www.google.com/maps/place/SK+DATU+PENGIRAN+MOHAMAD/@2.8588096,111.8864741,17z/data=!4m6!3m5!1s0x31f7aac17e847d41:0xd226e5ae332b3b19!8m2!3d2.8588096!4d111.8864741', logo: LG('skdpm') },
    { kod: 'YBE3502', nama: 'SK KG TANAM',                     jenis: 'SK',   lat: 2.7720223, lng: 111.9375321, peta: G('rhQgtBPSztyvccMV8'), logo: LG('skkgtanam') },
    { kod: 'YCB3506', nama: 'SK ST JOHN KG MEDONG',            jenis: 'SK',   lat: 2.6829613, lng: 111.9342214, peta: G('pWfVGJgKW9bpALWS7'), logo: LG('skstjohn') },
    { kod: 'YBE3503', nama: 'SK KG BALAN',                     jenis: 'SK',   lat: 2.8010176, lng: 111.9159906, peta: G('yHetfJcFgirqyAJ76'), logo: LG('skkgbalan') },
    { kod: 'YBE3504', nama: 'SK SG UD',                        jenis: 'SK',   lat: 2.7447246, lng: 111.9442172, peta: G('8ALydjHL4RnbepRcA'), logo: LG('sksgud') },
    { kod: 'YBE3505', nama: 'SK SUNGAI KUT TENGAH',            jenis: 'SK',   lat: 2.7174289, lng: 111.8801618, peta: G('v5yq7WiG37HZto3R6'), logo: LG('sksgkuttgh') },
    { kod: 'YBE3506', nama: 'SK KG SENAU',                     jenis: 'SK',   lat: 2.8655337, lng: 111.8700911, peta: G('zKwLcESs91FML2dC7'), logo: LG('skkgsenau') },
    { kod: 'YBE3507', nama: 'SK KG KLID/PLAJAU',               jenis: 'SK',   lat: 2.6749059, lng: 112.0435409, peta: G('qURFUCp4kD6FbkKQ7'), logo: LG('skkgklidplajau') },
    { kod: 'YCB3502', nama: 'SK ST LUKE NG BAOH',              jenis: 'SK',   lat: 2.5838419, lng: 112.0496115, peta: G('9pgGToS7xxt5HyuU9'), logo: LG('skstluke') },
    { kod: 'YCB3504', nama: 'SK ST JUDE',                      jenis: 'SK',   lat: 2.7157099, lng: 111.9193725, peta: G('4PFdGtSi2prw583S9'), logo: LG('skstjude') },
    { kod: 'YCB3505', nama: 'SK ST BERNARD',                   jenis: 'SK',   lat: 2.7386172, lng: 111.9348257, peta: G('1qe8xhiydkmcCnHK7'), logo: LG('skstbernard') },
    { kod: 'YCB3507', nama: 'SK ST KEVIN SG KUT',              jenis: 'SK',   lat: 2.7143038, lng: 111.8455358, peta: G('88LU832S6shqtKNN8'), logo: LG('skstkevin') },
  ];
  // EMIS Online 08/11/2026 — dijana daripada fail CSV rasmi
  const EMIS = {
    YBA3202: {"namaPenuh": "SEKOLAH KEBANGSAAN KAMPUNG KEBUAW", "telefon": "084-864 241", "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Tiada Asrama", "kuarters": "Ada", "parlimen": "IGAN", "dun": "JEMORENG"},
    YBA3203: {"namaPenuh": "SEKOLAH KEBANGSAAN KAMPUNG IGAN", "telefon": null, "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "B", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Tiada Asrama", "kuarters": "Ada", "parlimen": "IGAN", "dun": "JEMORENG"},
    YBB3212: {"namaPenuh": "SEKOLAH KEBANGSAAN SG RASAU", "telefon": null, "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Asrama Sekolah Harian", "kuarters": "Ada", "parlimen": "SIBU", "dun": "BAWANG ASSAN"},
    YBB3222: {"namaPenuh": "SEKOLAH KEBANGSAAN SG PINANG", "telefon": null, "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Tiada Asrama", "kuarters": "Ada", "parlimen": "SIBU", "dun": "BAWANG ASSAN"},
    YBB3224: {"namaPenuh": "SEKOLAH KEBANGSAAN KG BUNGAN", "telefon": null, "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Asrama Sekolah Harian", "kuarters": "Ada", "parlimen": "SIBU", "dun": "BAWANG ASSAN"},
    YBB3229: {"namaPenuh": "SEKOLAH KEBANGSAAN SG ILAS", "telefon": null, "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Tiada Asrama", "kuarters": "Ada", "parlimen": "IGAN", "dun": "JEMORENG"},
    YBB3501: {"namaPenuh": "SEKOLAH KEBANGSAAN KPG TEH", "telefon": "084-867 310", "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Tiada Asrama", "kuarters": "Tiada", "parlimen": "MUKAH", "dun": "DALAT"},
    YBB3503: {"namaPenuh": "SEKOLAH KEBANGSAAN BAOH ULU", "telefon": null, "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Asrama Sekolah Harian", "kuarters": "Ada", "parlimen": "MUKAH", "dun": "TELLIAN"},
    YBB3507: {"namaPenuh": "SEKOLAH KEBANGSAAN KAMPUNG BAKONG TERUS", "telefon": "084-865 592", "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Tiada Asrama", "kuarters": "Ada", "parlimen": "MUKAH", "dun": "DALAT"},
    YBE3501: {"namaPenuh": "SEKOLAH KEBANGSAAN DATU PENGIRAN MOHAMAD", "telefon": "084-867 225", "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "B", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Asrama Sekolah Harian", "kuarters": "Ada", "parlimen": "MUKAH", "dun": "DALAT"},
    YBE3502: {"namaPenuh": "SEKOLAH KEBANGSAAN KG TANAM", "telefon": "084-864 799", "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "B", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Tiada Asrama", "kuarters": "Ada", "parlimen": "MUKAH", "dun": "DALAT"},
    YBE3503: {"namaPenuh": "SEKOLAH KEBANGSAAN KG BALAN", "telefon": null, "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Tiada Asrama", "kuarters": "Ada", "parlimen": "MUKAH", "dun": "DALAT"},
    YBE3504: {"namaPenuh": "SEKOLAH KEBANGSAAN SG UD", "telefon": "084-864 384", "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "B", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Tiada Asrama", "kuarters": "Ada", "parlimen": "MUKAH", "dun": "DALAT"},
    YBE3505: {"namaPenuh": "SEKOLAH KEBANGSAAN SUNGAI KUT TENGAH DALAT", "telefon": null, "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Tiada Asrama", "kuarters": "Ada", "parlimen": "MUKAH", "dun": "DALAT"},
    YBE3506: {"namaPenuh": "SEKOLAH KEBANGSAAN KG SENAU", "telefon": "084-867 090", "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Tiada Asrama", "kuarters": "Ada", "parlimen": "MUKAH", "dun": "DALAT"},
    YBE3507: {"namaPenuh": "SEKOLAH KEBANGSAAN KG KLID PLAJAU", "telefon": null, "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Asrama Sekolah Harian", "kuarters": "Ada", "parlimen": "MUKAH", "dun": "DALAT"},
    YCB3502: {"namaPenuh": "SEKOLAH KEBANGSAAN ST LUKE NG BAOH", "telefon": null, "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Bantuan Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Asrama Sekolah Harian", "kuarters": "Ada", "parlimen": "MUKAH", "dun": "TELLIAN"},
    YCB3504: {"namaPenuh": "SEKOLAH KEBANGSAAN ST. JUDE", "telefon": null, "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Bantuan Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Tiada Asrama", "kuarters": "Tiada", "parlimen": "MUKAH", "dun": "DALAT"},
    YCB3505: {"namaPenuh": "SEKOLAH KEBANGSAAN ST BERNARD", "telefon": "084-864 450", "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Bantuan Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Tiada Asrama", "kuarters": "Tiada", "parlimen": "MUKAH", "dun": "DALAT"},
    YCB3506: {"namaPenuh": "SEKOLAH KEBANGSAAN ST JOHN KG MEDONG", "telefon": null, "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "B", "lokasi": "Luar Bandar", "bantuan": "Sekolah Bantuan Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Tiada Asrama", "kuarters": "Ada", "parlimen": "MUKAH", "dun": "DALAT"},
    YCB3507: {"namaPenuh": "SEKOLAH KEBANGSAAN ST KEVIN SG KUT", "telefon": null, "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SK", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Bantuan Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Asrama Sekolah Harian", "kuarters": "Ada", "parlimen": "MUKAH", "dun": "DALAT"},
    YCC3501: {"namaPenuh": "SEKOLAH JENIS KEBANGSAAN (CINA) YAK TEE", "telefon": "084-867 353", "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SJK(C)", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Bantuan Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Tiada Asrama", "kuarters": "Tiada", "parlimen": "MUKAH", "dun": "DALAT"},
    YCC3502: {"namaPenuh": "SEKOLAH JENIS KEBANGSAAN (CINA) CHIN HUA", "telefon": null, "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SJK(C)", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Bantuan Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Tiada Asrama", "kuarters": "Tiada", "parlimen": "MUKAH", "dun": "DALAT"},
    YCC3503: {"namaPenuh": "SEKOLAH JENIS KEBANGSAAN (CINA) SAN SAN", "telefon": null, "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SJK(C)", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Bantuan Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Asrama Sekolah Harian", "kuarters": "Ada", "parlimen": "MUKAH", "dun": "DALAT"},
    YCC3504: {"namaPenuh": "SEKOLAH JENIS KEBANGSAAN (CINA) POI YUK", "telefon": null, "status": "Beroperasi", "peringkat": "Rendah", "jenisSekolah": "SJK(C)", "gred": "C", "lokasi": "Luar Bandar", "bantuan": "Sekolah Bantuan Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Asrama Sekolah Harian", "kuarters": "Tiada", "parlimen": "MUKAH", "dun": "DALAT"},
    YEA3202: {"namaPenuh": "SEKOLAH MENENGAH KEBANGSAAN BATANG IGAN", "telefon": null, "status": "Beroperasi", "peringkat": "Menengah", "jenisSekolah": "SMK", "gred": "B", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Asrama Sekolah Harian", "kuarters": "Ada", "parlimen": "SIBU", "dun": "BAWANG ASSAN"},
    YEA3501: {"namaPenuh": "SEKOLAH MENENGAH KEBANGSAAN OYA", "telefon": "084-867 885", "status": "Beroperasi", "peringkat": "Menengah", "jenisSekolah": "SMK", "gred": "A", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Asrama Sekolah Harian", "kuarters": "Ada", "parlimen": "MUKAH", "dun": "DALAT"},
    YEE3501: {"namaPenuh": "SEKOLAH MENENGAH KEBANGSAAN DALAT", "telefon": null, "status": "Beroperasi", "peringkat": "Menengah", "jenisSekolah": "SMK", "gred": "A", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Asrama Sekolah Harian", "kuarters": "Ada", "parlimen": "MUKAH", "dun": "DALAT"},
    YRA3201: {"namaPenuh": "SEKOLAH MENENGAH KEBANGSAAN AGAMA IGAN", "telefon": "084-867 319", "status": "Beroperasi", "peringkat": "Menengah", "jenisSekolah": "SMK Agama", "gred": "A", "lokasi": "Luar Bandar", "bantuan": "Sekolah Kerajaan", "sesi": "Pagi Sahaja", "asrama": "Asrama Sekolah Harian", "kuarters": "Ada", "parlimen": "IGAN", "dun": "JEMORENG"},
  };
  LOKASI.forEach(l => Object.assign(l, EMIS[l.kod] || {}));

  const JENIS = {
    PPD:  { label: 'Pejabat Pendidikan Daerah', pendek: 'PPD',    warna: '#c8962a' },
    SMK:  { label: 'Sekolah Menengah',          pendek: 'SMK',    warna: '#13406e' },
    SJKC: { label: 'Sekolah Jenis Kebangsaan (Cina)', pendek: 'SJK(C)', warna: '#b42318' },
    SK:   { label: 'Sekolah Kebangsaan',        pendek: 'SK',     warna: '#067647' },
  };
  const PPD = LOKASI[0];
  const CINCIN_KM = [10, 20, 30];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Jarak garis lurus (haversine), dalam km
  function jarakKm(a, b) {
    const R = 6371, r = d => d * Math.PI / 180;
    const x = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  LOKASI.forEach((l, i) => { l.id = 'lk' + i; l.jarak = l === PPD ? 0 : jarakKm(PPD, l); });
  // Jarak laluan sebenar dari PPD Dalat [km, minit, mod] — dijana oleh scripts/jarak_laluan.py (OSRM + graf sungai),
  // dengan peraturan yang sama seperti panel arah. mod: 'jalan' | 'sungai' | 'jauh' (hanya laluan darat melencong jauh).
  const JARAK_LALUAN = {
    'SMK DALAT': [0.1, 1, "jalan"],
    'SMK AGAMA IGAN': [41.9, 48, "jalan"],
    'SMK OYA': [18.3, 22, "jalan"],
    'SMK BATANG IGAN': [38.6, 93, "sungai"],
    'SJK(C) CHIN HUA': [0.6, 2, "jalan"],
    'SJK(C) POI YUK': [13.8, 16, "jalan"],
    'SJK(C) YAK TEE': [19.2, 22, "jalan"],
    'SJK(C) SAN SAN': [46.4, 111, "sungai"],
    'SK KAMPUNG BAKONG TERUS': [16.8, 20, "jalan"],
    'SK KAMPUNG KEBUAW': [55.7, 66, "jalan"],
    'SK KAMPUNG IGAN': [41.7, 48, "jalan"],
    'SK SG RASAU': [39.7, 95, "sungai"],
    'SK SG PINANG': [21.4, 51, "sungai"],
    'SK KG BUNGAN': [30.0, 72, "sungai"],
    'SK SG ILAS': [53.5, 63, "jalan"],
    'SK KG TEH': [14.1, 18, "jalan"],
    'SK BAOH ULU': [154.8, 201, "jauh"],
    'SK DATU PENGIRAN MOHAMAD': [17.5, 20, "jalan"],
    'SK KG TANAM': [5.7, 8, "jalan"],
    'SK ST JOHN KG MEDONG': [7.9, 12, "jalan"],
    'SK KG BALAN': [9.9, 12, "jalan"],
    'SK SG UD': [1.1, 3, "jalan"],
    'SK SUNGAI KUT TENGAH': [9.1, 11, "jalan"],
    'SK KG SENAU': [26.7, 33, "jalan"],
    'SK KG KLID/PLAJAU': [40.5, 97, "sungai"],
    'SK ST LUKE NG BAOH': [72.4, 174, "sungai"],
    'SK ST JUDE': [5.3, 8, "jalan"],
    'SK ST BERNARD': [1.0, 2, "jalan"],
    'SK ST KEVIN SG KUT': [13.3, 16, "jalan"],
  };
  LOKASI.forEach(l => {
    const j = JARAK_LALUAN[l.nama];
    l.laluan = j ? { km: j[0], minit: j[1], mod: j[2] } : { km: l.jarak, minit: null, mod: 'garis' };
  });
  // Skala bar: laluan 'jauh' (cth. 155 km melalui Sibu) tidak dijadikan ukuran supaya bar lain masih bermakna
  const JARAK_MAKS = Math.max(...LOKASI.filter(l => l.laluan.mod !== 'jauh').map(l => l.laluan.km));
  const IKON_MOD_KECIL = { jalan: '<svg viewBox="0 0 24 24"><path d="M4 13l2-6h12l2 6v4H4zM6 17v2M18 17v2"/></svg>',
    sungai: '<svg viewBox="0 0 24 24"><path d="M3 14l2 4h14l2-4H3zM6 14V9h8l3 5"/></svg>', jauh: '<svg viewBox="0 0 24 24"><path d="M4 13l2-6h12l2 6v4H4zM6 17v2M18 17v2"/></svg>' };
  const teksMod = l => ({ jalan: 'jalan raya', sungai: 'sungai', jauh: 'jalan raya, melencong jauh', garis: 'garis lurus' })[l.laluan.mod];
  // Arahan belok demi belok (langkah OSRM) dalam Bahasa Melayu
  const ARAH_MOD = { left: 'Belok kiri', right: 'Belok kanan', 'slight left': 'Condong ke kiri', 'slight right': 'Condong ke kanan',
    'sharp left': 'Belok tajam ke kiri', 'sharp right': 'Belok tajam ke kanan', straight: 'Terus', uturn: 'Pusing balik' };
  const IKON_MOD = { left: '↰', 'slight left': '↖', 'sharp left': '↰', right: '↱', 'slight right': '↗', 'sharp right': '↱', straight: '↑', uturn: '↶' };
  function teksLangkah(st, asal, tuju) {
    const m = st.maneuver || {}, ke = st.name ? ` ke ${st.name}` : '';
    if (m.type === 'depart') return ['●', `Bertolak dari ${asal}${st.name ? ' melalui ' + st.name : ''}`];
    if (m.type === 'arrive') return ['⚑', `Tiba di ${tuju}`];
    if (m.type === 'roundabout' || m.type === 'rotary') return ['⟳', `Masuk bulatan, ambil susur keluar${m.exit ? ' ke-' + m.exit : ''}${ke}`];
    if (m.type === 'new name' || m.type === 'continue') return [IKON_MOD[m.modifier] || '↑', `Teruskan${st.name ? ' di ' + st.name : ''}`];
    return [IKON_MOD[m.modifier] || '↑', `${ARAH_MOD[m.modifier] || 'Teruskan'}${ke}`];
  }
  // Ikon bagi manuver Google Routes API (navigationInstruction.maneuver)
  function ikonManuver(m = '') {
    if (m === 'DEPART') return '●';
    if (m.startsWith('ROUNDABOUT')) return '⟳';
    if (m.startsWith('UTURN')) return '↶';
    if (m === 'FERRY' || m === 'FERRY_TRAIN') return '⛴';
    if (m.includes('LEFT')) return m.includes('SLIGHT') ? '↖' : '↰';
    if (m.includes('RIGHT')) return m.includes('SLIGHT') ? '↗' : '↱';
    return '↑';
  }
  const jarakTeks = m => m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
  const masaTeks = s => { const m = Math.max(1, Math.round(s / 60)); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} jam ${m % 60} min`; };

  const CSS = `
.lk-grid{display:grid;grid-template-columns:minmax(0,1.75fr) minmax(280px,1fr);background:var(--surface,#fff)}
.lk-peta{position:relative;height:580px;background:#e9eef3;z-index:0;font-family:inherit}
.lk-ralat{height:100%;display:grid;place-items:center;padding:24px;text-align:center;font-size:13px;color:#6b7686}
/* Penanda logo */
.lk-ikon{background:none;border:0}
.lk-pin{--w:var(--lk-c,#13406e);position:relative;width:44px;height:44px;border-radius:50%;background:#fff;border:3px solid var(--w);box-shadow:0 3px 8px rgba(7,28,51,.28),0 0 0 2px rgba(255,255,255,.9);display:grid;place-items:center;transform-origin:50% 100%;transition:transform .18s ease;cursor:pointer}
.lk-pin::after{content:'';position:absolute;left:50%;bottom:-10px;width:0;height:0;border:7px solid transparent;border-top:9px solid var(--w);transform:translateX(-50%)}
.lk-pin img{width:34px;height:34px;object-fit:contain;border-radius:50%}
.lk-ikon:hover .lk-pin,.lk-ikon:focus .lk-pin{transform:scale(1.18)}
.lk-ikon:hover,.lk-ikon:focus{z-index:1000!important}
.lk-pin.pilih{transform:scale(1.25);box-shadow:0 0 0 4px rgba(200,150,42,.55),0 6px 14px rgba(7,28,51,.35)}
.lk-pin.ppd{width:56px;height:56px;border-width:4px;background:#fffdf6}
.lk-pin.ppd img{width:44px;height:44px;border-radius:6px}
.lk-pin.ppd::before{content:'';position:absolute;inset:-10px;border-radius:50%;border:2px solid rgba(200,150,42,.7);animation:lk-denyut 2.4s ease-out infinite}
@keyframes lk-denyut{from{transform:scale(.8);opacity:1}to{transform:scale(1.5);opacity:0}}
@media (prefers-reduced-motion:reduce){.lk-pin.ppd::before{animation:none;opacity:.6}.lk-pin{transition:none}}
.lk-jauh .lk-pin:not(.ppd){transform:scale(.78)}
.lk-jauh .lk-ikon:hover .lk-pin:not(.ppd){transform:scale(1)}
/* Kelompok */
.lk-klus-ikon{background:none;border:0}
.lk-klus{position:relative;width:62px;height:62px;border-radius:50%;background:rgba(255,255,255,.96);border:3px solid #0b2a4a;box-shadow:0 0 0 4px rgba(11,42,74,.18),0 4px 12px rgba(7,28,51,.3);display:grid;place-items:center;color:#fff;cursor:pointer;transition:transform .18s}
.lk-klus:hover{transform:scale(1.08)}
.lk-klus b{position:absolute;right:-6px;top:-6px;min-width:24px;height:24px;padding:0 6px;border-radius:999px;background:#c8962a;color:#fff;font:800 12px/24px inherit;text-align:center;box-shadow:0 0 0 2px #fff}
.lk-klus-logo{display:flex}
.lk-klus-logo img{width:24px;height:24px;object-fit:contain;border-radius:50%;background:#fff;padding:1px;margin-left:-8px;box-shadow:0 0 0 1.5px #0b2a4a}
.lk-klus-logo img:first-child{margin-left:0}
/* Cincin jarak */
.lk-cincin-lbl{background:none;border:0}
.lk-cincin-lbl span{display:inline-block;transform:translate(-50%,-50%);padding:1px 7px;border-radius:999px;background:rgba(255,253,246,.92);border:1px solid rgba(200,150,42,.6);color:#8a6416;font:700 10.5px/16px inherit;white-space:nowrap}
.lk-garis-lbl{background:none;border:0}
.lk-garis-lbl span{display:inline-block;transform:translate(-50%,-50%);padding:2px 8px;border-radius:6px;background:#0b2a4a;color:#fff;font:700 11px/16px inherit;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.25)}
/* Kawalan atas peta */
.lk-legenda{background:rgba(255,255,255,.95);border-radius:10px;box-shadow:0 2px 10px rgba(7,28,51,.18);padding:8px 10px;font:600 11px/1.3 inherit;color:#475467;display:flex;flex-direction:column;gap:5px}
.lk-legenda div{display:flex;align-items:center;gap:7px}
.lk-legenda i{width:12px;height:12px;border-radius:50%;background:#fff;border:3px solid currentColor;box-sizing:border-box}
.lk-legenda .cincin{width:14px;height:0;border:0;border-top:2px dashed #c8962a;border-radius:0;background:none}
.lk-butang{background:#fff;border:0;width:34px;height:34px;display:grid;place-items:center;cursor:pointer;color:#0b2a4a}
.lk-butang:hover{background:#f3f5f8}
.lk-butang svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.leaflet-control-layers{border-radius:10px!important;box-shadow:0 2px 10px rgba(7,28,51,.18)!important;border:0!important;font:600 12px inherit}
.leaflet-bar{border:0!important;box-shadow:0 2px 10px rgba(7,28,51,.18)!important;border-radius:10px!important;overflow:hidden}
/* Popup */
.lk-popup .leaflet-popup-content-wrapper{padding:0;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(7,28,51,.28)}
.lk-popup .leaflet-popup-content{margin:0;width:290px!important}
.lk-popup .leaflet-popup-tip{background:#fff}
.lk-popup a.leaflet-popup-close-button{color:#fff;top:6px;right:6px;font-size:20px}
.lk-pop-kepala{position:relative;height:42px;background:linear-gradient(135deg,var(--lk-c),color-mix(in srgb,var(--lk-c) 55%,#000))}
.lk-pop-kepala::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(135deg,rgba(255,255,255,.07) 0 8px,transparent 8px 16px)}
.lk-pop-logo{position:absolute;left:14px;bottom:-26px;width:54px;height:54px;border-radius:50%;background:#fff;border:3px solid #fff;box-shadow:0 4px 12px rgba(7,28,51,.25);display:grid;place-items:center;z-index:1}
.lk-pop-logo img{width:44px;height:44px;object-fit:contain}
.lk-pop-badan{padding:30px 14px 12px;font-family:inherit;color:#475467;font-size:12px;display:flex;flex-direction:column;gap:6px}
.lk-pop-badan b{font-size:14.5px;line-height:1.25;color:#1a2433}
.lk-pop-tag{display:flex;flex-wrap:wrap;gap:5px}
.lk-pop-tag span{font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:999px;background:#f3f5f8;color:#475467}
.lk-pop-tag span.j{background:color-mix(in srgb,var(--lk-c) 12%,#fff);color:var(--lk-c)}
.lk-pop-tag span.s{background:#fef4e6;color:#b54708}
.lk-pop-jarak{display:flex;align-items:baseline;gap:6px;padding:8px 10px;border-radius:8px;background:#f8fafc}
.lk-pop-jarak strong{font-size:18px;color:#0b2a4a;font-variant-numeric:tabular-nums}
.lk-pop-penuh{font-size:11px;color:#6b7686;margin-top:-3px;line-height:1.35}
.lk-pop-info{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;border-radius:8px;overflow:hidden;background:#eef1f5;border:1px solid #eef1f5}
.lk-pop-info div{background:#fff;padding:6px 8px;display:flex;flex-direction:column;gap:1px;min-width:0}
.lk-pop-info div.dua{grid-column:span 2}
.lk-pop-info span{font-size:9.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#98a2b3}
.lk-pop-info strong{font-size:11.5px;color:#1a2433;font-weight:600;overflow-wrap:anywhere}
.lk-pop-info a{color:#13406e;font-weight:700}
.lk-pop-tag span.g{background:#0b2a4a;color:#fff}
.lk-pop-tag span.o{background:#e7f6ee;color:#067647}
.lk-pop-aksi{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:2px}
.lk-pop-aksi a,.lk-pop-aksi button{display:flex;align-items:center;justify-content:center;gap:5px;height:34px;border-radius:8px;font:700 12px inherit;text-decoration:none!important;cursor:pointer}
.lk-pop-aksi .utama{background:#0b2a4a;color:#fff!important}
.lk-pop-aksi .kedua{background:#fff;color:#0b2a4a!important;border:1px solid #dde3eb}
.lk-pop-aksi button.kedua{background:#fbf3e1;border-color:#e5c066}
/* Panel arah dalam peta */
.lk-arah{position:absolute;top:12px;left:12px;z-index:900;width:310px;max-width:calc(100% - 76px);max-height:calc(100% - 24px);display:flex;flex-direction:column;background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(7,28,51,.28);overflow:hidden;font-family:inherit}
.lk-arah[hidden]{display:none}
.lk-ada-arah .lk-legenda{display:none}
/* Google Maps: penanda, label, tetingkap maklumat dan kawalan */
.lk-g-ikon{padding-bottom:10px}
.lk-g-lbl span{transform:translateY(50%)}
.lk-gpop{width:290px}
.gm-style .gm-style-iw-c{padding:0!important;border-radius:14px!important;box-shadow:0 10px 30px rgba(7,28,51,.28)!important}
.gm-style .gm-style-iw-d{overflow:auto!important;padding:0!important}
.lk-pop-x{position:absolute;top:7px;right:8px;z-index:2;width:28px;height:28px;border:0;border-radius:50%;background:rgba(255,255,255,.18);color:#fff;font-size:18px;line-height:1;cursor:pointer}
.lk-pop-x:hover{background:rgba(255,255,255,.32)}
.lk-g-kawalan{margin:0 10px 10px 0;background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,.3);overflow:hidden}
.lk-g-kawalan .lk-butang{width:40px;height:40px}
.lk-g-legenda{margin:0 0 14px 10px}
.lk-arah-k{display:flex;align-items:center;gap:10px;padding:10px 12px;background:linear-gradient(135deg,var(--lk-c),color-mix(in srgb,var(--lk-c) 55%,#000));color:#fff;flex-shrink:0}
.lk-arah-k img{width:38px;height:38px;border-radius:50%;background:#fff;padding:3px;object-fit:contain;flex-shrink:0}
.lk-arah-k div{min-width:0}
.lk-arah-k small{display:block;font-size:10.5px;opacity:.85}
.lk-arah-k b{display:block;font-size:13px;line-height:1.25}
.lk-arah-x{margin-left:auto;flex-shrink:0;background:rgba(255,255,255,.16);border:0;color:#fff;width:30px;height:30px;border-radius:50%;font-size:18px;line-height:1;cursor:pointer}
.lk-arah-x:hover{background:rgba(255,255,255,.3)}
.lk-arah-b{padding:12px;overflow-y:auto;font-size:12px;color:#475467;display:flex;flex-direction:column;gap:10px}
.lk-arah-muat{display:flex;align-items:center;gap:8px}
.lk-pusing{width:16px;height:16px;border-radius:50%;border:2px solid #dde3eb;border-top-color:#0b2a4a;animation:lk-pusing .8s linear infinite}
@keyframes lk-pusing{to{transform:rotate(360deg)}}
.lk-arah-angka{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.lk-arah-angka div{background:#f3f5f8;border-radius:10px;padding:8px 10px}
.lk-arah-angka strong{display:block;font-size:19px;line-height:1.2;color:#0b2a4a;font-variant-numeric:tabular-nums}
.lk-arah-angka span{font-size:10.5px;color:#6b7686}
.lk-arah-amaran{background:#fef4e6;color:#7a3504;border:1px solid #f6d9ae;border-radius:10px;padding:10px;line-height:1.5}
.lk-arah-amaran b{display:block;margin-bottom:3px;color:#b54708}
.lk-arah-amaran p{margin:0 0 8px}
.lk-arah-paksa{border:1px solid #b54708;background:#fff;color:#b54708;border-radius:8px;height:32px;padding:0 12px;font:700 12px inherit;cursor:pointer}
.lk-arah-langkah summary{cursor:pointer;font-weight:700;color:#0b2a4a;padding:4px 0}
.lk-arah-langkah ol{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-direction:column}
.lk-arah-langkah li{display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-top:1px solid #eef1f5}
.lk-arah-langkah li i{width:22px;height:22px;flex-shrink:0;border-radius:50%;background:#e6eef7;color:#0b2a4a;font-style:normal;font-weight:800;display:grid;place-items:center;font-size:12px}
.lk-arah-langkah li span{flex:1;line-height:1.4;color:#1a2433}
.lk-arah-langkah li em{font-style:normal;color:#6b7686;white-space:nowrap;font-variant-numeric:tabular-nums}
.lk-arah-kaki{font-size:10.5px;color:#98a2b3}
.lk-arah-dari{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f8fafc;border-bottom:1px solid #eef1f5;flex-shrink:0}
.lk-arah-dari label{font-size:11px;font-weight:700;color:#6b7686;text-transform:uppercase;letter-spacing:.05em}
.lk-arah-dari select{flex:1;min-width:0;height:32px;border:1px solid #dde3eb;border-radius:8px;padding:0 6px;font:600 12px inherit;color:#1a2433;background:#fff}
.lk-arah-tukar{width:32px;height:32px;flex-shrink:0;border:1px solid #dde3eb;background:#fff;border-radius:8px;font-size:16px;color:#0b2a4a;cursor:pointer}
.lk-arah-tukar:hover{background:#e6eef7}
.lk-mod{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.lk-mod button{display:flex;align-items:center;gap:8px;padding:7px 9px;border:1.5px solid #dde3eb;border-radius:10px;background:#fff;cursor:pointer;text-align:left;font:inherit;color:#475467}
.lk-mod button svg{width:20px;height:20px;flex-shrink:0;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.lk-mod button span{display:flex;flex-direction:column;font-size:12px;font-weight:700;line-height:1.2}
.lk-mod button small{font-size:10.5px;font-weight:600;color:#98a2b3}
.lk-mod button.on{border-color:#0b2a4a;background:#e6eef7;color:#0b2a4a}
.lk-mod button.on[data-arah-mod="sungai"]{border-color:#0e7490;background:#e0f4f7;color:#0e7490}
.lk-mod button:disabled{opacity:.45;cursor:not-allowed}
.lk-arah-angka.sungai strong{color:#0e7490}
.lk-arah-langkah li i.s{background:#e0f4f7;color:#0e7490}
.lk-arah-paksa.sungai{border-color:#0e7490;color:#0e7490;margin-right:4px}
@media (max-width:600px){.lk-arah{max-width:calc(100% - 24px);max-height:55%}}
/* Panel sisi */
.lk-sisi{display:flex;flex-direction:column;border-left:1px solid var(--border,#dde3eb);min-width:0;max-height:580px}
.lk-ringkas{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px 12px 4px}
.lk-ringkas div{border-radius:10px;padding:8px 10px;background:color-mix(in srgb,var(--lk-c) 8%,#fff);border:1px solid color-mix(in srgb,var(--lk-c) 22%,#fff)}
.lk-ringkas b{display:block;font-size:20px;font-weight:800;line-height:1.1;color:var(--lk-c);font-variant-numeric:tabular-nums}
.lk-ringkas span{font-size:10.5px;font-weight:600;color:#6b7686}
.lk-cari{margin:10px 12px 8px;height:38px;padding:0 12px 0 34px;border:1px solid var(--border,#dde3eb);border-radius:9px;font:inherit;font-size:13px;color:var(--t1,#1a2433);background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7686' stroke-width='2.2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cline x1='21' y1='21' x2='16.5' y2='16.5'/%3E%3C/svg%3E") no-repeat 11px 50%/15px}
.lk-cari:focus{outline:0;border-color:#c8962a;box-shadow:0 0 0 3px rgba(200,150,42,.22)}
.lk-tapis{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 10px;border-bottom:1px solid var(--border,#dde3eb)}
.lk-tapis button{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 11px;border-radius:999px;border:1px solid var(--border,#dde3eb);background:#fff;font:600 12px inherit;color:#475467;cursor:pointer}
.lk-tapis button.on{border-color:#0b2a4a;background:#0b2a4a;color:#fff}
.lk-tapis button i{width:9px;height:9px;border-radius:50%}
.lk-tapis2{display:flex;gap:8px;align-items:center;padding:8px 12px 10px;border-bottom:1px solid var(--border,#dde3eb);flex-wrap:wrap}
.lk-tapis2 select{height:32px;border:1px solid var(--border,#dde3eb);border-radius:8px;padding:0 8px;font:600 12px inherit;color:#475467;background:#fff;flex:1;min-width:150px}
.lk-tapis2 label{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#475467;cursor:pointer;white-space:nowrap}
.lk-tapis2 input{width:16px;height:16px;accent-color:#0b2a4a}
.lk-senarai{list-style:none;margin:0;padding:4px 0;overflow-y:auto;flex:1}
.lk-senarai button{width:100%;display:flex;align-items:center;gap:11px;padding:8px 14px;border:0;background:none;text-align:left;cursor:pointer;font:inherit;color:#1a2433;border-left:3px solid transparent}
.lk-senarai button:hover,.lk-senarai button:focus-visible{background:#f8fafc;outline:0}
.lk-senarai button.pilih{background:#fbf3e1;border-left-color:#c8962a}
.lk-senarai .lg{width:36px;height:36px;flex-shrink:0;border-radius:50%;background:#fff;border:2px solid var(--lk-c);display:grid;place-items:center}
.lk-senarai .lg img{width:28px;height:28px;object-fit:contain}
.lk-senarai .tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.lk-senarai .tx b{font-size:12.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lk-senarai small{font-size:11px;color:#6b7686}
.lk-senarai small em{font-style:normal;color:#b54708;font-weight:600}
.lk-bar{height:4px;border-radius:2px;background:#eef1f5;overflow:hidden}
.lk-bar i{display:block;height:100%;border-radius:2px;background:linear-gradient(90deg,#e5c066,#c8962a)}
.lk-km{display:flex;flex-direction:column;align-items:flex-end;gap:1px;font-size:12px;font-weight:700;color:#0b2a4a;white-space:nowrap;font-variant-numeric:tabular-nums}
.lk-km small{display:inline-flex;align-items:center;gap:3px;font-size:10.5px;font-weight:600;color:#6b7686}
.lk-km small svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.lk-km small.sungai{color:#0e7490}
.lk-km small.jauh{color:#b54708}
.lk-bar.sungai i{background:linear-gradient(90deg,#67c3d3,#0e7490)}
.lk-bar.jauh i{background:repeating-linear-gradient(90deg,#f2b05e 0 6px,#b54708 6px 9px)}
.lk-pop-jarak small{font-size:10.5px;color:#98a2b3}
.lk-kosong{padding:18px 14px;font-size:12.5px;color:#6b7686;text-align:center}
.lk-nota{padding:9px 14px;border-top:1px solid var(--border,#dde3eb);font-size:11px;color:#6b7686;background:#f8fafc}
/* Skrin sederhana: peta selebar penuh, senarai di bawah dalam lajur */
@media (max-width:1100px){
  .lk-grid{grid-template-columns:1fr}
  .lk-sisi{border-left:0;border-top:1px solid var(--border,#dde3eb);max-height:none}
  .lk-senarai{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));max-height:420px;align-content:start}
  .lk-ringkas{grid-template-columns:repeat(3,minmax(0,160px))}
}
@media (max-width:600px){.lk-peta{height:400px}.lk-ringkas{grid-template-columns:repeat(3,1fr)}.lk-senarai{grid-template-columns:1fr}}`;

  function pasangCss() {
    if (document.getElementById('lk-css')) return;
    const s = document.createElement('style'); s.id = 'lk-css'; s.textContent = CSS; document.head.appendChild(s);
  }

  const htmlPin = l => `<div class="lk-pin${l.jenis === 'PPD' ? ' ppd' : ''}" style="--lk-c:${JENIS[l.jenis].warna}" data-lkp="${l.id}"><img src="${esc(l.logo)}" alt="" loading="lazy"></div>`;
  const htmlKelompok = ls => `<div class="lk-klus"><div class="lk-klus-logo">${ls.slice(0, 3).map(l => `<img src="${esc(l.logo)}" alt="">`).join('')}</div><b>${ls.length}</b></div>`;
  const htmlLegenda = () => ['SMK', 'SJKC', 'SK', 'PPD'].map(t => `<div style="color:${JENIS[t].warna}"><i></i><span style="color:#475467">${JENIS[t].pendek === 'PPD' ? 'PPD Dalat' : JENIS[t].pendek}</span></div>`).join('')
    + '<div><i class="cincin"></i><span>Jarak dari PPD</span></div>';
  const BUTANG_SEMULA = '<button type="button" class="lk-butang" title="Papar seluruh daerah" aria-label="Papar seluruh daerah"><svg viewBox="0 0 24 24"><path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/></svg></button>';

  function popup(l, butangTutup) {
    const j = JENIS[l.jenis], ppd = l.jenis === 'PPD';
    return `<div style="--lk-c:${j.warna}">
      <div class="lk-pop-kepala"><div class="lk-pop-logo"><img src="${esc(l.logo)}" alt="Logo ${esc(l.nama)}"></div>${butangTutup ? '<button type="button" class="lk-pop-x" data-lk-pop-tutup aria-label="Tutup">×</button>' : ''}</div>
      <div class="lk-pop-badan">
        <b>${esc(l.nama)}</b>
        ${l.namaPenuh ? `<div class="lk-pop-penuh">${esc(l.namaPenuh)}</div>` : ''}
        <div class="lk-pop-tag">${ppd ? `<span class="j">${esc(j.label)}</span><span>96300 Dalat, Sarawak</span>`
          : `<span class="j">${esc(l.jenisSekolah || j.pendek)}</span><span>${esc(l.kod)}</span>${l.gred ? `<span class="g">Gred ${esc(l.gred)}</span>` : ''}${l.status ? `<span class="o">● ${esc(l.status)}</span>` : ''}`}</div>
        ${ppd ? '' : `<div class="lk-pop-jarak"><strong>${l.laluan.km.toFixed(1)} km</strong><span>dari PPD Dalat melalui ${teksMod(l)}${l.laluan.minit ? ` · ±${masaTeks(l.laluan.minit * 60)}` : ''}<br><small>garis lurus ${l.jarak.toFixed(1)} km</small></span></div>`}
        ${l.namaPenuh ? `<div class="lk-pop-info">
          <div class="dua"><span>Telefon</span><strong>${l.telefon ? `<a href="tel:${esc(l.telefon.replace(/\D/g, ''))}">${esc(l.telefon)}</a>` : 'Tiada dalam EMIS'}</strong></div>
          <div><span>Peringkat</span><strong>${esc(l.peringkat)}</strong></div>
          <div><span>Lokasi</span><strong>${esc(l.lokasi)}</strong></div>
          <div><span>Sesi</span><strong>${esc(l.sesi)}</strong></div>
          <div><span>Kuarters</span><strong>${esc(l.kuarters)}</strong></div>
          <div class="dua"><span>Bantuan</span><strong>${esc(l.bantuan)}</strong></div>
          <div><span>Parlimen</span><strong>${esc(l.parlimen)}</strong></div>
          <div class="dua"><span>Asrama</span><strong>${esc(l.asrama)}</strong></div>
          <div><span>DUN</span><strong>${esc(l.dun)}</strong></div>
        </div>` : ''}
        <div class="lk-pop-aksi">
          <a class="utama" href="${esc(l.peta)}" target="_blank" rel="noopener">Google Maps ↗</a>
          <button type="button" class="kedua" data-lk-arah="${l.id}">Arah ke sini</button>
        </div>
      </div>
    </div>`;
  }

  /* ---- Enjin peta ----
     Kod paparan (senarai, penapis, arah, sungai) memanggil antara muka yang sama; dua pelaksanaan:
     enjinLeaflet (Esri/OpenStreetMap, percuma) dan enjinGoogle (Google Maps JavaScript API, apabila kunci tersedia).
     Antara muka: setPapar(ls), buka(l), tutupPopup(), garis(titik, gaya) → {buang}, label(titik, html, kelas) → {buang},
     muat(titik[], {kiri, atas, kanan, bawah, maxZoom, animasi}), overlay(div), onZum(fn), sumber.
     Pengendali h: bukaPopup(l, elPopup), tutupPopup(l), semula(), gagal(). */
  const kePt = p => Array.isArray(p) ? p : [p.lat, p.lng];

  function enjinLeaflet(petaEl, h) {
    // Roda tetikus terus zum peta apabila kursor di atas peta; wheelPxPerZoomLevel lebih tinggi = zum lebih licin
    const peta = L.map(petaEl, { scrollWheelZoom: true, wheelPxPerZoomLevel: 90, wheelDebounceTime: 30, zoomControl: false, zoomSnap: .25, zoomDelta: .5 });
    const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
    const topo = L.tileLayer(ESRI + 'World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, attribution: 'Peta &copy; Esri, HERE, Garmin, &copy; penyumbang OpenStreetMap',
    }).addTo(peta);
    const satelit = L.layerGroup([
      L.tileLayer(ESRI + 'World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Imej &copy; Esri, Maxar, Earthstar Geographics' }),
      L.tileLayer(ESRI + 'Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }),
    ]);
    const jalan = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">penyumbang OpenStreetMap</a>',
    });
    L.control.layers({ 'Topografi': topo, 'Satelit': satelit, 'Peta jalan': jalan }, null, { position: 'topright' }).addTo(peta);
    L.control.zoom({ position: 'bottomright', zoomInTitle: 'Zum masuk', zoomOutTitle: 'Zum keluar' }).addTo(peta);
    const Kawalan = L.Control.extend({
      onAdd() {
        const d = L.DomUtil.create('div', this.options.kelas);
        d.innerHTML = this.options.html;
        L.DomEvent.disableClickPropagation(d);
        this.options.ikat?.(d);
        return d;
      },
    });
    new Kawalan({ position: 'bottomright', kelas: 'leaflet-bar', html: BUTANG_SEMULA, ikat: d => d.firstChild.addEventListener('click', () => h.semula()) }).addTo(peta);
    new Kawalan({ position: 'bottomleft', kelas: 'lk-legenda', html: htmlLegenda() }).addTo(peta);

    // Cincin jarak 10/20/30 km dari PPD
    CINCIN_KM.forEach(km => {
      L.circle([PPD.lat, PPD.lng], { radius: km * 1000, color: '#c8962a', weight: 1.5, opacity: .7, dashArray: '6 7', fill: km === 10, fillColor: '#e5c066', fillOpacity: .06, interactive: false }).addTo(peta);
      L.marker([PPD.lat + km / 111.32, PPD.lng], { interactive: false, keyboard: false, icon: L.divIcon({ className: 'lk-cincin-lbl', html: `<span>${km} km</span>`, iconSize: [0, 0] }) }).addTo(peta);
    });

    const penanda = {};
    LOKASI.forEach(l => {
      const ppd = l.jenis === 'PPD';
      const m = L.marker([l.lat, l.lng], {
        lk: l, title: l.nama, alt: l.nama, riseOnHover: true, zIndexOffset: ppd ? 1000 : 0,
        icon: L.divIcon({ className: 'lk-ikon', html: htmlPin(l), iconSize: ppd ? [62, 72] : [50, 60], iconAnchor: ppd ? [31, 70] : [25, 58], popupAnchor: [0, ppd ? -66 : -54], tooltipAnchor: [0, ppd ? -66 : -54] }),
      }).bindPopup(popup(l, false), { className: 'lk-popup', maxWidth: 300, minWidth: 290, maxHeight: Math.max(280, petaEl.clientHeight - 90), autoPanPadding: [20, 20] });
      m.on('popupopen', e => h.bukaPopup(l, e.popup.getElement()));
      m.on('popupclose', () => h.tutupPopup(l));
      penanda[l.id] = m;
    });
    // Kelompok untuk kawasan pekan Dalat yang padat; PPD sentiasa di luar kelompok
    const lapisan = L.markerClusterGroup ? L.markerClusterGroup({
      maxClusterRadius: 22, showCoverageOnHover: false, spiderfyOnMaxZoom: true, disableClusteringAtZoom: 14,
      iconCreateFunction: k => L.divIcon({ className: 'lk-klus-ikon', html: htmlKelompok(k.getAllChildMarkers().map(m => m.options.lk)), iconSize: [62, 62] }),
    }) : L.layerGroup();
    lapisan.addTo(peta);
    penanda[PPD.id].addTo(peta);

    return {
      sumber: 'osm',
      setPapar(ls) { lapisan.clearLayers(); ls.forEach(l => lapisan.addLayer(penanda[l.id])); },
      buka(l) {
        const m = penanda[l.id], b = () => m.openPopup();
        if (lapisan.zoomToShowLayer && l.jenis !== 'PPD') lapisan.zoomToShowLayer(m, b);
        else { peta.flyTo([l.lat, l.lng], 14, { duration: .6 }); peta.once('moveend', b); }
      },
      tutupPopup() { peta.closePopup(); },
      garis(titik, g) {
        const x = L.polyline(titik.map(kePt), { color: g.warna, weight: g.tebal, opacity: g.legap ?? 1, lineJoin: 'round', lineCap: 'round',
          dashArray: g.putus === 'titik' ? '2 7' : g.putus === 'sengkang' ? '10 8' : null, interactive: false }).addTo(peta);
        return { buang: () => x.remove() };
      },
      label(p, html, kelas) {
        const x = L.marker(kePt(p), { interactive: false, keyboard: false, icon: L.divIcon({ className: kelas, html, iconSize: [0, 0] }) }).addTo(peta);
        return { buang: () => x.remove() };
      },
      muat(titik, o = {}) {
        const b = L.latLngBounds(titik.map(kePt));
        const opt = { paddingTopLeft: [o.kiri ?? 30, o.atas ?? 30], paddingBottomRight: [o.kanan ?? 30, o.bawah ?? 30], maxZoom: o.maxZoom ?? 18 };
        if (o.animasi) peta.flyToBounds(b, { ...opt, duration: .7 }); else peta.fitBounds(b, opt);
      },
      overlay(div) { petaEl.appendChild(div); L.DomEvent.disableClickPropagation(div); L.DomEvent.disableScrollPropagation(div); },
      onZum(fn) { peta.on('zoomend', () => fn(peta.getZoom())); fn(peta.getZoom()); },
      musnah() { peta.remove(); },
    };
  }

  // Muat Google Maps JavaScript API (sekali sahaja) dan pengelompok penanda rasmi Google
  let janjiGoogle = null;
  function muatGoogle(kunci) {
    if (window.google?.maps?.marker) return Promise.resolve();
    return janjiGoogle || (janjiGoogle = new Promise((ok, gagal) => {
      window.__lkGoogleSedia = () => ok();
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(kunci)}&v=weekly&libraries=marker&language=ms&region=MY&loading=async&callback=__lkGoogleSedia`;
      s.async = true;
      s.onerror = () => { janjiGoogle = null; gagal(new Error('Skrip Google Maps gagal dimuatkan')); };
      document.head.appendChild(s);
      setTimeout(() => gagal(new Error('Google Maps lambat dimuatkan')), 15000);
    }));
  }
  function muatPengelompok() {
    if (window.markerClusterer) return Promise.resolve(true);
    return new Promise(ok => {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/@googlemaps/markerclusterer@2.5.3/dist/index.min.js';
      s.onload = () => ok(!!window.markerClusterer); s.onerror = () => ok(false);
      document.head.appendChild(s);
    });
  }

  async function enjinGoogle(petaEl, konfig, h) {
    await muatGoogle(konfig.kunciPeta);
    const adaKlus = await muatPengelompok();
    const g = google.maps, P = g.ControlPosition;
    const { AdvancedMarkerElement } = g.marker;
    // Kunci ditolak (sekatan domain, API tidak dihidupkan): Google memanggil gm_authFailure — kembali ke peta percuma
    window.gm_authFailure = () => h.gagal('Kunci Google Maps ditolak');
    const peta = new g.Map(petaEl, {
      mapId: konfig.mapId, center: { lat: PPD.lat, lng: PPD.lng }, zoom: 11,
      gestureHandling: 'greedy', clickableIcons: false, fullscreenControl: false,
      mapTypeControl: true, mapTypeControlOptions: { position: P.TOP_RIGHT, style: g.MapTypeControlStyle.DROPDOWN_MENU },
      zoomControl: true, zoomControlOptions: { position: P.RIGHT_BOTTOM },
      streetViewControl: true, streetViewControlOptions: { position: P.RIGHT_BOTTOM },
    });
    const kawalan = (html, kelas, posisi, ikat) => { const d = document.createElement('div'); d.className = kelas; d.innerHTML = html; ikat?.(d); peta.controls[posisi].push(d); };
    kawalan(BUTANG_SEMULA, 'lk-g-kawalan', P.RIGHT_BOTTOM, d => d.firstChild.addEventListener('click', () => h.semula()));
    kawalan(htmlLegenda(), 'lk-legenda lk-g-legenda', P.LEFT_BOTTOM);

    const kandungan = (html, kelas) => { const d = document.createElement('div'); d.className = kelas; d.innerHTML = html; return d; };
    const label = (p, html, kelas) => {
      const [lat, lng] = kePt(p);
      const m = new AdvancedMarkerElement({ map: peta, position: { lat, lng }, content: kandungan(html, kelas + ' lk-g-lbl'), gmpClickable: false, zIndex: 50 });
      return { buang: () => { m.map = null; } };
    };
    CINCIN_KM.forEach(km => {
      new g.Circle({ map: peta, center: { lat: PPD.lat, lng: PPD.lng }, radius: km * 1000, clickable: false,
        strokeColor: '#c8962a', strokeOpacity: .7, strokeWeight: 1.5, fillColor: '#e5c066', fillOpacity: km === 10 ? .06 : 0 });
      label([PPD.lat + km / 111.32, PPD.lng], `<span>${km} km</span>`, 'lk-cincin-lbl');
    });

    // Satu tetingkap maklumat dikongsi; pengepala Google disembunyikan dan diganti butang tutup sendiri
    const iw = new g.InfoWindow({ maxWidth: 310, headerDisabled: true, disableAutoPan: false });
    let bukaL = null;
    const tutup = () => { iw.close(); if (bukaL) { const l = bukaL; bukaL = null; h.tutupPopup(l); } };
    const bukaPop = l => {
      if (bukaL && bukaL !== l) { const lama = bukaL; bukaL = null; h.tutupPopup(lama); }
      const d = kandungan(popup(l, true), 'lk-gpop');
      d.querySelector('[data-lk-pop-tutup]').addEventListener('click', tutup);
      iw.setContent(d);
      iw.open({ map: peta, anchor: penanda[l.id] });
      bukaL = l;
      h.bukaPopup(l, d);
    };
    peta.addListener('click', tutup);

    const penanda = {};
    LOKASI.forEach(l => {
      const m = new AdvancedMarkerElement({ position: { lat: l.lat, lng: l.lng }, content: kandungan(htmlPin(l), 'lk-ikon lk-g-ikon'), title: l.nama, zIndex: l.jenis === 'PPD' ? 1000 : 10 });
      m.lk = l;
      m.addListener('click', () => bukaPop(l));
      penanda[l.id] = m;
    });
    penanda[PPD.id].map = peta;
    const klus = adaKlus ? new window.markerClusterer.MarkerClusterer({
      map: peta, markers: [],
      algorithm: new window.markerClusterer.SuperClusterAlgorithm({ radius: 50, maxZoom: 13 }),
      renderer: { render: ({ count, position, markers }) => new AdvancedMarkerElement({ position, zIndex: 500 + count, content: kandungan(htmlKelompok(markers.map(m => m.lk)), 'lk-klus-ikon') }) },
    }) : null;

    const sekali = (nama, fn) => g.event.addListenerOnce(peta, nama, fn);
    return {
      sumber: 'google',
      setPapar(ls) {
        const ada = new Set(ls.map(l => l.id));
        const sk = LOKASI.filter(l => l.jenis !== 'PPD');
        if (klus) { klus.clearMarkers(); klus.addMarkers(ls.map(l => penanda[l.id])); }
        else sk.forEach(l => { penanda[l.id].map = ada.has(l.id) ? peta : null; });
      },
      buka(l) {
        peta.panTo({ lat: l.lat, lng: l.lng });
        if (peta.getZoom() < 15) peta.setZoom(15); // melepasi maxZoom kelompok supaya penanda kelihatan
        sekali('idle', () => bukaPop(l));
      },
      tutupPopup: tutup,
      garis(titik, gy) {
        const path = titik.map(p => { const [lat, lng] = kePt(p); return { lat, lng }; });
        const o = { map: peta, path, clickable: false, strokeColor: gy.warna, strokeWeight: gy.tebal, strokeOpacity: gy.legap ?? 1, zIndex: gy.z ?? 10 };
        if (gy.putus) {
          o.strokeOpacity = 0;
          o.icons = [{
            icon: gy.putus === 'titik'
              ? { path: g.SymbolPath.CIRCLE, scale: Math.max(1.2, gy.tebal / 2), fillColor: gy.warna, fillOpacity: 1, strokeOpacity: 0 }
              : { path: 'M 0,-1 0,1', strokeColor: gy.warna, strokeOpacity: 1, scale: gy.tebal },
            offset: '0', repeat: gy.putus === 'titik' ? '9px' : '16px',
          }];
        }
        const x = new g.Polyline(o);
        return { buang: () => x.setMap(null) };
      },
      label,
      muat(titik, o = {}) {
        const b = new g.LatLngBounds();
        titik.forEach(p => { const [lat, lng] = kePt(p); b.extend({ lat, lng }); });
        peta.fitBounds(b, { left: o.kiri ?? 30, top: o.atas ?? 30, right: o.kanan ?? 30, bottom: o.bawah ?? 30 });
        if (o.maxZoom) {
          // Jika peta tidak bergerak, 'idle' mungkin tidak berlaku; buang pendengar supaya ia tidak menghadkan zum pengguna kemudian
          const pdg = sekali('idle', () => { clearTimeout(t); if (peta.getZoom() > o.maxZoom) peta.setZoom(o.maxZoom); });
          const t = setTimeout(() => g.event.removeListener(pdg), 2000);
        }
      },
      overlay(div) { petaEl.appendChild(div); },
      onZum(fn) { peta.addListener('zoom_changed', () => fn(peta.getZoom())); fn(peta.getZoom()); },
      musnah() { window.gm_authFailure = null; klus?.clearMarkers(); },
    };
  }

  // Pasang peta + panel sisi pada elemen hos. Google Maps digunakan jika pelayan menyediakan kunci (/api/peta/konfig);
  // jika tidak, atau kunci ditolak, Leaflet (window.L) digunakan.
  function pasang(hos) {
    const el = typeof hos === 'string' ? document.querySelector(hos) : hos;
    if (!el) return;
    pasangCss();
    const sekolah = LOKASI.filter(l => l.jenis !== 'PPD');
    const bil = t => sekolah.filter(l => l.jenis === t).length;
    const purata = sekolah.reduce((a, l) => a + l.laluan.km, 0) / sekolah.length;
    const terjauh = sekolah.reduce((a, l) => l.laluan.km > a.laluan.km ? l : a);
    el.innerHTML = `<div class="lk-grid">
      <div class="lk-peta" id="lk-peta" role="region" aria-label="Peta lokasi sekolah Daerah Dalat"></div>
      <div class="lk-sisi">
        <div class="lk-ringkas">
          <div style="--lk-c:#0b2a4a"><b>${sekolah.length}</b><span>sekolah seliaan</span></div>
          <div style="--lk-c:#c8962a"><b>${purata.toFixed(1)}</b><span>km purata laluan dari PPD</span></div>
          <div style="--lk-c:#b42318" title="${esc(terjauh.nama)} (${esc(teksMod(terjauh))})"><b>${terjauh.laluan.km.toFixed(1)}</b><span>km paling jauh</span></div>
        </div>
        <input type="search" class="lk-cari" id="lk-cari" placeholder="Cari nama atau kod sekolah…" aria-label="Cari sekolah">
        <div class="lk-tapis" role="group" aria-label="Tapis jenis sekolah">
          <button type="button" data-lk-jenis="" class="on">Semua ${sekolah.length}</button>
          ${['SMK', 'SJKC', 'SK'].map(t => `<button type="button" data-lk-jenis="${t}"><i style="background:${JENIS[t].warna}"></i>${JENIS[t].pendek} ${bil(t)}</button>`).join('')}
        </div>
        <div class="lk-tapis2">
          <select id="lk-kawasan" aria-label="Tapis mengikut Parlimen atau DUN">
            <option value="">Semua Parlimen &amp; DUN</option>
            ${[...new Set(sekolah.map(l => l.parlimen).filter(Boolean))].sort().map(pr => `<optgroup label="Parlimen ${esc(pr)}">
              <option value="P:${esc(pr)}">Semua dalam P. ${esc(pr)} (${sekolah.filter(l => l.parlimen === pr).length})</option>
              ${[...new Set(sekolah.filter(l => l.parlimen === pr).map(l => l.dun))].sort().map(d => `<option value="D:${esc(d)}">DUN ${esc(d)} (${sekolah.filter(l => l.dun === d).length})</option>`).join('')}
            </optgroup>`).join('')}
          </select>
          <label><input type="checkbox" id="lk-asrama"> Ada asrama</label>
        </div>
        <ul class="lk-senarai" id="lk-senarai"></ul>
      </div>
    </div>
    <div class="lk-nota" id="lk-nota"></div>`;

    const senaraiEl = el.querySelector('#lk-senarai'), cariEl = el.querySelector('#lk-cari'), petaEl = el.querySelector('#lk-peta');
    const kawasanEl = el.querySelector('#lk-kawasan'), asramaEl = el.querySelector('#lk-asrama');
    const notaEl = el.querySelector('#lk-nota');
    const NOTA = 'Lokasi dan logo: Sektor Perancangan PPD Dalat. Maklumat sekolah: EMIS Online (8 Nov 2026). Jarak dalam senarai ialah jarak laluan dari PPD Dalat: jalan raya, atau sungai bagi sekolah tanpa jalan raya (anggaran bot 25 km/j). Gunakan roda tetikus di atas peta untuk zum.';
    notaEl.textContent = NOTA;
    let jenis = '', pilihId = null;
    let E = null, laluanGoogle = false, googleGagal = false, garis = null;
    // Panel arah dalam peta
    const arahEl = document.createElement('div');
    arahEl.className = 'lk-arah'; arahEl.hidden = true;
    arahEl.setAttribute('role', 'region'); arahEl.setAttribute('aria-label', 'Arah perjalanan');
    let laluan = null, laluanId = null;
    const cacheLaluan = {};
    arahEl.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return;
      const tuju = cariL(laluanId);
      if (t.matches('[data-arah-tutup]')) tutupArah();
      else if (t.dataset.arahMod) tunjukArah(tuju, { mod: t.dataset.arahMod });
      else if (t.matches('[data-arah-paksa]')) tunjukArah(tuju, { mod: 'jalan', paksa: true });
      else if (t.matches('[data-arah-tukar]')) { const lama = asalId; asalId = laluanId; tunjukArah(cariL(lama)); }
    });
    arahEl.addEventListener('change', e => {
      if (e.target.id === 'lk-arah-asal') { asalId = e.target.value; tunjukArah(cariL(laluanId)); }
    });

    const h = {
      bukaPopup(l, elPop) {
        pilih(l.id, false);
        elPop?.querySelector('[data-lk-arah]')?.addEventListener('click', () => tunjukArah(l));
      },
      tutupPopup(l) { if (pilihId === l.id) pilih(null, false); },
      semula() { E.tutupPopup(); paparDaerah(); },
      gagal(sebab) {
        // Kunci Google ditolak selepas peta dibina: bina semula dengan peta percuma
        console.warn('Peta Google tidak tersedia:', sebab);
        googleGagal = true; // jika berlaku sebelum enjin siap, mulaPeta() akan beralih ke Leaflet
        if (E?.sumber !== 'google' || !window.L) return;
        tutupArah(); E.musnah(); E = null; laluanGoogle = false;
        petaEl.innerHTML = ''; petaEl.className = 'lk-peta';
        E = enjinLeaflet(petaEl, h); siapkan();
      },
    };

    function siapkan() {
      E.overlay(arahEl);
      lukis();
      paparDaerah();
      E.onZum(z => petaEl.classList.toggle('lk-jauh', z < 12));
      notaEl.textContent = NOTA + (E.sumber === 'google' ? ' Peta dan arah memandu: Google Maps.' : '');
    }

    async function mulaPeta() {
      let konfig = {};
      try { konfig = await (await fetch('/api/peta/konfig')).json(); } catch {}
      if (konfig.kunciPeta) {
        try {
          E = await enjinGoogle(petaEl, konfig, h); laluanGoogle = !!konfig.laluan;
          if (googleGagal) throw new Error('Kunci Google Maps ditolak');
        }
        catch (e) { console.warn('Peta Google tidak tersedia:', e.message); E?.musnah?.(); E = null; laluanGoogle = false; petaEl.innerHTML = ''; petaEl.className = 'lk-peta'; }
      }
      if (!E && window.L) E = enjinLeaflet(petaEl, h);
      if (!E) { petaEl.innerHTML = '<div class="lk-ralat">Peta tidak dapat dimuatkan. Semak sambungan internet. Senarai sekolah dan pautan Google Maps masih boleh digunakan.</div>'; return; }
      siapkan();
    }

    function paparDaerah() {
      E?.muat(LOKASI, { kiri: 30, atas: 60, kanan: 30, bawah: 30 });
    }

    // ---- Arah dari mana-mana tempat ke mana-mana tempat: jalan raya (OSRM) atau sungai (graf PPDSungai)
    let asalId = PPD.id;
    const cariL = id => LOKASI.find(x => x.id === id);
    const pendek = l => l.jenis === 'PPD' ? 'PPD Dalat' : l.nama;
    // Laluan jalan dianggap munasabah jika kedua-dua hujung dekat jalan dan tidak melencong terlalu jauh.
    // Ambang disemak dengan arah memandu Google Maps (Nov 2026): SK Kebuaw/Sg Ilas ~1–1.4 km dari hujung jalan
    // tetapi laluannya sah; laluan 150–230 km melalui Sibu (Sg Pinang, Baoh Ulu, Batang Igan) ditandakan.
    const SNAP_MAKS_M = 1500;
    const jalanMunasabah = (j, A, B) => { const g = jarakKm(A, B); return j.snapA <= SNAP_MAKS_M && j.snapB <= SNAP_MAKS_M && j.km <= Math.max(4 * g, g + 10); };
    // Hasil dinormalkan: { km, saat, saatTanpaTrafik?, titik, langkah: [{ikon, teks, m}], snapA, snapB, sumber } atau { tiada: true }
    async function laluanJalan(A, B) {
      // Syarat Google: laluan Routes API hanya dipaparkan di atas peta Google
      const google = laluanGoogle && E?.sumber === 'google';
      const k = (google ? 'g:' : 'o:') + A.id + '>' + B.id;
      if (cacheLaluan[k]) return cacheLaluan[k];
      if (google) {
        try {
          const res = await fetch('/api/peta/laluan', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ asal: { lat: A.lat, lng: A.lng }, tuju: { lat: B.lat, lng: B.lng } }) });
          const j = await res.json();
          if (!res.ok) throw new Error(j.ralat || 'Laluan Google gagal');
          if (j.tiada) return (cacheLaluan[k] = { tiada: true });
          return (cacheLaluan[k] = { ...j, sumber: 'google',
            langkah: [...j.langkah.map(st => ({ ikon: ikonManuver(st.manuver), teks: st.teks || 'Teruskan', m: st.m })), { ikon: '⚑', teks: `Tiba di ${pendek(B)}`, m: null }] });
        } catch (e) {
          // Routes API tidak tersedia (kunci ditolak, kuota, rangkaian): guna OSRM supaya arah masih berfungsi
          console.warn('Arah Google tidak tersedia, guna OSRM:', e.message);
        }
      }
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 15000);
      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${A.lng},${A.lat};${B.lng},${B.lat}?overview=full&geometries=geojson&steps=true`, { signal: ctl.signal });
        const j = await res.json();
        if (j.code !== 'Ok' || !j.routes?.length) throw new Error('Tiada laluan');
        const r = j.routes[0];
        const langkah = r.legs[0].steps.filter(st => st.distance > 0 || st.maneuver.type === 'arrive').map(st => {
          const [ikon, teks] = teksLangkah(st, pendek(A), pendek(B));
          return { ikon, teks, m: st.maneuver.type === 'arrive' ? null : st.distance };
        });
        return (cacheLaluan[k] = { km: r.distance / 1000, saat: r.duration, titik: r.geometry.coordinates.map(([x, y]) => [y, x]),
          langkah, snapA: j.waypoints[0].distance, snapB: j.waypoints[1].distance, sumber: 'osm' });
      } finally { clearTimeout(t); }
    }
    // Graf sungai (assets/ppd-sungai.js): Dijkstra antara titik tebing terdekat setiap tempat
    const SG = window.PPDSungai, AKSES_MAKS_KM = 3, LAJU_BOT = 25;
    let jiranSg = null;
    function laluanSungai(A, B) {
      if (!SG) return null;
      const a = SG.akses[A.nama], b = SG.akses[B.nama];
      if (!a || !b || a[1] > AKSES_MAKS_KM || b[1] > AKSES_MAKS_KM) return null;
      if (!jiranSg) { jiranSg = SG.simpul.map(() => []); SG.tepi.forEach((t, i) => { jiranSg[t[0]].push([t[1], i]); jiranSg[t[1]].push([t[0], i]); }); }
      const jarak = new Map([[a[0], 0]]), dari = new Map(), selesai = new Set(), giliran = [[0, a[0]]];
      while (giliran.length) {
        giliran.sort((x, y) => x[0] - y[0]);
        const [d, u] = giliran.shift();
        if (selesai.has(u)) continue; selesai.add(u);
        if (u === b[0]) break;
        for (const [v, i] of jiranSg[u]) {
          const nd = d + SG.tepi[i][2];
          if (nd < (jarak.get(v) ?? Infinity)) { jarak.set(v, nd); dari.set(v, [u, i]); giliran.push([nd, v]); }
        }
      }
      if (!jarak.has(b[0])) return null;
      const seg = []; let v = b[0];
      while (v !== a[0]) { const [u, i] = dari.get(v); seg.unshift([u, v, i]); v = u; }
      const titik = [SG.simpul[a[0]]], bahagian = [];
      seg.forEach(([u, v, i]) => {
        const t = SG.tepi[i];
        titik.push(...(t[0] === u ? t[3] : [...t[3]].reverse()), SG.simpul[v]);
        const akhir = bahagian[bahagian.length - 1], nama = t[4] || null;
        if (akhir && akhir.nama === nama) akhir.km += t[2]; else bahagian.push({ nama, km: t[2] });
      });
      return { km: jarak.get(b[0]), titik, bahagian, aksesA: a[1], aksesB: b[1] };
    }

    function buangLaluan() { if (laluan) { laluan.forEach(x => x.buang()); laluan = null; } }
    function tutupArah() { buangLaluan(); laluanId = null; arahEl.hidden = true; arahEl.innerHTML = ''; petaEl.classList.remove('lk-ada-arah'); }
    function lukisGaris(titik, warna, putus) {
      laluan = [
        E.garis(titik, { warna: '#fff', tebal: 9, legap: .95, z: 20 }),
        E.garis(titik, { warna, tebal: 5, putus: putus ? 'sengkang' : null, z: 21 }),
      ];
    }
    function sambung(dariTitik, keTitik, warna) {
      laluan.push(E.garis([dariTitik, keTitik], { warna, tebal: 3, putus: 'titik', z: 21 }));
    }
    function zumLaluan(titik, A, B) {
      E.muat([...titik, A, B], { kiri: arahEl.offsetWidth + 30, atas: 40, kanan: 40, bawah: 40, maxZoom: 16, animasi: true });
    }
    const IKON_KERETA = '<svg viewBox="0 0 24 24"><path d="M5 17h14M6 17v2M18 17v2M4 13l2-6h12l2 6v4H4z"/><circle cx="8" cy="14.5" r="1"/><circle cx="16" cy="14.5" r="1"/></svg>';
    const IKON_BOT = '<svg viewBox="0 0 24 24"><path d="M3 15l2 4h14l2-4H3zM6 15V9h8l3 6M10 9V5"/><path d="M2 21c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1"/></svg>';

    async function tunjukArah(B, pilihan = {}) {
      if (!E || !B) return;
      if (asalId === B.id) asalId = B.id === PPD.id ? sekolah[0].id : PPD.id;
      const A = cariL(asalId);
      E.tutupPopup();
      buangLaluan(); laluanId = B.id; arahEl.hidden = false; petaEl.classList.add('lk-ada-arah');
      const kepala = `<div class="lk-arah-k" style="--lk-c:${JENIS[B.jenis].warna}"><img src="${esc(B.logo)}" alt=""><div><small>Arah ke</small><b>${esc(B.nama)}</b></div><button type="button" class="lk-arah-x" data-arah-tutup aria-label="Tutup arah">×</button></div>
        <div class="lk-arah-dari"><label for="lk-arah-asal">Dari</label><select id="lk-arah-asal">${LOKASI.filter(l => l.id !== B.id).map(l => `<option value="${l.id}"${l.id === A.id ? ' selected' : ''}>${esc(pendek(l))}</option>`).join('')}</select>
          <button type="button" class="lk-arah-tukar" data-arah-tukar title="Tukar arah: dari ${esc(pendek(B))}" aria-label="Tukar asal dan destinasi">⇅</button></div>`;
      arahEl.innerHTML = kepala + '<div class="lk-arah-b"><div class="lk-arah-muat"><span class="lk-pusing"></span>Mengira laluan…</div></div>';
      let jalan = null;
      try { jalan = await laluanJalan(A, B); } catch {}
      if (laluanId !== B.id || asalId !== A.id) return; // pengguna sudah menukar pilihan
      const jalanTiada = !!jalan?.tiada; // penyedia laluan mengesahkan tiada jalan memandu
      if (jalanTiada) jalan = null;
      const sungai = laluanSungai(A, B);
      const jalanOk = !!jalan && jalanMunasabah(jalan, A, B);
      const mod = pilihan.mod || (jalanOk ? 'jalan' : sungai ? 'sungai' : 'jalan');
      const tab = `<div class="lk-mod" role="group" aria-label="Jenis laluan">
        <button type="button" data-arah-mod="jalan" class="${mod === 'jalan' ? 'on' : ''}" ${jalan ? '' : 'disabled'}>${IKON_KERETA}<span>Jalan raya<small>${!jalan ? (jalanTiada ? 'tiada laluan' : 'tiada data') : jalanOk ? jalan.km.toFixed(1) + ' km' : Math.max(jalan.snapA, jalan.snapB) > SNAP_MAKS_M ? 'tiada jalan' : jalan.km.toFixed(0) + ' km (jauh)'}</small></span></button>
        <button type="button" data-arah-mod="sungai" class="${mod === 'sungai' ? 'on' : ''}" ${sungai ? '' : 'disabled'}>${IKON_BOT}<span>Sungai<small>${sungai ? sungai.km.toFixed(1) + ' km' : 'tiada laluan'}</small></span></button>
      </div>`;
      let badan = '';

      if (mod === 'sungai' && sungai) {
        const WARNA = '#0e7490';
        lukisGaris(sungai.titik, WARNA, false);
        sambung([A.lat, A.lng], sungai.titik[0], WARNA);
        sambung(sungai.titik[sungai.titik.length - 1], [B.lat, B.lng], WARNA);
        zumLaluan(sungai.titik, A, B);
        const jauh = [[A, sungai.aksesA], [B, sungai.aksesB]].filter(([, d]) => d > 0.5);
        const langkah = [
          ['●', `Ke tebing sungai berhampiran ${pendek(A)}`, jarakTeks(sungai.aksesA * 1000)],
          ...sungai.bahagian.map(x => ['≈', `Ikut ${x.nama || 'anak sungai'}`, jarakTeks(x.km * 1000)]),
          ['⚑', `Naik ke darat menuju ${pendek(B)}`, jarakTeks(sungai.aksesB * 1000)],
        ];
        badan = `${jauh.length ? `<div class="lk-arah-amaran"><b>Tebing sungai agak jauh</b>${jauh.map(([l, d]) => `${esc(pendek(l))}: ${d.toFixed(1)} km dari sungai terdekat dalam data peta.`).join(' ')} Perjalanan darat mungkin diperlukan.</div>` : ''}
          <div class="lk-arah-angka sungai">
            <div><strong>${sungai.km.toFixed(1)} km</strong><span>jarak sungai</span></div>
            <div><strong>${masaTeks(sungai.km / LAJU_BOT * 3600)}</strong><span>anggaran bot (${LAJU_BOT} km/j)</span></div>
          </div>
          <details class="lk-arah-langkah" open><summary>Arahan perjalanan (${langkah.length} langkah)</summary><ol>
            ${langkah.map(([ik, t, d]) => `<li><i class="s">${ik}</i><span>${esc(t)}</span><em>${d}</em></li>`).join('')}
          </ol></details>
          <div class="lk-arah-kaki">Laluan sungai dikira daripada garis tengah sungai OpenStreetMap. Masa bergantung pada jenis bot, arus dan paras air. Sahkan jeti sebenar dengan pentadbir sekolah.</div>`;
      } else if (!jalan) {
        badan = jalanTiada
          ? `<div class="lk-arah-amaran"><b>Tiada laluan memandu</b><p>Google Maps tidak menemui jalan raya ke sini. ${sungai ? 'Laluan sungai tersedia untuk perjalanan ini.' : 'Mungkin diakses melalui sungai atau jalan yang belum dipetakan.'}</p>${sungai ? '<button type="button" class="lk-arah-paksa sungai" data-arah-mod="sungai">Lihat laluan sungai</button>' : ''}</div>`
          : '<div class="lk-arah-amaran"><b>Laluan jalan raya tidak dapat dikira</b>Semak sambungan internet dan cuba lagi.</div>';
      } else if (!jalanOk && !pilihan.paksa) {
        E.muat([A, B], { kiri: arahEl.offsetWidth + 40, atas: 70, kanan: 70, bawah: 70, maxZoom: 14, animasi: true });
        const snapJauh = Math.max(jalan.snapA, jalan.snapB);
        const tiadaJalan = snapJauh > SNAP_MAKS_M;
        badan = `<div class="lk-arah-amaran"><b>${tiadaJalan ? 'Tiada jalan raya hingga ke sini' : 'Laluan darat sangat jauh'}</b>
          <p>${tiadaJalan ? `Jalan raya terdekat dalam data peta ialah ${jarakTeks(snapJauh)} dari ${esc(pendek(jalan.snapA > jalan.snapB ? A : B))}.` : `Satu-satunya laluan darat yang ditemui ialah ${jalan.km.toFixed(0)} km (kira-kira ${masaTeks(jalan.saat)}), melencong jauh berbanding jarak garis lurus ${jarakKm(A, B).toFixed(1)} km.`}
          ${sungai ? 'Laluan sungai tersedia untuk perjalanan ini.' : 'Mungkin diakses melalui sungai atau jalan yang belum dipetakan.'}</p>
          ${sungai ? '<button type="button" class="lk-arah-paksa sungai" data-arah-mod="sungai">Lihat laluan sungai</button> ' : ''}<button type="button" class="lk-arah-paksa" data-arah-paksa>${tiadaJalan ? 'Papar laluan jalan anggaran' : 'Papar laluan darat ini'}</button></div>`;
      } else {
        const WARNA = jalanOk ? '#13406e' : '#b54708';
        lukisGaris(jalan.titik, WARNA, !jalanOk);
        if (jalan.snapA > 30) sambung([A.lat, A.lng], jalan.titik[0], WARNA);
        if (jalan.snapB > 30) sambung(jalan.titik[jalan.titik.length - 1], [B.lat, B.lng], WARNA);
        zumLaluan(jalan.titik, A, B);
        const google = jalan.sumber === 'google';
        const hujungJauh = Math.max(jalan.snapA, jalan.snapB);
        badan = `${jalanOk ? '' : '<div class="lk-arah-amaran"><b>Laluan anggaran sahaja</b>Mungkin tidak tepat. Sahkan laluan sebenar dengan pentadbir sekolah.</div>'}
          ${jalanOk && hujungJauh > 500 ? `<div class="lk-arah-amaran"><b>Jalan berakhir sebelum sampai</b>Jalan dalam data peta berakhir kira-kira ${jarakTeks(hujungJauh)} dari ${esc(pendek(jalan.snapA > jalan.snapB ? A : B))} (garis titik). Mungkin jalan kampung atau persendirian.</div>` : ''}
          <div class="lk-arah-angka">
            <div><strong>${jalan.km.toFixed(1)} km</strong><span>jarak jalan raya</span></div>
            <div><strong>${masaTeks(jalan.saat)}</strong><span>${google ? 'memandu, trafik semasa' : 'anggaran memandu'}</span></div>
          </div>
          <details class="lk-arah-langkah"${jalan.langkah.length <= 8 ? ' open' : ''}><summary>Arahan perjalanan (${jalan.langkah.length} langkah)</summary><ol>
            ${jalan.langkah.map(st => `<li><i>${st.ikon}</i><span>${esc(st.teks)}</span><em>${st.m == null ? '' : jarakTeks(st.m)}</em></li>`).join('')}
          </ol></details>
          <div class="lk-arah-kaki">${google
            ? `Laluan: Google Maps. Masa mengambil kira trafik semasa${jalan.saatTanpaTrafik ? ` (tanpa trafik: ${masaTeks(jalan.saatTanpaTrafik)})` : ''}.`
            : 'Laluan: OSRM · data jalan © penyumbang OpenStreetMap. Masa anggaran tanpa trafik.'}</div>`;
      }
      arahEl.innerHTML = kepala + `<div class="lk-arah-b">${tab}${badan}</div>`;
    }

    // Garis putus-putus dari PPD ke sekolah dipilih, dengan label jarak di tengah
    function pilih(id, buka) {
      if (id && laluanId && id !== laluanId) tutupArah();
      pilihId = id;
      if (garis) { garis.forEach(g => g.buang()); garis = null; }
      el.querySelectorAll('.lk-pin.pilih').forEach(p => p.classList.remove('pilih'));
      senaraiEl.querySelectorAll('button.pilih').forEach(b => b.classList.remove('pilih'));
      if (!id) return;
      const l = LOKASI.find(x => x.id === id);
      senaraiEl.querySelector(`[data-lk="${id}"]`)?.classList.add('pilih');
      el.querySelector(`[data-lkp="${id}"]`)?.classList.add('pilih');
      if (E && l.jenis !== 'PPD') {
        garis = [
          E.garis([PPD, l], { warna: '#0b2a4a', tebal: 2.5, putus: 'titik', z: 15 }),
          E.label([(PPD.lat + l.lat) / 2, (PPD.lng + l.lng) / 2], `<span>${l.jarak.toFixed(1)} km</span>`, 'lk-garis-lbl'),
        ];
      }
      if (buka && E) {
        E.buka(l);
        petaEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }

    function lukis() {
      const q = cariEl.value.trim().toUpperCase();
      const kw = kawasanEl.value, asrama = asramaEl.checked;
      const padan = l => (!jenis || l.jenis === jenis)
        && (!q || l.nama.includes(q) || l.kod.includes(q) || (l.namaPenuh || '').includes(q))
        && (!kw || (kw[0] === 'P' ? l.parlimen === kw.slice(2) : l.dun === kw.slice(2)))
        && (!asrama || (l.asrama && l.asrama !== 'Tiada Asrama'));
      const papar = sekolah.filter(padan).sort((a, b) => a.laluan.km - b.laluan.km);
      E?.setPapar(papar);
      const ppdPadan = (!q || PPD.nama.includes(q) || PPD.kod.includes(q)) && !kw && !asrama;
      const baris = l => `<li><button type="button" data-lk="${l.id}" class="${pilihId === l.id ? 'pilih' : ''}" style="--lk-c:${JENIS[l.jenis].warna}">
          <span class="lg"><img src="${esc(l.logo)}" alt="" loading="lazy"></span>
          <span class="tx"><b>${esc(l.nama)}</b>
            ${l.jenis === 'PPD' ? '<small>Pejabat Pendidikan Daerah · 96300 Dalat</small>'
              : `<small>${esc(l.kod)}${l.gred ? ' · Gred ' + esc(l.gred) : ''}${l.dun ? ' · ' + esc(l.dun) : ''}</small><span class="lk-bar ${l.laluan.mod}"><i style="width:${Math.min(100, Math.max(4, l.laluan.km / JARAK_MAKS * 100)).toFixed(0)}%"></i></span>`}
          </span>
          ${l.jenis === 'PPD' ? '' : `<span class="lk-km" title="Melalui ${esc(teksMod(l))}">${l.laluan.km.toFixed(1)} km<small class="${l.laluan.mod}">${IKON_MOD_KECIL[l.laluan.mod] || ''}${l.laluan.minit ? masaTeks(l.laluan.minit * 60) : ''}</small></span>`}
        </button></li>`;
      senaraiEl.innerHTML = (ppdPadan ? baris(PPD) : '') + (papar.length ? papar.map(baris).join('') : '<li class="lk-kosong">Tiada sekolah sepadan.</li>');
    }
    cariEl.addEventListener('input', lukis);
    kawasanEl.addEventListener('change', lukis);
    asramaEl.addEventListener('change', lukis);
    el.querySelectorAll('[data-lk-jenis]').forEach(b => b.addEventListener('click', () => {
      jenis = b.dataset.lkJenis;
      el.querySelectorAll('[data-lk-jenis]').forEach(x => x.classList.toggle('on', x === b));
      lukis();
    }));
    senaraiEl.addEventListener('click', e => {
      const b = e.target.closest('[data-lk]'); if (!b) return;
      const l = LOKASI.find(x => x.id === b.dataset.lk);
      if (E) pilih(l.id, true); else window.open(l.peta, '_blank', 'noopener');
    });
    lukis();
    mulaPeta();
  }

  window.PPDLokasi = { senarai: LOKASI, jenis: JENIS, jarakKm, pasang };
})();
