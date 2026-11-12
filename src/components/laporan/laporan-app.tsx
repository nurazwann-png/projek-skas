"use client";

// Laporan sedia cetak (SKPM 5.4 dan SPM) serta ukuran ketepatan Semak Pencapaian AI.
// Semua angka dikira daripada stor portal yang sama dengan aplikasi lain; tiada angka contoh.
import { Download, FileText, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Callout, Card, Metrik, TabNavigation, Table, TableRoot, TajukBahagian, Td, Th } from "@/components/tremor/ui";
import { muatStorPortal, type PPDAuthApi, type PPDDataApi, type Pengguna, type Sesi } from "@/lib/portal/stor";
import { analisisDaerah, fmtGps } from "@/lib/spm/analitik";

type SemakanAI = { keputusan?: string; kategori?: string; keyakinan?: number; diubah?: { lbl: string }[] };
type Rekod = { id?: string; program?: string; level?: string; tahap?: string; peranan?: string; tarikh?: string; status?: string; semakanAI?: SemakanAI };
type MaklumBalas = { salah?: string[] };
type DataPenuh = PPDDataApi & { skas: { all(): Record<string, Rekod[]> }; sekolahUser(u: Pengguna): { kod: string; nama: string } | null };
type AuthPenuh = PPDAuthApi & { users(): Pengguna[] };

const PERINGKAT: Record<string, string> = { INT: "Antarabangsa", NAT: "Kebangsaan", NEG: "Negeri", BAH: "Bahagian", DAE: "Daerah", SKL: "Sekolah" };
const TAHAP: Record<string, string> = { T1: "Tempat Pertama / Anugerah", T2: "Tempat Kedua", T3: "Tempat Ketiga", SH: "Saguhati", SY: "Penyertaan" };
const STATUS: Record<string, string> = { approved: "Disahkan", pending: "Menunggu pengesahan", rejected: "Ditolak" };
const TAB = [
  { id: "skpm", label: "SKPM 5.4.1 Pencapaian Guru" },
  { id: "spm", label: "SPM Daerah" },
  { id: "ai", label: "Ketepatan Semakan AI" },
] as const;
type TabId = (typeof TAB)[number]["id"];

const hariIni = () => new Date().toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" });
const tarikhFail = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};

async function excel(nama: string, helaian: string, kepala: string[], baris: (string | number | null)[][]) {
  const { default: tulisXlsx } = await import("write-excel-file/browser");
  const data = [
    kepala.map((l) => ({ type: String, value: l, fontWeight: "bold" as const })),
    ...baris.map((b) => b.map((v) => (v == null ? null : typeof v === "number" ? { type: Number, value: v } : { type: String, value: v }))),
  ];
  await tulisXlsx(data, { sheet: helaian, columns: kepala.map(() => ({ width: 22 })), stickyRowsCount: 1 }).toFile(`${nama}-${tarikhFail()}.xlsx`);
}

const CSS_CETAK = `@media print {
  @page { margin: 14mm; }
  html, body { background: #fff !important; }
  .tak-cetak { display: none !important; }
  .kawasan-cetak { font-size: 10.5pt; color: #000; }
  .kawasan-cetak table { width: 100%; border-collapse: collapse; }
  .kawasan-cetak th, .kawasan-cetak td { border: 1px solid #9ca3af; padding: 4px 6px; text-align: left; vertical-align: top; white-space: normal !important; }
  .kawasan-cetak thead { display: table-header-group; }
  .kawasan-cetak tr { break-inside: avoid; }
  .kepala-cetak { display: block !important; margin-bottom: 10px; }
}`;

type Keadaan = { status: "memuat" } | { status: "ralat"; mesej: string } | { status: "sedia"; auth: AuthPenuh; data: DataPenuh; pengguna: Pengguna; sesi: Sesi };

