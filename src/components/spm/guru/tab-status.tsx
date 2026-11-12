"use client";

import { Check, CalendarClock, Minus, MoreHorizontal } from "lucide-react";
import { Badge, Button, Callout, Card, TajukBahagian } from "@/components/tremor/ui";
import { UJIAN } from "@/lib/spm/analitik";
import { LABEL_STATUS, infoUjian, kiraIsi, statusUjian, type StatusUjian } from "@/lib/spm/guru";
import { tarikhMs } from "../kongsi";
import { Kosong, type PropTabGuru } from "./kongsi";

const TITIK: Record<StatusUjian, string> = {
  lengkap: "bg-emerald-100 text-emerald-700 ring-emerald-600/30",
  separa: "bg-amber-100 text-amber-700 ring-amber-600/30",
  belum: "bg-gray-100 text-gray-400 ring-gray-500/20",
  tiada: "bg-gray-100 text-gray-400 ring-gray-500/20",
};

export function TabStatus({ data, kelas, marks, bukaRekod }: PropTabGuru) {
  if (kelas.length === 0) return <Kosong tajuk="Tiada kelas berdaftar">Daftar kelas dahulu untuk melihat status pengisian.</Kosong>;
  const pe = data.PEPERIKSAAN_SEMASA;
  const baki = -data.hari(pe.tarikhAkhir);
  const labelPe = infoUjian(pe.key).label;
  return (
    <div className="space-y-4">
      <TajukBahagian tajuk="Status Pengisian" sub="Status rekod markah mengikut kelas dan ujian" />
      <Callout variant={baki <= 3 ? "error" : baki <= 7 ? "warning" : "default"} ikon={<CalendarClock className="size-4" aria-hidden />} tajuk={`${pe.label} dibuka untuk pengisian`}>
        Tarikh akhir {tarikhMs(pe.tarikhAkhir)} ({baki > 0 ? `${baki} hari lagi` : baki === 0 ? "hari ini" : `lewat ${-baki} hari`}).
      </Callout>
      <ul className="space-y-3">
        {kelas.map((k) => {
          const st = UJIAN.map((u) => statusUjian(k, u.key, marks));
          const semua = st.every((s) => s === "lengkap");
          const belum = kiraIsi(k, pe.key, marks).belum;
          return (
            <li key={k.id}>
              <Card className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-4 sm:p-5">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">{k.subjek} · Tingkatan {k.tingkatan} {k.kelas}</h3>
                  <p className="text-xs text-gray-500">
                    {k.pelajar.length} murid{k.tahun ? ` · ${k.tahun}` : ""}
                    {belum > 0 && <b className="font-semibold text-amber-800"> · {belum} markah {labelPe} belum diisi</b>}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <ul className="flex items-center gap-3">
                    {UJIAN.map((u, i) => {
                      const Ikon = st[i] === "lengkap" ? Check : st[i] === "separa" ? MoreHorizontal : Minus;
                      return (
                        <li key={u.key} className="flex items-center gap-1.5 text-xs text-gray-500" title={`${u.penuh}: ${LABEL_STATUS[st[i]]}`}>
                          {u.label}
                          <span className={`grid size-6 place-items-center rounded-full ring-1 ring-inset ${TITIK[st[i]]}`}>
                            <Ikon className="size-3.5" aria-hidden />
                            <span className="sr-only">{LABEL_STATUS[st[i]]}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {semua ? <Badge variant="success">Lengkap</Badge> : <Button variant="secondary" onClick={() => bukaRekod(k.id, pe.key)}>Isi sekarang</Button>}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
