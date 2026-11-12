// Enjin analitik SPM daerah. Semua angka dikira daripada markah yang diisi oleh guru
// (stor kongsi: kelas + markah). Tiada angka anggaran atau data tahun lepas yang direka.
import type { Kelas, Marks, Markah, Pelajar, Peperiksaan, SekolahInduk, UjianKey } from "@/lib/portal/stor";

export const UJIAN: { key: UjianKey; label: string; penuh: string }[] = [
  { key: "ar1", label: "AR1", penuh: "Ujian Pertengahan Tahun" },
  { key: "ar2", label: "AR2", penuh: "Ujian Akhir Tahun" },
  { key: "percubaan", label: "Percubaan", penuh: "Percubaan SPM" },
];

export const GRED_SPM = [
  { min: 90, gred: "A+", gps: 1, kategori: "Cemerlang" },
  { min: 80, gred: "A", gps: 2, kategori: "Cemerlang" },
  { min: 70, gred: "A-", gps: 3, kategori: "Cemerlang" },
  { min: 65, gred: "B+", gps: 4, kategori: "Kepujian" },
  { min: 60, gred: "B", gps: 5, kategori: "Kepujian" },
  { min: 55, gred: "C+", gps: 6, kategori: "Kepujian" },
  { min: 50, gred: "C", gps: 7, kategori: "Kepujian" },
  { min: 45, gred: "D", gps: 8, kategori: "Lulus" },
  { min: 40, gred: "E", gps: 9, kategori: "Lulus" },
  { min: 0, gred: "G", gps: 10, kategori: "Gagal" },
] as const;

export type Kategori = (typeof GRED_SPM)[number]["kategori"];
export const KATEGORI: Kategori[] = ["Cemerlang", "Kepujian", "Lulus", "Gagal"];
export const LULUS_MIN = 40;

const num = (v: unknown): v is number => typeof v === "number" && !Number.isNaN(v);
const gredBagi = (m: number) => GRED_SPM.find((g) => m >= g.min) ?? GRED_SPM[GRED_SPM.length - 1];
export const gpsBagi = (m: number) => gredBagi(m).gps;
const purata = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const bundar = (v: number | null, d = 2) => (v == null ? null : +v.toFixed(d));
// Markah terkini: Percubaan, jika belum ada AR2, jika belum ada AR1
const terkini = (m: Markah) => (num(m.percubaan) ? m.percubaan : num(m.ar2) ? m.ar2 : num(m.ar1) ? m.ar1 : null);

export type GpsUjian = Record<UjianKey, number | null>;

export interface Panitia {
  subjek: string;
  guru: string;
  gps: number | null; // GPMP berdasarkan markah terkini
  gpsAR1: number | null;
  bil: number;
}

export interface KelasBelum {
  id: string;
  label: string;
  guru: string;
  belum: number;
  jumlah: number;
}

export interface Komposisi {
  label: string;
  bil: number;
}

export interface AnalisisSekolah extends SekolahInduk {
  adaData: boolean;
  gps: number | null;
  gpsUjian: GpsUjian;
  bilMurid: number;
  bilRekod: number;
  lulusPct: number; // % murid lulus semua subjek (markah terkini)
  berisiko: number;
  risikoPct: number;
  isiPct: number; // pengisian peperiksaan semasa
  bilKelas: number;
  kelasBelum: KelasBelum[];
  panitia: Panitia[];
  komposisi: Record<DimensiJurang, Komposisi[]>;
  ramal: number | null;
}

export type DimensiJurang = "ses" | "lokasi" | "jantina" | "penginapan";
export const DIMENSI: Record<DimensiJurang, { label: string; tajuk: string; kumpulan: string[] }> = {
  ses: { label: "SES", tajuk: "Sosioekonomi (SES)", kumpulan: ["B40", "M40", "T20"] },
  lokasi: { label: "Lokasi", tajuk: "Lokasi kediaman", kumpulan: ["Bandar", "Luar Bandar", "Pedalaman"] },
  jantina: { label: "Jantina", tajuk: "Jantina", kumpulan: ["Perempuan", "Lelaki"] },
  penginapan: { label: "Penginapan", tajuk: "Penginapan", kumpulan: ["Asrama", "Harian"] },
};

export interface KumpulanJurang {
  label: string;
  bil: number;
  gps: number;
  gpsAR1: number | null;
  lulusPct: number;
}

export interface Jurang {
  dim: DimensiJurang;
  kumpulan: KumpulanJurang[];
  magnitud: number; // beza GPS antara kumpulan terbaik dan terlemah
  terbaik: string;
  terlemah: string;
}

