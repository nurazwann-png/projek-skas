"use client";

import { AlertTriangle, CheckCircle2, ChevronRight, CircleAlert, ScrollText } from "lucide-react";
import { useState } from "react";
import { LineChart } from "@/components/tremor/charts";
import { Badge, Button, Callout, Card, Label, Modal, Select, Table, TableRoot, TajukBahagian, Td, Th } from "@/components/tremor/ui";
import { LULUS_MIN, UJIAN } from "@/lib/spm/analitik";
import type { RekodRisiko } from "@/lib/spm/pentadbir";
import { cn } from "@/lib/utils";
import { LencanaGred, type PropTabSekolah } from "./kongsi";

const LANGKAH = 20;
const siriMarkah = (r: RekodRisiko) => UJIAN.filter((u) => r.markah[u.key] != null).map((u) => `${u.label} ${r.markah[u.key]}`).join(" → ");

/* ── Pelajar Berisiko ── */
export function TabBerisiko({ k }: PropTabSekolah) {
  const [subjek, setSubjek] = useState("");
  const [had, setHad] = useState(LANGKAH);
  const [pilih, setPilih] = useState<string | null>(null);

  const senaraiSubjek = [...new Set(k.risiko.map((r) => r.subjek))].sort();
  const tapis = subjek ? k.risiko.filter((r) => r.subjek === subjek) : k.risiko;
  const papar = tapis.slice(0, had);
  const terpilih = k.risiko.find((r) => r.id === pilih) ?? null;
  const tidakLayak = k.lms.filter((m) => m.status === "tidak");
  const belum = k.lms.filter((m) => m.status === "belum").length;

  return (
    <div className="space-y-5">
      <TajukBahagian
        tajuk="Pelajar berisiko"
        sub="Murid yang markahnya merosot atau di bawah tahap lulus dalam sekurang-kurangnya satu subjek"
        kanan={<Badge variant={k.bilMuridBerisiko ? "error" : "success"}>{k.bilMuridBerisiko} murid · {k.risiko.length} rekod subjek</Badge>}
      />

      <Card>
        <div className="flex items-start gap-2">
          <ScrollText className="mt-0.5 size-4 shrink-0 text-[#13406e]" aria-hidden />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Layak Menerima Sijil (LMS)</h3>
            <p className="mt-0.5 text-sm text-gray-500">Murid mesti lulus (markah {LULUS_MIN} ke atas, gred E) dalam <b>Bahasa Melayu</b> dan <b>Sejarah</b> untuk layak menerima sijil SPM.</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
          {([["Layak", k.lms.length - tidakLayak.length - belum, "text-emerald-700"], ["Tidak layak", tidakLayak.length, tidakLayak.length ? "text-red-700" : "text-gray-900"], ["Belum lengkap", belum, belum ? "text-amber-700" : "text-gray-900"]] as const).map(([l, v, w]) => (
            <div key={l} className="rounded-md bg-gray-50 px-2 py-3">
              <dd className={cn("text-2xl font-semibold tabular-nums", w)}>{v}</dd>
              <dt className="mt-0.5 text-xs text-gray-500">{l}</dt>
            </div>
          ))}
        </dl>
        {tidakLayak.length > 0 ? (
          <>
            <TableRoot className="mt-4">
              <Table>
                <thead>
                  <tr><Th>Nama murid</Th><Th>Kelas</Th><Th className="text-center">Bahasa Melayu</Th><Th className="text-center">Sejarah</Th></tr>
                </thead>
                <tbody>
                  {tidakLayak.map((m) => (
                    <tr key={m.muridId}>
                      <Td className="min-w-44 font-medium text-gray-900">{m.nama}</Td>
                      <Td className="whitespace-nowrap">{m.kelas}</Td>
                      {[m.bm, m.sejarah].map((v, i) => (
                        <Td key={i} className="text-center whitespace-nowrap">
                          {typeof v === "number" ? <span className="inline-flex items-center gap-1.5"><span className={cn("font-semibold tabular-nums", v < LULUS_MIN ? "text-red-700" : "text-gray-900")}>{v}</span><LencanaGred markah={v} /></span> : "—"}
                        </Td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableRoot>
            <Callout variant="error" className="mt-4" tajuk={`${tidakLayak.length} murid gagal subjek wajib lulus`} ikon={<CircleAlert className="size-4" aria-hidden />}>
              Intervensi segera diperlukan supaya murid ini layak menerima sijil SPM.
            </Callout>
          </>
        ) : (
          <Callout variant={belum ? "neutral" : "success"} className="mt-4" tajuk={belum ? "Tiada murid gagal subjek wajib setakat ini" : "Semua murid lulus Bahasa Melayu dan Sejarah"} ikon={<CheckCircle2 className="size-4" aria-hidden />}>
            {belum > 0 && `${belum} murid belum lengkap markah Bahasa Melayu atau Sejarah.`}
          </Callout>
        )}
      </Card>

      {k.risiko.length === 0 ? (
        <Callout variant="success" tajuk="Tiada rekod berisiko dikesan" ikon={<CheckCircle2 className="size-4" aria-hidden />}>
          Tiada murid yang markah terkininya merosot lebih 5 markah sejak AR1 atau berada di bawah tahap lulus.
        </Callout>
      ) : (
        <>
          <Callout variant="warning" tajuk="Murid berikut perlu perhatian" ikon={<AlertTriangle className="size-4" aria-hidden />}>
            Rekod disenaraikan apabila markah terkini merosot lebih 5 markah sejak AR1, atau berada di bawah tahap lulus ({LULUS_MIN}). Pilih rekod untuk butiran dan cadangan tindakan.
          </Callout>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="w-full sm:w-64">
              <Label htmlFor="risiko-subjek">Tapis mengikut subjek</Label>
              <Select id="risiko-subjek" value={subjek} onChange={(e) => { setSubjek(e.target.value); setHad(LANGKAH); }}>
                <option value="">Semua subjek ({k.risiko.length})</option>
                {senaraiSubjek.map((s) => <option key={s} value={s}>{s} ({k.risiko.filter((r) => r.subjek === s).length})</option>)}
              </Select>
            </div>
            <span className="text-xs text-gray-500" aria-live="polite">Memaparkan {papar.length} daripada {tapis.length} rekod</span>
          </div>

          <Card className="p-0 sm:p-0">
            <ul className="divide-y divide-gray-100">
              {papar.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => setPilih(r.id)} className="group flex w-full flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 text-left hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#c8962a] sm:px-5">
                    <span className="min-w-0 flex-1 basis-56">
                      <span className="block truncate text-sm font-medium text-gray-900">{r.nama}</span>
                      <span className="block truncate text-xs text-gray-500">{r.subjek} · {r.kelas} · {r.guru}</span>
                    </span>
                    <span className="text-xs whitespace-nowrap text-gray-600 tabular-nums">{siriMarkah(r)}</span>
                    <span className="flex items-center gap-1.5">
                      {r.merosot && <Badge variant="error">−{r.jatuh} markah</Badge>}
                      {r.gagal && <Badge variant="error">Gagal</Badge>}
                      <ChevronRight className="size-4 text-gray-400 transition group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {(had < tapis.length || had > LANGKAH) && (
              <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
                {had > LANGKAH && <Button variant="ghost" className="px-2.5 py-1.5 shadow-none" onClick={() => setHad(LANGKAH)}>Tunjuk kurang</Button>}
                {had < tapis.length && <Button variant="secondary" className="px-2.5 py-1.5" onClick={() => setHad((n) => n + LANGKAH)}>Tunjuk lagi ({Math.min(LANGKAH, tapis.length - had)})</Button>}
              </div>
            )}
          </Card>
        </>
      )}

      {terpilih && <DialogMurid r={terpilih} tutup={() => setPilih(null)} />}
    </div>
  );
}

function ubah(a: number | undefined, b: number | undefined) {
  if (a == null || b == null) return <span className="text-gray-400">—</span>;
  const d = b - a;
  return <span className={cn("font-semibold tabular-nums", d < 0 ? "text-red-700" : d > 0 ? "text-emerald-700" : "text-gray-700")}>{d < 0 ? `▼ −${-d}` : d > 0 ? `▲ +${d}` : "Tiada perubahan"}{d !== 0 && " markah"}</span>;
}

function DialogMurid({ r, tutup }: { r: RekodRisiko; tutup: () => void }) {
  const m = r.markah;
  const cadangan: { kritikal: boolean; teks: string }[] = [];
  if (r.jatuh != null && r.jatuh >= 10) cadangan.push({ kritikal: true, teks: `Penurunan kritikal (${r.jatuh} markah) sejak AR1. Minta ${r.guru} menyediakan pelan intervensi bertulis dan pemantauan mingguan.` });
  else if (r.merosot) cadangan.push({ kritikal: false, teks: `Trend merosot sederhana (${r.jatuh} markah) sejak AR1. ${r.guru} perlu memantau dan melaporkan perkembangan murid ini sebelum SPM.` });
  if (r.gagal) cadangan.push({ kritikal: true, teks: `Markah terkini di bawah tahap lulus (${r.terkini}/100). Sesi bimbingan intensif diperlukan sebelum SPM.` });
  if (r.ses === "B40") cadangan.push({ kritikal: false, teks: "Murid daripada kumpulan B40. Pertimbangkan rujukan kepada program bantuan sekolah atau Kementerian Pendidikan yang berkaitan." });
  if (r.lokasi === "Pedalaman") cadangan.push({ kritikal: false, teks: "Murid dari kawasan pedalaman. Pastikan akses kepada bahan pembelajaran dan sokongan di luar waktu sekolah." });
  const bilMarkah = UJIAN.filter((u) => m[u.key] != null).length;

  return (
    <Modal buka tutup={tutup} tajuk={r.nama} sub={`${r.subjek} · Kelas ${r.kelas} · ${r.guru}`} lebar="max-w-2xl">
      <div className="space-y-5">
        <dl className="grid grid-cols-3 gap-3 text-center">
          {UJIAN.map((u) => (
            <div key={u.key} className="rounded-md bg-gray-50 px-2 py-3">
              <dt className="text-xs font-medium text-gray-500">{u.label}</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900 tabular-nums">{m[u.key] ?? "—"}</dd>
              <div className="mt-1 h-6">{m[u.key] != null && <LencanaGred markah={m[u.key]!} />}</div>
            </div>
          ))}
        </dl>

        {bilMarkah >= 2 && (
          <div>
            <h3 className="sr-only">Trend markah</h3>
            <LineChart data={UJIAN.map((u) => ({ ujian: u.label, Markah: m[u.key] ?? null }))} index="ujian" categories={["Markah"]} colors={["rose"]} domain={[0, 100]} className="h-44" />
          </div>
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div><dt className="text-xs text-gray-500">SES</dt><dd className="font-semibold text-gray-900">{r.ses || "—"}</dd></div>
          <div><dt className="text-xs text-gray-500">Lokasi</dt><dd className="font-semibold text-gray-900">{r.lokasi || "—"}</dd></div>
          <div><dt className="text-xs text-gray-500">Perubahan AR1 → AR2</dt><dd>{ubah(m.ar1, m.ar2)}</dd></div>
          <div><dt className="text-xs text-gray-500">Perubahan AR2 → Percubaan</dt><dd>{ubah(m.ar2, m.percubaan)}</dd></div>
          <div className="col-span-2"><dt className="text-xs text-gray-500">Perubahan keseluruhan (AR1 → markah terkini)</dt><dd className="text-base">{ubah(m.ar1, r.ujian === "ar1" ? undefined : r.terkini)}</dd></div>
        </dl>

        <div>
          <h3 className="text-xs font-semibold tracking-wide text-[#b7791f] uppercase">Cadangan tindakan</h3>
          <ul className="mt-2 space-y-2">
            {cadangan.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-gray-700">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", c.kritikal ? "bg-red-500" : "bg-amber-500")} aria-hidden />
                {c.teks}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
