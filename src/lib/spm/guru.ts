// Pembantu tulen bagi paparan Guru Analitik SPM: status pengisian, tafsiran fail markah/murid,
// analisis kelas dan sasaran. Semua angka dikira daripada markah yang diisi guru — tiada angka rekaan.
import type { Kelas, Marks, Markah, Pelajar, PPDDataApi, Pengguna, UjianKey } from "@/lib/portal/stor";
import { GRED_SPM, KATEGORI, LULUS_MIN, UJIAN, gpsBagi, type Kategori } from "./analitik";

export interface PropGuru {
  data: PPDDataApi;
  pengguna: Pengguna;
  segar: () => void;
  makluman: (teks: string) => void;
  versi: number;
}

// PPDData.spm.save wujud dalam public/assets/ppd-data.js tetapi belum ditaip dalam stor.ts
type SpmTulis = PPDDataApi["spm"] & { save(kelas: Kelas[], marks: Marks): boolean };

/* ── Asas ── */
export const num = (v: unknown): v is number => typeof v === "number" && !Number.isNaN(v);
export const besar = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim().toLocaleUpperCase("ms-MY");
export const purata = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
export const gredBagi = (m: number) => GRED_SPM.find((g) => m >= g.min) ?? GRED_SPM[GRED_SPM.length - 1];
export const infoUjian = (key: UjianKey) => UJIAN.find((u) => u.key === key) ?? UJIAN[0];
export const BULAN_UJIAN: Record<UjianKey, string> = { ar1: "April – Mei", ar2: "Ogos – September", percubaan: "Oktober" };
export const UJIAN_SEBELUM: Record<UjianKey, UjianKey | null> = { ar1: null, ar2: "ar1", percubaan: "ar2" };
export const labelKelas = (k: Kelas) => `${k.subjek} · ${k.tingkatan} ${k.kelas}`;
export const singkatanSubjek = (subjek: string) => subjek.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 3);
export const inisial = (nama: string) => nama.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
export const namaRingkas = (nama: string) => nama.split(" ").slice(0, 2).join(" ");
// Stor menyimpan "Lelaki"/"Perempuan"; rekod lama daripada aplikasi asal mungkin "L"/"P"
export const namaJantina = (j?: string) => (j === "P" || j === "Perempuan" ? "Perempuan" : j === "L" || j === "Lelaki" ? "Lelaki" : "");
export const fmtMarkah = (v: number | null | undefined) => (v === null ? "TH" : v === undefined ? "—" : String(v));

export const SUBJEK_PILIHAN = ["Matematik", "Matematik Tambahan", "Bahasa Melayu", "Bahasa Inggeris", "Sains", "Fizik", "Kimia", "Biologi", "Sejarah", "Geografi", "Pendidikan Islam", "Pendidikan Moral", "Ekonomi", "Perniagaan", "Perakaunan"];
export const AGAMA_PILIHAN = ["Islam", "Kristian", "Buddha", "Hindu", "Lain-lain"];
export const SES_PILIHAN = ["B40", "M40", "T20"];
export const SUBJEK_WAJIB_LULUS = ["Bahasa Melayu", "Sejarah"];
// Murid dengan markah di bawah nilai ini disenaraikan untuk perhatian apabila hanya AR1 tersedia
export const AMBANG_PERHATIAN = 50;

/* ── Stor ── */
export const kelasGuru = (data: PPDDataApi, uid: string) => data.spm.kelas().filter((k) => k.guruId === uid);

// Baca stor terkini, ubah salinan itu, kemudian simpan. Kelas guru lain dan markah murid lain tidak disentuh.
export function simpanStor(data: PPDDataApi, ubah: (kelas: Kelas[], marks: Marks) => void): boolean {
  const spm = data.spm as SpmTulis;
  const kelas = spm.kelas();
  const marks = spm.marks();
  ubah(kelas, marks);
  return spm.save(kelas, marks);
}

let pembilangId = 0;
export const idBaharu = (awalan: "k" | "p") => `${awalan}${Date.now()}${pembilangId++ ? `_${pembilangId}` : ""}`;

/* ── Status pengisian ── */
export type StatusUjian = "tiada" | "belum" | "separa" | "lengkap";
export const LABEL_STATUS: Record<StatusUjian, string> = { tiada: "Tiada murid", belum: "Belum diisi", separa: "Sedang diisi", lengkap: "Lengkap" };

