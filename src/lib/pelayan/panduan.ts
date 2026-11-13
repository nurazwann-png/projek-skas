import { bacaKoleksi } from "./stor";

// Panduan SKPM yang dimuat naik oleh Admin SK@S: peraturan 5.4.1/5.4.2 dan petikan rujukan (RAG)
// yang diekstrak oleh AI daripada teks PDF, disimpan dalam stor_item (koleksi ppd_skas_panduan).
export type Rujukan = { tajuk: string; muka: string; petikan: string };
export type Panduan = {
  id: string;
  nama: string;
  namaFail: string;
  tahun: number;
  dimuatNaik: string;
  oleh: string;
  halaman: number;
  peraturanGuru: string;
  peraturanSekolah: string;
  rujukan: Rujukan[];
  perubahan: string | null;
};
export type Tetapan = { tahunPenilaian?: number; panduanAktif?: string | null };

export const TAHUN_ASAS = 2026; // tahun peraturan terbina dalam (Panduan SKPM 2026)

export async function konteksSkas(): Promise<{ tahun: number; panduan: Panduan | null }> {
  const tetapan = ((await bacaKoleksi<Tetapan>("ppd_skas_tetapan")) || {}) as Tetapan;
  const senarai = (await bacaKoleksi<Panduan[]>("ppd_skas_panduan")) || [];
  const panduan = senarai.find((p) => p.id === tetapan.panduanAktif) || null;
  const tahun = Number(tetapan.tahunPenilaian) || panduan?.tahun || new Date().getFullYear();
  return { tahun, panduan };
}

// Jawapan AI tanpa structured outputs (disekat polisi KPM di Vertex): ambil objek JSON pertama hingga terakhir
export function bacaJson(teks: string): unknown {
  const mula = teks.indexOf("{");
  const akhir = teks.lastIndexOf("}");
  if (mula < 0 || akhir < mula) throw new SyntaxError("Tiada objek JSON");
  return JSON.parse(teks.slice(mula, akhir + 1));
}
