"use client";

// Analisis jurang pencapaian sekolah (SES, lokasi, jantina, penginapan) dan status LMS setiap murid.
import { ChevronRight, Info, Search } from "lucide-react";
import { useState } from "react";
import { BarChart, KadCarta } from "@/components/tremor/charts";
import { Badge, BadgeDeltaGps, Callout, Card, Input, Metrik, Table, TableRoot, TabPil, TajukBahagian, Td, Th } from "@/components/tremor/ui";
import { DIMENSI, LULUS_MIN, tahapGps, type DimensiJurang, type Jurang, type StatusLMS } from "@/lib/spm/analitik";
import type { KonteksSekolah, MuridLMS } from "@/lib/spm/pentadbir";
import { GPS_BACA } from "../kongsi";
import { LencanaGred } from "./kongsi";

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

type Panel = DimensiJurang | "lms";
export function BahagianJurang({ k }: { k: KonteksSekolah }) {
  const [panel, setPanel] = useState<Panel>("ses");
  const tab: { id: Panel; label: string }[] = [...(Object.keys(DIMENSI) as DimensiJurang[]).map((id) => ({ id, label: DIMENSI[id].label })), { id: "lms", label: "LMS" }];
  const bilDikira = k.d.jurang[panel === "lms" ? "ses" : panel]?.kumpulan.reduce((a, g) => a + g.bil, 0);
  return (
    <section className="space-y-4" aria-label="Analisis jurang pencapaian">
      <TajukBahagian
        tajuk="Analisis jurang pencapaian"
        sub={`GPS mengikut latar murid, dikira daripada markah guru${panel !== "lms" && bilDikira ? ` (${bilDikira} murid)` : ""}. Setiap murid dikira sekali (purata GPS semua subjeknya).`}
        kanan={<TabPil tab={tab} aktif={panel} pilih={setPanel} label="Dimensi jurang" />}
      />
      {panel === "lms" ? <PanelLMS lms={k.lms} /> : <PanelDimensi j={k.d.jurang[panel]} dim={panel} />}
    </section>
  );
}

const CADANGAN: Record<DimensiJurang, (j: Jurang) => string> = {
  ses: (j) => `Murid ${j.terlemah} memerlukan sokongan tambahan: pertimbangkan kelas bimbingan, bantuan bahan pembelajaran dan mentor rakan sebaya.`,
  lokasi: (j) => `Murid dari kawasan ${j.terlemah} ketinggalan: pertimbangkan kelas tambahan hujung minggu dan sokongan pembelajaran di luar waktu sekolah.`,
  jantina: (j) => `Fokuskan intervensi untuk murid ${j.terlemah.toLowerCase()}: mentoring, program motivasi dan penjejakan kehadiran secara aktif.`,
  penginapan: (j) => (j.terbaik === "Asrama" ? "Persekitaran asrama yang berstruktur mungkin menyumbang. Pertimbangkan program mentor rakan sebaya antara murid asrama dan harian." : "Murid harian mencatat prestasi lebih baik. Semak jadual prep dan sokongan pembelajaran di asrama."),
};

