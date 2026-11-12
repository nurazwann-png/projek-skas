"use client";

// Komponen kongsi e-Fasiliti: lencana, aliran kerja, tapisan senarai, butang eksport.
import { FileSpreadsheet, Inbox, Printer, Search } from "lucide-react";
import { useId, useMemo, useState, type ReactNode } from "react";
import { Badge, Button, Input, Select } from "@/components/tremor/ui";
import { TAPISAN_KOSONG, keteranganTapisan, tapisTiket, type Tapisan } from "@/lib/efasiliti/bantu";
import { muatTurunExcel } from "@/lib/efasiliti/eksport";
import { KEUTAMAAN, STATUS, type JenisMakluman, type Tiket } from "@/lib/efasiliti/jenis";
import { cn } from "@/lib/utils";

const KELAS_STATUS: Record<string, string> = {
  Baru: "bg-blue-50 text-blue-900 ring-blue-500/30",
  "Disemak PJ": "bg-amber-50 text-amber-800 ring-amber-600/30",
  "Lulus Bajet": "bg-violet-50 text-violet-800 ring-violet-600/30",
  "Dalam Kerja": "bg-orange-50 text-orange-800 ring-orange-600/30",
  Selesai: "bg-emerald-50 text-emerald-800 ring-emerald-600/30",
  Ditolak: "bg-red-50 text-red-800 ring-red-600/20",
};
const KELAS_KEUTAMAAN: Record<string, string> = {
  Kritikal: "bg-red-50 text-red-800 ring-red-600/20",
  Tinggi: "bg-orange-50 text-orange-800 ring-orange-600/30",
  Sederhana: "bg-amber-50 text-amber-800 ring-amber-600/30",
  Rendah: "bg-emerald-50 text-emerald-800 ring-emerald-600/30",
};
// Jalur kiri kad tiket mengikut keutamaan
export const JALUR_KEUTAMAAN: Record<string, string> = {
  Kritikal: "border-l-red-600",
  Tinggi: "border-l-orange-500",
  Sederhana: "border-l-amber-500",
  Rendah: "border-l-emerald-600",
};

export function LencanaStatus({ status, children }: { status: string; children?: ReactNode }) {
  return (
    <Badge variant="neutral" className={KELAS_STATUS[status]}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children ?? status}
    </Badge>
  );
}

export function LencanaKeutamaan({ keutamaan }: { keutamaan: string }) {
  return (
    <Badge variant="neutral" className={KELAS_KEUTAMAAN[keutamaan]}>
      <span className="sr-only">Keutamaan </span>
      {keutamaan}
    </Badge>
  );
}

/* ── Aliran kerja aduan ── */
const LANGKAH = [
  { id: "sekolah", tajuk: "Sekolah", sub: "Hantar aduan kerosakan" },
  { id: "pj", tajuk: "Penolong Jurutera", sub: "Lawat tapak & sahkan" },
  { id: "ppd", tajuk: "Pengurusan PPD", sub: "Luluskan bajet" },
  { id: "selesai", tajuk: "Selesai", sub: "Kerja pembaikan siap" },
] as const;

