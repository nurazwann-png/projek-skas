// Ringkasan data portal di pelayan, mengikut skop peranan pengguna. Digunakan oleh Pembantu AI (alat baca sahaja)
// dan laporan. Semua angka dikira daripada stor sebenar dalam PostgreSQL.
import { bacaSemua, type PenggunaStor } from "./stor";

// Mesti sepadan dengan PEPERIKSAAN_SEMASA dalam public/assets/ppd-data.js
export const PEPERIKSAAN = { key: "percubaan" as const, label: "Percubaan SPM 2026", buka: "2026-10-28", tarikhAkhir: "2026-11-13" };

type Markah = { ar1?: number | null; ar2?: number | null; percubaan?: number | null; sasaran?: number };
type Pelajar = { id: string; muridId?: string; nama: string };
type Kelas = { id: string; sekolah: string; kodSekolah?: string; subjek: string; tingkatan: string; kelas: string; guru: string; guruId?: string | null; pelajar: Pelajar[] };
type Tiket = { id: string; sekolah: string; kodSekolah?: string; tajuk: string; kategori?: string; keutamaan?: string; status: string; tarikh: string; pelaporId?: string };
type Rekod = { id?: string; program?: string; tarikh?: string; status?: string; level?: string };
type Org = { kod: string; nama: string; jenis?: string };

export type Skop = { jenis: "daerah" } | { jenis: "sekolah"; kod: string; nama: string } | { jenis: "sendiri"; kod: string; nama: string } | { jenis: "tiada"; sebab: string };
export type App = "spm" | "skas" | "efasiliti";
export type Tahap = "pengguna" | "sekolah" | "admin" | "superadmin";
const TERTIB_TAHAP: Tahap[] = ["pengguna", "sekolah", "admin", "superadmin"];
const SEKOLAH_MENENGAH = /^(SMK|SMKA|SMA|SM|SMT|SMS|SBP|KOLEJ|MRSM)\b/;

// Tahap tertinggi yang benar-benar dimiliki pengguna (daripada peranan di pelayan)
export function tahapMaks(aktor: PenggunaStor): Tahap {
  if (aktor.roles.includes("superadmin")) return "superadmin";
  if (aktor.roles.some((r) => r.startsWith("admin_"))) return "admin";
  if (aktor.roles.some((r) => r.startsWith("sekolah_"))) return "sekolah";
  return "pengguna";
}

const num = (v: unknown): v is number => typeof v === "number";
const GPS = (m: number) => (m >= 90 ? 1 : m >= 80 ? 2 : m >= 70 ? 3 : m >= 65 ? 4 : m >= 60 ? 5 : m >= 55 ? 6 : m >= 50 ? 7 : m >= 45 ? 8 : m >= 40 ? 9 : 10);
const akhir = (m: Markah | undefined) => (m ? (num(m.percubaan) ? m.percubaan : num(m.ar2) ? m.ar2 : num(m.ar1) ? m.ar1 : null) : null);
const hariSejak = (t: string) => Math.floor((Date.now() - new Date(t).getTime()) / 86400000);
const bundar = (n: number) => Math.round(n * 100) / 100;

export interface Data {
  aktor: PenggunaStor;
  tahap: Tahap;
  skop: Record<App, Skop>;
  pengguna: PenggunaStor[];
  kelas: Kelas[];
  marks: Record<string, Markah>;
  tiket: Tiket[];
  rekod: Record<string, Rekod[]>;
}

