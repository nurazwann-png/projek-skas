"use client";

import { ExternalLink, FileText, Info, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { BarChart, KadCarta } from "@/components/tremor/charts";
import { Badge, BadgeDeltaGps, Button, Callout, Card, Input, Label, Metrik, Select, Table, TableRoot, TajukBahagian, Td, Textarea, Th } from "@/components/tremor/ui";
import { JENIS_INTERVENSI, bacaIntervensi, fmtGps, gpsSemasaIntervensi, simpanIntervensi, tahapGps, type Intervensi } from "@/lib/spm/analitik";
import { cn } from "@/lib/utils";
import { GPS_BACA, kelasGps, namaPendek, tarikhMs, type PropTab } from "./kongsi";

// Tarikh tempatan (toISOString memberi tarikh UTC, iaitu semalam sebelum 8 pagi waktu Malaysia)
const hariIni = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};

/* ── Intervensi ── */
export function TabIntervensi({ d, makluman }: PropTab) {
  const [senarai, setSenarai] = useState<Intervensi[]>(bacaIntervensi);
  const [padam, setPadam] = useState<string | null>(null);
  const [ralat, setRalat] = useState("");
  const kemas = (baru: Intervensi[]) => {
    setSenarai(baru);
    simpanIntervensi(baru);
  };

  const hantar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = d.sekolah.find((x) => x.kod === f.get("sekolah"));
    const pj = String(f.get("pj") || "").trim();
    const sasaran = parseFloat(String(f.get("sasaran")));
    if (!s) return setRalat("Pilih sekolah.");
    if (!pj) return setRalat("Masukkan nama penanggungjawab.");
    if (Number.isNaN(sasaran) || sasaran < 1 || sasaran > 10) return setRalat("Sasaran GPS mesti antara 1.00 dan 10.00.");
    const subjek = String(f.get("subjek") || "");
    const baru: Intervensi = {
      id: "i" + Date.now().toString(36),
      kodSekolah: s.kod,
      sekolah: s.nama,
      subjek,
      jenis: String(f.get("jenis")),
      tarikh: String(f.get("tarikh") || hariIni()),
      pj: pj.toLocaleUpperCase("ms-MY"),
      sasaran,
      catatan: String(f.get("catatan") || "").trim(),
      gpsMula: subjek ? (s.panitia.find((p) => p.subjek === subjek)?.gps ?? null) : s.gps,
    };
    kemas([baru, ...senarai]);
    setRalat("");
    e.currentTarget.reset();
    makluman(`Intervensi direkodkan untuk ${s.nama}`);
  };

  const dgnStatus = senarai.map((i) => {
    const kini = gpsSemasaIntervensi(i, d);
    return { i, kini, capai: kini != null && kini <= i.sasaran };
  });
  const capai = dgnStatus.filter((x) => x.capai).length;

  return (
    <div className="space-y-5">
      <TajukBahagian tajuk="Tracker intervensi" sub="Rekod program intervensi dan pantau sama ada sasaran GPS tercapai" />
      <dl className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Metrik label="Jumlah intervensi" nilai={senarai.length} />
        <Metrik label="Sasaran dicapai" nilai={capai} tona={capai ? "baik" : null} />
        <Metrik label="Dalam proses" nilai={senarai.length - capai} tona={senarai.length - capai ? "sederhana" : null} />
        <Metrik label="Sekolah terlibat" nilai={new Set(senarai.map((i) => i.kodSekolah)).size} nota={`daripada ${d.sekolah.length} sekolah`} />
      </dl>

      <Card>
        <h3 className="text-sm font-semibold text-gray-900">Rekod intervensi baharu</h3>
        <form onSubmit={hantar} className="mt-4 space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="int-sekolah">Sekolah</Label>
              <Select id="int-sekolah" name="sekolah" defaultValue={d.sekolah[d.sekolah.length - 1]?.kod}>
                {d.sekolah.map((s) => <option key={s.kod} value={s.kod}>{s.nama} (GPS {fmtGps(s.gps)})</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="int-subjek">Subjek</Label>
              <Select id="int-subjek" name="subjek" defaultValue="">
                <option value="">Seluruh sekolah</option>
                {d.subjek.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="int-jenis">Jenis intervensi</Label>
              <Select id="int-jenis" name="jenis">
                {JENIS_INTERVENSI.map((j) => <option key={j}>{j}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="int-tarikh">Tarikh</Label>
              <Input id="int-tarikh" name="tarikh" type="date" defaultValue={hariIni()} />
            </div>
            <div>
              <Label htmlFor="int-pj">Penanggungjawab</Label>
              <Input id="int-pj" name="pj" placeholder="Nama guru atau pentadbir" autoComplete="off" />
            </div>
            <div>
              <Label htmlFor="int-sasaran">Sasaran GPS</Label>
              <Input id="int-sasaran" name="sasaran" type="number" step="0.01" min="1" max="10" placeholder="cth. 5.00" inputMode="decimal" />
            </div>
          </div>
          <div>
            <Label htmlFor="int-catatan">Catatan</Label>
            <Textarea id="int-catatan" name="catatan" rows={2} placeholder="Ringkasan program dan matlamat" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit"><Plus className="size-4" aria-hidden /> Rekod intervensi</Button>
            {ralat && <span role="alert" className="text-sm text-red-700">{ralat}</span>}
          </div>
        </form>
      </Card>

      <Card className="p-0 sm:p-0">
        {senarai.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">Belum ada intervensi direkodkan. Gunakan borang di atas untuk merekod yang pertama.</div>
        ) : (
          <TableRoot>
            <Table>
              <thead>
                <tr><Th>Tarikh</Th><Th>Sekolah</Th><Th>Skop</Th><Th>Jenis</Th><Th>Penanggungjawab</Th><Th className="text-right">GPS mula → kini</Th><Th className="text-right">Sasaran</Th><Th>Status</Th><Th><span className="sr-only">Tindakan</span></Th></tr>
              </thead>
              <tbody>
                {dgnStatus.map(({ i, kini, capai: ok }) => (
                  <tr key={i.id}>
                    <Td className="whitespace-nowrap">{tarikhMs(i.tarikh)}</Td>
                    <Td className="font-medium text-gray-900">{namaPendek(i.sekolah)}{i.catatan && <div className="max-w-56 truncate text-xs font-normal text-gray-500" title={i.catatan}>{i.catatan}</div>}</Td>
                    <Td>{i.subjek || "Seluruh sekolah"}</Td>
                    <Td><Badge>{i.jenis}</Badge></Td>
                    <Td>{i.pj}</Td>
                    <Td className="text-right whitespace-nowrap tabular-nums">{fmtGps(i.gpsMula)} → <b className={kelasGps(kini)}>{fmtGps(kini)}</b></Td>
                    <Td className="text-right font-semibold text-gray-900 tabular-nums">{i.sasaran.toFixed(2)}</Td>
                    <Td>{kini == null ? <Badge variant="neutral">Tiada data</Badge> : ok ? <Badge variant="success">Sasaran dicapai</Badge> : <Badge variant="warning">Dalam proses</Badge>}</Td>
                    <Td className="text-right whitespace-nowrap">
                      {padam === i.id ? (
                        <span className="inline-flex gap-1.5">
                          <Button variant="danger" className="px-2 py-1" onClick={() => { kemas(senarai.filter((x) => x.id !== i.id)); setPadam(null); makluman("Rekod intervensi dipadam"); }}>Ya, padam</Button>
                          <Button variant="ghost" className="px-2 py-1 shadow-none" onClick={() => setPadam(null)}>Batal</Button>
                        </span>
                      ) : (
                        <Button variant="ghost" className="px-2 py-1 text-gray-500 shadow-none" onClick={() => setPadam(i.id)} aria-label={`Padam intervensi ${i.jenis} ${i.sekolah}`}><Trash2 className="size-4" aria-hidden /></Button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableRoot>
        )}
      </Card>
      <p className="text-xs text-gray-500">Status dikira secara automatik: sasaran dicapai apabila GPS semasa (panitia subjek berkenaan, atau GPS sekolah) sama atau lebih rendah daripada sasaran.</p>
    </div>
  );
}

/* ── Ramalan GPS ── */
export function TabRamal({ d }: PropTab) {
  const beza = d.ramal != null && d.gps != null ? d.ramal - d.gps : null;
  const landasan = d.sekolah.filter((s) => s.ramal != null && s.gps != null && s.ramal <= s.gps).length;
  return (
    <div className="space-y-5">
      <TajukBahagian tajuk="Unjuran GPS SPM" sub="Berdasarkan trend AR1 → AR2 → Percubaan tahun ini. Ini anggaran untuk perancangan, bukan keputusan muktamad." />
      <dl className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Metrik label="GPS daerah terkini" nilai={fmtGps(d.gps)} tona={tahapGps(d.gps)} nota="Berdasarkan markah terkini" />
        <Metrik label="Unjuran GPS SPM daerah" nilai={fmtGps(d.ramal)} tona={tahapGps(d.ramal)} lencana={<BadgeDeltaGps delta={beza} />} />
        <Metrik label="Sekolah di landasan" nilai={landasan} tona={landasan === d.sekolah.length ? "baik" : null} nota={`daripada ${d.sekolah.length} sekolah · unjuran tidak merosot`} />
        <Metrik label="Perlu intervensi" nilai={d.sekolah.length - landasan} tona={d.sekolah.length - landasan ? "lemah" : "baik"} nota="Unjuran lebih lemah daripada GPS terkini" />
      </dl>

      <KadCarta
        tajuk="GPS terkini berbanding unjuran SPM"
        sub="Setiap sekolah · lebih rendah lebih baik"
        apa="GPS terkini setiap sekolah bersebelahan dengan unjuran GPS SPM jika trend tahun ini berterusan."
        baca={`${GPS_BACA} Jika bar unjuran (jingga) LEBIH RENDAH daripada bar terkini (biru), sekolah dijangka terus meningkat. Jika lebih tinggi, prestasi dijangka merosot dan sekolah memerlukan intervensi.`}
        legenda={[{ nama: "GPS terkini", warna: "blue" }, { nama: "Unjuran SPM", warna: "amber" }]}
        carta={(h) => <BarChart data={d.sekolah.map((s) => ({ nama: namaPendek(s.nama), "GPS terkini": s.gps, "Unjuran SPM": s.ramal }))} index="nama" categories={["GPS terkini", "Unjuran SPM"]} colors={["blue", "amber"]} fmt={(v) => v.toFixed(2)} labelNilai className={h} />}
      />

      <Card className="p-0 sm:p-0">
        <TableRoot>
          <Table>
            <thead>
              <tr><Th>Sekolah</Th><Th className="text-right">AR1</Th><Th className="text-right">AR2</Th><Th className="text-right">Percubaan</Th><Th className="text-right">Unjuran SPM</Th><Th>Jangkaan</Th><Th>Status</Th></tr>
            </thead>
            <tbody>
              {d.sekolah.map((s) => {
                const ok = s.ramal != null && s.gps != null && s.ramal <= s.gps;
                return (
                  <tr key={s.kod}>
                    <Td className="font-medium text-gray-900">{s.nama}</Td>
                    <Td className="text-right tabular-nums">{fmtGps(s.gpsUjian.ar1)}</Td>
                    <Td className="text-right tabular-nums">{fmtGps(s.gpsUjian.ar2)}</Td>
                    <Td className="text-right tabular-nums">{fmtGps(s.gpsUjian.percubaan)}</Td>
                    <Td className={cn("text-right text-base font-semibold tabular-nums", kelasGps(s.ramal))}>{fmtGps(s.ramal)}</Td>
                    <Td><BadgeDeltaGps delta={s.ramal != null && s.gps != null ? s.ramal - s.gps : null} /></Td>
                    <Td>{ok ? <Badge variant="success">Di landasan</Badge> : <Badge variant="error">Perlu intervensi</Badge>}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableRoot>
      </Card>
      <Callout variant="neutral" tajuk="Kaedah unjuran" ikon={<Info className="size-4" aria-hidden />}>
        Unjuran = GPS ujian terkini + 60% daripada purata perubahan GPS antara ujian (kesinambungan trend yang diredam).
        {d.isiPct < 100 && ` GPS Percubaan dikira daripada markah yang telah diisi (${d.isiPct}% lengkap), jadi unjuran akan berubah apabila pengisian lengkap.`}
      </Callout>
    </div>
  );
}

/* ── Laporan Daerah ── */
const KANDUNGAN = [
  ["A", "Ringkasan GPS daerah", "GPS, trend AR1 → Percubaan dan unjuran"],
  ["B", "Kedudukan sekolah", "Ranking semua sekolah mengikut GPS dengan trend"],
  ["C", "Analisis jurang", "SES, jantina dan lokasi dengan cadangan intervensi"],
  ["D", "Pelajar berisiko daerah", "Bilangan dan peratus mengikut sekolah"],
  ["E", "Analisis setiap sekolah", "GPS, panitia, trend dan profil murid"],
];
export function TabLaporan() {
  return (
    <div className="space-y-5">
      <TajukBahagian tajuk="Laporan daerah" sub="Laporan intensif PPD Dalat: analisis daerah dan semua sekolah dalam satu dokumen" />
      <Card className="mx-auto max-w-2xl">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#13406e]/10 text-[#13406e]"><FileText className="size-5" aria-hidden /></span>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Jana Laporan Intensif Daerah</h3>
            <p className="mt-0.5 text-sm text-gray-500">Penjana laporan masih menggunakan versi asal aplikasi dan akan dipindahkan ke paparan baharu ini pada fasa seterusnya.</p>
          </div>
        </div>
        <ul className="mt-5 space-y-2">
          {KANDUNGAN.map(([sek, tajuk, sub]) => (
            <li key={sek} className="flex items-start gap-3 rounded-md bg-gray-50 px-3 py-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded bg-[#13406e] text-xs font-bold text-white">{sek}</span>
              <span><span className="block text-sm font-medium text-gray-900">{tajuk}</span><span className="block text-xs text-gray-500">{sub}</span></span>
            </li>
          ))}
        </ul>
        <a href="/spm-analytics.html?tab=ppd-laporan" className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-[#13406e] px-4 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-[#0b2a4a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8962a]">
          Buka penjana laporan <ExternalLink className="size-4" aria-hidden />
        </a>
      </Card>
    </div>
  );
}