export type StatusLMS = "layak" | "tidak" | "belum";
export interface KiraanLMS {
  label: string;
  layak: number;
  tidak: number;
  belum: number;
  jumlah: number;
}
export interface AnalisisLMS {
  jumlah: KiraanLMS;
  ikutSekolah: KiraanLMS[];
  ikutPenginapan: KiraanLMS[];
  gagalBM: number;
  gagalSejarah: number;
  gagalKeduanya: number;
}

export interface AnalisisDaerah {
  peperiksaan: Peperiksaan;
  sekolah: AnalisisSekolah[]; // sekolah yang ada data, disusun GPS terbaik dahulu
  tiadaData: AnalisisSekolah[];
  gps: number | null;
  gpsUjian: GpsUjian;
  bilMurid: number;
  lulusPct: number;
  berisiko: number;
  isiPct: number;
  taburanGred: { gred: string; kategori: Kategori; bil: number }[];
  taburanKategori: { kategori: Kategori; bil: number; pct: number }[];
  jurang: Record<DimensiJurang, Jurang | null>;
  lms: AnalisisLMS;
  subjek: string[];
  gpsSubjek: { subjek: string; gps: number; bil: number }[]; // purata daerah, terburuk dahulu
  ramal: number | null;
}

interface RekodMurid {
  p: Pelajar;
  sekolah: string;
  terkini: number[];
  ar1: number[];
  bm: number | null | undefined; // undefined = tiada kelas subjek itu
  sejarah: number | null | undefined;
}

// Unjuran GPS SPM: GPS ujian terkini + 60% daripada purata perubahan antara ujian (kesinambungan trend yang diredam)
function ramalGPS(g: GpsUjian): number | null {
  const siri = UJIAN.map((u) => g[u.key]).filter(num);
  if (siri.length < 2) return siri.length ? siri[0] : null;
  const akhir = siri[siri.length - 1];
  const cerun = (akhir - siri[0]) / (siri.length - 1);
  return +Math.min(10, Math.max(1, akhir + cerun * 0.6)).toFixed(2);
}

function gpsIkutUjian(rekod: Markah[]): GpsUjian {
  const out = {} as GpsUjian;
  UJIAN.forEach((u) => {
    out[u.key] = bundar(purata(rekod.map((m) => m[u.key]).filter(num).map(gpsBagi)));
  });
  return out;
}

function kumpulMurid(kelas: Kelas[], marks: Marks): Map<string, RekodMurid> {
  const peta = new Map<string, RekodMurid>();
  kelas.forEach((k) =>
    k.pelajar.forEach((p) => {
      const kunci = `${k.sekolah}|${p.muridId || p.id}`;
      const m = marks[p.id] || {};
      let r = peta.get(kunci);
      if (!r) peta.set(kunci, (r = { p, sekolah: k.sekolah, terkini: [], ar1: [], bm: undefined, sejarah: undefined }));
      const t = terkini(m);
      if (t != null) r.terkini.push(t);
      if (num(m.ar1)) r.ar1.push(m.ar1);
      if (k.subjek === "Bahasa Melayu") r.bm = t;
      if (k.subjek === "Sejarah") r.sejarah = t;
    }),
  );
  return peta;
}

// Murid berisiko: purata markah terkini semua subjek < 45, atau purata merosot > 5 markah sejak AR1
// (takrif yang sama dengan amaran awal portal, PPDData.ringkasanSPM)
function berisiko(r: RekodMurid) {
  const t = purata(r.terkini);
  if (t == null) return false;
  const a = purata(r.ar1);
  return t < 45 || (a != null && a - t > 5);
}

function kiraLMS(label: string, murid: RekodMurid[]): KiraanLMS {
  const k = { label, layak: 0, tidak: 0, belum: 0, jumlah: murid.length };
  murid.forEach((r) => {
    k[statusLMS(r)]++;
  });
  return k;
}
// Layak Menerima Sijil (LMS): lulus Bahasa Melayu DAN Sejarah
function statusLMS(r: RekodMurid): StatusLMS {
  if (!num(r.bm) || !num(r.sejarah)) return "belum";
  return r.bm >= LULUS_MIN && r.sejarah >= LULUS_MIN ? "layak" : "tidak";
}

