// Ringkasan aduan untuk eksport Excel dan cetakan (lajur yang sama bagi kedua-duanya).
import { fmtTarikh, hariTerbuka, tarikhHariIni } from "./bantu";
import type { Tiket } from "./jenis";

export const TAJUK_RINGKASAN = "Ringkasan Aduan Fasiliti — PPD Dalat";
export const LAJUR_RINGKASAN = ["ID Tiket", "Sekolah", "Tajuk", "Kategori", "Keutamaan", "Status", "Tarikh aduan", "Hari terbuka"] as const;

export interface BarisRingkasan {
  id: string;
  sekolah: string;
  tajuk: string;
  kategori: string;
  keutamaan: string;
  status: string;
  tarikh: string; // YYYY-MM-DD
  tarikhPapar: string;
  hari: number | null;
}

export function barisRingkasan(tiket: Tiket[], kini: Date = new Date()): BarisRingkasan[] {
  return tiket.map((t) => ({
    id: t.id,
    sekolah: t.sekolah,
    tajuk: t.tajuk,
    kategori: t.kategori,
    keutamaan: t.keutamaan,
    status: t.status,
    tarikh: t.tarikh,
    tarikhPapar: fmtTarikh(t.tarikh),
    hari: hariTerbuka(t, kini),
  }));
}

export async function muatTurunExcel(tiket: Tiket[]): Promise<void> {
  const { default: tulisXlsx } = await import("write-excel-file/browser");
  const teks = (v: string) => ({ type: String, value: String(v ?? "") });
  const kepala = LAJUR_RINGKASAN.map((l) => ({ type: String, value: l as string, fontWeight: "bold" as const }));
  const baris = barisRingkasan(tiket).map((b) => {
    const d = new Date(b.tarikh);
    return [
      teks(b.id),
      teks(b.sekolah),
      teks(b.tajuk),
      teks(b.kategori),
      teks(b.keutamaan),
      teks(b.status),
      Number.isFinite(d.getTime()) ? { type: Date, value: d, format: "dd/mm/yyyy" } : teks(b.tarikh),
      b.hari == null ? null : { type: Number, value: b.hari },
    ];
  });
  await tulisXlsx([kepala, ...baris], {
    sheet: "Aduan Fasiliti",
    columns: [{ width: 15 }, { width: 24 }, { width: 46 }, { width: 18 }, { width: 13 }, { width: 14 }, { width: 14 }, { width: 13 }],
    stickyRowsCount: 1,
  }).toFile(`aduan-fasiliti-ppd-dalat-${tarikhHariIni()}.xlsx`);
}
