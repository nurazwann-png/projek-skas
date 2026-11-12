// Pengiraan paparan Pentadbir Sekolah (Analitik SPM). Semua angka daripada stor kongsi
// (kelas + markah yang diisi guru) dan rekod GPS tahun lepas yang diisi sendiri oleh pentadbir.
// Tiada angka contoh atau data tahun lepas yang direka.
import type { Kelas, Marks, Markah, PPDDataApi, Pengguna, Peperiksaan, Peringatan, SekolahInduk, UjianKey } from "@/lib/portal/stor";
import { GRED_SPM, LULUS_MIN, UJIAN, analisisDaerah, fmtGps, gpsBagi, type AnalisisDaerah, type AnalisisSekolah, type StatusLMS } from "./analitik";

const num = (v: unknown): v is number => typeof v === "number" && !Number.isNaN(v);
const purata = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const besar = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim().toLocaleUpperCase("ms-MY");

export const gredBagi = (m: number) => GRED_SPM.find((g) => m >= g.min) ?? GRED_SPM[GRED_SPM.length - 1];
export function markahTerkini(m: Markah | undefined): { nilai: number; ujian: UjianKey } | null {
  if (!m) return null;
  if (num(m.percubaan)) return { nilai: m.percubaan, ujian: "percubaan" };
  if (num(m.ar2)) return { nilai: m.ar2, ujian: "ar2" };
  if (num(m.ar1)) return { nilai: m.ar1, ujian: "ar1" };
  return null;
}
export const labelKelas = (k: Kelas) => `${k.tingkatan} ${k.kelas}`.trim();

// Status GPMP (ambang yang sama dengan paparan asal): <= 4.50 cemerlang, <= 5.50 sederhana
export type StatusGpmp = "Cemerlang" | "Sederhana" | "Perlu perhatian";
export const statusGpmp = (g: number): StatusGpmp => (g <= 4.5 ? "Cemerlang" : g <= 5.5 ? "Sederhana" : "Perlu perhatian");

/* ── Sekolah pengguna ── */
export function sekolahPengguna(data: PPDDataApi, pengguna: Pengguna): SekolahInduk | null {
  // PPDData.sekolahUser wujud dalam stor tetapi belum ada dalam jenis PPDDataApi
  const luas = data as PPDDataApi & { sekolahUser?: (u: Pengguna) => SekolahInduk | null };
  if (typeof luas.sekolahUser === "function") return luas.sekolahUser(pengguna);
  const senarai = data.sekolahList();
  return senarai.find((s) => s.kod === pengguna.kodSekolah) ?? senarai.find((s) => s.nama === besar(pengguna.org)) ?? null;
}

/* ── Pengisian markah ── */
// undefined = belum diisi; null (tidak hadir) dikira selesai. Takrif sama dengan PPDData.spm.belumIsi
export const belumIsi = (k: Kelas, key: UjianKey, marks: Marks) => (k.pelajar || []).filter((p) => !marks[p.id] || marks[p.id][key] === undefined).length;

export interface KelasIsi {
  id: string;
  label: string; // "5 AMANAH"
  subjek: string;
  guru: string;
  belum: number;
  jumlah: number;
  peringatan: Peringatan | null;
}
export interface GuruIsi {
  guru: string;
  subjek: string[];
  kelas: KelasIsi[];
  jumlah: number;
  belum: number;
  pct: number;
}
export interface Pengisian {
  bilKelas: number;
  lengkap: Record<UjianKey, number>; // bil. kelas yang lengkap bagi setiap ujian
  guru: GuruIsi[]; // pengisian terendah dahulu
  kelas: KelasIsi[];
  baki: number; // hari sebelum tarikh akhir (negatif = lewat)
}

