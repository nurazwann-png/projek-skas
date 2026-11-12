"use client";

// Butiran tiket: fakta, gambar, nota PJ, garis masa. Mod "semak" (Admin PPD, papan PJ) menambah borang sah/tolak.
import { Banknote, Check, ChevronLeft, ChevronRight, Clock, Plus, Search, TriangleAlert, Wrench, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button, Label, Modal, Textarea } from "@/components/tremor/ui";
import { fmtTarikh, gambarTiket } from "@/lib/efasiliti/bantu";
import type { EntriGarisMasa, ModDialog, Tiket, TindakanTiket } from "@/lib/efasiliti/jenis";
import { cn } from "@/lib/utils";
import { LencanaKeutamaan, LencanaStatus } from "./kongsi";

const IKON_STATUS: Record<string, typeof Clock> = { Baru: Plus, "Disemak PJ": Search, "Lulus Bajet": Banknote, "Dalam Kerja": Wrench, Selesai: Check, Ditolak: X };
const TITIK_STATUS: Record<string, string> = {
  Baru: "border-blue-600 bg-blue-50 text-blue-700",
  "Disemak PJ": "border-amber-600 bg-amber-50 text-amber-700",
  "Lulus Bajet": "border-violet-600 bg-violet-50 text-violet-700",
  "Dalam Kerja": "border-orange-600 bg-orange-50 text-orange-700",
  Selesai: "border-emerald-600 bg-emerald-50 text-emerald-700",
  Ditolak: "border-red-600 bg-red-50 text-red-700",
};

export function DialogTiket({ tiket: t, mod, bolehSemak, tutup, laksana }: { tiket: Tiket | null; mod: ModDialog; bolehSemak: boolean; tutup: () => void; laksana: (id: string, tindakan: TindakanTiket, nota?: string) => boolean }) {
  if (!t) return null;
  const semak = mod === "semak" && bolehSemak && t.status === "Baru";
  return (
    <Modal buka tutup={tutup} tajuk={t.tajuk} sub={`${t.id} · ${t.sekolah}`} lebar="max-w-2xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <LencanaKeutamaan keutamaan={t.keutamaan} />
          <LencanaStatus status={t.status} />
        </div>

        <dl className="grid grid-cols-2 overflow-hidden rounded-md border border-gray-200 sm:grid-cols-4">
          {[
            ["Sekolah", t.sekolah],
            ["Zon", t.zon],
            ["Kategori", t.kategori],
            ["Tarikh aduan", fmtTarikh(t.tarikh)],
          ].map(([k, v], i) => (
            <div key={k} className={cn("min-w-0 border-gray-200 px-3 py-2.5", i % 2 === 1 && "border-l", i >= 2 && "border-t sm:border-t-0", i === 2 && "sm:border-l")}>
              <dt className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">{k}</dt>
              <dd className="text-sm font-medium break-words text-gray-900">{v}</dd>
            </div>
          ))}
        </dl>

        <Kotak tajuk="Butiran kerosakan">{t.butiran}</Kotak>

        <Gambar senarai={gambarTiket(t)} tajuk={t.tajuk} />

        {semak ? (
          <BorangSemak key={t.id} tiket={t} laksana={laksana} tutup={tutup} />
        ) : (
          t.notaPJ && <Kotak tajuk="Nota siasatan Penolong Jurutera" amaran>{t.notaPJ}</Kotak>
        )}

        <section>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Garis masa tiket</h3>
          <GarisMasa entri={t.timeline || []} />
        </section>
      </div>
    </Modal>
  );
}

function Kotak({ tajuk, amaran, children }: { tajuk: string; amaran?: boolean; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-md border px-3.5 py-3", amaran ? "border-amber-600/30 bg-amber-50" : "border-gray-200 bg-gray-50")}>
      <h3 className={cn("mb-1 text-[11px] font-semibold tracking-wide uppercase", amaran ? "text-amber-800" : "text-gray-500")}>{tajuk}</h3>
      <p className="text-sm leading-relaxed break-words whitespace-pre-line text-gray-900">{children}</p>
    </section>
  );
}

/* ── Gambar: lakaran kecil, klik untuk paparan besar ── */
function Gambar({ senarai, tajuk }: { senarai: string[]; tajuk: string }) {
  const [pilih, setPilih] = useState<number | null>(null);
  if (!senarai.length) return null;
  const n = senarai.length;
  const i = pilih == null ? null : Math.min(pilih, n - 1);
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-gray-900">Gambar kerosakan <span className="font-normal text-gray-500">({n})</span></h3>
      <ul className="grid grid-cols-3 gap-2 sm:max-w-md">
        {senarai.map((src, k) => (
          <li key={k}>
            <button type="button" onClick={() => setPilih(k)} className="block w-full overflow-hidden rounded-md border border-gray-200 bg-gray-100 transition hover:border-[#13406e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8962a]" aria-label={`Besarkan gambar ${k + 1} daripada ${n}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Gambar ${k + 1}: ${tajuk}`} className="aspect-square w-full object-cover" />
            </button>
          </li>
        ))}
      </ul>
      {i != null && (
        <Modal buka tutup={() => setPilih(null)} tajuk={`Gambar ${i + 1} daripada ${n}`} sub={tajuk} lebar="max-w-5xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={senarai[i]} alt={`Gambar ${i + 1}: ${tajuk}`} className="mx-auto max-h-[70vh] w-auto max-w-full rounded-md object-contain" />
          {n > 1 && (
            <div className="mt-3 flex justify-center gap-2">
              <Button variant="secondary" onClick={() => setPilih((i - 1 + n) % n)}><ChevronLeft className="size-4" aria-hidden /> Sebelum</Button>
              <Button variant="secondary" onClick={() => setPilih((i + 1) % n)}>Seterusnya <ChevronRight className="size-4" aria-hidden /></Button>
            </div>
          )}
        </Modal>
      )}
    </section>
  );
}

