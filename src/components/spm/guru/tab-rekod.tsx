"use client";

import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, Download, Minus, Upload, Users, X } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Badge, Button, Callout, Card, Label, Modal, ProgressBar, Select, Table, TableRoot, Td, Th } from "@/components/tremor/ui";
import type { Kelas, UjianKey } from "@/lib/portal/stor";
import { GRED_SPM, UJIAN } from "@/lib/spm/analitik";
import { cn } from "@/lib/utils";
import { BULAN_UJIAN, LABEL_STATUS, STATUS_DISIMPAN, STATUS_ISU, fmtMarkah, infoUjian, kiraIsi, labelKelas, num, padanMarkah, singkatanSubjek, statusUjian, tafsirMarkah, tafsirSasaran, trendMarkah, type BarisMarkah, type PratontonMarkah, type StatusBarisMarkah, type Tafsiran } from "@/lib/spm/guru";
import { TERIMA_FAIL, bacaJadual, muatTurunXlsx } from "./fail";
import { Kosong, LencanaGred, SepandukPeringatan, VARIAN_STATUS, type PropTabGuru } from "./kongsi";

export interface StatusSimpan {
  masa: Date | null;
  gagal: boolean;
}
type PropRekod = PropTabGuru & { kelasAktif: Kelas | null; ujianAktif: UjianKey | null; pilihKelas: (id: string) => void; pilihUjian: (u: UjianKey | null) => void; simpanan: StatusSimpan };

const JULAT_GRED = GRED_SPM.map((g, i) => ({ gred: g.gred, julat: `${g.min}–${i === 0 ? 100 : GRED_SPM[i - 1].min - 1}`, kategori: g.kategori }));
const WARNA_RUJUKAN = { Cemerlang: "success", Kepujian: "default", Lulus: "warning", Gagal: "error" } as const;

