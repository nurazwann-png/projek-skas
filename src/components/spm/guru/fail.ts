// Baca fail .xlsx/.csv dan jana templat .xlsx dalam pelayar.
// Pustaka Excel dimuat secara dinamik supaya tidak membebankan muatan awal halaman.
import { pecahCSV, selKeTeks, type Jadual } from "@/lib/spm/guru";

export const TERIMA_FAIL = ".xlsx,.csv";

export async function bacaJadual(fail: File): Promise<Jadual> {
  const ext = fail.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") return pecahCSV(await fail.text());
  if (ext === "xls") throw new Error("Format .xls lama tidak disokong. Simpan semula fail sebagai Excel Workbook (.xlsx) atau CSV.");
  if (ext !== "xlsx") throw new Error("Hanya fail Excel (.xlsx) atau CSV (.csv) dibenarkan.");
  const { readSheet } = await import("read-excel-file/browser");
  try {
    const baris = await readSheet(fail); // helaian pertama
    return baris.map((r) => r.map(selKeTeks)).filter((r) => r.some((v) => v));
  } catch {
    throw new Error("Fail Excel tidak dapat dibaca. Pastikan ia fail .xlsx yang sah dan tidak dilindungi kata laluan.");
  }
}

const namaFailSelamat = (nama: string) => nama.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "_");

// Templat .xlsx: baris tajuk tebal + baris yang diberikan (semua sel sebagai teks)
export async function muatTurunXlsx(namaFail: string, tajuk: string[], baris: string[][], lebar: number[]) {
  const { default: tulisXlsx } = await import("write-excel-file/browser");
  const data = [tajuk.map((value) => ({ value, fontWeight: "bold" as const })), ...baris.map((r) => r.map((value) => (value ? { value, type: String } : null)))];
  await tulisXlsx(data, { columns: lebar.map((width) => ({ width })), stickyRowsCount: 1 }).toFile(`${namaFailSelamat(namaFail)}.xlsx`);
}