/* ── Semakan Penolong Jurutera ── */
function BorangSemak({ tiket: t, laksana, tutup }: { tiket: Tiket; laksana: (id: string, tindakan: TindakanTiket, nota?: string) => boolean; tutup: () => void }) {
  const id = useId();
  const [nota, setNota] = useState(t.notaPJ || "");
  const [ralat, setRalat] = useState(false);
  const [sahkanTolak, setSahkanTolak] = useState(false);
  const medan = useRef<HTMLTextAreaElement>(null);
  const batal = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (sahkanTolak) batal.current?.focus();
  }, [sahkanTolak]);

  const sah = () => {
    if (!nota.trim()) {
      setRalat(true);
      medan.current?.focus();
      return;
    }
    if (laksana(t.id, "sah", nota.trim())) tutup();
  };
  const tolak = () => {
    if (laksana(t.id, "tolak", nota.trim())) tutup();
  };

  return (
    <section className="space-y-3 rounded-lg border border-[#13406e]/25 bg-[#13406e]/5 p-3.5" aria-label="Semakan Penolong Jurutera">
      <div>
        <Label htmlFor={`${id}-nota`}>Nota siasatan teknikal &amp; anggaran kos <span className="text-red-700" aria-hidden>*</span></Label>
        <Textarea
          ref={medan}
          id={`${id}-nota`}
          rows={3}
          value={nota}
          onChange={(e) => {
            setNota(e.target.value);
            setRalat(false);
          }}
          placeholder="Contoh: Paip PVC 4 inci perlu diganti. Anggaran kos RM 850. Kerja boleh siap dalam 2 hari."
          aria-invalid={ralat}
          aria-describedby={`${id}-bantu`}
          className={cn(ralat && "border-red-600 focus:border-red-600 focus:ring-red-600/20")}
        />
        <p id={`${id}-bantu`} className={cn("mt-1 text-xs", ralat ? "font-medium text-red-700" : "text-gray-500")}>
          {ralat ? "Sila masukkan nota siasatan teknikal sebelum mengesahkan aduan." : "Wajib untuk pengesahan. Untuk penolakan, nyatakan sebab di sini."}
        </p>
      </div>

      {sahkanTolak ? (
        <div role="alertdialog" aria-labelledby={`${id}-st`} aria-describedby={`${id}-sd`} className="rounded-md bg-red-50 p-3 ring-1 ring-red-600/20 ring-inset">
          <p id={`${id}-st`} className="flex items-center gap-2 text-sm font-semibold text-red-900"><TriangleAlert className="size-4 shrink-0" aria-hidden /> Tolak aduan {t.id}?</p>
          <p id={`${id}-sd`} className="mt-1 text-sm text-red-900">
            Aduan akan ditutup dengan status Ditolak dan tidak boleh dibuka semula. {nota.trim() ? "Sebab di atas akan direkodkan dalam garis masa." : "Tiada sebab dinyatakan; sekolah tidak akan tahu mengapa aduan ditolak."}
          </p>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <Button ref={batal} variant="secondary" onClick={() => setSahkanTolak(false)}>Batal</Button>
            <Button onClick={tolak} className="bg-red-700 hover:bg-red-800"><X className="size-4" aria-hidden /> Ya, tolak aduan</Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button onClick={sah} className="min-h-11 bg-emerald-700 hover:bg-emerald-800"><Check className="size-4" aria-hidden /> Sah &amp; sokong pembaikan</Button>
          <Button variant="danger" onClick={() => setSahkanTolak(true)} className="min-h-11"><X className="size-4" aria-hidden /> Tolak aduan</Button>
        </div>
      )}
    </section>
  );
}

/* ── Garis masa ── */
function GarisMasa({ entri }: { entri: EntriGarisMasa[] }) {
  if (!entri.length) return <p className="text-sm text-gray-500">Tiada rekod.</p>;
  return (
    <ol>
      {entri.map((e, i) => {
        const Ikon = IKON_STATUS[e.status] ?? Clock;
        const akhir = i === entri.length - 1;
        return (
          <li key={i} className={cn("relative grid grid-cols-[28px_minmax(0,1fr)] gap-3", !akhir && "pb-4")}>
            {!akhir && <span className="absolute top-7 bottom-0 left-[13px] w-0.5 bg-gray-200" aria-hidden />}
            <span className={cn("grid size-7 place-items-center rounded-full border-2", TITIK_STATUS[e.status] ?? "border-gray-500 bg-gray-50 text-gray-600")}><Ikon className="size-3.5" strokeWidth={3} aria-hidden /></span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <LencanaStatus status={e.status} />
                <span className="text-xs text-gray-500 tabular-nums">{e.tarikh}</span>
              </div>
              <p className="mt-1 text-sm break-words text-gray-900">{e.tindakan}</p>
              <p className="text-xs text-gray-500">oleh {e.oleh}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
