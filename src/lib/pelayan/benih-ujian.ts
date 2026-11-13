// Data ujian penuh (MOD_DEMO sahaja) berdasarkan senarai sekolah EMIS PPD Dalat: 29 sekolah, bilangan guru sebenar
// setiap sekolah, murid Tingkatan 5 di 4 SMK dengan markah AR1/AR2/Percubaan, rekod SK@S 5.4.1 dan 5.4.2, profil,
// aduan e-Fasiliti, intervensi, peringatan dan pengumuman. Deterministik: setiap jana menghasilkan data yang sama.
import benihOrganisasi from "./benih-organisasi.json";
import sekolahEmis from "./sekolah-emis.json";

type Emis = (typeof sekolahEmis)[number];
type Pengguna = { id: string; nama: string; emel: string; kodSekolah: string; roles: string[]; utama?: boolean };

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = rng(20261113);
const pilih = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];
const antara = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
const had = (v: number) => Math.max(5, Math.min(99, Math.round(v)));
const dua = (n: number) => String(n).padStart(2, "0");
const tarikhAcak = (dari: string, hingga: string) => {
  const a = new Date(dari).getTime(), b = new Date(hingga).getTime();
  return new Date(a + r() * (b - a)).toISOString().slice(0, 10);
};

/* ── Nama ── */
const N = {
  lM: ["Ahmad", "Muhammad Haziq", "Awang Faizal", "Abang Zulkarnain", "Mohd Syahmi", "Amirul", "Danial", "Hairul", "Iskandar", "Jelani", "Rizal", "Firdaus", "Aiman", "Hakim", "Zulhilmi", "Shahrul", "Azri", "Fadzil", "Ikhwan", "Khairi", "Nazri", "Razak", "Saiful", "Taufiq", "Wan Amir", "Yusri"],
  pM: ["Nur Aisyah", "Siti Nurhaliza", "Dayang Nabilah", "Nur Syafiqah", "Farhana", "Aina Maisarah", "Saripah", "Nurul Izzah", "Fatin", "Qistina", "Hidayah", "Amirah", "Syuhada", "Najwa", "Balqis", "Liyana", "Rosnah", "Haslina", "Zaleha", "Norazlina", "Suraya", "Maznah"],
  bapa: ["Abdullah", "Jamil", "Morshidi", "Sulaiman", "Hamdan", "Rosli", "Bujang", "Ismail", "Hassan", "Zakaria", "Dollah", "Sahari", "Mahmud", "Osman", "Tuah", "Matusin", "Sapuan", "Junaidi", "Mohidin", "Abang Ahmad"],
  lI: ["Jimbun", "Ricky", "Melvin", "Gerald", "Nyandang", "Juing", "Edward", "Felix", "Robin", "Andrew", "Jacky"],
  pI: ["Dayang", "Melissa", "Rosalind", "Nancy", "Lidia", "Sindai", "Christina", "Veronica", "Agnes", "Doris"],
  bapaI: ["Gerang", "Nyipa", "Entali", "Jugah", "Ugak", "Saling", "Libau", "Ngumbang", "Jawie", "Bilong"],
  cina: ["Wong", "Lim", "Tiong", "Ling", "Lau", "Ting", "Ngu", "Kiu", "Hii", "Sii"],
  given: ["Kah Hui", "Mei Ling", "Siew Ching", "Wei Jie", "Jia Hao", "Pei Shan", "Zi Xuan", "Yong Sheng", "Hui Min", "Chee Keong", "Siew Ping", "Ming Hong"],
};
type Orang = { nama: string; jantina: "Lelaki" | "Perempuan"; agama: string };
function namaOrang(cinaLebih = false): Orang {
  const L = r() < 0.5, x = r();
  const kadar = cinaLebih ? [0.25, 0.35] : [0.68, 0.85];
  if (x < kadar[0]) return { nama: `${pilih(L ? N.lM : N.pM)} ${L ? "bin" : "binti"} ${pilih(N.bapa)}`, jantina: L ? "Lelaki" : "Perempuan", agama: "Islam" };
  if (x < kadar[1]) return { nama: `${pilih(L ? N.lI : N.pI)} anak ${pilih(N.bapaI)}`, jantina: L ? "Lelaki" : "Perempuan", agama: "Kristian" };
  return { nama: `${pilih(N.cina)} ${pilih(N.given)}`, jantina: L ? "Lelaki" : "Perempuan", agama: r() < 0.7 ? "Buddha" : "Kristian" };
}
const emelDaripada = (nama: string, guna: Set<string>, domain: string) => {
  const asas = nama.toLowerCase().replace(/\b(bin|binti|anak)\b/g, " ").replace(/[^a-z ]/g, "").trim().split(/\s+/).slice(0, 2).join(".");
  let e = `${asas}@${domain}`, n = 1;
  while (guna.has(e)) e = `${asas}${++n}@${domain}`;
  guna.add(e);
  return e;
};

