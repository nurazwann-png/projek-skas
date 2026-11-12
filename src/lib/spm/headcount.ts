// Headcount SPM: banding markah terkini setiap murid (Percubaan, jika tiada AR2, jika tiada AR1)
// dengan markah sasaran yang ditetapkan guru (Markah.sasaran). TOV = AR1.
// Entri tanpa sasaran dikira berasingan; tiada sasaran yang diandaikan.
import type { Kelas, Marks, UjianKey } from "@/lib/portal/stor";

const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const purata = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const b1 = (v: number | null) => (v == null ? null : +v.toFixed(1));

export interface EntriHeadcount {
  id: string;
  nama: string;
  sekolah: string;
  kelas: string; // "5 AMANAH"
  subjek: string;
  guru: string;
  tov: number | null; // AR1
  terkini: number | null;
  ujian: UjianKey | null; // ujian yang menjadi markah terkini
  sasaran: number | null;
  jurang: number | null; // terkini − sasaran (negatif = di bawah sasaran)
}

export interface RingkasanHeadcount {
  bil: number; // semua entri murid-subjek
  bersasaran: number;
  dinilai: number; // ada sasaran DAN markah
  capai: number; // markah terkini >= sasaran
  bawah: number;
  belumMarkah: number; // ada sasaran, belum ada markah
  tiadaSasaran: number;
  // Purata bagi entri yang dinilai sahaja, supaya TOV, terkini dan sasaran merujuk kumpulan murid yang sama
  tov: number | null;
  terkini: number | null;
  sasaran: number | null;
  jurang: number | null;
}

export interface SubjekHeadcount extends RingkasanHeadcount {
  subjek: string;
}

export interface Headcount extends RingkasanHeadcount {
  subjek: SubjekHeadcount[]; // subjek yang ada sekurang-kurangnya satu sasaran, jurang paling negatif dahulu
  subjekTiadaSasaran: string[];
  bawahSasaran: EntriHeadcount[]; // paling jauh di bawah sasaran dahulu
  bilSekolah: number;
}

export const LABEL_UJIAN: Record<UjianKey, string> = { ar1: "AR1", ar2: "AR2", percubaan: "Percubaan" };

function ringkas(entri: EntriHeadcount[]): RingkasanHeadcount {
  const bersasaran = entri.filter((e) => e.sasaran != null);
  const dinilai = bersasaran.filter((e) => e.terkini != null);
  const capai = dinilai.filter((e) => e.jurang! >= 0).length;
  return {
    bil: entri.length,
    bersasaran: bersasaran.length,
    dinilai: dinilai.length,
    capai,
    bawah: dinilai.length - capai,
    belumMarkah: bersasaran.length - dinilai.length,
    tiadaSasaran: entri.length - bersasaran.length,
    tov: b1(purata(dinilai.map((e) => e.tov).filter(num))),
    terkini: b1(purata(dinilai.map((e) => e.terkini!))),
    sasaran: b1(purata(dinilai.map((e) => e.sasaran!))),
    jurang: b1(purata(dinilai.map((e) => e.jurang!))),
  };
}

export function kiraHeadcount(kelas: Kelas[], marks: Marks): Headcount {
  const entri: EntriHeadcount[] = kelas.flatMap((k) =>
    (k.pelajar || []).map((p) => {
      const m = marks[p.id] || {};
      const ujian: UjianKey | null = num(m.percubaan) ? "percubaan" : num(m.ar2) ? "ar2" : num(m.ar1) ? "ar1" : null;
      const terkini = ujian ? (m[ujian] as number) : null;
      const sasaran = num(m.sasaran) && m.sasaran >= 0 && m.sasaran <= 100 ? m.sasaran : null;
      return {
        id: `${k.id}|${p.id}`,
        nama: p.nama,
        sekolah: k.sekolah,
        kelas: `${k.tingkatan} ${k.kelas}`.trim(),
        subjek: k.subjek,
        guru: k.guru,
        tov: num(m.ar1) ? m.ar1 : null,
        terkini,
        ujian,
        sasaran,
        jurang: terkini != null && sasaran != null ? terkini - sasaran : null,
      };
    }),
  );

  const ikutSubjek = new Map<string, EntriHeadcount[]>();
  entri.forEach((e) => ikutSubjek.set(e.subjek, [...(ikutSubjek.get(e.subjek) || []), e]));
  const semua = [...ikutSubjek.entries()].map(([subjek, ee]) => ({ subjek, ...ringkas(ee) }));

  return {
    ...ringkas(entri),
    subjek: semua.filter((s) => s.bersasaran > 0).sort((a, b) => (a.jurang ?? Infinity) - (b.jurang ?? Infinity) || a.subjek.localeCompare(b.subjek)),
    subjekTiadaSasaran: semua.filter((s) => s.bersasaran === 0).map((s) => s.subjek).sort(),
    bawahSasaran: entri.filter((e) => e.jurang != null && e.jurang < 0).sort((a, b) => a.jurang! - b.jurang! || a.nama.localeCompare(b.nama)),
    bilSekolah: new Set(kelas.map((k) => k.sekolah)).size,
  };
}