export function LaporanApp() {
  const [k, setK] = useState<Keadaan>({ status: "memuat" });
  const [tab, setTab] = useState<TabId>("skpm");
  const [versi, setVersi] = useState(0);

  useEffect(() => {
    let batal = false;
    muatStorPortal()
      .then(({ auth, data }) => {
        if (batal) return;
        const sesi = auth.session();
        const pengguna = sesi && auth.findById(sesi.uid);
        if (!sesi || !pengguna) return location.replace("/welcome.html");
        if (sesi.level === "pengguna") return location.replace("/ppd-dalat.html"); // laporan untuk pentadbir sekolah dan PPD
        const dariHash = TAB.find((t) => t.id === location.hash.slice(1));
        if (dariHash) setTab(dariHash.id);
        setK({ status: "sedia", auth: auth as AuthPenuh, data: data as DataPenuh, pengguna, sesi });
      })
      .catch((e: Error) => !batal && setK({ status: "ralat", mesej: e.message }));
    const segar = () => setVersi((v) => v + 1);
    window.addEventListener("storage", segar);
    return () => {
      batal = true;
      window.removeEventListener("storage", segar);
    };
  }, []);

  const sedia = k.status === "sedia";
  const daerah = sedia && (k.sesi.level === "admin" || k.sesi.level === "superadmin");
  const skop = sedia ? (daerah ? "Daerah Dalat" : k.pengguna.org) : "";

  // Rekod pencapaian guru dalam skop
  const rekod = useMemo(() => {
    void versi;
    if (k.status !== "sedia") return [];
    const pengguna = new Map(k.auth.users().map((u) => [u.id, u]));
    return Object.entries(k.data.skas.all())
      .flatMap(([uid, senarai]) => (senarai || []).map((r) => ({ r, guru: pengguna.get(uid) })))
      .filter((x) => daerah || (x.guru && x.guru.kodSekolah === k.pengguna.kodSekolah))
      .sort((a, b) => (a.guru?.org || "").localeCompare(b.guru?.org || "") || (b.r.tarikh || "").localeCompare(a.r.tarikh || ""));
  }, [k, daerah, versi]);

  const spm = useMemo(() => {
    void versi;
    if (k.status !== "sedia") return null;
    const kelas = k.data.spm.kelas().filter((x) => daerah || x.sekolah === k.pengguna.org);
    const sekolah = k.data.sekolahList().filter((s) => daerah || s.nama === k.pengguna.org);
    return analisisDaerah(kelas, k.data.spm.marks(), sekolah, k.data.PEPERIKSAAN_SEMASA);
  }, [k, daerah, versi]);

  const ai = useMemo(() => {
    const denganAI = rekod.filter((x) => x.r.semakanAI);
    const diputus = denganAI.filter((x) => x.r.status === "approved" || x.r.status === "rejected");
    // "Setuju": AI kata layak dan pentadbir mengesahkan, ATAU AI kata tidak layak/perlu semakan dan pentadbir menolak
    const setuju = diputus.filter((x) => (x.r.semakanAI!.keputusan === "layak") === (x.r.status === "approved"));
    const medan = new Map<string, number>();
    let adaUbah = 0;
    for (const x of denganAI) {
      const u = x.r.semakanAI!.diubah || [];
      if (u.length) adaUbah++;
      for (const d of u) medan.set(d.lbl, (medan.get(d.lbl) || 0) + 1);
    }
    let mb: MaklumBalas[] = [];
    try {
      mb = JSON.parse(localStorage.getItem("ppd_skas_maklumbalas_ai") || "[]");
    } catch {}
    const bahagian = new Map<string, number>();
    for (const m of mb) for (const b of m.salah || []) bahagian.set(b, (bahagian.get(b) || 0) + 1);
    return {
      jumlah: rekod.length,
      denganAI: denganAI.length,
      diputus: diputus.length,
      setuju: setuju.length,
      layakDitolak: diputus.filter((x) => x.r.semakanAI!.keputusan === "layak" && x.r.status === "rejected").length,
      raguDisahkan: diputus.filter((x) => x.r.semakanAI!.keputusan !== "layak" && x.r.status === "approved").length,
      adaUbah,
      medan: [...medan].sort((a, b) => b[1] - a[1]),
      maklumBalas: mb.length,
      bahagian: [...bahagian].sort((a, b) => b[1] - a[1]),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rekod, versi]);

  const pilih = (id: TabId) => {
    setTab(id);
    history.replaceState(null, "", id === "skpm" ? location.pathname : `#${id}`);
  };

  const kepalaSkpm = ["Sekolah", "Guru", "Program / pencapaian", "Peringkat", "Tahap", "Peranan", "Tarikh", "Status"];
  const barisSkpm = rekod.map((x) => [x.guru?.org || "", x.guru?.nama || "", x.r.program || "", PERINGKAT[x.r.level || ""] || x.r.level || "", TAHAP[x.r.tahap || ""] || x.r.tahap || "", x.r.peranan || "", x.r.tarikh || "", STATUS[x.r.status || ""] || x.r.status || ""]);
  const kepalaSpm = ["Sekolah", "GPS", "% murid lulus semua subjek", "Murid", "Murid berisiko", "% pengisian markah", "Kelas belum lengkap"];
  const barisSpm = (spm?.sekolah || []).map((s) => [s.nama, s.gps, s.lulusPct, s.bilMurid, s.berisiko, s.isiPct, s.kelasBelum.length]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" style={{ fontFamily: "var(--ppd-font, system-ui, sans-serif)" }}>
      <link rel="stylesheet" href="/assets/ppd-theme.css" precedence="default" />
      <style>{CSS_CETAK}</style>

      <div className="ppd-strip tak-cetak">
        <div className="ppd-strip-l">
          <a href="/ppd-dalat.html">
            <svg viewBox="0 0 24 24" aria-hidden><polyline points="15 18 9 12 15 6" /></svg>
            Portal PPD Dalat
          </a>
          <span className="ppd-strip-sep">|</span>
          <span className="ppd-strip-app">Laporan</span>
        </div>
        <div className="ppd-strip-r">
          <span className="ppd-flag" />
          <span>Portal rasmi KPM</span>
        </div>
      </div>

      <header className="tak-cetak sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 pt-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#13406e]/10 text-[#13406e]"><FileText className="size-5" aria-hidden /></span>
            <div className="min-w-0">
              <h1 className="truncate text-base leading-tight font-semibold text-gray-900">Laporan</h1>
              <p className="truncate text-xs text-gray-500">Sedia cetak dan muat turun · {skop}</p>
            </div>
          </div>
          {sedia && <span className="hidden text-sm text-gray-600 sm:inline">{k.pengguna.nama}</span>}
        </div>
        <div className="mx-auto mt-2 max-w-7xl px-4 sm:px-6">
          <TabNavigation tab={[...TAB]} aktif={tab} pilih={pilih} label="Jenis laporan" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {k.status === "memuat" && <div className="h-64 animate-pulse rounded-lg bg-gray-200/70" aria-busy="true" aria-label="Memuatkan data" />}
        {k.status === "ralat" && <div role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-900 ring-1 ring-red-600/20 ring-inset">Data portal tidak dapat dimuatkan ({k.mesej}).</div>}

        {sedia && tab === "skpm" && (
          <section className="kawasan-cetak space-y-4">
            <div className="kepala-cetak hidden">
              <b>Laporan Pencapaian Guru SKPM Kualiti@Sekolah 5.4.1 · {skop}</b>
              <div>Dicetak pada {hariIni()} · {rekod.length} rekod</div>
            </div>
            <div className="tak-cetak">
              <TajukBahagian
                tajuk="Pencapaian Guru (SKPM 5.4.1)"
                sub={`${rekod.length} rekod · ${rekod.filter((x) => x.r.status === "approved").length} disahkan · ${rekod.filter((x) => x.r.status === "pending").length} menunggu pengesahan`}
                kanan={
                  <div className="flex gap-2">
                    <Button variant="secondary" disabled={!rekod.length} onClick={() => excel("pencapaian-guru-skpm-5-4-1", "SKPM 5.4.1", kepalaSkpm, barisSkpm)}><Download className="size-4" aria-hidden /> Muat turun Excel</Button>
                    <Button disabled={!rekod.length} onClick={() => window.print()}><Printer className="size-4" aria-hidden /> Cetak / simpan PDF</Button>
                  </div>
                }
              />
            </div>
            {rekod.length === 0 ? (
              <Card className="p-8 text-center text-sm text-gray-500">Belum ada rekod pencapaian guru dalam skop ini.</Card>
            ) : (
              <Card className="p-0">
                <TableRoot>
                  <Table>
                    <thead><tr>{kepalaSkpm.map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
                    <tbody>
                      {rekod.map((x, i) => (
                        <tr key={(x.r.id || "") + i}>
                          <Td>{x.guru?.org}</Td>
                          <Td className="font-medium text-gray-900">{x.guru?.nama}</Td>
                          <Td className="max-w-xs whitespace-normal">{x.r.program}</Td>
                          <Td>{PERINGKAT[x.r.level || ""] || x.r.level}</Td>
                          <Td>{TAHAP[x.r.tahap || ""] || x.r.tahap}</Td>
                          <Td>{x.r.peranan}</Td>
                          <Td>{x.r.tarikh}</Td>
                          <Td><Badge variant={x.r.status === "approved" ? "success" : x.r.status === "rejected" ? "error" : "warning"}>{STATUS[x.r.status || ""] || x.r.status}</Badge></Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableRoot>
              </Card>
            )}
            <p className="tak-cetak text-xs text-gray-500">Pencapaian Sekolah (5.4.2) direkod dan dilaporkan dalam aplikasi SK@S.</p>
          </section>
        )}

        {sedia && tab === "spm" && spm && (
          <section className="kawasan-cetak space-y-4">
            <div className="kepala-cetak hidden">
              <b>Laporan Prestasi SPM · {skop} · {spm.peperiksaan.label}</b>
              <div>Dicetak pada {hariIni()} · GPS berskala 1.00 hingga 10.00, lebih rendah lebih baik</div>
            </div>
            <div className="tak-cetak">
              <TajukBahagian
                tajuk={`Prestasi SPM · ${spm.peperiksaan.label}`}
                sub="GPS dikira daripada markah terkini yang diisi guru · lebih rendah lebih baik"
                kanan={
                  <div className="flex gap-2">
                    <Button variant="secondary" disabled={!barisSpm.length} onClick={() => excel("prestasi-spm", "SPM", kepalaSpm, barisSpm)}><Download className="size-4" aria-hidden /> Muat turun Excel</Button>
                    <Button disabled={!barisSpm.length} onClick={() => window.print()}><Printer className="size-4" aria-hidden /> Cetak / simpan PDF</Button>
                  </div>
                }
              />
            </div>
            {barisSpm.length === 0 ? (
              <Card className="p-8 text-center text-sm text-gray-500">Belum ada kelas atau markah direkodkan dalam skop ini.</Card>
            ) : (
              <Card className="p-0">
                <TableRoot>
                  <Table>
                    <thead><tr>{kepalaSpm.map((h, i) => <Th key={h} className={i ? "text-right" : ""}>{h}</Th>)}</tr></thead>
                    <tbody>
                      {spm.sekolah.map((s) => (
                        <tr key={s.kod}>
                          <Td className="font-medium text-gray-900">{s.nama}</Td>
                          <Td className="text-right tabular-nums">{fmtGps(s.gps)}</Td>
                          <Td className="text-right tabular-nums">{s.lulusPct}%</Td>
                          <Td className="text-right tabular-nums">{s.bilMurid}</Td>
                          <Td className="text-right tabular-nums">{s.berisiko}</Td>
                          <Td className="text-right tabular-nums">{s.isiPct}%</Td>
                          <Td className="text-right tabular-nums">{s.kelasBelum.length}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableRoot>
              </Card>
            )}
            <p className="tak-cetak text-xs text-gray-500">Analisis penuh (jurang, subjek, headcount) ada dalam <a className="font-medium text-[#13406e] underline" href="/spm">Analitik SPM</a>. Ringkasan aduan fasiliti boleh dimuat turun dari <a className="font-medium text-[#13406e] underline" href="/e-fasiliti">e-Fasiliti</a>.</p>
          </section>
        )}

        {sedia && tab === "ai" && (
          <section className="space-y-4">
            <TajukBahagian tajuk="Ketepatan Semak Pencapaian AI" sub="Diukur daripada keputusan pentadbir sekolah terhadap rekod yang telah disemak AI" />
            <Callout tajuk="Cara ukuran ini dikira">
              AI dianggap tepat apabila keputusannya sepadan dengan keputusan manusia: AI menilai &quot;layak&quot; dan pentadbir mengesahkan, atau AI menilai &quot;tidak layak / perlu semakan&quot; dan pentadbir menolak. Rekod yang belum diputuskan tidak dikira.
            </Callout>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metrik label="Rekod disemak AI" nilai={ai.denganAI} nota={`daripada ${ai.jumlah} rekod pencapaian guru`} />
              <Metrik label="Sepadan dengan pentadbir" nilai={ai.diputus ? `${Math.round((ai.setuju / ai.diputus) * 100)}%` : "–"} nota={ai.diputus ? `${ai.setuju} daripada ${ai.diputus} rekod yang telah diputuskan` : "Belum ada rekod disemak AI yang diputuskan"} tona={ai.diputus ? (ai.setuju / ai.diputus >= 0.9 ? "baik" : ai.setuju / ai.diputus >= 0.75 ? "sederhana" : "lemah") : null} />
              <Metrik label="Medan diubah pengguna" nilai={ai.denganAI ? `${Math.round((ai.adaUbah / ai.denganAI) * 100)}%` : "–"} nota={`${ai.adaUbah} rekod: pengguna membetulkan sekurang-kurangnya satu medan yang diisi AI`} />
              <Metrik label="Laporan 'Keputusan AI salah?'" nilai={ai.maklumBalas} nota="Maklum balas pengguna semasa semakan" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <h3 className="text-sm font-semibold text-gray-900">Percanggahan dengan pentadbir</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-gray-600">AI kata layak, pentadbir menolak</dt><dd className="font-semibold tabular-nums">{ai.layakDitolak}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-gray-600">AI ragu atau kata tidak layak, pentadbir mengesahkan</dt><dd className="font-semibold tabular-nums">{ai.raguDisahkan}</dd></div>
                </dl>
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-gray-900">Medan yang paling kerap dibetulkan</h3>
                {ai.medan.length || ai.bahagian.length ? (
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {ai.medan.map(([l, n]) => <li key={"m" + l} className="flex justify-between gap-4"><span className="text-gray-600">{l} (diubah selepas diisi AI)</span><b className="tabular-nums">{n}</b></li>)}
                    {ai.bahagian.map(([l, n]) => <li key={"b" + l} className="flex justify-between gap-4"><span className="text-gray-600">{l} (dilaporkan salah)</span><b className="tabular-nums">{n}</b></li>)}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">Belum ada pembetulan atau laporan direkodkan.</p>
                )}
              </Card>
            </div>
            <p className="text-xs text-gray-500">Butiran setiap laporan pengguna ada dalam SK@S, menu Maklum Balas Semakan AI. Ukuran ini hanya meliputi Pencapaian Guru (5.4.1).</p>
          </section>
        )}
      </main>
    </div>
  );
}
