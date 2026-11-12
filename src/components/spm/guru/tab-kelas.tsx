"use client";

import { ChevronLeft, ClipboardList, Download, Pencil, Plus, Search, Trash2, Upload, Users } from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";
import { Badge, Button, Callout, Card, Input, Label, Modal, Select, Table, TableRoot, TajukBahagian, Td, Th } from "@/components/tremor/ui";
import type { Kelas, Pelajar } from "@/lib/portal/stor";
import { UJIAN } from "@/lib/spm/analitik";
import { AGAMA_PILIHAN, SES_PILIHAN, SUBJEK_PILIHAN, besar, fmtMarkah, idBaharu, kiraIsi, labelKelas, merosot, namaJantina, namaKunci, singkatanSubjek, statusUjian, tafsirMurid, type BarisMurid } from "@/lib/spm/guru";
import { TERIMA_FAIL, bacaJadual, muatTurunXlsx } from "./fail";
import { DialogSah, Kosong, type PropTabGuru } from "./kongsi";

type PropKelas = PropTabGuru & { paparan: "kelas" | "murid"; kelasAktif: Kelas | null; kembali: () => void };

export function TabKelas(p: PropKelas) {
  return p.paparan === "murid" && p.kelasAktif ? <UrusMurid {...p} k={p.kelasAktif} /> : <SenaraiKelas {...p} />;
}