export function AliranKerja({ aktif }: { aktif: "sekolah" | "pj" | "ppd" }) {
  return (
    <ol aria-label="Aliran kerja aduan" className="grid grid-cols-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xs lg:grid-cols-4">
      {LANGKAH.map((l, i) => {
        const saya = l.id === aktif;
        return (
          <li
            key={l.id}
            aria-current={saya ? "step" : undefined}
            className={cn(
              "flex min-w-0 items-center gap-2.5 border-gray-200 px-3 py-3 sm:px-4",
              i % 2 === 1 && "border-l",
              i >= 2 && "border-t lg:border-t-0",
              i === 2 && "lg:border-l",
              saya && "bg-[#c8962a]/10 shadow-[inset_0_-3px_0_#c8962a]",
            )}
          >
            <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border text-xs font-bold", saya ? "border-[#13406e] bg-[#13406e] text-white" : "border-gray-300 bg-gray-50 text-gray-500")}>{i + 1}</span>
            <span className="min-w-0">
              <span className="block text-[13px] leading-tight font-semibold text-gray-900">{l.tajuk}</span>
              <span className="hidden text-xs leading-snug text-gray-500 sm:block">{l.sub}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function Kosong({ tajuk, sub }: { tajuk: string; sub?: string }) {
  return (
    <div className="grid justify-items-center gap-1.5 px-4 py-10 text-center">
      <Inbox className="size-9 text-gray-300" aria-hidden />
      <p className="text-sm font-semibold text-gray-700">{tajuk}</p>
      {sub && <p className="text-sm text-gray-500">{sub}</p>}
    </div>
  );
}

/* ── Tapisan senarai ── */
export function useTapis(tiket: Tiket[]) {
  const [tapisan, setTapisan] = useState<Tapisan>(TAPISAN_KOSONG);
  const ditapis = useMemo(() => tapisTiket(tiket, tapisan), [tiket, tapisan]);
  const adaTapisan = Object.values(tapisan).some((v) => v.trim());
  return { tapisan, setTapisan, ditapis, adaTapisan, keterangan: keteranganTapisan(tapisan) };
}

export function Penapis({ tapisan, ubah, zon, adaSekolah }: { tapisan: Tapisan; ubah: (t: Tapisan) => void; zon?: string[]; adaSekolah?: boolean }) {
  const id = useId();
  const set = (k: keyof Tapisan, v: string) => ubah({ ...tapisan, [k]: v });
  const adaTapisan = Object.values(tapisan).some((v) => v.trim());
  const label = "mb-1 block text-xs font-medium text-gray-600";
  return (
    <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap">
      <div className="col-span-2 min-w-0 sm:w-64">
        <label htmlFor={`${id}-cari`} className={label}>Cari aduan</label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <Input id={`${id}-cari`} type="search" value={tapisan.cari} onChange={(e) => set("cari", e.target.value)} placeholder={adaSekolah ? "ID, tajuk atau sekolah" : "ID atau tajuk"} className="pl-8" />
        </div>
      </div>
      <div className="min-w-0 sm:w-40">
        <label htmlFor={`${id}-status`} className={label}>Status</label>
        <Select id={`${id}-status`} value={tapisan.status} onChange={(e) => set("status", e.target.value)}>
          <option value="">Semua status</option>
          {STATUS.map((s) => <option key={s}>{s}</option>)}
        </Select>
      </div>
      <div className="min-w-0 sm:w-40">
        <label htmlFor={`${id}-keutamaan`} className={label}>Keutamaan</label>
        <Select id={`${id}-keutamaan`} value={tapisan.keutamaan} onChange={(e) => set("keutamaan", e.target.value)}>
          <option value="">Semua keutamaan</option>
          {KEUTAMAAN.map((k) => <option key={k}>{k}</option>)}
        </Select>
      </div>
      {zon && (
        <div className="min-w-0 sm:w-32">
          <label htmlFor={`${id}-zon`} className={label}>Zon</label>
          <Select id={`${id}-zon`} value={tapisan.zon} onChange={(e) => set("zon", e.target.value)}>
            <option value="">Semua zon</option>
            {zon.map((z) => <option key={z}>{z}</option>)}
          </Select>
        </div>
      )}
      {adaTapisan && <Button variant="ghost" onClick={() => ubah(TAPISAN_KOSONG)}>Set semula</Button>}
    </div>
  );
}

/* ── Eksport ringkasan (Admin PPD & Pentadbir Sekolah) ── */
export function BarEksport({ senarai, keterangan, cetak, makluman }: { senarai: Tiket[]; keterangan: string; cetak: (s: Tiket[], k: string) => void; makluman: (m: string, j?: JenisMakluman) => void }) {
  const [sibuk, setSibuk] = useState(false);
  const excel = async () => {
    setSibuk(true);
    try {
      await muatTurunExcel(senarai);
      makluman(`${senarai.length} aduan dieksport ke Excel.`);
    } catch {
      makluman("Fail Excel tidak dapat dijana. Cuba sekali lagi.", "ralat");
    } finally {
      setSibuk(false);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={excel} disabled={!senarai.length || sibuk} aria-busy={sibuk}>
        <FileSpreadsheet className="size-4" aria-hidden /> {sibuk ? "Menjana…" : "Muat turun Excel"}
      </Button>
      <Button variant="secondary" onClick={() => cetak(senarai, keterangan)} disabled={!senarai.length}>
        <Printer className="size-4" aria-hidden /> Cetak ringkasan
      </Button>
    </div>
  );
}

export const zonTersedia = (tiket: Tiket[]) => [...new Set(tiket.map((t) => t.zon).filter(Boolean))].sort();