// undefined = belum diisi; null (TH) dikira selesai — sama seperti PPDData.spm.belumIsi
export function kiraIsi(k: Kelas, key: UjianKey, marks: Marks) {
  let selesai = 0;
  let th = 0;
  k.pelajar.forEach((p) => {
    const v = marks[p.id]?.[key];
    if (v !== undefined) selesai++;
    if (v === null) th++;
  });
  return { selesai, th, jumlah: k.pelajar.length, belum: k.pelajar.length - selesai };
}
export function statusUjian(k: Kelas, key: UjianKey, marks: Marks): StatusUjian {
  const { selesai, jumlah } = kiraIsi(k, key, marks);
  return jumlah === 0 ? "tiada" : selesai === 0 ? "belum" : selesai < jumlah ? "separa" : "lengkap";
}

// Berisiko: merosot lebih 5 markah dari AR1 ke ujian terkini (takrif kad kelas aplikasi asal)
export function merosot(m: Markah | undefined): boolean {
  if (!m) return false;
  const akhir = num(m.percubaan) ? m.percubaan : num(m.ar2) ? m.ar2 : null;
  return num(m.ar1) && akhir !== null && m.ar1 - akhir > 5;
}

export type Trend = "naik" | "turun" | "stabil";
export function trendMarkah(m: Markah | undefined, key: UjianKey): Trend | null {
  const sebelum = UJIAN_SEBELUM[key];
  const kini = m?.[key];
  const dulu = sebelum ? m?.[sebelum] : undefined;
  if (!num(kini) || !num(dulu)) return null;
  return kini < dulu - 3 ? "turun" : kini > dulu + 3 ? "naik" : "stabil";
}

/* ── Tafsiran nilai yang ditaip ── */
const TH_TEKS = ["th", "t/h", "tidak hadir", "x hadir", "abs", "absent"];
export type Tafsiran<T> = { ok: true; nilai: T } | { ok: false };

// "" = belum diisi (undefined), "TH" = tidak hadir (null), 0–100 = markah (dibundarkan)
export function tafsirMarkah(teks: string): Tafsiran<number | null | undefined> {
  const raw = teks.trim();
  if (!raw) return { ok: true, nilai: undefined };
  if (TH_TEKS.includes(raw.toLowerCase())) return { ok: true, nilai: null };
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 100) return { ok: false };
  return { ok: true, nilai: Math.round(n) };
}
export function tafsirSasaran(teks: string): Tafsiran<number | undefined> {
  const t = tafsirMarkah(teks);
  if (!t.ok || t.nilai === null) return { ok: false };
  return { ok: true, nilai: t.nilai };
}

/* ── Fail (CSV / jadual Excel) ── */
export type Jadual = string[][];

export function selKeTeks(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

// CSV ringkas yang menghormati tanda petik ("Nama, X"); pemisah koma, koma bertitik atau tab
export function pecahCSV(text: string): Jadual {
  const baris: Jadual = [];
  let r: string[] = [];
  let c = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') {
        c += '"';
        i++;
      } else if (ch === '"') q = false;
      else c += ch;
    } else if (ch === '"') q = true;
    else if (ch === "," || ch === ";" || ch === "\t") {
      r.push(c.trim());
      c = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      r.push(c.trim());
      baris.push(r);
      r = [];
      c = "";
    } else c += ch;
  }
  if (c || r.length) {
    r.push(c.trim());
    baris.push(r);
  }
  return baris.map((x) => x.map((v) => v.replace(/^﻿/, ""))).filter((x) => x.some((v) => v));
}

const LAJUR: Record<string, string[]> = {
  nama: ["nama", "name", "nama murid", "nama pelajar", "nama penuh"],
  jantina: ["jantina", "gender", "jantina pelajar", "sex"],
  ses: ["ses", "status sosioekonomi", "kumpulan isi rumah", "kir", "pendapatan"],
  agama: ["agama", "religion"],
  penginapan: ["penginapan", "jenis penginapan", "asrama/harian", "status penginapan", "asrama"],
  lokasi: ["lokasi", "location", "kawasan", "tempat tinggal", "lokasi rumah"],
  markah: ["markah", "mark", "marks", "skor", "markah ujian", "score"],
  ar1: ["ar1", "ujian 1", "ujian pertengahan", "markah ar1", "ar 1"],
  ar2: ["ar2", "ujian 2", "ujian akhir", "markah ar2", "ar 2"],
  percubaan: ["percubaan", "trial", "perc", "markah percubaan", "percubaan spm"],
};
const cariLajur = (tajuk: string[], kunci: string) => tajuk.findIndex((h) => LAJUR[kunci].includes(h));

// Baris tajuk = baris pertama (dalam 10 baris awal) yang mempunyai lajur Nama
function cariTajuk(jadual: Jadual): { tajuk: string[]; isi: { no: number; sel: string[] }[] } | null {
  for (let i = 0; i < Math.min(10, jadual.length); i++) {
    const tajuk = jadual[i].map((h) => h.toLowerCase().trim());
    if (cariLajur(tajuk, "nama") >= 0) {
      return { tajuk, isi: jadual.slice(i + 1).map((sel, j) => ({ no: i + j + 2, sel })).filter((b) => b.sel.some((v) => v.trim())) };
    }
  }
  return null;
}

