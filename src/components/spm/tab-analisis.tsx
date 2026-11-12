"use client";

import { Award, CheckCircle2, Flag, Info } from "lucide-react";
import { useState } from "react";
import { BarChart, KadCarta, RadarChart } from "@/components/tremor/charts";
import { Badge, BadgeDeltaGps, Callout, Card, Metrik, Table, TableRoot, TabPil, TajukBahagian, Td, Th, type Warna } from "@/components/tremor/ui";
import { DIMENSI, fmtGps, tahapGps, type DimensiJurang, type Jurang, type KiraanLMS } from "@/lib/spm/analitik";
import { cn } from "@/lib/utils";
import { GPS_BACA, kelasGps, namaPendek, warnaSekolah, type PropTab } from "./kongsi";

const WARNA_KUMPULAN: Warna[] = ["blue", "violet", "amber"];
const pendekSubjek = (s: string) => ({ "Bahasa Melayu": "BM", "Bahasa Inggeris": "BI" })[s] ?? s;
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

/* ── Analisis Jurang ── */
type PanelJurang = DimensiJurang | "lms" | "ringkasan";
export function TabJurang({ d }: PropTab) {
  const [panel, setPanel] = useState<PanelJurang>("ses");
  const tab: { id: PanelJurang; label: string }[] = [...(Object.keys(DIMENSI) as DimensiJurang[]).map((id) => ({ id, label: DIMENSI[id].label })), { id: "lms", label: "LMS" }, { id: "ringkasan", label: "Ringkasan" }];
  return (
    <div className="space-y-5">
      <TajukBahagian tajuk="Analisis jurang pencapaian" sub="GPS mengikut latar murid di seluruh daerah. Setiap murid dikira sekali (purata GPS semua subjeknya)." kanan={<TabPil tab={tab} aktif={panel} pilih={setPanel} label="Dimensi jurang" />} />
      {panel === "lms" ? <PanelLMS d={d} /> : panel === "ringkasan" ? <PanelRingkasan d={d} /> : <PanelDimensi j={d.jurang[panel]} dim={panel} />}
    </div>
  );
}