/* ── Sekolah ── */
const NAMA_BENIH = new Map((benihOrganisasi as { kod: string; nama: string; lokasi: string; jenis: string }[]).map((o) => [o.kod, o]));
const namaSekolah = (s: Emis) => NAMA_BENIH.get(s.kod)?.nama || s.nama;
const ZON: Record<string, string> = { DALAT: "Zon 1", TELLIAN: "Zon 2", "BAWANG ASSAN": "Zon 3", JEMORENG: "Zon 3" };
const menengah = (s: Emis) => s.peringkat === "Menengah";

/* ── SPM ── */
const TERAS = [
  { s: "Bahasa Melayu", kod: "bm", adj: 6 }, { s: "Bahasa Inggeris", kod: "bi", adj: -6 }, { s: "Matematik", kod: "mt", adj: -3 }, { s: "Sejarah", kod: "sj", adj: 2 },
];
const SAINS = [{ s: "Matematik Tambahan", kod: "mm", adj: -9 }, { s: "Fizik", kod: "fz", adj: -6 }, { s: "Kimia", kod: "km", adj: -5 }, { s: "Biologi", kod: "bio", adj: -3 }];
const SASTERA = [{ s: "Sains", kod: "sn", adj: -2 }, { s: "Prinsip Perakaunan", kod: "pp", adj: -1 }, { s: "Ekonomi", kod: "ek", adj: 0 }];
const NAMA_KELAS = ["Amanah", "Bestari", "Cemerlang", "Dedikasi", "Efisien", "Fikrah", "Gemilang"];
// Profil prestasi (selaras dengan GPS sebenar relatif antara sekolah)
const PROFIL: Record<string, { base: number; tren: number; ses: [number, number]; asrama: number; isi: number }> = {
  YEE3501: { base: 67, tren: 1.2, ses: [0.38, 0.8], asrama: 0.3, isi: 0.92 }, // SMK DALAT
  YEA3501: { base: 61, tren: 0.2, ses: [0.55, 0.9], asrama: 0.4, isi: 0.8 }, // SMK OYA
  YRA3201: { base: 64, tren: 0.9, ses: [0.5, 0.88], asrama: 0.85, isi: 0.97 }, // SMK AGAMA IGAN
  YEA3202: { base: 55, tren: -1.5, ses: [0.8, 0.97], asrama: 0.7, isi: 0.55 }, // SMK BATANG IGAN
};
const GPS_SEJARAH: Record<string, number[]> = { YEE3501: [4.92, 4.71, 4.55, 4.38], YEA3501: [5.74, 5.81, 5.66, 5.79], YRA3201: [5.21, 5.06, 5.12, 4.94], YEA3202: [6.88, 7.02, 7.21, 7.35] };