function PanelDimensi({ j, dim }: { j: Jurang | null; dim: DimensiJurang }) {
  if (!j) return <Callout variant="neutral" tajuk="Data belum mencukupi" ikon={<Info className="size-4" aria-hidden />}>Sekurang-kurangnya dua kumpulan {DIMENSI[dim].tajuk.toLowerCase()} dengan markah diperlukan untuk analisis ini.</Callout>;
  const teruk = j.magnitud >= 1 ? "error" : j.magnitud >= 0.5 ? "warning" : "success";
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <KadCarta
        tajuk={`GPS mengikut ${DIMENSI[dim].tajuk.toLowerCase()}`}
        sub="AR1 berbanding markah terkini · lebih rendah lebih baik"
        apa={`Purata GPS murid sekolah ini bagi setiap kumpulan ${DIMENSI[dim].tajuk.toLowerCase()}, pada AR1 dan pada markah terkini.`}
        baca={`${GPS_BACA} Beza panjang bar antara kumpulan ialah jurang pencapaian. Bar terkini (biru) yang lebih pendek daripada bar AR1 (kelabu) menunjukkan kumpulan itu bertambah baik.`}
        legenda={[{ nama: "GPS AR1", warna: "slate" }, { nama: "GPS terkini", warna: "blue" }]}
        carta={(h) => <BarChart data={j.kumpulan.map((g) => ({ kumpulan: g.label, "GPS AR1": g.gpsAR1, "GPS terkini": g.gps, bil: g.bil }))} index="kumpulan" categories={["GPS AR1", "GPS terkini"]} colors={["slate", "blue"]} layout="horizontal" fmt={(v) => v.toFixed(2)} nota={(b) => `${b.bil} murid`} labelNilai lebarLabel={96} className={h} />}
      />
      <div className="space-y-3">
        <Callout variant={teruk} tajuk={`Jurang GPS ${j.magnitud.toFixed(2)}`}>
          Kumpulan <b>{j.terlemah}</b> ketinggalan {j.magnitud.toFixed(2)} mata GPS berbanding kumpulan <b>{j.terbaik}</b>. {j.magnitud >= 0.5 ? CADANGAN[dim](j) : "Jurang kecil; teruskan pemantauan."}
        </Callout>
        <dl className="grid gap-3">
          {j.kumpulan.map((g) => (
            <Metrik
              key={g.label}
              label={`${g.label} · ${g.bil} murid`}
              nilai={g.gps.toFixed(2)}
              tona={tahapGps(g.gps)}
              lencana={<BadgeDeltaGps delta={g.gpsAR1 != null ? g.gps - g.gpsAR1 : null} akhiran=" sejak AR1" />}
              nota={`${g.lulusPct}% lulus semua subjek`}
            />
          ))}
        </dl>
      </div>
    </div>
  );
}

/* ── LMS ── */
type TapisLMS = StatusLMS | "semua";
const LABEL_STATUS: Record<StatusLMS, { teks: string; varian: "success" | "error" | "warning" }> = {
  layak: { teks: "Layak LMS", varian: "success" },
  tidak: { teks: "Tidak layak", varian: "error" },
  belum: { teks: "Belum lengkap", varian: "warning" },
};

function SelWajib({ v }: { v: number | null | undefined }) {
  if (typeof v !== "number") return <span className="text-xs text-gray-400">{v === undefined ? "Tiada kelas" : "Belum diisi"}</span>;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={v < LULUS_MIN ? "font-semibold text-red-700 tabular-nums" : "font-semibold text-gray-900 tabular-nums"}>{v}</span>
      <LencanaGred markah={v} />
      <span className="sr-only">{v < LULUS_MIN ? "gagal" : "lulus"}</span>
    </span>
  );
}