export function analisisDaerah(kelas: Kelas[], marks: Marks, sekolahInduk: SekolahInduk[], pe: Peperiksaan): AnalisisDaerah {
  const murid = kumpulMurid(kelas, marks);
  const semuaMurid = [...murid.values()];

  const sekolahSemua: AnalisisSekolah[] = sekolahInduk.map((sk) => {
    const ks = kelas.filter((k) => k.sekolah === sk.nama);
    const rekod = ks.flatMap((k) => k.pelajar.map((p) => marks[p.id] || {}));
    const ms = semuaMurid.filter((r) => r.sekolah === sk.nama);
    const adaMarkah = ms.filter((r) => r.terkini.length);
    const lulus = adaMarkah.filter((r) => r.terkini.every((v) => v >= LULUS_MIN)).length;
    const risiko = ms.filter(berisiko).length;
    const belumIsi = (k: Kelas) => k.pelajar.filter((p) => !marks[p.id] || marks[p.id][pe.key] === undefined).length;
    const jumlahBelum = ks.reduce((a, k) => a + belumIsi(k), 0);
    const gpsUjian = gpsIkutUjian(rekod);

    const ikutSubjek = new Map<string, Kelas[]>();
    ks.forEach((k) => ikutSubjek.set(k.subjek, [...(ikutSubjek.get(k.subjek) || []), k]));
    const panitia: Panitia[] = [...ikutSubjek.entries()].map(([subjek, kk]) => {
      const mm = kk.flatMap((k) => k.pelajar.map((p) => marks[p.id] || {}));
      return {
        subjek,
        guru: [...new Set(kk.map((k) => k.guru))].join(", "),
        gps: bundar(purata(mm.map(terkini).filter(num).map(gpsBagi))),
        gpsAR1: bundar(purata(mm.map((m) => m.ar1).filter(num).map(gpsBagi))),
        bil: mm.length,
      };
    });

    const komposisi = {} as Record<DimensiJurang, Komposisi[]>;
    (Object.keys(DIMENSI) as DimensiJurang[]).forEach((d) => {
      komposisi[d] = DIMENSI[d].kumpulan.map((label) => ({ label, bil: ms.filter((r) => r.p[d] === label).length }));
    });

    return {
      ...sk,
      adaData: ks.length > 0,
      gps: bundar(purata(rekod.map(terkini).filter(num).map(gpsBagi))),
      gpsUjian,
      bilMurid: ms.length,
      bilRekod: rekod.length,
      lulusPct: adaMarkah.length ? Math.round((lulus / adaMarkah.length) * 100) : 0,
      berisiko: risiko,
      risikoPct: ms.length ? Math.round((risiko / ms.length) * 100) : 0,
      isiPct: rekod.length ? Math.round(((rekod.length - jumlahBelum) / rekod.length) * 100) : 0,
      bilKelas: ks.length,
      kelasBelum: ks
        .map((k) => ({ id: k.id, label: `${k.tingkatan} ${k.kelas} · ${k.subjek}`, guru: k.guru, belum: belumIsi(k), jumlah: k.pelajar.length }))
        .filter((k) => k.belum > 0),
      panitia,
      komposisi,
      ramal: ramalGPS(gpsUjian),
    };
  });

  const sekolah = sekolahSemua.filter((s) => s.adaData && s.gps != null).sort((a, b) => a.gps! - b.gps!);
  const semuaRekod = kelas.flatMap((k) => k.pelajar.map((p) => marks[p.id] || {}));
  const markahTerkini = semuaRekod.map(terkini).filter(num);
  const adaMarkah = semuaMurid.filter((r) => r.terkini.length);
  const jumlahBelum = semuaRekod.filter((m) => m[pe.key] === undefined).length;

  const taburanGred = GRED_SPM.map((g) => ({ gred: g.gred, kategori: g.kategori as Kategori, bil: markahTerkini.filter((m) => gredBagi(m).gred === g.gred).length }));
  const taburanKategori = KATEGORI.map((kategori) => {
    const bil = taburanGred.filter((g) => g.kategori === kategori).reduce((a, g) => a + g.bil, 0);
    return { kategori, bil, pct: markahTerkini.length ? Math.round((bil / markahTerkini.length) * 100) : 0 };
  });

  // Jurang: satu murid = purata GPS semua subjeknya
  const jurang = {} as Record<DimensiJurang, Jurang | null>;
  (Object.keys(DIMENSI) as DimensiJurang[]).forEach((dim) => {
    const kumpulan = DIMENSI[dim].kumpulan
      .map((label): KumpulanJurang | null => {
        const g = adaMarkah.filter((r) => r.p[dim] === label);
        if (!g.length) return null;
        const dgnAR1 = g.filter((r) => r.ar1.length);
        return {
          label,
          bil: g.length,
          gps: +purata(g.map((r) => purata(r.terkini.map(gpsBagi))!))!.toFixed(2),
          gpsAR1: bundar(purata(dgnAR1.map((r) => purata(r.ar1.map(gpsBagi))!))),
          lulusPct: Math.round((g.filter((r) => r.terkini.every((v) => v >= LULUS_MIN)).length / g.length) * 100),
        };
      })
      .filter((x): x is KumpulanJurang => x !== null);
    if (kumpulan.length < 2) {
      jurang[dim] = null;
      return;
    }
    const susun = [...kumpulan].sort((a, b) => a.gps - b.gps);
    jurang[dim] = { dim, kumpulan, magnitud: +(susun[susun.length - 1].gps - susun[0].gps).toFixed(2), terbaik: susun[0].label, terlemah: susun[susun.length - 1].label };
  });

  const tidakLayak = semuaMurid.filter((r) => statusLMS(r) === "tidak");
  const lms: AnalisisLMS = {
    jumlah: kiraLMS("Daerah", semuaMurid),
    ikutSekolah: sekolah.map((s) => kiraLMS(s.nama, semuaMurid.filter((r) => r.sekolah === s.nama))),
    ikutPenginapan: DIMENSI.penginapan.kumpulan.map((p) => kiraLMS(p, semuaMurid.filter((r) => r.p.penginapan === p))),
    gagalBM: tidakLayak.filter((r) => r.bm! < LULUS_MIN && r.sejarah! >= LULUS_MIN).length,
    gagalSejarah: tidakLayak.filter((r) => r.sejarah! < LULUS_MIN && r.bm! >= LULUS_MIN).length,
    gagalKeduanya: tidakLayak.filter((r) => r.bm! < LULUS_MIN && r.sejarah! < LULUS_MIN).length,
  };

  const subjek = [...new Set(kelas.map((k) => k.subjek))].sort();
  const gpsSubjek = subjek
    .map((s) => {
      const mm = kelas.filter((k) => k.subjek === s).flatMap((k) => k.pelajar.map((p) => terkini(marks[p.id] || {}))).filter(num);
      return { subjek: s, gps: +(purata(mm.map(gpsBagi)) ?? 0).toFixed(2), bil: mm.length };
    })
    .filter((s) => s.bil > 0)
    .sort((a, b) => b.gps - a.gps);

  const gpsUjian = gpsIkutUjian(semuaRekod);
  return {
    peperiksaan: pe,
    sekolah,
    tiadaData: sekolahSemua.filter((s) => !s.adaData),
    gps: bundar(purata(markahTerkini.map(gpsBagi))),
    gpsUjian,
    bilMurid: semuaMurid.length,
    lulusPct: adaMarkah.length ? Math.round((adaMarkah.filter((r) => r.terkini.every((v) => v >= LULUS_MIN)).length / adaMarkah.length) * 100) : 0,
    berisiko: semuaMurid.filter(berisiko).length,
    isiPct: semuaRekod.length ? Math.round(((semuaRekod.length - jumlahBelum) / semuaRekod.length) * 100) : 0,
    taburanGred,
    taburanKategori,
    jurang,
    lms,
    subjek,
    gpsSubjek,
    ramal: ramalGPS(gpsUjian),
  };
}