// Skop data ditentukan SETIAP aplikasi mengikut peranan aktif pengguna dan peranannya dalam aplikasi itu:
// Admin aplikasi (atau Superadmin) = seluruh daerah; Pentadbir Sekolah aplikasi = sekolahnya; selain itu = data sendiri.
// Peranan aktif yang dihantar pelayar hanya boleh MENGECILKAN skop, tidak membesarkannya.
export async function muatData(aktor: PenggunaStor, tahapDiminta?: unknown): Promise<Data> {
  const s = await bacaSemua();
  const org = (s.ppd_organisasi as Org[]) || [];
  const pengguna = ((s.ppd_users as PenggunaStor[]) || []).map((u) => ({ ...u, roles: u.roles || [] }));
  const o = org.find((x) => x.kod === aktor.kodSekolah);
  const namaSekolah = (o?.nama || aktor.org || "").toUpperCase();
  const maks = tahapMaks(aktor);
  const minta = TERTIB_TAHAP.includes(tahapDiminta as Tahap) ? (tahapDiminta as Tahap) : maks;
  const tahap = TERTIB_TAHAP.indexOf(minta) <= TERTIB_TAHAP.indexOf(maks) ? minta : maks;

  const skopApp = (app: App): Skop => {
    if (app === "spm" && tahap !== "superadmin" && !(tahap === "admin" && aktor.roles.includes("admin_spm"))) {
      const menengah = o ? o.jenis === "Pejabat" || SEKOLAH_MENENGAH.test(namaSekolah) : SEKOLAH_MENENGAH.test(namaSekolah) || /^PPD\b/.test(namaSekolah);
      if (!menengah) return { jenis: "tiada", sebab: "Analitik SPM hanya untuk sekolah menengah (SMK). Sekolah pengguna ini tidak menggunakan Analitik SPM." };
    }
    if (tahap === "superadmin" && aktor.roles.includes("superadmin")) return { jenis: "daerah" };
    if (tahap === "admin" && aktor.roles.includes(`admin_${app}`)) return { jenis: "daerah" };
    if ((tahap === "admin" || tahap === "sekolah") && aktor.roles.includes(`sekolah_${app}`)) return { jenis: "sekolah", kod: aktor.kodSekolah, nama: namaSekolah };
    return { jenis: "sendiri", kod: aktor.kodSekolah, nama: namaSekolah };
  };
  const skop: Record<App, Skop> = { spm: skopApp("spm"), skas: skopApp("skas"), efasiliti: skopApp("efasiliti") };

  const diSekolah = (kod?: string, nama?: string) => (kod && kod === aktor.kodSekolah) || (!!nama && nama.toUpperCase() === namaSekolah);
  const ahli = new Set(pengguna.filter((u) => u.kodSekolah === aktor.kodSekolah).map((u) => u.id));

  const semuaKelas = (s.skas_kelas as Kelas[]) || [];
  const kelas =
    skop.spm.jenis === "daerah" ? semuaKelas
      : skop.spm.jenis === "sekolah" ? semuaKelas.filter((k) => diSekolah(k.kodSekolah, k.sekolah))
        : skop.spm.jenis === "sendiri" ? semuaKelas.filter((k) => k.guruId === aktor.id) : [];
  const semuaTiket = (s.ppd_efasiliti_tiket as Tiket[]) || [];
  const tiket =
    skop.efasiliti.jenis === "daerah" ? semuaTiket
      : skop.efasiliti.jenis === "sekolah" ? semuaTiket.filter((t) => diSekolah(t.kodSekolah, t.sekolah)) : semuaTiket.filter((t) => t.pelaporId === aktor.id);
  const semuaRekod = (s.ppd_skas_rekod as Record<string, Rekod[]>) || {};
  const rekod =
    skop.skas.jenis === "daerah" ? semuaRekod
      : skop.skas.jenis === "sekolah" ? Object.fromEntries(Object.entries(semuaRekod).filter(([uid]) => ahli.has(uid)))
        : semuaRekod[aktor.id] ? { [aktor.id]: semuaRekod[aktor.id] } : {};

  // Markah hanya bagi murid dalam kelas yang berada dalam skop
  const semuaMarks = (s.skas_marks as Record<string, Markah>) || {};
  const idMurid = new Set(kelas.flatMap((k) => (k.pelajar || []).map((p) => p.id)));
  const marks = Object.fromEntries(Object.entries(semuaMarks).filter(([id]) => idMurid.has(id)));
  // Senarai pengguna hanya yang relevan (untuk nama guru dalam rekod SK@S)
  const uidRekod = new Set(Object.keys(rekod));
  return { aktor, tahap, skop, pengguna: pengguna.filter((u) => uidRekod.has(u.id) || u.id === aktor.id), kelas, marks, tiket, rekod };
}

const belumIsi = (k: Kelas, marks: Record<string, Markah>) => (k.pelajar || []).filter((p) => !marks[p.id] || marks[p.id][PEPERIKSAAN.key] === undefined).length;

export function statusPengisian(d: Data, sekolah?: string) {
  const ks = d.kelas.filter((k) => !sekolah || k.sekolah.toUpperCase().includes(sekolah.toUpperCase()));
  const ikut = new Map<string, { jumlah: number; belum: number; kelas: number; kelasBelum: number }>();
  const belumLengkap = [];
  for (const k of ks) {
    const b = belumIsi(k, d.marks), n = (k.pelajar || []).length;
    const s = ikut.get(k.sekolah) || { jumlah: 0, belum: 0, kelas: 0, kelasBelum: 0 };
    s.jumlah += n; s.belum += b; s.kelas++; if (b) s.kelasBelum++;
    ikut.set(k.sekolah, s);
    if (b) belumLengkap.push({ kelasId: k.id, sekolah: k.sekolah, subjek: k.subjek, kelas: `${k.tingkatan} ${k.kelas}`, guru: k.guru, belumDiisi: b, jumlahMurid: n });
  }
  return {
    peperiksaan: PEPERIKSAAN.label,
    tarikhAkhir: PEPERIKSAAN.tarikhAkhir,
    bakiHari: -hariSejak(PEPERIKSAAN.tarikhAkhir),
    sekolah: [...ikut].map(([nama, s]) => ({ sekolah: nama, peratusDiisi: s.jumlah ? Math.round(((s.jumlah - s.belum) / s.jumlah) * 100) : 0, kelasBelumLengkap: s.kelasBelum, jumlahKelas: s.kelas })),
    kelasBelumLengkap: belumLengkap.sort((a, b) => b.belumDiisi - a.belumDiisi).slice(0, 60),
  };
}

