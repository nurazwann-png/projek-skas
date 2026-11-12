"use client";

import { AlertTriangle, CheckCircle2, Target } from "lucide-react";
import { useId } from "react";
import { BarChart, KadCarta, LineChart } from "@/components/tremor/charts";
import { Badge, Callout, Card, CategoryBar, Label, Metrik, Modal, Select, Table, TableRoot, TajukBahagian, Td, Th } from "@/components/tremor/ui";
import type { Kelas, Marks } from "@/lib/portal/stor";
import { LULUS_MIN, UJIAN, fmtGps, tahapGps } from "@/lib/spm/analitik";
import { AMBANG_PERHATIAN, analisisKelas, cadanganIndividu, fmtMarkah, infoUjian, inisial, labelKelas, namaJantina, num, type AnalisisKelas, type AnalisisSasaran } from "@/lib/spm/guru";
import { WARNA_KATEGORI } from "../kongsi";
import { Kosong, LencanaGred, SenaraiCadangan, type PropTabGuru } from "./kongsi";

const FASA = [
  { label: "Belum ada data", sub: "Isi markah AR1 untuk mula analisis", varian: "neutral" },
  { label: "Fasa 1 · Selepas AR1", sub: "AR2 dan Percubaan SPM belum diisi", varian: "default" },
  { label: "Fasa 2 · Selepas AR2", sub: "Percubaan SPM belum diisi", varian: "warning" },
  { label: "Fasa 3 · Selepas Percubaan", sub: "Analisis berdasarkan Percubaan SPM", varian: "success" },
] as const;

const f1 = (v: number | null) => (v == null ? "—" : v.toFixed(1));

export function TabAnalisis({ kelas, marks, kelasAktif, pilihKelas, bukaPelajar, bukaRekod }: PropTabGuru & { kelasAktif: Kelas | null; pilihKelas: (id: string) => void }) {
  const id = useId();
  if (kelas.length === 0) return <Kosong tajuk="Tiada kelas untuk dianalisis">Daftar kelas dahulu melalui tab Kelas Saya.</Kosong>;
  const k = kelasAktif ?? kelas[0];
  return (
    <div className="space-y-5">
      <TajukBahagian tajuk="Analisis Kelas" sub="Prestasi murid, sasaran dan cadangan tindakan — dikira daripada markah yang anda isi" />
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 flex-1 sm:max-w-sm">
            <Label htmlFor={id}>Kelas</Label>
            <Select id={id} value={k.id} onChange={(e) => pilihKelas(e.target.value)}>
              {kelas.map((x) => <option key={x.id} value={x.id}>{labelKelas(x)}{x.tahun ? ` (${x.tahun})` : ""}</option>)}
            </Select>
          </div>
          <span className="text-sm text-gray-500">{k.pelajar.length} murid{k.tahun ? ` · ${k.tahun}` : ""}</span>
        </div>
      </Card>
      {k.pelajar.length === 0 ? <Kosong tajuk="Tiada murid dalam kelas ini">Tambah murid melalui tab Kelas Saya.</Kosong> : <Badan k={k} marks={marks} bukaPelajar={bukaPelajar} bukaRekod={() => bukaRekod(k.id)} />}
    </div>
  );
}