/* ── SK@S ── */
const PROGRAM_GURU = [
  ["Anugerah Guru Inovatif", "NAT"], ["Pertandingan Inovasi PdP", "NEG"], ["Anugerah Kualiti Guru PPD Dalat", "DAE"], ["Pertandingan Video Pengajaran Kreatif", "DAE"],
  ["Pertandingan Penulisan Esei Guru", "DAE"], ["Konvensyen Kajian Tindakan", "NEG"], ["Anugerah Guru Cemerlang STEM", "NEG"], ["SEAMEO-Japan ESD Award", "INT"],
  ["International Teacher Innovation Expo", "INT"], ["Pertandingan Bahan Bantu Mengajar", "DAE"], ["Karnival Inovasi Pendidikan Bahagian Mukah", "BAH"],
  ["Pertandingan Catur Guru", "SKL"], ["Hari Sukan Guru", "SKL"], ["Pertandingan Pidato Guru", "NEG"], ["Anugerah Guru Penyayang", "DAE"],
] as const;
const PROGRAM_SEKOLAH = [
  ["Pertandingan Robotik", "KOK"], ["Kejohanan Bola Sepak MSSD", "KOK"], ["Pertandingan Pidato Bahasa Melayu", "KAK"], ["Pertandingan Sains & Matematik", "AKD"],
  ["Anugerah Sekolah Lestari", "PGS"], ["Pertandingan Choral Speaking", "KAK"], ["Kejohanan Olahraga MSSD", "KOK"], ["Program Sekolah Penyayang", "HEM"],
  ["Pertandingan Tilawah Al-Quran", "KAK"], ["Anugerah Sekolah Selamat", "HEM"], ["Pertandingan Kuiz Sejarah", "AKD"], ["Pertandingan Kawad Kaki Unit Beruniform", "KOK"],
] as const;
const TAHUN_RAWAK = ["T1", "T1", "T2", "T3", "SH", "SY"] as const;
const LABEL_LVL: Record<string, string> = { INT: "Antarabangsa", NAT: "Kebangsaan", NEG: "Negeri", BAH: "Bahagian", DAE: "Daerah", SKL: "Sekolah" };

/* ── e-Fasiliti ── */
const ADUAN = [
  ["Paip pecah di tandas blok A", "Paip & Sanitasi"], ["Bumbung dewan bocor ketika hujan lebat", "Bumbung"], ["Litar elektrik trip berulang kali di makmal", "Elektrik"],
  ["Pagar sekolah rosak, keselamatan terjejas", "Struktur & Pagar"], ["Kipas siling bilik darjah tidak berfungsi", "Elektrik"], ["Tangki air asrama bocor", "Paip & Sanitasi"],
  ["Siling bilik guru runtuh sebahagian", "Bumbung"], ["Pintu makmal komputer tidak boleh dikunci", "Struktur & Pagar"], ["Cat dinding blok B mengelupas", "Cat & Kemasan"],
  ["Mangkuk tandas murid perempuan pecah", "Tandas"], ["Lampu koridor blok C tidak menyala", "Elektrik"], ["Longkang tersumbat di kantin", "Paip & Sanitasi"],
  ["Tingkap kelas pecah akibat ribut", "Struktur & Pagar"], ["Penyaman udara pusat sumber rosak", "Elektrik"], ["Jalan masuk sekolah berlubang", "Lain-lain"],
] as const;
const PJ: Record<string, string> = { "Zon 1": "En. Haziq (PJ Zon 1)", "Zon 2": "Pn. Farah (PJ Zon 2)", "Zon 3": "En. Rafie (PJ Zon 3)" };