// Kunci padanan nama: abaikan huruf besar/kecil, tanda baca, ruang berlebihan & variasi biasa (Mohd/Muhd, Bt/Binti, Ak/Anak)
const NAMA_SINONIM: Record<string, string> = {
  mohd: "muhammad", muhd: "muhammad", mohamad: "muhammad", mohammad: "muhammad", mohamed: "muhammad", muhamad: "muhammad", md: "muhammad",
  b: "bin", bn: "bin", bt: "binti", bte: "binti", binte: "binti", ak: "anak",
};
export function namaKunci(n: string): string {
  return String(n || "")
    .toLowerCase()
    .replace(/[@'’`.,()/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => NAMA_SINONIM[w] || w)
    .join(" ");
}

export type RalatFail = { ok: false; tajuk: string; mesej: string };

/* ── Muat naik markah (Nama + Markah) ── */
export type StatusBarisMarkah = "baru" | "ubah" | "sama" | "kosong" | "ralat" | "tiada" | "kabur" | "ulang";
export interface BarisMarkah {
  no: number; // nombor baris dalam fail
  nama: string;
  raw: string;
  status: StatusBarisMarkah;
  p?: Pelajar;
  nilai?: number | null;
  lama?: number | null;
}
export interface PratontonMarkah {
  ok: true;
  ujian: UjianKey;
  baris: BarisMarkah[];
  tiadaDalamFail: Pelajar[];
}
export const STATUS_DISIMPAN: StatusBarisMarkah[] = ["baru", "ubah"];
export const STATUS_ISU: StatusBarisMarkah[] = ["tiada", "kabur", "ulang", "ralat"];

export function padanMarkah(jadual: Jadual, k: Kelas, marks: Marks, ujian: UjianKey): PratontonMarkah | RalatFail {
  if (jadual.length < 2) return { ok: false, tajuk: "Fail kosong", mesej: "Tiada baris markah dikesan dalam fail." };
  const t = cariTajuk(jadual);
  const iNama = t ? cariLajur(t.tajuk, "nama") : -1;
  let iMark = t ? cariLajur(t.tajuk, "markah") : -1;
  if (t && iMark < 0) iMark = cariLajur(t.tajuk, ujian);
  if (t && iMark < 0 && t.tajuk.length === 2) iMark = 1 - iNama;
  if (!t || iNama < 0 || iMark < 0) return { ok: false, tajuk: "Lajur tidak dijumpai", mesej: 'Fail perlu ada lajur "Nama" dan "Markah". Muat turun templat untuk format yang betul.' };

  const kunciKe = new Map<string, Pelajar[]>();
  k.pelajar.forEach((p) => {
    const kunci = namaKunci(p.nama);
    kunciKe.set(kunci, [...(kunciKe.get(kunci) || []), p]);
  });
  const dipadan = new Set<string>();
  const baris: BarisMarkah[] = [];
  t.isi.forEach(({ no, sel }) => {
    const nama = (sel[iNama] ?? "").trim();
    const raw = (sel[iMark] ?? "").trim();
    if (!nama) return;
    const calon = kunciKe.get(namaKunci(nama)) || [];
    if (!calon.length) return void baris.push({ no, nama, raw, status: "tiada" });
    if (calon.length > 1) return void baris.push({ no, nama, raw, status: "kabur" });
    const p = calon[0];
    if (dipadan.has(p.id)) return void baris.push({ no, nama, raw, status: "ulang" });
    dipadan.add(p.id);
    const lama = marks[p.id]?.[ujian];
    if (!raw) return void baris.push({ no, nama, raw, status: "kosong", p, lama });
    const tafsir = tafsirMarkah(raw);
    if (!tafsir.ok || tafsir.nilai === undefined) return void baris.push({ no, nama, raw, status: "ralat", p, lama });
    baris.push({ no, nama, raw, p, lama, nilai: tafsir.nilai, status: lama === undefined ? "baru" : lama === tafsir.nilai ? "sama" : "ubah" });
  });
  if (!baris.length) return { ok: false, tajuk: "Fail kosong", mesej: "Tiada baris bernama dikesan di bawah tajuk lajur." };
  return { ok: true, ujian, baris, tiadaDalamFail: k.pelajar.filter((p) => !dipadan.has(p.id)) };
}

/* ── Daftar murid dari fail (Nama, Jantina, Agama, Penginapan, SES) ── */
export interface BarisMurid {
  nama: string;
  jantina: string;
  agama: string;
  penginapan: string;
  ses: string;
  lokasi: string;
  status: "baru" | "ada" | "ganda";
  kurang: string[];
}
const normSES = (raw: string) => SES_PILIHAN.find((s) => raw.toUpperCase().includes(s)) ?? "";
function normLokasi(raw: string) {
  const v = raw.toLowerCase();
  if (v.includes("pedalaman")) return "Pedalaman";
  if (v.includes("luar") || v.includes("desa") || v.includes("kampung")) return "Luar Bandar";
  if (v.includes("bandar") || v.includes("urban")) return "Bandar";
  return "";
}
function normAgama(raw: string) {
  const v = raw.toLowerCase();
  if (!v) return "";
  if (v.startsWith("isl")) return "Islam";
  if (v.startsWith("kris") || v.startsWith("chris") || v.includes("katolik")) return "Kristian";
  if (v.startsWith("bud")) return "Buddha";
  if (v.startsWith("hin")) return "Hindu";
  return "Lain-lain";
}
const normPenginapan = (raw: string) => (!raw ? "" : raw.toLowerCase().startsWith("asr") || raw.toLowerCase() === "a" ? "Asrama" : "Harian");
const normJantina = (raw: string) => (!raw ? "" : raw.toUpperCase().startsWith("P") || raw.toUpperCase().startsWith("F") ? "Perempuan" : "Lelaki");

export function tafsirMurid(jadual: Jadual, k: Kelas): { ok: true; baris: BarisMurid[] } | RalatFail {
  const t = cariTajuk(jadual);
  if (!t) return { ok: false, tajuk: "Lajur tidak dijumpai", mesej: 'Fail perlu ada lajur "Nama". Muat turun templat untuk format yang betul.' };
  const i = (kunci: string) => cariLajur(t.tajuk, kunci);
  const [iNama, iJ, iA, iP, iS, iL] = [i("nama"), i("jantina"), i("agama"), i("penginapan"), i("ses"), i("lokasi")];
  const sel = (r: string[], x: number) => (x >= 0 ? (r[x] ?? "").trim() : "");
  const ada = new Set(k.pelajar.map((p) => namaKunci(p.nama)));
  const dalamFail = new Set<string>();
  const baris = t.isi
    .map(({ sel: r }) => ({ nama: sel(r, iNama), jantina: normJantina(sel(r, iJ)), agama: normAgama(sel(r, iA)), penginapan: normPenginapan(sel(r, iP)), ses: normSES(sel(r, iS)), lokasi: normLokasi(sel(r, iL)) }))
    .filter((r) => r.nama)
    .map((r): BarisMurid => {
      const kunci = namaKunci(r.nama);
      const status = ada.has(kunci) ? "ada" : dalamFail.has(kunci) ? "ganda" : "baru";
      dalamFail.add(kunci);
      return { ...r, status, kurang: (["jantina", "agama", "penginapan", "ses"] as const).filter((f) => !r[f]) };
    });
  if (!baris.length) return { ok: false, tajuk: "Tiada data murid", mesej: "Tiada nama murid dikesan dalam fail. Semak lajur Nama." };
  return { ok: true, baris };
}

/* ── Analisis kelas ── */
export type TahapCadangan = "baik" | "amaran" | "kritikal" | "info";
export interface Cadangan {
  tahap: TahapCadangan;
  teks: string;
}

export interface MuridSasaran {
  p: Pelajar;
  markah: number;
  sasaran: number;
  jurang: number; // sasaran − markah (positif = belum capai)
}
export interface AnalisisSasaran {
  ujian: UjianKey;
  capai: MuridSasaran[];
  bawah: MuridSasaran[]; // jurang terbesar dahulu
  tiadaSasaran: Pelajar[];
  tiadaMarkah: Pelajar[]; // ada sasaran tetapi tiada markah (belum diisi / TH) bagi ujian itu
}

export interface MuridPerhatian {
  p: Pelajar;
  m: Markah;
  delta: number | null;
}

export interface AnalisisKelas {
  fasa: 0 | 1 | 2 | 3;
  ujianTerkini: UjianKey | null; // ujian terkini yang ada sekurang-kurangnya satu markah
  purata: Record<UjianKey, number | null>;
  gpmp: Record<UjianKey, number | null>; // purata mata gred (1–10), lebih rendah lebih baik
  bil: Record<UjianKey, number>;
  nilaiTerkini: number[];
  lulus: number;
  lulusPct: number;
  gagal: number;
  trend: { delta: number; label: string } | null;
  perhatian: MuridPerhatian[];
  ses: { label: string; purata: number; gpmp: number; bil: number }[];
  taburanGred: { gred: string; kategori: Kategori; bil: number }[];
  taburanKategori: { kategori: Kategori; bil: number; pct: number }[];
  wajibLulus: boolean;
  sasaran: AnalisisSasaran | null;
  cadangan: Cadangan[];
}

export function analisisSasaran(k: Kelas, marks: Marks, ujian: UjianKey): AnalisisSasaran {
  const out: AnalisisSasaran = { ujian, capai: [], bawah: [], tiadaSasaran: [], tiadaMarkah: [] };
  k.pelajar.forEach((p) => {
    const m = marks[p.id] || {};
    if (!num(m.sasaran)) return void out.tiadaSasaran.push(p);
    const markah = m[ujian];
    if (!num(markah)) return void out.tiadaMarkah.push(p);
    const r = { p, markah, sasaran: m.sasaran, jurang: m.sasaran - markah };
    (r.jurang <= 0 ? out.capai : out.bawah).push(r);
  });
  out.bawah.sort((a, b) => b.jurang - a.jurang);
  return out;
}

export function analisisKelas(k: Kelas, marks: Marks): AnalisisKelas {
  const nilai = {} as Record<UjianKey, number[]>;
  const avg = {} as Record<UjianKey, number | null>;
  const gpmp = {} as Record<UjianKey, number | null>;
  const bil = {} as Record<UjianKey, number>;
  UJIAN.forEach((u) => {
    nilai[u.key] = k.pelajar.map((p) => marks[p.id]?.[u.key]).filter(num);
    avg[u.key] = purata(nilai[u.key]);
    gpmp[u.key] = purata(nilai[u.key].map(gpsBagi));
    bil[u.key] = nilai[u.key].length;
  });
  const ujianTerkini: UjianKey | null = bil.percubaan ? "percubaan" : bil.ar2 ? "ar2" : bil.ar1 ? "ar1" : null;
  const fasa = ujianTerkini === "percubaan" ? 3 : ujianTerkini === "ar2" ? 2 : ujianTerkini === "ar1" ? 1 : 0;
  const nilaiTerkini = ujianTerkini ? nilai[ujianTerkini] : [];
  const lulus = nilaiTerkini.filter((v) => v >= LULUS_MIN).length;

  // Trend antara dua ujian terkini yang ada markah
  const sebelum = ujianTerkini ? UJIAN_SEBELUM[ujianTerkini] : null;
  const trend =
    ujianTerkini && sebelum && avg[ujianTerkini] != null && avg[sebelum] != null
      ? { delta: avg[ujianTerkini]! - avg[sebelum]!, label: `${infoUjian(sebelum).label} → ${infoUjian(ujianTerkini).label}` }
      : null;

  // Murid perlu perhatian: fasa 1 = AR1 di bawah 50; fasa 2 = merosot > 5 AR1→AR2; fasa 3 = merosot > 5 AR1→Percubaan
  const perhatian: MuridPerhatian[] = [];
  k.pelajar.forEach((p) => {
    const m = marks[p.id];
    if (!m) return;
    if (fasa === 1 && num(m.ar1) && m.ar1 < AMBANG_PERHATIAN) perhatian.push({ p, m, delta: null });
    const akhir = fasa === 2 ? m.ar2 : fasa === 3 ? m.percubaan : undefined;
    if (num(m.ar1) && num(akhir) && akhir - m.ar1 < -5) perhatian.push({ p, m, delta: akhir - m.ar1 });
  });

  const ses = ujianTerkini
    ? SES_PILIHAN.map((label) => {
        const v = k.pelajar.filter((p) => p.ses === label).map((p) => marks[p.id]?.[ujianTerkini]).filter(num);
        return { label, purata: purata(v) ?? 0, gpmp: purata(v.map(gpsBagi)) ?? 0, bil: v.length };
      }).filter((s) => s.bil > 0)
    : [];

  const taburanGred = GRED_SPM.map((g) => ({ gred: g.gred as string, kategori: g.kategori as Kategori, bil: nilaiTerkini.filter((v) => gredBagi(v).gred === g.gred).length }));
  const taburanKategori = KATEGORI.map((kategori) => {
    const b = taburanGred.filter((g) => g.kategori === kategori).reduce((a, g) => a + g.bil, 0);
    return { kategori, bil: b, pct: nilaiTerkini.length ? Math.round((b / nilaiTerkini.length) * 100) : 0 };
  });

  const a: AnalisisKelas = {
    fasa,
    ujianTerkini,
    purata: avg,
    gpmp,
    bil,
    nilaiTerkini,
    lulus,
    lulusPct: nilaiTerkini.length ? Math.round((lulus / nilaiTerkini.length) * 100) : 0,
    gagal: nilaiTerkini.length - lulus,
    trend,
    perhatian,
    ses,
    taburanGred,
    taburanKategori,
    wajibLulus: SUBJEK_WAJIB_LULUS.includes(k.subjek),
    sasaran: ujianTerkini ? analisisSasaran(k, marks, ujianTerkini) : null,
    cadangan: [],
  };
  a.cadangan = cadanganKelas(k, marks, a);
  return a;
}

const f1 = (v: number) => v.toFixed(1);
const tanda = (v: number) => `${v >= 0 ? "+" : ""}${f1(v)}`;

// Cadangan berasaskan peraturan (ambang tetap), dikira daripada markah kelas sahaja
function cadanganKelas(k: Kelas, marks: Marks, a: AnalisisKelas): Cadangan[] {
  const c: Cadangan[] = [];
  const { ar1, ar2, percubaan: perc } = a.purata;
  const nama = a.perhatian.slice(0, 3).map((x) => namaRingkas(x.p.nama)).join(", ") + (a.perhatian.length > 3 ? `, +${a.perhatian.length - 3} lagi` : "");
  const b40 = a.ses.find((s) => s.label === "B40");
  const t20 = a.ses.find((s) => s.label === "T20");
  const jurangSes = b40 && t20 && t20.purata - b40.purata > 10 ? t20.purata - b40.purata : null;

  if (a.fasa === 1 && ar1 != null) {
    c.push({ tahap: "info", teks: "Analisis awal berdasarkan AR1 sahaja. AR2 dan Percubaan belum diisi; kemas kini selepas AR2 untuk perbandingan trend." });
    if (ar1 >= 70) c.push({ tahap: "baik", teks: `Purata kelas AR1 ${f1(ar1)} adalah baik. Teruskan strategi pengajaran semasa dan pastikan semua topik sukatan SPM diliputi.` });
    else if (ar1 >= 50) c.push({ tahap: "amaran", teks: `Purata kelas AR1 ${f1(ar1)} berada pada tahap sederhana. Kenal pasti topik yang paling ramai murid lemah dan rancang sesi pengukuhan sebelum AR2.` });
    else c.push({ tahap: "kritikal", teks: `Purata kelas AR1 ${f1(ar1)} membimbangkan. Buat analisis item untuk mengenal pasti kelemahan utama dan laksanakan intervensi segera sebelum AR2.` });
    if (a.perhatian.length) c.push({ tahap: "kritikal", teks: `${a.perhatian.length} murid mendapat di bawah ${AMBANG_PERHATIAN} markah dalam AR1 (${nama}). Adakan sesi bimbingan awal dan maklumkan ibu bapa.` });
    if (a.lulusPct < 70) c.push({ tahap: "amaran", teks: `Kadar lulus AR1 ialah ${a.lulusPct}%, di bawah 70%. Rancang program pemulihan berfokus sebelum AR2.` });
  } else if (a.fasa === 2 && ar2 != null) {
    if (ar1 != null) {
      const d = ar2 - ar1;
      if (d < -5) c.push({ tahap: "kritikal", teks: `Purata kelas menurun ketara, ${f1(Math.abs(d))} markah dari AR1 ke AR2. Laksanakan sesi diagnostik menyeluruh sebelum Percubaan SPM untuk mengenal pasti punca.` });
      else if (d < 0) c.push({ tahap: "amaran", teks: `Purata kelas menurun sederhana (${f1(Math.abs(d))} markah) dari AR1 ke AR2. Pantau murid yang merosot dan beri sokongan bersasar sebelum Percubaan SPM.` });
      else if (d > 5) c.push({ tahap: "baik", teks: `Purata kelas meningkat ${tanda(d)} markah dari AR1 ke AR2. Kekalkan momentum dan tumpukan topik SPM yang masih tinggal.` });
      else c.push({ tahap: "baik", teks: `Prestasi kelas stabil antara AR1 dan AR2 (perubahan ${tanda(d)} markah). Sasarkan peningkatan dalam Percubaan SPM.` });
    }
    if (a.perhatian.length) c.push({ tahap: "kritikal", teks: `${a.perhatian.length} murid merosot lebih 5 markah dari AR1 ke AR2 (${nama}). Intervensi diperlukan sebelum Percubaan SPM.` });
    if (jurangSes != null) c.push({ tahap: "amaran", teks: `Jurang SES: purata T20 mengatasi B40 sebanyak ${f1(jurangSes)} markah (AR2). Pertimbangkan sokongan bersasar untuk murid B40 sebelum Percubaan.` });
    c.push({ tahap: "info", teks: "Percubaan SPM belum diisi. Lengkapkan markah Percubaan untuk analisis penuh tiga ujian." });
  } else if (a.fasa === 3 && perc != null) {
    if (ar1 != null) {
      const d = perc - ar1;
      if (d < -5) c.push({ tahap: "kritikal", teks: `Purata kelas menurun ketara (${f1(d)} markah dari AR1 ke Percubaan). Adakan sesi pemulihan intensif berfokus topik kelemahan utama sebelum SPM.` });
      else if (d < 0) c.push({ tahap: "amaran", teks: `Purata kelas menurun sederhana (${f1(d)} markah dari AR1 ke Percubaan). Pantau dan sokong murid yang menunjukkan trend menurun sebelum SPM.` });
      else c.push({ tahap: "baik", teks: `Purata kelas meningkat ${tanda(d)} markah dari AR1 ke Percubaan. Teruskan strategi pengajaran semasa menjelang SPM.` });
    }
    if (ar2 != null && perc - ar2 < -5) c.push({ tahap: "amaran", teks: `Prestasi merosot di Percubaan (${f1(perc - ar2)} markah berbanding AR2). Perbanyak latihan soalan berformat SPM sebenar dan bimbing pengurusan masa peperiksaan.` });
    if (a.perhatian.length) c.push({ tahap: "kritikal", teks: `${a.perhatian.length} murid merosot lebih 5 markah dari AR1 ke Percubaan (${nama}). Sesi bimbingan individu disyorkan.` });
    if (jurangSes != null && b40 && t20) c.push({ tahap: "amaran", teks: `Jurang SES Percubaan: T20 ${f1(t20.purata)} berbanding B40 ${f1(b40.purata)} (beza ${f1(jurangSes)} markah). Perkemas sokongan bersasar untuk murid B40 sebelum SPM.` });
    const ped = k.pelajar.filter((p) => p.lokasi === "Pedalaman").map((p) => marks[p.id]?.percubaan).filter(num);
    const avgPed = purata(ped);
    if (avgPed != null && avgPed < perc - 5) c.push({ tahap: "amaran", teks: `Murid Pedalaman (${ped.length} orang) mencatat purata Percubaan ${f1(avgPed)}, iaitu ${f1(perc - avgPed)} markah di bawah purata kelas. Sediakan bahan rujukan tambahan dan pantau akses pembelajaran.` });
    if (a.lulusPct < 70) c.push({ tahap: "kritikal", teks: `Kadar lulus Percubaan ialah ${a.lulusPct}%, di bawah 70%. Laksanakan ulang kaji intensif dan ujian diagnostik mingguan sebelum SPM.` });
  }
  if (a.sasaran && a.sasaran.bawah.length) {
    const s = a.sasaran;
    c.push({ tahap: "amaran", teks: `${s.bawah.length} murid belum mencapai sasaran SPM masing-masing dalam ${infoUjian(s.ujian).label}; jurang terbesar ${s.bawah[0].jurang} markah (${namaRingkas(s.bawah[0].p.nama)}).` });
  }
  if (!c.length && a.fasa > 0) c.push({ tahap: "baik", teks: "Prestasi kelas secara keseluruhan adalah baik. Teruskan pemantauan berkala dan galakkan latihan soalan SPM." });
  return c;
}

export function cadanganIndividu(p: Pelajar, m: Markah): Cadangan[] {
  const c: Cadangan[] = [];
  const { ar1, ar2, percubaan: perc } = m;
  const profil = (konteks: string) => {
    if (p.ses === "B40") c.push({ tahap: "amaran", teks: `Murid daripada kumpulan B40. Pastikan akses kepada bahan pembelajaran dan sokongan yang mencukupi ${konteks}.` });
    if (p.lokasi === "Pedalaman") c.push({ tahap: "amaran", teks: `Murid dari kawasan Pedalaman. Sediakan bahan bercetak atau digital untuk rujukan di luar waktu sekolah ${konteks}.` });
  };
  const sasaran = () => {
    const t = num(perc) ? perc : num(ar2) ? ar2 : num(ar1) ? ar1 : null;
    if (!num(m.sasaran) || t == null) return;
    if (t >= m.sasaran) c.push({ tahap: "baik", teks: `Markah terkini (${t}) telah mencapai sasaran SPM ${m.sasaran}.` });
    else c.push({ tahap: "amaran", teks: `Markah terkini (${t}) masih ${m.sasaran - t} markah di bawah sasaran SPM ${m.sasaran}.` });
  };

  if (!num(ar1) && !num(ar2) && !num(perc)) return [{ tahap: "info", teks: "Belum ada markah untuk murid ini. Isi markah melalui tab Rekod Markah untuk melihat cadangan individu." }];

  if (num(perc)) {
    if (num(ar1)) {
      const d = perc - ar1;
      if (d > 10) c.push({ tahap: "baik", teks: `Peningkatan ketara (+${d} markah dari AR1 ke Percubaan). Teruskan usaha dan sasarkan gred lebih tinggi dalam SPM.` });
      else if (d > 3) c.push({ tahap: "baik", teks: `Peningkatan yang konsisten (+${d} markah). Tumpukan topik yang masih lemah untuk memaksimumkan pencapaian SPM.` });
      else if (d < -10) c.push({ tahap: "kritikal", teks: `Penurunan serius (${d} markah dari AR1 ke Percubaan). Temui murid secara individu, kenal pasti punca dan sediakan pelan pemulihan segera sebelum SPM.` });
      else if (d < -3) c.push({ tahap: "amaran", teks: `Penurunan sederhana (${d} markah). Pantau lebih rapat dan bincang strategi belajar bersama murid.` });
      else c.push({ tahap: "info", teks: "Prestasi stabil sepanjang ujian. Tumpukan topik kelemahan untuk meningkatkan gred dalam SPM." });
    }
    if (num(ar2)) {
      const d2 = perc - ar2;
      if (d2 < -5) c.push({ tahap: "amaran", teks: `Prestasi merosot antara AR2 dan Percubaan (${d2} markah). Perbanyak latihan soalan berformat SPM dan bimbing pengurusan masa peperiksaan.` });
      else if (num(ar1) && ar2 - ar1 < -5 && d2 > 0) c.push({ tahap: "baik", teks: "Murid pulih selepas penurunan di AR2. Dorong murid mengekalkan momentum ini." });
    }
    profil("menjelang SPM");
    if (perc < LULUS_MIN) c.push({ tahap: "kritikal", teks: `Markah Percubaan di bawah tahap lulus (${perc}/100). Pelan intervensi intensif diperlukan: ulang kaji berfokus topik kritikal sebelum SPM.` });
    else if (perc >= 80) c.push({ tahap: "baik", teks: `Pencapaian cemerlang dalam Percubaan (${perc}/100). Kekalkan dengan latihan soalan aras tinggi.` });
  } else if (num(ar2)) {
    c.push({ tahap: "info", teks: "Analisis berdasarkan AR1 dan AR2. Isi markah Percubaan untuk cadangan pra-SPM yang menyeluruh." });
    if (num(ar1)) {
      const d = ar2 - ar1;
      if (d > 10) c.push({ tahap: "baik", teks: `Peningkatan ketara (+${d} markah dari AR1 ke AR2). Kekalkan strategi belajar yang berkesan menjelang Percubaan SPM.` });
      else if (d > 3) c.push({ tahap: "baik", teks: `Peningkatan yang konsisten (+${d} markah). Kukuhkan topik yang masih lemah sebelum Percubaan SPM.` });
      else if (d < -10) c.push({ tahap: "kritikal", teks: `Penurunan serius (${d} markah dari AR1 ke AR2). Bincang dengan murid secara individu dan sediakan pelan pemulihan sebelum Percubaan.` });
      else if (d < -3) c.push({ tahap: "amaran", teks: `Penurunan sederhana (${d} markah dari AR1 ke AR2). Pantau lebih rapat dan kenal pasti punca bersama murid.` });
      else c.push({ tahap: "info", teks: `Prestasi stabil antara AR1 dan AR2 (${d >= 0 ? "+" : ""}${d} markah). Sasarkan peningkatan dalam Percubaan SPM.` });
    }
    if (ar2 < LULUS_MIN) c.push({ tahap: "kritikal", teks: `Markah AR2 (${ar2}/100) masih di bawah tahap lulus. Intervensi intensif diperlukan sebelum Percubaan SPM.` });
    else if (ar2 >= 80) c.push({ tahap: "baik", teks: `Pencapaian cemerlang dalam AR2 (${ar2}/100). Sasarkan konsistensi dalam Percubaan SPM.` });
    profil("menjelang Percubaan SPM");
  } else if (num(ar1)) {
    c.push({ tahap: "info", teks: "Analisis berdasarkan AR1 sahaja. Isi markah AR2 dan Percubaan untuk cadangan trend yang lebih lengkap." });
    if (ar1 < LULUS_MIN) c.push({ tahap: "kritikal", teks: `Murid gagal AR1 (${ar1}/100). Perlu intervensi awal: sesi bimbingan berfokus topik asas yang belum dikuasai.` });
    else if (ar1 < 60) c.push({ tahap: "amaran", teks: `Markah AR1 (${ar1}/100) berada pada tahap lulus rendah. Galakkan latihan soalan yang lebih kerap dan bimbingan tambahan.` });
    else if (ar1 >= 80) c.push({ tahap: "baik", teks: `Markah AR1 yang cemerlang (${ar1}/100). Kekalkan prestasi dan tumpukan topik lanjutan.` });
    else c.push({ tahap: "baik", teks: `Prestasi AR1 baik (${ar1}/100). Pastikan semua topik sukatan diliputi sebelum AR2.` });
    profil("sebelum AR2");
  }
  sasaran();
  return c;
}
