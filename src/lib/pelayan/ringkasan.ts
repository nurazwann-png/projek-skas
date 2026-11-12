// Ringkasan data portal di pelayan, mengikut skop peranan pengguna. Digunakan oleh Pembantu AI (alat baca sahaja)
// dan laporan. Semua angka dikira daripada stor sebenar dalam PostgreSQL.
import { bacaSemua, perananTinggi, type PenggunaStor } from "./stor";

// Mesti sepadan dengan PEPERIKSAAN_SEMASA dalam public/assets/ppd-data.js
export const PEPERIKSAAN = { key: "percubaan" as const, label: "Percubaan SPM 2026", buka: "2026-10-28", tarikhAkhir: "2026-11-13" };

type Markah = { ar1?: number | null; ar2?: number | null; percubaan?: number | null; sasaran?: number };
type Pelajar = { id: string; muridId?: string; nama: string };
type Kelas = { id: string; sekolah: string; kodSekolah?: string; subjek: string; tingkatan: string; kelas: string; guru: string; guruId?: string | null; pelajar: Pelajar[] };
type Tiket = { id: string; sekolah: string; kodSekolah?: string; tajuk: string; kategori?: string; keutamaan?: string; status: string; tarikh: string; pelaporId?: string };
type Rekod = { id?: string; program?: string; tarikh?: string; status?: string; level?: string };
type Org = { kod: string; nama: string };

export type Skop = { jenis: "daerah" } | { jenis: "sekolah"; kod: string; nama: string } | { jenis: "sendiri"; kod: string; nama: string };

const num = (v: unknown): v is number => typeof v === "number";
const GPS = (m: number) => (m >= 90 ? 1 : m >= 80 ? 2 : m >= 70 ? 3 : m >= 65 ? 4 : m >= 60 ? 5 : m >= 55 ? 6 : m >= 50 ? 7 : m >= 45 ? 8 : m >= 40 ? 9 : 10);
const akhir = (m: Markah | undefined) => (m ? (num(m.percubaan) ? m.percubaan : num(m.ar2) ? m.ar2 : num(m.ar1) ? m.ar1 : null) : null);
const hariSejak = (t: string) => Math.floor((Date.now() - new Date(t).getTime()) / 86400000);
const bundar = (n: number) => Math.round(n * 100) / 100;

export interface Data {
  aktor: PenggunaStor;
  skop: Skop;
  pengguna: PenggunaStor[];
  kelas: Kelas[];
  marks: Record<string, Markah>;
  tiket: Tiket[];
  rekod: Record<string, Rekod[]>;
}

export async function muatData(aktor: PenggunaStor): Promise<Data> {
  const s = await bacaSemua();
  const org = (s.ppd_organisasi as Org[]) || [];
  const pengguna = ((s.ppd_users as PenggunaStor[]) || []).map((u) => ({ ...u, roles: u.roles || [] }));
  const o = org.find((x) => x.kod === aktor.kodSekolah);
  const namaSekolah = (o?.nama || aktor.org || "").toUpperCase();
  const skop: Skop = aktor.roles.some(perananTinggi)
    ? { jenis: "daerah" }
    : aktor.roles.some((r) => r.startsWith("sekolah_"))
      ? { jenis: "sekolah", kod: aktor.kodSekolah, nama: namaSekolah }
      : { jenis: "sendiri", kod: aktor.kodSekolah, nama: namaSekolah };

  let kelas = (s.skas_kelas as Kelas[]) || [];
  let tiket = (s.ppd_efasiliti_tiket as Tiket[]) || [];
  let rekod = (s.ppd_skas_rekod as Record<string, Rekod[]>) || {};
  const diSekolah = (kod?: string, nama?: string) => (kod && kod === aktor.kodSekolah) || (!!nama && nama.toUpperCase() === namaSekolah);
  if (skop.jenis === "sekolah") {
    kelas = kelas.filter((k) => diSekolah(k.kodSekolah, k.sekolah));
    tiket = tiket.filter((t) => diSekolah(t.kodSekolah, t.sekolah));
    const ahli = new Set(pengguna.filter((u) => u.kodSekolah === aktor.kodSekolah).map((u) => u.id));
    rekod = Object.fromEntries(Object.entries(rekod).filter(([uid]) => ahli.has(uid)));
  } else if (skop.jenis === "sendiri") {
    kelas = kelas.filter((k) => k.guruId === aktor.id);
    tiket = tiket.filter((t) => t.pelaporId === aktor.id);
    rekod = rekod[aktor.id] ? { [aktor.id]: rekod[aktor.id] } : {};
  }
  return { aktor, skop, pengguna, kelas, marks: (s.skas_marks as Record<string, Markah>) || {}, tiket, rekod };
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
  const kira = (st: string) => semua.filter((x) => x.r.status === st).length;
  return {
    jumlah: semua.length,
    disahkan: kira("approved"),
    menungguPengesahan: kira("pending"),
    ditolak: kira("rejected"),
    senaraiMenunggu: semua.filter((x) => x.r.status === "pending").slice(0, 40).map((x) => ({
      guru: nama.get(x.uid)?.nama || x.uid,
      sekolah: nama.get(x.uid)?.org || nama.get(x.uid)?.kodSekolah || "",
      program: x.r.program || "",
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
  const boleh = d.skop.jenis === "daerah" ? d.aktor.roles.includes("superadmin") || d.aktor.roles.includes("admin_spm") : d.skop.jenis === "sekolah" && d.aktor.roles.includes("sekolah_spm");
  if (!boleh) return [];
  const set = new Set(ids);
  return d.kelas.filter((k) => set.has(k.id) && belumIsi(k, d.marks) > 0).map((k) => ({ kelasId: k.id, label: `${k.subjek} · ${k.tingkatan} ${k.kelas} · ${k.sekolah} (${k.guru})`, belumDiisi: belumIsi(k, d.marks) }));
}