function kiraPengisian(kelas: Kelas[], marks: Marks, pe: Peperiksaan, baki: number, ingat: (id: string) => Peringatan | null): Pengisian {
  const baris: KelasIsi[] = kelas.map((k) => ({ id: k.id, label: labelKelas(k), subjek: k.subjek, guru: k.guru, belum: belumIsi(k, pe.key, marks), jumlah: (k.pelajar || []).length, peringatan: ingat(k.id) }));
  const ikutGuru = new Map<string, KelasIsi[]>();
  baris.forEach((b) => ikutGuru.set(b.guru, [...(ikutGuru.get(b.guru) || []), b]));
  const lengkap = {} as Record<UjianKey, number>;
  UJIAN.forEach((u) => {
    lengkap[u.key] = kelas.filter((k) => belumIsi(k, u.key, marks) === 0).length;
  });
  return {
    bilKelas: kelas.length,
    lengkap,
    kelas: baris,
    baki,
    guru: [...ikutGuru.entries()]
      .map(([guru, ks]) => {
        const jumlah = ks.reduce((a, k) => a + k.jumlah, 0);
        const belum = ks.reduce((a, k) => a + k.belum, 0);
        return { guru, subjek: [...new Set(ks.map((k) => k.subjek))], kelas: ks, jumlah, belum, pct: jumlah ? Math.round(((jumlah - belum) / jumlah) * 100) : 0 };
      })
      .sort((a, b) => a.pct - b.pct || a.guru.localeCompare(b.guru)),
  };
}

/* ── Rekod berisiko ── */
// Takrif paparan sekolah yang asal: bagi satu subjek, markah terkini merosot lebih 5 markah sejak AR1,
// atau markah terkini di bawah tahap lulus (40).
export interface RekodRisiko {
  id: string;
  muridId: string;
  nama: string;
  kelas: string;
  subjek: string;
  guru: string;
  ses?: string;
  lokasi?: string;
  penginapan?: string;
  markah: Partial<Record<UjianKey, number>>;
  terkini: number;
  ujian: UjianKey;
  jatuh: number | null; // AR1 − terkini (positif = merosot)
  gagal: boolean;
  merosot: boolean;
}

function kiraRisiko(kelas: Kelas[], marks: Marks): RekodRisiko[] {
  const out: RekodRisiko[] = [];
  kelas.forEach((k) =>
    (k.pelajar || []).forEach((p) => {
      const m = marks[p.id] || {};
      const t = markahTerkini(m);
      if (!t) return;
      const jatuh = num(m.ar1) ? m.ar1 - t.nilai : null;
      const merosot = jatuh != null && jatuh > 5;
      const gagal = t.nilai < LULUS_MIN;
      if (!merosot && !gagal) return;
      const markah: Partial<Record<UjianKey, number>> = {};
      UJIAN.forEach((u) => {
        const v = m[u.key];
        if (num(v)) markah[u.key] = v;
      });
      out.push({ id: `${k.id}|${p.id}`, muridId: p.muridId || p.id, nama: p.nama, kelas: labelKelas(k), subjek: k.subjek, guru: k.guru, ses: p.ses, lokasi: p.lokasi, penginapan: p.penginapan, markah, terkini: t.nilai, ujian: t.ujian, jatuh, gagal, merosot });
    }),
  );
  return out.sort((a, b) => (b.jatuh ?? 0) - (a.jatuh ?? 0) || a.terkini - b.terkini || a.nama.localeCompare(b.nama));
}

/* ── LMS setiap murid ── */
// undefined = murid tiada kelas subjek itu; null = markah belum diisi
export interface MuridLMS {
  muridId: string;
  nama: string;
  kelas: string;
  penginapan: string;
  bm: number | null | undefined;
  sejarah: number | null | undefined;
  status: StatusLMS;
}

