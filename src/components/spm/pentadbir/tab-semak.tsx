"use client";

import { BellRing, CalendarClock, CheckCircle2 } from "lucide-react";
import { Badge, Button, Callout, Card, Metrik, ProgressBar, TajukBahagian } from "@/components/tremor/ui";
import { UJIAN } from "@/lib/spm/analitik";
import type { KelasIsi } from "@/lib/spm/pentadbir";
import { tarikhPanjang, tarikhPendek, type PropTabSekolah } from "./kongsi";

const inisial = (nama: string) =>
  nama.split(" ").filter((w) => w && !/^(bin|binti|anak|ustaz|ustazah|en\.?|pn\.?|cik)$/i.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/* ── Semak Pengisian: kemajuan pengisian markah setiap guru + peringatan ── */
export function TabSemakPengisian({ k, data, pengguna, segar, makluman }: PropTabSekolah) {
  const { pengisian: p, pe } = k;
  const baki = p.baki;
  const hantar = (kl: KelasIsi) => {
    data.peringatan.hantar(kl.id, { id: pengguna.id, nama: pengguna.nama });
    segar();
    makluman(`Peringatan dihantar kepada ${kl.guru} (${kl.subjek} · ${kl.label})`);
  };

  return (
    <div className="space-y-5">
      <TajukBahagian tajuk="Semak pengisian data" sub={`${k.sekolah.nama} · kemajuan pengisian markah oleh guru mata pelajaran`} />

      <Callout variant={baki <= 3 ? "error" : baki <= 7 ? "warning" : "default"} tajuk={pe.label} ikon={<CalendarClock className="size-4" aria-hidden />}>
        Tarikh akhir pengisian <b>{tarikhPanjang(pe.tarikhAkhir)}</b> ({baki > 0 ? `${baki} hari lagi` : baki === 0 ? "hari ini" : `lewat ${-baki} hari`}).
      </Callout>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {UJIAN.map((u) => {
          const n = p.lengkap[u.key];
          const semua = n === p.bilKelas;
          return <Metrik key={u.key} label={`Pengisian ${u.label}${u.key === pe.key ? " (semasa)" : ""}`} nilai={`${n}/${p.bilKelas}`} tona={semua ? "baik" : "sederhana"} nota={semua ? "Semua kelas lengkap" : `${p.bilKelas - n} kelas belum lengkap`} />;
        })}
      </dl>

      <ul className="space-y-3">
        {p.guru.map((g) => (
          <li key={g.guru}>
            <Card className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#13406e]/10 text-sm font-semibold text-[#13406e]" aria-hidden>{inisial(g.guru)}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-900">{g.guru}</div>
                  <div className="text-xs text-gray-500">{g.subjek.join(", ")} · {g.kelas.length} kelas · {g.jumlah} murid</div>
                </div>
                {g.pct === 100 && <Badge variant="success"><CheckCircle2 className="size-3.5" aria-hidden /> Lengkap</Badge>}
              </div>
              <ProgressBar nilai={g.pct} tona={g.pct === 100 ? "emerald" : g.pct < 50 ? "red" : "amber"} label={`${g.pct}%`} className="mt-3" />
              <ul className="mt-3 divide-y divide-gray-100 rounded-md border border-gray-200">
                {g.kelas.map((kl) => (
                  <li key={kl.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2 text-sm">
                    <span className="min-w-0">
                      <span className="font-medium text-gray-900">{kl.label}</span>
                      {g.subjek.length > 1 && <span className="ml-1.5 text-xs text-gray-500">{kl.subjek}</span>}
                      <span className="mx-1.5 text-gray-300" aria-hidden>·</span>
                      {kl.belum ? <span className="font-medium text-amber-700">{kl.belum} daripada {kl.jumlah} belum diisi</span> : <span className="font-medium text-emerald-700">Lengkap</span>}
                    </span>
                    {kl.belum > 0 && (
                      <span className="flex flex-wrap items-center gap-2">
                        {kl.peringatan && <span className="text-xs text-gray-500">Peringatan dihantar {tarikhPendek(kl.peringatan.t)}</span>}
                        <Button variant={kl.peringatan ? "ghost" : "secondary"} className="px-2.5 py-1.5" onClick={() => hantar(kl)} aria-label={`${kl.peringatan ? "Hantar semula" : "Hantar"} peringatan kepada ${kl.guru} bagi ${kl.subjek} ${kl.label}`}>
                          <BellRing className="size-4" aria-hidden /> {kl.peringatan ? "Hantar semula" : "Hantar peringatan"}
                        </Button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500">Peringatan muncul dalam &quot;Tugasan Saya&quot; guru berkenaan di papan pemuka portal. Murid tidak hadir (TH) dikira telah diisi.</p>
    </div>
  );
}
