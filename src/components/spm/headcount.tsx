"use client";

// Panel Headcount: markah terkini setiap murid berbanding sasaran SPM yang ditetapkan guru.
// Digunakan oleh paparan Pentadbir Sekolah (kelas sekolah sendiri) dan Admin PPD (kelas semua sekolah).
import { ArrowDown, ArrowUp, ArrowUpDown, Info, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { BarChart, KadCarta } from "@/components/tremor/charts";
import { Badge, Button, Callout, Card, CategoryBar, Metrik, Table, TableRoot, TajukBahagian, Td, Th } from "@/components/tremor/ui";
import type { Kelas, Marks } from "@/lib/portal/stor";
import { LABEL_UJIAN, kiraHeadcount, type EntriHeadcount } from "@/lib/spm/headcount";
import { cn } from "@/lib/utils";

const LANGKAH = 10;
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const fmt1 = (v: number | null) => (v == null ? "—" : v.toFixed(1));
const fmtJurang = (v: number | null) => (v == null ? "—" : `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}`);
const fmtJurangBulat = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)}`;
const pendekSubjek = (s: string) => ({ "Bahasa Melayu": "BM", "Bahasa Inggeris": "BI" })[s] ?? s;
const namaPendek = (nama: string) => nama.replace(/^SMK\s+/i, "");

function LencanaJurang({ v }: { v: number | null }) {
  if (v == null) return <Badge variant="neutral">—</Badge>;
  return <Badge variant={v >= 0 ? "success" : v > -5 ? "warning" : "error"}>{fmtJurang(v)}</Badge>;
}

type KunciSusun = "nama" | "kelas" | "subjek" | "terkini" | "sasaran" | "jurang";
const banding: Record<KunciSusun, (a: EntriHeadcount, b: EntriHeadcount) => number> = {
  nama: (a, b) => a.nama.localeCompare(b.nama),
  kelas: (a, b) => a.sekolah.localeCompare(b.sekolah) || a.kelas.localeCompare(b.kelas),
  subjek: (a, b) => a.subjek.localeCompare(b.subjek),
  terkini: (a, b) => a.terkini! - b.terkini!,
  sasaran: (a, b) => a.sasaran! - b.sasaran!,
  jurang: (a, b) => a.jurang! - b.jurang!,
};

export function PanelHeadcount({ kelas, marks, tajuk = "Headcount sasaran SPM" }: { kelas: Kelas[]; marks: Marks; tajuk?: string }) {
  const h = useMemo(() => kiraHeadcount(kelas, marks), [kelas, marks]);
  const [susun, setSusun] = useState<{ kunci: KunciSusun; menaik: boolean }>({ kunci: "jurang", menaik: true });
  const [had, setHad] = useState(LANGKAH);

  const senarai = useMemo(() => {
    const s = [...h.bawahSasaran].sort(banding[susun.kunci]);
    return susun.menaik ? s : s.reverse();
  }, [h, susun]);
  const tukarSusun = (kunci: KunciSusun) => setSusun((s) => (s.kunci === kunci ? { kunci, menaik: !s.menaik } : { kunci, menaik: true }));

  const sub = "Markah terkini setiap murid (Percubaan, jika tiada AR2, jika tiada AR1) berbanding markah sasaran SPM yang ditetapkan guru";

  if (kelas.length === 0) {
    return (
      <div className="space-y-5">
        <TajukBahagian tajuk={tajuk} sub={sub} />
        <Callout variant="neutral" tajuk="Belum ada kelas berdaftar" ikon={<Info className="size-4" aria-hidden />}>Headcount dipaparkan selepas guru mendaftar kelas dan mengisi markah.</Callout>
      </div>
    );
  }

  if (h.bersasaran === 0) {
    return (
      <div className="space-y-5">
        <TajukBahagian tajuk={tajuk} sub={sub} />
        <Card className="py-10 text-center sm:py-12">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#13406e]/10 text-[#13406e]"><Target className="size-6" aria-hidden /></span>
          <h3 className="mt-4 text-base font-semibold text-gray-900">Belum ada sasaran ditetapkan</h3>
          <p className="mx-auto mt-1.5 max-w-xl text-sm leading-relaxed text-gray-600">
            Guru mata pelajaran menetapkan markah sasaran SPM setiap murid semasa mengisi markah (lajur Sasaran dalam Isi Markah). Sebaik sahaja sasaran diisi, pencapaian berbanding sasaran akan dipaparkan di sini.
          </p>
          <p className="mt-3 text-xs text-gray-500">{h.bil} rekod murid-subjek dalam {kelas.length} kelas subjek · tiada satu pun mempunyai sasaran</p>
        </Card>
      </div>
    );
  }

  const berbilangSekolah = h.bilSekolah > 1;
  const mendatar = h.subjek.length > 6;
  const dataCarta = h.subjek.filter((s) => s.dinilai > 0).map((s) => ({ subjek: mendatar ? s.subjek : pendekSubjek(s.subjek), "TOV (AR1)": s.tov, Terkini: s.terkini, Sasaran: s.sasaran, bil: s.dinilai }));
  const papar = senarai.slice(0, had);

  return (
    <div className="space-y-5">
      <TajukBahagian tajuk={tajuk} sub={sub} />

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metrik label="Entri dengan sasaran" nilai={h.bersasaran} lencana={<Badge variant="neutral">{pct(h.bersasaran, h.bil)}% daripada {h.bil}</Badge>} nota="Satu entri = seorang murid dalam satu subjek" />
        <Metrik label="Mencapai atau melepasi sasaran" nilai={h.capai} tona={h.dinilai && h.capai === h.dinilai ? "baik" : null} lencana={<Badge variant="success">{pct(h.capai, h.dinilai)}%</Badge>} nota={`daripada ${h.dinilai} entri bersasaran yang ada markah`} />
        <Metrik label="Di bawah sasaran" nilai={h.bawah} tona={h.bawah ? "lemah" : "baik"} lencana={<Badge variant={h.bawah ? "error" : "neutral"}>{pct(h.bawah, h.dinilai)}%</Badge>} nota={h.belumMarkah ? `${h.belumMarkah} entri bersasaran belum ada markah` : "Markah terkini lebih rendah daripada sasaran"} />
        <Metrik label="Tiada sasaran" nilai={h.tiadaSasaran} tona={h.tiadaSasaran ? "sederhana" : "baik"} nota="Dikira berasingan; tiada sasaran diandaikan" />
      </dl>

      <Card className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-gray-900">Status semua entri murid-subjek</h3>
        <CategoryBar
          className="mt-3"
          data={[
            { label: `Capai sasaran (${h.capai})`, nilai: h.capai, warna: "emerald" },
            { label: `Bawah sasaran (${h.bawah})`, nilai: h.bawah, warna: "rose" },
            { label: `Bersasaran, belum ada markah (${h.belumMarkah})`, nilai: h.belumMarkah, warna: "amber" },
            { label: `Tiada sasaran (${h.tiadaSasaran})`, nilai: h.tiadaSasaran, warna: "slate" },
          ]}
        />
      </Card>

      {h.tiadaSasaran > 0 && (
        <Callout variant="warning" tajuk={`${h.tiadaSasaran} entri belum mempunyai sasaran`} ikon={<Info className="size-4" aria-hidden />}>
          Entri ini tidak dimasukkan dalam mana-mana perbandingan di bawah. Guru menetapkan sasaran semasa mengisi markah.
          {h.subjekTiadaSasaran.length > 0 && <> Subjek tanpa sebarang sasaran: <b>{h.subjekTiadaSasaran.join(", ")}</b>.</>}
        </Callout>
      )}

      {dataCarta.length > 0 && (
        <KadCarta
          tajuk="TOV → terkini → sasaran mengikut subjek"
          sub="Purata markah · entri yang ada sasaran dan markah sahaja"
          apa="Bagi setiap subjek: purata markah AR1 (TOV, titik mula), purata markah terkini dan purata markah sasaran SPM yang ditetapkan guru."
          baca="Bandingkan bar Terkini (biru) dengan bar Sasaran (jingga): jika bar biru lebih rendah, subjek itu masih di bawah sasaran dan beza ketinggiannya ialah jurang yang perlu ditutup. Bar TOV (kelabu) menunjukkan sejauh mana murid telah bergerak sejak AR1."
          legenda={[{ nama: "TOV (AR1)", warna: "slate" }, { nama: "Terkini", warna: "blue" }, { nama: "Sasaran", warna: "amber" }]}
          carta={(t) => {
            const carta = (
              <BarChart
                data={dataCarta}
                index="subjek"
                categories={["TOV (AR1)", "Terkini", "Sasaran"]}
                colors={["slate", "blue", "amber"]}
                layout={mendatar ? "horizontal" : "vertical"}
                fmt={(v) => v.toFixed(1)}
                domain={[0, 100]}
                nota={(b) => `${b.bil} entri`}
                lebarLabel={130}
                className={mendatar && t === "h-64" ? "h-full" : t}
              />
            );
            return mendatar && t === "h-64" ? <div style={{ height: Math.max(256, dataCarta.length * 72) }}>{carta}</div> : carta;
          }}
          kaki="TOV, terkini dan sasaran dipuratakan bagi kumpulan entri yang sama (ada sasaran dan sekurang-kurangnya satu markah), supaya ketiga-tiganya boleh dibandingkan."
        />
      )}

      <Card className="p-0 sm:p-0">
        <div className="px-5 pt-4">
          <h3 className="text-sm font-semibold text-gray-900">Ringkasan mengikut subjek</h3>
          <p className="mt-0.5 text-sm text-gray-500">Jurang = purata terkini tolak purata sasaran. Nilai negatif bermaksud masih di bawah sasaran.</p>
        </div>
        <TableRoot className="mt-3">
          <Table className="border-b-0">
            <thead>
              <tr>
                <Th>Subjek</Th>
                <Th className="text-right">Bersasaran</Th>
                <Th className="text-right">Tiada sasaran</Th>
                <Th className="text-right">TOV (AR1)</Th>
                <Th className="text-right">Terkini</Th>
                <Th className="text-right">Sasaran</Th>
                <Th className="text-right">Jurang</Th>
                <Th className="text-right">Capai sasaran</Th>
              </tr>
            </thead>
            <tbody>
              {h.subjek.map((s) => (
                <tr key={s.subjek}>
                  <Td className="font-medium whitespace-nowrap text-gray-900">{s.subjek}</Td>
                  <Td className="text-right tabular-nums">{s.bersasaran}<span className="text-xs text-gray-500"> / {s.bil}</span></Td>
                  <Td className="text-right tabular-nums">{s.tiadaSasaran}</Td>
                  <Td className="text-right tabular-nums">{fmt1(s.tov)}</Td>
                  <Td className="text-right font-semibold text-gray-900 tabular-nums">{fmt1(s.terkini)}</Td>
                  <Td className="text-right tabular-nums">{fmt1(s.sasaran)}</Td>
                  <Td className="text-right"><LencanaJurang v={s.jurang} /></Td>
                  <Td className="text-right whitespace-nowrap tabular-nums">{s.dinilai ? <>{s.capai}/{s.dinilai} <span className="text-xs text-gray-500">({pct(s.capai, s.dinilai)}%)</span></> : "—"}</Td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <Td className="font-semibold text-gray-900">Keseluruhan</Td>
                <Td className="text-right font-semibold text-gray-900 tabular-nums">{h.bersasaran}<span className="text-xs font-normal text-gray-500"> / {h.bil}</span></Td>
                <Td className="text-right font-semibold text-gray-900 tabular-nums">{h.tiadaSasaran}</Td>
                <Td className="text-right font-semibold text-gray-900 tabular-nums">{fmt1(h.tov)}</Td>
                <Td className="text-right font-semibold text-gray-900 tabular-nums">{fmt1(h.terkini)}</Td>
                <Td className="text-right font-semibold text-gray-900 tabular-nums">{fmt1(h.sasaran)}</Td>
                <Td className="text-right"><LencanaJurang v={h.jurang} /></Td>
                <Td className="text-right font-semibold whitespace-nowrap text-gray-900 tabular-nums">{h.dinilai ? `${h.capai}/${h.dinilai} (${pct(h.capai, h.dinilai)}%)` : "—"}</Td>
              </tr>
            </tbody>
          </Table>
        </TableRoot>
      </Card>

      <Card className="p-0 sm:p-0">
        <div className="flex flex-wrap items-end justify-between gap-2 px-5 pt-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Murid paling jauh di bawah sasaran</h3>
            <p className="mt-0.5 text-sm text-gray-500">Klik tajuk lajur untuk menyusun semula.</p>
          </div>
          <Badge variant={h.bawah ? "error" : "success"}>{h.bawah} entri di bawah sasaran</Badge>
        </div>
        {h.bawah === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-600">Tiada murid di bawah sasaran bagi entri yang telah ada sasaran dan markah.</div>
        ) : (
          <>
            <TableRoot className="mt-3">
              <Table className="border-b-0">
                <thead>
                  <tr>
                    <ThSusun kunci="nama" susun={susun} tukar={tukarSusun}>Nama</ThSusun>
                    <ThSusun kunci="kelas" susun={susun} tukar={tukarSusun}>Kelas</ThSusun>
                    <ThSusun kunci="subjek" susun={susun} tukar={tukarSusun}>Subjek</ThSusun>
                    <ThSusun kunci="terkini" susun={susun} tukar={tukarSusun} kanan>Terkini</ThSusun>
                    <ThSusun kunci="sasaran" susun={susun} tukar={tukarSusun} kanan>Sasaran</ThSusun>
                    <ThSusun kunci="jurang" susun={susun} tukar={tukarSusun} kanan>Jurang</ThSusun>
                  </tr>
                </thead>
                <tbody>
                  {papar.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <Td className="min-w-44 font-medium text-gray-900">{e.nama}</Td>
                      <Td className="whitespace-nowrap">{e.kelas}{berbilangSekolah && <div className="text-xs text-gray-500">{namaPendek(e.sekolah)}</div>}</Td>
                      <Td className="whitespace-nowrap">{e.subjek}</Td>
                      <Td className="text-right whitespace-nowrap tabular-nums"><span className="font-semibold text-gray-900">{e.terkini}</span>{e.ujian && <span className="ml-1 text-xs text-gray-500">{LABEL_UJIAN[e.ujian]}</span>}</Td>
                      <Td className="text-right tabular-nums">{e.sasaran}</Td>
                      <Td className="text-right"><Badge variant={e.jurang! > -5 ? "warning" : "error"}>{fmtJurangBulat(e.jurang!)}</Badge></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableRoot>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-5 py-3">
              <span className="text-xs text-gray-500" aria-live="polite">Memaparkan {papar.length} daripada {senarai.length}</span>
              <span className="flex gap-2">
                {had > LANGKAH && <Button variant="ghost" className="px-2.5 py-1.5 shadow-none" onClick={() => setHad(LANGKAH)}>Tunjuk kurang</Button>}
                {had < senarai.length && <Button variant="secondary" className="px-2.5 py-1.5" onClick={() => setHad((n) => n + LANGKAH)}>Tunjuk lagi ({Math.min(LANGKAH, senarai.length - had)})</Button>}
              </span>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function ThSusun({ kunci, susun, tukar, kanan, children }: { kunci: KunciSusun; susun: { kunci: KunciSusun; menaik: boolean }; tukar: (k: KunciSusun) => void; kanan?: boolean; children: string }) {
  const aktif = susun.kunci === kunci;
  const Ikon = !aktif ? ArrowUpDown : susun.menaik ? ArrowUp : ArrowDown;
  return (
    <Th aria-sort={aktif ? (susun.menaik ? "ascending" : "descending") : "none"} className={cn("p-0", kanan && "text-right")}>
      <button
        type="button"
        onClick={() => tukar(kunci)}
        className={cn("inline-flex w-full items-center gap-1 px-4 py-3 text-xs font-semibold tracking-wide uppercase hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#c8962a]", kanan && "justify-end", aktif ? "text-gray-900" : "text-gray-500")}
      >
        {children}
        <Ikon className={cn("size-3.5 shrink-0", !aktif && "text-gray-400")} aria-hidden />
      </button>
    </Th>
  );
}
