"use client";

import { BarChart3, ClipboardList, Download, FileText, Printer, TriangleAlert, Upload } from "lucide-react";
import { useState } from "react";
import { Button, Card, Modal, Table, TableRoot, TajukBahagian, Td, Th } from "@/components/tremor/ui";
import { SENARAI_LAPORAN, binaLaporan, laporanKeCsv, laporanKeHtml, type JenisLaporan, type Laporan } from "@/lib/spm/pentadbir";
import { cn } from "@/lib/utils";
import { tarikhPanjang, type PropTabSekolah } from "./kongsi";

const IKON: Record<JenisLaporan, typeof FileText> = { gps: BarChart3, panitia: ClipboardList, berisiko: TriangleAlert, pengisian: Upload };

// Cetak melalui iframe tersembunyi (tiada tetingkap pop-up); pengguna boleh pilih "Simpan sebagai PDF"
function cetak(html: string) {
  const f = document.createElement("iframe");
  f.setAttribute("aria-hidden", "true");
  f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  f.onload = () => {
    f.contentWindow?.focus();
    f.contentWindow?.print();
    setTimeout(() => f.remove(), 60_000);
  };
  f.srcdoc = html;
  document.body.appendChild(f);
}

function muatTurunCsv(nama: string, csv: string) {
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nama;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ── Laporan sekolah ── */
export function TabLaporanSekolah({ k, makluman }: PropTabSekolah) {
  const [buka, setBuka] = useState<{ jenis: JenisLaporan; tarikh: string } | null>(null);
  const laporan = buka ? binaLaporan(buka.jenis, k) : null;
  const tarikh = buka?.tarikh ?? "";

  return (
    <div className="space-y-5">
      <TajukBahagian tajuk="Jana laporan" sub={`${k.sekolah.nama} · laporan dijana daripada markah yang diisi guru`} />
      <ul className="grid gap-3 md:grid-cols-2">
        {SENARAI_LAPORAN.map((l) => {
          const Ikon = IKON[l.jenis];
          return (
            <li key={l.jenis}>
              <Card className="flex h-full flex-wrap items-center gap-3 p-4 sm:p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#13406e]/10 text-[#13406e]"><Ikon className="size-5" aria-hidden /></span>
                <div className="min-w-0 flex-1 basis-40">
                  <h3 className="text-sm font-semibold text-gray-900">{l.tajuk}</h3>
                  <p className="mt-0.5 text-sm text-gray-500">{l.sub}</p>
                </div>
                <Button variant="secondary" onClick={() => setBuka({ jenis: l.jenis, tarikh: tarikhPanjang(Date.now()) })} aria-label={`Jana ${l.tajuk}`}>Jana laporan</Button>
              </Card>
            </li>
          );
        })}
      </ul>

      {laporan && (
        <Modal buka tutup={() => setBuka(null)} tajuk={laporan.tajuk} sub={`${laporan.sub} · ${tarikh}`} lebar="max-w-5xl">
          <PratontonLaporan l={laporan} />
          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-4">
            <Button
              variant="secondary"
              disabled={!laporan.baris.length}
              onClick={() => {
                muatTurunCsv(`${laporan.tajuk} - ${k.sekolah.nama}.csv`.replace(/\s+/g, "_"), laporanKeCsv(laporan));
                makluman("Fail CSV dimuat turun");
              }}
            >
              <Download className="size-4" aria-hidden /> Muat turun CSV
            </Button>
            <Button onClick={() => cetak(laporanKeHtml(laporan, tarikh))}><Printer className="size-4" aria-hidden /> Cetak / simpan PDF</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PratontonLaporan({ l }: { l: Laporan }) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {l.kpi.map((x) => (
          <div key={x.label} className="rounded-md border border-gray-200 px-3 py-2.5">
            <dt className="text-xs font-medium text-gray-500">{x.label}</dt>
            <dd className="mt-0.5 text-xl font-semibold text-gray-900 tabular-nums">{x.nilai}</dd>
            <div className="text-xs text-gray-500">{x.nota}</div>
          </div>
        ))}
      </dl>
      {l.baris.length === 0 ? (
        <p className="rounded-md bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">{l.kosong}</p>
      ) : (
        <TableRoot className="rounded-md border border-gray-200">
          <Table className="border-b-0">
            <thead>
              <tr>{l.lajur.map((c) => <Th key={c.tajuk} className={cn("px-3 py-2", c.kanan && "text-right")}>{c.tajuk}</Th>)}</tr>
            </thead>
            <tbody>
              {l.baris.map((b, i) => (
                <tr key={i}>
                  {b.map((v, j) => <Td key={j} className={cn("px-3 py-2", l.lajur[j]?.kanan ? "text-right whitespace-nowrap tabular-nums" : j === 0 || typeof v === "number" ? "whitespace-nowrap" : "")}>{v}</Td>)}
                </tr>
              ))}
            </tbody>
          </Table>
        </TableRoot>
      )}
      <p className="text-xs text-gray-500">{l.nota}</p>
    </div>
  );
}
