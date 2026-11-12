"use client";

import { AlertTriangle, BellRing, CheckCircle2, ChevronRight, CircleAlert } from "lucide-react";
import { useState } from "react";
import { BarChart, KadCarta, LineChart, Spark } from "@/components/tremor/charts";
import { Badge, BadgeDeltaGps, BarList, Button, Callout, Card, CategoryBar, Metrik, Modal, ProgressBar, Table, TableRoot, TajukBahagian, Td, Th, type Warna } from "@/components/tremor/ui";
import { DIMENSI, UJIAN, fmtGps, tahapGps, type AnalisisSekolah, type DimensiJurang } from "@/lib/spm/analitik";
import { GPS_BACA, LencanaStatus, WARNA_KATEGORI, julatGps, kelasGps, namaPendek, tarikhMs, warnaGps, warnaSekolah, type PropTab } from "./kongsi";

const WARNA_KOMPOSISI: Warna[] = ["blue", "violet", "amber"];

/* ── Analitik Daerah ── */
export function TabDaerah({ d, data, amaran }: PropTab) {
  const pe = d.peperiksaan;
  const baki = -data.hari(pe.tarikhAkhir);
  const risikoPct = d.bilMurid ? Math.round((d.berisiko / d.bilMurid) * 100) : 0;
  const delta = d.gps != null && d.gpsUjian.ar1 != null ? d.gps - d.gpsUjian.ar1 : null;
  const trend = UJIAN.map((u) => ({ ujian: u.label, Daerah: d.gpsUjian[u.key], ...Object.fromEntries(d.sekolah.map((s) => [namaPendek(s.nama), s.gpsUjian[u.key]])) }));
  const siri = ["Daerah", ...d.sekolah.map((s) => namaPendek(s.nama))];
  const warnaSiri: Warna[] = ["navy", ...d.sekolah.map((s) => warnaSekolah(d, s.kod))];

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metrik label="GPS Daerah (markah terkini)" nilai={fmtGps(d.gps)} tona={tahapGps(d.gps)} lencana={<BadgeDeltaGps delta={delta} akhiran=" sejak AR1" />} nota={`${d.sekolah.length} sekolah · ${d.bilMurid} murid`} />
        <Metrik label="Murid lulus semua subjek" nilai={`${d.lulusPct}%`} nota="Markah terkini 40 ke atas bagi setiap subjek" />
        <Metrik label="Murid berisiko" nilai={d.berisiko} tona={risikoPct >= 30 ? "lemah" : risikoPct >= 18 ? "sederhana" : null} lencana={<Badge variant={risikoPct >= 30 ? "error" : risikoPct >= 18 ? "warning" : "neutral"}>{risikoPct}% murid</Badge>} nota="Purata di bawah 45, atau merosot lebih 5 markah sejak AR1" />
        <Metrik
          label={`Pengisian ${pe.label}`}
          nilai={`${d.isiPct}%`}
          tona={d.isiPct >= 100 ? "baik" : d.isiPct < 70 ? "sederhana" : null}
          nota={baki >= 0 ? `Tarikh akhir ${tarikhMs(pe.tarikhAkhir)} · ${baki} hari lagi` : `Tarikh akhir ${tarikhMs(pe.tarikhAkhir)} telah berlalu`}
        />
      </dl>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <KadCarta
          tajuk="Trend GPS mengikut ujian"
          sub="AR1 → AR2 → Percubaan · lebih rendah lebih baik"
          apa="Perubahan GPS daerah dan setiap sekolah merentas tiga ujian tahun ini, dikira daripada markah yang diisi oleh guru."
          baca={`${GPS_BACA} Garis yang MENURUN menunjukkan prestasi bertambah baik. Bandingkan garis sekolah dengan garis Daerah (biru gelap) untuk melihat sekolah yang ketinggalan.`}
          legenda={siri.map((nama, i) => ({ nama, warna: warnaSiri[i] }))}
          carta={(h) => <LineChart data={trend} index="ujian" categories={siri} colors={warnaSiri} fmt={(v) => v.toFixed(2)} domain={julatGps([d.gpsUjian, ...d.sekolah.map((s) => s.gpsUjian)].flatMap((g) => Object.values(g)))} className={h} />}
          kaki={d.isiPct < 100 ? `GPS Percubaan dikira daripada markah yang telah diisi setakat ini (${d.isiPct}% lengkap), jadi ia masih boleh berubah.` : undefined}
        />

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-900">Amaran awal</h3>
            <Badge variant={amaran.length ? (amaran.some((a) => a.tahap === "merah") ? "error" : "warning") : "success"}>{amaran.length ? `${amaran.length} amaran` : "Tiada amaran"}</Badge>
          </div>
          <div className="mt-4 space-y-2.5">
            {amaran.length === 0 && <Callout variant="success" tajuk="Semua sekolah terkawal" ikon={<CheckCircle2 className="size-4" aria-hidden />}>Tiada sekolah melepasi ambang risiko atau ketinggalan pengisian markah.</Callout>}
            {amaran.map((a, i) => (
              <Callout key={i} variant={a.tahap === "merah" ? "error" : "warning"} tajuk={`${a.sekolah}: ${a.tajuk}`} ikon={a.tahap === "merah" ? <CircleAlert className="size-4" aria-hidden /> : <AlertTriangle className="size-4" aria-hidden />}>
                {a.butiran}
              </Callout>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <KadCarta
          tajuk="Taburan gred daerah"
          sub="Semua subjek · markah terkini setiap murid"
          apa="Bilangan markah bagi setiap gred SPM (A+ hingga G) di seluruh daerah, berdasarkan markah terkini setiap murid dalam setiap subjek."
          baca="Bar hijau ialah gred Cemerlang (A+, A, A-), biru Kepujian (B+ hingga C), kuning Lulus (D, E) dan merah Gagal (G). Taburan yang condong ke kiri menunjukkan pencapaian yang lebih baik."
          carta={(h) => <BarChart data={d.taburanGred.map((g) => ({ gred: g.gred, "Bil. markah": g.bil, kategori: g.kategori }))} index="gred" categories={["Bil. markah"]} warnaBaris={(b) => WARNA_KATEGORI[b.kategori as keyof typeof WARNA_KATEGORI]} labelNilai className={h} />}
          kaki={<CategoryBar data={d.taburanKategori.map((k) => ({ label: k.kategori, nilai: k.bil, warna: WARNA_KATEGORI[k.kategori] }))} />}
        />

        <Card>
          <h3 className="text-sm font-semibold text-gray-900">Status sekolah</h3>
          <p className="mt-0.5 text-sm text-gray-500">Risiko murid dan kemajuan pengisian markah</p>
          <ul className="mt-4 divide-y divide-gray-100">
            {d.sekolah.map((s) => (
              <li key={s.kod} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium text-gray-900">{s.nama}</span>
                  <LencanaStatus s={s} />
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                  <span>GPS <b className={kelasGps(s.gps)}>{fmtGps(s.gps)}</b></span>
                  <span>{s.risikoPct}% berisiko</span>
                  <span>{s.bilMurid} murid</span>
                </div>
                <ProgressBar nilai={s.isiPct} tona={s.isiPct >= 100 ? "emerald" : s.isiPct < 70 ? "amber" : "blue"} label={`${s.isiPct}%`} className="mt-2" />
              </li>
            ))}
            {d.tiadaData.map((s) => (
              <li key={s.kod} className="flex items-center justify-between gap-3 py-3 last:pb-0">
                <span className="truncate text-sm text-gray-500">{s.nama}</span>
                <Badge variant="neutral">Tiada kelas berdaftar</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ── Kedudukan Sekolah ── */
export function TabKedudukan({ d }: PropTab) {
  const [pilih, setPilih] = useState<string | null>(null);
  const sekolah = d.sekolah.find((s) => s.kod === pilih) ?? null;
  return (
    <div className="space-y-4">
      <TajukBahagian tajuk="Kedudukan sekolah" sub="Disusun mengikut GPS terbaik (paling rendah) berdasarkan markah terkini. Klik nama sekolah untuk analisis penuh." />
      <Card className="p-0 sm:p-0">
        <TableRoot>
          <Table>
            <thead>
              <tr>
                <Th className="w-14 text-center">No.</Th>
                <Th>Sekolah</Th>
                <Th className="text-right">GPS terkini</Th>
                <Th className="text-right">GPS AR1</Th>
                <Th>Perubahan sejak AR1</Th>
                <Th>Trend</Th>
                <Th className="text-right">Lulus semua subjek</Th>
                <Th className="text-right">Murid</Th>
                <Th className="min-w-40">Pengisian {d.peperiksaan.label.replace(/\s*\d{4}$/, "")}</Th>
              </tr>
            </thead>
            <tbody>
              {d.sekolah.map((s, i) => {
                const delta = s.gps != null && s.gpsUjian.ar1 != null ? s.gps - s.gpsUjian.ar1 : null;
                return (
                  <tr key={s.kod} className="hover:bg-gray-50">
                    <Td className="text-center font-semibold text-gray-900 tabular-nums">{i + 1}</Td>
                    <Td>
                      <button type="button" onClick={() => setPilih(s.kod)} className="group flex items-center gap-1 text-left font-medium text-[#13406e] hover:underline focus-visible:outline-2 focus-visible:outline-[#c8962a]">
                        {s.nama}
                        <ChevronRight className="size-4 text-gray-400 transition group-hover:translate-x-0.5" aria-hidden />
                      </button>
                      <div className="text-xs text-gray-500">{s.kod} · {s.lokasi}</div>
                    </Td>
                    <Td className={`text-right text-base font-semibold tabular-nums ${kelasGps(s.gps)}`}>{fmtGps(s.gps)}</Td>
                    <Td className="text-right tabular-nums">{fmtGps(s.gpsUjian.ar1)}</Td>
                    <Td><BadgeDeltaGps delta={delta} /></Td>
                    <Td><Spark nilai={UJIAN.map((u) => s.gpsUjian[u.key])} warna={delta == null ? "gray" : delta <= 0 ? "emerald" : "rose"} label={`Trend GPS ${s.nama}: ${UJIAN.map((u) => `${u.label} ${fmtGps(s.gpsUjian[u.key])}`).join(", ")}`} /></Td>
                    <Td className="text-right tabular-nums">{s.lulusPct}%</Td>
                    <Td className="text-right tabular-nums">{s.bilMurid}</Td>
                    <Td><ProgressBar nilai={s.isiPct} tona={s.isiPct >= 100 ? "emerald" : s.isiPct < 70 ? "amber" : "blue"} label={`${s.isiPct}%`} /></Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableRoot>
      </Card>
      <p className="text-xs text-gray-500">Garis trend naik bermaksud GPS bertambah baik (menurun) dari AR1 ke ujian terkini. {GPS_BACA}</p>
      <DialogSekolah s={sekolah} d={d} tutup={() => setPilih(null)} />
    </div>
  );
}

function DialogSekolah({ s, d, tutup }: { s: AnalisisSekolah | null; d: PropTab["d"]; tutup: () => void }) {
  if (!s) return null;
  const trend = UJIAN.map((u) => ({ ujian: u.label, [namaPendek(s.nama)]: s.gpsUjian[u.key], Daerah: d.gpsUjian[u.key] }));
  const panitia = [...s.panitia].filter((p) => p.gps != null).sort((a, b) => b.gps! - a.gps!);
  return (
    <Modal buka tutup={tutup} tajuk={s.nama} sub={`${s.kod} · ${s.lokasi} · ${s.zon} · ${s.bilMurid} murid`} lebar="max-w-4xl">
      <div className="space-y-5">
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metrik label="GPS terkini" nilai={fmtGps(s.gps)} tona={tahapGps(s.gps)} nota={`Daerah ${fmtGps(d.gps)}`} />
          <Metrik label="Lulus semua subjek" nilai={`${s.lulusPct}%`} nota={`Daerah ${d.lulusPct}%`} />
          <Metrik label="Murid berisiko" nilai={s.berisiko} tona={s.risikoPct >= 30 ? "lemah" : s.risikoPct >= 18 ? "sederhana" : null} nota={`${s.risikoPct}% daripada murid`} />
          <Metrik label="Unjuran GPS SPM" nilai={fmtGps(s.ramal)} tona={tahapGps(s.ramal)} nota="Berdasarkan trend ujian" />
        </dl>

        <div className="grid gap-4 lg:grid-cols-2">
          <KadCarta
            tajuk="Trend GPS berbanding daerah"
            apa={`GPS ${s.nama} bagi setiap ujian berbanding purata daerah.`}
            baca={`${GPS_BACA} Jika garis sekolah berada di bawah garis Daerah (putus-putus), sekolah ini mengatasi purata daerah.`}
            legenda={[{ nama: namaPendek(s.nama), warna: "blue" }, { nama: "Daerah", warna: "slate", putus: true }]}
            carta={(h) => <LineChart data={trend} index="ujian" categories={[namaPendek(s.nama), "Daerah"]} colors={["blue", "slate"]} putus={["Daerah"]} fmt={(v) => v.toFixed(2)} domain={julatGps([...Object.values(s.gpsUjian), ...Object.values(d.gpsUjian)])} className={h === "h-64" ? "h-52" : h} />}
          />
          <Card>
            <h3 className="text-sm font-semibold text-gray-900">GPMP mengikut panitia</h3>
            <p className="mt-0.5 text-sm text-gray-500">Disusun daripada yang paling memerlukan perhatian</p>
            <div className="mt-4">
              <BarList data={panitia.map((p) => ({ nama: p.subjek, nota: p.guru, nilai: p.gps!, warna: warnaGps(p.gps) }))} fmt={(v) => v.toFixed(2)} />
            </div>
          </Card>
        </div>

        <Card>
          <h3 className="text-sm font-semibold text-gray-900">Profil murid</h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {(Object.keys(DIMENSI) as DimensiJurang[]).map((dim) => (
              <div key={dim}>
                <div className="mb-1.5 text-xs font-medium text-gray-500">{DIMENSI[dim].tajuk}</div>
                <CategoryBar data={s.komposisi[dim].map((k, i) => ({ label: k.label, nilai: k.bil, warna: WARNA_KOMPOSISI[i % WARNA_KOMPOSISI.length] }))} />
              </div>
            ))}
          </div>
        </Card>

        {s.kelasBelum.length > 0 && (
          <Callout variant="warning" tajuk={`${s.kelasBelum.length} daripada ${s.bilKelas} kelas belum lengkap mengisi ${d.peperiksaan.label}`} ikon={<AlertTriangle className="size-4" aria-hidden />}>
            {s.kelasBelum.map((k) => `${k.label} (${k.belum}/${k.jumlah} belum)`).join(" · ")}
          </Callout>
        )}
      </div>
    </Modal>
  );
}

/* ── Semak Sekolah (pengisian markah) ── */
export function TabSemak({ d, data, pengguna, segar, makluman }: PropTab) {
  const pe = d.peperiksaan;
  const lengkap = d.sekolah.filter((s) => s.isiPct >= 100).length;
  const hantar = (s: AnalisisSekolah) => {
    s.kelasBelum.forEach((k) => data.peringatan.hantar(k.id, { id: pengguna.id, nama: pengguna.nama }));
    segar();
    makluman(`Peringatan dihantar kepada guru ${s.kelasBelum.length} kelas di ${s.nama}`);
  };
  return (
    <div className="space-y-5">
      <TajukBahagian tajuk="Semak pengisian markah" sub={`${pe.label} · dibuka ${tarikhMs(pe.buka)} · tarikh akhir ${tarikhMs(pe.tarikhAkhir)}`} />
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Metrik label="Sekolah lengkap" nilai={lengkap} tona={lengkap === d.sekolah.length ? "baik" : null} nota={`daripada ${d.sekolah.length} sekolah`} />
        <Metrik label="Sekolah belum lengkap" nilai={d.sekolah.length - lengkap} tona={d.sekolah.length - lengkap ? "sederhana" : "baik"} nota="Masih ada kelas yang belum diisi" />
        <Metrik label="Pengisian daerah" nilai={`${d.isiPct}%`} nota="Markah diisi berbanding jumlah murid × subjek" />
      </dl>

      <div className="space-y-3">
        {[...d.sekolah].sort((a, b) => a.isiPct - b.isiPct).map((s) => (
          <Card key={s.kod} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">{s.nama}</div>
                <div className="text-xs text-gray-500">{s.bilKelas - s.kelasBelum.length} daripada {s.bilKelas} kelas lengkap · {s.bilMurid} murid</div>
              </div>
              <div className="flex items-center gap-2">
                {s.kelasBelum.length === 0 ? (
                  <Badge variant="success"><CheckCircle2 className="size-3.5" aria-hidden /> Data lengkap</Badge>
                ) : (
                  <Button variant="secondary" onClick={() => hantar(s)}><BellRing className="size-4" aria-hidden /> Hantar peringatan</Button>
                )}
              </div>
            </div>
            <ProgressBar nilai={s.isiPct} tona={s.isiPct >= 100 ? "emerald" : s.isiPct < 70 ? "amber" : "blue"} label={`${s.isiPct}%`} className="mt-3" />
            {s.kelasBelum.length > 0 && (
              <details className="group mt-3">
                <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-[#13406e] [&::-webkit-details-marker]:hidden">
                  <ChevronRight className="size-4 transition group-open:rotate-90" aria-hidden />
                  {s.kelasBelum.length} kelas belum lengkap
                </summary>
                <ul className="mt-2 divide-y divide-gray-100 rounded-md border border-gray-200">
                  {s.kelasBelum.map((k) => {
                    const ing = data.peringatan.untukKelas(k.id);
                    return (
                      <li key={k.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 text-sm">
                        <span className="min-w-0">
                          <span className="font-medium text-gray-900">{k.label}</span>
                          <span className="ml-2 text-xs text-gray-500">{k.guru}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          {ing && <span className="text-xs text-gray-500">Peringatan dihantar {tarikhMs(ing.t)}</span>}
                          <Badge variant="warning">{k.belum}/{k.jumlah} belum diisi</Badge>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </details>
            )}
          </Card>
        ))}
        {d.tiadaData.map((s) => (
          <Card key={s.kod} className="flex items-center justify-between gap-3 p-4 sm:p-5">
            <div className="text-sm font-medium text-gray-500">{s.nama}</div>
            <Badge variant="neutral">Tiada kelas berdaftar</Badge>
          </Card>
        ))}
      </div>
      <p className="text-xs text-gray-500">Peringatan muncul dalam &quot;Tugasan Saya&quot; guru berkenaan di papan pemuka portal.</p>
    </div>
  );
}