export function TabRekod(p: PropRekod) {
  const { kelas, marks, kelasAktif: k, ujianAktif, pilihKelas, pilihUjian, bukaMurid } = p;
  const idPilih = useId();
  if (kelas.length === 0) return <Kosong tajuk="Tiada kelas didaftarkan">Daftar kelas dahulu dalam tab Kelas Saya sebelum merekod markah.</Kosong>;

  return (
    <div className="space-y-5">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-end gap-3">
            {k && <span className="hidden size-10 shrink-0 place-items-center rounded-lg bg-[#13406e]/10 text-sm font-semibold text-[#13406e] sm:grid" aria-hidden>{singkatanSubjek(k.subjek)}</span>}
            <div className="min-w-0 flex-1 sm:max-w-sm">
              <Label htmlFor={idPilih}>Kelas</Label>
              <Select id={idPilih} value={k?.id ?? ""} onChange={(e) => pilihKelas(e.target.value)}>
                {!k && <option value="" disabled>Pilih kelas</option>}
                {kelas.map((x) => <option key={x.id} value={x.id}>{labelKelas(x)}{x.tahun ? ` (${x.tahun})` : ""}</option>)}
              </Select>
            </div>
          </div>
          {k && <Button variant="secondary" onClick={() => bukaMurid(k.id)}><Users className="size-4" aria-hidden /> Urus Murid ({k.pelajar.length})</Button>}
        </div>
      </Card>

      {!k ? (
        <Kosong tajuk="Pilih kelas dahulu">Pilih kelas di atas untuk mula mengisi markah.</Kosong>
      ) : (
        <>
          <SepandukPeringatan {...p} hanyaKelas={k.id} />
          <section aria-labelledby={`${idPilih}-u`}>
            <h2 id={`${idPilih}-u`} className="text-sm font-semibold text-gray-900">Pilih ujian</h2>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {UJIAN.map((u) => {
                const st = statusUjian(k, u.key, marks);
                const isi = kiraIsi(k, u.key, marks);
                const aktif = ujianAktif === u.key;
                return (
                  <button
                    key={u.key}
                    type="button"
                    aria-pressed={aktif}
                    onClick={() => pilihUjian(aktif ? null : u.key)}
                    className={cn("rounded-lg border bg-white p-4 text-left shadow-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8962a]", aktif ? "border-[#13406e] ring-2 ring-[#13406e]/20" : "border-gray-200 hover:border-gray-300")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900">{u.label}</div>
                        <div className="truncate text-xs text-gray-500">{u.penuh}</div>
                        <div className="text-xs text-gray-400">{BULAN_UJIAN[u.key]}{k.tahun ? ` ${k.tahun}` : ""}</div>
                      </div>
                      {aktif && <Badge>Sedang diisi</Badge>}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <Badge variant={VARIAN_STATUS[st]}>{LABEL_STATUS[st]}</Badge>
                      {st !== "tiada" && <span className="text-xs text-gray-500 tabular-nums">{isi.selesai}/{isi.jumlah} murid{isi.th ? ` · ${isi.th} TH` : ""}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {ujianAktif && (k.pelajar.length === 0 ? (
            <Kosong tajuk="Tiada murid dalam kelas ini" tindakan={<Button onClick={() => bukaMurid(k.id)}>Urus Murid</Button>}>Daftar murid dahulu sebelum mengisi markah.</Kosong>
          ) : (
            <IsiMarkah key={`${k.id}:${ujianAktif}`} {...p} k={k} ujian={ujianAktif} />
          ))}
        </>
      )}
    </div>
  );
}

/* ── Jadual pengisian markah ── */
function IsiMarkah({ k, ujian, marks, tulis, makluman, bukaPelajar, pilihUjian, simpanan }: PropRekod & { k: Kelas; ujian: UjianKey }) {
  const u = infoUjian(ujian);
  const isi = kiraIsi(k, ujian, marks);
  const failRef = useRef<HTMLInputElement>(null);
  const [pratonton, setPratonton] = useState<{ fail: string; hasil: PratontonMarkah } | null>(null);
  const [ralatFail, setRalatFail] = useState<{ tajuk: string; mesej: string } | null>(null);
  const bilSasaran = k.pelajar.filter((s) => num(marks[s.id]?.sasaran)).length;

  const simpanMarkah = (pid: string, nilai: number | null | undefined) =>
    tulis((_, m) => {
      const r = m[pid] ?? (m[pid] = {});
      if (nilai === undefined) delete r[ujian];
      else r[ujian] = nilai;
    });
  const simpanSasaran = (pid: string, nilai: number | undefined) =>
    tulis((_, m) => {
      const r = m[pid] ?? (m[pid] = {});
      if (nilai === undefined) delete r.sasaran;
      else r.sasaran = nilai;
    });

  const templat = async () => {
    try {
      await muatTurunXlsx(`markah_${u.label}_${k.subjek}_${k.tingkatan}${k.kelas}`, ["Nama", "Markah"], k.pelajar.map((s) => [s.nama, ""]), [46, 12]);
      makluman(`Templat ${u.label} dimuat turun. Isi lajur Markah; tulis TH bagi murid tidak hadir.`);
    } catch {
      setRalatFail({ tajuk: "Templat tidak dapat dijana", mesej: "Cuba sekali lagi." });
    }
  };

  const pilihFail = async (fail: File | undefined) => {
    if (failRef.current) failRef.current.value = "";
    if (!fail) return;
    try {
      const hasil = padanMarkah(await bacaJadual(fail), k, marks, ujian);
      if (!hasil.ok) return setRalatFail(hasil);
      setPratonton({ fail: fail.name, hasil });
    } catch (e) {
      setRalatFail({ tajuk: "Fail tidak dapat dibaca", mesej: e instanceof Error ? e.message : "Ralat tidak diketahui." });
    }
  };

  const sahFail = () => {
    if (!pratonton) return;
    const simpan = pratonton.hasil.baris.filter((b) => STATUS_DISIMPAN.includes(b.status) && b.p && b.nilai !== undefined);
    const ok = tulis((_, m) => simpan.forEach((b) => (m[b.p!.id] = { ...(m[b.p!.id] || {}), [ujian]: b.nilai })));
    if (ok) makluman(`${simpan.length} markah ${u.label} disimpan daripada fail`);
    setPratonton(null);
  };

  return (
    <section className="space-y-4" aria-label={`Pengisian markah ${u.penuh}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{u.penuh}</h2>
          <p className="text-sm text-gray-500">{labelKelas(k)} · kosong = belum diisi · TH = tidak hadir</p>
        </div>
        <Button variant="ghost" onClick={() => pilihUjian(null)}><X className="size-4" aria-hidden /> Tutup</Button>
      </div>

      <ul className="flex flex-wrap items-center gap-1.5" aria-label="Rujukan gred SPM">
        <li className="mr-1 text-xs font-medium text-gray-500">Rujukan gred:</li>
        {JULAT_GRED.map((g) => (
          <li key={g.gred}><Badge variant={WARNA_RUJUKAN[g.kategori]}>{g.gred} <span className="font-normal opacity-80">{g.julat}</span></Badge></li>
        ))}
      </ul>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-gray-900">Muat naik markah {u.label} daripada Excel</p>
            <p className="mt-0.5 text-gray-500">Fail .xlsx atau .csv dengan lajur Nama dan Markah. Tulis TH bagi murid tidak hadir. Anda akan menyemak padanan dahulu sebelum markah disimpan.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={templat}><Download className="size-4" aria-hidden /> Muat turun templat</Button>
            <Button onClick={() => failRef.current?.click()}><Upload className="size-4" aria-hidden /> Muat naik Excel</Button>
            <input ref={failRef} type="file" accept={TERIMA_FAIL} className="sr-only" tabIndex={-1} aria-label={`Fail markah ${u.label}`} onChange={(e) => pilihFail(e.target.files?.[0])} />
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <ProgressBar nilai={isi.jumlah ? (isi.selesai / isi.jumlah) * 100 : 0} tona={isi.belum ? "blue" : "emerald"} className="min-w-40 flex-1" />
        <span className="text-sm text-gray-600"><b className="font-semibold text-gray-900 tabular-nums">{isi.selesai}/{isi.jumlah}</b> diisi{isi.belum ? "" : " · lengkap"} · {bilSasaran} ada sasaran</span>
      </div>

      <Card className="p-0 sm:p-0">
        <TableRoot>
          <Table className="min-w-[560px]">
            <thead>
              <tr>
                <Th>Nama murid</Th>
                <Th className="w-28 text-center">Markah {u.label}</Th>
                <Th className="w-16 text-center">Gred</Th>
                <Th className="w-28 text-center">Sasaran SPM</Th>
                <Th className="hidden w-28 md:table-cell">Trend</Th>
                <Th className="w-20"><span className="sr-only">Tidak hadir</span></Th>
              </tr>
            </thead>
            <tbody>
              {k.pelajar.map((s, i) => {
                const m = marks[s.id];
                const v = m?.[ujian];
                const th = v === null;
                return (
                  <tr key={s.id} className={cn(th ? "bg-gray-50" : v === undefined ? "bg-amber-50/40" : "")}>
                    <Td>
                      <div className="flex items-baseline gap-2">
                        <span className="w-6 shrink-0 text-right text-xs text-gray-400 tabular-nums">{i + 1}</span>
                        <button type="button" onClick={() => bukaPelajar(s.id)} className="text-left font-medium text-[#13406e] hover:underline focus-visible:outline-2 focus-visible:outline-[#c8962a]">{s.nama}</button>
                      </div>
                    </Td>
                    <Td className="text-center">
                      <SelIsi lajur="markah" nilai={v === undefined ? "" : fmtMarkah(v)} label={`Markah ${u.label} ${s.nama}`} tafsir={tafsirMarkah} papar={(n) => (n === undefined ? "" : fmtMarkah(n))} simpan={(n) => simpanMarkah(s.id, n)} ralat={() => makluman("Markah mesti nombor 0 hingga 100, atau TH bagi tidak hadir. Tiada perubahan disimpan.")} />
                    </Td>
                    <Td className="text-center">{num(v) ? <LencanaGred markah={v} /> : <span className="text-gray-400">—</span>}</Td>
                    <Td className="text-center">
                      <SelIsi lajur="sasaran" nilai={num(m?.sasaran) ? String(m.sasaran) : ""} label={`Sasaran SPM ${s.nama}`} tafsir={tafsirSasaran} papar={(n) => (n === undefined ? "" : String(n))} simpan={(n) => simpanSasaran(s.id, n)} ralat={() => makluman("Sasaran mesti nombor 0 hingga 100. Tiada perubahan disimpan.")} />
                    </Td>
                    <Td className="hidden md:table-cell"><LencanaTrend t={trendMarkah(m, ujian)} /></Td>
                    <Td>
                      <Button variant={th ? "primary" : "secondary"} className="px-2.5 py-1 text-xs" aria-pressed={th} aria-label={`${th ? "Batal tidak hadir" : "Tanda tidak hadir"}: ${s.nama}`} onClick={() => simpanMarkah(s.id, th ? undefined : null)}>
                        {th ? "Batal TH" : "TH"}
                      </Button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableRoot>
      </Card>

      <p role="status" aria-live="polite" className={cn("flex items-center gap-1.5 text-sm", simpanan.gagal ? "text-red-700" : "text-gray-500")}>
        {simpanan.gagal ? <AlertTriangle className="size-4" aria-hidden /> : <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />}
        {simpanan.gagal ? "Gagal disimpan. Semak storan pelayar." : simpanan.masa ? `Disimpan ${simpanan.masa.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" })}` : "Setiap perubahan disimpan secara automatik."}
        <span className="text-gray-400">Tekan Enter untuk ke murid seterusnya.</span>
      </p>

      {pratonton && <PratontonFail fail={pratonton.fail} hasil={pratonton.hasil} tutup={() => setPratonton(null)} sah={sahFail} />}
      <Modal buka={!!ralatFail} tutup={() => setRalatFail(null)} tajuk={ralatFail?.tajuk ?? ""} sub={ralatFail?.mesej} lebar="max-w-md">
        <div className="flex justify-end"><Button onClick={() => setRalatFail(null)}>Baik</Button></div>
      </Modal>
    </section>
  );
}

// Sel isian: disimpan apabila fokus keluar atau Enter ditekan; nilai tidak sah tidak disimpan
function SelIsi<T>({ lajur, nilai, label, tafsir, papar, simpan, ralat }: { lajur: string; nilai: string; label: string; tafsir: (teks: string) => Tafsiran<T>; papar: (n: T) => string; simpan: (n: T) => void; ralat: () => void }) {
  const [salah, setSalah] = useState(false);
  const selesai = (el: HTMLInputElement) => {
    const t = tafsir(el.value);
    if (!t.ok) {
      setSalah(true);
      return ralat();
    }
    const teks = papar(t.nilai);
    el.value = teks;
    if (teks !== nilai) simpan(t.nilai);
  };
  const kekunci = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const semua = [...(e.currentTarget.closest("tbody")?.querySelectorAll<HTMLInputElement>(`input[data-lajur="${lajur}"]`) ?? [])];
    const berikut = semua[semua.indexOf(e.currentTarget) + 1];
    if (berikut) {
      berikut.focus();
      berikut.select();
    } else e.currentTarget.blur();
  };
  return (
    <input
      key={nilai}
      type="text"
      inputMode="numeric"
      enterKeyHint="next"
      autoComplete="off"
      maxLength={5}
      defaultValue={nilai}
      placeholder="—"
      data-lajur={lajur}
      aria-label={label}
      aria-invalid={salah}
      onChange={() => salah && setSalah(false)}
      onBlur={(e) => selesai(e.currentTarget)}
      onKeyDown={kekunci}
      className={cn("w-20 rounded-md border bg-white px-2 py-1.5 text-center text-sm font-medium text-gray-900 tabular-nums shadow-xs outline-none placeholder:text-gray-400 focus:ring-2", salah ? "border-red-500 focus:ring-red-500/20" : "border-gray-300 focus:border-[#13406e] focus:ring-[#13406e]/20")}
    />
  );
}

function LencanaTrend({ t }: { t: ReturnType<typeof trendMarkah> }) {
  if (!t) return <span className="text-gray-400">—</span>;
  const Ikon = t === "naik" ? ArrowUpRight : t === "turun" ? ArrowDownRight : Minus;
  return (
    <Badge variant={t === "naik" ? "success" : t === "turun" ? "error" : "neutral"}>
      <Ikon className="-ml-0.5 size-3.5" aria-hidden />
      {t === "naik" ? "Naik" : t === "turun" ? "Turun" : "Stabil"}
    </Badge>
  );
}

/* ── Pratonton muat naik ── */
const STATUS_BARIS: Record<StatusBarisMarkah, ["success" | "warning" | "neutral" | "error", string]> = {
  baru: ["success", "Akan diisi"],
  ubah: ["warning", "Akan diganti"],
  sama: ["neutral", "Tiada perubahan"],
  kosong: ["neutral", "Kosong · dilangkau"],
  ralat: ["error", "Markah tidak sah"],
  tiada: ["error", "Nama tidak sepadan"],
  kabur: ["error", "Nama berulang dalam kelas"],
  ulang: ["error", "Berulang dalam fail"],
};
const URUTAN: Record<StatusBarisMarkah, number> = { tiada: 0, kabur: 0, ulang: 0, ralat: 0, ubah: 1, baru: 2, kosong: 3, sama: 4 };

function PratontonFail({ fail, hasil, tutup, sah }: { fail: string; hasil: PratontonMarkah; tutup: () => void; sah: () => void }) {
  const u = infoUjian(hasil.ujian);
  const { baris, tiadaDalamFail } = hasil;
  const kira = (...st: StatusBarisMarkah[]) => baris.filter((b) => st.includes(b.status)).length;
  const disimpan = kira(...STATUS_DISIMPAN);
  const sepadan = baris.filter((b) => b.p).length;
  const takSepadan = baris.filter((b) => !b.p);
  const takSah = kira("ralat");
  const isu = kira(...STATUS_ISU);
  const susun = [...baris].sort((a, b) => URUTAN[a.status] - URUTAN[b.status] || a.no - b.no);
  const ringkas: [string, number, "success" | "warning" | "neutral" | "error"][] = [
    ["nama sepadan", sepadan, "success"],
    ["akan diisi", kira("baru"), "success"],
    ["akan diganti", kira("ubah"), "warning"],
    ["tiada perubahan", kira("sama", "kosong"), "neutral"],
    ["nama tidak sepadan", takSepadan.length, "error"],
    ["markah tidak sah", takSah, "error"],
  ];
  return (
    <Modal buka tutup={tutup} tajuk={`Semak markah ${u.label} sebelum disimpan`} sub={`${u.penuh} · ${baris.length} baris dalam "${fail}"`}>
      <div className="space-y-4">
        <ul className="flex flex-wrap gap-1.5" aria-label="Ringkasan padanan">
          {ringkas.filter(([, n]) => n > 0).map(([label, n, v]) => <li key={label}><Badge variant={v}>{n} {label}</Badge></li>)}
        </ul>

        {isu > 0 && (
          <Callout variant="error" tajuk={`${isu} baris tidak akan disimpan`} ikon={<AlertTriangle className="size-4" aria-hidden />}>
            {takSepadan.length > 0 && <p>Nama tidak sepadan dengan senarai kelas: {takSepadan.slice(0, 8).map((b) => b.nama).join(", ")}{takSepadan.length > 8 ? ` dan ${takSepadan.length - 8} lagi` : ""}.</p>}
            {takSah > 0 && <p>Markah tidak sah (mesti 0–100 atau TH): {baris.filter((b) => b.status === "ralat").slice(0, 8).map((b) => `${b.nama} (“${b.raw}”)`).join(", ")}{takSah > 8 ? ` dan ${takSah - 8} lagi` : ""}.</p>}
            <p>Betulkan dalam fail dan muat naik semula, atau isi terus dalam jadual selepas ini.</p>
          </Callout>
        )}
        {tiadaDalamFail.length > 0 && (
          <Callout variant="neutral">
            {tiadaDalamFail.length} murid tiada dalam fail (markah kekal seperti sedia ada): {tiadaDalamFail.slice(0, 6).map((s) => s.nama).join(", ")}{tiadaDalamFail.length > 6 ? ` dan ${tiadaDalamFail.length - 6} lagi` : ""}.
          </Callout>
        )}

        <TableRoot className="max-h-[45vh] rounded-md border border-gray-200">
          <Table className="min-w-[600px]">
            <thead className="sticky top-0 bg-white">
              <tr><Th className="w-14">Baris</Th><Th>Nama dalam fail</Th><Th className="text-center">Markah fail</Th><Th className="text-center">Sedia ada</Th><Th>Status</Th></tr>
            </thead>
            <tbody>
              {susun.map((b) => <BarisPratonton key={b.no} b={b} />)}
            </tbody>
          </Table>
        </TableRoot>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={tutup}>Batal</Button>
          <Button onClick={sah} disabled={!disimpan}>{disimpan ? `Simpan ${disimpan} markah ${u.label}` : "Tiada markah untuk disimpan"}</Button>
        </div>
      </div>
    </Modal>
  );
}

function BarisPratonton({ b }: { b: BarisMarkah }) {
  const [varian, label] = STATUS_BARIS[b.status];
  return (
    <tr className={b.status === "sama" || b.status === "kosong" ? "opacity-60" : ""}>
      <Td className="text-gray-400 tabular-nums">{b.no}</Td>
      <Td>
        <div className="font-medium text-gray-900">{b.nama}</div>
        {b.p && b.p.nama !== b.nama && <div className="text-xs text-gray-500">→ {b.p.nama}</div>}
      </Td>
      <Td className="text-center font-semibold text-gray-900 tabular-nums">{b.raw || "—"}</Td>
      <Td className="text-center tabular-nums">{b.p ? fmtMarkah(b.lama) : "—"}</Td>
      <Td><Badge variant={varian}>{label}</Badge></Td>
    </tr>
  );
}