function kiraLMS(kelas: Kelas[], marks: Marks): MuridLMS[] {
  const peta = new Map<string, MuridLMS>();
  kelas.forEach((k) =>
    (k.pelajar || []).forEach((p) => {
      const kunci = p.muridId || p.id;
      let r = peta.get(kunci);
      if (!r) peta.set(kunci, (r = { muridId: kunci, nama: p.nama, kelas: labelKelas(k), penginapan: p.penginapan || "", bm: undefined, sejarah: undefined, status: "belum" }));
      const t = markahTerkini(marks[p.id])?.nilai ?? null;
      if (k.subjek === "Bahasa Melayu") r.bm = t;
      if (k.subjek === "Sejarah") r.sejarah = t;
    }),
  );
  // Takrif sama dengan analisis daerah: layak hanya jika kedua-dua markah ada dan lulus
  return [...peta.values()]
    .map((r) => ({ ...r, status: (!num(r.bm) || !num(r.sejarah) ? "belum" : r.bm >= LULUS_MIN && r.sejarah >= LULUS_MIN ? "layak" : "tidak") as StatusLMS }))
    .sort((a, b) => a.kelas.localeCompare(b.kelas) || a.nama.localeCompare(b.nama));
}

/* ── Konteks sekolah ── */
export interface KonteksSekolah {
  sekolah: SekolahInduk;
  kelas: Kelas[];
  marks: Marks;
  pe: Peperiksaan;
  tahun: string;
  d: AnalisisDaerah; // analisis yang dihadkan kepada sekolah ini sahaja
  s: AnalisisSekolah | null; // null = belum ada markah
  pengisian: Pengisian;
  risiko: RekodRisiko[];
  bilMuridBerisiko: number;
  lms: MuridLMS[];
}

export function binaKonteks(data: PPDDataApi, pengguna: Pengguna): KonteksSekolah | null {
  const sekolah = sekolahPengguna(data, pengguna);
  if (!sekolah) return null;
  const kelas = data.spm.kelas().filter((k) => k.sekolah === sekolah.nama);
  const marks = data.spm.marks();
  const pe = data.PEPERIKSAAN_SEMASA;
  const d = analisisDaerah(kelas, marks, [sekolah], pe);
  const risiko = kiraRisiko(kelas, marks);
  return {
    sekolah,
    kelas,
    marks,
    pe,
    tahun: kelas.find((k) => k.tahun)?.tahun || pe.tarikhAkhir.slice(0, 4),
    d,
    s: d.sekolah[0] ?? null,
    pengisian: kiraPengisian(kelas, marks, pe, -data.hari(pe.tarikhAkhir), (id) => data.peringatan.untukKelas(id)),
    risiko,
    bilMuridBerisiko: new Set(risiko.map((r) => r.muridId)).size,
    lms: kiraLMS(kelas, marks),
  };
}

/* ── Rekod GPS SPM tahun-tahun lepas (diisi pentadbir; kunci & bentuk sama dengan aplikasi asal) ── */
export interface RekodGps {
  tahun: number;
  gps: number;
  lulus100: boolean;
  subjekCemerlang: number | null;
  bilPelajar: number | null;
}
const kunciSejarah = (org: string) => `skas_gps_sejarah:${org}`;
const kunciSasaran = (org: string) => `skas_gps_sasaran:${org}`;

