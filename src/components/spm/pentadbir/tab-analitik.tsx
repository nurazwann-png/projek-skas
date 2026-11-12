"use client";

import { Info } from "lucide-react";
import { KadCarta, LineChart } from "@/components/tremor/charts";
import { Badge, BadgeDeltaGps, Callout, Card, Metrik, Table, TableRoot, TajukBahagian, Td, Th } from "@/components/tremor/ui";
import { UJIAN, fmtGps, tahapGps } from "@/lib/spm/analitik";
import { statusGpmp } from "@/lib/spm/pentadbir";
import { cn } from "@/lib/utils";
import { GPS_BACA, julatGps } from "../kongsi";
import { BahagianGps } from "./bahagian-gps";
import { BahagianJurang } from "./bahagian-jurang";
import type { PropTabSekolah } from "./kongsi";

const VARIAN_STATUS = { Cemerlang: "success", Sederhana: "warning", "Perlu perhatian": "error" } as const;
const kelasGpmp = (g: number) => (g <= 4.5 ? "text-emerald-700" : g <= 5.5 ? "text-amber-700" : "text-red-700");

/* ── Analitik Sekolah ── */
export function TabAnalitikSekolah(prop: PropTabSekolah) {
  const { k } = prop;
  const { d, s } = k;
  const delta = d.gps != null && d.gpsUjian.ar1 != null ? d.gps - d.gpsUjian.ar1 : null;
  const risikoPct = d.bilMurid ? Math.round((k.bilMuridBerisiko / d.bilMurid) * 100) : 0;
  const trend = UJIAN.map((u) => ({ ujian: u.label, "GPS sekolah": d.gpsUjian[u.key] }));
  const panitia = [...(s?.panitia ?? [])].sort((a, b) => (b.gps ?? -1) - (a.gps ?? -1));

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <TajukBahagian
          tajuk={k.sekolah.nama}
          sub={`Ringkasan pencapaian · markah yang diisi guru ${k.tahun} · ${k.sekolah.kod}`}
          kanan={d.gps != null ? <Badge variant={tahapGps(d.gps) === "baik" ? "success" : tahapGps(d.gps) === "sederhana" ? "warning" : "error"}>GPS {fmtGps(d.gps)}</Badge> : undefined}
        />

        {!s ? (
          <Callout variant="neutral" tajuk="Belum ada markah diisi" ikon={<Info className="size-4" aria-hidden />}>
            {k.kelas.length} kelas subjek telah didaftarkan tetapi belum ada markah. GPS, jurang dan prestasi panitia akan dipaparkan sebaik sahaja guru mengisi markah.
          </Callout>
        ) : (
          <>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metrik label="GPS sekolah (markah terkini)" nilai={fmtGps(d.gps)} tona={tahapGps(d.gps)} lencana={<BadgeDeltaGps delta={delta} akhiran=" sejak AR1" />} nota={`${k.kelas.length} kelas subjek · ${d.subjek.length} mata pelajaran`} />
              <Metrik label="Murid lulus semua subjek" nilai={`${d.lulusPct}%`} tona={d.lulusPct === 100 ? "baik" : null} lencana={<Badge variant={d.lulusPct === 100 ? "success" : "neutral"}>Lulus 100%: {d.lulusPct === 100 ? "Ya" : "Tidak"}</Badge>} nota="Markah terkini 40 ke atas bagi setiap subjek" />
              <Metrik label="Jumlah murid" nilai={d.bilMurid} nota={`Unjuran GPS SPM ${fmtGps(d.ramal)} berdasarkan trend ujian`} />
              <Metrik label="Murid berisiko" nilai={k.bilMuridBerisiko} tona={k.bilMuridBerisiko ? "lemah" : "baik"} lencana={<Badge variant={k.bilMuridBerisiko ? "error" : "neutral"}>{risikoPct}% murid</Badge>} nota="Merosot lebih 5 markah sejak AR1 atau gagal dalam mana-mana subjek" />
            </dl>

            <KadCarta
              tajuk="Trend GPS sekolah"
              sub={`AR1 → AR2 → Percubaan ${k.tahun} · lebih rendah lebih baik`}
              apa="Perubahan GPS sekolah merentas tiga ujian tahun ini, dikira daripada markah yang diisi oleh guru."
              baca={`${GPS_BACA} Garis yang MENURUN menunjukkan prestasi sekolah bertambah baik dari satu ujian ke ujian seterusnya.`}
              carta={(h) => <LineChart data={trend} index="ujian" categories={["GPS sekolah"]} colors={["blue"]} fmt={(v) => v.toFixed(2)} domain={julatGps(Object.values(d.gpsUjian))} className={h} />}
              kaki={d.isiPct < 100 ? `GPS ${k.pe.label} dikira daripada markah yang telah diisi setakat ini (${d.isiPct}% lengkap), jadi ia masih boleh berubah.` : undefined}
            />
          </>
        )}
      </div>

      <BahagianGps {...prop} />

      {s && <BahagianJurang k={k} />}

      {s && (
        <section className="space-y-4" aria-label="Prestasi mengikut panitia">
          <TajukBahagian tajuk="Prestasi mengikut panitia" sub="GPMP (Gred Purata Mata Pelajaran) berdasarkan markah terkini, berbanding AR1" />
          <Card className="p-0 sm:p-0">
            <TableRoot>
              <Table className="border-b-0">
                <thead>
                  <tr><Th>Mata pelajaran</Th><Th>Guru panitia</Th><Th className="text-right">GPMP terkini</Th><Th className="text-right">GPMP AR1</Th><Th>Trend</Th><Th className="text-right">Bil. murid</Th><Th>Status</Th></tr>
                </thead>
                <tbody>
                  {panitia.map((p) => (
                    <tr key={p.subjek} className="hover:bg-gray-50">
                      <Td className="font-medium whitespace-nowrap text-gray-900">{p.subjek}</Td>
                      <Td className="min-w-40">{p.guru}</Td>
                      <Td className={cn("text-right text-base font-semibold tabular-nums", p.gps != null ? kelasGpmp(p.gps) : "text-gray-400")}>{fmtGps(p.gps)}</Td>
                      <Td className="text-right tabular-nums">{fmtGps(p.gpsAR1)}</Td>
                      <Td><BadgeDeltaGps delta={p.gps != null && p.gpsAR1 != null ? p.gps - p.gpsAR1 : null} /></Td>
                      <Td className="text-right tabular-nums">{p.bil}</Td>
                      <Td>{p.gps != null ? <Badge variant={VARIAN_STATUS[statusGpmp(p.gps)]}>{statusGpmp(p.gps)}</Badge> : <Badge variant="neutral">Tiada markah</Badge>}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableRoot>
          </Card>
          <p className="text-xs text-gray-500">Status: Cemerlang (GPMP 4.50 atau kurang), Sederhana (4.51 hingga 5.50), Perlu perhatian (melebihi 5.50). {GPS_BACA}</p>
        </section>
      )}
    </div>
  );
}
