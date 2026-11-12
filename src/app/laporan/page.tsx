import type { Metadata } from "next";
import { LaporanApp } from "@/components/laporan/laporan-app";

export const metadata: Metadata = {
  title: "Laporan · Portal PPD Dalat",
  description: "Laporan sedia cetak SKPM 5.4 dan SPM serta ketepatan semakan AI",
};

export default function HalamanLaporan() {
  return <LaporanApp />;
}