export function bacaGpsSejarah(org: string): RekodGps[] {
  try {
    const v = JSON.parse(localStorage.getItem(kunciSejarah(org)) || "[]");
    if (!Array.isArray(v)) return [];
    return (v as RekodGps[]).filter((r) => r && num(r.tahun) && num(r.gps)).sort((a, b) => a.tahun - b.tahun);
  } catch {
    return [];
  }
}
export function simpanGpsSejarah(org: string, data: RekodGps[]): boolean {
  try {
    localStorage.setItem(kunciSejarah(org), JSON.stringify([...data].sort((a, b) => a.tahun - b.tahun)));
    return true;
  } catch {
    return false;
  }
}
// Purata penambahbaikan GPS setahun bagi (sehingga) empat rekod terakhir; positif = GPS menurun = lebih baik
export function purataPenambahbaikan(data: RekodGps[]): number | null {
  if (data.length < 2) return null;
  const akhir = data.slice(-4);
  return akhir.slice(1).reduce((a, r, i) => a + (akhir[i].gps - r.gps), 0) / (akhir.length - 1);
}
// Cadangan sasaran: GPS tahun terakhir tolak purata penambahbaikan (sekurang-kurangnya 0.05)
export function cadanganSasaran(data: RekodGps[]): number | null {
  if (!data.length) return null;
  return +Math.max(1, data[data.length - 1].gps - Math.max(purataPenambahbaikan(data) ?? 0, 0.05)).toFixed(2);
}
export function bacaSasaranGps(org: string): number | null {
  try {
    const v = parseFloat(localStorage.getItem(kunciSasaran(org)) || "");
    return num(v) && v >= 1 && v <= 10 ? v : null;
  } catch {
    return null;
  }
}
export function simpanSasaranGps(org: string, v: number): boolean {
  try {
    localStorage.setItem(kunciSasaran(org), v.toFixed(2));
    return true;
  } catch {
    return false;
  }
}

/* ── Laporan ── */
export type JenisLaporan = "gps" | "panitia" | "berisiko" | "pengisian";
export const SENARAI_LAPORAN: { jenis: JenisLaporan; tajuk: string; sub: string }[] = [
  { jenis: "gps", tajuk: "Laporan GPS Sekolah", sub: "Ringkasan pencapaian GPS dan GPMP setiap mata pelajaran" },
  { jenis: "panitia", tajuk: "Laporan Panitia Mata Pelajaran", sub: "GPS dan kadar lulus setiap kelas mengikut panitia" },
  { jenis: "berisiko", tajuk: "Laporan Pelajar Berisiko", sub: "Senarai rekod murid yang memerlukan intervensi" },
  { jenis: "pengisian", tajuk: "Laporan Pengisian Data", sub: "Status pengisian markah setiap kelas dan guru" },
];
export interface Laporan {
  jenis: JenisLaporan;
  tajuk: string;
  sub: string;
  kpi: { label: string; nilai: string; nota: string }[];
  lajur: { tajuk: string; kanan?: boolean }[];
  baris: (string | number)[][];
  kosong: string;
  nota: string;
}

const markahAtau = (v: number | undefined) => (v == null ? "—" : String(v));

