"use client";

// Analitik SPM — paparan Pentadbir Sekolah (sekolah sendiri sahaja).
// Dipindahkan daripada buildPentadbir() dalam public/spm-analytics.html.
import { Info } from "lucide-react";
import { useMemo, useState } from "react";
import { Callout, TabNavigation } from "@/components/tremor/ui";
import { binaKonteks } from "@/lib/spm/pentadbir";
import { PanelHeadcount } from "../headcount";
import type { PropPentadbir } from "./kongsi";
import { TabAnalitikSekolah } from "./tab-analitik";
import { TabBerisiko } from "./tab-berisiko";
import { TabLaporanSekolah } from "./tab-laporan";
import { TabSemakPengisian } from "./tab-semak";

export type { PropPentadbir } from "./kongsi";

const TAB = [
  { id: "analitik", label: "Analitik Sekolah" },
  { id: "semak", label: "Semak Pengisian" },
  { id: "berisiko", label: "Pelajar Berisiko" },
  { id: "headcount", label: "Headcount" },
  { id: "laporan", label: "Laporan" },
] as const;
type TabId = (typeof TAB)[number]["id"];

export function PaparanPentadbir(props: PropPentadbir) {
  const { data, pengguna, versi } = props;
  const [tab, setTab] = useState<TabId>("analitik");
  const k = useMemo(() => {
    void versi; // baca semula stor apabila versi berubah
    return binaKonteks(data, pengguna);
  }, [data, pengguna, versi]);

  if (!k) {
    return (
      <Callout variant="warning" tajuk="Akaun anda belum dipautkan kepada sekolah" ikon={<Info className="size-4" aria-hidden />}>
        Paparan Pentadbir Sekolah memerlukan sekolah yang sah pada profil pengguna. Hubungi pentadbir portal PPD untuk mengemas kini organisasi anda.
      </Callout>
    );
  }

  const prop = { ...props, k };
  return (
    <div className="min-w-0 space-y-6">
      <div className="border-b border-gray-200">
        <TabNavigation tab={[...TAB]} aktif={tab} pilih={setTab} label={`Bahagian Analitik SPM ${k.sekolah.nama}`} />
      </div>
      {k.kelas.length === 0 ? (
        <Callout variant="neutral" tajuk={`${k.sekolah.nama}: belum ada kelas berdaftar`} ikon={<Info className="size-4" aria-hidden />}>
          Analitik dipaparkan selepas guru mata pelajaran mendaftar kelas dan mengisi markah dalam Analitik SPM.
        </Callout>
      ) : (
        <div role="tabpanel" aria-label={TAB.find((t) => t.id === tab)?.label}>
          {tab === "analitik" && <TabAnalitikSekolah {...prop} />}
          {tab === "semak" && <TabSemakPengisian {...prop} />}
          {tab === "berisiko" && <TabBerisiko {...prop} />}
          {tab === "headcount" && <PanelHeadcount kelas={k.kelas} marks={k.marks} tajuk={`Headcount sasaran SPM · ${k.sekolah.nama}`} />}
          {tab === "laporan" && <TabLaporanSekolah {...prop} />}
        </div>
      )}
    </div>
  );
}