export function janaDataUjian(): Record<string, unknown> {
  const sekolah = sekolahEmis as Emis[];
  const emelGuna = new Set<string>();
  const pengguna: Pengguna[] = [];
  const profil: Record<string, { jawatan: string; mataPelajaran: string; tahunMula: number }> = {};

  // Pegawai PPD: Superadmin, Admin semua aplikasi, dan Admin satu aplikasi (untuk menguji had peranan)
  const ppd: [string, string, string, string[]][] = [
    ["u_norliza", "NORLIZA BINTI AHMAD", "norliza.ahmad@moe.gov.my", ["superadmin"]],
    ["u_azlan", "AZLAN BIN HAMID", "azlan.hamid@moe.gov.my", ["admin_skas", "admin_spm", "admin_efasiliti"]],
    ["u_ppd_skas", "ROSMAWATI BINTI JUNAIDI", "rosmawati.junaidi@moe.gov.my", ["admin_skas"]],
    ["u_ppd_spm", "MOHD FAIZAL BIN SAPUAN", "faizal.sapuan@moe.gov.my", ["admin_spm"]],
    ["u_ppd_efas", "JUGAH ANAK NGUMBANG", "jugah.ngumbang@moe.gov.my", ["admin_efasiliti"]],
    ["u_ppd_biasa", "LING SIEW PING", "ling.siewping@moe.gov.my", []],
  ];
  for (const [id, nama, emel, roles] of ppd) {
    emelGuna.add(emel);
    pengguna.push({ id, nama, emel, kodSekolah: "PPDDLT", roles, utama: true });
  }

  // Guru setiap sekolah ikut bilangan EMIS. Guru pertama = Pengetua/Guru Besar (Pentadbir Sekolah semua aplikasi),
  // kedua = PK Pentadbiran (Pentadbir Sekolah SK@S sahaja).
  const guruSekolah = new Map<string, Pengguna[]>();
  const KHAS: Record<string, [string, string, string][]> = {
    YEE3501: [["u_razif", "RAZIF BIN OTHMAN", "razif.othman@moe-dl.edu.my"], ["u_azman", "AZMAN BIN HARUN", "azman.harun@moe-dl.edu.my"]],
    YEA3501: [["u_salmah", "SALMAH BINTI JALIL", "salmah.jalil@moe-dl.edu.my"]],
  };
  for (const s of sekolah) {
    const senarai: Pengguna[] = [];
    const smk = menengah(s);
    for (let i = 0; i < s.guru; i++) {
      const khas = KHAS[s.kod]?.[i];
      const o = namaOrang(s.jenisSekolah === "SJK(C)");
      const nama = (khas?.[1] || o.nama).toUpperCase();
      const emel = khas?.[2] || emelDaripada(o.nama, emelGuna, "moe-dl.edu.my");
      if (khas) emelGuna.add(emel);
      let roles: string[] = [];
      if (i === 0) roles = ["sekolah_skas", "sekolah_efasiliti", ...(smk ? ["sekolah_spm"] : [])];
      else if (i === 1) roles = ["sekolah_skas"];
      // Akaun demo: Razif = Pengetua SMK DALAT; Azman = guru biasa SMK DALAT; Salmah = Pentadbir e-Fasiliti SMK OYA sahaja
      if (khas?.[0] === "u_azman") roles = [];
      if (khas?.[0] === "u_salmah") roles = ["sekolah_efasiliti"];
      const u: Pengguna = { id: khas?.[0] || `u_${s.kod.toLowerCase()}_${dua(i + 1)}`, nama, emel, kodSekolah: s.kod, roles, ...(khas ? { utama: true } : {}) };
      senarai.push(u);
      const jawatan = i === 0 ? (smk ? "Pengetua" : "Guru Besar") : i === 1 ? "Penolong Kanan Pentadbiran" : i === 2 ? "Penolong Kanan HEM" : i === 3 ? "Penolong Kanan Kokurikulum" : r() < 0.15 ? "Guru Cemerlang" : "Guru";
      profil[u.id] = { jawatan, mataPelajaran: "", tahunMula: antara(1996, 2024) };
    }
    // Wakil setiap jenis sekolah untuk log masuk demo
    if (["YBE3501", "YCC3502", "YRA3201", "YEA3202"].includes(s.kod)) senarai[0].utama = true;
    guruSekolah.set(s.kod, senarai);
    pengguna.push(...senarai);
  }

  // ── Analitik SPM: Tingkatan 5 di setiap SMK (≈ 1/5 enrolmen), kelas ±30 murid ──
  const kelas: unknown[] = [];
  const marks: Record<string, { ar1: number | null; ar2: number | null; percubaan?: number | null; sasaran?: number }> = {};
  const peringatan: unknown[] = [];
  let mid = 0;
  for (const s of sekolah.filter(menengah)) {
    const pf = PROFIL[s.kod];
    const nama = namaSekolah(s);
    const guru = guruSekolah.get(s.kod)!;
    const bilMurid = Math.round(s.murid / 5);
    const bilKelas = Math.max(1, Math.round(bilMurid / 30));
    const bilSains = Math.max(1, Math.round(bilKelas * 0.4));
    // Guru mata pelajaran (bukan Pengetua/PK): seorang guru mengajar satu subjek, beberapa kelas
    const pengajar = guru.slice(4).length ? guru.slice(4) : guru;
    const guruSubjek = new Map<string, Pengguna[]>();
    let gi = 0;
    const ambilGuru = (subjek: string, n: number) => {
      if (!guruSubjek.has(subjek)) {
        const g: Pengguna[] = [];
        for (let i = 0; i < n; i++) g.push(pengajar[gi++ % pengajar.length]);
        guruSubjek.set(subjek, g);
        for (const x of g) profil[x.id].mataPelajaran = profil[x.id].mataPelajaran ? `${profil[x.id].mataPelajaran}, ${subjek}` : subjek;
      }
      return guruSubjek.get(subjek)!;
    };
    // Azman mengajar Matematik di SMK DALAT (akaun demo guru)
    if (s.kod === "YEE3501") {
      const azman = guru.find((g) => g.id === "u_azman")!;
      profil[azman.id].jawatan = "Guru";
      guruSubjek.set("Matematik", [azman, pengajar[3 % pengajar.length]]);
      profil[azman.id].mataPelajaran = "Matematik";
    }
    for (let ci = 0; ci < bilKelas; ci++) {
      const kn = NAMA_KELAS[ci % NAMA_KELAS.length];
      const sains = ci < bilSains;
      const saiz = Math.round(bilMurid / bilKelas) + (ci === 0 ? bilMurid - Math.round(bilMurid / bilKelas) * bilKelas : 0);
      const roster = Array.from({ length: saiz }, () => {
        const o = namaOrang();
        const x = r();
        const ses = x < pf.ses[0] ? "B40" : x < pf.ses[1] ? "M40" : "T20";
        return {
          muridId: "m" + ++mid, nama: o.nama.toUpperCase(), jantina: o.jantina, agama: o.agama, ses,
          lokasi: r() < 0.75 ? s.lokasi : pilih(["Bandar", "Luar Bandar", "Pedalaman"]),
          penginapan: r() < pf.asrama ? "Asrama" : "Harian",
          upaya: (r() - 0.5) * 26 + (ses === "B40" ? -5 : ses === "T20" ? 8 : 0) + (sains ? 9 : -2),
        };
      });
      const subjekKelas = [
        ...TERAS.map((x) => ({ ...x, murid: roster })),
        { s: "Pendidikan Islam", kod: "pi", adj: 5, murid: roster.filter((m) => m.agama === "Islam") },
        { s: "Pendidikan Moral", kod: "pm", adj: 4, murid: roster.filter((m) => m.agama !== "Islam") },
        ...(sains ? SAINS : SASTERA).map((x) => ({ ...x, murid: roster })),
      ].filter((x) => x.murid.length);
      for (const sub of subjekKelas) {
        const g = ambilGuru(sub.s, Math.max(1, Math.ceil(bilKelas / 3)));
        const cikgu = g[ci % g.length];
        // Kadar pengisian Percubaan berbeza ikut sekolah dan kelas (tarikh akhir 13 Nov 2026)
        const isi = r() < pf.isi ? sub.murid.length : Math.floor(sub.murid.length * r() * 0.8);
        const adaSasaran = r() < 0.7;
        const pelajar = sub.murid.map((m, n) => {
          const id = `${m.muridId}-${sub.kod}`;
          const ar1 = had(pf.base + sub.adj + m.upaya + (r() - 0.5) * 12);
          const ar2 = had(ar1 + pf.tren + (r() - 0.5) * 10);
          marks[id] = { ar1: r() < 0.01 ? null : ar1, ar2: r() < 0.01 ? null : ar2 };
          if (n < isi) marks[id].percubaan = r() < 0.02 ? null : had(ar2 + pf.tren + (r() - 0.5) * 10);
          if (adaSasaran) marks[id].sasaran = Math.min(100, had(ar2 + antara(3, 12)));
          return { id, muridId: m.muridId, nama: m.nama, jantina: m.jantina, agama: m.agama, ses: m.ses, lokasi: m.lokasi, penginapan: m.penginapan };
        });
        const kelasId = `${s.kod.toLowerCase()}-${kn.toLowerCase()}-${sub.kod}`;
        kelas.push({ id: kelasId, sekolah: nama, kodSekolah: s.kod, sekolahId: s.kod.toLowerCase(), subjek: sub.s, tingkatan: "5", kelas: kn, tahun: "2026", guru: cikgu.nama, guruId: cikgu.id, pelajar });
        if (isi < sub.murid.length && r() < 0.5) {
          const p = guru[0];
          peringatan.push({ kelasId, dariId: p.id, dariNama: p.nama, t: new Date(`2026-11-${dua(antara(5, 12))}T0${antara(7, 9)}:30:00+08:00`).getTime() });
        }
      }
    }
  }

  // ── SK@S 5.4.1: ±45% guru ada 1–4 rekod pencapaian ──
  const rekod: Record<string, unknown[]> = {};
  let ri = 0;
  for (const [, guru] of guruSekolah) {
    for (const u of guru) {
      if (u.id === "u_azman" ? false : r() > 0.45) continue;
      const n = u.id === "u_azman" ? 5 : antara(1, 4);
      rekod[u.id] = Array.from({ length: n }, () => {
        const [program, level] = pilih(PROGRAM_GURU);
        const tahap = pilih(TAHUN_RAWAK);
        const peranan = r() < 0.8 ? "Peserta" : r() < 0.5 ? "Penyelidik" : "Jurulatih";
        return {
          id: `r${(++ri).toString(36)}`, program: `${program} 2026`, level, peranan, tarikh: tarikhAcak("2026-01-15", "2026-11-05"), tahap,
          pengesahan: level === "SKL" ? "Sijil sekolah" : level === "DAE" ? "Sijil PPD Dalat" : level === "INT" ? "Sijil penganjur antarabangsa" : "Sijil rasmi penganjur",
          draft: `Guru telah menyertai ${program} 2026 peringkat ${LABEL_LVL[level]}.`, tags: [`#${LABEL_LVL[level]}`, "#5.4.1"],
        };
      });
    }
  }

  // ── SK@S 5.4.2: setiap sekolah 2–8 pencapaian sekolah ──
  const rekodSekolah: Record<string, unknown[]> = {};
  for (const s of sekolah) {
    const guru = guruSekolah.get(s.kod)!;
    rekodSekolah[s.kod] = Array.from({ length: antara(2, menengah(s) ? 8 : 5) }, (_, i) => {
      const [program, kategori] = pilih(PROGRAM_SEKOLAH);
      const level = pilih(["DAE", "DAE", "DAE", "NEG", "NEG", "NAT", "INT"] as const);
      return {
        id: `sr${s.kod.toLowerCase()}${i}`, program: `${program} ${level === "DAE" ? "Peringkat Daerah Dalat" : `Peringkat ${LABEL_LVL[level]}`} 2026`,
        tarikh: tarikhAcak("2026-02-01", "2026-10-31"), level, tahap: pilih(TAHUN_RAWAK), kategori, pautanEviden: "", catatan: "", guruId: pilih(guru).id,
      };
    });
  }

  // ── Profil sekolah (daripada EMIS) ──
  const profilSekolah: Record<string, unknown> = {};
  for (const s of sekolah) {
    profilSekolah[s.kod] = {
      alamat: `${namaSekolah(s)}, ${s.dun === "DALAT" ? "Jalan Dalat-Oya" : s.dun === "TELLIAN" ? "Jalan Mukah-Dalat" : "Jalan Igan"}`,
      poskod: s.dun === "DALAT" ? "96300" : s.dun === "TELLIAN" ? "96400" : "96000", bandar: s.dun === "DALAT" ? "Dalat" : s.dun === "TELLIAN" ? "Mukah" : "Sibu",
      telefon: s.telefon, faks: "", emel: `${s.kod.toLowerCase()}@moe.edu.my`, gred: s.gred, bilGuru: String(s.guru), bilMurid: String(s.murid),
    };
  }

  // ── e-Fasiliti: 1–3 aduan bagi kebanyakan sekolah ──
  const tiket: unknown[] = [];
  let ti = 0;
  for (const s of sekolah) {
    const guru = guruSekolah.get(s.kod)!;
    const zon = ZON[s.dun] || "Zon 1";
    const n = r() < 0.2 ? 0 : antara(1, s.murid > 400 ? 4 : 2);
    for (let i = 0; i < n; i++) {
      const [tajuk, kategori] = pilih(ADUAN);
      const tarikh = tarikhAcak("2026-07-01", "2026-11-12");
      const status = pilih(["Baru", "Baru", "Disemak PJ", "Disemak PJ", "Lulus Bajet", "Dalam Kerja", "Selesai", "Selesai", "Selesai", "Ditolak"] as const);
      const kos = antara(3, 90) * 100;
      const pelapor = r() < 0.6 ? guru[0] : pilih(guru);
      const nama = namaSekolah(s);
      const tl = [{ tarikh: `${tarikh} 08:${dua(antara(0, 59))}`, tindakan: `Aduan dihantar oleh ${pelapor.nama}`, oleh: nama, status: "Baru" }];
      const turut = ["Disemak PJ", "Lulus Bajet", "Dalam Kerja", "Selesai"];
      const sasaran = status === "Ditolak" ? 1 : turut.indexOf(status) + 1;
      for (let k = 0; k < sasaran; k++) {
        const st = status === "Ditolak" ? "Ditolak" : turut[k];
        const t = new Date(new Date(tarikh).getTime() + (k + 1) * antara(2, 6) * 86400000).toISOString().slice(0, 10);
        const tindakan = st === "Disemak PJ" ? "Lawatan tapak oleh PJ. Aduan disahkan." : st === "Lulus Bajet" ? `Bajet RM ${kos.toLocaleString("en")} diluluskan oleh PPD` : st === "Dalam Kerja" ? "Kontraktor memulakan kerja pembaikan" : st === "Selesai" ? "Kerja pembaikan selesai" : "Aduan ditolak: di luar skop penyelenggaraan PPD";
        tl.push({ tarikh: `${t} ${dua(antara(8, 16))}:00`, tindakan, oleh: st === "Disemak PJ" ? PJ[zon] : st === "Lulus Bajet" || st === "Ditolak" ? "PPD Dalat" : "Kontraktor", status: st });
      }
      tiket.push({
        id: `TKT-2026-${String(++ti).padStart(3, "0")}`, tajuk, kategori, sekolah: nama, kodSekolah: s.kod, zon, tarikh, status,
        keutamaan: pilih(["Kritikal", "Tinggi", "Tinggi", "Sederhana", "Sederhana", "Rendah"] as const), pelaporId: pelapor.id,
        butiran: `${tajuk} di ${nama}. Keadaan ini menjejaskan aktiviti PdP dan keselamatan murid. Mohon tindakan segera.`,
        notaPJ: sasaran >= 1 && status !== "Ditolak" ? `Kerosakan disahkan. Anggaran kos RM ${kos.toLocaleString("en")}.` : null,
        notaPPD: ["Lulus Bajet", "Dalam Kerja", "Selesai"].includes(status) ? "Bajet diluluskan. Kontraktor dilantik." : status === "Ditolak" ? "Ditolak: kerja kecil boleh diurus oleh sekolah." : null,
        gambar: null, timeline: tl,
      });
    }
  }

  // ── Intervensi SPM, sejarah & sasaran GPS ──
  const smk = sekolah.filter(menengah);
  const intervensi = smk.flatMap((s, i) => [
    { id: `iv${i}a`, kodSekolah: s.kod, sekolah: namaSekolah(s), subjek: "Matematik", jenis: "Kelas Tambahan", tarikh: "2026-08-04", pj: guruSekolah.get(s.kod)![1].nama, sasaran: +(GPS_SEJARAH[s.kod][3] - 0.3).toFixed(2), catatan: "Kelas tambahan setiap Selasa dan Khamis petang.", gpsMula: +(GPS_SEJARAH[s.kod][3] + 0.4).toFixed(2) },
    { id: `iv${i}b`, kodSekolah: s.kod, sekolah: namaSekolah(s), subjek: "", jenis: "Program Motivasi", tarikh: "2026-09-12", pj: guruSekolah.get(s.kod)![0].nama, sasaran: +(GPS_SEJARAH[s.kod][3] - 0.2).toFixed(2), catatan: "Kem motivasi SPM untuk semua murid Tingkatan 5.", gpsMula: GPS_SEJARAH[s.kod][3] },
  ]);
  const kunciGps: Record<string, unknown> = {};
  for (const s of smk) {
    const g = GPS_SEJARAH[s.kod];
    kunciGps[`skas_gps_sejarah:${namaSekolah(s)}`] = g.map((gps, i) => ({ tahun: 2022 + i, gps, lulus100: gps < 5, subjekCemerlang: Math.max(0, Math.round((7 - gps) * 3)), bilPelajar: Math.round(s.murid / 5) + antara(-8, 8) }));
    kunciGps[`skas_gps_sasaran:${namaSekolah(s)}`] = +(g[3] - 0.15).toFixed(2);
  }

  const pengumuman = [
    { id: "p1", hari: "28", bulan: "Okt", tag: "SPM", teks: "Pengisian markah Percubaan SPM 2026 dibuka kepada semua guru mata pelajaran. Tarikh akhir 13 November 2026.", tarikhAkhir: "2026-11-30" },
    { id: "p2", hari: "03", bulan: "Nov", tag: "SK@S", teks: "Kemas kini rekod pencapaian SKPM 5.4.1 dan 5.4.2 sebelum pengisian MoEIS. Simpan evidens dalam Google Drive.", tarikhAkhir: "2026-12-15" },
    { id: "p3", hari: "15", bulan: "Okt", tag: "Makluman", teks: "Semua aduan kerosakan fasiliti sekolah kini dibuat melalui e-Fasiliti.", tarikhAkhir: "" },
    { id: "p4", hari: "10", bulan: "Nov", tag: "Mesyuarat", teks: "Mesyuarat Pengetua dan Guru Besar Daerah Dalat pada 20 November 2026 di Dewan PPD Dalat.", tarikhAkhir: "2026-11-20" },
  ];

  return {
    ppd_organisasi: [
      { kod: "PPDDLT", nama: "PPD DALAT", lokasi: "Bandar", jenis: "Pejabat" },
      ...sekolah.map((s) => ({ kod: s.kod, nama: namaSekolah(s), lokasi: NAMA_BENIH.get(s.kod)?.lokasi || s.lokasi, jenis: "Sekolah" })),
    ],
    ppd_users: pengguna,
    skas_kelas: kelas,
    skas_marks: marks,
    ppd_peringatan: peringatan,
    ppd_skas_rekod: rekod,
    ppd_skas_sekolah: rekodSekolah,
    ppd_profil: profil,
    ppd_profil_sekolah: profilSekolah,
    ppd_efasiliti_tiket: tiket,
    ppd_spm_intervensi: intervensi,
    ppd_pengumuman: pengumuman,
    ppd_audit: [],
    ...kunciGps,
  };
}