function Badan({ k, marks, bukaPelajar, bukaRekod }: { k: Kelas; marks: Marks; bukaPelajar: (id: string) => void; bukaRekod: () => void }) {
  const a = analisisKelas(k, marks);
  const fasa = FASA[a.fasa];
  const terkini = a.ujianTerkini ? infoUjian(a.ujianTerkini).label : "";
  const adaUjian = UJIAN.filter((u) => a.bil[u.key] > 0);

  return (
    <div className="space-y-5">
      <p className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
        <Badge variant={fasa.varian}>{fasa.label}</Badge>
        {fasa.sub}
      </p>

      {a.fasa === 0 || !a.ujianTerkini ? (
        <Kosong tajuk="Belum ada data markah" tindakan={<button type="button" onClick={bukaRekod} className="text-sm font-medium text-[#13406e] hover:underline focus-visible:outline-2 focus-visible:outline-[#c8962a]">Buka Rekod Markah</button>}>
          Isi markah AR1 melalui tab Rekod Markah untuk mula melihat analisis.
        </Kosong>
      ) : (
        <>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {UJIAN.map((u) => (
              <Metrik key={u.key} label={`GPMP kelas (${u.label})`} nilai={fmtGps(a.gpmp[u.key])} tona={tahapGps(a.gpmp[u.key])} nota={a.bil[u.key] ? `Purata markah ${f1(a.purata[u.key])} · ${a.bil[u.key]} murid` : "Belum diisi"} />
            ))}
            <Metrik
              label="Murid perlu perhatian"
              nilai={a.perhatian.length}
              tona={a.perhatian.length ? "lemah" : "baik"}
              nota={a.fasa === 1 ? `AR1 di bawah ${AMBANG_PERHATIAN} markah` : `Merosot lebih 5 markah dari AR1 ke ${terkini}`}
            />
            <Metrik label={`Lulus (${terkini})`} nilai={`${a.lulusPct}%`} tona={a.lulusPct >= 90 ? "baik" : a.lulusPct >= 70 ? "sederhana" : "lemah"} nota={`${a.lulus}/${a.nilaiTerkini.length} murid mendapat ${LULUS_MIN} markah ke atas`} />
            {a.trend && (
              <Metrik
                label={`Trend purata (${a.trend.label})`}
                nilai={`${a.trend.delta >= 0 ? "+" : "−"}${Math.abs(a.trend.delta).toFixed(1)}`}
                tona={a.trend.delta >= 0 ? "baik" : "lemah"}
                nota={`Purata markah ${a.trend.delta >= 0 ? "naik" : "turun"} ${Math.abs(a.trend.delta).toFixed(1)} markah`}
              />
            )}
          </dl>
          <p className="-mt-2 text-xs text-gray-500">GPMP (Gred Purata Mata Pelajaran) ialah purata mata gred murid, berskala 1.00 hingga 10.00; nilai lebih rendah lebih baik.</p>

          <Lms k={k} a={a} terkini={terkini} />

          <div className="grid gap-4 lg:grid-cols-2">
            {adaUjian.length >= 2 && (
              <KadCarta
                tajuk="Trend markah purata kelas"
                sub="Ujian yang telah diisi"
                apa={`Purata markah kelas ${labelKelas(k)} bagi setiap ujian yang telah diisi.`}
                baca="Paksi menegak ialah markah (0 hingga 100). Garis yang MENAIK menunjukkan purata kelas bertambah baik dari satu ujian ke ujian berikutnya."
                carta={(h) => <LineChart data={adaUjian.map((u) => ({ ujian: u.label, "Purata markah": +a.purata[u.key]!.toFixed(1) }))} index="ujian" categories={["Purata markah"]} colors={["blue"]} fmt={(v) => v.toFixed(1)} domain={[0, 100]} className={h} />}
              />
            )}
            <KadCarta
              tajuk={`Taburan gred — ${terkini}`}
              sub="Bilangan murid bagi setiap gred"
              apa={`Bilangan murid bagi setiap gred SPM (A+ hingga G) berdasarkan markah ${terkini}.`}
              baca="Bar hijau ialah gred Cemerlang (A+, A, A-), biru Kepujian (B+ hingga C), kuning Lulus (D, E) dan merah Gagal (G). Taburan yang condong ke kiri menunjukkan pencapaian lebih baik."
              carta={(h) => <BarChart data={a.taburanGred.map((g) => ({ gred: g.gred, "Bil. murid": g.bil, kategori: g.kategori }))} index="gred" categories={["Bil. murid"]} warnaBaris={(b) => WARNA_KATEGORI[b.kategori as keyof typeof WARNA_KATEGORI]} labelNilai className={h} />}
              kaki={<CategoryBar data={a.taburanKategori.map((x) => ({ label: `${x.kategori} (${x.bil})`, nilai: x.bil, warna: WARNA_KATEGORI[x.kategori] }))} />}
            />
          </div>

          {a.sasaran && <KadSasaran s={a.sasaran} bukaPelajar={bukaPelajar} bukaRekod={bukaRekod} />}

          {a.ses.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-900">Prestasi mengikut SES ({terkini})</h3>
              <p className="mt-0.5 text-sm text-gray-500">Purata markah mengikut kumpulan sosioekonomi</p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                {a.ses.map((s) => (
                  <div key={s.label} className="rounded-md bg-gray-50 p-4 text-center">
                    <dt className="text-xs font-medium text-gray-500">{s.label} ({s.bil} murid)</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900 tabular-nums">{s.purata.toFixed(1)}</dd>
                    <dd className="text-xs text-gray-500">GPMP {s.gpmp.toFixed(2)}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          <Card>
            <h3 className="text-sm font-semibold text-gray-900">Cadangan dan intervensi — {labelKelas(k)}</h3>
            <p className="mt-0.5 mb-4 text-sm text-gray-500">Dijana secara automatik daripada markah kelas berdasarkan peraturan tetap</p>
            <SenaraiCadangan cadangan={a.cadangan} />
          </Card>

          {a.perhatian.length > 0 && (
            <section className="space-y-3">
              <TajukBahagian tajuk="Murid perlu perhatian" sub={`${a.fasa === 1 ? `AR1 di bawah ${AMBANG_PERHATIAN} markah` : `Merosot lebih 5 markah dari AR1 ke ${terkini}`} · klik nama untuk cadangan individu`} />
              <Card className="p-0 sm:p-0">
                <TableRoot>
                  <Table className="min-w-[520px]">
                    <thead>
                      <tr>
                        <Th>Nama murid</Th>
                        {adaUjian.map((u) => <Th key={u.key} className="text-center">{u.label}</Th>)}
                        <Th className="text-center">{a.fasa === 1 ? "Status" : `AR1 → ${terkini}`}</Th>
                        <Th>Profil</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.perhatian.map(({ p, m, delta }) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <Td><NamaButang nama={p.nama} klik={() => bukaPelajar(p.id)} /></Td>
                          {adaUjian.map((u) => <Td key={u.key} className="text-center tabular-nums">{fmtMarkah(m[u.key])}</Td>)}
                          <Td className="text-center font-medium text-red-700 tabular-nums">{delta == null ? `Bawah ${AMBANG_PERHATIAN}` : `Turun ${Math.abs(delta)} markah`}</Td>
                          <Td><span className="flex flex-wrap gap-1">{[p.ses, p.lokasi].filter(Boolean).map((x) => <Badge key={x} variant="neutral">{x}</Badge>)}</span></Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableRoot>
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function NamaButang({ nama, klik }: { nama: string; klik: () => void }) {
  return <button type="button" onClick={klik} className="text-left font-medium text-[#13406e] hover:underline focus-visible:outline-2 focus-visible:outline-[#c8962a]">{nama}</button>;
}

function Lms({ k, a, terkini }: { k: Kelas; a: AnalisisKelas; terkini: string }) {
  if (!a.wajibLulus) {
    return <Callout variant="neutral" tajuk="Layak Menerima Sijil (LMS)">{k.subjek} bukan subjek wajib lulus. Subjek wajib lulus untuk sijil SPM ialah Bahasa Melayu dan Sejarah.</Callout>;
  }
  return (
    <Callout variant={a.gagal ? "error" : "success"} tajuk={`Layak Menerima Sijil (LMS) — ${k.subjek} ialah subjek wajib lulus`} ikon={a.gagal ? <AlertTriangle className="size-4" aria-hidden /> : <CheckCircle2 className="size-4" aria-hidden />}>
      {a.gagal
        ? `${a.gagal} daripada ${a.nilaiTerkini.length} murid mendapat di bawah ${LULUS_MIN} markah dalam ${terkini} (${a.lulus} lulus). Murid yang gagal subjek wajib lulus tidak layak menerima sijil SPM; beri tumpuan segera.`
        : `Semua ${a.nilaiTerkini.length} murid yang ada markah ${terkini} lulus subjek ini (${LULUS_MIN} markah ke atas).`}
    </Callout>
  );
}

/* ── Sasaran SPM berbanding ujian terkini ── */
function KadSasaran({ s, bukaPelajar, bukaRekod }: { s: AnalisisSasaran; bukaPelajar: (id: string) => void; bukaRekod: () => void }) {
  const u = infoUjian(s.ujian).label;
  const adaSasaran = s.capai.length + s.bawah.length + s.tiadaMarkah.length;
  const petak: [string, number, string, string][] = [
    ["Mencapai sasaran", s.capai.length, "text-emerald-700", `Markah ${u} sama atau melebihi sasaran`],
    ["Di bawah sasaran", s.bawah.length, s.bawah.length ? "text-red-700" : "text-gray-900", `Markah ${u} kurang daripada sasaran`],
    ["Tiada sasaran", s.tiadaSasaran.length, "text-gray-900", "Sasaran belum ditetapkan; tidak dikira"],
    [`Tiada markah ${u}`, s.tiadaMarkah.length, "text-gray-900", "Ada sasaran, tetapi markah belum diisi atau TH"],
  ];
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Target className="mt-0.5 size-4 shrink-0 text-[#b7791f]" aria-hidden />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Sasaran SPM berbanding {u}</h3>
            <p className="mt-0.5 text-sm text-gray-500">Markah {u} (ujian terkini yang diisi) dibandingkan dengan sasaran yang anda tetapkan bagi setiap murid</p>
          </div>
        </div>
        <button type="button" onClick={bukaRekod} className="text-sm font-medium text-[#13406e] hover:underline focus-visible:outline-2 focus-visible:outline-[#c8962a]">Tetapkan sasaran</button>
      </div>

      {adaSasaran === 0 ? (
        <p className="mt-4 rounded-md bg-gray-50 p-4 text-sm text-gray-600">Belum ada sasaran ditetapkan untuk kelas ini. Isi lajur &quot;Sasaran SPM&quot; dalam tab Rekod Markah.</p>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {petak.map(([label, n, warna, nota]) => (
              <div key={label} className="rounded-md bg-gray-50 p-3">
                <dt className="text-xs font-medium text-gray-500">{label}</dt>
                <dd className={`mt-0.5 text-2xl font-semibold tabular-nums ${warna}`}>{n}</dd>
                <dd className="text-xs text-gray-500">{nota}</dd>
              </div>
            ))}
          </dl>
          {s.bawah.length > 0 ? (
            <TableRoot className="mt-4 rounded-md border border-gray-200">
              <Table className="min-w-[440px] border-b-0">
                <caption className="sr-only">Murid di bawah sasaran, jurang terbesar dahulu</caption>
                <thead>
                  <tr><Th>Murid di bawah sasaran</Th><Th className="text-right">Markah {u}</Th><Th className="text-right">Sasaran</Th><Th className="text-right">Jurang</Th></tr>
                </thead>
                <tbody>
                  {s.bawah.map((r) => (
                    <tr key={r.p.id} className="hover:bg-gray-50">
                      <Td><NamaButang nama={r.p.nama} klik={() => bukaPelajar(r.p.id)} /></Td>
                      <Td className="text-right tabular-nums">{r.markah}</Td>
                      <Td className="text-right tabular-nums">{r.sasaran}</Td>
                      <Td className="text-right font-semibold text-red-700 tabular-nums">−{r.jurang}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableRoot>
          ) : (
            s.capai.length > 0 && <p className="mt-4 text-sm text-emerald-700">Semua murid yang ada sasaran dan markah {u} telah mencapai sasaran masing-masing.</p>
          )}
        </>
      )}
    </Card>
  );
}

/* ── Modal murid individu ── */
export function ModalPelajar({ pelajarId, kelas, marks, tutup }: { pelajarId: string | null; kelas: Kelas[]; marks: Marks; tutup: () => void }) {
  const k = pelajarId ? kelas.find((x) => x.pelajar.some((p) => p.id === pelajarId)) : undefined;
  const p = k?.pelajar.find((x) => x.id === pelajarId);
  if (!k || !p) return null;
  const m = marks[p.id] || {};
  const titik = UJIAN.map((u) => ({ ujian: u.label, Markah: num(m[u.key]) ? m[u.key] : null, ...(num(m.sasaran) ? { Sasaran: m.sasaran } : {}) }));
  const bilMarkah = UJIAN.filter((u) => num(m[u.key])).length;
  const meta = [labelKelas(k), namaJantina(p.jantina), p.ses, p.lokasi, p.penginapan].filter(Boolean).join(" · ");
  return (
    <Modal
      buka
      tutup={tutup}
      tajuk={
        <span className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#13406e]/10 text-sm font-semibold text-[#13406e]" aria-hidden>{inisial(p.nama)}</span>
          {p.nama}
        </span>
      }
      sub={meta}
      lebar="max-w-2xl"
    >
      <div className="space-y-5">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {UJIAN.map((u) => {
            const v = m[u.key];
            return (
              <div key={u.key} className="rounded-md bg-gray-50 p-3 text-center">
                <dt className="text-xs font-medium text-gray-500">{u.label}</dt>
                <dd className={`mt-0.5 text-2xl font-semibold tabular-nums ${num(v) ? (v < LULUS_MIN ? "text-red-700" : "text-gray-900") : "text-gray-400"}`}>{fmtMarkah(v)}</dd>
                <dd className="mt-1 flex min-h-6 justify-center">{num(v) ? <LencanaGred markah={v} /> : v === null ? <span className="text-xs text-gray-500">Tidak hadir</span> : <span className="text-xs text-gray-500">Belum diisi</span>}</dd>
              </div>
            );
          })}
          <div className="rounded-md bg-amber-50 p-3 text-center ring-1 ring-amber-600/20 ring-inset">
            <dt className="text-xs font-medium text-amber-800">Sasaran SPM</dt>
            <dd className={`mt-0.5 text-2xl font-semibold tabular-nums ${num(m.sasaran) ? "text-gray-900" : "text-gray-400"}`}>{num(m.sasaran) ? m.sasaran : "—"}</dd>
            <dd className="mt-1 flex min-h-6 justify-center">{num(m.sasaran) ? <LencanaGred markah={m.sasaran} /> : <span className="text-xs text-gray-500">Belum ditetapkan</span>}</dd>
          </div>
        </dl>

        {bilMarkah >= 2 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Trend markah</h3>
            <p className="text-xs text-gray-500">{num(m.sasaran) ? "Garis putus-putus ialah sasaran SPM murid. " : ""}Paksi menegak ialah markah (0 hingga 100).</p>
            <LineChart data={titik} index="ujian" categories={num(m.sasaran) ? ["Markah", "Sasaran"] : ["Markah"]} colors={["blue", "amber"]} putus={["Sasaran"]} domain={[0, 100]} className="mt-2 h-52" />
          </div>
        )}

        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Cadangan dan intervensi</h3>
          <SenaraiCadangan cadangan={cadanganIndividu(p, m)} />
        </div>
      </div>
    </Modal>
  );
}

