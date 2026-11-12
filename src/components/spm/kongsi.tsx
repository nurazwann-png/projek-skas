"use client";

import type { AnalisisDaerah, AnalisisSekolah, Kategori } from "@/lib/spm/analitik";
import { tahapGps } from "@/lib/spm/analitik";
import type { Amaran, PPDDataApi, Pengguna } from "@/lib/portal/stor";
import { Badge, type Warna } from "@/components/tremor/ui";

export interface PropTab {
  d: AnalisisDaerah;
  data: PPDDataApi;
  pengguna: Pengguna;
  amaran: Amaran[];
  segar: () => void; // kira semula selepas stor berubah
  makluman: (teks: string) => void;
}

export const GPS_BACA = "GPS (Gred Purata Sekolah) berskala 1.00 hingga 10.00. Nilai yang LEBIH RENDAH bermaksud pencapaian yang LEBIH BAIK.";

export const namaPendek = (nama: string) => nama.replace(/^SMK\s+/i, "");

// Warna tetap bagi setiap sekolah (ikut susunan kod), supaya sama di semua carta walaupun kedudukan berubah
const PALET_SEKOLAH: Warna[] = ["blue", "emerald", "violet", "amber", "cyan", "pink", "gray"];
export function warnaSekolah(d: AnalisisDaerah, kod: string): Warna {
  const i = [...d.sekolah].sort((a, b) => a.kod.localeCompare(b.kod)).findIndex((s) => s.kod === kod);
  return PALET_SEKOLAH[(i < 0 ? 0 : i) % PALET_SEKOLAH.length];
}

export const WARNA_KATEGORI: Record<Kategori, Warna> = { Cemerlang: "emerald", Kepujian: "blue", Lulus: "amber", Gagal: "rose" };

export const warnaGps = (g: number | null): Warna => {
  const t = tahapGps(g);
  return t === "baik" ? "emerald" : t === "sederhana" ? "amber" : t === "lemah" ? "rose" : "gray";
};
export const kelasGps = (g: number | null) => {
  const t = tahapGps(g);
  return t === "baik" ? "text-emerald-700" : t === "sederhana" ? "text-amber-700" : t === "lemah" ? "text-red-700" : "text-gray-400";
};

// Status sekolah: ambang yang sama dengan peta prestasi asal (risiko murid + kemajuan pengisian)
export type StatusSekolah = "merah" | "kuning" | "hijau";
export const statusSekolah = (s: AnalisisSekolah): StatusSekolah => (s.risikoPct >= 30 ? "merah" : s.risikoPct >= 18 || s.isiPct < 70 ? "kuning" : "hijau");
export function LencanaStatus({ s }: { s: AnalisisSekolah }) {
  const st = statusSekolah(s);
  return <Badge variant={st === "merah" ? "error" : st === "kuning" ? "warning" : "success"}>{st === "merah" ? "Perlu tindakan" : st === "kuning" ? "Perlu perhatian" : "Terkawal"}</Badge>;
}

// Julat paksi GPS yang kemas: dibundarkan ke 0.5 terdekat dengan sedikit ruang di atas dan bawah
export function julatGps(nilai: (number | null | undefined)[]): [number, number] {
  const v = nilai.filter((x): x is number => typeof x === "number");
  if (!v.length) return [1, 10];
  return [Math.max(1, Math.floor((Math.min(...v) - 0.25) * 2) / 2), Math.min(10, Math.ceil((Math.max(...v) + 0.25) * 2) / 2)];
}

export const tarikhMs = (t: string | number) => new Date(t).toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric" });