// Tahap GPS untuk pewarnaan: lebih rendah lebih baik
export type TahapGps = "baik" | "sederhana" | "lemah";
export const tahapGps = (g: number | null): TahapGps | null => (g == null ? null : g <= 5.0 ? "baik" : g <= 5.7 ? "sederhana" : "lemah");
export const fmtGps = (g: number | null | undefined) => (g == null ? "—" : g.toFixed(2));

/* ── Intervensi (rekod tindakan PPD) ── */
export interface Intervensi {
  id: string;
  kodSekolah: string;
  sekolah: string;
  subjek: string; // "" = seluruh sekolah
  jenis: string;
  tarikh: string;
  pj: string;
  sasaran: number;
  catatan: string;
  gpsMula: number | null;
}
export const JENIS_INTERVENSI = ["Kelas Tambahan", "Program Motivasi", "Bengkel Subjek", "Pemantauan GPS", "Lain-lain"];
const KUNCI_INTERVENSI = "ppd_spm_intervensi";

export function bacaIntervensi(): Intervensi[] {
  try {
    const v = JSON.parse(localStorage.getItem(KUNCI_INTERVENSI) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
export function simpanIntervensi(senarai: Intervensi[]) {
  try {
    localStorage.setItem(KUNCI_INTERVENSI, JSON.stringify(senarai));
  } catch {}
}
// GPS semasa bagi sasaran intervensi: panitia subjek jika dinyatakan, jika tidak GPS sekolah
export function gpsSemasaIntervensi(i: Intervensi, d: AnalisisDaerah): number | null {
  const s = d.sekolah.find((x) => x.kod === i.kodSekolah);
  if (!s) return null;
  return i.subjek ? (s.panitia.find((p) => p.subjek === i.subjek)?.gps ?? null) : s.gps;
}