/* ── Senarai kelas ── */
function SenaraiKelas({ data, pengguna, kelas, marks, tulis, makluman, bukaRekod, bukaMurid }: PropKelas) {
  const [borang, setBorang] = useState<{ k: Kelas | null } | null>(null);
  const [padam, setPadam] = useState<Kelas | null>(null);
  const pe = data.PEPERIKSAAN_SEMASA;
  const jumlahMurid = kelas.reduce((a, k) => a + k.pelajar.length, 0);

  const simpan = (nilai: NilaiKelas) => {
    const sunting = borang?.k;
    const ok = tulis((semua) => {
      if (sunting) {
        const k = semua.find((x) => x.id === sunting.id && x.guruId === pengguna.id);
        if (k) Object.assign(k, nilai);
      } else {
        semua.push({ id: idBaharu("k"), ...nilai, sekolah: pengguna.org, ...(pengguna.kodSekolah ? { kodSekolah: pengguna.kodSekolah } : {}), guru: pengguna.nama, guruId: pengguna.id, pelajar: [] });
      }
    });
    if (ok) makluman(`${sunting ? "Kelas dikemas kini" : "Kelas baharu didaftar"}: ${nilai.subjek} · ${nilai.tingkatan} ${nilai.kelas}`);
    setBorang(null);
  };

  const sahPadam = () => {
    if (!padam) return;
    const ok = tulis((semua, m) => {
      const i = semua.findIndex((x) => x.id === padam.id && x.guruId === pengguna.id);
      if (i < 0) return;
      semua[i].pelajar.forEach((s) => delete m[s.id]);
      semua.splice(i, 1);
    });
    if (ok) makluman(`Kelas ${labelKelas(padam)} dipadam`);
    setPadam(null);
  };

  return (
    <div className="space-y-4">
      <TajukBahagian
        tajuk="Kelas Saya"
        sub={`${kelas.length} kelas · ${jumlahMurid} murid berdaftar`}
        kanan={<Button onClick={() => setBorang({ k: null })}><Plus className="size-4" aria-hidden /> Daftar Kelas</Button>}
      />

      {kelas.length === 0 ? (
        <Kosong tajuk="Tiada kelas didaftarkan">Klik &quot;Daftar Kelas&quot; untuk mendaftarkan kelas yang anda ajar. Setiap kelas mempunyai senarai murid tersendiri.</Kosong>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {kelas.map((k) => {
            const bil = k.pelajar.length;
            const berisiko = k.pelajar.filter((s) => merosot(marks[s.id])).length;
            const lengkap = UJIAN.filter((u) => statusUjian(k, u.key, marks) === "lengkap").length;
            const belum = kiraIsi(k, pe.key, marks).belum;
            return (
              <li key={k.id}>
                <Card className={`flex h-full flex-col p-4 sm:p-5 ${belum ? "border-amber-300" : ""}`}>
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#13406e]/10 text-sm font-semibold text-[#13406e]" aria-hidden>{singkatanSubjek(k.subjek)}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-gray-900">{k.subjek}</h3>
                      <p className="truncate text-xs text-gray-500">Tingkatan {k.tingkatan} {k.kelas}{k.tahun ? ` · ${k.tahun}` : ""}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" onClick={() => setBorang({ k })} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-[#c8962a]" aria-label={`Edit kelas ${labelKelas(k)}`}>
                        <Pencil className="size-4" aria-hidden />
                      </button>
                      <button type="button" onClick={() => setPadam(k)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-[#c8962a]" aria-label={`Padam kelas ${labelKelas(k)}`}>
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-gray-50 px-2 py-2">
                      <dd className="text-lg font-semibold text-gray-900 tabular-nums">{bil}</dd>
                      <dt className="text-xs text-gray-500">Murid</dt>
                    </div>
                    <div className="rounded-md bg-gray-50 px-2 py-2" title="Merosot lebih 5 markah dari AR1 ke ujian terkini">
                      <dd className={`text-lg font-semibold tabular-nums ${berisiko ? "text-red-700" : "text-emerald-700"}`}>{berisiko}</dd>
                      <dt className="text-xs text-gray-500">Berisiko</dt>
                    </div>
                    <div className="rounded-md bg-gray-50 px-2 py-2">
                      <dd className={`text-lg font-semibold tabular-nums ${belum ? "text-amber-700" : "text-gray-900"}`}>{bil ? `${lengkap}/${UJIAN.length}` : "—"}</dd>
                      <dt className="text-xs text-gray-500">Ujian lengkap</dt>
                    </div>
                  </dl>
                  {belum > 0 && <p className="mt-3 text-xs font-medium text-amber-800">{belum} markah {pe.label} belum diisi</p>}
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                    <Button variant="secondary" onClick={() => bukaMurid(k.id)}><Users className="size-4" aria-hidden /> Urus Murid</Button>
                    <Button onClick={() => bukaRekod(k.id)}><ClipboardList className="size-4" aria-hidden /> Rekod Markah</Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {borang && <BorangKelas k={borang.k} tutup={() => setBorang(null)} simpan={simpan} />}
      <DialogSah
        buka={!!padam}
        tajuk={padam ? `Padam kelas ${labelKelas(padam)}?` : ""}
        butiran={padam ? `Semua ${padam.pelajar.length} murid dan markah dalam kelas ini akan turut dipadam. Tindakan ini tidak boleh dibatalkan.` : ""}
        labelSah="Padam kelas"
        sah={sahPadam}
        tutup={() => setPadam(null)}
      />
    </div>
  );
}

type NilaiKelas = Pick<Kelas, "subjek" | "tingkatan" | "kelas" | "tahun">;

function BorangKelas({ k, tutup, simpan }: { k: Kelas | null; tutup: () => void; simpan: (n: NilaiKelas) => void }) {
  const id = useId();
  const tahunIni = new Date().getFullYear();
  const [subjek, setSubjek] = useState(k?.subjek ?? SUBJEK_PILIHAN[0]);
  const [tingkatan, setTingkatan] = useState(k?.tingkatan ?? "5");
  const [nama, setNama] = useState(k?.kelas ?? "");
  const [tahun, setTahun] = useState(k?.tahun ?? String(tahunIni));
  const [ralat, setRalat] = useState("");
  const pilihanSubjek = SUBJEK_PILIHAN.includes(subjek) ? SUBJEK_PILIHAN : [subjek, ...SUBJEK_PILIHAN];
  const pilihanTahun = [...new Set([tahun, String(tahunIni + 1), String(tahunIni), String(tahunIni - 1)])].sort().reverse();

  const hantar = (e: FormEvent) => {
    e.preventDefault();
    if (!besar(nama)) return setRalat("Sila isi nama kelas.");
    simpan({ subjek, tingkatan, kelas: besar(nama), tahun });
  };
  return (
    <Modal buka tutup={tutup} tajuk={k ? "Edit Kelas" : "Daftar Kelas Baharu"} sub="Maklumat kelas yang anda ajar" lebar="max-w-lg">
      <form onSubmit={hantar} className="space-y-4" noValidate>
        <div>
          <Label htmlFor={`${id}-s`}>Mata pelajaran</Label>
          <Select id={`${id}-s`} value={subjek} onChange={(e) => setSubjek(e.target.value)}>
            {pilihanSubjek.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor={`${id}-t`}>Tingkatan</Label>
            <Select id={`${id}-t`} value={tingkatan} onChange={(e) => setTingkatan(e.target.value)}>
              {["5", "4", "3", "2", "1"].map((t) => <option key={t}>{t}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor={`${id}-n`}>Nama kelas</Label>
            <Input id={`${id}-n`} value={nama} onChange={(e) => { setNama(e.target.value); setRalat(""); }} placeholder="cth: AMANAH" className="uppercase placeholder:normal-case" autoComplete="off" aria-invalid={!!ralat} aria-describedby={ralat ? `${id}-r` : undefined} />
          </div>
          <div>
            <Label htmlFor={`${id}-y`}>Tahun</Label>
            <Select id={`${id}-y`} value={tahun} onChange={(e) => setTahun(e.target.value)}>
              {pilihanTahun.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </div>
        </div>
        {ralat && <p id={`${id}-r`} role="alert" className="text-sm text-red-700">{ralat}</p>}
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={tutup}>Batal</Button>
          <Button type="submit">{k ? "Simpan perubahan" : "Daftar kelas"}</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Urus murid ── */
type NilaiMurid = Required<Pick<Pelajar, "nama" | "jantina" | "agama" | "penginapan" | "ses">>;

function UrusMurid({ k, pengguna, marks, tulis, makluman, kembali, bukaRekod, bukaPelajar }: PropKelas & { k: Kelas }) {
  const [borang, setBorang] = useState<{ p: Pelajar | null } | null>(null);
  const [padam, setPadam] = useState<Pelajar | null>(null);
  const [carian, setCarian] = useState("");
  const [imp, setImp] = useState<{ fail: string; baris: BarisMurid[] } | null>(null);
  const [ralatFail, setRalatFail] = useState<{ tajuk: string; mesej: string } | null>(null);
  const failRef = useRef<HTMLInputElement>(null);
  const idCari = useId();
  const q = carian.trim().toLowerCase();
  const tapis = k.pelajar.map((p, i) => ({ p, no: i + 1 })).filter((x) => !q || x.p.nama.toLowerCase().includes(q));
  const kelasSaya = (semua: Kelas[]) => semua.find((x) => x.id === k.id && x.guruId === pengguna.id);

  const simpan = (n: NilaiMurid) => {
    const sunting = borang?.p;
    if (k.pelajar.some((p) => p.id !== sunting?.id && namaKunci(p.nama) === namaKunci(n.nama))) return `${n.nama} sudah ada dalam kelas ini.`;
    const ok = tulis((semua, m) => {
      const kk = kelasSaya(semua);
      if (!kk) return;
      if (sunting) {
        const p = kk.pelajar.find((x) => x.id === sunting.id);
        if (p) Object.assign(p, n);
      } else {
        const id = idBaharu("p");
        kk.pelajar.push({ id, ...n, lokasi: "" });
        m[id] = {};
      }
    });
    if (ok) makluman(sunting ? `Maklumat ${n.nama} dikemas kini` : `${n.nama} berjaya didaftarkan`);
    setBorang(null);
    return null;
  };

  const sahPadam = () => {
    if (!padam) return;
    const ok = tulis((semua, m) => {
      const kk = kelasSaya(semua);
      if (!kk) return;
      kk.pelajar = kk.pelajar.filter((x) => x.id !== padam.id);
      delete m[padam.id];
    });
    if (ok) makluman(`Murid ${padam.nama} dipadam`);
    setPadam(null);
  };

  const pilihFail = async (fail: File | undefined) => {
    if (failRef.current) failRef.current.value = "";
    if (!fail) return;
    try {
      const hasil = tafsirMurid(await bacaJadual(fail), k);
      if (!hasil.ok) return setRalatFail(hasil);
      setImp({ fail: fail.name, baris: hasil.baris });
    } catch (e) {
      setRalatFail({ tajuk: "Fail tidak dapat dibaca", mesej: e instanceof Error ? e.message : "Ralat tidak diketahui." });
    }
  };

  const sahImport = () => {
    if (!imp) return;
    const baru = imp.baris.filter((b) => b.status === "baru");
    const ok = tulis((semua, m) => {
      const kk = kelasSaya(semua);
      if (!kk) return;
      baru.forEach((b) => {
        const id = idBaharu("p");
        kk.pelajar.push({ id, nama: besar(b.nama), jantina: b.jantina || "Lelaki", agama: b.agama, penginapan: b.penginapan || "Harian", ses: b.ses, lokasi: b.lokasi });
        m[id] = {};
      });
    });
    if (ok) makluman(`${baru.length} murid berjaya didaftarkan`);
    setImp(null);
  };

  const templat = () =>
    muatTurunXlsx("templat_daftar_murid", ["Nama", "Jantina", "Agama", "Penginapan", "SES"], [], [44, 12, 14, 14, 10]).catch(() => setRalatFail({ tajuk: "Templat tidak dapat dijana", mesej: "Cuba sekali lagi." }));

  return (
    <div className="space-y-4">
      <nav aria-label="Laluan" className="flex flex-wrap items-center gap-2 text-sm">
        <button type="button" onClick={kembali} className="inline-flex items-center gap-1 rounded-md font-medium text-[#13406e] hover:underline focus-visible:outline-2 focus-visible:outline-[#c8962a]">
          <ChevronLeft className="size-4" aria-hidden /> Kelas Saya
        </button>
        <span className="text-gray-400" aria-hidden>›</span>
        <span className="font-medium text-gray-900">{labelKelas(k)}</span>
      </nav>

      <TajukBahagian
        tajuk={`Senarai murid (${k.pelajar.length})`}
        sub="Daftar murid dalam kelas ini. Markah diisi dalam tab Rekod Markah."
        kanan={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => bukaRekod(k.id)}><ClipboardList className="size-4" aria-hidden /> Rekod Markah</Button>
            <Button onClick={() => setBorang({ p: null })}><Plus className="size-4" aria-hidden /> Tambah Murid</Button>
          </div>
        }
      />

      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-gray-900">Daftar murid daripada fail Excel atau CSV</p>
            <p className="mt-0.5 text-gray-500">Lajur: Nama, Jantina (L/P), Agama, Penginapan (Asrama/Harian), SES (B40/M40/T20). Senarai disemak dahulu sebelum didaftarkan.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={templat}><Download className="size-4" aria-hidden /> Muat turun templat</Button>
            <Button variant="secondary" onClick={() => failRef.current?.click()}><Upload className="size-4" aria-hidden /> Pilih fail</Button>
            <input ref={failRef} type="file" accept={TERIMA_FAIL} className="sr-only" tabIndex={-1} aria-label="Fail senarai murid" onChange={(e) => pilihFail(e.target.files?.[0])} />
          </div>
        </div>
      </Card>

      {k.pelajar.length === 0 ? (
        <Kosong tajuk="Tiada murid">Daftar murid daripada fail atau tambah seorang demi seorang.</Kosong>
      ) : (
        <>
          <div className="relative">
            <label htmlFor={idCari} className="sr-only">Cari nama murid</label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
            <Input id={idCari} type="search" value={carian} onChange={(e) => setCarian(e.target.value)} placeholder="Cari nama murid" className="pl-9" />
          </div>
          <Card className="p-0 sm:p-0">
            <TableRoot>
              <Table className="min-w-[760px]">
                <thead>
                  <tr>
                    <Th className="w-12">No.</Th>
                    <Th>Nama murid</Th>
                    <Th>Jantina</Th>
                    <Th>Agama</Th>
                    <Th>Penginapan</Th>
                    <Th>SES</Th>
                    {UJIAN.map((u) => <Th key={u.key} className="text-center">{u.label}</Th>)}
                    <Th><span className="sr-only">Tindakan</span></Th>
                  </tr>
                </thead>
                <tbody>
                  {tapis.map(({ p, no }) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <Td className="text-gray-400 tabular-nums">{String(no).padStart(2, "0")}</Td>
                      <Td>
                        <button type="button" onClick={() => bukaPelajar(p.id)} className="text-left font-medium text-[#13406e] hover:underline focus-visible:outline-2 focus-visible:outline-[#c8962a]">{p.nama}</button>
                      </Td>
                      <Td>{namaJantina(p.jantina) || "—"}</Td>
                      <Td>{p.agama || "—"}</Td>
                      <Td>{p.penginapan || "—"}</Td>
                      <Td>{p.ses || "—"}</Td>
                      {UJIAN.map((u) => <Td key={u.key} className="text-center tabular-nums">{fmtMarkah(marks[p.id]?.[u.key])}</Td>)}
                      <Td>
                        <div className="flex justify-end gap-1.5">
                          <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => setBorang({ p })} aria-label={`Edit ${p.nama}`}>Edit</Button>
                          <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => setPadam(p)} aria-label={`Padam ${p.nama}`}>Padam</Button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                  {tapis.length === 0 && (
                    <tr><Td colSpan={6 + UJIAN.length + 1} className="py-6 text-center text-gray-500">Tiada murid sepadan dengan &quot;{carian}&quot;.</Td></tr>
                  )}
                </tbody>
              </Table>
            </TableRoot>
          </Card>
        </>
      )}

      {borang && <BorangMurid p={borang.p} tutup={() => setBorang(null)} simpan={simpan} />}
      <DialogSah buka={!!padam} tajuk={padam ? `Padam ${padam.nama}?` : ""} butiran="Murid ini dan semua markahnya akan dibuang daripada kelas. Tindakan ini tidak boleh dibatalkan." labelSah="Padam murid" sah={sahPadam} tutup={() => setPadam(null)} />
      {imp && <PratontonMurid fail={imp.fail} baris={imp.baris} tutup={() => setImp(null)} sah={sahImport} />}
      <Modal buka={!!ralatFail} tutup={() => setRalatFail(null)} tajuk={ralatFail?.tajuk ?? ""} sub={ralatFail?.mesej} lebar="max-w-md">
        <div className="flex justify-end"><Button onClick={() => setRalatFail(null)}>Baik</Button></div>
      </Modal>
    </div>
  );
}

function BorangMurid({ p, tutup, simpan }: { p: Pelajar | null; tutup: () => void; simpan: (n: NilaiMurid) => string | null }) {
  const id = useId();
  const [nama, setNama] = useState(p?.nama ?? "");
  const [jantina, setJantina] = useState(namaJantina(p?.jantina) || "Lelaki");
  const [agama, setAgama] = useState(p?.agama || "Islam");
  const [penginapan, setPenginapan] = useState(p?.penginapan || "Harian");
  const [ses, setSes] = useState(p?.ses || "B40");
  const [ralat, setRalat] = useState("");
  const pilihanAgama = AGAMA_PILIHAN.includes(agama) ? AGAMA_PILIHAN : [agama, ...AGAMA_PILIHAN];

  const hantar = (e: FormEvent) => {
    e.preventDefault();
    if (!besar(nama)) return setRalat("Sila isi nama penuh murid.");
    const r = simpan({ nama: besar(nama), jantina, agama, penginapan, ses });
    if (r) setRalat(r);
  };
  return (
    <Modal buka tutup={tutup} tajuk={p ? "Edit Maklumat Murid" : "Tambah Murid"} sub={p ? p.nama : "Daftar seorang murid ke dalam kelas ini"} lebar="max-w-lg">
      <form onSubmit={hantar} className="space-y-4" noValidate>
        <div>
          <Label htmlFor={`${id}-n`}>Nama penuh murid</Label>
          <Input id={`${id}-n`} value={nama} onChange={(e) => { setNama(e.target.value); setRalat(""); }} placeholder="Seperti dalam kad pengenalan" className="uppercase placeholder:normal-case" autoComplete="off" aria-invalid={!!ralat} aria-describedby={ralat ? `${id}-r` : undefined} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`${id}-j`}>Jantina</Label>
            <Select id={`${id}-j`} value={jantina} onChange={(e) => setJantina(e.target.value)}>
              <option>Lelaki</option>
              <option>Perempuan</option>
            </Select>
          </div>
          <div>
            <Label htmlFor={`${id}-a`}>Agama</Label>
            <Select id={`${id}-a`} value={agama} onChange={(e) => setAgama(e.target.value)}>
              {pilihanAgama.map((a) => <option key={a}>{a}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor={`${id}-p`}>Jenis penginapan</Label>
            <Select id={`${id}-p`} value={penginapan} onChange={(e) => setPenginapan(e.target.value)}>
              <option>Harian</option>
              <option>Asrama</option>
            </Select>
          </div>
          <div>
            <Label htmlFor={`${id}-e`}>SES</Label>
            <Select id={`${id}-e`} value={ses} onChange={(e) => setSes(e.target.value)}>
              {SES_PILIHAN.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </div>
        </div>
        {ralat && <p id={`${id}-r`} role="alert" className="text-sm text-red-700">{ralat}</p>}
        <p className="text-xs text-gray-500">Markah diisi atau dibetulkan dalam tab Rekod Markah mengikut ujian.</p>
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={tutup}>Batal</Button>
          <Button type="submit">{p ? "Simpan perubahan" : "Tambah murid"}</Button>
        </div>
      </form>
    </Modal>
  );
}

const STATUS_MURID = { baru: ["success", "Baharu"], ada: ["neutral", "Sudah berdaftar"], ganda: ["warning", "Berulang dalam fail"] } as const;

function PratontonMurid({ fail, baris, tutup, sah }: { fail: string; baris: BarisMurid[]; tutup: () => void; sah: () => void }) {
  const baru = baris.filter((b) => b.status === "baru");
  const kurang = baru.filter((b) => b.kurang.length).length;
  const langkau = baris.length - baru.length;
  return (
    <Modal buka tutup={tutup} tajuk="Semak senarai murid" sub={`${baris.length} nama dikesan dalam "${fail}"`}>
      <div className="space-y-4">
        {(langkau > 0 || kurang > 0) && (
          <Callout variant="warning">
            {langkau > 0 && <p>{langkau} nama dilangkau kerana sudah berdaftar dalam kelas atau berulang dalam fail.</p>}
            {kurang > 0 && <p>{kurang} murid tiada sebahagian maklumat (ditanda —). Boleh dilengkapkan kemudian melalui Edit.</p>}
          </Callout>
        )}
        <TableRoot className="max-h-[50vh] rounded-md border border-gray-200">
          <Table className="min-w-[620px]">
            <thead className="sticky top-0 bg-white">
              <tr><Th>No.</Th><Th>Nama murid</Th><Th>Jantina</Th><Th>Agama</Th><Th>Penginapan</Th><Th>SES</Th><Th>Status</Th></tr>
            </thead>
            <tbody>
              {baris.map((b, i) => (
                <tr key={i} className={b.status === "baru" ? "" : "opacity-60"}>
                  <Td className="text-gray-400 tabular-nums">{i + 1}</Td>
                  <Td className="font-medium text-gray-900">{b.nama}</Td>
                  <Td>{b.jantina || "—"}</Td>
                  <Td>{b.agama || "—"}</Td>
                  <Td>{b.penginapan || "—"}</Td>
                  <Td>{b.ses || "—"}</Td>
                  <Td><Badge variant={STATUS_MURID[b.status][0]}>{STATUS_MURID[b.status][1]}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableRoot>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={tutup}>Batal</Button>
          <Button onClick={sah} disabled={!baru.length}>{baru.length ? `Daftar ${baru.length} murid` : "Tiada murid baharu"}</Button>
        </div>
      </div>
    </Modal>
  );
}
