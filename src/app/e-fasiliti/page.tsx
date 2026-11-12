import type { Metadata } from "next";
import { EfasilitiApp } from "@/components/efasiliti/efasiliti-app";

export const metadata: Metadata = {
  title: "e-Fasiliti · Portal PPD Dalat",
  description: "Aduan dan pemantauan fasiliti sekolah Daerah Dalat",
};

export default function HalamanEfasiliti() {
  return <EfasilitiApp />;
}