export function prestasiSpm(d: Data) {
  const ikut = new Map<string, Kelas[]>();
  for (const k of d.kelas) (ikut.get(k.sekolah) || ikut.set(k.sekolah, []).get(k.sekolah)!).push(k);
  return {
    nota: "GPS berskala 1.00 hingga 10.00; nilai lebih rendah lebih baik. Dikira daripada markah terkini (Percubaan, jika tiada AR2, jika tiada AR1).",
    sekolah: [...ikut].map(([nama, ks]) => {
      const perMurid = new Map<string, { s: number; n: number; d: number }>();
      const subjek = new Map<string, { g: number; n: number }>();
      let g = 0, n = 0, gagal = 0;
      for (const k of ks) for (const p of k.pelajar || []) {
        const m = d.marks[p.id], a = akhir(m);
        if (a === null) continue;
        g += GPS(a); n++; if (a < 40) gagal++;
        const sj = subjek.get(k.subjek) || { g: 0, n: 0 }; sj.g += GPS(a); sj.n++; subjek.set(k.subjek, sj);
        const id = p.muridId || p.id, o = perMurid.get(id) || { s: 0, n: 0, d: 0 };
        o.s += a; o.n++; o.d += num(m?.ar1) ? m!.ar1! - a : 0; perMurid.set(id, o);
      }
      const risiko = [...perMurid.values()].filter((o) => o.s / o.n < 45 || o.d / o.n > 5).length;
      return {
        sekolah: nama,
        gps: n ? bundar(g / n) : null,
        bilanganMurid: perMurid.size,
        muridBerisiko: risiko,
        peratusGagal: n ? Math.round((gagal / n) * 100) : null,
        gpsSubjek: Object.fromEntries([...subjek].map(([s, v]) => [s, bundar(v.g / v.n)])),
      };
    }),
  };
}

export function rekodSkas(d: Data) {
  const nama = new Map(d.pengguna.map((u) => [u.id, u]));
  const semua = Object.entries(d.rekod).flatMap(([uid, senarai]) => (senarai || []).map((r) => ({ uid, r })));
  // Rekod guru disimpan terus tanpa kelulusan; evidens disimpan guru dalam Google Drive untuk MoEIS
  const sekolahGuru = (uid: string) => nama.get(uid)?.org || nama.get(uid)?.kodSekolah || "";
  const ikutSekolah: Record<string, number> = {};
  for (const x of semua) { const s = sekolahGuru(x.uid) || "Tidak diketahui"; ikutSekolah[s] = (ikutSekolah[s] || 0) + 1; }
  return {
    jumlah: semua.length,
    bilanganGuru: Object.values(d.rekod).filter((s) => (s || []).length).length,
    ikutSekolah,
    senaraiTerkini: [...semua].sort((a, b) => (b.r.tarikh || "").localeCompare(a.r.tarikh || "")).slice(0, 40).map((x) => ({
      guru: nama.get(x.uid)?.nama || x.uid,
      sekolah: sekolahGuru(x.uid),
      program: x.r.program || "",
      peringkat: x.r.level || "",
      tarikh: x.r.tarikh || "",
    })),
  };
}

export function aduanFasiliti(d: Data, status?: string) {
  const aktif = (t: Tiket) => !["Selesai", "Ditolak"].includes(t.status);
  const ts = d.tiket.filter((t) => !status || t.status.toLowerCase() === status.toLowerCase());
  const ikutStatus: Record<string, number> = {};
  for (const t of d.tiket) ikutStatus[t.status] = (ikutStatus[t.status] || 0) + 1;
  return {
    jumlah: d.tiket.length,
    aktif: d.tiket.filter(aktif).length,
    ikutStatus,
    senarai: ts
      .map((t) => ({ id: t.id, sekolah: t.sekolah, tajuk: t.tajuk, kategori: t.kategori || "", keutamaan: t.keutamaan || "", status: t.status, tarikhLapor: t.tarikh, hariTerbuka: aktif(t) ? hariSejak(t.tarikh) : null }))
      .sort((a, b) => (b.hariTerbuka ?? -1) - (a.hariTerbuka ?? -1))
      .slice(0, 50),
  };
}

// Kelas yang boleh diberi peringatan pengisian markah oleh pengguna ini
export function kelasBolehDiingatkan(d: Data, ids: string[]) {
  // Skop SPM "daerah" atau "sekolah" hanya diberi kepada Admin SPM/Superadmin atau Pentadbir Sekolah SPM
  const boleh = d.skop.spm.jenis === "daerah" || d.skop.spm.jenis === "sekolah";
  if (!boleh) return [];
  const set = new Set(ids);
  return d.kelas.filter((k) => set.has(k.id) && belumIsi(k, d.marks) > 0).map((k) => ({ kelasId: k.id, label: `${k.subjek} · ${k.tingkatan} ${k.kelas} · ${k.sekolah} (${k.guru})`, belumDiisi: belumIsi(k, d.marks) }));
}