function PanelLMS({ lms }: { lms: MuridLMS[] }) {
  const [tapis, setTapis] = useState<TapisLMS>("tidak");
  const [cari, setCari] = useState("");
  const bil = (s: StatusLMS, senarai = lms) => senarai.filter((m) => m.status === s).length;
  const jumlah = lms.length;
  const q = cari.trim().toLocaleLowerCase("ms-MY");
  const ditapis = lms.filter((m) => (tapis === "semua" || m.status === tapis) && (!q || m.nama.toLocaleLowerCase("ms-MY").includes(q)));
  const ikutKelas = new Map<string, MuridLMS[]>();
  ditapis.forEach((m) => ikutKelas.set(m.kelas, [...(ikutKelas.get(m.kelas) || []), m]));
  const penginapan = DIMENSI.penginapan.kumpulan.map((p) => ({ label: p, senarai: lms.filter((m) => m.penginapan === p) })).filter((p) => p.senarai.length);

  return (
    <div className="space-y-4">
      <Callout variant="default" tajuk="Layak Menerima Sijil (LMS)" ikon={<Info className="size-4" aria-hidden />}>
        Murid layak menerima sijil SPM jika lulus <b>Bahasa Melayu</b> dan <b>Sejarah</b> (markah {LULUS_MIN} ke atas, gred E). Kiraan berdasarkan markah terkini; murid yang markah BM atau Sejarahnya belum diisi dikira &quot;belum lengkap&quot;.
        {bil("tidak") > 0 ? <> <b>{bil("tidak")} murid</b> berisiko tidak menerima sijil dan memerlukan intervensi segera.</> : bil("belum") === 0 && jumlah > 0 ? " Semua murid lulus kedua-dua subjek wajib." : ""}
      </Callout>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Metrik label="Layak LMS" nilai={bil("layak")} tona="baik" nota={`${pct(bil("layak"), jumlah)}% daripada ${jumlah} murid`} />
        <Metrik label="Tidak layak LMS" nilai={bil("tidak")} tona={bil("tidak") ? "lemah" : null} nota="Gagal BM atau Sejarah" />
        <Metrik label="Belum lengkap data" nilai={bil("belum")} tona={bil("belum") ? "sederhana" : null} nota="Markah BM atau Sejarah belum diisi" />
      </dl>

      {penginapan.length > 0 && (
        <Card className="p-0 sm:p-0">
          <div className="px-5 pt-4 text-sm font-semibold text-gray-900">LMS mengikut penginapan</div>
          <TableRoot className="mt-2">
            <Table className="border-b-0">
              <thead>
                <tr><Th>Penginapan</Th><Th className="text-right">Layak</Th><Th className="text-right">Tidak layak</Th><Th className="text-right">Belum lengkap</Th></tr>
              </thead>
              <tbody>
                {penginapan.map((p) => (
                  <tr key={p.label}>
                    <Td className="font-medium whitespace-nowrap text-gray-900">{p.label} <span className="font-normal text-gray-500">({p.senarai.length})</span></Td>
                    <Td className="text-right whitespace-nowrap tabular-nums">{bil("layak", p.senarai)} <span className="text-xs text-gray-500">({pct(bil("layak", p.senarai), p.senarai.length)}%)</span></Td>
                    <Td className="text-right whitespace-nowrap tabular-nums">{bil("tidak", p.senarai)} <span className="text-xs text-gray-500">({pct(bil("tidak", p.senarai), p.senarai.length)}%)</span></Td>
                    <Td className="text-right tabular-nums">{bil("belum", p.senarai)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableRoot>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-900">Senarai status LMS murid</h3>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
            <Input type="search" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama murid" aria-label="Cari nama murid" className="pl-9" />
          </div>
        </div>
        <div className="mt-3">
          <TabPil
            label="Tapis status LMS"
            aktif={tapis}
            pilih={setTapis}
            tab={[
              { id: "tidak", label: `Tidak layak (${bil("tidak")})` },
              { id: "layak", label: `Layak (${bil("layak")})` },
              { id: "belum", label: `Belum lengkap (${bil("belum")})` },
              { id: "semua", label: `Semua (${jumlah})` },
            ]}
          />
        </div>
        <p className="mt-3 text-xs text-gray-500" aria-live="polite">{ditapis.length} murid dipaparkan</p>
        {ditapis.length === 0 ? (
          <p className="mt-2 rounded-md bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">{q ? `Tiada murid bernama "${cari.trim()}" dalam kategori ini.` : "Tiada murid dalam kategori ini."}</p>
        ) : (
          <div className="mt-2 space-y-2">
            {[...ikutKelas.entries()].map(([kelas, murid]) => (
              <details key={kelas} open className="group rounded-md border border-gray-200">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#c8962a] [&::-webkit-details-marker]:hidden">
                  <ChevronRight className="size-4 text-gray-500 transition group-open:rotate-90" aria-hidden />
                  <span className="font-semibold text-gray-900">{kelas}</span>
                  <span className="text-xs text-gray-500">{murid.length} murid</span>
                  <span className="ml-auto flex flex-wrap gap-1.5">
                    {(["tidak", "layak", "belum"] as const).map((s) => bil(s, murid) > 0 && <Badge key={s} variant={LABEL_STATUS[s].varian}>{bil(s, murid)} {LABEL_STATUS[s].teks.toLowerCase()}</Badge>)}
                  </span>
                </summary>
                <TableRoot className="border-t border-gray-200">
                  <Table className="border-b-0">
                    <thead>
                      <tr><Th>Nama murid</Th><Th>Penginapan</Th><Th>Bahasa Melayu</Th><Th>Sejarah</Th><Th>Status LMS</Th></tr>
                    </thead>
                    <tbody>
                      {murid.map((m) => (
                        <tr key={m.muridId}>
                          <Td className="min-w-44 font-medium text-gray-900">{m.nama}</Td>
                          <Td>{m.penginapan || "—"}</Td>
                          <Td><SelWajib v={m.bm} /></Td>
                          <Td><SelWajib v={m.sejarah} /></Td>
                          <Td><Badge variant={LABEL_STATUS[m.status].varian}>{LABEL_STATUS[m.status].teks}</Badge></Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableRoot>
              </details>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
