"use client";

// Papan tugasan Penolong Jurutera (Admin PPD): aduan Baru dahulu, tapis ikut zon, semak → sah atau tolak.
import { CalendarDays, Eye, Folder, MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Card, Metrik, TabPil } from "@/components/tremor/ui";
import { fmtTarikh } from "@/lib/efasiliti/bantu";
import type { PropPaparan } from "@/lib/efasiliti/jenis";
import { cn } from "@/lib/utils";
import { AliranKerja, BarEksport, JALUR_KEUTAMAAN, Kosong, LencanaKeutamaan, LencanaStatus, zonTersedia } from "./kongsi";

export function PaparanPJ({ tiket, buka, cetak, makluman }: PropPaparan) {
  const [zon, setZon] = useState("Semua");
  const bil = (s: string) => tiket.filter((t) => t.status === s).length;
  const zonSemua = useMemo(() => ["Semua", ...new Set(["Zon 1", "Zon 2", "Zon 3", ...zonTersedia(tiket)])], [tiket]);
  const ditapis = useMemo(
    () => tiket.filter((t) => zon === "Semua" || t.zon === zon).sort((a, b) => (a.status === "Baru" ? 0 : 1) - (b.status === "Baru" ? 0 : 1)),
    [tiket, zon],
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Papan tugasan Penolong Jurutera</h2>
        <p className="mt-0.5 max-w-[62ch] text-sm text-gray-500">Aduan berstatus <b>Baru</b> dipaparkan dahulu. Buka aduan, rekod nota siasatan dan anggaran kos, kemudian sahkan atau tolak.</p>
      </div>
      <AliranKerja aktif="pj" />
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Metrik label="Perlu disemak" nilai={bil("Baru")} nota="Status Baru" />
        <Metrik label="Telah disahkan" nilai={bil("Disemak PJ")} nota="Menunggu PPD" />
        <Metrik label="Selesai" nilai={bil("Selesai")} nota="Kerja siap" />
      </dl>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-900">Senarai aduan <span className="font-normal text-gray-500">({ditapis.length})</span></h3>
          <TabPil tab={zonSemua.map((z) => ({ id: z, label: z }))} aktif={zon} pilih={setZon} label="Tapis zon" />
        </div>
        <BarEksport senarai={ditapis} keterangan={zon === "Semua" ? "Semua zon" : zon} cetak={cetak} makluman={makluman} />
        {ditapis.length === 0 ? (
          <Card><Kosong tajuk="Tiada aduan untuk zon ini" /></Card>
        ) : (
          <ul className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {ditapis.map((t) => {
              const baru = t.status === "Baru";
              return (
                <li key={t.id}>
                  <Card className={cn("flex h-full flex-col gap-2.5 border-l-4 p-4 sm:p-4", JALUR_KEUTAMAAN[t.keutamaan])}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-gray-500">{t.id}</span>
                      <LencanaKeutamaan keutamaan={t.keutamaan} />
                    </div>
                    <h4 className="text-[15px] leading-snug font-semibold text-gray-900">{t.tajuk}</h4>
                    <ul className="space-y-1 text-[13px] text-gray-600">
                      <li className="flex items-center gap-1.5"><MapPin className="size-3.5 shrink-0 text-gray-400" aria-hidden />{t.sekolah} · {t.zon}</li>
                      <li className="flex items-center gap-1.5"><Folder className="size-3.5 shrink-0 text-gray-400" aria-hidden />{t.kategori}</li>
                      <li className="flex items-center gap-1.5"><CalendarDays className="size-3.5 shrink-0 text-gray-400" aria-hidden />{fmtTarikh(t.tarikh)}</li>
                    </ul>
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5">
                      <LencanaStatus status={t.status} />
                      <Button variant={baru ? "primary" : "secondary"} onClick={() => buka(t.id, "semak")} className="min-h-11" aria-label={`${baru ? "Semak aduan" : "Lihat"} ${t.id}`}>
                        {baru ? <Search className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                        {baru ? "Semak aduan" : "Lihat"}
                      </Button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
