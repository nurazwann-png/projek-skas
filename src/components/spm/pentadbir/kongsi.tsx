"use client";

import { Badge } from "@/components/tremor/ui";
import type { PPDDataApi, Pengguna } from "@/lib/portal/stor";
import { gredBagi, type KonteksSekolah } from "@/lib/spm/pentadbir";

export interface PropPentadbir {
  data: PPDDataApi;
  pengguna: Pengguna;
  segar: () => void; // dipanggil selepas setiap tulisan ke stor
  makluman: (teks: string) => void;
  versi: number; // bertambah apabila stor berubah
}

export interface PropTabSekolah extends PropPentadbir {
  k: KonteksSekolah;
}

export const tarikhPendek = (t: string | number) => new Date(t).toLocaleDateString("ms-MY", { day: "numeric", month: "short" });
export const tarikhPanjang = (t: string | number) => new Date(t).toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" });

const VARIAN_KATEGORI = { Cemerlang: "success", Kepujian: "default", Lulus: "warning", Gagal: "error" } as const;
export function LencanaGred({ markah }: { markah: number }) {
  const g = gredBagi(markah);
  return <Badge variant={VARIAN_KATEGORI[g.kategori]} title={g.kategori}>{g.gred}</Badge>;
}