export function binaLaporan(jenis: JenisLaporan, k: KonteksSekolah): Laporan {
  const asas = SENARAI_LAPORAN.find((l) => l.jenis === jenis)!;
  const ujianSemasa = k.pe.label;
  if (jenis === "gps") {
    const panitia = [...(k.s?.panitia ?? [])].filter((p) => p.gps != null).sort((a, b) => b.gps! - a.gps!);
    return {
      ...asas,
      sub: `${k.sekolah.nama} · SPM ${k.tahun}`,
      kpi: [
        { label: "GPS sekolah", nilai: fmtGps(k.d.gps), nota: "Markah terkini semua subjek" },
        { label: "Lulus semua subjek", nilai: `${k.d.lulusPct}%`, nota: "Murid dengan semua markah 40 ke atas" },
        { label: "Murid berisiko", nilai: String(k.bilMuridBerisiko), nota: "Merosot lebih 5 markah atau gagal" },
        { label: "Jumlah murid", nilai: String(k.d.bilMurid), nota: `${k.kelas.length} kelas subjek` },
      ],
      lajur: [{ tajuk: "Mata pelajaran" }, { tajuk: "Guru" }, { tajuk: "Bil. murid", kanan: true }, { tajuk: "GPMP AR1", kanan: true }, { tajuk: "GPMP terkini", kanan: true }, { tajuk: "Status" }],
      baris: panitia.map((p) => [p.subjek, p.guru, p.bil, fmtGps(p.gpsAR1), fmtGps(p.gps), statusGpmp(p.gps!)]),
      kosong: "Belum ada markah diisi.",
      nota: "GPS dikira daripada markah terkini setiap murid (Percubaan, jika tiada AR2, jika tiada AR1). Nilai lebih rendah lebih baik.",
    };
  }
  if (jenis === "panitia") {
    const baris = [...k.kelas]
      .sort((a, b) => a.subjek.localeCompare(b.subjek) || labelKelas(a).localeCompare(labelKelas(b)))
      .map((kl) => {
        const mm = (kl.pelajar || []).map((p) => markahTerkini(k.marks[p.id])?.nilai).filter(num);
        const gps = purata(mm.map(gpsBagi));
        return [kl.subjek, labelKelas(kl), kl.guru, mm.length, gps == null ? "—" : gps.toFixed(2), mm.length ? `${Math.round((mm.filter((m) => m >= LULUS_MIN).length / mm.length) * 100)}%` : "—"];
      });
    return {
      ...asas,
      sub: `${k.sekolah.nama} · SPM ${k.tahun}`,
      kpi: [
        { label: "Jumlah panitia", nilai: String(k.d.subjek.length), nota: "Mata pelajaran" },
        { label: "Jumlah kelas", nilai: String(k.kelas.length), nota: "Kelas subjek berdaftar" },
        { label: "GPS sekolah", nilai: fmtGps(k.d.gps), nota: "Markah terkini" },
      ],
      lajur: [{ tajuk: "Mata pelajaran" }, { tajuk: "Kelas" }, { tajuk: "Guru" }, { tajuk: "Bil. markah", kanan: true }, { tajuk: "GPS", kanan: true }, { tajuk: "Lulus", kanan: true }],
      baris,
      kosong: "Belum ada kelas berdaftar.",
      nota: "GPS dan kadar lulus dikira daripada markah terkini murid yang telah diisi.",
    };
  }
  if (jenis === "berisiko") {
    return {
      ...asas,
      sub: `${k.sekolah.nama} · SPM ${k.tahun}`,
      kpi: [
        { label: "Murid berisiko", nilai: String(k.bilMuridBerisiko), nota: "Sekurang-kurangnya satu subjek" },
        { label: "Rekod gagal", nilai: String(k.risiko.filter((r) => r.gagal).length), nota: "Markah terkini di bawah 40" },
        { label: "Rekod merosot", nilai: String(k.risiko.filter((r) => r.merosot).length), nota: "Turun lebih 5 markah sejak AR1" },
      ],
      lajur: [{ tajuk: "No.", kanan: true }, { tajuk: "Nama" }, { tajuk: "Kelas" }, { tajuk: "Subjek" }, { tajuk: "Guru" }, { tajuk: "SES" }, { tajuk: "AR1", kanan: true }, { tajuk: "AR2", kanan: true }, { tajuk: "Percubaan", kanan: true }, { tajuk: "Perubahan", kanan: true }, { tajuk: "Status" }],
      baris: k.risiko.map((r, i) => [i + 1, r.nama, r.kelas, r.subjek, r.guru, r.ses || "—", markahAtau(r.markah.ar1), markahAtau(r.markah.ar2), markahAtau(r.markah.percubaan), r.jatuh == null ? "—" : r.jatuh > 0 ? `−${r.jatuh}` : `+${-r.jatuh}`, r.gagal && r.merosot ? "Gagal & merosot" : r.gagal ? "Gagal" : "Merosot"]),
      kosong: "Tiada rekod murid berisiko dikesan.",
      nota: "Rekod berisiko: markah terkini merosot lebih 5 markah sejak AR1, atau di bawah tahap lulus (40).",
    };
  }
  const jumlah = k.pengisian.kelas.reduce((a, x) => a + x.jumlah, 0);
  const belum = k.pengisian.kelas.reduce((a, x) => a + x.belum, 0);
  return {
    ...asas,
    sub: `${k.sekolah.nama} · ${ujianSemasa}`,
    kpi: [
      { label: "Kelas lengkap", nilai: `${k.pengisian.lengkap[k.pe.key]}/${k.pengisian.bilKelas}`, nota: ujianSemasa },
      { label: "Jumlah rekod", nilai: String(jumlah), nota: "Murid × subjek" },
      { label: "Rekod diisi", nilai: String(jumlah - belum), nota: "Termasuk tidak hadir (TH)" },
      { label: "Pengisian", nilai: jumlah ? `${Math.round(((jumlah - belum) / jumlah) * 100)}%` : "0%", nota: "Keseluruhan sekolah" },
    ],
    lajur: [{ tajuk: "Mata pelajaran" }, { tajuk: "Kelas" }, { tajuk: "Guru" }, { tajuk: "Jumlah", kanan: true }, { tajuk: "Diisi", kanan: true }, { tajuk: "Kemajuan", kanan: true }, { tajuk: "Status" }],
    baris: [...k.pengisian.kelas]
      .sort((a, b) => (a.jumlah ? (a.jumlah - a.belum) / a.jumlah : 0) - (b.jumlah ? (b.jumlah - b.belum) / b.jumlah : 0))
      .map((x) => {
        const pct = x.jumlah ? Math.round(((x.jumlah - x.belum) / x.jumlah) * 100) : 0;
        return [x.subjek, x.label, x.guru, x.jumlah, x.jumlah - x.belum, `${pct}%`, x.belum === 0 ? "Lengkap" : pct > 0 ? "Separa" : "Belum mula"];
      }),
    kosong: "Belum ada kelas berdaftar.",
    nota: `Pengisian dikira bagi ${ujianSemasa} sahaja. Murid tidak hadir (TH) dikira telah diisi.`,
  };
}

