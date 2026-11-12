"use client";

import { BellRing } from "lucide-react";
import type { ReactNode } from "react";
import { Badge, Button, Callout, Modal } from "@/components/tremor/ui";
import type { Kelas, Marks, PPDDataApi, Pengguna, UjianKey } from "@/lib/portal/stor";
import { gredBagi, infoUjian, kiraIsi, labelKelas, type Cadangan, type StatusUjian, type TahapCadangan } from "@/lib/spm/guru";
import { tarikhMs } from "../kongsi";

export interface PropTabGuru {
  data: PPDDataApi;
  pengguna: Pengguna;
  kelas: Kelas[]; // kelas milik guru ini sahaja
  marks: Marks;
  // Ubah salinan stor terkini lalu simpan; pulangkan false jika gagal disimpan
  tulis: (ubah: (kelas: Kelas[], marks: Marks) => void) => boolean;
  makluman: (teks: string) => void;
  bukaRekod: (kelasId: string, ujian?: UjianKey) => void;
  bukaMurid: (kelasId: string) => void;
  bukaPelajar: (pelajarId: string) => void;
}

const VARIAN_GRED = { Cemerlang: "success", Kepujian: "default", Lulus: "warning", Gagal: "error" } as const;
export function LencanaGred({ markah }: { markah: number }) {
  const g = gredBagi(markah);
  return <Badge variant={VARIAN_GRED[g.kategori]} title={g.kategori}>{g.gred}</Badge>;
}

export const VARIAN_STATUS: Record<StatusUjian, "neutral" | "warning" | "success"> = { tiada: "neutral", belum: "neutral", separa: "warning", lengkap: "success" };

export function Kosong({ tajuk, children, tindakan }: { tajuk: string; children?: ReactNode; tindakan?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
      <p className="text-sm font-semibold text-gray-900">{tajuk}</p>
      {children && <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{children}</p>}
      {tindakan && <div className="mt-4 flex justify-center">{tindakan}</div>}
    </div>
  );
}

export function DialogSah({ buka, tajuk, butiran, labelSah, sah, tutup }: { buka: boolean; tajuk: string; butiran: string; labelSah: string; sah: () => void; tutup: () => void }) {
  return (
    <Modal buka={buka} tutup={tutup} tajuk={tajuk} sub={butiran} lebar="max-w-md">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={tutup}>Batal</Button>
        <Button variant="danger" onClick={sah}>{labelSah}</Button>
      </div>
    </Modal>
  );
}

const TITIK: Record<TahapCadangan, string> = { baik: "bg-emerald-500", amaran: "bg-amber-500", kritikal: "bg-red-500", info: "bg-gray-400" };
const LABEL_TAHAP: Record<TahapCadangan, string> = { baik: "Baik", amaran: "Perhatian", kritikal: "Kritikal", info: "Makluman" };
export function SenaraiCadangan({ cadangan }: { cadangan: Cadangan[] }) {
  return (
    <ul className="space-y-2.5">
      {cadangan.map((c, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-700">
          <span className={`mt-1.5 size-2 shrink-0 rounded-full ${TITIK[c.tahap]}`} aria-hidden />
          <span><span className="sr-only">{LABEL_TAHAP[c.tahap]}: </span>{c.teks}</span>
        </li>
      ))}
    </ul>
  );
}

// Peringatan daripada pentadbir sekolah bagi kelas yang masih belum lengkap untuk peperiksaan semasa
export function SepandukPeringatan({ data, kelas, marks, bukaRekod, hanyaKelas }: Pick<PropTabGuru, "data" | "kelas" | "marks" | "bukaRekod"> & { hanyaKelas?: string }) {
  const pe = data.PEPERIKSAAN_SEMASA;
  const senarai = kelas
    .filter((k) => !hanyaKelas || k.id === hanyaKelas)
    .map((k) => ({ k, ing: data.peringatan.untukKelas(k.id), belum: kiraIsi(k, pe.key, marks).belum }))
    .filter((x) => x.ing && x.belum > 0);
  if (!senarai.length) return null;
  return (
    <div className="space-y-2" role="status">
      {senarai.map(({ k, ing, belum }) => (
        <Callout key={k.id} variant="warning" ikon={<BellRing className="size-4" aria-hidden />} tajuk={`Peringatan daripada ${ing!.dariNama}: lengkapkan markah ${pe.label}`}>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <span>{labelKelas(k)} — {belum} daripada {k.pelajar.length} murid belum diisi markah {infoUjian(pe.key).label}. Dihantar {tarikhMs(ing!.t)}; tarikh akhir {tarikhMs(pe.tarikhAkhir)}.</span>
            {!hanyaKelas && <Button variant="secondary" onClick={() => bukaRekod(k.id, pe.key)}>Isi sekarang</Button>}
          </div>
        </Callout>
      ))}
    </div>
  );
}