function PanelDimensi({ j, dim }: { j: Jurang | null; dim: DimensiJurang }) {
  if (!j) return <Callout variant="neutral" tajuk="Data belum mencukupi" ikon={<Info className="size-4" aria-hidden />}>Sekurang-kurangnya dua kumpulan {DIMENSI[dim].tajuk.toLowerCase()} dengan markah diperlukan untuk analisis ini.</Callout>;
  const teruk = j.magnitud >= 1 ? "error" : j.magnitud >= 0.5 ? "warning" : "success";
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <KadCarta
          tajuk={`GPS mengikut ${DIMENSI[dim].tajuk.toLowerCase()}`}
          sub="Markah terkini · lebih rendah lebih baik"
          apa={`Purata GPS murid bagi setiap kumpulan ${DIMENSI[dim].tajuk.toLowerCase()} di seluruh daerah.`}
          baca={`${GPS_BACA} Beza ketinggian antara bar ialah jurang pencapaian. Jurang yang besar bermakna kumpulan dengan bar tertinggi memerlukan sokongan tambahan.`}
          carta={(h) => (
            <BarChart
              data={j.kumpulan.map((k, i) => ({ kumpulan: k.label, GPS: k.gps, bil: k.bil, i }))}
              index="kumpulan"
              categories={["GPS"]}
              warnaBaris={(b) => WARNA_KUMPULAN[(b.i as number) % WARNA_KUMPULAN.length]}
              fmt={(v) => v.toFixed(2)}
              nota={(b) => `${b.bil} murid`}
              labelNilai
              className={h}
            />
          )}
        />
        <div className="space-y-3">
          <Callout variant={teruk} tajuk={`Jurang GPS ${j.magnitud.toFixed(2)}`}>
            Kumpulan <b>{j.terlemah}</b> ketinggalan {j.magnitud.toFixed(2)} mata GPS berbanding kumpulan <b>{j.terbaik}</b>.
            {j.magnitud >= 1 ? " Jurang ini besar dan wajar diutamakan dalam program intervensi." : j.magnitud >= 0.5 ? " Jurang sederhana; pantau supaya tidak melebar." : " Jurang kecil."}
          </Callout>
          <dl className="grid gap-3">
            {j.kumpulan.map((k) => (
              <Metrik
                key={k.label}
                label={`${k.label} · ${k.bil} murid`}
                nilai={k.gps.toFixed(2)}
                tona={tahapGps(k.gps)}
                lencana={<BadgeDeltaGps delta={k.gpsAR1 != null ? k.gps - k.gpsAR1 : null} akhiran=" sejak AR1" />}
                nota={`${k.lulusPct}% lulus semua subjek`}
              />
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

function PanelRingkasan({ d }: { d: PropTab["d"] }) {
  const senarai = (Object.keys(DIMENSI) as DimensiJurang[]).map((dim) => d.jurang[dim]).filter((j): j is Jurang => j !== null).sort((a, b) => b.magnitud - a.magnitud);
  if (!senarai.length) return <Callout variant="neutral" tajuk="Data belum mencukupi" />;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <KadCarta
        tajuk="Magnitud jurang mengikut dimensi"
        sub="Beza GPS antara kumpulan terbaik dan terlemah"
        apa="Saiz jurang pencapaian bagi setiap dimensi latar murid: SES, lokasi, jantina dan penginapan."
        baca="Bar yang paling panjang ialah dimensi dengan ketidaksamaan terbesar di daerah, dan patut menjadi keutamaan program intervensi. Merah: 1.00 mata GPS atau lebih; kuning: 0.50 hingga 0.99."
        carta={(h) => (
          <BarChart
            data={senarai.map((j) => ({ dimensi: DIMENSI[j.dim].label, "Jurang GPS": j.magnitud, ket: `${j.terlemah} berbanding ${j.terbaik}` }))}
            index="dimensi"
            categories={["Jurang GPS"]}
            layout="horizontal"
            warnaBaris={(b) => ((b["Jurang GPS"] as number) >= 1 ? "rose" : (b["Jurang GPS"] as number) >= 0.5 ? "amber" : "emerald")}
            fmt={(v) => v.toFixed(2)}
            nota={(b) => String(b.ket)}
            labelNilai
            lebarLabel={90}
            className={h}
          />
        )}
      />
      <Card className="p-0 sm:p-0">
        <TableRoot>
          <Table>
            <thead>
              <tr><Th>Dimensi</Th><Th>Terbaik</Th><Th>Terlemah</Th><Th className="text-right">Jurang</Th></tr>
            </thead>
            <tbody>
              {senarai.map((j) => (
                <tr key={j.dim}>
                  <Td className="font-medium text-gray-900">{DIMENSI[j.dim].label}</Td>
                  <Td>{j.terbaik}</Td>
                  <Td>{j.terlemah}</Td>
                  <Td className="text-right"><Badge variant={j.magnitud >= 1 ? "error" : j.magnitud >= 0.5 ? "warning" : "success"}>{j.magnitud.toFixed(2)}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableRoot>
      </Card>
    </div>
  );
}

function PanelLMS({ d }: { d: PropTab["d"] }) {
  const { jumlah: j } = d.lms;
  const baris = (k: KiraanLMS) => ({ nama: namaPendek(k.label), Layak: k.layak, "Tidak layak": k.tidak, "Belum lengkap": k.belum });
  return (
    <div className="space-y-4">
      <Callout variant="default" tajuk="Layak Menerima Sijil (LMS)" ikon={<Info className="size-4" aria-hidden />}>
        Murid layak menerima sijil SPM jika lulus <b>Bahasa Melayu</b> dan <b>Sejarah</b>. Kiraan ini berdasarkan markah terkini setiap murid; murid yang markah BM atau Sejarahnya belum diisi dikira &quot;belum lengkap&quot;.
      </Callout>
      <dl className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Metrik label="Layak LMS" nilai={j.layak} tona="baik" nota={`${pct(j.layak, j.jumlah)}% murid daerah`} />
        <Metrik label="Tidak layak" nilai={j.tidak} tona={j.tidak ? "lemah" : null} nota={`${pct(j.tidak, j.jumlah)}% · gagal BM atau Sejarah`} />
        <Metrik label="Belum lengkap" nilai={j.belum} tona={j.belum ? "sederhana" : null} nota="Markah BM atau Sejarah belum diisi" />
        <Metrik label="Jumlah murid" nilai={j.jumlah} />
      </dl>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <KadCarta
          tajuk="Status LMS mengikut sekolah"
          sub="Bilangan murid"
          apa="Bilangan murid setiap sekolah yang layak, tidak layak dan belum lengkap datanya untuk syarat LMS."
          baca="Bahagian merah ialah murid yang gagal Bahasa Melayu atau Sejarah dan berisiko tidak menerima sijil. Sekolah dengan bahagian merah yang panjang perlu diutamakan untuk intervensi BM dan Sejarah."
          legenda={[{ nama: "Layak", warna: "emerald" }, { nama: "Tidak layak", warna: "rose" }, { nama: "Belum lengkap", warna: "slate" }]}
          carta={(h) => <BarChart data={d.lms.ikutSekolah.map(baris)} index="nama" categories={["Layak", "Tidak layak", "Belum lengkap"]} colors={["emerald", "rose", "slate"]} layout="horizontal" stacked lebarLabel={96} className={h} />}
        />
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-gray-900">Punca tidak layak</h3>
            <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
              {[["Gagal BM sahaja", d.lms.gagalBM], ["Gagal Sejarah sahaja", d.lms.gagalSejarah], ["Gagal kedua-dua", d.lms.gagalKeduanya]].map(([l, v]) => (
                <div key={l} className="rounded-md bg-gray-50 px-2 py-3">
                  <dd className="text-2xl font-semibold text-gray-900 tabular-nums">{v}</dd>
                  <dt className="mt-0.5 text-xs text-gray-500">{l}</dt>
                </div>
              ))}
            </dl>
          </Card>
          <Card className="p-0 sm:p-0">
            <TableRoot>
              <Table>
                <thead>
                  <tr><Th>Penginapan</Th><Th className="text-right">Layak</Th><Th className="text-right">Tidak layak</Th><Th className="text-right">Belum</Th></tr>
                </thead>
                <tbody>
                  {d.lms.ikutPenginapan.map((k) => (
                    <tr key={k.label}>
                      <Td className="font-medium text-gray-900">{k.label} <span className="font-normal text-gray-500">({k.jumlah})</span></Td>
                      <Td className="text-right tabular-nums">{k.layak} <span className="text-xs text-gray-500">({pct(k.layak, k.jumlah)}%)</span></Td>
                      <Td className="text-right tabular-nums">{k.tidak} <span className="text-xs text-gray-500">({pct(k.tidak, k.jumlah)}%)</span></Td>
                      <Td className="text-right tabular-nums">{k.belum}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableRoot>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Penanda Aras ── */
export function TabBench({ d }: PropTab) {
  const top = d.sekolah.slice(0, 3);
  const gpsDaerah = Object.fromEntries(d.gpsSubjek.map((s) => [s.subjek, s.gps]));
  const radar = d.subjek.map((sub) => ({
    subjek: pendekSubjek(sub),
    ...Object.fromEntries(top.map((s) => [namaPendek(s.nama), s.panitia.find((p) => p.subjek === sub)?.gps ?? null])),
    "Purata daerah": gpsDaerah[sub] ?? null,
  }));
  const nilai = radar.flatMap((r) => Object.values(r).filter((v): v is number => typeof v === "number"));
  const domain: [number, number] = nilai.length ? [Math.max(1, Math.floor(Math.min(...nilai)) - 1), Math.ceil(Math.max(...nilai))] : [1, 10];
  const siri = [...top.map((s) => namaPendek(s.nama)), "Purata daerah"];
  const warna: Warna[] = [...top.map((s) => warnaSekolah(d, s.kod)), "slate"];

  const ikutAR1 = [...d.sekolah].filter((s) => s.gpsUjian.ar1 != null).sort((a, b) => a.gpsUjian.ar1! - b.gpsUjian.ar1!);
  const naik = d.sekolah.filter((s) => s.gps != null && s.gpsUjian.ar1 != null).map((s) => ({ s, beza: s.gpsUjian.ar1! - s.gps! })).sort((a, b) => b.beza - a.beza)[0];
  const panitiaTerbaik = naik?.s.panitia.filter((p) => p.gps != null && p.gpsAR1 != null).map((p) => ({ p, beza: p.gpsAR1! - p.gps! })).sort((a, b) => b.beza - a.beza)[0];

  return (
    <div className="space-y-5">
      <TajukBahagian tajuk="Penanda aras sekolah" sub="Perbandingan prestasi antara sekolah dalam daerah" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <KadCarta
          tajuk="Profil GPS subjek"
          sub={`${top.length} sekolah terbaik berbanding purata daerah`}
          apa="GPS setiap subjek bagi sekolah-sekolah terbaik daerah, dibandingkan dengan purata daerah."
          baca={`${GPS_BACA} Dalam carta radar ini, titik yang lebih DEKAT dengan pusat bermaksud GPS lebih rendah, iaitu lebih baik. Bentuk yang lebih kecil daripada garis putus-putus (purata daerah) menunjukkan sekolah mengatasi purata.`}
          legenda={siri.map((nama, i) => ({ nama, warna: warna[i], putus: nama === "Purata daerah" }))}
          carta={(h) => <RadarChart data={radar} index="subjek" categories={siri} colors={warna} putus={["Purata daerah"]} fmt={(v) => v.toFixed(2)} domain={domain} className={h === "h-64" ? "h-80" : h} />}
        />
        <div className="space-y-4">
          {naik && naik.beza > 0 && (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900"><Award className="size-4" aria-hidden /> Amalan terbaik</div>
              <div className="mt-2 text-lg font-semibold text-gray-900">{naik.s.nama}</div>
              <p className="mt-1 text-sm text-gray-600">
                Peningkatan GPS paling ketara sejak AR1: <b className="text-emerald-700">{naik.beza.toFixed(2)} mata</b> ({fmtGps(naik.s.gpsUjian.ar1)} → {fmtGps(naik.s.gps)}).
                {panitiaTerbaik && panitiaTerbaik.beza > 0 && <> Panitia paling meningkat: <b>{panitiaTerbaik.p.subjek}</b> ({panitiaTerbaik.beza.toFixed(2)} mata).</>}
              </p>
              <p className="mt-2 text-xs text-gray-500">Cadangan: jemput sekolah ini berkongsi amalan dengan sekolah lain dalam mesyuarat kurikulum daerah.</p>
            </Card>
          )}
          <Card className="p-0 sm:p-0">
            <div className="px-5 pt-4 text-sm font-semibold text-gray-900">Perubahan kedudukan sejak AR1</div>
            <TableRoot className="mt-2">
              <Table>
                <thead>
                  <tr><Th className="w-12 text-center">Kini</Th><Th>Sekolah</Th><Th className="text-right">GPS</Th><Th>Kedudukan</Th></tr>
                </thead>
                <tbody>
                  {d.sekolah.map((s, i) => {
                    const dulu = ikutAR1.findIndex((x) => x.kod === s.kod);
                    const beza = dulu < 0 ? 0 : dulu - i;
                    return (
                      <tr key={s.kod}>
                        <Td className="text-center font-semibold text-gray-900 tabular-nums">{i + 1}</Td>
                        <Td className="font-medium text-gray-900">{namaPendek(s.nama)}</Td>
                        <Td className={cn("text-right font-semibold tabular-nums", kelasGps(s.gps))}>{fmtGps(s.gps)}</Td>
                        <Td>{beza > 0 ? <Badge variant="success">▲ naik {beza}</Badge> : beza < 0 ? <Badge variant="error">▼ turun {-beza}</Badge> : <Badge variant="neutral">Kekal</Badge>}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableRoot>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Analisis Subjek ── */
const selHaba = (g: number | null) => (g == null ? "bg-gray-50 text-gray-400" : g <= 4.0 ? "bg-emerald-100 text-emerald-900" : g <= 5.5 ? "bg-blue-100 text-blue-900" : g <= 7.0 ? "bg-amber-100 text-amber-900" : "bg-red-200 text-red-900");

export function TabSubjek({ d }: PropTab) {
  const semuaPanitia = d.sekolah.flatMap((s) => s.panitia.filter((p) => p.gps != null).map((p) => ({ sekolah: s.nama, subjek: p.subjek, guru: p.guru, gps: p.gps! })));
  const kritikal = semuaPanitia.filter((p) => p.gps > 7).sort((a, b) => b.gps - a.gps);
  const tertinggi = [...semuaPanitia].sort((a, b) => b.gps - a.gps).slice(0, 3);
  const gpsDaerah = Object.fromEntries(d.gpsSubjek.map((s) => [s.subjek, s.gps]));
  return (
    <div className="space-y-5">
      <TajukBahagian tajuk="Analisis subjek merentas sekolah" sub="GPMP (Gred Purata Mata Pelajaran) setiap subjek bagi setiap sekolah" />
      <Card className="p-0 sm:p-0">
        <TableRoot>
          <Table className="border-b-0">
            <thead>
              <tr>
                <Th>Subjek</Th>
                {d.sekolah.map((s) => <Th key={s.kod} className="text-center">{namaPendek(s.nama)}</Th>)}
                <Th className="text-center">Daerah</Th>
              </tr>
            </thead>
            <tbody>
              {d.subjek.map((sub) => (
                <tr key={sub}>
                  <Td className="font-medium text-gray-900">{sub}</Td>
                  {d.sekolah.map((s) => {
                    const g = s.panitia.find((p) => p.subjek === sub)?.gps ?? null;
                    return <Td key={s.kod} className="p-1.5 text-center"><span className={cn("block rounded-md px-2 py-2 font-semibold tabular-nums", selHaba(g))}>{fmtGps(g)}</span></Td>;
                  })}
                  <Td className="p-1.5 text-center"><span className="block rounded-md px-2 py-2 font-semibold text-gray-900 tabular-nums ring-1 ring-gray-200 ring-inset">{fmtGps(gpsDaerah[sub])}</span></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableRoot>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-200 px-5 py-3 text-xs text-gray-600">
          {[["bg-emerald-100", "4.00 atau kurang"], ["bg-blue-100", "4.01 – 5.50"], ["bg-amber-100", "5.51 – 7.00"], ["bg-red-200", "melebihi 7.00 (kritikal)"]].map(([w, l]) => (
            <li key={l} className="flex items-center gap-1.5"><span className={cn("size-3 rounded-xs", w)} aria-hidden />{l}</li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <KadCarta
          tajuk="Purata GPS setiap subjek"
          sub="Seluruh daerah · disusun daripada yang paling lemah"
          apa="Purata GPS seluruh daerah bagi setiap subjek, dengan garis putus-putus sebagai GPS keseluruhan daerah."
          baca={`${GPS_BACA} Bar merah ialah subjek yang GPS-nya melebihi purata daerah, iaitu subjek yang paling memerlukan sokongan.`}
          carta={(h) => (
            <BarChart
              data={d.gpsSubjek.map((s) => ({ subjek: pendekSubjek(s.subjek), GPS: s.gps, bil: s.bil }))}
              index="subjek"
              categories={["GPS"]}
              warnaBaris={(b) => (d.gps != null && (b.GPS as number) > d.gps ? "rose" : "blue")}
              rujukan={d.gps != null ? { nilai: d.gps, label: `Daerah ${d.gps.toFixed(2)}` } : undefined}
              fmt={(v) => v.toFixed(2)}
              nota={(b) => `${b.bil} markah`}
              labelNilai
              className={h}
            />
          )}
        />
        <Card>
          <h3 className="text-sm font-semibold text-gray-900">Panitia perlu sokongan</h3>
          <p className="mt-0.5 text-sm text-gray-500">GPMP melebihi 7.00 (ambang kritikal)</p>
          <div className="mt-4 space-y-2.5">
            {kritikal.length === 0 && <Callout variant="success" tajuk="Tiada panitia melepasi ambang kritikal" ikon={<CheckCircle2 className="size-4" aria-hidden />} />}
            {kritikal.map((p) => (
              <Callout key={p.sekolah + p.subjek} variant="error" tajuk={`${p.subjek} · ${p.sekolah}`} ikon={<Flag className="size-4" aria-hidden />}>GPMP {p.gps.toFixed(2)} · {p.guru}</Callout>
            ))}
            {kritikal.length === 0 && (
              <div>
                <div className="mt-4 mb-2 text-xs font-medium text-gray-500">GPMP tertinggi untuk dipantau</div>
                <ul className="divide-y divide-gray-100 text-sm">
                  {tertinggi.map((p) => (
                    <li key={p.sekolah + p.subjek} className="flex items-center justify-between gap-3 py-2">
                      <span className="min-w-0"><span className="font-medium text-gray-900">{p.subjek}</span> <span className="text-gray-500">· {namaPendek(p.sekolah)}</span></span>
                      <span className={cn("font-semibold tabular-nums", kelasGps(p.gps))}>{p.gps.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