export function laporanKeCsv(l: Laporan): string {
  const sel = (v: string | number) => {
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [l.lajur.map((c) => sel(c.tajuk)).join(","), ...l.baris.map((b) => b.map(sel).join(","))].join("\r\n");
}

const esc = (v: string | number) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Dokumen HTML ringkas untuk dicetak / disimpan sebagai PDF
export function laporanKeHtml(l: Laporan, tarikh: string): string {
  const th = l.lajur.map((c) => `<th${c.kanan ? ' class="k"' : ""}>${esc(c.tajuk)}</th>`).join("");
  const tr = l.baris.map((b) => `<tr>${b.map((v, i) => `<td${l.lajur[i]?.kanan ? ' class="k"' : ""}>${esc(v)}</td>`).join("")}</tr>`).join("");
  return `<!doctype html><html lang="ms"><head><meta charset="utf-8"><title>${esc(l.tajuk)}</title><style>
*{box-sizing:border-box}body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#111827;margin:24px;font-size:12px}
h1{font-size:18px;margin:0 0 2px}p.sub{margin:0;color:#4b5563}p.tarikh{margin:2px 0 0;color:#6b7280;font-size:11px}
.kpi{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}.kpi div{flex:1 1 120px;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px}
.kpi b{display:block;font-size:18px}.kpi span{color:#6b7280;font-size:10px}.kpi em{display:block;font-style:normal;font-size:10px;color:#374151;text-transform:uppercase;letter-spacing:.04em}
table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #e5e7eb;padding:6px 8px;text-align:left;vertical-align:top}
th{font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#4b5563;background:#f9fafb}.k{text-align:right}
p.nota{margin-top:14px;color:#6b7280;font-size:10px}tr{page-break-inside:avoid}
</style></head><body>
<h1>${esc(l.tajuk)}</h1><p class="sub">${esc(l.sub)}</p><p class="tarikh">Dijana pada ${esc(tarikh)}</p>
<div class="kpi">${l.kpi.map((x) => `<div><em>${esc(x.label)}</em><b>${esc(x.nilai)}</b><span>${esc(x.nota)}</span></div>`).join("")}</div>
${l.baris.length ? `<table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>` : `<p>${esc(l.kosong)}</p>`}
<p class="nota">${esc(l.nota)}</p>
</body></html>`;
}
