"use client";

// Rekod GPS SPM tahun-tahun lepas (diisi pentadbir daripada rekod rasmi sekolah) dan penetapan sasaran GPS.
import { Pencil, Plus, Target, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { KadCarta, LineChart } from "@/components/tremor/charts";
import { Badge, Button, Card, Input, Label, Modal, Select, Table, TableRoot, TajukBahagian, Td, Th } from "@/components/tremor/ui";
import { fmtGps } from "@/lib/spm/analitik";
import { bacaGpsSejarah, bacaSasaranGps, cadanganSasaran, purataPenambahbaikan, simpanGpsSejarah, simpanSasaranGps, type RekodGps } from "@/lib/spm/pentadbir";
import { cn } from "@/lib/utils";
import { GPS_BACA, julatGps } from "../kongsi";
import type { PropTabSekolah } from "./kongsi";

interface BarisBorang {
  kunci: number;
  tahun: string;
  gps: string;
  bil: string;
  lulus: "0" | "1";
  cem: string;
}
let pembilang = 0;
const barisBaharu = (r?: RekodGps): BarisBorang => ({ kunci: ++pembilang, tahun: r ? String(r.tahun) : "", gps: r ? String(r.gps) : "", bil: r?.bilPelajar != null ? String(r.bilPelajar) : "", lulus: r?.lulus100 ? "1" : "0", cem: r?.subjekCemerlang != null ? String(r.subjekCemerlang) : "" });

export function BahagianGps({ k, pengguna, segar, makluman, versi }: PropTabSekolah) {
  const org = pengguna.org;
  const sejarah = useMemo(() => {
    void versi;
    return bacaGpsSejarah(org);
  }, [org, versi]);
  const cadangan = cadanganSasaran(sejarah);
  const tambahBaik = purataPenambahbaikan(sejarah);
  const akhir = sejarah.length ? sejarah[sejarah.length - 1] : null;

  const [borang, setBorang] = useState<BarisBorang[] | null>(null); // null = dialog tertutup
  const [ralat, setRalat] = useState("");
  const [padam, setPadam] = useState<number | null>(null);
  const [sasaran, setSasaran] = useState(() => (bacaSasaranGps(org) ?? cadanganSasaran(bacaGpsSejarah(org)))?.toFixed(2) ?? "");

  const tulis = (data: RekodGps[], mesej: string) => {
    if (!simpanGpsSejarah(org, data)) return makluman("Rekod tidak dapat disimpan pada pelayar ini");
    segar();
    makluman(mesej);
  };

  const simpanBorang = (e: FormEvent) => {
    e.preventDefault();
    if (!borang) return;
    const data: RekodGps[] = [];
    for (const b of borang) {
      const tahun = parseInt(b.tahun, 10);
      const gps = parseFloat(b.gps);
      if (!tahun || tahun < 2000 || tahun > 2100 || Number.isNaN(gps)) return setRalat("Isi Tahun dan GPS bagi setiap baris.");
      if (gps < 1 || gps > 10) return setRalat(`GPS bagi tahun ${tahun} mesti antara 1.00 dan 10.00.`);
      if (data.some((r) => r.tahun === tahun)) return setRalat(`Tahun ${tahun} dimasukkan lebih daripada sekali.`);
      data.push({ tahun, gps, lulus100: b.lulus === "1", subjekCemerlang: parseInt(b.cem, 10) || null, bilPelajar: parseInt(b.bil, 10) || null });
    }
    setBorang(null);
    setRalat("");
    tulis(data, "Rekod GPS tahun lepas disimpan");
  };
  const ubahBaris = (kunci: number, medan: Partial<BarisBorang>) => setBorang((bb) => bb && bb.map((b) => (b.kunci === kunci ? { ...b, ...medan } : b)));

  const v = parseFloat(sasaran);
  const sah = !Number.isNaN(v) && v >= 1 && v <= 10;
  const simpanSasaran = (e: FormEvent) => {
    e.preventDefault();
    if (!sah) return;
    if (!simpanSasaranGps(org, v)) return makluman("Sasaran tidak dapat disimpan pada pelayar ini");
    setSasaran(v.toFixed(2));
    segar();
    makluman(`Sasaran GPS SPM ${k.tahun} ditetapkan kepada ${v.toFixed(2)}`);
  };

  return (
    <section className="space-y-4" aria-label="Rekod GPS dan penetapan sasaran">
      <TajukBahagian
        tajuk={`Rekod GPS dan penetapan sasaran ${k.tahun}`}
        sub="GPS SPM sebenar tahun-tahun lepas diisi oleh pentadbir daripada rekod rasmi sekolah; sasaran dicadangkan berdasarkan trend rekod tersebut"
        kanan={<Button onClick={() => { setRalat(""); setBorang(sejarah.length ? sejarah.map(barisBaharu) : [barisBaharu()]); }}><Pencil className="size-4" aria-hidden /> Isi / kemas kini GPS</Button>}
      />

      {sejarah.length === 0 ? (
        <Card className="border-dashed py-8 text-center">
          <h3 className="text-sm font-semibold text-gray-900">Belum ada rekod GPS tahun lepas</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">Masukkan GPS SPM sebenar sekolah daripada rekod rasmi atau buku laporan sekolah untuk melihat trend tahunan dan mendapat cadangan sasaran.</p>
          <Button variant="secondary" className="mt-4" onClick={() => { setRalat(""); setBorang([barisBaharu()]); }}><Plus className="size-4" aria-hidden /> Isi GPS tahun lepas</Button>
        </Card>
      ) : (
        <div className={cn("grid gap-4", sejarah.length >= 2 && "lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]")}>
          <Card className="p-0 sm:p-0">
            <TableRoot>
              <Table className="border-b-0">
                <thead>
                  <tr><Th>Tahun</Th><Th className="text-right">GPS sebenar</Th><Th>Perubahan prestasi</Th><Th className="text-center">Lulus 100%</Th><Th className="text-right">Subjek cemerlang</Th><Th className="text-right">Bil. pelajar</Th><Th><span className="sr-only">Tindakan</span></Th></tr>
                </thead>
                <tbody>
                  {sejarah.map((r, i) => {
                    const delta = i ? sejarah[i - 1].gps - r.gps : null; // positif = GPS turun = lebih baik
                    return (
                      <tr key={r.tahun} className={cn(r === akhir && "bg-blue-50/50")}>
                        <Td className="font-medium whitespace-nowrap text-gray-900">{r.tahun}{r === akhir && <Badge className="ml-2">Terkini</Badge>}</Td>
                        <Td className={cn("text-right text-base font-semibold tabular-nums", r.gps <= 5 ? "text-emerald-700" : r.gps <= 5.5 ? "text-amber-700" : "text-gray-900")}>{r.gps.toFixed(2)}</Td>
                        <Td className="whitespace-nowrap">{delta == null ? <span className="text-gray-400">—</span> : Math.abs(delta) < 0.005 ? <Badge variant="neutral">Tiada perubahan</Badge> : delta > 0 ? <Badge variant="success">↑ Baik (−{delta.toFixed(2)})</Badge> : <Badge variant="error">↓ Lemah (+{(-delta).toFixed(2)})</Badge>}</Td>
                        <Td className="text-center">{r.lulus100 ? <Badge variant="success">Ya</Badge> : <Badge variant="neutral">Tidak</Badge>}</Td>
                        <Td className="text-right tabular-nums">{r.subjekCemerlang ?? "—"}</Td>
                        <Td className="text-right tabular-nums">{r.bilPelajar ?? "—"}</Td>
                        <Td className="text-right whitespace-nowrap">
                          {padam === r.tahun ? (
                            <span className="inline-flex gap-1.5">
                              <Button variant="danger" className="px-2 py-1" onClick={() => { setPadam(null); tulis(sejarah.filter((x) => x.tahun !== r.tahun), `Rekod GPS ${r.tahun} dipadam`); }}>Ya, padam</Button>
                              <Button variant="ghost" className="px-2 py-1 shadow-none" onClick={() => setPadam(null)}>Batal</Button>
                            </span>
                          ) : (
                            <Button variant="ghost" className="px-2 py-1 text-gray-500 shadow-none" onClick={() => setPadam(r.tahun)} aria-label={`Padam rekod GPS tahun ${r.tahun}`}><Trash2 className="size-4" aria-hidden /></Button>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableRoot>
          </Card>
          {sejarah.length >= 2 && (
            <KadCarta
              tajuk="GPS SPM tahun-tahun lepas"
              sub="Rekod yang diisi pentadbir · lebih rendah lebih baik"
              apa="GPS SPM sebenar sekolah bagi setiap tahun yang direkodkan oleh pentadbir."
              baca={`${GPS_BACA} Garis yang menurun dari kiri ke kanan menunjukkan sekolah bertambah baik dari tahun ke tahun.`}
              carta={(t) => <LineChart data={sejarah.map((r) => ({ tahun: String(r.tahun), "GPS sebenar": r.gps }))} index="tahun" categories={["GPS sebenar"]} colors={["navy"]} fmt={(x) => x.toFixed(2)} domain={julatGps(sejarah.map((r) => r.gps))} className={t === "h-64" ? "h-52" : t} />}
            />
          )}
        </div>
      )}

      <Card className="border-blue-200 bg-blue-50/40">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#13406e]"><Target className="size-4" aria-hidden /> Sasaran GPS SPM {k.tahun}</h3>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            [akhir ? `GPS sebenar ${akhir.tahun}` : "GPS sebenar tahun lepas", akhir ? akhir.gps.toFixed(2) : "—", akhir ? "Rekod terkini yang diisi" : "Belum diisi"],
            ["GPS semasa (markah guru)", fmtGps(k.d.gps), "Berdasarkan markah terkini tahun ini"],
            ["Cadangan berdasarkan trend", cadangan != null ? cadangan.toFixed(2) : "—", cadangan != null ? "GPS terkini tolak purata penambahbaikan tahunan" : "Perlukan rekod GPS tahun lepas"],
          ].map(([label, nilai, nota]) => (
            <div key={label} className="rounded-md bg-white px-4 py-3 ring-1 ring-gray-200 ring-inset">
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="mt-0.5 text-2xl font-semibold text-gray-900 tabular-nums">{nilai}</dd>
              <div className="mt-0.5 text-xs text-gray-500">{nota}</div>
            </div>
          ))}
        </dl>
        <form onSubmit={simpanSasaran} className="mt-4 flex flex-wrap items-end gap-3" noValidate>
          <div className="w-32">
            <Label htmlFor="gps-sasaran">Sasaran GPS sekolah</Label>
            <Input id="gps-sasaran" type="number" inputMode="decimal" min="1" max="10" step="0.01" value={sasaran} onChange={(e) => setSasaran(e.target.value)} aria-describedby="gps-sasaran-huraian" className="text-center text-base font-semibold" />
          </div>
          <Button type="submit" disabled={!sah}>Simpan sasaran</Button>
          {cadangan != null && <Button variant="secondary" onClick={() => setSasaran(cadangan.toFixed(2))}>Guna cadangan</Button>}
        </form>
        <div id="gps-sasaran-huraian" className="mt-3 space-y-1 text-sm leading-relaxed text-gray-700" aria-live="polite">
          {!sah ? (
            <p className="text-gray-500">Masukkan sasaran GPS antara 1.00 dan 10.00. GPS lebih rendah bermaksud pencapaian lebih baik.</p>
          ) : (
            <>
              {akhir ? (
                akhir.gps - v > 0.004 ? (
                  <p>
                    Sasaran GPS <b>{v.toFixed(2)}</b> bermaksud sekolah perlu menambah baik sebanyak <b>{(akhir.gps - v).toFixed(2)} mata GPS</b> berbanding {akhir.tahun}.{" "}
                    {tambahBaik == null
                      ? "Tambah rekod tahun lain untuk menilai sasaran ini berbanding trend."
                      : tambahBaik <= 0
                        ? `Rekod ${sejarah.length} tahun tidak menunjukkan penambahbaikan purata, jadi sasaran ini memerlukan program intervensi yang tersusun.`
                        : `Purata penambahbaikan dalam rekod ialah ${tambahBaik.toFixed(2)} mata setahun; sasaran ini ${akhir.gps - v > tambahBaik * 1.5 ? "agak agresif dan memerlukan program intervensi intensif" : "realistik berdasarkan trend"}.`}
                  </p>
                ) : v - akhir.gps > 0.004 ? (
                  <p>Sasaran GPS <b>{v.toFixed(2)}</b> lebih lemah daripada pencapaian {akhir.tahun} ({akhir.gps.toFixed(2)}). Pertimbangkan semula sasaran ini.</p>
                ) : (
                  <p>Sasaran sama dengan pencapaian {akhir.tahun} ({akhir.gps.toFixed(2)}). Tiada penambahbaikan disasarkan.</p>
                )
              ) : (
                <p className="text-gray-500">Tiada rekod GPS tahun lepas untuk dibandingkan.</p>
              )}
              {k.d.gps != null && (
                <p>
                  GPS semasa berdasarkan markah guru ialah <b>{k.d.gps.toFixed(2)}</b>:{" "}
                  {k.d.gps <= v ? "sudah berada pada atau lebih baik daripada sasaran." : `perlu turun ${(k.d.gps - v).toFixed(2)} mata lagi untuk mencapai sasaran.`}
                </p>
              )}
            </>
          )}
        </div>
      </Card>

      <Modal buka={borang !== null} tutup={() => setBorang(null)} tajuk="Rekod GPS SPM tahun lepas" sub="Isi GPS sebenar daripada rekod rasmi sekolah. Tahun dan GPS wajib diisi." lebar="max-w-3xl">
        {borang && (
          <form onSubmit={simpanBorang} noValidate className="space-y-3">
            {borang.map((b, i) => (
              <fieldset key={b.kunci} className="grid grid-cols-2 items-end gap-2 rounded-md border border-gray-200 p-3 sm:grid-cols-[5.5rem_5.5rem_6.5rem_6rem_7rem_auto]">
                <legend className="sr-only">Rekod {i + 1}</legend>
                <div><Label htmlFor={`gs-t-${b.kunci}`} className="text-xs">Tahun</Label><Input id={`gs-t-${b.kunci}`} type="number" inputMode="numeric" min="2000" max="2100" value={b.tahun} onChange={(e) => ubahBaris(b.kunci, { tahun: e.target.value })} /></div>
                <div><Label htmlFor={`gs-g-${b.kunci}`} className="text-xs">GPS</Label><Input id={`gs-g-${b.kunci}`} type="number" inputMode="decimal" min="1" max="10" step="0.01" value={b.gps} onChange={(e) => ubahBaris(b.kunci, { gps: e.target.value })} /></div>
                <div><Label htmlFor={`gs-b-${b.kunci}`} className="text-xs">Bil. pelajar</Label><Input id={`gs-b-${b.kunci}`} type="number" inputMode="numeric" min="1" max="9999" value={b.bil} onChange={(e) => ubahBaris(b.kunci, { bil: e.target.value })} /></div>
                <div><Label htmlFor={`gs-l-${b.kunci}`} className="text-xs">Lulus 100%</Label><Select id={`gs-l-${b.kunci}`} value={b.lulus} onChange={(e) => ubahBaris(b.kunci, { lulus: e.target.value === "1" ? "1" : "0" })}><option value="0">Tidak</option><option value="1">Ya</option></Select></div>
                <div><Label htmlFor={`gs-c-${b.kunci}`} className="text-xs">Subjek cemerlang</Label><Input id={`gs-c-${b.kunci}`} type="number" inputMode="numeric" min="0" max="30" value={b.cem} onChange={(e) => ubahBaris(b.kunci, { cem: e.target.value })} /></div>
                <Button variant="danger" className="px-2.5" onClick={() => setBorang((bb) => bb && bb.filter((x) => x.kunci !== b.kunci))} aria-label={`Buang rekod ${i + 1}${b.tahun ? ` (tahun ${b.tahun})` : ""}`}><Trash2 className="size-4" aria-hidden /></Button>
              </fieldset>
            ))}
            {borang.length === 0 && <p className="rounded-md bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">Tiada baris. Menyimpan sekarang akan mengosongkan semua rekod.</p>}
            <Button variant="secondary" onClick={() => setBorang((bb) => bb && [...bb, barisBaharu()])}><Plus className="size-4" aria-hidden /> Tambah tahun</Button>
            {ralat && <p role="alert" className="text-sm text-red-700">{ralat}</p>}
            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-4">
              <Button variant="ghost" className="shadow-none" onClick={() => setBorang(null)}>Batal</Button>
              <Button type="submit">Simpan rekod</Button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}
