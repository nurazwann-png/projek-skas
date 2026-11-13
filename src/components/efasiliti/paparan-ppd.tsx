"use client";

// Pengurusan Fasiliti Daerah (Admin PPD): peta aduan aktif, amaran awal, kelulusan bajet, semua aduan + eksport.
import { AlertTriangle, Check, CheckCircle2, CircleAlert, Eye } from "lucide-react";
import { useMemo } from "react";
import { Badge, Button, Callout, Card, Metrik, Table, TableRoot, Td, Th } from "@/components/tremor/ui";
import { aktif, fmtTarikh, titikPeta, type TitikPeta } from "@/lib/efasiliti/bantu";
import { STATUS, type PropPaparan } from "@/lib/efasiliti/jenis";
import { AliranKerja, BarEksport, Kosong, LencanaKeutamaan, LencanaStatus, Penapis, useTapis, zonTersedia } from "./kongsi";

export function PaparanPPD({ tiket, data, buka, laksana, cetak, makluman }: PropPaparan) {
  const tunggu = tiket.filter((t) => t.status === "Disemak PJ");
  const bilAktif = tiket.filter(aktif).length;
  const kritikal = tiket.filter((t) => t.keutamaan === "Kritikal" && aktif(t)).length;
  const selesai = tiket.filter((t) => t.status === "Selesai").length;
  const amaran = useMemo(() => {
    void tiket; // kira semula apabila tiket berubah
    return data.amaranEfasiliti();
  }, [data, tiket]);
  const titik = useMemo(() => titikPeta(data.sekolahList(), tiket), [data, tiket]);
  const { tapisan, setTapisan, ditapis, adaTapisan, keterangan } = useTapis(tiket);
  const merah = amaran.filter((a) => a.tahap === "merah").length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Pengurusan fasiliti daerah</h2>
        <p className="mt-0.5 max-w-[62ch] text-sm text-gray-500">Luluskan bajet bagi aduan yang telah disahkan Penolong Jurutera dan tandakan selesai apabila kerja pembaikan siap.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <PetaAduan titik={titik} />
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900">Amaran awal · aduan tertunggak</h3>
            {amaran.length > 0 && (
              <span className="flex gap-1.5">
                {merah > 0 && <Badge variant="error">{merah} kritikal</Badge>}
                {amaran.length - merah > 0 && <Badge variant="warning">{amaran.length - merah} perhatian</Badge>}
              </span>
            )}
          </div>
          <div className="mt-4 space-y-2.5">
            {amaran.length === 0 && <Callout variant="success" tajuk="Tiada aduan aktif melebihi 30 hari." ikon={<CheckCircle2 className="size-4" aria-hidden />} />}
            {amaran.map((a) => (
              <Callout key={a.tiket} variant={a.tahap === "merah" ? "error" : "warning"} tajuk={`${a.sekolah}: ${a.tajuk}`} ikon={a.tahap === "merah" ? <CircleAlert className="size-4" aria-hidden /> : <AlertTriangle className="size-4" aria-hidden />}>
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span>{a.butiran}</span>
                  <Button variant="secondary" onClick={() => buka(a.tiket)} className="px-2.5 py-1.5" aria-label={`Butiran ${a.tiket}`}><Eye className="size-4" aria-hidden /> Butiran</Button>
                </span>
              </Callout>
            ))}
          </div>
        </Card>
      </div>

      <AliranKerja aktif="ppd" />

      <dl className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Metrik label="Aduan aktif" nilai={bilAktif} nota="Belum selesai" />
        <Metrik label="Menunggu kelulusan" nilai={tunggu.length} tona={tunggu.length ? "sederhana" : null} nota="Disahkan PJ" />
        <Metrik label="Selesai" nilai={selesai} tona={selesai ? "baik" : null} nota="Kerja siap" />
        <Metrik label="Kritikal aktif" nilai={kritikal} tona={kritikal ? "lemah" : null} nota="Perlu perhatian segera" />
      </dl>

      <Card className="p-0 sm:p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3.5 sm:px-5">
          <h3 className="text-base font-semibold text-gray-900">Menunggu kelulusan bajet</h3>
          <Badge variant="warning">{tunggu.length} tiket</Badge>
        </div>
        {tunggu.length === 0 ? (
          <Kosong tajuk="Tiada tiket menunggu kelulusan" sub="Semua aduan yang disahkan PJ telah diproses." />
        ) : (
          <TableRoot>
            <Table className="border-b-0">
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Sekolah</Th>
                  <Th>Tajuk</Th>
                  <Th>Keutamaan</Th>
                  <Th>Nota PJ &amp; anggaran</Th>
                  <Th>Tindakan</Th>
                </tr>
              </thead>
              <tbody>
                {tunggu.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <Td className="font-mono text-xs whitespace-nowrap">{t.id}</Td>
                    <Td className="whitespace-nowrap">{t.sekolah}</Td>
                    <Td className="min-w-44 font-medium text-gray-900">{t.tajuk}</Td>
                    <Td><LencanaKeutamaan keutamaan={t.keutamaan} /></Td>
                    <Td className="max-w-72 min-w-44 text-[13px]">{t.notaPJ || "—"}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        <Button onClick={() => laksana(t.id, "lulus")} className="bg-violet-700 hover:bg-violet-800" aria-label={`Luluskan bajet ${t.id}`}><Check className="size-4" aria-hidden /> Luluskan bajet</Button>
                        <Button variant="secondary" onClick={() => buka(t.id)} aria-label={`Lihat ${t.id}`}><Eye className="size-4" aria-hidden /> Lihat</Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableRoot>
        )}
      </Card>

      <Card className="p-0 sm:p-0">
        <div className="space-y-3 border-b border-gray-200 px-4 py-3.5 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-gray-900">Semua aduan</h3>
            <BarEksport senarai={ditapis} keterangan={keterangan} cetak={cetak} makluman={makluman} />
          </div>
          <ul className="flex flex-wrap gap-1.5" aria-label="Bilangan aduan mengikut status">
            {STATUS.filter((s) => tiket.some((t) => t.status === s)).map((s) => (
              <li key={s}><LencanaStatus status={s}>{s} · {tiket.filter((t) => t.status === s).length}</LencanaStatus></li>
            ))}
          </ul>
          <Penapis tapisan={tapisan} ubah={setTapisan} zon={zonTersedia(tiket)} adaSekolah />
        </div>
        {tiket.length === 0 ? (
          <Kosong tajuk="Belum ada aduan direkodkan" />
        ) : ditapis.length === 0 ? (
          <Kosong tajuk="Tiada aduan sepadan dengan tapisan" sub="Ubah atau set semula tapisan." />
        ) : (
          <TableRoot>
            <Table className="border-b-0">
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Sekolah</Th>
                  <Th>Tajuk</Th>
                  <Th>Tarikh</Th>
                  <Th>Keutamaan</Th>
                  <Th>Status</Th>
                  <Th>Tindakan</Th>
                </tr>
              </thead>
              <tbody>
                {ditapis.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <Td className="font-mono text-xs whitespace-nowrap">{t.id}</Td>
                    <Td className="whitespace-nowrap">{t.sekolah}</Td>
                    <Td className="min-w-44 font-medium text-gray-900">{t.tajuk}</Td>
                    <Td className="whitespace-nowrap">{fmtTarikh(t.tarikh)}</Td>
                    <Td><LencanaKeutamaan keutamaan={t.keutamaan} /></Td>
                    <Td><LencanaStatus status={t.status} /></Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        <Button variant="secondary" onClick={() => buka(t.id)} aria-label={`Lihat ${t.id}`}><Eye className="size-4" aria-hidden /> Lihat</Button>
                        {t.status === "Lulus Bajet" && (
                          <Button onClick={() => laksana(t.id, "selesai")} className="bg-emerald-700 hover:bg-emerald-800" aria-label={`Tandakan ${t.id} selesai`}><Check className="size-4" aria-hidden /> Tandakan selesai</Button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableRoot>
        )}
        {adaTapisan && ditapis.length > 0 && <p className="border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500 sm:px-5">Memaparkan {ditapis.length} daripada {tiket.length} aduan.</p>}
      </Card>
    </div>
  );
}

/* ── Peta skematik aduan aktif (dipindahkan daripada assets/ppd-peta.js) ── */
const WARNA_TAHAP = { hijau: "#067647", kuning: "#b54708", merah: "#b42318" } as const;

function PetaAduan({ titik }: { titik: TitikPeta[] }) {
  const W = 100;
  const H = 64;
  // Dengan banyak sekolah, label bertindih: papar label pada peta hanya jika sedikit; senarai di bawah memberi butiran
  const label = titik.length <= 8;
  const TAHAP_SUSUN = { merah: 0, kuning: 1, hijau: 2 } as const;
  const susun = [...titik].sort((a, b) => TAHAP_SUSUN[a.tahap] - TAHAP_SUSUN[b.tahap] || b.saiz - a.saiz || a.nama.localeCompare(b.nama));
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Peta aduan aktif</h3>
          <p className="mt-0.5 text-xs text-gray-500">Rajah skematik Daerah Dalat · bukan mengikut skala</p>
        </div>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
          {([["hijau", "Baik"], ["kuning", "Perhatian"], ["merah", "Kritikal"]] as const).map(([k, l]) => (
            <li key={k} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: WARNA_TAHAP[k] }} aria-hidden />{l}</li>
          ))}
        </ul>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 hidden w-full sm:block" aria-hidden>
        <path d="M4 10 Q18 3 34 6 T66 5 Q86 4 96 14 L100 0 L0 0 Z" fill="#e0f2fe" />
        <path d="M4 10 Q18 3 34 6 T66 5 Q86 4 96 14 Q98 30 94 44 Q90 58 72 60 Q50 63 30 59 Q10 57 5 44 Q2 26 4 10 Z" fill="#f3f4f6" stroke="#d1d5db" strokeWidth=".4" />
        <path d="M14 6 Q20 16 30 18 Q44 20 50 28 Q56 36 66 40 Q78 44 86 56" fill="none" stroke="#7dd3fc" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M50 28 Q42 36 38 40 Q34 46 26 50" fill="none" stroke="#7dd3fc" strokeWidth=".6" strokeLinecap="round" />
        <text x="48" y="4" fontSize="2" fill="#6b7280" textAnchor="middle">Laut China Selatan</text>
        <text x="80" y="54" fontSize="2" fill="#6b7280" transform="rotate(45 80 54)">Batang Oya</text>
        {titik.map((t) => {
          const cy = (t.y * H) / 100;
          const r = 1.3 + t.saiz * 1.1;
          const kanan = t.x < 66;
          const tx = kanan ? t.x + r + 1.6 : t.x - r - 1.6;
          return (
            <g key={t.kod}>
              <title>{`${t.nama}: ${t.nilai}`}</title>
              <circle cx={t.x} cy={cy} r={r + 1.2} fill={WARNA_TAHAP[t.tahap]} opacity=".18" />
              <circle cx={t.x} cy={cy} r={r} fill={WARNA_TAHAP[t.tahap]} stroke="#fff" strokeWidth=".6" />
              {label && <text x={tx} y={cy - 0.4} textAnchor={kanan ? "start" : "end"} fontSize="2.3" fontWeight="700" fill="#111827">{t.nama}</text>}
              {label && <text x={tx} y={cy + 2.6} textAnchor={kanan ? "start" : "end"} fontSize="2" fill="#4b5563">{t.nilai}</text>}
            </g>
          );
        })}
      </svg>
      {/* Senarai ialah sumber maklumat untuk pembaca skrin dan skrin kecil */}
      <ul className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">
        {susun.map((t) => (
          <li key={t.kod} className="flex items-start gap-2 text-sm">
            <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: WARNA_TAHAP[t.tahap] }} aria-hidden />
            <span className="min-w-0">
              <b className="block font-medium text-gray-900">{t.nama}</b>
              <span className="text-xs text-gray-500">{t.nilai} · {t.sub}</span>
            </span>
          </li>
        ))}
        {titik.length === 0 && <li className="text-sm text-gray-500">Tiada sekolah dalam senarai induk.</li>}
      </ul>
      <p className="mt-3 border-t border-gray-100 pt-2.5 text-xs text-gray-500">Merah: ada aduan aktif melebihi 30 hari. Kuning: ada aduan kritikal atau melebihi 14 hari.</p>
    </Card>
  );
}
