import type { Metadata } from "next";
import { SpmApp } from "@/components/spm/spm-app";

export const metadata: Metadata = {
  title: "Analitik SPM · Portal PPD Dalat",
  description: "Analitik pencapaian SPM Daerah Dalat untuk Admin PPD",
};

export default function HalamanSpm() {
  return <SpmApp />;
}
